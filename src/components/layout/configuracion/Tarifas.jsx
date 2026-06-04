import { useState, useEffect } from "react";
import { Pencil, Check, X, Clock } from "lucide-react";
import { tarifaMensualService } from "../../../services/tarifaMensualService";
import { tipoVehiculoService } from "../../../services/tipoVehiculoService";
import { categoriaCocheraService } from "../../../services/categoriaCocheraService";

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

// ─── Modal historial ──────────────────────────────────────────────────────────
function ModalHistorial({ tipo, categoria, onClose }) {
  const [historial, setHistorial] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    tarifaMensualService
      .getHistorial(tipo.tipoVehiculoId, categoria.categoriaCocheraId)
      .then(setHistorial)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Historial de precios</h2>
            <p className="text-xs text-gray-400 mt-0.5">{tipo.nombre} — {categoria.nombre}</p>
          </div>
          <button onClick={onClose}><X size={18} className="text-gray-400" /></button>
        </div>

        {loading ? (
          <div className="text-sm text-gray-400">Cargando...</div>
        ) : historial.length === 0 ? (
          <p className="text-sm text-gray-400">Sin historial</p>
        ) : (
          <div className="space-y-2">
            {historial.map((t, i) => (
              <div
                key={t.tarifaMensualId}
                className={`flex items-center justify-between px-3 py-2.5 rounded-lg ${
                  i === 0 ? "bg-indigo-50 border border-indigo-100" : "bg-gray-50"
                }`}
              >
                <div>
                  <p className={`text-sm font-medium ${i === 0 ? "text-indigo-700" : "text-gray-700"}`}>
                    {formatPrecio(t.precio)}
                  </p>
                  <p className="text-xs text-gray-400">{formatFecha(t.fechaActualizacion)}</p>
                </div>
                {i === 0 && (
                  <span className="text-xs bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full font-medium">
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
function CeldaTarifa({ tipo, categoria, tarifaVigente, onActualizar }) {
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
        precio,
      );
      onActualizar(tipo.tipoVehiculoId, categoria.categoriaCocheraId, nueva);
      setEditando(false);
    } catch (e) {
      const msg = e.response?.data;
      setError(typeof msg === "string" ? msg : "Error al guardar");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <td className="px-4 py-3 align-middle">
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
              className="w-full text-sm border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
            />
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
          </div>
          <button onClick={guardar} disabled={guardando} className="p-1.5 rounded-lg text-green-600 hover:bg-green-50">
            <Check size={14} />
          </button>
          <button onClick={() => setEditando(false)} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100">
            <X size={14} />
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2 group/celda">
          <div className="flex-1">
            {tarifaVigente ? (
              <>
                <p className="text-sm font-medium text-gray-800">{formatPrecio(tarifaVigente.precio)}</p>
                <p className="text-xs text-gray-400">{formatFecha(tarifaVigente.fechaActualizacion)}</p>
              </>
            ) : (
              <p className="text-sm text-gray-300">Sin precio</p>
            )}
          </div>
          <div className="flex gap-1 opacity-0 group-hover/celda:opacity-100 transition-opacity">
            {tarifaVigente && (
              <button
                onClick={() => setVerHistorial(true)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50"
              >
                <Clock size={13} />
              </button>
            )}
            <button
              onClick={() => { setPrecio(tarifaVigente?.precio ?? ""); setEditando(true); setError(null); }}
              className="p-1.5 rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50"
            >
              <Pencil size={13} />
            </button>
          </div>
        </div>
      )}

      {verHistorial && (
        <ModalHistorial tipo={tipo} categoria={categoria} onClose={() => setVerHistorial(false)} />
      )}
    </td>
  );
}

// ─── Vista principal ──────────────────────────────────────────────────────────
export default function Tarifas() {
  const [tipos, setTipos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [tarifasMap, setTarifasMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => { cargar(); }, []);

  async function cargar() {
    try {
      setError(null);
      const [tiposData, categoriasData, vigentes] = await Promise.all([
        tipoVehiculoService.getAll(),
        categoriaCocheraService.getAll(),
        tarifaMensualService.getVigentes(),
      ]);

      const mapa = {};
      vigentes.forEach(t => {
        const key = `${t.tipoVehiculoId}_${t.categoriaCocheraId}`;
        mapa[key] = t;
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
    return tarifasMap[`${tipoId}_${catId}`] ?? null;
  }

  function onActualizar(tipoId, catId, nuevaTarifa) {
    setTarifasMap(prev => ({ ...prev, [`${tipoId}_${catId}`]: nuevaTarifa }));
  }

  if (loading) return <div className="text-sm text-gray-400">Cargando...</div>;

  if (categorias.length === 0) return (
    <div className="text-center py-10">
      <p className="text-sm text-gray-400">No hay categorías de cochera configuradas</p>
      <p className="text-xs text-gray-300 mt-1">Agregá categorías en la tab correspondiente para configurar tarifas</p>
    </div>
  );

  if (tipos.length === 0) return (
    <div className="text-center py-10">
      <p className="text-sm text-gray-400">No hay tipos de vehículo configurados</p>
    </div>
  );

  return (
    <div>
      <div className="mb-5">
        <h2 className="text-base font-semibold text-gray-800">Tarifas mensuales</h2>
        <p className="text-xs text-gray-400 mt-0.5">Hover sobre cada celda para editar o ver historial</p>
      </div>

      {error && (
        <div className="mb-4 px-4 py-2.5 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
          {error}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left text-xs font-medium text-gray-400 px-4 py-3 w-40">
                Tipo de vehículo
              </th>
              {categorias.map(cat => (
                <th key={cat.categoriaCocheraId} className="text-left text-xs font-medium text-gray-400 px-4 py-3">
                  {cat.nombre}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tipos.map(tipo => (
              <tr key={tipo.tipoVehiculoId} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3">
                  <p className="text-sm font-medium text-gray-800">{tipo.nombre}</p>
                </td>
                {categorias.map(cat => (
                  <CeldaTarifa
                    key={cat.categoriaCocheraId}
                    tipo={tipo}
                    categoria={cat}
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
  );
}