import { tipoVehiculoService } from "../../services/tipoVehiculoService";
import CatalogoNombres from "./CatalogoNombres";

export default function TiposVehiculo({ embedded = false }) {
  return (
    <CatalogoNombres
      embedded={embedded}
      title="Tipos de vehículo"
      description="Tipos que se estacionan y abonan. Las tarifas los usan como eje."
      listadoLabel="Listado"
      placeholder="Ej: Auto, Moto, Camioneta..."
      vacio="No hay tipos de vehículo"
      idKey="tipoVehiculoId"
      service={tipoVehiculoService}
    />
  );
}
