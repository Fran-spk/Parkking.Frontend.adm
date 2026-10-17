import { useEffect, useState } from "react";
import { Plus, Trash2, RotateCcw } from "lucide-react";
import { fieldClass } from "../../components/layout/FilterSelect";
import FilterSelect from "../../components/layout/FilterSelect";
import Checkbox from "../../components/layout/Check";
import { zonaRotativoService } from "../../services/zonaRotativoService";
import { tipoVehiculoService } from "../../services/tipoVehiculoService";

function errorDe(e, fallback) {
  const msg = e.response?.data;
  return typeof msg === "string" ? msg : fallback;
}

export default function ZonasRotativo({ embedded = true }) {
  const [zonas, setZonas] = useState([]);
  const [tipos, setTipos] = useState([]);
  const [inactivas, setInactivas] = useState(false);
  const [nombre, setNombre] = useState("");
  const [tope, setTope] = useState("");
  const [tipoPorZona, setTipoPorZona] = useState({});
  const [error, setError] = useState(null);

  async function cargar() {
    try {
      setError(null);
      const data = await zonaRotativoService.getAll(inactivas);
      setZonas(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(errorDe(e, "No se pudieron cargar las zonas de rotativo"));
    }
  }

  useEffect(() => {
    cargar();
  }, [inactivas]);

  useEffect(() => {
    tipoVehiculoService.getAll().then((d) => setTipos((d || []).filter((t) => t.activo !== false))).catch(() => {});
  }, []);

  async function agregar(e) {
    e.preventDefault();
    try {
      setError(null);
      await zonaRotativoService.agregar({
        nombre: nombre.trim(),
        tope: tope === "" ? null : Number(tope),
      });
      setNombre("");
      setTope("");
      await cargar();
    } catch (err) {
      setError(errorDe(err, "No se pudo agregar la zona"));
    }
  }

  async function baja(zona) {
    if (!confirm(`¿Dar de baja "${zona.nombre}"?`)) return;
    try {
      await zonaRotativoService.darDeBaja(zona.zonaRotativoId);
      await cargar();
    } catch (e) {
      setError(errorDe(e, "No se pudo dar de baja"));
    }
  }

  async function reactivar(zona) {
    try {
      await zonaRotativoService.reactivar(zona.zonaRotativoId);
      await cargar();
    } catch (e) {
      setError(errorDe(e, "No se pudo reactivar"));
    }
  }

  async function sumarTipo(zona) {
    const tipoVehiculoId = Number(tipoPorZona[zona.zonaRotativoId]);
    if (!tipoVehiculoId) return;
    try {
      await zonaRotativoService.agregarTipo(zona.zonaRotativoId, tipoVehiculoId);
      await cargar();
    } catch (e) {
      setError(errorDe(e, "No se pudo agregar el tipo"));
    }
  }

  async function quitarTipo(id) {
    try {
      await zonaRotativoService.quitarTipo(id);
      await cargar();
    } catch (e) {
      setError(errorDe(e, "No se pudo quitar el tipo"));
    }
  }

  return (
    <div className={embedded ? "space-y-4" : "space-y-6"}>
      <p className="pk-caption">
        Zonas del rotativo. No son las zonas de las cocheras. Sin tope no se rechaza por cantidad. Sin tipos admite todos.
      </p>
      {error && <p className="px-4 py-3 bg-danger-muted text-danger-ink text-sm">{error}</p>}
      <form onSubmit={agregar} className="flex flex-wrap gap-2">
        <input required placeholder="Nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} className={`${fieldClass} w-48`} />
        <input type="number" min="1" placeholder="Tope" value={tope} onChange={(e) => setTope(e.target.value)} className={`${fieldClass} w-24`} />
        <button type="submit" className="inline-flex items-center gap-1 bg-brand text-brand-foreground text-sm font-semibold px-3 py-2">
          <Plus size={14} /> Agregar
        </button>
      </form>
      <label className="flex items-center gap-2 text-xs font-semibold text-ink">
        <Checkbox checked={inactivas} onChange={(e) => setInactivas(e.target.checked)} />
        Mostrar dadas de baja
      </label>
      <div className="space-y-3">
        {zonas.map((zona) => (
          <div key={zona.zonaRotativoId} className="bg-surface-card border border-line px-4 py-3 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-bold text-ink">
                {zona.nombre}
                <span className="ml-2 text-xs font-semibold text-ink-faint">{zona.tope ? `tope ${zona.tope}` : "sin tope"}</span>
                {!zona.activa ? <span className="ml-2 text-[10px] uppercase text-ink-faint">Baja</span> : null}
              </p>
              {zona.activa ? (
                <button type="button" className="p-1 text-ink-muted" aria-label="Dar de baja" onClick={() => baja(zona)}><Trash2 size={15} /></button>
              ) : (
                <button type="button" className="p-1 text-ink-muted" aria-label="Reactivar" onClick={() => reactivar(zona)}><RotateCcw size={15} /></button>
              )}
            </div>
            <p className="text-xs text-ink-faint">
              {(zona.tipos || []).length === 0
                ? "Admite todos los tipos"
                : zona.tipos.map((t) => t.tipoVehiculoNombre).join(", ")}
            </p>
            {zona.activa && (
              <div className="flex flex-wrap gap-2 items-center">
                {(zona.tipos || []).map((t) => (
                  <button key={t.zonaRotativoTipoId} type="button" className="text-[11px] border border-line px-2 py-1" onClick={() => quitarTipo(t.zonaRotativoTipoId)}>
                    {t.tipoVehiculoNombre} ×
                  </button>
                ))}
                <FilterSelect
                  ariaLabel="Tipo de vehículo"
                  value={tipoPorZona[zona.zonaRotativoId] || ""}
                  onChange={(v) => setTipoPorZona((prev) => ({ ...prev, [zona.zonaRotativoId]: v }))}
                  options={[{ value: "", label: "Tipo" }, ...tipos.map((t) => ({ value: t.tipoVehiculoId, label: t.nombre }))]}
                />
                <button type="button" className="text-xs font-semibold text-brand" onClick={() => sumarTipo(zona)}>Agregar tipo</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
