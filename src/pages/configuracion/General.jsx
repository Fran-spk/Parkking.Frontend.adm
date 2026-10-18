import { useState, useEffect } from "react";
import { Navigate, useSearchParams } from "react-router-dom";
import { Save, CheckCircle, RotateCcw } from "lucide-react";
import { estacionamientoService } from "../../services/estacionamientoService";
import { applyColorMarca, colorMarcaForeground, COLOR_MARCA_DEFAULT } from "../../theme/parkking.theme.js";
import ConfigSeccion from "../../components/layout/ConfigSeccion";
import Checkbox from "../../components/layout/Check";
import FilterSelect, { fieldClass } from "../../components/layout/FilterSelect";
import { PageHeaderAction } from "../../components/layout/PageHeader";
import ReservasConfig from "./ReservasConfig";

const LEGACY = {
  general: "/configuracion/general",
  categorias: "/configuracion/catalogos?tab=categorias",
  tipos: "/configuracion/catalogos?tab=tipos",
  metodos: "/configuracion/catalogos?tab=metodos",
  gastos: "/configuracion/finanzas?tab=gastos",
  rotativo: "/configuracion/zonas?tab=rotativo",
  zonas: "/configuracion/zonas",
};

function Bloque({ title, hint, children }) {
  return (
    <div className="bg-surface-card p-5 space-y-4">
      <h3 className="pk-label pb-2 border-b border-line-subtle">{title}</h3>
      {hint ? <p className="pk-caption -mt-2">{hint}</p> : null}
      {children}
    </div>
  );
}

