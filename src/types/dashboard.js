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
 */

/**
 * @typedef {object} Dashboard
 * @property {number} porcentajeOcupacion
 * @property {number} cocherasOcupadas
 * @property {number} cocherasTotales
 * @property {number} cantidadAbonosActivos
 * @property {CocheraStatus[]} estadoCocheras
 * @property {AlertaDeudor[]} alertasDeudores
 * @property {DistribucionVehiculo[]} distribucionVehiculos
 * @property {HistoricoIngresos[]} graficoIngresos
 * @property {DetalleIngresosKpi} detalleIngresos
 */

export {};
