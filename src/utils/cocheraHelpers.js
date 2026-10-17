/** Estados que se muestran en la grilla de cocheras. El orden es el de la barra de ocupación. */
export const ESTADOS_COCHERA = {
  ocupada: { label: "Ocupada", borde: "border-l-brand", texto: "text-ink", barra: "bg-ink" },
  parcial: { label: "Con lugar", borde: "border-l-success", texto: "text-success-ink", barra: "bg-ink-muted" },
  reservada: { label: "Reservada", borde: "border-l-warning", texto: "text-warning-ink", barra: "bg-warning" },
  libre: { label: "Libre", borde: "border-l-success", texto: "text-success-ink", barra: "bg-success" },
  interno: { label: "Uso interno", borde: "border-l-line-strong", texto: "text-ink-faint", barra: "bg-line-strong" },
};

export const FILTROS_COCHERA = [
  { value: "todas", label: "Todas" },
  { value: "libres", label: "Libres" },
  { value: "ocupadas", label: "Ocupadas" },
  { value: "reservadas", label: "Reservadas" },
  { value: "deuda", label: "Con deuda" },
  { value: "interno", label: "Uso interno" },
];

const USO_INTERNO = 1;

export function estadoCochera(cochera) {
  if (Number(cochera.estadoCochera) === USO_INTERNO) return "interno";
  const abonos = cochera.abonosActivos ?? 0;
  const reservas = (cochera.reservas || []).length;
  const capacidad = cochera.capacidadMaxima ?? 1;
  const ocupados = cochera.cuposOcupados ?? abonos + reservas;
  if (ocupados === 0) return "libre";
  if (ocupados < capacidad) return "parcial";
  return abonos > 0 ? "ocupada" : "reservada";
}

export function cocheraVacia(cochera) {
  return (cochera.ocupantes || []).length === 0 && (cochera.reservas || []).length === 0;
}

export function cocheraConDeuda(cochera, deudas) {
  return (cochera.ocupantes || []).some((o) => deudas.has(o.abonoId));
}

/** Mapa abonoId → alerta de deuda, a partir de las alertas del dashboard. */
export function deudasPorAbono(alertas) {
  return new Map(
    (alertas || []).filter((a) => a.abonoId && Number(a.saldoTotal) > 0).map((a) => [a.abonoId, a])
  );
}

function normalizar(valor) {
  return String(valor || "").replace(/[\s-]/g, "").toUpperCase();
}

export function cocheraCoincide(cochera, busqueda) {
  const texto = normalizar(busqueda);
  if (!texto) return true;
  const campos = [
    cochera.numero,
    ...(cochera.ocupantes || []).flatMap((o) => [o.clienteNombre, ...(o.patentes || [])]),
    ...(cochera.reservas || []).map((r) => r.nombre),
  ];
  return campos.some((v) => normalizar(v).includes(texto));
}

export function pasaFiltro(cochera, filtro, deudas) {
  const estado = estadoCochera(cochera);
  switch (filtro) {
    case "libres":
      return estado === "libre" || estado === "parcial";
    case "ocupadas":
      return estado === "ocupada" || estado === "parcial";
    case "reservadas":
      return (cochera.reservas || []).length > 0;
    case "deuda":
      return cocheraConDeuda(cochera, deudas);
    case "interno":
      return estado === "interno";
    default:
      return true;
  }
}

export function resumenCocheras(cocheras, deudas) {
  const porEstado = { ocupada: 0, parcial: 0, reservada: 0, libre: 0, interno: 0 };
  for (const c of cocheras) porEstado[estadoCochera(c)] += 1;

  const cantidades = Object.fromEntries(
    FILTROS_COCHERA.map((f) => [f.value, cocheras.filter((c) => pasaFiltro(c, f.value, deudas)).length])
  );

  const ofrecidas = cocheras.length - porEstado.interno;
  const usadas = porEstado.ocupada + porEstado.parcial + porEstado.reservada;

  return {
    porEstado,
    cantidades,
    ocupacionPct: ofrecidas > 0 ? Math.round((usadas / ofrecidas) * 100) : 0,
  };
}

export function fechaCorta(iso) {
  if (!iso) return "—";
  const [y, m, d] = String(iso).split("T")[0].split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" });
}

export function plataEntera(n) {
  return Number(n || 0).toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });
}
