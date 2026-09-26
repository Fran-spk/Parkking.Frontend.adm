/**
 * @typedef {import('./shared.js').ClienteResumen} ClienteResumen
 * @typedef {import('./shared.js').CocheraResumen} CocheraResumen
 * @typedef {import('./shared.js').TipoVehiculo} TipoVehiculo
 * @typedef {import('./shared.js').CategoriaCochera} CategoriaCochera
 */

/**
 * @typedef {object} Cochera
 * @property {number} cocheraId
 * @property {string} numero
 * @property {number} categoriaCocheraId
 * @property {number} estadoCochera
 * @property {string | null} observacion
 * @property {boolean} multipleOcupacion
 * @property {number | null} maxOcupacion
 * @property {number} abonosActivos
 * @property {number} capacidadMaxima
 * @property {boolean} estaDisponible
 * @property {number[]} vehiculosPermitidosIds
 * @property {CategoriaCochera | null} [categoriaCochera]
 */

/**
 * @typedef {object} CocheraRequest
 * @property {string} numero
 * @property {number} categoriaCocheraId
 * @property {number} estadoCochera
 * @property {string} [observacion]
 * @property {boolean} multipleOcupacion
 * @property {number | null} [maxOcupacion]
 * @property {number[]} [vehiculosPermitidosIds]
 */

export {};
