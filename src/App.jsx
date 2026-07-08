import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/layout/Layout";
import Dashboard from "./pages/Dashboard";
import Cocheras from "./pages/Cocheras";
import Clientes from "./pages/Clientes";
import Abonos from "./pages/Abonos";
import Pagos from "./pages/Pagos";
import Caja from "./pages/Caja";
import PerfilConfig from "./pages/configuracion/Perfil";
import CategoriasCocheraConfig from "./pages/configuracion/CategoriasCochera";
import TiposVehiculoConfig from "./pages/configuracion/TiposVehiculo";
import GeneralConfig from "./pages/configuracion/General";
import TarifasConfig from "./pages/configuracion/Tarifas";
import PagosAbono from "./pages/PagosAbono";
import Login from "./pages/Login";
import SeleccionEstacionamientos from "./pages/SeleccionEstacionamientos";
import EditorPlano from "./pages/EditorPlano";
import AuthGuard from "./components/layout/AuthGuard";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Ruta pública de Login */}
        <Route path="/login" element={<Login />} />

        {/* Selección de estacionamiento */}
        <Route path="/seleccion-estacionamientos" element={<AuthGuard><SeleccionEstacionamientos /></AuthGuard>} />

        {/* Rutas protegidas */}
        <Route path="/" element={<AuthGuard><Layout /></AuthGuard>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="cocheras" element={<Cocheras />} />
          <Route path="clientes" element={<Clientes />} />
          <Route path="abonos" element={<Abonos />} />
          <Route path="pagos" element={<Pagos />} />
          <Route path="caja" element={<Caja />} />
          <Route path="configuracion">
            <Route index element={<Navigate to="perfil" replace />} />
            <Route path="perfil" element={<PerfilConfig />} />
            <Route path="categorias" element={<CategoriasCocheraConfig />} />
            <Route path="tipos-vehiculo" element={<TiposVehiculoConfig />} />
            <Route path="tarifas" element={<TarifasConfig />} />
            <Route path="general" element={<GeneralConfig />} />
          </Route>
          <Route path="pagosAbono/:id" element={<PagosAbono />} />
          <Route path="plano-cochera" element={<EditorPlano />} />
        </Route>

        {/* Redirección por defecto */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}