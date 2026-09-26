import { useState } from "react";
import { X } from "lucide-react";
import { operacionFinancieraService } from "../../services/operacionFinancieraService";
import { abonoIdOf } from "../../utils/abonoHelpers";
import SelectorGrupos from "./SelectorGrupos";

/** @typedef {import("../../types").Abono} Abono */

const TIPOS = [
  { value: "cargo", label: "Cargo", desc: "El cliente queda obligado. Todavía no mueve la cuenta." },
  { value: "reintegro", label: "Reintegro", desc: "Se devuelve y se anota en la cuenta corriente." },
];

function mensajeError(e, fallback) {
  const msg = e.response?.data;
  return typeof msg === "string" ? msg : fallback;
}

export default function ModalCargoReintegro({ abono, onClose, onGuardado }) {
  const clienteId = abono.clienteId ?? abono.cliente?.clienteId;
  const [tipo, setTipo] = useState("cargo");
  const [concepto, setConcepto] = useState("");
  const [monto, setMonto] = useState("");
  const [beneficiario, setBeneficiario] = useState(abono.cliente?.nombre || "");
  const [medio, setMedio] = useState("");
  const [grupos, setGrupos] = useState(/** @type {number[]} */ ([]));
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);

  async function handleGuardar() {
    if (!concepto.trim()) {
      setError(tipo === "cargo" ? "El concepto es obligatorio" : "El motivo es obligatorio");
      return;
    }
    if (!monto || Number(monto) <= 0) {
      setError("Ingresá un importe mayor a cero");
      return;
    }
    if (!clienteId) {
      setError("El abono no tiene cliente");
      return;
    }
    if (tipo === "reintegro") {
      if (!beneficiario.trim()) {
        setError("El beneficiario es obligatorio");
        return;
      }
      if (!medio.trim()) {
        setError("El medio de devolución es obligatorio");
        return;
      }
    }

    try {
      setGuardando(true);
      setError(null);
      const abonoId = abonoIdOf(abono);
      if (tipo === "cargo") {
        await operacionFinancieraService.crearCargo({
          clienteId,
          abonoId,
          importe: monto,
          concepto: concepto.trim(),
        });
      } else {
        await operacionFinancieraService.crearReintegro({
          clienteId,
          abonoId,
          importe: monto,
          beneficiario: beneficiario.trim(),
          motivo: concepto.trim(),
          medio: medio.trim(),
          grupoFinancieroIds: grupos,
        });
      }
      onGuardado();
      onClose();
    } catch (e) {
      setError(mensajeError(e, "No se pudo registrar"));
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-ink/20 flex items-center justify-center z-50 p-4">
      <div className="bg-surface-card w-full max-w-md">
        <div className="flex items-center justify-between px-5 py-4 border-b border-line">
          <div>
            <h2 className="text-base font-bold text-ink">Cargo o reintegro</h2>
            <p className="text-xs text-ink-faint mt-0.5">{abono.cliente?.nombre || "Cliente del abono"}</p>
          </div>
          <button type="button" onClick={onClose} className="text-ink-faint hover:text-ink">
            <X size={18} />
          </button>
        </div>

        <div className="px-5 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-2">
            {TIPOS.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => {
                  setTipo(t.value);
                  setError(null);
                }}
                className={`py-2.5 px-3 text-left border transition-colors ${
                  tipo === t.value
                    ? "border-brand bg-brand-muted text-ink"
                    : "border-line text-ink-muted hover:border-line-strong"
                }`}
              >
                <p className="text-sm font-semibold">{t.label}</p>
                <p className="text-[11px] mt-0.5 leading-snug opacity-80">{t.desc}</p>
              </button>
            ))}
          </div>

          <div>
            <label className="pk-label block mb-1.5">{tipo === "cargo" ? "Concepto" : "Motivo"}</label>
            <input
              autoFocus
              value={concepto}
              onChange={(e) => {
                setConcepto(e.target.value);
                setError(null);
              }}
              className="w-full text-sm border border-line-strong bg-surface-muted text-ink px-3 py-2.5 focus:outline-none focus:border-brand focus:bg-surface-card"
            />
          </div>

          <div>
            <label className="pk-label block mb-1.5">Importe</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={monto}
              onChange={(e) => {
                setMonto(e.target.value);
                setError(null);
              }}
              className="w-full text-sm border border-line-strong bg-surface-muted text-ink px-3 py-2.5 focus:outline-none focus:border-brand focus:bg-surface-card"
            />
          </div>

          {tipo === "reintegro" && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="pk-label block mb-1.5">Beneficiario</label>
                <input
                  value={beneficiario}
                  onChange={(e) => setBeneficiario(e.target.value)}
                  className="w-full text-sm border border-line-strong bg-surface-muted text-ink px-3 py-2.5 focus:outline-none focus:border-brand focus:bg-surface-card"
                />
              </div>
              <div>
                <label className="pk-label block mb-1.5">Medio</label>
                <input
                  value={medio}
                  onChange={(e) => setMedio(e.target.value)}
                  placeholder="Efectivo, transferencia…"
                  className="w-full text-sm border border-line-strong bg-surface-muted text-ink px-3 py-2.5 focus:outline-none focus:border-brand focus:bg-surface-card"
                />
              </div>
            </div>
          )}

          {tipo === "reintegro" && <SelectorGrupos value={grupos} onChange={setGrupos} />}

          {error && (
            <p className="text-xs text-danger-ink bg-danger-muted px-3 py-2">{error}</p>
          )}
        </div>

        <div className="px-5 py-4 border-t border-line flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 text-sm text-ink-muted border border-line py-2.5 hover:bg-surface-muted"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleGuardar}
            disabled={guardando}
            className="flex-1 text-sm font-semibold text-brand-foreground bg-brand hover:bg-brand-strong py-2.5 disabled:opacity-50"
          >
            {guardando ? "Guardando..." : "Registrar"}
          </button>
        </div>
      </div>
    </div>
  );
}
