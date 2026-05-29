// ============================================================
// GraficoDistribucionLikert — gráfico de distribución global
// de respuestas Likert con donut y barra apilada.
// Extraído de ReportesV2Page.tsx (líneas 38-212).
// ============================================================

import { DonutChart } from '../../../components/charts/DonutChart';
import { StackedBar } from '../../../components/charts/StackedBar';
import { computeLikertDistribution } from '../../../lib/calculations';
import type { ReporteAnonimoResponse } from '../../../types';

type Props = {
  data: ReporteAnonimoResponse;
  escalaLabels?: string[];
};

export function GraficoDistribucionLikert({
  data,
  escalaLabels = ['Nunca', 'A veces', 'Siempre'],
}: Props) {
  const dist = computeLikertDistribution(data.filas);

  if (dist.granTotal === 0) {
    return (
      <div className="bg-gray-50 border border-dashed border-gray-200 rounded-2xl p-6 text-center text-muted-foreground text-xs mb-6">
        Realiza filtros o selecciona una encuesta con respuestas para ver la gráfica de distribución.
      </div>
    );
  }

  const donutSegments = [
    { percentage: dist.pctMuyBuena, color: '#10b981' },
    { percentage: dist.pctBuena, color: '#f59e0b' },
    { percentage: dist.pctMala, color: '#ef4444' },
  ];

  const barSegments = [
    { value: dist.totalMala, color: 'bg-gradient-to-r from-red-400 to-red-500', label: escalaLabels[0] },
    { value: dist.totalBuena, color: 'bg-gradient-to-r from-amber-400 to-amber-500', label: escalaLabels[1] },
    { value: dist.totalMuyBuena, color: 'bg-gradient-to-r from-emerald-400 to-emerald-500', label: escalaLabels[2] },
  ];

  const breakdownItems = [
    { label: escalaLabels[0], total: dist.totalMala, pct: dist.pctMala, dotColor: 'bg-red-500', textColor: 'text-red-600', bgColor: 'bg-red-50/20', borderColor: 'border-red-100/30', badgeBg: 'bg-red-50', badgeText: 'text-red-700', badgeBorder: 'border-red-100' },
    { label: escalaLabels[1], total: dist.totalBuena, pct: dist.pctBuena, dotColor: 'bg-amber-500', textColor: 'text-amber-600', bgColor: 'bg-amber-50/20', borderColor: 'border-amber-100/30', badgeBg: 'bg-amber-50', badgeText: 'text-amber-700', badgeBorder: 'border-amber-100' },
    { label: escalaLabels[2], total: dist.totalMuyBuena, pct: dist.pctMuyBuena, dotColor: 'bg-emerald-500', textColor: 'text-emerald-600', bgColor: 'bg-emerald-50/20', borderColor: 'border-emerald-100/30', badgeBg: 'bg-emerald-50', badgeText: 'text-emerald-700', badgeBorder: 'border-emerald-100' },
  ];

  return (
    <div className="bg-gradient-to-br from-white to-gray-50/30 rounded-2xl border border-gray-100 shadow-sm p-5 mb-6 animate-in slide-in-from-top-4 duration-350">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-extrabold text-gray-800 text-sm sm:text-base">Distribución Global de Respuestas</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Análisis de inocuidad alimentaria mediante representaciones de barra y torta.</p>
        </div>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200/30">
          Total Votos: {dist.granTotal}
        </span>
      </div>

      <div className="flex flex-col md:flex-row gap-6 items-center">
        {/* Donut Chart */}
        <div className="flex flex-col items-center justify-center p-2 shrink-0">
          <DonutChart
            segments={donutSegments}
            centerLabel={dist.granTotal}
            centerSub="Votos"
          />
        </div>

        {/* Stacked Bar + Breakdown */}
        <div className="flex-1 w-full flex flex-col justify-center">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Distribución Lineal</p>
          <StackedBar segments={barSegments} />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5">
            {breakdownItems.map((item) => (
              <div key={item.label} className={`flex items-center gap-3 p-3 ${item.bgColor} border ${item.borderColor} rounded-xl`}>
                <div className={`w-3 h-3 rounded-full ${item.dotColor} shrink-0`} />
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{item.label}</p>
                  <p className={`text-base font-black ${item.textColor} mt-0.5`}>
                    {item.total} <span className="text-[10px] font-semibold text-gray-500">votos</span>
                  </p>
                </div>
                <span className={`text-xs font-extrabold ${item.badgeText} ${item.badgeBg} px-2 py-0.5 rounded-md border ${item.badgeBorder}`}>
                  {item.pct}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
