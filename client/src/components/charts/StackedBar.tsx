// ============================================================
// StackedBar — barra horizontal apilada reutilizable.
// Usada 6+ veces en ReportesV2 y Evaluaciones.
// ============================================================

export type StackedBarSegment = {
  value: number;
  color: string;
  label?: string;
};

export type StackedBarProps = {
  segments: StackedBarSegment[];
  /** Tailwind height class, e.g. "h-7" */
  height?: string;
  /** Show percentage inside bar if segment >= this threshold */
  showLabelThreshold?: number;
};

export function StackedBar({
  segments,
  height = 'h-7',
  showLabelThreshold = 8,
}: StackedBarProps) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);

  if (total === 0) return null;

  return (
    <div className={`w-full ${height} rounded-full overflow-hidden flex shadow-inner border border-gray-200/20 bg-gray-100/50 relative`}>
      {segments.map((seg, idx) => {
        const pct = Math.round((seg.value / total) * 100);
        if (pct <= 0) return null;

        return (
          <div
            key={idx}
            style={{ width: `${pct}%` }}
            className={`${seg.color} h-full relative transition-all duration-500 flex items-center justify-center text-[10px] font-black text-white ${idx > 0 ? 'border-l border-white/10' : ''}`}
            title={seg.label ? `${seg.label}: ${seg.value} (${pct}%)` : `${seg.value} (${pct}%)`}
          >
            {pct >= showLabelThreshold && `${pct}%`}
          </div>
        );
      })}
    </div>
  );
}
