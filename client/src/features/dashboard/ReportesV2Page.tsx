import { useState, useEffect, useCallback } from 'react';
import { api } from '../../lib/api';
import { ChevronRight, Folder, ShieldCheck, ThumbsUp, Award, AlertTriangle } from 'lucide-react';
import type { Periodo, EncuestaConfig, ReporteAnonimoResponse, Area } from '../../types';

// ─── KPI Card ─────────────────────────────────────────────────
function KpiCard({ 
  label, 
  value, 
  sub, 
  color, 
  icon 
}: { 
  label: string; 
  value: string | number; 
  sub?: string; 
  color: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl p-5 bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all duration-350 flex items-center justify-between group overflow-hidden relative">
      <div className="relative z-10">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{label}</p>
        <p className={`text-3xl font-black mt-2 ${color} tracking-tight`}>{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-1 font-medium">{sub}</p>}
      </div>
      {icon && (
        <div className="p-3 rounded-xl bg-gray-50 group-hover:bg-gray-100/80 transition-colors duration-350 text-gray-400 shrink-0 relative z-10">
          {icon}
        </div>
      )}
      {/* Dynamic Background subtle micro-animation glow */}
      <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-gradient-to-br from-gray-100/10 to-gray-200/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
    </div>
  );
}

// ─── Componente: Gráfico de Distribución Likert ────────────────
function GraficoDistribucionLikert({
  data,
  escalaLabels = ['Nunca', 'A veces', 'Siempre']
}: {
  data: ReporteAnonimoResponse;
  escalaLabels?: string[];
}) {
  const totalMala = data.filas.reduce((sum, f) => sum + f.mala, 0);
  const totalBuena = data.filas.reduce((sum, f) => sum + f.buena, 0);
  const totalMuyBuena = data.filas.reduce((sum, f) => sum + f.muyBuena, 0);
  const granTotal = totalMala + totalBuena + totalMuyBuena;

  if (granTotal === 0) {
    return (
      <div className="bg-gray-50 border border-dashed border-gray-200 rounded-2xl p-6 text-center text-muted-foreground text-xs mb-6">
        Realiza filtros o selecciona una encuesta con respuestas para ver la gráfica de distribución.
      </div>
    );
  }

  const pctMala = Math.round((totalMala / granTotal) * 100);
  const pctBuena = Math.round((totalBuena / granTotal) * 100);
  const pctMuyBuena = Math.max(0, 100 - pctMala - pctBuena);

  // Matemáticas para el gráfico Donut / Torta SVG
  const C = 251.327; // Circunferencia de r=40 (2 * pi * 40)
  const lengthMuyBuena = (pctMuyBuena / 100) * C;
  const lengthBuena = (pctBuena / 100) * C;
  const lengthMala = (pctMala / 100) * C;

  const offsetMuyBuena = 0;
  const offsetBuena = -lengthMuyBuena;
  const offsetMala = -(lengthMuyBuena + lengthBuena);

  return (
    <div className="bg-gradient-to-br from-white to-gray-50/30 rounded-2xl border border-gray-100 shadow-sm p-5 mb-6 animate-in slide-in-from-top-4 duration-350">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-extrabold text-gray-800 text-sm sm:text-base">Distribución Global de Respuestas</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Análisis de inocuidad alimentaria mediante representaciones de barra y torta.</p>
        </div>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200/30">
          Total Votos: {granTotal}
        </span>
      </div>

      <div className="flex flex-col md:flex-row gap-6 items-center">
        {/* Gráfico Donut (Torta) SVG */}
        <div className="flex flex-col items-center justify-center p-2 shrink-0">
          <div className="relative w-36 h-36 flex items-center justify-center">
            <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
              {/* Círculo de fondo */}
              <circle cx="50" cy="50" r="40" fill="transparent" stroke="#f3f4f6" strokeWidth="12" />

              {/* Segmento Muy Buena (Verde) */}
              {pctMuyBuena > 0 && (
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="transparent"
                  stroke="#10b981"
                  strokeWidth="12"
                  strokeDasharray={`${lengthMuyBuena} ${C - lengthMuyBuena}`}
                  strokeDashoffset={offsetMuyBuena}
                  className="transition-all duration-500 ease-out"
                />
              )}

              {/* Segmento Buena (Amarillo) */}
              {pctBuena > 0 && (
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="transparent"
                  stroke="#f59e0b"
                  strokeWidth="12"
                  strokeDasharray={`${lengthBuena} ${C - lengthBuena}`}
                  strokeDashoffset={offsetBuena}
                  className="transition-all duration-500 ease-out"
                />
              )}

              {/* Segmento Mala (Rojo) */}
              {pctMala > 0 && (
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="transparent"
                  stroke="#ef4444"
                  strokeWidth="12"
                  strokeDasharray={`${lengthMala} ${C - lengthMala}`}
                  strokeDashoffset={offsetMala}
                  className="transition-all duration-500 ease-out"
                />
              )}
            </svg>
            {/* Texto en el centro de la torta */}
            <div className="absolute flex flex-col items-center justify-center text-center">
              <span className="text-2xl font-black text-gray-900 leading-none">{granTotal}</span>
              <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Votos</span>
            </div>
          </div>
        </div>

        {/* Gráfico de Barras y Desglose Detallado */}
        <div className="flex-1 w-full flex flex-col justify-center">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Distribución Lineal</p>
          
          <div className="w-full h-7 rounded-full overflow-hidden flex shadow-inner border border-gray-200/20 bg-gray-100/50 mb-5 relative">
            {pctMala > 0 && (
              <div 
                style={{ width: `${pctMala}%` }} 
                className="bg-gradient-to-r from-red-400 to-red-500 h-full relative transition-all duration-500 flex items-center justify-center text-[10px] font-black text-white"
                title={`${escalaLabels[0]}: ${totalMala} (${pctMala}%)`}
              >
                {pctMala >= 8 && `${pctMala}%`}
              </div>
            )}
            {pctBuena > 0 && (
              <div 
                style={{ width: `${pctBuena}%` }} 
                className="bg-gradient-to-r from-amber-400 to-amber-500 h-full relative transition-all duration-500 flex items-center justify-center text-[10px] font-black text-white border-l border-white/10"
                title={`${escalaLabels[1]}: ${totalBuena} (${pctBuena}%)`}
              >
                {pctBuena >= 8 && `${pctBuena}%`}
              </div>
            )}
            {pctMuyBuena > 0 && (
              <div 
                style={{ width: `${pctMuyBuena}%` }} 
                className="bg-gradient-to-r from-emerald-400 to-emerald-500 h-full relative transition-all duration-500 flex items-center justify-center text-[10px] font-black text-white border-l border-white/10"
                title={`${escalaLabels[2]}: ${totalMuyBuena} (${pctMuyBuena}%)`}
              >
                {pctMuyBuena >= 8 && `${pctMuyBuena}%`}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="flex items-center gap-3 p-3 bg-red-50/20 border border-red-100/30 rounded-xl">
              <div className="w-3 h-3 rounded-full bg-red-500 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{escalaLabels[0]}</p>
                <p className="text-base font-black text-red-600 mt-0.5">{totalMala} <span className="text-[10px] font-semibold text-gray-500">votos</span></p>
              </div>
              <span className="text-xs font-extrabold text-red-700 bg-red-50 px-2 py-0.5 rounded-md border border-red-100">{pctMala}%</span>
            </div>

            <div className="flex items-center gap-3 p-3 bg-amber-50/20 border border-amber-100/30 rounded-xl">
              <div className="w-3 h-3 rounded-full bg-amber-500 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{escalaLabels[1]}</p>
                <p className="text-base font-black text-amber-600 mt-0.5">{totalBuena} <span className="text-[10px] font-semibold text-gray-500">votos</span></p>
              </div>
              <span className="text-xs font-extrabold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100">{pctBuena}%</span>
            </div>

            <div className="flex items-center gap-3 p-3 bg-emerald-50/20 border border-emerald-100/30 rounded-xl">
              <div className="w-3 h-3 rounded-full bg-emerald-500 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{escalaLabels[2]}</p>
                <p className="text-base font-black text-emerald-600 mt-0.5">{totalMuyBuena} <span className="text-[10px] font-semibold text-gray-500">votos</span></p>
              </div>
              <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">{pctMuyBuena}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Componente: Gráfico de Promedio General por Subgrupo ───
function GraficoPromedioSubgrupos({
  data
}: {
  data: ReporteAnonimoResponse;
}) {
  const formatPct = (val: number) => {
    return Number(val.toFixed(2)).toString();
  };

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

  if (subGrupoAveragesGlobal.length === 0) return null;

  return (
    <div className="bg-gradient-to-br from-white to-gray-50/30 rounded-2xl border border-gray-100 shadow-sm p-5 mb-6 animate-in slide-in-from-top-4 duration-350">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-extrabold text-gray-800 text-sm sm:text-base">Promedio General por Subgrupo</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Cumplimiento promedio acumulado de todas las categorías y subgrupos.</p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {subGrupoAveragesGlobal.map(s => (
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

// ─── Tabla Reporte Anónimo ────────────────────────
function TablaAnonima({ data, escalaLabels = ['Nunca', 'A veces', 'Siempre'] }: { data: ReporteAnonimoResponse; escalaLabels?: string[] }) {
  const grupos = [...new Set(data.filas.map(f => f.grupo))];
  const [gruposAbiertos, setGruposAbiertos] = useState<Record<string, boolean>>({});

  const toggleGrupo = (grupo: string) => {
    setGruposAbiertos(prev => ({
      ...prev,
      [grupo]: prev[grupo] === false ? true : false
    }));
  };

  const formatPct = (val: number) => {
    return Number(val.toFixed(2)).toString();
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

            // 1. Agrupar las preguntas de este grupo por subgrupo
            const subGruposMap: Record<string, typeof filas> = {};
            filas.forEach(f => {
              const sgName = f.subGrupo !== '—' ? f.subGrupo : 'General';
              if (!subGruposMap[sgName]) {
                subGruposMap[sgName] = [];
              }
              subGruposMap[sgName].push(f);
            });

            // 2. Calcular los porcentajes individuales y los promedios de cada subgrupo (con decimales)
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

              const avg = qs.length > 0 ? sumPct / qs.length : 0;
              subGrupoMetrics[sgName] = { avg, qPcts };
            });

            // 3. Promedio del grupo es el promedio de los promedios de los subgrupos
            const subGrupoAverages = Object.values(subGrupoMetrics).map(m => m.avg);
            const promGrupoCalculado = subGrupoAverages.length > 0
              ? subGrupoAverages.reduce((sum, val) => sum + val, 0) / subGrupoAverages.length
              : 0;

            return (
              <div key={grupo} className="border border-gray-100 rounded-2xl overflow-hidden shadow-sm bg-white transition-all duration-300">
                {/* Cabecera del Acordeón */}
                <button
                  onClick={() => toggleGrupo(grupo)}
                  className="w-full flex items-center justify-between p-4 bg-gray-50/70 hover:bg-gray-50 transition-colors cursor-pointer border-0 text-left focus:outline-none"
                >
                  <div className="flex items-center gap-3">
                    <span className={`transform transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`}>
                      <ChevronRight size={18} className="text-gray-500" />
                    </span>
                    <Folder size={18} className="text-purple-600 shrink-0" />
                    <span className="font-extrabold text-sm sm:text-base text-gray-800 tracking-tight uppercase">
                      {grupo}
                    </span>
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

                {/* Contenido Colapsable */}
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
                              {/* Fila divisora del subgrupo */}
                              <tr className="bg-purple-50/20 border-y border-purple-100/30">
                                <td colSpan={7} className="px-3 py-2 text-left">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <span className="w-1.5 h-3.5 rounded-full bg-purple-600" />
                                      <span className="font-extrabold text-xs text-purple-950 uppercase tracking-wide">
                                        Sub-grupo: {sgName}
                                      </span>
                                    </div>
                                    <span className={`text-xs font-black px-2.5 py-0.5 rounded-full border ${
                                      subGrupoAvg >= 89
                                        ? 'bg-amber-50 text-amber-700 border-amber-100'
                                        : 'bg-red-50 text-red-700 border-red-100'
                                    }`}>
                                      Promedio Sub-grupo: {formatPct(subGrupoAvg)}%
                                    </span>
                                  </div>
                                </td>
                              </tr>

                              {/* Filas de preguntas del subgrupo */}
                              {subGrupoFilas.map(fila => {
                                const pctPregunta = qPcts[fila.preguntaId];

                                return (
                                  <tr key={fila.preguntaId} className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50/30 transition-colors">
                                    <td className="py-3 text-muted-foreground text-xs">{fila.numero}</td>
                                    <td className="py-3 text-xs text-gray-600 font-semibold">{sgName}</td>
                                    <td className="py-3 text-gray-700 leading-snug pr-4">
                                      <div>
                                        <p className="text-sm font-semibold text-gray-800">{fila.enunciado}</p>
                                        {/* Mini stacked frequency bar */}
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
                    <td className="px-4 py-2.5 text-gray-600 text-xs">
                      {new Date(s.fecha).toLocaleString('es-EC', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
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

// ─── Componente: Tabla y Gráficos por Pregunta (Power BI style frequency bars) ───
function TablaGraficaPorPregunta({
  data,
  escalaLabels = ['Nunca', 'A veces', 'Siempre']
}: {
  data: ReporteAnonimoResponse;
  escalaLabels?: string[];
}) {
  const grupos = [...new Set(data.filas.map(f => f.grupo))];

  const formatPct = (val: number) => {
    return Number(val.toFixed(2)).toString();
  };

  const areaAverages = (() => {
    if (!data.sesiones || data.sesiones.length === 0) return [];
    const map: Record<string, { nombre: string; total: number; sum: number }> = {};
    data.sesiones.forEach(s => {
      const aName = s.area || 'General';
      if (!map[aName]) {
        map[aName] = { nombre: aName, total: 0, sum: 0 };
      }
      map[aName].total += 1;
      map[aName].sum += s.puntaje || 0;
    });
    return Object.values(map).map(a => ({
      nombre: a.nombre,
      promedio: a.total > 0 ? a.sum / a.total : 0
    }));
  })();

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

  const [hoveredPreguntaId, setHoveredPreguntaId] = useState<string | null>(null);

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

      {/* Grid de Subgrupos y Participación por Área (Al lado) */}
      {subGrupoAveragesGlobal.length > 0 && (() => {
        const subGrupoAveragesGlobalSorted = [...subGrupoAveragesGlobal].sort((a, b) => b.promedio - a.promedio);
        
        // Calcular conteo de participantes por área (orden descendente)
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

            {/* Participación por Área (Gráfico de Barras Horizontales Descendentes) */}
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

      {/* Gráfico de Columnas Apiladas (Likert) estilo Power BI / Excel */}
      {data.filas.length > 0 && (
        <div className="bg-gradient-to-br from-white to-gray-50/30 rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h4 className="font-extrabold text-gray-800 text-sm sm:text-base">Distribución Likert por Pregunta</h4>
              <p className="text-xs text-muted-foreground mt-0.5">Gráfico de columnas apiladas interactivo con tabla de correspondencia debajo (Estilo Power BI).</p>
            </div>
            {/* Leyenda del gráfico */}
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
            {/* Contenedor del Gráfico de Columnas */}
            <div className="relative h-80 flex items-end justify-between px-6 pt-6 pb-2 border-b border-l border-gray-200/80 bg-gray-50/20 rounded-bl-lg">
              {/* Líneas de Guía Horizontales del Y-Axis */}
              <div className="absolute inset-x-0 top-0 h-full flex flex-col justify-between pointer-events-none pr-2">
                {[100, 75, 50, 25, 0].map((val) => (
                  <div key={val} className="w-full flex items-center justify-between border-t border-gray-100/70 text-[9px] font-bold text-gray-400">
                    <span className="bg-white/90 px-1 py-0.5 rounded shadow-sm -mt-2.5 z-10">{val}%</span>
                    <span className="w-full border-t border-dashed border-gray-200/50" />
                  </div>
                ))}
              </div>

              {/* Columnas Apiladas */}
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
                      {/* Tooltip interactivo flotante */}
                      <div className="absolute -top-16 z-30 bg-gray-900 text-white rounded-xl p-2.5 text-[10px] font-semibold shadow-2xl border border-gray-800 transition-opacity duration-200 opacity-0 group-hover:opacity-100 pointer-events-none min-w-[140px] text-center">
                        <p className="font-extrabold border-b border-gray-800 pb-1 mb-1.5">Pregunta {fila.numero}</p>
                        <p className="text-emerald-400 flex justify-between gap-2"><span>{escalaLabels[2]}:</span> <span>{fila.muyBuena} ({Math.round(pctMuyBuena)}%)</span></p>
                        <p className="text-amber-400 flex justify-between gap-2"><span>{escalaLabels[1]}:</span> <span>{fila.buena} ({Math.round(pctBuena)}%)</span></p>
                        <p className="text-rose-400 flex justify-between gap-2"><span>{escalaLabels[0]}:</span> <span>{fila.mala} ({Math.round(pctMala)}%)</span></p>
                      </div>

                      {/* Barra de Columnas Apiladas */}
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

                      {/* Código de la Pregunta en el eje X */}
                      <span className="text-[10px] font-black text-gray-500 mt-2 shrink-0">
                        P. {fila.numero}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Tabla de Correspondencia estilo Excel / Power BI debajo del Gráfico */}
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

        // Agrupar por subgrupo
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
                    {/* Encabezado de Subgrupo */}
                    <div className="flex items-center gap-2 border-l-4 border-purple-500 pl-3">
                      <span className="font-extrabold text-sm text-purple-950 uppercase tracking-wide">
                        Sub-grupo: {sgName}
                      </span>
                    </div>

                    {/* Listado de preguntas con gráficos */}
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

                            {/* Gráfico de Barras Power BI style */}
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

                              {/* Leyendas con cuentas exactas */}
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

// ─── Página de Reportes (Solo Encuestas Anónimas) ─────────────
export function ReportesV2Page() {
  const [allPeriodos, setAllPeriodos] = useState<Periodo[]>([]);
  const [periodoSel, setPeriodoSel] = useState<string>('');
  const [configs, setConfigs] = useState<EncuestaConfig[]>([]);
  const [configSel, setConfigSel] = useState<string>('');
  const [areas, setAreas] = useState<Area[]>([]);
  const [areaSel, setAreaSel] = useState<string>('');
  const [reporteAnonimo, setReporteAnonimo] = useState<ReporteAnonimoResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'graficos_pregunta'>('general');

  // Períodos filtrados: solo los que tienen al menos 1 config ANONIMA
  const periodosConEncuesta = allPeriodos.filter(p =>
    (p.encuestaConfigs ?? []).some(c => c.tipo === 'ANONIMA')
  );

  // Cargar períodos y áreas
  useEffect(() => {
    api.getPeriodos().then(data => {
      setAllPeriodos(data);
      // Pre-seleccionar el vigente que tenga encuestas anónimas
      const vigente = data.find(p => p.vigente && (p.encuestaConfigs ?? []).some(c => c.tipo === 'ANONIMA'));
      const primerValido = vigente ?? data.find(p => (p.encuestaConfigs ?? []).some(c => c.tipo === 'ANONIMA'));
      if (primerValido) setPeriodoSel(primerValido.id);
    });
    api.getAreasActivas().then(setAreas).catch(console.error);
  }, []);

  useEffect(() => {
    if (!periodoSel) return;
    const periodo = allPeriodos.find(p => p.id === periodoSel);
    const configsAnonimas = (periodo?.encuestaConfigs ?? []).filter(c => c.tipo === 'ANONIMA');
    setConfigs(configsAnonimas);
    // Auto-seleccionar la primera encuesta anónima disponible
    setConfigSel(configsAnonimas[0]?.id ?? '');
  }, [periodoSel, allPeriodos]);

  const cargarReporte = useCallback(async () => {
    if (!periodoSel || !configSel) {
      setReporteAnonimo(null);
      return;
    }
    setLoading(true);
    try {
      const data = await api.getReporteAnonimo(periodoSel, configSel, areaSel || undefined);
      setReporteAnonimo(data);
    } catch (e) { console.error(e); setReporteAnonimo(null); }
    finally { setLoading(false); }
  }, [periodoSel, configSel, areaSel]);

  useEffect(() => { cargarReporte(); }, [cargarReporte]);

  const activeConfig = configs.find(c => c.id === configSel);
  const parsedEscala = (() => {
    if (activeConfig?.escalaLabels) {
      try {
        return JSON.parse(activeConfig.escalaLabels);
      } catch {}
    }
    return ['Nunca', 'A veces', 'Siempre'];
  })();

  // Calcular métricas dinámicas basadas en los filtros para las tarjetas tipo Power BI
  const totalMala = reporteAnonimo?.filas.reduce((sum, f) => sum + f.mala, 0) ?? 0;
  const totalBuena = reporteAnonimo?.filas.reduce((sum, f) => sum + f.buena, 0) ?? 0;
  const totalMuyBuena = reporteAnonimo?.filas.reduce((sum, f) => sum + f.muyBuena, 0) ?? 0;
  const granTotal = totalMala + totalBuena + totalMuyBuena;
  
  const promedioGeneral = granTotal > 0 ? ((totalMala * 1 + totalBuena * 2 + totalMuyBuena * 3) / granTotal) : 0;
  const pctFavorable = granTotal > 0 ? ((totalBuena + totalMuyBuena) / granTotal) * 100 : 0;
  const pctCritico = granTotal > 0 ? (totalMala / granTotal) * 100 : 0;
  const totalSesionesAnonimas = reporteAnonimo?.totalSesiones ?? 0;

  return (
    <div>
      {/* Encabezado */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center shadow-md">
            <ShieldCheck size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Análisis de Encuestas</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Resultados de encuestas anónimas de inocuidad alimentaria.</p>
          </div>
        </div>
      </div>

      {/* KPIs Dinámicos (Tipo Power BI) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard 
          label="Resp. Anónimas" 
          value={totalSesionesAnonimas} 
          sub="Encuestas recibidas filtradas" 
          color="text-purple-600" 
          icon={<ShieldCheck size={20} className="text-purple-500" />}
        />
        <KpiCard 
          label="Favorabilidad" 
          value={`${pctFavorable.toFixed(1)}%`} 
          sub={`${parsedEscala[1]} o ${parsedEscala[2]}`} 
          color={pctFavorable >= 75 ? 'text-emerald-600' : pctFavorable >= 50 ? 'text-amber-600' : 'text-rose-600'} 
          icon={<ThumbsUp size={20} className={pctFavorable >= 75 ? 'text-emerald-500' : pctFavorable >= 50 ? 'text-amber-500' : 'text-rose-500'} />}
        />
        <KpiCard 
          label="Promedio Likert" 
          value={`${promedioGeneral.toFixed(2)} / 3.00`} 
          sub="Puntaje de escala global" 
          color="text-blue-600" 
          icon={<Award size={20} className="text-blue-500" />}
        />
        <KpiCard 
          label="Índice Crítico" 
          value={`${pctCritico.toFixed(1)}%`} 
          sub={`Respuestas '${parsedEscala[0]}'`} 
          color={pctCritico > 25 ? 'text-rose-600' : 'text-gray-500'} 
          icon={<AlertTriangle size={20} className={pctCritico > 25 ? 'text-rose-500' : 'text-gray-400'} />}
        />
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-2xl border border-purple-100/60 shadow-sm p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[160px]">
            <label className="text-xs font-semibold text-gray-600 mb-1 block uppercase tracking-wide">Período</label>
            <select className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              value={periodoSel} onChange={e => setPeriodoSel(e.target.value)}>
              {periodosConEncuesta.map(p => <option key={p.id} value={p.id}>{p.nombre} {p.vigente ? '🟢' : ''}</option>)}
            </select>
          </div>
          <div className="flex-1 min-w-[160px]">
            <label className="text-xs font-semibold text-gray-600 mb-1 block uppercase tracking-wide">Encuesta</label>
            <select className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              value={configSel} onChange={e => setConfigSel(e.target.value)}>
              {configs.length === 0 && <option value="">Sin encuestas anónimas disponibles</option>}
              {configs.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
          </div>
          <div className="flex-1 min-w-[160px]">
            <label className="text-xs font-semibold text-gray-600 mb-1 block uppercase tracking-wide">Filtrar por Área</label>
            <select className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              value={areaSel} onChange={e => setAreaSel(e.target.value)}>
              <option value="">Todas las Áreas</option>
              {areas.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Contenido */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-10 h-10 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
          </div>
        ) : reporteAnonimo && reporteAnonimo.filas.length > 0 ? (
          <>
            {/* Selector de Pestañas (Power BI Style) */}
            <div className="flex border-b border-gray-100 mb-6 gap-2 flex-wrap">
              <button
                onClick={() => setActiveTab('general')}
                className={`px-4 py-2.5 font-bold text-sm transition-all border-b-2 cursor-pointer ${
                  activeTab === 'general'
                    ? 'border-purple-600 text-purple-600 bg-purple-50/30'
                    : 'border-transparent text-gray-500 hover:text-gray-800'
                }`}
              >
                📊 Distribución General
              </button>
              <button
                onClick={() => setActiveTab('graficos_pregunta')}
                className={`px-4 py-2.5 font-bold text-sm transition-all border-b-2 cursor-pointer ${
                  activeTab === 'graficos_pregunta'
                    ? 'border-purple-600 text-purple-600 bg-purple-50/30'
                    : 'border-transparent text-gray-500 hover:text-gray-800'
                }`}
              >
                📈 Frecuencia por Preguntas
              </button>
            </div>

            {activeTab === 'general' ? (
              <>
                <GraficoDistribucionLikert data={reporteAnonimo} escalaLabels={parsedEscala} />
                <GraficoPromedioSubgrupos data={reporteAnonimo} />
                <TablaAnonima data={reporteAnonimo} escalaLabels={parsedEscala} />
              </>
            ) : (
              <TablaGraficaPorPregunta data={reporteAnonimo} escalaLabels={parsedEscala} />
            )}
          </>
        ) : (
          <div className="text-center py-16 text-muted-foreground">
            <p className="text-4xl mb-3">🔒</p>
            <p className="font-semibold">Sin datos de encuestas anónimas</p>
            <p className="text-sm mt-1">Selecciona un período y encuesta anónima con respuestas registradas.</p>
          </div>
        )}
      </div>
    </div>
  );
}
