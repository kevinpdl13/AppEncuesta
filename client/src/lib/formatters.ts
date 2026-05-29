// ============================================================
// Formatters — utilidades de formato centralizadas.
// Reemplaza las 5+ definiciones duplicadas en el codebase.
// ============================================================

/**
 * Formatea un número a string con 2 decimales, eliminando ceros
 * innecesarios al final (ej: 85.00 → "85", 72.50 → "72.5").
 */
export function formatPct(val: number): string {
  return Number(val.toFixed(2)).toString();
}

/**
 * Fecha legible en español-Ecuador (ej: "28 may 2026, 14:30").
 */
export function formatDateHuman(iso: string): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('es-EC', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Fecha para un input `datetime-local` (ej: "2026-05-28T14:30").
 */
export function formatDateInput(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/**
 * Parsea el campo `escalaLabels` (JSON string) de EncuestaConfig.
 * Retorna un array de 3 etiquetas. Maneja nulls, strings inválidos
 * y provee un fallback seguro.
 */
export function parseEscalaLabels(
  raw: string | null | undefined,
  fallback: string[] = ['Nunca', 'A veces', 'Siempre']
): string[] {
  if (!raw) return fallback;
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length >= 3) return parsed;
    return fallback;
  } catch {
    return fallback;
  }
}
