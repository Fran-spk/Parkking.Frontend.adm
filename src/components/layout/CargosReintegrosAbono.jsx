import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, ChevronRight, Eye, Loader2, Plus, Receipt } from "lucide-react";
import { operacionFinancieraService } from "../../services/operacionFinancieraService";
import { abonoIdOf } from "../../utils/abonoHelpers";

/** @typedef {import("../../types").Cargo} Cargo */
/** @typedef {import("../../types").Reintegro} Reintegro */
/** @typedef {import("../../types").Abono} Abono */
/** @typedef {import("../../types").Pago} Pago */

function formatPrecio(precio) {
  return Number(precio || 0).toLocaleString("es-AR", { style: "currency", currency: "ARS" });
}

function formatFecha(fecha) {
  if (!fecha) return "—";
  return new Date(fecha).toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function cobrosDelCargo(cargo, pagos) {
  const lista = [];
  for (const pago of pagos || []) {
    for (const detalle of pago.detalles || []) {
      if (Number(detalle.cargoId) === Number(cargo.cargoId)) {
        lista.push({ detalle, pago });
      }
    }
  }
  return lista;
}

export default function CargosReintegrosAbono({
  abono,
  pagos = [],
  onPagarCargo,
  onAnularCargo,
  onVerDetalle,
  onVerRecibo,
  reciboBusyId,
  revision = 0,
}) {
  const abonoId = abonoIdOf(abono);
  const navigate = useNavigate();
  const [cargos, setCargos] = useState(/** @type {Cargo[]} */ ([]));
  const [reintegros, setReintegros] = useState(/** @type {Reintegro[]} */ ([]));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [abiertos, setAbiertos] = useState(() => new Set());

  useEffect(() => {
    if (abonoId) cargar();
  }, [abonoId, revision]);

  async function cargar() {
    try {
      setError(null);
      const [cargosData, reintegrosData] = await Promise.all([
        operacionFinancieraService.cargosPorAbono(abonoId),
        operacionFinancieraService.reintegrosPorAbono(abonoId),
      ]);
      setCargos(Array.isArray(cargosData) ? cargosData : []);
      setReintegros(Array.isArray(reintegrosData) ? reintegrosData : []);
    } catch (e) {
      const msg = e.response?.data;
      setError(typeof msg === "string" ? msg : "No se pudieron cargar cargos y reintegros");
    } finally {
      setLoading(false);
    }
  }

  const filas = [
    ...cargos.map((c) => {
      const anulado = Number(c.estado) === 2;
      const pagado = Boolean(c.pagado) || Number(c.estado) === 1;
      const cobros = cobrosDelCargo(c, pagos);
      return {
        key: `c-${c.cargoId}`,
        tipo: "Cargo",
        estado: anulado ? "Anulado" : pagado ? "Pagado" : "Pendiente",
        estadoCls: anulado
          ? "bg-gray-100 text-gray-500 border-gray-200"
          : pagado
            ? "bg-emerald-50 text-emerald-700 border-emerald-100"
            : "bg-red-50 text-red-600 border-red-100",
        filaCls: pagado || anulado ? "" : "bg-red-50/50",
        detalle: c.concepto,
        importe: c.importe,
        fecha: c.fechaHora,
        cargo: pagado || anulado ? null : c,
        anular: !pagado && !anulado && cobros.length === 0,
        cobros,
      };
    }),
    ...reintegros.map((r) => ({
      key: `r-${r.reintegroId}`,
      tipo: "Reintegro",
      detalle: `${r.motivo} · ${r.medio}`,
      importe: -Math.abs(Number(r.importe) || 0),
      fecha: r.fechaHora,
      cobros: [],
      filaCls: "",
    })),
  ].sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

  function toggle(key) {
    setAbiertos((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  return (
    <section>
      <div className="px-4 sm:px-5 py-3 border-b border-line flex justify-end gap-2">
        <button
          type="button"
          onClick={() => navigate(`/pagosAbono/${abonoId}/cargo`)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold bg-surface-muted text-ink px-3 py-2 hover:bg-brand-muted"
        >
          <Plus size={13} /> Cargo
        </button>
        <button
          type="button"
          onClick={() => navigate(`/pagosAbono/${abonoId}/reintegro`)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold bg-surface-muted text-ink px-3 py-2 hover:bg-brand-muted"
        >
          <Plus size={13} /> Reintegro
        </button>
      </div>
      {error && <p className="px-5 py-3 text-xs text-danger">{error}</p>}

      {loading ? (
        <p className="px-5 py-4 text-xs text-ink-faint">Cargando...</p>
      ) : filas.length === 0 ? (
        <p className="px-5 py-8 text-sm text-ink-faint text-center">Todavía no hay cargos ni reintegros</p>
      ) : (
        <ul className="divide-y divide-line">
          {filas.map((f) => {
            const abierto = abiertos.has(f.key);
            const expandible = f.cobros.length > 0;
            return (
              <li key={f.key}>
                <div className={`px-4 sm:px-5 py-3 flex items-center gap-3 ${f.filaCls || ""}`}>
                  <button
                    type="button"
                    disabled={!expandible}
                    onClick={() => toggle(f.key)}
                    className={`p-0.5 ${expandible ? "text-ink-faint hover:text-ink" : "text-transparent"}`}
                    aria-label="Ver pagos"
                  >
                    {abierto ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-ink flex items-center gap-2 flex-wrap">
                      {f.tipo}
                      {f.estado && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-medium ${f.estadoCls}`}>
                          {f.estado}
                        </span>
                      )}
                      <span className="font-medium text-ink-faint">{formatFecha(f.fecha)}</span>
                    </p>
                    <p className="text-sm text-ink-muted truncate">{f.detalle}</p>
                  </div>
                  {f.anular && onAnularCargo && (
                    <button
                      type="button"
                      onClick={() => onAnularCargo(f.cargo)}
                      className="text-xs font-medium px-3 py-1.5 rounded-lg border border-line-strong text-ink-muted hover:bg-surface-muted shrink-0"
                    >
                      Anular
                    </button>
                  )}
                  {f.cargo && onPagarCargo && (
                    <button
                      type="button"
                      onClick={() => onPagarCargo(f.cargo)}
                      className="text-xs font-medium px-3 py-1.5 rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 shrink-0"
                    >
                      Pagar
                    </button>
                  )}
                  <p
                    className={`text-sm font-bold tabular-nums shrink-0 ${
                      f.importe < 0 ? "text-danger" : "text-ink"
                    }`}
                  >
                    {formatPrecio(f.importe)}
                  </p>
                </div>
                {abierto && expandible && (
                  <div className="px-5 pb-4 pl-12 space-y-2">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-faint">
                      Pago de este cargo
                    </p>
                    {f.cobros.map(({ detalle, pago }) => {
                      const busy = reciboBusyId === pago.pagoId;
                      const total = Number(pago.monto || 0) + Number(pago.recargo || 0);
                      return (
                        <div
                          key={detalle.detallePagoId}
                          className="border border-line px-3 py-2.5 space-y-1.5 cursor-pointer hover:bg-surface-muted"
                          onClick={() => onVerDetalle?.(pago)}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-ink">
                                A este cargo: {formatPrecio(detalle.monto)}
                              </p>
                              <p className="text-[11px] text-ink-muted mt-0.5">
                                {formatFecha(pago.fechaHoraCarga)}
                                {pago.metodoDePagoNombre ? ` · ${pago.metodoDePagoNombre}` : ""}
                              </p>
                            </div>
                            <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                              <button
                                type="button"
                                title="Ver detalle"
                                onClick={() => onVerDetalle?.(pago)}
                                className="p-2 text-ink-faint hover:text-brand"
                              >
                                <Eye size={14} />
                              </button>
                              <button
                                type="button"
                                disabled={busy}
                                title="Ver recibo"
                                onClick={() => onVerRecibo?.(pago)}
                                className="p-2 text-ink-faint hover:text-brand disabled:opacity-40"
                              >
                                {busy ? <Loader2 size={14} className="animate-spin" /> : <Receipt size={14} />}
                              </button>
                            </div>
                          </div>
                          <p className="text-[11px] text-ink-muted">
                            <span className="font-semibold text-ink">Pago #{pago.pagoId}</span>
                            {pago.reciboNumero ? ` · Recibo ${pago.reciboNumero}` : ""}
                            {" · "}
                            Total {formatPrecio(total || detalle.monto)}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
