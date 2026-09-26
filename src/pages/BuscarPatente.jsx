import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Car, User, ParkingSquare, CreditCard, AlertCircle, Loader2 } from "lucide-react";
import { abonoService } from "../services/abonoService";
import PageHeader, { PageHeaderAction } from "../components/layout/PageHeader";
import SearchField from "../components/layout/SearchField";
import {
  abonoIdOf,
  labelCocheras,
  plazasDe,
  vehiculosDe,
  modalidadLabel,
  MODALIDAD,
} from "../utils/abonoHelpers";
import { PERIODICIDAD_OPTIONS } from "../utils/periodicidadHelpers";

/** @typedef {import("../types").Abono} Abono */

function formatFecha(fecha) {
  if (!fecha) return "—";
  const solo = String(fecha).split("T")[0];
  const [y, m, d] = solo.split("-").map(Number);
  return new Date(y, m - 1, d || 1).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatPrecio(precio) {
  if (precio == null || precio === "") return "Tarifa de lista";
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(Number(precio));
}

function periodicidadLabel(value) {
  return PERIODICIDAD_OPTIONS.find((o) => o.value === Number(value))?.label || "Mensual";
}

export default function BuscarPatente() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [resultados, setResultados] = useState(/** @type {Abono[] | null} */ (null));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [busquedas, setBusquedas] = useState(0);

  async function buscar(e) {
    e?.preventDefault();
    const q = query.trim();
    if (q.length < 2) {
      setError("Ingresá al menos 2 caracteres");
      setResultados(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await abonoService.buscarPorPatente(q);
      const list = Array.isArray(data) ? data : [];
      setResultados(list);
      setBusquedas((n) => n + 1);
    } catch (err) {
      const msg = err.response?.data;
      setError(typeof msg === "string" ? msg : "No se pudo buscar");
      setResultados(null);
    } finally {
      setLoading(false);
    }
  }

  const activos = resultados?.filter((a) => a.activo === true || a.activo === "true").length ?? 0;
  const bajas = resultados ? resultados.length - activos : 0;

  return (
    <div className="max-w-3xl space-y-5 animate-fade-in-up">
      <PageHeader
        title="Buscar patente"
        description="Encontrá abonos por patente (parcial o completa) y entrá al detalle de cobros."
        loading={loading && !resultados}
        stats={
          resultados
            ? [
                { label: "Resultados", value: resultados.length },
                { label: "Activos", value: activos, tone: "success" },
                { label: "Baja", value: bajas, tone: "warning" },
              ]
            : busquedas === 0
              ? [
                  { label: "Resultados", value: "—" },
                  { label: "Activos", value: "—" },
                  { label: "Baja", value: "—" },
                ]
              : null
        }
      />

      <form onSubmit={buscar} className="bg-surface-card p-4 sm:p-5">
        <label className="pk-label block mb-2">Patente</label>
        <div className="flex gap-2">
          <SearchField
            value={query}
            onChange={(v) => setQuery(v.toUpperCase())}
            placeholder="Ej. AB123 / AB123CD"
            autoFocus
            className="flex-1"
            inputClassName="font-mono font-bold tracking-wider uppercase"
          />
          <PageHeaderAction type="submit" disabled={loading}>
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
            Buscar
          </PageHeaderAction>
        </div>
      </form>

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 bg-danger-muted text-danger-ink text-sm">
          <AlertCircle size={15} className="shrink-0" /> {error}
        </div>
      )}

      {resultados && resultados.length === 0 && (
        <div className="border border-dashed border-line-strong bg-surface-muted/60 px-6 py-12 text-center">
          <Car className="w-10 h-10 text-ink-faint mx-auto mb-3" />
          <p className="text-sm font-semibold text-ink">Sin abonos para esa patente</p>
          <p className="text-xs text-ink-faint mt-1">
            Probá con otra búsqueda o revisá si el vehículo está cargado.
          </p>
        </div>
      )}

      {resultados && resultados.length > 0 && (
        <div className="space-y-3">
          {resultados.map((abono) => {
            const id = abonoIdOf(abono);
            const esActivo = abono.activo === true || abono.activo === "true";
            const plazas = plazasDe(abono);
            const vehiculos = vehiculosDe(abono);

            return (
              <div
                key={id}
                className={`bg-surface-card p-5 ${esActivo ? "" : "opacity-80"}`}
              >
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="inline-flex items-center gap-1.5 text-lg font-bold text-ink">
                        <ParkingSquare size={18} className="text-ink-muted" />
                        {labelCocheras(abono)}
                      </span>
                      {esActivo ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-success-muted text-success-ink">
                          ACTIVO
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-surface-muted text-ink-muted">
                          BAJA
                        </span>
                      )}
                      <span className="text-[10px] font-semibold px-2 py-0.5 bg-brand-muted text-ink">
                        {periodicidadLabel(abono.periodicidadCobro)}
                      </span>
                    </div>
                    <p className="text-xs text-ink-faint mt-1">
                      {plazas[0]?.cochera?.categoriaCochera?.nombre || "Sin categoría"}
                      {" · "}
                      Desde {formatFecha(abono.fechaInicio)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate(`/pagosAbono/${id}`)}
                    className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold bg-brand text-brand-foreground hover:bg-brand-strong transition-colors"
                  >
                    <CreditCard size={14} />
                    Ver abono
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-line">
                  <div className="flex items-start gap-2">
                    <User size={14} className="text-ink-faint mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <p className="pk-label">Cliente</p>
                      <p className="text-sm font-semibold text-ink truncate">
                        {abono.cliente?.nombre || "—"}
                      </p>
                      {abono.cliente?.telefono && (
                        <p className="text-xs text-ink-faint">{abono.cliente.telefono}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <p className="pk-label mb-1">Vehículos</p>
                    <div className="space-y-1">
                      {vehiculos.map((v, i) => (
                        <div
                          key={v.abonoVehiculoId ?? `${v.patente}-${i}`}
                          className="flex items-center gap-1.5 flex-wrap"
                        >
                          <span className="font-mono text-xs font-bold bg-surface-muted px-1.5 py-0.5">
                            {v.patente || "S/PAT"}
                          </span>
                          <span
                            className={`text-[9px] font-bold px-1 py-0.5 ${
                              Number(v.modalidad) === MODALIDAD.FLEXIBLE
                                ? "bg-warning-muted text-warning-ink"
                                : "bg-brand-muted text-ink"
                            }`}
                          >
                            {modalidadLabel(v.modalidad)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="pk-label">Precio</p>
                    <p className="text-sm font-semibold text-ink">
                      {formatPrecio(abono.precioAcordado)}
                    </p>
                    {abono.cobrador && (
                      <p className="text-xs text-ink-faint mt-0.5">Cobrador: {abono.cobrador}</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
