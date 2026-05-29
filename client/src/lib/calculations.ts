// ============================================================
// Calculations — funciones puras de lógica de negocio.
// Inmutables, sin side-effects, testables.
// ============================================================

import type { FilaReporteAnonimo } from '../types';

// ─── Donut Chart ─────────────────────────────────────────────

export type DonutSegment = {
  value: number;
  color: string;
  length: number;
  offset: number;
};

const DONUT_CIRCUMFERENCE = 2 * Math.PI * 40; // r=40 → C ≈ 251.327

/**
 * Calcula los segmentos de un gráfico donut SVG.
 * Recibe porcentajes (deben sumar ~100) y colores.
 * Retorna los strokeDasharray/offset necesarios para cada <circle>.
 */
export function computeDonutSegments(
  segments: { percentage: number; color: string }[]
): DonutSegment[] {
  const C = DONUT_CIRCUMFERENCE;
  let accumulatedLength = 0;

  return segments.map((seg) => {
    const length = (seg.percentage / 100) * C;
    const offset = -accumulatedLength;
    accumulatedLength += length;

    return {
      value: seg.percentage,
      color: seg.color,
      length,
      offset,
    };
  });
}

export { DONUT_CIRCUMFERENCE };

// ─── Likert Distribution ─────────────────────────────────────

export type LikertDistribution = {
  totalMala: number;
  totalBuena: number;
  totalMuyBuena: number;
  granTotal: number;
  pctMala: number;
  pctBuena: number;
  pctMuyBuena: number;
};

/**
 * Calcula la distribución global de respuestas Likert desde las filas
 * del reporte anónimo.
 */
export function computeLikertDistribution(filas: FilaReporteAnonimo[]): LikertDistribution {
  const totalMala = filas.reduce((sum, f) => sum + f.mala, 0);
  const totalBuena = filas.reduce((sum, f) => sum + f.buena, 0);
  const totalMuyBuena = filas.reduce((sum, f) => sum + f.muyBuena, 0);
  const granTotal = totalMala + totalBuena + totalMuyBuena;

  const pctMala = granTotal > 0 ? Math.round((totalMala / granTotal) * 100) : 0;
  const pctBuena = granTotal > 0 ? Math.round((totalBuena / granTotal) * 100) : 0;
  const pctMuyBuena = Math.max(0, 100 - pctMala - pctBuena);

  return { totalMala, totalBuena, totalMuyBuena, granTotal, pctMala, pctBuena, pctMuyBuena };
}

// ─── Subgrupo Averages ───────────────────────────────────────

export type SubgrupoAverage = {
  nombre: string;
  promedio: number;
};

/**
 * Calcula el promedio de porcentaje por subgrupo.
 * Usa el máximo valor (mala/buena/muyBuena) dividido por totalSesiones.
 */
export function computeSubgrupoAverages(
  filas: FilaReporteAnonimo[],
  totalSesiones: number
): SubgrupoAverage[] {
  const sgMap: Record<string, { sum: number; count: number }> = {};

  filas.forEach((f) => {
    const sgName = f.subGrupo !== '—' ? f.subGrupo : 'General';
    const maxVal = Math.max(f.mala, f.buena, f.muyBuena);
    const pct = totalSesiones > 0 ? (maxVal / totalSesiones) * 100 : 0;

    if (!sgMap[sgName]) {
      sgMap[sgName] = { sum: 0, count: 0 };
    }
    sgMap[sgName].sum += pct;
    sgMap[sgName].count += 1;
  });

  return Object.keys(sgMap).map((name) => ({
    nombre: name,
    promedio: sgMap[name].count > 0 ? sgMap[name].sum / sgMap[name].count : 0,
  }));
}

// ─── Area Participation ──────────────────────────────────────

export type AreaCount = {
  nombre: string;
  total: number;
};

/**
 * Cuenta la participación por área a partir del array de sesiones.
 */
export function computeAreaParticipation(
  sesiones: { area: string }[]
): AreaCount[] {
  const map: Record<string, number> = {};
  sesiones.forEach((s) => {
    const aName = s.area || 'General';
    map[aName] = (map[aName] || 0) + 1;
  });

  return Object.keys(map)
    .map((nombre) => ({ nombre, total: map[nombre] }))
    .sort((a, b) => b.total - a.total);
}

// ─── Badge Color Utility ─────────────────────────────────────

/**
 * Retorna clases CSS de color según umbrales de porcentaje.
 * Útil para badges de favorabilidad, acierto, etc.
 */
export function getPercentageBadgeClasses(
  value: number,
  thresholds: { high: number; medium: number } = { high: 80, medium: 60 }
): string {
  if (value >= thresholds.high) return 'bg-emerald-50 text-emerald-700 border-emerald-100';
  if (value >= thresholds.medium) return 'bg-amber-50 text-amber-700 border-amber-100';
  return 'bg-red-50 text-red-700 border-red-100';
}

/**
 * Retorna clases CSS para barras de progreso según porcentaje.
 */
export function getProgressBarGradient(
  value: number,
  thresholds: { high: number; medium: number; low: number } = { high: 80, medium: 65, low: 50 }
): string {
  if (value >= thresholds.high) return 'bg-gradient-to-r from-emerald-400 to-emerald-500';
  if (value >= thresholds.medium) return 'bg-gradient-to-r from-blue-400 to-blue-500';
  if (value >= thresholds.low) return 'bg-gradient-to-r from-amber-400 to-amber-500';
  return 'bg-gradient-to-r from-rose-400 to-rose-500';
}

// ─── Periodo Status ──────────────────────────────────────────

export type PeriodoBadge = {
  label: string;
  cls: string;
};

/**
 * Determina el badge de estado de un período.
 */
export function computePeriodoBadge(periodo: {
  activo: boolean;
  vigente?: boolean;
  fechaInicio: string;
}): PeriodoBadge {
  if (!periodo.activo) return { label: 'Inactivo', cls: 'bg-gray-100 text-gray-500 border-gray-200' };
  if (periodo.vigente) return { label: 'Vigente 🟢', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
  const now = new Date();
  if (new Date(periodo.fechaInicio) > now) return { label: 'Próximo ⏳', cls: 'bg-blue-50 text-blue-700 border-blue-200' };
  return { label: 'Finalizado 🛑', cls: 'bg-amber-50 text-amber-700 border-amber-200' };
}
