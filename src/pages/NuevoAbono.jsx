import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import DatePicker from "react-datepicker";
import { es } from "date-fns/locale";
import "react-datepicker/dist/react-datepicker.css";
import {
  ArrowLeft,
  User,
  Car,
  FileText,
  Plus,
  Trash2,
  AlertCircle,
  Check,
  Loader2,
} from "lucide-react";

import BuscadorCliente from "../components/layout/BuscadorCliente";
import { cocheraService } from "../services/cocheraService";
import { tipoVehiculoService } from "../services/tipoVehiculoService";
import { tarifaMensualService } from "../services/tarifaMensualService";
import { abonoService } from "../services/abonoService";
import { estacionamientoService } from "../services/estacionamientoService";
import { clienteService } from "../services/clienteService";

/** @typedef {import("../types").Cliente} Cliente */
/** @typedef {import("../types").Vehiculo} Vehiculo */
/** @typedef {import("../types").Cochera} Cochera */
/** @typedef {import("../types").TipoVehiculo} TipoVehiculo */
import { MODALIDAD, modalidadLabel } from "../utils/abonoHelpers";
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
  { id: "cliente", label: "Cliente", icon: User },
  { id: "estructura", label: "Plazas y vehículos", icon: Car },
  { id: "condiciones", label: "Condiciones", icon: FileText },
];

const ORIGEN_VEHICULO = { EXISTENTE: "existente", NUEVO: "nuevo" };
const MENU_ESTRUCTURA = { FIJOS: "fijos", FLEXIBLES: "flexibles" };

function emptyVehiculo(modalidad = MODALIDAD.FIJO) {
  return {
    key: crypto.randomUUID(),
    origen: ORIGEN_VEHICULO.NUEVO,
    vehiculoId: "",
    patente: "",
    modeloVehiculo: "",
    tipoVehiculoId: "",
    modalidad,
    cocheraId: "",
  };
}

function formatMoney(n) {
  if (n == null || n === "") return "—";
  return `$${Number(n).toLocaleString("es-AR")}`;
}

