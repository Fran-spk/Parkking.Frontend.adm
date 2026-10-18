import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Clock, CreditCard, LogIn, Plus } from "lucide-react";
import PageHeader, { PageHeaderAction } from "../components/layout/PageHeader";
import CocherasGrid from "../components/layout/CocherasGrid";
import Patente from "../components/layout/Patente";
import { dashboardService } from "../services/dashboardService";
import { estacionamientoService } from "../services/estacionamientoService";
import { pagoService } from "../services/pagoService";
import { plata, fechaCorta, whatsappUrl } from "../utils/clienteHelpers";
import { diasHasta } from "../utils/reservaHelpers";

/** @typedef {import("../types").Dashboard} Dashboard */

function readEstacionamiento() {
  try {
    const raw = localStorage.getItem("parkking_estacionamiento");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function hora(fecha) {
  if (!fecha) return "";
  return new Date(fecha).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
}

function tiempo(minutos) {
  const m = Math.max(0, Number(minutos) || 0);
  const h = Math.floor(m / 60);
  const resto = String(m % 60).padStart(2, "0");
  if (h === 0) return `${m % 60} min`;
  return `${h} h ${resto}`;
}

function fechaLarga() {
  const today = new Date().toLocaleDateString("es-AR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  return today.charAt(0).toUpperCase() + today.slice(1);
}

function Bloque({ titulo, extra, children }) {
  return (
    <section className="bg-surface-card">
      <header className="flex items-baseline justify-between gap-3 px-4 pt-3 pb-2 border-b border-line">
        <h2 className="pk-label text-ink-muted">{titulo}</h2>
        {extra}
      </header>
      {children}
    </section>
  );
}

function Vacio({ texto }) {
  return <p className="px-4 py-10 text-center text-sm font-medium text-ink-muted">{texto}</p>;
}

function Barras({ items, valorDe, labelDe }) {
  const max = Math.max(1, ...items.map((x) => Number(valorDe(x)) || 0));
  return (
    <div className="px-4 py-3 space-y-2">
      {items.map((item, i) => {
        const valor = Number(valorDe(item)) || 0;
        return (
          <div key={labelDe(item) || i} className="flex items-center gap-3">
            <span className="w-14 pk-caption font-semibold truncate">{labelDe(item)}</span>
            <div className="flex-1 h-5 bg-surface-muted">
              <div className="h-full bg-brand" style={{ width: `${Math.round((valor / max) * 100)}%` }} />
            </div>
            <span className="w-24 text-right text-sm font-semibold tabular-nums">{plata(valor)}</span>
          </div>
        );
      })}
    </div>
  );
}

function reservaPlazo(r) {
  const aInicio = diasHasta(r.fechaInicio);
  const aVence = diasHasta(r.fechaVencimiento);
  if (aInicio != null && aInicio > 0) return `Empieza en ${aInicio} d`;
  if (aInicio === 0) return "Empieza hoy";
  if (aVence === 0) return "Vence hoy";
  if (aVence != null && aVence > 0) return `Vence en ${aVence} d`;
  return `Desde ${fechaCorta(r.fechaInicio)}`;
}

const ATAJOS = [
  { to: "/rotativo", label: "Ingreso y salida", desc: "Rotativo del día" },
  { to: "/pagos-pendientes", label: "Cobrar", desc: "Cuotas y señas" },
  { to: "/reservas", label: "Reservas", desc: "Vigentes y señas" },
  { to: "/cuenta-corriente", label: "Cuenta corriente", desc: "Caja y movimientos" },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(/** @type {Dashboard | null} */ (null));
  const [pagosPendientes, setPagosPendientes] = useState(0);
  const [estacionamiento, setEstacionamiento] = useState(readEstacionamiento);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([dashboardService.getSummary(), pagoService.getPendientes().catch(() => [])])
      .then(([res, pendientes]) => {
        setData(res?.data ? res.data : res);
        setPagosPendientes(Array.isArray(pendientes) ? pendientes.length : 0);
      })
      .catch((err) => {
        const payload = err.response?.data;
        setError(
          typeof payload === "string"
            ? payload
            : payload?.title || payload?.message || "No se pudo cargar el estacionamiento."
        );
      })
      .finally(() => setLoading(false));

    const onEst = () => setEstacionamiento(readEstacionamiento());
    window.addEventListener("estacionamiento_changed", onEst);
    return () => window.removeEventListener("estacionamiento_changed", onEst);
  }, []);

  const nombre = estacionamiento?.nombre || estacionamiento?.Nombre || "Mi estacionamiento";
  const direccion = estacionamiento?.direccion || estacionamiento?.Direccion || "";
  const ingresos = data?.detalleIngresos;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-3">
        <h3 className="text-xl font-bold text-ink">No se pudo cargar</h3>
        <p className="text-sm text-ink-muted max-w-md">{error}</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="text-xs font-semibold bg-brand text-brand-foreground px-4 py-2 hover:bg-brand-strong"
        >
          Reintentar
        </button>
        <button type="button" onClick={() => estacionamientoService.entrar(navigate)} className="text-sm font-semibold text-brand">
          Elegir estacionamiento
        </button>
      </div>
    );
  }

  if (loading || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-9 h-9 border-2 border-brand-soft border-t-brand animate-spin" />
        <span className="pk-caption">Cargando estacionamiento…</span>
      </div>
    );
  }

  const deudores = data.alertasDeudores ?? [];
  const adentro = data.estadiasAbiertas ?? [];
  const reservas = data.reservasProximas ?? [];
  const vehiculos = data.distribucionVehiculos ?? [];
  const meses = data.graficoIngresos ?? [];

  return (
    <div className="space-y-5 pb-12 animate-fade-in-up">
      <PageHeader
        title={nombre}
        description={[direccion, fechaLarga()].filter(Boolean).join(" · ")}
        action={
          <PageHeaderAction onClick={() => navigate("/rotativo")}>
            <LogIn size={16} />
            Ingreso rotativo
          </PageHeaderAction>
        }
        stats={[
          {
            label: "Ocupación",
            value: `${data.porcentajeOcupacion ?? 0}%`,
            onClick: () => navigate("/cocheras"),
          },
          {
            label: "Rotativo adentro",
            value: data.rotativosAdentro ?? 0,
            onClick: () => navigate("/rotativo"),
          },
          {
            label: "Abonos",
            value: data.cantidadAbonosActivos ?? 0,
            onClick: () => navigate("/abonos"),
          },
          {
            label: "Pendientes",
            value: pagosPendientes,
            tone: pagosPendientes > 0 ? "danger" : "default",
            onClick: () => navigate("/pagos-pendientes"),
          },
        ]}
      />

      <div className="grid gap-3 w-full max-w-5xl grid-cols-2 lg:grid-cols-4">
        <button type="button" onClick={() => navigate("/cuenta-corriente")} className="text-left px-3 py-3 bg-surface-card hover:bg-surface-muted/60">
          <p className="pk-label">Recaudado hoy</p>
          <p className="text-lg font-black tracking-tight mt-1 tabular-nums text-ink">{plata(ingresos?.recaudadoHoy)}</p>
        </button>
        <button type="button" onClick={() => navigate("/pagos")} className="text-left px-3 py-3 bg-surface-card hover:bg-surface-muted/60">
          <p className="pk-label">Recaudado mes</p>
          <p className="text-lg font-black tracking-tight mt-1 tabular-nums text-ink">{plata(ingresos?.totalRecaudadoMensualReal)}</p>
        </button>
        <button type="button" onClick={() => navigate("/reservas")} className="text-left px-3 py-3 bg-surface-card hover:bg-surface-muted/60">
          <p className="pk-label">Reservas</p>
          <p className="text-lg font-black tracking-tight mt-1 tabular-nums text-ink">{data.reservasVigentes ?? 0}</p>
        </button>
        <button
          type="button"
          onClick={() => navigate("/reservas")}
          className={`text-left px-3 py-3 ${data.reservasConSenaPendiente ? "bg-warning-muted" : "bg-surface-card hover:bg-surface-muted/60"}`}
        >
          <p className={`pk-label ${data.reservasConSenaPendiente ? "text-warning" : ""}`}>Seña pendiente</p>
          <p className={`text-lg font-black tracking-tight mt-1 tabular-nums ${data.reservasConSenaPendiente ? "text-warning-ink" : "text-ink"}`}>
            {data.reservasConSenaPendiente ?? 0}
          </p>
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {ATAJOS.map((a) => (
          <Link key={a.to} to={a.to} className="bg-surface-card px-4 py-3 hover:bg-surface-muted/60">
            <p className="text-sm font-bold text-ink">{a.label}</p>
            <p className="pk-caption mt-0.5">{a.desc}</p>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Bloque
          titulo="Rotativo adentro"
          extra={
            <Link to="/rotativo" className="pk-caption font-semibold text-brand">
              Panel
            </Link>
          }
        >
          {adentro.length === 0 ? (
            <Vacio texto="Nadie adentro ahora." />
          ) : (
            <ul className="divide-y divide-line">
              {adentro.map((e) => (
                <li key={e.estadiaId} className={`px-4 py-2.5 border-l-[3px] ${e.esAbonado ? "border-l-brand" : "border-l-warning"}`}>
                  <div className="flex items-baseline justify-between gap-3">
                    <Patente valor={e.patente} size="sm" />
                    <span className="text-sm font-semibold tabular-nums text-ink">{tiempo(e.minutosTranscurridos)}</span>
                  </div>
                  <p className="pk-caption mt-0.5">
                    {hora(e.horaEntrada)}
                    {e.tipoVehiculoNombre ? ` · ${e.tipoVehiculoNombre}` : ""}
                    {e.zonaNombre ? ` · ${e.zonaNombre}` : ""}
                    {e.esAbonado ? " · Abonado" : ""}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Bloque>

        <Bloque
          titulo="Pagos atrasados"
          extra={
            <Link to="/pagos-pendientes" className="pk-caption font-semibold text-brand">
              Ver todos
            </Link>
          }
        >
          {deudores.length === 0 ? (
            <Vacio texto="Nadie con atraso." />
          ) : (
            <ul className="divide-y divide-line">
              {deudores.slice(0, 8).map((a) => {
                const wa = whatsappUrl(a.clienteTelefono);
                const to = a.reservaId ? `/reservas/${a.reservaId}` : `/pagosAbono/${a.abonoId}`;
                return (
                  <li key={`${a.abonoId}-${a.reservaId || 0}`} className="border-l-[3px] border-l-danger">
                    <Link to={to} className="block px-4 py-2.5 hover:bg-surface-page">
                      <div className="flex items-baseline justify-between gap-3">
                        <span className="font-semibold text-ink truncate">{a.clienteNombre}</span>
                        <span className="text-sm font-semibold tabular-nums text-danger-ink">{plata(a.saldoTotal || a.precioAcordado)}</span>
                      </div>
                      <p className="pk-caption mt-0.5">
                        {a.cocheraNumero ? `Cochera ${a.cocheraNumero}` : "Seña"} · {a.diasAtraso}d
                        {a.periodosAdeudados > 1 ? ` · ${a.periodosAdeudados} períodos` : ""}
                        {wa ? " · WhatsApp" : ""}
                      </p>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </Bloque>
      </div>

      <Bloque
        titulo="Reservas vigentes"
        extra={
          <Link to="/reservas/nueva" className="pk-caption font-semibold text-brand inline-flex items-center gap-1">
            <Plus size={12} /> Nueva
          </Link>
        }
      >
        {reservas.length === 0 ? (
          <Vacio texto="No hay reservas vigentes." />
        ) : (
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm table-fixed">
              <colgroup>
                <col className="w-[28%]" />
                <col className="w-[22%]" />
                <col className="w-[18%]" />
                <col className="w-[32%]" />
              </colgroup>
              <thead>
                <tr className="border-b border-line-strong text-left">
                  <th className="pk-label font-bold pl-4 pr-3 py-2.5">Cliente</th>
                  <th className="pk-label font-bold px-3 py-2.5">Cocheras</th>
                  <th className="pk-label font-bold px-3 py-2.5">Seña</th>
                  <th className="pk-label font-bold px-3 py-2.5">Plazo</th>
                </tr>
              </thead>
              <tbody>
                {reservas.map((r) => (
                  <tr key={r.reservaId} className="border-b border-line hover:bg-surface-page">
                    <td className={`pl-4 pr-3 py-2.5 overflow-hidden border-l-[3px] ${r.senaPendiente ? "border-l-warning" : "border-l-brand"}`}>
                      <Link to={`/reservas/${r.reservaId}`} className="font-semibold text-ink hover:text-brand truncate block">
                        {r.nombre}
                      </Link>
                    </td>
                    <td className="px-3 py-2.5 overflow-hidden text-ink-muted truncate">{r.cocheras || "—"}</td>
                    <td className="px-3 py-2.5 overflow-hidden">
                      <span className={`text-sm font-semibold ${r.senaPendiente ? "text-warning-ink" : "text-ink"}`}>
                        {r.senaPendiente ? "Pendiente" : "OK"}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 overflow-hidden pk-caption">{reservaPlazo(r)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {reservas.length > 0 && (
          <ul className="md:hidden divide-y divide-line">
            {reservas.map((r) => (
              <li key={r.reservaId}>
                <Link
                  to={`/reservas/${r.reservaId}`}
                  className={`block px-4 py-3 border-l-[3px] ${r.senaPendiente ? "border-l-warning" : "border-l-brand"}`}
                >
                  <p className="font-semibold text-ink truncate">{r.nombre}</p>
                  <p className="pk-caption mt-0.5">
                    {r.cocheras || "Sin cochera"} · {reservaPlazo(r)}
                    {r.senaPendiente ? " · Seña pendiente" : ""}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Bloque>

      <Bloque
        titulo="Cocheras"
        extra={
          <Link to="/cocheras" className="pk-caption font-semibold text-brand">
            Ver todas
          </Link>
        }
      >
        <div className="px-4 py-3">
          <CocherasGrid estadoCocheras={data.estadoCocheras ?? []} />
        </div>
      </Bloque>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Bloque titulo="Ingresos (6 meses)" extra={<span className="pk-caption">{plata(ingresos?.totalRecaudadoMensualReal)} este mes</span>}>
          {meses.length === 0 ? (
            <Vacio texto="Todavía no hay cobros." />
          ) : (
            <Barras items={meses} valorDe={(d) => d.monto} labelDe={(d) => d.mes} />
          )}
          <p className="px-4 pb-3 pk-caption">
            Abonos {plata(ingresos?.recaudadoAbonosMes)} · Estadías {plata(ingresos?.recaudadoEstadiasMes)}
          </p>
        </Bloque>

        <Bloque titulo="Vehículos en abono">
          {vehiculos.length === 0 ? (
            <Vacio texto="Sin vehículos en abonos activos." />
          ) : (
            <div className="px-4 py-3 space-y-2">
              {vehiculos.map((v) => (
                <div key={v.tipoVehiculo} className="flex items-center gap-3">
                  <span className="w-28 pk-caption font-semibold truncate">{v.tipoVehiculo}</span>
                  <div className="flex-1 h-5 bg-surface-muted">
                    <div className="h-full bg-brand" style={{ width: `${Math.min(100, Number(v.porcentaje) || 0)}%` }} />
                  </div>
                  <span className="w-16 text-right text-sm font-semibold tabular-nums">
                    {v.cantidad} · {v.porcentaje}%
                  </span>
                </div>
              ))}
            </div>
          )}
        </Bloque>
      </div>

      <p className="pk-caption flex items-center gap-1.5">
        <Clock size={12} />
        Entradas de rotativo hoy: {data.entradasRotativoHoy ?? 0}
        <span className="text-ink-faint">·</span>
        <CreditCard size={12} />
        Proyección de abonos {plata(ingresos?.totalEstimadoProyeccion)}
      </p>
    </div>
  );
}
