import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/layout/Layout";
import Dashboard from "./pages/Dashboard";
import Cocheras from "./pages/Cocheras";
import Clientes from "./pages/Clientes";
import NuevoCliente from "./pages/NuevoCliente";
import Abonos from "./pages/Abonos";
import NuevoAbono from "./pages/NuevoAbono";
import Pagos from "./pages/Pagos";
import CuentaCorriente from "./pages/CuentaCorriente";
import CuentaCorrienteCliente from "./pages/CuentaCorrienteCliente";
import Movimientos from "./pages/Movimientos";
import NuevoAjuste from "./pages/NuevoAjuste";
import NuevoGasto from "./pages/NuevoGasto";
import MovimientoDetalle from "./pages/MovimientoDetalle";
import GrupoFinancieroPeriodo from "./pages/GrupoFinancieroPeriodo";
import GruposFinancieros from "./pages/configuracion/GruposFinancieros";
import PagosPendientes from "./pages/PagosPendientes";
import BuscarPatente from "./pages/BuscarPatente";
import Recibos from "./pages/Recibos";
import Reportes from "./pages/reportes/Reportes";
import MensajesEnviados from "./pages/MensajesEnviados";
import PerfilConfig from "./pages/configuracion/Perfil";
import GeneralConfig from "./pages/configuracion/General";
import TarifasConfig from "./pages/configuracion/Tarifas";
import TiposGastoConfig from "./pages/configuracion/TiposGasto";
import ReglasAsignacionConfig from "./pages/configuracion/ReglasAsignacion";
import UsuariosConfig from "./pages/configuracion/Usuarios";
import PagosAbono from "./pages/PagosAbono";
import CargoAbono from "./pages/CargoAbono";
import ReintegroAbono from "./pages/ReintegroAbono";
import Login from "./pages/Login";
import SeleccionEstacionamientos from "./pages/SeleccionEstacionamientos";
import AuthGuard from "./components/layout/AuthGuard";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route path="/seleccion-estacionamientos" element={<AuthGuard><SeleccionEstacionamientos /></AuthGuard>} />

        <Route path="/" element={<AuthGuard><Layout /></AuthGuard>}>
          <Route index element={<Navigate to="/mi-estacionamiento" replace />} />
          <Route path="mi-estacionamiento" element={<Dashboard />} />
          <Route path="dashboard" element={<Navigate to="/mi-estacionamiento" replace />} />
          <Route path="cocheras" element={<Cocheras />} />
          <Route path="clientes" element={<Clientes />} />
          <Route path="clientes/nuevo" element={<NuevoCliente />} />
          <Route path="clientes/:clienteId/editar" element={<NuevoCliente />} />
          <Route path="clientes/:clienteId/cuenta-corriente" element={<CuentaCorrienteCliente />} />
          <Route path="pagos-pendientes" element={<PagosPendientes />} />
          <Route path="deudores" element={<Navigate to="/pagos-pendientes" replace />} />
          <Route path="buscar-patente" element={<BuscarPatente />} />
          <Route path="abonos" element={<Abonos />} />
          <Route path="abonos/nuevo" element={<NuevoAbono />} />
          <Route path="pagos" element={<Pagos />} />
          <Route path="cuenta-corriente" element={<CuentaCorriente />} />
          <Route path="movimientos" element={<Movimientos />} />
          <Route path="ajustes" element={<NuevoAjuste />} />
          <Route path="gastos" element={<NuevoGasto />} />
          <Route path="ajustes-gastos" element={<Navigate to="/ajustes" replace />} />
          <Route path="grupos-financieros" element={<GruposFinancieros />} />
          <Route path="grupos-financieros/:id" element={<GrupoFinancieroPeriodo />} />
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
            <Route path="categorias" element={<Navigate to="/configuracion/general?tab=categorias" replace />} />
            <Route path="tipos-vehiculo" element={<Navigate to="/configuracion/general?tab=tipos" replace />} />
            <Route path="metodos-pago" element={<Navigate to="/configuracion/general?tab=metodos" replace />} />
            <Route path="tarifas" element={<TarifasConfig />} />
            <Route path="tipos-gasto" element={<TiposGastoConfig />} />
            <Route path="grupos-financieros" element={<Navigate to="/grupos-financieros" replace />} />
            <Route path="reglas-asignacion" element={<ReglasAsignacionConfig />} />
            <Route path="usuarios" element={<UsuariosConfig />} />
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
