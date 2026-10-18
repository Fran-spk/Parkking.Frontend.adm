import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Check, Loader2 } from "lucide-react";
import SelectorGrupos from "../components/layout/SelectorGrupos";
import FiltroSegmentado from "../components/layout/FiltroSegmentado";
import { tipoGastoService } from "../services/tipoGastoService";
import { operacionFinancieraService } from "../services/operacionFinancieraService";
import FilterSelect, { fieldClass } from "../components/layout/FilterSelect";
import { plata } from "../utils/clienteHelpers";

/** @typedef {import("../types").TipoGasto} TipoGasto */

const SECTIONS = [
  { id: "tipo", label: "Tipo" },
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

export default function NuevoGasto() {
  const navigate = useNavigate();
  const [tipos, setTipos] = useState(/** @type {TipoGasto[]} */ ([]));
  const [tipoGastoId, setTipoGastoId] = useState("");
  const [importe, setImporte] = useState("");
  const [concepto, setConcepto] = useState("");
  const [grupos, setGrupos] = useState(/** @type {number[]} */ ([]));
  const [activeSection, setActiveSection] = useState("tipo");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);
  const [aviso, setAviso] = useState(null);

  useEffect(() => {
    tipoGastoService.getAll(false).then((data) => setTipos(Array.isArray(data) ? data : [])).catch(() => setTipos([]));
  }, []);

  const tipo = tipos.find((t) => String(t.tipoGastoId) === String(tipoGastoId));
  const monto = Number(importe);
  const checklist = {
    tipo: Boolean(tipoGastoId),
    importe: monto > 0 && concepto.trim().length > 0,
    grupos: grupos.length > 0,
  };
  const puedeGuardar = checklist.tipo && checklist.importe && !guardando;

  function scrollTo(id) {
    setActiveSection(id);
    document.getElementById(`sec-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function handleGuardar() {
    if (!puedeGuardar) {
      setError(!tipoGastoId ? "Elegí un tipo de gasto" : "Completá importe y concepto");
      return;
    }
    try {
      setGuardando(true);
      setError(null);
      setAviso(null);
      await operacionFinancieraService.crearGasto({
        tipoGastoId,
        importe: monto,
        concepto: concepto.trim(),
        grupoFinancieroIds: grupos,
      });
      setAviso("Gasto registrado. Resta en la cuenta del estacionamiento.");
      setImporte("");
      setConcepto("");
      setGrupos([]);
    } catch (e) {
      setError(errorDe(e, "No se pudo registrar el gasto"));
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
            <h1 className="pk-title">Nuevo gasto</h1>
            <p className="pk-desc mt-1">Sale de la cuenta del estacionamiento.</p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleGuardar}
          disabled={!puedeGuardar}
          className="inline-flex items-center gap-2 bg-brand hover:bg-brand-strong disabled:opacity-40 text-brand-foreground text-sm font-semibold px-4 py-2.5"
        >
          {guardando ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
          {guardando ? "Guardando…" : "Registrar gasto"}
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
          <Seccion id="sec-tipo" titulo="Tipo de gasto" nota="Catálogo de configuración.">
            <div className="max-w-xl space-y-2">
              <FilterSelect
                className="w-full"
                ariaLabel="Tipo de gasto"
                value={tipoGastoId}
                onChange={setTipoGastoId}
                options={[
                  { value: "", label: "Elegir tipo" },
                  ...tipos.map((t) => ({ value: t.tipoGastoId, label: t.nombre })),
                ]}
              />
              {tipos.length === 0 && (
                <p className="pk-caption">No hay tipos activos. Cargalos en Configuración.</p>
              )}
            </div>
          </Seccion>

          <Seccion id="sec-importe" titulo="Importe" nota="El importe resta en la cuenta del estacionamiento.">
            <div className="max-w-xl space-y-4">
              <div>
                <label className="pk-label block mb-1">Importe</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 pk-caption">$</span>
                  <input type="number" min="0" step="1" value={importe} onChange={(e) => setImporte(e.target.value)} className={`${fieldClass} pl-8`} />
                </div>
              </div>
              <div>
                <label className="pk-label block mb-1">Concepto</label>
                <input value={concepto} onChange={(e) => setConcepto(e.target.value)} placeholder="Qué se pagó" className={fieldClass} />
              </div>
            </div>
          </Seccion>

          <Seccion id="sec-grupos" titulo="Grupos" nota="Se suman a la regla del tipo de gasto.">
            <SelectorGrupos value={grupos} onChange={setGrupos} />
          </Seccion>
        </div>

        <aside className="hidden xl:block">
          <div className="sticky top-20 bg-surface-card overflow-hidden">
            <div className="px-4 py-3 border-b border-line">
              <p className="pk-label">Resumen</p>
              <p className="text-sm font-bold text-ink mt-0.5">Gasto</p>
            </div>
            <div className="p-4 space-y-3 text-sm">
              <div>
                <p className="pk-label">Tipo</p>
                <p className="font-semibold text-ink mt-0.5">{tipo?.nombre || "Sin seleccionar"}</p>
              </div>
              <div>
                <p className="pk-label">Concepto</p>
                <p className="font-semibold text-ink mt-0.5">{concepto.trim() || "—"}</p>
              </div>
              <div>
                <p className="pk-label">En tu cuenta</p>
                <p className="text-lg font-bold tabular-nums text-danger-ink mt-0.5">
                  {monto > 0 ? plata(-monto) : "—"}
                </p>
              </div>
              <button
                type="button"
                onClick={handleGuardar}
                disabled={!puedeGuardar}
                className="w-full inline-flex items-center justify-center gap-2 bg-brand hover:bg-brand-strong disabled:opacity-40 text-brand-foreground text-sm font-semibold py-2.5"
              >
                {guardando ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                Confirmar gasto
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
