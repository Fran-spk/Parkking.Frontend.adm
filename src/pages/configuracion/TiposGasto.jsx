import { tipoGastoService } from "../../services/tipoGastoService";
import CatalogoNombres from "./CatalogoNombres";

export default function TiposGasto({ embedded = false }) {
  return (
    <CatalogoNombres
      embedded={embedded}
      title="Tipos de gasto"
      description="Catálogo para clasificar gastos. La baja es lógica: no se borra el nombre."
      listadoLabel="Nombre"
      placeholder="Ej: Luz, Limpieza, Expensas"
      vacio="Todavía no hay tipos de gasto."
      idKey="tipoGastoId"
      service={tipoGastoService}
    />
  );
}
