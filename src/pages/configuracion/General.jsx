import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Save, CheckCircle, Building2, MapPin, SlidersHorizontal, Car, Banknote, Building } from "lucide-react";
import { estacionamientoService } from "../../services/estacionamientoService";

/** @typedef {import("../../types").Estacionamiento} Estacionamiento */
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
    locadorNombre: "",
    locadorDocumento: "",
    locadorDomicilio: "",
    diaVencimientoAbono: 10,
    aplicaRecargo: false,
    porcentajeRecargo: 0,
    imprimirReciboAlCobrar: true,
    enviarReciboPorEmail: false,
    contratoSeguroObligatorio: true,
    contratoPlazoMeses: 12,
    generarContratoAlCrearAbono: true,
    emailAvisos: "",
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
        locadorNombre: data.locadorNombre ?? "",
        locadorDocumento: data.locadorDocumento ?? "",
        locadorDomicilio: data.locadorDomicilio ?? "",
        diaVencimientoAbono: data.diaVencimientoAbono,
        aplicaRecargo: data.aplicaRecargo,
        porcentajeRecargo: data.porcentajeRecargo,
        imprimirReciboAlCobrar: data.imprimirReciboAlCobrar !== false,
        enviarReciboPorEmail: !!data.enviarReciboPorEmail,
        contratoSeguroObligatorio: data.contratoSeguroObligatorio !== false,
        contratoPlazoMeses:
          data.contratoPlazoMeses && Number(data.contratoPlazoMeses) > 0
            ? data.contratoPlazoMeses
            : 12,
        generarContratoAlCrearAbono: data.generarContratoAlCrearAbono !== false,
        emailAvisos: data.emailAvisos ?? "",
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
    if (!form.emailAvisos.trim()) {
      setError("El email de avisos es obligatorio");
      return;
    }
    if (form.contratoPlazoMeses < 1 || form.contratoPlazoMeses > 120) {
      setError("El plazo del contrato debe estar entre 1 y 120 meses");
      return;
    }
    try {
      setGuardando(true);
      setError(null);
      await estacionamientoService.modificar({
        nombre: form.nombre.trim(),
        direccion: form.direccion.trim(),
        locadorNombre: form.locadorNombre.trim() || null,
        locadorDocumento: form.locadorDocumento.trim() || null,
        locadorDomicilio: form.locadorDomicilio.trim() || null,
        diaVencimientoAbono: Number(form.diaVencimientoAbono),
        aplicaRecargo: form.aplicaRecargo,
        porcentajeRecargo: Number(form.porcentajeRecargo),
        imprimirReciboAlCobrar: form.imprimirReciboAlCobrar,
        enviarReciboPorEmail: form.enviarReciboPorEmail,
        contratoSeguroObligatorio: form.contratoSeguroObligatorio,
        contratoPlazoMeses: Number(form.contratoPlazoMeses),
        generarContratoAlCrearAbono: form.generarContratoAlCrearAbono,
        emailAvisos: form.emailAvisos.trim(),
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

      <div className="bg-surface-card p-5 rounded-2xl border border-transparent shadow-none space-y-4">
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

      <div className="bg-surface-card p-5 rounded-2xl border border-transparent shadow-none space-y-4">
        <h3 className="pk-label pb-2 border-b border-line-subtle">Locador (contrato)</h3>
        <p className="pk-caption -mt-2">
          Datos del titular en el PDF. Si el domicilio queda vacío, se usa la dirección del
          estacionamiento.
        </p>
        <div className="space-y-3">
          <div>
            <label className="pk-caption font-semibold block mb-1">Nombre / razón social</label>
            <input
              type="text"
              value={form.locadorNombre}
              onChange={(e) => set("locadorNombre", e.target.value)}
              placeholder="Ej: Silvina Persig"
              className="w-full pk-body border border-line rounded-xl px-3 py-2.5 bg-surface-muted/50 focus:outline-none focus:border-brand"
            />
          </div>
          <div>
            <label className="pk-caption font-semibold block mb-1">DNI / CUIT</label>
            <input
              type="text"
              value={form.locadorDocumento}
              onChange={(e) => set("locadorDocumento", e.target.value)}
              placeholder="Documento del locador"
              className="w-full max-w-xs pk-body border border-line rounded-xl px-3 py-2.5 bg-surface-muted/50 focus:outline-none focus:border-brand"
            />
          </div>
          <div>
            <label className="pk-caption font-semibold block mb-1">Domicilio del locador</label>
            <input
              type="text"
              value={form.locadorDomicilio}
              onChange={(e) => set("locadorDomicilio", e.target.value)}
              placeholder="Opcional — si vacío usa la dirección del estacionamiento"
              className="w-full pk-body border border-line rounded-xl px-3 py-2.5 bg-surface-muted/50 focus:outline-none focus:border-brand"
            />
          </div>
        </div>
      </div>

      <div className="bg-surface-card p-5 rounded-2xl border border-transparent shadow-none space-y-4">
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

          <div>
            <label className="flex items-center gap-2 cursor-pointer select-none pk-caption font-semibold text-ink">
              <input
                type="checkbox"
                checked={form.enviarReciboPorEmail}
                onChange={(e) => set("enviarReciboPorEmail", e.target.checked)}
                className="rounded border-line-strong text-brand focus:ring-brand h-3.5 w-3.5"
              />
              <span>Enviar recibo por email al cobrar</span>
            </label>
            <p className="pk-caption mt-1 ml-6">
              Si está activo, al registrar un pago se manda el recibo al email del abono o del
              cliente. Si no hay destinatario, el cobro igual se confirma.
            </p>
          </div>

          <div>
            <label className="pk-caption font-semibold block mb-1.5">Email de avisos</label>
            <input
              type="email"
              value={form.emailAvisos}
              onChange={(e) => set("emailAvisos", e.target.value)}
              placeholder="avisos@tu-estacionamiento.com"
              className="w-full max-w-md pk-body border border-line rounded-xl px-3 py-2.5 bg-surface-muted/50 focus:outline-none focus:border-brand"
            />
            <p className="pk-caption mt-1.5">
              Casilla del estacionamiento para mails a clientes (remitente / responder a). El SMTP
              global de Parkking se configura en el servidor.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-surface-card p-5 rounded-2xl border border-transparent shadow-none space-y-4">
        <h3 className="pk-label pb-2 border-b border-line-subtle">Contrato de abono (PDF)</h3>
        <p className="pk-caption -mt-2">
          Configura el texto del contrato y si se descarga automáticamente al dar de alta un abono.
        </p>

        <div className="space-y-3">
          <div>
            <label className="flex items-center gap-2 cursor-pointer select-none pk-caption font-semibold text-ink">
              <input
                type="checkbox"
                checked={form.generarContratoAlCrearAbono}
                onChange={(e) => set("generarContratoAlCrearAbono", e.target.checked)}
                className="rounded border-line-strong text-brand focus:ring-brand h-3.5 w-3.5"
              />
              <span>Generar contrato automáticamente al crear un abono</span>
            </label>
            <p className="pk-caption mt-1 ml-6">
              Si está activo, al finalizar el alta se descarga el PDF. Siempre se puede volver a
              descargar desde el abono.
            </p>
          </div>

          <div>
            <label className="flex items-center gap-2 cursor-pointer select-none pk-caption font-semibold text-ink">
              <input
                type="checkbox"
                checked={form.contratoSeguroObligatorio}
                onChange={(e) => set("contratoSeguroObligatorio", e.target.checked)}
                className="rounded border-line-strong text-brand focus:ring-brand h-3.5 w-3.5"
              />
              <span>Seguro del vehículo obligatorio</span>
            </label>
            <p className="pk-caption mt-1 ml-6">
              Si está activo, el PDF incluye la cláusula de seguro vigente.
            </p>
          </div>

          <div>
            <label className="pk-caption font-semibold block mb-1">Plazo del contrato</label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min={1}
                max={120}
                value={form.contratoPlazoMeses}
                onChange={(e) => set("contratoPlazoMeses", e.target.value)}
                className="w-20 pk-body font-semibold border border-line rounded-xl px-3 py-2.5 bg-surface-muted/50 focus:outline-none focus:border-brand focus:bg-surface-card"
              />
              <span className="pk-caption">meses (igual para todas las plazas)</span>
            </div>
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
