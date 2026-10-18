import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import PageHeader from "./PageHeader";
import FiltroSegmentado from "./FiltroSegmentado";

/**
 * Cáscara de una página de configuración con pestañas en `?tab=`.
 * `tabs` es `{ value, label, visible? }[]`. `children` recibe el tab activo.
 */
export default function ConfigSeccion({ title, description, tabs, children }) {
  const [params, setParams] = useSearchParams();
  const visibles = tabs.filter((t) => t.visible !== false);
  const tab = useMemo(() => {
    const t = params.get("tab") || visibles[0]?.value;
    return visibles.some((x) => x.value === t) ? t : visibles[0]?.value;
  }, [params, visibles]);

  function setTab(value) {
    const first = visibles[0]?.value;
    setParams(value === first ? {} : { tab: value }, { replace: true });
  }

  return (
    <div className="space-y-5 pb-12 animate-fade-in-up">
      <PageHeader title={title} description={description} />
      {visibles.length > 1 && (
        <FiltroSegmentado ariaLabel="Sección" value={tab} onChange={setTab} opciones={visibles} />
      )}
      {typeof children === "function" ? children(tab) : children}
    </div>
  );
}
