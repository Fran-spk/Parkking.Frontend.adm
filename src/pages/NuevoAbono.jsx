import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import DatePicker from "react-datepicker";
import { es } from "date-fns/locale";
import "react-datepicker/dist/react-datepicker.css";
import {
  ArrowLeft,
  User,
  ParkingSquare,
  Car,
  FileText,
  Plus,
  Trash2,
  AlertCircle,
  Check,
  Sparkles,
  Loader2,
} from "lucide-react";

import BuscadorCliente from "../components/layout/BuscadorCliente";
import { cocheraService } from "../services/cocheraService";
import { tipoVehiculoService } from "../services/tipoVehiculoService";
import { tarifaMensualService } from "../services/tarifaMensualService";
import { abonoService } from "../services/abonoService";
import { estacionamientoService } from "../services/estacionamientoService";
import { clienteService } from "../services/clienteService";
import { MODALIDAD, modalidadLabel } from "../utils/abonoHelpers";
import {
  PERIODICIDAD,
  PERIODICIDAD_OPTIONS,
  calcularFechaInicioCobro,
  calcularMontoPrimeraCuota,
  formatearPeriodoLabel,
  formatDateYmd,
  periodoQueContiene,
} from "../utils/periodicidadHelpers";

const SECTIONS = [
  { id: "cliente", label: "Cliente", icon: User, hint: "Titular del contrato" },
  { id: "plazas", label: "Plazas", icon: ParkingSquare, hint: "Cocheras incluidas" },
  { id: "vehiculos", label: "Vehículos", icon: Car, hint: "Fijos o flexibles" },
  { id: "condiciones", label: "Condiciones", icon: FileText, hint: "Fechas y precio" },
];

const ORIGEN_VEHICULO = { EXISTENTE: "existente", NUEVO: "nuevo" };

function emptyVehiculo() {
  return {
    key: crypto.randomUUID(),
    origen: ORIGEN_VEHICULO.NUEVO,
    vehiculoId: "",
    patente: "",
    modeloVehiculo: "",
    tipoVehiculoId: "",
    modalidad: MODALIDAD.FIJO,
    cocheraId: "",
  };
}

function formatMoney(n) {
  if (n == null || n === "") return "—";
  return `$${Number(n).toLocaleString("es-AR")}`;
}

function SectionHeader({ index, title, subtitle, done }) {
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
        <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>
      </div>
    </div>
  );
}

