/**
 * @typedef {object} Recibo
 * @property {number} reciboId
 * @property {number} numero
 * @property {string} numeroFormateado
 * @property {number} pagoId
 * @property {number} abonoId
 * @property {string} fechaEmision
 * @property {number} monto
 * @property {number} recargo
 * @property {number} total
 * @property {string} clienteNombre
 * @property {string | null} cocherasLabel
 * @property {string | null} patentesLabel
 * @property {string | null} periodosLabel
 * @property {string | null} cobrador
 * @property {string | null} metodoPagoLabel
 * @property {string | null} observacion
 * @property {boolean} anulado
 * @property {string | null} motivoAnulacion
 */

/**
 * @typedef {object} Documento
 * @property {number} documentoId
 * @property {string} tipo
 * @property {string} nombreOriginal
 * @property {string} contentType
 * @property {number} tamanoBytes
 * @property {string | null} fechaVencimiento
 * @property {string | null} observacion
 * @property {string} fechaCarga
 * @property {string} duenoTipo
 * @property {number | null} clienteId
 * @property {string | null} clienteNombre
 * @property {number | null} vehiculoId
 * @property {string | null} vehiculoPatente
 * @property {number | null} abonoId
 * @property {string} grupoLabel
 */

/**
 * @typedef {object} DocumentoAbonoVista
 * @property {number} abonoId
 * @property {Documento[]} documentos
 */

/**
 * @typedef {object} Mensaje
 * @property {number} mensajeId
 * @property {string} tipo
 * @property {string} destinatario
 * @property {string | null} remitente
 * @property {string} asunto
 * @property {string} estado
 * @property {string | null} error
 * @property {string} fecha
 * @property {number | null} reciboId
 * @property {number | null} clienteId
 * @property {number | null} abonoId
 * @property {boolean} simulado
 */

export {};
