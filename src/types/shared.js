/**
 * Formas que devuelve el backend (JSON en camelCase).
 * Las fechas llegan como string ISO.
 */

/**
 * @typedef {object} ClienteResumen
 * @property {number} clienteId
 * @property {string} nombre
 * @property {string | null} documento
 * @property {string | null} domicilio
 * @property {string | null} telefono
 * @property {string | null} email
 */

/**
 * @typedef {object} TipoVehiculo
 * @property {number} tipoVehiculoId
 * @property {string} nombre
 * @property {boolean} [activo]
 */

/**
 * @typedef {object} CategoriaCochera
 * @property {number} categoriaCocheraId
 * @property {string} nombre
 * @property {boolean} [activo]
 */

/**
 * @typedef {object} CocheraResumen
 * @property {number} cocheraId
 * @property {string} numero
 * @property {number} categoriaCocheraId
 * @property {CategoriaCochera | null} [categoriaCochera]
 * @property {string} [categoriaNombre]
 */

export {};
