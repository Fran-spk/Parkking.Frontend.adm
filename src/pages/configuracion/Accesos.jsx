import ConfigSeccion from "../../components/layout/ConfigSeccion";
import GruposSeguridad from "./GruposSeguridad";
import UsuariosConfig from "./Usuarios";

export default function Accesos() {
  return (
    <ConfigSeccion
      title="Accesos"
      description="Grupos de seguridad y usuarios del estacionamiento."
      tabs={[
        { value: "grupos", label: "Grupos" },
        { value: "usuarios", label: "Usuarios" },
      ]}
    >
      {(tab) => (tab === "usuarios" ? <UsuariosConfig embedded /> : <GruposSeguridad embedded />)}
    </ConfigSeccion>
  );
}
