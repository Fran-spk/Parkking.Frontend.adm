import ConfigSeccion from "../../components/layout/ConfigSeccion";
import GruposFinancieros from "./GruposFinancieros";
import ReglasAsignacion from "./ReglasAsignacion";
import TiposGasto from "./TiposGasto";

export default function FinanzasConfig() {
  return (
    <ConfigSeccion
      title="Configuración financiera"
      description="Grupos para consultar la corriente, reglas que los llenan y tipos de gasto. El grupo no es una cuenta."
      tabs={[
        { value: "grupos", label: "Grupos" },
        { value: "reglas", label: "Reglas" },
        { value: "gastos", label: "Tipos de gasto" },
      ]}
    >
      {(tab) => {
        if (tab === "reglas") return <ReglasAsignacion embedded />;
        if (tab === "gastos") return <TiposGasto embedded />;
        return <GruposFinancieros embedded />;
      }}
    </ConfigSeccion>
  );
}
