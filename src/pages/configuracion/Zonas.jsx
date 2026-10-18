import { zonaService } from "../../services/zonaService";
import CatalogoNombres from "./CatalogoNombres";

export default function Zonas({ embedded = false }) {
  return (
    <CatalogoNombres
      embedded={embedded}
      title="Zonas de cocheras"
      description="Sectores de las plazas fijas. Una cochera puede estar en una zona o en ninguna."
      listadoLabel="Listado"
      placeholder="Ej: Subsuelo, Planta baja, Terraza..."
      vacio="No hay zonas"
      idKey="zonaId"
      service={zonaService}
    />
  );
}
