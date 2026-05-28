import { useState, useEffect, useCallback } from 'react';
import { api } from '../../lib/api';
import { ClipboardList, Users, Award, MapPin, CheckCircle, Folder, ChevronRight } from 'lucide-react';
import type { Periodo, EncuestaConfig, ReporteEvaluacionResponse, Area } from '../../types';

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
      <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-gradient-to-br from-gray-100/10 to-gray-200/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
    </div>
  );
}

// ─── Componente: Dashboard de Evaluación (Power BI Style V/F) ───
function GraficoEvaluacionDashboard({ data }: { data: ReporteEvaluacionResponse }) {
  const total = data.sesiones.length;
  if (total === 0) return null;

  // Clasificación de desempeño
  const excelenteCount = data.sesiones.filter(s => s.porcentajeAcierto >= 85).length;
  const aceptableCount = data.sesiones.filter(s => s.porcentajeAcierto >= 70 && s.porcentajeAcierto < 85).length;
  const refuerzoCount = data.sesiones.filter(s => s.porcentajeAcierto < 70).length;

  const pctExcelente = Math.round((excelenteCount / total) * 100);
  const pctAceptable = Math.round((aceptableCount / total) * 100);
  const pctRefuerzo = Math.max(0, 100 - pctExcelente - pctAceptable);

  // Matemáticas para el donut SVG
  const C = 251.327; // Circunferencia de r=40
  const lengthExcelente = (pctExcelente / 100) * C;
  const lengthAceptable = (pctAceptable / 100) * C;
  const lengthRefuerzo = (pctRefuerzo / 100) * C;

  const offsetExcelente = 0;
  const offsetAceptable = -lengthExcelente;
  const offsetRefuerzo = -(lengthExcelente + lengthAceptable);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6 animate-in slide-in-from-top-4 duration-350">
      {/* Gráfico Torta (Donut) */}
      <div className="lg:col-span-5 bg-gradient-to-br from-white to-gray-50/30 rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col justify-between">
        <div>
          <h3 className="font-extrabold text-gray-800 text-sm sm:text-base">Nivel de Desempeño General (VF)</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Clasificación de evaluados según su porcentaje de aciertos en preguntas V/F.</p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-6 my-4 shrink-0 justify-center">
          <div className="relative w-32 h-32 flex items-center justify-center shrink-0">
            <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
              <circle cx="50" cy="50" r="40" fill="transparent" stroke="#f3f4f6" strokeWidth="12" />
              {pctExcelente > 0 && (
                <circle cx="50" cy="50" r="40" fill="transparent" stroke="#10b981" strokeWidth="12" strokeDasharray={`${lengthExcelente} ${C - lengthExcelente}`} strokeDashoffset={offsetExcelente} className="transition-all duration-500" />
              )}
              {pctAceptable > 0 && (
                <circle cx="50" cy="50" r="40" fill="transparent" stroke="#3b82f6" strokeWidth="12" strokeDasharray={`${lengthAceptable} ${C - lengthAceptable}`} strokeDashoffset={offsetAceptable} className="transition-all duration-500" />
              )}
              {pctRefuerzo > 0 && (
                <circle cx="50" cy="50" r="40" fill="transparent" stroke="#ef4444" strokeWidth="12" strokeDasharray={`${lengthRefuerzo} ${C - lengthRefuerzo}`} strokeDashoffset={offsetRefuerzo} className="transition-all duration-500" />
              )}
            </svg>
            <div className="absolute flex flex-col items-center justify-center text-center">
              <span className="text-2xl font-black text-gray-900 leading-none">{total}</span>
              <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Eval.</span>
            </div>
          </div>

          <div className="flex-1 w-full space-y-1.5">
            <div className="flex items-center justify-between p-2 rounded-xl bg-emerald-50/20 border border-emerald-100/30">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="text-xs font-bold text-gray-700">Excelente (≥85%)</span>
              </div>
              <span className="text-xs font-black text-emerald-600">{excelenteCount} ({pctExcelente}%)</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-xl bg-blue-50/20 border border-blue-100/30">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                <span className="text-xs font-bold text-gray-700">Aceptable (70-84%)</span>
              </div>
              <span className="text-xs font-black text-blue-600">{aceptableCount} ({pctAceptable}%)</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-xl bg-rose-50/20 border border-rose-100/30">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span className="text-xs font-bold text-gray-700">Refuerzo (&lt;70%)</span>
              </div>
              <span className="text-xs font-black text-rose-600">{refuerzoCount} ({pctRefuerzo}%)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Gráfico Barras: Rendimiento por Área */}
      <div className="lg:col-span-7 bg-gradient-to-br from-white to-gray-50/30 rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col justify-between">
        <div>
          <h3 className="font-extrabold text-gray-800 text-sm sm:text-base">Acierto Promedio por Área (VF)</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Comparativa del rendimiento promedio de respuestas correctas por departamento.</p>
        </div>

        <div className="space-y-3 my-4">
          {data.estadisticasPorArea.map(a => (
            <div key={a.nombre} className="space-y-1">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-gray-700">{a.nombre}</span>
                <span className="font-black text-gray-900 bg-gray-50 px-2 py-0.5 rounded border border-gray-100">{a.porcentajeAcierto}%</span>
              </div>
              <div className="w-full h-3 rounded-full bg-gray-100 overflow-hidden relative">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    a.porcentajeAcierto >= 80 ? 'bg-gradient-to-r from-emerald-400 to-emerald-500' :
                    a.porcentajeAcierto >= 65 ? 'bg-gradient-to-r from-blue-400 to-blue-500' :
                    a.porcentajeAcierto >= 50 ? 'bg-gradient-to-r from-amber-400 to-amber-500' :
                    'bg-gradient-to-r from-rose-400 to-rose-500'
                  }`}
                  style={{ width: `${a.porcentajeAcierto}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Componente: Gráfico de Distribución Likert para Evaluaciones ─
function GraficoDistribucionLikertEvaluacion({
  data,
  escalaLabels = ['Mala', 'Buena', 'Muy buena']
}: {
  data: ReporteEvaluacionResponse;
  escalaLabels?: string[];
}) {
  // 1. Calcular sumas globales y agrupamiento por área
  let totalMala = 0;
  let totalBuena = 0;
  let totalMuyBuena = 0;
  let granTotal = 0;

  const areasLikert: Record<string, {
    nombre: string;
    mala: number;
    buena: number;
    muyBuena: number;
    total: number;
  }> = {};

  data.sesiones.forEach(s => {
    const areaName = s.area || 'General';
    if (!areasLikert[areaName]) {
      areasLikert[areaName] = { nombre: areaName, mala: 0, buena: 0, muyBuena: 0, total: 0 };
    }

    (s.respuestas ?? []).forEach(r => {
      if (r.pregunta.tipoPregunta === 'LIKERT_3') {
        const valNum = r.valorNumerico;
        const resp = (r.respuestaDada ?? '').toString().trim().toLowerCase();
        const label0 = escalaLabels[0]?.toLowerCase();
        const label1 = escalaLabels[1]?.toLowerCase();

        granTotal += 1;
        areasLikert[areaName].total += 1;

        if (valNum === 1 || resp === 'nunca' || resp === '1' || resp === 'malo' || resp === 'mala' || resp === label0) {
          totalMala += 1;
          areasLikert[areaName].mala += 1;
        } else if (valNum === 2 || resp === 'a veces' || resp === '2' || resp === 'regular' || resp === 'bueno' || resp === 'buena' || resp === label1) {
          totalBuena += 1;
          areasLikert[areaName].buena += 1;
        } else {
          totalMuyBuena += 1;
          areasLikert[areaName].muyBuena += 1;
        }
      }
    });
  });

  const areasList = Object.values(areasLikert).filter(a => a.total > 0);

  if (granTotal === 0) {
    return (
      <div className="bg-gray-50 border border-dashed border-gray-200 rounded-2xl p-6 text-center text-muted-foreground text-xs mb-6">
        No hay respuestas registradas en escala Likert en esta evaluación.
      </div>
    );
  }

  const pctMala = Math.round((totalMala / granTotal) * 100);
  const pctBuena = Math.round((totalBuena / granTotal) * 100);
  const pctMuyBuena = Math.max(0, 100 - pctMala - pctBuena);

  // Matemáticas para el donut SVG
  const C = 251.327; // Circunferencia de r=40
  const lengthMuyBuena = (pctMuyBuena / 100) * C;
  const lengthBuena = (pctBuena / 100) * C;
  const lengthMala = (pctMala / 100) * C;

  const offsetMuyBuena = 0;
  const offsetBuena = -lengthMuyBuena;
  const offsetMala = -(lengthMuyBuena + lengthBuena);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6 animate-in slide-in-from-top-4 duration-350">
      {/* Columna Izquierda: Donut de Distribución Global */}
      <div className="lg:col-span-5 bg-gradient-to-br from-white to-gray-50/30 rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col justify-between">
        <div>
          <h3 className="font-extrabold text-gray-800 text-sm sm:text-base">Distribución Global (Likert)</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Porcentaje global de respuestas cualitativas registradas en la escala.</p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-6 my-4 shrink-0 justify-center">
          <div className="relative w-32 h-32 flex items-center justify-center shrink-0">
            <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
              <circle cx="50" cy="50" r="40" fill="transparent" stroke="#f3f4f6" strokeWidth="12" />
              {pctMuyBuena > 0 && (
                <circle cx="50" cy="50" r="40" fill="transparent" stroke="#10b981" strokeWidth="12" strokeDasharray={`${lengthMuyBuena} ${C - lengthMuyBuena}`} strokeDashoffset={offsetMuyBuena} className="transition-all duration-500" />
              )}
              {pctBuena > 0 && (
                <circle cx="50" cy="50" r="40" fill="transparent" stroke="#f59e0b" strokeWidth="12" strokeDasharray={`${lengthBuena} ${C - lengthBuena}`} strokeDashoffset={offsetBuena} className="transition-all duration-500" />
              )}
              {pctMala > 0 && (
                <circle cx="50" cy="50" r="40" fill="transparent" stroke="#ef4444" strokeWidth="12" strokeDasharray={`${lengthMala} ${C - lengthMala}`} strokeDashoffset={offsetMala} className="transition-all duration-500" />
              )}
            </svg>
            <div className="absolute flex flex-col items-center justify-center text-center">
              <span className="text-2xl font-black text-gray-900 leading-none">{granTotal}</span>
              <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Votos</span>
            </div>
          </div>

          <div className="flex-1 w-full space-y-1.5">
            <div className="flex items-center justify-between p-2 rounded-xl bg-emerald-50/20 border border-emerald-100/30 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                <span className="font-bold text-gray-700 uppercase tracking-wide">{escalaLabels[2]}</span>
              </div>
              <span className="font-black text-emerald-600">{totalMuyBuena} ({pctMuyBuena}%)</span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-xl bg-amber-50/20 border border-amber-100/30 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                <span className="font-bold text-gray-700 uppercase tracking-wide">{escalaLabels[1]}</span>
              </div>
              <span className="font-black text-amber-600">{totalBuena} ({pctBuena}%)</span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-xl bg-rose-50/20 border border-rose-100/30 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
                <span className="font-bold text-gray-700 uppercase tracking-wide">{escalaLabels[0]}</span>
              </div>
              <span className="font-black text-rose-600">{totalMala} ({pctMala}%)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Columna Derecha: Stacked Bar Chart per Area */}
      <div className="lg:col-span-7 bg-gradient-to-br from-white to-gray-50/30 rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col justify-between">
        <div>
          <h3 className="font-extrabold text-gray-800 text-sm sm:text-base">Favorabilidad por Área (Likert)</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Distribución de respuestas cualitativas y tasa de favorabilidad por departamento.</p>
        </div>

        <div className="space-y-4 my-4">
          {areasList.map(a => {
            const pctA_mala = Math.round((a.mala / a.total) * 100);
            const pctA_buena = Math.round((a.buena / a.total) * 100);
            const pctA_muyBuena = Math.max(0, 100 - pctA_mala - pctA_buena);
            const favorabilidad = Math.round(((a.buena + a.muyBuena) / a.total) * 100);

            return (
              <div key={a.nombre} className="space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-gray-700">{a.nombre}</span>
                  <span className={`font-black text-[10px] px-2 py-0.5 rounded border ${
                    favorabilidad >= 75 ? 'bg-emerald-50 text-emerald-700 border-emerald-100/50' :
                    favorabilidad >= 50 ? 'bg-amber-50 text-amber-700 border-amber-100/50' :
                    'bg-rose-50 text-rose-700 border-rose-100/50'
                  }`}>
                    Favorabilidad: {favorabilidad}%
                  </span>
                </div>
                <div className="w-full h-3.5 rounded-full overflow-hidden flex bg-gray-100 shadow-inner">
                  {pctA_mala > 0 && (
                    <div
                      style={{ width: `${pctA_mala}%` }}
                      className="bg-gradient-to-r from-red-400 to-red-500 h-full relative"
                      title={`${escalaLabels[0]}: ${a.mala} (${pctA_mala}%)`}
                    />
                  )}
                  {pctA_buena > 0 && (
                    <div
                      style={{ width: `${pctA_buena}%` }}
                      className="bg-gradient-to-r from-amber-400 to-amber-500 h-full relative border-l border-white/10"
                      title={`${escalaLabels[1]}: ${a.buena} (${pctA_buena}%)`}
                    />
                  )}
                  {pctA_muyBuena > 0 && (
                    <div
                      style={{ width: `${pctA_muyBuena}%` }}
                      className="bg-gradient-to-r from-emerald-400 to-emerald-500 h-full relative border-l border-white/10"
                      title={`${escalaLabels[2]}: ${a.muyBuena} (${pctA_muyBuena}%)`}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Tabla Reporte Evaluación ─────────────────────────────────
function TablaEvaluacion({ 
  data, 
  escalaLabels = ['Mala', 'Buena', 'Muy buena'],
  activeTab,
  setActiveTab
}: { 
  data: ReporteEvaluacionResponse; 
  escalaLabels?: string[];
  activeTab: 'preguntas_vf' | 'preguntas_likert' | 'personas';
  setActiveTab: (tab: 'preguntas_vf' | 'preguntas_likert' | 'personas') => void;
}) {
  const [gruposAbiertos, setGruposAbiertos] = useState<Record<string, boolean>>({});

  // 1. Agrupar respuestas por pregunta para el desglose detallado
  const preguntasMap: Record<string, {
    preguntaId: string;
    enunciado: string;
    grupo: string;
    subGrupo: string;
    tipoPregunta: 'VERDADERO_FALSO' | 'LIKERT_3';
    respuestaCorrecta?: boolean | null;
    correctas: number;
    incorrectas: number;
    total: number;
    // Para Likert
    mala: number;
    buena: number;
    muyBuena: number;
  }> = {};

  data.sesiones.forEach(s => {
    (s.respuestas ?? []).forEach(r => {
      const qId = r.pregunta.id;
      if (!preguntasMap[qId]) {
        preguntasMap[qId] = {
          preguntaId: qId,
          enunciado: r.pregunta.enunciado,
          grupo: r.pregunta.grupo?.nombre ?? 'General',
          subGrupo: r.pregunta.subGrupo?.nombre ?? '—',
          tipoPregunta: r.pregunta.tipoPregunta ?? 'VERDADERO_FALSO',
          respuestaCorrecta: r.pregunta.respuestaCorrecta,
          correctas: 0,
          incorrectas: 0,
          total: 0,
          mala: 0,
          buena: 0,
          muyBuena: 0
        };
      }
      preguntasMap[qId].total += 1;

      if (preguntasMap[qId].tipoPregunta === 'LIKERT_3') {
        const valNum = r.valorNumerico;
        const resp = (r.respuestaDada ?? '').toString().trim().toLowerCase();
        
        const label0 = escalaLabels[0]?.toLowerCase();
        const label1 = escalaLabels[1]?.toLowerCase();

        if (valNum === 1 || resp === 'nunca' || resp === '1' || resp === 'malo' || resp === 'mala' || resp === label0) {
          preguntasMap[qId].mala += 1;
        } else if (valNum === 2 || resp === 'a veces' || resp === '2' || resp === 'regular' || resp === 'bueno' || resp === 'buena' || resp === label1) {
          preguntasMap[qId].buena += 1;
        } else {
          preguntasMap[qId].muyBuena += 1;
        }
      } else {
        if (r.esCorrecta) {
          preguntasMap[qId].correctas += 1;
        } else {
          preguntasMap[qId].incorrectas += 1;
        }
      }
    });
  });

  const todasLasPreguntas = Object.values(preguntasMap);
  
  // Filtrar según la pestaña activa
  const filasPreguntas = todasLasPreguntas.filter(fp => {
    if (activeTab === 'preguntas_vf') return fp.tipoPregunta === 'VERDADERO_FALSO';
    if (activeTab === 'preguntas_likert') return fp.tipoPregunta === 'LIKERT_3';
    return true;
  });

  const grupos = [...new Set(filasPreguntas.map(fp => fp.grupo))];

  // Calcular promedios por grupo (acierto / favorabilidad) para las preguntas visibles
  const promediosPorGrupo: Record<string, number> = {};
  grupos.forEach(grupo => {
    const qInGrupo = filasPreguntas.filter(fp => fp.grupo === grupo);
    let sumPositivas = 0;
    let sumTotal = 0;

    qInGrupo.forEach(q => {
      sumTotal += q.total;
      if (q.tipoPregunta === 'LIKERT_3') {
        sumPositivas += (q.buena + q.muyBuena); // Favorabilidad
      } else {
        sumPositivas += q.correctas; // Acierto
      }
    });

    promediosPorGrupo[grupo] = sumTotal > 0 ? Math.round((sumPositivas / sumTotal) * 100) : 0;
  });

  const toggleGrupo = (grupo: string) => {
    setGruposAbiertos(prev => ({
      ...prev,
      [grupo]: prev[grupo] === false ? true : false
    }));
  };

  const conteoVF = todasLasPreguntas.filter(fp => fp.tipoPregunta === 'VERDADERO_FALSO').length;
  const conteoLikert = todasLasPreguntas.filter(fp => fp.tipoPregunta === 'LIKERT_3').length;

  return (
    <div>
      {/* Tab Switcher (Power BI Report Pages style) */}
      <div className="flex border-b border-gray-100 mb-6 mt-2 gap-2 flex-wrap">
        <button
          onClick={() => setActiveTab('preguntas_vf')}
          className={`px-4 py-2.5 font-bold text-sm transition-all border-b-2 cursor-pointer ${
            activeTab === 'preguntas_vf'
              ? 'border-blue-600 text-blue-600 bg-blue-50/30'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          📊 Preguntas V/F ({conteoVF})
        </button>
        <button
          onClick={() => setActiveTab('preguntas_likert')}
          className={`px-4 py-2.5 font-bold text-sm transition-all border-b-2 cursor-pointer ${
            activeTab === 'preguntas_likert'
              ? 'border-blue-600 text-blue-600 bg-blue-50/30'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          📈 Preguntas Likert ({conteoLikert})
        </button>
        <button
          onClick={() => setActiveTab('personas')}
          className={`px-4 py-2.5 font-bold text-sm transition-all border-b-2 cursor-pointer ${
            activeTab === 'personas'
              ? 'border-blue-600 text-blue-600 bg-blue-50/30'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          👥 Calificaciones por Persona ({data.sesiones.length})
        </button>
      </div>

      {/* CONTENIDO DE PESTAÑAS */}
      {activeTab === 'preguntas_vf' ? (
        <div className="flex flex-col gap-4 animate-in fade-in duration-300">
          {/* Dashboard Visual de Power BI exclusivo para V/F */}
          <GraficoEvaluacionDashboard data={data} />

          <div className="flex items-center justify-between mt-4 mb-2">
            <h3 className="font-extrabold text-gray-800 text-sm sm:text-base">Análisis de Preguntas Verdadero/Falso</h3>
            <span className="text-xs text-muted-foreground">Muestra: <strong>{data.sesiones.length}</strong> evaluados</span>
          </div>

          {filasPreguntas.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground border border-dashed border-gray-200 rounded-2xl bg-gray-50/35">
              Sin preguntas de este tipo registradas en esta evaluación.
            </div>
          ) : (
            grupos.map(grupo => {
              const filas = filasPreguntas.filter(fp => fp.grupo === grupo);
              const promGrupo = promediosPorGrupo[grupo];
              const isOpen = gruposAbiertos[grupo] !== false;

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
                      <Folder size={18} className="text-blue-600 shrink-0" />
                      <span className="font-extrabold text-sm sm:text-base text-gray-800 tracking-tight uppercase">
                        {grupo}
                      </span>
                      <span className="text-[10px] font-bold bg-gray-200/60 text-gray-600 px-2 py-0.5 rounded-full">
                        {filas.length} {filas.length === 1 ? 'pregunta' : 'preguntas'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground hidden sm:inline font-semibold">Acierto Promedio:</span>
                      <span className={`text-xs font-black px-2.5 py-1 rounded-lg border ${
                        promGrupo >= 75 ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                        promGrupo >= 50 ? 'bg-amber-50 text-amber-700 border-amber-100' :
                        'bg-red-50 text-red-700 border-red-100'
                      }`}>
                        {promGrupo}%
                      </span>
                    </div>
                  </button>

                  <div className={`transition-all duration-300 ${isOpen ? 'block border-t border-gray-100' : 'hidden'}`}>
                    <div className="overflow-x-auto p-2 sm:p-4">
                      <table className="w-full text-sm border-collapse min-w-[650px]">
                        <thead>
                          <tr className="border-b border-gray-150/70">
                            <th className="text-left pb-2.5 text-xs font-semibold text-gray-500 w-28">Sub-grupo</th>
                            <th className="text-left pb-2.5 text-xs font-semibold text-gray-500">Pregunta</th>
                            <th className="text-center pb-2.5 text-xs font-semibold text-emerald-600 w-28">Correcto</th>
                            <th className="text-center pb-2.5 text-xs font-semibold text-rose-600 w-28">Incorrecto</th>
                            <th className="text-center pb-2.5 text-xs font-semibold text-blue-700 w-24">Acierto %</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filas.map((fila) => {
                            const pctCorrectas = Math.round((fila.correctas / fila.total) * 100);
                            return (
                              <tr key={fila.preguntaId} className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50/30 transition-colors">
                                <td className="py-3 text-xs text-gray-600 font-semibold">{fila.subGrupo !== '—' ? fila.subGrupo : 'General'}</td>
                                <td className="py-3 text-gray-700 leading-snug pr-4">
                                  <div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 border border-blue-200/50">
                                        V/F
                                      </span>
                                      <p className="text-sm font-semibold text-gray-800">{fila.enunciado}</p>
                                    </div>
                                    <div className="w-56 h-2 rounded-full overflow-hidden flex bg-gray-100 mt-2.5 border border-gray-200/10 shadow-inner">
                                      {fila.correctas > 0 && (
                                        <div className="bg-gradient-to-r from-emerald-400 to-emerald-500 h-full" style={{ width: `${pctCorrectas}%` }} title={`Correctas: ${fila.correctas}`} />
                                      )}
                                      {fila.incorrectas > 0 && (
                                        <div className="bg-gradient-to-r from-rose-400 to-rose-500 h-full" style={{ width: `${100 - pctCorrectas}%` }} title={`Incorrectas: ${fila.incorrectas}`} />
                                      )}
                                    </div>
                                  </div>
                                </td>
                                <td className="py-3 text-center text-xs">
                                  <span className="text-emerald-600 font-bold">{fila.correctas} v (Correcto)</span>
                                </td>
                                <td className="py-3 text-center text-xs">
                                  <span className="text-rose-600 font-bold">{fila.incorrectas} v (Error)</span>
                                </td>
                                <td className="py-3 text-center">
                                  <span className={`text-xs font-black px-2 py-0.5 rounded-full border ${
                                    pctCorrectas >= 75 ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                    pctCorrectas >= 50 ? 'bg-amber-50 text-amber-700 border-amber-100' :
                                    'bg-rose-50 text-rose-700 border-rose-100'
                                  }`}>
                                    {pctCorrectas}%
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
              );
            })
          )}
        </div>
      ) : activeTab === 'preguntas_likert' ? (
        <div className="flex flex-col gap-4 animate-in fade-in duration-300">
          {/* Dashboard Visual de Power BI exclusivo para LIKERT */}
          <GraficoDistribucionLikertEvaluacion data={data} escalaLabels={escalaLabels} />

          <div className="flex items-center justify-between mt-4 mb-2">
            <h3 className="font-extrabold text-gray-800 text-sm sm:text-base">Análisis de Preguntas en Escala de Likert</h3>
            <span className="text-xs text-muted-foreground">Muestra: <strong>{data.sesiones.length}</strong> evaluados</span>
          </div>

          {filasPreguntas.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground border border-dashed border-gray-200 rounded-2xl bg-gray-50/35">
              Sin preguntas de este tipo registradas en esta evaluación.
            </div>
          ) : (
            grupos.map(grupo => {
              const filas = filasPreguntas.filter(fp => fp.grupo === grupo);
              const promGrupo = promediosPorGrupo[grupo];
              const isOpen = gruposAbiertos[grupo] !== false;

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
                      <Folder size={18} className="text-blue-600 shrink-0" />
                      <span className="font-extrabold text-sm sm:text-base text-gray-800 tracking-tight uppercase">
                        {grupo}
                      </span>
                      <span className="text-[10px] font-bold bg-gray-200/60 text-gray-600 px-2 py-0.5 rounded-full">
                        {filas.length} {filas.length === 1 ? 'pregunta' : 'preguntas'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground hidden sm:inline font-semibold">Favorabilidad Promedio:</span>
                      <span className={`text-xs font-black px-2.5 py-1 rounded-lg border ${
                        promGrupo >= 75 ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                        promGrupo >= 50 ? 'bg-amber-50 text-amber-700 border-amber-100' :
                        'bg-red-50 text-red-700 border-red-100'
                      }`}>
                        {promGrupo}%
                      </span>
                    </div>
                  </button>

                  <div className={`transition-all duration-300 ${isOpen ? 'block border-t border-gray-100' : 'hidden'}`}>
                    <div className="overflow-x-auto p-2 sm:p-4">
                      <table className="w-full text-sm border-collapse min-w-[650px]">
                        <thead>
                          <tr className="border-b border-gray-150/70">
                            <th className="text-left pb-2.5 text-xs font-semibold text-gray-500 w-28">Sub-grupo</th>
                            <th className="text-left pb-2.5 text-xs font-semibold text-gray-500">Pregunta</th>
                            <th className="text-center pb-2.5 text-xs font-semibold text-emerald-600 w-28">Favorable</th>
                            <th className="text-center pb-2.5 text-xs font-semibold text-rose-600 w-28">Desfavorable</th>
                            <th className="text-center pb-2.5 text-xs font-semibold text-blue-700 w-24">Fav %</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filas.map((fila) => {
                            const pctCorrectas = Math.round(((fila.buena + fila.muyBuena) / fila.total) * 100);

                            return (
                              <tr key={fila.preguntaId} className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50/30 transition-colors">
                                <td className="py-3 text-xs text-gray-600 font-semibold">{fila.subGrupo !== '—' ? fila.subGrupo : 'General'}</td>
                                <td className="py-3 text-gray-700 leading-snug pr-4">
                                  <div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 border border-purple-200/50">
                                        LIKERT
                                      </span>
                                      <p className="text-sm font-semibold text-gray-800">{fila.enunciado}</p>
                                    </div>
                                    <div className="w-56 h-2 rounded-full overflow-hidden flex bg-gray-100 mt-2.5 border border-gray-200/10 shadow-inner">
                                      {fila.mala > 0 && (
                                        <div className="bg-red-400 h-full" style={{ width: `${(fila.mala / fila.total) * 100}%` }} title={`${escalaLabels[0]}: ${fila.mala}`} />
                                      )}
                                      {fila.buena > 0 && (
                                        <div className="bg-amber-400 h-full" style={{ width: `${(fila.buena / fila.total) * 100}%` }} title={`${escalaLabels[1]}: ${fila.buena}`} />
                                      )}
                                      {fila.muyBuena > 0 && (
                                        <div className="bg-emerald-400 h-full" style={{ width: `${(fila.muyBuena / fila.total) * 100}%` }} title={`${escalaLabels[2]}: ${fila.muyBuena}`} />
                                      )}
                                    </div>
                                  </div>
                                </td>
                                <td className="py-3 text-center text-xs">
                                  <div className="text-gray-800">
                                    <p className="font-bold text-emerald-600">{fila.muyBuena} v ({escalaLabels[2]})</p>
                                    <p className="text-[10px] text-amber-600 font-semibold">{fila.buena} v ({escalaLabels[1]})</p>
                                  </div>
                                </td>
                                <td className="py-3 text-center text-xs">
                                  <span className="text-rose-500 font-bold">{fila.mala} v ({escalaLabels[0]})</span>
                                </td>
                                <td className="py-3 text-center">
                                  <span className={`text-xs font-black px-2 py-0.5 rounded-full border ${
                                    pctCorrectas >= 75 ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                    pctCorrectas >= 50 ? 'bg-amber-50 text-amber-700 border-amber-100' :
                                    'bg-rose-50 text-rose-700 border-rose-100'
                                  }`}>
                                    {pctCorrectas}%
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
              );
            })
          )}
        </div>
      ) : (
        <div className="animate-in fade-in duration-300">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-extrabold text-gray-800 text-sm sm:text-base">Detalle de Calificaciones por Persona</h3>
            <p className="text-xs text-muted-foreground">Listado detallado con el puntaje obtenido por cada participante.</p>
          </div>

          <div className="overflow-x-auto border border-gray-100 rounded-2xl shadow-sm bg-white">
            <table className="w-full text-sm border-collapse min-w-[600px]">
              <thead>
                <tr className="bg-gray-50/70 border-b border-gray-100">
                  <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Trabajador</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Área</th>
                  <th className="text-center px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Puntaje</th>
                  <th className="text-center px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Correctas</th>
                  <th className="text-center px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Acierto (%)</th>
                </tr>
              </thead>
              <tbody>
                {data.sesiones.map(s => (
                  <tr key={s.sesionId} className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50/30 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-gray-900">{s.apellidos}, {s.nombres}</p>
                      <p className="text-xs text-muted-foreground">{s.cedula}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-600 hidden sm:table-cell font-medium">{s.area}</td>
                    <td className="px-4 py-3 text-center font-bold text-blue-600">{s.puntajeTotal} pts</td>
                    <td className="px-4 py-3 text-center text-gray-700 font-semibold">{s.correctas} / {s.totalPreguntas}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs font-black px-2.5 py-1 rounded-lg border ${
                        s.porcentajeAcierto >= 85 ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                        s.porcentajeAcierto >= 70 ? 'bg-blue-50 text-blue-700 border-blue-100' :
                        'bg-red-50 text-red-700 border-red-100'
                      }`}>
                        {s.porcentajeAcierto}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {data.sesiones.length === 0 && (
              <div className="text-center py-12 text-muted-foreground text-sm">Sin respuestas registradas.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Página de Evaluaciones ───────────────────────────────────
export function EvaluacionesPage() {
  const [allPeriodos, setAllPeriodos] = useState<Periodo[]>([]);
  const [periodoSel, setPeriodoSel] = useState<string>('');
  const [configs, setConfigs] = useState<EncuestaConfig[]>([]);
  const [configSel, setConfigSel] = useState<string>('');
  const [areas, setAreas] = useState<Area[]>([]);
  const [areaSel, setAreaSel] = useState<string>('');
  const [reporteEvaluacion, setReporteEvaluacion] = useState<ReporteEvaluacionResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'preguntas_vf' | 'preguntas_likert' | 'personas'>('preguntas_vf');

  // Períodos filtrados: solo los que tienen al menos 1 config EVALUACION
  const periodosConEvaluacion = allPeriodos.filter(p =>
    (p.encuestaConfigs ?? []).some(c => c.tipo === 'EVALUACION')
  );

  // Cargar períodos y áreas
  useEffect(() => {
    api.getPeriodos().then(data => {
      setAllPeriodos(data);
      // Pre-seleccionar el vigente que tenga evaluaciones
      const vigente = data.find(p => p.vigente && (p.encuestaConfigs ?? []).some(c => c.tipo === 'EVALUACION'));
      const primerValido = vigente ?? data.find(p => (p.encuestaConfigs ?? []).some(c => c.tipo === 'EVALUACION'));
      if (primerValido) setPeriodoSel(primerValido.id);
    });
    api.getAreasActivas().then(setAreas).catch(console.error);
  }, []);

  // Cargar configs de tipo EVALUACION cuando cambia período
  useEffect(() => {
    if (!periodoSel) return;
    const periodo = allPeriodos.find(p => p.id === periodoSel);
    const configsEval = (periodo?.encuestaConfigs ?? []).filter(c => c.tipo === 'EVALUACION');
    setConfigs(configsEval);
    // Auto-seleccionar la primera evaluación disponible
    setConfigSel(configsEval[0]?.id ?? '');
  }, [periodoSel, allPeriodos]);

  // Cargar reporte
  const cargarReporte = useCallback(async () => {
    if (!periodoSel || !configSel) {
      setReporteEvaluacion(null);
      return;
    }
    setLoading(true);
    try {
      const data = await api.getReporteEvaluacion(periodoSel, { encuesta_config_id: configSel, area_id: areaSel || undefined });
      setReporteEvaluacion(data);
    } catch (e) { console.error(e); setReporteEvaluacion(null); }
    finally { setLoading(false); }
  }, [periodoSel, configSel, areaSel]);

  useEffect(() => { cargarReporte(); }, [cargarReporte]);

  // KPIs locales de evaluación (V/F)
  const totalParticipantes = reporteEvaluacion?.sesiones.length ?? 0;
  const promedioAcierto = totalParticipantes > 0
    ? Math.round(reporteEvaluacion!.sesiones.reduce((sum, s) => sum + s.porcentajeAcierto, 0) / totalParticipantes)
    : 0;
  
  // Tasa de aprobación (Trabajadores con acierto >= 70%)
  const aprobados = reporteEvaluacion?.sesiones.filter(s => s.porcentajeAcierto >= 70).length ?? 0;
  const tasaAprobacion = totalParticipantes > 0 ? Math.round((aprobados / totalParticipantes) * 100) : 0;

  // Obtener escala configurada dinámicamente desde el config seleccionado
  const activeConfig = configs.find(c => c.id === configSel);
  const parsedEscala = (() => {
    if (activeConfig?.escalaLabels) {
      try {
        return JSON.parse(activeConfig.escalaLabels);
      } catch {}
    }
    return ['Mala', 'Buena', 'Muy buena'];
  })();

  // Calcular métricas específicas de Likert
  let totalVotosLikert = 0;
  let votosFavorablesLikert = 0; // Buena + Muy buena
  let votosMuyBuenaLikert = 0; // Muy buena

  if (reporteEvaluacion) {
    reporteEvaluacion.sesiones.forEach(s => {
      (s.respuestas ?? []).forEach(r => {
        if (r.pregunta.tipoPregunta === 'LIKERT_3') {
          const valNum = r.valorNumerico;
          const resp = (r.respuestaDada ?? '').toString().trim().toLowerCase();
          const label0 = parsedEscala[0]?.toLowerCase();
          const label1 = parsedEscala[1]?.toLowerCase();

          totalVotosLikert += 1;
          if (valNum === 1 || resp === 'nunca' || resp === '1' || resp === 'malo' || resp === 'mala' || resp === label0) {
            // mala
          } else if (valNum === 2 || resp === 'a veces' || resp === '2' || resp === 'regular' || resp === 'bueno' || resp === 'buena' || resp === label1) {
            votosFavorablesLikert += 1;
          } else {
            votosFavorablesLikert += 1;
            votosMuyBuenaLikert += 1;
          }
        }
      });
    });
  }

  const promedioFavorabilidad = totalVotosLikert > 0
    ? Math.round((votosFavorablesLikert / totalVotosLikert) * 100)
    : 0;

  const tasaExcelenteLikert = totalVotosLikert > 0
    ? Math.round((votosMuyBuenaLikert / totalVotosLikert) * 100)
    : 0;

  return (
    <div>
      {/* Encabezado */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-md">
            <ClipboardList size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Análisis de Evaluaciones</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Resultados de evaluaciones de inocuidad por trabajador y área.</p>
          </div>
        </div>
      </div>

      {/* KPIs Dinámicos (Power BI Style) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard 
          label={activeTab === 'preguntas_likert' ? "Total Votos Likert" : "Total Evaluados"} 
          value={activeTab === 'preguntas_likert' ? totalVotosLikert : totalParticipantes} 
          sub={activeTab === 'preguntas_likert' ? "Respuestas cualitativas" : "Trabajadores evaluados"} 
          color="text-blue-600" 
          icon={<Users size={20} className="text-blue-500" />}
        />
        <KpiCard 
          label={activeTab === 'preguntas_likert' ? "Promedio Favorabilidad" : "Promedio Acierto"} 
          value={activeTab === 'preguntas_likert' ? `${promedioFavorabilidad}%` : `${promedioAcierto}%`} 
          sub={activeTab === 'preguntas_likert' ? "Respuestas favorables" : "Acierto general global"} 
          color={
            (activeTab === 'preguntas_likert' ? promedioFavorabilidad : promedioAcierto) >= 75 ? 'text-emerald-600' :
            (activeTab === 'preguntas_likert' ? promedioFavorabilidad : promedioAcierto) >= 50 ? 'text-amber-600' : 'text-rose-600'
          } 
          icon={
            <Award 
              size={20} 
              className={
                (activeTab === 'preguntas_likert' ? promedioFavorabilidad : promedioAcierto) >= 75 ? 'text-emerald-500' :
                (activeTab === 'preguntas_likert' ? promedioFavorabilidad : promedioAcierto) >= 50 ? 'text-amber-500' : 'text-rose-500'
              } 
            />
          }
        />
        <KpiCard 
          label={activeTab === 'preguntas_likert' ? "Nivel Excelente" : "Tasa Aprobación"} 
          value={activeTab === 'preguntas_likert' ? `${tasaExcelenteLikert}%` : `${tasaAprobacion}%`} 
          sub={activeTab === 'preguntas_likert' ? `Votos ${parsedEscala[2]}` : "Calificación ≥ 70%"} 
          color={
            (activeTab === 'preguntas_likert' ? tasaExcelenteLikert : tasaAprobacion) >= 75 ? 'text-emerald-600' :
            (activeTab === 'preguntas_likert' ? tasaExcelenteLikert : tasaAprobacion) >= 50 ? 'text-amber-600' : 'text-rose-600'
          } 
          icon={
            <CheckCircle 
              size={20} 
              className={
                (activeTab === 'preguntas_likert' ? tasaExcelenteLikert : tasaAprobacion) >= 75 ? 'text-emerald-500' :
                (activeTab === 'preguntas_likert' ? tasaExcelenteLikert : tasaAprobacion) >= 50 ? 'text-amber-500' : 'text-rose-500'
              } 
            />
          }
        />
        <KpiCard 
          label="Áreas Evaluadas" 
          value={reporteEvaluacion?.estadisticasPorArea.length ?? 0} 
          sub="Departamentos participantes" 
          color="text-gray-800" 
          icon={<MapPin size={20} className="text-gray-500" />}
        />
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-2xl border border-blue-100/60 shadow-sm p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[160px]">
            <label className="text-xs font-semibold text-gray-600 mb-1 block uppercase tracking-wide">Período</label>
            <select className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300/40"
              value={periodoSel} onChange={e => setPeriodoSel(e.target.value)}>
              {periodosConEvaluacion.map(p => <option key={p.id} value={p.id}>{p.nombre} {p.vigente ? '🟢' : ''}</option>)}
            </select>
          </div>
          <div className="flex-1 min-w-[160px]">
            <label className="text-xs font-semibold text-gray-600 mb-1 block uppercase tracking-wide">Evaluación</label>
            <select className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300/40"
              value={configSel} onChange={e => setConfigSel(e.target.value)}>
              {configs.length === 0 && <option value="">Sin evaluaciones disponibles</option>}
              {configs.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
          </div>
          <div className="flex-1 min-w-[160px]">
            <label className="text-xs font-semibold text-gray-600 mb-1 block uppercase tracking-wide">Filtrar por Área</label>
            <select className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300/40"
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
            <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          </div>
        ) : reporteEvaluacion && reporteEvaluacion.sesiones.length > 0 ? (
          <TablaEvaluacion 
            data={reporteEvaluacion} 
            escalaLabels={parsedEscala} 
            activeTab={activeTab} 
            setActiveTab={setActiveTab} 
          />
        ) : (
          <div className="text-center py-16 text-muted-foreground">
            <p className="text-4xl mb-3">📋</p>
            <p className="font-semibold">Sin datos de evaluaciones</p>
            <p className="text-sm mt-1">Selecciona un período y evaluación con respuestas registradas.</p>
          </div>
        )}
      </div>
    </div>
  );
}
