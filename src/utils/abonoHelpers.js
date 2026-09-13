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
