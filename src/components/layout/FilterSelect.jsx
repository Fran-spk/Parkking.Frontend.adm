import { ChevronDown } from "lucide-react";

/** Campo de texto, fecha o número con la misma caja que el combo. */
export const fieldClass =
  "w-full text-sm border border-line-strong bg-surface-muted text-ink px-3 py-2 placeholder:text-ink-faint focus:outline-none focus:border-brand focus:bg-surface-card disabled:opacity-50";

const comboClass =
  "appearance-none pl-3 pr-8 py-2 text-sm border border-line-strong bg-surface-muted text-ink focus:outline-none focus:border-brand focus:bg-surface-card cursor-pointer disabled:opacity-50";

/**
 * Combo único de la app. `options` es `{ value, label, disabled? }[]`.
 * `onChange` devuelve el value original (número o string).
 */
export default function FilterSelect({
  value,
  onChange,
  options,
  ariaLabel,
  className = "",
  disabled = false,
  required = false,
}) {
  const ancho = /\b(w-full|flex-1)\b/.test(className) ? "w-full" : "";
  return (
    <div className={`relative min-w-0 ${className || "inline-flex"}`}>
      <select
        aria-label={ariaLabel}
        required={required}
        disabled={disabled}
        value={value ?? ""}
        onChange={(e) => {
          const raw = e.target.value;
          const opcion = options.find((o) => String(o.value) === raw);
          onChange?.(opcion ? opcion.value : raw);
        }}
        className={`${comboClass} ${ancho}`}
      >
        {options.map((o) => (
          <option key={String(o.value)} value={o.value} disabled={!!o.disabled}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown
        size={14}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-faint pointer-events-none"
        aria-hidden
      />
    </div>
  );
}
