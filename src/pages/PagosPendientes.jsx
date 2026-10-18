import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CreditCard, ExternalLink, Loader2, MessageCircle } from "lucide-react";
import { pagoService } from "../services/pagoService";
import { abonoService } from "../services/abonoService";
import ModalRegistrarPago from "../components/layout/ModalRegistrarPago";
import PageHeader from "../components/layout/PageHeader";
import SearchField from "../components/layout/SearchField";
import FiltroSegmentado from "../components/layout/FiltroSegmentado";
import Patente from "../components/layout/Patente";
import Paginacion, { paginaDe } from "../components/layout/Paginacion";
import { plata, whatsappUrl } from "../utils/clienteHelpers";

/** @typedef {import("../types").DeudaPendiente} DeudaPendiente */

const FILTROS = [
  { value: "todos", label: "Todos" },
  { value: "vencidos", label: "Con atraso" },
  { value: "parcial", label: "Parciales" },
  { value: "pendiente", label: "Sin pagar" },
];

function samePeriodo(a, b) {
  if (!a || !b) return false;
  return String(a).split("T")[0] === String(b).split("T")[0];
}

function esParcial(d) {
  return d.estado === 1 || Number(d.montoPagado) > 0;
}

function pasaFiltro(d, filtro) {
  if (filtro === "vencidos") return d.diasAtraso > 0;
  if (filtro === "parcial") return esParcial(d);
  if (filtro === "pendiente") return !esParcial(d);
  return true;
}

function coincide(d, busqueda) {
  const q = busqueda.trim().toLowerCase();
  if (!q) return true;
  return (
    String(d.clienteNombre || "").toLowerCase().includes(q) ||
    String(d.cocherasLabel || "").toLowerCase().includes(q) ||
    String(d.patentesLabel || "").toLowerCase().includes(q) ||
    String(d.periodoLabel || "").toLowerCase().includes(q) ||
    String(d.clienteTelefono || "").includes(q)
  );
}

function claveDe(d) {
  if (d.senaId) return `sena-${d.senaId}`;
  if (d.cargoId) return `cargo-${d.cargoId}`;
  return `${d.abonoId}-${d.periodoInicio}-${d.cuotaId ?? "x"}`;
}

function busyDe(d) {
  if (d.senaId) return `sena-${d.senaId}`;
  if (d.cargoId) return `cargo-${d.cargoId}`;
  return `${d.abonoId}-${d.periodoInicio}`;
}

function tipoDe(d) {
  if (d.esSena || d.senaId) return "Seña";
  if (d.esCargo || d.cargoId) return "Cargo";
  return "Cuota";
}

function bordeDe(d) {
  if (d.diasAtraso > 0) return "border-l-danger";
  if (esParcial(d)) return "border-l-warning";
  if (d.esSena || d.senaId) return "border-l-brand";
  return "border-l-danger";
}

