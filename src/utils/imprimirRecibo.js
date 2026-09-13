import { parkkingTheme } from "../theme/parkking.theme.js";

function formatMoney(n) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 2,
  }).format(Number(n) || 0);
}

function formatFecha(fecha) {
  if (!fecha) return "—";
  return new Date(fecha).toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function row(label, value, opts = {}) {
  if (value == null || value === "") return "";
  const cls = opts.strong ? "row strong" : "row";
  return `<div class="${cls}"><span class="label">${escapeHtml(label)}</span><span class="val">${opts.raw ? value : escapeHtml(value)}</span></div>`;
}

function buildReciboHtml(recibo, meta = {}) {
  const t = parkkingTheme.colors;
  const titulo = meta.nombreEstacionamiento || "Parkking";
  const numero = recibo.numeroFormateado || recibo.numero || recibo.reciboId;
  const total = recibo.total ?? Number(recibo.monto) + Number(recibo.recargo || 0);
  const anulado = recibo.anulado
    ? `<div class="badge">ANULADO${recibo.motivoAnulacion ? ` — ${escapeHtml(recibo.motivoAnulacion)}` : ""}</div>`
    : "";

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <title>Recibo ${escapeHtml(numero)}</title>
  <style>
    @page { margin: 10mm; size: auto; }
    * { box-sizing: border-box; }
    html, body {
      margin: 0;
      padding: 0;
      background: ${t.surface.card};
      color: ${t.ink.DEFAULT};
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    body {
      font-family: ${parkkingTheme.font.sans};
      font-size: 12.5px;
      line-height: 1.45;
    }
    .sheet {
      width: 100%;
      max-width: 360px;
      margin: 0 auto;
      padding: 8px 4px 16px;
    }
    .brand {
      text-align: center;
      padding-bottom: 12px;
      border-bottom: 2px solid ${t.ink.DEFAULT};
    }
    .brand .mark {
      display: inline-block;
      width: 28px;
      height: 28px;
      line-height: 28px;
      border-radius: 8px;
      background: ${t.brand.DEFAULT};
      color: ${t.brand.foreground};
      font-weight: 800;
      font-size: 14px;
      margin-bottom: 8px;
    }
    .brand h1 {
      margin: 0;
      font-size: 17px;
      font-weight: 800;
      letter-spacing: -0.02em;
    }
    .brand .addr {
      margin-top: 4px;
      color: ${t.ink.muted};
      font-size: 11px;
    }
    .doc-title {
      text-align: center;
      margin: 14px 0 4px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: ${t.brand.DEFAULT};
    }
    .num {
      text-align: center;
      font-size: 20px;
      font-weight: 800;
      letter-spacing: 0.04em;
      font-variant-numeric: tabular-nums;
    }
    .fecha {
      text-align: center;
      color: ${t.ink.muted};
      font-size: 11px;
      margin-top: 2px;
    }
    .badge {
      margin: 10px auto 0;
      width: fit-content;
      background: ${t.danger.muted};
      color: ${t.danger.ink};
      border: 1px solid ${t.danger.DEFAULT}33;
      font-weight: 800;
      font-size: 10px;
      letter-spacing: 0.06em;
      padding: 5px 10px;
      border-radius: ${parkkingTheme.radius.pill};
    }
    .sep {
      border: none;
      border-top: 1px dashed ${t.line.strong};
      margin: 14px 0;
    }
    .block { margin: 0; }
    .row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 16px;
      margin: 7px 0;
    }
    .row .label {
      color: ${t.ink.muted};
      flex-shrink: 0;
    }
    .row .val {
      font-weight: 600;
      text-align: right;
      word-break: break-word;
    }
    .row.strong .val { font-weight: 800; }
    .totals {
      background: ${t.brand.muted};
      border: 1px solid ${t.brand.soft};
      border-radius: 10px;
      padding: 10px 12px;
      margin-top: 4px;
    }
    .totals .row { margin: 5px 0; }
    .totals .grand {
      margin-top: 8px;
      padding-top: 8px;
      border-top: 1px solid ${t.brand.soft};
      font-size: 15px;
      font-weight: 800;
    }
    .totals .grand .label { color: ${t.brand.DEFAULT}; font-weight: 800; }
    .obs {
      color: ${t.ink.muted};
      font-size: 11px;
      background: ${t.surface.muted};
      border-radius: 8px;
      padding: 8px 10px;
    }
    .foot {
      margin-top: 22px;
      text-align: center;
      color: ${t.ink.faint};
      font-size: 10px;
    }
    .foot .thanks {
      color: ${t.ink.DEFAULT};
      font-weight: 600;
      margin-bottom: 4px;
    }
    @media print {
      html, body { background: ${t.surface.card}; }
      .sheet { max-width: none; padding: 0; }
    }
  </style>
</head>
<body>
  <div class="sheet">
    <div class="brand">
      <div class="mark">P</div>
      <h1>${escapeHtml(titulo)}</h1>
      ${meta.direccion ? `<div class="addr">${escapeHtml(meta.direccion)}</div>` : ""}
    </div>

    <div class="doc-title">Recibo de pago</div>
    <div class="num">Nº ${escapeHtml(numero)}</div>
    <div class="fecha">${escapeHtml(formatFecha(recibo.fechaEmision))}</div>
    ${anulado}

    <hr class="sep" />

    <div class="block">
      ${row("Cliente", recibo.clienteNombre)}
      ${row("Cochera(s)", recibo.cocherasLabel)}
      ${row("Patente(s)", recibo.patentesLabel)}
      ${row("Período(s)", recibo.periodosLabel)}
      ${row("Cobrador", recibo.cobrador)}
      ${row("Forma de pago", recibo.metodoPagoLabel)}
    </div>

    <hr class="sep" />

    <div class="totals">
      ${row("Monto", formatMoney(recibo.monto), { raw: true })}
      ${Number(recibo.recargo) > 0 ? row("Recargo", formatMoney(recibo.recargo), { raw: true }) : ""}
      <div class="row grand"><span class="label">Total</span><span class="val">${formatMoney(total)}</span></div>
    </div>

    ${recibo.observacion ? `<hr class="sep" /><div class="obs"><strong>Obs.</strong> ${escapeHtml(recibo.observacion)}</div>` : ""}

    <div class="foot">
      <div class="thanks">Gracias por su pago</div>
      Comprobante interno · Parkking
    </div>
  </div>
</body>
</html>`;
}

/**
 * Imprime el recibo usando un iframe oculto (solo diálogo de vista previa,
 * sin abrir pestaña/ventana en blanco).
 */
export function imprimirReciboPdf(recibo, meta = {}) {
  if (!recibo) return;

  const html = buildReciboHtml(recibo, meta);

  const prev = document.getElementById("parkking-recibo-print");
  if (prev) prev.remove();

  const iframe = document.createElement("iframe");
  iframe.id = "parkking-recibo-print";
  iframe.setAttribute("aria-hidden", "true");
  iframe.setAttribute("title", "Impresión de recibo");
  Object.assign(iframe.style, {
    position: "fixed",
    right: "0",
    bottom: "0",
    width: "0",
    height: "0",
    border: "0",
    opacity: "0",
    pointerEvents: "none",
  });

  document.body.appendChild(iframe);

  const win = iframe.contentWindow;
  const doc = win?.document;
  if (!win || !doc) {
    iframe.remove();
    alert("No se pudo preparar la impresión del recibo.");
    return;
  }

  const cleanup = () => {
    setTimeout(() => {
      try {
        iframe.remove();
      } catch {
        /* ignore */
      }
    }, 800);
  };

  win.onafterprint = cleanup;

  doc.open();
  doc.write(html);
  doc.close();

  setTimeout(() => {
    try {
      win.focus();
      win.print();
    } catch {
      cleanup();
    }
  }, 150);
}

/**
 * Carga el recibo por id o pagoId e imprime.
 */
export async function imprimirReciboDesdeApi({
  reciboId,
  pagoId,
  getById,
  getByPago,
  meta,
}) {
  let recibo = null;
  if (reciboId && getById) recibo = await getById(reciboId);
  else if (pagoId && getByPago) recibo = await getByPago(pagoId);
  if (!recibo) throw new Error("No se encontró el recibo");
  imprimirReciboPdf(recibo, meta);
  return recibo;
}
