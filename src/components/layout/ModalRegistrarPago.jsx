import { useState, useEffect, useMemo } from "react";
import {
  X,
  Calendar,
  DollarSign,
  Loader2,
  AlertCircle,
  Banknote,
  CreditCard,
  ArrowLeftRight,
  Receipt,
  Sparkles,
  CircleDollarSign,
  ChevronDown,
} from "lucide-react";
import DatePicker from "react-datepicker";
import { es } from "date-fns/locale";
import "react-datepicker/dist/react-datepicker.css";
import { pagoService } from "../../services/pagoService";
import { reciboService } from "../../services/reciboService";
import { estacionamientoService } from "../../services/estacionamientoService";
import { metodoDePagoService } from "../../services/metodoDePagoService";
import { abonoIdOf, labelCocheras, labelPatentes } from "../../utils/abonoHelpers";
import { imprimirReciboPdf } from "../../utils/imprimirRecibo";

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

function iconForMetodo(nombre) {
  const n = String(nombre || "").toLowerCase();
  if (n.includes("efectivo") || n.includes("cash")) return Banknote;
  if (n.includes("transfer") || n.includes("alias") || n.includes("cbu")) return ArrowLeftRight;
  if (
    n.includes("débito") ||
    n.includes("debito") ||
    n.includes("crédito") ||
    n.includes("credito") ||
    n.includes("tarjeta")
  )
    return CreditCard;
  return Banknote;
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
  onClose,
  onRegistrado,
}) {
  const abonoId = abonoIdOf(abono);
  const clienteNombre = abono?.cliente?.nombre || abono?.clienteNombre || "Cliente";
  const cocheras = labelCocheras(abono);
  const patentes = labelPatentes(abono);

  const listaFija = useMemo(() => {
    if (Array.isArray(cuotas) && cuotas.length > 0) return cuotas;
    if (cuota) return [cuota];
    return null;
  }, [cuotas, cuota]);

  const esMulti = (listaFija?.length ?? 0) > 1;
  const periodoFijo = Boolean(listaFija?.length);
  const cuotaUnica = !esMulti && listaFija?.[0] ? listaFija[0] : null;

  const [mes, setMes] = useState(() => {
    if (listaFija?.[0]?.periodoInicio) return parsePeriodoDate(listaFija[0].periodoInicio);
    const primera = cuotasPendientes[0];
    if (primera?.periodoInicio) return parsePeriodoDate(primera.periodoInicio);
    return new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  });

  const [monto, setMonto] = useState(cuotaUnica?.saldo != null ? String(cuotaUnica.saldo) : "");
  const [montosPorCuota, setMontosPorCuota] = useState(() => {
    if (!listaFija) return {};
    return Object.fromEntries(listaFija.map((c) => [cuotaKey(c), String(c.saldo ?? 0)]));
  });
  const [recargo, setRecargo] = useState("");
  const [observacion, setObservacion] = useState("");
  const [metodos, setMetodos] = useState([]);
  const [metodoDePagoId, setMetodoDePagoId] = useState(null);
  const [sugerido, setSugerido] = useState(null);
  const [loadingSugerido, setLoadingSugerido] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);
  const [periodoBloqueado, setPeriodoBloqueado] = useState(false);

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
    if (esMulti) return lineasMulti.reduce((acc, l) => acc + l.monto, 0);
    const m = parseFloat(monto);
    return !isNaN(m) && m > 0 ? m : 0;
  }, [esMulti, lineasMulti, monto]);

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

  const excedeSaldo = esMulti
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
      setError(`No podés cobrar más que el saldo de la cuota (${formatCurrency(saldoMaximo)}).`);
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
      setError(`No podés cobrar más que el saldo de ${c.periodoLabel || "la cuota"} (${formatCurrency(saldo)}).`);
      return;
    }
    if (error && error.includes("más que el saldo")) setError(null);
    setMontosPorCuota((prev) => ({ ...prev, [key]: raw }));
  }

  useEffect(() => {
    if (!abonoId) return;

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
        setError("Esta cuota ya está pagada. No se puede registrar otro cobro.");
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
        setError("Esta cuota ya está pagada. No se puede registrar otro cobro.");
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
            : data?.title || data?.message || err.message || "No se puede cobrar este período";
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
  }, [mes, abonoId, periodoFijo, cuotaUnica, cuotaDelPeriodo, cuotasPendientes.length, esMulti, listaFija]);

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

      if (!abonoId) throw new Error("Abono inválido");

      let detalles;
      if (esMulti) {
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

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        aria-label="Cerrar"
        className="absolute inset-0 bg-ink/45 backdrop-blur-[2px]"
        onClick={onClose}
      />

      <aside className="relative h-full w-full max-w-sm bg-surface-card shadow-pk-modal border-l border-line-subtle flex flex-col animate-fade-in-up">
        <div className="relative shrink-0 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-brand-strong via-brand to-brand" />
          <div className="relative px-4 pt-3.5 pb-3.5">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-white/15 border border-white/20 flex items-center justify-center shrink-0">
                  <Receipt size={15} className="text-brand-foreground" />
                </div>
                <div className="min-w-0">
                  <p className="pk-label text-white/70">
                    {esMulti ? `Cobrar ${listaFija.length} cuotas` : "Cobrar cuota"}
                  </p>
                  <h3 className="pk-heading text-brand-foreground truncate !text-[0.9375rem]">
                    {clienteNombre}
                  </h3>
                  <p className="pk-caption text-white/70 truncate mt-0.5">
                    Cochera {cocheras}
                    {patentes ? ` · ${patentes}` : ""}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 transition-colors shrink-0"
              >
                <X size={15} className="text-brand-foreground" />
              </button>
            </div>

            <div className="mt-3 rounded-xl bg-white/10 border border-white/15 px-3 py-2.5">
              <div className="flex items-end justify-between gap-2">
                <div>
                  <p className="pk-label text-white/65 flex items-center gap-1">
                    <Sparkles size={10} />
                    {periodoBloqueado ? "No disponible" : "Total a cobrar"}
                  </p>
                  <p className="pk-amount text-brand-foreground mt-0.5">
                    {loadingSugerido ? "…" : formatCurrency(totalCobro)}
                  </p>
                </div>
                {periodoLabel && !periodoBloqueado && (
                  <div className="text-right shrink-0 max-w-[42%]">
                    <p className="pk-label text-white/55">{esMulti ? "Selección" : "Período"}</p>
                    <p className="pk-caption text-white/90 capitalize mt-0.5 leading-snug">
                      {periodoLabel}
                    </p>
                  </div>
                )}
              </div>
              {saldoMaximo != null && !periodoBloqueado && (
                <p className="pk-caption text-white/70 mt-1.5">
                  {esMulti ? "Saldo total" : "Saldo cuota"}:{" "}
                  <span className="text-white font-bold">{formatCurrency(saldoMaximo)}</span>
                </p>
              )}
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto px-4 py-3.5 space-y-3.5">
            {esMulti ? (
              <div className="space-y-1.5">
                <label className="pk-label">Cuotas a cobrar</label>
                <div className="space-y-2">
                  {lineasMulti.map((l) => (
                    <div
                      key={l.key}
                      className="rounded-xl border border-line-subtle bg-surface-muted px-3 py-2.5 space-y-1.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="pk-subhead capitalize">{l.cuota.periodoLabel}</span>
                        <span className="pk-caption text-ink-muted">
                          Saldo {formatCurrency(l.saldo)}
                        </span>
                      </div>
                      <div className="relative">
                        <input
                          type="number"
                          min="0.01"
                          max={l.saldo}
                          step="0.01"
                          value={montosPorCuota[l.key] ?? ""}
                          onChange={(e) => setMontoLinea(l.cuota, e.target.value)}
                          className="w-full bg-surface-card border border-line-subtle rounded-lg pl-3 pr-8 py-2 pk-subhead text-ink outline-none focus:ring-2 focus:ring-brand focus:border-brand tabular-nums"
                        />
                        <DollarSign
                          size={12}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-faint"
                        />
                      </div>
                      {l.pendiente > 0.009 && l.monto > 0 && (
                        <p className="pk-caption text-warning-ink">
                          Queda pendiente {formatCurrency(l.pendiente)}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setMontosPorCuota(
                      Object.fromEntries(listaFija.map((c) => [cuotaKey(c), String(c.saldo ?? 0)]))
                    )
                  }
                  className="pk-label text-brand hover:text-brand-strong"
                >
                  Cobrar saldo completo de todas
                </button>
              </div>
            ) : (
              <div className="space-y-1.5">
                <label className="pk-label">Período a abonar</label>
                {periodoFijo ? (
                  <div className="flex items-center gap-2 w-full bg-surface-muted rounded-xl px-3 py-2.5 border border-line-subtle">
                    <Calendar size={14} className="text-brand shrink-0" />
                    <span className="pk-subhead capitalize">
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
                      className="w-full bg-surface-muted border border-line-subtle rounded-xl pl-3 pr-9 py-2.5 pk-subhead text-ink focus:ring-2 focus:ring-brand focus:border-brand outline-none capitalize"
                    />
                    <Calendar
                      size={14}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-faint pointer-events-none"
                    />
                  </div>
                )}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="pk-label">Forma de pago</label>
              {metodos.length === 0 ? (
                <p className="pk-desc text-warning-ink bg-warning-muted border border-line rounded-xl px-3 py-2">
                  No hay métodos activos. Configuralos en Datos del estacionamiento.
                </p>
              ) : (
                <div className="relative">
                  {(() => {
                    const actual = metodos.find((m) => m.metodoDePagoId === metodoDePagoId);
                    const Icon = iconForMetodo(actual?.nombre);
                    return (
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-brand pointer-events-none">
                        <Icon size={15} />
                      </span>
                    );
                  })()}
                  <select
                    disabled={periodoBloqueado}
                    value={metodoDePagoId ?? ""}
                    onChange={(e) => setMetodoDePagoId(Number(e.target.value))}
                    className="w-full appearance-none bg-surface-muted border border-line-subtle rounded-xl pl-9 pr-9 py-2.5 pk-subhead text-ink outline-none focus:ring-2 focus:ring-brand focus:border-brand disabled:opacity-50 cursor-pointer"
                  >
                    {metodos.map((m) => (
                      <option key={m.metodoDePagoId} value={m.metodoDePagoId}>
                        {m.nombre}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={14}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-faint pointer-events-none"
                  />
                </div>
              )}
            </div>

            {!esMulti && (
              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1.5">
                  <label className="pk-label">Monto a cobrar</label>
                  <div className="relative">
                    <input
                      type="number"
                      required
                      min="0.01"
                      max={saldoMaximo ?? undefined}
                      step="0.01"
                      disabled={periodoBloqueado}
                      value={monto}
                      onChange={(e) => setMontoAcotado(e.target.value)}
                      className="w-full bg-surface-muted border border-line-subtle rounded-xl pl-3 pr-8 py-2.5 pk-subhead text-ink outline-none focus:ring-2 focus:ring-brand focus:border-brand disabled:opacity-50 tabular-nums"
                    />
                    <DollarSign size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-faint" />
                  </div>
                  {saldoMaximo != null && (
                    <button
                      type="button"
                      disabled={periodoBloqueado}
                      onClick={() => setMontoAcotado(String(saldoMaximo))}
                      className="pk-label text-brand hover:text-brand-strong disabled:opacity-40"
                    >
                      Cobrar saldo completo
                    </button>
                  )}
                </div>
                <div className="space-y-1.5">
                  <label className="pk-label">Recargo / mora</label>
                  <input
                    type="number"
                    value={recargo}
                    disabled={periodoBloqueado}
                    onChange={(e) => setRecargo(e.target.value)}
                    placeholder="0"
                    min="0"
                    step="0.01"
                    className="w-full bg-surface-muted border border-line-subtle rounded-xl px-3 py-2.5 pk-subhead text-ink outline-none focus:ring-2 focus:ring-brand focus:border-brand disabled:opacity-50 tabular-nums"
                  />
                </div>
              </div>
            )}

            {esMulti && (
              <div className="space-y-1.5">
                <label className="pk-label">Recargo / mora (único)</label>
                <input
                  type="number"
                  value={recargo}
                  disabled={periodoBloqueado}
                  onChange={(e) => setRecargo(e.target.value)}
                  placeholder="0"
                  min="0"
                  step="0.01"
                  className="w-full bg-surface-muted border border-line-subtle rounded-xl px-3 py-2.5 pk-subhead text-ink outline-none focus:ring-2 focus:ring-brand focus:border-brand disabled:opacity-50 tabular-nums"
                />
              </div>
            )}

            {esPagoParcial && !periodoBloqueado && (
              <div className="rounded-xl border border-warning/30 bg-warning-muted px-3 py-2.5 flex gap-2">
                <CircleDollarSign size={15} className="text-warning shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="pk-label text-warning-ink">
                    {esMulti ? "Pago parcial en una o más cuotas" : "Pago parcial"}
                  </p>
                  <p className="pk-body mt-0.5">
                    Quedará pendiente{" "}
                    <span className="text-warning-ink font-bold tabular-nums">
                      {formatCurrency(pendienteTrasPago)}
                    </span>
                    .
                  </p>
                </div>
              </div>
            )}

            {montoNumerico > 0 &&
              pendienteTrasPago != null &&
              pendienteTrasPago <= 0.009 &&
              !periodoBloqueado && (
                <div className="rounded-xl border border-success/25 bg-success-muted px-3 py-2 pk-desc text-success-ink font-semibold">
                  {esMulti
                    ? "Con estos montos todas las cuotas quedan saldadas."
                    : "Con este monto la cuota queda saldada."}
                </div>
              )}

            {sugerido?.recargo > 0 && !periodoBloqueado && !esMulti && (
              <div className="flex items-center justify-between gap-2 rounded-xl bg-warning-muted border border-line px-3 py-2">
                <p className="pk-caption text-warning-ink font-semibold">
                  Mora sugerida: {formatCurrency(Number(sugerido.recargo))}
                </p>
                <div className="flex gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setRecargo(String(sugerido.recargo))}
                    className="pk-label text-brand hover:text-brand-strong"
                  >
                    Aplicar
                  </button>
                  {recargo !== "" && (
                    <button
                      type="button"
                      onClick={() => setRecargo("")}
                      className="pk-label text-ink-faint hover:text-ink-muted"
                    >
                      Quitar
                    </button>
                  )}
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="pk-label">Observación</label>
              <input
                type="text"
                value={observacion}
                disabled={periodoBloqueado}
                onChange={(e) => setObservacion(e.target.value)}
                placeholder="Opcional"
                maxLength={255}
                className="w-full bg-surface-muted border border-line-subtle rounded-xl px-3 py-2.5 pk-body outline-none focus:ring-2 focus:ring-brand focus:border-brand disabled:opacity-50 placeholder:text-ink-faint"
              />
            </div>

            {error && (
              <div className="flex items-start gap-2 bg-danger-muted text-danger pk-desc font-semibold p-2.5 rounded-xl border border-line">
                <AlertCircle size={14} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
          </div>

          <div className="shrink-0 border-t border-line-subtle bg-surface-card px-4 py-3 space-y-2.5">
            <div className="space-y-1 pk-caption">
              <div className="flex justify-between text-ink-muted">
                <span>{esMulti ? "Monto cuotas" : "Monto cuota"}</span>
                <span className="font-semibold text-ink tabular-nums">{formatCurrency(montoNumerico)}</span>
              </div>
              {recargoNumerico > 0 && (
                <div className="flex justify-between text-ink-muted">
                  <span>Recargo</span>
                  <span className="font-semibold text-ink tabular-nums">{formatCurrency(recargoNumerico)}</span>
                </div>
              )}
              {esPagoParcial && (
                <div className="flex justify-between text-warning-ink">
                  <span className="font-semibold">Pendiente restante</span>
                  <span className="font-bold tabular-nums">{formatCurrency(pendienteTrasPago)}</span>
                </div>
              )}
              <div className="flex justify-between pt-1 border-t border-line-subtle pk-body">
                <span className="font-bold text-ink">Total ahora</span>
                <span className="font-bold text-brand tabular-nums">{formatCurrency(totalCobro)}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-3 py-2.5 pk-label text-ink-muted rounded-xl border border-line hover:bg-surface-muted transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={confirmarDeshabilitado}
                className="flex-[1.35] bg-brand text-brand-foreground px-3 py-2.5 pk-label rounded-xl hover:bg-brand-strong disabled:opacity-45 transition-all flex justify-center items-center gap-1.5"
              >
                {enviando ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <>
                    <Banknote size={13} />
                    Confirmar
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </aside>
    </div>
  );
}
