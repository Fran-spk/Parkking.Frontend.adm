import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import PageHeader from "../components/layout/PageHeader";
import { cuentaCorrienteService } from "../services/cuentaCorrienteService";
import { tipoMovimientoLabel } from "../types/finanzas.js";

/** @typedef {import("../types").CuentaCorriente} CuentaCorriente */
/** @typedef {import("../types").Movimiento} Movimiento */

function formatPrecio(precio) {
  return Number(precio || 0).toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  });
}

function formatFecha(fecha) {
  if (!fecha) return "—";
  return new Date(fecha).toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function CuentaCorriente() {
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [cuenta, setCuenta] = useState(/** @type {CuentaCorriente | null} */ (null));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    cargar(desde, hasta);
  }, []);

  async function cargar(d, h) {
    try {
      setLoading(true);
      setError(null);
      const data = await cuentaCorrienteService.estacionamiento(d, h);
      setCuenta(data);
    } catch (e) {
      const msg = e.response?.data;
      setError(typeof msg === "string" ? msg : "No se pudo cargar la cuenta corriente");
    } finally {
      setLoading(false);
    }
  }

  const movimientos = cuenta?.movimientos || [];
  const totales = useMemo(() => {
    const ingresos = movimientos
      .filter((m) => Number(m.importe) > 0)
      .reduce((acc, m) => acc + Number(m.importe), 0);
    const egresos = movimientos
      .filter((m) => Number(m.importe) < 0)
      .reduce((acc, m) => acc + Math.abs(Number(m.importe)), 0);
    return { ingresos, egresos, neto: ingresos - egresos };
  }, [movimientos]);

  return (
    <div className="space-y-5 animate-fade-in-up">
      <PageHeader
        title="Cuenta corriente"
        description="Movimientos del estacionamiento. El saldo positivo es resultado a favor."
        loading={loading}
        stats={[
          { label: "Saldo", value: formatPrecio(cuenta?.saldo), tone: Number(cuenta?.saldo) < 0 ? "danger" : "success" },
          { label: "Ingresos", value: formatPrecio(totales.ingresos) },
          { label: "Egresos", value: formatPrecio(totales.egresos), tone: totales.egresos > 0 ? "danger" : "default" },
          { label: "Neto del filtro", value: formatPrecio(totales.neto) },
        ]}
      />

      <div className="bg-surface-card px-4 py-3 flex flex-wrap items-end gap-3">
        <label className="text-xs text-ink-muted">
          Desde
          <input
            type="date"
            value={desde}
            onChange={(e) => setDesde(e.target.value)}
            className="mt-1 block text-sm border border-line-strong bg-surface-muted text-ink px-2 py-1.5 focus:outline-none focus:border-brand"
          />
        </label>
        <label className="text-xs text-ink-muted">
          Hasta
          <input
            type="date"
            value={hasta}
            onChange={(e) => setHasta(e.target.value)}
            className="mt-1 block text-sm border border-line-strong bg-surface-muted text-ink px-2 py-1.5 focus:outline-none focus:border-brand"
          />
        </label>
        <button
          type="button"
          onClick={() => cargar(desde, hasta)}
          className="text-xs font-semibold bg-brand text-brand-foreground px-3 py-2 hover:bg-brand-strong"
        >
          Filtrar
        </button>
        <button
          type="button"
          onClick={() => {
            setDesde("");
            setHasta("");
            cargar("", "");
          }}
          className="text-xs font-semibold text-ink-muted px-3 py-2 hover:text-ink"
        >
          Limpiar
        </button>
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      <div className="bg-surface-card overflow-hidden">
        {loading ? (
          <p className="px-4 py-8 text-sm text-ink-faint">Cargando...</p>
        ) : movimientos.length === 0 ? (
          <p className="px-4 py-8 text-sm text-ink-faint">No hay movimientos en este período</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left">
                <th className="pk-label px-4 py-3 font-medium">Fecha</th>
                <th className="pk-label px-4 py-3 font-medium">Tipo</th>
                <th className="pk-label px-4 py-3 font-medium">Concepto</th>
                <th className="pk-label px-4 py-3 font-medium">Cliente</th>
                <th className="pk-label px-4 py-3 font-medium text-right">Importe</th>
              </tr>
            </thead>
            <tbody>
              {movimientos.map((m) => {
                const importe = Number(m.importe);
                return (
                  <tr key={m.movimientoId} className="border-b border-line-subtle">
                    <td className="px-4 py-3 text-ink-muted whitespace-nowrap">{formatFecha(m.fechaHora)}</td>
                    <td className="px-4 py-3 text-ink">{tipoMovimientoLabel[m.tipo] || m.tipoDescripcion}</td>
                    <td className="px-4 py-3 text-ink">{m.concepto}</td>
                    <td className="px-4 py-3">
                      {m.clienteId ? (
                        <Link
                          to={`/clientes/${m.clienteId}/cuenta-corriente`}
                          className="text-ink font-semibold hover:underline"
                        >
                          #{m.clienteId}
                        </Link>
                      ) : (
                        <span className="text-ink-faint">—</span>
                      )}
                    </td>
                    <td
                      className={`px-4 py-3 text-right font-bold tabular-nums ${
                        importe < 0 ? "text-danger" : "text-ink"
                      }`}
                    >
                      {formatPrecio(importe)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