function GeneralForm() {
  const [form, setForm] = useState({
    nombre: "",
    direccion: "",
    colorMarca: COLOR_MARCA_DEFAULT,
    locadorNombre: "",
    locadorDocumento: "",
    locadorDomicilio: "",
    diaVencimientoAbono: 10,
    aplicaRecargo: false,
    porcentajeRecargo: 0,
    imprimirReciboAlCobrar: true,
    enviarReciboPorEmail: false,
    trabajarConZonas: false,
    contratoSeguroObligatorio: true,
    contratoPlazoMeses: 12,
    generarContratoAlCrearAbono: true,
    emailAvisos: "",
    avisoDeudaActivo: false,
    diaInicioAvisoDeuda: 10,
    frecuenciaAvisoDeuda: 0,
    operatoriaRotativo: 0,
    toleranciaRotativoMinutos: 0,
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
        colorMarca: data.colorMarca || COLOR_MARCA_DEFAULT,
        locadorNombre: data.locadorNombre ?? "",
        locadorDocumento: data.locadorDocumento ?? "",
        locadorDomicilio: data.locadorDomicilio ?? "",
        diaVencimientoAbono: data.diaVencimientoAbono,
        aplicaRecargo: data.aplicaRecargo,
        porcentajeRecargo: data.porcentajeRecargo,
        imprimirReciboAlCobrar: data.imprimirReciboAlCobrar !== false,
        enviarReciboPorEmail: !!data.enviarReciboPorEmail,
        trabajarConZonas: !!data.trabajarConZonas,
        contratoSeguroObligatorio: data.contratoSeguroObligatorio !== false,
        contratoPlazoMeses:
          data.contratoPlazoMeses && Number(data.contratoPlazoMeses) > 0 ? data.contratoPlazoMeses : 12,
        generarContratoAlCrearAbono: data.generarContratoAlCrearAbono !== false,
        emailAvisos: data.emailAvisos ?? "",
        avisoDeudaActivo: data.diaInicioAvisoDeuda != null,
        diaInicioAvisoDeuda: data.diaInicioAvisoDeuda ?? 10,
        frecuenciaAvisoDeuda: Number(data.frecuenciaAvisoDeuda) || 0,
        operatoriaRotativo: Number(data.operatoriaRotativo) || 0,
        toleranciaRotativoMinutos: Number(data.toleranciaRotativoMinutos) || 0,
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
    if (!/^#[0-9a-fA-F]{6}$/.test(form.colorMarca)) {
      setError("El color debe ser un RGB hexadecimal, por ejemplo #0f172a");
      return;
    }
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
    if (form.avisoDeudaActivo && (form.diaInicioAvisoDeuda < 1 || form.diaInicioAvisoDeuda > 31)) {
      setError("El día de inicio del aviso de deuda debe estar entre 1 y 31");
      return;
    }
    try {
      setGuardando(true);
      setError(null);
      await estacionamientoService.modificar({
        nombre: form.nombre.trim(),
        direccion: form.direccion.trim(),
        colorMarca: form.colorMarca,
        locadorNombre: form.locadorNombre.trim() || null,
        locadorDocumento: form.locadorDocumento.trim() || null,
        locadorDomicilio: form.locadorDomicilio.trim() || null,
        diaVencimientoAbono: Number(form.diaVencimientoAbono),
        aplicaRecargo: form.aplicaRecargo,
        porcentajeRecargo: Number(form.porcentajeRecargo),
        imprimirReciboAlCobrar: form.imprimirReciboAlCobrar,
        enviarReciboPorEmail: form.enviarReciboPorEmail,
        trabajarConZonas: form.trabajarConZonas,
        contratoSeguroObligatorio: form.contratoSeguroObligatorio,
        contratoPlazoMeses: Number(form.contratoPlazoMeses),
        generarContratoAlCrearAbono: form.generarContratoAlCrearAbono,
        emailAvisos: form.emailAvisos.trim(),
        diaInicioAvisoDeuda: form.avisoDeudaActivo ? Number(form.diaInicioAvisoDeuda) : null,
        frecuenciaAvisoDeuda: Number(form.frecuenciaAvisoDeuda) || 0,
        operatoriaRotativo: Number(form.operatoriaRotativo) || 0,
        toleranciaRotativoMinutos: Number(form.toleranciaRotativoMinutos) || 0,
      });
      applyColorMarca(form.colorMarca);
      setExito(true);
      setTimeout(() => setExito(false), 3000);
    } catch (err) {
      const msg = err.response?.data;
      setError(typeof msg === "string" ? msg : "No se pudo guardar la configuración");
    } finally {
      setGuardando(false);
    }
  }

  if (loading) return <p className="pk-desc p-2">Cargando...</p>;

  return (
    <form onSubmit={handleGuardar} className="space-y-5 max-w-2xl">
      {error && <div className="px-3 py-2 bg-danger-muted text-danger pk-desc font-semibold">{error}</div>}
      {exito && (
        <div className="px-3 py-2 bg-success-muted text-success-ink pk-desc font-semibold">
          <CheckCircle size={14} className="inline mr-1" />
          Configuración guardada
        </div>
      )}

      <Bloque title="Identidad">
        <label className="block space-y-1">
          <span className="pk-caption font-semibold">Nombre</span>
          <input
            type="text"
            required
            value={form.nombre}
            onChange={(e) => set("nombre", e.target.value)}
            placeholder="Nombre del estacionamiento"
            className={fieldClass}
          />
        </label>
        <label className="block space-y-1">
          <span className="pk-caption font-semibold">Dirección</span>
          <input
            type="text"
            value={form.direccion}
            onChange={(e) => set("direccion", e.target.value)}
            placeholder="Dirección del estacionamiento"
            className={fieldClass}
          />
        </label>
      </Bloque>

      <Bloque title="Apariencia" hint="Color de los botones y del ítem activo del menú. Cada estacionamiento guarda el suyo.">
        <div className="flex items-center gap-3">
          <input
            type="color"
            aria-label="Color de marca"
            value={/^#[0-9a-fA-F]{6}$/.test(form.colorMarca) ? form.colorMarca : COLOR_MARCA_DEFAULT}
            onChange={(e) => set("colorMarca", e.target.value)}
            className="h-11 w-14 cursor-pointer border border-line bg-surface-card p-1"
          />
          <div className="w-28">
            <input
              type="text"
              value={form.colorMarca}
              maxLength={7}
              spellCheck={false}
              onChange={(e) => set("colorMarca", e.target.value)}
              className={`${fieldClass} uppercase`}
            />
          </div>
          <span
            className="inline-flex items-center px-3 py-2.5 text-xs font-semibold"
            style={{ background: form.colorMarca, color: colorMarcaForeground(form.colorMarca) }}
          >
            Botón
          </span>
          <button
            type="button"
            disabled={form.colorMarca.toLowerCase() === COLOR_MARCA_DEFAULT}
            onClick={() => set("colorMarca", COLOR_MARCA_DEFAULT)}
            className="inline-flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold text-ink bg-surface-muted hover:bg-brand-muted disabled:opacity-40"
          >
            <RotateCcw size={13} />
            Restablecer
          </button>
        </div>
      </Bloque>

      <Bloque title="Locador (contrato)" hint="Datos del titular en el PDF. Si el domicilio queda vacío, se usa la dirección del estacionamiento.">
        <label className="block space-y-1">
          <span className="pk-caption font-semibold">Nombre / razón social</span>
          <input
            type="text"
            value={form.locadorNombre}
            onChange={(e) => set("locadorNombre", e.target.value)}
            placeholder="Ej: Silvina Persig"
            className={fieldClass}
          />
        </label>
        <label className="block space-y-1">
          <span className="pk-caption font-semibold">DNI / CUIT</span>
          <input
            type="text"
            value={form.locadorDocumento}
            onChange={(e) => set("locadorDocumento", e.target.value)}
            placeholder="Documento del locador"
            className={fieldClass}
          />
        </label>
        <label className="block space-y-1">
          <span className="pk-caption font-semibold">Domicilio del locador</span>
          <input
            type="text"
            value={form.locadorDomicilio}
            onChange={(e) => set("locadorDomicilio", e.target.value)}
            placeholder="Opcional — si vacío usa la dirección del estacionamiento"
            className={fieldClass}
          />
        </label>
      </Bloque>

      <Bloque title="Reglas de cobro">
        <label className="block space-y-1">
          <span className="pk-caption font-semibold">Día de vencimiento del abono</span>
          <div className="flex items-center gap-3">
            <div className="w-20">
              <input
                type="number"
                min={1}
                max={31}
                value={form.diaVencimientoAbono}
                onChange={(e) => set("diaVencimientoAbono", e.target.value)}
                className={fieldClass}
              />
            </div>
            <span className="pk-caption">de cada mes</span>
          </div>
        </label>

        <div>
          <label className="flex items-center gap-2 cursor-pointer select-none pk-caption font-semibold text-ink">
            <Checkbox checked={form.aplicaRecargo} onChange={(e) => set("aplicaRecargo", e.target.checked)} />
            Aplicar recargo por mora
          </label>
          <div className="flex items-center gap-3 ml-6 mt-2">
            <div className="w-20">
              <input
                type="number"
                min={1}
                max={100}
                value={form.porcentajeRecargo}
                onChange={(e) => set("porcentajeRecargo", e.target.value)}
                disabled={!form.aplicaRecargo}
                className={fieldClass}
              />
            </div>
            <span className="pk-caption">% sobre el monto del abono</span>
          </div>
        </div>

        <div>
          <label className="flex items-center gap-2 cursor-pointer select-none pk-caption font-semibold text-ink">
            <Checkbox checked={form.imprimirReciboAlCobrar} onChange={(e) => set("imprimirReciboAlCobrar", e.target.checked)} />
            Imprimir recibo al pagar
          </label>
          <p className="pk-caption mt-1 ml-6">Si está activo, al registrar el pago se abre la vista previa del recibo.</p>
        </div>

        <div>
          <label className="flex items-center gap-2 cursor-pointer select-none pk-caption font-semibold text-ink">
            <Checkbox checked={form.trabajarConZonas} onChange={(e) => set("trabajarConZonas", e.target.checked)} />
            Trabajar con zonas de cocheras
          </label>
          <p className="pk-caption mt-1 ml-6">
            Cada cochera tiene que pertenecer a una zona. Para activarlo, todas las cocheras activas ya tienen que tener zona.
          </p>
        </div>

        <div>
          <label className="flex items-center gap-2 cursor-pointer select-none pk-caption font-semibold text-ink">
            <Checkbox checked={form.enviarReciboPorEmail} onChange={(e) => set("enviarReciboPorEmail", e.target.checked)} />
            Enviar recibo por email al pagar
          </label>
          <p className="pk-caption mt-1 ml-6">
            Se manda al email del abono o del cliente. Si no hay destinatario, el pago igual se confirma.
          </p>
        </div>

        <div>
          <label className="flex items-center gap-2 cursor-pointer select-none pk-caption font-semibold text-ink">
            <Checkbox checked={form.avisoDeudaActivo} onChange={(e) => set("avisoDeudaActivo", e.target.checked)} />
            Avisar por mail quién debe
          </label>
          <p className="pk-caption mt-1 ml-6">
            Desde el día elegido hasta fin de mes, a los usuarios con la acción Recibir aviso de deuda.
          </p>
          <div className="flex items-center gap-3 ml-6 mt-2">
            <div className="w-20">
              <input
                type="number"
                min={1}
                max={31}
                value={form.diaInicioAvisoDeuda}
                onChange={(e) => set("diaInicioAvisoDeuda", e.target.value)}
                disabled={!form.avisoDeudaActivo}
                className={fieldClass}
              />
            </div>
            <FilterSelect
              ariaLabel="Frecuencia de aviso"
              value={form.frecuenciaAvisoDeuda}
              onChange={(v) => set("frecuenciaAvisoDeuda", Number(v))}
              disabled={!form.avisoDeudaActivo}
              options={[
                { value: 0, label: "Una vez en el mes" },
                { value: 1, label: "Todos los días" },
              ]}
            />
          </div>
        </div>

        <label className="block space-y-1">
          <span className="pk-caption font-semibold">Email de avisos</span>
          <input
            type="email"
            value={form.emailAvisos}
            onChange={(e) => set("emailAvisos", e.target.value)}
            placeholder="avisos@tu-estacionamiento.com"
            className={fieldClass}
          />
          <p className="pk-caption">Casilla del estacionamiento para mails a clientes. El SMTP global se configura en el servidor.</p>
        </label>
      </Bloque>

      <Bloque title="Contrato de abono (PDF)" hint="Texto del contrato y si se descarga al dar de alta un abono.">
        <div>
          <label className="flex items-center gap-2 cursor-pointer select-none pk-caption font-semibold text-ink">
            <Checkbox
              checked={form.generarContratoAlCrearAbono}
              onChange={(e) => set("generarContratoAlCrearAbono", e.target.checked)}
            />
            Generar contrato automáticamente al crear un abono
          </label>
          <p className="pk-caption mt-1 ml-6">Al finalizar el alta se descarga el PDF. Siempre se puede volver a descargar desde el abono.</p>
        </div>
        <div>
          <label className="flex items-center gap-2 cursor-pointer select-none pk-caption font-semibold text-ink">
            <Checkbox
              checked={form.contratoSeguroObligatorio}
              onChange={(e) => set("contratoSeguroObligatorio", e.target.checked)}
            />
            Seguro del vehículo obligatorio
          </label>
          <p className="pk-caption mt-1 ml-6">Si está activo, el PDF incluye la cláusula de seguro vigente.</p>
        </div>
        <label className="block space-y-1">
          <span className="pk-caption font-semibold">Plazo del contrato</span>
          <div className="flex items-center gap-3">
            <div className="w-20">
              <input
                type="number"
                min={1}
                max={120}
                value={form.contratoPlazoMeses}
                onChange={(e) => set("contratoPlazoMeses", e.target.value)}
                className={fieldClass}
              />
            </div>
            <span className="pk-caption">meses (igual para todas las plazas)</span>
          </div>
        </label>
      </Bloque>

      <Bloque
        title="Rotativo"
        hint="La operatoria es de las estadías, no de las zonas de cocheras. La tolerancia es una sola para la playa: minutos de gracia al cumplir una fracción. En cero está apagada."
      >
        <label className="block space-y-1">
          <span className="pk-caption font-semibold">Operatoria</span>
          <FilterSelect
            className="w-full"
            ariaLabel="Operatoria rotativo"
            value={form.operatoriaRotativo}
            onChange={(v) => set("operatoriaRotativo", Number(v))}
            options={[
              { value: 0, label: "Libre, sin zona" },
              { value: 1, label: "Por zona de rotativo" },
            ]}
          />
        </label>
        <label className="block space-y-1">
          <span className="pk-caption font-semibold">Tolerancia</span>
          <div className="flex items-center gap-3">
            <div className="w-24">
              <input
                type="number"
                min={0}
                value={form.toleranciaRotativoMinutos}
                onChange={(e) => set("toleranciaRotativoMinutos", e.target.value)}
                className={fieldClass}
              />
            </div>
            <span className="pk-caption">minutos</span>
          </div>
        </label>
      </Bloque>

      <div className="flex justify-end">
        <PageHeaderAction type="submit" disabled={guardando}>
          <Save size={14} />
          {guardando ? "Guardando..." : "Guardar cambios"}
        </PageHeaderAction>
      </div>
    </form>
  );
}

export default function General() {
  const [params] = useSearchParams();
  const dest = LEGACY[params.get("tab")];
  if (dest) return <Navigate to={dest} replace />;

  return (
    <ConfigSeccion
      title="Estacionamiento"
      description="Identidad, reglas de cobro, contrato y operatoria. Los catálogos y las zonas tienen su propia página."
      tabs={[
        { value: "identidad", label: "Identidad y reglas" },
        { value: "reservas", label: "Reservas" },
      ]}
    >
      {(tab) => (tab === "reservas" ? <ReservasConfig embedded /> : <GeneralForm />)}
    </ConfigSeccion>
  );
}
