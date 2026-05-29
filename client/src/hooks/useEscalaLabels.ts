// ============================================================
// useEscalaLabels — hook para parsear la escala Likert
// de la config activa.
// ============================================================

import { useMemo } from 'react';
import { parseEscalaLabels } from '../lib/formatters';
import type { EncuestaConfig } from '../types';

/**
 * Parsea la escalaLabels de una EncuestaConfig activa.
 * Memoizado para evitar re-parseo en cada render.
 */
export function useEscalaLabels(
  activeConfig: EncuestaConfig | null | undefined,
  fallback: string[] = ['Nunca', 'A veces', 'Siempre']
): string[] {
  return useMemo(
    () => parseEscalaLabels(activeConfig?.escalaLabels, fallback),
    [activeConfig?.escalaLabels, fallback]
  );
}
