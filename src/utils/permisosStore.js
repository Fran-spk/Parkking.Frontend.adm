/** Store liviano de permisos efectivos (nombres ACC_NOMBRE) del estacionamiento activo. */

let nombres = new Set();
let version = 0;
const listeners = new Set();

function emit() {
  version += 1;
  listeners.forEach((fn) => fn());
}

export const ACCIONES = {
  VerClientes: "Ver clientes",
  CrearClientes: "Crear clientes",
  EditarClientes: "Editar clientes",
  BajaReactivarClientes: "Baja/reactivar clientes",
  VerAbonos: "Ver abonos",
  CrearAbonos: "Crear abonos",
  EditarAbonos: "Editar abonos",
  DarDeBajaAbonos: "Dar de baja abonos",
  GestionarDocumentos: "Gestionar documentos",
  VerReservas: "Ver reservas",
  CrearReservas: "Crear reservas",
  EditarReservas: "Editar reservas",
  DarDeBajaReservas: "Dar de baja reservas",
  TransformarReservas: "Transformar reservas",
  ConfigurarReservas: "Configurar reservas",
  VerMovimientos: "Ver movimientos",
  Cobrar: "Cobrar",
  VerPagos: "Ver pagos",
  AnularRecibos: "Anular recibos",
  EnviarRecibos: "Enviar recibos",
  RegistrarCargos: "Registrar cargos",
  RegistrarAjustes: "Registrar ajustes",
  RegistrarReintegros: "Registrar reintegros",
  RegistrarGastos: "Registrar gastos",
  AdministrarGruposFinancieros: "Administrar grupos financieros",
  AdministrarTiposDeGasto: "Administrar tipos de gasto",
  AdministrarReglasAsignacion: "Administrar reglas de asignación",
  AdministrarMetodosDePago: "Administrar métodos de pago",
  VerTarifas: "Ver tarifas",
  AdministrarTarifas: "Administrar tarifas",
  VerCocheras: "Ver cocheras",
  AdministrarCocheras: "Administrar cocheras",
  AdministrarCategorias: "Administrar categorías",
  AdministrarTiposVehiculo: "Administrar tipos de vehículo",
  EditarEstacionamiento: "Editar estacionamiento",
  VerUsuarios: "Ver usuarios",
  AdministrarGrupos: "Administrar grupos",
  AsignarPermisos: "Asignar permisos",
  VerDashboard: "Ver dashboard",
  ExportarReportes: "Exportar reportes",
  EnviarReportes: "Enviar reportes",
};

export const permisosStore = {
  subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  getSnapshot() {
    return version;
  },

  /** @param {string} nombre */
  tieneAccion(nombre) {
    if (!nombre) return false;
    return nombres.has(nombre);
  },

  /** true si tiene al menos una de las acciones */
  tieneAlgun(...lista) {
    return lista.some((n) => nombres.has(n));
  },

  /**
   * @param {{ permisos?: { permisosEfectivos?: { nombre: string }[] } } | null} me
   */
  setFromMe(me) {
    const list = me?.permisos?.permisosEfectivos ?? [];
    nombres = new Set(list.map((a) => a.nombre).filter(Boolean));
    emit();
  },

  clear() {
    nombres = new Set();
    emit();
  },

  getNombres() {
    return [...nombres];
  },
};
