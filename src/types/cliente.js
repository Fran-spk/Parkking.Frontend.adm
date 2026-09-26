/**
 * @typedef {import('./shared.js').TipoVehiculo} TipoVehiculo
 */

/**
 * @typedef {object} Cliente
 * @property {number} clienteId
 * @property {string} nombre
 * @property {string | null} documento
 * @property {string | null} domicilio
 * @property {string | null} telefono
 * @property {string | null} email
 * @property {string | null} observacion
 * @property {boolean} activo
 * @property {import('./abono.js').Abono[] | null} [abonos]
 */

/**
 * @typedef {object} ClienteRequest
 * @property {string} nombre
 * @property {string} [documento]
 * @property {string} [domicilio]
 * @property {string} [telefono]
 * @property {string} [email]
 * @property {string} [observacion]
 */

/**
 * @typedef {object} Vehiculo
 * @property {number} vehiculoId
 * @property {number} clienteId
 * @property {string} patente
 * @property {string | null} modeloVehiculo
 * @property {number} tipoVehiculoId
 * @property {string | null} [tipoVehiculoNombre]
 * @property {TipoVehiculo | null} [tipoVehiculo]
 * @property {boolean} activo
 * @property {boolean} [asignadoAAbonoActivo]
 */

export {};
