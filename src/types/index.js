/**
 * Contrato de lo que devuelve la API, agrupado por dominio.
 * Los servicios y las pantallas importan estos types; no redefinen la forma del JSON.
 *
 * @typedef {import('./cliente.js').Cliente} Cliente
 * @typedef {import('./cliente.js').ClienteRequest} ClienteRequest
 * @typedef {import('./cliente.js').Vehiculo} Vehiculo
 *
 * @typedef {import('./abono.js').Abono} Abono
 * @typedef {import('./abono.js').AbonoPlaza} AbonoPlaza
 * @typedef {import('./abono.js').AbonoVehiculo} AbonoVehiculo
 *
 * @typedef {import('./cochera.js').Cochera} Cochera
 * @typedef {import('./cochera.js').CocheraRequest} CocheraRequest
 *
 * @typedef {import('./pago.js').Pago} Pago
 * @typedef {import('./pago.js').Cuota} Cuota
 * @typedef {import('./pago.js').DetallePago} DetallePago
 * @typedef {import('./pago.js').DeudaPendiente} DeudaPendiente
 * @typedef {import('./pago.js').DeudaCliente} DeudaCliente
 * @typedef {import('./pago.js').PagoSugerido} PagoSugerido
 * @typedef {import('./pago.js').MontoPeriodo} MontoPeriodo
 *
 * @typedef {import('./finanzas.js').Movimiento} Movimiento
 * @typedef {import('./finanzas.js').MovimientoDetalle} MovimientoDetalle
 * @typedef {import('./finanzas.js').CuentaCorriente} CuentaCorriente
 * @typedef {import('./finanzas.js').Cargo} Cargo
 * @typedef {import('./finanzas.js').Reintegro} Reintegro
 * @typedef {import('./finanzas.js').OperacionFinanciera} OperacionFinanciera
 * @typedef {import('./finanzas.js').TipoGasto} TipoGasto
 * @typedef {import('./finanzas.js').GrupoFinanciero} GrupoFinanciero
 * @typedef {import('./finanzas.js').GrupoFinancieroPeriodo} GrupoFinancieroPeriodo
 * @typedef {import('./finanzas.js').ReglaAsignacion} ReglaAsignacion
 *
 * @typedef {import('./estacionamiento.js').Estacionamiento} Estacionamiento
 * @typedef {import('./estacionamiento.js').EstacionamientoAcceso} EstacionamientoAcceso
 *
 * @typedef {import('./documentos.js').Recibo} Recibo
 * @typedef {import('./documentos.js').Documento} Documento
 * @typedef {import('./documentos.js').DocumentoAbonoVista} DocumentoAbonoVista
 * @typedef {import('./documentos.js').Mensaje} Mensaje
 *
 * @typedef {import('./catalogos.js').Usuario} Usuario
 * @typedef {import('./catalogos.js').UsuarioResumen} UsuarioResumen
 * @typedef {import('./catalogos.js').LoginResponse} LoginResponse
 * @typedef {import('./catalogos.js').TarifaVigente} TarifaVigente
 * @typedef {import('./catalogos.js').TarifaHistorial} TarifaHistorial
 * @typedef {import('./catalogos.js').MetodoDePago} MetodoDePago
 *
 * @typedef {import('./shared.js').TipoVehiculo} TipoVehiculo
 * @typedef {import('./shared.js').CategoriaCochera} CategoriaCochera
 * @typedef {import('./shared.js').ClienteResumen} ClienteResumen
 * @typedef {import('./shared.js').CocheraResumen} CocheraResumen
 *
 * @typedef {import('./dashboard.js').Dashboard} Dashboard
 */

export {};
