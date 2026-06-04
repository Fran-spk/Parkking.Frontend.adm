import { useState, useEffect } from "react";
import { estacionamientoService } from "../../../services/estacionamientoService";

export default function General() {
  const [form, setForm] = useState({
    diaVencimientoAbono:    10,
    aplicaRecargo:          false,
    porcentajeRecargo:      0,
    diasUmbralProporcional: null,
  });
  const [loading, setLoading]   = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError]       = useState(null);
  const [exito, setExito]       = useState(false);

  useEffect(() => { cargar(); }, []);

  async function cargar() {
    try {
      setError(null);
      const data = await estacionamientoService.get();
      setForm({
        diaVencimientoAbono:    data.diaVencimientoAbono,
        aplicaRecargo:          data.aplicaRecargo,
        porcentajeRecargo:      data.porcentajeRecargo,
        diasUmbralProporcional: data.diasUmbralProporcional ?? "",
      });
    } catch {
      setError("No se pudo cargar la configuración");
    } finally {
      setLoading(false);
    }
  }

  function set(field, value) {
    setForm(prev => ({ ...prev, [field]: value }));
    setExito(false);
    setError(null);
  }

  async function handleGuardar() {
    if (form.diaVencimientoAbono < 1 || form.diaVencimientoAbono > 31) {
      setError("El día de vencimiento debe estar entre 1 y 31");
      return;
    }
    if (form.aplicaRecargo && (form.porcentajeRecargo <= 0 || form.porcentajeRecargo > 100)) {
      setError("El porcentaje de recargo debe estar entre 1 y 100");
      return;
    }
    try {
      setGuardando(true);
      setError(null);
      await estacionamientoService.modificar({
        diaVencimientoAbono:    Number(form.diaVencimientoAbono),
        aplicaRecargo:          form.aplicaRecargo,
        porcentajeRecargo:      Number(form.porcentajeRecargo),
        diasUmbralProporcional: form.diasUmbralProporcional !== ""
          ? Number(form.diasUmbralProporcional)
          : null,
      });
      setExito(true);
    } catch (e) {
      const msg = e.response?.data;
      setError(typeof msg === "string" ? msg : "No se pudo guardar la configuración");
    } finally {
      setGuardando(false);
    }
  }

  if (loading) return <div className="text-sm text-gray-400">Cargando...</div>;

  return (
    <div>
      <div className="mb-5">
        <h2 className="text-base font-semibold text-gray-800">Configuración general</h2>
        <p className="text-xs text-gray-400 mt-0.5">
          Parámetros generales del estacionamiento
        </p>
      </div>

      {error && (
        <div className="mb-4 px-4 py-2.5 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
          {error}
        </div>
      )}
      {exito && (
        <div className="mb-4 px-4 py-2.5 bg-green-50 text-green-600 text-sm rounded-lg border border-green-100">
          Configuración guardada exitosamente
        </div>
      )}

      <div className="space-y-5 max-w-md">

        {/* Día de vencimiento */}
        <div>
          <label className="text-xs font-medium text-gray-500 block mb-1.5">
            Día de vencimiento del abono
          </label>
          <div className="flex items-center gap-3">
            <input
              type="number"
              min={1}
              max={31}
              value={form.diaVencimientoAbono}
              onChange={e => set("diaVencimientoAbono", e.target.value)}
              className="w-24 text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
            />
            <span className="text-sm text-gray-400">de cada mes</span>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Los abonos vencen el día {form.diaVencimientoAbono} de cada mes
          </p>
        </div>

        {/* Recargo */}
        <div>
          <label className="flex items-center gap-2 cursor-pointer select-none mb-2">
            <input
              type="checkbox"
              checked={form.aplicaRecargo}
              onChange={e => set("aplicaRecargo", e.target.checked)}
              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-xs font-medium text-gray-500">Aplicar recargo por mora</span>
          </label>

          {form.aplicaRecargo && (
            <div className="flex items-center gap-3 ml-6">
              <input
                type="number"
                min={1}
                max={100}
                value={form.porcentajeRecargo}
                onChange={e => set("porcentajeRecargo", e.target.value)}
                className="w-24 text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
              />
              <span className="text-sm text-gray-400">% sobre el monto del abono</span>
            </div>
          )}
        </div>

        {/* Proporcional */}
        <div>
          <label className="text-xs font-medium text-gray-500 block mb-1.5">
            Umbral proporcional (días)
          </label>
          <div className="flex items-center gap-3">
            <input
              type="number"
              min={1}
              max={31}
              value={form.diasUmbralProporcional}
              onChange={e => set("diasUmbralProporcional", e.target.value)}
              placeholder="Sin umbral"
              className="w-24 text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
            />
            <span className="text-sm text-gray-400">días desde inicio del mes</span>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Si el abono arranca después de este día se cobra proporcional. Dejalo vacío para no aplicar.
          </p>
        </div>

      </div>

      {/* Guardar */}
      <div className="mt-6 pt-5 border-t border-gray-100">
        <button
          onClick={handleGuardar}
          disabled={guardando}
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-6 py-2.5 rounded-lg transition-colors disabled:opacity-50"
        >
          {guardando ? "Guardando..." : "Guardar cambios"}
        </button>
      </div>
    </div>
  );
}