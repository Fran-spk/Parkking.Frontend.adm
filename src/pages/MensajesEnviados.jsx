import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, ChevronRight, RefreshCw } from "lucide-react";
import PageHeader, { PageHeaderAction } from "../components/layout/PageHeader";
import SearchField from "../components/layout/SearchField";
import FiltroSegmentado from "../components/layout/FiltroSegmentado";
import Paginacion, { paginaDe } from "../components/layout/Paginacion";
import { mensajeService } from "../services/mensajeService";
import { fechaCorta } from "../utils/clienteHelpers";

/** @typedef {import("../types").Mensaje} Mensaje */

const TIPOS = [
  { value: "todos", label: "Todos" },
  { value: "Recibo", label: "Recibos" },
  { value: "Reporte", label: "Reportes" },
  { value: "ActualizacionTarifas", label: "Tarifas" },
];

const ESTADOS = [
  { value: "todos", label: "Todos" },
  { value: "Enviado", label: "Enviado" },
  { value: "Error", label: "Error" },
  { value: "Simulado", label: "Simulado" },
];

function hora(fecha) {
  if (!fecha) return "";
  return new Date(fecha).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
}

function labelTipo(tipo) {
  if (tipo === "Recibo") return "Recibo";
  if (tipo === "Reporte") return "Reporte";
  if (tipo === "ActualizacionTarifas") return "Tarifas";
  return tipo || "—";
}

function bordeEstado(m) {
  const e = String(m.estado || "").toLowerCase();
  if (m.simulado || e === "simulado") return "border-l-warning";
  if (e === "error") return "border-l-danger";
  if (e === "enviado") return "border-l-success";
  return "border-l-brand";
}

function labelEstado(m) {
  const e = String(m.estado || "").toLowerCase();
  if (m.simulado || e === "simulado") return "Simulado";
  if (e === "enviado") return "Enviado";
  if (e === "error") return "Error";
  return m.estado || "—";
}

function tonoEstado(m) {
  const e = String(m.estado || "").toLowerCase();
  if (m.simulado || e === "simulado") return "text-warning-ink";
  if (e === "error") return "text-danger-ink";
  return "text-ink";
}

function Vacio({ texto }) {
  return <div className="bg-surface-card px-4 py-16 text-center text-sm font-medium text-ink-muted">{texto}</div>;
}

