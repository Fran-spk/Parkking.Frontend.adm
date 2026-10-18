import ConfigSeccion from "../../components/layout/ConfigSeccion";
import TiposVehiculo from "./TiposVehiculo";
import CategoriasCochera from "./CategoriasCochera";
import MetodosDePago from "./MetodosDePago";

export default function Catalogos() {
  return (
    <ConfigSeccion
      title="Catálogos"
      description="Listas paramétricas del estacionamiento. No son datos de identidad: las usan tarifas, cocheras y cobros."
      tabs={[
        { value: "tipos", label: "Tipos de vehículo" },
        { value: "categorias", label: "Categorías" },
        { value: "metodos", label: "Métodos de pago" },
      ]}
    >
      {(tab) => {
        if (tab === "categorias") return <CategoriasCochera embedded />;
        if (tab === "metodos") return <MetodosDePago embedded />;
        return <TiposVehiculo embedded />;
      }}
    </ConfigSeccion>
  );
}
