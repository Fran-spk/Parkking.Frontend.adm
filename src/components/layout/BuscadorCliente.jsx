import { useState, useEffect, useRef } from "react";
import { Plus, X } from "lucide-react";
import { clienteService } from "../../services/clienteService";
import { fieldClass } from "./FilterSelect";

/** @typedef {import("../../types").Cliente} Cliente */

export default function BuscadorCliente({ onSeleccionar, size = "md" }) {
  const [busqueda, setBusqueda] = useState("");
  const [resultados, setResultados] = useState(/** @type {Cliente[]} */ ([]));
  const [seleccionado, setSeleccionado] = useState(/** @type {Cliente | null} */ (null));
  const [creando, setCreando] = useState(false);
  const [nuevoCliente, setNuevoCliente] = useState({
    documento: "",
    domicilio: "",
    telefono: "",
    email: "",
  });
  const [guardando, setGuardando] = useState(false);
  const [abierto, setAbierto] = useState(false);
  const ref = useRef(null);
  const inputPad = size === "lg" ? "py-2.5" : "";

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setAbierto(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    if (!busqueda || busqueda.trim() === "" || seleccionado) {
      setResultados([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const data = await clienteService.getAll();
        const filtrados = data.filter(c => {
          const q = busqueda.toLowerCase();
          const nombreOk = c.nombre?.toLowerCase().includes(q);
          const docOk = c.documento?.includes(busqueda);
          const telOk = c.telefono?.includes(busqueda);
          return nombreOk || docOk || telOk;
        });
        setResultados(filtrados.slice(0, 6));
        setAbierto(true);
      } catch { /* ignore */ }
    }, 280);
    return () => clearTimeout(timer);
  }, [busqueda, seleccionado]);

  function seleccionar(cliente) {
    setSeleccionado(cliente);
    setBusqueda(cliente.nombre || "");
    setAbierto(false);
    setCreando(false);
    onSeleccionar(cliente);
  }

  function limpiar() {
    setSeleccionado(null);
    setBusqueda("");
    setCreando(false);
    setNuevoCliente({ documento: "", domicilio: "", telefono: "", email: "" });
    onSeleccionar(null);
  }

  async function handleCrear() {
    if (!busqueda.trim()) return;
    try {
      setGuardando(true);
      const creado = await clienteService.agregar({
        nombre: busqueda.trim(),
        documento: nuevoCliente.documento.trim() || null,
        domicilio: nuevoCliente.domicilio.trim() || null,
        telefono: nuevoCliente.telefono.trim() || null,
        email: nuevoCliente.email.trim() || null,
      });
      seleccionar(creado);
    } catch { /* ignore */ } finally {
      setGuardando(false);
    }
  }

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        <input
          type="text"
          value={busqueda || ""}
          onChange={e => {
            setBusqueda(e.target.value);
            setSeleccionado(null);
            onSeleccionar(null);
          }}
          onFocus={() => busqueda && !seleccionado && setAbierto(true)}
          placeholder="Buscar por nombre o teléfono..."
          className={`${fieldClass} pr-10 ${inputPad} ${seleccionado ? "border-success bg-success-muted" : ""}`}
        />
        {seleccionado ? (
          <button type="button" onClick={limpiar} className="pk-icon-btn absolute right-2 top-1/2 -translate-y-1/2 p-1 text-success-ink" title="Cambiar cliente">
            <X size={15} />
          </button>
        ) : busqueda ? (
          <button type="button" onClick={limpiar} className="pk-icon-btn absolute right-2 top-1/2 -translate-y-1/2 p-1 text-ink-faint hover:text-ink">
            <X size={15} />
          </button>
        ) : null}
      </div>

      {abierto && busqueda && !seleccionado && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-surface-card border border-line-strong z-20 overflow-hidden">
          {resultados.map(c => (
            <button
              key={c.clienteId}
              type="button"
              onClick={() => seleccionar(c)}
              className="w-full text-left px-3 py-2.5 text-sm hover:bg-surface-page border-b border-line last:border-0"
            >
              <p className="font-semibold text-ink">{c.nombre}</p>
              <p className="pk-caption">
                {[c.documento && `DNI ${c.documento}`, c.telefono].filter(Boolean).join(" · ") || "\u00a0"}
              </p>
            </button>
          ))}
          <button
            type="button"
            onClick={() => { setCreando(true); setAbierto(false); }}
            className="w-full text-left px-3 py-2.5 text-sm font-semibold text-brand hover:bg-surface-page flex items-center gap-2"
          >
            <Plus size={15} /> Crear “{busqueda}”
          </button>
        </div>
      )}

      {creando && !seleccionado && (
        <div className="mt-3 bg-surface-page border-l-[3px] border-l-brand px-4 py-3 space-y-2">
          <p className="pk-label">Nuevo cliente · {busqueda}</p>
          <input
            type="text"
            value={nuevoCliente.documento || ""}
            onChange={e => setNuevoCliente(p => ({ ...p, documento: e.target.value }))}
            placeholder="DNI (opcional)"
            className={fieldClass}
          />
          <input
            type="text"
            value={nuevoCliente.domicilio || ""}
            onChange={e => setNuevoCliente(p => ({ ...p, domicilio: e.target.value }))}
            placeholder="Domicilio (opcional)"
            className={fieldClass}
          />
          <input
            type="text"
            value={nuevoCliente.telefono || ""}
            onChange={e => setNuevoCliente(p => ({ ...p, telefono: e.target.value }))}
            placeholder="Teléfono (opcional)"
            className={fieldClass}
          />
          <input
            type="text"
            value={nuevoCliente.email || ""}
            onChange={e => setNuevoCliente(p => ({ ...p, email: e.target.value }))}
            placeholder="Email (opcional)"
            className={fieldClass}
          />
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={() => setCreando(false)} className="flex-1 px-3 py-2 text-xs font-semibold text-ink-muted border border-line-strong">
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleCrear}
              disabled={guardando}
              className="flex-1 px-3 py-2 text-xs font-semibold text-brand-foreground bg-brand hover:bg-brand-strong disabled:opacity-50"
            >
              {guardando ? "Creando…" : "Crear y seleccionar"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
