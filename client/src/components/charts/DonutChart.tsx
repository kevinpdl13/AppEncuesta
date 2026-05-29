// ============================================================
// DonutChart — gráfico SVG donut reutilizable.
// Reemplaza 4+ implementaciones inline con cálculos duplicados.
// ============================================================

import { DONUT_CIRCUMFERENCE, computeDonutSegments } from '../../lib/calculations';

export type DonutChartSegment = {
  percentage: number;
  color: string;
};

export type DonutChartProps = {
  segments: DonutChartSegment[];
  centerLabel: string | number;
  centerSub?: string;
  /** Tailwind width/height class for the outer container, e.g. "w-36 h-36" */
  size?: string;
};

export function DonutChart({
  segments,
  centerLabel,
  centerSub,
  size = 'w-36 h-36',
}: DonutChartProps) {
  const computed = computeDonutSegments(segments);
  const C = DONUT_CIRCUMFERENCE;

  return (
    <div className={`relative ${size} flex items-center justify-center`}>
      <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
        {/* Background circle */}
        <circle cx="50" cy="50" r="40" fill="transparent" stroke="#f3f4f6" strokeWidth="12" />

        {computed.map((seg, idx) =>
          seg.value > 0 ? (
            <circle
              key={idx}
              cx="50"
              cy="50"
              r="40"
              fill="transparent"
              stroke={seg.color}
              strokeWidth="12"
              strokeDasharray={`${seg.length} ${C - seg.length}`}
              strokeDashoffset={seg.offset}
              className="transition-all duration-500 ease-out"
            />
          ) : null
        )}
      </svg>
      {/* Center text */}
      <div className="absolute flex flex-col items-center justify-center text-center">
        <span className="text-2xl font-black text-gray-900 leading-none">{centerLabel}</span>
        {centerSub && (
          <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
            {centerSub}
          </span>
        )}
      </div>
    </div>
  );
}
