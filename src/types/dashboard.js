/**
 * @typedef {object} CocheraOcupante
 * @property {number} abonoId
 * @property {string} clienteNombre
 * @property {string | null} patente
 * @property {string | null} vehiculoModelo
 */

/**
 * @typedef {object} CocheraStatus
 * @property {number} cocheraId
 * @property {string} numero
 * @property {string} estado
 * @property {string | null} clienteNombre
 * @property {string | null} patente
 * @property {string | null} vehiculoModelo
 * @property {boolean} multipleOcupacion
 * @property {number} abonosActivos
 * @property {CocheraOcupante[]} ocupantes
 */

/**
 * @typedef {object} AlertaDeudor
 * @property {number} abonoId
 * @property {number} [reservaId]
 * @property {number} [abonoCocheraId]
 * @property {string} clienteNombre
 * @property {string | null} clienteTelefono
 * @property {string} cocheraNumero
 * @property {number} diasAtraso
 * @property {number | null} precioAcordado
 * @property {number} saldoTotal
 * @property {number} periodosAdeudados
 */

/**
 * @typedef {object} DistribucionVehiculo
 * @property {string} tipoVehiculo
 * @property {number} cantidad
 * @property {number} porcentaje
 */

/**
 * @typedef {object} HistoricoIngresos
 * @property {string} mes
 * @property {number} monto
 */

/**
 * @typedef {object} DetalleIngresosKpi
 * @property {number} totalRecaudadoMensualReal
 * @property {number} totalEstimadoProyeccion
 * @property {number} diferenciaPorcentaje
 * @property {number} recaudadoHoy
 * @property {number} recaudadoAbonosMes
 * @property {number} recaudadoEstadiasMes
 */

/**
 * @typedef {object} DashboardEstadiaAbierta
 * @property {number} estadiaId
 * @property {string} patente
 * @property {string} tipoVehiculoNombre
 * @property {string | null} zonaNombre
 * @property {string} horaEntrada
 * @property {number} minutosTranscurridos
 * @property {boolean} esAbonado
 */

/**
 * @typedef {object} DashboardReservaResumen
 * @property {number} reservaId
 * @property {string} nombre
 * @property {string} fechaInicio
 * @property {string} fechaVencimiento
 * @property {string | null} cocheras
 * @property {boolean} senaPendiente
 * @property {boolean} automatica
 */

/**
 * @typedef {object} Dashboard
 * @property {number} porcentajeOcupacion
 * @property {number} cocherasOcupadas
 * @property {number} cocherasTotales
 * @property {number} cantidadAbonosActivos
 * @property {number} rotativosAdentro
 * @property {number} entradasRotativoHoy
 * @property {number} reservasVigentes
 * @property {number} reservasConSenaPendiente
 * @property {CocheraStatus[]} estadoCocheras
 * @property {AlertaDeudor[]} alertasDeudores
 * @property {DistribucionVehiculo[]} distribucionVehiculos
 * @property {HistoricoIngresos[]} graficoIngresos
 * @property {DetalleIngresosKpi} detalleIngresos
 * @property {DashboardEstadiaAbierta[]} estadiasAbiertas
 * @property {DashboardReservaResumen[]} reservasProximas
 */

export {};
