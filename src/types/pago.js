/**
 * @typedef {object} ComponenteTarifa
 * @property {number | null} tarifaMensualId
 * @property {number} vehiculoId
 * @property {string} patente
 * @property {number} tipoVehiculoId
 * @property {string | null} tipoVehiculoNombre
 * @property {number} cocheraId
 * @property {string | null} cocheraNumero
 * @property {number} categoriaCocheraId
 * @property {string | null} categoriaNombre
 * @property {number} periodicidadCobro
 * @property {number} precio
 */

/**
 * @typedef {object} DetalleCuota
 * @property {number} detalleCuotaId
 * @property {number} cuotaId
 * @property {number | null} tarifaMensualId
 * @property {number} tipo
 * @property {string} tipoLabel
 * @property {number | null} vehiculoId
 * @property {number | null} cocheraId
 * @property {string | null} patente
 * @property {string | null} cocheraNumero
 * @property {string | null} tipoVehiculoNombre
 * @property {string | null} categoriaNombre
 * @property {string | null} descripcion
 * @property {number} precioUnitario
 * @property {number} cantidad
 * @property {number} importe
 */

/**
 * @typedef {object} CuotaCobro
 * @property {number} detallePagoId
 * @property {number} pagoId
 * @property {number} monto
 * @property {string} fechaHora
 * @property {string | null} observacion
 * @property {number | null} recargoPago
 * @property {number | null} reciboId
 * @property {string | null} reciboNumero
 */

/**
 * @typedef {object} Cuota
 * @property {number | null} cuotaId
 * @property {number} abonoId
 * @property {string} periodoInicio
 * @property {string} periodoFin
 * @property {string} periodoLabel
 * @property {number} monto
 * @property {number} montoPagado
 * @property {number} saldo
 * @property {number} estado
 * @property {boolean} esPrecioAcordado
 * @property {boolean} [esFuturo]
 * @property {ComponenteTarifa[]} [componentesTarifa]
 * @property {DetalleCuota[]} [detallesLiquidacion]
 * @property {CuotaCobro[]} [cobros]
 */

/**
 * @typedef {object} DetallePago
 * @property {number} detallePagoId
 * @property {number} pagoId
 * @property {number} cuotaId
 * @property {number} monto
 * @property {string} periodoInicio
 * @property {string} periodoFin
 * @property {string} periodoLabel
 * @property {number} estadoCuota
 * @property {number} montoCuota
 * @property {number} saldoCuota
 */

/**
 * @typedef {object} Pago
 * @property {number} pagoId
 * @property {number} abonoId
 * @property {string} mes
 * @property {string} fechaHoraCarga
 * @property {number} monto
 * @property {number | null} recargo
 * @property {string | null} observacion
 * @property {string | null} mercadoPagoId
 * @property {number | null} metodoDePagoId
 * @property {string | null} metodoDePagoNombre
 * @property {number | null} cuotaId
 * @property {string | null} periodoInicio
 * @property {string | null} periodoFin
 * @property {string | null} clienteNombre
 * @property {string | null} numeroCochera
 * @property {number | null} reciboId
 * @property {string | null} reciboNumero
 * @property {DetallePago[]} [detalles]
 * @property {boolean | null} [reciboEmailIntentado]
 * @property {boolean | null} [reciboEmailEnviado]
 * @property {boolean | null} [reciboEmailSimulado]
 * @property {string | null} [reciboEmailDestinatario]
 * @property {string | null} [reciboEmailError]
 */

/**
 * @typedef {object} DeudaPendiente
 * @property {number} abonoId
 * @property {number | null} cuotaId
 * @property {number} clienteId
 * @property {string} clienteNombre
 * @property {string | null} clienteTelefono
 * @property {string} cocherasLabel
 * @property {string | null} patentesLabel
 * @property {string} periodoInicio
 * @property {string} periodoFin
 * @property {string} periodoLabel
 * @property {number} monto
 * @property {number} montoPagado
 * @property {number} saldo
 * @property {number} estado
 * @property {number} diasAtraso
 */

/**
 * @typedef {object} MesImpago
 * @property {number} abonoId
 * @property {string} numeroCochera
 * @property {string} tipoVehiculo
 * @property {string} mes
 * @property {string} mesDate
 * @property {string} periodoInicio
 * @property {string} periodoFin
 * @property {number} monto
 * @property {number} recargo
 * @property {number} total
 * @property {number} saldo
 */

/**
 * @typedef {object} DeudaCliente
 * @property {number} clienteId
 * @property {string} nombreCliente
 * @property {MesImpago[]} mesesImpagos
 * @property {number} totalAdeudado
 */

/**
 * @typedef {object} PagoSugerido
 * @property {number} monto
 * @property {number} recargo
 * @property {boolean} aplicaProporcional
 * @property {boolean} esPrecioAcordado
 * @property {string} mesDate
 * @property {string} periodoInicio
 * @property {string} periodoFin
 * @property {ComponenteTarifa[]} componentesTarifa
 */

/**
 * @typedef {object} MontoPeriodo
 * @property {number} abonoId
 * @property {number} monto
 * @property {boolean} esPrecioAcordado
 * @property {ComponenteTarifa[]} componentesTarifa
 */

export {};
