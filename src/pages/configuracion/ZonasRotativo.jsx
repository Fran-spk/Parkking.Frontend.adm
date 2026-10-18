import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2, RotateCcw } from "lucide-react";
import FilterSelect, { fieldClass } from "../../components/layout/FilterSelect";
import Checkbox from "../../components/layout/Check";
import Paginacion, { paginaDe } from "../../components/layout/Paginacion";
import { PageHeaderAction } from "../../components/layout/PageHeader";
import { zonaRotativoService } from "../../services/zonaRotativoService";
import { tipoVehiculoService } from "../../services/tipoVehiculoService";

function errorDe(e, fallback) {
  const msg = e.response?.data;
  return typeof msg === "string" ? msg : fallback;
}

const ICONO = "pk-icon-btn p-1.5 text-ink-faint hover:text-ink hover:bg-surface-muted";

export default function ZonasRotativo({ embedded = true }) {
  const [zonas, setZonas] = useState([]);
  const [tipos, setTipos] = useState([]);
  const [inactivas, setInactivas] = useState(false);
  const [nombre, setNombre] = useState("");
  const [tope, setTope] = useState("");
  const [mostrarAlta, setMostrarAlta] = useState(false);
  const [tipoPorZona, setTipoPorZona] = useState({});
  const [error, setError] = useState(null);
  const [pagina, setPagina] = useState(1);

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
    setPagina(1);
  }, [inactivas]);

  useEffect(() => {
    tipoVehiculoService
      .getAll()
      .then((d) => setTipos((d || []).filter((t) => t.activo !== false)))
      .catch(() => {});
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
      setMostrarAlta(false);
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

  const visPage = useMemo(() => paginaDe(zonas, pagina), [zonas, pagina]);

  return (
    <div className={embedded ? "space-y-4" : "space-y-5"}>
      <div className="flex flex-wrap items-center gap-3">
        <p className="pk-caption flex-1 min-w-[12rem]">
          Zonas del rotativo, no de las cocheras. Sin tope no se rechaza por cantidad. Sin tipos admite todos.
        </p>
        <PageHeaderAction onClick={() => setMostrarAlta((v) => !v)}>
          <Plus size={16} /> Nueva
        </PageHeaderAction>
      </div>

      {error && <p className="px-4 py-3 bg-danger-muted text-danger-ink text-sm">{error}</p>}

      {mostrarAlta && (
        <form onSubmit={agregar} className="bg-surface-card px-4 py-4 flex flex-wrap gap-2">
          <div className="w-48">
            <input required placeholder="Nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} className={fieldClass} />
          </div>
          <div className="w-24">
            <input type="number" min="1" placeholder="Tope" value={tope} onChange={(e) => setTope(e.target.value)} className={fieldClass} />
          </div>
          <button type="submit" className="inline-flex items-center gap-1.5 bg-brand text-brand-foreground text-xs font-semibold px-4 py-2.5">
            <Plus size={15} /> Agregar
          </button>
        </form>
      )}

      <label className="flex items-center gap-2 pk-caption font-semibold cursor-pointer select-none w-fit">
        <Checkbox checked={inactivas} onChange={(e) => setInactivas(e.target.checked)} />
        Ver dadas de baja
      </label>

      {zonas.length === 0 ? (
        <div className="bg-surface-card px-4 py-16 text-center text-sm font-medium text-ink-muted">No hay zonas de rotativo</div>
      ) : (
        <>
          <div className="bg-surface-card overflow-x-auto">
            <table className="w-full text-sm table-fixed">
              <colgroup>
                <col className="w-[22%]" />
                <col className="w-[12%]" />
                <col className="w-[48%]" />
                <col className="w-[10%]" />
                <col className="w-[8%]" />
              </colgroup>
              <thead>
                <tr className="border-b border-line-strong text-left">
                  <th className="pk-label font-bold pl-4 pr-3 py-2.5">Zona</th>
                  <th className="pk-label font-bold px-3 py-2.5">Tope</th>
                  <th className="pk-label font-bold px-3 py-2.5">Tipos</th>
                  <th className="pk-label font-bold px-3 py-2.5">Estado</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {visPage.map((zona) => {
                  const inactiva = !zona.activa;
                  return (
                    <tr key={zona.zonaRotativoId} className={`border-b border-line ${inactiva ? "opacity-55" : "hover:bg-surface-page"}`}>
                      <td className={`pl-4 pr-3 py-2.5 overflow-hidden border-l-[3px] ${inactiva ? "border-l-transparent" : "border-l-brand"}`}>
                        <p className="font-semibold text-ink truncate">{zona.nombre}</p>
                      </td>
                      <td className="px-3 py-2.5">
                        <p className="pk-caption tabular-nums">{zona.tope ? zona.tope : "Sin tope"}</p>
                      </td>
                      <td className="px-3 py-2.5">
                        {zona.activa ? (
                          <div className="flex flex-wrap gap-1.5 items-center">
                            {(zona.tipos || []).length === 0 && <span className="pk-caption">Todos</span>}
                            {(zona.tipos || []).map((t) => (
                              <button
                                key={t.zonaRotativoTipoId}
                                type="button"
                                className="text-[11px] font-semibold bg-surface-muted px-1.5 py-0.5 text-ink"
                                onClick={() => quitarTipo(t.zonaRotativoTipoId)}
                              >
                                {t.tipoVehiculoNombre} ×
                              </button>
                            ))}
                            <FilterSelect
                              ariaLabel="Tipo de vehículo"
                              value={tipoPorZona[zona.zonaRotativoId] || ""}
                              onChange={(v) => setTipoPorZona((prev) => ({ ...prev, [zona.zonaRotativoId]: v }))}
                              options={[{ value: "", label: "Tipo" }, ...tipos.map((t) => ({ value: t.tipoVehiculoId, label: t.nombre }))]}
                            />
                            <button type="button" className="text-xs font-semibold text-brand" onClick={() => sumarTipo(zona)}>
                              Agregar
                            </button>
                          </div>
                        ) : (
                          <p className="pk-caption truncate">
                            {(zona.tipos || []).length === 0 ? "Todos" : zona.tipos.map((t) => t.tipoVehiculoNombre).join(", ")}
                          </p>
                        )}
                      </td>
                      <td className="px-3 py-2.5">
                        <p className={`text-sm font-semibold ${inactiva ? "text-ink-faint" : "text-success-ink"}`}>
                          {inactiva ? "De baja" : "Activa"}
                        </p>
                      </td>
                      <td className="pl-2 pr-3 py-2.5">
                        <div className="flex items-center justify-end">
                          {zona.activa ? (
                            <button type="button" title="Dar de baja" className={`${ICONO} hover:text-danger-ink`} onClick={() => baja(zona)}>
                              <Trash2 size={15} />
                            </button>
                          ) : (
                            <button type="button" title="Reactivar" className={ICONO} onClick={() => reactivar(zona)}>
                              <RotateCcw size={15} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <Paginacion pagina={pagina} total={zonas.length} onChange={setPagina} />
        </>
      )}
    </div>
  );
}