function FlechaError({ abierto, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={abierto}
      title={abierto ? "Ocultar detalle" : "Ver detalle"}
      className="pk-icon-btn p-0.5 text-ink-faint hover:text-ink"
    >
      {abierto ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
    </button>
  );
}

function FilaMensaje({ m }) {
  const [abierto, setAbierto] = useState(false);
  const tieneError = Boolean(m.error);

  return (
    <>
      <tr className="border-b border-line hover:bg-surface-page">
        <td className={`pl-4 pr-3 py-2.5 overflow-hidden border-l-[3px] ${bordeEstado(m)}`}>
          <p className="font-semibold text-ink tabular-nums">{fechaCorta(m.fecha)}</p>
          <p className="pk-caption tabular-nums">{hora(m.fecha)}</p>
        </td>
        <td className="px-3 py-2.5 overflow-hidden font-semibold text-ink">{labelTipo(m.tipo)}</td>
        <td className="px-3 py-2.5 overflow-hidden">
          <div className="flex items-center gap-1">
            <p className={`font-semibold ${tonoEstado(m)}`}>{labelEstado(m)}</p>
            {tieneError && <FlechaError abierto={abierto} onToggle={() => setAbierto((v) => !v)} />}
          </div>
        </td>
        <td className="px-3 py-2.5 overflow-hidden">
          <p className="font-semibold text-ink truncate">{m.destinatario || "—"}</p>
          {m.reciboId ? (
            <Link to="/recibos" className="pk-caption text-brand">
              Recibo #{m.reciboId}
            </Link>
          ) : m.abonoId ? (
            <Link to={`/pagosAbono/${m.abonoId}`} className="pk-caption text-brand">
              Abono #{m.abonoId}
            </Link>
          ) : null}
        </td>
        <td className="px-3 py-2.5 overflow-hidden">
          <p className="text-ink truncate">{m.asunto || "—"}</p>
        </td>
      </tr>
      {tieneError && abierto && (
        <tr className="border-b border-line">
          <td colSpan={5} className="px-4 py-2 bg-danger-muted text-danger-ink text-xs">
            {m.error}
          </td>
        </tr>
      )}
    </>
  );
}

function TarjetaMensaje({ m }) {
  const [abierto, setAbierto] = useState(false);
  const tieneError = Boolean(m.error);

  return (
    <li className={`border-l-[3px] ${bordeEstado(m)}`}>
      <div className="px-4 py-3">
        <div className="flex items-baseline justify-between gap-3">
          <span className="font-semibold text-ink">{labelTipo(m.tipo)}</span>
          <span className={`pk-caption font-semibold inline-flex items-center gap-1 ${tonoEstado(m)}`}>
            {labelEstado(m)}
            {tieneError && <FlechaError abierto={abierto} onToggle={() => setAbierto((v) => !v)} />}
          </span>
        </div>
        <p className="pk-caption mt-0.5 truncate">{m.destinatario || "Sin destinatario"}</p>
        <p className="pk-caption truncate">{m.asunto || "—"}</p>
        <p className="pk-caption tabular-nums">
          {fechaCorta(m.fecha)} · {hora(m.fecha)}
        </p>
      </div>
      {tieneError && abierto && <p className="px-4 pb-3 pk-caption text-danger-ink">{m.error}</p>}
    </li>
  );
}

export default function MensajesEnviados() {
  const [items, setItems] = useState(/** @type {Mensaje[]} */ ([]));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tipo, setTipo] = useState("todos");
  const [estado, setEstado] = useState("todos");
  const [busqueda, setBusqueda] = useState("");
  const [pagina, setPagina] = useState(1);

  const cargar = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await mensajeService.listar({
        tipo: tipo === "todos" ? undefined : tipo,
        estado: estado === "todos" ? undefined : estado,
        take: 200,
      });
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      const data = e.response?.data;
      setError((typeof data === "string" && data) || data?.error || "No se pudieron cargar los mensajes");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [tipo, estado]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const visibles = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return items;
    return items.filter((m) =>
      [m.destinatario, m.asunto, m.tipo, m.estado, m.error].some((v) => String(v || "").toLowerCase().includes(q))
    );
  }, [items, busqueda]);

  const paginaClave = `${tipo}|${estado}|${busqueda}`;
  useEffect(() => {
    setPagina(1);
  }, [paginaClave]);

  const visPage = paginaDe(visibles, pagina);
  const enviados = items.filter((m) => !m.simulado && String(m.estado).toLowerCase() === "enviado").length;
  const errores = items.filter((m) => String(m.estado).toLowerCase() === "error").length;
  const simulados = items.filter((m) => m.simulado || String(m.estado).toLowerCase() === "simulado").length;

  return (
    <div className="space-y-5 pb-12 animate-fade-in-up">
      <PageHeader
        title="Mensajes enviados"
        description="Auditoría de mails del estacionamiento: recibos, reportes y avisos."
        action={
          <PageHeaderAction onClick={cargar} disabled={loading}>
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Actualizar
          </PageHeaderAction>
        }
        loading={loading}
        stats={[
          { label: "Listados", value: items.length, onClick: () => setEstado("todos") },
          { label: "Enviados", value: enviados, tone: "success", onClick: () => setEstado("Enviado") },
          { label: "Errores", value: errores, tone: errores > 0 ? "danger" : "default", onClick: () => setEstado("Error") },
          { label: "Simulados", value: simulados, tone: simulados > 0 ? "warning" : "default", onClick: () => setEstado("Simulado") },
        ]}
      />

      <div className="flex flex-wrap items-end gap-3">
        <SearchField value={busqueda} onChange={setBusqueda} placeholder="Destinatario, asunto o error" className="w-full sm:w-80" />
        <FiltroSegmentado ariaLabel="Tipo" value={tipo} onChange={setTipo} opciones={TIPOS} />
        <FiltroSegmentado ariaLabel="Estado" value={estado} onChange={setEstado} opciones={ESTADOS} />
      </div>

      {error && <p className="px-4 py-3 bg-danger-muted text-danger-ink text-sm">{error}</p>}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <div className="w-9 h-9 border-2 border-brand-soft border-t-brand animate-spin" />
          <span className="pk-caption">Cargando mensajes…</span>
        </div>
      ) : items.length === 0 ? (
        <Vacio texto="No hay mensajes con estos filtros." />
      ) : visibles.length === 0 ? (
        <Vacio texto="Ningún mensaje coincide con la búsqueda." />
      ) : (
        <>
          <div className="hidden md:block bg-surface-card overflow-x-auto">
            <table className="w-full text-sm table-fixed">
              <colgroup>
                <col className="w-[16%]" />
                <col className="w-[12%]" />
                <col className="w-[12%]" />
                <col className="w-[24%]" />
                <col className="w-[36%]" />
              </colgroup>
              <thead>
                <tr className="border-b border-line-strong text-left">
                  <th className="pk-label font-bold pl-4 pr-3 py-2.5">Fecha</th>
                  <th className="pk-label font-bold px-3 py-2.5">Tipo</th>
                  <th className="pk-label font-bold px-3 py-2.5">Estado</th>
                  <th className="pk-label font-bold px-3 py-2.5">Destinatario</th>
                  <th className="pk-label font-bold px-3 py-2.5">Asunto</th>
                </tr>
              </thead>
              <tbody>
                {visPage.map((m) => (
                  <FilaMensaje key={m.mensajeId} m={m} />
                ))}
              </tbody>
            </table>
          </div>

          <ul className="md:hidden bg-surface-card divide-y divide-line">
            {visPage.map((m) => (
              <TarjetaMensaje key={m.mensajeId} m={m} />
            ))}
          </ul>

          <Paginacion pagina={pagina} total={visibles.length} onChange={setPagina} />
        </>
      )}
    </div>
  );
}
