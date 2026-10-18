import { useEffect, useState } from "react";
import PageHeader, { PageHeaderAction } from "../../components/layout/PageHeader";
import Checkbox from "../../components/layout/Check";
import { fieldClass } from "../../components/layout/FilterSelect";
import { reservaService } from "../../services/reservaService";

function errorDe(e, fallback) {
  const msg = e.response?.data;
  return typeof msg === "string" ? msg : msg?.mensaje || fallback;
}

export default function ReservasConfig({ embedded = false }) {
  const [config, setConfig] = useState(null);
  const [error, setError] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [exito, setExito] = useState(false);

  useEffect(() => {
    reservaService
      .getConfig()
      .then(setConfig)
      .catch((e) => setError(errorDe(e, "No se pudo cargar la configuración")));
  }, []);

  function set(campo, valor) {
    setConfig((prev) => ({ ...prev, [campo]: valor }));
    setExito(false);
    setError(null);
  }

  async function guardar(e) {
    e.preventDefault();
    try {
      setGuardando(true);
      setError(null);
      setExito(false);
      const data = await reservaService.guardarConfig({
        exigirSena: Boolean(config.exigirSena),
        montoSenaAcordado: config.exigirSena ? Number(config.montoSenaAcordado) : null,
        permitirReservasAutomaticas: Boolean(config.permitirReservasAutomaticas),
      });
      setConfig(data);
      setExito(true);
    } catch (err) {
      setError(errorDe(err, "No se pudo guardar la configuración"));
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className={embedded ? "space-y-4" : "space-y-6 animate-fade-in-up"}>
      {!embedded && (
        <PageHeader
          title="Reservas"
          description="Seña y reservas automáticas del estacionamiento."
        />
      )}

      {error && <p className="px-4 py-3 bg-danger-muted text-danger-ink text-sm">{error}</p>}

      {!config ? (
        <p className="text-sm text-ink-faint">Cargando...</p>
      ) : (
        <form onSubmit={guardar} className="bg-surface-card p-5 space-y-4 max-w-xl">
          <label className="flex items-center gap-2 pk-caption font-semibold text-ink cursor-pointer select-none">
            <Checkbox
              checked={Boolean(config.exigirSena)}
              onChange={(e) => set("exigirSena", e.target.checked)}
            />
            Exigir seña
          </label>
          <label className="block space-y-1">
            <span className="pk-caption font-semibold">Monto de seña acordado</span>
            <div className="w-40">
              <input
                type="number"
                min="0"
                step="0.01"
                value={config.montoSenaAcordado ?? ""}
                onChange={(e) => set("montoSenaAcordado", e.target.value)}
                disabled={!config.exigirSena}
                className={fieldClass}
              />
            </div>
          </label>
          <label className="flex items-center gap-2 pk-caption font-semibold text-ink cursor-pointer select-none">
            <Checkbox
              checked={Boolean(config.permitirReservasAutomaticas)}
              onChange={(e) => set("permitirReservasAutomaticas", e.target.checked)}
            />
            Permitir reservas automáticas
          </label>
          <div className="flex items-center gap-3">
            <PageHeaderAction type="submit" disabled={guardando}>
              {guardando ? "Guardando..." : "Guardar"}
            </PageHeaderAction>
            {exito && <span className="pk-caption font-semibold">Guardado</span>}
          </div>
        </form>
      )}
    </div>
  );
}
