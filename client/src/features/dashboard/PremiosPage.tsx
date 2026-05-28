import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight, Gift } from 'lucide-react';
import type { Premio } from '../../types';

// Paleta de colores predefinida para la ruleta
const COLORES_PALETA = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444', '#f97316',
  '#eab308', '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6',
];

// ─── Modal de creación / edición ───────────────────────────────────────────
type ModalProps = {
  premio?: Premio | null;
  onSave: () => void;
  onClose: () => void;
};

function PremioModal({ premio, onSave, onClose }: ModalProps) {
  const [nombre, setNombre] = useState(premio?.nombre ?? '');
  const [descripcion, setDescripcion] = useState(premio?.descripcion ?? '');
  const [color, setColor] = useState(premio?.color ?? '#6366f1');
  const [probabilidad, setProbabilidad] = useState(premio?.probabilidad ?? 10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) { setError('El nombre del premio es requerido.'); return; }
    if (probabilidad < 1 || probabilidad > 100) { setError('La probabilidad debe estar entre 1 y 100.'); return; }

    try {
      setLoading(true);
      setError('');
      const payload = {
        nombre: nombre.trim(),
        descripcion: descripcion.trim() || null,
        color,
        probabilidad,
        activo: premio?.activo ?? true,
        orden: premio?.orden ?? 0,
      };
      if (premio) {
        await api.actualizarPremio(premio.id, payload);
      } else {
        await api.crearPremio(payload);
      }
      onSave();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg p-8 animate-in zoom-in duration-200" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-xl font-bold mb-6">{premio ? 'Editar Premio' : 'Nuevo Premio'}</h3>
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label className="text-sm font-semibold text-muted-foreground mb-1.5 block">Nombre del premio</label>
            <Input placeholder="Ej: Vale de Almuerzo" value={nombre} onChange={(e) => setNombre(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-semibold text-muted-foreground mb-1.5 block">Descripción (opcional)</label>
            <Input placeholder="Detalle adicional del premio..." value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
          </div>

          {/* Selector de color */}
          <div>
            <label className="text-sm font-semibold text-muted-foreground mb-2 block">Color en la ruleta</label>
            <div className="flex items-center gap-3 flex-wrap">
              {COLORES_PALETA.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-9 h-9 rounded-full transition-all ${color === c ? 'ring-2 ring-offset-2 ring-foreground scale-110' : 'hover:scale-105'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-9 h-9 rounded-full border border-border cursor-pointer"
                title="Color personalizado"
              />
            </div>
            {/* Preview */}
            <div className="mt-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full shadow-md" style={{ backgroundColor: color }} />
              <span className="text-sm font-semibold" style={{ color }}>{nombre || 'Vista previa'}</span>
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold text-muted-foreground mb-1.5 block">
              Probabilidad relativa ({probabilidad}%)
            </label>
            <input
              type="range"
              min={1}
              max={100}
              value={probabilidad}
              onChange={(e) => setProbabilidad(Number(e.target.value))}
              className="w-full accent-primary"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Define el peso relativo de este premio. Valores más altos = más probable.
            </p>
          </div>

          {error && <p className="text-sm text-danger bg-danger/10 px-3 py-2 rounded-lg">{error}</p>}

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">Cancelar</Button>
            <Button type="submit" disabled={loading} className="flex-1">{loading ? 'Guardando...' : 'Guardar Premio'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Página principal ───────────────────────────────────────────────────────
export function PremiosPage() {
  const [premios, setPremios] = useState<Premio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editando, setEditando] = useState<Premio | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const cargar = async () => {
    try {
      setLoading(true);
      const data = await api.getTodosLosPremios();
      setPremios(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  const handleToggleActivo = async (p: Premio) => {
    try {
      await api.actualizarPremio(p.id, { activo: !p.activo });
      setPremios((prev) => prev.map((x) => x.id === p.id ? { ...x, activo: !p.activo } : x));
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.eliminarPremio(id);
      setPremios((prev) => prev.filter((p) => p.id !== id));
      setConfirmDeleteId(null);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const activos = premios.filter((p) => p.activo);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight">Premios de la Ruleta</h2>
          <p className="text-muted-foreground mt-1">{activos.length} activos · {premios.length} en total</p>
        </div>
        <Button id="nuevo-premio-btn" onClick={() => { setEditando(null); setModalOpen(true); }} className="gap-2">
          <Plus size={18} /> Nuevo Premio
        </Button>
      </div>

      {/* Vista previa de la ruleta */}
      {activos.length >= 2 && (
        <Card className="bg-gradient-to-br from-primary/5 to-violet-50 border-primary/10">
          <CardContent className="p-6">
            <h3 className="font-bold mb-4 text-sm text-muted-foreground uppercase tracking-wider">Vista previa de la ruleta</h3>
            <div className="flex items-center gap-3 flex-wrap">
              {activos.map((p) => (
                <div key={p.id} className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl shadow-sm">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: p.color }} />
                  <span className="text-sm font-semibold">{p.nombre}</span>
                  <span className="text-xs text-muted-foreground">({p.probabilidad}%)</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {activos.length < 2 && !loading && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700">
          ⚠️ La ruleta necesita al menos <strong>2 premios activos</strong> para funcionar.
        </div>
      )}

      {/* Carga / Error / Vacío */}
      {loading && (
        <div className="flex items-center justify-center h-48">
          <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      )}
      {error && <p className="text-danger bg-danger/10 p-4 rounded-xl">{error}</p>}
      {!loading && premios.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            <Gift size={48} className="mx-auto mb-4 opacity-30" />
            <p className="font-semibold">No hay premios registrados.</p>
          </CardContent>
        </Card>
      )}

      {/* Grid de premios */}
      {!loading && premios.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {premios.map((p) => (
            <Card key={p.id} className={`transition-all hover:-translate-y-0.5 ${!p.activo ? 'opacity-60' : ''}`}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl shadow-md" style={{ backgroundColor: p.color }} />
                    <div>
                      <p className="font-bold leading-tight">{p.nombre}</p>
                      <p className="text-xs text-muted-foreground">{p.probabilidad}% de probabilidad</p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${p.activo ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-500'}`}>
                    {p.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </div>

                {p.descripcion && (
                  <p className="text-xs text-muted-foreground mb-4 line-clamp-2">{p.descripcion}</p>
                )}

                <div className="flex items-center gap-2 pt-2 border-t border-border/50">
                  <button onClick={() => handleToggleActivo(p)} className="p-1.5 rounded-lg hover:bg-gray-50 transition-colors">
                    {p.activo ? <ToggleRight size={20} className="text-success" /> : <ToggleLeft size={20} className="text-muted-foreground" />}
                  </button>
                  <button onClick={() => { setEditando(p); setModalOpen(true); }} className="p-1.5 rounded-lg hover:bg-primary/10 text-primary transition-colors">
                    <Pencil size={16} />
                  </button>
                  <button onClick={() => setConfirmDeleteId(p.id)} className="p-1.5 rounded-lg hover:bg-danger/10 text-danger transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal crear/editar */}
      {modalOpen && (
        <PremioModal
          premio={editando}
          onSave={() => { setModalOpen(false); cargar(); }}
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
            <h3 className="text-lg font-bold mb-2">¿Eliminar este premio?</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Si ya fue asignado en alguna encuesta, no podrá eliminarse.
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
