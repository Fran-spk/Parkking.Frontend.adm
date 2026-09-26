import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, User, Phone, FileText, Check, Loader2, AlertCircle } from "lucide-react";
import { clienteService } from "../services/clienteService";

const SECTIONS = [
  { id: "identidad", label: "Identidad", icon: User },
  { id: "contacto", label: "Contacto", icon: Phone },
  { id: "notas", label: "Notas", icon: FileText },
];

function SectionHeader({ index, title, done }) {
  return (
    <div className="flex items-start gap-4 mb-6">
      <div
        className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 text-sm font-black transition-colors ${
          done
            ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/25"
            : "bg-slate-900 text-white shadow-lg shadow-slate-900/15"
        }`}
      >
        {done ? <Check size={18} strokeWidth={3} /> : index}
      </div>
      <h2 className="text-lg font-bold text-slate-900 tracking-tight">{title}</h2>
    </div>
  );
}

const inputCls =
  "w-full text-sm border border-slate-200 rounded-xl px-3.5 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-400 transition-all placeholder:text-slate-300";

export default function NuevoCliente() {
  const { clienteId } = useParams();
  const editando = Boolean(clienteId);
  const navigate = useNavigate();
  const [form, setForm] = useState({
    nombre: "",
    documento: "",
    domicilio: "",
    telefono: "",
    email: "",
    observacion: "",
  });
  const [activeSection, setActiveSection] = useState("identidad");
  const [guardando, setGuardando] = useState(false);
  const [cargando, setCargando] = useState(editando);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!clienteId) return;
    clienteService
      .getById(clienteId)
      .then((data) => {
        setForm({
          nombre: data.nombre ?? "",
          documento: data.documento ?? "",
          domicilio: data.domicilio ?? "",
          telefono: data.telefono ?? "",
          email: data.email ?? "",
          observacion: data.observacion ?? "",
        });
      })
      .catch(() => setError("No se pudo cargar el cliente"))
      .finally(() => setCargando(false));
  }, [clienteId]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target?.id) setActiveSection(visible.target.id.replace("sec-", ""));
      },
      { rootMargin: "-20% 0px -55% 0px", threshold: [0.15, 0.4, 0.7] }
    );
    SECTIONS.forEach((s) => {
      const el = document.getElementById(`sec-${s.id}`);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [cargando]);

  function set(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError(null);
  }

  function scrollTo(id) {
    document.getElementById(`sec-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const checklist = {
    identidad: form.nombre.trim().length > 0,
    contacto: Boolean(form.telefono.trim() || form.email.trim() || form.domicilio.trim()),
    notas: Boolean(form.observacion.trim()),
  };
  const puedeGuardar = checklist.identidad && !guardando && !cargando;
  const activeIdx = Math.max(0, SECTIONS.findIndex((s) => s.id === activeSection));

  async function handleGuardar() {
    if (!form.nombre.trim()) {
      setError("El nombre es obligatorio");
      scrollTo("identidad");
      return;
    }
    try {
      setGuardando(true);
      setError(null);
      if (editando) {
        await clienteService.modificar(clienteId, form);
      } else {
        await clienteService.agregar(form);
      }
      navigate("/clientes");
    } catch (e) {
      const msg = e.response?.data;
      setError(typeof msg === "string" ? msg : "No se pudo guardar el cliente");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-2rem)] -mx-1">
      <div className="sticky top-16 z-30 -mx-4 px-4 lg:-mx-8 lg:px-8 py-3 mb-8 bg-gray-50/95 backdrop-blur-md border-b border-slate-200/70">
        <div className="max-w-6xl mx-auto space-y-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={() => navigate("/clientes")}
                className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-white border border-transparent hover:border-slate-200 transition-all"
              >
                <ArrowLeft size={18} />
              </button>
              <div className="min-w-0">
                <h1 className="text-xl font-black text-slate-900 tracking-tight truncate">
                  {editando ? "Editar cliente" : "Nuevo cliente"}
                </h1>
                <p className="text-xs text-slate-400 mt-0.5 truncate">
                  Paso {activeIdx + 1} de {SECTIONS.length}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => navigate("/clientes")}
                className="hidden sm:inline-flex text-sm font-medium text-slate-500 hover:text-slate-800 px-3 py-2.5 rounded-xl hover:bg-white transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleGuardar}
                disabled={!puedeGuardar}
                className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-lg shadow-slate-900/20 transition-all"
              >
                {guardando ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                {guardando ? "Guardando..." : editando ? "Guardar cambios" : "Crear cliente"}
              </button>
            </div>
          </div>

          <nav aria-label="Pasos del alta" className="flex items-stretch gap-1 sm:gap-2 overflow-x-auto pb-0.5">
            {SECTIONS.map((s, i) => {
              const Icon = s.icon;
              const active = activeSection === s.id;
              const done = checklist[s.id];
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => scrollTo(s.id)}
                  className={`flex-1 min-w-[7.5rem] flex items-center gap-2.5 px-3 py-2.5 rounded-2xl border transition-all text-left ${
                    active
                      ? "bg-white border-slate-200 shadow-sm ring-1 ring-slate-900/5"
                      : done
                        ? "bg-emerald-50/80 border-emerald-100 hover:bg-emerald-50"
                        : "bg-white/60 border-transparent hover:bg-white hover:border-slate-200"
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                      done
                        ? "bg-emerald-500 text-white"
                        : active
                          ? "bg-slate-900 text-white"
                          : "bg-slate-100 text-slate-400"
                    }`}
                  >
                    {done ? <Check size={14} strokeWidth={2.5} /> : <Icon size={14} />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Paso {i + 1}</p>
                    <p className={`text-sm font-semibold truncate ${active ? "text-slate-900" : done ? "text-emerald-800" : "text-slate-600"}`}>
                      {s.label}
                    </p>
                  </div>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {error && (
        <div className="max-w-6xl mx-auto mb-5 flex items-start gap-2.5 text-sm text-red-700 bg-red-50 border border-red-100 rounded-2xl px-4 py-3">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div className="max-w-6xl mx-auto grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_300px] gap-8 pb-16">
        <div className="space-y-6 min-w-0">
          <section id="sec-identidad" className="scroll-mt-48 bg-white rounded-3xl p-6 sm:p-8 lg:p-10">
            <SectionHeader index={1} title="Identidad" done={checklist.identidad} />
            <div className="max-w-xl space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-2">
                  Nombre <span className="text-rose-400">*</span>
                </label>
                <input
                  autoFocus
                  value={form.nombre}
                  onChange={(e) => set("nombre", e.target.value)}
                  placeholder="Ej: Juan Pérez"
                  className={inputCls}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-2">
                  DNI / documento
                </label>
                <input
                  value={form.documento}
                  onChange={(e) => set("documento", e.target.value)}
                  placeholder="Ej: 30111222"
                  className={inputCls}
                />
              </div>
            </div>
          </section>

          <section id="sec-contacto" className="scroll-mt-48 bg-white rounded-3xl p-6 sm:p-8 lg:p-10">
            <SectionHeader index={2} title="Contacto" done={checklist.contacto} />
            <div className="max-w-xl space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-2">Teléfono</label>
                <input
                  value={form.telefono}
                  onChange={(e) => set("telefono", e.target.value)}
                  placeholder="Ej: 3415001234"
                  className={inputCls}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-2">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                  placeholder="Ej: juan@gmail.com"
                  className={inputCls}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-2">Domicilio</label>
                <input
                  value={form.domicilio}
                  onChange={(e) => set("domicilio", e.target.value)}
                  placeholder="Calle, número, ciudad"
                  className={inputCls}
                />
              </div>
            </div>
          </section>

          <section id="sec-notas" className="scroll-mt-48 bg-white rounded-3xl p-6 sm:p-8 lg:p-10">
            <SectionHeader index={3} title="Notas" done={Boolean(form.observacion.trim())} />
            <div className="max-w-xl">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-2">
                Observación interna
              </label>
              <textarea
                value={form.observacion}
                onChange={(e) => set("observacion", e.target.value)}
                rows={4}
                placeholder="Notas que no ve el cliente..."
                className={`${inputCls} resize-none`}
              />
            </div>
          </section>

          <div className="xl:hidden sticky bottom-3 z-20">
            <button
              type="button"
              onClick={handleGuardar}
              disabled={!puedeGuardar}
              className="w-full inline-flex items-center justify-center gap-2 bg-slate-900 text-white text-sm font-semibold py-3.5 rounded-2xl shadow-xl shadow-slate-900/25 disabled:opacity-40"
            >
              {guardando ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
              {editando ? "Guardar cambios" : "Crear cliente"}
            </button>
          </div>
        </div>

        <aside className="hidden xl:block">
          <div className="sticky top-44 rounded-3xl bg-white overflow-hidden">
            <div className="px-5 py-4 bg-slate-900 text-white">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">Resumen</p>
              <p className="text-base font-bold mt-1">Vista previa</p>
            </div>
            <div className="p-5 space-y-4 text-sm">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-indigo-100 text-indigo-700 font-black flex items-center justify-center">
                  {form.nombre.trim().charAt(0).toUpperCase() || "C"}
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-slate-900 truncate">{form.nombre.trim() || "Sin nombre"}</p>
                  <p className="text-xs text-slate-500 truncate">{form.documento.trim() ? `DNI ${form.documento.trim()}` : "Sin documento"}</p>
                </div>
              </div>
              <div className="h-px bg-slate-100" />
              <div>
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Contacto</p>
                <p className="font-semibold text-slate-900">{form.telefono.trim() || "Sin teléfono"}</p>
                <p className="text-xs text-slate-500 mt-0.5 truncate">{form.email.trim() || "Sin email"}</p>
              </div>
              <div className="h-px bg-slate-100" />
              <div>
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Domicilio</p>
                <p className="font-semibold text-slate-900">{form.domicilio.trim() || "—"}</p>
              </div>
              <button
                type="button"
                onClick={handleGuardar}
                disabled={!puedeGuardar}
                className="w-full mt-2 inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-sm font-semibold py-3 rounded-xl transition-colors shadow-lg shadow-indigo-600/25"
              >
                {guardando ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                {editando ? "Guardar cambios" : "Confirmar alta"}
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
