import { Search } from "lucide-react";

/**
 * SearchField — textbox de búsqueda estándar (referencia: Pagos pendientes).
 *
 * Usar en toolbars de listados. No reinventar input + ícono Search.
 *
 * `onChange` recibe el string (compatible con `setBusqueda`).
 *
 * @example
 * <SearchField
 *   value={busqueda}
 *   onChange={setBusqueda}
 *   placeholder="Cliente, cochera, patente…"
 * />
 */
export default function SearchField({
  value,
  onChange,
  placeholder = "Buscar…",
  className = "flex-1 min-w-[200px] max-w-sm",
  inputClassName = "",
  name,
  id,
  autoFocus = false,
  disabled = false,
  type = "search",
  onKeyDown,
  ...rest
}) {
  return (
    <div className={`relative ${className}`}>
      <Search
        size={14}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint pointer-events-none"
        aria-hidden
      />
      <input
        type={type}
        id={id}
        name={name}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        autoFocus={autoFocus}
        disabled={disabled}
        className={`w-full pl-9 pr-3 py-2 text-sm border border-line-strong bg-surface-muted text-ink placeholder:text-ink-faint focus:outline-none focus:border-brand focus:bg-surface-card disabled:opacity-50 ${inputClassName}`}
        {...rest}
      />
    </div>
  );
}
