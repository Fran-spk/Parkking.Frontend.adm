import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, Check, X, RotateCcw, Banknote } from "lucide-react";
import { metodoDePagoService } from "../../services/metodoDePagoService";

export default function MetodosDePago({ embedded = false }) {
  const [metodos, setMetodos] = useState([]);
  const [mostrarInactivos, setMostrarInactivos] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [editandoId, setEditandoId] = useState(null);
  const [editandoNombre, setEditandoNombre] = useState("");
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    cargar();
  }, [mostrarInactivos]);

  async function cargar() {
    try {
      setError(null);
      const data = await metodoDePagoService.getAll(mostrarInactivos);
      setMetodos(Array.isArray(data) ? data : []);
    } catch {
      setError("No se pudieron cargar los métodos de pago");
    } finally {
      setLoading(false);
    }
  }

  async function handleAgregar() {
    if (!nuevoNombre.trim()) return;
    try {
      setGuardando(true);
      setError(null);
      await metodoDePagoService.agregar(nuevoNombre.trim());
      setNuevoNombre("");
      await cargar();
    } catch (e) {
      const msg = e.response?.data;
      setError(typeof msg === "string" ? msg : "No se pudo agregar");
    } finally {
      setGuardando(false);
    }
  }

  async function handleModificar(id) {
    if (!editandoNombre.trim()) return;
    try {
      setGuardando(true);
      setError(null);
      await metodoDePagoService.modificar(id, editandoNombre.trim());
      setEditandoId(null);
      await cargar();
    } catch (e) {
      const msg = e.response?.data;
      setError(typeof msg === "string" ? msg : "No se pudo modificar");
    } finally {
      setGuardando(false);
    }
  }

  async function handleDarDeBaja(metodo) {
    if (!confirm(`¿Dar de baja "${metodo.nombre}"?`)) return;
    try {
      setError(null);
      await metodoDePagoService.darDeBaja(metodo.metodoDePagoId);
      await cargar();
    } catch (e) {
      const msg = e.response?.data;
      setError(typeof msg === "string" ? msg : "No se pudo dar de baja");
    }
  }

  async function handleReactivar(metodo) {
    try {
      setError(null);
      await metodoDePagoService.reactivar(metodo.metodoDePagoId);
      await cargar();
    } catch (e) {
      const msg = e.response?.data;
      setError(typeof msg === "string" ? msg : "No se pudo reactivar");
    }
  }

  function iniciarEdicion(metodo) {
    setEditandoId(metodo.metodoDePagoId);
    setEditandoNombre(metodo.nombre);
    setError(null);
  }

  function cancelarEdicion() {
    setEditandoId(null);
    setEditandoNombre("");
    setError(null);
  }

  return (
    <div className={embedded ? "space-y-4" : "space-y-6 animate-fade-in-up"}>
      {!embedded && (
        <div>
          <h1 className="pk-title">Métodos de pago</h1>
          <p className="pk-desc mt-1">
            Definí cómo se pueden cobrar los abonos. La baja es lógica: los cobros ya hechos conservan el método.
          </p>
        </div>
      )}

      <div className="bg-surface-card p-5 rounded-2xl border border-line-subtle shadow-pk-card space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-line-subtle">
          <span className="pk-label flex items-center gap-2">
            <Banknote size={13} /> Listado
          </span>
          <label className="flex items-center gap-2 text-xs font-semibold text-ink-muted cursor-pointer select-none">
            <input
              type="checkbox"
              checked={mostrarInactivos}
              onChange={(e) => setMostrarInactivos(e.target.checked)}
              className="rounded border-line-strong text-brand focus:ring-brand h-3.5 w-3.5"
            />
            Mostrar dados de baja
          </label>
        </div>

        {error && (
          <div className="px-4 py-2.5 bg-danger-muted text-danger text-xs font-semibold rounded-xl border border-danger/20">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-xs text-ink-faint font-semibold py-4">Cargando...</div>
        ) : (
          <div className="space-y-2">
            {metodos.length === 0 && (
              <p className="text-xs text-ink-faint font-medium py-4">No hay métodos de pago cargados</p>
            )}
            {metodos.map((metodo) => {
              const inactivo = !metodo.activo;
              return (
                <div
                  key={metodo.metodoDePagoId}
                  className={`flex items-center gap-3 border rounded-xl px-4 py-3 transition-all ${
                    inactivo
                      ? "bg-surface-muted/50 border-line-subtle opacity-60"
                      : "bg-surface-card border-line-subtle hover:border-line"
                  }`}
                >
                  {editandoId === metodo.metodoDePagoId ? (
                    <>
                      <input
                        autoFocus
                        value={editandoNombre}
                        onChange={(e) => setEditandoNombre(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleModificar(metodo.metodoDePagoId);
                          if (e.key === "Escape") cancelarEdicion();
                        }}
                        className="flex-1 text-xs font-medium border border-line rounded-xl px-3 py-2 focus:outline-none focus:border-brand focus:bg-surface-card text-ink"
                      />
                      <button
                        onClick={() => handleModificar(metodo.metodoDePagoId)}
                        disabled={guardando}
                        className="p-2 rounded-lg text-success hover:bg-success-muted transition-colors"
                      >
                        <Check size={16} />
                      </button>
                      <button
                        onClick={cancelarEdicion}
                        className="p-2 rounded-lg text-ink-faint hover:bg-surface-muted transition-colors"
                      >
                        <X size={16} />
                      </button>
                    </>
                  ) : (
                    <>
                      <span
                        className={`flex-1 text-xs font-bold ${inactivo ? "text-ink-faint" : "text-ink"}`}
                      >
                        {metodo.nombre}
                      </span>
                      {inactivo && (
                        <span className="text-[10px] bg-surface-muted text-ink-muted px-2 py-0.5 rounded-full font-bold">
                          Baja
                        </span>
                      )}
                      {inactivo ? (
                        <button
                          onClick={() => handleReactivar(metodo)}
                          title="Reactivar"
                          className="p-1.5 rounded-lg text-ink-faint hover:text-success hover:bg-success-muted transition-colors"
                        >
                          <RotateCcw size={15} />
                        </button>
                      ) : (
                        <div className="flex gap-1">
                          <button
                            onClick={() => iniciarEdicion(metodo)}
                            className="p-1.5 rounded-lg text-ink-faint hover:text-warning hover:bg-warning-muted transition-colors"
                            title="Editar"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            onClick={() => handleDarDeBaja(metodo)}
                            className="p-1.5 rounded-lg text-ink-faint hover:text-danger hover:bg-danger-muted transition-colors"
                            title="Dar de Baja"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {!mostrarInactivos && (
          <div className="flex gap-2 pt-3 border-t border-line-subtle">
            <input
              type="text"
              value={nuevoNombre}
              onChange={(e) => setNuevoNombre(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAgregar()}
              placeholder="Ej: Mercado Pago, Cheque..."
              className="flex-1 text-xs font-semibold border border-line rounded-xl px-4 py-2.5 bg-surface-muted/50 focus:outline-none focus:border-brand focus:bg-surface-card transition-all text-ink"
            />
            <button
              onClick={handleAgregar}
              disabled={guardando || !nuevoNombre.trim()}
              className="flex items-center gap-1.5 bg-brand hover:bg-brand-strong text-brand-foreground text-xs font-bold px-4 py-2.5 rounded-xl transition-colors disabled:opacity-50"
            >
              <Plus size={15} />
              Agregar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
