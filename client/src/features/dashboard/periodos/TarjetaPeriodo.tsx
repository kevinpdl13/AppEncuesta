import { Calendar, Lock, FileText, Pencil, Trash2, ToggleLeft, ToggleRight, Clock } from 'lucide-react';
import { Card, CardContent } from '../../../components/ui/Card';
import { formatDateHuman } from '../../../lib/formatters';
import { computePeriodoBadge } from '../../../lib/calculations';
import type { Periodo } from '../../../types';

type TarjetaPeriodoProps = {
  periodo: Periodo;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: () => void;
  onManageGroups: (configId: string, configNombre: string) => void;
};

export function TarjetaPeriodo({
  periodo,
  onEdit,
  onDelete,
  onToggle,
  onManageGroups
}: TarjetaPeriodoProps) {
  const badge = computePeriodoBadge(periodo);
  
  const configAnonima = periodo.encuestaConfigs?.find(c => c.tipo === 'ANONIMA' && c.activo);
  const configEvaluacion = periodo.encuestaConfigs?.find(c => c.tipo === 'EVALUACION' && c.activo);

  return (
    <Card className={`transition-all hover:shadow-md border border-gray-100 ${!periodo.activo ? 'opacity-65 bg-gray-50/50' : 'bg-white'}`}>
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          <div className="space-y-2 flex-1 min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h3 className="text-lg font-bold text-gray-900 tracking-tight">{periodo.nombre}</h3>
              <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border uppercase tracking-wider ${badge.cls}`}>
                {badge.label}
              </span>
            </div>

            {periodo.descripcion && (
              <p className="text-sm text-muted-foreground max-w-xl leading-relaxed">{periodo.descripcion}</p>
            )}

            <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap pt-0.5">
              <span className="flex items-center gap-1 font-semibold text-gray-600 bg-gray-100 px-2 py-0.5 rounded-lg">
                <Clock size={13} className="text-gray-400" />
                Inicio: {formatDateHuman(periodo.fechaInicio)}
              </span>
              {periodo.fechaFin && (
                <span className="flex items-center gap-1 font-semibold text-gray-600 bg-gray-100 px-2 py-0.5 rounded-lg">
                  <Calendar size={13} className="text-gray-400" />
                  Cierre: {formatDateHuman(periodo.fechaFin)}
                </span>
              )}
              <span className="font-semibold text-primary/80 bg-primary/5 border border-primary/10 px-2 py-0.5 rounded-lg">
                💬 {periodo._count?.sesiones ?? 0} respuestas recibidas
              </span>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
                Encuestas Habilitadas:
              </span>
              <div className="flex gap-2.5 flex-wrap">
                {configAnonima ? (
                  <div className="flex flex-col gap-1.5 p-3 rounded-xl border border-purple-100 bg-purple-50/30 text-purple-900 text-xs font-semibold w-fit">
                    <div className="flex items-center justify-between gap-4">
                      <span className="flex items-center gap-1.5 font-bold">
                        <Lock size={13} className="text-purple-600" />
                        🔒 Encuesta Anónima (Activa)
                      </span>
                      <button
                        onClick={() => onManageGroups(configAnonima.id, periodo.nombre)}
                        className="text-[10px] font-bold bg-purple-500 hover:bg-purple-600 text-white px-2 py-0.5 rounded-lg transition-colors cursor-pointer shadow-sm shrink-0"
                      >
                        Gestionar Grupos
                      </button>
                    </div>
                    {(() => {
                      try {
                        const escala = configAnonima.escalaLabels
                          ? JSON.parse(configAnonima.escalaLabels)
                          : ['Nunca', 'A veces', 'Siempre'];
                        return (
                          <div className="flex items-center gap-1 text-[10px] text-purple-600/80 bg-white border border-purple-100 px-2 py-0.5 rounded-lg font-bold">
                            <span>😟 {escala[0]}</span>
                            <span className="opacity-50">•</span>
                            <span>😐 {escala[1]}</span>
                            <span className="opacity-50">•</span>
                            <span>😊 {escala[2]}</span>
                          </div>
                        );
                      } catch {
                        return null;
                      }
                    })()}
                  </div>
                ) : (
                  <span className="text-[11px] text-gray-400 bg-gray-50 border border-gray-100 px-3 py-2 rounded-xl border-dashed">
                    🔒 Anónima desactivada
                  </span>
                )}

                {configEvaluacion ? (
                  <div className="flex items-center gap-1.5 p-3 rounded-xl border border-blue-100 bg-blue-50/30 text-blue-900 text-xs font-bold w-fit">
                    <FileText size={13} className="text-blue-600" />
                    📋 Evaluación (Activa)
                  </div>
                ) : (
                  <span className="text-[11px] text-gray-400 bg-gray-50 border border-gray-100 px-3 py-2 rounded-xl border-dashed">
                    📋 Cuestionario de Evaluación inactivo
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end md:self-center shrink-0">
            <button
              onClick={onToggle}
              title={periodo.activo ? 'Desactivar Período' : 'Activar Período'}
              className="p-2.5 rounded-xl hover:bg-gray-100 transition-colors"
            >
              {periodo.activo ? (
                <ToggleRight size={26} className="text-success" />
              ) : (
                <ToggleLeft size={26} className="text-muted-foreground" />
              )}
            </button>
            <button
              onClick={onEdit}
              title="Configurar Período"
              className="p-2.5 rounded-xl hover:bg-primary/5 text-primary border border-transparent hover:border-primary/10 transition-colors"
            >
              <Pencil size={18} />
            </button>
            <button
              onClick={onDelete}
              title="Eliminar Período"
              className="p-2.5 rounded-xl hover:bg-danger/10 text-danger border border-transparent hover:border-danger/10 transition-colors"
            >
              <Trash2 size={18} />
            </button>
          </div>

        </div>
      </CardContent>
    </Card>
  );
}
