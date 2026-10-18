import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Check, Loader2 } from "lucide-react";
import SelectorGrupos from "../components/layout/SelectorGrupos";
import BuscadorCliente from "../components/layout/BuscadorCliente";
import FiltroSegmentado from "../components/layout/FiltroSegmentado";
import { operacionFinancieraService } from "../services/operacionFinancieraService";
import { fieldClass } from "../components/layout/FilterSelect";
import { plata } from "../utils/clienteHelpers";

/** @typedef {import("../types").Cliente} Cliente */

const SECTIONS = [
  { id: "cliente", label: "Cliente" },
  { id: "importe", label: "Importe" },
  { id: "grupos", label: "Grupos" },
];

function Seccion({ id, titulo, nota, children }) {
  return (
    <section id={id} className="scroll-mt-36 bg-surface-card">
      <header className="px-5 py-3 border-b border-line">
        <h2 className="text-sm font-bold text-ink">{titulo}</h2>
        {nota ? <p className="pk-caption mt-0.5">{nota}</p> : null}
      </header>
      <div className="px-5 py-4">{children}</div>
    </section>
  );
}

function errorDe(e, fallback) {
  const msg = e.response?.data;
  return typeof msg === "string" ? msg : fallback;
}

export default function NuevoAjuste() {
  const navigate = useNavigate();
  const [cliente, setCliente] = useState(/** @type {Cliente | null} */ (null));
  const [sentido, setSentido] = useState("favor");
  const [importe, setImporte] = useState("");
  const [motivo, setMotivo] = useState("");
  const [grupos, setGrupos] = useState(/** @type {number[]} */ ([]));
  const [activeSection, setActiveSection] = useState("cliente");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);
  const [aviso, setAviso] = useState(null);

  const monto = Number(importe);
  const aFavor = sentido === "favor";
  const checklist = {
    cliente: Boolean(cliente?.clienteId),
    importe: monto > 0 && motivo.trim().length > 0,
    grupos: grupos.length > 0,
  };
  const puedeGuardar = checklist.cliente && checklist.importe && !guardando;
  const signoCuenta = aFavor ? -monto : monto;

  function scrollTo(id) {
    setActiveSection(id);
    document.getElementById(`sec-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function handleGuardar() {
    if (!puedeGuardar) {
      setError(!cliente?.clienteId ? "Elegí un cliente" : "Completá importe y motivo");
      return;
    }
    try {
      setGuardando(true);
      setError(null);
      setAviso(null);
      await operacionFinancieraService.crearAjuste({
        clienteId: cliente.clienteId,
        importe: monto,
        aFavorDelCliente: aFavor,
        motivo: motivo.trim(),
        grupoFinancieroIds: grupos,
      });
      setAviso("Ajuste registrado en la cuenta del estacionamiento y en la del cliente.");
      setImporte("");
      setMotivo("");
      setGrupos([]);
    } catch (e) {
      setError(errorDe(e, "No se pudo registrar el ajuste"));
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="space-y-5 pb-12 animate-fade-in-up">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <button
            type="button"
            onClick={() => navigate("/cuenta-corriente")}
            className="pk-icon-btn p-1.5 text-ink-muted hover:text-ink hover:bg-surface-muted"
            aria-label="Volver"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="min-w-0">
            <h1 className="pk-title">Nuevo ajuste</h1>
            <p className="pk-desc mt-1">Corrige el saldo del cliente y del estacionamiento.</p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleGuardar}
          disabled={!puedeGuardar}
          className="inline-flex items-center gap-2 bg-brand hover:bg-brand-strong disabled:opacity-40 text-brand-foreground text-sm font-semibold px-4 py-2.5"
        >
          {guardando ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
          {guardando ? "Guardando…" : "Registrar ajuste"}
        </button>
      </div>

      <FiltroSegmentado
        ariaLabel="Secciones"
        value={activeSection}
        onChange={scrollTo}
        opciones={SECTIONS.map((s) => ({
          value: s.id,
          label: checklist[s.id] ? `${s.label} · listo` : s.label,
        }))}
      />

      {error && <p className="px-4 py-3 bg-danger-muted text-danger-ink text-sm">{error}</p>}
      {aviso && <p className="px-4 py-3 bg-success-muted text-success-ink text-sm">{aviso}</p>}

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_18rem] gap-5">
        <div className="space-y-5 min-w-0">
          <Seccion id="sec-cliente" titulo="Cliente" nota="Titular de la cuenta que se ajusta.">
            <div className="max-w-xl space-y-3">
              <BuscadorCliente size="lg" onSeleccionar={setCliente} />
              {cliente && (
                <div className="border-l-[3px] border-l-brand bg-surface-page px-3 py-2.5">
                  <p className="font-semibold text-ink truncate">{cliente.nombre}</p>
                  <p className="pk-caption truncate">
                    {[cliente.documento && `DNI ${cliente.documento}`, cliente.telefono, cliente.email]
                      .filter(Boolean)
                      .join(" · ") || "Sin contacto"}
                  </p>
                </div>
              )}
            </div>
          </Seccion>

          <Seccion id="sec-importe" titulo="Importe" nota="A favor resta en tu cuenta. Debe más, suma.">
            <div className="max-w-xl space-y-4">
              <FiltroSegmentado
                ariaLabel="Sentido del ajuste"
                value={sentido}
                onChange={setSentido}
                opciones={[
                  { value: "favor", label: "A su favor" },
                  { value: "debe", label: "Debe más" },
                ]}
              />
              <div>
                <label className="pk-label block mb-1">Importe</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 pk-caption">$</span>
                  <input type="number" min="0" step="1" value={importe} onChange={(e) => setImporte(e.target.value)} className={`${fieldClass} pl-8`} />
                </div>
              </div>
              <div>
                <label className="pk-label block mb-1">Motivo</label>
                <input value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Por qué se ajusta" className={fieldClass} />
              </div>
            </div>
          </Seccion>

          <Seccion id="sec-grupos" titulo="Grupos" nota="Se suman a las reglas del cliente. Si no marcás ninguno, igual entran los de la regla.">
            <SelectorGrupos value={grupos} onChange={setGrupos} />
          </Seccion>
        </div>

        <aside className="hidden xl:block">
          <div className="sticky top-20 bg-surface-card overflow-hidden">
            <div className="px-4 py-3 border-b border-line">
              <p className="pk-label">Resumen</p>
              <p className="text-sm font-bold text-ink mt-0.5">Ajuste</p>
            </div>
            <div className="p-4 space-y-3 text-sm">
              <div>
                <p className="pk-label">Cliente</p>
                <p className="font-semibold text-ink mt-0.5">{cliente?.nombre || "Sin seleccionar"}</p>
              </div>
              <div>
                <p className="pk-label">Sentido</p>
                <p className="font-semibold text-ink mt-0.5">{aFavor ? "A favor del cliente" : "El cliente debe más"}</p>
              </div>
              <div>
                <p className="pk-label">En tu cuenta</p>
                <p className={`text-lg font-bold tabular-nums mt-0.5 ${signoCuenta < 0 ? "text-danger-ink" : "text-ink"}`}>
                  {monto > 0 ? plata(signoCuenta) : "—"}
                </p>
              </div>
              <button
                type="button"
                onClick={handleGuardar}
                disabled={!puedeGuardar}
                className="w-full inline-flex items-center justify-center gap-2 bg-brand hover:bg-brand-strong disabled:opacity-40 text-brand-foreground text-sm font-semibold py-2.5"
              >
                {guardando ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                Confirmar ajuste
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
