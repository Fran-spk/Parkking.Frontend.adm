import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Mail, MessageCircle, Pencil, Phone, RotateCcw, Trash2, Wallet, X } from "lucide-react";
import { clienteService } from "../../services/clienteService";
import Patente from "./Patente";
import { PERIODICIDADES, estadoCuenta, fechaCorta, haceCuanto, plata, whatsappUrl } from "../../utils/clienteHelpers";

function Seccion({ titulo, children, extra = null }) {
  return (
    <section className="px-5 py-4 border-b border-line">
      <div className="flex items-baseline justify-between gap-3 mb-2.5">
        <h3 className="pk-label">{titulo}</h3>
        {extra}
      </div>
      {children}
    </section>
  );
}

function Dato({ label, valor }) {
  if (!valor) return null;
  return (
    <div className="flex gap-3 text-sm">
      <dt className="w-20 shrink-0 text-ink-muted">{label}</dt>
      <dd className="text-ink min-w-0 break-words">{valor}</dd>
    </div>
  );
}

const contacto = "inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-ink-muted border border-line-strong";

function AbonoItem({ abono }) {
  const id = abono.abonoId ?? abono.abonoCocheraId;
  const plazas = (abono.plazas ?? []).filter((p) => p.activo !== false);
  const cocheras = plazas.map((p) => p.cochera?.numero).filter(Boolean);
  if (cocheras.length === 0 && abono.cochera?.numero) cocheras.push(abono.cochera.numero);
  const vehiculos = abono.vehiculos?.length
    ? abono.vehiculos
    : abono.patente
      ? [{ patente: abono.patente, modeloVehiculo: abono.modeloVehiculo, tipoVehiculo: abono.tipoVehiculo }]
      : [];

  return (
    <Link to={`/pagosAbono/${id}`} className="block border-l-[3px] border-l-brand bg-surface-page px-3 py-2.5 hover:bg-surface-muted">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm font-bold text-ink tabular-nums">
          {cocheras.length > 1 ? "Cocheras" : "Cochera"} {cocheras.join(", ") || "—"}
        </span>
        <span className="pk-caption tabular-nums">
          {abono.precioAcordado != null && `${plata(abono.precioAcordado)} · `}
          {PERIODICIDADES[abono.periodicidadCobro] ?? "Mensual"}
        </span>
      </div>
      {vehiculos.length > 0 && (
        <ul className="mt-2 space-y-1">
          {vehiculos.map((v, i) => (
            <li key={v.abonoVehiculoId ?? `${v.patente}-${i}`} className="flex items-center gap-2 min-w-0">
              {v.patente && <Patente valor={v.patente} size="sm" />}
              <span className="pk-caption truncate">
                {[v.tipoVehiculo?.nombre, v.modeloVehiculo].filter(Boolean).join(" · ")}
              </span>
            </li>
          ))}
        </ul>
      )}
      <p className="pk-caption mt-2">Desde {fechaCorta(abono.fechaInicio)}</p>
    </Link>
  );
}

