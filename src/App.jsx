import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/layout/Layout";
import Dashboard from "./pages/Dashboard";
import Cocheras from "./pages/Cocheras";
import Clientes from "./pages/Clientes";
import Abonos from "./pages/Abonos";
import Pagos from "./pages/Pagos";
import Caja from "./pages/Caja";
import Configuracion from "./pages/Configuracion";
import PagosAbono from "./pages/PagosAbono";
import Login from "./pages/Login";
import AuthGuard from "./components/layout/AuthGuard";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Ruta pública de Login */}
        <Route path="/login" element={<Login />} />

        {/* Rutas protegidas */}
        <Route path="/" element={<AuthGuard><Layout /></AuthGuard>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="cocheras" element={<Cocheras />} />
          <Route path="clientes" element={<Clientes />} />
          <Route path="abonos" element={<Abonos />} />
          <Route path="pagos" element={<Pagos />} />
          <Route path="caja" element={<Caja />} />
          <Route path="configuracion" element={<Configuracion />} />
          <Route path="pagosAbono/:id" element={<PagosAbono />} />
        </Route>

        {/* Redirección por defecto */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}