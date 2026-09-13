import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Save, CheckCircle, Info, Building2, MapPin, SlidersHorizontal, Car, Banknote, Building } from "lucide-react";
import { estacionamientoService } from "../../services/estacionamientoService";
import CategoriasCochera from "./CategoriasCochera";
import TiposVehiculo from "./TiposVehiculo";
import MetodosDePago from "./MetodosDePago";

const TABS = [
  { id: "general", label: "General", icon: SlidersHorizontal },
  { id: "categorias", label: "Categorías", icon: Building },
  { id: "tipos", label: "Tipos de vehículo", icon: Car },
  { id: "metodos", label: "Métodos de pago", icon: Banknote },
];

function GeneralForm() {
  const [form, setForm] = useState({
    nombre: "",
    direccion: "",
    diaVencimientoAbono: 10,
    aplicaRecargo: false,
    porcentajeRecargo: 0,
    diasUmbralProporcional: null,
    imprimirReciboAlCobrar: true,
  });
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);
  const [exito, setExito] = useState(false);

  useEffect(() => {
    cargar();
  }, []);

  async function cargar() {
    try {
      setError(null);
      const data = await estacionamientoService.get();
      setForm({
        nombre: data.nombre ?? "",
        direccion: data.direccion ?? "",
        diaVencimientoAbono: data.diaVencimientoAbono,
        aplicaRecargo: data.aplicaRecargo,
        porcentajeRecargo: data.porcentajeRecargo,
        diasUmbralProporcional: data.diasUmbralProporcional ?? "",
        imprimirReciboAlCobrar: data.imprimirReciboAlCobrar !== false,
      });
    } catch {
      setError("No se pudo cargar la configuración");
    } finally {
      setLoading(false);
    }
  }

  function set(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
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
        nombre: form.nombre.trim(),
        direccion: form.direccion.trim(),
        diaVencimientoAbono: Number(form.diaVencimientoAbono),
        aplicaRecargo: form.aplicaRecargo,
        porcentajeRecargo: Number(form.porcentajeRecargo),
        diasUmbralProporcional:
          form.diasUmbralProporcional !== "" ? Number(form.diasUmbralProporcional) : null,
        imprimirReciboAlCobrar: form.imprimirReciboAlCobrar,
      });
      setExito(true);
      setTimeout(() => setExito(false), 3000);
    } catch (err) {
      const msg = err.response?.data;
      setError(typeof msg === "string" ? msg : "No se pudo guardar la configuración");
    } finally {
      setGuardando(false);
    }
  }

  if (loading) return <div className="pk-desc p-2">Cargando...</div>;

  return (
    <form onSubmit={handleGuardar} className="space-y-5 max-w-2xl">
      {error && (
        <div className="px-3 py-2 bg-danger-muted text-danger pk-desc font-semibold rounded-xl border border-line">
          {error}
        </div>
      )}
      {exito && (
        <div className="px-3 py-2 bg-success-muted text-success-ink pk-desc font-semibold rounded-xl border border-line">
          <CheckCircle size={14} className="inline mr-1" />
          Configuración guardada exitosamente
        </div>
      )}

      <div className="bg-surface-card p-5 rounded-2xl border border-line-subtle shadow-pk-card space-y-4">
        <h3 className="pk-label pb-2 border-b border-line-subtle">Identidad</h3>

        <div className="space-y-3">
          <div>
            <label className="pk-caption font-semibold block mb-1">Nombre</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-ink-faint">
                <Building2 size={13} />
              </div>
              <input
                type="text"
                required
                value={form.nombre}
                onChange={(e) => set("nombre", e.target.value)}
                placeholder="Nombre del estacionamiento"
                className="w-full pl-8 pr-3 pk-body font-semibold border border-line rounded-xl py-2.5 bg-surface-muted/50 focus:outline-none focus:border-brand focus:bg-surface-card transition-all"
              />
            </div>
          </div>

          <div>
            <label className="pk-caption font-semibold block mb-1">Dirección</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-ink-faint">
                <MapPin size={13} />
              </div>
              <input
                type="text"
                value={form.direccion}
                onChange={(e) => set("direccion", e.target.value)}
                placeholder="Dirección del estacionamiento"
                className="w-full pl-8 pr-3 pk-body font-semibold border border-line rounded-xl py-2.5 bg-surface-muted/50 focus:outline-none focus:border-brand focus:bg-surface-card transition-all"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-surface-card p-5 rounded-2xl border border-line-subtle shadow-pk-card space-y-4">
        <h3 className="pk-label pb-2 border-b border-line-subtle">Reglas de cobro</h3>

        <div className="space-y-3">
          <div>
            <label className="pk-caption font-semibold block mb-1">Día de vencimiento del abono</label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min={1}
                max={31}
                value={form.diaVencimientoAbono}
                onChange={(e) => set("diaVencimientoAbono", e.target.value)}
                className="w-20 pk-body font-semibold border border-line rounded-xl px-3 py-2.5 bg-surface-muted/50 focus:outline-none focus:border-brand focus:bg-surface-card"
              />
              <span className="pk-caption">de cada mes</span>
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2 cursor-pointer select-none mb-2 pk-caption font-semibold text-ink">
              <input
                type="checkbox"
                checked={form.aplicaRecargo}
                onChange={(e) => set("aplicaRecargo", e.target.checked)}
                className="rounded border-line-strong text-brand focus:ring-brand h-3.5 w-3.5"
              />
              <span>Aplicar recargo por mora</span>
            </label>
            <div className="flex items-center gap-3 ml-6">
              <input
                type="number"
                min={1}
                max={100}
                value={form.porcentajeRecargo}
                onChange={(e) => set("porcentajeRecargo", e.target.value)}
                disabled={!form.aplicaRecargo}
                className="w-20 pk-body font-semibold border border-line rounded-xl px-3 py-2.5 bg-surface-muted/50 focus:outline-none focus:border-brand disabled:opacity-40"
              />
              <span className="pk-caption">% sobre el monto del abono</span>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <label className="pk-caption font-semibold">Umbral proporcional (días)</label>
              <div className="group relative text-ink-faint hover:text-ink-muted cursor-pointer">
                <Info size={12} />
                <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 w-52 p-2 bg-ink text-[10px] text-white rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-lg leading-normal z-10">
                  Si el cliente ingresa después de este día del mes, la 1ª cuota se prorratea.
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min={1}
                max={31}
                value={form.diasUmbralProporcional}
                onChange={(e) => set("diasUmbralProporcional", e.target.value)}
                placeholder="Sin umbral"
                className="w-20 pk-body font-semibold border border-line rounded-xl px-3 py-2.5 bg-surface-muted/50 focus:outline-none focus:border-brand"
              />
              <span className="pk-caption">días desde inicio del mes</span>
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2 cursor-pointer select-none pk-caption font-semibold text-ink">
              <input
                type="checkbox"
                checked={form.imprimirReciboAlCobrar}
                onChange={(e) => set("imprimirReciboAlCobrar", e.target.checked)}
                className="rounded border-line-strong text-brand focus:ring-brand h-3.5 w-3.5"
              />
              <span>Imprimir recibo al cobrar</span>
            </label>
            <p className="pk-caption mt-1 ml-6">
              Si está activo, al cobrar se abre la vista previa del recibo.
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={guardando}
          className="flex items-center gap-2 px-4 py-2.5 bg-brand hover:bg-brand-strong text-brand-foreground rounded-xl pk-label shadow-sm transition-all disabled:opacity-50"
        >
          <Save size={14} />
          {guardando ? "Guardando..." : "Guardar cambios"}
        </button>
      </div>
    </form>
  );
}

