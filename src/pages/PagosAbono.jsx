import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Car, Calendar, User, Check, AlertCircle, Loader2, Pencil, Plus, TrendingUp, TrendingDown, Ban, Wallet } from "lucide-react"; // Sumamos Wallet para la UI
import { abonoService } from "../services/abonoService";
import { pagoMensualService } from "../services/pagoMensualService";
import { cajaMensualService } from "../services/cajaMensualService";
import ModalRegistrarPago from "../components/layout/ModalRegistrarPago";
import ModalEditarAbono from "../components/layout/ModalEditarAbono";
import ModalCargoReintegro from "../components/layout/ModalCargoReintegro";

function parseLocal(fechaInput) {
  if (!fechaInput) return null;
  if (fechaInput instanceof Date) return fechaInput;
  const soloFecha = String(fechaInput).split('T')[0];
  const [y, m, d] = soloFecha.split('-').map(Number);
  return new Date(y, m - 1, d || 1);
}

function formatFecha(fecha) {
  const d = parseLocal(fecha);
  return d ? d.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" }) : "-";
}

function formatMes(fecha) {
  const d = parseLocal(fecha);
  return d ? d.toLocaleDateString("es-AR", { month: "long", year: "numeric" }) : "-";
}

function keyMes(fecha) {
  const d = parseLocal(fecha);
  return d ? `${d.getFullYear()}-${d.getMonth()}` : "";
}

function generarMesesRangoConLimite(fechaInicio, limite) {
  const inicio = parseLocal(fechaInicio);
  if (!inicio || !limite) return [];
  
  const meses = [];
  let cursor = new Date(inicio.getFullYear(), inicio.getMonth(), 1);
  
  while (cursor <= limite) {
    meses.push(new Date(cursor));
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return meses;
}

function formatPrecio(precio) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(precio || 0);
}

const TABS = [
  { id: "pagos",     label: "Pagos mensuales" },
  { id: "cargos",    label: "Cargos y reintegros" },
];

