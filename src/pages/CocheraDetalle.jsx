import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Car, ChevronRight } from "lucide-react";
import { cocheraService } from "../services/cocheraService";
import { categoriaCocheraService } from "../services/categoriaCocheraService";
import { zonaService } from "../services/zonaService";
import { tipoVehiculoService } from "../services/tipoVehiculoService";
import { estacionamientoService } from "../services/estacionamientoService";
import { abonoService } from "../services/abonoService";
import FilterSelect, { fieldClass } from "../components/layout/FilterSelect";

/** @typedef {import("../types").Cochera} Cochera */
/** @typedef {import("../types").Abono} Abono */

const inputClass = fieldClass;

function errMsg(e, fallback) {
  const d = e?.response?.data;
  if (typeof d === "string") return d;
  if (d?.mensaje) return d.mensaje;
  return e?.message || fallback;
}

function labelVehiculos(abono) {
  const vehiculos =
    Array.isArray(abono.vehiculos) && abono.vehiculos.length > 0
      ? abono.vehiculos
      : abono.patente || abono.tipoVehiculo
        ? [{ patente: abono.patente, tipoVehiculo: abono.tipoVehiculo }]
        : [];
  return (
    vehiculos
      .map((v) => [v.tipoVehiculo?.nombre, v.patente].filter(Boolean).join(" "))
      .filter(Boolean)
      .join(" · ") || "Sin vehículos"
  );
}

