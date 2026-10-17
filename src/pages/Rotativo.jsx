import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { LogIn, LogOut, Printer, Search, X } from "lucide-react";
import PageHeader, { PageHeaderAction } from "../components/layout/PageHeader";
import FilterSelect, { fieldClass } from "../components/layout/FilterSelect";
import { estadiaService } from "../services/estadiaService";
import { estacionamientoService } from "../services/estacionamientoService";
import { tipoVehiculoService } from "../services/tipoVehiculoService";
import { zonaRotativoService } from "../services/zonaRotativoService";
import ModalRegistrarPago from "../components/layout/ModalRegistrarPago";
import Patente from "../components/layout/Patente";
import FiltroSegmentado from "../components/layout/FiltroSegmentado";

function plata(n) {
  return Number(n || 0).toLocaleString("es-AR", { style: "currency", currency: "ARS" });
}

function entrada(fecha) {
  const d = new Date(fecha);
  const hoy = new Date();
  const mismoDia = d.toDateString() === hoy.toDateString();
  const hhmm = d.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
  if (mismoDia) return hhmm;
  return `${d.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" })} ${hhmm}`;
}

function tiempo(minutos) {
  const m = Math.max(0, Number(minutos) || 0);
  const h = Math.floor(m / 60);
  const resto = String(m % 60).padStart(2, "0");
  if (h === 0) return `${m % 60} min`;
  return `${h} h ${resto}`;
}

function Acciones({ congelada, onSalida, onAnular, onImprimir }) {
  return (
    <div className="flex items-center justify-end gap-1">
      <button
        type="button"
        className="px-2.5 py-1 text-xs font-semibold bg-brand text-brand-foreground hover:bg-brand-strong"
        onClick={onSalida}
      >
        Salida
      </button>
      <button
        type="button"
        className="px-2 py-1 text-xs font-semibold text-ink-muted hover:text-danger-ink disabled:opacity-30 disabled:hover:text-ink-muted"
        disabled={congelada}
        title={congelada ? "Tiene pagos. No se anula." : "Anular"}
        onClick={onAnular}
      >
        Anular
      </button>
      <button
        type="button"
        className="shrink-0 p-1.5 text-ink-faint hover:text-ink"
        aria-label="Reimprimir ticket"
        title="Reimprimir ticket"
        onClick={onImprimir}
      >
        <Printer size={15} />
      </button>
    </div>
  );
}

function Bloque({ titulo, extra, children }) {
  return (
    <section className="bg-surface-card">
      <header className="flex items-baseline justify-between px-4 pt-3 pb-2 border-b border-line">
        <h2 className="pk-label text-ink-muted">{titulo}</h2>
        {extra}
      </header>
      <div className="px-4 py-3">{children}</div>
    </section>
  );
}

const MINUTOS_LARGA = 6 * 60;

function patenteDe(valor) {
  return String(valor || "").replace(/[\s-]/g, "").toUpperCase();
}

function hoyIso() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function reloj(fecha) {
  return new Date(fecha).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
}

function pagadoDe(estadia) {
  if (estadia.monto == null || estadia.esAbonado) return 0;
  return Math.max(0, Number(estadia.monto) - Number(estadia.saldo || 0));
}

function ahoraLocal() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

function errorDe(e, fallback) {
  return estadiaService.mensaje(e, fallback);
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40">
      <div className="bg-surface-card w-full max-w-md border border-line shadow-pk-soft">
        <div className="flex items-center justify-between px-4 py-3 border-b border-line">
          <h2 className="text-sm font-bold text-ink">{title}</h2>
          <button type="button" onClick={onClose} className="p-1 text-ink-faint hover:text-ink" aria-label="Cerrar">
            <X size={16} />
          </button>
        </div>
        <div className="p-4 space-y-3">{children}</div>
      </div>
    </div>
  );
}

