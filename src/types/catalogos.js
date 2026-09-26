/**
 * @typedef {object} Usuario
 * @property {number} [usuarioId]
 * @property {string} [usuario]
 * @property {string} [usuarioName]
 * @property {string} nombre
 * @property {string} [mail]
 * @property {string | null} [telefono]
 */

/**
 * @typedef {object} UsuarioResumen
 * @property {number} usuarioId
 * @property {string} usuarioName
 * @property {string} nombre
 * @property {string} mail
 */

/**
 * @typedef {object} LoginUsuario
 * @property {number} id
 * @property {string} usuario
 * @property {string} nombre
 * @property {string} mail
 */

/**
 * @typedef {object} LoginResponse
 * @property {string} mensaje
 * @property {LoginUsuario} usuario
 */

/**
 * @typedef {object} AuthMe
 * @property {number} id
 * @property {string | null} nombre
 * @property {string | null} email
 */

/**
 * @typedef {object} TarifaVigente
 * @property {number} tarifaMensualId
 * @property {number} tipoVehiculoId
 * @property {number} categoriaCocheraId
 * @property {number} periodicidadCobro
 * @property {number} precio
 * @property {string} fechaActualizacion
 */

/**
 * @typedef {object} TarifaHistorial
 * @property {number} tarifaMensualId
 * @property {number} precio
 * @property {string} fechaActualizacion
 */

/**
 * @typedef {object} MetodoDePago
 * @property {number} metodoDePagoId
 * @property {string} nombre
 * @property {boolean} activo
 */

export {};
