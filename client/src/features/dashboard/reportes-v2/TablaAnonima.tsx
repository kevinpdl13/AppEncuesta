// ============================================================
// TablaAnonima — tabla de reporte anónimo por categoría.
// Extraído de ReportesV2Page.tsx (líneas 284-522).
// ============================================================

import { useState } from 'react';
import { ChevronRight, Folder } from 'lucide-react';
import { formatPct, formatDateHuman } from '../../../lib/formatters';
import type { ReporteAnonimoResponse } from '../../../types';

type Props = {
  data: ReporteAnonimoResponse;
  escalaLabels?: string[];
};

export function TablaAnonima({ data, escalaLabels = ['Nunca', 'A veces', 'Siempre'] }: Props) {
  const grupos = [...new Set(data.filas.map(f => f.grupo))];
  const [gruposAbiertos, setGruposAbiertos] = useState<Record<string, boolean>>({});

  const toggleGrupo = (grupo: string) => {
    setGruposAbiertos(prev => ({ ...prev, [grupo]: prev[grupo] === false ? true : false }));
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-extrabold text-gray-800 text-sm sm:text-base">Resultados por Categoría</h3>
          <span className="text-sm text-muted-foreground font-semibold">Muestra: <strong>{data.totalSesiones}</strong> encuestados</span>
        </div>

        <div className="flex flex-col gap-4">
          {grupos.map(grupo => {
            const filas = data.filas.filter(f => f.grupo === grupo);
            const isOpen = gruposAbiertos[grupo] !== false;

            // Agrupar por subgrupo
            const subGruposMap: Record<string, typeof filas> = {};
            filas.forEach(f => {
              const sgName = f.subGrupo !== '—' ? f.subGrupo : 'General';
              if (!subGruposMap[sgName]) subGruposMap[sgName] = [];
              subGruposMap[sgName].push(f);
            });

            // Calcular métricas
            const subGrupoMetrics: Record<string, { avg: number; qPcts: Record<string, number> }> = {};
            Object.keys(subGruposMap).forEach(sgName => {
              const qs = subGruposMap[sgName];
              const qPcts: Record<string, number> = {};
              let sumPct = 0;
              qs.forEach(q => {
                const maxVal = Math.max(q.mala, q.buena, q.muyBuena);
                const pct = data.totalSesiones > 0 ? (maxVal / data.totalSesiones) * 100 : 0;
                qPcts[q.preguntaId] = pct;
                sumPct += pct;
              });
              subGrupoMetrics[sgName] = { avg: qs.length > 0 ? sumPct / qs.length : 0, qPcts };
            });

            const subGrupoAverages = Object.values(subGrupoMetrics).map(m => m.avg);
            const promGrupoCalculado = subGrupoAverages.length > 0
              ? subGrupoAverages.reduce((sum, val) => sum + val, 0) / subGrupoAverages.length
              : 0;

            return (
              <div key={grupo} className="border border-gray-100 rounded-2xl overflow-hidden shadow-sm bg-white transition-all duration-300">
                <button
                  onClick={() => toggleGrupo(grupo)}
                  className="w-full flex items-center justify-between p-4 bg-gray-50/70 hover:bg-gray-50 transition-colors cursor-pointer border-0 text-left focus:outline-none"
                >
                  <div className="flex items-center gap-3">
                    <span className={`transform transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`}>
                      <ChevronRight size={18} className="text-gray-500" />
                    </span>
                    <Folder size={18} className="text-purple-600 shrink-0" />
                    <span className="font-extrabold text-sm sm:text-base text-gray-800 tracking-tight uppercase">{grupo}</span>
                    <span className="text-[10px] font-bold bg-gray-200/60 text-gray-600 px-2 py-0.5 rounded-full">
                      {filas.length} {filas.length === 1 ? 'pregunta' : 'preguntas'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-muted-foreground font-semibold">Promedio:</span>
                    <span className={`text-xs font-black px-2.5 py-1 rounded-lg border ${
                      promGrupoCalculado >= 80 ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                      promGrupoCalculado >= 60 ? 'bg-amber-50 text-amber-700 border-amber-100' :
                      'bg-red-50 text-red-700 border-red-100'
                    }`}>
                      {formatPct(promGrupoCalculado)}%
                    </span>
                    <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded-lg border border-gray-200">
                      Muestra: {data.totalSesiones} encuestados
                    </span>
                  </div>
                </button>

                <div className={`transition-all duration-300 ${isOpen ? 'block border-t border-gray-100' : 'hidden'}`}>
                  <div className="overflow-x-auto p-2 sm:p-4">
                    <table className="w-full text-sm border-collapse min-w-[650px]">
                      <thead>
                        <tr className="border-b border-gray-150/70">
                          <th className="text-left pb-2.5 text-xs font-semibold text-gray-500 w-8">N°</th>
                          <th className="text-left pb-2.5 text-xs font-semibold text-gray-500 w-28">Sub-grupo</th>
                          <th className="text-left pb-2.5 text-xs font-semibold text-gray-500">Pregunta</th>
                          <th className="text-center pb-2.5 text-xs font-semibold text-red-600 w-16">{escalaLabels[0]}</th>
                          <th className="text-center pb-2.5 text-xs font-semibold text-amber-600 w-16">{escalaLabels[1]}</th>
                          <th className="text-center pb-2.5 text-xs font-semibold text-emerald-600 w-16">{escalaLabels[2]}</th>
                          <th className="text-center pb-2.5 text-xs font-semibold text-blue-700 w-16">%</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.keys(subGruposMap).map(sgName => {
                          const subGrupoFilas = subGruposMap[sgName];
                          const subGrupoAvg = subGrupoMetrics[sgName].avg;
                          const qPcts = subGrupoMetrics[sgName].qPcts;

                          return (
                            <optgroup key={sgName} label={sgName} className="contents">
                              <tr className="bg-purple-50/20 border-y border-purple-100/30">
                                <td colSpan={7} className="px-3 py-2 text-left">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <span className="w-1.5 h-3.5 rounded-full bg-purple-600" />
                                      <span className="font-extrabold text-xs text-purple-950 uppercase tracking-wide">Sub-grupo: {sgName}</span>
                                    </div>
                                    <span className={`text-xs font-black px-2.5 py-0.5 rounded-full border ${
                                      subGrupoAvg >= 89 ? 'bg-amber-50 text-amber-700 border-amber-100' : 'bg-red-50 text-red-700 border-red-100'
                                    }`}>
                                      Promedio Sub-grupo: {formatPct(subGrupoAvg)}%
                                    </span>
                                  </div>
                                </td>
                              </tr>
                              {subGrupoFilas.map(fila => {
                                const pctPregunta = qPcts[fila.preguntaId];
                                return (
                                  <tr key={fila.preguntaId} className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50/30 transition-colors">
                                    <td className="py-3 text-muted-foreground text-xs">{fila.numero}</td>
                                    <td className="py-3 text-xs text-gray-600 font-semibold">{sgName}</td>
                                    <td className="py-3 text-gray-700 leading-snug pr-4">
                                      <div>
                                        <p className="text-sm font-semibold text-gray-800">{fila.enunciado}</p>
                                        <div className="w-40 h-1.5 rounded-full overflow-hidden flex bg-gray-100 mt-2 border border-gray-200/10 shadow-inner">
                                          {fila.mala > 0 && <div className="bg-red-400 h-full" style={{ width: `${(fila.mala / fila.total) * 100}%` }} title={`${escalaLabels[0]}: ${fila.mala}`} />}
                                          {fila.buena > 0 && <div className="bg-amber-400 h-full" style={{ width: `${(fila.buena / fila.total) * 100}%` }} title={`${escalaLabels[1]}: ${fila.buena}`} />}
                                          {fila.muyBuena > 0 && <div className="bg-emerald-400 h-full" style={{ width: `${(fila.muyBuena / fila.total) * 100}%` }} title={`${escalaLabels[2]}: ${fila.muyBuena}`} />}
                                        </div>
                                      </div>
                                    </td>
                                    <td className="py-3 text-center font-bold text-red-600 text-sm">{fila.mala}</td>
                                    <td className="py-3 text-center font-bold text-amber-600 text-sm">{fila.buena}</td>
                                    <td className="py-3 text-center font-bold text-emerald-600 text-sm">{fila.muyBuena}</td>
                                    <td className="py-3 text-center">
                                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                                        pctPregunta >= 80 ? 'bg-emerald-100 text-emerald-700' :
                                        pctPregunta >= 60 ? 'bg-amber-100 text-amber-700' :
                                        'bg-red-100 text-red-700'
                                      }`}>
                                        {formatPct(pctPregunta)}%
                                      </span>
                                    </td>
                                  </tr>
                                );
                              })}
                            </optgroup>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Historial de Participación Anónima por Área */}
      {data.sesiones && data.sesiones.length > 0 && (
        <div className="mt-4 border-t border-gray-100 pt-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-extrabold text-gray-800 text-sm sm:text-base">Historial de Participación por Área</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Áreas registradas que completaron este cuestionario de inocuidad alimentaria.</p>
            </div>
            <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200/30">
              Total Participaciones: {data.sesiones.length}
            </span>
          </div>
          <div className="overflow-x-auto rounded-xl border border-gray-100 shadow-sm">
            <table className="w-full text-sm border-collapse min-w-[500px]">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-600 w-16">N°</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-600">Fecha y Hora</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-600">Área Participante</th>
                  <th className="text-center px-4 py-2.5 text-xs font-semibold text-gray-600 w-28">Estado</th>
                </tr>
              </thead>
              <tbody>
                {data.sesiones.map((s) => (
                  <tr key={s.id} className="border-b border-gray-100 hover:bg-gray-50/30 transition-colors">
                    <td className="px-4 py-2.5 text-muted-foreground text-xs font-semibold">#{s.numero}</td>
                    <td className="px-4 py-2.5 text-gray-600 text-xs">{formatDateHuman(s.fecha)}</td>
                    <td className="px-4 py-2.5 font-extrabold text-purple-700 text-xs">🏢 {s.area}</td>
                    <td className="px-4 py-2.5 text-center">
                      <span className="text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/50 px-2 py-0.5 rounded">
                        Completado ✓
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
