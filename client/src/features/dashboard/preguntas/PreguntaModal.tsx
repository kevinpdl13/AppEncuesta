import { useState, useEffect, useCallback } from 'react';
import { api } from '../../../lib/api';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import type { Pregunta, Periodo, EncuestaConfig, Grupo, SubGrupo } from '../../../types';

type PreguntaModalProps = {
  pregunta?: Pregunta | null;
  periodos: Periodo[];
  defaultPeriodoId?: string;
  defaultConfigId?: string;
  onSave: () => void;
  onClose: () => void;
};

export function PreguntaModal({
  pregunta,
  periodos,
  defaultPeriodoId,
  defaultConfigId,
  onSave,
  onClose
}: PreguntaModalProps) {
  const [periodoId, setPeriodoId] = useState(pregunta ? '' : (defaultPeriodoId ?? ''));
  const [configId, setConfigId] = useState(pregunta?.encuestaConfigId ?? (defaultConfigId ?? ''));
  const [grupoId, setGrupoId] = useState(pregunta?.grupoId ?? '');
  const [subGrupoId, setSubGrupoId] = useState(pregunta?.subGrupoId ?? '');
  const [enunciado, setEnunciado] = useState(pregunta?.enunciado ?? '');
  const [tipoPregunta, setTipoPregunta] = useState<'VERDADERO_FALSO' | 'LIKERT_3'>(pregunta?.tipoPregunta ?? 'VERDADERO_FALSO');
  const [respuestaCorrecta, setRespuestaCorrecta] = useState<boolean>(pregunta?.respuesta_correcta ?? true);
  const [puntos, setPuntos] = useState(pregunta?.puntos ?? 10);
  
  const [configs, setConfigs] = useState<EncuestaConfig[]>([]);
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [subGrupos, setSubGrupos] = useState<SubGrupo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const activeConfigId = pregunta?.encuestaConfigId ?? defaultConfigId;
    if (activeConfigId && periodos.length > 0) {
      const periodoEncontrado = periodos.find(p => 
        p.encuestaConfigs?.some(c => c.id === activeConfigId)
      );
      if (periodoEncontrado) {
        setPeriodoId(periodoEncontrado.id);
        setConfigs(periodoEncontrado.encuestaConfigs ?? []);
      }
    } else if (defaultPeriodoId && periodos.length > 0) {
      setPeriodoId(defaultPeriodoId);
      const p = periodos.find(x => x.id === defaultPeriodoId);
      setConfigs(p?.encuestaConfigs ?? []);
    }
  }, [pregunta, periodos, defaultPeriodoId, defaultConfigId]);

  const handlePeriodoChange = (pId: string) => {
    setPeriodoId(pId);
    setConfigId('');
    setGrupoId('');
    setSubGrupoId('');
    const p = periodos.find(x => x.id === pId);
    setConfigs(p?.encuestaConfigs ?? []);
    setGrupos([]);
    setSubGrupos([]);
  };

  const handleConfigChange = useCallback(async (cId: string) => {
    setConfigId(cId);
    setGrupoId('');
    setSubGrupoId('');
    setGrupos([]);
    setSubGrupos([]);

    if (!cId) return;

    const selectedConfig = configs.find(c => c.id === cId);
    if (selectedConfig) {
      if (selectedConfig.tipo === 'ANONIMA') {
        setTipoPregunta('LIKERT_3');
      } else {
        setTipoPregunta('VERDADERO_FALSO');
      }
    }

    try {
      const dataGrupos = await api.getGruposPorConfig(cId);
      setGrupos(dataGrupos);
    } catch (err) {
      console.error('Error al cargar grupos:', err);
    }
  }, [configs]);

  useEffect(() => {
    if (configId && configs.length > 0) {
      handleConfigChange(configId);
    }
  }, [configId, configs, handleConfigChange]);

  const handleGrupoChange = (gId: string) => {
    setGrupoId(gId);
    setSubGrupoId('');
    const g = grupos.find(x => x.id === gId);
    setSubGrupos(g?.subGrupos ?? []);
  };

  useEffect(() => {
    if (grupoId && grupos.length > 0) {
      const g = grupos.find(x => x.id === grupoId);
      setSubGrupos(g?.subGrupos ?? []);
    }
  }, [grupoId, grupos]);

  const selectedConfig = configs.find(c => c.id === configId);
  const esAnonima = selectedConfig?.tipo === 'ANONIMA';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!configId) { setError('Debes seleccionar una encuesta del período.'); return; }
    if (!enunciado.trim()) { setError('El enunciado de la pregunta no puede estar vacío.'); return; }
    if (esAnonima && !grupoId) { setError('Las encuestas anónimas requieren seleccionar un grupo.'); return; }

    try {
      setLoading(true);
      setError('');
      
      const payload = {
        encuestaConfigId: configId,
        enunciado: enunciado.trim(),
        tipoPregunta,
        respuestaCorrecta: tipoPregunta === 'VERDADERO_FALSO' ? respuestaCorrecta : null,
        respuesta_correcta: tipoPregunta === 'VERDADERO_FALSO' ? respuestaCorrecta : null,
        puntos: tipoPregunta === 'VERDADERO_FALSO' ? puntos : 0,
        grupoId: grupoId || null,
        subGrupoId: subGrupoId || null,
        activo: pregunta?.activo ?? true,
        orden: pregunta?.orden ?? 0
      };

      if (pregunta) {
        await api.actualizarPregunta(pregunta.id, payload);
      } else {
        await api.crearPregunta(payload);
      }
      onSave();
    } catch (err: any) {
      setError(err.message || 'Error al guardar la pregunta.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg p-8 animate-in zoom-in duration-200 overflow-y-auto max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-xl font-bold mb-6">{pregunta ? 'Editar Pregunta' : 'Nueva Pregunta'}</h3>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          
          {!defaultPeriodoId || !defaultConfigId ? (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block uppercase">Período</label>
                <select
                  value={periodoId}
                  onChange={(e) => handlePeriodoChange(e.target.value)}
                  className="w-full border border-border rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white font-medium"
                >
                  <option value="">— Elegir Período —</option>
                  {periodos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block uppercase">Encuesta</label>
                <select
                  value={configId}
                  onChange={(e) => handleConfigChange(e.target.value)}
                  disabled={!periodoId}
                  className="w-full border border-border rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white font-medium"
                >
                  <option value="">— Elegir Encuesta —</option>
                  {configs.map(c => <option key={c.id} value={c.id}>{c.nombre} ({c.tipo})</option>)}
                </select>
              </div>
            </div>
          ) : (
            <div className="bg-primary/5 border border-primary/10 rounded-2xl p-4 text-xs text-primary flex items-start gap-2 shadow-sm font-semibold leading-relaxed">
              <span className="shrink-0 text-base">📋</span>
              <div>
                Añadiendo pregunta a la encuesta:{' '}
                <strong className="text-gray-900">{selectedConfig?.nombre || '—'}</strong> ({selectedConfig?.tipo}){' '}
                del período:{' '}
                <strong className="text-gray-900">
                  {periodos.find((p) => p.id === periodoId)?.nombre || '—'}
                </strong>
              </div>
            </div>
          )}

          {esAnonima && (
            <div className="grid grid-cols-2 gap-3 bg-purple-50/50 p-3 rounded-xl border border-purple-100">
              <div>
                <label className="text-xs font-semibold text-purple-700 mb-1 block uppercase">Grupo *</label>
                <select
                  value={grupoId}
                  onChange={(e) => handleGrupoChange(e.target.value)}
                  className="w-full border border-purple-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-purple-300 bg-white font-medium"
                >
                  <option value="">— Elegir Grupo —</option>
                  {grupos.map(g => <option key={g.id} value={g.id}>{g.nombre}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-purple-700 mb-1 block uppercase">Sub-grupo</label>
                <select
                  value={subGrupoId}
                  onChange={(e) => setSubGrupoId(e.target.value)}
                  disabled={!grupoId}
                  className="w-full border border-purple-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-purple-300 bg-white font-medium"
                >
                  <option value="">— Elegir Subgrupo —</option>
                  {subGrupos.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                </select>
              </div>
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1 block uppercase">Enunciado de la pregunta</label>
            <textarea
              className="w-full border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none font-medium text-gray-800"
              rows={3}
              placeholder="Escribe la afirmación o pregunta..."
              value={enunciado}
              onChange={(e) => setEnunciado(e.target.value)}
            />
          </div>

          {!esAnonima && configId && (
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase">Tipo de respuesta</label>
              <div className="grid grid-cols-2 gap-2">
                {(['VERDADERO_FALSO', 'LIKERT_3'] as const).map(tipo => (
                  <button key={tipo} type="button" onClick={() => setTipoPregunta(tipo)}
                    className={`py-2.5 rounded-xl border-2 text-xs font-bold transition-all ${tipoPregunta === tipo ? 'border-primary bg-primary/5 text-primary' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                    {tipo === 'VERDADERO_FALSO' ? '✓/✗ Verdadero o Falso' : '📊 Escala Likert 1-3'}
                  </button>
                ))}
              </div>
            </div>
          )}

          {tipoPregunta === 'VERDADERO_FALSO' && !esAnonima && configId && (
            <div className="grid grid-cols-2 gap-3 bg-blue-50/30 p-3 rounded-xl border border-blue-100/50">
              <div>
                <label className="text-xs font-semibold text-blue-700 mb-2 block uppercase">Respuesta correcta</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setRespuestaCorrecta(true)}
                    className={`flex-1 py-2 rounded-lg font-bold text-xs border transition-all ${
                      respuestaCorrecta ? 'bg-success text-white border-success' : 'bg-white text-muted-foreground border-gray-200'
                    }`}
                  >
                    ✓ Verdadero
                  </button>
                  <button
                    type="button"
                    onClick={() => setRespuestaCorrecta(false)}
                    className={`flex-1 py-2 rounded-lg font-bold text-xs border transition-all ${
                      !respuestaCorrecta ? 'bg-danger text-white border-danger' : 'bg-white text-muted-foreground border-gray-200'
                    }`}
                  >
                    ✗ Falso
                  </button>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-blue-700 mb-1.5 block uppercase">Puntos correctos</label>
                <Input type="number" min={1} max={100} value={puntos} onChange={(e) => setPuntos(Number(e.target.value))} />
              </div>
            </div>
          )}

          {esAnonima && (
            <div className="text-xs font-semibold text-purple-700 bg-purple-50 rounded-xl px-4 py-2.5 border border-purple-100 flex items-center gap-2">
              <span>🔒 Las preguntas anónimas se responden con la **Escala de Likert** (Nunca/A veces/Siempre).</span>
            </div>
          )}

          {error && <p className="text-sm text-danger bg-danger/10 px-3 py-2 rounded-lg">{error}</p>}

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">Cancelar</Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? 'Guardando...' : 'Guardar Pregunta'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
