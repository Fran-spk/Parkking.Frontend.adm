import { Fragment, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import PageHeader from "../components/layout/PageHeader";
import { fieldClass } from "../components/layout/FilterSelect";
import { estadiaService } from "../services/estadiaService";
import Patente from "../components/layout/Patente";
import FiltroSegmentado from "../components/layout/FiltroSegmentado";

function plata(n) {
  return Number(n || 0).toLocaleString("es-AR", { style: "currency", currency: "ARS" });
}

function reloj(fecha) {
  if (!fecha) return "—";
  return new Date(fecha).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
}

function fechaHora(fecha) {
  if (!fecha) return "—";
  return new Date(fecha).toLocaleString("es-AR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function tiempo(minutos) {
  if (minutos == null) return "—";
  const m = Math.max(0, Number(minutos) || 0);
  const h = Math.floor(m / 60);
  if (h === 0) return `${m} min`;
  return `${h} h ${String(m % 60).padStart(2, "0")}`;
}

function isoDe(d) {
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function moverDia(iso, dias) {
  const [y, m, d] = iso.split("-").map(Number);
  return isoDe(new Date(y, m - 1, d + dias));
}

function esDelDia(fecha, iso) {
  return !!fecha && isoDe(new Date(fecha)) === iso;
}

function patenteDe(valor) {
  return String(valor || "").replace(/[\s-]/g, "").toUpperCase();
}

function descuentoTexto(e) {
  if (e.descuentoTipo == null || e.descuentoValor == null) return null;
  const valor = Number(e.descuentoTipo) === 0 ? `${Number(e.descuentoValor)}%` : plata(e.descuentoValor);
  return `${valor}${e.descuentoMotivo ? ` · ${e.descuentoMotivo}` : ""}`;
}

function EstadoIngreso({ e }) {
  if (Number(e.estado) === 2) return <span className="text-xs font-semibold text-danger-ink">Anulada</span>;
  if (Number(e.estado) === 0) return <span className="text-xs font-semibold text-success-ink">Adentro</span>;
  return <span className="text-xs text-ink-muted tabular-nums">Salió {fechaHora(e.horaSalida)}</span>;
}

function Dato({ label, children }) {
  return (
    <div className="flex items-baseline justify-between gap-3 text-xs">
      <dt className="text-ink-muted">{label}</dt>
      <dd className="text-ink tabular-nums text-right">{children}</dd>
    </div>
  );
}

function Detalle({ e }) {
  const descuento = descuentoTexto(e);
  const anulada = Number(e.estado) === 2;
  const adentro = Number(e.estado) === 0;
  return (
    <div className="bg-surface-muted grid sm:grid-cols-2 gap-px">
      <div className="bg-surface-muted px-4 py-3">
        <p className="pk-label text-ink-faint mb-2">Ingreso</p>
        <dl className="space-y-1.5">
          <Dato label="Fecha y hora">{fechaHora(e.horaEntrada)}</Dato>
          <Dato label="Vehículo">{e.tipoVehiculoNombre || "—"}</Dato>
          {e.zonaNombre ? <Dato label="Zona">{e.zonaNombre}</Dato> : null}
          <Dato label="Tipo">{e.esAbonado ? "Abonado" : "Rotativo"}</Dato>
          {anulada ? <Dato label="Estado"><span className="text-danger-ink font-semibold">Anulada</span></Dato> : null}
        </dl>
      </div>

      <div className="bg-surface-muted px-4 py-3 sm:border-l border-line">
        <p className="pk-label text-ink-faint mb-2">Salida</p>
        {anulada ? (
          <p className="text-xs text-ink-muted">Anulada. No hubo salida por caja.</p>
        ) : adentro && e.horaEgreso == null ? (
          <p className="text-xs text-success-ink font-semibold">Sigue adentro.</p>
        ) : (
          <dl className="space-y-1.5">
            <Dato label="Fecha y hora">{adentro ? "Sigue adentro" : fechaHora(e.horaSalida)}</Dato>
            <Dato label="Tiempo">{tiempo(e.minutosEstadia)}</Dato>
            <Dato label="Importe">{e.esAbonado ? "Abonado" : e.monto == null ? "—" : plata(e.monto)}</Dato>
            <Dato label="Descuento">{descuento || "—"}</Dato>
            <Dato label="Cobrado"><span className="font-semibold">{plata(e.pagado)}</span></Dato>
          </dl>
        )}
        {!anulada ? <Pagos e={e} /> : null}
      </div>
    </div>
  );
}

function Pagos({ e }) {
  return (
      <div className="mt-3">
        <p className="pk-label text-ink-faint mb-1">Pagos</p>
        {(e.pagos || []).length === 0 ? (
          <p className="text-xs text-ink-muted">
            {Number(e.estado) === 2 ? "Anulada sin pagos." : e.esAbonado || Number(e.monto) === 0 ? "Cerró sin pago." : "Sin pagos."}
          </p>
        ) : (
          <ul className="divide-y divide-line border-y border-line">
            {e.pagos.map((p) => (
              <li key={p.pagoId} className="flex items-center justify-between gap-3 py-1.5 text-xs">
                <span className="text-ink-muted tabular-nums whitespace-nowrap">{fechaHora(p.fechaHora)}</span>
                <span className="text-ink-muted truncate">
                  {p.metodoDePagoNombre || "Sin método"}
                  {p.reciboNumero ? ` · recibo ${p.reciboNumero}` : ""}
                </span>
                <span className="font-semibold text-ink tabular-nums whitespace-nowrap">{plata(p.monto)}</span>
              </li>
            ))}
          </ul>
        )}
        {Number(e.saldo) > 0 && Number(e.estado) === 0 ? (
          <p className="mt-1 text-xs text-warning-ink">Queda {plata(e.saldo)}.</p>
        ) : null}
      </div>
  );
}

function Grilla({ titulo, total, columnas, filas, vacio, abierta, onAbrir, renderCeldas }) {
  return (
    <section className="bg-surface-card min-w-0">
      <header className="flex items-baseline justify-between px-4 pt-3 pb-2 border-b border-line">
        <h2 className="pk-label text-ink-muted">{titulo}</h2>
        <span className="pk-caption text-ink-faint tabular-nums">{total}</span>
      </header>
      {filas.length === 0 ? (
        <p className="px-4 py-10 text-sm text-ink-faint text-center">{vacio}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left">
                {columnas.map((c, i) => (
                  <th
                    key={c.label || i}
                    className={`pk-label text-ink-faint font-bold py-2 whitespace-nowrap ${i === 0 ? "pl-4 pr-3" : "px-3"} ${
                      c.derecha ? "text-right" : ""
                    } ${c.ancho ? "w-full" : ""}`}
                  >
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filas.map((e) => (
                <Fragment key={e.estadiaId}>
                  <tr
                    onClick={() => onAbrir(e.estadiaId)}
                    className={`border-b border-line cursor-pointer ${
                      abierta === e.estadiaId ? "bg-brand-muted" : "hover:bg-surface-muted/60"
                    }`}
                  >
                    {renderCeldas(e)}
                  </tr>
                  {abierta === e.estadiaId && (
                    <tr className="border-b border-line">
                      <td colSpan={columnas.length} className="p-0">
                        <Detalle e={e} />
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export default function RotativoHistorico() {
  const hoy = isoDe(new Date());
  const [fecha, setFecha] = useState(hoy);
  const [patente, setPatente] = useState("");
  const [vista, setVista] = useState("estadia");
  const [estadias, setEstadias] = useState([]);
  const [abierta, setAbierta] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!fecha) return;
    setCargando(true);
    setError(null);
    estadiaService
      .listar({ fecha })
      .then((data) => setEstadias(Array.isArray(data) ? data : []))
      .catch((e) => setError(estadiaService.mensaje(e, "No se pudieron cargar las estadías")))
      .finally(() => setCargando(false));
  }, [fecha]);

  const filtro = patenteDe(patente);
  const delFiltro = useMemo(
    () => estadias.filter((e) => !filtro || patenteDe(e.patente).includes(filtro)),
    [estadias, filtro]
  );

  const ingresos = useMemo(
    () =>
      delFiltro
        .filter((e) => esDelDia(e.horaEntrada, fecha))
        .sort((a, b) => new Date(b.horaEntrada) - new Date(a.horaEntrada)),
    [delFiltro, fecha]
  );

  const salidas = useMemo(
    () =>
      delFiltro
        .filter((e) => Number(e.estado) === 1 && esDelDia(e.horaSalida, fecha))
        .sort((a, b) => new Date(b.horaSalida) - new Date(a.horaSalida)),
    [delFiltro, fecha]
  );

  const delDia = useMemo(
    () =>
      delFiltro
        .slice()
        .sort((a, b) => new Date(b.horaSalida || b.horaEntrada) - new Date(a.horaSalida || a.horaEntrada)),
    [delFiltro]
  );

  const cobrado = delFiltro.reduce(
    (acc, e) => acc + (e.pagos || []).filter((p) => esDelDia(p.fechaHora, fecha)).reduce((s, p) => s + Number(p.monto || 0), 0),
    0
  );
  const anuladas = ingresos.filter((e) => Number(e.estado) === 2).length;
  const conTiempo = salidas.filter((e) => e.minutosEstadia != null);
  const promedio = conTiempo.length
    ? Math.round(conTiempo.reduce((acc, e) => acc + Number(e.minutosEstadia), 0) / conTiempo.length)
    : null;

  function abrir(id) {
    setAbierta((actual) => (actual === id ? null : id));
  }

  const etiquetaDia = new Date(`${fecha}T00:00:00`).toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div className="space-y-5">
      <PageHeader
        title="Estadías"
        description={`Ingresos y salidas del ${etiquetaDia}.`}
        loading={cargando && estadias.length === 0}
        stats={[
          { label: "Ingresos", value: ingresos.length },
          { label: "Salidas", value: salidas.length },
          { label: "Cobrado", value: plata(cobrado), tone: "success" },
          { label: "Estadía promedio", value: promedio == null ? "—" : tiempo(promedio) },
        ]}
      />

      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-stretch border border-line-strong bg-surface-card">
          <button
            type="button"
            className="px-2 text-ink-muted hover:text-ink hover:bg-surface-muted"
            aria-label="Día anterior"
            onClick={() => setFecha((f) => moverDia(f, -1))}
          >
            <ChevronLeft size={16} />
          </button>
          <input
            type="date"
            value={fecha}
            max={hoy}
            onChange={(e) => e.target.value && setFecha(e.target.value)}
            className="border-x border-line-strong bg-surface-card px-2 py-1.5 text-sm text-ink tabular-nums outline-none focus:bg-surface-muted"
          />
          <button
            type="button"
            className="px-2 text-ink-muted hover:text-ink hover:bg-surface-muted disabled:opacity-30"
            aria-label="Día siguiente"
            disabled={fecha >= hoy}
            onClick={() => setFecha((f) => moverDia(f, 1))}
          >
            <ChevronRight size={16} />
          </button>
        </div>
        {fecha !== hoy && (
          <button type="button" className="text-xs font-semibold text-brand" onClick={() => setFecha(hoy)}>
            Hoy
          </button>
        )}
        <div className="relative w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint pointer-events-none" />
          <input
            value={patente}
            onChange={(e) => setPatente(e.target.value)}
            placeholder="Patente"
            aria-label="Filtrar por patente"
            className={`${fieldClass} pl-9 font-mono uppercase tracking-[0.08em] placeholder:font-sans placeholder:normal-case placeholder:tracking-normal`}
          />
        </div>
        <FiltroSegmentado
          ariaLabel="Vista"
          value={vista}
          onChange={(v) => {
            setVista(v);
            setAbierta(null);
          }}
          opciones={[
            { value: "estadia", label: "Por estadía" },
            { value: "movimientos", label: "Ingresos y salidas" },
          ]}
        />
        {anuladas > 0 && <span className="pk-caption text-danger-ink">{anuladas} anuladas</span>}
        <Link to="/rotativo" className="ml-auto text-sm text-brand font-semibold">Volver al rotativo</Link>
      </div>

      {error && <p className="px-4 py-3 bg-danger-muted text-danger-ink text-sm">{error}</p>}

      {vista === "estadia" ? (
        <Grilla
          titulo="Estadías del día"
          total={`${delDia.length} estadías`}
          vacio="No hubo estadías ese día."
          abierta={abierta}
          onAbrir={abrir}
          filas={delDia}
          columnas={[
            { label: "Patente" },
            { label: "Vehículo", ancho: true },
            { label: "Entró" },
            { label: "Salió" },
            { label: "Tiempo", derecha: true },
            { label: "Cobrado", derecha: true },
          ]}
          renderCeldas={(e) => (
            <>
              <td className="pl-4 pr-3 py-2.5 whitespace-nowrap"><Patente valor={e.patente} /></td>
              <td className="px-3 py-2.5 max-w-0">
                <p className="truncate text-ink">
                  {e.tipoVehiculoNombre}
                  {e.zonaNombre ? <span className="text-ink-faint"> · {e.zonaNombre}</span> : null}
                </p>
              </td>
              <td className="px-3 py-2.5 whitespace-nowrap tabular-nums text-ink">
                {esDelDia(e.horaEntrada, fecha) ? reloj(e.horaEntrada) : fechaHora(e.horaEntrada)}
              </td>
              <td className="px-3 py-2.5 whitespace-nowrap tabular-nums">
                {Number(e.estado) === 2 ? (
                  <span className="text-xs font-semibold text-danger-ink">Anulada</span>
                ) : Number(e.estado) === 0 ? (
                  <span className="text-xs font-semibold text-success-ink">Adentro</span>
                ) : (
                  <span className="text-ink">
                    {esDelDia(e.horaSalida, fecha) ? reloj(e.horaSalida) : fechaHora(e.horaSalida)}
                  </span>
                )}
              </td>
              <td className="px-3 py-2.5 whitespace-nowrap text-right tabular-nums text-ink">{tiempo(e.minutosEstadia)}</td>
              <td className="px-3 py-2.5 whitespace-nowrap text-right tabular-nums">
                {e.esAbonado ? (
                  <span className="text-xs text-ink-faint">abonado</span>
                ) : Number(e.pagado) === 0 ? (
                  <span className="text-xs text-ink-faint">—</span>
                ) : (
                  <span className="font-bold text-ink">{plata(e.pagado)}</span>
                )}
              </td>
            </>
          )}
        />
      ) : (
      <div className="grid gap-5 xl:grid-cols-2 items-start">
        <Grilla
          titulo="Ingresos"
          total={`${ingresos.length} autos`}
          vacio="No entró ningún auto ese día."
          abierta={abierta}
          onAbrir={abrir}
          filas={ingresos}
          columnas={[{ label: "Hora" }, { label: "Patente" }, { label: "Vehículo", ancho: true }, { label: "Estado", derecha: true }]}
          renderCeldas={(e) => (
            <>
              <td className="pl-4 pr-3 py-2.5 whitespace-nowrap tabular-nums text-ink">{reloj(e.horaEntrada)}</td>
              <td className="px-3 py-2.5 whitespace-nowrap"><Patente valor={e.patente} /></td>
              <td className="px-3 py-2.5 max-w-0">
                <p className="truncate text-ink">
                  {e.tipoVehiculoNombre}
                  {e.zonaNombre ? <span className="text-ink-faint"> · {e.zonaNombre}</span> : null}
                </p>
              </td>
              <td className="px-3 py-2.5 whitespace-nowrap text-right"><EstadoIngreso e={e} /></td>
            </>
          )}
        />

        <Grilla
          titulo="Salidas"
          total={plata(salidas.reduce((acc, e) => acc + Number(e.pagado || 0), 0))}
          vacio="No salió ningún auto ese día."
          abierta={abierta}
          onAbrir={abrir}
          filas={salidas}
          columnas={[{ label: "Hora" }, { label: "Patente" }, { label: "Tiempo", ancho: true }, { label: "Cobrado", derecha: true }]}
          renderCeldas={(e) => {
            const descuento = descuentoTexto(e);
            return (
              <>
                <td className="pl-4 pr-3 py-2.5 whitespace-nowrap tabular-nums text-ink">{reloj(e.horaSalida)}</td>
                <td className="px-3 py-2.5 whitespace-nowrap"><Patente valor={e.patente} /></td>
                <td className="px-3 py-2.5 max-w-0">
                  <p className="truncate text-ink tabular-nums">
                    {tiempo(e.minutosEstadia)}
                    {!esDelDia(e.horaEntrada, fecha) ? (
                      <span className="text-ink-faint"> · entró {fechaHora(e.horaEntrada)}</span>
                    ) : null}
                  </p>
                  {descuento ? <p className="pk-caption text-ink-muted truncate">Descuento {descuento}</p> : null}
                </td>
                <td className="px-3 py-2.5 whitespace-nowrap text-right tabular-nums">
                  {e.esAbonado ? (
                    <span className="text-xs text-ink-faint">abonado</span>
                  ) : Number(e.pagado) === 0 ? (
                    <span className="text-xs text-ink-faint">sin cargo</span>
                  ) : (
                    <span className="font-bold text-ink">{plata(e.pagado)}</span>
                  )}
                </td>
              </>
            );
          }}
        />
      </div>
      )}
    </div>
  );
}
