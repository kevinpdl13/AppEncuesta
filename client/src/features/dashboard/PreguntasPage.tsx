import { useState, useEffect, useCallback } from 'react';
import { api } from '../../lib/api';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Pagination } from '../../components/ui/Pagination';
import { usePagination } from '../../hooks/usePagination';
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight, CheckCircle, XCircle, HelpCircle } from 'lucide-react';
import type { Pregunta, Periodo, EncuestaConfig, Grupo, SubGrupo } from '../../types';

const PAGE_SIZE = 8;

// ─── Modal de creación / edición de Pregunta ────────────────────────────────
type ModalProps = {
  pregunta?: Pregunta | null;
  periodos: Periodo[];
  defaultPeriodoId?: string;
  defaultConfigId?: string;
  onSave: () => void;
  onClose: () => void;
};

function PreguntaModal({ pregunta, periodos, defaultPeriodoId, defaultConfigId, onSave, onClose }: ModalProps) {
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

  // 1. Cargar período inicial si está editando o hay valor predeterminado
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

  // 2. Al cambiar período, actualizar configs
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

  // 3. Al cambiar config (encuesta), cargar grupos y forzar tipos de pregunta
  const handleConfigChange = useCallback(async (cId: string) => {
    setConfigId(cId);
    setGrupoId('');
    setSubGrupoId('');
    setGrupos([]);
    setSubGrupos([]);

    if (!cId) return;

    // Buscar el tipo de encuesta seleccionado
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

  // 4. Al cambiar grupo, actualizar subgrupos
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
          
          {/* Fila: Período y Encuesta */}
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

          {/* Si es ANÓNIMA: Cargar Grupo y Subgrupo */}
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

          {/* Enunciado */}
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

          {/* Tipo de Pregunta (Solo configurable para Nominal) */}
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

          {/* Configuración adicional para Verdadero/Falso (Nominal) */}
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

          {/* Mostrar tipo fijo en Anónima */}
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

// ─── Página principal: PreguntasPage ─────────────────────────────────────────
export function PreguntasPage() {
  const [periodos, setPeriodos] = useState<Periodo[]>([]);
  const [periodoSel, setPeriodoSel] = useState<string>('');
  const [configs, setConfigs] = useState<EncuestaConfig[]>([]);
  const [configSel, setConfigSel] = useState<string>('');
  const [preguntas, setPreguntas] = useState<Pregunta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [modalOpen, setModalOpen] = useState(false);
  const [editando, setEditando] = useState<Pregunta | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // 1. Cargar períodos al inicio
  useEffect(() => {
    const cargarPeriodos = async () => {
      try {
        setLoading(true);
        const data = await api.getPeriodos();
        setPeriodos(data);
        // Preseleccionar el vigente si existe
        const vigente = data.find(p => p.vigente);
        if (vigente) {
          setPeriodoSel(vigente.id);
        } else if (data.length > 0) {
          setPeriodoSel(data[0].id);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    cargarPeriodos();
  }, []);

  // 2. Al cambiar período, actualizar configs disponibles
  useEffect(() => {
    if (!periodoSel) {
      setConfigs([]);
      setConfigSel('');
      return;
    }
    const p = periodos.find(x => x.id === periodoSel);
    const encuestas = p?.encuestaConfigs ?? [];
    setConfigs(encuestas);
    if (encuestas.length > 0) {
      setConfigSel(encuestas[0].id);
    } else {
      setConfigSel('');
    }
  }, [periodoSel, periodos]);

  // 3. Cargar preguntas de la config seleccionada
  const cargarPreguntas = useCallback(async () => {
    if (!configSel) {
      setPreguntas([]);
      return;
    }
    try {
      setLoading(true);
      setError('');
      const data = await api.getTodasLasPreguntas({ encuesta_config_id: configSel });
      setPreguntas(data);
    } catch (err: any) {
      setError(err.message || 'Error al cargar las preguntas.');
    } finally {
      setLoading(false);
    }
  }, [configSel]);

  useEffect(() => {
    cargarPreguntas();
  }, [cargarPreguntas]);

  const handleToggleActivo = async (p: Pregunta) => {
    try {
      await api.actualizarPregunta(p.id, { activo: !p.activo });
      setPreguntas((prev) => prev.map((q) => q.id === p.id ? { ...q, activo: !p.activo } : q));
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.eliminarPregunta(id);
      setPreguntas((prev) => prev.filter((q) => q.id !== id));
      setConfirmDeleteId(null);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const { paginaActual, setPaginaActual, totalPaginas, inicio, itemsPagina: preguntasPagina } = usePagination(preguntas, PAGE_SIZE);

  const selectedConfig = configs.find(c => c.id === configSel);
  const esAnonima = selectedConfig?.tipo === 'ANONIMA';

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight">Banco de Preguntas</h2>
          <p className="text-muted-foreground mt-1">
            {preguntas.length} preguntas configuradas en este período.
          </p>
        </div>
        <Button onClick={() => { setEditando(null); setModalOpen(true); }} className="gap-2" disabled={configs.length === 0}>
          <Plus size={18} /> Nueva Pregunta
        </Button>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="text-xs font-semibold text-gray-600 mb-1 block uppercase">Período</label>
          <select className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 font-semibold bg-white"
            value={periodoSel} onChange={e => setPeriodoSel(e.target.value)}>
            {periodos.map(p => <option key={p.id} value={p.id}>{p.nombre} {p.vigente ? '🟢' : ''}</option>)}
          </select>
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="text-xs font-semibold text-gray-600 mb-1 block uppercase">Encuesta</label>
          <select className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 font-semibold bg-white"
            value={configSel} onChange={e => setConfigSel(e.target.value)} disabled={configs.length === 0}>
            {configs.length === 0 ? (
              <option value="">— Sin encuestas activas —</option>
            ) : (
              configs.map(c => <option key={c.id} value={c.id}>{c.nombre} ({c.tipo})</option>)
            )}
          </select>
        </div>
      </div>

      {/* Loading / Error */}
      {loading && (
        <div className="flex items-center justify-center h-48">
          <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      )}
      {error && <p className="text-danger bg-danger/10 p-4 rounded-xl">{error}</p>}

      {/* Vacío */}
      {!loading && (periodos.length === 0 || configs.length === 0) && (
        <Card>
          <CardContent className="p-8 text-center text-amber-700 bg-amber-50">
            <p className="font-bold mb-1">⚠️ No hay encuestas o períodos creados.</p>
            <p className="text-sm">Ve al módulo de <strong>Períodos</strong>, activa uno y añade al menos una encuesta (anónima o nominal) para poder crear preguntas aquí.</p>
          </CardContent>
        </Card>
      )}

      {!loading && periodos.length > 0 && configs.length > 0 && preguntas.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            <HelpCircle className="mx-auto mb-4 opacity-30" size={48} />
            <p className="font-semibold">No hay preguntas agregadas a esta encuesta.</p>
            <p className="text-sm mt-1">Presiona "Nueva Pregunta" arriba para comenzar a poblar el cuestionario.</p>
          </CardContent>
        </Card>
      )}

      {/* Listado de Preguntas */}
      {!loading && preguntas.length > 0 && (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-gray-50/50">
                  <th className="text-left px-6 py-4 font-semibold text-muted-foreground w-12">Orden</th>
                  <th className="text-left px-6 py-4 font-semibold text-muted-foreground">Enunciado</th>
                  <th className="text-center px-6 py-4 font-semibold text-muted-foreground w-28">Tipo</th>
                  {esAnonima ? (
                    <>
                      <th className="text-left px-6 py-4 font-semibold text-muted-foreground w-40">Grupo</th>
                      <th className="text-left px-6 py-4 font-semibold text-muted-foreground w-40">Subgrupo</th>
                    </>
                  ) : (
                    <>
                      <th className="text-center px-6 py-4 font-semibold text-muted-foreground w-28">Correcta</th>
                      <th className="text-center px-6 py-4 font-semibold text-muted-foreground w-20">Pts</th>
                    </>
                  )}
                  <th className="text-right px-6 py-4 font-semibold text-muted-foreground w-32">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50 bg-white">
                {preguntasPagina.map((p, idx) => (
                  <tr key={p.id} className={`hover:bg-gray-50/50 transition-colors ${p.activo ? '' : 'opacity-60'}`}>
                    <td className="px-6 py-4 font-mono font-medium text-muted-foreground">{idx + 1 + inicio}</td>
                    <td className="px-6 py-4 font-semibold text-gray-800 leading-snug">{p.enunciado}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        p.tipoPregunta === 'VERDADERO_FALSO' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                      }`}>
                        {p.tipoPregunta === 'VERDADERO_FALSO' ? 'V/F' : 'Likert'}
                      </span>
                    </td>
                    
                    {esAnonima ? (
                      <>
                        <td className="px-6 py-4 text-xs font-bold text-gray-600 truncate max-w-[150px]">
                          {p.grupo?.nombre ?? '—'}
                        </td>
                        <td className="px-6 py-4 text-xs text-muted-foreground truncate max-w-[150px]">
                          {p.subGrupo?.nombre ?? '—'}
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-6 py-4 text-center">
                          {p.tipoPregunta === 'VERDADERO_FALSO' ? (
                            <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
                              p.respuesta_correcta ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'
                            }`}>
                              {p.respuesta_correcta ? <CheckCircle size={11} /> : <XCircle size={11} />}
                              {p.respuesta_correcta ? 'Verdadero' : 'Falso'}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center font-bold text-primary">
                          {p.tipoPregunta === 'VERDADERO_FALSO' ? p.puntos : '—'}
                        </td>
                      </>
                    )}

                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => handleToggleActivo(p)} title={p.activo ? 'Desactivar' : 'Activar'} className="p-2 rounded-xl hover:bg-gray-50 transition-colors">
                          {p.activo ? <ToggleRight size={22} className="text-success" /> : <ToggleLeft size={22} className="text-muted-foreground" />}
                        </button>
                        <button onClick={() => { setEditando(p); setModalOpen(true); }} className="p-2 rounded-xl hover:bg-primary/5 text-primary transition-colors">
                          <Pencil size={18} />
                        </button>
                        <button onClick={() => setConfirmDeleteId(p.id)} className="p-2 rounded-xl hover:bg-danger/10 text-danger transition-colors">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination
            paginaActual={paginaActual}
            totalPaginas={totalPaginas}
            inicio={inicio}
            totalItems={preguntas.length}
            pageSize={PAGE_SIZE}
            label="preguntas"
            onPageChange={setPaginaActual}
          />
        </Card>
      )}

      {/* Modal Crear/Editar */}
      {modalOpen && (
        <PreguntaModal
          pregunta={editando}
          periodos={periodos}
          defaultPeriodoId={periodoSel}
          defaultConfigId={configSel}
          onSave={() => { setModalOpen(false); cargarPreguntas(); }}
          onClose={() => setModalOpen(false)}
        />
      )}

      {/* Confirmar eliminación */}
      {confirmDeleteId && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8 text-center animate-in zoom-in duration-200">
            <div className="w-16 h-16 bg-danger/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 size={28} className="text-danger" />
            </div>
            <h3 className="text-lg font-bold mb-2">¿Eliminar pregunta?</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Si la pregunta tiene respuestas registradas en encuestas de los empleados, no podrá eliminarse.
            </p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setConfirmDeleteId(null)} className="flex-1">Cancelar</Button>
              <Button onClick={() => handleDelete(confirmDeleteId)} className="flex-1 bg-danger hover:bg-danger/90">Eliminar</Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
