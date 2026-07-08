import { useState, useEffect, useCallback } from "react";
import { cajaMensualService } from "../../../services/cajaMensualService";

export function useCajaConceptos(mes, enabled = true) {
  const [conceptos, setConceptos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const year = mes.getFullYear();
  const month = mes.getMonth() + 1;

  const recargar = useCallback(async () => {
    if (!enabled) return;
    try {
      setError(null);
      setLoading(true);
      const data = await cajaMensualService.getConceptos(year, month);
      setConceptos(data);
    } catch {
      setError("No se pudieron cargar los conceptos");
      setConceptos([]);
    } finally {
      setLoading(false);
    }
  }, [year, month, enabled]);

  useEffect(() => {
    recargar();
  }, [recargar]);

  return { conceptos, loading, error, recargar };
}
