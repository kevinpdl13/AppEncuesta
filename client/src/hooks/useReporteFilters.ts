// ============================================================
// useReporteFilters — hook de filtros de reportes reutilizable.
// Encapsula la lógica idéntica de Período + Config + Área
// compartida entre ReportesV2Page y EvaluacionesPage.
// ============================================================

import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import type { Periodo, EncuestaConfig, Area, TipoEncuesta } from '../types';

export type UseReporteFiltersOptions = {
  /** 'ANONIMA' para ReportesV2, 'EVALUACION' para EvaluacionesPage */
  tipoEncuesta: TipoEncuesta;
};

export function useReporteFilters({ tipoEncuesta }: UseReporteFiltersOptions) {
  const [allPeriodos, setAllPeriodos] = useState<Periodo[]>([]);
  const [periodoSel, setPeriodoSel] = useState<string>('');
  const [configs, setConfigs] = useState<EncuestaConfig[]>([]);
  const [configSel, setConfigSel] = useState<string>('');
  const [areas, setAreas] = useState<Area[]>([]);
  const [areaSel, setAreaSel] = useState<string>('');

  // Períodos filtrados: solo los que tienen al menos 1 config del tipo
  const periodosConEncuesta = allPeriodos.filter((p) =>
    (p.encuestaConfigs ?? []).some((c) => c.tipo === tipoEncuesta)
  );

  // 1. Cargar períodos y áreas al montar
  useEffect(() => {
    api.getPeriodos().then((data) => {
      setAllPeriodos(data);
      // Pre-seleccionar el vigente que tenga configs del tipo solicitado
      const vigente = data.find(
        (p) => p.vigente && (p.encuestaConfigs ?? []).some((c) => c.tipo === tipoEncuesta)
      );
      const primerValido =
        vigente ?? data.find((p) => (p.encuestaConfigs ?? []).some((c) => c.tipo === tipoEncuesta));
      if (primerValido) setPeriodoSel(primerValido.id);
    });
    api.getAreasActivas().then(setAreas).catch(console.error);
  }, [tipoEncuesta]);

  // 2. Al cambiar período → filtrar configs del tipo → auto-seleccionar la primera
  useEffect(() => {
    if (!periodoSel) return;
    const periodo = allPeriodos.find((p) => p.id === periodoSel);
    const filtradas = (periodo?.encuestaConfigs ?? []).filter((c) => c.tipo === tipoEncuesta);
    setConfigs(filtradas);
    setConfigSel(filtradas[0]?.id ?? '');
  }, [periodoSel, allPeriodos, tipoEncuesta]);

  // Config activa
  const activeConfig = configs.find((c) => c.id === configSel) ?? null;

  return {
    allPeriodos,
    periodosConEncuesta,
    periodoSel,
    setPeriodoSel,
    configs,
    configSel,
    setConfigSel,
    areas,
    areaSel,
    setAreaSel,
    activeConfig,
  };
}
