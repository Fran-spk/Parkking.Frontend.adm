import { useEffect, useMemo, useState } from "react";
import { Plus, Pencil, Trash2, RotateCcw } from "lucide-react";
import PageHeader, { PageHeaderAction } from "../../components/layout/PageHeader";
import FilterSelect, { fieldClass } from "../../components/layout/FilterSelect";
import Checkbox from "../../components/layout/Check";
import Paginacion, { paginaDe } from "../../components/layout/Paginacion";
import { tarifaEstadiaService } from "../../services/tarifaEstadiaService";
import { tipoVehiculoService } from "../../services/tipoVehiculoService";

const ICONO = "pk-icon-btn p-1.5 text-ink-faint hover:text-ink hover:bg-surface-muted";

function plata(n) {
  return Number(n || 0).toLocaleString("es-AR", { style: "currency", currency: "ARS" });
}

function errorDe(e, fallback) {
  const msg = e.response?.data;
  return typeof msg === "string" ? msg : fallback;
}

const CIERRE = [
  { value: 0, label: "Sin tope ni día completo" },
  { value: 1, label: "Tope por día" },
  { value: 2, label: "Día completo" },
];

function vacia() {
  return {
    nombre: "",
    tipoVehiculoId: "",
    periodoInicialMinutos: 0,
    cierre: 0,
    importeCierre: "",
    activa: true,
    esFranja: false,
    desde: "",
    hasta: "",
    fracciones: [{ minutos: 60, precio: "", seRepite: false }],
  };
}

function desdeTarifa(t) {
  return {
    nombre: t.nombre,
    tipoVehiculoId: t.tipoVehiculoId,
    periodoInicialMinutos: t.periodoInicialMinutos,
    cierre: Number(t.cierre) || 0,
    importeCierre: t.tope ?? t.precioDia ?? "",
    activa: t.activa,
    esFranja: !!t.esFranja,
    desde: (t.desde || "").slice(0, 5),
    hasta: (t.hasta || "").slice(0, 5),
    fracciones: (t.fracciones || []).map((f) => ({
      minutos: f.minutos,
      precio: f.precio,
      seRepite: f.seRepite,
    })),
  };
}