function SectionHeader({ index, title, done }) {
  return (
    <div className="flex items-start gap-4 mb-6">
      <div
        className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 text-sm font-black transition-colors ${
          done
            ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/25"
            : "bg-slate-900 text-white shadow-lg shadow-slate-900/15"
        }`}
      >
        {done ? <Check size={18} strokeWidth={3} /> : index}
      </div>
      <div>
        <h2 className="text-lg font-bold text-slate-900 tracking-tight">{title}</h2>
      </div>
    </div>
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

  const inputCls =
    "w-full text-sm border border-slate-200 rounded-xl px-3.5 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-400 transition-all placeholder:text-slate-300";

  const activeIdx = Math.max(0, SECTIONS.findIndex((s) => s.id === activeSection));

  return (
    <div className="min-h-[calc(100vh-2rem)] -mx-1">
      {/* Top bar + steps */}
      <div className="sticky top-16 z-30 -mx-4 px-4 lg:-mx-8 lg:px-8 py-3 mb-8 bg-gray-50/95 backdrop-blur-md border-b border-slate-200/70">
        <div className="max-w-6xl mx-auto space-y-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={() => navigate("/abonos")}
                className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-white border border-transparent hover:border-slate-200 transition-all"
              >
                <ArrowLeft size={18} />
              </button>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-black text-slate-900 tracking-tight truncate">
                    Nuevo abono
                  </h1>
                </div>
                <p className="text-xs text-slate-400 mt-0.5 truncate">
                  Paso {activeIdx + 1} de {SECTIONS.length}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => navigate("/abonos")}
                className="hidden sm:inline-flex text-sm font-medium text-slate-500 hover:text-slate-800 px-3 py-2.5 rounded-xl hover:bg-white transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleCrear}
                disabled={!puedeCrear}
                className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-slate-900 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-lg shadow-slate-900/20 transition-all"
              >
                {guardando ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                {guardando ? "Creando..." : "Crear abono"}
              </button>
            </div>
          </div>

          {/* Stepper en cabecera */}
          <nav aria-label="Pasos del alta" className="flex items-stretch gap-1 sm:gap-2 overflow-x-auto pb-0.5">
            {SECTIONS.map((s, i) => {
              const Icon = s.icon;
              const active = activeSection === s.id;
              const done = checklist[s.id];
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => scrollTo(s.id)}
                  className={`flex-1 min-w-[7.5rem] flex items-center gap-2.5 px-3 py-2.5 rounded-2xl border transition-all text-left ${
                    active
                      ? "bg-white border-slate-200 shadow-sm ring-1 ring-slate-900/5"
                      : done
                        ? "bg-emerald-50/80 border-emerald-100 hover:bg-emerald-50"
                        : "bg-white/60 border-transparent hover:bg-white hover:border-slate-200"
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                      done
                        ? "bg-emerald-500 text-white"
                        : active
                          ? "bg-slate-900 text-white"
                          : "bg-slate-100 text-slate-400"
                    }`}
                  >
                    {done ? <Check size={14} strokeWidth={2.5} /> : <Icon size={14} />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                      Paso {i + 1}
                    </p>
                    <p className={`text-sm font-semibold truncate ${active ? "text-slate-900" : done ? "text-emerald-800" : "text-slate-600"}`}>
                      {s.label}
                    </p>
                  </div>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {error && (
        <div className="max-w-6xl mx-auto mb-5 flex items-start gap-2.5 text-sm text-red-700 bg-red-50 border border-red-100 rounded-2xl px-4 py-3">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div className="max-w-6xl mx-auto grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_300px] gap-8 pb-16">
        {/* Main sections */}
        <div className="space-y-6 min-w-0">
          {/* 1. Cliente */}
          <section id="sec-cliente" className="scroll-mt-48 bg-white rounded-3xl border border-transparent  p-6 sm:p-8 lg:p-10">
            <SectionHeader
              index={1}
              title="Cliente"
              done={checklist.cliente}
            />
            <div className="max-w-xl">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-2">
                Titular <span className="text-rose-400">*</span>
              </label>
              <BuscadorCliente
                size="lg"
                onSeleccionar={onSeleccionarCliente}
              />
              {cliente && (
                <div className="mt-4 flex items-center gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="w-11 h-11 rounded-2xl bg-indigo-100 text-indigo-700 font-black flex items-center justify-center">
                    {cliente.nombre?.charAt(0)?.toUpperCase() || "C"}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900 truncate">{cliente.nombre}</p>
                    <p className="text-xs text-slate-500 truncate">
                      {[cliente.documento && `DNI ${cliente.documento}`, cliente.telefono, cliente.email]
                        .filter(Boolean)
                        .join(" · ") || "Sin contacto"}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* 2. Plazas y vehículos */}
          <section id="sec-estructura" className="scroll-mt-48 bg-white rounded-3xl border border-transparent  p-6 sm:p-8 lg:p-10">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
              <SectionHeader
                index={2}
                title="Plazas y vehículos"
                done={checklist.estructura}
              />
              <div className="grid grid-cols-2 gap-2 shrink-0 w-full sm:w-64">
                {[
                  { id: MENU_ESTRUCTURA.FIJOS, label: "Fijos" },
                  { id: MENU_ESTRUCTURA.FLEXIBLES, label: "Flexibles" },
                ].map(opt => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setMenuEstructura(opt.id)}
                    className={`py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                      menuEstructura === opt.id
                        ? "bg-slate-900 text-white border-slate-900 shadow-md shadow-slate-900/15"
                        : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {!cliente?.clienteId && (
              <p className="text-sm text-slate-500 mb-4 rounded-xl bg-slate-50 border border-slate-100 px-4 py-3">
                Seleccioná un cliente primero.
              </p>
            )}

            {menuEstructura === MENU_ESTRUCTURA.FIJOS && (
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs text-slate-500">
                    Primero el vehículo; debajo, la cochera fija.
                  </p>
                  <button
                    type="button"
                    onClick={agregarVehiculoDelMenu}
                    className="shrink-0 inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-2 rounded-xl transition-colors"
                  >
                    <Plus size={14} /> Agregar vehículo
                  </button>
                </div>

                {vehiculosFijos.length === 0 && (
                  <p className="text-sm text-slate-400 rounded-xl bg-slate-50 px-4 py-3">
                    Sin vehículos fijos. Agregá uno o pasá a Flexibles.
                  </p>
                )}

                {vehiculosFijos.map((v, idx) => {
                  const esExistente = v.origen === ORIGEN_VEHICULO.EXISTENTE;
                  const opciones = todosVehiculosParaSelect(v.key);
                  const libres = opciones.filter(o => !o._disabled);
                  return (
                    <div
                      key={v.key}
                      className="relative rounded-2xl border border-transparent bg-slate-50/40 p-4 sm:p-5"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                          Vehículo fijo {idx + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => setVehiculos(prev => prev.filter(x => x.key !== v.key))}
                          className="p-1.5 rounded-lg text-slate-300 hover:text-rose-600 hover:bg-rose-50"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2 mb-4 max-w-md">
                        {[
                          { value: ORIGEN_VEHICULO.EXISTENTE, label: "Del sistema" },
                          { value: ORIGEN_VEHICULO.NUEVO, label: "Crear nuevo" },
                        ].map(opt => (
                          <button
                            key={opt.value}
                            type="button"
                            disabled={!cliente?.clienteId && opt.value === ORIGEN_VEHICULO.EXISTENTE}
                            onClick={() => setOrigenVehiculo(v.key, opt.value)}
                            className={`py-2.5 rounded-xl text-sm font-semibold border transition-all disabled:opacity-40 ${
                              v.origen === opt.value
                                ? "bg-slate-900 text-white border-slate-900 shadow-md shadow-slate-900/15"
                                : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>

                      {esExistente ? (
                        <div className="mb-3">
                          <label className="text-[11px] font-semibold text-slate-500 block mb-1.5">
                            Vehículo <span className="text-rose-400">*</span>
                          </label>
                          <select
                            value={v.vehiculoId}
                            onChange={e => seleccionarVehiculoExistente(v.key, e.target.value)}
                            disabled={!cliente?.clienteId || cargandoVehiculos}
                            className={inputCls}
                          >
                            <option value="">
                              {!cliente?.clienteId
                                ? "Primero elegí un cliente"
                                : cargandoVehiculos
                                  ? "Cargando..."
                                  : libres.length === 0
                                    ? "No hay vehículos libres"
                                    : "Seleccioná un vehículo..."}
                            </option>
                            {opciones.map(opt => (
                              <option key={opt.vehiculoId} value={opt.vehiculoId} disabled={opt._disabled}>
                                {opt.patente}
                                {opt.modeloVehiculo ? ` — ${opt.modeloVehiculo}` : ""}
                                {opt._motivo ? ` — ${opt._motivo}` : ""}
                              </option>
                            ))}
                          </select>
                        </div>
                      ) : (
                        <div className="grid sm:grid-cols-3 gap-3 mb-3">
                          <div>
                            <label className="text-[11px] font-semibold text-slate-500 block mb-1.5">Patente</label>
                            <input
                              value={v.patente}
                              onChange={e => updateVehiculo(v.key, { patente: e.target.value.toUpperCase() })}
                              placeholder="ABC123"
                              maxLength={10}
                              className={`${inputCls} font-mono tracking-wider`}
                            />
                          </div>
                          <div>
                            <label className="text-[11px] font-semibold text-slate-500 block mb-1.5">Modelo</label>
                            <input
                              value={v.modeloVehiculo}
                              onChange={e => updateVehiculo(v.key, { modeloVehiculo: e.target.value })}
                              placeholder="Ej: Golf"
                              className={inputCls}
                            />
                          </div>
                          <div>
                            <label className="text-[11px] font-semibold text-slate-500 block mb-1.5">Tipo</label>
                            <select
                              value={v.tipoVehiculoId}
                              onChange={e => updateVehiculo(v.key, { tipoVehiculoId: e.target.value })}
                              className={inputCls}
                            >
                              <option value="">Seleccioná...</option>
                              {tipos.map(t => (
                                <option key={t.tipoVehiculoId} value={t.tipoVehiculoId}>{t.nombre}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      )}

                      <div className="mt-1">
                        <label className="text-[11px] font-semibold text-slate-500 block mb-1.5">
                          Cochera fija <span className="text-rose-400">*</span>
                        </label>
                        <select
                          value={v.cocheraId}
                          onChange={e => updateVehiculo(v.key, { cocheraId: e.target.value })}
                          className={inputCls}
                        >
                          <option value="">Elegí una cochera disponible...</option>
                          {cocherasDisponibles.map(c => (
                            <option key={c.cocheraId} value={c.cocheraId}>
                              {c.numero}
                              {c.categoriaCochera ? ` — ${c.categoriaCochera.nombre}` : ""}
                              {c.multipleOcupacion
                                ? ` · multi ${c.abonosActivos ?? 0}/${c.capacidadMaxima ?? "—"}`
                                : (c.abonosActivos ?? 0) > 0
                                  ? " · ocupada"
                                  : " · libre"}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {menuEstructura === MENU_ESTRUCTURA.FLEXIBLES && (
              <div className="grid lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Vehículos</p>
                    <button
                      type="button"
                      onClick={agregarVehiculoDelMenu}
                      className="shrink-0 inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 px-3 py-2 rounded-xl transition-colors"
                    >
                      <Plus size={14} /> Agregar
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Sin plaza fija. El precio acordado es obligatorio (no hay tarifa de lista).
                  </p>

                  {vehiculosFlex.length === 0 && (
                    <p className="text-sm text-slate-400 rounded-xl bg-amber-50/50 px-4 py-3">
                      Sin vehículos flexibles todavía.
                    </p>
                  )}

                  {vehiculosFlex.map((v, idx) => {
                    const esExistente = v.origen === ORIGEN_VEHICULO.EXISTENTE;
                    const opciones = todosVehiculosParaSelect(v.key);
                    const libres = opciones.filter(o => !o._disabled);
                    return (
                      <div
                        key={v.key}
                        className="relative rounded-2xl border border-amber-100/80 bg-amber-50/30 p-4"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-[11px] font-black uppercase tracking-wider text-amber-700/70">
                            Flexible {idx + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => setVehiculos(prev => prev.filter(x => x.key !== v.key))}
                            className="p-1.5 rounded-lg text-slate-300 hover:text-rose-600 hover:bg-rose-50"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-2 mb-3">
                          {[
                            { value: ORIGEN_VEHICULO.EXISTENTE, label: "Del sistema" },
                            { value: ORIGEN_VEHICULO.NUEVO, label: "Crear nuevo" },
                          ].map(opt => (
                            <button
                              key={opt.value}
                              type="button"
                              disabled={!cliente?.clienteId && opt.value === ORIGEN_VEHICULO.EXISTENTE}
                              onClick={() => setOrigenVehiculo(v.key, opt.value)}
                              className={`py-2 rounded-xl text-xs font-semibold border transition-all disabled:opacity-40 ${
                                v.origen === opt.value
                                  ? "bg-slate-900 text-white border-slate-900"
                                  : "bg-white text-slate-600 border-slate-200"
                              }`}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                        {esExistente ? (
                          <select
                            value={v.vehiculoId}
                            onChange={e => seleccionarVehiculoExistente(v.key, e.target.value)}
                            disabled={!cliente?.clienteId || cargandoVehiculos}
                            className={inputCls}
                          >
                            <option value="">Seleccioná vehículo...</option>
                            {opciones.map(opt => (
                              <option key={opt.vehiculoId} value={opt.vehiculoId} disabled={opt._disabled}>
                                {opt.patente}{opt._motivo ? ` — ${opt._motivo}` : ""}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <div className="space-y-2">
                            <input
                              value={v.patente}
                              onChange={e => updateVehiculo(v.key, { patente: e.target.value.toUpperCase() })}
                              placeholder="Patente"
                              maxLength={10}
                              className={`${inputCls} font-mono`}
                            />
                            <select
                              value={v.tipoVehiculoId}
                              onChange={e => updateVehiculo(v.key, { tipoVehiculoId: e.target.value })}
                              className={inputCls}
                            >
                              <option value="">Tipo...</option>
                              {tipos.map(t => (
                                <option key={t.tipoVehiculoId} value={t.tipoVehiculoId}>{t.nombre}</option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="space-y-4">
                  <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Cocheras del abono</p>
                  <p className="text-[11px] text-slate-500">
                    Plazas disponibles para los flexibles (independientes del vehículo).
                  </p>

                  {plazasFlexibles.length > 0 && (
                    <div className="space-y-2">
                      {plazasFlexibles.map(id => {
                        const c = cocherasDisponibles.find(x => x.cocheraId === id);
                        if (!c) return null;
                        return (
                          <div
                            key={id}
                            className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-transparent"
                          >
                            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center text-sm font-black">
                              {c.numero}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold text-slate-800 truncate">
                                {c.categoriaCochera?.nombre || "Sin categoría"}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => quitarPlazaFlexible(id)}
                              className="p-2 rounded-xl text-slate-300 hover:text-rose-600 hover:bg-rose-50"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row gap-2">
                    <select
                      value={plazaParaAgregar}
                      onChange={e => setPlazaParaAgregar(e.target.value)}
                      className={`${inputCls} flex-1`}
                    >
                      <option value="">
                        {cocherasParaAgregar.length === 0
                          ? "No hay cocheras disponibles"
                          : "Elegí cochera..."}
                      </option>
                      {cocherasParaAgregar.map(c => (
                        <option key={c.cocheraId} value={c.cocheraId}>
                          {c.numero}
                          {c.categoriaCochera ? ` — ${c.categoriaCochera.nombre}` : ""}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={agregarPlazaFlexible}
                      disabled={!plazaParaAgregar}
                      className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-40"
                    >
                      <Plus size={16} /> Plaza
                    </button>
                  </div>
                </div>
              </div>
            )}
          </section>
          {/* 4. Condiciones */}
          <section id="sec-condiciones" className="scroll-mt-48 bg-white rounded-3xl border border-transparent  p-6 sm:p-8 lg:p-10">
            <SectionHeader
              index={3}
              title="Condiciones"
              done={checklist.condiciones}
            />

            <div className="grid sm:grid-cols-2 gap-4 max-w-3xl">
              <div>
                <label className="text-[11px] font-semibold text-slate-500 block mb-1.5">Fecha de ingreso</label>
                <DatePicker
                  selected={fechaInicio}
                  onChange={setFechaInicio}
                  locale={es}
                  dateFormat="dd/MM/yyyy"
                  className={inputCls}
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-500 block mb-1.5">Periodicidad de cobro</label>
                <select
                  value={periodicidad}
                  onChange={e => setPeriodicidad(Number(e.target.value))}
                  className={inputCls}
                >
                  {PERIODICIDAD_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2 max-w-md">
                <label className="text-[11px] font-semibold text-slate-500 block mb-1.5">Cobrador</label>
                <input
                  value={cobrador}
                  onChange={e => setCobrador(e.target.value)}
                  placeholder="Opcional"
                  className={inputCls}
                />
              </div>
            </div>

            {opcionesPolitica.length > 0 && (
              <div className="mt-4 max-w-3xl space-y-2">
                <p className="text-[11px] font-semibold text-slate-500 mb-1">
                  Tratamiento del mes / período de ingreso
                </p>
                {!puedeProrratear && (
                  <p className="text-[11px] text-slate-500 mb-2">
                    Ingreso el día 1 o 2: no se prorratea.
                  </p>
                )}
                {opcionesPolitica.map((opt) => {
                  const disabled =
                    opt.value === POLITICA_PRIMER_PERIODO.PRORRATEAR && !puedeProrratear;
                  return (
                    <label
                      key={opt.value}
                      className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer ${
                        politicaPrimerPeriodo === opt.value
                          ? "border-indigo-200 bg-indigo-50/70"
                          : "border-transparent bg-slate-50"
                      } ${disabled ? "opacity-40 cursor-not-allowed" : ""}`}
                    >
                      <input
                        type="radio"
                        name="politicaPrimerPeriodo"
                        value={opt.value}
                        checked={politicaPrimerPeriodo === opt.value}
                        disabled={disabled}
                        onChange={() => setPoliticaPrimerPeriodo(opt.value)}
                        className="mt-1 h-4 w-4 text-indigo-600 border-slate-300 focus:ring-indigo-500"
                      />
                      <span className="text-sm font-medium text-slate-800">{opt.label}</span>
                    </label>
                  );
                })}
              </div>
            )}

            {planCobro && (
              <div className="mt-4 max-w-3xl rounded-2xl border border-indigo-100 bg-indigo-50/60 px-4 py-3.5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 mb-1">
                  Primera cuota
                </p>
                <p className="text-sm font-semibold text-indigo-950 capitalize">
                  {planCobro.label}
                  <span className="text-indigo-400 font-medium"> · {planCobro.periodicidadLabel}</span>
                </p>
                {planCobro.montoPrimera != null ? (
                  <p className="text-base font-black text-indigo-900 mt-1.5">
                    {formatMoney(planCobro.montoPrimera)}
                    {planCobro.prorratea && planCobro.montoBase != null && (
                      <span className="ml-2 text-xs font-semibold text-amber-700">
                        (prorrateado de {formatMoney(planCobro.montoBase)})
                      </span>
                    )}
                  </p>
                ) : null}
              </div>
            )}

            <div className="mt-5 max-w-md">
              <label className="text-[11px] font-semibold text-slate-500 block mb-1.5">
                Precio acordado
                {tieneFlexible && <span className="text-rose-400"> *</span>}
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-semibold">$</span>
                <input
                  type="number"
                  value={precioAcordado}
                  onChange={e => setPrecioAcordado(e.target.value)}
                  placeholder={
                    tieneFlexible
                      ? "Obligatorio (sin tarifa de lista)"
                      : precioSugerido != null
                        ? String(precioSugerido)
                        : "Opcional"
                  }
                  className={`${inputCls} pl-8`}
                />
              </div>
              {tieneFlexible ? (
                <p className="mt-1.5 text-[11px] text-amber-700">
                  Con flexibles no se sugiere precio de lista: cargá el acordado.
                </p>
              ) : precioSugerido != null && !precioAcordado ? (
                <p className="mt-1.5 text-[11px] text-slate-500">
                  Sugerido por tarifas: {formatMoney(precioSugerido)}
                </p>
              ) : null}
            </div>
          </section>

          {/* Bottom CTA mobile */}
          <div className="xl:hidden sticky bottom-3 z-20">
            <button
              type="button"
              onClick={handleCrear}
              disabled={!puedeCrear}
              className="w-full inline-flex items-center justify-center gap-2 bg-slate-900 text-white text-sm font-semibold py-3.5 rounded-2xl shadow-xl shadow-slate-900/25 disabled:opacity-40"
            >
              {guardando ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
              {guardando ? "Creando abono..." : "Crear abono"}
            </button>
          </div>
        </div>

        {/* Summary panel */}
        <aside className="hidden xl:block">
          <div className="sticky top-44 rounded-3xl border border-transparent bg-white  overflow-hidden">
            <div className="px-5 py-4 bg-slate-900 text-white">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">Resumen</p>
              <p className="text-base font-bold mt-1">Vista previa de abono</p>
            </div>
            <div className="p-5 space-y-4 text-sm">
              <div>
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Cliente</p>
                <p className="font-semibold text-slate-900">{cliente?.nombre || "Sin seleccionar"}</p>
              </div>
              <div className="h-px bg-slate-100" />
              <div>
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
                  Plazas · {plazasDetalle.length}
                </p>
                {plazasDetalle.length === 0 ? (
                  <p className="text-slate-400">Ninguna aún</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {plazasDetalle.map(c => (
                      <span key={c.cocheraId} className="text-xs font-bold bg-slate-100 text-slate-700 px-2 py-1 rounded-lg">
                        {c.numero}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="h-px bg-slate-100" />
              <div>
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
                  Vehículos · {vehiculosCompletos.length}
                </p>
                {vehiculosCompletos.length === 0 ? (
                  <p className="text-slate-400">Opcional</p>
                ) : (
                  <ul className="space-y-2">
                    {vehiculosCompletos.map(v => (
                      <li key={v.key} className="flex items-center justify-between gap-2">
                        <span className="font-mono text-xs font-bold text-slate-800">{v.patente}</span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          Number(v.modalidad) === MODALIDAD.FLEXIBLE
                            ? "bg-amber-50 text-amber-700"
                            : "bg-indigo-50 text-indigo-700"
                        }`}>
                          {modalidadLabel(v.modalidad)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="h-px bg-slate-100" />
              <div>
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Plan de cobro</p>
                {planCobro ? (
                  <>
                    <p className="font-semibold text-slate-900 capitalize">{planCobro.label}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {planCobro.periodicidadLabel}
                      {planCobro.prorratea ? " · prorrateado" : ""}
                      {politicaPrimerPeriodo === POLITICA_PRIMER_PERIODO.OMITIR_MES_ENTRANTE
                        ? " · omite mes entrante"
                        : ""}
                    </p>
                    {planCobro.montoPrimera != null && (
                      <p className="text-sm font-bold text-slate-800 mt-1">
                        {formatMoney(planCobro.montoPrimera)}
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-slate-400">—</p>
                )}
              </div>
              <div className="h-px bg-slate-100" />
              <div className="flex items-end justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Precio</p>
                  <p className="text-xl font-black text-slate-900 tracking-tight">
                    {precioAcordado
                      ? formatMoney(precioAcordado)
                      : !tieneFlexible && precioSugerido != null
                        ? formatMoney(precioSugerido)
                        : "—"}
                  </p>
                  {tieneFlexible && !precioAcordado && (
                    <p className="text-[10px] text-amber-600 mt-0.5">Requiere precio acordado</p>
                  )}
                  {!tieneFlexible && !precioAcordado && precioSugerido != null && (
                    <p className="text-[10px] text-slate-400 mt-0.5">Tarifa sugerida</p>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={handleCrear}
                disabled={!puedeCrear}
                className="w-full mt-2 inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-sm font-semibold py-3 rounded-xl transition-colors shadow-lg shadow-indigo-600/25"
              >
                {guardando ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                Confirmar alta
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

