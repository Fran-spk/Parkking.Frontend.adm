const TAMANOS = {
  sm: "border-t-[2px] px-1 py-px text-[11px] tracking-[0.1em]",
  md: "border-t-[3px] px-1.5 py-0.5 text-[12px] tracking-[0.12em]",
  lg: "border-t-[3px] px-1.5 py-0.5 text-[13px] tracking-[0.12em]",
};

/** Patente con forma de chapa: borde, franja superior del color de la marca y letra monoespaciada. */
export default function Patente({ valor, size = "md" }) {
  return (
    <span
      className={`inline-block border border-ink border-t-brand bg-surface-card font-mono font-bold text-ink leading-none ${TAMANOS[size] || TAMANOS.md}`}
    >
      {valor}
    </span>
  );
}
