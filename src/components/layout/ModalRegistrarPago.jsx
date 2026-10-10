import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Calendar,
  Loader2,
  AlertCircle,
  Banknote,
} from "lucide-react";
import DatePicker from "react-datepicker";
import { es } from "date-fns/locale";
import "react-datepicker/dist/react-datepicker.css";
import { pagoService } from "../../services/pagoService";
import { reciboService } from "../../services/reciboService";
import { estacionamientoService } from "../../services/estacionamientoService";
import { metodoDePagoService } from "../../services/metodoDePagoService";

/** @typedef {import("../../types").MetodoDePago} MetodoDePago */
/** @typedef {import("../../types").PagoSugerido} PagoSugerido */
import { abonoIdOf, labelCocheras, labelPatentes } from "../../utils/abonoHelpers";
import { imprimirReciboPdf } from "../../utils/imprimirRecibo";
import Checkbox from "./Check";
import FilterSelect from "./FilterSelect";

const formatCurrency = (val) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(Number(val) || 0);

function parsePeriodoDate(value) {
  if (!value) return new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  if (value instanceof Date) return new Date(value.getFullYear(), value.getMonth(), value.getDate());
  const solo = String(value).split("T")[0];
  const [y, m, d] = solo.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

function buildDateString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function sameDay(a, b) {
  if (!a || !b) return false;
  return String(a).split("T")[0] === String(b).split("T")[0];
}

function cuotaKey(c) {
  return `${c?.cuotaId ?? "p"}-${String(c?.periodoInicio ?? "").split("T")[0]}`;
}

/**
 * Panel lateral de cobro.
 * - Una cuota: `cuota`
 * - Varias cuotas del mismo abono: `cuotas` (array)
 */
export default function ModalRegistrarPago({
  abono,
  cuota = null,
  cuotas = null,
  cuotasPendientes = [],
  cargo = null,
  sena = null,
  deudas = null,
  onClose,
  onRegistrado,
}) {
  const abonoId = abonoIdOf(abono);
  const clienteNombre = sena?.clienteNombre || abono?.cliente?.nombre || abono?.clienteNombre || "Cliente";
  const clienteTelefono = abono?.cliente?.telefono || abono?.telefono || null;
  const clienteEmail =
    abono?.email || abono?.cliente?.email || abono?.clienteEmail || null;
  const cocheras = sena?.cocherasLabel || labelCocheras(abono);
  const patentes = sena?.patentesLabel || labelPatentes(abono);
  const precioAbono = abono?.precioAcordado;

  const listaFija = useMemo(() => {
    if (Array.isArray(cuotas) && cuotas.length > 0) return cuotas;
    if (cuota) return [cuota];
    return null;
  }, [cuotas, cuota]);

  const otrasPendientes = useMemo(() => {
    const clavesFijas = new Set((listaFija || []).map(cuotaKey));
    return (cuotasPendientes || []).filter((c) => !clavesFijas.has(cuotaKey(c)));
  }, [cuotasPendientes, listaFija]);

  const esMulti = (listaFija?.length ?? 0) > 1;
  const esConjunto = Array.isArray(deudas) && deudas.length > 0;
  const periodoFijo = Boolean(listaFija?.length);
  const cuotaUnica = !esMulti && listaFija?.[0] ? listaFija[0] : null;

  const [mes, setMes] = useState(() => {
    if (listaFija?.[0]?.periodoInicio) return parsePeriodoDate(listaFija[0].periodoInicio);
    const primera = cuotasPendientes[0];
    if (primera?.periodoInicio) return parsePeriodoDate(primera.periodoInicio);
    return new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  });

  const [monto, setMonto] = useState(
    sena?.importe != null
      ? String(sena.importe)
      : cargo?.importe != null
      ? String(cargo.importe)
      : cuotaUnica?.saldo != null
        ? String(cuotaUnica.saldo)
        : ""
  );
  const [montosPorCuota, setMontosPorCuota] = useState(() => {
    if (!listaFija) return {};
    return Object.fromEntries(listaFija.map((c) => [cuotaKey(c), String(c.saldo ?? 0)]));
  });
  const [recargo, setRecargo] = useState("");
  const [observacion, setObservacion] = useState("");
  const [metodos, setMetodos] = useState(/** @type {MetodoDePago[]} */ ([]));
  const [metodoDePagoId, setMetodoDePagoId] = useState(null);
  const [sugerido, setSugerido] = useState(/** @type {PagoSugerido | null} */ (null));
  const [loadingSugerido, setLoadingSugerido] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);
  const [periodoBloqueado, setPeriodoBloqueado] = useState(false);
  const [elegidas, setElegidas] = useState(() => new Set((deudas || []).map((d) => d.key)));

  useEffect(() => {
    metodoDePagoService
      .getAll(false)
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setMetodos(list);
        const efectivo = list.find((m) => String(m.nombre).toLowerCase() === "efectivo");
        setMetodoDePagoId(efectivo?.metodoDePagoId ?? list[0]?.metodoDePagoId ?? null);
      })
      .catch(() => setMetodos([]));
  }, []);

  useEffect(() => {
    if (!listaFija?.length) return;
    setMontosPorCuota(Object.fromEntries(listaFija.map((c) => [cuotaKey(c), String(c.saldo ?? 0)])));
    if (!esMulti && listaFija[0]?.saldo != null) setMonto(String(listaFija[0].saldo));
  }, [listaFija, esMulti]);

  const cuotaDelPeriodo = useMemo(() => {
    if (cuotaUnica) return cuotaUnica;
    if (esMulti) return null;
    const key = buildDateString(mes);
    return (
      cuotasPendientes.find((c) => sameDay(c.periodoInicio, key)) ||
      cuotasPendientes.find((c) => {
        const d = parsePeriodoDate(c.periodoInicio);
        return d.getFullYear() === mes.getFullYear() && d.getMonth() === mes.getMonth();
      }) ||
      null
    );
  }, [cuotaUnica, esMulti, cuotasPendientes, mes]);

  const lineasMulti = useMemo(() => {
    if (!esMulti || !listaFija) return [];
    return listaFija.map((c) => {
      const key = cuotaKey(c);
      const saldo = Number(c.saldo) || 0;
      const raw = montosPorCuota[key];
      const n = parseFloat(raw);
      const montoLinea = !isNaN(n) && n > 0 ? n : 0;
      return {
        cuota: c,
        key,
        saldo,
        monto: montoLinea,
        pendiente: Math.max(0, Math.round((saldo - montoLinea) * 100) / 100),
        excede: montoLinea > saldo + 0.009,
      };
    });
  }, [esMulti, listaFija, montosPorCuota]);

  const saldoMaximo = useMemo(() => {
    if (esMulti) return lineasMulti.reduce((acc, l) => acc + l.saldo, 0);
    if (cuotaDelPeriodo?.saldo != null) return Number(cuotaDelPeriodo.saldo);
    if (sugerido?.monto != null) return Number(sugerido.monto);
    return null;
  }, [esMulti, lineasMulti, cuotaDelPeriodo, sugerido]);

  const periodoLabel = esMulti
    ? `${listaFija.length} períodos`
    : cuotaUnica?.periodoLabel || cuotaDelPeriodo?.periodoLabel || null;

  const montoNumerico = useMemo(() => {
    if (esConjunto) {
      return deudas
        .filter((d) => elegidas.has(d.key))
        .reduce((acc, d) => acc + Number(d.saldo || 0), 0);
    }
    if (esMulti) return lineasMulti.reduce((acc, l) => acc + l.monto, 0);
    const m = parseFloat(monto);
    return !isNaN(m) && m > 0 ? m : 0;
  }, [esConjunto, deudas, elegidas, esMulti, lineasMulti, monto]);

  const recargoNumerico = useMemo(() => {
    if (recargo === "" || recargo == null) return 0;
    const r = parseFloat(recargo);
    return !isNaN(r) && r > 0 ? r : 0;
  }, [recargo]);

  const totalCobro = montoNumerico + recargoNumerico;

  const pendienteTrasPago = useMemo(() => {
    if (esMulti) {
      const resto = lineasMulti.reduce((acc, l) => acc + l.pendiente, 0);
      return Math.round(resto * 100) / 100;
    }
    if (saldoMaximo == null) return null;
    return Math.round(Math.max(0, saldoMaximo - montoNumerico) * 100) / 100;
  }, [esMulti, lineasMulti, saldoMaximo, montoNumerico]);

  const esPagoParcial =
    saldoMaximo != null && montoNumerico > 0 && pendienteTrasPago != null && pendienteTrasPago > 0.009;

  const excedeSaldo = cargo || sena
    ? false
    : esMulti
    ? lineasMulti.some((l) => l.excede)
    : saldoMaximo != null && montoNumerico > saldoMaximo + 0.009;

  function setMontoAcotado(raw) {
    if (raw === "" || raw == null) {
      setMonto("");
      return;
    }
    const n = parseFloat(raw);
    if (isNaN(n)) {
      setMonto(raw);
      return;
    }
    if (saldoMaximo != null && n > saldoMaximo) {
      setMonto(String(saldoMaximo));
      setError(`No podés pagar más que el saldo de la cuota (${formatCurrency(saldoMaximo)}).`);
      return;
    }
    if (error && error.includes("más que el saldo")) setError(null);
    setMonto(raw);
  }

  function setMontoLinea(c, raw) {
    const key = cuotaKey(c);
    const saldo = Number(c.saldo) || 0;
    if (raw === "" || raw == null) {
      setMontosPorCuota((prev) => ({ ...prev, [key]: "" }));
      return;
    }
    const n = parseFloat(raw);
    if (isNaN(n)) {
      setMontosPorCuota((prev) => ({ ...prev, [key]: raw }));
      return;
    }
    if (n > saldo) {
      setMontosPorCuota((prev) => ({ ...prev, [key]: String(saldo) }));
      setError(`No podés pagar más que el saldo de ${c.periodoLabel || "la cuota"} (${formatCurrency(saldo)}).`);
      return;
    }
    if (error && error.includes("más que el saldo")) setError(null);
    setMontosPorCuota((prev) => ({ ...prev, [key]: raw }));
  }

  useEffect(() => {
    if (!abonoId || sena) return;

    if (esConjunto) {
      setPeriodoBloqueado(false);
      setError(null);
      setSugerido(null);
      return;
    }

    if (cargo) {
      setPeriodoBloqueado(false);
      setError(null);
      setMonto(String(cargo.importe));
      setSugerido(null);
      return;
    }

    if (esMulti && listaFija?.length) {
      const invalida = listaFija.some((c) => Number(c.saldo) <= 0);
      if (invalida) {
        setPeriodoBloqueado(true);
        setError("Alguna de las cuotas seleccionadas ya está pagada.");
        return;
      }
      setPeriodoBloqueado(false);
      setError(null);
      setSugerido(null);
      return;
    }

    if (periodoFijo && cuotaUnica?.saldo != null) {
      const saldo = Number(cuotaUnica.saldo);
      if (saldo <= 0) {
        setPeriodoBloqueado(true);
        setError("Esta cuota ya está pagada. No se puede registrar otro pago.");
        setSugerido(null);
        setMonto("");
        return;
      }
      setPeriodoBloqueado(false);
      setError(null);
      setMonto(String(saldo));
      setSugerido({
        monto: saldo,
        recargo: 0,
        aplicaProporcional: false,
        periodoInicio: cuotaUnica.periodoInicio,
        periodoFin: cuotaUnica.periodoFin,
      });
      return;
    }

    if (cuotasPendientes.length > 0 && !cuotaDelPeriodo) {
      setPeriodoBloqueado(true);
      setSugerido(null);
      setMonto("");
      setRecargo("");
      setError("Ese período ya está pagado o no tiene saldo pendiente.");
      return;
    }

    if (cuotaDelPeriodo) {
      const saldo = Number(cuotaDelPeriodo.saldo);
      if (saldo <= 0) {
        setPeriodoBloqueado(true);
        setError("Esta cuota ya está pagada. No se puede registrar otro pago.");
        setSugerido(null);
        setMonto("");
        return;
      }
      setPeriodoBloqueado(false);
      setError(null);
      setMonto(String(saldo));
      setSugerido({
        monto: saldo,
        recargo: 0,
        aplicaProporcional: false,
        periodoInicio: cuotaDelPeriodo.periodoInicio,
        periodoFin: cuotaDelPeriodo.periodoFin,
      });
    }

    const fetchSugerido = async () => {
      setLoadingSugerido(true);
      try {
        const res = await pagoService.getSugerido(abonoId, buildDateString(mes));
        setPeriodoBloqueado(false);
        setError(null);
        setSugerido(res);
        const tope = cuotaDelPeriodo?.saldo != null ? Number(cuotaDelPeriodo.saldo) : Number(res.monto);
        setMonto(String(Math.min(Number(res.monto), tope)));
        setRecargo("");
      } catch (err) {
        const data = err.response?.data;
        const msg =
          typeof data === "string"
            ? data
            : data?.title || data?.message || err.message || "No se puede pagar este período";
        setPeriodoBloqueado(true);
        setSugerido(null);
        setMonto("");
        setRecargo("");
        setError(msg);
      } finally {
        setLoadingSugerido(false);
      }
    };

    fetchSugerido();
  }, [mes, abonoId, periodoFijo, cuotaUnica, cuotaDelPeriodo, cuotasPendientes.length, esMulti, listaFija, cargo, esConjunto]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setEnviando(true);
    setError(null);

    try {
      if (periodoBloqueado) {
        throw new Error("No se puede registrar un pago sobre una cuota ya pagada.");
      }

      if (!metodoDePagoId) {
        throw new Error("Seleccioná un método de pago.");
      }

      if (montoNumerico <= 0) {
        throw new Error("El monto debe ser mayor a cero");
      }

      if (excedeSaldo) {
        throw new Error("El monto no puede superar el saldo pendiente de alguna cuota.");
      }

      if (!abonoId && !sena) throw new Error("Abono inválido");

      if (sena) {
        const registrado = await pagoService.pagarSena({
          senaId: sena.senaId,
          metodoDePagoId: Number(metodoDePagoId),
          recargo: recargoNumerico > 0 ? recargoNumerico : null,
          observacion: observacion?.trim() || null,
        });
        try {
          const datos = await estacionamientoService.get();
          if (datos?.imprimirReciboAlCobrar !== false && registrado?.reciboId) {
            const recibo = await reciboService.getById(registrado.reciboId);
            await imprimirReciboPdf(recibo);
          }
        } catch {
          /* el cobro ya quedó */
        }
        onRegistrado();
        onClose();
        return;
      }

      let detalles;
      if (esConjunto) {
        const marcadas = deudas.filter((d) => elegidas.has(d.key));
        if (marcadas.length === 0) {
          throw new Error("Marcá al menos una deuda.");
        }
        detalles = marcadas.map((d) => {
          if (d.tipo === "cargo") {
            return { cargoId: d.cargo.cargoId, monto: Number(d.saldo) };
          }
          const cuotaRef = d.cuota;
          return {
            monto: Number(d.saldo),
            ...(cuotaRef?.cuotaId
              ? { cuotaId: cuotaRef.cuotaId }
              : { periodoInicio: String(cuotaRef.periodoInicio).split("T")[0] }),
          };
        });
      } else if (cargo) {
        detalles = [{ cargoId: cargo.cargoId, monto: Number(cargo.importe) }];
      } else if (esMulti) {
        if (lineasMulti.some((l) => l.monto <= 0)) {
          throw new Error("Cada cuota seleccionada debe tener un monto mayor a cero.");
        }
        detalles = lineasMulti.map((l) => ({
          monto: l.monto,
          ...(l.cuota.cuotaId
            ? { cuotaId: l.cuota.cuotaId }
            : { periodoInicio: String(l.cuota.periodoInicio).split("T")[0] }),
        }));
      } else {
        const cuotaRef = cuotaUnica || cuotaDelPeriodo;
        const periodoInicio = cuotaRef?.periodoInicio
          ? String(cuotaRef.periodoInicio).split("T")[0]
          : buildDateString(mes);
        detalles = [
          {
            monto: montoNumerico,
            ...(cuotaRef?.cuotaId ? { cuotaId: cuotaRef.cuotaId } : { periodoInicio }),
          },
        ];
      }

      const payload = {
        abonoId: Number(abonoId),
        detalles,
        recargo: recargoNumerico > 0 ? recargoNumerico : null,
        observacion: observacion?.trim() || null,
        mercadoPagoId: null,
        metodoDePagoId: Number(metodoDePagoId),
      };

      const registrado = await pagoService.registrar(payload);

      try {
        const datos = await estacionamientoService.get();
        if (datos?.imprimirReciboAlCobrar !== false) {
          let recibo = null;
          if (registrado?.reciboId) {
            recibo = await reciboService.getById(registrado.reciboId);
          } else if (registrado?.pagoId) {
            recibo = await reciboService.getByPago(registrado.pagoId);
          }
          if (recibo) {
            imprimirReciboPdf(recibo, {
              nombreEstacionamiento: datos.nombre,
              direccion: datos.direccion,
            });
          }
        }
      } catch {
        // El pago ya se registró; no bloqueamos por fallo de impresión
      }

      onRegistrado();
      onClose();
    } catch (err) {
      const data = err.response?.data;
      const msg =
        typeof data === "string"
          ? data
          : data?.title || data?.message || data?.error || err.message || "No se pudo registrar el pago";
      setError(msg);
    } finally {
      setEnviando(false);
    }
  };

  const confirmarDeshabilitado =
    enviando ||
    loadingSugerido ||
    periodoBloqueado ||
    !metodoDePagoId ||
    metodos.length === 0 ||
    montoNumerico <= 0 ||
    excedeSaldo;

  useEffect(() => {
    const html = document.documentElement;
    const prevHtml = html.style.overflow;
    const prevBody = document.body.style.overflow;
    html.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    return () => {
      html.style.overflow = prevHtml;
      document.body.style.overflow = prevBody;
    };
  }, []);

  return createPortal(
    <div className="fixed inset-0 z-[100] h-dvh overflow-hidden overscroll-none flex justify-end">
      <button
        type="button"
        aria-label="Cerrar"
        className="absolute inset-0 bg-ink/45 backdrop-blur-[2px]"
        onClick={onClose}
      />

      <aside className="relative h-dvh max-h-dvh w-full max-w-md sm:max-w-lg bg-surface-card shadow-pk-modal border-l border-line-subtle flex flex-col overflow-hidden overscroll-none">
        <div className="shrink-0 bg-brand px-4 py-2.5 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wide text-white/70">
              {esConjunto
                ? "Pagar deuda"
                : sena
                ? "Cobrar seña"
                : cargo
                ? "Registrar pago"
                : esMulti
                  ? `Pagar ${listaFija.length} cuotas`
                  : cuotaUnica?.esFuturo
                    ? "Adelantar cuota"
                    : "Pagar cuota"}
            </p>
            <p className="text-sm font-bold text-brand-foreground truncate">{clienteNombre}</p>
            <p className="text-[11px] text-white/75 truncate">
              Cochera {cocheras}
              {patentes ? ` · ${patentes}` : ""}
              {periodoLabel && !esConjunto ? ` · ${periodoLabel}` : ""}
              {esConjunto
                ? ` · ${deudas.filter((d) => elegidas.has(d.key)).length} de ${deudas.length}`
                : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 bg-white/10 hover:bg-white/20 shrink-0"
          >
            <X size={16} className="text-brand-foreground" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <p className="shrink-0 px-4 pt-2 text-[11px] text-ink-muted truncate">
            {[
              precioAbono != null && precioAbono !== "" ? `Precio ${formatCurrency(precioAbono)}` : null,
              abono?.cobrador ? `Cobrador ${abono.cobrador}` : null,
              clienteTelefono,
              clienteEmail,
            ]
              .filter(Boolean)
              .join(" · ") || "\u00a0"}
          </p>
          <div className="shrink-0 max-h-[42%] overflow-y-auto px-4 py-2 space-y-2">
            {esConjunto ? (
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-wide text-ink-faint">
                  Deudas · se cobran completas
                </p>
                {deudas.map((d) => {
                  const marcada = elegidas.has(d.key);
                  return (
                    <label
                      key={d.key}
                      className={`flex items-center gap-2 border px-2 py-1 cursor-pointer ${
                        marcada ? "border-brand bg-brand-muted" : "border-line bg-surface-muted"
                      }`}
                    >
                      <Checkbox
                        checked={marcada}
                        onChange={() =>
                          setElegidas((prev) => {
                            const next = new Set(prev);
                            if (next.has(d.key)) next.delete(d.key);
                            else next.add(d.key);
                            return next;
                          })
                        }
                      />
                      <span className="text-[10px] font-bold uppercase text-ink-faint w-11 shrink-0">
                        {d.tipo === "cargo" ? "Cargo" : "Cuota"}
                      </span>
                      <span className="min-w-0 flex-1 text-xs font-semibold text-ink capitalize truncate">{d.label}</span>
                      <span className="text-xs font-bold tabular-nums shrink-0">{formatCurrency(d.saldo)}</span>
                    </label>
                  );
                })}
              </div>
            ) : esMulti ? (
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-ink-faint">Cuotas</p>
                  <button
                    type="button"
                    onClick={() =>
                      setMontosPorCuota(
                        Object.fromEntries(listaFija.map((c) => [cuotaKey(c), String(c.saldo ?? 0)]))
                      )
                    }
                    className="text-[11px] font-semibold text-brand"
                  >
                    Saldo completo
                  </button>
                </div>
                {lineasMulti.map((l) => (
                  <div key={l.key} className="grid grid-cols-[1fr_7rem] gap-2 items-center">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-ink capitalize truncate">{l.cuota.periodoLabel}</p>
                      <p className="text-[11px] text-ink-faint">
                        Saldo {formatCurrency(l.saldo)}
                        {l.pendiente > 0.009 && l.monto > 0 ? ` · queda ${formatCurrency(l.pendiente)}` : ""}
                      </p>
                    </div>
                    <input
                      type="number"
                      min="0.01"
                      max={l.saldo}
                      step="0.01"
                      value={montosPorCuota[l.key] ?? ""}
                      onChange={(e) => setMontoLinea(l.cuota, e.target.value)}
                      className="w-full bg-surface-muted border border-line-strong px-2 py-1 text-sm text-ink outline-none focus:border-brand tabular-nums"
                    />
                  </div>
                ))}
              </div>
            ) : sena ? (
              <div className="flex items-center gap-2 w-full bg-surface-muted px-3 py-1.5 border border-line">
                <span className="text-sm font-semibold text-ink">Seña · {formatCurrency(sena.importe)}</span>
              </div>
            ) : (
              <div className="space-y-1.5">
                <label className="pk-label">Período a abonar</label>
                {periodoFijo ? (
                  <div className="flex items-center gap-2 w-full bg-surface-muted px-3 py-1.5 border border-line">
                    <Calendar size={13} className="text-brand shrink-0" />
                    <span className="text-sm font-semibold text-ink capitalize truncate">
                      {cuotaUnica?.periodoLabel || buildDateString(mes)}
                    </span>
                  </div>
                ) : (
                  <div className="relative">
                    <DatePicker
                      selected={mes}
                      onChange={(d) => setMes(new Date(d.getFullYear(), d.getMonth(), d.getDate() || 1))}
                      dateFormat="MMMM yyyy"
                      showMonthYearPicker
                      locale={es}
                      className="w-full bg-surface-muted border border-line-strong pl-3 pr-9 py-2 text-sm text-ink focus:border-brand focus:bg-surface-card outline-none capitalize"
                    />
                    <Calendar
                      size={14}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-faint pointer-events-none"
                    />
                  </div>
                )}
              </div>
            )}
            {otrasPendientes.length > 0 && !esConjunto && (
              <p className="text-[11px] text-ink-muted">
                Otras cuotas con saldo: {otrasPendientes.length}
                {" · "}
                {formatCurrency(otrasPendientes.reduce((acc, c) => acc + Number(c.saldo || 0), 0))}
              </p>
            )}
            {cuotaUnica?.esFuturo && !periodoBloqueado && (
              <p className="text-[11px] text-ink-muted">
                El período todavía no empezó. Podés adelantar el total o una parte.
              </p>
            )}
          </div>

          <div className="shrink-0 px-4 pb-2 space-y-2">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wide text-ink-faint">Forma de pago</label>
              {metodos.length === 0 ? (
                <p className="pk-desc text-warning-ink bg-warning-muted border border-line rounded-xl px-3 py-2">
                  No hay métodos activos. Configuralos en Datos del estacionamiento.
                </p>
              ) : (
                <FilterSelect
                  className="w-full"
                  ariaLabel="Forma de pago"
                  disabled={periodoBloqueado}
                  value={metodoDePagoId ?? ""}
                  onChange={(v) => setMetodoDePagoId(Number(v))}
                  options={metodos.map((m) => ({ value: m.metodoDePagoId, label: m.nombre }))}
                />
              )}
            </div>

            {!esMulti && !esConjunto && (
              <div className="grid grid-cols-2 gap-2">
                <label className="block">
                  <span className="text-[10px] font-bold uppercase tracking-wide text-ink-faint">Monto</span>
                  <input
                    type="number"
                    required
                    min="0.01"
                    max={saldoMaximo ?? undefined}
                    step="0.01"
                    disabled={periodoBloqueado || !!cargo || !!sena}
                    readOnly={!!cargo || !!sena}
                    value={monto}
                    onChange={(e) => setMontoAcotado(e.target.value)}
                    className="mt-0.5 w-full bg-surface-muted border border-line-strong px-2 py-1.5 text-sm text-ink outline-none focus:border-brand disabled:opacity-50 tabular-nums"
                  />
                  {saldoMaximo != null && (
                    <button
                      type="button"
                      disabled={periodoBloqueado}
                      onClick={() => setMontoAcotado(String(saldoMaximo))}
                      className="text-[11px] font-semibold text-brand disabled:opacity-40"
                    >
                      Saldo completo
                    </button>
                  )}
                </label>
                <label className="block">
                  <span className="text-[10px] font-bold uppercase tracking-wide text-ink-faint">Recargo</span>
                  <input
                    type="number"
                    value={recargo}
                    disabled={periodoBloqueado}
                    onChange={(e) => setRecargo(e.target.value)}
                    placeholder="0"
                    min="0"
                    step="0.01"
                    className="mt-0.5 w-full bg-surface-muted border border-line-strong px-2 py-1.5 text-sm text-ink outline-none focus:border-brand disabled:opacity-50 tabular-nums"
                  />
                </label>
              </div>
            )}

            {(esMulti || esConjunto) && (
              <label className="block">
                <span className="text-[10px] font-bold uppercase tracking-wide text-ink-faint">Recargo único</span>
                <input
                  type="number"
                  value={recargo}
                  disabled={periodoBloqueado}
                  onChange={(e) => setRecargo(e.target.value)}
                  placeholder="0"
                  min="0"
                  step="0.01"
                  className="mt-0.5 w-full bg-surface-muted border border-line-strong px-2 py-1.5 text-sm text-ink outline-none focus:border-brand disabled:opacity-50 tabular-nums"
                />
              </label>
            )}

            {esPagoParcial && !periodoBloqueado && (
              <p className="text-[11px] text-warning-ink bg-warning-muted border border-warning/30 px-2 py-1">
                Pago parcial. Queda {formatCurrency(pendienteTrasPago)}.
              </p>
            )}

            {montoNumerico > 0 && pendienteTrasPago != null && pendienteTrasPago <= 0.009 && !periodoBloqueado && (
              <p className="text-[11px] font-semibold text-success-ink bg-success-muted border border-success/25 px-2 py-1">
                {esMulti ? "Todas las cuotas quedan saldadas." : "La cuota queda saldada."}
              </p>
            )}

            {sugerido?.recargo > 0 && !periodoBloqueado && !esMulti && (
              <div className="flex items-center justify-between gap-2 bg-warning-muted border border-line px-2 py-1">
                <p className="text-[11px] font-semibold text-warning-ink">
                  Mora sugerida {formatCurrency(Number(sugerido.recargo))}
                </p>
                <div className="flex gap-2 shrink-0">
                  <button type="button" onClick={() => setRecargo(String(sugerido.recargo))} className="text-[11px] font-semibold text-brand">
                    Aplicar
                  </button>
                  {recargo !== "" && (
                    <button type="button" onClick={() => setRecargo("")} className="text-[11px] text-ink-faint">
                      Quitar
                    </button>
                  )}
                </div>
              </div>
            )}

            <label className="block">
              <span className="text-[10px] font-bold uppercase tracking-wide text-ink-faint">Observación</span>
              <input
                type="text"
                value={observacion}
                disabled={periodoBloqueado}
                onChange={(e) => setObservacion(e.target.value)}
                placeholder="Opcional"
                maxLength={255}
                className="mt-0.5 w-full bg-surface-muted border border-line-strong px-2 py-1.5 text-sm text-ink outline-none focus:border-brand disabled:opacity-50 placeholder:text-ink-faint"
              />
            </label>

            {error && (
              <p className="flex items-start gap-1.5 bg-danger-muted text-danger text-xs font-semibold px-2 py-1 border border-line">
                <AlertCircle size={13} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </p>
            )}
          </div>

          <div className="mt-auto shrink-0 border-t border-line bg-surface-card px-4 py-2 flex items-center gap-3">
            <div className="min-w-0 text-xs">
              <p className="font-bold text-brand tabular-nums text-sm leading-none">
                {loadingSugerido ? "…" : formatCurrency(totalCobro)}
              </p>
              <p className="text-[11px] text-ink-muted truncate">
                {esConjunto ? "Deudas" : esMulti ? "Cuotas" : "Monto"} {formatCurrency(montoNumerico)}
                {recargoNumerico > 0 ? ` + recargo ${formatCurrency(recargoNumerico)}` : ""}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 text-xs font-semibold text-ink-muted border border-line hover:bg-surface-muted"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={confirmarDeshabilitado}
              className="bg-brand text-brand-foreground px-3 py-2 text-xs font-semibold hover:bg-brand-strong disabled:opacity-45 inline-flex items-center gap-1.5"
            >
              {enviando ? <Loader2 size={13} className="animate-spin" /> : <Banknote size={13} />}
              Confirmar
            </button>
          </div>
        </form>
      </aside>
    </div>,
    document.body
  );
}
