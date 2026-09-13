import { useState, useEffect, useRef } from "react";
import { Plus, X, CheckCircle2 } from "lucide-react";
import { clienteService } from "../../services/clienteService";

export default function BuscadorCliente({ onSeleccionar, size = "md" }) {
  const [busqueda, setBusqueda] = useState("");
  const [resultados, setResultados] = useState([]);
  const [seleccionado, setSeleccionado] = useState(null);
  const [creando, setCreando] = useState(false);
  const [nuevoCliente, setNuevoCliente] = useState({ telefono: "", email: "" });
  const [guardando, setGuardando] = useState(false);
  const [abierto, setAbierto] = useState(false);
  const ref = useRef(null);
  const inputPad = size === "lg" ? "px-4 py-3.5 text-[15px]" : "px-3 py-2.5 text-sm";

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
          const nombreOk = c.nombre?.toLowerCase().includes(busqueda.toLowerCase());
          const telOk = c.telefono?.includes(busqueda);
          return nombreOk || telOk;
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
    setNuevoCliente({ telefono: "", email: "" });
    onSeleccionar(null);
  }

  async function handleCrear() {
    if (!busqueda.trim()) return;
    try {
      setGuardando(true);
      const creado = await clienteService.agregar({
        nombre: busqueda.trim(),
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
          className={`w-full border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-400 pr-10 transition-all ${inputPad} ${
            seleccionado
              ? "border-emerald-300 bg-emerald-50/80"
              : "border-slate-200 bg-white"
          }`}
        />
        {seleccionado ? (
          <button type="button" onClick={limpiar} className="absolute right-3 top-1/2 -translate-y-1/2" title="Cambiar cliente">
            <CheckCircle2 size={18} className="text-emerald-500 hover:text-red-400 transition-colors" />
          </button>
        ) : busqueda ? (
          <button type="button" onClick={limpiar} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
            <X size={16} />
          </button>
        ) : null}
      </div>

      {abierto && busqueda && !seleccionado && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 rounded-2xl shadow-xl shadow-slate-200/50 z-20 overflow-hidden">
          {resultados.map(c => (
            <button
              key={c.clienteId}
              type="button"
              onClick={() => seleccionar(c)}
              className="w-full text-left px-4 py-3 text-sm hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0"
            >
              <p className="font-semibold text-slate-800">{c.nombre}</p>
              {c.telefono && <p className="text-xs text-slate-400 mt-0.5">{c.telefono}</p>}
            </button>
          ))}
          <button
            type="button"
            onClick={() => { setCreando(true); setAbierto(false); }}
            className="w-full text-left px-4 py-3 text-sm text-indigo-600 hover:bg-indigo-50 transition-colors flex items-center gap-2 font-medium"
          >
            <Plus size={15} /> Crear “{busqueda}”
          </button>
        </div>
      )}

      {creando && !seleccionado && (
        <div className="mt-3 p-4 bg-indigo-50/80 border border-indigo-100 rounded-2xl space-y-3">
          <p className="text-xs font-semibold text-indigo-700">Nuevo cliente · {busqueda}</p>
          <input
            type="text"
            value={nuevoCliente.telefono || ""}
            onChange={e => setNuevoCliente(p => ({ ...p, telefono: e.target.value }))}
            placeholder="Teléfono (opcional)"
            className="w-full text-sm border border-indigo-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 bg-white"
          />
          <input
            type="text"
            value={nuevoCliente.email || ""}
            onChange={e => setNuevoCliente(p => ({ ...p, email: e.target.value }))}
            placeholder="Email (opcional)"
            className="w-full text-sm border border-indigo-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 bg-white"
          />
          <div className="flex gap-2">
            <button type="button" onClick={() => setCreando(false)} className="flex-1 text-xs font-medium text-slate-500 border border-slate-200 rounded-xl py-2.5 hover:bg-white transition-colors">
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleCrear}
              disabled={guardando}
              className="flex-1 text-xs font-semibold text-white bg-indigo-600 rounded-xl py-2.5 hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {guardando ? "Creando..." : "Crear y seleccionar"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
