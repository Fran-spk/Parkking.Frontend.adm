import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  AlertTriangle,
  CreditCard,
  Phone,
  Loader2,
  ExternalLink,
  Clock,
} from "lucide-react";
import { pagoService } from "../services/pagoService";
import { abonoService } from "../services/abonoService";
import ModalRegistrarPago from "../components/layout/ModalRegistrarPago";

function formatPrecio(precio) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(Number(precio) || 0);
}

function samePeriodo(a, b) {
  if (!a || !b) return false;
  return String(a).split("T")[0] === String(b).split("T")[0];
}

const FILTROS = [
  { id: "todos", label: "Todos" },
  { id: "vencidos", label: "Con atraso" },
  { id: "parcial", label: "Parciales" },
  { id: "pendiente", label: "Sin pagar" },
];

export default function PagosPendientes() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busqueda, setBusqueda] = useState("");
  const [filtro, setFiltro] = useState("todos");
  const [modalPago, setModalPago] = useState(null);
  const [abriendoCobroId, setAbriendoCobroId] = useState(null);

  useEffect(() => {
    cargar();
  }, []);

  async function cargar() {
    try {
      setLoading(true);
      setError(null);
      const data = await pagoService.getPendientes();
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      const msg = err.response?.data;
      setError(typeof msg === "string" ? msg : "No se pudieron cargar las deudas");
    } finally {
      setLoading(false);
    }
  }

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return items.filter((d) => {
      if (filtro === "vencidos" && !(d.diasAtraso > 0)) return false;
      if (filtro === "parcial" && !(d.estado === 1 || Number(d.montoPagado) > 0)) return false;
      if (filtro === "pendiente" && (d.estado === 1 || Number(d.montoPagado) > 0)) return false;
      if (!q) return true;
      return (
        String(d.clienteNombre || "").toLowerCase().includes(q) ||
        String(d.cocherasLabel || "").toLowerCase().includes(q) ||
        String(d.patentesLabel || "").toLowerCase().includes(q) ||
        String(d.periodoLabel || "").toLowerCase().includes(q) ||
        String(d.clienteTelefono || "").includes(q)
      );
    });
  }, [items, busqueda, filtro]);

  const totalSaldo = filtrados.reduce((acc, d) => acc + Number(d.saldo || 0), 0);
  const abonosUnicos = new Set(filtrados.map((d) => d.abonoId)).size;

  /** Mismo panel y mismos datos que el cobro desde el detalle del abono. */
  async function abrirCobro(deuda) {
    const busyKey = `${deuda.abonoId}-${deuda.periodoInicio}`;
    try {
      setAbriendoCobroId(busyKey);
      setError(null);

      // Misma fuente que PagosAbono: abono completo + timeline de cuotas
      const [abono, cuotas] = await Promise.all([
        abonoService.getById(deuda.abonoId),
        pagoService.getCuotas(deuda.abonoId),
      ]);

      const cuotasCobrables = (Array.isArray(cuotas) ? cuotas : []).filter(
        (c) => !c.esFuturo && Number(c.saldo) > 0 && c.estado !== 2
      );

      const cuota =
        cuotasCobrables.find((c) => deuda.cuotaId && c.cuotaId === deuda.cuotaId) ||
        cuotasCobrables.find((c) => samePeriodo(c.periodoInicio, deuda.periodoInicio)) ||
        {
          cuotaId: deuda.cuotaId,
          periodoInicio: deuda.periodoInicio,
          periodoFin: deuda.periodoFin,
          periodoLabel: deuda.periodoLabel,
          saldo: deuda.saldo,
          monto: deuda.monto,
          montoPagado: deuda.montoPagado,
          estado: deuda.estado,
          esFuturo: false,
        };

      setModalPago({
        abono,
        cuota,
        cuotas: null,
        cuotasPendientes: cuotasCobrables.length ? cuotasCobrables : [cuota],
      });
    } catch (err) {
      const msg = err.response?.data;
      setError(typeof msg === "string" ? msg : "No se pudo abrir el cobro");
    } finally {
      setAbriendoCobroId(null);
    }
  }

  return (
    <div className="space-y-5 animate-fade-in-up">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Pagos pendientes</h1>
          <p className="text-sm text-gray-500 mt-1">
            Todas las cuotas con saldo: cobrá una o entrá al abono para combinar varias.
          </p>
        </div>
        {!loading && (
          <div className="flex gap-3">
            <div className="bg-white border border-gray-100 rounded-xl px-4 py-2.5 min-w-[110px]">
              <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Deudas</p>
              <p className="text-lg font-semibold text-gray-900">{filtrados.length}</p>
            </div>
            <div className="bg-white border border-gray-100 rounded-xl px-4 py-2.5 min-w-[110px]">
              <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Abonos</p>
              <p className="text-lg font-semibold text-gray-900">{abonosUnicos}</p>
            </div>
            <div className="bg-rose-50 border border-rose-100 rounded-xl px-4 py-2.5 min-w-[130px]">
              <p className="text-[10px] uppercase tracking-wider text-rose-400 font-bold">A cobrar</p>
              <p className="text-lg font-semibold text-rose-700">{formatPrecio(totalSaldo)}</p>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-50 flex items-center gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Cliente, cochera, patente, período…"
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:border-indigo-400 focus:bg-white"
            />
          </div>
          <div className="flex gap-1 flex-wrap">
            {FILTROS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFiltro(f.id)}
                className={`px-2.5 py-1.5 rounded-full text-[11px] font-semibold border transition-colors ${
                  filtro === f.id
                    ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                    : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-gray-400 text-sm p-8">
            <Loader2 size={16} className="animate-spin" /> Cargando deudas...
          </div>
        ) : error ? (
          <div className="flex items-center gap-2 text-red-600 text-sm p-8">
            <AlertTriangle size={16} /> {error}
          </div>
        ) : filtrados.length === 0 ? (
          <div className="py-14 text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Clock size={20} />
            </div>
            <p className="text-sm font-semibold text-gray-800">Sin deudas pendientes</p>
            <p className="text-xs text-gray-400 mt-1">No hay cuotas con saldo para este filtro.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-wider text-gray-400 border-b border-gray-50">
                  <th className="px-4 py-3 font-bold">Cliente</th>
                  <th className="px-4 py-3 font-bold">Cochera / Patente</th>
                  <th className="px-4 py-3 font-bold">Período</th>
                  <th className="px-4 py-3 font-bold">Estado</th>
                  <th className="px-4 py-3 font-bold text-right">Saldo</th>
                  <th className="px-4 py-3 font-bold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtrados.map((d) => {
                  const key = `${d.abonoId}-${d.periodoInicio}-${d.cuotaId ?? "x"}`;
                  const parcial = d.estado === 1 || Number(d.montoPagado) > 0;
                  return (
                    <tr key={key} className="border-b border-gray-50 last:border-0 hover:bg-slate-50/60">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-gray-900">{d.clienteNombre}</p>
                        {d.clienteTelefono && (
                          <a
                            href={`https://wa.me/${String(d.clienteTelefono).replace(/\D/g, "")}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] text-emerald-600 font-semibold mt-0.5"
                          >
                            <Phone size={11} /> WhatsApp
                          </a>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        <div>{d.cocherasLabel || "—"}</div>
                        {d.patentesLabel && (
                          <div className="text-xs font-mono text-gray-400">{d.patentesLabel}</div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-800 capitalize">{d.periodoLabel}</p>
                        {d.diasAtraso > 0 && (
                          <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-bold text-rose-600 bg-rose-50 border border-rose-100 px-1.5 py-0.5 rounded-md">
                            <AlertTriangle size={10} />
                            {d.diasAtraso} días
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {parcial ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-100">
                            Parcial
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-100">
                            Pendiente
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-900">
                        {formatPrecio(d.saldo)}
                        {parcial && (
                          <p className="text-[10px] font-normal text-gray-400">
                            de {formatPrecio(d.monto)}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            title="Cobrar"
                            disabled={abriendoCobroId === `${d.abonoId}-${d.periodoInicio}`}
                            onClick={() => abrirCobro(d)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-600 hover:text-white transition-colors disabled:opacity-50"
                          >
                            {abriendoCobroId === `${d.abonoId}-${d.periodoInicio}` ? (
                              <Loader2 size={13} className="animate-spin" />
                            ) : (
                              <CreditCard size={13} />
                            )}{" "}
                            Cobrar
                          </button>
                          <button
                            type="button"
                            title="Ver abono"
                            onClick={() => navigate(`/pagosAbono/${d.abonoId}`)}
                            className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100"
                          >
                            <ExternalLink size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalPago && (
        <ModalRegistrarPago
          abono={modalPago.abono}
          cuota={modalPago.cuota || null}
          cuotas={modalPago.cuotas || null}
          cuotasPendientes={modalPago.cuotasPendientes || []}
          onClose={() => setModalPago(null)}
          onRegistrado={() => {
            setModalPago(null);
            cargar();
          }}
        />
      )}
    </div>
  );
}
