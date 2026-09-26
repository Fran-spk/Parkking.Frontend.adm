import { useState, useEffect } from "react";
import { Eye } from "lucide-react";
import DatePicker from "react-datepicker";
import { es } from "date-fns/locale";
import "react-datepicker/dist/react-datepicker.css";
import { pagoService } from "../services/pagoService";
import ModalDetallePago from "../components/layout/ModalDetallePago";
import PageHeader from "../components/layout/PageHeader";
import SearchField from "../components/layout/SearchField";

/** @typedef {import("../types").Pago} Pago */

function formatFecha(fecha) {
  if (!fecha) return "-";
  return new Date(fecha).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatPeriodo(pago) {
  const detalles = pago.detalles || [];
  if (detalles.length === 1) return detalles[0].periodoLabel || "-";
  if (detalles.length > 1) {
    return `${detalles.length} períodos`;
  }
  if (!pago.mes) return "-";
  return new Date(String(pago.mes).split("T")[0] + "T00:00:00").toLocaleDateString("es-AR", {
    month: "long",
    year: "numeric",
  });
}

function formatPrecio(precio) {
  if (!precio && precio !== 0) return "-";
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(precio);
}

export default function Pagos() {
  const [pagos, setPagos] = useState(/** @type {Pago[]} */ ([]));
  const [busqueda, setBusqueda] = useState("");
  const [desde, setDesde] = useState(null);
  const [hasta, setHasta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagoDetalle, setPagoDetalle] = useState(null);

  useEffect(() => {
    cargarPagos();
  }, [desde, hasta]);

  async function cargarPagos() {
    try {
      setError(null);
      setLoading(true);
      const desdeStr = desde
        ? `${desde.getFullYear()}-${String(desde.getMonth() + 1).padStart(2, "0")}-01`
        : null;
      const hastaStr = hasta
        ? `${hasta.getFullYear()}-${String(hasta.getMonth() + 1).padStart(2, "0")}-${new Date(
            hasta.getFullYear(),
            hasta.getMonth() + 1,
            0
          ).getDate()}`
        : null;
      const data = await pagoService.getAll(desdeStr, hastaStr);
      setPagos(data);
    } catch {
      setError("No se pudo cargar los pagos");
    } finally {
      setLoading(false);
    }
  }

  const pagosFiltrados = pagos.filter((p) => {
    const q = busqueda.toLowerCase();
    if (!q) return true;
    return (
      (p.numeroCochera || "").toLowerCase().includes(q) ||
      (p.clienteNombre || "").toLowerCase().includes(q) ||
      (p.observacion || "").toLowerCase().includes(q) ||
      (p.detalles || []).some((d) => (d.periodoLabel || "").toLowerCase().includes(q))
    );
  });

  const totalMonto = pagosFiltrados.reduce((acc, p) => acc + Number(p.monto || 0), 0);
  const totalRecargo = pagosFiltrados.reduce((acc, p) => acc + Number(p.recargo || 0), 0);

  function limpiarFiltros() {
    setDesde(null);
    setHasta(null);
    setBusqueda("");
  }

  return (
    <div className="space-y-5 animate-fade-in-up">
      <PageHeader
        title="Pagos"
        description="Cada pago puede cubrir uno o varios períodos."
        loading={loading}
        stats={[
          { label: "Transacciones", value: pagosFiltrados.length },
          { label: "Cobrado", value: formatPrecio(totalMonto) },
          {
            label: "Recargos",
            value: formatPrecio(totalRecargo),
            tone: totalRecargo > 0 ? "warning" : "default",
          },
        ]}
      />

      {error && (
        <div className="px-4 py-3 bg-danger-muted text-danger-ink text-sm">{error}</div>
      )}

      <div className="flex flex-wrap gap-3">
        <SearchField
          value={busqueda}
          onChange={setBusqueda}
          placeholder="Buscar cochera, cliente o período..."
          className="flex-1 min-w-48 max-w-sm"
        />

        <DatePicker
          selected={desde}
          onChange={setDesde}
          locale={es}
          dateFormat="MM/yyyy"
          showMonthYearPicker
          showFullMonthYearPicker
          placeholderText="Desde"
          isClearable
          className="text-sm border border-line-strong bg-surface-card px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand w-36"
        />

        <DatePicker
          selected={hasta}
          onChange={setHasta}
          locale={es}
          dateFormat="MM/yyyy"
          showMonthYearPicker
          showFullMonthYearPicker
          placeholderText="Hasta"
          isClearable
          minDate={desde}
          className="text-sm border border-line-strong bg-surface-card px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand w-36"
        />

        {(desde || hasta || busqueda) && (
          <button
            type="button"
            onClick={limpiarFiltros}
            className="text-sm text-ink-faint hover:text-ink px-3 py-2.5 transition-colors"
          >
            Limpiar
          </button>
        )}
      </div>

      {loading ? (
        <div className="pk-caption">Cargando...</div>
      ) : (
        <div className="bg-surface-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line">
                  <th className="text-left pk-label px-4 py-3">Fecha pago</th>
                  <th className="text-left pk-label px-4 py-3">Cochera</th>
                  <th className="text-left pk-label px-4 py-3">Cliente</th>
                  <th className="text-left pk-label px-4 py-3">Período(s)</th>
                  <th className="text-right pk-label px-4 py-3">Monto</th>
                  <th className="text-right pk-label px-4 py-3">Recargo</th>
                  <th className="text-right pk-label px-4 py-3 w-12"></th>
                </tr>
              </thead>
              <tbody>
                {pagosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center text-ink-faint py-10 text-sm">
                      No hay pagos para los filtros seleccionados
                    </td>
                  </tr>
                ) : (
                  pagosFiltrados.map((pago) => (
                    <tr
                      key={pago.pagoId}
                      className="border-b border-line hover:bg-surface-muted transition-colors align-top cursor-pointer"
                      onClick={() => setPagoDetalle(pago)}
                    >
                      <td className="px-4 py-3 text-ink-muted">{formatFecha(pago.fechaHoraCarga)}</td>
                      <td className="px-4 py-3">
                        <span className="font-semibold text-ink">{pago.numeroCochera ?? "-"}</span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-ink">{pago.clienteNombre ?? "-"}</p>
                      </td>
                      <td className="px-4 py-3 text-ink-muted capitalize">
                        <p>{formatPeriodo(pago)}</p>
                        {(pago.detalles || []).length > 1 && (
                          <div className="mt-1 space-y-0.5">
                            {pago.detalles.map((d) => (
                              <p key={d.detallePagoId} className="text-xs text-ink-faint">
                                {d.periodoLabel}: {formatPrecio(d.monto)}
                              </p>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-ink">
                        {formatPrecio(Number(pago.monto || 0) + Number(pago.recargo || 0))}
                        {(pago.detalles || []).length > 1 && (
                          <p className="text-[10px] font-normal text-ink-faint">
                            {pago.detalles.length} períodos
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {pago.recargo > 0 ? (
                          <span className="text-warning-ink">{formatPrecio(pago.recargo)}</span>
                        ) : (
                          <span className="text-ink-faint">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          title="Ver detalle"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPagoDetalle(pago);
                          }}
                          className="p-2 text-ink-faint hover:text-ink hover:bg-surface-muted transition-colors"
                        >
                          <Eye size={15} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {pagoDetalle && (
        <ModalDetallePago
          pago={pagoDetalle}
          pagoId={pagoDetalle.pagoId}
          onClose={() => setPagoDetalle(null)}
        />
      )}
    </div>
  );
}
