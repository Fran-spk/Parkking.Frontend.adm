import ConfigSeccion from "../../components/layout/ConfigSeccion";
import Zonas from "./Zonas";
import ZonasRotativo from "./ZonasRotativo";

export default function ZonasConfig() {
  return (
    <ConfigSeccion
      title="Zonas"
      description="Cocheras y rotativo son mapas distintos. El toggle de trabajar con zonas de cocheras está en Estacionamiento."
      tabs={[
        { value: "cocheras", label: "Cocheras" },
        { value: "rotativo", label: "Rotativo" },
      ]}
    >
      {(tab) => (tab === "rotativo" ? <ZonasRotativo embedded /> : <Zonas embedded />)}
    </ConfigSeccion>
  );
}
