// ============================================================
// GraficoPromedioSubgrupos — promedio general por subgrupo.
// Extraído de ReportesV2Page.tsx (líneas 214-282).
// ============================================================

import { computeSubgrupoAverages } from '../../../lib/calculations';
import { formatPct } from '../../../lib/formatters';
import type { ReporteAnonimoResponse } from '../../../types';

type Props = {
  data: ReporteAnonimoResponse;
};

export function GraficoPromedioSubgrupos({ data }: Props) {
  const subGrupoAverages = computeSubgrupoAverages(data.filas, data.totalSesiones);

  if (subGrupoAverages.length === 0) return null;

  return (
    <div className="bg-gradient-to-br from-white to-gray-50/30 rounded-2xl border border-gray-100 shadow-sm p-5 mb-6 animate-in slide-in-from-top-4 duration-350">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-extrabold text-gray-800 text-sm sm:text-base">Promedio General por Subgrupo</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Cumplimiento promedio acumulado de todas las categorías y subgrupos.</p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {subGrupoAverages.map((s) => (
          <div key={s.nombre} className="space-y-1.5 p-3 rounded-xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all">
            <div className="flex justify-between items-center text-xs">
              <span className="font-extrabold text-gray-700 uppercase tracking-wide text-[11px]">{s.nombre}</span>
              <span className={`font-black px-2 py-0.5 rounded border text-[11px] ${
                s.promedio >= 89
                  ? 'bg-amber-50 text-amber-700 border-amber-100'
                  : 'bg-red-50 text-red-700 border-red-100'
              }`}>
                {formatPct(s.promedio)}%
              </span>
            </div>
            <div className="w-full h-3 rounded-full bg-gray-100 overflow-hidden relative">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  s.promedio >= 89
                    ? 'bg-gradient-to-r from-amber-400 to-amber-500'
                    : 'bg-gradient-to-r from-red-400 to-red-500'
                }`}
                style={{ width: `${s.promedio}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