function Chips({ label, patente }) {
  const lista = String(label || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (lista.length === 0) return <span className="text-ink-faint">—</span>;
  return (
    <span className="inline-flex items-center gap-1 flex-wrap">
      {lista.slice(0, 2).map((v) =>
        patente ? (
          <Patente key={v} valor={v} size="sm" />
        ) : (
          <span key={v} className="px-1.5 py-0.5 bg-surface-muted text-[11px] font-bold text-ink tabular-nums">
            {v}
          </span>
        )
      )}
      {lista.length > 2 && <span className="pk-caption">+{lista.length - 2}</span>}
    </span>
  );
}

function Vacio({ texto }) {
  return <div className="bg-surface-card px-4 py-16 text-center text-sm font-medium text-ink-muted">{texto}</div>;
}

export default function PagosPendientes() {
  const navigate = useNavigate();
  const [items, setItems] = useState(/** @type {DeudaPendiente[]} */ ([]));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busqueda, setBusqueda] = useState("");
  const [filtro, setFiltro] = useState("todos");
  const [modalPago, setModalPago] = useState(null);
  const [abriendoCobroId, setAbriendoCobroId] = useState(null);
  const [pagina, setPagina] = useState(1);

  useEffect(() => {
    cargar();
  }, []);

  async function cargar() {
    try {
      setLoading(true);
      setError(null);
      const data = await pagoService.getPendientes();
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      const msg = err.response?.data;
      setError(typeof msg === "string" ? msg : "No se pudieron cargar las deudas");
    } finally {
      setLoading(false);
    }
  }

  const cantidades = useMemo(() => {
    const c = { todos: items.length, vencidos: 0, parcial: 0, pendiente: 0 };
    for (const d of items) {
      if (d.diasAtraso > 0) c.vencidos += 1;
      if (esParcial(d)) c.parcial += 1;
      else c.pendiente += 1;
    }
    return c;
  }, [items]);

  const visibles = useMemo(
    () => items.filter((d) => pasaFiltro(d, filtro) && coincide(d, busqueda)),
    [items, filtro, busqueda]
  );

  const paginaClave = `${filtro}|${busqueda}`;
  useEffect(() => {
    setPagina(1);
  }, [paginaClave]);

  const visPage = paginaDe(visibles, pagina);
  const totalSaldo = visibles.reduce((acc, d) => acc + Number(d.saldo || 0), 0);
  const abonosUnicos = new Set(visibles.map((d) => d.abonoId).filter(Boolean)).size;
  const hayFiltros = filtro !== "todos" || busqueda.trim() !== "";

  async function abrirPago(deuda) {
    const busyKey = busyDe(deuda);
    try {
      setAbriendoCobroId(busyKey);
      setError(null);

      if (deuda.senaId) {
        setModalPago({
          abono: null,
          sena: {
            senaId: deuda.senaId,
            importe: deuda.saldo,
            clienteNombre: deuda.clienteNombre,
            cocherasLabel: deuda.cocherasLabel,
            patentesLabel: deuda.patentesLabel,
          },
          cargo: null,
          cuota: null,
          cuotas: null,
          cuotasPendientes: [],
        });
        return;
      }

      if (deuda.cargoId) {
        const abono = await abonoService.getById(deuda.abonoId);
        setModalPago({
          abono,
          cargo: {
            cargoId: deuda.cargoId,
            concepto: deuda.periodoLabel,
            importe: deuda.saldo,
          },
          cuota: null,
          cuotas: null,
          cuotasPendientes: [],
        });
        return;
      }

      const [abono, cuotas] = await Promise.all([
        abonoService.getById(deuda.abonoId),
        pagoService.getCuotas(deuda.abonoId),
      ]);

      const cuotasCobrables = (Array.isArray(cuotas) ? cuotas : []).filter(
        (c) => !c.esFuturo && Number(c.saldo) > 0 && c.estado !== 2 && c.estado !== 3
      );

      const cuota =
        cuotasCobrables.find((c) => deuda.cuotaId && c.cuotaId === deuda.cuotaId) ||
        cuotasCobrables.find((c) => samePeriodo(c.periodoInicio, deuda.periodoInicio)) ||
        {
          cuotaId: deuda.cuotaId,
          periodoInicio: deuda.periodoInicio,
          periodoFin: deuda.periodoFin,
          periodoLabel: deuda.periodoLabel,
          saldo: deuda.saldo,
          monto: deuda.monto,
          montoPagado: deuda.montoPagado,
          estado: deuda.estado,
          esFuturo: false,
        };

      setModalPago({
        abono,
        cuota,
        cuotas: null,
        cuotasPendientes: cuotasCobrables.length ? cuotasCobrables : [cuota],
      });
    } catch (err) {
      const msg = err.response?.data;
      setError(typeof msg === "string" ? msg : "No se pudo abrir el pago");
    } finally {
      setAbriendoCobroId(null);
    }
  }

  return (
    <div className="space-y-5 pb-12 animate-fade-in-up">
      <PageHeader
        title="Pagos pendientes"
        description="Cuotas, cargos y señas con saldo. Cobrálos acá o entrá al abono."
        loading={loading}
        stats={[
          { label: "Deudas", value: visibles.length, onClick: () => setFiltro("todos") },
          { label: "Con atraso", value: cantidades.vencidos, tone: "danger", onClick: () => setFiltro("vencidos") },
          { label: "Abonos", value: abonosUnicos },
          { label: "A pagar", value: plata(totalSaldo), tone: "danger" },
        ]}
      />

      <div className="flex flex-wrap items-center gap-3">
        <SearchField
          value={busqueda}
          onChange={setBusqueda}
          placeholder="Cliente, cochera, patente o período"
          className="w-full sm:w-80"
        />
        <FiltroSegmentado
          ariaLabel="Filtrar deudas"
          value={filtro}
          onChange={setFiltro}
          opciones={FILTROS.map((f) => ({ ...f, cantidad: cantidades[f.value] }))}
        />
        {hayFiltros && (
          <button
            type="button"
            className="text-xs font-semibold text-brand"
            onClick={() => {
              setFiltro("todos");
              setBusqueda("");
            }}
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {error && <p className="px-4 py-3 bg-danger-muted text-danger-ink text-sm">{error}</p>}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <div className="w-9 h-9 border-2 border-brand-soft border-t-brand animate-spin" />
          <span className="pk-caption">Cargando deudas…</span>
        </div>
      ) : items.length === 0 ? (
        <Vacio texto="No hay cuotas, cargos ni señas con saldo." />
      ) : visibles.length === 0 ? (
        <Vacio texto="Ninguna deuda coincide con este filtro." />
      ) : (
        <>
          <div className="hidden md:block bg-surface-card overflow-x-auto">
            <table className="w-full text-sm table-fixed">
              <colgroup>
                <col className="w-[22%]" />
                <col className="w-[14%]" />
                <col className="w-[16%]" />
                <col className="w-[18%]" />
                <col className="w-[14%]" />
                <col className="w-[16%]" />
              </colgroup>
              <thead>
                <tr className="border-b border-line-strong text-left">
                  <th className="pk-label font-bold pl-4 pr-3 py-2.5">Cliente</th>
                  <th className="pk-label font-bold px-3 py-2.5">Cocheras</th>
                  <th className="pk-label font-bold px-3 py-2.5">Patentes</th>
                  <th className="pk-label font-bold px-3 py-2.5">Período</th>
                  <th className="pk-label font-bold px-3 py-2.5">Saldo</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {visPage.map((d) => {
                  const parcial = esParcial(d);
                  const wa = whatsappUrl(d.clienteTelefono);
                  const busy = abriendoCobroId === busyDe(d);
                  return (
                    <tr key={claveDe(d)} className="border-b border-line hover:bg-surface-page">
                      <td className={`pl-4 pr-3 py-2.5 overflow-hidden border-l-[3px] ${bordeDe(d)}`}>
                        <p className="font-semibold text-ink truncate">{d.clienteNombre}</p>
                        <p className="pk-caption truncate">{d.clienteTelefono || "\u00a0"}</p>
                      </td>
                      <td className="px-3 py-2.5 overflow-hidden">
                        <Chips label={d.cocherasLabel} />
                      </td>
                      <td className="px-3 py-2.5 overflow-hidden">
                        <Chips label={d.patentesLabel} patente />
                      </td>
                      <td className="px-3 py-2.5 overflow-hidden">
                        <p className="font-semibold text-ink capitalize truncate">{d.periodoLabel}</p>
                        <p className="pk-caption">
                          {tipoDe(d)}
                          {d.diasAtraso > 0 ? ` · ${d.diasAtraso} d atraso` : ""}
                        </p>
                      </td>
                      <td className="px-3 py-2.5 overflow-hidden">
                        <p className={`text-sm font-semibold tabular-nums ${parcial ? "text-warning-ink" : "text-danger-ink"}`}>
                          {plata(d.saldo)}
                        </p>
                        <p className="pk-caption">{parcial ? `de ${plata(d.monto)}` : "Pendiente"}</p>
                      </td>
                      <td className="pl-2 pr-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-0.5">
                          {wa && (
                            <a href={wa} target="_blank" rel="noreferrer" title="WhatsApp" className="pk-icon-btn p-1.5 text-ink-faint hover:text-ink hover:bg-surface-muted">
                              <MessageCircle size={15} />
                            </a>
                          )}
                          <button
                            type="button"
                            title="Pagar"
                            disabled={busy}
                            onClick={() => abrirPago(d)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold bg-brand text-brand-foreground hover:bg-brand-strong disabled:opacity-50"
                          >
                            {busy ? <Loader2 size={13} className="animate-spin" /> : <CreditCard size={13} />}
                            Pagar
                          </button>
                          <button
                            type="button"
                            title={d.senaId ? "Ver reserva" : "Ver abono"}
                            onClick={() => navigate(d.senaId ? `/reservas/${d.reservaId}` : `/pagosAbono/${d.abonoId}`)}
                            className="pk-icon-btn p-1.5 text-ink-faint hover:text-ink hover:bg-surface-muted"
                          >
                            <ExternalLink size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <ul className="md:hidden bg-surface-card divide-y divide-line">
            {visPage.map((d) => {
              const parcial = esParcial(d);
              const busy = abriendoCobroId === busyDe(d);
              return (
                <li key={claveDe(d)} className={`px-4 py-3 border-l-[3px] ${bordeDe(d)}`}>
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="font-semibold text-ink truncate">{d.clienteNombre}</span>
                    <span className={`text-sm font-semibold tabular-nums ${parcial ? "text-warning-ink" : "text-danger-ink"}`}>
                      {plata(d.saldo)}
                    </span>
                  </div>
                  <p className="pk-caption capitalize mt-0.5">
                    {tipoDe(d)} · {d.periodoLabel}
                    {d.diasAtraso > 0 ? ` · ${d.diasAtraso} d` : ""}
                  </p>
                  <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                    <Chips label={d.cocherasLabel} />
                    <Chips label={d.patentesLabel} patente />
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => abrirPago(d)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold bg-brand text-brand-foreground"
                    >
                      {busy ? <Loader2 size={13} className="animate-spin" /> : <CreditCard size={13} />}
                      Pagar
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate(d.senaId ? `/reservas/${d.reservaId}` : `/pagosAbono/${d.abonoId}`)}
                      className="pk-caption font-semibold"
                    >
                      Ver {d.senaId ? "reserva" : "abono"}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>

          <Paginacion pagina={pagina} total={visibles.length} onChange={setPagina} />
        </>
      )}

      {modalPago && (
        <ModalRegistrarPago
          abono={modalPago.abono}
          cuota={modalPago.cuota || null}
          cuotas={modalPago.cuotas || null}
          cuotasPendientes={modalPago.cuotasPendientes || []}
          cargo={modalPago.cargo || null}
          sena={modalPago.sena || null}
          onClose={() => setModalPago(null)}
          onRegistrado={() => {
            setModalPago(null);
            cargar();
          }}
        />
      )}
    </div>
  );
}
