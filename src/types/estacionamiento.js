/**
 * @typedef {object} Estacionamiento
 * @property {number} estacionamientoId
 * @property {string} nombre
 * @property {string} direccion
 * @property {string} colorMarca
 * @property {string | null} locadorNombre
 * @property {string | null} locadorDocumento
 * @property {string | null} locadorDomicilio
 * @property {number} diaVencimientoAbono
 * @property {boolean} aplicaRecargo
 * @property {number} porcentajeRecargo
 * @property {boolean} activo
 * @property {boolean} imprimirReciboAlCobrar
 * @property {boolean} enviarReciboPorEmail
 * @property {boolean} trabajarConZonas
 * @property {boolean} contratoSeguroObligatorio
 * @property {number} contratoPlazoMeses
 * @property {boolean} generarContratoAlCrearAbono
 * @property {string} emailAvisos
 * @property {number | null} diaInicioAvisoDeuda
 * @property {number} frecuenciaAvisoDeuda
 */

/**
 * Estacionamiento al que el usuario puede entrar.
 * @typedef {object} EstacionamientoAcceso
 * @property {number} id
 * @property {string} nombre
 * @property {string} direccion
 * @property {string} emailAvisos
 */

export {};
