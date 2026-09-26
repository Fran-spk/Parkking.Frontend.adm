import { useNavigate } from "react-router-dom";
import { AlertTriangle, Car, ChevronRight } from "lucide-react";

function formatPrecio(n) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(Number(n) || 0);
}

/**
 * “Feed” de abonos: cards rectas (sin radius), estilo posts.
 * Prioriza deudores; completa con ocupantes del mapa si hace falta.
 */
export default function HomeAbonosFeed({ alertas = [], estadoCocheras = [] }) {
  const navigate = useNavigate();

  const fromAlertas = (alertas || []).map((a) => ({
    key: `alerta-${a.abonoId ?? a.abonoCocheraId}`,
    abonoId: a.abonoId ?? a.abonoCocheraId,
    titulo: a.clienteNombre || "Cliente",
    sub: [a.cocheraNumero ? `Cochera ${a.cocheraNumero}` : null, a.diasAtraso ? `${a.diasAtraso}d atraso` : null]
      .filter(Boolean)
      .join(" · "),
    monto: a.saldoTotal ?? a.precioAcordado,
    tono: "debt",
  }));

  const seen = new Set(fromAlertas.map((x) => x.abonoId));
  const fromMapa = [];
  for (const c of estadoCocheras || []) {
    for (const o of c.ocupantes || []) {
      if (!o.abonoId || seen.has(o.abonoId)) continue;
      seen.add(o.abonoId);
      fromMapa.push({
        key: `ocup-${o.abonoId}`,
        abonoId: o.abonoId,
        titulo: o.clienteNombre || "Cliente",
        sub: [c.numero ? `Cochera ${c.numero}` : null, o.patente].filter(Boolean).join(" · "),
        monto: null,
        tono: "ok",
      });
    }
  }

  const items = [...fromAlertas, ...fromMapa].slice(0, 12);

  return (
    <section className="bg-white">
      <div className="px-4 sm:px-6 py-3 flex items-center justify-between">
        <h2 className="text-sm font-bold text-ink tracking-tight">Abonos</h2>
        <button
          type="button"
          onClick={() => navigate("/abonos")}
          className="text-[11px] font-semibold text-brand hover:text-brand-strong"
        >
          Ver todos
        </button>
      </div>

      {items.length === 0 ? (
        <div className="px-4 py-10 text-center text-sm text-ink-muted">
          Todavía no hay abonos para mostrar en el feed.
        </div>
      ) : (
        <div className="divide-y divide-line">
          {items.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => item.abonoId && navigate(`/pagosAbono/${item.abonoId}`)}
              className="w-full flex items-stretch text-left hover:bg-surface-muted/80 transition-colors"
            >
              {/* “Foto” cuadrada sin curvas */}
              <div
                className={`w-16 sm:w-20 shrink-0 flex items-center justify-center ${
                  item.tono === "debt" ? "bg-rose-600 text-white" : "bg-brand text-brand-foreground"
                }`}
              >
                {item.tono === "debt" ? <AlertTriangle size={22} /> : <Car size={22} />}
              </div>

              <div className="flex-1 min-w-0 px-3.5 py-3 flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-ink truncate">{item.titulo}</p>
                  <p className="text-[11px] text-ink-muted mt-0.5 truncate">{item.sub || "Abono activo"}</p>
                  {item.monto != null && Number(item.monto) > 0 && (
                    <p className="text-xs font-semibold text-rose-600 mt-1 tabular-nums">
                      {formatPrecio(item.monto)} pendientes
                    </p>
                  )}
                </div>
                <ChevronRight size={16} className="text-ink-faint shrink-0" />
              </div>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
