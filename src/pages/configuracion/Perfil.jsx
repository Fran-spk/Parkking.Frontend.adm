import { useEffect, useState } from "react";
import { User, Mail, Phone, Lock, Save, CheckCircle, AtSign } from "lucide-react";
import PageHeader, { PageHeaderAction } from "../../components/layout/PageHeader";
import { fieldClass } from "../../components/layout/FilterSelect";
import { usuarioService } from "../../services/usuarioService";

function errMsg(err, fallback) {
  const msg = err?.response?.data;
  if (typeof msg === "string") return msg;
  if (msg?.mensaje) return msg.mensaje;
  if (err?.message) return err.message;
  return fallback;
}

export default function Perfil() {
  const [loading, setLoading] = useState(true);
  const [savingDatos, setSavingDatos] = useState(false);
  const [savingPass, setSavingPass] = useState(false);
  const [successDatos, setSuccessDatos] = useState(false);
  const [successPass, setSuccessPass] = useState(false);
  const [errorDatos, setErrorDatos] = useState("");
  const [errorPass, setErrorPass] = useState("");

  const [usuarioRO, setUsuarioRO] = useState("");
  const [mailRO, setMailRO] = useState("");
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const data = await usuarioService.getPerfil();
        setUsuarioRO(data.usuarioName ?? "");
        setMailRO(data.mail ?? "");
        setNombre(data.nombre ?? "");
        setTelefono(data.telefono ?? "");
      } catch {
        setErrorDatos("No se pudo cargar el perfil. Intente nuevamente.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function guardarDatos(e) {
    e.preventDefault();
    if (!nombre.trim()) {
      setErrorDatos("Ingresá tu nombre.");
      return;
    }
    if (!mailRO.trim()) {
      setErrorDatos("No hay email en el perfil; no se puede guardar.");
      return;
    }

    setSavingDatos(true);
    setErrorDatos("");
    setSuccessDatos(false);
    try {
      const updated = await usuarioService.modificarPerfil({
        nombre: nombre.trim(),
        mail: mailRO.trim(),
        telefono: telefono.trim(),
      });
      setNombre(updated.nombre ?? nombre);
      setTelefono(updated.telefono ?? telefono);
      setMailRO(updated.mail ?? mailRO);
      setUsuarioRO(updated.usuarioName ?? usuarioRO);
      setSuccessDatos(true);
      setTimeout(() => setSuccessDatos(false), 3000);
    } catch (err) {
      setErrorDatos(errMsg(err, "No se pudieron guardar los datos."));
    } finally {
      setSavingDatos(false);
    }
  }

  async function cambiarPassword(e) {
    e.preventDefault();
    if (!currentPassword) {
      setErrorPass("Ingresá tu contraseña actual.");
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setErrorPass("La nueva contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorPass("Las contraseñas nuevas no coinciden.");
      return;
    }

    setSavingPass(true);
    setErrorPass("");
    setSuccessPass(false);
    try {
      await usuarioService.cambiarPassword({
        passwordActual: currentPassword,
        passwordNueva: newPassword,
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setSuccessPass(true);
      setTimeout(() => setSuccessPass(false), 3000);
    } catch (err) {
      const status = err?.response?.status;
      if (status === 401) {
        setErrorPass("La contraseña actual es incorrecta.");
      } else {
        setErrorPass(errMsg(err, "No se pudo cambiar la contraseña."));
      }
    } finally {
      setSavingPass(false);
    }
  }

  if (loading) {
    return <div className="text-sm text-ink-muted p-6">Cargando…</div>;
  }

  return (
    <div className="space-y-5 animate-fade-in-up">
      <PageHeader
        title="Mi perfil"
        description="Datos de tu cuenta. El usuario y el email no se editan desde acá."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <form onSubmit={guardarDatos} className="bg-surface-card p-5 space-y-4">
          <h3 className="pk-label pb-2 border-b border-line-subtle">Información personal</h3>

          <div className="space-y-3">
            <label className="block space-y-1">
              <span className="pk-caption font-semibold">Usuario</span>
              <div className="relative">
                <AtSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
                <input type="text" value={usuarioRO} readOnly disabled className={`${fieldClass} pl-10 cursor-not-allowed`} />
              </div>
            </label>

            <label className="block space-y-1">
              <span className="pk-caption font-semibold">Correo electrónico</span>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
                <input type="email" value={mailRO} readOnly disabled className={`${fieldClass} pl-10 cursor-not-allowed`} />
              </div>
            </label>

            <label className="block space-y-1">
              <span className="pk-caption font-semibold">Nombre completo</span>
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => {
                    setNombre(e.target.value);
                    setErrorDatos("");
                  }}
                  required
                  className={`${fieldClass} pl-10`}
                  placeholder="Ej. Juan Pérez"
                />
              </div>
            </label>

            <label className="block space-y-1">
              <span className="pk-caption font-semibold">Teléfono</span>
              <div className="relative">
                <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
                <input
                  type="text"
                  value={telefono}
                  onChange={(e) => {
                    setTelefono(e.target.value);
                    setErrorDatos("");
                  }}
                  className={`${fieldClass} pl-10`}
                  placeholder="Ej. +54 9 11 ..."
                />
              </div>
            </label>
          </div>

          {errorDatos && (
            <div className="px-3 py-2 bg-danger-muted text-danger text-xs font-semibold">{errorDatos}</div>
          )}
          {successDatos && (
            <div className="px-3 py-2 bg-success-muted text-success text-xs font-semibold flex items-center gap-2">
              <CheckCircle size={14} /> Datos guardados.
            </div>
          )}

          <div className="flex justify-end pt-1">
            <PageHeaderAction type="submit" disabled={savingDatos}>
              <Save size={15} />
              {savingDatos ? "Guardando…" : "Guardar datos"}
            </PageHeaderAction>
          </div>
        </form>

        <form onSubmit={cambiarPassword} className="bg-surface-card p-5 space-y-4">
          <h3 className="pk-label pb-2 border-b border-line-subtle">Contraseña</h3>
          <p className="pk-caption">Completá solo si querés cambiarla.</p>

          <div className="space-y-3">
            <label className="block space-y-1">
              <span className="pk-caption font-semibold">Contraseña actual</span>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => {
                    setCurrentPassword(e.target.value);
                    setErrorPass("");
                  }}
                  className={`${fieldClass} pl-10`}
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
              </div>
            </label>

            <label className="block space-y-1">
              <span className="pk-caption font-semibold">Nueva contraseña</span>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    setErrorPass("");
                  }}
                  className={`${fieldClass} pl-10`}
                  placeholder="Mínimo 6 caracteres"
                  autoComplete="new-password"
                />
              </div>
            </label>

            <label className="block space-y-1">
              <span className="pk-caption font-semibold">Confirmar nueva</span>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setErrorPass("");
                  }}
                  className={`${fieldClass} pl-10`}
                  placeholder="Repetí la nueva contraseña"
                  autoComplete="new-password"
                />
              </div>
            </label>
          </div>

          {errorPass && (
            <div className="px-3 py-2 bg-danger-muted text-danger text-xs font-semibold">{errorPass}</div>
          )}
          {successPass && (
            <div className="px-3 py-2 bg-success-muted text-success text-xs font-semibold flex items-center gap-2">
              <CheckCircle size={14} /> Contraseña actualizada.
            </div>
          )}

          <div className="flex justify-end pt-1">
            <PageHeaderAction type="submit" disabled={savingPass}>
              <Lock size={15} />
              {savingPass ? "Guardando…" : "Cambiar contraseña"}
            </PageHeaderAction>
          </div>
        </form>
      </div>
    </div>
  );
}
