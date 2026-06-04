import { useState, useEffect, useRef } from "react";
import { X, Plus, AlertCircle, CheckCircle2 } from "lucide-react";
import DatePicker from "react-datepicker";
import { es } from "date-fns/locale";
import "react-datepicker/dist/react-datepicker.css";

import { clienteService } from "../../services/clienteService";
import { cocheraService } from "../../services/cocheraService";
import { tipoVehiculoService } from "../../services/tipoVehiculoService";
import { tarifaMensualService } from "../../services/tarifaMensualService";
import { abonoService } from "../../services/abonoService";

function BuscadorCliente({ onSeleccionar }) {
  const [busqueda, setBusqueda] = useState("");
  const [resultados, setResultados] = useState([]);
  const [seleccionado, setSeleccionado] = useState(null);
  const [creando, setCreando] = useState(false);
  const [nuevoCliente, setNuevoCliente] = useState({ telefono: "", email: "" });
  const [guardando, setGuardando] = useState(false);
  const [abierto, setAbierto] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClick(e) { if (ref.current && !ref.current.contains(e.target)) setAbierto(false); }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    if (!busqueda || busqueda.trim() === "" || seleccionado) { setResultados([]); return; }
    const timer = setTimeout(async () => {
      try {
        const data = await clienteService.getAll();
        const filtrados = data.filter(c => {
          const nombreOk = c.nombre ? c.nombre.toLowerCase().includes(busqueda.toLowerCase()) : false;
          const telOk = c.telefono ? c.telefono.includes(busqueda) : false;
          return nombreOk || telOk;
        });
        setResultados(filtrados.slice(0, 5));
        setAbierto(true);
      } catch {}
    }, 300);
    return () => clearTimeout(timer);
  }, [busqueda, seleccionado]);

  function seleccionar(cliente) {
    setSeleccionado(cliente);
    setBusqueda(cliente.nombre || "");
    setAbierto(false);
    setCreando(false);
    onSeleccionar(cliente.clienteId);
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
    } catch {} finally { setGuardando(false); }
  }

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        <input
          type="text"
          value={busqueda || ""}
          onChange={e => { setBusqueda(e.target.value); setSeleccionado(null); onSeleccionar(null); }}
          onFocus={() => busqueda && !seleccionado && setAbierto(true)}
          placeholder="Buscar por nombre o teléfono..."
          className={`w-full text-sm border rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 pr-8 ${
            seleccionado ? "border-green-300 bg-green-50" : "border-gray-200"
          }`}
        />
        {seleccionado ? (
          <button onClick={limpiar} className="absolute right-2.5 top-1/2 -translate-y-1/2">
            <CheckCircle2 size={16} className="text-green-500 hover:text-red-400 transition-colors" />
          </button>
        ) : busqueda && (
          <button onClick={limpiar} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <X size={14} />
          </button>
        )}
      </div>

      {abierto && busqueda && !seleccionado && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-100 rounded-xl shadow-lg z-10 overflow-hidden">
          {resultados.map(c => (
            <button key={c.clienteId} onClick={() => seleccionar(c)} className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0">
              <p className="font-medium text-gray-800">{c.nombre}</p>
              {c.telefono && <p className="text-xs text-gray-400">{c.telefono}</p>}
            </button>
          ))}
          <button onClick={() => { setCreando(true); setAbierto(false); }} className="w-full text-left px-4 py-2.5 text-sm text-indigo-600 hover:bg-indigo-50 transition-colors flex items-center gap-2">
            <Plus size={14} /> Crear "{busqueda}"
          </button>
        </div>
      )}

      {creando && !seleccionado && (
        <div className="mt-2 p-3 bg-indigo-50 border border-indigo-100 rounded-xl space-y-2">
          <p className="text-xs font-medium text-indigo-700">Crear cliente: {busqueda}</p>
          <input type="text" value={nuevoCliente.telefono || ""} onChange={e => setNuevoCliente(p => ({ ...p, telefono: e.target.value }))} placeholder="Teléfono (opcional)" className="w-full text-sm border border-indigo-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 bg-white" />
          <input type="text" value={nuevoCliente.email || ""} onChange={e => setNuevoCliente(p => ({ ...p, email: e.target.value }))} placeholder="Email (opcional)" className="w-full text-sm border border-indigo-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 bg-white" />
          <div className="flex gap-2">
            <button onClick={() => setCreando(false)} className="flex-1 text-xs text-gray-500 border border-gray-200 rounded-lg py-1.5 hover:bg-white transition-colors">Cancelar</button>
            <button onClick={handleCrear} disabled={guardando} className="flex-1 text-xs text-white bg-indigo-600 rounded-lg py-1.5 hover:bg-indigo-700 transition-colors disabled:opacity-50">{guardando ? "Creando..." : "Crear y seleccionar"}</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ModalNuevoAbono({ onClose, onCreado }) {
  const [clienteId, setClienteId] = useState(null);
  const [cocheraId, setCocheraId] = useState("");
  const [tipoVehiculoId, setTipoVehiculoId] = useState("");
  const [patente, setPatente] = useState("");
  const [modeloVehiculo, setModeloVehiculo] = useState("");
  const [cobrador, setCobrador] = useState("");
  const [fechaInicio, setFechaInicio] = useState(new Date());
  const [comenzarMesSiguiente, setComenzarMesSiguiente] = useState(false); // Flag de cortesía
  const [precioAcordado, setPrecioAcordado] = useState("");
  const [precioSugerido, setPrecioSugerido] = useState(null);
  const [esFallback, setEsFallback] = useState(false);
  const [cocheras, setCocheras] = useState([]);
  const [tipos, setTipos] = useState([]);
  const [loadingCocheras, setLoadingCocheras] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    tipoVehiculoService.getAll()
      .then(setTipos)
      .catch(() => setError("No se pudieron cargar los tipos de vehículos"));
  }, []);

  useEffect(() => {
    if (!tipoVehiculoId) { setCocheras([]); setCocheraId(""); return; }
    async function cargarCocheras() {
      try {
        setLoadingCocheras(true);
        const data = await cocheraService.getLibresByVehiculo(tipoVehiculoId);
        setCocheras(data);
        if (cocheraId && !data.some(c => c.cocheraId === Number(cocheraId))) setCocheraId("");
      } catch { setError("Error al consultar cocheras disponibles"); }
      finally { setLoadingCocheras(false); }
    }
    cargarCocheras();
  }, [tipoVehiculoId]);

  useEffect(() => {
    if (!tipoVehiculoId) { setPrecioSugerido(null); return; }
    const cochera = cocheras.find(c => c.cocheraId === Number(cocheraId));
    tarifaMensualService
      .getVigente(tipoVehiculoId, cochera?.categoriaCocheraId ?? null)
      .then(t => { setPrecioSugerido(t.precio); setEsFallback(t.esFallback); setPrecioAcordado(""); })
      .catch(() => { setPrecioSugerido(null); setEsFallback(false); });
  }, [tipoVehiculoId, cocheraId, cocheras]);

  // Evaluamos de forma reactiva si corresponde sugerir saltear el mes actual (Día 20 en adelante)
  const esFinDeMes = fechaInicio && fechaInicio.getDate() >= 20;

  // Si cambia la fecha y deja de ser fin de mes, reseteamos el checkbox automáticamente
  useEffect(() => {
    if (fechaInicio && fechaInicio.getDate() < 20) {
      setComenzarMesSiguiente(false);
    }
  }, [fechaInicio]);

  function formatearFechaString(dateObj) {
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, "0");
    const d = String(dateObj.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  async function handleGuardar() {
    if (!clienteId) return setError("Seleccioná un cliente");
    if (!tipoVehiculoId) return setError("Seleccioná el tipo de vehículo");
    if (!cocheraId) return setError("Seleccioná una cochera libre");
    try {
      setGuardando(true);
      setError(null);

      // Calculamos la FechaInicioCobro según la decisión del operador
      let fechaInicioCobroObj = new Date(fechaInicio.getTime());
      if (esFinDeMes && comenzarMesSiguiente) {
        // Mover exactamente al primer día del mes entrante
        fechaInicioCobroObj = new Date(fechaInicioCobroObj.getFullYear(), fechaInicioCobroObj.getMonth() + 1, 1);
      } else {
        // Inicia el cobro el mismo mes (en el día 1 para simplificar el procesamiento cronológico)
        fechaInicioCobroObj = new Date(fechaInicioCobroObj.getFullYear(), fechaInicioCobroObj.getMonth(), 1);
      }

      const data = await abonoService.crear({
        clienteId,
        cocheraId: Number(cocheraId),
        tipoVehiculoId: Number(tipoVehiculoId),
        patente: patente.trim().toUpperCase() || null,
        modeloVehiculo: modeloVehiculo.trim() || null,
        cobrador: cobrador.trim() || null,
        fechaInicio: formatearFechaString(fechaInicio),
        fechaInicioCobro: formatearFechaString(fechaInicioCobroObj), // Enviamos el nuevo campo tipado al Backend
        precioAcordado: precioAcordado ? Number(precioAcordado) : null,
      });
      onCreado(data);
      onClose();
    } catch (e) {
      setError(e.response?.data || "No se pudo crear el abono");
    } finally { setGuardando(false); }
  }

  return (
    <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white flex items-center justify-between px-6 py-4 border-b border-gray-100 rounded-t-2xl">
          <h2 className="text-base font-semibold text-gray-900">Nuevo abono</h2>
          <button onClick={onClose}><X size={18} className="text-gray-400" /></button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {error && (
            <div className="flex items-center gap-2 text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              <AlertCircle size={14} className="shrink-0" /> {error}
            </div>
          )}

          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1.5">Cliente <span className="text-red-400">*</span></label>
            <BuscadorCliente onSeleccionar={setClienteId} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1.5">Tipo de vehículo <span className="text-red-400">*</span></label>
              <select
                value={tipoVehiculoId}
                onChange={e => setTipoVehiculoId(e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 bg-white"
              >
                <option value="">Seleccioná</option>
                {tipos.map(t => <option key={t.tipoVehiculoId} value={t.tipoVehiculoId}>{t.nombre}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1.5">Cochera <span className="text-red-400">*</span></label>
              <select
                value={cocheraId}
                onChange={e => setCocheraId(e.target.value)}
                disabled={!tipoVehiculoId || loadingCocheras}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 bg-white disabled:bg-gray-50 disabled:text-gray-400"
              >
                <option value="">{loadingCocheras ? "Buscando..." : !tipoVehiculoId ? "Primero el tipo" : "Seleccioná"}</option>
                {cocheras.map(c => (
                  <option key={c.cocheraId} value={c.cocheraId}>
                    {c.numero}{c.categoriaCochera ? ` — ${c.categoriaCochera.nombre}` : ""}
                  </option>
                ))}
              </select>
              {!loadingCocheras && tipoVehiculoId && cocheras.length === 0 && (
                <p className="text-xs text-amber-500 mt-1">Sin cocheras libres para este tipo</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1.5">Patente</label>
              <input value={patente} onChange={e => setPatente(e.target.value.toUpperCase())} placeholder="Ej: ABC123" maxLength={7} className="w-full text-sm font-mono border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1.5">Modelo</label>
              <input value={modeloVehiculo} onChange={e => setModeloVehiculo(e.target.value)} placeholder="Ej: Golf" className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1.5">Cobrador</label>
              <input value={cobrador} onChange={e => setCobrador(e.target.value)} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1.5">Fecha inicio</label>
              <DatePicker
                selected={fechaInicio}
                onChange={setFechaInicio}
                locale={es}
                dateFormat="dd/MM/yyyy"
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
              />
            </div>
          </div>

          {/* CHECKBOX DINÁMICO CONDICIONAL: Aparece solo si la fecha de inicio es del día 20 en adelante */}
          {esFinDeMes && (
            <div className="bg-amber-50/70 border border-amber-100 rounded-xl p-3 flex items-start gap-2.5 animate-fadeIn">
              <input
                id="check_mes_siguiente"
                type="checkbox"
                checked={comenzarMesSiguiente}
                onChange={e => setComenzarMesSiguiente(e.target.checked)}
                className="h-4 w-4 mt-0.5 rounded text-indigo-600 border-gray-300 focus:ring-indigo-500 cursor-pointer"
              />
              <div className="text-xs">
                <label htmlFor="check_mes_siguiente" className="font-semibold text-amber-900 cursor-pointer">
                  Cobrar a partir del mes siguiente
                </label>
                <p className="text-amber-700 mt-0.5 leading-relaxed">
                  El auto ingresa ahora, pero el sistema exime este mes y empezará a exigir mensualidades a partir del próximo período en limpio.
                </p>
              </div>
            </div>
          )}

          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1.5">
              Precio acordado
              {precioSugerido && (
                <span className={`ml-1.5 font-normal ${esFallback ? "text-amber-500" : "text-indigo-500"}`}>
                  — sugerido: ${Number(precioSugerido).toLocaleString("es-AR")}
                  {esFallback && " (genérico)"}
                </span>
              )}
            </label>
            <input
              type="number"
              value={precioAcordado}
              onChange={e => setPrecioAcordado(e.target.value)}
              placeholder={precioSugerido ? `${Number(precioSugerido).toLocaleString("es-AR")} (dejar vacío para usar sugerido)` : "Opcional"}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
            />
          </div>
        </div>

        <div className="sticky bottom-0 bg-white px-6 py-4 border-t border-gray-100 rounded-b-2xl flex gap-2">
          <button onClick={onClose} className="flex-1 text-sm text-gray-500 border border-gray-200 rounded-lg py-2.5 hover:bg-gray-50 transition-colors">Cancelar</button>
          <button
            onClick={handleGuardar}
            disabled={guardando || !cocheraId || !clienteId}
            className="flex-1 text-sm text-white bg-indigo-600 rounded-lg py-2.5 hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50"
          >
            {guardando ? "Guardando..." : "Crear abono"}
          </button>
        </div>
      </div>
    </div>
  );
}