export default function NuevoAbono() {
  const navigate = useNavigate();
  const [cliente, setCliente] = useState(null);
  const [plazasSeleccionadas, setPlazasSeleccionadas] = useState([]);
  const [plazaParaAgregar, setPlazaParaAgregar] = useState("");
  const [vehiculos, setVehiculos] = useState([emptyVehiculo()]);
  const [vehiculosCliente, setVehiculosCliente] = useState([]);
  const [cargandoVehiculos, setCargandoVehiculos] = useState(false);
  const [cobrador, setCobrador] = useState("");
  const [fechaInicio, setFechaInicio] = useState(new Date());
  const [periodicidad, setPeriodicidad] = useState(PERIODICIDAD.MENSUAL);
  const [comenzarPeriodoSiguiente, setComenzarPeriodoSiguiente] = useState(false);
  const [precioAcordado, setPrecioAcordado] = useState("");
  const [precioSugerido, setPrecioSugerido] = useState(null);
  const [esFallback, setEsFallback] = useState(false);
  const [cocherasDisponibles, setCocherasDisponibles] = useState([]);
  const [tipos, setTipos] = useState([]);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);
  const [activeSection, setActiveSection] = useState("cliente");
  const [diasUmbralProporcional, setDiasUmbralProporcional] = useState(null);

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
        setDiasUmbralProporcional(estacionamiento?.diasUmbralProporcional ?? null);
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

  // Si cambia la fecha/periodicidad y el ingreso es al inicio del período, el check pierde sentido
  useEffect(() => {
    if (!fechaInicio) return;
    const { inicio } = periodoQueContiene(fechaInicio, periodicidad);
    const mismoDia =
      fechaInicio.getFullYear() === inicio.getFullYear() &&
      fechaInicio.getMonth() === inicio.getMonth() &&
      fechaInicio.getDate() === inicio.getDate();
    if (mismoDia) setComenzarPeriodoSiguiente(false);
  }, [fechaInicio, periodicidad]);

  const planCobro = useMemo(() => {
    if (!fechaInicio) return null;
    const cobroInicio = calcularFechaInicioCobro(fechaInicio, periodicidad, comenzarPeriodoSiguiente);
    const periodo = periodoQueContiene(cobroInicio, periodicidad);
    const montoBase =
      precioAcordado !== "" && precioAcordado != null
        ? Number(precioAcordado)
        : precioSugerido != null
          ? Number(precioSugerido)
          : null;
    const montoPrimera =
      montoBase != null && !Number.isNaN(montoBase)
        ? calcularMontoPrimeraCuota({
            montoBase,
            fechaIngreso: fechaInicio,
            fechaInicioCobro: cobroInicio,
            periodicidad,
            diasUmbralProporcional,
          })
        : null;
    const prorratea =
      montoPrimera != null &&
      montoBase != null &&
      montoPrimera < montoBase;

    return {
      fechaInicioCobro: cobroInicio,
      periodo,
      label: formatearPeriodoLabel(periodo.inicio, periodo.fin, periodicidad),
      prorratea,
      montoBase,
      montoPrimera,
      periodicidadLabel:
        PERIODICIDAD_OPTIONS.find(o => o.value === Number(periodicidad))?.label || "Mensual",
    };
  }, [
    fechaInicio,
    periodicidad,
    comenzarPeriodoSiguiente,
    precioAcordado,
    precioSugerido,
    diasUmbralProporcional,
  ]);

  const mostrarCheckDiferir = useMemo(() => {
    if (!fechaInicio) return false;
    const { inicio } = periodoQueContiene(fechaInicio, periodicidad);
    return !(
      fechaInicio.getFullYear() === inicio.getFullYear() &&
      fechaInicio.getMonth() === inicio.getMonth() &&
      fechaInicio.getDate() === inicio.getDate()
    );
  }, [fechaInicio, periodicidad]);

  useEffect(() => {
    const completos = vehiculos.filter(v =>
      v.origen === ORIGEN_VEHICULO.EXISTENTE ? !!v.vehiculoId : !!v.patente.trim()
    );
    const tieneFlexible = completos.some(v => Number(v.modalidad) === MODALIDAD.FLEXIBLE);
    if (tieneFlexible || plazasSeleccionadas.length === 0) {
      setPrecioSugerido(null);
      setEsFallback(false);
      return;
    }

    const fijos = completos.filter(
      v => Number(v.modalidad) === MODALIDAD.FIJO && v.tipoVehiculoId && v.cocheraId
    );
    if (fijos.length === 0) {
      setPrecioSugerido(null);
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
  }, [vehiculos, plazasSeleccionadas, cocherasDisponibles, periodicidad]);

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

  const plazasDetalle = useMemo(
    () =>
      plazasSeleccionadas
        .map(id => cocherasDisponibles.find(c => c.cocheraId === id))
        .filter(Boolean),
    [plazasSeleccionadas, cocherasDisponibles]
  );

  const cocherasParaAgregar = cocherasDisponibles.filter(
    c => !plazasSeleccionadas.includes(c.cocheraId)
  );

  const vehiculosCompletos = vehiculos.filter(v =>
    v.origen === ORIGEN_VEHICULO.EXISTENTE ? !!v.vehiculoId : !!v.patente.trim()
  );

  const checklist = {
    cliente: !!cliente?.clienteId,
    plazas: plazasSeleccionadas.length > 0,
    vehiculos: true,
    condiciones: !!fechaInicio,
  };

  const puedeCrear = checklist.cliente && checklist.plazas && !guardando;

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

  function agregarPlaza() {
    if (!plazaParaAgregar) return;
    setPlazasSeleccionadas(prev => [...prev, Number(plazaParaAgregar)]);
    setPlazaParaAgregar("");
  }

  function quitarPlaza(cocheraId) {
    setPlazasSeleccionadas(prev => prev.filter(id => id !== cocheraId));
    setVehiculos(prev =>
      prev.map(v => (Number(v.cocheraId) === cocheraId ? { ...v, cocheraId: "" } : v))
    );
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
    setVehiculos([emptyVehiculo()]);
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

      const fechaInicioCobroObj = calcularFechaInicioCobro(
        fechaInicio,
        periodicidad,
        comenzarPeriodoSiguiente
      );

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
        fechaInicio: formatearFechaString(fechaInicio),
        fechaInicioCobro: formatearFechaString(fechaInicioCobroObj),
        periodicidadCobro: Number(periodicidad),
        precioAcordado: precioAcordado ? Number(precioAcordado) : null,
      });

      const id = creado.abonoId ?? creado.abonoCocheraId;
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

  return (
    <div className="min-h-[calc(100vh-2rem)] -mx-1">
      {/* Top bar */}
      <div className="sticky top-16 z-30 -mx-4 px-4 lg:-mx-8 lg:px-8 py-3 mb-6 bg-gray-50/90 backdrop-blur-md border-b border-slate-200/70">
        <div className="flex items-center justify-between gap-4 max-w-7xl mx-auto">
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
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full">
                  <Sparkles size={10} /> Contrato
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 truncate">
                Armá plazas, vehículos y condiciones en un solo flujo
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
      </div>

      {error && (
        <div className="max-w-7xl mx-auto mb-5 flex items-start gap-2.5 text-sm text-red-700 bg-red-50 border border-red-100 rounded-2xl px-4 py-3">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto grid grid-cols-1 xl:grid-cols-[220px_minmax(0,1fr)_300px] gap-6 pb-16">
        {/* Step rail */}
        <aside className="hidden xl:block">
          <nav className="sticky top-36 space-y-1.5">
            {SECTIONS.map((s, i) => {
              const Icon = s.icon;
              const active = activeSection === s.id;
              const done = checklist[s.id];
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => scrollTo(s.id)}
                  className={`w-full text-left flex items-center gap-3 px-3 py-3 rounded-2xl transition-all ${
                    active
                      ? "bg-white shadow-sm border border-slate-200/80"
                      : "hover:bg-white/70 border border-transparent"
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      done
                        ? "bg-emerald-50 text-emerald-600"
                        : active
                          ? "bg-indigo-50 text-indigo-600"
                          : "bg-slate-100 text-slate-400"
                    }`}
                  >
                    {done ? <Check size={16} strokeWidth={2.5} /> : <Icon size={16} />}
                  </div>
                  <div className="min-w-0">
                    <p className={`text-sm font-semibold truncate ${active ? "text-slate-900" : "text-slate-600"}`}>
                      {i + 1}. {s.label}
                    </p>
                    <p className="text-[11px] text-slate-400 truncate">{s.hint}</p>
                  </div>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Main sections */}
        <div className="space-y-5 min-w-0">
          {/* Mobile steps */}
          <div className="xl:hidden flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
            {SECTIONS.map((s, i) => (
              <button
                key={s.id}
                type="button"
                onClick={() => scrollTo(s.id)}
                className={`shrink-0 px-3 py-2 rounded-full text-xs font-semibold border transition-colors ${
                  activeSection === s.id
                    ? "bg-slate-900 text-white border-slate-900"
                    : checklist[s.id]
                      ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                      : "bg-white text-slate-500 border-slate-200"
                }`}
              >
                {i + 1}. {s.label}
              </button>
            ))}
          </div>

          {/* 1. Cliente */}
            <section id="sec-cliente" className="scroll-mt-40 bg-white rounded-3xl border border-slate-200/80 shadow-[0_1px_0_rgba(15,23,42,0.04)] p-6 sm:p-8">
            <SectionHeader
              index={1}
              title="Cliente"
              subtitle="Quién contrata el abono. Podés buscar uno existente o crear uno al vuelo."
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
                      {[cliente.telefono, cliente.email].filter(Boolean).join(" · ") || "Sin contacto"}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* 2. Plazas */}
          <section id="sec-plazas" className="scroll-mt-40 bg-white rounded-3xl border border-slate-200/80 shadow-[0_1px_0_rgba(15,23,42,0.04)] p-6 sm:p-8">
            <SectionHeader
              index={2}
              title="Plazas contratadas"
              subtitle="Una o varias cocheras forman el conjunto del abono. Después podés fijar vehículos a cada una."
              done={checklist.plazas}
            />

            {plazasDetalle.length > 0 && (
              <div className="grid sm:grid-cols-2 gap-3 mb-5">
                {plazasDetalle.map((c, i) => (
                  <div
                    key={c.cocheraId}
                    className="group relative flex items-center gap-3 p-4 rounded-2xl border border-slate-150 bg-gradient-to-br from-slate-50 to-white hover:border-indigo-200 transition-colors"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex flex-col items-center justify-center shrink-0 shadow-md shadow-slate-900/20">
                      <span className="text-[9px] font-bold text-slate-400 uppercase leading-none">Nº</span>
                      <span className="text-sm font-black leading-tight">{c.numero}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-slate-900">Plaza {i + 1}</p>
                      <p className="text-xs text-slate-500 truncate">
                        {c.categoriaCochera?.nombre || "Sin categoría"}
                        {c.multipleOcupacion ? " · Multi" : ""}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => quitarPlaza(c.cocheraId)}
                      className="p-2 rounded-xl text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2 max-w-2xl">
              <select
                value={plazaParaAgregar}
                onChange={e => setPlazaParaAgregar(e.target.value)}
                className={`${inputCls} flex-1`}
              >
                <option value="">
                  {cocherasParaAgregar.length === 0
                    ? "No hay cocheras disponibles"
                    : "Elegí una cochera disponible..."}
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
                onClick={agregarPlaza}
                disabled={!plazaParaAgregar}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-40 transition-colors shadow-lg shadow-indigo-600/20"
              >
                <Plus size={16} /> Agregar plaza
              </button>
            </div>
          </section>

          {/* 3. Vehículos */}
          <section id="sec-vehiculos" className="scroll-mt-40 bg-white rounded-3xl border border-slate-200/80 shadow-[0_1px_0_rgba(15,23,42,0.04)] p-6 sm:p-8">
            <div className="flex items-start justify-between gap-4 mb-6">
              <SectionHeader
                index={3}
                title="Vehículos habilitados"
                subtitle="Podés elegir un vehículo ya cargado del cliente o crear uno nuevo. Fijo = plaza concreta; Flexible = cualquiera del abono."
                done={vehiculosCompletos.length > 0}
              />
              <button
                type="button"
                onClick={() => setVehiculos(prev => [...prev, emptyVehiculo()])}
                className="shrink-0 inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-2 rounded-xl transition-colors"
              >
                <Plus size={14} /> Agregar
              </button>
            </div>

            {!cliente?.clienteId && (
              <p className="text-sm text-slate-500 mb-4 rounded-xl bg-slate-50 border border-slate-100 px-4 py-3">
                Seleccioná un cliente para ver sus vehículos existentes o cargar uno nuevo.
              </p>
            )}

            <div className="space-y-4">
              {vehiculos.map((v, idx) => {
                const esExistente = v.origen === ORIGEN_VEHICULO.EXISTENTE;
                const opciones = todosVehiculosParaSelect(v.key);
                const libres = opciones.filter(o => !o._disabled);
                return (
                <div
                  key={v.key}
                  className="relative rounded-2xl border border-slate-200/80 bg-slate-50/40 p-4 sm:p-5"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                        Vehículo {idx + 1}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          Number(v.modalidad) === MODALIDAD.FLEXIBLE
                            ? "bg-amber-100 text-amber-800"
                            : "bg-indigo-100 text-indigo-700"
                        }`}
                      >
                        {modalidadLabel(v.modalidad)}
                      </span>
                    </div>
                    {vehiculos.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setVehiculos(prev => prev.filter(x => x.key !== v.key))}
                        className="p-1.5 rounded-lg text-slate-300 hover:text-rose-600 hover:bg-rose-50"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
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
                        Vehículo del cliente <span className="text-rose-400">*</span>
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
                              ? "Cargando vehículos..."
                              : vehiculosCliente.length === 0
                                ? "Este cliente no tiene vehículos"
                                : libres.length === 0
                                  ? "No hay vehículos libres (todos en abonos activos)"
                                  : "Seleccioná un vehículo..."}
                        </option>
                        {opciones.map(opt => (
                          <option
                            key={opt.vehiculoId}
                            value={opt.vehiculoId}
                            disabled={opt._disabled}
                          >
                            {opt.patente}
                            {opt.modeloVehiculo ? ` — ${opt.modeloVehiculo}` : ""}
                            {opt.tipoVehiculoNombre ? ` (${opt.tipoVehiculoNombre})` : ""}
                            {opt._motivo ? ` — ${opt._motivo}` : ""}
                          </option>
                        ))}
                      </select>
                      {cliente?.clienteId && !cargandoVehiculos && vehiculosCliente.length === 0 && (
                        <p className="text-[11px] text-slate-400 mt-1.5">
                          Este cliente no tiene vehículos cargados. Creá uno nuevo.
                        </p>
                      )}
                      {cliente?.clienteId && !cargandoVehiculos && vehiculosCliente.length > 0 && libres.length === 0 && (
                        <p className="text-[11px] text-amber-600 mt-1.5">
                          Todos sus vehículos están en un abono activo. Dá de baja el otro abono o creá un vehículo nuevo.
                        </p>
                      )}
                    </div>
                  ) : (
                  <div className="grid sm:grid-cols-2 gap-3">
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

                  <div className={`${esExistente ? "" : "mt-3"} grid sm:grid-cols-2 gap-3`}>
                    <div className={esExistente ? "sm:col-span-2" : ""}>
                      <label className="text-[11px] font-semibold text-slate-500 block mb-1.5">Modalidad</label>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { value: MODALIDAD.FIJO, label: "Fijo" },
                          { value: MODALIDAD.FLEXIBLE, label: "Flexible" },
                        ].map(opt => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() =>
                              updateVehiculo(v.key, {
                                modalidad: opt.value,
                                cocheraId: opt.value === MODALIDAD.FLEXIBLE ? "" : v.cocheraId,
                              })
                            }
                            className={`py-3 rounded-xl text-sm font-semibold border transition-all ${
                              Number(v.modalidad) === opt.value
                                ? "bg-slate-900 text-white border-slate-900 shadow-md shadow-slate-900/15"
                                : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {Number(v.modalidad) === MODALIDAD.FIJO && (
                    <div className="mt-3">
                      <label className="text-[11px] font-semibold text-slate-500 block mb-1.5">
                        Plaza fija <span className="text-rose-400">*</span>
                      </label>
                      <select
                        value={v.cocheraId}
                        onChange={e => updateVehiculo(v.key, { cocheraId: e.target.value })}
                        disabled={plazasSeleccionadas.length === 0}
                        className={inputCls}
                      >
                        <option value="">
                          {plazasSeleccionadas.length === 0
                            ? "Primero agregá plazas arriba"
                            : "Asignar a plaza..."}
                        </option>
                        {plazasDetalle.map(c => (
                          <option key={c.cocheraId} value={c.cocheraId}>
                            Cochera {c.numero}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
                );
              })}
            </div>
          </section>

          {/* 4. Condiciones */}
          <section id="sec-condiciones" className="scroll-mt-40 bg-white rounded-3xl border border-slate-200/80 shadow-[0_1px_0_rgba(15,23,42,0.04)] p-6 sm:p-8">
            <SectionHeader
              index={4}
              title="Condiciones del contrato"
              subtitle="Fechas, periodicidad, cobrador y precio. Se genera la primera cuota al confirmar."
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
              <div>
                <label className="text-[11px] font-semibold text-slate-500 block mb-1.5">Cobrador</label>
                <input
                  value={cobrador}
                  onChange={e => setCobrador(e.target.value)}
                  placeholder="Opcional"
                  className={inputCls}
                />
              </div>
            </div>

            {mostrarCheckDiferir && (
              <label className="mt-4 max-w-3xl flex items-start gap-3 p-4 rounded-2xl bg-amber-50 border border-amber-100 cursor-pointer">
                <input
                  type="checkbox"
                  checked={comenzarPeriodoSiguiente}
                  onChange={e => setComenzarPeriodoSiguiente(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded text-indigo-600 border-amber-300 focus:ring-indigo-500"
                />
                <span>
                  <span className="block text-sm font-semibold text-amber-900">
                    Cobrar a partir del período siguiente
                  </span>
                  <span className="block text-xs text-amber-700 mt-0.5 leading-relaxed">
                    El ingreso es a mitad de período. Marcá esto para no prorratear el actual
                    (ej. entra el 20 y acuerdan pagar desde el 1° del próximo). Sin marcar, la
                    primera cuota puede prorratearse (ej. entra el 15 y paga media mensualidad).
                  </span>
                </span>
              </label>
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
                ) : (
                  <p className="text-xs text-indigo-600/70 mt-1">Indicá un precio para ver el monto estimado.</p>
                )}
                <p className="text-xs text-indigo-700/80 mt-1">
                  {planCobro.prorratea
                    ? `Prorrateo por ingreso después del día umbral${diasUmbralProporcional != null ? ` (${diasUmbralProporcional})` : ""}.`
                    : comenzarPeriodoSiguiente
                      ? "Sin prorrateo del período actual: el cobro arranca en el período siguiente."
                      : "Cuota completa del período (sin prorrateo)."}
                </p>
              </div>
            )}

            <div className="mt-5 max-w-md">
              <label className="text-[11px] font-semibold text-slate-500 block mb-1.5">
                Precio acordado
                {vehiculosCompletos.some(v => Number(v.modalidad) === MODALIDAD.FLEXIBLE) ? (
                  <span className="ml-1.5 font-medium normal-case text-amber-600">
                    · obligatorio (hay vehículos flexibles)
                  </span>
                ) : precioSugerido != null ? (
                  <span className={`ml-1.5 font-medium normal-case ${esFallback ? "text-amber-600" : "text-indigo-600"}`}>
                    · sugerido {formatMoney(precioSugerido)}
                    {esFallback ? " (genérico)" : " (suma tarifas fijas)"}
                  </span>
                ) : null}
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-semibold">$</span>
                <input
                  type="number"
                  value={precioAcordado}
                  onChange={e => setPrecioAcordado(e.target.value)}
                  placeholder={precioSugerido != null ? String(precioSugerido) : "Opcional"}
                  className={`${inputCls} pl-8`}
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-2">
                Se usa como monto de la primera cuota. Vacío = tarifa vigente al crear.
              </p>
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
          <div className="sticky top-36 rounded-3xl border border-slate-200/80 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.06)] overflow-hidden">
            <div className="px-5 py-4 bg-slate-900 text-white">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">Resumen</p>
              <p className="text-base font-bold mt-1">Vista previa del contrato</p>
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
                      {comenzarPeriodoSiguiente ? " · desde período siguiente" : ""}
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
                      : precioSugerido != null
                        ? formatMoney(precioSugerido)
                        : "—"}
                  </p>
                  {!precioAcordado && precioSugerido != null && (
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
