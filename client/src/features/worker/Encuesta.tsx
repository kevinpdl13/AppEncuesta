import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { useAppStore } from '../../store/useAppStore';
import { Button } from '../../components/ui/Button';
import { CheckCircle2, XCircle, ArrowLeft, ArrowRight, Check, Lock } from 'lucide-react';
import type { Pregunta, EncuestaConfig, Periodo, NuevaRespuestaDto, Area } from '../../types';

// ─── Tipos locales ────────────────────────────────────────────
type EstadoFeedback = 'correcto' | 'incorrecto' | 'respondido' | null;
type Vista = 'seleccionArea' | 'seleccionPeriodo' | 'seleccion' | 'encuesta' | 'guardando' | 'completado' | 'error';

// ─── Helper: parsear escala Likert ───────────────────────────
function parseEscala(escalaLabels: string | null): string[] {
  try {
    return escalaLabels ? JSON.parse(escalaLabels) : ['Nunca', 'A veces', 'Siempre'];
  } catch {
    return ['Nunca', 'A veces', 'Siempre'];
  }
}

// Helper: Formatear fecha legible
function formatDateHuman(iso: string) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('es-EC', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// ─── Sub-componente: Selección de Área para Anónimo ─────────────────
function SeleccionArea({
  onSeleccionar,
}: {
  onSeleccionar: (area: Area) => void;
}) {
  const navigate = useNavigate();
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const cargarAreas = async () => {
      try {
        setLoading(true);
        const data = await api.getAreasActivas();
        setAreas(data);
      } catch (err: any) {
        setError(err.message || 'Error al obtener las áreas de la empresa.');
      } finally {
        setLoading(false);
      }
    };
    cargarAreas();
  }, []);

  return (
    <div className="flex-1 flex flex-col animate-in fade-in duration-550 justify-center">
      <div className="mb-6 sm:mb-8 text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-bold border border-purple-200/30 mb-2 uppercase tracking-wide">
          🔒 Participación Anónima
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900">Selecciona tu Área de Trabajo</h2>
        <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
          Tus respuestas serán completamente anónimas y se tabularán a nivel de departamento para ayudarnos a mejorar el clima laboral.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-10 h-10 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center gap-3 max-w-md mx-auto text-center py-6">
          <span className="text-3xl">⚠️</span>
          <p className="text-xs text-danger font-semibold bg-red-50/50 border border-red-100 rounded-xl p-3 w-full">{error}</p>
        </div>
      ) : areas.length === 0 ? (
        <div className="flex flex-col items-center gap-3 max-w-md mx-auto text-center py-6 bg-purple-50/20 border border-dashed border-purple-100 rounded-2xl p-6">
          <span className="text-3xl">📭</span>
          <h3 className="font-extrabold text-sm text-gray-900">No hay áreas configuradas</h3>
          <p className="text-xs text-muted-foreground">
            No se han registrado áreas de la empresa aún. Comunícate con el administrador.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 max-h-[300px] overflow-y-auto pr-1 hide-scrollbar">
          {areas.map((a) => (
            <button
              key={a.id}
              onClick={() => onSeleccionar(a)}
              className="w-full text-left rounded-2xl p-5 border border-purple-100 bg-white hover:border-purple-400 hover:shadow-[0_12px_24px_rgba(147,51,234,0.05)] hover:-translate-y-0.5 cursor-pointer transition-all duration-300 flex items-center gap-3.5 relative overflow-hidden group min-h-[75px]"
            >
              <div className="absolute top-0 right-0 w-12 h-12 bg-purple-50/30 rounded-bl-[40px] pointer-events-none group-hover:scale-110 transition-transform duration-300" />
              <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center text-base shrink-0 shadow-sm transition-colors group-hover:bg-purple-100">
                🏢
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm text-gray-900 transition-colors group-hover:text-purple-600 truncate text-left">
                  {a.nombre}
                </p>
                {a.descripcion && (
                  <p className="text-[10px] text-muted-foreground mt-0.5 truncate leading-relaxed text-left">
                    {a.descripcion}
                  </p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      <button
        onClick={() => navigate('/')}
        className="flex items-center gap-1.5 font-bold text-xs text-muted-foreground hover:text-primary transition underline-offset-4 hover:underline mx-auto mt-6 cursor-pointer bg-transparent border-0 z-10 animate-in fade-in duration-500"
      >
        <ArrowLeft size={14} /> Regresar al Inicio
      </button>
    </div>
  );
}

// ─── Sub-componente: Selección de Período ─────────────────────────
function SeleccionPeriodo({
  periodos,
  onSeleccionar,
  esEvaluacion,
}: {
  periodos: Periodo[];
  onSeleccionar: (periodo: Periodo) => void;
  esEvaluacion: boolean;
}) {
  const navigate = useNavigate();

  // Filtrar períodos que tengan al menos una configuración del tipo correspondiente
  const periodosConConfigs = periodos.filter((p) => {
    const configsFiltradas = (p.encuestaConfigs ?? []).filter(c =>
      esEvaluacion ? c.tipo === 'EVALUACION' : c.tipo === 'ANONIMA'
    );
    return configsFiltradas.length > 0;
  });

  return (
    <div className="flex-1 flex flex-col animate-in fade-in duration-550 justify-center">
      <div className="mb-6 sm:mb-8 text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200/30 mb-2 uppercase tracking-wide">
          📅 Ciclos de Encuesta
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900">Selecciona el Período Activo</h2>
        <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
          Elige el ciclo de evaluación en el que deseas participar para ayudarnos a medir y mejorar el clima laboral.
        </p>
      </div>

      {periodosConConfigs.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-8 px-6 gap-4 bg-amber-50/40 border border-dashed border-amber-200/60 rounded-2xl max-w-md mx-auto w-full animate-in zoom-in duration-300">
          <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center text-amber-500 shadow-sm border border-amber-100 animate-bounce">
            <span className="text-2xl">⚠️</span>
          </div>
          <div>
            <h3 className="font-extrabold text-base text-gray-900">
              {esEvaluacion ? 'Evaluación no habilitada' : 'Encuesta no habilitada'}
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed mt-1">
              {esEvaluacion
                ? 'No se encuentran períodos de evaluación vigentes o cuestionarios creados para este flujo en este momento.'
                : 'No se encuentran encuestas anónimas vigentes o cuestionarios creados para este flujo en este momento.'}
            </p>
            <p className="text-[11px] text-amber-700/80 font-medium mt-2 bg-amber-50 border border-amber-100/30 rounded-lg py-1 px-3">
              Por favor, comunícate con el área de Talento Humano o el administrador para verificar las fechas.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[350px] overflow-y-auto pr-1 hide-scrollbar">
          {periodosConConfigs.map((p) => {
            const now = new Date();
            const fechaIn = new Date(p.fechaInicio);
            const fechaFi = p.fechaFin ? new Date(p.fechaFin) : null;
            const esVigente = now >= fechaIn && (!fechaFi || now <= fechaFi);
            const esFuturo = now < fechaIn;
            const esPasado = fechaFi ? now > fechaFi : false;

            // Buscar la config de esta encuesta según flujo
            const configsFiltradas = (p.encuestaConfigs ?? []).filter(c =>
              esEvaluacion ? c.tipo === 'EVALUACION' : c.tipo === 'ANONIMA'
            );

            // Si el período no tiene encuesta configurada de este flujo, no mostrarlo en la lista
            if (configsFiltradas.length === 0) return null;

            const config = configsFiltradas[0];
            // Sanitizar el nombre para remover referencias a "Nominal"
            const nombreMostrar = (config?.nombre ?? p.nombre)
              .replace(/Encuesta Nominal/gi, 'Evaluación')
              .replace(/Nominal/gi, 'Evaluación');

            let badgeLabel = 'Vigente 🟢';
            let badgeCls = 'bg-emerald-50 text-emerald-700 border-emerald-200/50';

            if (esFuturo) {
              badgeLabel = 'Próximo ⏳';
              badgeCls = 'bg-blue-50 text-blue-700 border-blue-200/50';
            } else if (esPasado) {
              badgeLabel = 'Finalizado 🛑';
              badgeCls = 'bg-amber-50 text-amber-700 border-amber-200/50';
            }

            return (
              <button
                key={p.id}
                onClick={() => esVigente && onSeleccionar(p)}
                disabled={!esVigente}
                className={`w-full text-left rounded-2xl p-5 border transition-all duration-300 group relative overflow-hidden flex flex-col justify-between min-h-[145px]
                  ${esVigente 
                    ? 'border-gray-100 bg-white hover:border-success hover:shadow-[0_12px_24px_rgba(16,185,129,0.06)] hover:-translate-y-0.5 cursor-pointer' 
                    : 'border-gray-150 bg-gray-50/50 opacity-75 cursor-not-allowed'
                  }
                `}
              >
                <div className={`absolute top-0 right-0 w-20 h-20 bg-success/5 rounded-bl-[80px] pointer-events-none group-hover:scale-110 transition-transform duration-300
                  ${esVigente ? 'bg-success/5' : 'bg-gray-200/5'}
                `} />
                <div className="flex items-start gap-3.5 z-10 w-full">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 shadow-sm transition-colors
                    ${esVigente 
                      ? 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100' 
                      : 'bg-gray-100 text-gray-400'
                    }
                  `}>
                    📅
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-bold text-base text-gray-900 transition-colors
                      ${esVigente ? 'group-hover:text-success' : 'text-gray-500'}
                    `}>
                      {nombreMostrar}
                    </p>
                    {p.descripcion && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">
                        {p.descripcion}
                      </p>
                    )}
                    {/* Fechas de vigencia */}
                    <div className="flex flex-col gap-0.5 mt-2 text-[10px] font-semibold text-gray-500">
                      <span className="flex items-center gap-1">
                        🟢 Habilitado desde: {formatDateHuman(p.fechaInicio)}
                      </span>
                      {p.fechaFin && (
                        <span className="flex items-center gap-1">
                          🛑 Habilitado hasta: {formatDateHuman(p.fechaFin)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 w-full z-10">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${badgeCls}`}>
                    {badgeLabel}
                  </span>
                  {esVigente ? (
                    <span className="text-success text-xs shrink-0 font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      Ingresar <ArrowRight size={12} />
                    </span>
                  ) : (
                    <span className="text-gray-400 text-xs shrink-0 font-bold flex items-center gap-1">
                      No Disponible <Lock size={12} />
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
      <button
        onClick={() => navigate('/')}
        className="flex items-center gap-1.5 font-bold text-xs text-muted-foreground hover:text-primary transition underline-offset-4 hover:underline mx-auto mt-6 cursor-pointer bg-transparent border-0 z-10 animate-in fade-in duration-500"
      >
        <ArrowLeft size={14} /> Regresar al Inicio
      </button>
    </div>
  );
}

// ─── Sub-componente: Selección de encuesta (anónima o nominal) ─
function SeleccionEncuesta({
  configs,
  nombreTrabajador,
  completadas,
  onSeleccionar,
}: {
  configs: EncuestaConfig[];
  nombreTrabajador: string;
  completadas: Record<string, boolean>;
  onSeleccionar: (config: EncuestaConfig) => void;
}) {
  return (
    <div className="flex-1 flex flex-col animate-in fade-in duration-550 justify-center">
      <div className="mb-6 sm:mb-8 text-center max-w-2xl mx-auto">
        {nombreTrabajador ? (
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200/30 mb-2">
            <span>👋 ¡Hola, {nombreTrabajador}!</span>
          </div>
        ) : (
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-purple-50 text-purple-700 text-xs font-bold border border-purple-200/30 mb-2">
            <span>🔒 Participación Anónima</span>
          </div>
        )}
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900">Elige tu Evaluación</h2>
        <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
          Selecciona la evaluación que deseas responder a continuación. Tu participación es sumamente valiosa para nosotros.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        {configs.map((config) => {
          const esAnonima = config.tipo === 'ANONIMA';
          const yaRespondio = completadas[config.id] === true;
          return (
            <button
              key={config.id}
              onClick={() => !yaRespondio && onSeleccionar(config)}
              disabled={yaRespondio}
              className={`w-full text-left rounded-2xl p-5 border transition-all duration-300 group bg-white relative overflow-hidden flex flex-col justify-between min-h-[150px]
                ${yaRespondio
                  ? 'border-emerald-100 bg-emerald-50/10 cursor-not-allowed opacity-85 shadow-inner'
                  : esAnonima 
                  ? 'border-purple-100 hover:border-purple-400 hover:shadow-[0_12px_24px_rgba(147,51,234,0.05)] hover:-translate-y-0.5 cursor-pointer' 
                  : 'border-blue-100 hover:border-blue-400 hover:shadow-[0_12px_24px_rgba(59,130,246,0.05)] hover:-translate-y-0.5 cursor-pointer'
                }
              `}
            >
              <div className={`absolute top-0 right-0 w-20 h-20 rounded-bl-[80px] pointer-events-none group-hover:scale-110 transition-transform duration-300
                ${yaRespondio ? 'bg-emerald-50/30' : esAnonima ? 'bg-purple-50/30' : 'bg-blue-50/30'}
              `} />
              <div className="flex items-start gap-3.5 z-10">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 shadow-sm transition-colors
                  ${yaRespondio
                    ? 'bg-emerald-50 text-emerald-600'
                    : esAnonima 
                    ? 'bg-purple-50 text-purple-600 group-hover:bg-purple-100' 
                    : 'bg-blue-50 text-blue-600 group-hover:bg-blue-100'
                  }
                `}>
                  {yaRespondio ? '✅' : esAnonima ? '🔒' : '📋'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-bold text-base text-gray-900 transition-colors
                    ${yaRespondio ? 'text-emerald-800' : esAnonima ? 'group-hover:text-purple-600' : 'group-hover:text-blue-600'}
                  `}>
                    {config.nombre}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed line-clamp-2">
                    {yaRespondio
                      ? '¡Excelente! Ya has enviado tus respuestas y completado tu participación de este ciclo.'
                      : esAnonima
                      ? 'Esta encuesta es totalmente anónima. Tus respuestas serán tratadas confidencialmente.'
                      : 'Esta evaluación registra tu participación. Responde las preguntas para acumular puntos y reclamar premios.'}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-50 w-full z-10">
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider border
                  ${yaRespondio ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : esAnonima ? 'bg-purple-50 text-purple-700 border-purple-100' : 'bg-blue-50 text-blue-700 border-blue-100'}
                `}>
                  {yaRespondio ? 'Completado ✓' : esAnonima ? 'Valoración' : 'V/F'}
                </span>
                {yaRespondio ? (
                  <span className="text-xs font-bold shrink-0 text-emerald-600 flex items-center gap-1">
                    Respondido <Check size={12} />
                  </span>
                ) : (
                  <span className={`text-xs font-bold shrink-0 flex items-center gap-1 group-hover:translate-x-1 transition-transform
                    ${esAnonima ? 'text-purple-600' : 'text-blue-600'}
                  `}>
                    Comenzar <ArrowRight size={12} />
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Sub-componente: Botones escala Likert 1-3 ───────────────
function BotonesLikert({
  escala,
  onResponder,
  deshabilitado,
  valorSeleccionado,
}: {
  escala: string[];
  onResponder: (valor: number) => void;
  deshabilitado: boolean;
  valorSeleccionado: number | null;
}) {
  const colores = [
    { 
      base: 'bg-white border-red-100 text-red-700 hover:border-red-400 hover:bg-red-50/10 hover:shadow-lg hover:shadow-red-500/5', 
      activo: 'bg-gradient-to-br from-red-500 to-red-600 border-red-600 text-white shadow-md shadow-red-500/20 scale-102', 
      emoji: '😟', 
      colorPill: 'bg-red-50 text-red-700 border-red-100' 
    },
    { 
      base: 'bg-white border-amber-100 text-amber-700 hover:border-amber-400 hover:bg-amber-50/10 hover:shadow-lg hover:shadow-amber-500/5', 
      activo: 'bg-gradient-to-br from-amber-500 to-amber-600 border-amber-600 text-white shadow-md shadow-amber-500/20 scale-102', 
      emoji: '😐', 
      colorPill: 'bg-amber-50 text-amber-700 border-amber-100' 
    },
    { 
      base: 'bg-white border-emerald-100 text-emerald-700 hover:border-emerald-400 hover:bg-emerald-50/10 hover:shadow-lg hover:shadow-emerald-500/5', 
      activo: 'bg-gradient-to-br from-emerald-500 to-emerald-600 border-emerald-600 text-white shadow-md shadow-emerald-500/20 scale-102', 
      emoji: '😊', 
      colorPill: 'bg-emerald-50 text-emerald-700 border-emerald-100' 
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-3 sm:gap-5 mt-4 sm:mt-5">
      {escala.map((etiqueta, idx) => {
        const valor = idx + 1;
        const color = colores[idx] || colores[2];
        const esSeleccionado = valorSeleccionado === valor;
        return (
          <button
            key={valor}
            id={`likert-${valor}-btn`}
            onClick={() => !deshabilitado && onResponder(valor)}
            disabled={deshabilitado}
            className={`flex flex-col items-center justify-between gap-3 p-3.5 sm:p-5 rounded-2xl border-2 font-bold text-sm transition-all duration-300 relative overflow-hidden group
              ${esSeleccionado ? color.activo : color.base}
              ${deshabilitado ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:-translate-y-1 active:scale-95'}
            `}
          >
            <span className="text-3xl sm:text-4xl transition-transform duration-300 group-hover:scale-108">{color.emoji}</span>
            <div className="flex flex-col items-center gap-0.5 w-full">
              <span className={`text-[8px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider border
                ${esSeleccionado ? 'bg-white/20 text-white border-white/20' : color.colorPill}
              `}>
                Valor {valor}
              </span>
              <span className="text-center leading-tight text-[10px] xs:text-xs sm:text-sm font-extrabold max-w-full break-words">{etiqueta}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ─── Componente principal: Encuesta ──────────────────────────
export function Encuesta() {
  const navigate = useNavigate();
  const {
    trabajadorActual,
    areaAnonimaSeleccionada,
    periodoActual,
    encuestaConfigSeleccionada,
    setPeriodoActual,
    setEncuestaConfig,
    setAreaAnonimaSeleccionada,
    setPuntajeSesion,
    setSesionId,
  } = useAppStore();

  const [periodosActivos, setPeriodosActivos] = useState<Periodo[]>([]);
  const [loadingPeriodos, setLoadingPeriodos] = useState(false);
  const [preguntas, setPreguntas] = useState<Pregunta[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [respuestasAcumuladas, setRespuestasAcumuladas] = useState<NuevaRespuestaDto[]>([]);
  const [feedback, setFeedback] = useState<EstadoFeedback>(null);
  const [valorLikertSeleccionado, setValorLikertSeleccionado] = useState<number | null>(null);
  const [vista, setVista] = useState<Vista>('seleccionPeriodo');
  const [error, setError] = useState('');
  
  // Estado para registrar cuáles evaluaciones ya completó el trabajador
  const [evaluacionesCompletadas, setEvaluacionesCompletadas] = useState<Record<string, boolean>>({});

  const esAnonima = encuestaConfigSeleccionada?.tipo === 'ANONIMA';
  const escala = parseEscala(encuestaConfigSeleccionada?.escalaLabels ?? null);
  const totalPuntosPosibles = preguntas.reduce((sum, p) => sum + (p.puntos || 0), 0);
  const esPuntajePerfecto = score === totalPuntosPosibles;

  // Filtro de configs en el período actual según flujo (anónimo o de evaluación)
  const esEvaluacion = trabajadorActual !== null;
  const configsFiltradas = (periodoActual?.encuestaConfigs ?? []).filter(c => 
    esEvaluacion ? c.tipo === 'EVALUACION' : c.tipo === 'ANONIMA'
  );

  // 1. Verificar qué evaluaciones están completadas
  useEffect(() => {
    if (periodoActual && configsFiltradas.length > 0 && esEvaluacion && trabajadorActual) {
      const chequearCompletadas = async () => {
        const mapCompletadas: Record<string, boolean> = {};
        for (const config of configsFiltradas) {
          try {
            const { yaRespondio } = await api.verificarSesion(
              trabajadorActual.id, config.id, periodoActual.id
            );
            mapCompletadas[config.id] = yaRespondio;
          } catch (e) {
            console.error('Error al chequear completada:', e);
          }
        }
        setEvaluacionesCompletadas(mapCompletadas);
      };
      chequearCompletadas();
    }
  }, [periodoActual, esEvaluacion, trabajadorActual, vista]);

  // Cuando se selecciona una config, cargar preguntas
  const cargarPreguntas = useCallback(async (config: EncuestaConfig) => {
    try {
      setVista('encuesta');
      setError('');

      // Para EVALUACION verificar si ya respondió en este período
      if (config.tipo === 'EVALUACION' && trabajadorActual && periodoActual) {
        const { yaRespondio } = await api.verificarSesion(
          trabajadorActual.id, config.id, periodoActual.id
        );
        if (yaRespondio) {
          setError(`Ya participaste en "${config.nombre}" en este período.`);
          setVista('error');
          return;
        }
      }

      const data = await api.getPreguntasPorConfig(config.id);
      if (data.length === 0) {
        setError('Esta evaluación no tiene preguntas activas aún. Contacta al administrador.');
        setVista('error');
        return;
      }
      setPreguntas(data);
      setCurrentIndex(0);
      setScore(0);
      setRespuestasAcumuladas([]);
    } catch (err: any) {
      setError(err.message);
      setVista('error');
    }
  }, [trabajadorActual, periodoActual, setPuntajeSesion, setSesionId]);

  // 1. Cargar períodos activos si no hay uno seleccionado o requiere elegir área
  useEffect(() => {
    if (!esEvaluacion && !areaAnonimaSeleccionada) {
      setVista('seleccionArea');
      return;
    }

    if (!periodoActual) {
      const cargarPeriodos = async () => {
        try {
          setLoadingPeriodos(true);
          setError('');
          const data = await api.getPeriodosActivos();
          setPeriodosActivos(data);

          // Auto-selección completa si hay exactamente 1 periodo con 1 encuesta activa del tipo actual y está vigente
          const periodosValidos = data.filter(p => {
            const now = new Date();
            const fechaIn = new Date(p.fechaInicio);
            const fechaFi = p.fechaFin ? new Date(p.fechaFin) : null;
            const esVigente = now >= fechaIn && (!fechaFi || now <= fechaFi);
            return esVigente && (p.encuestaConfigs ?? []).some(c => esEvaluacion ? c.tipo === 'EVALUACION' : c.tipo === 'ANONIMA');
          });

          if (periodosValidos.length === 1) {
            const p = periodosValidos[0];
            const configs = (p.encuestaConfigs ?? []).filter(c =>
              esEvaluacion ? c.tipo === 'EVALUACION' : c.tipo === 'ANONIMA'
            );
            if (configs.length === 1) {
              // Si es evaluación, chequear primero si ya la respondió
              if (esEvaluacion && trabajadorActual) {
                const { yaRespondio } = await api.verificarSesion(
                  trabajadorActual.id, configs[0].id, p.id
                );
                if (yaRespondio) {
                  setPeriodoActual(p);
                  setEncuestaConfig(configs[0]);
                  setError(`Ya participaste en "${configs[0].nombre}" en este período.`);
                  setVista('error');
                  return;
                }
              }

              setPeriodoActual(p);
              setEncuestaConfig(configs[0]);
              await cargarPreguntas(configs[0]);
              return;
            }
          }

          setVista('seleccionPeriodo');
        } catch (err: any) {
          setError(err.message || 'Error al obtener los períodos activos.');
          setVista('error');
        } finally {
          setLoadingPeriodos(false);
        }
      };
      cargarPeriodos();
    } else if (!encuestaConfigSeleccionada) {
      setVista('seleccion');
    }
  }, [periodoActual, encuestaConfigSeleccionada, esEvaluacion, areaAnonimaSeleccionada, cargarPreguntas, setPeriodoActual, setEncuestaConfig, trabajadorActual]);

  // Autocargar si ya viene preseleccionada (ej: desde la Landing Page)
  useEffect(() => {
    if (periodoActual && encuestaConfigSeleccionada && vista === 'seleccion') {
      const verificarYEntrar = async () => {
        if (esEvaluacion && trabajadorActual) {
          const { yaRespondio } = await api.verificarSesion(
            trabajadorActual.id, encuestaConfigSeleccionada.id, periodoActual.id
          );
          if (yaRespondio) {
            setError(`Ya participaste en "${encuestaConfigSeleccionada.nombre}" en este período.`);
            setVista('error');
            return;
          }
        }
        cargarPreguntas(encuestaConfigSeleccionada);
      };
      verificarYEntrar();
    }
  }, [periodoActual, encuestaConfigSeleccionada, vista, cargarPreguntas, esEvaluacion, trabajadorActual]);

  const handleSeleccionarPeriodo = (p: Periodo) => {
    const now = new Date();
    const fechaIn = new Date(p.fechaInicio);
    const fechaFi = p.fechaFin ? new Date(p.fechaFin) : null;
    const esVigente = now >= fechaIn && (!fechaFi || now <= fechaFi);
    if (!esVigente) return;

    setPeriodoActual(p);
    
    const configsDelPeriodo = (p.encuestaConfigs ?? []).filter(c => 
      esEvaluacion ? c.tipo === 'EVALUACION' : c.tipo === 'ANONIMA'
    );

    if (configsDelPeriodo.length === 0) {
      setError(`No hay evaluaciones configuradas para el período "${p.nombre}".`);
      setVista('error');
      return;
    }

    if (configsDelPeriodo.length === 1) {
      const chequearYSeleccionar = async () => {
        if (esEvaluacion && trabajadorActual) {
          const { yaRespondio } = await api.verificarSesion(
            trabajadorActual.id, configsDelPeriodo[0].id, p.id
          );
          if (yaRespondio) {
            setEncuestaConfig(configsDelPeriodo[0]);
            setError(`Ya participaste en "${configsDelPeriodo[0].nombre}" en este período.`);
            setVista('error');
            return;
          }
        }
        setEncuestaConfig(configsDelPeriodo[0]);
        cargarPreguntas(configsDelPeriodo[0]);
      };
      chequearYSeleccionar();
    } else {
      setVista('seleccion');
    }
  };

  const handleSeleccionConfig = async (config: EncuestaConfig) => {
    setEncuestaConfig(config);
    await cargarPreguntas(config);
  };

  // ─── Respuesta V/F ────────────────────────────────────────
  const handleAnswerVF = async (respuesta: boolean) => {
    if (feedback !== null) return;
    const pregunta = preguntas[currentIndex];
    const esCorrecta = respuesta === pregunta.respuesta_correcta;
    const puntos = esCorrecta ? pregunta.puntos : 0;

    setFeedback(esCorrecta ? 'correcto' : 'incorrecto');
    procesarRespuesta({ pregunta_id: pregunta.id, respuesta_dada: respuesta, valor_numerico: null, es_correcta: esCorrecta, puntos_obtenidos: puntos }, score + puntos);
  };

  // ─── Respuesta Likert ─────────────────────────────────────
  const handleAnswerLikert = async (valor: number) => {
    if (feedback !== null) return;
    const pregunta = preguntas[currentIndex];
    setValorLikertSeleccionado(valor);
    setFeedback('respondido');
    procesarRespuesta({ pregunta_id: pregunta.id, respuesta_dada: null, valor_numerico: valor, es_correcta: true, puntos_obtenidos: 0 }, score);
  };

  // ─── Lógica común post-respuesta ──────────────────────────
  const procesarRespuesta = (nuevaRespuesta: NuevaRespuestaDto, nuevoScore: number) => {
    const respuestasActualizadas = [...respuestasAcumuladas, nuevaRespuesta];

    setTimeout(async () => {
      setFeedback(null);
      setValorLikertSeleccionado(null);
      setScore(nuevoScore);
      const esUltima = currentIndex >= preguntas.length - 1;

      if (!esUltima) {
        setRespuestasAcumuladas(respuestasActualizadas);
        setCurrentIndex((prev) => prev + 1);
        return;
      }

      // Última pregunta — guardar sesión completa
      setVista('guardando');
      try {
        const sesion = await api.crearSesion({
          tipo: encuestaConfigSeleccionada!.tipo,
          trabajador_id: esAnonima ? undefined : trabajadorActual?.id,
          encuesta_config_id: encuestaConfigSeleccionada!.id,
          periodo_id: periodoActual!.id,
          area_id: esAnonima ? areaAnonimaSeleccionada?.id : undefined,
          puntaje_total: nuevoScore,
          fecha_fin: new Date().toISOString(),
          respuestas: respuestasActualizadas,
        });
        setPuntajeSesion(nuevoScore);
        setSesionId(sesion.id);
        setVista('completado');
      } catch (err: any) {
        setError('Error al guardar tu evaluación: ' + err.message);
        setVista('error');
      }
    }, esAnonima ? 600 : 1200);
  };

  // ─── Renderizado según vista ─────────────────────────────

  if (vista === 'seleccionArea') {
    return (
      <SeleccionArea
        onSeleccionar={(area) => {
          setAreaAnonimaSeleccionada(area);
          setVista('seleccionPeriodo');
        }}
      />
    );
  }

  if (vista === 'seleccionPeriodo') {
    if (loadingPeriodos) {
      return (
        <div className="flex-1 flex items-center justify-center min-h-[250px]">
          <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
        </div>
      );
    }
    if (periodosActivos.length === 0) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center text-center px-4 py-8 gap-4 max-w-md mx-auto animate-in zoom-in duration-300">
          <div className="w-14 h-14 rounded-full bg-amber-50 flex items-center justify-center text-amber-500 shadow-sm border border-amber-100 animate-bounce">
            <span className="text-2xl">⚠️</span>
          </div>
          <h2 className="text-xl font-extrabold text-gray-900 tracking-tight">
            {esEvaluacion ? 'Evaluación no habilitada' : 'Encuesta no habilitada'}
          </h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {esEvaluacion 
              ? 'No se encuentran períodos de evaluación vigentes o creados en este momento. Por favor, regresa más tarde o consulta con el administrador.'
              : 'No se encuentran períodos de encuestas vigentes o creados en este momento. Por favor, regresa más tarde o consulta con el administrador.'}
          </p>
          <Button onClick={() => navigate('/')} className="w-full h-12 rounded-xl bg-primary text-white font-bold hover:bg-primary/95 transition shadow-lg shadow-primary/25 cursor-pointer mt-2">
            Regresar al Inicio
          </Button>
        </div>
      );
    }
    return (
      <SeleccionPeriodo
        periodos={periodosActivos}
        onSeleccionar={handleSeleccionarPeriodo}
        esEvaluacion={esEvaluacion}
      />
    );
  }

  if (vista === 'seleccion') {
    if (configsFiltradas.length === 0) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center text-center px-4 py-8 gap-4 max-w-md mx-auto animate-in fade-in duration-300">
          <span className="text-5xl">📭</span>
          <h2 className="text-xl font-extrabold text-gray-900">Sin evaluaciones disponibles</h2>
          <p className="text-xs text-muted-foreground">
            No hay evaluaciones de tipo {esEvaluacion ? 'Evaluación' : 'Anónima'} activas para este período.
          </p>
          <button
            onClick={() => { setPeriodoActual(null); setVista('seleccionPeriodo'); }}
            className="flex items-center gap-1.5 font-bold text-xs text-primary hover:underline cursor-pointer bg-transparent border-0"
          >
            <ArrowLeft size={14} /> Elegir otro Período
          </button>
        </div>
      );
    }
    return (
      <div className="flex-1 flex flex-col justify-between">
        <SeleccionEncuesta
          configs={configsFiltradas}
          nombreTrabajador={trabajadorActual ? `${trabajadorActual.nombres} ${trabajadorActual.apellidos}` : ''}
          completadas={evaluacionesCompletadas}
          onSeleccionar={handleSeleccionConfig}
        />
        <button
          onClick={() => { setPeriodoActual(null); setVista('seleccionPeriodo'); }}
          className="flex items-center gap-1.5 font-bold text-xs text-muted-foreground hover:text-primary transition underline-offset-4 hover:underline mx-auto mt-6 cursor-pointer bg-transparent border-0"
        >
          <ArrowLeft size={14} /> Cambiar de Período
        </button>
      </div>
    );
  }

  if (vista === 'guardando') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center py-12 gap-4">
        <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
        <p className="text-xs font-semibold text-gray-700 animate-pulse">Guardando tus respuestas con seguridad...</p>
      </div>
    );
  }

  if (vista === 'error') {
    const esYaRespondio = error.includes('Ya participaste');
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center px-4 py-8 gap-4 max-w-md mx-auto animate-in zoom-in duration-300">
        {esYaRespondio ? (
          <>
            <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500 shadow-md border border-emerald-100 animate-bounce">
              <CheckCircle2 size={32} />
            </div>
            <h2 className="text-xl font-extrabold text-gray-900 tracking-tight">¡Participación Registrada!</h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Ya has respondido la evaluación <strong className="text-gray-900">"{encuestaConfigSeleccionada?.nombre}"</strong> en este período. ¡Muchas gracias por tu valiosa participación!
            </p>
            <div className="flex flex-col gap-2 w-full mt-2">
              <Button
                onClick={() => navigate('/')}
                className="w-full h-12 text-sm font-bold rounded-xl bg-primary text-white hover:bg-primary/95 transition shadow-lg shadow-primary/25 cursor-pointer"
              >
                Volver al Inicio
              </Button>
              <button
                onClick={() => {
                  setError('');
                  setEncuestaConfig(null);
                  setVista('seleccionPeriodo');
                  setPeriodoActual(null);
                }}
                className="text-xs text-muted-foreground hover:text-primary transition underline-offset-4 hover:underline py-1 bg-transparent border-0 cursor-pointer"
              >
                ← Cambiar de Período
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center text-red-500 shadow-sm border border-red-100">
              <XCircle size={28} />
            </div>
            <h2 className="text-lg font-extrabold text-gray-900">Ha ocurrido un inconveniente</h2>
            <p className="text-danger font-semibold leading-relaxed text-xs bg-red-50/50 border border-red-100 rounded-xl p-3 w-full">{error}</p>
            <button
              onClick={() => {
                setError('');
                setEncuestaConfig(null);
                if (!periodoActual) {
                  setVista('seleccionPeriodo');
                } else {
                  setVista('seleccion');
                }
              }}
              className="text-xs font-bold text-primary hover:underline cursor-pointer bg-transparent border-0"
            >
              Volver a intentar
            </button>
          </>
        )}
      </div>
    );
  }

  if (vista === 'completado') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center animate-in zoom-in duration-500 gap-5 max-w-xl mx-auto py-4">
        <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-success/80 rounded-full flex items-center justify-center shadow-md shadow-success/10 animate-bounce">
          <span className="text-4xl animate-pulse">🎉</span>
        </div>
        <div>
          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-md uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200/30`}>
            {encuestaConfigSeleccionada?.nombre}
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mt-2 tracking-tight leading-tight">
            ¡Evaluación Completada!
          </h2>
          {!esAnonima && (
            <div className="mt-4 bg-emerald-50/50 border border-emerald-100/40 rounded-xl p-4 shadow-sm max-w-xs mx-auto flex flex-col gap-1">
              <p className="text-xs text-emerald-800 font-semibold uppercase tracking-wide">Puntuación Obtenida</p>
              <p className="text-3xl font-black text-emerald-600 mt-0.5">
                {score} <span className="text-base font-bold text-emerald-800/80">/ {totalPuntosPosibles} pts</span>
              </p>
              {esPuntajePerfecto ? (
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/70 py-0.5 px-2.5 rounded-full mt-1.5 self-center">
                  ¡Excelente! Puntaje Perfecto ✓
                </span>
              ) : (
                <span className="text-[10px] font-bold text-red-700 bg-red-100/70 py-0.5 px-2.5 rounded-full mt-1.5 self-center">
                  Puntaje Incompleto ✗
                </span>
              )}
            </div>
          )}
          {esAnonima && (
            <p className="text-xs sm:text-sm text-muted-foreground mt-3 leading-relaxed max-w-md mx-auto">
              Agradecemos sinceramente tu valioso tiempo y tus honestas opiniones para ayudarnos a garantizar la inocuidad alimentaria.
            </p>
          )}
        </div>
        {!esAnonima && (
          <div className="w-full flex flex-col gap-4">
            {esPuntajePerfecto ? (
              <Button
                id="ir-a-ruleta-btn"
                onClick={() => navigate('/worker/ruleta')}
                className="w-full h-14 text-base font-extrabold rounded-xl bg-gradient-to-r from-success to-emerald-600 text-white hover:from-emerald-600 hover:to-success transition-all duration-300 shadow-md shadow-success/20 active:scale-95 cursor-pointer mt-2"
              >
                Reclamar Premio en la Ruleta 🎡
              </Button>
            ) : (
              <div className="bg-amber-50/80 border border-amber-200/50 rounded-2xl p-4 text-center max-w-md mx-auto shadow-sm animate-in slide-in-from-bottom-2 duration-300">
                <p className="text-xs text-amber-800 font-bold leading-relaxed">
                  ⚠️ Se requiere un puntaje perfecto ({totalPuntosPosibles} puntos) para reclamar premios en la ruleta. ¡Sigue capacitándote para lograrlo la próxima vez!
                </p>
              </div>
            )}
            <div className="flex flex-col gap-2 w-full mt-2">
              <Button
                onClick={() => navigate('/')}
                className="w-full h-12 text-sm font-bold rounded-xl bg-primary text-white hover:bg-primary/95 transition shadow-md shadow-primary/25 cursor-pointer"
              >
                Volver al Inicio
              </Button>
            </div>
          </div>
        )}
        {esAnonima && (
          <div className="flex flex-col gap-2 w-full mt-2">
            <Button
              onClick={() => {
                setVista('seleccionPeriodo');
                setPeriodoActual(null);
                setEncuestaConfig(null);
              }}
              className="w-full h-12 text-sm font-bold rounded-xl bg-primary text-white hover:bg-primary/95 transition shadow-md shadow-primary/25 cursor-pointer"
            >
              Responder otra Encuesta
            </Button>
            <button
              onClick={() => navigate('/')}
              className="text-xs font-semibold text-muted-foreground hover:text-primary transition underline-offset-4 hover:underline py-1 bg-transparent border-0 cursor-pointer"
            >
              Volver a la Portada
            </button>
          </div>
        )}
      </div>
    );
  }

  // ─── Encuesta en curso ────────────────────────────────────
  if (preguntas.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[250px]">
        <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  const preguntaActual = preguntas[currentIndex];
  const progress = ((currentIndex) / preguntas.length) * 100;

  return (
    <div className="flex flex-col flex-1 pb-1 animate-in fade-in duration-500 justify-center">
      {/* Header encuesta - Más compacto */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-1.5">
          <span className={`text-[9px] font-black px-2 py-0.5 rounded-md uppercase border tracking-wider
            ${esAnonima ? 'bg-purple-50 text-purple-700 border-purple-100/50' : 'bg-blue-50 text-blue-700 border-blue-100/50'}
          `}>
            {esAnonima ? '🔒 Anónima' : '📋 Evaluación'}
          </span>
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider truncate max-w-[120px] sm:max-w-none">
            {encuestaConfigSeleccionada?.nombre}
          </span>
        </div>
        
        <span className="text-xs font-bold text-primary">
          Pregunta {currentIndex + 1} de {preguntas.length} · <span className="opacity-75">{Math.round(progress)}%</span>
        </span>
      </div>

      {/* Barra de progreso - Más delgada */}
      <div className="w-full bg-gray-100 h-1.5 rounded-full mb-4 overflow-hidden border border-gray-200/10">
        <div
          className="bg-gradient-to-r from-primary via-indigo-500 to-success h-full transition-all duration-500 ease-out rounded-full"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Tarjeta de pregunta - Compacta, min-height menor para evitar scroll */}
      <div className={`flex-1 flex flex-col justify-center rounded-2xl p-4 sm:p-6 transition-all duration-300 border relative overflow-hidden min-h-[110px] sm:min-h-[130px]
        ${feedback === 'correcto' ? 'bg-emerald-50/40 border-emerald-300 shadow-sm' :
          feedback === 'incorrecto' ? 'bg-red-50/40 border-red-300 shadow-sm' :
          feedback === 'respondido' ? 'bg-blue-50/40 border-blue-200 shadow-sm' :
          'bg-white/40 border-gray-150 shadow-sm'
        }
      `}>
        {/* Efervescencia decorativa del feedback */}
        <div className={`absolute top-0 right-0 w-24 h-24 rounded-bl-full pointer-events-none transition-opacity duration-300
          ${feedback === 'correcto' ? 'bg-emerald-500/5' :
            feedback === 'incorrecto' ? 'bg-red-500/5' :
            feedback === 'respondido' ? 'bg-blue-500/5' : 'bg-transparent'
          }
        `} />

        {/* Breadcrumb grupo/subgrupo - Más pequeño y compacto */}
        {(preguntaActual.grupo || preguntaActual.subGrupo) && (
          <div className="flex items-center gap-1 mb-2.5 text-[9px] font-bold uppercase tracking-wider text-muted-foreground z-10">
            {preguntaActual.grupo && <span className="text-primary bg-primary/5 px-2 py-0.5 rounded border border-primary/10">{preguntaActual.grupo.nombre}</span>}
            {preguntaActual.subGrupo && <>
              <span className="opacity-45 text-gray-400">›</span>
              <span className="text-muted-foreground bg-gray-50 px-2 py-0.5 rounded border border-gray-150">{preguntaActual.subGrupo.nombre}</span>
            </>}
          </div>
        )}

        <h2 className="text-base sm:text-lg md:text-xl font-extrabold text-gray-900 leading-snug tracking-tight z-10 max-w-4xl">
          {preguntaActual.enunciado}
        </h2>

        {/* Feedback visual interactivo en la tarjeta */}
        {feedback && preguntaActual.tipoPregunta === 'VERDADERO_FALSO' && (
          <div className={`mt-3 inline-flex items-center gap-1.5 font-bold text-sm py-1 px-3 rounded-lg max-w-xs animate-bounce z-10 ${
            feedback === 'correcto' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-red-100 text-red-800 border border-red-200'
          }`}>
            {feedback === 'correcto' ? (
              <>
                <CheckCircle2 size={16} className="text-emerald-600" />
                <span>¡Correcto! +{preguntaActual.puntos} pts</span>
              </>
            ) : (
              <>
                <XCircle size={16} className="text-red-600" />
                <span>Incorrecto</span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Controles según tipo - Compactos y responsivos */}
      <div className="z-10">
        {preguntaActual.tipoPregunta === 'VERDADERO_FALSO' ? (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 mt-4 sm:mt-5">
            <button
              id="respuesta-verdadero-btn"
              onClick={() => handleAnswerVF(true)}
              disabled={feedback !== null}
              className={`flex flex-col items-center justify-center gap-2 p-3.5 sm:p-5 rounded-2xl border-2 font-bold text-sm transition-all duration-300 relative overflow-hidden group cursor-pointer
                ${feedback === 'correcto' && preguntaActual.respuesta_correcta === true
                  ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 border-emerald-600 text-white shadow-md shadow-emerald-500/20 scale-102'
                  : feedback === 'incorrecto' && preguntaActual.respuesta_correcta === false
                  ? 'bg-white border-gray-150 text-gray-400 opacity-60'
                  : 'bg-white border-emerald-100 hover:border-emerald-400 hover:bg-emerald-50/10 text-emerald-800 hover:shadow-md hover:shadow-emerald-500/5'
                }
                ${feedback !== null ? 'pointer-events-none' : 'hover:-translate-y-0.5 active:scale-95'}
              `}
            >
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-lg font-extrabold shadow-sm transition-colors duration-350
                ${feedback === 'correcto' && preguntaActual.respuesta_correcta === true 
                  ? 'bg-white/20 text-white' 
                  : 'bg-emerald-50 text-emerald-600'
                }
              `}>
                ✓
              </div>
              <div className="text-center">
                <p className="text-sm sm:text-base font-extrabold leading-tight">Verdadero</p>
                <p className={`text-[9px] mt-0.5 hidden sm:block
                  ${feedback === 'correcto' && preguntaActual.respuesta_correcta === true
                    ? 'text-white/80'
                    : 'text-muted-foreground'
                  }
                `}>
                  La afirmación es verídica.
                </p>
              </div>
            </button>

            <button
              id="respuesta-falso-btn"
              onClick={() => handleAnswerVF(false)}
              disabled={feedback !== null}
              className={`flex flex-col items-center justify-center gap-2 p-3.5 sm:p-5 rounded-2xl border-2 font-bold text-sm transition-all duration-300 relative overflow-hidden group cursor-pointer
                ${feedback === 'correcto' && preguntaActual.respuesta_correcta === false
                  ? 'bg-gradient-to-br from-emerald-50 to-emerald-600 border-emerald-600 text-white shadow-md shadow-emerald-500/20 scale-102'
                  : feedback === 'incorrecto' && preguntaActual.respuesta_correcta === true
                  ? 'bg-white border-gray-150 text-gray-400 opacity-60'
                  : 'bg-white border-red-100 hover:border-red-400 hover:bg-red-50/10 text-red-800 hover:shadow-md hover:shadow-red-500/5'
                }
                ${feedback !== null ? 'pointer-events-none' : 'hover:-translate-y-0.5 active:scale-95'}
              `}
            >
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-lg font-extrabold shadow-sm transition-colors duration-350
                ${feedback === 'correcto' && preguntaActual.respuesta_correcta === false 
                  ? 'bg-white/20 text-white' 
                  : 'bg-red-50 text-red-600'
                }
              `}>
                ✗
              </div>
              <div className="text-center">
                <p className="text-sm sm:text-base font-extrabold leading-tight">Falso</p>
                <p className={`text-[9px] mt-0.5 hidden sm:block
                  ${feedback === 'correcto' && preguntaActual.respuesta_correcta === false
                    ? 'text-white/80'
                    : 'text-muted-foreground'
                  }
                `}>
                  La afirmación es incorrecta.
                </p>
              </div>
            </button>
          </div>
        ) : (
          <BotonesLikert
            escala={escala}
            onResponder={handleAnswerLikert}
            deshabilitado={feedback !== null}
            valorSeleccionado={valorLikertSeleccionado}
          />
        )}
      </div>
    </div>
  );
}
