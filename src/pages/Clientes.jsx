import { useState, useEffect, useMemo } from "react";
import { Plus, Pencil, Trash2, X, Phone, Mail, Car, ChevronRight, RotateCcw, Wallet } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { clienteService } from "../services/clienteService";
import { abonoService } from "../services/abonoService";
import PageHeader, { PageHeaderAction } from "../components/layout/PageHeader";
import SearchField from "../components/layout/SearchField";

/** @typedef {import("../types").Cliente} Cliente */
/** @typedef {import("../types").Abono} Abono */

// ─── Panel lateral detalle ────────────────────────────────────────────────────
function PanelDetalle({ clienteId, onClose, onEditar }) {
  const navigate = useNavigate();
  const [detalle, setDetalle] = useState(/** @type {Cliente | null} */ (null));
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
                {detalle.documento && (
                  <p className="text-sm text-gray-500">DNI {detalle.documento}</p>
                )}
                {detalle.domicilio && (
                  <p className="text-sm text-gray-500">{detalle.domicilio}</p>
                )}
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
              <button
                type="button"
                onClick={() => navigate(`/clientes/${clienteId}/cuenta-corriente`)}
                className="mt-4 inline-flex items-center gap-2 text-xs font-semibold bg-brand text-brand-foreground px-3 py-2"
              >
                <Wallet size={13} /> Cuenta corriente
              </button>
            </div>

            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
                Abonos activos
              </p>
              {detalle.abonos?.length > 0 ? (
                <div className="space-y-2">
                  {detalle.abonos.map(abono => {
                    const aid = abono.abonoId ?? abono.abonoCocheraId;
                    const plazas = Array.isArray(abono.plazas) && abono.plazas.length > 0
                      ? abono.plazas.filter(p => p.activo !== false)
                      : (abono.cochera ? [{ cochera: abono.cochera }] : []);
                    const vehiculos = Array.isArray(abono.vehiculos) && abono.vehiculos.length > 0
                      ? abono.vehiculos
                      : (abono.patente || abono.tipoVehiculo
                        ? [{ patente: abono.patente, modeloVehiculo: abono.modeloVehiculo, tipoVehiculo: abono.tipoVehiculo }]
                        : []);
                    const cocherasLabel = plazas.map(p => p.cochera?.numero).filter(Boolean).join(", ") || "—";
                    return (
                    <div key={aid} className="bg-indigo-50 rounded-xl p-3 border border-indigo-100">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-lg font-bold text-indigo-700">
                          {plazas.length > 1 ? `Cocheras ${cocherasLabel}` : `Cochera ${cocherasLabel}`}
                        </span>
                        <div className="flex flex-wrap gap-1 justify-end">
                          {vehiculos.filter(v => v.patente).map((v, i) => (
                            <span key={v.abonoVehiculoId ?? `${v.patente}-${i}`} className="font-mono text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded">
                              {v.patente}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 mt-1 text-xs text-indigo-500">
                        <Car size={11} />
                        <span>
                          {vehiculos.length === 0
                            ? "Sin vehículos"
                            : vehiculos.map(v => [v.tipoVehiculo?.nombre, v.modeloVehiculo].filter(Boolean).join(" ")).filter(Boolean).join(" · ") || `${vehiculos.length} vehículo(s)`}
                        </span>
                      </div>
                      <p className="text-xs text-indigo-400 mt-1">Desde {formatFecha(abono.fechaInicio)}</p>
                    </div>
                  );})}
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
  const navigate = useNavigate();
  const [clientes, setClientes] = useState(/** @type {Cliente[]} */ ([]));
  const [abonosPorCliente, setAbonosPorCliente] = useState({});
  const [busqueda, setBusqueda] = useState("");
  const [mostrarInactivos, setMostrarInactivos] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
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
    c.documento?.includes(busqueda) ||
    c.domicilio?.toLowerCase().includes(busqueda.toLowerCase()) ||
    c.telefono?.includes(busqueda) ||
    c.email?.toLowerCase().includes(busqueda.toLowerCase())
  );

  const stats = useMemo(() => {
    const activos = clientes.filter((c) => c.activo);
    const conAbono = activos.filter((c) => (abonosPorCliente[c.clienteId] ?? 0) > 0).length;
    return {
      total: clientes.length,
      activos: activos.length,
      conAbono,
    };
  }, [clientes, abonosPorCliente]);

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
    <div className="space-y-5 animate-fade-in-up">
      <PageHeader
        title="Clientes"
        description="Agenda de abonados y contactos del estacionamiento."
        loading={loading}
        action={
          <PageHeaderAction onClick={() => navigate("/clientes/nuevo")}>
            <Plus size={16} />
            Nuevo cliente
          </PageHeaderAction>
        }
        stats={[
          { label: "Listados", value: stats.total },
          { label: "Activos", value: stats.activos },
          { label: "Con abono", value: stats.conAbono },
        ]}
      />

      {error && (
        <div className="px-4 py-3 bg-danger-muted text-danger-ink text-sm">
          {error}
        </div>
      )}

      {/* Buscador + toggle inactivos */}
      <div className="flex gap-3">
        <SearchField
          value={busqueda}
          onChange={setBusqueda}
          placeholder="Buscar por nombre, DNI, teléfono o email..."
          className="flex-1"
        />
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
        <div className="bg-white rounded-xl border border-transparent overflow-hidden">
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
                                title="Cuenta corriente"
                                onClick={() => navigate(`/clientes/${cliente.clienteId}/cuenta-corriente`)}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-ink hover:bg-brand-muted transition-colors"
                              >
                                <Wallet size={15} />
                              </button>
                              <button
                                title="Ver detalle"
                                onClick={() => setPanelId(cliente.clienteId)}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                              >
                                <ChevronRight size={15} />
                              </button>
                              <button
                                title="Editar"
                                onClick={() => navigate(`/clientes/${cliente.clienteId}/editar`)}
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

      {panelId && (
        <PanelDetalle
          clienteId={panelId}
          onClose={() => setPanelId(null)}
          onEditar={() => {
            const id = panelId;
            setPanelId(null);
            navigate(`/clientes/${id}/editar`);
          }}
        />
      )}
    </div>
  );
}