/**
 * @typedef {import('./shared.js').ClienteResumen} ClienteResumen
 * @typedef {import('./shared.js').CocheraResumen} CocheraResumen
 * @typedef {import('./shared.js').TipoVehiculo} TipoVehiculo
 */

/**
 * @typedef {object} AbonoPlaza
 * @property {number} abonoPlazaId
 * @property {number} abonoId
 * @property {number} cocheraId
 * @property {boolean} activo
 * @property {CocheraResumen | null} [cochera]
 */

/**
 * @typedef {object} AbonoVehiculo
 * @property {number} abonoVehiculoId
 * @property {number} abonoId
 * @property {number} vehiculoId
 * @property {number} modalidad
 * @property {number | null} abonoPlazaId
 * @property {string} patente
 * @property {string | null} modeloVehiculo
 * @property {number} tipoVehiculoId
 * @property {TipoVehiculo | null} [tipoVehiculo]
 * @property {CocheraResumen | null} [plaza]
 * @property {number | null} [cocheraId]
 */

/**
 * @typedef {object} Abono
 * @property {number} abonoId
 * @property {number} [abonoCocheraId]
 * @property {number} clienteId
 * @property {string | null} cobrador
 * @property {string | null} email
 * @property {string} fechaInicio
 * @property {string} fechaInicioCobro
 * @property {number | null} precioAcordado
 * @property {number} periodicidadCobro
 * @property {number} politicaPrimerPeriodo
 * @property {boolean} activo
 * @property {ClienteResumen | null} [cliente]
 * @property {AbonoPlaza[]} plazas
 * @property {AbonoVehiculo[]} vehiculos
 * @property {number | null} [cocheraId]
 * @property {CocheraResumen | null} [cochera]
 * @property {string | null} [patente]
 * @property {string | null} [modeloVehiculo]
 * @property {number | null} [tipoVehiculoId]
 * @property {TipoVehiculo | null} [tipoVehiculo]
 */

export {};