export default function General() {
  const [params, setParams] = useSearchParams();
  const tab = useMemo(() => {
    const t = params.get("tab") || "general";
    return TABS.some((x) => x.id === t) ? t : "general";
  }, [params]);

  function setTab(id) {
    setParams(id === "general" ? {} : { tab: id }, { replace: true });
  }

  return (
    <div className="space-y-5 animate-fade-in-up">
      <div>
        <h1 className="pk-title">Datos del estacionamiento</h1>
        <p className="pk-desc mt-1">
          Identidad, reglas de cobro y catálogos operativos (categorías, vehículos y métodos de pago).
        </p>
      </div>

      <div className="flex flex-wrap gap-1.5 p-1 bg-surface-muted rounded-xl border border-line-subtle w-fit max-w-full">
        {TABS.map(({ id, label, icon: Icon }) => {
          const active = tab === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg pk-caption font-bold transition-all ${
                active
                  ? "bg-surface-card text-brand shadow-sm border border-line-subtle"
                  : "text-ink-muted hover:text-ink border border-transparent"
              }`}
            >
              <Icon size={13} />
              {label}
            </button>
          );
        })}
      </div>

      {tab === "general" && <GeneralForm />}
      {tab === "categorias" && <CategoriasCochera embedded />}
      {tab === "tipos" && <TiposVehiculo embedded />}
      {tab === "metodos" && <MetodosDePago embedded />}
    </div>
  );
}
