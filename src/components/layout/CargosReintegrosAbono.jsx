import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, ChevronRight, Eye, Loader2, Plus, Receipt } from "lucide-react";
import { operacionFinancieraService } from "../../services/operacionFinancieraService";
import { abonoIdOf } from "../../utils/abonoHelpers";
import { plata } from "../../utils/clienteHelpers";

/** @typedef {import("../../types").Cargo} Cargo */
/** @typedef {import("../../types").Reintegro} Reintegro */
/** @typedef {import("../../types").Abono} Abono */
/** @typedef {import("../../types").Pago} Pago */

function formatPrecio(precio) {
  return plata(precio);
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

function estiloFila(f) {
  if (f.tipo === "Reintegro") {
    return { borde: "border-l-brand", texto: "text-ink-muted", label: "Reintegro" };
  }
  if (f.estado === "Anulado") {
    return { borde: "border-l-transparent", texto: "text-ink-faint", label: "Anulado" };
  }
  if (f.estado === "Pagado") {
    return { borde: "border-l-success", texto: "text-success-ink", label: "Pagado" };
  }
  return { borde: "border-l-danger", texto: "text-danger-ink", label: "Pendiente" };
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

  const icono = "pk-icon-btn p-1.5 text-ink-faint hover:text-ink hover:bg-surface-muted";

  return (
    <section>
      <div className="px-4 py-3 border-b border-line flex justify-end gap-2">
        <button
          type="button"
          onClick={() => navigate(`/pagosAbono/${abonoId}/cargo`)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-ink-muted border border-line-strong"
        >
          <Plus size={13} /> Cargo
        </button>
        <button
          type="button"
          onClick={() => navigate(`/pagosAbono/${abonoId}/reintegro`)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-ink-muted border border-line-strong"
        >
          <Plus size={13} /> Reintegro
        </button>
      </div>
      {error && <p className="px-4 py-3 text-sm bg-danger-muted text-danger-ink">{error}</p>}

      {loading ? (
        <p className="px-4 py-8 text-center pk-caption">Cargando…</p>
      ) : filas.length === 0 ? (
        <p className="px-4 py-16 text-center pk-caption">Todavía no hay cargos ni reintegros</p>
      ) : (
        <ul>
          {filas.map((f) => {
            const abierto = abiertos.has(f.key);
            const expandible = f.cobros.length > 0;
            const estilo = estiloFila(f);
            return (
              <li key={f.key} className="border-b border-line last:border-0">
                <div className={`flex items-center gap-3 px-4 py-3 border-l-[3px] ${estilo.borde}`}>
                  <button
                    type="button"
                    disabled={!expandible}
                    onClick={() => toggle(f.key)}
                    className={`pk-icon-btn p-0.5 ${expandible ? "text-ink-faint hover:text-ink" : "text-transparent"}`}
                    aria-label="Ver pagos"
                  >
                    {abierto ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </button>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <p className={`text-sm font-semibold ${f.estado === "Anulado" ? "text-ink-faint line-through" : "text-ink"}`}>
                        {f.tipo}
                      </p>
                      {f.estado && <span className={`pk-caption font-semibold ${estilo.texto}`}>{estilo.label}</span>}
                    </div>
                    <p className="pk-caption truncate mt-0.5">{f.detalle}</p>
                    <p className="pk-caption tabular-nums">{formatFecha(f.fecha)}</p>
                  </div>
                  {f.anular && onAnularCargo && (
                    <button
                      type="button"
                      onClick={() => onAnularCargo(f.cargo)}
                      className="px-2.5 py-1.5 text-xs font-semibold text-ink-muted border border-line-strong shrink-0"
                    >
                      Anular
                    </button>
                  )}
                  {f.cargo && onPagarCargo && (
                    <button
                      type="button"
                      onClick={() => onPagarCargo(f.cargo)}
                      className="px-2.5 py-1.5 text-xs font-semibold bg-brand text-brand-foreground hover:bg-brand-strong shrink-0"
                    >
                      Pagar
                    </button>
                  )}
                  <p
                    className={`text-sm font-semibold tabular-nums shrink-0 ${
                      Number(f.importe) < 0 ? "text-warning-ink" : "text-ink"
                    }`}
                  >
                    {formatPrecio(f.importe)}
                  </p>
                </div>
                {abierto && expandible && (
                  <div className="px-4 pb-4 pl-12 space-y-2 bg-surface-page">
                    <p className="pk-label">Pago de este cargo</p>
                    {f.cobros.map(({ detalle, pago }) => {
                      const busy = reciboBusyId === pago.pagoId;
                      const total = Number(pago.monto || 0) + Number(pago.recargo || 0);
                      return (
                        <div
                          key={detalle.detallePagoId}
                          className="py-2.5 border-t border-line first:border-t-0 cursor-pointer hover:bg-surface-muted"
                          onClick={() => onVerDetalle?.(pago)}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-ink">
                                A este cargo: {formatPrecio(detalle.monto)}
                              </p>
                              <p className="pk-caption">
                                {formatFecha(pago.fechaHoraCarga)}
                                {pago.metodoDePagoNombre ? ` · ${pago.metodoDePagoNombre}` : ""}
                              </p>
                            </div>
                            <div className="flex items-center gap-0.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                              <button type="button" title="Ver detalle" onClick={() => onVerDetalle?.(pago)} className={icono}>
                                <Eye size={14} />
                              </button>
                              <button
                                type="button"
                                disabled={busy}
                                title="Ver recibo"
                                onClick={() => onVerRecibo?.(pago)}
                                className={icono}
                              >
                                {busy ? <Loader2 size={14} className="animate-spin" /> : <Receipt size={14} />}
                              </button>
                            </div>
                          </div>
                          <p className="pk-caption mt-1">
                            Pago #{pago.pagoId}
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
