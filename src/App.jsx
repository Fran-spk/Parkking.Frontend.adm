import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/layout/Layout";
import Dashboard from "./pages/Dashboard";
import Cocheras from "./pages/Cocheras";
import Clientes from "./pages/Clientes";
import Abonos from "./pages/Abonos";
import NuevoAbono from "./pages/NuevoAbono";
import Pagos from "./pages/Pagos";
import Caja from "./pages/Caja";
import PagosPendientes from "./pages/PagosPendientes";
import BuscarPatente from "./pages/BuscarPatente";
import Recibos from "./pages/Recibos";
import Reportes from "./pages/reportes/Reportes";
import PerfilConfig from "./pages/configuracion/Perfil";
import GeneralConfig from "./pages/configuracion/General";
import TarifasConfig from "./pages/configuracion/Tarifas";
import UsuariosConfig from "./pages/configuracion/Usuarios";
import PagosAbono from "./pages/PagosAbono";
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
          <Route path="pagos-pendientes" element={<PagosPendientes />} />
          <Route path="deudores" element={<Navigate to="/pagos-pendientes" replace />} />
          <Route path="buscar-patente" element={<BuscarPatente />} />
          <Route path="abonos" element={<Abonos />} />
          <Route path="abonos/nuevo" element={<NuevoAbono />} />
          <Route path="pagos" element={<Pagos />} />
          <Route path="cuenta-corriente" element={<Caja />} />
          <Route path="caja" element={<Navigate to="/cuenta-corriente" replace />} />
          <Route path="recibos" element={<Recibos />} />
          <Route path="reportes" element={<Reportes />} />
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
            <Route path="usuarios" element={<UsuariosConfig />} />
          </Route>
          <Route path="pagosAbono/:id" element={<PagosAbono />} />
        </Route>

        <Route path="*" element={<Navigate to="/mi-estacionamiento" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
