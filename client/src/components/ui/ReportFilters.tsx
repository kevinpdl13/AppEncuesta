// ============================================================
// ReportFilters — panel de filtros de reportes reutilizable.
// Período + Encuesta + Área — idéntico en ReportesV2 y Evaluaciones.
// ============================================================

import type { Periodo, EncuestaConfig, Area } from '../../types';

export type ReportFiltersProps = {
  periodos: Periodo[];
  configs: EncuestaConfig[];
  areas: Area[];
  periodoSel: string;
  configSel: string;
  areaSel: string;
  onPeriodoChange: (id: string) => void;
  onConfigChange: (id: string) => void;
  onAreaChange: (id: string) => void;
  /** Tailwind border color for the container */
  accentBorderColor?: string;
  /** Tailwind ring color for selects */
  accentRingColor?: string;
  /** Label for the second dropdown */
  configLabel?: string;
  /** Placeholder when no configs available */
  emptyConfigLabel?: string;
};

export function ReportFilters({
  periodos,
  configs,
  areas,
  periodoSel,
  configSel,
  areaSel,
  onPeriodoChange,
  onConfigChange,
  onAreaChange,
  accentBorderColor = 'border-purple-100/60',
  accentRingColor = 'focus:ring-primary/30',
  configLabel = 'Encuesta',
  emptyConfigLabel = 'Sin encuestas disponibles',
}: ReportFiltersProps) {
  return (
    <div className={`bg-white rounded-2xl border ${accentBorderColor} shadow-sm p-4 mb-6`}>
      <div className="flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[160px]">
          <label className="text-xs font-semibold text-gray-600 mb-1 block uppercase tracking-wide">
            Período
          </label>
          <select
            className={`w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 ${accentRingColor}`}
            value={periodoSel}
            onChange={(e) => onPeriodoChange(e.target.value)}
          >
            {periodos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre} {p.vigente ? '🟢' : ''}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1 min-w-[160px]">
          <label className="text-xs font-semibold text-gray-600 mb-1 block uppercase tracking-wide">
            {configLabel}
          </label>
          <select
            className={`w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 ${accentRingColor}`}
            value={configSel}
            onChange={(e) => onConfigChange(e.target.value)}
          >
            {configs.length === 0 && <option value="">{emptyConfigLabel}</option>}
            {configs.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1 min-w-[160px]">
          <label className="text-xs font-semibold text-gray-600 mb-1 block uppercase tracking-wide">
            Filtrar por Área
          </label>
          <select
            className={`w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 ${accentRingColor}`}
            value={areaSel}
            onChange={(e) => onAreaChange(e.target.value)}
          >
            <option value="">Todas las Áreas</option>
            {areas.map((a) => (
              <option key={a.id} value={a.id}>
                {a.nombre}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
