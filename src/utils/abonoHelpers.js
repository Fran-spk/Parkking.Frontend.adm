/** Helpers para el nuevo modelo Abono (N plazas + N vehículos). */

export const MODALIDAD = {
  FIJO: 0,
  FLEXIBLE: 1,
};

export function abonoIdOf(abono) {
  return abono?.abonoId ?? abono?.abonoCocheraId ?? null;
}

export function plazasDe(abono) {
  if (Array.isArray(abono?.plazas) && abono.plazas.length > 0) {
    return abono.plazas.filter(p => p.activo !== false);
  }
  if (abono?.cocheraId || abono?.cochera) {
    return [{
      abonoPlazaId: null,
      cocheraId: abono.cocheraId ?? abono.cochera?.cocheraId,
      activo: true,
      cochera: abono.cochera,
    }];
  }
  return [];
}

export function vehiculosDe(abono) {
  if (Array.isArray(abono?.vehiculos) && abono.vehiculos.length > 0) {
    return abono.vehiculos;
  }
  if (Array.isArray(abono?.abonoVehiculos) && abono.abonoVehiculos.length > 0) {
    return abono.abonoVehiculos.map((av) => ({
      abonoVehiculoId: av.abonoVehiculoId,
      vehiculoId: av.vehiculoId ?? av.vehiculo?.vehiculoId,
      patente: av.patente ?? av.vehiculo?.patente,
      modeloVehiculo: av.modeloVehiculo ?? av.vehiculo?.modeloVehiculo,
      tipoVehiculoId: av.tipoVehiculoId ?? av.vehiculo?.tipoVehiculoId,
      tipoVehiculo: av.tipoVehiculo ?? av.vehiculo?.tipoVehiculo,
      modalidad: av.modalidad,
      abonoPlazaId: av.abonoPlazaId,
      plaza: av.plaza,
    }));
  }
  if (abono?.patente || abono?.tipoVehiculoId || abono?.tipoVehiculo) {
    return [{
      abonoVehiculoId: null,
      patente: abono.patente,
      modeloVehiculo: abono.modeloVehiculo,
      tipoVehiculoId: abono.tipoVehiculoId,
      tipoVehiculo: abono.tipoVehiculo,
      modalidad: MODALIDAD.FIJO,
      abonoPlazaId: null,
      plaza: abono.cochera,
    }];
  }
  return [];
}

export function labelCocheras(abono) {
  const nums = plazasDe(abono)
    .map(p => p.cochera?.numero)
    .filter(Boolean);
  if (nums.length === 0) return "Sin cochera";
  return nums.join(", ");
}

export function labelPatentes(abono) {
  const pats = vehiculosDe(abono)
    .map(v => v.patente)
    .filter(Boolean);
  return pats.length ? pats.join(" · ") : null;
}

export function abonoIncluyeCochera(abono, cocheraId) {
  return plazasDe(abono).some(p => p.cocheraId === cocheraId || p.cochera?.cocheraId === cocheraId);
}

export function modalidadLabel(modalidad) {
  return Number(modalidad) === MODALIDAD.FLEXIBLE ? "Flexible" : "Fijo";
}

export function nombreTipoVehiculo(vehiculo) {
  return vehiculo?.tipoVehiculo?.nombre || vehiculo?.tipoVehiculoNombre || null;
}

export const FILTROS_ABONO = [
  { value: "todos", label: "Todos" },
  { value: "deuda", label: "Con deuda" },
  { value: "aldia", label: "Al día" },
];

export function esActivo(abono) {
  return abono?.activo === true || abono?.activo === "true" || abono?.estado === 1;
}

export function deudaDe(abono) {
  return Number(abono?.deuda ?? abono?.montoDeuda ?? 0);
}

export function estadoAbono(abono) {
  if (!esActivo(abono)) return { id: "baja", label: "Dado de baja", texto: "text-ink-faint" };
  const deuda = deudaDe(abono);
  if (deuda > 0) return { id: "deuda", label: `Debe ${plataAbono(deuda)}`, texto: "text-danger-ink" };
  return { id: "aldia", label: "Al día", texto: "text-success-ink" };
}

export function pasaFiltroAbono(abono, filtro) {
  if (filtro === "deuda") return esActivo(abono) && deudaDe(abono) > 0;
  if (filtro === "aldia") return esActivo(abono) && deudaDe(abono) <= 0;
  return true;
}

export function resumenAbonos(abonos) {
  const activos = abonos.filter(esActivo);
  const conDeuda = activos.filter((a) => deudaDe(a) > 0);
  const deudaTotal = conDeuda.reduce((s, a) => s + deudaDe(a), 0);
  return {
    activos: activos.length,
    conDeuda: conDeuda.length,
    alDia: activos.length - conDeuda.length,
    deudaTotal,
    cantidades: Object.fromEntries(FILTROS_ABONO.map((f) => [f.value, abonos.filter((a) => pasaFiltroAbono(a, f.value)).length])),
  };
}

export function plataAbono(n) {
  return Number(n ?? 0).toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });
}

/** Texto de búsqueda unificado. */
export function abonoSearchText(abono) {
  const parts = [
    abono?.cliente?.nombre,
    abono?.cobrador,
    labelCocheras(abono),
    ...plazasDe(abono).map(p => p.cochera?.categoriaCochera?.nombre),
    ...vehiculosDe(abono).flatMap(v => [v.patente, v.modeloVehiculo, v.tipoVehiculo?.nombre]),
  ];
  return parts.filter(Boolean).join(" ").toLowerCase();
}
