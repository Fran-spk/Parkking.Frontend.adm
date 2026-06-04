import { Navigate, Outlet } from "react-router-dom";
import { authService } from "../../services/authService";

/**
 * AuthGuard protege las rutas para usuarios que no han iniciado sesión.
 * Si el usuario está autenticado, renderiza los componentes hijos.
 * Si no lo está, redirige al login.
 */
export default function AuthGuard({ children }) {
  const authenticated = authService.isAuthenticated();

  if (!authenticated) {
    return <Navigate to="/login" replace />;
  }

  return children ? children : <Outlet />;
}
