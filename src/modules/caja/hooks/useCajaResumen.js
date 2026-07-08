import { useState, useEffect, useCallback } from "react";
import { cajaMensualService } from "../../../services/cajaMensualService";

export function useCajaResumen(mes) {
  const [resumen, setResumen] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sinCaja, setSinCaja] = useState(false);

  const year = mes.getFullYear();
  const month = mes.getMonth() + 1;

  const recargar = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      setSinCaja(false);
      const data = await cajaMensualService.getResumen(year, month);
      setResumen(data);
    } catch (e) {
      if (e.response?.status === 404) {
        setResumen(null);
        setSinCaja(true);
      } else {
        setError("No se pudo cargar la caja");
      }
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  useEffect(() => {
    recargar();
  }, [recargar]);

  return { resumen, loading, error, sinCaja, setError, recargar };
}
