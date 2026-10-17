import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import DatePicker from "react-datepicker";
import { es } from "date-fns/locale";
import "react-datepicker/dist/react-datepicker.css";
import { ArrowLeft, Plus, Trash2, Check, Loader2 } from "lucide-react";

import BuscadorCliente from "../components/layout/BuscadorCliente";
import FiltroSegmentado from "../components/layout/FiltroSegmentado";
import Patente from "../components/layout/Patente";
import { plata } from "../utils/clienteHelpers";
import { cocheraService } from "../services/cocheraService";
import { tipoVehiculoService } from "../services/tipoVehiculoService";
import { tarifaMensualService } from "../services/tarifaMensualService";
import { abonoService } from "../services/abonoService";
import { reservaService } from "../services/reservaService";
import { estacionamientoService } from "../services/estacionamientoService";
import { clienteService } from "../services/clienteService";
import FilterSelect, { fieldClass } from "../components/layout/FilterSelect";

/** @typedef {import("../types").Cliente} Cliente */
/** @typedef {import("../types").Vehiculo} Vehiculo */
/** @typedef {import("../types").Cochera} Cochera */
/** @typedef {import("../types").TipoVehiculo} TipoVehiculo */
import { MODALIDAD, modalidadLabel } from "../utils/abonoHelpers";
import { newKey } from "../utils/newKey";
import {
  PERIODICIDAD,
  PERIODICIDAD_OPTIONS,
  POLITICA_PRIMER_PERIODO,
  DIA_MAX_SIN_PRORRATEO,
  resolverPrimerPeriodo,
  opcionesPoliticaPrimerPeriodo,
  formatearPeriodoLabel,
  formatDateYmd,
} from "../utils/periodicidadHelpers";

const SECTIONS = [
  { id: "cliente", label: "Cliente" },
  { id: "estructura", label: "Plazas y vehículos" },
  { id: "condiciones", label: "Condiciones" },
];

const ORIGEN_VEHICULO = { EXISTENTE: "existente", NUEVO: "nuevo" };
const MENU_ESTRUCTURA = { FIJOS: "fijos", FLEXIBLES: "flexibles" };

function emptyVehiculo(modalidad = MODALIDAD.FIJO) {
  return {
    key: newKey(),
    origen: ORIGEN_VEHICULO.NUEVO,
    vehiculoId: "",
    patente: "",
    modeloVehiculo: "",
    tipoVehiculoId: "",
    modalidad,
    cocheraId: "",
  };
}

const labelCls = "pk-label block mb-1.5";

function Seccion({ id, titulo, nota, extra, children }) {
  return (
    <section id={id} className="scroll-mt-36 bg-surface-card">
      <header className="flex items-baseline justify-between gap-3 px-5 py-3 border-b border-line">
        <div className="min-w-0">
          <h2 className="text-sm font-bold text-ink">{titulo}</h2>
          {nota ? <p className="pk-caption mt-0.5">{nota}</p> : null}
        </div>
        {extra}
      </header>
      <div className="px-5 py-4">{children}</div>
    </section>
  );
}

