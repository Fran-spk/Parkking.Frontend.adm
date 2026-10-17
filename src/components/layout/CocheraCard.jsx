import { Link } from "react-router-dom";
import Patente from "./Patente";
import {
  ESTADOS_COCHERA,
  cocheraConDeuda,
  cocheraVacia,
  estadoCochera,
  fechaCorta,
  plataEntera,
} from "../../utils/cocheraHelpers";

function Cupos({ ocupados, capacidad }) {
  return (
    <div className="flex items-center gap-1.5" title={`${ocupados} de ${capacidad} cupos`}>
      <div className="flex gap-0.5">
        {Array.from({ length: capacidad }).map((_, i) => (
          <span key={i} className={`h-1.5 w-3 ${i < ocupados ? "bg-ink" : "bg-surface-muted border border-line-strong"}`} />
        ))}
      </div>
      <span className="pk-caption text-ink-muted tabular-nums">
        {ocupados}/{capacidad}
      </span>
    </div>
  );
}

function Ocupante({ ocupante, deuda }) {
  return (
    <div className="space-y-1">
      <div className="flex items-baseline justify-between gap-2">
        <Link to={`/pagosAbono/${ocupante.abonoId}`} className="text-sm font-semibold text-ink hover:text-brand truncate">
          {ocupante.clienteNombre}
        </Link>
        <span className="pk-caption text-ink-faint tabular-nums shrink-0">desde {fechaCorta(ocupante.fechaInicio)}</span>
      </div>
      <div className="flex flex-wrap items-center gap-1">
        {(ocupante.patentes || []).length === 0 ? (
          <span className="pk-caption text-ink-faint">Sin vehículo</span>
        ) : (
          ocupante.patentes.map((p) => <Patente key={p} valor={p} size="sm" />)
        )}
      </div>
      {deuda ? (
        <p className="pk-caption text-danger-ink font-semibold">
          Debe {plataEntera(deuda.saldoTotal)}
          {deuda.periodosAdeudados
            ? ` · ${deuda.periodosAdeudados} ${deuda.periodosAdeudados === 1 ? "período" : "períodos"}`
            : ""}
          {deuda.diasAtraso ? ` · ${deuda.diasAtraso} días` : ""}
        </p>
      ) : null}
    </div>
  );
}

function Reserva({ reserva }) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <Link to={`/reservas/${reserva.reservaId}`} className="text-sm font-semibold text-warning-ink hover:underline truncate">
          Reserva · {reserva.nombre}
        </Link>
        {reserva.automatica ? <span className="pk-label text-ink-faint shrink-0">Automática</span> : null}
      </div>
      <p className="pk-caption text-ink-muted tabular-nums">
        {fechaCorta(reserva.fechaInicio)} al {fechaCorta(reserva.fechaVencimiento)}
      </p>
    </div>
  );
}

export default function CocheraCard({ cochera, categoria, tipos, deudas, onDarDeBaja, dandoDeBaja }) {
  const estado = estadoCochera(cochera);
  const meta = ESTADOS_COCHERA[estado];
  const ocupantes = cochera.ocupantes || [];
  const reservas = cochera.reservas || [];
  const capacidad = cochera.capacidadMaxima ?? 1;
  const ocupados = Math.min(cochera.cuposOcupados ?? ocupantes.length + reservas.length, capacidad);
  const vacia = cocheraVacia(cochera);
  const debe = cocheraConDeuda(cochera, deudas);
  const permitidos = (cochera.vehiculosPermitidosIds || []).map((id) => tipos.get(id)).filter(Boolean);
  const ubicacion = [categoria, cochera.zona?.nombre].filter(Boolean).join(" · ");

  return (
    <article className={`flex flex-col bg-surface-card border border-line border-l-[3px] ${debe ? "border-l-danger" : meta.borde}`}>
      <header className="flex items-start justify-between gap-2 px-4 pt-3">
        <div className="min-w-0">
          <p className="text-2xl font-black tracking-tight leading-none text-ink tabular-nums">{cochera.numero}</p>
          <p className="pk-caption text-ink-faint mt-1 truncate">{ubicacion || "Sin categoría"}</p>
        </div>
        <div className="text-right shrink-0 space-y-1.5">
          <p className={`pk-label ${meta.texto}`}>{meta.label}</p>
          {cochera.multipleOcupacion ? <Cupos ocupados={ocupados} capacidad={capacidad} /> : null}
        </div>
      </header>

      <div className="px-4 py-3 flex-1 space-y-2.5">
        {ocupantes.map((o) => (
          <Ocupante key={o.abonoId} ocupante={o} deuda={deudas.get(o.abonoId)} />
        ))}

        {reservas.length > 0 && (
          <div className={`space-y-2 ${ocupantes.length > 0 ? "border-t border-dashed border-line-strong pt-2" : ""}`}>
            {reservas.map((r) => (
              <Reserva key={r.reservaId} reserva={r} />
            ))}
          </div>
        )}

        {vacia ? (
          <p className="text-sm text-ink-faint">{estado === "interno" ? "No se ofrece a abonos." : "Sin abono ni reserva."}</p>
        ) : null}

        {cochera.observacion ? (
          <p className="pk-caption text-ink-muted border-l-2 border-line-strong pl-2 line-clamp-2">{cochera.observacion}</p>
        ) : null}
      </div>

      <footer className="flex items-center justify-between gap-3 px-4 py-2 border-t border-line">
        <span className="pk-caption text-ink-faint truncate" title={permitidos.join(", ")}>
          {permitidos.length > 0 ? permitidos.join(", ") : "Todos los vehículos"}
        </span>
        <div className="flex items-center gap-3 shrink-0">
          {vacia ? (
            <button
              type="button"
              disabled={dandoDeBaja}
              onClick={() => onDarDeBaja?.(cochera)}
              className="text-xs font-semibold text-ink-muted hover:text-danger-ink disabled:opacity-40"
            >
              {dandoDeBaja ? "Dando de baja…" : "Dar de baja"}
            </button>
          ) : null}
          <Link to={`/cocheras/${cochera.cocheraId}`} className="text-xs font-semibold text-brand hover:text-brand-strong">
            Ver más
          </Link>
        </div>
      </footer>
    </article>
  );
}
