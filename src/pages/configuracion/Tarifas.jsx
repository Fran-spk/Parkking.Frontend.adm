import { useState, useEffect } from "react";
import { Pencil, Check, X, Clock } from "lucide-react";
import { tarifaMensualService } from "../../services/tarifaMensualService";
import { tipoVehiculoService } from "../../services/tipoVehiculoService";
import { categoriaCocheraService } from "../../services/categoriaCocheraService";
import { PERIODICIDAD, PERIODICIDAD_OPTIONS } from "../../utils/periodicidadHelpers";

function formatPrecio(precio) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency", currency: "ARS", maximumFractionDigits: 0,
  }).format(precio);
}

function formatFecha(fecha) {
  if (!fecha) return null;
  return new Date(fecha).toLocaleDateString("es-AR", {
    day: "2-digit", month: "2-digit", year: "numeric",
  });
}

function tarifaKey(tipoId, catId, periodicidad) {
  return `${tipoId}_${catId}_${periodicidad}`;
}

// ─── Modal historial ──────────────────────────────────────────────────────────
function ModalHistorial({ tipo, categoria, periodicidadCobro, onClose }) {
  const [historial, setHistorial] = useState([]);
  const [loading, setLoading] = useState(true);
  const periodicidadLabel =
    PERIODICIDAD_OPTIONS.find(o => o.value === Number(periodicidadCobro))?.label || "Mensual";

  useEffect(() => {
    tarifaMensualService
      .getHistorial(tipo.tipoVehiculoId, categoria.categoriaCocheraId, periodicidadCobro)
      .then(setHistorial)
      .finally(() => setLoading(false));
  }, [tipo.tipoVehiculoId, categoria.categoriaCocheraId, periodicidadCobro]);

  return (
    <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in-up">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.08)] p-6 w-full max-w-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-gray-900">Historial de precios</h2>
            <p className="text-[10px] text-gray-400 font-bold mt-0.5">
              {tipo.nombre} — {categoria.nombre} · {periodicidadLabel}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-50 rounded-lg text-gray-400 transition-colors">
            <X size={16} />
          </button>
        </div>

        {loading ? (
          <div className="text-xs text-gray-400 font-semibold py-4">Cargando...</div>
        ) : historial.length === 0 ? (
          <p className="text-xs text-gray-400 font-medium py-4">Sin historial</p>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {historial.map((t, i) => (
              <div
                key={t.tarifaMensualId}
                className={`flex items-center justify-between px-4 py-3 rounded-xl ${
                  i === 0 ? "bg-indigo-50/50 border border-indigo-100" : "bg-slate-50 border border-slate-100"
                }`}
              >
                <div>
                  <p className={`text-xs font-bold ${i === 0 ? "text-indigo-700" : "text-gray-700"}`}>
                    {formatPrecio(t.precio)}
                  </p>
                  <p className="text-[9px] text-gray-400 font-bold mt-0.5">{formatFecha(t.fechaActualizacion)}</p>
                </div>
                {i === 0 && (
                  <span className="text-[8px] bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                    Vigente
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Celda editable ───────────────────────────────────────────────────────────
function CeldaTarifa({ tipo, categoria, periodicidadCobro, tarifaVigente, onActualizar }) {
  const [editando, setEditando] = useState(false);
  const [precio, setPrecio] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);
  const [verHistorial, setVerHistorial] = useState(false);

  async function guardar() {
    if (!precio || isNaN(Number(precio)) || Number(precio) <= 0) {
      setError("Precio inválido");
      return;
    }
    try {
      setGuardando(true);
      const nueva = await tarifaMensualService.agregar(
        tipo.tipoVehiculoId,
        categoria.categoriaCocheraId,
        periodicidadCobro,
        precio,
      );
      onActualizar(tipo.tipoVehiculoId, categoria.categoriaCocheraId, periodicidadCobro, nueva);
      setEditando(false);
    } catch (e) {
      const msg = e.response?.data;
      setError(typeof msg === "string" ? msg : "Error al guardar");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <td className="px-4 py-3.5 align-middle border-b border-gray-50">
      {editando ? (
        <div className="flex items-center gap-1.5">
          <div className="flex-1">
            <input
              autoFocus
              type="number"
              value={precio}
              onChange={e => { setPrecio(e.target.value); setError(null); }}
              onKeyDown={e => { if (e.key === "Enter") guardar(); if (e.key === "Escape") setEditando(false); }}
              placeholder="0"
              className="w-full text-xs font-semibold border border-gray-200 rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 focus:bg-white text-gray-800"
            />
            {error && <p className="text-[10px] text-red-500 font-bold mt-1">{error}</p>}
          </div>
          <button onClick={guardar} disabled={guardando} className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors">
            <Check size={14} />
          </button>
          <button onClick={() => setEditando(false)} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors">
            <X size={14} />
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2 group/celda">
          <div className="flex-1 min-h-[32px] flex flex-col justify-center">
            {tarifaVigente ? (
              <>
                <p className="text-xs font-bold text-gray-800">{formatPrecio(tarifaVigente.precio)}</p>
                <p className="text-[9px] text-gray-400 font-bold">{formatFecha(tarifaVigente.fechaActualizacion)}</p>
              </>
            ) : (
              <p className="text-xs text-gray-300 font-medium">Sin precio</p>
            )}
          </div>
          <div className="flex gap-0.5 opacity-0 group-hover/celda:opacity-100 transition-opacity">
            {tarifaVigente && (
              <button
                onClick={() => setVerHistorial(true)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                title="Historial"
              >
                <Clock size={13} />
              </button>
            )}
            <button
              onClick={() => { setPrecio(tarifaVigente?.precio ?? ""); setEditando(true); setError(null); }}
              className="p-1.5 rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
              title="Editar"
            >
              <Pencil size={13} />
            </button>
          </div>
        </div>
      )}

      {verHistorial && (
        <ModalHistorial
          tipo={tipo}
          categoria={categoria}
          periodicidadCobro={periodicidadCobro}
          onClose={() => setVerHistorial(false)}
        />
      )}
    </td>
  );
}

// ─── Vista principal ──────────────────────────────────────────────────────────
export default function Tarifas() {
  const [tipos, setTipos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [tarifasMap, setTarifasMap] = useState({});
  const [periodicidad, setPeriodicidad] = useState(PERIODICIDAD.MENSUAL);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => { cargar(); }, []);

  useEffect(() => {
    if (loading) return;
    tarifaMensualService
      .getVigentes(periodicidad)
      .then(vigentes => {
        const mapa = {};
        (vigentes || []).forEach(t => {
          mapa[tarifaKey(t.tipoVehiculoId, t.categoriaCocheraId, t.periodicidadCobro)] = t;
        });
        setTarifasMap(prev => {
          const next = { ...prev };
          Object.keys(next).forEach(k => {
            if (k.endsWith(`_${periodicidad}`)) delete next[k];
          });
          return { ...next, ...mapa };
        });
      })
      .catch(() => setError("No se pudo cargar las tarifas de esta periodicidad"));
  }, [periodicidad]);

  async function cargar() {
    try {
      setError(null);
      const [tiposData, categoriasData, vigentes] = await Promise.all([
        tipoVehiculoService.getAll(),
        categoriaCocheraService.getAll(),
        tarifaMensualService.getVigentes(PERIODICIDAD.MENSUAL),
      ]);

      const mapa = {};
      (vigentes || []).forEach(t => {
        mapa[tarifaKey(t.tipoVehiculoId, t.categoriaCocheraId, t.periodicidadCobro ?? PERIODICIDAD.MENSUAL)] = t;
      });

      setTipos(tiposData);
      setCategorias(categoriasData);
      setTarifasMap(mapa);
    } catch {
      setError("No se pudo cargar las tarifas");
    } finally {
      setLoading(false);
    }
  }

  function getTarifa(tipoId, catId) {
    return tarifasMap[tarifaKey(tipoId, catId, periodicidad)] ?? null;
  }

  function onActualizar(tipoId, catId, periodicidadCobro, nuevaTarifa) {
    setTarifasMap(prev => ({
      ...prev,
      [tarifaKey(tipoId, catId, periodicidadCobro)]: nuevaTarifa,
    }));
  }

  if (loading) return <div className="text-xs text-gray-400 font-semibold p-6">Cargando...</div>;

  if (categorias.length === 0) return (
    <div className="text-center py-10 bg-white border border-gray-100 rounded-2xl p-6">
      <p className="text-xs font-bold text-gray-400">No hay categorías de cochera configuradas</p>
      <p className="text-[10px] text-gray-300 font-bold mt-1">Agregá categorías en la pestaña correspondiente para configurar tarifas.</p>
    </div>
  );

  if (tipos.length === 0) return (
    <div className="text-center py-10 bg-white border border-gray-100 rounded-2xl p-6">
      <p className="text-xs font-bold text-gray-400">No hay tipos de vehículo configurados</p>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Tarifas</h1>
        <p className="text-sm text-gray-500 mt-1">
          Precio de lista por tipo de vehículo, categoría de cochera y periodicidad de cobro.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {PERIODICIDAD_OPTIONS.map(opt => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setPeriodicidad(opt.value)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-colors ${
              periodicidad === opt.value
                ? "bg-slate-900 text-white border-slate-900"
                : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="px-4 py-2.5 bg-red-50 text-red-600 text-xs font-semibold rounded-xl border border-red-100">
          {error}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-50 bg-slate-50/50">
                <th className="text-left text-xs font-bold text-gray-400 px-6 py-4 uppercase tracking-wider w-48">
                  Tipo de vehículo
                </th>
                {categorias.map(cat => (
                  <th key={cat.categoriaCocheraId} className="text-left text-xs font-bold text-gray-400 px-4 py-4 uppercase tracking-wider">
                    {cat.nombre}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {tipos.map(tipo => (
                <tr key={tipo.tipoVehiculoId} className="hover:bg-slate-50/30 transition-colors">
                  <td className="px-6 py-4 border-b border-gray-50">
                    <p className="text-xs font-bold text-gray-800">{tipo.nombre}</p>
                  </td>
                  {categorias.map(cat => (
                    <CeldaTarifa
                      key={`${cat.categoriaCocheraId}_${periodicidad}`}
                      tipo={tipo}
                      categoria={cat}
                      periodicidadCobro={periodicidad}
                      tarifaVigente={getTarifa(tipo.tipoVehiculoId, cat.categoriaCocheraId)}
                      onActualizar={onActualizar}
                    />
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
