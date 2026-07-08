import { useState } from "react";
import "react-datepicker/dist/react-datepicker.css";
import { cajaMensualService } from "../../../services/cajaMensualService";
import { useCajaResumen } from "../hooks/useCajaResumen";
import { useReporteMovimientos } from "../hooks/useReporteMovimientos";
import { useCajaConceptos } from "../hooks/useCajaConceptos";
import SelectorMes from "../components/SelectorMes";
import ResumenCaja from "../components/ResumenCaja";
import AccionesCaja from "../components/AccionesCaja";
import ModalGasto from "../components/ModalGasto";
import CajaTabs from "../components/CajaTabs";
import TablaMovimientos from "../components/TablaMovimientos";
import TablaConceptos from "../components/TablaConceptos";
import TablaAuditoria from "../components/TablaAuditoria";

export default function CajaPage() {
  const [mes, setMes] = useState(new Date());
  const [activeTab, setActiveTab] = useState("movimientos");
  const [tipoFiltro, setTipoFiltro] = useState(null);
  const [desde, setDesde] = useState(null);
  const [hasta, setHasta] = useState(null);
  const [modalGasto, setModalGasto] = useState(false);
  const [cerrando, setCerrando] = useState(false);

  const {
    resumen,
    loading: loadingResumen,
    error,
    sinCaja,
    setError,
    recargar: recargarResumen,
  } = useCajaResumen(mes);

  const tieneCaja = !!resumen && !sinCaja;
  const hasFiltroFecha = !!(desde || hasta);

  const {
    movimientos: movimientosMes,
    loading: loadingMovimientosMes,
    recargar: recargarMovimientosMes,
  } = useReporteMovimientos(mes, null, null, tieneCaja);

  const {
    movimientos: movimientosFiltrados,
    loading: loadingMovimientosFiltrados,
    recargar: recargarMovimientosFiltrados,
  } = useReporteMovimientos(mes, desde, hasta, tieneCaja && hasFiltroFecha);

  const movimientos = hasFiltroFecha ? movimientosFiltrados : movimientosMes;
  const loadingMovimientos = hasFiltroFecha ? loadingMovimientosFiltrados : loadingMovimientosMes;

  const {
    conceptos,
    loading: loadingConceptos,
    recargar: recargarConceptos,
  } = useCajaConceptos(mes, tieneCaja);

  function handleMesChange(nuevoMes) {
    setMes(nuevoMes);
    setTipoFiltro(null);
    setDesde(null);
    setHasta(null);
  }

  function recargarTodo() {
    recargarResumen();
    recargarMovimientosMes();
    if (hasFiltroFecha) recargarMovimientosFiltrados();
    recargarConceptos();
  }

  async function handleCerrar() {
    if (!confirm("¿Cerrar la caja de este mes? No se podrán agregar más movimientos.")) return;
    try {
      setCerrando(true);
      await cajaMensualService.cerrar(mes.getFullYear(), mes.getMonth() + 1);
      recargarTodo();
    } catch (e) {
      const msg = e.response?.data;
      setError(typeof msg === "string" ? msg : "No se pudo cerrar la caja");
    } finally {
      setCerrando(false);
    }
  }

  const cantidadIngresos = movimientosMes.filter(m => m.tipo === 0).length;
  const cantidadGastos = movimientosMes.filter(m => m.tipo === 1).length;

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Caja</h1>
          <p className="text-sm text-gray-400 mt-0.5">Movimientos mensuales</p>
        </div>
        <SelectorMes mes={mes} onChange={handleMesChange} />
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
          {error}
        </div>
      )}

      {loadingResumen ? (
        <div className="text-sm text-gray-400">Cargando...</div>
      ) : sinCaja ? (
        <div className="bg-white rounded-xl border border-gray-100 p-10 text-center">
          <p className="text-sm text-gray-400">No hay caja para este mes</p>
          <p className="text-xs text-gray-300 mt-1">
            Se crea automáticamente al registrar el primer pago
          </p>
        </div>
      ) : (
        <>
          <ResumenCaja
            resumen={resumen}
            tipoFiltro={tipoFiltro}
            onTipoFiltroChange={setTipoFiltro}
            cantidadIngresos={cantidadIngresos}
            cantidadGastos={cantidadGastos}
          />

          {!resumen.cerrada && (
            <AccionesCaja
              onAgregarGasto={() => setModalGasto(true)}
              onCerrar={handleCerrar}
              cerrando={cerrando}
            />
          )}

          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <CajaTabs activeTab={activeTab} onChange={setActiveTab} />

            <div className="p-0">
              {activeTab === "movimientos" && (
                <TablaMovimientos
                  movimientos={movimientos}
                  loading={loadingMovimientos}
                  tipoFiltro={tipoFiltro}
                  desde={desde}
                  hasta={hasta}
                  onDesdeChange={setDesde}
                  onHastaChange={setHasta}
                />
              )}
              {activeTab === "conceptos" && (
                <TablaConceptos conceptos={conceptos} loading={loadingConceptos} />
              )}
              {activeTab === "auditoria" && (
                <TablaAuditoria
                  movimientos={movimientos}
                  loading={loadingMovimientos}
                  desde={desde}
                  hasta={hasta}
                  onDesdeChange={setDesde}
                  onHastaChange={setHasta}
                />
              )}
            </div>
          </div>
        </>
      )}

      {modalGasto && (
        <ModalGasto
          onClose={() => setModalGasto(false)}
          onGuardado={recargarTodo}
        />
      )}
    </div>
  );
}
