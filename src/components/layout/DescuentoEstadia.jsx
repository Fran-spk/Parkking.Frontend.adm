import FilterSelect from "./FilterSelect";

/**
 * Descuento de una estadía, dentro del panel de cobro.
 * Porcentaje o importe, con motivo. Una sola vez, antes del primer pago.
 */
export default function DescuentoEstadia({ tipo, valor, motivo, onChange }) {
  const activo = tipo !== "" && tipo != null;

  function set(campo, valorCampo) {
    onChange({ tipo, valor, motivo, [campo]: valorCampo });
  }

  return (
    <div className="border border-line bg-surface-muted px-3 py-2 space-y-2">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wide text-ink-faint">Descuento</p>
        <p className="text-[11px] text-ink-muted">Una sola vez, antes del primer cobro.</p>
      </div>
      <FilterSelect
        className="w-full"
        ariaLabel="Tipo de descuento"
        value={tipo ?? ""}
        onChange={(v) => onChange({ tipo: v, valor: v === "" ? "" : valor, motivo: v === "" ? "" : motivo })}
        options={[
          { value: "", label: "Sin descuento" },
          { value: 0, label: "Porcentaje" },
          { value: 1, label: "Importe" },
        ]}
      />
      {activo && (
        <div className="grid grid-cols-2 gap-2">
          <label className="block">
            <span className="text-[10px] font-bold uppercase tracking-wide text-ink-faint">
              {Number(tipo) === 0 ? "Porcentaje" : "Importe"}
            </span>
            <input
              type="number"
              min="0"
              step="0.01"
              required
              value={valor}
              onChange={(e) => set("valor", e.target.value)}
              className="mt-0.5 w-full bg-surface-card border border-line-strong px-2 py-1.5 text-sm text-ink outline-none focus:border-brand tabular-nums"
            />
          </label>
          <label className="block">
            <span className="text-[10px] font-bold uppercase tracking-wide text-ink-faint">Motivo</span>
            <input
              required
              value={motivo}
              onChange={(e) => set("motivo", e.target.value)}
              className="mt-0.5 w-full bg-surface-card border border-line-strong px-2 py-1.5 text-sm text-ink outline-none focus:border-brand"
            />
          </label>
        </div>
      )}
    </div>
  );
}
