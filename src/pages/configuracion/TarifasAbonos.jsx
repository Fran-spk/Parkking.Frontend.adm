import { useState, useEffect } from "react";
import { Pencil, Check, X, Clock } from "lucide-react";
import { tarifaMensualService } from "../../services/tarifaMensualService";
import { tipoVehiculoService } from "../../services/tipoVehiculoService";
import { categoriaCocheraService } from "../../services/categoriaCocheraService";
import { PERIODICIDAD, PERIODICIDAD_OPTIONS } from "../../utils/periodicidadHelpers";
import { fieldClass } from "../../components/layout/FilterSelect";
import FiltroSegmentado from "../../components/layout/FiltroSegmentado";

function formatPrecio(precio) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(precio);
}

function formatFecha(fecha) {
  if (!fecha) return null;
  return new Date(fecha).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function tarifaKey(tipoId, catId, periodicidad) {
  return `${tipoId}_${catId}_${periodicidad}`;
}

function ModalHistorial({ tipo, categoria, periodicidadCobro, onClose }) {
  const [historial, setHistorial] = useState([]);
  const [loading, setLoading] = useState(true);
  const periodicidadLabel =
    PERIODICIDAD_OPTIONS.find((o) => o.value === Number(periodicidadCobro))?.label || "Mensual";

  useEffect(() => {
    tarifaMensualService
      .getHistorial(tipo.tipoVehiculoId, categoria.categoriaCocheraId, periodicidadCobro)
      .then(setHistorial)
      .finally(() => setLoading(false));
  }, [tipo.tipoVehiculoId, categoria.categoriaCocheraId, periodicidadCobro]);

  return (
    <div className="fixed inset-0 bg-ink/20 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-surface-card border border-line p-6 w-full max-w-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-ink">Historial de precios</h2>
            <p className="pk-caption mt-0.5">
              {tipo.nombre} — {categoria.nombre} · {periodicidadLabel}
            </p>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 text-ink-faint hover:text-ink" aria-label="Cerrar">
            <X size={16} />
          </button>
        </div>

        {loading ? (
          <p className="text-xs text-ink-faint py-4">Cargando...</p>
        ) : historial.length === 0 ? (
          <p className="text-xs text-ink-faint py-4">Sin historial</p>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {historial.map((t, i) => (
              <div
                key={t.tarifaMensualId}
                className={`flex items-center justify-between px-4 py-3 border ${
                  i === 0 ? "bg-brand-muted border-brand/20" : "bg-surface-muted border-line-subtle"
                }`}
              >
                <div>
                  <p className={`text-xs font-bold ${i === 0 ? "text-brand" : "text-ink"}`}>{formatPrecio(t.precio)}</p>
                  <p className="pk-caption mt-0.5">{formatFecha(t.fechaActualizacion)}</p>
                </div>
                {i === 0 && <span className="text-[8px] font-bold uppercase tracking-wider text-brand">Vigente</span>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

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
    <td className="px-3 py-2.5 align-middle border-b border-line">
      {editando ? (
        <div className="flex items-center gap-1.5">
          <div className="flex-1">
            <input
              autoFocus
              type="number"
              value={precio}
              onChange={(e) => {
                setPrecio(e.target.value);
                setError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") guardar();
                if (e.key === "Escape") setEditando(false);
              }}
              placeholder="0"
              className={fieldClass}
            />
            {error && <p className="text-[10px] text-danger font-bold mt-1">{error}</p>}
          </div>
          <button type="button" onClick={guardar} disabled={guardando} className="pk-icon-btn p-1.5 text-success" aria-label="Guardar">
            <Check size={14} />
          </button>
          <button type="button" onClick={() => setEditando(false)} className="pk-icon-btn p-1.5 text-ink-faint" aria-label="Cancelar">
            <X size={14} />
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2 group/celda">
          <div className="flex-1 min-h-[32px] flex flex-col justify-center">
            {tarifaVigente ? (
              <>
                <p className="text-xs font-bold text-ink">{formatPrecio(tarifaVigente.precio)}</p>
                <p className="pk-caption">{formatFecha(tarifaVigente.fechaActualizacion)}</p>
              </>
            ) : (
              <p className="text-xs text-ink-faint">Sin precio</p>
            )}
          </div>
          <div className="flex gap-0.5 opacity-0 group-hover/celda:opacity-100 transition-opacity">
            {tarifaVigente && (
              <button
                type="button"
                onClick={() => setVerHistorial(true)}
                className="pk-icon-btn p-1.5 text-ink-faint hover:text-brand"
                title="Historial"
              >
                <Clock size={13} />
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setPrecio(tarifaVigente?.precio ?? "");
                setEditando(true);
                setError(null);
              }}
              className="pk-icon-btn p-1.5 text-ink-faint hover:text-warning"
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

export default function TarifasAbonos({ embedded = false }) {
  const [tipos, setTipos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [tarifasMap, setTarifasMap] = useState({});
  const [periodicidad, setPeriodicidad] = useState(PERIODICIDAD.MENSUAL);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    cargar();
  }, []);

  useEffect(() => {
    if (loading) return;
    tarifaMensualService
      .getVigentes(periodicidad)
      .then((vigentes) => {
        const mapa = {};
        (vigentes || []).forEach((t) => {
          mapa[tarifaKey(t.tipoVehiculoId, t.categoriaCocheraId, t.periodicidadCobro)] = t;
        });
        setTarifasMap((prev) => {
          const next = { ...prev };
          Object.keys(next).forEach((k) => {
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
      (vigentes || []).forEach((t) => {
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
    setTarifasMap((prev) => ({
      ...prev,
      [tarifaKey(tipoId, catId, periodicidadCobro)]: nuevaTarifa,
    }));
  }

  if (loading) return <p className="pk-desc p-2">Cargando...</p>;

  if (categorias.length === 0) {
    return (
      <div className="bg-surface-card px-4 py-16 text-center text-sm font-medium text-ink-muted">
        No hay categorías de cochera. Cargalas en Catálogos.
      </div>
    );
  }

  if (tipos.length === 0) {
    return (
      <div className="bg-surface-card px-4 py-16 text-center text-sm font-medium text-ink-muted">
        No hay tipos de vehículo. Cargalos en Catálogos.
      </div>
    );
  }

  return (
    <div className={embedded ? "space-y-4" : "space-y-5"}>
      <FiltroSegmentado
        ariaLabel="Periodicidad"
        value={periodicidad}
        onChange={setPeriodicidad}
        opciones={PERIODICIDAD_OPTIONS}
      />

      {error && <div className="px-4 py-2.5 bg-danger-muted text-danger text-xs font-semibold">{error}</div>}

      <div className="bg-surface-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line-strong text-left">
              <th className="pk-label font-bold pl-4 pr-3 py-2.5 w-48">Tipo de vehículo</th>
              {categorias.map((cat) => (
                <th key={cat.categoriaCocheraId} className="pk-label font-bold px-3 py-2.5">
                  {cat.nombre}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tipos.map((tipo) => (
              <tr key={tipo.tipoVehiculoId} className="hover:bg-surface-page">
                <td className="pl-4 pr-3 py-2.5 border-b border-line border-l-[3px] border-l-brand">
                  <p className="font-semibold text-ink">{tipo.nombre}</p>
                </td>
                {categorias.map((cat) => (
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
  );
}
