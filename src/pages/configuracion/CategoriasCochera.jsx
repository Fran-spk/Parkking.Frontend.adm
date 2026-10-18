import { categoriaCocheraService } from "../../services/categoriaCocheraService";
import CatalogoNombres from "./CatalogoNombres";

export default function CategoriasCochera({ embedded = false }) {
  return (
    <CatalogoNombres
      embedded={embedded}
      title="Categorías de cochera"
      description="Techada, descubierta, dueño: diferencian la tarifa de abono."
      listadoLabel="Listado"
      placeholder="Ej: Techada, Descubierta, Dueño..."
      vacio="No hay categorías"
      idKey="categoriaCocheraId"
      service={categoriaCocheraService}
    />
  );
}
