import { useEffect, useState } from "react";
import { X, AlertCircle, ParkingSquare, Car, Calendar, User, RefreshCw } from "lucide-react";
import { abonoService } from "../../services/abonoService";
import { cocheraService } from "../../services/cocheraService";
import {
  abonoIdOf,
  plazasDe,
  vehiculosDe,
  labelCocheras,
  MODALIDAD,
  modalidadLabel,
} from "../../utils/abonoHelpers";
import { PERIODICIDAD_OPTIONS } from "../../utils/periodicidadHelpers";

function formatFecha(fecha) {
  if (!fecha) return "—";
  const solo = String(fecha).split("T")[0];
  const [y, m, d] = solo.split("-").map(Number);
  return new Date(y, m - 1, d || 1).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatPrecio(precio) {
  if (precio == null || precio === "") return "Tarifa de lista";
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(Number(precio));
}

function periodicidadLabel(value) {
  return PERIODICIDAD_OPTIONS.find((o) => o.value === Number(value))?.label || "Mensual";
}

/** Edición: cobrador, precio y cambio de cochera. Cliente / vehículos / periodicidad solo lectura. */
export default function ModalEditarAbono({ abono: abonoInicial, onClose, onGuardado }) {
  const [abono, setAbono] = useState(abonoInicial);
  const [cobrador, setCobrador] = useState(abonoInicial.cobrador ?? "");
  const [precioAcordado, setPrecioAcordado] = useState(
    abonoInicial.precioAcordado != null ? String(abonoInicial.precioAcordado) : ""
  );
  const [cocherasDisponibles, setCocherasDisponibles] = useState([]);
  const [destinoPorPlaza, setDestinoPorPlaza] = useState({});
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [datosDirty, setDatosDirty] = useState(false);

  const id = abonoIdOf(abono);
  const plazas = plazasDe(abono);
  const vehiculos = vehiculosDe(abono);
  const plazasIds = new Set(plazas.map((p) => p.cocheraId));

  useEffect(() => {
    cocheraService
      .getAll()
      .then((c) => setCocherasDisponibles((c || []).filter((x) => x.activo !== false)))
      .catch(() => {});
  }, []);

  async function refrescar() {
    const fresh = await abonoService.getById(id);
    setAbono(fresh);
    setCobrador(fresh.cobrador ?? "");
    setPrecioAcordado(fresh.precioAcordado != null ? String(fresh.precioAcordado) : "");
    setDestinoPorPlaza({});
    setDatosDirty(false);
    return fresh;
  }

  function cocherasParaMover(plazaActualId) {
    return cocherasDisponibles.filter(
      (c) =>
        (c.estaDisponible !== false || c.cocheraId === plazaActualId) &&
        (!plazasIds.has(c.cocheraId) || c.cocheraId === plazaActualId)
    );
  }

  async function handleMoverPlaza(abonoPlazaId) {
    const nueva = Number(destinoPorPlaza[abonoPlazaId]);
    if (!nueva) {
      setError("Elegí la cochera destino");
      return;
    }
    try {
      setBusy(true);
      setError(null);
      await abonoService.moverPlaza(id, abonoPlazaId, nueva);
      await refrescar();
      onGuardado();
    } catch (e) {
      const msg = e.response?.data;
      setError(typeof msg === "string" ? msg : "No se pudo cambiar la cochera");
    } finally {
      setBusy(false);
    }
  }

  async function handleGuardarDatos() {
    try {
      setBusy(true);
      setError(null);
      await abonoService.modificar(id, {
        cobrador: cobrador.trim() || null,
        precioAcordado: precioAcordado !== "" ? Number(precioAcordado) : null,
      });
      await refrescar();
      onGuardado();
      onClose();
    } catch (e) {
      const msg = e.response?.data;
      setError(typeof msg === "string" ? msg : "No se pudo guardar");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white z-10 px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Editar abono</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {labelCocheras(abono)} · {abono.cliente?.nombre}
            </p>
          </div>
          <button type="button" onClick={onClose}>
            <X size={18} className="text-gray-400" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {error && (
            <div className="flex items-center gap-2 text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              <AlertCircle size={14} className="shrink-0" /> {error}
            </div>
          )}

          {/* Readonly: cliente / fechas / periodicidad / vehículos */}
          <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-4 space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
              Contrato (solo lectura)
            </p>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-start gap-2">
                <User size={13} className="text-gray-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-[10px] text-gray-400">Cliente</p>
                  <p className="font-medium text-gray-800">{abono.cliente?.nombre || "—"}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Calendar size={13} className="text-gray-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-[10px] text-gray-400">Periodicidad</p>
                  <p className="font-medium text-gray-800">
                    {periodicidadLabel(abono.periodicidadCobro)}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-[10px] text-gray-400">Ingreso</p>
                <p className="font-medium text-gray-800">{formatFecha(abono.fechaInicio)}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-400">Inicio cobro</p>
                <p className="font-medium text-gray-800">
                  {formatFecha(abono.fechaInicioCobro || abono.fechaInicio)}
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-gray-100">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Car size={12} className="text-gray-400" />
                <p className="text-[10px] font-bold text-gray-400 uppercase">Vehículos</p>
              </div>
              {vehiculos.length === 0 ? (
                <p className="text-xs text-gray-400">Sin vehículos</p>
              ) : (
                <ul className="space-y-1.5">
                  {vehiculos.map((v, i) => (
                    <li
                      key={v.abonoVehiculoId ?? `${v.patente}-${i}`}
                      className="flex items-center justify-between gap-2 text-xs"
                    >
                      <span className="font-mono font-bold text-gray-800">
                        {v.patente || "S/PAT"}
                      </span>
                      <span className="text-gray-500 truncate">
                        {[v.tipoVehiculo?.nombre, v.modeloVehiculo].filter(Boolean).join(" · ") ||
                          modalidadLabel(v.modalidad)}
                      </span>
                      <span
                        className={`shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded ${
                          Number(v.modalidad) === MODALIDAD.FLEXIBLE
                            ? "bg-amber-50 text-amber-700"
                            : "bg-indigo-50 text-indigo-700"
                        }`}
                      >
                        {modalidadLabel(v.modalidad)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Cambiar cochera */}
          <div className="space-y-3">
            <div className="flex items-center gap-1.5">
              <ParkingSquare size={14} className="text-indigo-500" />
              <p className="text-xs font-semibold text-gray-700">Cocheras</p>
            </div>
            {plazas.length === 0 ? (
              <p className="text-xs text-gray-400">Sin plazas</p>
            ) : (
              plazas.map((p) => {
                const plazaId = p.abonoPlazaId;
                const opciones = cocherasParaMover(p.cocheraId);
                const destino = destinoPorPlaza[plazaId] ?? "";
                const puedeMover = plazaId && destino && Number(destino) !== p.cocheraId;

                return (
                  <div
                    key={plazaId ?? p.cocheraId}
                    className="rounded-xl border border-gray-100 p-3 space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-bold text-gray-800">
                          {p.cochera?.numero ?? p.cocheraId}
                        </p>
                        <p className="text-[11px] text-gray-400">
                          {p.cochera?.categoriaCochera?.nombre || "Sin categoría"}
                        </p>
                      </div>
                    </div>
                    {plazaId ? (
                      <div className="flex gap-2">
                        <select
                          value={destino}
                          disabled={busy}
                          onChange={(e) =>
                            setDestinoPorPlaza((prev) => ({
                              ...prev,
                              [plazaId]: e.target.value,
                            }))
                          }
                          className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                        >
                          <option value="">Cambiar a...</option>
                          {opciones
                            .filter((c) => c.cocheraId !== p.cocheraId)
                            .map((c) => (
                              <option key={c.cocheraId} value={c.cocheraId}>
                                {c.numero}
                                {c.categoriaCochera ? ` — ${c.categoriaCochera.nombre}` : ""}
                              </option>
                            ))}
                        </select>
                        <button
                          type="button"
                          disabled={!puedeMover || busy}
                          onClick={() => handleMoverPlaza(plazaId)}
                          title="Aplicar cambio de cochera"
                          className="inline-flex items-center gap-1.5 px-3 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-semibold hover:bg-indigo-100 disabled:opacity-40"
                        >
                          <RefreshCw size={13} />
                          Cambiar
                        </button>
                      </div>
                    ) : (
                      <p className="text-[11px] text-amber-600">
                        No se puede mover esta plaza (falta id).
                      </p>
                    )}
                  </div>
                );
              })
            )}
            <p className="text-[10px] text-gray-400 leading-relaxed">
              Solo cocheras libres. Si hay vehículos fijos, el tipo debe estar permitido en la
              cochera destino.
            </p>
          </div>

          {/* Editable: cobrador / precio */}
          <div className="space-y-4 pt-1 border-t border-gray-100">
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1.5">Cobrador</label>
              <input
                value={cobrador}
                onChange={(e) => {
                  setCobrador(e.target.value);
                  setDatosDirty(true);
                }}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1.5">
                Precio acordado
                <span className="ml-1.5 font-normal text-gray-400">
                  — vacío = tarifa vigente al cobrar
                </span>
              </label>
              <input
                type="number"
                value={precioAcordado}
                onChange={(e) => {
                  setPrecioAcordado(e.target.value);
                  setDatosDirty(true);
                }}
                placeholder="Opcional"
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
              />
              <p className="text-[11px] text-gray-400 mt-1.5">
                Actual: {formatPrecio(abono.precioAcordado)}
              </p>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-white px-6 py-4 border-t border-gray-100 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 text-sm text-gray-500 border border-gray-200 rounded-lg py-2.5 hover:bg-gray-50 transition-colors"
          >
            {datosDirty ? "Cancelar" : "Cerrar"}
          </button>
          <button
            type="button"
            onClick={handleGuardarDatos}
            disabled={busy}
            className="flex-1 text-sm text-white bg-indigo-600 rounded-lg py-2.5 hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50"
          >
            {busy ? "Guardando..." : "Guardar datos"}
          </button>
        </div>
      </div>
    </div>
  );
}
