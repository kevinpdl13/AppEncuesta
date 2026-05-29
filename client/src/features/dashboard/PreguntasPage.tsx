import { useState, useEffect, useCallback } from 'react';
import { api } from '../../lib/api';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Pagination } from '../../components/ui/Pagination';
import { ConfirmDeleteModal } from '../../components/ui/ConfirmDeleteModal';
import { usePagination } from '../../hooks/usePagination';
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight, CheckCircle, XCircle, HelpCircle } from 'lucide-react';
import type { Pregunta, Periodo, EncuestaConfig } from '../../types';

// Subcomponents
import { PreguntaModal } from './preguntas/PreguntaModal';

const PAGE_SIZE = 8;

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
        <ConfirmDeleteModal
          title="¿Eliminar pregunta?"
          description="Si la pregunta tiene respuestas registradas en encuestas de los empleados, no podrá eliminarse."
          onConfirm={() => handleDelete(confirmDeleteId)}
          onCancel={() => setConfirmDeleteId(null)}
        />
      )}

    </div>
  );
}
