export const FILTROS_CLIENTE = [
  { value: "todos", label: "Todos" },
  { value: "abonados", label: "Con abono" },
  { value: "deuda", label: "Con deuda" },
  { value: "sin", label: "Sin abono" },
];

export const ORDENES_CLIENTE = [
  { value: "nombre", label: "Ordenar por nombre" },
  { value: "deuda", label: "Mayor deuda" },
  { value: "atraso", label: "Más atraso" },
  { value: "pago", label: "Pago más reciente" },
];

export const PERIODICIDADES = ["Mensual", "Quincenal", "Bimestral", "Trimestral", "Semestral", "Anual"];

export function estadoCuenta(c) {
  if (!c.activo) return { id: "baja", label: "Dado de baja", texto: "text-ink-faint" };
  if (c.deuda > 0) return { id: "deuda", label: `Debe ${plata(c.deuda)}`, texto: "text-danger-ink" };
  if (c.abonosActivos > 0) return { id: "aldia", label: "Al día", texto: "text-success-ink" };
  if (c.abonosPendientes > 0) return { id: "pendiente", label: "Abono por empezar", texto: "text-warning-ink" };
  return { id: "sin", label: "Sin abono", texto: "text-ink-faint" };
}

export function pasaFiltro(c, filtro) {
  if (filtro === "abonados") return c.abonosActivos > 0;
  if (filtro === "deuda") return c.deuda > 0;
  if (filtro === "sin") return c.abonosActivos === 0 && c.abonosPendientes === 0;
  return true;
}

const normalizar = (s) => String(s ?? "").toLowerCase().replace(/[\s.-]/g, "");

export function clienteCoincide(c, busqueda) {
  const q = normalizar(busqueda);
  if (!q) return true;
  return [c.nombre, c.documento, c.telefono, c.email, c.domicilio, ...(c.patentes ?? []), ...(c.cocheras ?? [])].some(
    (v) => normalizar(v).includes(q)
  );
}

export function ordenarClientes(lista, orden) {
  const copia = [...lista];
  const porNombre = (a, b) => a.nombre.localeCompare(b.nombre, "es");
  if (orden === "deuda") return copia.sort((a, b) => b.deuda - a.deuda || porNombre(a, b));
  if (orden === "atraso") return copia.sort((a, b) => b.diasAtraso - a.diasAtraso || porNombre(a, b));
  if (orden === "pago")
    return copia.sort(
      (a, b) => (b.ultimoPago ? Date.parse(b.ultimoPago) : 0) - (a.ultimoPago ? Date.parse(a.ultimoPago) : 0) || porNombre(a, b)
    );
  return copia.sort(porNombre);
}

export function resumenClientes(clientes) {
  const activos = clientes.filter((c) => c.activo);
  const conDeuda = activos.filter((c) => c.deuda > 0);
  return {
    activos: activos.length,
    abonados: activos.filter((c) => c.abonosActivos > 0).length,
    conDeuda: conDeuda.length,
    deudaTotal: conDeuda.reduce((s, c) => s + c.deuda, 0),
    cantidades: Object.fromEntries(FILTROS_CLIENTE.map((f) => [f.value, clientes.filter((c) => pasaFiltro(c, f.value)).length])),
  };
}

export function whatsappUrl(telefono) {
  const digitos = String(telefono ?? "").replace(/\D/g, "");
  if (!digitos) return null;
  return `https://wa.me/${digitos.startsWith("54") ? digitos : `549${digitos}`}`;
}

export function plata(n) {
  return Number(n ?? 0).toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });
}

export function fechaCorta(f) {
  if (!f) return "—";
  const d = typeof f === "string" && /^\d{4}-\d{2}-\d{2}$/.test(f) ? new Date(`${f}T00:00:00`) : new Date(f);
  return d.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "2-digit" });
}

export function haceCuanto(f) {
  if (!f) return null;
  const dias = Math.floor((Date.now() - Date.parse(f)) / 86400000);
  if (dias <= 0) return "hoy";
  if (dias === 1) return "ayer";
  if (dias < 31) return `hace ${dias} d`;
  const meses = Math.floor(dias / 30);
  return meses < 12 ? `hace ${meses} ${meses === 1 ? "mes" : "meses"}` : "hace más de un año";
}