export default function PanelCliente({ cliente, onClose, onEditar, onDarDeBaja, onReactivar }) {
  const [detalle, setDetalle] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let vivo = true;
    setCargando(true);
    clienteService
      .getById(cliente.clienteId)
      .then((d) => vivo && setDetalle(d))
      .catch(() => vivo && setDetalle(null))
      .finally(() => vivo && setCargando(false));
    return () => {
      vivo = false;
    };
  }, [cliente.clienteId]);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const estado = estadoCuenta(cliente);
  const wa = whatsappUrl(cliente.telefono);
  const abonos = detalle?.abonos ?? [];

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <button type="button" aria-label="Cerrar" className="absolute inset-0 bg-ink/30" onClick={onClose} />
      <aside className="relative w-full max-w-md h-full bg-surface-card border-l border-line-strong flex flex-col animate-fade-in-up">
        <header className="px-5 pt-5 pb-4 border-b border-line">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="pk-title truncate">{cliente.nombre}</h2>
              <p className={`text-sm font-semibold mt-0.5 ${estado.texto}`}>{estado.label}</p>
            </div>
            <button type="button" onClick={onClose} className="p-1.5 text-ink-faint hover:text-ink">
              <X size={18} />
            </button>
          </div>
          {(cliente.telefono || cliente.email) && (
            <div className="flex flex-wrap gap-2 mt-4">
              {wa && (
                <a href={wa} target="_blank" rel="noreferrer" className={contacto}>
                  <MessageCircle size={13} /> WhatsApp
                </a>
              )}
              {cliente.telefono && (
                <a href={`tel:${cliente.telefono}`} className={contacto}>
                  <Phone size={13} /> {cliente.telefono}
                </a>
              )}
              {cliente.email && (
                <a href={`mailto:${cliente.email}`} className={`${contacto} max-w-full`}>
                  <Mail size={13} className="shrink-0" /> <span className="truncate">{cliente.email}</span>
                </a>
              )}
            </div>
          )}
        </header>

        <div className="flex-1 overflow-y-auto">
          <Seccion
            titulo="Estado de cuenta"
            extra={
              <Link to={`/clientes/${cliente.clienteId}/cuenta-corriente`} className="pk-caption font-semibold text-brand hover:underline">
                Cuenta corriente
              </Link>
            }
          >
            {cliente.deuda > 0 ? (
              <>
                <p className="pk-amount text-danger-ink">{plata(cliente.deuda)}</p>
                <p className="pk-caption mt-0.5">
                  {cliente.deudaDetalle.length} {cliente.deudaDetalle.length === 1 ? "ítem" : "ítems"} · el más viejo con{" "}
                  {cliente.diasAtraso} días
                </p>
                <ul className="mt-3 divide-y divide-line border-y border-line">
                  {cliente.deudaDetalle.map((d, i) => (
                    <li key={i}>
                      <Link
                        to={d.abonoId > 0 ? `/pagosAbono/${d.abonoId}` : `/reservas/${d.reservaId}`}
                        className="flex items-baseline justify-between gap-3 py-2 hover:bg-surface-page"
                      >
                        <span className="min-w-0">
                          <span className="block text-sm text-ink capitalize truncate">{d.concepto}</span>
                          <span className="pk-caption">
                            {d.cocheras ? `Cochera ${d.cocheras} · ` : ""}
                            {d.diasAtraso > 0 ? `${d.diasAtraso} d` : "vence hoy"}
                          </span>
                        </span>
                        <span className="text-sm font-bold text-danger-ink tabular-nums">{plata(d.saldo)}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="text-sm text-ink-muted">
                {cliente.abonosActivos > 0 ? "No debe nada." : "No tiene nada pendiente."}
              </p>
            )}
            <p className="pk-caption mt-3">
              Último pago:{" "}
              {cliente.ultimoPago ? `${fechaCorta(cliente.ultimoPago)} (${haceCuanto(cliente.ultimoPago)})` : "nunca"}
            </p>
          </Seccion>

          <Seccion
            titulo={`Abonos activos${abonos.length ? ` · ${abonos.length}` : ""}`}
            extra={cliente.abonadoDesde && <span className="pk-caption">abonado desde {fechaCorta(cliente.abonadoDesde)}</span>}
          >
            {cargando ? (
              <p className="pk-caption">Cargando…</p>
            ) : abonos.length === 0 ? (
              <p className="text-sm text-ink-muted">
                {cliente.abonosPendientes > 0 ? "Tiene un abono que todavía no empezó." : "Sin abonos activos."}
              </p>
            ) : (
              <div className="space-y-2">
                {abonos.map((a) => (
                  <AbonoItem key={a.abonoId ?? a.abonoCocheraId} abono={a} />
                ))}
              </div>
            )}
          </Seccion>

          {cliente.patentes.length > 0 && (
            <Seccion titulo="Vehículos">
              <div className="flex flex-wrap gap-1.5">
                {cliente.patentes.map((p) => (
                  <Patente key={p} valor={p} />
                ))}
              </div>
            </Seccion>
          )}

          <Seccion titulo="Datos">
            <dl className="space-y-1.5">
              <Dato label="DNI" valor={cliente.documento} />
              <Dato label="Domicilio" valor={cliente.domicilio} />
              <Dato label="Email" valor={cliente.email} />
              <Dato label="Teléfono" valor={cliente.telefono} />
            </dl>
            {!cliente.documento && !cliente.domicilio && !cliente.email && !cliente.telefono && (
              <p className="text-sm text-ink-muted">Sin datos de contacto cargados.</p>
            )}
            {cliente.observacion && (
              <p className="mt-3 text-sm text-ink-muted border-l-2 border-line-strong pl-3">{cliente.observacion}</p>
            )}
          </Seccion>
        </div>

        <footer className="px-5 py-3 border-t border-line-strong flex items-center gap-2">
          {cliente.activo ? (
            <>
              <button
                type="button"
                onClick={onEditar}
                className="inline-flex items-center gap-1.5 bg-brand text-brand-foreground hover:bg-brand-strong px-3 py-2 text-xs"
              >
                <Pencil size={13} /> Editar
              </button>
              <Link
                to={`/clientes/${cliente.clienteId}/cuenta-corriente`}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs text-ink-muted border border-line-strong"
              >
                <Wallet size={13} /> Cuenta corriente
              </Link>
              <button
                type="button"
                onClick={onDarDeBaja}
                disabled={cliente.abonosActivos > 0}
                title={cliente.abonosActivos > 0 ? "Tiene abonos activos. Primero hay que darlos de baja." : "Dar de baja"}
                className="ml-auto inline-flex items-center gap-1.5 px-2 py-2 text-xs font-semibold text-ink-muted hover:text-danger-ink disabled:opacity-35 disabled:hover:text-ink-muted"
              >
                <Trash2 size={13} /> Dar de baja
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={onReactivar}
              className="inline-flex items-center gap-1.5 bg-brand text-brand-foreground hover:bg-brand-strong px-3 py-2 text-xs"
            >
              <RotateCcw size={13} /> Reactivar
            </button>
          )}
        </footer>
      </aside>
    </div>
  );
}
