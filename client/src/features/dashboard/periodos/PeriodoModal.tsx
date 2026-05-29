import { useState } from 'react';
import { Sparkles, AlertCircle, Smile, Lock, FileText } from 'lucide-react';
import { api } from '../../../lib/api';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { formatDateInput } from '../../../lib/formatters';
import type { Periodo } from '../../../types';

type PeriodoModalProps = {
  periodo?: Periodo | null;
  onClose: () => void;
  onSaved: () => void;
};

export function PeriodoModal({ periodo, onClose, onSaved }: PeriodoModalProps) {
  const [nombre, setNombre] = useState(periodo?.nombre ?? '');
  const [descripcion, setDescripcion] = useState(periodo?.descripcion ?? '');
  const [fechaInicio, setFechaInicio] = useState(periodo?.fechaInicio ? formatDateInput(periodo.fechaInicio) : '');
  const [fechaFin, setFechaFin] = useState(periodo?.fechaFin ? formatDateInput(periodo.fechaFin) : '');
  
  const configAnonimaOriginal = periodo?.encuestaConfigs?.find(c => c.tipo === 'ANONIMA');
  const configEvaluacionOriginal = periodo?.encuestaConfigs?.find(c => c.tipo === 'EVALUACION');

  const [tipoEncuesta, setTipoEncuesta] = useState<'ANONIMA' | 'EVALUACION'>(() => {
    if (configEvaluacionOriginal?.activo) return 'EVALUACION';
    return 'ANONIMA';
  });

  const anonimaEnabled = tipoEncuesta === 'ANONIMA';
  const evaluacionEnabled = tipoEncuesta === 'EVALUACION';

  const [escalaLabels, setEscalaLabels] = useState<string[]>(() => {
    if (configAnonimaOriginal?.escalaLabels) {
      try {
        return JSON.parse(configAnonimaOriginal.escalaLabels);
      } catch {
        return ['Nunca', 'A veces', 'Siempre'];
      }
    }
    return ['Nunca', 'A veces', 'Siempre'];
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleScaleLabelChange = (index: number, value: string) => {
    const next = [...escalaLabels];
    next[index] = value;
    setEscalaLabels(next);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim() || !fechaInicio) {
      setError('El nombre y la fecha de inicio son requeridos.');
      return;
    }
    if (anonimaEnabled && escalaLabels.some(l => !l.trim())) {
      setError('Todas las etiquetas de valoración de la encuesta anónima son requeridas.');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const payloadPeriodo = {
        nombre: nombre.trim(),
        descripcion: descripcion.trim() || undefined,
        fechaInicio: new Date(fechaInicio).toISOString(),
        fechaFin: fechaFin ? new Date(fechaFin).toISOString() : undefined,
        activo: periodo?.activo ?? true
      };

      let pId = periodo?.id;

      if (periodo) {
        await api.actualizarPeriodo(periodo.id, payloadPeriodo);
      } else {
        const nuevoP = await api.crearPeriodo(payloadPeriodo);
        pId = nuevoP.id;
      }

      if (!pId) throw new Error('No se pudo identificar el ID del período.');

      if (anonimaEnabled) {
        if (configAnonimaOriginal) {
          await api.actualizarEncuestaConfig(pId, configAnonimaOriginal.id, {
            nombre: `Encuesta Anónima - ${nombre.trim()}`,
            activo: true,
            escalaLabels: escalaLabels
          } as any);
        } else {
          await api.crearEncuestaConfig(pId, {
            nombre: `Encuesta Anónima - ${nombre.trim()}`,
            tipo: 'ANONIMA',
            escalaLabels
          });
        }
      } else if (configAnonimaOriginal) {
        await api.actualizarEncuestaConfig(pId, configAnonimaOriginal.id, { activo: false });
      }

      if (evaluacionEnabled) {
        if (configEvaluacionOriginal) {
          await api.actualizarEncuestaConfig(pId, configEvaluacionOriginal.id, {
            nombre: `Evaluación - ${nombre.trim()}`,
            activo: true
          });
        } else {
          await api.crearEncuestaConfig(pId, {
            nombre: `Evaluación - ${nombre.trim()}`,
            tipo: 'EVALUACION'
          });
        }
      } else if (configEvaluacionOriginal) {
        await api.actualizarEncuestaConfig(pId, configEvaluacionOriginal.id, { activo: false });
      }

      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al guardar el período de encuesta.');
    } finally {
      setLoading(false);
    }
  };

  const esEdicion = !!periodo;

  return (
    <div className="fixed inset-0 bg-black/45 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-lg p-8 animate-in zoom-in duration-200 overflow-y-auto max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-xl font-bold mb-6 text-foreground flex items-center gap-2">
          <Sparkles size={20} className="text-primary" />
          {esEdicion ? 'Configurar Período' : 'Nuevo Período de Encuesta'}
        </h3>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase mb-1.5 block">
                Nombre del Período *
              </label>
              <Input
                placeholder="Ej: Primer Trimestre Q1 2026"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase mb-1.5 block">
                Descripción (opcional)
              </label>
              <textarea
                className="w-full border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none font-medium text-gray-700"
                rows={2}
                placeholder="Indica el objetivo de esta medición..."
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase mb-1.5 block">
                Fecha de Apertura *
              </label>
              <input
                type="datetime-local"
                className="w-full border border-border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white font-semibold text-gray-700"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase mb-1.5 block">
                Fecha de Cierre
              </label>
              <input
                type="datetime-local"
                className="w-full border border-border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white font-semibold text-gray-700"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-xs font-bold text-muted-foreground uppercase block">
              Tipo de Encuesta del Período *
            </label>
            <div className="grid grid-cols-2 gap-3">
              {(['ANONIMA', 'EVALUACION'] as const).map(tipo => {
                const isSelected = tipoEncuesta === tipo;
                const isAnon = tipo === 'ANONIMA';
                return (
                  <button
                    key={tipo}
                    type="button"
                    onClick={() => setTipoEncuesta(tipo)}
                    className={`p-4 rounded-2xl border-2 text-left transition-all flex flex-col gap-2 ${
                      isSelected
                        ? isAnon
                          ? 'border-purple-500 bg-purple-50/20 text-purple-900 shadow-sm'
                          : 'border-blue-500 bg-blue-50/20 text-blue-900 shadow-sm'
                        : 'border-gray-100 bg-white hover:border-gray-200 text-gray-500'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs shrink-0 ${
                        isSelected
                          ? isAnon ? 'bg-purple-500 text-white' : 'bg-blue-500 text-white'
                          : 'bg-gray-100 text-gray-400'
                      }`}>
                        {isAnon ? <Lock size={14} /> : <FileText size={14} />}
                      </div>
                      <span className="font-bold text-xs uppercase tracking-wider">
                        {isAnon ? 'Anónima' : 'Evaluación'}
                      </span>
                    </div>
                    <p className="text-[11px] leading-snug">
                      {isAnon
                        ? 'Medición de Clima Laboral. Escala Likert de caritas sin pedir cédula.'
                        : 'Evaluación Técnica o de Clima. Cuestionarios V/F e individuales.'}
                    </p>
                  </button>
                );
              })}
            </div>

            {tipoEncuesta === 'ANONIMA' && (
              <div className="mt-3 bg-purple-50/30 border border-purple-100 rounded-2xl p-4 flex flex-col gap-3 animate-in slide-in-from-top-2 duration-200">
                <div>
                  <p className="text-xs font-bold text-purple-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Smile size={14} /> Personalizar Escala Likert de Caritas
                  </p>
                  <p className="text-[10px] text-purple-600 mt-0.5 leading-none">
                    Configura los tres textos de valoración que verán los participantes.
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { emoji: '😟', placeholder: 'Mala' },
                    { emoji: '😐', placeholder: 'Buena' },
                    { emoji: '😊', placeholder: 'Muy buena' }
                  ].map((item, idx) => (
                    <div key={idx} className="flex flex-col gap-0.5 text-center">
                      <span className="text-lg">{item.emoji}</span>
                      <input
                        type="text"
                        maxLength={12}
                        placeholder={item.placeholder}
                        value={escalaLabels[idx] ?? ''}
                        onChange={(e) => handleScaleLabelChange(idx, e.target.value)}
                        className="w-full border border-purple-200 rounded-xl px-2 py-2 text-center text-xs focus:outline-none focus:ring-2 focus:ring-purple-300 font-semibold bg-white text-gray-800"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="text-xs text-danger bg-danger/10 px-4 py-2.5 rounded-xl border border-danger/20 flex items-start gap-2">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? 'Guardando...' : 'Guardar Período'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