export default function NuevoAbono() {
  const navigate = useNavigate();
  const [cliente, setCliente] = useState(/** @type {Cliente | null} */ (null));
  const [menuEstructura, setMenuEstructura] = useState(MENU_ESTRUCTURA.FIJOS);
  const [plazasFlexibles, setPlazasFlexibles] = useState([]);
  const [plazaParaAgregar, setPlazaParaAgregar] = useState("");
  const [vehiculos, setVehiculos] = useState([emptyVehiculo(MODALIDAD.FIJO)]);
  const [vehiculosCliente, setVehiculosCliente] = useState(/** @type {Vehiculo[]} */ ([]));
  const [cargandoVehiculos, setCargandoVehiculos] = useState(false);
  const [cobrador, setCobrador] = useState("");
  const [fechaInicio, setFechaInicio] = useState(new Date());
  const [periodicidad, setPeriodicidad] = useState(PERIODICIDAD.MENSUAL);
  const [politicaPrimerPeriodo, setPoliticaPrimerPeriodo] = useState(
    POLITICA_PRIMER_PERIODO.COMPLETO
  );
  const [precioAcordado, setPrecioAcordado] = useState("");
  const [precioSugerido, setPrecioSugerido] = useState(null);
  const [esFallback, setEsFallback] = useState(false);
  const [cocherasDisponibles, setCocherasDisponibles] = useState(/** @type {Cochera[]} */ ([]));
  const [tipos, setTipos] = useState(/** @type {TipoVehiculo[]} */ ([]));
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);
  const [avisosReserva, setAvisosReserva] = useState([]);
  const [activeSection, setActiveSection] = useState("cliente");
  const [generarContratoAlCrearAbono, setGenerarContratoAlCrearAbono] = useState(true);

  useEffect(() => {
    Promise.all([
      tipoVehiculoService.getAll(),
      cocheraService.getAll(),
      estacionamientoService.get().catch(() => null),
    ])
      .then(([tiposData, cocherasData, estacionamiento]) => {
        setTipos(tiposData || []);
        setCocherasDisponibles(
          (cocherasData || []).filter(c => c.activo !== false && c.estaDisponible !== false)
        );
        setGenerarContratoAlCrearAbono(estacionamiento?.generarContratoAlCrearAbono !== false);
      })
      .catch(() => setError("No se pudieron cargar cocheras o tipos de vehículo"));
  }, []);

  useEffect(() => {
    if (!cliente?.clienteId) {
      setVehiculosCliente([]);
      return;
    }
    let cancelled = false;
    setCargandoVehiculos(true);
    clienteService
      .getVehiculos(cliente.clienteId, false)
      .then(list => {
        if (!cancelled) setVehiculosCliente(Array.isArray(list) ? list : []);
      })
      .catch(() => {
        if (!cancelled) setVehiculosCliente([]);
      })
      .finally(() => {
        if (!cancelled) setCargandoVehiculos(false);
      });
    return () => {
      cancelled = true;
    };
  }, [cliente?.clienteId]);

  // Día 1–2: no prorratear
  useEffect(() => {
    if (!fechaInicio) return;
    if (
      fechaInicio.getDate() <= DIA_MAX_SIN_PRORRATEO &&
      politicaPrimerPeriodo === POLITICA_PRIMER_PERIODO.PRORRATEAR
    ) {
      setPoliticaPrimerPeriodo(POLITICA_PRIMER_PERIODO.COMPLETO);
    }
  }, [fechaInicio, politicaPrimerPeriodo]);

  const planCobro = useMemo(() => {
    if (!fechaInicio) return null;
    const hayFlexible = vehiculos.some(
      v =>
        Number(v.modalidad) === MODALIDAD.FLEXIBLE &&
        (v.origen === ORIGEN_VEHICULO.EXISTENTE ? !!v.vehiculoId : !!v.patente.trim())
    );
    const montoBase =
      precioAcordado !== "" && precioAcordado != null
        ? Number(precioAcordado)
        : !hayFlexible && precioSugerido != null
          ? Number(precioSugerido)
          : null;
    const resolved =
      montoBase != null && !Number.isNaN(montoBase)
        ? resolverPrimerPeriodo({
            fechaIngreso: fechaInicio,
            periodicidad,
            politica: politicaPrimerPeriodo,
            montoBaseCiclo: montoBase,
          })
        : resolverPrimerPeriodo({
            fechaIngreso: fechaInicio,
            periodicidad,
            politica: politicaPrimerPeriodo,
            montoBaseCiclo: 0,
          });

    return {
      fechaInicioCobro: resolved.periodo.inicio,
      periodo: resolved.periodo,
      label: formatearPeriodoLabel(
        resolved.periodo.inicio,
        resolved.periodo.fin,
        periodicidad
      ),
      prorratea: resolved.fueProrrateado,
      montoBase,
      montoPrimera:
        montoBase != null && !Number.isNaN(montoBase) ? resolved.monto : null,
      periodicidadLabel:
        PERIODICIDAD_OPTIONS.find(o => o.value === Number(periodicidad))?.label || "Mensual",
    };
  }, [fechaInicio, periodicidad, politicaPrimerPeriodo, precioAcordado, precioSugerido, vehiculos]);

  const puedeProrratear = useMemo(() => {
    if (!fechaInicio) return false;
    return fechaInicio.getDate() > DIA_MAX_SIN_PRORRATEO;
  }, [fechaInicio]);

  const opcionesPolitica = useMemo(
    () => opcionesPoliticaPrimerPeriodo(periodicidad),
    [periodicidad]
  );

  useEffect(() => {
    const completos = vehiculos.filter(v =>
      v.origen === ORIGEN_VEHICULO.EXISTENTE ? !!v.vehiculoId : !!v.patente.trim()
    );
    const tieneFlexible = completos.some(v => Number(v.modalidad) === MODALIDAD.FLEXIBLE);
    // Flexibles: nunca sugerir precio de lista.
    if (tieneFlexible) {
      setPrecioSugerido(null);
      setEsFallback(false);
      return;
    }

    const fijos = completos.filter(
      v => Number(v.modalidad) === MODALIDAD.FIJO && v.tipoVehiculoId && v.cocheraId
    );
    if (fijos.length === 0) {
      setPrecioSugerido(null);
      setEsFallback(false);
      return;
    }

    let cancelled = false;
    Promise.all(
      fijos.map(v => {
        const cochera = cocherasDisponibles.find(c => c.cocheraId === Number(v.cocheraId));
        return tarifaMensualService.getVigente(
          v.tipoVehiculoId,
          cochera?.categoriaCocheraId ?? null,
          periodicidad
        );
      })
    )
      .then(tarifas => {
        if (cancelled) return;
        const total = tarifas.reduce((acc, t) => acc + Number(t.precio || 0), 0);
        setPrecioSugerido(total > 0 ? total : null);
        setEsFallback(false);
      })
      .catch(() => {
        if (!cancelled) {
          setPrecioSugerido(null);
          setEsFallback(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [vehiculos, cocherasDisponibles, periodicidad]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        const visible = entries
          .filter(e => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target?.id) setActiveSection(visible.target.id.replace("sec-", ""));
      },
      { rootMargin: "-20% 0px -55% 0px", threshold: [0.15, 0.4, 0.7] }
    );
    SECTIONS.forEach(s => {
      const el = document.getElementById(`sec-${s.id}`);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  const cocheraIdsFijos = useMemo(
    () =>
      [
        ...new Set(
          vehiculos
            .filter(v => Number(v.modalidad) === MODALIDAD.FIJO && v.cocheraId)
            .map(v => Number(v.cocheraId))
        ),
      ],
    [vehiculos]
  );

  const plazasSeleccionadas = useMemo(
    () => [...new Set([...cocheraIdsFijos, ...plazasFlexibles])],
    [cocheraIdsFijos, plazasFlexibles]
  );

  const plazasKey = plazasSeleccionadas.join(",");
  useEffect(() => {
    if (!plazasKey) {
      setAvisosReserva([]);
      return;
    }
    let cancel = false;
    Promise.all(plazasSeleccionadas.map((cocheraId) => reservaService.avisos(cocheraId).catch(() => [])))
      .then((listas) => {
        if (cancel) return;
        const unicos = new Map();
        listas.flat().forEach((aviso) => unicos.set(aviso.reservaId, aviso));
        setAvisosReserva([...unicos.values()]);
      });
    return () => {
      cancel = true;
    };
  }, [plazasKey]);

  const plazasDetalle = useMemo(
    () =>
      plazasSeleccionadas
        .map(id => cocherasDisponibles.find(c => c.cocheraId === id))
        .filter(Boolean),
    [plazasSeleccionadas, cocherasDisponibles]
  );

  const cocherasParaAgregar = cocherasDisponibles.filter(
    c => !plazasFlexibles.includes(c.cocheraId)
  );

  const vehiculosFijos = useMemo(
    () => vehiculos.filter(v => Number(v.modalidad) === MODALIDAD.FIJO),
    [vehiculos]
  );
  const vehiculosFlex = useMemo(
    () => vehiculos.filter(v => Number(v.modalidad) === MODALIDAD.FLEXIBLE),
    [vehiculos]
  );

  const vehiculosCompletos = vehiculos.filter(v =>
    v.origen === ORIGEN_VEHICULO.EXISTENTE ? !!v.vehiculoId : !!v.patente.trim()
  );

  const tieneFlexible = vehiculosCompletos.some(
    v => Number(v.modalidad) === MODALIDAD.FLEXIBLE
  );

  const checklist = {
    cliente: !!cliente?.clienteId,
    estructura: plazasSeleccionadas.length > 0,
    condiciones: !!fechaInicio,
  };

  const puedeCrear = checklist.cliente && checklist.estructura && !guardando;

  function idsVehiculosYaElegidos(exceptoKey) {
    return new Set(
      vehiculos
        .filter(v => v.key !== exceptoKey && v.origen === ORIGEN_VEHICULO.EXISTENTE && v.vehiculoId)
        .map(v => Number(v.vehiculoId))
    );
  }

  function todosVehiculosParaSelect(exceptoKey) {
    const usados = idsVehiculosYaElegidos(exceptoKey);
    return vehiculosCliente.map(v => ({
      ...v,
      _disabled: usados.has(Number(v.vehiculoId)) || !!v.asignadoAAbonoActivo,
      _motivo: usados.has(Number(v.vehiculoId))
        ? "ya elegido"
        : v.asignadoAAbonoActivo
          ? "en otro abono"
          : null,
    }));
  }

  function agregarPlazaFlexible() {
    if (!plazaParaAgregar) return;
    setPlazasFlexibles(prev => [...prev, Number(plazaParaAgregar)]);
    setPlazaParaAgregar("");
  }

  function quitarPlazaFlexible(cocheraId) {
    setPlazasFlexibles(prev => prev.filter(id => id !== cocheraId));
  }

  function updateVehiculo(key, patch) {
    setVehiculos(prev => prev.map(v => (v.key === key ? { ...v, ...patch } : v)));
  }

  function setOrigenVehiculo(key, origen) {
    updateVehiculo(key, {
      origen,
      vehiculoId: "",
      patente: "",
      modeloVehiculo: "",
      tipoVehiculoId: "",
    });
  }

  function seleccionarVehiculoExistente(key, vehiculoIdStr) {
    if (!vehiculoIdStr) {
      updateVehiculo(key, {
        vehiculoId: "",
        patente: "",
        modeloVehiculo: "",
        tipoVehiculoId: "",
      });
      return;
    }
    const encontrado = vehiculosCliente.find(v => String(v.vehiculoId) === String(vehiculoIdStr));
    if (!encontrado) return;
    updateVehiculo(key, {
      vehiculoId: String(encontrado.vehiculoId),
      patente: encontrado.patente || "",
      modeloVehiculo: encontrado.modeloVehiculo || "",
      tipoVehiculoId: String(encontrado.tipoVehiculoId || ""),
    });
  }

  function onSeleccionarCliente(c) {
    setCliente(c);
    setVehiculos([emptyVehiculo(MODALIDAD.FIJO)]);
    setPlazasFlexibles([]);
    setMenuEstructura(MENU_ESTRUCTURA.FIJOS);
  }

  function agregarVehiculoDelMenu() {
    const modalidad =
      menuEstructura === MENU_ESTRUCTURA.FLEXIBLES ? MODALIDAD.FLEXIBLE : MODALIDAD.FIJO;
    setVehiculos(prev => [...prev, emptyVehiculo(modalidad)]);
  }

  function formatearFechaString(dateObj) {
    return formatDateYmd(dateObj);
  }

  async function handleCrear() {
    if (!cliente?.clienteId) return setError("Seleccioná un cliente");
    if (plazasSeleccionadas.length === 0) return setError("Agregá al menos una cochera");

    const tieneFlexible = vehiculosCompletos.some(
      v => Number(v.modalidad) === MODALIDAD.FLEXIBLE
    );
    if (tieneFlexible && (!precioAcordado || Number(precioAcordado) <= 0)) {
      return setError(
        "Si hay vehículos flexibles, el precio acordado es obligatorio (no se puede calcular tarifa de lista)."
      );
    }

    for (const v of vehiculosCompletos) {
      const label = v.patente?.trim() || `vehículo #${v.vehiculoId}`;
      if (v.origen === ORIGEN_VEHICULO.EXISTENTE) {
        if (!v.vehiculoId) return setError("Seleccioná un vehículo existente");
      } else {
        if (!v.tipoVehiculoId) return setError(`Indicá el tipo de vehículo para ${label}`);
      }
      if (Number(v.modalidad) === MODALIDAD.FIJO && !v.cocheraId) {
        return setError(`El vehículo ${label} es fijo: elegí una plaza`);
      }
    }

    const patentes = vehiculosCompletos.map(v =>
      (v.patente || "").trim().toUpperCase().replace(/[\s-]/g, "")
    );
    const duplicada = patentes.find((p, i) => p && patentes.indexOf(p) !== i);
    if (duplicada) {
      return setError(`La patente ${duplicada} está repetida en el abono`);
    }

    try {
      setGuardando(true);
      setError(null);

      const creado = await abonoService.crear({
        clienteId: cliente.clienteId,
        cocheraIds: plazasSeleccionadas,
        vehiculos: vehiculosCompletos.map(v => {
          const base = {
            modalidad: Number(v.modalidad),
            cocheraId:
              Number(v.modalidad) === MODALIDAD.FIJO ? Number(v.cocheraId) : null,
          };
          if (v.origen === ORIGEN_VEHICULO.EXISTENTE && v.vehiculoId) {
            return { ...base, vehiculoId: Number(v.vehiculoId) };
          }
          return {
            ...base,
            patente: v.patente.trim().toUpperCase(),
            modeloVehiculo: v.modeloVehiculo.trim() || null,
            tipoVehiculoId: Number(v.tipoVehiculoId),
          };
        }),
        cobrador: cobrador.trim() || null,
        email: null,
        fechaInicio: formatearFechaString(fechaInicio),
        periodicidadCobro: Number(periodicidad),
        politicaPrimerPeriodo: Number(politicaPrimerPeriodo),
        precioAcordado: precioAcordado ? Number(precioAcordado) : null,
      });

      const id = creado.abonoId ?? creado.abonoCocheraId;
      if (id && generarContratoAlCrearAbono) {
        try {
          await abonoService.descargarContrato(id);
        } catch {
          // El abono ya se creó; si falla el PDF, igual se navega al detalle.
        }
      }
      navigate(id ? `/pagosAbono/${id}` : "/abonos");
    } catch (e) {
      const msg = e.response?.data;
      setError(typeof msg === "string" ? msg : "No se pudo crear el abono");
    } finally {
      setGuardando(false);
    }
  }

  function scrollTo(id) {
    document.getElementById(`sec-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const inputCls = fieldClass;
  return (
    <div className="space-y-5 pb-12 animate-fade-in-up">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <button
            type="button"
            onClick={() => navigate("/abonos")}
            className="pk-icon-btn p-1.5 text-ink-muted hover:text-ink hover:bg-surface-muted"
            aria-label="Volver"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="min-w-0">
            <h1 className="pk-title">Nuevo abono</h1>
            <p className="pk-desc mt-1">Cliente, plazas y cómo se cobra.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate("/abonos")}
            className="hidden sm:inline-flex px-3 py-2 text-sm font-semibold text-ink-muted border border-line-strong"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleCrear}
            disabled={!puedeCrear}
            className="inline-flex items-center gap-2 bg-brand hover:bg-brand-strong disabled:opacity-40 text-brand-foreground text-sm font-semibold px-4 py-2.5"
          >
            {guardando ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
            {guardando ? "Creando…" : "Crear abono"}
          </button>
        </div>
      </div>

      <FiltroSegmentado
        ariaLabel="Secciones"
        value={activeSection}
        onChange={scrollTo}
        opciones={SECTIONS.map((s) => ({
          value: s.id,
          label: checklist[s.id] ? `${s.label} · listo` : s.label,
        }))}
      />

      {error && <p className="px-4 py-3 bg-danger-muted text-danger-ink text-sm">{error}</p>}

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_18rem] gap-5">
        <div className="space-y-5 min-w-0">
          <Seccion id="sec-cliente" titulo="Cliente" nota="El titular del contrato.">
            <div className="max-w-xl space-y-3">
              <label className={labelCls}>Titular</label>
              <BuscadorCliente size="lg" onSeleccionar={onSeleccionarCliente} />
              {cliente && (
                <div className="border-l-[3px] border-l-brand bg-surface-page px-3 py-2.5">
                  <p className="font-semibold text-ink truncate">{cliente.nombre}</p>
                  <p className="pk-caption truncate">
                    {[cliente.documento && `DNI ${cliente.documento}`, cliente.telefono, cliente.email]
                      .filter(Boolean)
                      .join(" · ") || "Sin contacto"}
                  </p>
                </div>
              )}
            </div>
          </Seccion>

          <Seccion
            id="sec-estructura"
            titulo="Plazas y vehículos"
            nota={
              menuEstructura === MENU_ESTRUCTURA.FIJOS
                ? "Cada vehículo queda en una cochera."
                : "Los flexibles rotan entre las plazas del abono. El precio acordado es obligatorio."
            }
            extra={
              <FiltroSegmentado
                ariaLabel="Tipo de plaza"
                value={menuEstructura}
                onChange={setMenuEstructura}
                opciones={[
                  { value: MENU_ESTRUCTURA.FIJOS, label: "Fijos", cantidad: vehiculosFijos.length },
                  { value: MENU_ESTRUCTURA.FLEXIBLES, label: "Flexibles", cantidad: vehiculosFlex.length },
                ]}
              />
            }
          >
            {!cliente?.clienteId && (
              <p className="mb-4 text-sm text-ink-muted bg-surface-page px-3 py-2">Elegí un cliente primero.</p>
            )}

            {menuEstructura === MENU_ESTRUCTURA.FIJOS && (
              <div className="space-y-3">
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={agregarVehiculoDelMenu}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand"
                  >
                    <Plus size={14} /> Agregar vehículo
                  </button>
                </div>

                {vehiculosFijos.length === 0 && (
                  <p className="text-sm text-ink-muted bg-surface-page px-3 py-2">
                    Sin vehículos fijos. Agregá uno o pasá a Flexibles.
                  </p>
                )}

                {vehiculosFijos.map((v, idx) => {
                  const esExistente = v.origen === ORIGEN_VEHICULO.EXISTENTE;
                  const opciones = todosVehiculosParaSelect(v.key);
                  const libres = opciones.filter((o) => !o._disabled);
                  return (
                    <div key={v.key} className="border-l-[3px] border-l-brand bg-surface-page px-4 py-3">
                      <div className="flex items-center justify-between mb-3">
                        <span className="pk-label">Fijo {idx + 1}</span>
                        <button
                          type="button"
                          onClick={() => setVehiculos((prev) => prev.filter((x) => x.key !== v.key))}
                          className="pk-icon-btn p-1.5 text-ink-faint hover:text-danger-ink"
                          title="Quitar"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>

                      <FiltroSegmentado
                        ariaLabel="Origen del vehículo"
                        value={v.origen}
                        onChange={(origen) => {
                          if (!cliente?.clienteId && origen === ORIGEN_VEHICULO.EXISTENTE) return;
                          setOrigenVehiculo(v.key, origen);
                        }}
                        opciones={[
                          { value: ORIGEN_VEHICULO.EXISTENTE, label: "Del sistema" },
                          { value: ORIGEN_VEHICULO.NUEVO, label: "Crear nuevo" },
                        ]}
                      />

                      {esExistente ? (
                        <div className="mt-3">
                          <label className={labelCls}>Vehículo</label>
                          <FilterSelect
                            className="w-full"
                            ariaLabel="Vehículo"
                            disabled={!cliente?.clienteId || cargandoVehiculos}
                            value={v.vehiculoId}
                            onChange={(valor) => seleccionarVehiculoExistente(v.key, valor)}
                            options={[
                              {
                                value: "",
                                label: !cliente?.clienteId
                                  ? "Primero elegí un cliente"
                                  : cargandoVehiculos
                                    ? "Cargando…"
                                    : libres.length === 0
                                      ? "No hay vehículos libres"
                                      : "Seleccioná un vehículo",
                              },
                              ...opciones.map((opt) => ({
                                value: opt.vehiculoId,
                                disabled: opt._disabled,
                                label: `${opt.patente}${opt.modeloVehiculo ? ` — ${opt.modeloVehiculo}` : ""}${opt._motivo ? ` — ${opt._motivo}` : ""}`,
                              })),
                            ]}
                          />
                        </div>
                      ) : (
                        <div className="grid sm:grid-cols-3 gap-3 mt-3">
                          <div>
                            <label className={labelCls}>Patente</label>
                            <input
                              value={v.patente}
                              onChange={(e) => updateVehiculo(v.key, { patente: e.target.value.toUpperCase() })}
                              placeholder="ABC123"
                              maxLength={10}
                              className={`${inputCls} font-mono tracking-wider`}
                            />
                          </div>
                          <div>
                            <label className={labelCls}>Modelo</label>
                            <input
                              value={v.modeloVehiculo}
                              onChange={(e) => updateVehiculo(v.key, { modeloVehiculo: e.target.value })}
                              placeholder="Modelo"
                              className={inputCls}
                            />
                          </div>
                          <div>
                            <label className={labelCls}>Tipo</label>
                            <FilterSelect
                              className="w-full"
                              ariaLabel="Tipo"
                              value={v.tipoVehiculoId}
                              onChange={(valor) => updateVehiculo(v.key, { tipoVehiculoId: valor })}
                              options={[
                                { value: "", label: "Seleccioná" },
                                ...tipos.map((t) => ({ value: t.tipoVehiculoId, label: t.nombre })),
                              ]}
                            />
                          </div>
                        </div>
                      )}

                      <div className="mt-3">
                        <label className={labelCls}>Cochera fija</label>
                        <FilterSelect
                          className="w-full"
                          ariaLabel="Cochera fija"
                          value={v.cocheraId}
                          onChange={(valor) => updateVehiculo(v.key, { cocheraId: valor })}
                          options={[
                            { value: "", label: "Elegí una cochera" },
                            ...cocherasDisponibles.map((c) => ({
                              value: c.cocheraId,
                              label: `${c.numero}${c.categoriaCochera ? ` — ${c.categoriaCochera.nombre}` : ""}${
                                c.multipleOcupacion
                                  ? ` · multi ${c.abonosActivos ?? 0}/${c.capacidadMaxima ?? "—"}`
                                  : (c.abonosActivos ?? 0) > 0
                                    ? " · ocupada"
                                    : " · libre"
                              }`,
                            })),
                          ]}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {menuEstructura === MENU_ESTRUCTURA.FLEXIBLES && (
              <div className="grid lg:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="pk-label">Vehículos</p>
                    <button
                      type="button"
                      onClick={agregarVehiculoDelMenu}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand"
                    >
                      <Plus size={14} /> Agregar
                    </button>
                  </div>

                  {vehiculosFlex.length === 0 && (
                    <p className="text-sm text-ink-muted bg-surface-page px-3 py-2">Sin vehículos flexibles.</p>
                  )}

                  {vehiculosFlex.map((v, idx) => {
                    const esExistente = v.origen === ORIGEN_VEHICULO.EXISTENTE;
                    const opciones = todosVehiculosParaSelect(v.key);
                    return (
                      <div key={v.key} className="border-l-[3px] border-l-warning bg-surface-page px-4 py-3">
                        <div className="flex items-center justify-between mb-3">
                          <span className="pk-label">Flexible {idx + 1}</span>
                          <button
                            type="button"
                            onClick={() => setVehiculos((prev) => prev.filter((x) => x.key !== v.key))}
                            className="pk-icon-btn p-1.5 text-ink-faint hover:text-danger-ink"
                            title="Quitar"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                        <FiltroSegmentado
                          ariaLabel="Origen del vehículo"
                          value={v.origen}
                          onChange={(origen) => {
                            if (!cliente?.clienteId && origen === ORIGEN_VEHICULO.EXISTENTE) return;
                            setOrigenVehiculo(v.key, origen);
                          }}
                          opciones={[
                            { value: ORIGEN_VEHICULO.EXISTENTE, label: "Del sistema" },
                            { value: ORIGEN_VEHICULO.NUEVO, label: "Crear nuevo" },
                          ]}
                        />
                        {esExistente ? (
                          <div className="mt-3">
                            <FilterSelect
                              className="w-full"
                              ariaLabel="Vehículo"
                              disabled={!cliente?.clienteId || cargandoVehiculos}
                              value={v.vehiculoId}
                              onChange={(valor) => seleccionarVehiculoExistente(v.key, valor)}
                              options={[
                                { value: "", label: "Seleccioná un vehículo" },
                                ...opciones.map((opt) => ({
                                  value: opt.vehiculoId,
                                  disabled: opt._disabled,
                                  label: `${opt.patente}${opt._motivo ? ` — ${opt._motivo}` : ""}`,
                                })),
                              ]}
                            />
                          </div>
                        ) : (
                          <div className="space-y-2 mt-3">
                            <input
                              value={v.patente}
                              onChange={(e) => updateVehiculo(v.key, { patente: e.target.value.toUpperCase() })}
                              placeholder="Patente"
                              maxLength={10}
                              className={`${inputCls} font-mono`}
                            />
                            <FilterSelect
                              className="w-full"
                              ariaLabel="Tipo"
                              value={v.tipoVehiculoId}
                              onChange={(valor) => updateVehiculo(v.key, { tipoVehiculoId: valor })}
                              options={[
                                { value: "", label: "Tipo" },
                                ...tipos.map((t) => ({ value: t.tipoVehiculoId, label: t.nombre })),
                              ]}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="space-y-3">
                  <p className="pk-label">Cocheras del abono</p>
                  {plazasFlexibles.length > 0 && (
                    <ul className="divide-y divide-line border-y border-line">
                      {plazasFlexibles.map((id) => {
                        const c = cocherasDisponibles.find((x) => x.cocheraId === id);
                        if (!c) return null;
                        return (
                          <li key={id} className="flex items-center gap-3 py-2">
                            <span className="px-1.5 py-0.5 bg-surface-muted text-[11px] font-bold text-ink tabular-nums">
                              {c.numero}
                            </span>
                            <span className="text-sm text-ink truncate flex-1">
                              {c.categoriaCochera?.nombre || "Sin categoría"}
                            </span>
                            <button
                              type="button"
                              onClick={() => quitarPlazaFlexible(id)}
                              className="pk-icon-btn p-1.5 text-ink-faint hover:text-danger-ink"
                              title="Quitar plaza"
                            >
                              <Trash2 size={14} />
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                  <div className="flex flex-col sm:flex-row gap-2">
                    <FilterSelect
                      className="flex-1 w-full"
                      ariaLabel="Cochera"
                      value={plazaParaAgregar}
                      onChange={setPlazaParaAgregar}
                      options={[
                        {
                          value: "",
                          label: cocherasParaAgregar.length === 0 ? "No hay cocheras disponibles" : "Elegí cochera",
                        },
                        ...cocherasParaAgregar.map((c) => ({
                          value: c.cocheraId,
                          label: `${c.numero}${c.categoriaCochera ? ` — ${c.categoriaCochera.nombre}` : ""}`,
                        })),
                      ]}
                    />
                    <button
                      type="button"
                      onClick={agregarPlazaFlexible}
                      disabled={!plazaParaAgregar}
                      className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-brand text-brand-foreground text-sm font-semibold hover:bg-brand-strong disabled:opacity-40"
                    >
                      <Plus size={16} /> Plaza
                    </button>
                  </div>
                </div>
              </div>
            )}
          </Seccion>

          <Seccion id="sec-condiciones" titulo="Condiciones" nota="Desde cuándo se cobra y a qué precio.">
            <div className="grid sm:grid-cols-2 gap-4 max-w-3xl">
              <div>
                <label className={labelCls}>Fecha de ingreso</label>
                <DatePicker selected={fechaInicio} onChange={setFechaInicio} locale={es} dateFormat="dd/MM/yyyy" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Periodicidad</label>
                <FilterSelect
                  className="w-full"
                  ariaLabel="Periodicidad de cobro"
                  value={periodicidad}
                  onChange={(v) => setPeriodicidad(Number(v))}
                  options={PERIODICIDAD_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
                />
              </div>
              <div className="sm:col-span-2 max-w-md">
                <label className={labelCls}>Cobrador</label>
                <input
                  value={cobrador}
                  onChange={(e) => setCobrador(e.target.value)}
                  placeholder="Opcional"
                  className={inputCls}
                />
              </div>
            </div>

            {opcionesPolitica.length > 0 && (
              <div className="mt-4 max-w-3xl space-y-1">
                <p className={labelCls}>Primer período</p>
                {!puedeProrratear && (
                  <p className="pk-caption mb-2">Ingreso el día 1 o 2: no se prorratea.</p>
                )}
                {opcionesPolitica.map((opt) => {
                  const disabled = opt.value === POLITICA_PRIMER_PERIODO.PRORRATEAR && !puedeProrratear;
                  const activo = politicaPrimerPeriodo === opt.value;
                  return (
                    <label
                      key={opt.value}
                      className={`flex items-start gap-3 px-3 py-2.5 border-l-[3px] cursor-pointer ${
                        activo ? "border-l-brand bg-surface-page" : "border-l-transparent hover:bg-surface-page"
                      } ${disabled ? "opacity-40 cursor-not-allowed" : ""}`}
                    >
                      <input
                        type="radio"
                        name="politicaPrimerPeriodo"
                        value={opt.value}
                        checked={activo}
                        disabled={disabled}
                        onChange={() => setPoliticaPrimerPeriodo(opt.value)}
                        className="mt-1"
                      />
                      <span className="text-sm font-medium text-ink">{opt.label}</span>
                    </label>
                  );
                })}
              </div>
            )}

            {planCobro && (
              <div className="mt-4 max-w-3xl border-l-[3px] border-l-brand bg-surface-page px-4 py-3">
                <p className="pk-label">Primera cuota</p>
                <p className="text-sm font-semibold text-ink capitalize mt-1">
                  {planCobro.label}
                  <span className="pk-caption font-medium normal-case"> · {planCobro.periodicidadLabel}</span>
                </p>
                {planCobro.montoPrimera != null && (
                  <p className="pk-amount text-ink mt-1">
                    {plata(planCobro.montoPrimera)}
                    {planCobro.prorratea && planCobro.montoBase != null && (
                      <span className="ml-2 text-xs font-semibold text-warning-ink">
                        prorrateado de {plata(planCobro.montoBase)}
                      </span>
                    )}
                  </p>
                )}
              </div>
            )}

            <div className="mt-5 max-w-md">
              <label className={labelCls}>Precio acordado{tieneFlexible ? " · obligatorio" : ""}</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint text-sm font-semibold">$</span>
                <input
                  type="number"
                  value={precioAcordado}
                  onChange={(e) => setPrecioAcordado(e.target.value)}
                  placeholder={
                    tieneFlexible
                      ? "Obligatorio"
                      : precioSugerido != null
                        ? String(precioSugerido)
                        : "Opcional"
                  }
                  className={`${inputCls} pl-8`}
                />
              </div>
              {tieneFlexible ? (
                <p className="mt-1.5 pk-caption text-warning-ink">Con flexibles no hay tarifa de lista.</p>
              ) : precioSugerido != null && !precioAcordado ? (
                <p className="mt-1.5 pk-caption">Sugerido por tarifas: {plata(precioSugerido)}</p>
              ) : null}
            </div>
          </Seccion>

          <button
            type="button"
            onClick={handleCrear}
            disabled={!puedeCrear}
            className="xl:hidden w-full inline-flex items-center justify-center gap-2 bg-brand text-brand-foreground text-sm font-semibold py-3 disabled:opacity-40"
          >
            {guardando ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
            {guardando ? "Creando…" : "Crear abono"}
          </button>
        </div>

        <aside className="hidden xl:block">
          <div className="sticky top-20 bg-surface-card border-l-[3px] border-l-brand">
            <header className="px-4 py-3 border-b border-line">
              <p className="pk-label">Resumen</p>
              <p className="text-sm font-bold text-ink mt-1 truncate">{cliente?.nombre || "Sin cliente"}</p>
            </header>
            <div className="px-4 py-3 space-y-4 text-sm">
              <div>
                <p className="pk-label mb-1.5">Plazas · {plazasDetalle.length}</p>
                {plazasDetalle.length === 0 ? (
                  <p className="text-ink-muted">Ninguna</p>
                ) : (
                  <div className="flex flex-wrap gap-1">
                    {plazasDetalle.map((c) => (
                      <span key={c.cocheraId} className="px-1.5 py-0.5 bg-surface-muted text-[11px] font-bold text-ink tabular-nums">
                        {c.numero}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <p className="pk-label mb-1.5">Vehículos · {vehiculosCompletos.length}</p>
                {vehiculosCompletos.length === 0 ? (
                  <p className="text-ink-muted">Ninguno</p>
                ) : (
                  <ul className="space-y-1.5">
                    {vehiculosCompletos.map((v) => (
                      <li key={v.key} className="flex items-center justify-between gap-2">
                        {v.patente ? <Patente valor={v.patente} size="sm" /> : <span className="pk-caption">Sin patente</span>}
                        <span className={`pk-caption font-semibold ${Number(v.modalidad) === MODALIDAD.FLEXIBLE ? "text-warning-ink" : "text-ink-muted"}`}>
                          {modalidadLabel(v.modalidad)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div>
                <p className="pk-label mb-1">Plan de cobro</p>
                {planCobro ? (
                  <>
                    <p className="font-semibold text-ink capitalize">{planCobro.label}</p>
                    <p className="pk-caption">
                      {planCobro.periodicidadLabel}
                      {planCobro.prorratea ? " · prorrateado" : ""}
                      {politicaPrimerPeriodo === POLITICA_PRIMER_PERIODO.OMITIR_MES_ENTRANTE ? " · omite el mes" : ""}
                    </p>
                  </>
                ) : (
                  <p className="text-ink-muted">—</p>
                )}
              </div>
              <div>
                <p className="pk-label mb-1">Precio</p>
                <p className="pk-amount text-ink">
                  {precioAcordado
                    ? plata(precioAcordado)
                    : !tieneFlexible && precioSugerido != null
                      ? plata(precioSugerido)
                      : "—"}
                </p>
                {tieneFlexible && !precioAcordado && <p className="pk-caption text-warning-ink">Falta el acordado</p>}
                {!tieneFlexible && !precioAcordado && precioSugerido != null && (
                  <p className="pk-caption">Tarifa sugerida</p>
                )}
              </div>
              <button
                type="button"
                onClick={handleCrear}
                disabled={!puedeCrear}
                className="w-full inline-flex items-center justify-center gap-2 bg-brand hover:bg-brand-strong disabled:opacity-40 text-brand-foreground text-sm font-semibold py-2.5"
              >
                {guardando ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                Confirmar alta
              </button>
            </div>
          </div>
        </aside>
      </div>

      {avisosReserva.length > 0 && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-surface-overlay">
          <div className="bg-surface-card w-full max-w-md p-5 space-y-3 shadow-pk-modal">
            <p className="text-sm font-bold text-ink">Hay reservas automáticas en estas cocheras</p>
            <ul className="space-y-2">
              {avisosReserva.map((aviso) => (
                <li key={aviso.reservaId}>
                  <button
                    type="button"
                    onClick={() => navigate(`/reservas/${aviso.reservaId}`)}
                    className="text-sm font-semibold text-brand"
                  >
                    {aviso.nombre || "Reserva"} · {aviso.fechaInicio}
                  </button>
                </li>
              ))}
            </ul>
            <button type="button" onClick={() => setAvisosReserva([])} className="px-3 py-2 text-sm font-semibold bg-brand text-brand-foreground">
              Seguir con el alta
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
