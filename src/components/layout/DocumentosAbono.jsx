import { useEffect, useMemo, useState } from "react";
import {
  FileText,
  Upload,
  Download,
  Trash2,
  Loader2,
  AlertCircle,
  Paperclip,
  Plus,
  X,
} from "lucide-react";
import { documentoService } from "../../services/documentoService";

/** @typedef {import("../../types").Documento} Documento */
import { vehiculosDe } from "../../utils/abonoHelpers";

const TIPOS = [
  { value: "Seguro", label: "Seguro", dueno: "Vehiculo" },
  { value: "Cedula", label: "Cédula", dueno: "Vehiculo" },
  { value: "Dni", label: "DNI", dueno: "Cliente" },
  { value: "ContratoFirmado", label: "Contrato firmado", dueno: "Abono" },
  { value: "Otro", label: "Otro", dueno: "Cualquiera" },
];

function labelTipo(tipo) {
  return TIPOS.find((t) => t.value === tipo)?.label || tipo;
}

function formatBytes(n) {
  if (!n && n !== 0) return "—";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function formatFecha(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

const fieldClass =
  "w-full text-xs border border-line-strong bg-surface-card px-2.5 py-2 text-ink focus:outline-none focus:border-brand";

/**
 * Panel vertical compacto de archivos adjuntos del abono.
 */
export default function DocumentosAbono({ abono }) {
  const abonoId = abono?.abonoId ?? abono?.abonoCocheraId;
  const clienteId = abono?.cliente?.clienteId ?? abono?.clienteId;
  const vehiculos = useMemo(() => vehiculosDe(abono) || [], [abono]);

  const [docs, setDocs] = useState(/** @type {Documento[]} */ ([]));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [subiendo, setSubiendo] = useState(false);
  const [mostrarCarga, setMostrarCarga] = useState(false);

  const [tipo, setTipo] = useState("Seguro");
  const [vehiculoId, setVehiculoId] = useState("");
  const [fechaVencimiento, setFechaVencimiento] = useState("");
  const [archivo, setArchivo] = useState(null);

  const tipoMeta = TIPOS.find((t) => t.value === tipo) || TIPOS[0];
  const necesitaVehiculo =
    tipoMeta.dueno === "Vehiculo" || (tipo === "Otro" && vehiculos.length > 0);

  useEffect(() => {
    if (!abonoId) return;
    cargar();
  }, [abonoId]);

  useEffect(() => {
    if (tipoMeta.dueno === "Vehiculo" && !vehiculoId && vehiculos[0]) {
      setVehiculoId(String(vehiculos[0].vehiculoId || vehiculos[0].id || ""));
    }
    if (tipoMeta.dueno === "Cliente" || tipoMeta.dueno === "Abono") {
      setVehiculoId("");
    }
  }, [tipo, vehiculos]);

  async function cargar() {
    try {
      setLoading(true);
      setError(null);
      const data = await documentoService.listarPorAbono(abonoId);
      setDocs(Array.isArray(data?.documentos) ? data.documentos : []);
    } catch (e) {
      const msg = e.response?.data;
      setError(typeof msg === "string" ? msg : "No se pudieron cargar los documentos");
    } finally {
      setLoading(false);
    }
  }

  const grupos = useMemo(() => {
    const map = new Map();
    for (const d of docs) {
      const key = d.grupoLabel || "Otros";
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(d);
    }
    return [...map.entries()];
  }, [docs]);

  async function handleSubir(e) {
    e.preventDefault();
    if (!archivo) {
      setError("Seleccioná un archivo");
      return;
    }

    const fd = new FormData();
    fd.append("archivo", archivo);
    fd.append("tipo", tipo);

    if (tipoMeta.dueno === "Vehiculo") {
      if (!vehiculoId) {
        setError("Seleccioná el vehículo del seguro/cédula");
        return;
      }
      fd.append("vehiculoId", vehiculoId);
    } else if (tipoMeta.dueno === "Cliente") {
      if (!clienteId) {
        setError("El abono no tiene cliente");
        return;
      }
      fd.append("clienteId", clienteId);
    } else if (tipoMeta.dueno === "Abono") {
      fd.append("abonoId", abonoId);
    } else if (vehiculoId) {
      fd.append("vehiculoId", vehiculoId);
    } else {
      fd.append("abonoId", abonoId);
    }

    if (fechaVencimiento) fd.append("fechaVencimiento", fechaVencimiento);

    try {
      setSubiendo(true);
      setError(null);
      await documentoService.subir(fd);
      setArchivo(null);
      setFechaVencimiento("");
      setMostrarCarga(false);
      await cargar();
    } catch (err) {
      const msg = err.response?.data;
      setError(typeof msg === "string" ? msg : err.message || "No se pudo subir");
    } finally {
      setSubiendo(false);
    }
  }

  function cerrarCarga() {
    setMostrarCarga(false);
    setArchivo(null);
    setFechaVencimiento("");
    setError(null);
  }

  async function handleDescargar(doc) {
    try {
      setBusyId(doc.documentoId);
      await documentoService.descargar(doc.documentoId, doc.nombreOriginal);
    } catch (err) {
      setError(err.message || "No se pudo descargar");
    } finally {
      setBusyId(null);
    }
  }

  async function handleEliminar(doc) {
    if (!window.confirm(`¿Eliminar "${doc.nombreOriginal}"?`)) return;
    try {
      setBusyId(doc.documentoId);
      await documentoService.eliminar(doc.documentoId);
      await cargar();
    } catch (err) {
      const msg = err.response?.data;
      setError(typeof msg === "string" ? msg : "No se pudo eliminar");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <aside className="bg-surface-card border border-line overflow-hidden flex flex-col max-h-[min(70vh,640px)]">
      <div className="px-3.5 py-3 border-b border-line flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <Paperclip size={15} className="text-ink-faint shrink-0" />
          <div className="min-w-0">
            <h2 className="text-xs font-bold text-ink tracking-tight">Archivos adjuntos</h2>
            <p className="text-[10px] text-ink-faint">{docs.length} archivo{docs.length === 1 ? "" : "s"}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => (mostrarCarga ? cerrarCarga() : setMostrarCarga(true))}
          title={mostrarCarga ? "Cerrar" : "Agregar documento"}
          className={`shrink-0 w-7 h-7 flex items-center justify-center transition-colors ${
            mostrarCarga
              ? "bg-surface-muted text-ink-muted hover:text-ink"
              : "bg-brand text-brand-foreground hover:bg-brand-strong"
          }`}
        >
          {mostrarCarga ? <X size={14} /> : <Plus size={14} />}
        </button>
      </div>

      {mostrarCarga && (
        <form
          onSubmit={handleSubir}
          className="px-3.5 py-3 border-b border-line bg-surface-muted/50 space-y-2.5 shrink-0"
        >
          <div>
            <label className="pk-label block mb-1">Tipo</label>
            <select value={tipo} onChange={(e) => setTipo(e.target.value)} className={fieldClass}>
              {TIPOS.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          {(tipoMeta.dueno === "Vehiculo" || tipo === "Otro") && (
            <div>
              <label className="pk-label block mb-1">
                Vehículo {tipo === "Otro" ? "(opc.)" : ""}
              </label>
              <select
                value={vehiculoId}
                onChange={(e) => setVehiculoId(e.target.value)}
                className={fieldClass}
                required={necesitaVehiculo && tipoMeta.dueno === "Vehiculo"}
              >
                <option value="">{tipo === "Otro" ? "— Abono —" : "Elegir…"}</option>
                {vehiculos.map((v) => {
                  const id = v.vehiculoId ?? v.id;
                  return (
                    <option key={id} value={id}>
                      {v.patente || `Vehículo #${id}`}
                    </option>
                  );
                })}
              </select>
            </div>
          )}

          {tipo === "Seguro" && (
            <div>
              <label className="pk-label block mb-1">Vencimiento</label>
              <input
                type="date"
                value={fechaVencimiento}
                onChange={(e) => setFechaVencimiento(e.target.value)}
                className={fieldClass}
              />
            </div>
          )}

          <div>
            <label className="pk-label block mb-1">Archivo</label>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/*"
              onChange={(e) => setArchivo(e.target.files?.[0] || null)}
              className="w-full text-[11px] text-ink-muted file:mr-2 file:py-1.5 file:px-2.5 file:border-0 file:bg-brand-muted file:text-ink file:text-[10px] file:font-semibold"
            />
          </div>

          <button
            type="submit"
            disabled={subiendo || !archivo}
            className="w-full inline-flex items-center justify-center gap-1.5 bg-brand hover:bg-brand-strong disabled:opacity-40 text-brand-foreground text-xs font-semibold px-3 py-2 transition-colors"
          >
            {subiendo ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
            Subir
          </button>
        </form>
      )}

      {error && (
        <div className="mx-3 mt-2 flex items-start gap-1.5 text-[11px] text-danger-ink bg-danger-muted px-2.5 py-2 shrink-0">
          <AlertCircle size={12} className="mt-0.5 shrink-0" />
          <span className="flex-1">{error}</span>
          <button type="button" className="underline shrink-0" onClick={() => setError(null)}>
            ×
          </button>
        </div>
      )}

      <div className="p-3 overflow-y-auto flex-1 min-h-0">
        {loading ? (
          <div className="flex items-center gap-2 text-xs text-ink-faint py-4">
            <Loader2 size={13} className="animate-spin" /> Cargando…
          </div>
        ) : docs.length === 0 ? (
          <p className="text-xs text-ink-faint py-4 text-center leading-relaxed">
            Sin archivos todavía.
            <br />
            Seguros, DNI, contrato…
          </p>
        ) : (
          <div className="space-y-4">
            {grupos.map(([grupo, items]) => (
              <div key={grupo}>
                <p className="pk-label mb-1.5">{grupo}</p>
                <ul className="space-y-1.5">
                  {items.map((d) => (
                    <li
                      key={d.documentoId}
                      className="flex items-start gap-2 px-2 py-2 bg-surface-muted/60 hover:bg-surface-muted transition-colors"
                    >
                      <FileText size={14} className="text-ink-muted shrink-0 mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-semibold text-ink truncate leading-tight">
                          {d.nombreOriginal}
                        </p>
                        <p className="text-[10px] text-ink-faint mt-0.5 leading-snug">
                          {labelTipo(d.tipo)} · {formatBytes(d.tamanoBytes)}
                          {d.fechaVencimiento ? ` · vence ${formatFecha(d.fechaVencimiento)}` : ""}
                        </p>
                      </div>
                      <div className="flex flex-col gap-0.5 shrink-0">
                        <button
                          type="button"
                          title="Descargar"
                          disabled={busyId === d.documentoId}
                          onClick={() => handleDescargar(d)}
                          className="p-1 text-ink-faint hover:text-ink"
                        >
                          {busyId === d.documentoId ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : (
                            <Download size={12} />
                          )}
                        </button>
                        <button
                          type="button"
                          title="Eliminar"
                          disabled={busyId === d.documentoId}
                          onClick={() => handleEliminar(d)}
                          className="p-1 text-ink-faint hover:text-danger"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
