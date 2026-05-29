// ============================================================
// useReporteEvaluacion — hook de data-fetching del reporte de evaluación.
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';
import type { ReporteEvaluacionResponse } from '../types';

export type UseReporteEvaluacionResult = {
  data: ReporteEvaluacionResponse | null;
  loading: boolean;
};

export function useReporteEvaluacion(
  periodoSel: string,
  configSel: string,
  areaSel: string
): UseReporteEvaluacionResult {
  const [data, setData] = useState<ReporteEvaluacionResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const cargarReporte = useCallback(async () => {
    if (!periodoSel || !configSel) {
      setData(null);
      return;
    }
    setLoading(true);
    try {
      const result = await api.getReporteEvaluacion(periodoSel, {
        encuesta_config_id: configSel,
        area_id: areaSel || undefined,
      });
      setData(result);
    } catch (e) {
      console.error(e);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [periodoSel, configSel, areaSel]);

  useEffect(() => {
    cargarReporte();
  }, [cargarReporte]);

  return { data, loading };
}