export default function Rotativo() {
  const [estadias, setEstadias] = useState([]);
  const [cobrosHoy, setCobrosHoy] = useState([]);
  const [error, setError] = useState(null);
  const [popup, setPopup] = useState(null);
  const [porZona, setPorZona] = useState(false);
  const [tipos, setTipos] = useState([]);
  const [zonas, setZonas] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [vista, setVista] = useState("todas");
  const [ahora, setAhora] = useState(() => new Date());
  const [actualizado, setActualizado] = useState(null);
  const busquedaRef = useRef(null);
  const cargar = useCallback(async () => {
    try {
      setError(null);
      const data = await estadiaService.abiertas();
      setEstadias(Array.isArray(data) ? data : []);
      setActualizado(new Date());
    } catch (e) {
      setError(errorDe(e, "No se pudieron cargar las estadías"));
    }
    try {
      const dia = hoyIso();
      const pagos = await estadiaService.pagos({ desde: dia, hasta: dia });
      setCobrosHoy(Array.isArray(pagos) ? pagos : []);
    } catch {
      /* la lista de adentro sigue usable */
    }
  }, []);

  useEffect(() => {
    cargar();
    busquedaRef.current?.focus();
    estacionamientoService.get().then((d) => setPorZona(Number(d.operatoriaRotativo) === 1)).catch(() => {});
    tipoVehiculoService.getAll().then((d) => setTipos((d || []).filter((t) => t.activo !== false))).catch(() => {});
    zonaRotativoService.getAll().then((d) => setZonas((d || []).filter((z) => z.activa !== false))).catch(() => {});
  }, [cargar]);

  useEffect(() => {
    const relojId = setInterval(() => setAhora(new Date()), 1000);
    const datosId = setInterval(() => { cargar(); }, 60000);
    return () => {
      clearInterval(relojId);
      clearInterval(datosId);
    };
  }, [cargar]);

  const filtro = patenteDe(busqueda);
  const esLarga = (e) => !e.esAbonado && Number(e.minutosTranscurridos) >= MINUTOS_LARGA;
  const visibles = useMemo(() => {
    return estadias
      .filter((e) => !filtro || patenteDe(e.patente).includes(filtro))
      .filter((e) => vista !== "largas" || esLarga(e))
      .slice()
      .sort((a, b) => Number(b.minutosTranscurridos) - Number(a.minutosTranscurridos));
  }, [estadias, filtro, vista]);

  const largas = estadias.filter(esLarga).length;
  const porCobrar = estadias.reduce((acc, e) => acc + (e.esAbonado ? 0 : Number(e.saldo || 0)), 0);
  const totalCobrado = cobrosHoy.reduce((acc, p) => acc + Number(p.monto || 0), 0);
  const salidasHoy = new Set(cobrosHoy.map((p) => p.estadiaId)).size;

  const porMetodo = useMemo(() => {
    const mapa = new Map();
    for (const p of cobrosHoy) {
      const nombre = p.metodoDePagoNombre || "Sin método";
      const fila = mapa.get(nombre) || { nombre, total: 0, cantidad: 0 };
      fila.total += Number(p.monto || 0);
      fila.cantidad += 1;
      mapa.set(nombre, fila);
    }
    return [...mapa.values()].sort((a, b) => b.total - a.total);
  }, [cobrosHoy]);

  const porTipo = useMemo(() => {
    const mapa = new Map();
    for (const e of estadias) {
      const nombre = e.tipoVehiculoNombre || "Sin tipo";
      mapa.set(nombre, (mapa.get(nombre) || 0) + 1);
    }
    return [...mapa.entries()].sort((a, b) => b[1] - a[1]);
  }, [estadias]);

  function alEnter(ev) {
    if (ev.key !== "Enter" || !filtro) return;
    ev.preventDefault();
    const exacta = estadias.find((e) => patenteDe(e.patente) === filtro);
    if (exacta) {
      setPopup({ salida: exacta });
      return;
    }
    if (visibles.length === 1) {
      setPopup({ salida: visibles[0] });
      return;
    }
    if (visibles.length === 0) setPopup({ ingreso: busqueda.trim() });
  }
  const ocupacion = zonas.map((z) => {
    const adentro = estadias.filter(
      (e) => !e.esAbonado && Number(e.zonaRotativoId) === Number(z.zonaRotativoId)
    ).length;
    const tope = z.tope == null || z.tope === "" ? null : Number(z.tope);
    return { ...z, adentro, tope, llena: tope != null && adentro >= tope };
  });

  function cerrarPopup() {
    setPopup(null);
    setTimeout(() => busquedaRef.current?.focus(), 0);
  }

  async function imprimir(id) {
    try {
      setError(null);
      await estadiaService.ticket(id);
    } catch (e) {
      setError(e.message || "No se pudo imprimir el ticket");
    }
  }

  async function anular(estadia) {
    if (!confirm(`¿Anular la estadía de ${estadia.patente}?`)) return;
    try {
      setError(null);
      await estadiaService.anular(estadia.estadiaId);
      await cargar();
    } catch (e) {
      setError(errorDe(e, "No se pudo anular"));
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Rotativo"
        description={`Ingreso y salida por patente · ${reloj(ahora)}`}
        stats={[
          { label: "Adentro", value: estadias.length, onClick: () => setVista("todas") },
          { label: "Por cobrar adentro", value: plata(porCobrar) },
          { label: "Cobrado hoy", value: plata(totalCobrado), tone: "success" },
          { label: "Más de 6 h", value: largas, tone: "warning", onClick: () => setVista("largas") },
        ]}
        action={
          <div className="flex gap-2">
            <PageHeaderAction onClick={() => setPopup("ingreso")}>
              <LogIn size={14} /> Ingreso
            </PageHeaderAction>
            <PageHeaderAction onClick={() => setPopup("salida")} className="bg-surface-card text-ink border border-line hover:bg-surface-muted">
              <LogOut size={14} /> Salida
            </PageHeaderAction>
          </div>
        }
      />

      {error && <p className="px-4 py-3 bg-danger-muted text-danger-ink text-sm">{error}</p>}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_18rem] items-start">
        <section className="bg-surface-card min-w-0">
          <div className="flex items-center gap-3 flex-wrap px-4 py-3 border-b border-line">
            <div className="relative flex-1 min-w-[12rem] max-w-sm">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint pointer-events-none" />
              <input
                ref={busquedaRef}
                autoFocus
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                onKeyDown={alEnter}
                placeholder="Patente y Enter"
                aria-label="Buscar patente"
                className={`${fieldClass} pl-9 font-mono uppercase tracking-[0.08em] placeholder:font-sans placeholder:normal-case placeholder:tracking-normal`}
              />
            </div>
            <FiltroSegmentado
              ariaLabel="Filtrar estadías"
              value={vista}
              onChange={setVista}
              opciones={[
                { value: "todas", label: "Todas", cantidad: estadias.length },
                { value: "largas", label: "Largas", cantidad: largas },
              ]}
            />
            <span className="ml-auto pk-caption text-ink-faint tabular-nums">
              {actualizado ? `Actualizado ${reloj(actualizado)}` : ""}
            </span>
          </div>

          <div>
            {estadias.length === 0 ? (
              <div className="px-4 py-12 text-center">
                <p className="text-sm font-semibold text-ink">No hay autos adentro</p>
                <p className="pk-desc mt-1">Escribí una patente arriba y apretá Enter para ingresarla.</p>
              </div>
            ) : visibles.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <p className="text-sm text-ink-muted">Ninguna estadía coincide.</p>
                {filtro && vista === "todas" ? (
                  <button type="button" className="mt-2 text-xs font-semibold text-brand" onClick={() => setPopup({ ingreso: busqueda.trim() })}>
                    Ingresar {filtro}
                  </button>
                ) : null}
              </div>
            ) : (
              <>
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-line text-left">
                        <th className="pk-label text-ink-faint font-bold pl-4 pr-3 py-2 whitespace-nowrap">Patente</th>
                        <th className="pk-label text-ink-faint font-bold px-3 py-2 w-full">Vehículo</th>
                        <th className="pk-label text-ink-faint font-bold px-3 py-2 whitespace-nowrap">Entró</th>
                        <th className="pk-label text-ink-faint font-bold px-3 py-2 text-right whitespace-nowrap">Tiempo</th>
                        <th className="pk-label text-ink-faint font-bold px-3 py-2 text-right whitespace-nowrap">Saldo</th>
                        <th className="pr-4 py-2" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {visibles.map((e) => {
                        const pagado = pagadoDe(e);
                        const congelada = e.monto != null && !e.esAbonado;
                        const larga = esLarga(e);
                        return (
                          <tr key={e.estadiaId} className="hover:bg-surface-muted/60 align-middle">
                            <td className={`pl-3 pr-3 py-2.5 whitespace-nowrap border-l-[3px] ${larga ? "border-l-warning" : "border-l-transparent"}`}>
                              <Patente valor={e.patente} size="lg" />
                            </td>
                            <td className="px-3 py-2.5 max-w-0">
                              <p className="text-ink truncate">
                                {e.tipoVehiculoNombre}
                                {e.zonaNombre ? <span className="text-ink-faint"> · {e.zonaNombre}</span> : null}
                              </p>
                              {e.esAbonado ? (
                                <p className="pk-caption text-ink-faint truncate">Abonado</p>
                              ) : congelada ? (
                                <p className="pk-caption text-ink-muted truncate">Pagó {plata(pagado)} · importe congelado</p>
                              ) : null}
                            </td>
                            <td className="px-3 py-2.5 whitespace-nowrap text-ink-muted tabular-nums">{entrada(e.horaEntrada)}</td>
                            <td className={`px-3 py-2.5 whitespace-nowrap text-right tabular-nums ${larga ? "font-bold text-warning-ink" : "text-ink"}`}>
                              {tiempo(e.minutosTranscurridos)}
                            </td>
                            <td className="px-3 py-2.5 whitespace-nowrap text-right tabular-nums">
                              {e.esAbonado ? (
                                <span className="text-xs text-ink-faint">sin cobro</span>
                              ) : (
                                <span className="font-bold text-ink">{plata(e.saldo)}</span>
                              )}
                            </td>
                            <td className="pr-4 pl-1 py-2.5 whitespace-nowrap">
                              <Acciones
                                congelada={congelada}
                                onSalida={() => setPopup({ salida: e })}
                                onAnular={() => anular(e)}
                                onImprimir={() => imprimir(e.estadiaId)}
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="md:hidden divide-y divide-line">
                  {visibles.map((e) => {
                    const pagado = pagadoDe(e);
                    const congelada = e.monto != null && !e.esAbonado;
                    const larga = esLarga(e);
                    return (
                      <div
                        key={e.estadiaId}
                        className={`px-4 py-2.5 space-y-1.5 border-l-[3px] ${larga ? "border-l-warning" : "border-l-transparent"}`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <Patente valor={e.patente} size="lg" />
                          {e.esAbonado ? (
                            <span className="text-xs text-ink-faint">sin cobro</span>
                          ) : (
                            <span className="text-sm font-bold text-ink tabular-nums">{plata(e.saldo)}</span>
                          )}
                        </div>
                        <p className="pk-caption text-ink-faint">
                          {e.tipoVehiculoNombre}
                          {e.zonaNombre ? ` · ${e.zonaNombre}` : ""} · {entrada(e.horaEntrada)} · {tiempo(e.minutosTranscurridos)}
                          {congelada ? ` · pagó ${plata(pagado)}` : ""}
                        </p>
                        <Acciones
                          congelada={congelada}
                          onSalida={() => setPopup({ salida: e })}
                          onAnular={() => anular(e)}
                          onImprimir={() => imprimir(e.estadiaId)}
                        />
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </section>

        <aside className="space-y-5">
          <Bloque
            titulo="Caja de hoy"
            extra={<span className="pk-caption text-ink-faint tabular-nums">{salidasHoy} salidas</span>}
          >
            <p className="pk-amount text-ink tabular-nums">{plata(totalCobrado)}</p>
            {porMetodo.length === 0 ? (
              <p className="pk-desc mt-2">Todavía no hubo cobros.</p>
            ) : (
              <dl className="mt-3 space-y-1.5">
                {porMetodo.map((m) => (
                  <div key={m.nombre} className="flex items-baseline justify-between gap-2 text-sm">
                    <dt className="text-ink-muted truncate">
                      {m.nombre} <span className="text-ink-faint tabular-nums">×{m.cantidad}</span>
                    </dt>
                    <dd className="font-semibold text-ink tabular-nums">{plata(m.total)}</dd>
                  </div>
                ))}
              </dl>
            )}
          </Bloque>

          {porZona && ocupacion.length > 0 && (
            <Bloque titulo="Ocupación por zona">
              <ul className="space-y-3">
                {ocupacion.map((z) => {
                  const pct = z.tope ? Math.min(100, Math.round((z.adentro / z.tope) * 100)) : null;
                  return (
                    <li key={z.zonaRotativoId}>
                      <div className="flex items-baseline justify-between text-sm">
                        <span className="text-ink truncate">{z.nombre}</span>
                        <span className={`tabular-nums font-semibold ${z.llena ? "text-warning-ink" : "text-ink"}`}>
                          {z.adentro}{z.tope != null ? ` / ${z.tope}` : ""}
                        </span>
                      </div>
                      {pct != null ? (
                        <div className="mt-1 h-1 bg-surface-muted">
                          <div className={`h-1 ${z.llena ? "bg-warning" : "bg-ink"}`} style={{ width: `${pct}%` }} />
                        </div>
                      ) : (
                        <p className="pk-caption text-ink-faint">Sin tope</p>
                      )}
                    </li>
                  );
                })}
              </ul>
            </Bloque>
          )}

          {porTipo.length > 0 && (
            <Bloque titulo="Adentro por tipo">
              <dl className="space-y-1.5">
                {porTipo.map(([nombre, cantidad]) => (
                  <div key={nombre} className="flex items-baseline justify-between text-sm">
                    <dt className="text-ink-muted">{nombre}</dt>
                    <dd className="font-semibold text-ink tabular-nums">{cantidad}</dd>
                  </div>
                ))}
              </dl>
            </Bloque>
          )}

          <Bloque
            titulo="Últimos cobros"
            extra={<Link to="/rotativo/historico" className="pk-caption font-semibold text-brand">Histórico</Link>}
          >
            {cobrosHoy.length === 0 ? (
              <p className="pk-desc">Sin cobros hoy.</p>
            ) : (
              <ul className="space-y-2">
                {cobrosHoy.slice(0, 6).map((p) => (
                  <li key={p.pagoId} className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-mono text-xs font-bold tracking-[0.08em] text-ink">{p.patente}</p>
                      <p className="pk-caption text-ink-faint tabular-nums">
                        {reloj(p.fechaHora)} · {p.metodoDePagoNombre || "—"}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-ink tabular-nums">{plata(p.monto)}</span>
                  </li>
                ))}
              </ul>
            )}
          </Bloque>
        </aside>
      </div>

      {(popup === "ingreso" || popup?.ingreso != null) && (
        <IngresoModal
          patenteInicial={popup?.ingreso || ""}
          porZona={porZona}
          tipos={tipos}
          zonas={zonas}
          onClose={cerrarPopup}
          onListo={async (id) => {
            cerrarPopup();
            setBusqueda("");
            await cargar();
            if (confirm("¿Imprimir el ticket de ingreso?")) await imprimir(id);
          }}
        />
      )}
      {(popup === "salida" || popup?.salida) && (
        <ModalRegistrarPago
          estadia={popup?.salida || null}
          estadiasAbiertas={popup === "salida" ? estadias : null}
          onClose={cerrarPopup}
          onRegistrado={() => {
            setBusqueda("");
            cargar();
          }}
        />
      )}
    </div>
  );
}

function IngresoModal({ patenteInicial = "", porZona, tipos, zonas, onClose, onListo }) {
  const [patente, setPatente] = useState(patenteInicial);
  const [tipoVehiculoId, setTipoVehiculoId] = useState(tipos[0]?.tipoVehiculoId ?? "");
  const [zonaRotativoId, setZonaRotativoId] = useState(zonas[0]?.zonaRotativoId ?? "");
  const [horaEntrada, setHoraEntrada] = useState(ahoraLocal);
  const [error, setError] = useState(null);
  const [guardando, setGuardando] = useState(false);

  async function guardar(e) {
    e.preventDefault();
    try {
      setGuardando(true);
      setError(null);
      const creada = await estadiaService.ingresar({
        patente: patente.trim(),
        tipoVehiculoId: Number(tipoVehiculoId),
        horaEntrada,
        zonaRotativoId: porZona ? Number(zonaRotativoId) : null,
      });
      await onListo(creada.estadiaId);
    } catch (err) {
      setError(errorDe(err, "No se pudo ingresar"));
    } finally {
      setGuardando(false);
    }
  }

  return (
    <Modal title="Ingreso" onClose={onClose}>
      <form onSubmit={guardar} className="space-y-3">
        {error && <p className="text-sm text-danger-ink">{error}</p>}
        <label className="block text-xs font-semibold text-ink">
          Patente
          <input
            required
            autoFocus={!patenteInicial}
            value={patente}
            onChange={(e) => setPatente(e.target.value)}
            className={`${fieldClass} mt-1 font-mono uppercase tracking-[0.08em]`}
          />
        </label>
        <label className="block text-xs font-semibold text-ink">
          Tipo de vehículo
          <FilterSelect
            className="w-full mt-1"
            ariaLabel="Tipo de vehículo"
            value={tipoVehiculoId}
            onChange={setTipoVehiculoId}
            options={tipos.map((t) => ({ value: t.tipoVehiculoId, label: t.nombre }))}
          />
        </label>
        {porZona && (
          <label className="block text-xs font-semibold text-ink">
            Zona de rotativo
            <FilterSelect
              className="w-full mt-1"
              ariaLabel="Zona de rotativo"
              value={zonaRotativoId}
              onChange={setZonaRotativoId}
              options={zonas.map((z) => ({ value: z.zonaRotativoId, label: z.nombre }))}
            />
          </label>
        )}
        <label className="block text-xs font-semibold text-ink">
          Hora de entrada
          <input required type="datetime-local" value={horaEntrada} onChange={(e) => setHoraEntrada(e.target.value)} className={`${fieldClass} mt-1`} />
        </label>
        <PageHeaderAction type="submit" disabled={guardando}>{guardando ? "Ingresando..." : "Ingresar"}</PageHeaderAction>
      </form>
    </Modal>
  );
}
