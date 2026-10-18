import ConfigSeccion from "../../components/layout/ConfigSeccion";
import TarifasAbonos from "./TarifasAbonos";
import TarifasEstadia from "./TarifasEstadia";

export default function Tarifas() {
  return (
    <ConfigSeccion
      title="Tarifas"
      description="Abonos por tipo de vehículo y categoría. Estadías con lista fraccionaria."
      tabs={[
        { value: "abonos", label: "Abonos" },
        { value: "estadias", label: "Estadías" },
      ]}
    >
      {(tab) => (tab === "estadias" ? <TarifasEstadia embedded /> : <TarifasAbonos embedded />)}
    </ConfigSeccion>
  );
}
