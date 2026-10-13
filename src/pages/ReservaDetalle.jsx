import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { reservaService } from "../services/reservaService";
import { clienteService } from "../services/clienteService";
import { cocheraService } from "../services/cocheraService";
import { tipoVehiculoService } from "../services/tipoVehiculoService";
import { PERIODICIDAD_OPTIONS } from "../utils/periodicidadHelpers";
import { newKey } from "../utils/newKey";
import FilterSelect, { fieldClass } from "../components/layout/FilterSelect";
import ModalRegistrarPago from "../components/layout/ModalRegistrarPago";
import { ACCIONES, permisosStore } from "../utils/permisosStore";

const ESTADO = { 0: "Vigente", 1: "Vencida", 2: "Baja", 3: "Transformada" };
const SENA = { 0: "Pendiente", 1: "Pagada", 2: "Anulada" };
const inputCls = fieldClass;

function errorDe(e, fallback) {
  const msg = e.response?.data;
  return typeof msg === "string" ? msg : msg?.mensaje || fallback;
}

export default function ReservaDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [reserva, setReserva] = useState(null);
  const [error, setError] = useState(null);
  const [senaImporte, setSenaImporte] = useState("");
  const [clientes, setClientes] = useState([]);
  const [cocheras, setCocheras] = useState([]);
  const [tipos, setTipos] = useState([]);
  const [form, setForm] = useState(null);
  const [vehiculos, setVehiculos] = useState([]);
  const [busy, setBusy] = useState(false);

  const puedeEditar = permisosStore.tieneAccion(ACCIONES.EditarReservas);
  const puedeBaja = permisosStore.tieneAccion(ACCIONES.DarDeBajaReservas);
  const puedeTransformar = permisosStore.tieneAccion(ACCIONES.TransformarReservas);
  const puedeCobrar = permisosStore.tieneAccion(ACCIONES.Cobrar);
  const [senaPago, setSenaPago] = useState(null);

  function cargar() {
    return reservaService.getById(id).then(setReserva);
  }

  useEffect(() => {
    cargar().catch((e) => setError(errorDe(e, "No se pudo cargar la reserva")));
    clienteService.getAll(false).then((d) => setClientes(Array.isArray(d) ? d : [])).catch(() => {});
    cocheraService.getAll().then((d) => setCocheras(Array.isArray(d) ? d : [])).catch(() => {});
    tipoVehiculoService.getAll().then((d) => setTipos(Array.isArray(d) ? d : [])).catch(() => {});
  }, [id]);

  useEffect(() => {
    if (!reserva) return;
    setForm({
      clienteId: reserva.clienteId ? String(reserva.clienteId) : "",
      fechaInicio: reserva.fechaInicio || "",
      fechaInicioCobro: reserva.fechaInicioCobro || "",
      periodicidadCobro: reserva.periodicidadCobro ?? "",
      precioAcordado: reserva.precioAcordado ?? "",
      cocheraIds: (reserva.cocheras || []).map((c) => c.cocheraId),
    });
    setVehiculos(
      (reserva.vehiculos || []).map((v) => ({
        key: newKey(),
        patente: v.patente || "",
        tipoVehiculoId: String(v.tipoVehiculoId || ""),
        modalidad: Number(v.modalidad) || 0,
        cocheraId: v.cocheraId ? String(v.cocheraId) : "",
      }))
    );
  }, [reserva]);

  async function baja() {
    if (!window.confirm("¿Dar de baja esta reserva?")) return;
    try {
      setBusy(true);
      setError(null);
      setReserva(await reservaService.baja(id));
    } catch (e) {
      setError(errorDe(e, "No se pudo dar de baja"));
    } finally {
      setBusy(false);
    }
  }

  async function agregarSena(e) {
    e.preventDefault();
    try {
      setBusy(true);
      setError(null);
      setReserva(await reservaService.crearSena(id, Number(senaImporte)));
      setSenaImporte("");
    } catch (err) {
      setError(errorDe(err, "No se pudo cargar la seña"));
    } finally {
      setBusy(false);
    }
  }

  async function transformar(e) {
    e.preventDefault();
    try {
      setBusy(true);
      setError(null);
      const data = await reservaService.transformar(id, {
        clienteId: form.clienteId ? Number(form.clienteId) : null,
        fechaInicio: form.fechaInicio || null,
        fechaInicioCobro: form.fechaInicioCobro || null,
        periodicidadCobro: form.periodicidadCobro === "" ? null : Number(form.periodicidadCobro),
        precioAcordado: form.precioAcordado === "" ? null : Number(form.precioAcordado),
        cocheraIds: form.cocheraIds,
        vehiculos: vehiculos
          .filter((v) => v.tipoVehiculoId)
          .map((v) => ({
            patente: v.patente,
            tipoVehiculoId: Number(v.tipoVehiculoId),
            modalidad: Number(v.modalidad),
            cocheraId: Number(v.modalidad) === 0 && v.cocheraId ? Number(v.cocheraId) : null,
          })),
      });
      navigate(`/pagosAbono/${data.abonoId}`);
    } catch (err) {
      setError(errorDe(err, "No se pudo transformar la reserva"));
    } finally {
      setBusy(false);
    }
  }

  if (!reserva) return <p className="text-sm text-ink-faint">{error || "Cargando..."}</p>;
  const vigente = Number(reserva.estado) === 0;

  return (
    <div className="space-y-5 max-w-3xl">
      <button type="button" onClick={() => navigate("/reservas")} className="inline-flex items-center gap-1 text-sm text-ink-muted">
        <ArrowLeft size={14} /> Reservas
      </button>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-black text-ink">{reserva.clienteNombre || reserva.nombre}</h1>
          <p className="text-sm text-ink-muted">
            {ESTADO[reserva.estado]}
            {reserva.automatica ? " · Automática" : ""}
            {reserva.telefono ? ` · ${reserva.telefono}` : ""}
          </p>
        </div>
        <div className="flex gap-2">
          {vigente && puedeEditar && (
            <button type="button" onClick={() => navigate(`/reservas/${id}/editar`)} className="px-3 py-2 text-xs font-semibold bg-surface-muted">
              Editar
            </button>
          )}
          {vigente && puedeBaja && (
            <button type="button" onClick={baja} disabled={busy} className="px-3 py-2 text-xs font-semibold bg-danger-muted text-danger-ink">
              Dar de baja
            </button>
          )}
        </div>
      </div>
      {error && <p className="px-4 py-3 bg-danger-muted text-danger-ink text-sm">{error}</p>}

      <section className="bg-surface-card p-4 text-sm space-y-1">
        <p>Inicio {reserva.fechaInicio} · vence {reserva.fechaVencimiento}</p>
        <p>Cocheras: {(reserva.cocheras || []).map((c) => c.numero).join(", ") || "ninguna"}</p>
        <p>
          Vehículos: {(reserva.vehiculos || []).map((v) => [v.patente, v.tipoVehiculoNombre].filter(Boolean).join(" ")).join(" · ") || "ninguno"}
        </p>
        {reserva.abonoId && Number(reserva.estado) === 3 && (
          <button type="button" onClick={() => navigate(`/pagosAbono/${reserva.abonoId}`)} className="text-sm font-semibold text-brand">
            Ver abono
          </button>
        )}
      </section>

      <section className="bg-surface-card p-4 space-y-3">
        <h2 className="text-sm font-bold">Señas</h2>
        {(reserva.senas || []).length === 0 ? (
          <p className="text-xs text-ink-faint">Sin señas</p>
        ) : (
          <ul className="divide-y divide-line">
            {reserva.senas.map((s) => (
              <li key={s.senaId} className="py-2 flex items-center justify-between gap-2 text-sm">
                <span>${Number(s.importe).toLocaleString("es-AR")}</span>
                <span className="text-ink-muted">{SENA[s.estado]}</span>
                {puedeCobrar && Number(s.estado) === 0 && (
                  <button
                    type="button"
                    onClick={() => setSenaPago(s)}
                    className="text-xs font-medium px-3 py-1.5 rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
                  >
                    Pagar
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
        {vigente && puedeEditar && (
          <form onSubmit={agregarSena} className="flex gap-2">
            <input type="number" min="0" value={senaImporte} onChange={(e) => setSenaImporte(e.target.value)} placeholder="Importe" className={inputCls} />
            <button type="submit" disabled={busy} className="px-3 text-sm font-semibold bg-brand text-brand-foreground">Cargar</button>
          </form>
        )}
        <p className="text-xs text-ink-faint">La seña pendiente es una deuda. El cobro se registra aparte y no transforma la reserva.</p>
      </section>

      {reserva.automatica && vigente && (
        <p className="text-sm text-ink-muted">El abono pendiente se activa solo el día de inicio. Si das de baja la reserva antes, ese abono se cancela.</p>
      )}

      {vigente && puedeTransformar && !reserva.automatica && form && (
        <form onSubmit={transformar} className="bg-surface-card p-4 space-y-3">
          <h2 className="text-sm font-bold">Transformar en abono</h2>
          <FilterSelect
            className="w-full"
            ariaLabel="Cliente"
            value={form.clienteId}
            onChange={(v) => setForm({ ...form, clienteId: v })}
            options={[
              { value: "", label: "Cliente" },
              ...clientes.map((c) => ({ value: c.clienteId, label: c.nombre })),
            ]}
          />
          <div className="grid sm:grid-cols-2 gap-3">
            <input type="date" value={form.fechaInicio} onChange={(e) => setForm({ ...form, fechaInicio: e.target.value })} className={inputCls} />
            <input type="date" value={form.fechaInicioCobro} onChange={(e) => setForm({ ...form, fechaInicioCobro: e.target.value })} className={inputCls} />
            <FilterSelect
              className="w-full"
              ariaLabel="Periodicidad"
              value={form.periodicidadCobro}
              onChange={(v) => setForm({ ...form, periodicidadCobro: v })}
              options={[
                { value: "", label: "Periodicidad" },
                ...PERIODICIDAD_OPTIONS.map((p) => ({ value: p.value, label: p.label })),
              ]}
            />
            <input type="number" min="0" value={form.precioAcordado} onChange={(e) => setForm({ ...form, precioAcordado: e.target.value })} placeholder="Precio acordado" className={inputCls} />
          </div>
          <div className="flex flex-wrap gap-2">
            {cocheras.map((c) => (
              <button
                key={c.cocheraId}
                type="button"
                onClick={() => setForm((prev) => ({
                  ...prev,
                  cocheraIds: prev.cocheraIds.includes(c.cocheraId)
                    ? prev.cocheraIds.filter((x) => x !== c.cocheraId)
                    : [...prev.cocheraIds, c.cocheraId],
                }))}
                className={`px-2 py-1 text-xs font-semibold border ${form.cocheraIds.includes(c.cocheraId) ? "bg-brand text-brand-foreground border-brand" : "border-line"}`}
              >
                {c.numero}
              </button>
            ))}
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold">Vehículos</p>
              <button
                type="button"
                onClick={() => setVehiculos((prev) => [...prev, { key: newKey(), patente: "", tipoVehiculoId: "", modalidad: 0, cocheraId: "" }])}
                className="text-xs font-semibold"
              >
                Agregar
              </button>
            </div>
            {vehiculos.map((v) => (
              <div key={v.key} className="grid sm:grid-cols-4 gap-2">
                <input value={v.patente} onChange={(e) => setVehiculos((prev) => prev.map((x) => x.key === v.key ? { ...x, patente: e.target.value } : x))} placeholder="Patente" className={inputCls} />
                <FilterSelect
                  className="w-full"
                  ariaLabel="Tipo de vehículo"
                  value={v.tipoVehiculoId}
                  onChange={(valor) => setVehiculos((prev) => prev.map((x) => x.key === v.key ? { ...x, tipoVehiculoId: valor } : x))}
                  options={[{ value: "", label: "Tipo" }, ...tipos.map((t) => ({ value: t.tipoVehiculoId, label: t.nombre }))]}
                />
                <FilterSelect
                  className="w-full"
                  ariaLabel="Modalidad"
                  value={v.modalidad}
                  onChange={(valor) => setVehiculos((prev) => prev.map((x) => x.key === v.key ? { ...x, modalidad: Number(valor) } : x))}
                  options={[{ value: 0, label: "Fijo" }, { value: 1, label: "Flexible" }]}
                />
                <FilterSelect
                  className="w-full"
                  ariaLabel="Cochera"
                  value={v.cocheraId}
                  onChange={(valor) => setVehiculos((prev) => prev.map((x) => x.key === v.key ? { ...x, cocheraId: valor } : x))}
                  options={[
                    { value: "", label: "Cochera" },
                    ...cocheras.filter((c) => form.cocheraIds.includes(c.cocheraId)).map((c) => ({ value: c.cocheraId, label: c.numero })),
                  ]}
                />
              </div>
            ))}
          </div>
          <button type="submit" disabled={busy} className="px-4 py-2.5 text-sm font-semibold bg-brand text-brand-foreground">
            {busy ? "Transformando..." : "Transformar abono"}
          </button>
        </form>
      )}
      {senaPago && (
        <ModalRegistrarPago
          sena={{
            senaId: senaPago.senaId,
            importe: senaPago.importe,
            clienteNombre: reserva.clienteNombre || reserva.nombre,
            cocherasLabel: (reserva.cocheras || []).map((c) => c.numero).filter(Boolean).join(", "),
            patentesLabel: (reserva.vehiculos || []).map((v) => v.patente).filter(Boolean).join(", "),
          }}
          onClose={() => setSenaPago(null)}
          onRegistrado={async () => {
            setSenaPago(null);
            setReserva(await reservaService.getById(id));
          }}
        />
      )}
    </div>
  );
}
