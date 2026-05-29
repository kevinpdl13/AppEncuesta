import { useState } from 'react';
import { ShieldCheck, ThumbsUp, Award, AlertTriangle } from 'lucide-react';
import { KpiCard } from '../../components/ui/KpiCard';
import { TabSwitcher } from '../../components/ui/TabSwitcher';
import { ReportFilters } from '../../components/ui/ReportFilters';
import { Spinner } from '../../components/ui/Spinner';
import { EmptyState } from '../../components/ui/EmptyState';

// Hooks
import { useReporteFilters } from '../../hooks/useReporteFilters';
import { useReporteAnonimo } from '../../hooks/useReporteAnonimo';
import { useEscalaLabels } from '../../hooks/useEscalaLabels';

// Sub-components
import { GraficoDistribucionLikert } from './reportes-v2/GraficoDistribucionLikert';
import { GraficoPromedioSubgrupos } from './reportes-v2/GraficoPromedioSubgrupos';
import { TablaAnonima } from './reportes-v2/TablaAnonima';
import { TablaGraficaPorPregunta } from './reportes-v2/TablaGraficaPorPregunta';

export function ReportesV2Page() {
  const [activeTab, setActiveTab] = useState<'general' | 'graficos_pregunta'>('general');

  // Filters hook (handles periods, configurations, area selection)
  const {
    periodosConEncuesta,
    periodoSel,
    setPeriodoSel,
    configs,
    configSel,
    setConfigSel,
    areas,
    areaSel,
    setAreaSel,
    activeConfig,
  } = useReporteFilters({ tipoEncuesta: 'ANONIMA' });

  // Anonymous Report data-fetching hook
  const { data: reporteAnonimo, loading } = useReporteAnonimo(periodoSel, configSel, areaSel);

  // Escala labels parser
  const parsedEscala = useEscalaLabels(activeConfig);

  // Dynamic calculations for Power BI-style cards
  const { totalMala, totalBuena, totalMuyBuena, granTotal } = (() => {
    if (!reporteAnonimo || reporteAnonimo.filas.length === 0) {
      return { totalMala: 0, totalBuena: 0, totalMuyBuena: 0, granTotal: 0 };
    }
    const tMala = reporteAnonimo.filas.reduce((sum, f) => sum + f.mala, 0);
    const tBuena = reporteAnonimo.filas.reduce((sum, f) => sum + f.buena, 0);
    const tMuyBuena = reporteAnonimo.filas.reduce((sum, f) => sum + f.muyBuena, 0);
    const gTotal = tMala + tBuena + tMuyBuena;
    return {
      totalMala: tMala,
      totalBuena: tBuena,
      totalMuyBuena: tMuyBuena,
      granTotal: gTotal
    };
  })();

  const promedioGeneral = granTotal > 0
    ? ((totalMala * 1 + totalBuena * 2 + totalMuyBuena * 3) / granTotal)
    : 0;

  const pctFavorable = granTotal > 0
    ? ((totalBuena + totalMuyBuena) / granTotal) * 100
    : 0;

  const pctCritico = granTotal > 0
    ? (totalMala / granTotal) * 100
    : 0;

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
      <ReportFilters
        periodos={periodosConEncuesta}
        periodoSel={periodoSel}
        onPeriodoChange={setPeriodoSel}
        configs={configs}
        configSel={configSel}
        onConfigChange={setConfigSel}
        areas={areas}
        areaSel={areaSel}
        onAreaChange={setAreaSel}
        emptyConfigLabel="Sin encuestas anónimas disponibles"
      />

      {/* Contenido */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        {loading ? (
          <div className="flex justify-center py-16">
            <Spinner size="w-10 h-10" color="border-t-purple-600" />
          </div>
        ) : reporteAnonimo && reporteAnonimo.filas.length > 0 ? (
          <>
            {/* Selector de Pestañas (Power BI Style) */}
            <div className="mb-6">
              <TabSwitcher
                activeTab={activeTab}
                onTabChange={setActiveTab}
                tabs={[
                  { key: 'general', label: '📊 Distribución General' },
                  { key: 'graficos_pregunta', label: '📈 Frecuencia por Preguntas' }
                ]}
                accentColor="purple"
              />
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
          <EmptyState
            title="Sin datos de encuestas anónimas"
            description="Selecciona un período y encuesta anónima con respuestas registradas."
            icon="🔒"
          />
        )}
      </div>
    </div>
  );
}
