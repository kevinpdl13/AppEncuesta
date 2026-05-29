// ============================================================
// useReporteAnonimo — hook de data-fetching del reporte anónimo.
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';
import type { ReporteAnonimoResponse } from '../types';

export type UseReporteAnonimoResult = {
  data: ReporteAnonimoResponse | null;
  loading: boolean;
};

export function useReporteAnonimo(
  periodoSel: string,
  configSel: string,
  areaSel: string
): UseReporteAnonimoResult {
  const [data, setData] = useState<ReporteAnonimoResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const cargarReporte = useCallback(async () => {
    if (!periodoSel || !configSel) {
      setData(null);
      return;
    }
    setLoading(true);
    try {
      const result = await api.getReporteAnonimo(periodoSel, configSel, areaSel || undefined);
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
