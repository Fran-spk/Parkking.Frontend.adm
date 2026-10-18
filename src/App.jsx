import { BrowserRouter, Routes, Route, Navigate, useParams } from "react-router-dom";
import Layout from "./components/layout/Layout";
import Dashboard from "./pages/Dashboard";
import Cocheras from "./pages/Cocheras";
import CocheraDetalle from "./pages/CocheraDetalle";
import Clientes from "./pages/Clientes";
import NuevoCliente from "./pages/NuevoCliente";
import Abonos from "./pages/Abonos";
import Reservas from "./pages/Reservas";
import ReservaForm from "./pages/ReservaForm";
import ReservaDetalle from "./pages/ReservaDetalle";
import NuevoAbono from "./pages/NuevoAbono";
import Pagos from "./pages/Pagos";
import CuentaCorriente from "./pages/CuentaCorriente";
import CuentaCorrienteCliente from "./pages/CuentaCorrienteCliente";
import Movimientos from "./pages/Movimientos";
import NuevoAjuste from "./pages/NuevoAjuste";
import NuevoGasto from "./pages/NuevoGasto";
import MovimientoDetalle from "./pages/MovimientoDetalle";
import PagosPendientes from "./pages/PagosPendientes";
import BuscarPatente from "./pages/BuscarPatente";
import Rotativo from "./pages/Rotativo";
import RotativoHistorico from "./pages/RotativoHistorico";
import Recibos from "./pages/Recibos";
import Reportes from "./pages/reportes/Reportes";
import MensajesEnviados from "./pages/MensajesEnviados";
import PerfilConfig from "./pages/configuracion/Perfil";
import GeneralConfig from "./pages/configuracion/General";
import TarifasConfig from "./pages/configuracion/Tarifas";
import ZonasConfig from "./pages/configuracion/ZonasConfig";
import Catalogos from "./pages/configuracion/Catalogos";
import FinanzasConfig from "./pages/configuracion/FinanzasConfig";
import Accesos from "./pages/configuracion/Accesos";
import PagosAbono from "./pages/PagosAbono";
import CargoAbono from "./pages/CargoAbono";
import ReintegroAbono from "./pages/ReintegroAbono";
import Login from "./pages/Login";
import SeleccionEstacionamientos from "./pages/SeleccionEstacionamientos";
import AuthGuard from "./components/layout/AuthGuard";
import PlayaLayout from "./components/layout/PlayaLayout";

function RedirectGrupoACcte() {
  const { id } = useParams();
  return <Navigate to={`/cuenta-corriente?grupo=${id}`} replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route path="/seleccion-estacionamientos" element={<AuthGuard><SeleccionEstacionamientos /></AuthGuard>} />

        <Route path="/playa" element={<AuthGuard><PlayaLayout /></AuthGuard>}>
          <Route index element={<Rotativo />} />
          <Route path="buscar" element={<BuscarPatente />} />
          <Route path="cobrar" element={<PagosPendientes />} />
        </Route>

        <Route path="/" element={<AuthGuard><Layout /></AuthGuard>}>
          <Route index element={<Navigate to="/mi-estacionamiento" replace />} />
          <Route path="mi-estacionamiento" element={<Dashboard />} />
          <Route path="dashboard" element={<Navigate to="/mi-estacionamiento" replace />} />
          <Route path="cocheras" element={<Cocheras />} />
          <Route path="cocheras/:cocheraId" element={<CocheraDetalle />} />
          <Route path="clientes" element={<Clientes />} />
          <Route path="clientes/nuevo" element={<NuevoCliente />} />
          <Route path="clientes/:clienteId/editar" element={<NuevoCliente />} />
          <Route path="clientes/:clienteId/cuenta-corriente" element={<CuentaCorrienteCliente />} />
          <Route path="pagos-pendientes" element={<PagosPendientes />} />
          <Route path="deudores" element={<Navigate to="/pagos-pendientes" replace />} />
          <Route path="buscar-patente" element={<BuscarPatente />} />
          <Route path="rotativo" element={<Rotativo />} />
          <Route path="rotativo/historico" element={<RotativoHistorico />} />
          <Route path="abonos" element={<Abonos />} />
          <Route path="abonos/nuevo" element={<NuevoAbono />} />
          <Route path="reservas" element={<Reservas />} />
          <Route path="reservas/nueva" element={<ReservaForm />} />
          <Route path="reservas/:id" element={<ReservaDetalle />} />
          <Route path="reservas/:id/editar" element={<ReservaForm />} />
          <Route path="pagos" element={<Pagos />} />
          <Route path="cuenta-corriente" element={<CuentaCorriente />} />
          <Route path="movimientos" element={<Movimientos />} />
          <Route path="ajustes" element={<NuevoAjuste />} />
          <Route path="gastos" element={<NuevoGasto />} />
          <Route path="ajustes-gastos" element={<Navigate to="/ajustes" replace />} />
          <Route path="grupos-financieros" element={<Navigate to="/configuracion/finanzas" replace />} />
          <Route path="grupos-financieros/:id" element={<RedirectGrupoACcte />} />
          <Route path="movimientos/:id" element={<MovimientoDetalle />} />
          <Route path="caja" element={<Navigate to="/cuenta-corriente" replace />} />
          <Route path="recibos" element={<Recibos />} />
          <Route path="reportes" element={<Reportes />} />
          <Route path="mensajes-enviados" element={<MensajesEnviados />} />
          <Route path="reportes/ingresos" element={<Navigate to="/reportes" replace />} />
          <Route path="reportes/ocupacion" element={<Navigate to="/reportes" replace />} />
          <Route path="configuracion">
            <Route index element={<Navigate to="perfil" replace />} />
            <Route path="perfil" element={<PerfilConfig />} />
            <Route path="general" element={<GeneralConfig />} />
            <Route path="tarifas" element={<TarifasConfig />} />
            <Route path="zonas" element={<ZonasConfig />} />
            <Route path="catalogos" element={<Catalogos />} />
            <Route path="finanzas" element={<FinanzasConfig />} />
            <Route path="accesos" element={<Accesos />} />
            <Route path="categorias" element={<Navigate to="/configuracion/catalogos?tab=categorias" replace />} />
            <Route path="tipos-vehiculo" element={<Navigate to="/configuracion/catalogos?tab=tipos" replace />} />
            <Route path="metodos-pago" element={<Navigate to="/configuracion/catalogos?tab=metodos" replace />} />
            <Route path="tarifas-estadia" element={<Navigate to="/configuracion/tarifas?tab=estadias" replace />} />
            <Route path="reservas" element={<Navigate to="/configuracion/general?tab=reservas" replace />} />
            <Route path="tipos-gasto" element={<Navigate to="/configuracion/finanzas?tab=gastos" replace />} />
            <Route path="grupos-financieros" element={<Navigate to="/configuracion/finanzas" replace />} />
            <Route path="reglas-asignacion" element={<Navigate to="/configuracion/finanzas?tab=reglas" replace />} />
            <Route path="grupos" element={<Navigate to="/configuracion/accesos" replace />} />
            <Route path="usuarios" element={<Navigate to="/configuracion/accesos?tab=usuarios" replace />} />
          </Route>
          <Route path="pagosAbono/:id" element={<PagosAbono />} />
          <Route path="pagosAbono/:id/cargo" element={<CargoAbono />} />
          <Route path="pagosAbono/:id/reintegro" element={<ReintegroAbono />} />
        </Route>

        <Route path="*" element={<Navigate to="/mi-estacionamiento" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
