import { useState, useEffect, useCallback } from 'react';
import { api } from '../../lib/api';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import {
  Calendar,
  Lock,
  FileText,
  Pencil,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Sparkles,
  AlertCircle,
  Clock,
  Settings,
  Smile,
  Folder,
  FolderOpen,
  X
} from 'lucide-react';
import type { Periodo } from '../../types';

// ─── Helpers ────────────────────────────────────────────────────────────────
function formatDate(iso: string) {
  if (!iso) return '';
  // Formatear fecha recortando la hora para el input datetime-local
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

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

function estadoBadge(p: Periodo) {
  if (!p.activo) return { label: 'Inactivo', cls: 'bg-gray-100 text-gray-500 border-gray-200' };
  if (p.vigente) return { label: 'Vigente 🟢', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
  const now = new Date();
  if (new Date(p.fechaInicio) > now) return { label: 'Próximo ⏳', cls: 'bg-blue-50 text-blue-700 border-blue-200' };
  return { label: 'Finalizado 🛑', cls: 'bg-amber-50 text-amber-700 border-amber-200' };
}

// ─── Modal Unificado: Crear / Editar Período + EncuestaConfigs ────────────────
type PeriodoModalProps = {
  periodo?: Periodo | null;
  onClose: () => void;
  onSaved: () => void;
};

function PeriodoModal({ periodo, onClose, onSaved }: PeriodoModalProps) {
  const [nombre, setNombre] = useState(periodo?.nombre ?? '');
  const [descripcion, setDescripcion] = useState(periodo?.descripcion ?? '');
  const [fechaInicio, setFechaInicio] = useState(periodo?.fechaInicio ? formatDate(periodo.fechaInicio) : '');
  const [fechaFin, setFechaFin] = useState(periodo?.fechaFin ? formatDate(periodo.fechaFin) : '');
  
  // Configuración de encuestas
  const configAnonimaOriginal = periodo?.encuestaConfigs?.find(c => c.tipo === 'ANONIMA');
  const configEvaluacionOriginal = periodo?.encuestaConfigs?.find(c => c.tipo === 'EVALUACION');

  const [tipoEncuesta, setTipoEncuesta] = useState<'ANONIMA' | 'EVALUACION'>(() => {
    if (configEvaluacionOriginal?.activo) return 'EVALUACION';
    return 'ANONIMA';
  });

  const anonimaEnabled = tipoEncuesta === 'ANONIMA';
  const evaluacionEnabled = tipoEncuesta === 'EVALUACION';

  // Escala Likert de encuesta anónima
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
        // 1. Guardar cambios del Período
        await api.actualizarPeriodo(periodo.id, payloadPeriodo);
      } else {
        // 1. Crear el Período nuevo
        const nuevoP = await api.crearPeriodo(payloadPeriodo);
        pId = nuevoP.id;
      }

      if (!pId) throw new Error('No se pudo identificar el ID del período.');

      // 2. Gestionar Encuesta CONFIG ANÓNIMA
      if (anonimaEnabled) {
        if (configAnonimaOriginal) {
          // Actualizar existente
          await api.actualizarEncuestaConfig(pId, configAnonimaOriginal.id, {
            nombre: `Encuesta Anónima - ${nombre.trim()}`,
            activo: true,
            escalaLabels: escalaLabels
          } as any);
        } else {
          // Crear nueva
          await api.crearEncuestaConfig(pId, {
            nombre: `Encuesta Anónima - ${nombre.trim()}`,
            tipo: 'ANONIMA',
            escalaLabels
          });
        }
      } else if (configAnonimaOriginal) {
        // Desactivar existente si se desmarcó
        await api.actualizarEncuestaConfig(pId, configAnonimaOriginal.id, { activo: false });
      }

      // 3. Gestionar Encuesta CONFIG EVALUACION
      if (evaluacionEnabled) {
        if (configEvaluacionOriginal) {
          // Actualizar existente
          await api.actualizarEncuestaConfig(pId, configEvaluacionOriginal.id, {
            nombre: `Evaluación - ${nombre.trim()}`,
            activo: true
          });
        } else {
          // Crear nueva
          await api.crearEncuestaConfig(pId, {
            nombre: `Evaluación - ${nombre.trim()}`,
            tipo: 'EVALUACION'
          });
        }
      } else if (configEvaluacionOriginal) {
        // Desactivar existente si se desmarcó
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
          {/* Nombre y Descripcion */}
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

          {/* Fechas */}
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

          {/* Tipo de Encuesta */}
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

            {/* Escala editable si es Anónima */}
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

          {/* Botones */}
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

// ─── Tarjeta de Período Ampliada ────────────────────────────────────────────
function TarjetaPeriodo({
  periodo,
  onEdit,
  onDelete,
  onToggle,
  onManageGroups
}: {
  periodo: Periodo;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: () => void;
  onManageGroups: (configId: string, configNombre: string) => void;
}) {
  const badge = estadoBadge(periodo);
  
  // Buscar configs vigentes
  const configAnonima = periodo.encuestaConfigs?.find(c => c.tipo === 'ANONIMA' && c.activo);
  const configEvaluacion = periodo.encuestaConfigs?.find(c => c.tipo === 'EVALUACION' && c.activo);

  return (
    <Card className={`transition-all hover:shadow-md border border-gray-100 ${!periodo.activo ? 'opacity-65 bg-gray-50/50' : 'bg-white'}`}>
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Información Principal */}
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

            {/* Fechas de Vigencia */}
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

            {/* Visualización de Encuestas Habilitadas */}
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

          {/* Panel de Controles */}
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

// ─── Modal de Gestión de Grupos y Subgrupos ───────────────────────────────
type GruposModalProps = {
  configId: string;
  encuestaNombre: string;
  onClose: () => void;
};

function GruposModal({ configId, encuestaNombre, onClose }: GruposModalProps) {
  const [grupos, setGrupos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Form de creación de grupo
  const [nuevoGrupoNombre, setNuevoGrupoNombre] = useState('');
  const [creandoGrupo, setCreandoGrupo] = useState(false);

  // Estados de edición
  const [editandoGrupoId, setEditandoGrupoId] = useState<string | null>(null);
  const [editandoGrupoNombre, setEditandoGrupoNombre] = useState('');

  const [editandoSubId, setEditandoSubId] = useState<string | null>(null);
  const [editandoSubNombre, setEditandoSubNombre] = useState('');

  // Inputs para subgrupos mapeados por grupoId
  const [nuevoSubNombre, setNuevoSubNombre] = useState<{ [key: string]: string }>({});

  const cargar = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = await api.getGruposPorConfig(configId);
      setGrupos(data);
    } catch (err: any) {
      setError(err.message || 'Error al obtener los grupos.');
    } finally {
      setLoading(false);
    }
  }, [configId]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const handleCrearGrupo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoGrupoNombre.trim()) return;
    try {
      setCreandoGrupo(true);
      await api.crearGrupo({
        encuestaConfigId: configId,
        nombre: nuevoGrupoNombre.trim()
      });
      setNuevoGrupoNombre('');
      await cargar();
    } catch (err: any) {
      alert(err.message || 'No se pudo crear el grupo.');
    } finally {
      setCreandoGrupo(false);
    }
  };

  const handleEditarGrupo = async (id: string) => {
    if (!editandoGrupoNombre.trim()) return;
    try {
      await api.actualizarGrupo(id, { nombre: editandoGrupoNombre.trim() });
      setEditandoGrupoId(null);
      await cargar();
    } catch (err: any) {
      alert(err.message || 'No se pudo actualizar el grupo.');
    }
  };

  const handleEliminarGrupo = async (id: string) => {
    if (!confirm('¿Eliminar este grupo y todos sus subgrupos? Las preguntas perderán esta asociación.')) return;
    try {
      await api.eliminarGrupo(id);
      await cargar();
    } catch (err: any) {
      alert(err.message || 'No se pudo eliminar el grupo.');
    }
  };

  const handleCrearSubGrupo = async (grupoId: string) => {
    const val = nuevoSubNombre[grupoId];
    if (!val?.trim()) return;
    try {
      await api.crearSubGrupo(grupoId, { nombre: val.trim() });
      setNuevoSubNombre(prev => ({ ...prev, [grupoId]: '' }));
      await cargar();
    } catch (err: any) {
      alert(err.message || 'No se pudo crear el subgrupo.');
    }
  };

  const handleEditarSubGrupo = async (id: string) => {
    if (!editandoSubNombre.trim()) return;
    try {
      await api.actualizarSubGrupo(id, { nombre: editandoSubNombre.trim() });
      setEditandoSubId(null);
      await cargar();
    } catch (err: any) {
      alert(err.message || 'No se pudo actualizar el subgrupo.');
    }
  };

  const handleEliminarSubGrupo = async (id: string) => {
    if (!confirm('¿Eliminar este subgrupo?')) return;
    try {
      await api.eliminarSubGrupo(id);
      await cargar();
    } catch (err: any) {
      alert(err.message || 'No se pudo eliminar el subgrupo.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/45 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl p-8 animate-in zoom-in duration-200 overflow-y-auto max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-150">
          <div>
            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <FolderOpen className="text-purple-600" size={22} />
              Gestionar Grupos y Subgrupos
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Configura las agrupaciones para la encuesta de <strong>{encuestaNombre}</strong>
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Formulario Crear Grupo */}
        <form onSubmit={handleCrearGrupo} className="flex gap-2 mb-6 bg-purple-50/20 p-4 rounded-2xl border border-purple-100/50">
          <div className="flex-1">
            <Input
              placeholder="Ej: Inocuidad, Clima Laboral, Liderazgo..."
              value={nuevoGrupoNombre}
              onChange={(e) => setNuevoGrupoNombre(e.target.value)}
              className="bg-white"
            />
          </div>
          <Button type="submit" disabled={creandoGrupo || !nuevoGrupoNombre.trim()} className="shrink-0 bg-purple-600 hover:bg-purple-700 text-white rounded-xl">
            {creandoGrupo ? 'Creando...' : '+ Crear Grupo'}
          </Button>
        </form>

        {/* Loading / Error */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
          </div>
        )}

        {error && (
          <div className="text-sm text-danger bg-danger/10 p-4 rounded-xl border border-danger/20 mb-4">
            {error}
          </div>
        )}

        {/* Lista de Grupos */}
        {!loading && grupos.length === 0 && (
          <div className="text-center py-12 text-muted-foreground bg-gray-50 rounded-2xl border border-dashed border-gray-200">
            <Folder size={40} className="mx-auto mb-2 opacity-20 text-purple-500" />
            <p className="font-bold text-gray-700">Sin grupos creados aún</p>
            <p className="text-xs mt-0.5">Comienza creando tu primer grupo arriba (ej: Inocuidad)</p>
          </div>
        )}

        {!loading && grupos.length > 0 && (
          <div className="space-y-4 max-h-[450px] overflow-y-auto pr-1">
            {grupos.map((grupo) => (
              <div key={grupo.id} className="border border-gray-150 rounded-2xl p-5 bg-white shadow-sm hover:shadow-md transition-shadow">
                
                {/* Cabecera del Grupo */}
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div className="flex-1 min-w-0">
                    {editandoGrupoId === grupo.id ? (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={editandoGrupoNombre}
                          onChange={(e) => setEditandoGrupoNombre(e.target.value)}
                          className="flex-1 border border-purple-200 rounded-lg px-2.5 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 font-semibold"
                        />
                        <button
                          onClick={() => handleEditarGrupo(grupo.id)}
                          className="bg-emerald-500 hover:bg-emerald-600 text-white px-2.5 py-1 rounded-lg text-xs font-bold transition-colors"
                        >
                          Guardar
                        </button>
                        <button
                          onClick={() => setEditandoGrupoId(null)}
                          className="bg-gray-150 hover:bg-gray-200 text-gray-600 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors"
                        >
                          X
                        </button>
                      </div>
                    ) : (
                      <h4 className="font-bold text-gray-800 text-base flex items-center gap-1.5 truncate">
                        <Folder size={18} className="text-purple-500 shrink-0" />
                        {grupo.nombre}
                      </h4>
                    )}
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => {
                        setEditandoGrupoId(grupo.id);
                        setEditandoGrupoNombre(grupo.nombre);
                      }}
                      className="p-1.5 text-gray-400 hover:text-primary hover:bg-gray-100 rounded-lg transition-all"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => handleEliminarGrupo(grupo.id)}
                      className="p-1.5 text-gray-400 hover:text-danger hover:bg-red-50 rounded-lg transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Subgrupos */}
                <div className="bg-gray-50/50 rounded-xl p-3.5 border border-gray-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
                      Subgrupos ({grupo.subGrupos?.length ?? 0})
                    </span>
                  </div>

                  {/* Input añadir subgrupo */}
                  <div className="flex gap-1.5 mb-3">
                    <input
                      type="text"
                      placeholder="Añadir subgrupo (ej: Formación, Comunicación...)"
                      value={nuevoSubNombre[grupo.id] ?? ''}
                      onChange={(e) => setNuevoSubNombre(prev => ({ ...prev, [grupo.id]: e.target.value }))}
                      className="flex-1 border border-gray-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-purple-300 font-semibold bg-white text-gray-800"
                    />
                    <button
                      onClick={() => handleCrearSubGrupo(grupo.id)}
                      disabled={!(nuevoSubNombre[grupo.id] ?? '').trim()}
                      className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded-xl text-xs font-bold disabled:opacity-50 transition-colors cursor-pointer"
                    >
                      + Añadir
                    </button>
                  </div>

                  {/* Lista de subgrupos */}
                  {(!grupo.subGrupos || grupo.subGrupos.length === 0) ? (
                    <p className="text-[11px] text-muted-foreground italic text-center py-2">
                      Sin subgrupos. Añade uno arriba.
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {grupo.subGrupos.map((sub: any) => (
                        <div key={sub.id} className="flex items-center gap-1 bg-white border border-gray-150 pl-2.5 pr-1 py-1 rounded-lg text-xs font-semibold text-gray-700 shadow-sm transition-all hover:border-gray-200">
                          {editandoSubId === sub.id ? (
                            <div className="flex gap-1">
                              <input
                                type="text"
                                value={editandoSubNombre}
                                onChange={(e) => setEditandoSubNombre(e.target.value)}
                                className="border border-purple-200 rounded px-1.5 py-0.5 text-xs font-semibold max-w-[80px]"
                              />
                              <button
                                onClick={() => handleEditarSubGrupo(sub.id)}
                                className="bg-emerald-500 hover:bg-emerald-600 text-white px-1 py-0.5 rounded text-[10px]"
                              >
                                ✓
                              </button>
                              <button
                                onClick={() => setEditandoSubId(null)}
                                className="bg-gray-100 text-gray-600 px-1 py-0.5 rounded text-[10px]"
                              >
                                X
                              </button>
                            </div>
                          ) : (
                            <>
                              <span className="truncate max-w-[120px]">{sub.nombre}</span>
                              <button
                                onClick={() => {
                                  setEditandoSubId(sub.id);
                                  setEditandoSubNombre(sub.nombre);
                                }}
                                className="text-gray-400 hover:text-primary p-0.5 rounded hover:bg-gray-50 transition-colors"
                              >
                                <Pencil size={10} />
                              </button>
                              <button
                                onClick={() => handleEliminarSubGrupo(sub.id)}
                                className="text-gray-400 hover:text-danger p-0.5 rounded hover:bg-red-50 transition-colors"
                              >
                                <X size={10} />
                              </button>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                </div>

              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}

// ─── Página principal: PeriodosPage ─────────────────────────────────────────
export function PeriodosPage() {
  const [periodos, setPeriodos] = useState<Periodo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editando, setEditando] = useState<Periodo | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Control modal de grupos
  const [gruposModalConfig, setGruposModalConfig] = useState<{ id: string; name: string } | null>(null);

  const cargar = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = await api.getPeriodos();
      setPeriodos(data);
    } catch (err: any) {
      setError(err.message || 'Error al cargar los períodos.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const handleToggle = async (p: Periodo) => {
    try {
      const nuevoEstado = !p.activo;
      await api.actualizarPeriodo(p.id, { activo: nuevoEstado });
      setPeriodos((prev) =>
        prev.map((x) => (x.id === p.id ? { ...x, activo: nuevoEstado } : x))
      );
    } catch (err: any) {
      alert(err.message || 'Error al cambiar el estado del período.');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.eliminarPeriodo(id);
      setPeriodos((prev) => prev.filter((p) => p.id !== id));
      setConfirmDeleteId(null);
    } catch (err: any) {
      alert(
        err.message ||
          'No se puede eliminar el período. Asegúrate de que no existan respuestas o sesiones completadas por los trabajadores.'
      );
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight">Períodos de Encuesta</h2>
          <p className="text-muted-foreground mt-1">
            Gestiona los ciclos de medición y habilita encuestas de forma ágil y centralizada.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditando(null);
            setModalOpen(true);
          }}
          className="gap-2"
        >
          <Sparkles size={18} /> Nuevo Período
        </Button>
      </div>

      {/* Info Alert de simplificación */}
      <div className="bg-[#eff0fe]/50 border border-primary/20 rounded-2xl p-4 text-sm text-primary flex items-start gap-3 shadow-sm">
        <Settings size={18} className="shrink-0 mt-0.5 text-primary" />
        <div>
          <p className="font-semibold text-[15px] mb-0.5">Administración Unificada y Simple</p>
          <p className="text-xs text-[#5c5f8a]">
            ¡Hemos simplificado la plataforma! Ya no necesitas configurar encuestas en una pestaña separada.
            Al crear o editar cualquier **Período**, puedes habilitar directamente su **Encuesta Anónima**
            (con escala de caritas personalizada) o su **Evaluación**.
          </p>
        </div>
      </div>

      {/* Carga / Error / Vacío */}
      {loading && (
        <div className="flex items-center justify-center h-48">
          <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      )}
      
      {error && (
        <div className="text-sm text-danger bg-danger/10 p-4 rounded-xl border border-danger/20 flex items-center gap-2">
          <AlertCircle className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {!loading && periodos.length === 0 && (
        <Card className="border-dashed border-2 border-gray-200 shadow-none">
          <CardContent className="p-12 text-center text-muted-foreground">
            <Calendar size={48} className="mx-auto mb-4 opacity-30 text-primary" />
            <p className="font-bold text-gray-800 text-lg">No hay períodos creados aún.</p>
            <p className="text-sm mt-1 mb-6">
              Comienza creando tu primer período de encuestas y activa las encuestas para tus trabajadores.
            </p>
            <Button
              onClick={() => {
                setEditando(null);
                setModalOpen(true);
              }}
              className="mx-auto animate-bounce"
            >
              + Crear Período
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Listado de Períodos */}
      {!loading && periodos.length > 0 && (
        <div className="flex flex-col gap-4">
          {periodos.map((p) => (
            <TarjetaPeriodo
              key={p.id}
              periodo={p}
              onEdit={() => {
                setEditando(p);
                setModalOpen(true);
              }}
              onDelete={() => setConfirmDeleteId(p.id)}
              onToggle={() => handleToggle(p)}
              onManageGroups={(configId, configNombre) => {
                setGruposModalConfig({ id: configId, name: configNombre });
              }}
            />
          ))}
        </div>
      )}

      {/* Modal Crear / Editar */}
      {modalOpen && (
        <PeriodoModal
          periodo={editando}
          onClose={() => setModalOpen(false)}
          onSaved={cargar}
        />
      )}

      {/* Confirmar Eliminación */}
      {confirmDeleteId && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8 text-center animate-in zoom-in duration-200">
            <div className="w-16 h-16 bg-danger/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-danger/20">
              <Trash2 size={28} className="text-danger" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">¿Eliminar período?</h3>
            <p className="text-xs text-muted-foreground mb-6 leading-relaxed">
              Si este período tiene respuestas registradas de las encuestas o cuestionarios activos,
              no podrá eliminarse. Se recomienda simplemente desactivarlo.
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setConfirmDeleteId(null)}
                className="flex-1 py-2 text-xs font-bold"
              >
                Cancelar
              </Button>
              <Button
                onClick={() => confirmDeleteId && handleDelete(confirmDeleteId)}
                className="flex-1 bg-danger hover:bg-danger/90 text-white font-bold py-2 text-xs"
              >
                Eliminar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Gestión de Grupos */}
      {gruposModalConfig && (
        <GruposModal
          configId={gruposModalConfig.id}
          encuestaNombre={gruposModalConfig.name}
          onClose={() => setGruposModalConfig(null)}
        />
      )}

    </div>
  );
}
