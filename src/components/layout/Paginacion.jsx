const POR_PAGINA = 10;

export function paginaDe(lista, pagina, porPagina = POR_PAGINA) {
  const inicio = (pagina - 1) * porPagina;
  return lista.slice(inicio, inicio + porPagina);
}

export default function Paginacion({ pagina, total, porPagina = POR_PAGINA, onChange }) {
  const paginas = Math.max(1, Math.ceil(total / porPagina));
  if (total <= porPagina) {
    return total > 0 ? <p className="pk-caption tabular-nums">{total}</p> : null;
  }
  const desde = (pagina - 1) * porPagina + 1;
  const hasta = Math.min(pagina * porPagina, total);

  return (
    <div className="flex items-center justify-between gap-3">
      <p className="pk-caption tabular-nums">
        {desde}–{hasta} de {total}
      </p>
      <div className="flex items-center gap-1">
        <button
          type="button"
          disabled={pagina <= 1}
          onClick={() => onChange(pagina - 1)}
          className="px-2.5 py-1.5 text-xs font-semibold text-ink-muted border border-line-strong disabled:opacity-30"
        >
          Anterior
        </button>
        <span className="px-2 pk-caption tabular-nums">
          {pagina} / {paginas}
        </span>
        <button
          type="button"
          disabled={pagina >= paginas}
          onClick={() => onChange(pagina + 1)}
          className="px-2.5 py-1.5 text-xs font-semibold text-ink-muted border border-line-strong disabled:opacity-30"
        >
          Siguiente
        </button>
      </div>
    </div>
  );
}
