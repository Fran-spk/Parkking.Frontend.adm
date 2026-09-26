import { useState, useEffect } from "react";
import { X, Users, Car, AlertCircle } from "lucide-react";
import { cocheraService } from "../../services/cocheraService";
import { tipoVehiculoService } from "../../services/tipoVehiculoService";

/** @typedef {import("../../types").TipoVehiculo} TipoVehiculo */
/** @typedef {import("../../types").Cochera} Cochera */

export default function ModalCochera({ cochera = null, categorias = [], onClose, onGuardar }) {
  const [numero, setNumero] = useState(cochera?.numero || "");
  const [observacion, setObservacion] = useState(cochera?.observacion || "");
  const [categoriaCocheraId, setCategoriaCocheraId] = useState(cochera?.categoriaCocheraId || "");
  const [multipleOcupacion, setMultipleOcupacion] = useState(cochera?.multipleOcupacion || false);
  const [maxOcupacion, setMaxOcupacion] = useState(
    cochera?.maxOcupacion != null ? String(cochera.maxOcupacion) : "2"
  );
  const [estadoCochera, setEstadoCochera] = useState(cochera?.estadoCochera || 0);
  const [vehiculosPermitidosIds, setVehiculosPermitidosIds] = useState(
    cochera?.vehiculosPermitidosIds || []
  );
  const [tiposVehiculos, setTiposVehiculos] = useState(/** @type {TipoVehiculo[]} */ ([]));
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    tipoVehiculoService.getAll().then(setTiposVehiculos).catch(() => {});
  }, []);

  useEffect(() => {
    if (!cochera && categorias.length > 0 && !categoriaCocheraId) {
      setCategoriaCocheraId(categorias[0].categoriaCocheraId);
    }
  }, [categorias, cochera, categoriaCocheraId]);

  function toggleVehiculo(id) {
    setVehiculosPermitidosIds((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]
    );
  }

  async function handleGuardar() {
    if (!numero.toString().trim()) {
      setError("El número es obligatorio");
      return;
    }
    if (!categoriaCocheraId) {
      setError("Seleccioná una categoría");
      return;
    }
    if (multipleOcupacion) {
      const max = Number(maxOcupacion);
      if (!Number.isFinite(max) || max < 2) {
        setError("Con múltiple ocupación el máximo debe ser al menos 2");
        return;
      }
    }
    try {
      setLoading(true);
      setError(null);
      const payload = {
        numero: numero.toString().trim(),
        categoriaCocheraId: Number(categoriaCocheraId),
        estadoCochera: Number(estadoCochera),
        observacion: estadoCochera === 0 ? null : observacion.trim() || null,
        multipleOcupacion: Boolean(multipleOcupacion),
        maxOcupacion: multipleOcupacion ? Number(maxOcupacion) : null,
        vehiculosPermitidosIds: vehiculosPermitidosIds.map((id) => Number(id)),
      };
      if (cochera) {
        await cocheraService.modificar(cochera.cocheraId, payload);
      } else {
        await cocheraService.agregar(payload);
      }
      onGuardar();
      onClose();
    } catch (e) {
      const msg = e.response?.data;
      setError(typeof msg === "string" ? msg : "No se pudo guardar");
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full text-sm border border-line-strong bg-surface-card px-3 py-2.5 text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand disabled:bg-surface-muted disabled:text-ink-faint";

  return (
    <div className="fixed inset-0 bg-surface-overlay flex items-center justify-center z-50 p-4">
      <div className="bg-surface-card shadow-pk-modal w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-line">
          <h2 className="pk-heading">
            {cochera ? `Editar cochera ${cochera.numero}` : "Nueva cochera"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-ink-faint hover:text-ink hover:bg-surface-muted transition-colors"
            aria-label="Cerrar"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-5 py-5 space-y-4">
          {error && (
            <div className="flex items-center gap-2 text-xs font-medium text-danger-ink bg-danger-muted px-3 py-2">
              <AlertCircle size={14} className="shrink-0" /> {error}
            </div>
          )}

          <div>
            <label className="pk-label block mb-1.5">Estado</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setEstadoCochera(0);
                  setError(null);
                }}
                className={`py-2.5 text-sm font-semibold border-2 transition-colors ${
                  estadoCochera === 0
                    ? "border-success bg-success-muted text-success-ink"
                    : "border-line text-ink-faint hover:border-line-strong hover:text-ink-muted"
                }`}
              >
                Habilitada
              </button>
              <button
                type="button"
                onClick={() => setEstadoCochera(1)}
                className={`py-2.5 text-sm font-semibold border-2 transition-colors ${
                  estadoCochera === 1
                    ? "border-warning bg-warning-muted text-warning-ink"
                    : "border-line text-ink-faint hover:border-line-strong hover:text-ink-muted"
                }`}
              >
                Deshabilitada
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="pk-label block mb-1.5">Número *</label>
              <input
                value={numero}
                onChange={(e) => {
                  setNumero(e.target.value);
                  setError(null);
                }}
                disabled={!!cochera}
                placeholder="Ej: 101"
                className={inputClass}
              />
            </div>
            <div>
              <label className="pk-label block mb-1.5">Categoría *</label>
              <select
                value={categoriaCocheraId}
                onChange={(e) => setCategoriaCocheraId(e.target.value)}
                className={inputClass}
              >
                <option value="">Sin categoría</option>
                {categorias.map((c) => (
                  <option key={c.categoriaCocheraId} value={c.categoriaCocheraId}>
                    {c.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              const next = !multipleOcupacion;
              setMultipleOcupacion(next);
              if (next && (!maxOcupacion || Number(maxOcupacion) < 2)) setMaxOcupacion("2");
            }}
            className={`w-full flex items-center justify-between p-3 border-2 transition-colors ${
              multipleOcupacion
                ? "border-brand bg-brand-muted"
                : "border-line bg-surface-muted"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Users
                size={15}
                className={multipleOcupacion ? "text-brand" : "text-ink-faint"}
              />
              <div className="text-left">
                <p
                  className={`text-sm font-semibold ${
                    multipleOcupacion ? "text-ink" : "text-ink-muted"
                  }`}
                >
                  Múltiple ocupación
                </p>
                <p className="text-xs text-ink-faint">Permite varios abonos activos</p>
              </div>
            </div>
            <div
              className={`w-9 h-5 relative transition-colors ${
                multipleOcupacion ? "bg-brand" : "bg-brand-soft"
              }`}
            >
              <div
                className={`absolute top-1 w-3 h-3 bg-white transition-all ${
                  multipleOcupacion ? "left-5" : "left-1"
                }`}
              />
            </div>
          </button>

          {multipleOcupacion && (
            <div>
              <label className="pk-label block mb-1.5">Máximo de abonos *</label>
              <input
                type="number"
                min={2}
                max={50}
                value={maxOcupacion}
                onChange={(e) => setMaxOcupacion(e.target.value)}
                className={inputClass}
              />
              <p className="pk-caption mt-1">
                Cupo de abonos activos en esta plaza (mínimo 2).
                {cochera?.abonosActivos > 0
                  ? ` Hoy: ${cochera.abonosActivos} activos.`
                  : ""}
              </p>
            </div>
          )}

          {tiposVehiculos.length > 0 && (
            <div>
              <label className="pk-label block mb-1.5">Tipos de vehículo permitidos</label>
              <div className="flex flex-wrap gap-2">
                {tiposVehiculos.map((tipo) => {
                  const active = vehiculosPermitidosIds.includes(tipo.tipoVehiculoId);
                  return (
                    <button
                      key={tipo.tipoVehiculoId}
                      type="button"
                      onClick={() => toggleVehiculo(tipo.tipoVehiculoId)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border-2 transition-colors ${
                        active
                          ? "border-brand bg-brand-muted text-ink"
                          : "border-line text-ink-faint hover:border-line-strong hover:text-ink-muted"
                      }`}
                    >
                      <Car size={12} /> {tipo.nombre}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className={estadoCochera === 0 ? "opacity-40 pointer-events-none" : ""}>
            <label className="pk-label block mb-1.5">Observación</label>
            <textarea
              value={observacion}
              onChange={(e) => setObservacion(e.target.value)}
              disabled={estadoCochera === 0}
              placeholder="Ej: Fuera de servicio..."
              rows={2}
              className={`${inputClass} resize-none`}
            />
          </div>
        </div>

        <div className="px-5 py-4 border-t border-line flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 text-sm font-semibold text-ink-muted border border-line-strong py-2.5 hover:bg-surface-muted hover:text-ink transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleGuardar}
            disabled={loading}
            className="flex-1 text-sm font-bold text-brand-foreground bg-brand hover:bg-brand-strong py-2.5 transition-colors disabled:opacity-50"
          >
            {loading ? "Guardando..." : cochera ? "Guardar cambios" : "Crear cochera"}
          </button>
        </div>
      </div>
    </div>
  );
}