export default function TarifasEstadia({ embedded = false }) {
  const [tarifas, setTarifas] = useState([]);
  const [tipos, setTipos] = useState([]);
  const [inactivas, setInactivas] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState(null);
  const [error, setError] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [pagina, setPagina] = useState(1);

  async function cargar() {
    try {
      setError(null);
      const data = await tarifaEstadiaService.getAll(inactivas);
      setTarifas(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(errorDe(e, "No se pudieron cargar las tarifas"));
    }
  }

  useEffect(() => {
    cargar();
    setPagina(1);
  }, [inactivas]);

  useEffect(() => {
    tipoVehiculoService.getAll().then((d) => setTipos((d || []).filter((t) => t.activo !== false))).catch(() => {});
  }, []);

  function abrirNueva() {
    const base = vacia();
    base.tipoVehiculoId = tipos[0]?.tipoVehiculoId ?? "";
    setEditando(null);
    setForm(base);
    setError(null);
  }

  function setCampo(campo, valor) {
    setForm((prev) => ({ ...prev, [campo]: valor }));
  }

  function setFraccion(i, campo, valor) {
    setForm((prev) => ({
      ...prev,
      fracciones: prev.fracciones.map((f, idx) => (idx === i ? { ...f, [campo]: valor } : f)),
    }));
  }

  function quitarFraccion(i) {
    setForm((prev) => {
      if (prev.fracciones.length <= 1) return prev;
      const fracciones = prev.fracciones.filter((_, idx) => idx !== i);
      return {
        ...prev,
        fracciones: fracciones.map((f, idx) => ({
          ...f,
          seRepite: idx === fracciones.length - 1 && f.seRepite,
        })),
      };
    });
  }

  async function guardar(e) {
    e.preventDefault();
    const body = {
      tipoVehiculoId: Number(form.tipoVehiculoId),
      nombre: form.nombre.trim(),
      periodoInicialMinutos: Number(form.periodoInicialMinutos) || 0,
      cierre: Number(form.cierre),
      importeCierre: Number(form.cierre) === 0 ? null : Number(form.importeCierre),
      activa: form.activa,
      desde: form.esFranja ? `${form.desde}:00` : null,
      hasta: form.esFranja ? `${form.hasta}:00` : null,
      fracciones: form.fracciones.map((f, i, todas) => ({
        minutos: Number(f.minutos),
        precio: Number(f.precio),
        seRepite: i === todas.length - 1 && !!f.seRepite,
      })),
    };
    try {
      setGuardando(true);
      setError(null);
      if (editando) await tarifaEstadiaService.modificar(editando, body);
      else await tarifaEstadiaService.agregar(body);
      setForm(null);
      setEditando(null);
      await cargar();
    } catch (err) {
      setError(errorDe(err, "No se pudo guardar la tarifa"));
    } finally {
      setGuardando(false);
    }
  }

  async function baja(t) {
    if (!confirm(`¿Dar de baja "${t.nombre}"?`)) return;
    try {
      await tarifaEstadiaService.darDeBaja(t.tarifaEstadiaId);
      await cargar();
    } catch (e) {
      setError(errorDe(e, "No se pudo dar de baja"));
    }
  }

  async function reactivar(t) {
    try {
      await tarifaEstadiaService.reactivar(t.tarifaEstadiaId);
      await cargar();
    } catch (e) {
      setError(errorDe(e, "No se pudo reactivar"));
    }
  }

  const visPage = useMemo(() => paginaDe(tarifas, pagina), [tarifas, pagina]);
  const alta = (
    <PageHeaderAction onClick={abrirNueva}>
      <Plus size={16} /> Nueva
    </PageHeaderAction>
  );

  return (
    <div className={embedded ? "space-y-4" : "space-y-5"}>
      {!embedded && (
        <PageHeader
          title="Tarifas de estadía"
          description="Lista fraccionaria por tipo de vehículo. La franja se guarda y todavía no se usa al ingresar."
          action={alta}
        />
      )}
      {embedded && <div className="flex justify-end">{alta}</div>}
      {error && <p className="px-4 py-3 bg-danger-muted text-danger-ink text-sm">{error}</p>}
      <label className="ml-auto flex items-center gap-2 pk-caption font-semibold cursor-pointer select-none w-fit">
        <Checkbox checked={inactivas} onChange={(e) => setInactivas(e.target.checked)} />
        Ver dadas de baja
      </label>
      {tarifas.length === 0 ? (
        <div className="bg-surface-card px-4 py-16 text-center text-sm font-medium text-ink-muted">No hay tarifas</div>
      ) : (
        <>
          <div className="bg-surface-card overflow-x-auto">
            <table className="w-full text-sm table-fixed">
              <colgroup>
                <col className="w-[28%]" />
                <col className="w-[18%]" />
                <col className="w-[32%]" />
                <col className="w-[12%]" />
                <col className="w-[10%]" />
              </colgroup>
              <thead>
                <tr className="border-b border-line-strong text-left">
                  <th className="pk-label font-bold pl-4 pr-3 py-2.5">Tarifa</th>
                  <th className="pk-label font-bold px-3 py-2.5">Tipo</th>
                  <th className="pk-label font-bold px-3 py-2.5">Detalle</th>
                  <th className="pk-label font-bold px-3 py-2.5">Estado</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {visPage.map((t) => {
                  const inactiva = !t.activa;
                  const detalle = [
                    `${t.fracciones?.length || 0} fracciones`,
                    t.esFranja ? "Franja" : null,
                    Number(t.cierre) === 1 ? `tope ${plata(t.tope)}` : null,
                    Number(t.cierre) === 2 ? `día ${plata(t.precioDia)}` : null,
                  ]
                    .filter(Boolean)
                    .join(" · ");
                  return (
                    <tr key={t.tarifaEstadiaId} className={`border-b border-line ${inactiva ? "opacity-55" : "hover:bg-surface-page"}`}>
                      <td className={`pl-4 pr-3 py-2.5 overflow-hidden border-l-[3px] ${inactiva ? "border-l-transparent" : "border-l-brand"}`}>
                        <p className="font-semibold text-ink truncate">{t.nombre}</p>
                      </td>
                      <td className="px-3 py-2.5 overflow-hidden">
                        <p className="pk-caption truncate">{t.tipoVehiculoNombre}</p>
                      </td>
                      <td className="px-3 py-2.5 overflow-hidden">
                        <p className="pk-caption truncate">{detalle}</p>
                      </td>
                      <td className="px-3 py-2.5">
                        <p className={`text-sm font-semibold ${inactiva ? "text-ink-faint" : "text-success-ink"}`}>
                          {inactiva ? "De baja" : "Activa"}
                        </p>
                      </td>
                      <td className="pl-2 pr-3 py-2.5">
                        <div className="flex items-center justify-end gap-0.5">
                          <button
                            type="button"
                            title="Editar"
                            className={ICONO}
                            onClick={() => {
                              setEditando(t.tarifaEstadiaId);
                              setForm(desdeTarifa(t));
                            }}
                          >
                            <Pencil size={15} />
                          </button>
                          {t.activa ? (
                            <button type="button" title="Dar de baja" className={`${ICONO} hover:text-danger-ink`} onClick={() => baja(t)}>
                              <Trash2 size={15} />
                            </button>
                          ) : (
                            <button type="button" title="Reactivar" className={ICONO} onClick={() => reactivar(t)}>
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
          <Paginacion pagina={pagina} total={tarifas.length} onChange={setPagina} />
        </>
      )}

      {form && (
        <form onSubmit={guardar} className="bg-surface-card p-5 space-y-3 max-w-xl">
          <h2 className="pk-label pb-2 border-b border-line-subtle">{editando ? "Modificar tarifa" : "Nueva tarifa"}</h2>
          <input required placeholder="Nombre" value={form.nombre} onChange={(e) => setCampo("nombre", e.target.value)} className={fieldClass} />
          <FilterSelect
            className="w-full"
            ariaLabel="Tipo de vehículo"
            value={form.tipoVehiculoId}
            onChange={(v) => setCampo("tipoVehiculoId", v)}
            options={tipos.map((t) => ({ value: t.tipoVehiculoId, label: t.nombre }))}
          />
          <label className="block space-y-1">
            <span className="pk-caption font-semibold">Período inicial (minutos, 0 lo apaga)</span>
            <input type="number" min="0" value={form.periodoInicialMinutos} onChange={(e) => setCampo("periodoInicialMinutos", e.target.value)} className={fieldClass} />
          </label>
          <FilterSelect className="w-full" ariaLabel="Cierre del día" value={form.cierre} onChange={(v) => setCampo("cierre", v)} options={CIERRE} />
          {Number(form.cierre) !== 0 && (
            <input required type="number" min="0" step="0.01" placeholder="Importe" value={form.importeCierre} onChange={(e) => setCampo("importeCierre", e.target.value)} className={fieldClass} />
          )}
          <label className="flex items-center gap-2 pk-caption font-semibold text-ink cursor-pointer select-none">
            <Checkbox checked={form.esFranja} disabled={!!editando} onChange={(e) => setCampo("esFranja", e.target.checked)} />
            Franja horaria
          </label>
          {form.esFranja && (
            <div className="grid grid-cols-2 gap-2">
              <input required type="time" value={form.desde} onChange={(e) => setCampo("desde", e.target.value)} className={fieldClass} />
              <input required type="time" value={form.hasta} onChange={(e) => setCampo("hasta", e.target.value)} className={fieldClass} />
            </div>
          )}
          <div className="space-y-2">
            <p className="pk-caption font-semibold">Fracciones</p>
            {form.fracciones.map((f, i) => (
              <div key={i} className="grid grid-cols-[1fr_1fr_auto_auto] gap-2 items-center">
                <input type="number" min="1" required placeholder="Minutos" value={f.minutos} onChange={(e) => setFraccion(i, "minutos", e.target.value)} className={fieldClass} />
                <input type="number" min="0" step="0.01" required placeholder="Precio" value={f.precio} onChange={(e) => setFraccion(i, "precio", e.target.value)} className={fieldClass} />
                {i === form.fracciones.length - 1 ? (
                  <label className="text-[10px] font-semibold text-ink flex items-center gap-1">
                    <Checkbox checked={!!f.seRepite} onChange={(e) => setFraccion(i, "seRepite", e.target.checked)} />
                    Repite
                  </label>
                ) : <span />}
                {form.fracciones.length > 1 && (
                  <button type="button" className="p-1.5 text-ink-muted hover:text-danger" aria-label="Quitar fracción" onClick={() => quitarFraccion(i)}>
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              className="text-xs font-semibold text-brand"
              onClick={() => setCampo("fracciones", [...form.fracciones, { minutos: "", precio: "", seRepite: false }])}
            >
              Agregar fracción
            </button>
          </div>
          <label className="flex items-center gap-2 pk-caption font-semibold text-ink cursor-pointer select-none">
            <Checkbox checked={form.activa} onChange={(e) => setCampo("activa", e.target.checked)} />
            Activa
          </label>
          <div className="flex gap-2">
            <PageHeaderAction type="submit" disabled={guardando}>{guardando ? "Guardando..." : "Guardar"}</PageHeaderAction>
            <button type="button" className="text-sm text-ink-muted px-3" onClick={() => setForm(null)}>Cancelar</button>
          </div>
        </form>
      )}
    </div>
  );
}