export default function CocheraDetalle() {
  const { cocheraId } = useParams();
  const navigate = useNavigate();
  const [cochera, setCochera] = useState(/** @type {Cochera | null} */ (null));
  const [categorias, setCategorias] = useState([]);
  const [zonas, setZonas] = useState([]);
  const [tipos, setTipos] = useState([]);
  const [abonos, setAbonos] = useState(/** @type {Abono[]} */ ([]));
  const [exigirZona, setExigirZona] = useState(false);
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);
  const [ok, setOk] = useState(false);

  const [numero, setNumero] = useState("");
  const [observacion, setObservacion] = useState("");
  const [categoriaCocheraId, setCategoriaCocheraId] = useState("");
  const [zonaId, setZonaId] = useState("");
  const [multipleOcupacion, setMultipleOcupacion] = useState(false);
  const [maxOcupacion, setMaxOcupacion] = useState("2");
  const [vehiculosIds, setVehiculosIds] = useState(/** @type {number[]} */ ([]));

  useEffect(() => {
    cargar();
  }, [cocheraId]);

  function aplicarCochera(c) {
    setCochera(c);
    setNumero(c.numero ?? "");
    setObservacion(c.observacion ?? "");
    setCategoriaCocheraId(c.categoriaCocheraId ? String(c.categoriaCocheraId) : "");
    setZonaId(c.zonaId ?? c.zona?.zonaId ? String(c.zonaId ?? c.zona?.zonaId) : "");
    setMultipleOcupacion(!!c.multipleOcupacion);
    setMaxOcupacion(c.maxOcupacion != null ? String(c.maxOcupacion) : "2");
    setVehiculosIds((c.vehiculosPermitidosIds ?? []).map(Number));
  }

  async function cargar() {
    try {
      setLoading(true);
      setError(null);
      const [cocheras, cats, zs, tvs, est, abs] = await Promise.all([
        cocheraService.getAll(),
        categoriaCocheraService.getAll(),
        zonaService.getAll(),
        tipoVehiculoService.getAll(),
        estacionamientoService.get(),
        abonoService.getByCochera(cocheraId),
      ]);
      const found = (Array.isArray(cocheras) ? cocheras : []).find(
        (c) => String(c.cocheraId) === String(cocheraId)
      );
      if (found) aplicarCochera(found);
      else setCochera(null);
      setCategorias(Array.isArray(cats) ? cats : []);
      setZonas(Array.isArray(zs) ? zs : []);
      setTipos(Array.isArray(tvs) ? tvs : []);
      setExigirZona(!!est?.trabajarConZonas);
      setAbonos(Array.isArray(abs) ? abs : []);
    } catch (e) {
      setError(errMsg(e, "No se pudo cargar la cochera"));
    } finally {
      setLoading(false);
    }
  }

  function toggleVehiculo(id) {
    setVehiculosIds((prev) => (prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]));
  }

  async function guardar(e) {
    e.preventDefault();
    if (!cochera) return;
    if (!numero.trim()) {
      setError("El número es obligatorio");
      return;
    }
    if (!categoriaCocheraId) {
      setError("Seleccioná una categoría");
      return;
    }
    if (exigirZona && !zonaId) {
      setError("Este estacionamiento trabaja con zonas: seleccioná una");
      return;
    }
    if (multipleOcupacion && (!Number.isFinite(Number(maxOcupacion)) || Number(maxOcupacion) < 2)) {
      setError("Con múltiple ocupación el máximo debe ser al menos 2");
      return;
    }
    try {
      setGuardando(true);
      setError(null);
      setOk(false);
      await cocheraService.modificar(cochera.cocheraId, {
        numero: numero.trim(),
        categoriaCocheraId: Number(categoriaCocheraId),
        zonaId: zonaId ? Number(zonaId) : null,
        estadoCochera: Number(cochera.estadoCochera ?? 0),
        observacion: observacion.trim() || null,
        multipleOcupacion,
        maxOcupacion: multipleOcupacion ? Number(maxOcupacion) : null,
        vehiculosPermitidosIds: vehiculosIds.map(Number),
      });
      await cargar();
      setOk(true);
    } catch (err) {
      setError(errMsg(err, "No se pudo guardar"));
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="space-y-5 pb-12 animate-fade-in-up">
      <button
        type="button"
        onClick={() => navigate("/cocheras")}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-ink-muted hover:text-ink"
      >
        <ArrowLeft size={14} />
        Cocheras
      </button>

      {loading ? (
        <p className="pk-caption">Cargando cochera…</p>
      ) : !cochera ? (
        <p className="text-sm text-ink-muted">No se encontró la cochera.</p>
      ) : (
        <>
          <div>
            <h1 className="pk-title">Cochera {cochera.numero}</h1>
            <p className="pk-desc mt-1">Datos de la plaza y abonos que la usan.</p>
          </div>

          <form onSubmit={guardar} className="bg-surface-card border border-line p-5 space-y-4 max-w-xl">
            {error && (
              <div className="text-xs font-medium text-danger-ink bg-danger-muted px-3 py-2">{error}</div>
            )}
            {ok && (
              <div className="text-xs font-medium text-success-ink bg-success-muted px-3 py-2">
                Cambios guardados.
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="pk-label block mb-1.5">Número</label>
                <input value={numero} onChange={(e) => setNumero(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className="pk-label block mb-1.5">Categoría</label>
                <FilterSelect
                  className="w-full"
                  ariaLabel="Categoría"
                  value={categoriaCocheraId}
                  onChange={setCategoriaCocheraId}
                  options={[
                    { value: "", label: "Seleccioná" },
                    ...categorias.map((c) => ({ value: c.categoriaCocheraId, label: c.nombre })),
                  ]}
                />
              </div>
            </div>

            <div>
              <label className="pk-label block mb-1.5">Zona{exigirZona ? "" : " (opcional)"}</label>
              <FilterSelect
                className="w-full"
                ariaLabel="Zona"
                value={zonaId}
                onChange={setZonaId}
                options={[
                  { value: "", label: exigirZona ? "Seleccioná una zona" : "Sin zona" },
                  ...zonas.map((z) => ({ value: z.zonaId, label: z.nombre })),
                ]}
              />
            </div>

            <div>
              <label className="pk-label block mb-1.5">Observación</label>
              <textarea
                value={observacion}
                onChange={(e) => setObservacion(e.target.value)}
                rows={2}
                className={`${inputClass} resize-none`}
              />
            </div>

            <button
              type="button"
              onClick={() => {
                const next = !multipleOcupacion;
                setMultipleOcupacion(next);
                if (next && Number(maxOcupacion) < 2) setMaxOcupacion("2");
              }}
              className={`w-full flex items-center justify-between p-3 border-2 ${
                multipleOcupacion ? "border-brand bg-brand-muted" : "border-line bg-surface-muted"
              }`}
            >
              <span className="text-sm font-semibold text-ink">Múltiple ocupación</span>
              <span className="text-xs font-bold text-ink-muted">{multipleOcupacion ? "Sí" : "No"}</span>
            </button>

            {multipleOcupacion && (
              <div>
                <label className="pk-label block mb-1.5">Máximo de abonos</label>
                <input
                  type="number"
                  min={2}
                  max={50}
                  value={maxOcupacion}
                  onChange={(e) => setMaxOcupacion(e.target.value)}
                  className={inputClass}
                />
              </div>
            )}

            {tipos.length > 0 && (
              <div>
                <label className="pk-label block mb-1.5">Tipos de vehículo</label>
                <div className="flex flex-wrap gap-2">
                  {tipos.map((tipo) => {
                    const active = vehiculosIds.includes(tipo.tipoVehiculoId);
                    return (
                      <button
                        key={tipo.tipoVehiculoId}
                        type="button"
                        onClick={() => toggleVehiculo(tipo.tipoVehiculoId)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border-2 ${
                          active
                            ? "border-brand bg-brand-muted text-ink"
                            : "border-line text-ink-faint"
                        }`}
                      >
                        <Car size={12} /> {tipo.nombre}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={guardando}
              className="text-sm font-bold text-brand-foreground bg-brand hover:bg-brand-strong px-4 py-2.5 disabled:opacity-50"
            >
              {guardando ? "Guardando..." : "Guardar"}
            </button>
          </form>

          <section className="space-y-3">
            <h2 className="pk-heading">Abonos</h2>
            {abonos.length === 0 ? (
              <p className="text-sm text-ink-muted">Esta cochera no tiene abonos asociados.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {abonos.map((a) => {
                  const id = a.abonoId ?? a.abonoCocheraId;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => navigate(`/pagosAbono/${id}`)}
                      className="text-left bg-surface-card border border-line p-4 hover:bg-brand-muted transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-ink truncate">{a.cliente?.nombre || "Sin cliente"}</p>
                          <p className="mt-1 text-xs text-ink-muted truncate">{labelVehiculos(a)}</p>
                        </div>
                        <ChevronRight size={16} className="shrink-0 text-ink-faint" />
                      </div>
                      <p className="mt-3 text-[10px] font-bold uppercase tracking-wider text-ink-faint">
                        {a.activo === false ? "De baja" : "Activo"}
                      </p>
                    </button>
                  );
                })}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
