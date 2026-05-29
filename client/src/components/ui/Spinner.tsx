// ============================================================
// Spinner — spinner de carga reutilizable.
// Reemplaza 6+ implementaciones inline idénticas.
// ============================================================

export type SpinnerProps = {
  /** Tailwind color class for the spinning border, e.g. "border-t-purple-600" */
  color?: string;
  /** Tailwind size class, e.g. "w-10 h-10" */
  size?: string;
  /** Center the spinner in a container with padding */
  centered?: boolean;
};

export function Spinner({
  color = 'border-t-primary',
  size = 'w-10 h-10',
  centered = true,
}: SpinnerProps) {
  const spinner = (
    <div className={`${size} border-4 border-gray-200 ${color} rounded-full animate-spin`} />
  );

  if (!centered) return spinner;

  return (
    <div className="flex justify-center py-16">
      {spinner}
    </div>
  );
}
