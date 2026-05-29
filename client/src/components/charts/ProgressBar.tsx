// ============================================================
// ProgressBar — barra de progreso con colores por umbral.
// ============================================================

export type ProgressBarProps = {
  value: number;
  /** Tailwind gradient class for the fill */
  gradient?: string;
  /** Tailwind height class */
  height?: string;
};

export function ProgressBar({
  value,
  gradient = 'bg-gradient-to-r from-purple-500 to-indigo-500',
  height = 'h-3',
}: ProgressBarProps) {
  return (
    <div className={`w-full ${height} rounded-full bg-gray-100 overflow-hidden relative`}>
      <div
        className={`h-full rounded-full transition-all duration-500 ${gradient}`}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}
