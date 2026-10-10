import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { reservaService } from "../services/reservaService";
import { clienteService } from "../services/clienteService";
import { cocheraService } from "../services/cocheraService";
import { tipoVehiculoService } from "../services/tipoVehiculoService";
import { PERIODICIDAD_OPTIONS } from "../utils/periodicidadHelpers";
import Checkbox from "../components/layout/Check";
import FilterSelect, { fieldClass } from "../components/layout/FilterSelect";

const inputCls = fieldClass;

function errorDe(e, fallback) {
  const msg = e.response?.data;
  return typeof msg === "string" ? msg : msg?.mensaje || fallback;
}

function vacioVehiculo() {
  return { key: crypto.randomUUID(), patente: "", tipoVehiculoId: "", modalidad: 0, cocheraId: "" };
}

export default function ReservaForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const editando = Boolean(id);
  const [clientes, setClientes] = useState([]);
  const [cocheras, setCocheras] = useState([]);
  const [tipos, setTipos] = useState([]);
  const [config, setConfig] = useState(null);
  const [clienteId, setClienteId] = useState("");
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaVencimiento, setFechaVencimiento] = useState("");
  const [fechaInicioCobro, setFechaInicioCobro] = useState("");
  const [periodicidad, setPeriodicidad] = useState("");
  const [precio, setPrecio] = useState("");
  const [automatica, setAutomatica] = useState(false);
  const [observacion, setObservacion] = useState("");
  const [cocheraIds, setCocheraIds] = useState([]);
  const [vehiculos, setVehiculos] = useState([vacioVehiculo()]);
  const [senaImporte, setSenaImporte] = useState("");
  const [error, setError] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [listo, setListo] = useState(!id);

  useEffect(() => {
    clienteService.getAll(false).then((data) => setClientes(Array.isArray(data) ? data : [])).catch(() => {});
    cocheraService.getAll().then((data) => setCocheras(Array.isArray(data) ? data : [])).catch(() => {});
    tipoVehiculoService.getAll().then((data) => setTipos(Array.isArray(data) ? data : [])).catch(() => {});
    reservaService.getConfig().then((data) => {
      setConfig(data);
      if (data?.exigirSena && data.montoSenaAcordado) setSenaImporte(String(data.montoSenaAcordado));
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!id) return;
    reservaService.getById(id).then((reserva) => {
      setClienteId(reserva.clienteId ? String(reserva.clienteId) : "");
      setNombre(reserva.nombre || "");
      setTelefono(reserva.telefono || "");
      setEmail(reserva.email || "");
      setFechaInicio(reserva.fechaInicio || "");
      setFechaVencimiento(reserva.fechaVencimiento || "");
      setFechaInicioCobro(reserva.fechaInicioCobro || "");
      setPeriodicidad(reserva.periodicidadCobro ?? "");
      setPrecio(reserva.precioAcordado ?? "");
      setAutomatica(Boolean(reserva.automatica));
      setObservacion(reserva.observacion || "");
      setCocheraIds((reserva.cocheras || []).map((c) => c.cocheraId));
      setVehiculos(
        (reserva.vehiculos || []).length
          ? reserva.vehiculos.map((v) => ({
              key: crypto.randomUUID(),
              patente: v.patente || "",
              tipoVehiculoId: String(v.tipoVehiculoId),
              modalidad: Number(v.modalidad),
              cocheraId: v.cocheraId ? String(v.cocheraId) : "",
            }))
          : [vacioVehiculo()]
      );
      setListo(true);
    }).catch((e) => {
      setError(errorDe(e, "No se pudo cargar la reserva"));
      setListo(true);
    });
  }, [id]);

  function toggleCochera(cocheraId) {
    setCocheraIds((prev) => (prev.includes(cocheraId) ? prev.filter((x) => x !== cocheraId) : [...prev, cocheraId]));
  }

  async function guardar(e) {
    e.preventDefault();
    const payload = {
      clienteId: clienteId ? Number(clienteId) : null,
      nombre,
      telefono,
      email,
      fechaInicio,
      fechaVencimiento: fechaVencimiento || null,
      fechaInicioCobro: fechaInicioCobro || null,
      periodicidadCobro: periodicidad === "" ? null : Number(periodicidad),
      politicaPrimerPeriodo: 2,
      precioAcordado: precio === "" ? null : Number(precio),
      automatica,
      observacion,
      cocheraIds,
      vehiculos: automatica
        ? vehiculos
        .filter((v) => v.tipoVehiculoId)
        .map((v) => ({
          patente: v.patente,
          tipoVehiculoId: Number(v.tipoVehiculoId),
          modalidad: Number(v.modalidad),
          cocheraId: Number(v.modalidad) === 0 && v.cocheraId ? Number(v.cocheraId) : null,
        }))
        : [],
      senaImporte: senaImporte === "" ? null : Number(senaImporte),
    };
    try {
      setGuardando(true);
      setError(null);
      const data = editando ? await reservaService.editar(id, payload) : await reservaService.crear(payload);
      navigate(`/reservas/${data.reservaId}`);
    } catch (err) {
      setError(errorDe(err, "No se pudo guardar la reserva"));
    } finally {
      setGuardando(false);
    }
  }

  if (!listo) return <p className="text-sm text-ink-faint">Cargando...</p>;

  return (
    <form onSubmit={guardar} className="space-y-5 max-w-3xl">
      <button type="button" onClick={() => navigate("/reservas")} className="inline-flex items-center gap-1 text-sm text-ink-muted">
        <ArrowLeft size={14} /> Reservas
      </button>
      <h1 className="text-xl font-black text-ink">{editando ? "Editar reserva" : "Nueva reserva"}</h1>
      {error && <p className="px-4 py-3 bg-danger-muted text-danger-ink text-sm">{error}</p>}

      <section className="bg-surface-card p-4 space-y-3">
        <label className="block text-sm">
          <span className="text-xs text-ink-faint">Cliente existente</span>
          <FilterSelect
            className="w-full"
            ariaLabel="Cliente existente"
            value={clienteId}
            onChange={setClienteId}
            options={[
              { value: "", label: "Sin cliente" },
              ...clientes.map((c) => ({ value: c.clienteId, label: c.nombre })),
            ]}
          />
        </label>
        {!clienteId && (
          <div className="grid sm:grid-cols-2 gap-3">
            <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre" className={inputCls} />
            <input value={telefono} onChange={(e) => setTelefono(e.target.value)} placeholder="Teléfono" className={inputCls} />
          </div>
        )}
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Mail (opcional)" className={inputCls} />
      </section>

      <section className="bg-surface-card p-4 grid sm:grid-cols-2 gap-3">
        <label className="text-sm">
          <span className="text-xs text-ink-faint">Fecha de inicio</span>
          <input type="date" required value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} className={inputCls} />
        </label>
        <label className="text-sm">
          <span className="text-xs text-ink-faint">Vencimiento de la reserva</span>
          <input type="date" value={fechaVencimiento} onChange={(e) => setFechaVencimiento(e.target.value)} className={inputCls} />
        </label>
        <label className="flex items-center gap-2 text-sm sm:col-span-2">
          <Checkbox
            checked={automatica}
            disabled={config && !config.permitirReservasAutomaticas && !automatica}
            onChange={(e) => setAutomatica(e.target.checked)}
          />
          Reserva automática
        </label>
        {automatica && (
          <>
            <label className="text-sm">
              <span className="text-xs text-ink-faint">Inicio de cobro</span>
              <input type="date" value={fechaInicioCobro} onChange={(e) => setFechaInicioCobro(e.target.value)} className={inputCls} />
            </label>
            <label className="text-sm">
              <span className="text-xs text-ink-faint">Periodicidad</span>
              <FilterSelect
                className="w-full"
                ariaLabel="Periodicidad"
                value={periodicidad}
                onChange={setPeriodicidad}
                options={[
                  { value: "", label: "Elegir" },
                  ...PERIODICIDAD_OPTIONS.map((p) => ({ value: p.value, label: p.label })),
                ]}
              />
            </label>
            <label className="text-sm">
              <span className="text-xs text-ink-faint">Precio acordado</span>
              <input type="number" min="0" value={precio} onChange={(e) => setPrecio(e.target.value)} className={inputCls} />
            </label>
          </>
        )}
        <label className="text-sm sm:col-span-2">
          <span className="text-xs text-ink-faint">Seña {config?.exigirSena ? "(exigida)" : "(opcional)"}</span>
          <input type="number" min="0" value={senaImporte} onChange={(e) => setSenaImporte(e.target.value)} className={inputCls} />
        </label>
        <textarea value={observacion} onChange={(e) => setObservacion(e.target.value)} placeholder="Observación" className={`${inputCls} sm:col-span-2`} />
      </section>

      <section className="bg-surface-card p-4 space-y-2">
        <h2 className="text-sm font-bold">Cocheras</h2>
        <div className="flex flex-wrap gap-2">
          {cocheras.map((c) => (
            <button
              key={c.cocheraId}
              type="button"
              onClick={() => toggleCochera(c.cocheraId)}
              className={`px-2 py-1 text-xs font-semibold border ${cocheraIds.includes(c.cocheraId) ? "bg-brand text-brand-foreground border-brand" : "border-line"}`}
            >
              {c.numero}
            </button>
          ))}
        </div>
      </section>

      {automatica && (
      <section className="bg-surface-card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold">Vehículos del abono</h2>
          <button type="button" onClick={() => setVehiculos((prev) => [...prev, vacioVehiculo()])} className="text-xs font-semibold inline-flex items-center gap-1">
            <Plus size={12} /> Agregar
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
              options={[
                { value: "", label: "Tipo" },
                ...tipos.map((t) => ({ value: t.tipoVehiculoId, label: t.nombre })),
              ]}
            />
            <FilterSelect
              className="w-full"
              ariaLabel="Modalidad"
              value={v.modalidad}
              onChange={(valor) => setVehiculos((prev) => prev.map((x) => x.key === v.key ? { ...x, modalidad: Number(valor) } : x))}
              options={[
                { value: 0, label: "Fijo" },
                { value: 1, label: "Flexible" },
              ]}
            />
            {Number(v.modalidad) === 0 ? (
              <FilterSelect
                className="w-full"
                ariaLabel="Cochera"
                value={v.cocheraId}
                onChange={(valor) => setVehiculos((prev) => prev.map((x) => x.key === v.key ? { ...x, cocheraId: valor } : x))}
                options={[
                  { value: "", label: "Cochera" },
                  ...cocheras.filter((c) => cocheraIds.includes(c.cocheraId)).map((c) => ({ value: c.cocheraId, label: c.numero })),
                ]}
              />
            ) : (
              <button type="button" onClick={() => setVehiculos((prev) => prev.filter((x) => x.key !== v.key))} className="text-danger-ink text-xs">
                <Trash2 size={14} />
              </button>
            )}
          </div>
        ))}
      </section>
      )}

      <button type="submit" disabled={guardando} className="px-4 py-2.5 text-sm font-semibold bg-brand text-brand-foreground">
        {guardando ? "Guardando..." : "Guardar reserva"}
      </button>
    </form>
  );
}
