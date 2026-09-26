import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Eye } from "lucide-react";
import PageHeader from "../components/layout/PageHeader";
import { cuentaCorrienteService } from "../services/cuentaCorrienteService";
import { clienteService } from "../services/clienteService";
import { etiquetaMovimiento, impactoEnCliente } from "../types/finanzas.js";

/** @typedef {import("../types").CuentaCorriente} CuentaCorriente */
/** @typedef {import("../types").Cliente} Cliente */
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

export default function CuentaCorrienteCliente() {
  const { clienteId } = useParams();
  const navigate = useNavigate();
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [cuenta, setCuenta] = useState(/** @type {CuentaCorriente | null} */ (null));
  const [cliente, setCliente] = useState(/** @type {Cliente | null} */ (null));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    clienteService
      .getById(clienteId)
      .then(setCliente)
      .catch(() => setCliente(null));
  }, [clienteId]);

  useEffect(() => {
    cargar("", "");
  }, [clienteId]);

  async function cargar(d, h) {
    try {
      setLoading(true);
      setError(null);
      const data = await cuentaCorrienteService.cliente(clienteId, d, h);
      setCuenta(data);
    } catch (e) {
      setError(typeof e.response?.data === "string" ? e.response.data : "No se pudo cargar la cuenta del cliente");
    } finally {
      setLoading(false);
    }
  }

  const movimientos = cuenta?.movimientos || [];
  const saldo = Number(cuenta?.saldo || 0);

  return (
    <div className="space-y-5 animate-fade-in-up">
      <button
        type="button"
        onClick={() => navigate("/clientes")}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-muted hover:text-ink"
      >
        <ArrowLeft size={14} /> Clientes
      </button>

      <PageHeader
        title={cliente?.nombre ? `Cuenta de ${cliente.nombre}` : "Cuenta del cliente"}
        description="Saldo positivo: el cliente debe. Saldo negativo: tiene a favor."
        loading={loading}
        stats={[
          { label: "Saldo", value: formatPrecio(saldo), tone: saldo > 0 ? "danger" : saldo < 0 ? "success" : "default" },
          { label: "Movimientos", value: movimientos.length },
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
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}
      {!loading && cuenta && !cuenta.existe && (
        <p className="text-sm text-ink-muted">Todavía no tiene cuenta corriente. El saldo es cero hasta el primer movimiento.</p>
      )}

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
                <th className="pk-label px-4 py-3 font-medium text-right">En su cuenta</th>
                <th className="pk-label px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {movimientos.map((m) => {
                const enCuenta = impactoEnCliente(m);
                return (
                  <tr key={m.movimientoId} className="border-b border-line-subtle">
                    <td className="px-4 py-3 text-ink-muted whitespace-nowrap">{formatFecha(m.fechaHora)}</td>
                    <td className="px-4 py-3 text-ink font-semibold">{etiquetaMovimiento(m)}</td>
                    <td className="px-4 py-3 text-ink">{m.concepto}</td>
                    <td
                      className={`px-4 py-3 text-right font-bold tabular-nums ${
                        enCuenta > 0 ? "text-danger" : "text-ink"
                      }`}
                    >
                      {formatPrecio(enCuenta)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link to={`/movimientos/${m.movimientoId}`} title="Auditar movimiento" className="inline-flex p-1.5 text-ink-faint hover:text-ink">
                        <Eye size={15} />
                      </Link>
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
