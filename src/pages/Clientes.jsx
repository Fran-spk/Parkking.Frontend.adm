import { useState, useEffect } from "react";
import { Plus, Search, Pencil, Trash2, X, Phone, Mail, Car, ChevronRight, RotateCcw } from "lucide-react";
import { clienteService } from "../services/clienteService";
import { abonoService } from "../services/abonoService";

// ─── Modal alta/edición ───────────────────────────────────────────────────────
function ModalCliente({ cliente, onClose, onGuardado }) {
  const [form, setForm] = useState({
    nombre: cliente?.nombre ?? "",
    telefono: cliente?.telefono ?? "",
    email: cliente?.email ?? "",
    observacion: cliente?.observacion ?? "",
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  function set(field, value) {
    setForm(prev => ({ ...prev, [field]: value }));
    setError(null);
  }

  async function handleGuardar() {
    if (!form.nombre.trim()) { setError("El nombre es obligatorio"); return; }
    try {
      setLoading(true);
      if (cliente) {
        await clienteService.modificar(cliente.clienteId, form);
      } else {
        await clienteService.agregar(form);
      }
      onGuardado();
      onClose();
    } catch (e) {
      const msg = e.response?.data;
      setError(typeof msg === "string" ? msg : "No se pudo guardar el cliente");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-gray-900">
            {cliente ? "Editar cliente" : "Nuevo cliente"}
          </h2>
          <button onClick={onClose}><X size={18} className="text-gray-400" /></button>
        </div>

        <div className="space-y-3 mb-5">
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1.5">
              Nombre <span className="text-red-400">*</span>
            </label>
            <input
              autoFocus
              value={form.nombre}
              onChange={e => set("nombre", e.target.value)}
              placeholder="Ej: Juan Pérez"
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
            />
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1.5">Teléfono</label>
            <input
              value={form.telefono}
              onChange={e => set("telefono", e.target.value)}
              placeholder="Ej: 3415001234"
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1.5">Email</label>
            <input
              value={form.email}
              onChange={e => set("email", e.target.value)}
              placeholder="Ej: juan@gmail.com"
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1.5">Observación</label>
            <textarea
              value={form.observacion}
              onChange={e => set("observacion", e.target.value)}
              rows={2}
              placeholder="Notas internas..."
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 text-sm text-gray-500 border border-gray-200 rounded-lg py-2.5 hover:bg-gray-50 transition-colors">
            Cancelar
          </button>
          <button
            onClick={handleGuardar}
            disabled={loading}
            className="flex-1 text-sm text-white bg-indigo-600 rounded-lg py-2.5 hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50"
          >
            {loading ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Panel lateral detalle ────────────────────────────────────────────────────
function PanelDetalle({ clienteId, onClose, onEditar }) {
  const [detalle, setDetalle] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    clienteService.getById(clienteId).then(data => {
      setDetalle(data);
      setLoading(false);
    });
  }, [clienteId]);

  function formatFecha(fecha) {
    if (!fecha) return "-";
    return new Date(fecha).toLocaleDateString("es-AR", {
      day: "2-digit", month: "2-digit", year: "numeric",
    });
  }

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-black/10" onClick={onClose} />
      <div className="relative bg-white w-full max-w-sm shadow-xl flex flex-col h-full">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Detalle cliente</h2>
          <button onClick={onClose}><X size={18} className="text-gray-400" /></button>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center text-sm text-gray-400">Cargando...</div>
        ) : detalle && (
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
            <div>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold text-gray-900">{detalle.nombre}</h3>
                  {!detalle.activo && (
                    <span className="text-xs bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full">
                      Inactivo
                    </span>
                  )}
                </div>
                {detalle.activo && (
                  <button
                    onClick={() => onEditar(detalle)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                  >
                    <Pencil size={14} />
                  </button>
                )}
              </div>

              <div className="mt-2 space-y-1.5">
                {detalle.telefono && (
                  <a
                    href={`https://wa.me/549${detalle.telefono}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 text-sm text-gray-500 hover:text-green-600 transition-colors"
                  >
                    <Phone size={13} />
                    {detalle.telefono}
                  </a>
                )}
                {detalle.email && (
                  <a
                    href={`mailto:${detalle.email}`}
                    className="flex items-center gap-2 text-sm text-gray-500 hover:text-indigo-600 transition-colors"
                  >
                    <Mail size={13} />
                    {detalle.email}
                  </a>
                )}
              </div>

              {detalle.observacion && (
                <p className="mt-3 text-xs text-gray-400 bg-gray-50 rounded-lg px-3 py-2 leading-relaxed">
                  {detalle.observacion}
                </p>
              )}
            </div>

            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
                Abonos activos
              </p>
              {detalle.abonos?.length > 0 ? (
                <div className="space-y-2">
                  {detalle.abonos.map(abono => (
                    <div key={abono.abonoCocheraId} className="bg-indigo-50 rounded-xl p-3 border border-indigo-100">
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-indigo-700">
                          Cochera {abono.cochera?.numero}
                        </span>
                        {abono.patente && (
                          <span className="font-mono text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded">
                            {abono.patente}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 mt-1 text-xs text-indigo-500">
                        <Car size={11} />
                        <span>{[abono.tipoVehiculo?.nombre, abono.modeloVehiculo].filter(Boolean).join(" · ")}</span>
                      </div>
                      <p className="text-xs text-indigo-400 mt-1">Desde {formatFecha(abono.fechaInicio)}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400">Sin abonos activos</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Vista principal ──────────────────────────────────────────────────────────
export default function Clientes() {
  const [clientes, setClientes] = useState([]);
  const [abonosPorCliente, setAbonosPorCliente] = useState({});
  const [busqueda, setBusqueda] = useState("");
  const [mostrarInactivos, setMostrarInactivos] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalForm, setModalForm] = useState(null);
  const [panelId, setPanelId] = useState(null);

  useEffect(() => { cargarDatos(); }, [mostrarInactivos]);

  async function cargarDatos() {
    try {
      setError(null);
      const [clientes, abonos] = await Promise.all([
        clienteService.getAll(mostrarInactivos),
        abonoService.getOcupadas(),
      ]);
      const mapa = {};
      abonos.forEach(a => { mapa[a.clienteId] = (mapa[a.clienteId] ?? 0) + 1; });

      setClientes(clientes);
      console.log(clientes);
      setAbonosPorCliente(mapa);
    } catch {
      setError("No se pudo conectar con el servidor");
    } finally {
      setLoading(false);
    }
  }

  const clientesFiltrados = clientes.filter(c =>
    c.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    c.telefono?.includes(busqueda) ||
    c.email?.toLowerCase().includes(busqueda.toLowerCase())
  );

  async function handleDarDeBaja(cliente) {
    if (!confirm(`¿Dar de baja a ${cliente.nombre}?`)) return;
    try {
      await clienteService.darDeBaja(cliente.clienteId);
      cargarDatos();
    } catch (e) {
      const msg = e.response?.data;
      setError(typeof msg === "string" ? msg : "No se pudo dar de baja al cliente");
    }
  }

  async function handleReactivar(cliente) {
    try {
      await clienteService.reactivar(cliente.clienteId);
      cargarDatos();
    } catch {
      setError("No se pudo reactivar el cliente");
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Clientes</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {clientes.filter(c => c.activo).length} clientes activos
          </p>
        </div>
        <button
          onClick={() => setModalForm("nuevo")}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
        >
          <Plus size={16} />
          Nuevo cliente
        </button>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
          {error}
        </div>
      )}

      {/* Buscador + toggle inactivos */}
      <div className="flex gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, teléfono o email..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 bg-white"
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-500 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={mostrarInactivos}
            onChange={e => setMostrarInactivos(e.target.checked)}
            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />
          Mostrar dados de baja
        </label>
      </div>

      {/* Tabla */}
      {loading ? (
        <div className="text-sm text-gray-400">Cargando...</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-xs font-medium text-gray-400 px-4 py-3">Nombre</th>
                <th className="text-left text-xs font-medium text-gray-400 px-4 py-3">Teléfono</th>
                <th className="text-left text-xs font-medium text-gray-400 px-4 py-3">Email</th>
                <th className="text-left text-xs font-medium text-gray-400 px-4 py-3">Abonos</th>
                <th className="text-right text-xs font-medium text-gray-400 px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {clientesFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center text-gray-400 py-10 text-sm">
                    No hay clientes
                  </td>
                </tr>
              ) : (
                clientesFiltrados.map(cliente => {
                  const cantAbonos = abonosPorCliente[cliente.clienteId] ?? 0;
                  const inactivo = !cliente.activo;
                  return (
                    <tr
                      key={cliente.clienteId}
                      className={`border-b border-gray-50 transition-colors cursor-pointer ${inactivo ? "opacity-50 bg-gray-50" : "hover:bg-gray-50"
                        }`}
                      onClick={() => setPanelId(cliente.clienteId)}
                    >
                      {/* Nombre */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <p className={`font-medium ${inactivo ? "text-gray-400" : "text-gray-800"}`}>
                            {cliente.nombre}
                          </p>
                          {inactivo && (
                            <span className="text-xs bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full">
                              Baja
                            </span>
                          )}
                          {cliente.observacion && !inactivo && (
                            <span className="text-xs text-gray-400 italic truncate max-w-32">
                              {cliente.observacion}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Teléfono */}
                      <td className="px-4 py-3 text-gray-500">
                        {cliente.telefono ?? <span className="text-gray-300">—</span>}
                      </td>

                      {/* Email */}
                      <td className="px-4 py-3 text-gray-500">
                        {cliente.email ?? <span className="text-gray-300">—</span>}
                      </td>

                      {/* Abonos */}
                      <td className="px-4 py-3">
                        {cantAbonos > 0 ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium bg-green-50 text-green-600 border border-green-100 px-2 py-0.5 rounded-full">
                            <Car size={10} />
                            {cantAbonos} {cantAbonos === 1 ? "abono" : "abonos"}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-300">Sin abonos</span>
                        )}
                      </td>

                      {/* Acciones */}
                      <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          {inactivo ? (
                            <button
                              title="Reactivar"
                              onClick={() => handleReactivar(cliente)}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 transition-colors"
                            >
                              <RotateCcw size={15} />
                            </button>
                          ) : (
                            <>
                              <button
                                title="Ver detalle"
                                onClick={() => setPanelId(cliente.clienteId)}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                              >
                                <ChevronRight size={15} />
                              </button>
                              <button
                                title="Editar"
                                onClick={() => setModalForm(cliente)}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                              >
                                <Pencil size={15} />
                              </button>
                              <button
                                title="Dar de baja"
                                onClick={() => handleDarDeBaja(cliente)}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                              >
                                <Trash2 size={15} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {modalForm && (
        <ModalCliente
          cliente={modalForm === "nuevo" ? null : modalForm}
          onClose={() => setModalForm(null)}
          onGuardado={cargarDatos}
        />
      )}

      {panelId && (
        <PanelDetalle
          clienteId={panelId}
          onClose={() => setPanelId(null)}
          onEditar={cliente => {
            setPanelId(null);
            setModalForm(cliente);
          }}
        />
      )}
    </div>
  );
}