import { useState, useEffect, useMemo } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  CreditCard,
  Search,
  Car,
  AlertTriangle,
  ChevronRight,
  Phone,
} from "lucide-react";
import { abonoService } from "../services/abonoService";
import ModalEditarAbono from "../components/layout/ModalEditarAbono";
import { useNavigate } from "react-router-dom";
import {
  abonoIdOf,
  labelCocheras,
  plazasDe,
  vehiculosDe,
  abonoSearchText,
  modalidadLabel,
  MODALIDAD,
} from "../utils/abonoHelpers";
import { PERIODICIDAD_OPTIONS } from "../utils/periodicidadHelpers";

function formatPrecio(precio) {
  if (precio == null || precio === "") return null;
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(Number(precio));
}

function periodicidadLabel(value) {
  return PERIODICIDAD_OPTIONS.find((o) => o.value === Number(value))?.label || "Mensual";
}

function formatFecha(fecha) {
  if (!fecha) return "—";
  return new Date(fecha).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function PlazaMark({ label, muted, debt }) {
  const parts = String(label || "—")
    .split(/[·,]/)
    .map((s) => s.trim())
    .filter(Boolean);
  const primary = parts[0] || "—";
  const extra = parts.length > 1 ? `+${parts.length - 1}` : null;

  return (
    <div
      className={`relative w-[4.25rem] h-[4.25rem] rounded-2xl flex flex-col items-center justify-center shrink-0 transition-colors
        ${muted
          ? "bg-slate-100 text-slate-400"
          : debt
            ? "bg-rose-600 text-white shadow-lg shadow-rose-600/20"
            : "bg-slate-900 text-white shadow-lg shadow-slate-900/20"
        }`}
    >
      <span
        className={`text-[9px] font-bold uppercase tracking-[0.14em] leading-none ${
          muted ? "text-slate-400" : debt ? "text-rose-200" : "text-slate-400"
        }`}
      >
        Plaza
      </span>
      <span className="text-lg font-black leading-tight tracking-tight mt-0.5 tabular-nums truncate max-w-[3.5rem] text-center">
        {primary}
      </span>
      {extra && (
        <span
          className={`absolute -top-1.5 -right-1.5 min-w-[1.35rem] h-5 px-1 rounded-full text-[10px] font-black flex items-center justify-center border-2 border-white
            ${debt ? "bg-rose-100 text-rose-700" : "bg-indigo-100 text-indigo-700"}`}
        >
          {extra}
        </span>
      )}
    </div>
  );
}

export default function Abonos() {
  const [abonos, setAbonos] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [verHistoricos, setVerHistoricos] = useState(false);
  const [modalEditar, setModalEditar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    cargarAbonos();
  }, [verHistoricos]);

  async function cargarAbonos() {
    try {
      setLoading(true);
      setError(null);
      const data = verHistoricos
        ? await abonoService.getAllAbonos()
        : await abonoService.getOcupadas();
      setAbonos(data);
    } catch {
      setError("No se pudo conectar con el servidor");
    } finally {
      setLoading(false);
    }
  }

  const abonosFiltrados = abonos.filter((a) => {
    const q = busqueda.toLowerCase().trim();
    if (!q) return true;
    return abonoSearchText(a).includes(q);
  });

  const stats = useMemo(() => {
    const activos = abonos.filter((a) => a.activo === true || a.activo === "true");
    const deudores = activos.filter(
      (a) => a.diasAtraso > 0 || a.esDeudor === true || a.montoDeuda > 0
    );
    return {
      total: abonos.length,
      activos: activos.length,
      deudores: deudores.length,
    };
  }, [abonos]);

  async function handleDarDeBaja(abono) {
    const confirmado = confirm(
      `¿Dar de baja el abono de ${abono.cliente?.nombre} (cocheras ${labelCocheras(abono)})?\n\nEsta acción liberará las plazas.`
    );
    if (!confirmado) return;
    try {
      await abonoService.darDeBaja(abonoIdOf(abono));
      cargarAbonos();
    } catch (e) {
      const msg = e.response?.data;
      setError(typeof msg === "string" ? msg : "No se pudo dar de baja el abono");
    }
  }

  return (
    <div className="space-y-5 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="pk-title">Abonos</h1>
          <p className="pk-desc mt-1">
            Contratos activos, plazas y vehículos habilitados.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate("/abonos/nuevo")}
          className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-lg shadow-slate-900/20 transition-all"
        >
          <Plus size={16} />
          Nuevo abono
        </button>
      </div>

      {/* Mini resumen */}
      {!loading && (
        <div className="grid grid-cols-3 gap-3 max-w-lg">
          <div className="rounded-2xl bg-white border border-slate-200/80 px-4 py-3 shadow-[0_1px_0_rgba(15,23,42,0.04)]">
            <p className="pk-label">Listados</p>
            <p className="text-xl font-black text-slate-900 tracking-tight mt-1 tabular-nums">
              {stats.total}
            </p>
          </div>
          <div className="rounded-2xl bg-white border border-slate-200/80 px-4 py-3 shadow-[0_1px_0_rgba(15,23,42,0.04)]">
            <p className="pk-label">Activos</p>
            <p className="text-xl font-black text-slate-900 tracking-tight mt-1 tabular-nums">
              {stats.activos}
            </p>
          </div>
          <div
            className={`rounded-2xl border px-4 py-3 shadow-[0_1px_0_rgba(15,23,42,0.04)] ${
              stats.deudores > 0
                ? "bg-rose-50 border-rose-100"
                : "bg-white border-slate-200/80"
            }`}
          >
            <p className={`pk-label ${stats.deudores > 0 ? "text-rose-400" : ""}`}>Con deuda</p>
            <p
              className={`text-xl font-black tracking-tight mt-1 tabular-nums ${
                stats.deudores > 0 ? "text-rose-700" : "text-slate-900"
              }`}
            >
              {stats.deudores}
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="px-4 py-3 bg-rose-50 text-rose-700 text-sm rounded-xl border border-rose-100 flex items-center gap-2">
          <AlertTriangle size={15} className="shrink-0" />
          {error}
        </div>
      )}

      {/* Toolbar + lista */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-[0_1px_0_rgba(15,23,42,0.04)] overflow-hidden">
        <div className="px-4 sm:px-5 py-3.5 border-b border-slate-100 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="search"
              placeholder="Cochera, cliente, patente o cobrador…"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50/80 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-400 focus:bg-white transition-all placeholder:text-slate-300"
            />
          </div>

          <label className="flex items-center gap-2.5 cursor-pointer select-none shrink-0">
            <div className="relative">
              <input
                type="checkbox"
                checked={verHistoricos}
                onChange={(e) => setVerHistoricos(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-slate-900" />
            </div>
            <span className="text-sm font-semibold text-slate-600">Incluir históricos</span>
          </label>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-10 h-10 border-[3px] border-slate-100 border-t-slate-900 rounded-full animate-spin" />
            <p className="text-sm font-semibold text-slate-500">Cargando abonos…</p>
          </div>
        ) : abonosFiltrados.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mb-4">
              <Car className="w-6 h-6 text-slate-300" />
            </div>
            <h4 className="pk-heading">Sin resultados</h4>
            <p className="pk-desc mt-1 max-w-xs">
              No hay abonos que coincidan con la búsqueda
              {verHistoricos ? "" : " activa"}.
            </p>
            {!busqueda && (
              <button
                type="button"
                onClick={() => navigate("/abonos/nuevo")}
                className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-4 py-2.5 rounded-xl transition-colors"
              >
                <Plus size={15} /> Crear el primero
              </button>
            )}
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {abonosFiltrados.map((abono, index) => {
              const id = abonoIdOf(abono);
              const esActivo = abono.activo === true || abono.activo === "true";
              const esDeudor =
                abono.diasAtraso > 0 || abono.esDeudor === true || abono.montoDeuda > 0;
              const plazas = plazasDe(abono);
              const vehiculos = vehiculosDe(abono);
              const primeraCat = plazas[0]?.cochera?.categoriaCochera?.nombre;
              const precio = formatPrecio(abono.precioAcordado);
              const delay = Math.min(index * 40, 280);

              return (
                <li
                  key={id}
                  className={`group relative transition-colors ${
                    !esActivo
                      ? "bg-slate-50/40"
                      : esDeudor
                        ? "hover:bg-rose-50/40"
                        : "hover:bg-slate-50/70"
                  }`}
                  style={{ animationDelay: `${delay}ms` }}
                >
                  {/* Accent edge */}
                  <div
                    className={`absolute left-0 top-3 bottom-3 w-[3px] rounded-r-full ${
                      !esActivo
                        ? "bg-slate-200"
                        : esDeudor
                          ? "bg-rose-500"
                          : "bg-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    }`}
                  />

                  <div className="flex flex-col lg:flex-row lg:items-center gap-4 lg:gap-5 px-4 sm:px-5 py-4 sm:py-5">
                    {/* Plaza + identidad */}
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                      <PlazaMark
                        label={labelCocheras(abono)}
                        muted={!esActivo}
                        debt={esActivo && esDeudor}
                      />

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3
                            className={`text-base font-bold tracking-tight truncate ${
                              !esActivo
                                ? "text-slate-400 line-through"
                                : esDeudor
                                  ? "text-rose-700"
                                  : "text-slate-900"
                            }`}
                          >
                            {abono.cliente?.nombre ?? "Sin cliente"}
                          </h3>
                          {esActivo ? (
                            esDeudor ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-100">
                                <AlertTriangle size={10} />
                                Deuda
                                {abono.diasAtraso > 0 ? ` · ${abono.diasAtraso}d` : ""}
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                                Activo
                              </span>
                            )
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200">
                              Baja
                            </span>
                          )}
                        </div>

                        <p className="pk-caption mt-0.5 truncate">
                          {plazas.length > 1
                            ? `${plazas.length} plazas · ${labelCocheras(abono)}`
                            : primeraCat || "Sin categoría"}
                          {abono.cliente?.telefono ? ` · ${abono.cliente.telefono}` : ""}
                        </p>

                        {/* Patentes */}
                        <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                          {vehiculos.length === 0 ? (
                            <span className="text-[11px] text-slate-400 font-medium">
                              Sin vehículos
                            </span>
                          ) : (
                            vehiculos.slice(0, 4).map((v, i) => (
                              <span
                                key={v.abonoVehiculoId ?? `${v.patente}-${i}`}
                                className={`inline-flex items-center gap-1.5 font-mono text-[11px] font-bold px-2 py-1 rounded-lg border ${
                                  esActivo
                                    ? "bg-white border-slate-200 text-slate-800"
                                    : "bg-slate-100 border-slate-100 text-slate-400"
                                }`}
                              >
                                {v.patente || "S/PAT"}
                                <span
                                  className={`text-[9px] font-bold uppercase tracking-wide px-1 py-px rounded ${
                                    Number(v.modalidad) === MODALIDAD.FLEXIBLE
                                      ? "bg-amber-50 text-amber-700"
                                      : "bg-indigo-50 text-indigo-600"
                                  }`}
                                >
                                  {modalidadLabel(v.modalidad)?.slice(0, 3) || "Fij"}
                                </span>
                              </span>
                            ))
                          )}
                          {vehiculos.length > 4 && (
                            <span className="text-[11px] font-semibold text-slate-400">
                              +{vehiculos.length - 4}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Meta + precio */}
                    <div className="flex items-center justify-between lg:justify-end gap-4 lg:gap-8 pl-[4.25rem] lg:pl-0 sm:pl-0">
                      <div className="hidden sm:flex flex-col items-start lg:items-end gap-1 min-w-[7.5rem]">
                        <span className="inline-flex text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md">
                          {periodicidadLabel(abono.periodicidadCobro)}
                        </span>
                        <p className="text-[11px] text-slate-400 font-medium">
                          Desde {formatFecha(abono.fechaInicio)}
                        </p>
                        {abono.cobrador && (
                          <p className="text-[11px] text-slate-400 truncate max-w-[9rem]">
                            {abono.cobrador}
                          </p>
                        )}
                      </div>

                      <div className="text-right shrink-0 min-w-[5.5rem]">
                        <p className="pk-label mb-0.5">Monto</p>
                        <p
                          className={`text-lg font-black tracking-tight tabular-nums ${
                            !esActivo ? "text-slate-400" : "text-slate-900"
                          }`}
                        >
                          {precio || (
                            <span className="text-sm font-bold text-slate-500">Lista</span>
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Acciones */}
                    <div className="flex items-center gap-1.5 pl-[4.25rem] lg:pl-0 sm:pl-0 lg:opacity-80 lg:group-hover:opacity-100 transition-opacity">
                      {abono.cliente?.telefono && (
                        <a
                          href={`https://wa.me/549${String(abono.cliente.telefono).replace(/\D/g, "")}`}
                          target="_blank"
                          rel="noreferrer"
                          title="WhatsApp"
                          className="p-2.5 rounded-xl text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Phone size={15} />
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={() => navigate(`/pagosAbono/${id}`)}
                        className={`inline-flex items-center gap-1.5 py-2.5 px-3.5 rounded-xl text-xs font-bold transition-all ${
                          esDeudor && esActivo
                            ? "bg-rose-600 text-white hover:bg-rose-700 shadow-md shadow-rose-600/20"
                            : "bg-slate-900 text-white hover:bg-slate-800 shadow-md shadow-slate-900/15"
                        }`}
                      >
                        <CreditCard size={14} />
                        Pagos
                        <ChevronRight size={13} className="opacity-60" />
                      </button>
                      {esActivo && (
                        <>
                          <button
                            type="button"
                            onClick={() => setModalEditar(abono)}
                            title="Editar"
                            className="p-2.5 rounded-xl text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDarDeBaja(abono)}
                            title="Dar de baja"
                            className="p-2.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          >
                            <Trash2 size={15} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {modalEditar && (
        <ModalEditarAbono
          abono={modalEditar}
          onClose={() => setModalEditar(null)}
          onGuardado={() => {
            setModalEditar(null);
            cargarAbonos();
          }}
        />
      )}
    </div>
  );
}
