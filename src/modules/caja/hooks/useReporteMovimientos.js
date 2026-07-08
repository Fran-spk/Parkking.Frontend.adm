import { useState, useEffect, useCallback } from "react";
import { cajaMensualService } from "../../../services/cajaMensualService";
import { toDateParam } from "../utils/formatters";

export function useReporteMovimientos(mes, desde, hasta, enabled = true) {
  const [movimientos, setMovimientos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const year = mes.getFullYear();
  const month = mes.getMonth() + 1;

  const recargar = useCallback(async () => {
    if (!enabled) return;
    try {
      setError(null);
      setLoading(true);
      const data = await cajaMensualService.getReporteMovimientos(
        year,
        month,
        toDateParam(desde),
        toDateParam(hasta),
      );
      setMovimientos(data);
    } catch {
      setError("No se pudieron cargar los movimientos");
      setMovimientos([]);
    } finally {
      setLoading(false);
    }
  }, [year, month, desde, hasta, enabled]);

  useEffect(() => {
    recargar();
  }, [recargar]);

  return { movimientos, loading, error, recargar };
}
