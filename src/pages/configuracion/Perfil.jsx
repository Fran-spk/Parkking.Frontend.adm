import React, { useState, useEffect } from "react";
import { User, Mail, Phone, Lock, Save, CheckCircle, AtSign } from "lucide-react";
import { usuarioService } from "../../services/usuarioService";

export default function Perfil() {
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [success, setSuccess]   = useState(false);
  const [error, setError]       = useState("");

  // Datos de solo lectura (no editables)
  const [usuarioRO, setUsuarioRO] = useState("");
  const [mailRO, setMailRO]       = useState("");

  // Datos editables
  const [formData, setFormData] = useState({
    nombre:          "",
    telefono:        "",
    currentPassword: "",
    newPassword:     "",
    confirmPassword: "",
  });

  // Carga inicial desde la API
  useEffect(() => {
    async function cargar() {
      try {
        const data = await usuarioService.getPerfil();
        setUsuarioRO(data.usuarioName ?? "");
        setMailRO(data.mail ?? "");
        setFormData(prev => ({
          ...prev,
          nombre:   data.nombre   ?? "",
          telefono: data.telefono ?? "",
        }));
      } catch {
        setError("No se pudo cargar el perfil. Intente nuevamente.");
      } finally {
        setLoading(false);
      }
    }
    cargar();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validación de contraseñas si el usuario quiere cambiarla
    const quiereCambiarPassword = !!(formData.currentPassword || formData.newPassword || formData.confirmPassword);
    if (quiereCambiarPassword) {
      if (!formData.currentPassword) {
        setError("Ingresá tu contraseña actual para cambiarla.");
        return;
      }
      if (!formData.newPassword) {
        setError("Ingresá la nueva contraseña.");
        return;
      }
      if (formData.newPassword !== formData.confirmPassword) {
        setError("Las contraseñas nuevas no coinciden.");
        return;
      }
    }

    setSaving(true);
    setError("");

    try {
      // 1. Guardar nombre y teléfono
      await usuarioService.modificarPerfil({
        nombre:   formData.nombre,
        telefono: formData.telefono,
      });

      // 2. Cambiar contraseña si corresponde
      if (quiereCambiarPassword) {
        await usuarioService.cambiarPassword({
          passwordActual: formData.currentPassword,
          passwordNueva:  formData.newPassword,
        });
      }

      // Limpiar campos de contraseña y mostrar éxito
      setFormData(prev => ({
        ...prev,
        currentPassword: "",
        newPassword:     "",
        confirmPassword: "",
      }));
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);

    } catch (err) {
      const msg = err.response?.data;
      setError(typeof msg === "string" ? msg : "No se pudieron guardar los cambios.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-xs text-gray-400 font-semibold p-6">Cargando...</div>;
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Encabezado */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Mi Perfil</h1>
        <p className="text-sm text-gray-500 mt-1">
          Gestioná tus datos personales, contraseña y preferencias de la cuenta.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Información Personal */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)] space-y-4">
            <h3 className="text-sm font-bold text-gray-800 border-b border-gray-50 pb-2">Información Personal</h3>

            <div className="space-y-3">

              {/* Usuario — solo lectura */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Usuario</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-300">
                    <AtSign size={16} />
                  </div>
                  <input
                    type="text"
                    value={usuarioRO}
                    readOnly
                    disabled
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-100 border border-gray-200 rounded-xl text-xs text-gray-400 font-medium cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Nombre — editable */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Nombre Completo</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <User size={16} />
                  </div>
                  <input
                    type="text"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleChange}
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all font-medium"
                    placeholder="Ej. Juan Pérez"
                  />
                </div>
              </div>

              {/* Mail — solo lectura */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Correo Electrónico</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-300">
                    <Mail size={16} />
                  </div>
                  <input
                    type="email"
                    value={mailRO}
                    readOnly
                    disabled
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-100 border border-gray-200 rounded-xl text-xs text-gray-400 font-medium cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Teléfono — editable */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Teléfono de Contacto</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <Phone size={16} />
                  </div>
                  <input
                    type="text"
                    name="telefono"
                    value={formData.telefono}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all font-medium"
                    placeholder="Ej. +54 9 11 ..."
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Seguridad y Contraseña */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)] space-y-4">
            <h3 className="text-sm font-bold text-gray-800 border-b border-gray-50 pb-2">Seguridad</h3>
            <p className="text-[11px] text-gray-400">Completá estos campos solo si querés cambiar tu contraseña.</p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Contraseña Actual</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <Lock size={16} />
                  </div>
                  <input
                    type="password"
                    name="currentPassword"
                    value={formData.currentPassword}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all font-medium"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Nueva Contraseña</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <Lock size={16} />
                  </div>
                  <input
                    type="password"
                    name="newPassword"
                    value={formData.newPassword}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all font-medium"
                    placeholder="Mínimo 6 caracteres"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Confirmar Nueva Contraseña</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <Lock size={16} />
                  </div>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all font-medium"
                    placeholder="Repita la nueva contraseña"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Feedback */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-semibold flex items-center gap-2">
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-xl text-xs font-semibold flex items-center gap-2 animate-pulse-glow">
            <CheckCircle size={16} />
            <span>Los cambios de perfil se guardaron correctamente.</span>
          </div>
        )}

        {/* Botón de envío */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/10 transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:pointer-events-none"
          >
            <Save size={15} />
            {saving ? "Guardando..." : "Guardar Cambios"}
          </button>
        </div>
      </form>
    </div>
  );
}
