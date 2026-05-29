import { useState, useEffect, useCallback } from 'react';
import { Folder, FolderOpen, Pencil, Trash2, X } from 'lucide-react';
import { api } from '../../../lib/api';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';

type GruposModalProps = {
  configId: string;
  encuestaNombre: string;
  onClose: () => void;
};

export function GruposModal({ configId, encuestaNombre, onClose }: GruposModalProps) {
  const [grupos, setGrupos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [nuevoGrupoNombre, setNuevoGrupoNombre] = useState('');
  const [creandoGrupo, setCreandoGrupo] = useState(false);

  const [editandoGrupoId, setEditandoGrupoId] = useState<string | null>(null);
  const [editandoGrupoNombre, setEditandoGrupoNombre] = useState('');

  const [editandoSubId, setEditandoSubId] = useState<string | null>(null);
  const [editandoSubNombre, setEditandoSubNombre] = useState('');

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
      alert(err.message || 'No se pudo eliminar the group.');
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

                <div className="bg-gray-50/50 rounded-xl p-3.5 border border-gray-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
                      Subgrupos ({grupo.subGrupos?.length ?? 0})
                    </span>
                  </div>

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