export default function PagosAbono() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tab, setTab] = useState("pagos");
  const [abono, setAbono] = useState(null);
  const [pagos, setPagos] = useState([]);
  const [movimientos, setMovimientos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalPago, setModalPago] = useState(null);
  const [modalEditar, setModalEditar] = useState(false);
  const [modalCargo, setModalCargo] = useState(false);

  useEffect(() => { cargarDatos(); }, [id]);

  async function cargarDatos() {
    try {
      setLoading(true);
      const [abonos, pagosData, movsData] = await Promise.all([
        abonoService.getAllAbonos(),
        pagoMensualService.getByAbono(id),
        cajaMensualService.getMovimientosByAbono(id),
      ]);
      const encontrado = abonos.find(a => a.abonoCocheraId === Number(id));
      if (!encontrado) throw new Error("Abono no encontrado");
      setAbono(encontrado);
      setPagos(pagosData);
      setMovimientos(movsData); 
    } catch (err) {
      setError(err.message || "Error al cargar datos");
    } finally {
      setLoading(false);
    }
  }

  const pagosMap = {};
  pagos.forEach(p => { pagosMap[keyMes(p.mes)] = p; });

  // --- LÓGICA DE RANGO DINÁMICO INFINITO PARA ADELANTOS ---
  const hoy = new Date();
  let fechaLimite = new Date(hoy.getFullYear(), hoy.getMonth(), 1);

  const fechasPagos = pagos.map(p => parseLocal(p.mes)).filter(Boolean);
  const pagoMasLejano = fechasPagos.length > 0 ? new Date(Math.max(...fechasPagos)) : null;

  if (pagoMasLejano && pagoMasLejano > fechaLimite) {
    fechaLimite = new Date(pagoMasLejano.getFullYear(), pagoMasLejano.getMonth() + 1, 1);
  } else {
    fechaLimite.setMonth(fechaLimite.getMonth() + 1);
  }

  // ========================================================
  // CAMBIO CLAVE: Cambiamos abono.fechaInicio por abono.fechaInicioCobro
  // Si tu backend devuelve snake_case, recordá usar abono.fecha_inicio_cobro.
  // ========================================================
  const fechaInicioRango = abono?.fechaInicioCobro || abono?.fechaInicio;
  const mesesRango = abono ? generarMesesRangoConLimite(fechaInicioRango, fechaLimite) : [];
  // --------------------------------------------------------

  const limiteHoy = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  const deuda = mesesRango.filter(m => m <= limiteHoy && !pagosMap[keyMes(m)]).length;
  
  const totalRecaudado = pagos.reduce((acc, p) => acc + p.monto + (p.recargo || 0), 0);

  const totalCargos     = movimientos.filter(m => m.tipoConcepto === 2).reduce((acc, m) => acc + m.monto, 0);
  const totalReintegros = movimientos.filter(m => m.tipoConcepto === 1).reduce((acc, m) => acc + m.monto, 0);
  const balance         = totalCargos - totalReintegros;

  if (loading) return <div className="flex items-center gap-2 text-gray-400 text-sm p-8"><Loader2 size={16} className="animate-spin" /> Cargando...</div>;
  if (error)   return <div className="flex items-center gap-2 text-red-500 text-sm p-8"><AlertCircle size={16} /> {error}</div>;

  const esActivo = abono.activo === true || abono.activo === "true";

  return (
    <div>
      <button onClick={() => navigate("/abonos")} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-6 transition-colors">
        <ArrowLeft size={16} /> Volver a abonos
      </button>

      {!esActivo && (
        <div className="mb-4 flex items-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 text-sm rounded-lg border border-gray-200 font-medium">
          <Ban size={16} className="text-gray-500" />
          <span>Este abono se encuentra <strong>Inactivo / Dado de baja</strong>. No se pueden registrar nuevos movimientos.</span>
        </div>
      )}

      {/* Card resumen */}
      <div className={`bg-white rounded-xl border p-5 mb-6 ${!esActivo ? "border-gray-200 bg-gray-50/30" : "border-gray-100"}`}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className={`text-2xl font-bold ${esActivo ? "text-indigo-700" : "text-gray-500 line-through"}`}>
                Cochera {abono.cochera?.numero}
              </span>
              {abono.cochera?.categoriaCochera?.nombre && (
                <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{abono.cochera.categoriaCochera.nombre}</span>
              )}
              
              {esActivo ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-100">
                  Activo
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-100">
                  De baja
                </span>
              )}

              {esActivo && (
                <button onClick={() => setModalEditar(true)} title="Editar abono" className="p-1.5 rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors">
                  <Pencil size={14} />
                </button>
              )}
            </div>
            
            {deuda > 0 && esActivo && (
              <div className="flex items-center gap-1.5 mt-1.5 text-red-500 text-sm">
                <AlertCircle size={14} />
                <span>{deuda} {deuda === 1 ? "mes sin pagar" : "meses sin pagar"}</span>
              </div>
            )}
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400">Total cobrado</p>
            <p className="text-xl font-bold text-gray-900">{formatPrecio(totalRecaudado)}</p>
            <p className="text-xs text-gray-400">{pagos.length} {pagos.length === 1 ? "pago" : "pagos"}</p>
          </div>
        </div>

        {/* Agregamos el campo nuevo al grid informativo */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 pt-4 border-t border-gray-100">
          <div className="flex items-start gap-2">
            <User size={14} className="text-gray-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs text-gray-400">Cliente</p>
              <p className={`text-sm font-medium ${esActivo ? "text-gray-800" : "text-gray-500"}`}>{abono.cliente?.nombre}</p>
              {abono.cliente?.telefono && <p className="text-xs text-gray-400">{abono.cliente.telefono}</p>}
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Car size={14} className="text-gray-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs text-gray-400">Vehículo</p>
              <p className="text-sm font-medium text-gray-800">{abono.tipoVehiculo?.nombre}</p>
              {abono.modeloVehiculo && <p className="text-xs text-gray-400">{abono.modeloVehiculo}</p>}
              {abono.patente && <span className="font-mono text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded mt-0.5 inline-block">{abono.patente}</span>}
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Calendar size={14} className="text-gray-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs text-gray-400">Ingreso Físico</p>
              <p className="text-sm font-medium text-gray-800">{formatFecha(abono.fechaInicio)}</p>
            </div>
          </div>
          
          {/* NUEVO CAMPO RENDERIZADO EN CARD SUPERIOR */}
          <div className="flex items-start gap-2">
            <Wallet size={14} className="text-indigo-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs text-indigo-500 font-medium">Inicio de Cobro</p>
              <p className="text-sm font-semibold text-gray-800">
                {abono.fechaInicioCobro ? formatFecha(abono.fechaInicioCobro) : formatFecha(abono.fechaInicio)}
              </p>
            </div>
          </div>

          <div>
            <p className="text-xs text-gray-400">Precio acordado</p>
            <p className="text-sm font-medium text-gray-800">{abono.precioAcordado ? formatPrecio(abono.precioAcordado) : "Tarifa de lista"}</p>
            {abono.cobrador && <p className="text-xs text-gray-400 mt-0.5">Cobrador: {abono.cobrador}</p>}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-5">
        {TABS.map(({ id: tid, label }) => (
          <button
            key={tid}
            onClick={() => setTab(tid)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === tid ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tab: Pagos mensuales */}
      {tab === "pagos" && (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-800">Historial de pagos</h2>
            <p className="text-xs text-gray-400 mt-0.5">{mesesRango.length} {mesesRango.length === 1 ? "mes" : "meses"} contables en total</p>
          </div>
          <div className="divide-y divide-gray-50">
            {mesesRango.map(mesItem => {
              const pago = pagosMap[keyMes(mesItem)];
              const esFuturo = mesItem > new Date();
              const mostrarAlertaPago = !pago && !esFuturo && esActivo;

              return (
                <div key={keyMes(mesItem)} className={`flex items-center justify-between px-5 py-3.5 ${mostrarAlertaPago ? "bg-red-50/50" : ""}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${pago ? "bg-green-400" : esFuturo ? "bg-gray-200" : esActivo ? "bg-red-400" : "bg-gray-300"}`} />
                    <div>
                      <div className="flex items-center gap-2">
                        <p className={`text-sm font-medium capitalize ${mostrarAlertaPago ? "text-red-700" : "text-gray-800"}`}>{formatMes(mesItem)}</p>
                        {esFuturo && pago && <span className="text-xs bg-indigo-50 text-indigo-500 px-1.5 py-0.5 rounded-full">adelantado</span>}
                      </div>
                      {pago && (
                        <p className="text-xs text-gray-400">
                          {formatFecha(pago.fechaHoraCarga)}
                          {pago.responsable && ` · ${pago.responsable}`}
                          {pago.observacion && ` · ${pago.observacion}`}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {pago ? (
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-800">{formatPrecio(pago.monto)}</p>
                        {pago.recargo > 0 && <p className="text-xs text-amber-600">+ {formatPrecio(pago.recargo)} recargo</p>}
                      </div>
                    ) : (
                      esActivo ? (
                        <button onClick={() => setModalPago(mesItem)} className="text-xs text-red-600 border border-red-200 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors font-medium">
                          Registrar pago
                        </button>
                      ) : (
                        <span className="text-xs text-gray-400 italic">No disponible</span>
                      )
                    )}
                    {pago && <div className="flex items-center justify-center w-6 h-6 bg-green-100 rounded-full"><Check size={12} className="text-green-600" /></div>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab: Cargos y reintegros */}
      {tab === "cargos" && (
        <div>
          <div className="grid grid-cols-3 gap-3 mb-5">
            <div className="bg-white rounded-xl border border-gray-100 px-4 py-3">
              <div className="flex items-center gap-2 mb-1"><TrendingUp size={13} className="text-red-400" /><p className="text-xs text-gray-400">Cargos</p></div>
              <p className="text-xl font-semibold text-red-500">{formatPrecio(totalCargos)}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 px-4 py-3">
              <div className="flex items-center gap-2 mb-1"><TrendingDown size={13} className="text-green-500" /><p className="text-xs text-gray-400">Reintegros</p></div>
              <p className="text-xl font-semibold text-green-600">{formatPrecio(totalReintegros)}</p>
            </div>
            <div className={`rounded-xl border px-4 py-3 ${balance > 0 ? "bg-red-50 border-red-100" : balance < 0 ? "bg-green-50 border-green-100" : "bg-white border-gray-100"}`}>
              <p className="text-xs text-gray-400 mb-1">Balance</p>
              <p className={`text-xl font-semibold ${balance > 0 ? "text-red-500" : balance < 0 ? "text-green-600" : "text-gray-400"}`}>
                {balance > 0 ? "+" : ""}{formatPrecio(balance)}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div>
                <h2 className="text-sm font-semibold text-gray-800">Cargos y reintegros</h2>
                <p className="text-xs text-gray-400 mt-0.5">{movimientos.length} movimientos</p>
              </div>
              
              {esActivo && (
                <button
                  onClick={() => setModalCargo(true)}
                  className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium px-3 py-2 rounded-lg transition-colors"
                >
                  <Plus size={13} /> Agregar
                </button>
              )}
            </div>

            {movimientos.length === 0 ? (
              <div className="py-10 text-center text-sm text-gray-400">Sin movimientos</div>
            ) : (
              <div className="divide-y divide-gray-50">
                {movimientos.map(mov => (
                  <div key={mov.movimientoCajaId} className="flex items-center justify-between px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full shrink-0 ${mov.tipoConcepto === 2 ? "bg-red-400" : "bg-green-400"}`} />
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-gray-800">{mov.descripcion}</p>
                          <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                            mov.tipoConcepto === 2 ? "bg-red-50 text-red-500" : "bg-green-50 text-green-600"
                          }`}>
                            {mov.tipoConceptoDescripcion}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400">
                          {new Date(mov.fechaHora).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                          {mov.responsable && ` · ${mov.responsable}`}
                        </p>
                      </div>
                    </div>
                    <p className={`text-sm font-medium ${mov.tipoConcepto === 2 ? "text-red-500" : "text-green-600"}`}>
                      {mov.tipoConcepto === 2 ? "+" : "-"}{formatPrecio(mov.monto)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {modalPago && (
        <ModalRegistrarPago abono={abono} mesPreseleccionado={modalPago} onClose={() => setModalPago(null)} onRegistrado={() => { setModalPago(null); cargarDatos(); }} />
      )}
      {modalEditar && (
        <ModalEditarAbono abono={abono} onClose={() => setModalEditar(false)} onGuardado={() => { setModalEditar(false); cargarDatos(); }} />
      )}
      {modalCargo && (
        <ModalCargoReintegro abono={abono} onClose={() => setModalCargo(false)} onGuardado={() => { setModalCargo(false); cargarDatos(); }} />
      )}
    </div>
  );
}