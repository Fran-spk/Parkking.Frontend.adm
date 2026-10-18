import { metodoDePagoService } from "../../services/metodoDePagoService";
import CatalogoNombres from "./CatalogoNombres";

export default function MetodosDePago({ embedded = false }) {
  return (
    <CatalogoNombres
      embedded={embedded}
      title="Métodos de pago"
      description="Cómo se cobra. La baja es lógica: los pagos ya hechos conservan el método."
      listadoLabel="Listado"
      placeholder="Ej: Efectivo, Transferencia, Cheque..."
      vacio="No hay métodos de pago"
      idKey="metodoDePagoId"
      service={metodoDePagoService}
    />
  );
}
