import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Recycle } from "lucide-react";
import { reservaService } from "../services/reservaService";
import { ACCIONES, permisosStore } from "../utils/permisosStore";
import PageHeader, { PageHeaderAction } from "../components/layout/PageHeader";
import FilterSelect from "../components/layout/FilterSelect";

const ESTADOS = [
  { id: "", label: "Todas" },
  { id: 0, label: "Vigentes" },
  { id: 1, label: "Vencidas" },
  { id: 2, label: "De baja" },
  { id: 3, label: "Transformadas" },
];

const ESTADO_LABEL = { 0: "Vigente", 1: "Vencida", 2: "Baja", 3: "Transformada" };

function errorDe(e, fallback) {
  const msg = e.response?.data;
  return typeof msg === "string" ? msg : msg?.mensaje || fallback;
}

function nombreDe(reserva) {
  return reserva.clienteNombre || reserva.nombre || "Sin nombre";
}

export default function Reservas() {
  const navigate = useNavigate();
  const [reservas, setReservas] = useState([]);
  const [estado, setEstado] = useState(0);
  const [error, setError] = useState(null);
  const puedeCrear = permisosStore.tieneAccion(ACCIONES.CrearReservas);
  const puedeTransformar = permisosStore.tieneAccion(ACCIONES.TransformarReservas);

  useEffect(() => {
    reservaService.getAll().then((data) => setReservas(Array.isArray(data) ? data : [])).catch((e) => setError(errorDe(e, "No se pudieron cargar las reservas")));
  }, []);

  const visibles = reservas.filter((r) => estado === "" || Number(r.estado) === Number(estado));

  return (
    <div className="space-y-5">
      <PageHeader
        title="Reservas"
        description="Apartado de cocheras."
        stats={[{ label: "Listadas", value: visibles.length }]}
        action={
          puedeCrear ? (
            <PageHeaderAction onClick={() => navigate("/reservas/nueva")}>
              <Plus size={14} /> Nueva reserva
            </PageHeaderAction>
          ) : null
        }
      />

      {error && <p className="px-4 py-3 bg-danger-muted text-danger-ink text-sm">{error}</p>}

      <FilterSelect
        ariaLabel="Filtrar reservas"
        value={estado}
        onChange={setEstado}
        options={ESTADOS.map((item) => ({ value: item.id, label: item.label }))}
      />

      <div className="bg-surface-card divide-y divide-line">
        {visibles.length === 0 ? (
          <p className="px-4 py-8 text-sm text-ink-faint text-center">No hay reservas</p>
        ) : (
          visibles.map((reserva) => (
            <div
              key={reserva.reservaId}
              className="w-full px-4 py-3 flex items-center justify-between gap-3 hover:bg-surface-muted"
            >
              <button
                type="button"
                onClick={() => navigate(`/reservas/${reserva.reservaId}`)}
                className="min-w-0 flex-1 text-left"
              >
                <p className="text-sm font-bold text-ink">
                  {nombreDe(reserva)}
                  {reserva.automatica ? <span className="ml-2 text-[10px] uppercase text-amber-800">Automática</span> : null}
                </p>
                <p className="text-xs text-ink-faint">
                  Inicio {reserva.fechaInicio}
                  {reserva.cocheras?.length ? ` · ${reserva.cocheras.map((c) => c.numero).join(", ")}` : " · Sin cochera"}
                </p>
              </button>
              <span className="text-xs font-semibold text-ink-muted">{ESTADO_LABEL[reserva.estado] || reserva.estado}</span>
              {puedeTransformar && Number(reserva.estado) === 0 && !reserva.automatica && (
                <button
                  type="button"
                  title="Transformar abono"
                  aria-label={`Transformar abono de ${nombreDe(reserva)}`}
                  onClick={() => navigate(`/reservas/${reserva.reservaId}`)}
                  className="p-1.5 text-brand hover:bg-brand-muted"
                >
                  <Recycle size={16} />
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
