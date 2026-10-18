import { TipoMovimiento, etiquetaMovimiento } from "../types/finanzas.js";

export const FILTROS_MOVIMIENTO = [
  { value: "todos", label: "Todos" },
  { value: "0", label: "Ingresos" },
  { value: "1", label: "Egresos" },
  { value: "3", label: "Ajustes" },
  { value: "2", label: "Reintegros" },
];

export function pasaFiltroMov(m, filtro) {
  if (!filtro || filtro === "todos") return true;
  return String(m.tipo) === String(filtro);
}

export function coincideMov(m, busqueda, nombreCliente) {
  const q = busqueda.trim().toLowerCase();
  if (!q) return true;
  return [
    m.concepto,
    etiquetaMovimiento(m),
    m.tipoDescripcion,
    nombreCliente,
    m.clienteId,
  ].some((v) => String(v || "").toLowerCase().includes(q));
}

export function bordeMov(importe) {
  return Number(importe) < 0 ? "border-l-danger" : "border-l-success";
}

export function resumenMovimientos(lista) {
  const cantidades = { todos: lista.length, "0": 0, "1": 0, "2": 0, "3": 0 };
  let ingresos = 0;
  let egresos = 0;
  for (const m of lista) {
    const tipo = String(m.tipo);
    if (cantidades[tipo] != null) cantidades[tipo] += 1;
    const n = Number(m.importe) || 0;
    if (n > 0) ingresos += n;
    else egresos += Math.abs(n);
  }
  return { cantidades, ingresos, egresos, neto: ingresos - egresos };
}

export { TipoMovimiento, etiquetaMovimiento };
