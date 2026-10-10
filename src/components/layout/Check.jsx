/** Checkbox de selección, misma línea visual que FilterSelect. */
export default function Check({
  checked,
  onChange,
  disabled = false,
  title,
  className = "",
}) {
  return (
    <input
      type="checkbox"
      checked={checked}
      disabled={disabled}
      title={title}
      onChange={onChange}
      className={`h-4 w-4 shrink-0 accent-brand cursor-pointer disabled:opacity-40 ${className}`}
    />
  );
}
