import { useState, useEffect } from "react";
import { Save, CheckCircle, Info, Building2, MapPin } from "lucide-react";
import { estacionamientoService } from "../../services/estacionamientoService";

export default function General() {
  const [form, setForm] = useState({
    nombre:                 "",
    direccion:              "",
    diaVencimientoAbono:    10,
    aplicaRecargo:          false,
    porcentajeRecargo:      0,
    diasUmbralProporcional: null,
  });
  const [loading, setLoading]     = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError]         = useState(null);
  const [exito, setExito]         = useState(false);

  useEffect(() => { cargar(); }, []);

  async function cargar() {
    try {
      setError(null);
      const data = await estacionamientoService.get();
      setForm({
        nombre:                 data.nombre                         ?? "",
        direccion:              data.direccion                      ?? "",
        diaVencimientoAbono:    data.diaVencimientoAbono,
        aplicaRecargo:          data.aplicaRecargo,
        porcentajeRecargo:      data.porcentajeRecargo,
        diasUmbralProporcional: data.diasUmbralProporcional         ?? "",
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

  async function handleGuardar(e) {
    e.preventDefault();
    if (!form.nombre.trim()) {
      setError("El nombre del estacionamiento es obligatorio");
      return;
    }
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
        nombre:                 form.nombre.trim(),
        direccion:              form.direccion.trim(),
        diaVencimientoAbono:    Number(form.diaVencimientoAbono),
        aplicaRecargo:          form.aplicaRecargo,
        porcentajeRecargo:      Number(form.porcentajeRecargo),
        diasUmbralProporcional: form.diasUmbralProporcional !== ""
          ? Number(form.diasUmbralProporcional)
          : null,
      });
      setExito(true);
      setTimeout(() => setExito(false), 3000);
    } catch (e) {
      const msg = e.response?.data;
      setError(typeof msg === "string" ? msg : "No se pudo guardar la configuración");
    } finally {
      setGuardando(false);
    }
  }

  if (loading) return <div className="text-xs text-gray-400 font-semibold p-6">Cargando...</div>;

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Encabezado */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Parámetros Generales</h1>
        <p className="text-sm text-gray-500 mt-1">
          Reglas del negocio y cobros del estacionamiento.
        </p>
      </div>

      <form onSubmit={handleGuardar} className="space-y-6 max-w-2xl">

        {/* Feedback global */}
        {error && (
          <div className="px-4 py-2.5 bg-red-50 text-red-600 text-xs font-semibold rounded-xl border border-red-100">
            {error}
          </div>
        )}
        {exito && (
          <div className="px-4 py-2.5 bg-emerald-50 text-emerald-600 text-xs font-semibold rounded-xl border border-emerald-100 animate-pulse-glow">
            <CheckCircle size={15} className="inline mr-1" />
            Configuración guardada exitosamente
          </div>
        )}

        {/* Card: Datos del Estacionamiento */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)] space-y-5">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest pb-2 border-b border-gray-50">
            Datos del Estacionamiento
          </h3>

          <div className="space-y-4">
            {/* Nombre */}
            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-1.5">
                Nombre
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Building2 size={14} />
                </div>
                <input
                  type="text"
                  required
                  value={form.nombre}
                  onChange={e => set("nombre", e.target.value)}
                  placeholder="Nombre del estacionamiento"
                  className="w-full pl-9 pr-4 text-xs font-semibold border border-gray-200 rounded-xl px-3 py-2.5 bg-gray-50/50 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all text-gray-800"
                />
              </div>
            </div>

            {/* Dirección */}
            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-1.5">
                Dirección
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <MapPin size={14} />
                </div>
                <input
                  type="text"
                  value={form.direccion}
                  onChange={e => set("direccion", e.target.value)}
                  placeholder="Dirección del estacionamiento"
                  className="w-full pl-9 pr-4 text-xs font-semibold border border-gray-200 rounded-xl px-3 py-2.5 bg-gray-50/50 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all text-gray-800"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Card: Reglas de Abonos y Mora */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)] space-y-5">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest pb-2 border-b border-gray-50">
            Reglas de Abonos y Mora
          </h3>

          <div className="space-y-4">
            {/* Día de vencimiento */}
            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-1.5">
                Día de vencimiento del abono
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min={1}
                  max={31}
                  value={form.diaVencimientoAbono}
                  onChange={e => set("diaVencimientoAbono", e.target.value)}
                  className="w-24 text-xs font-semibold border border-gray-200 rounded-xl px-3 py-2.5 bg-gray-50/50 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all text-gray-800"
                />
                <span className="text-xs font-semibold text-gray-400">de cada mes</span>
              </div>
              <p className="text-[10px] text-gray-400 mt-1">
                Los abonos vencen el día {form.diaVencimientoAbono} de cada mes.
              </p>
            </div>

            {/* Recargo */}
            <div className="pt-2">
              <label className="flex items-center gap-2 cursor-pointer select-none mb-3 text-xs font-semibold text-gray-600">
                <input
                  type="checkbox"
                  checked={form.aplicaRecargo}
                  onChange={e => set("aplicaRecargo", e.target.checked)}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5"
                />
                <span>Aplicar recargo por mora</span>
              </label>

              <div className="flex items-center gap-3 ml-6">
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={form.porcentajeRecargo}
                  onChange={e => set("porcentajeRecargo", e.target.value)}
                  disabled={!form.aplicaRecargo}
                  className="w-24 text-xs font-semibold border border-gray-200 rounded-xl px-3 py-2.5 bg-gray-50/50 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all text-gray-800 disabled:opacity-40 disabled:cursor-not-allowed disabled:bg-gray-100"
                />
                <span className={`text-xs font-semibold transition-colors ${form.aplicaRecargo ? "text-gray-400" : "text-gray-300"}`}>
                  % sobre el monto del abono
                </span>
              </div>
            </div>

            {/* Proporcional */}
            <div className="pt-2">
              <div className="flex items-center gap-1.5 mb-1.5">
                <label className="block text-xs font-semibold text-gray-500">
                  Umbral proporcional (días)
                </label>
                <div className="group relative text-gray-400 hover:text-gray-600 cursor-pointer">
                  <Info size={12} />
                  <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 w-48 p-2 bg-slate-900 text-[10px] text-white rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-lg leading-normal z-10">
                    Días transcurridos a partir de los cuales se cobrará una fracción del mes en lugar del abono completo.
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min={1}
                  max={31}
                  value={form.diasUmbralProporcional}
                  onChange={e => set("diasUmbralProporcional", e.target.value)}
                  placeholder="Sin umbral"
                  className="w-24 text-xs font-semibold border border-gray-200 rounded-xl px-3 py-2.5 bg-gray-50/50 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all text-gray-800"
                />
                <span className="text-xs font-semibold text-gray-400">días desde inicio del mes</span>
              </div>
              <p className="text-[10px] text-gray-400 mt-1">
                Si el abono arranca después de este día se cobra proporcional. Déjalo vacío para no aplicar.
              </p>
            </div>
          </div>
        </div>

        {/* Guardar */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={guardando}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/10 transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:pointer-events-none"
          >
            <Save size={15} />
            {guardando ? "Guardando..." : "Guardar Cambios"}
          </button>
        </div>
      </form>
    </div>
  );
}
