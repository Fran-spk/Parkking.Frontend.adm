import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { authService } from "../../services/authService";

/**
 * Protege rutas: exige sesión local y valida cookie JWT con /Auth/me.
 * Si el backend responde 401, limpia sesión y manda al login.
 */
export default function AuthGuard({ children }) {
  const [status, setStatus] = useState(/** @type {'checking' | 'ok' | 'login'} */ ("checking"));

  useEffect(() => {
    let cancelled = false;

    async function verify() {
      if (!authService.isAuthenticated()) {
        if (!cancelled) setStatus("login");
        return;
      }

      try {
        await authService.me();
        if (!cancelled) setStatus("ok");
      } catch (err) {
        const code = err?.response?.status;
        if (code === 401) {
          await authService.logout();
          if (!cancelled) setStatus("login");
          return;
        }
        // Otros errores (red): dejar pasar con sesión local
        if (!cancelled) setStatus("ok");
      }
    }

    verify();
    return () => {
      cancelled = true;
    };
  }, []);

  if (status === "checking") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-page text-ink-muted text-sm">
        Verificando sesión…
      </div>
    );
  }

  if (status === "login") {
    return <Navigate to="/login" replace />;
  }

  return children;
}
