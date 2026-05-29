// ============================================================
// TablaGraficaPorPregunta — tabla y gráficos interactivos por pregunta.
// Extraído de ReportesV2Page.tsx (línea 525-952).
// ============================================================

import { useState } from 'react';
import { Folder } from 'lucide-react';
import type { ReporteAnonimoResponse } from '../../../types';
import { formatPct } from '../../../lib/formatters';

export type TablaGraficaPorPreguntaProps = {
  data: ReporteAnonimoResponse;
  escalaLabels?: string[];
};

export function TablaGraficaPorPregunta({
  data,
  escalaLabels = ['Nunca', 'A veces', 'Siempre']
}: TablaGraficaPorPreguntaProps) {
  const grupos = [...new Set(data.filas.map(f => f.grupo))];
  const [hoveredPreguntaId, setHoveredPreguntaId] = useState<string | null>(null);

  const subGrupoAveragesGlobal = (() => {
    const sgMap: Record<string, { sum: number; count: number }> = {};
    data.filas.forEach(f => {
      const sgName = f.subGrupo !== '—' ? f.subGrupo : 'General';
      const maxVal = Math.max(f.mala, f.buena, f.muyBuena);
      const pct = data.totalSesiones > 0 ? (maxVal / data.totalSesiones) * 100 : 0;
      
      if (!sgMap[sgName]) {
        sgMap[sgName] = { sum: 0, count: 0 };
      }
      sgMap[sgName].sum += pct;
      sgMap[sgName].count += 1;
    });

    return Object.keys(sgMap).map(name => ({
      nombre: name,
      promedio: sgMap[name].count > 0 ? sgMap[name].sum / sgMap[name].count : 0
    }));
  })();

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="flex items-center justify-between mb-2 flex-wrap gap-3">
        <div>
          <h3 className="font-extrabold text-gray-800 text-sm sm:text-base">Análisis de Frecuencia por Preguntas</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Frecuencia y distribución de respuestas por pregunta, filtrado por el área seleccionada.</p>
        </div>
        <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded border border-purple-200/35">
          Muestra: {data.totalSesiones} encuestados
        </span>
      </div>

      {/* Grid de Subgrupos y Participación por Área */}
      {subGrupoAveragesGlobal.length > 0 && (() => {
        const subGrupoAveragesGlobalSorted = [...subGrupoAveragesGlobal].sort((a, b) => b.promedio - a.promedio);
        
        const areaCounts = (() => {
          if (!data.sesiones || data.sesiones.length === 0) return [];
          const map: Record<string, number> = {};
          data.sesiones.forEach(s => {
            const aName = s.area || 'General';
            map[aName] = (map[aName] || 0) + 1;
          });
          return Object.keys(map).map(nombre => ({
            nombre,
            total: map[nombre]
          })).sort((a, b) => b.total - a.total);
        })();

        const maxAreaTotal = Math.max(...areaCounts.map(a => a.total), 1);

        return (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
            {/* Promedio General por Subgrupo (Anillos) */}
            <div className="bg-gradient-to-br from-white to-gray-50/30 rounded-2xl border border-gray-100 shadow-sm p-6 xl:col-span-2 flex flex-col justify-between">
              <div>
                <div className="mb-4">
                  <h4 className="font-extrabold text-gray-800 text-sm sm:text-base">Promedio General por Subgrupo</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">Cumplimiento promedio acumulado por cada subcategoría (orden descendente).</p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {subGrupoAveragesGlobalSorted.map(s => {
                    const r = 36;
                    const C = 2 * Math.PI * r;
                    const strokeDashoffset = C - (s.promedio / 100) * C;
                    const isAmber = s.promedio >= 89;

                    return (
                      <div key={s.nombre} className="flex flex-col items-center p-3 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 group relative overflow-hidden text-center">
                        <div className="relative w-16 h-16 flex items-center justify-center mb-2 shrink-0">
                          <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                            <circle cx="50" cy="50" r={r} fill="transparent" stroke="#f3f4f6" strokeWidth="8" />
                            <circle
                              cx="50"
                              cy="50"
                              r={r}
                              fill="transparent"
                              stroke={isAmber ? '#f59e0b' : '#ef4444'}
                              strokeWidth="8"
                              strokeDasharray={`${C} ${C}`}
                              strokeDashoffset={strokeDashoffset}
                              strokeLinecap="round"
                              className="transition-all duration-700 ease-out"
                            />
                          </svg>
                          <div className="absolute flex flex-col items-center justify-center text-center">
                            <span className={`text-xs font-black tracking-tight ${isAmber ? 'text-amber-600' : 'text-rose-600'}`}>
                              {formatPct(s.promedio)}%
                            </span>
                          </div>
                        </div>
                        <span className="font-extrabold text-[10px] text-gray-700 uppercase tracking-wide px-1 line-clamp-2 min-h-[2rem] flex items-center justify-center">
                          {s.nombre}
                        </span>
                        <div className="absolute inset-0 border-2 border-transparent group-hover:border-purple-500/10 rounded-2xl pointer-events-none transition-colors duration-300" />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Participación por Área */}
            <div className="bg-gradient-to-br from-white to-gray-50/30 rounded-2xl border border-gray-100 shadow-sm p-6 xl:col-span-1 flex flex-col justify-between">
              <div>
                <div className="mb-4">
                  <h4 className="font-extrabold text-gray-800 text-sm sm:text-base">Participantes por Área</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">Cantidad de personas encuestadas por departamento (orden descendente).</p>
                </div>
                <div className="space-y-3.5 mt-2">
                  {areaCounts.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic text-center py-4">Sin datos de áreas registrados.</p>
                  ) : (
                    areaCounts.map(a => (
                      <div key={a.nombre} className="space-y-1">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-gray-700 truncate max-w-[70%]">🏢 {a.nombre}</span>
                          <span className="font-black text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-100">
                            {a.total} {a.total === 1 ? 'persona' : 'personas'}
                          </span>
                        </div>
                        <div className="w-full h-3 rounded-full bg-gray-150/50 overflow-hidden relative">
                          <div
                            className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-purple-500 to-indigo-500"
                            style={{ width: `${(a.total / maxAreaTotal) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Gráfico de Columnas Apiladas (Likert) */}
      {data.filas.length > 0 && (
        <div className="bg-gradient-to-br from-white to-gray-50/30 rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h4 className="font-extrabold text-gray-800 text-sm sm:text-base">Distribución Likert por Pregunta</h4>
              <p className="text-xs text-muted-foreground mt-0.5">Gráfico de columnas apiladas interactivo con tabla de correspondencia debajo (Estilo Power BI).</p>
            </div>
            <div className="flex gap-3 text-xs font-bold">
              <span className="flex items-center gap-1.5 text-gray-600">
                <span className="w-3 h-3 rounded bg-emerald-500" /> {escalaLabels[2]}
              </span>
              <span className="flex items-center gap-1.5 text-gray-600">
                <span className="w-3 h-3 rounded bg-amber-500" /> {escalaLabels[1]}
              </span>
              <span className="flex items-center gap-1.5 text-gray-600">
                <span className="w-3 h-3 rounded bg-red-500" /> {escalaLabels[0]}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <div className="relative h-80 flex items-end justify-between px-6 pt-6 pb-2 border-b border-l border-gray-200/80 bg-gray-50/20 rounded-bl-lg">
              <div className="absolute inset-x-0 top-0 h-full flex flex-col justify-between pointer-events-none pr-2">
                {[100, 75, 50, 25, 0].map((val) => (
                  <div key={val} className="w-full flex items-center justify-between border-t border-gray-100/70 text-[9px] font-bold text-gray-400">
                    <span className="bg-white/90 px-1 py-0.5 rounded shadow-sm -mt-2.5 z-10">{val}%</span>
                    <span className="w-full border-t border-dashed border-gray-200/50" />
                  </div>
                ))}
              </div>

              <div className="relative z-10 w-full h-full flex justify-around items-end">
                {data.filas.map((fila) => {
                  const total = fila.mala + fila.buena + fila.muyBuena;
                  const pctMala = total > 0 ? (fila.mala / total) * 100 : 0;
                  const pctBuena = total > 0 ? (fila.buena / total) * 100 : 0;
                  const pctMuyBuena = total > 0 ? Math.max(0, 100 - pctMala - pctBuena) : 0;
                  const isHovered = hoveredPreguntaId === fila.preguntaId;

                  return (
                    <div
                      key={fila.preguntaId}
                      className={`flex flex-col items-center justify-end h-full flex-1 max-w-[65px] mx-1.5 transition-all duration-300 cursor-pointer relative group ${
                        isHovered ? 'scale-105 filter drop-shadow-md' : 'opacity-90 hover:opacity-100'
                      }`}
                      onMouseEnter={() => setHoveredPreguntaId(fila.preguntaId)}
                      onMouseLeave={() => setHoveredPreguntaId(null)}
                    >
                      <div className="absolute -top-16 z-30 bg-gray-900 text-white rounded-xl p-2.5 text-[10px] font-semibold shadow-2xl border border-gray-800 transition-opacity duration-200 opacity-0 group-hover:opacity-100 pointer-events-none min-w-[140px] text-center">
                        <p className="font-extrabold border-b border-gray-800 pb-1 mb-1.5">Pregunta {fila.numero}</p>
                        <p className="text-emerald-400 flex justify-between gap-2"><span>{escalaLabels[2]}:</span> <span>{fila.muyBuena} ({Math.round(pctMuyBuena)}%)</span></p>
                        <p className="text-amber-400 flex justify-between gap-2"><span>{escalaLabels[1]}:</span> <span>{fila.buena} ({Math.round(pctBuena)}%)</span></p>
                        <p className="text-rose-400 flex justify-between gap-2"><span>{escalaLabels[0]}:</span> <span>{fila.mala} ({Math.round(pctMala)}%)</span></p>
                      </div>

                      <div className={`w-full rounded-t-lg overflow-hidden flex flex-col justify-end h-full border relative transition-all ${
                        isHovered ? 'border-purple-400 ring-2 ring-purple-100' : 'border-gray-200/40'
                      }`}>
                        {pctMuyBuena > 0 && (
                          <div
                            style={{ height: `${pctMuyBuena}%` }}
                            className="bg-gradient-to-t from-emerald-500 to-emerald-400 w-full relative transition-all duration-500 flex items-center justify-center text-[10px] font-black text-white"
                          >
                            {pctMuyBuena >= 15 && `${Math.round(pctMuyBuena)}%`}
                          </div>
                        )}
                        {pctBuena > 0 && (
                          <div
                            style={{ height: `${pctBuena}%` }}
                            className="bg-gradient-to-t from-amber-500 to-amber-400 w-full relative transition-all duration-500 flex items-center justify-center text-[10px] font-black text-white border-b border-white/10"
                          >
                            {pctBuena >= 15 && `${Math.round(pctBuena)}%`}
                          </div>
                        )}
                        {pctMala > 0 && (
                          <div
                            style={{ height: `${pctMala}%` }}
                            className="bg-gradient-to-t from-red-500 to-red-400 w-full relative transition-all duration-500 flex items-center justify-center text-[10px] font-black text-white border-b border-white/10"
                          >
                            {pctMala >= 15 && `${Math.round(pctMala)}%`}
                          </div>
                        )}
                      </div>

                      <span className="text-[10px] font-black text-gray-500 mt-2 shrink-0">
                        P. {fila.numero}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-gray-150 shadow-inner bg-white">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-4 py-3.5 font-extrabold text-purple-800 w-16">Código</th>
                    <th className="px-4 py-3.5 font-extrabold text-gray-600 w-32">Sub-grupo</th>
                    <th className="px-4 py-3.5 font-extrabold text-gray-700">Enunciado de la Pregunta</th>
                    <th className="px-3 py-3.5 font-extrabold text-center text-red-600 w-24">{escalaLabels[0]}</th>
                    <th className="px-3 py-3.5 font-extrabold text-center text-amber-600 w-24">{escalaLabels[1]}</th>
                    <th className="px-3 py-3.5 font-extrabold text-center text-emerald-600 w-24">{escalaLabels[2]}</th>
                    <th className="px-4 py-3.5 font-extrabold text-center text-purple-700 w-28">Favorabilidad</th>
                  </tr>
                </thead>
                <tbody>
                  {data.filas.map((fila) => {
                    const total = fila.mala + fila.buena + fila.muyBuena;
                    const maxVal = Math.max(fila.mala, fila.buena, fila.muyBuena);
                    const pctFavorabilidad = total > 0 ? (maxVal / total) * 100 : 0;
                    const isHovered = hoveredPreguntaId === fila.preguntaId;

                    return (
                      <tr
                        key={fila.preguntaId}
                        className={`border-b border-gray-100 hover:bg-purple-50/20 transition-all duration-150 cursor-pointer ${
                          isHovered ? 'bg-purple-50/40 font-bold' : ''
                        }`}
                        onMouseEnter={() => setHoveredPreguntaId(fila.preguntaId)}
                        onMouseLeave={() => setHoveredPreguntaId(null)}
                      >
                        <td className="px-4 py-3 font-black text-purple-700">P. {fila.numero}</td>
                        <td className="px-4 py-3 font-semibold text-gray-600">{fila.subGrupo !== '—' ? fila.subGrupo : 'General'}</td>
                        <td className="px-4 py-3 text-gray-800 font-medium leading-snug">{fila.enunciado}</td>
                        <td className="px-3 py-3 text-center font-bold text-red-600 bg-red-50/10">{fila.mala}</td>
                        <td className="px-3 py-3 text-center font-bold text-amber-600 bg-amber-50/10">{fila.buena}</td>
                        <td className="px-3 py-3 text-center font-bold text-emerald-600 bg-emerald-50/10">{fila.muyBuena}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`text-[11px] font-black px-2.5 py-0.5 rounded-full ${
                            pctFavorabilidad >= 80 ? 'bg-emerald-100 text-emerald-700' :
                            pctFavorabilidad >= 60 ? 'bg-amber-100 text-amber-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {formatPct(pctFavorabilidad)}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {grupos.map(grupo => {
        const filas = data.filas.filter(f => f.grupo === grupo);

        const subGruposMap: Record<string, typeof filas> = {};
        filas.forEach(f => {
          const sgName = f.subGrupo !== '—' ? f.subGrupo : 'General';
          if (!subGruposMap[sgName]) {
            subGruposMap[sgName] = [];
          }
          subGruposMap[sgName].push(f);
        });

        return (
          <div key={grupo} className="space-y-6">
            <div className="flex items-center gap-2 border-b border-gray-150/70 pb-2">
              <Folder size={18} className="text-purple-600 shrink-0" />
              <h4 className="font-black text-sm sm:text-base text-gray-800 uppercase tracking-tight">Categoría: {grupo}</h4>
            </div>

            <div className="grid grid-cols-1 gap-6">
              {Object.keys(subGruposMap).map(sgName => {
                const subGrupoFilas = subGruposMap[sgName];

                return (
                  <div key={sgName} className="bg-white border border-gray-100 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
                    <div className="flex items-center gap-2 border-l-4 border-purple-500 pl-3">
                      <span className="font-extrabold text-sm text-purple-950 uppercase tracking-wide">
                        Sub-grupo: {sgName}
                      </span>
                    </div>

                    <div className="space-y-6 divide-y divide-gray-100">
                      {subGrupoFilas.map((fila) => {
                        const totalPregunta = fila.mala + fila.buena + fila.muyBuena;
                        const pctMala = totalPregunta > 0 ? (fila.mala / totalPregunta) * 100 : 0;
                        const pctBuena = totalPregunta > 0 ? (fila.buena / totalPregunta) * 100 : 0;
                        const pctMuyBuena = totalPregunta > 0 ? (fila.muyBuena / totalPregunta) * 100 : 0;

                        return (
                          <div key={fila.preguntaId} className="pt-4 first:pt-0 space-y-3">
                            <div className="flex gap-2.5 items-start">
                              <span className="font-mono text-xs font-bold text-gray-400 bg-gray-50 px-2 py-0.5 rounded border border-gray-200/50 shrink-0">
                                {fila.numero}
                              </span>
                              <p className="text-sm font-semibold text-gray-800 leading-snug">{fila.enunciado}</p>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-4 items-center pl-0 sm:pl-7">
                              <div className="w-full sm:flex-1 h-6 rounded-full overflow-hidden flex bg-gray-100 shadow-inner border border-gray-200/10">
                                {fila.mala > 0 && (
                                  <div style={{ width: `${pctMala}%` }} className="bg-gradient-to-r from-red-400 to-red-500 h-full transition-all duration-500 flex items-center justify-center text-[10px] font-black text-white" title={`${escalaLabels[0]}: ${fila.mala}`}>
                                    {pctMala >= 8 && `${fila.mala} (${Math.round(pctMala)}%)`}
                                  </div>
                                )}
                                {fila.buena > 0 && (
                                  <div style={{ width: `${pctBuena}%` }} className="bg-gradient-to-r from-amber-400 to-amber-500 h-full border-l border-white/10 transition-all duration-500 flex items-center justify-center text-[10px] font-black text-white" title={`${escalaLabels[1]}: ${fila.buena}`}>
                                    {pctBuena >= 8 && `${fila.buena} (${Math.round(pctBuena)}%)`}
                                  </div>
                                )}
                                {fila.muyBuena > 0 && (
                                  <div style={{ width: `${pctMuyBuena}%` }} className="bg-gradient-to-r from-emerald-400 to-emerald-500 h-full border-l border-white/10 transition-all duration-500 flex items-center justify-center text-[10px] font-black text-white" title={`${escalaLabels[2]}: ${fila.muyBuena}`}>
                                    {pctMuyBuena >= 8 && `${fila.muyBuena} (${Math.round(pctMuyBuena)}%)`}
                                  </div>
                                )}
                                {totalPregunta === 0 && (
                                  <div className="w-full h-full flex items-center justify-center text-[10px] text-muted-foreground italic font-semibold">
                                    Sin respuestas registradas
                                  </div>
                                )}
                              </div>

                              <div className="flex gap-2 flex-wrap shrink-0">
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-100">
                                  {escalaLabels[0]}: {fila.mala}
                                </span>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-100">
                                  {escalaLabels[1]}: {fila.buena}
                                </span>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">
                                  {escalaLabels[2]}: {fila.muyBuena}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
