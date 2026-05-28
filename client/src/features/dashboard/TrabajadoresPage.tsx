import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Pagination } from '../../components/ui/Pagination';
import { usePagination } from '../../hooks/usePagination';
import { Plus, Pencil, ToggleLeft, ToggleRight, UserCheck } from 'lucide-react';
import type { Trabajador, Area } from '../../types';

const PAGE_SIZE = 10;

// ─── Modal de creación / edición ───────────────────────────────────────────
type ModalProps = {
  trabajador?: Trabajador | null;
  onSave: () => void;
  onClose: () => void;
};

function TrabajadorModal({ trabajador, onSave, onClose }: ModalProps) {
  const [cedula, setCedula] = useState(trabajador?.cedula ?? '');
  const [nombres, setNombres] = useState(trabajador?.nombres ?? '');
  const [apellidos, setApellidos] = useState(trabajador?.apellidos ?? '');
  const [areaId, setAreaId] = useState(trabajador?.areaId ?? '');
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getAreasActivas()
      .then(setAreas)
      .catch((err) => console.error('Error al cargar áreas:', err));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Validaciones con Early Return
    if (!/^\d{10}$/.test(cedula)) { setError('La cédula debe tener exactamente 10 dígitos numéricos.'); return; }
    if (!nombres.trim()) { setError('El nombre es requerido.'); return; }
    if (!apellidos.trim()) { setError('El apellido es requerido.'); return; }
    if (!areaId) { setError('Debes seleccionar un área del maestro.'); return; }

    const areaSeleccionada = areas.find(a => a.id === areaId);
    const areaNombre = areaSeleccionada ? areaSeleccionada.nombre : 'Sin asignar';

    try {
      setLoading(true);
      setError('');
      const payload = {
        cedula: cedula.trim(),
        nombres: nombres.trim(),
        apellidos: apellidos.trim(),
        areaId,
        area: areaNombre,
        activo: trabajador?.activo ?? true
      };
      if (trabajador) {
        await api.actualizarTrabajador(trabajador.id, payload);
      } else {
        await api.crearTrabajador(payload);
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
        <h3 className="text-xl font-bold mb-6">{trabajador ? 'Editar Trabajador' : 'Registrar Trabajador'}</h3>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-sm font-semibold text-muted-foreground mb-1.5 block">Cédula de identidad</label>
            <Input
              type="text"
              placeholder="10 dígitos"
              value={cedula}
              onChange={(e) => setCedula(e.target.value)}
              maxLength={10}
              disabled={!!trabajador} // No permitir cambiar la cédula si está editando
            />
            {trabajador && <p className="text-xs text-muted-foreground mt-1">La cédula no puede modificarse.</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold text-muted-foreground mb-1.5 block">Nombres</label>
              <Input placeholder="Juan Carlos" value={nombres} onChange={(e) => setNombres(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-semibold text-muted-foreground mb-1.5 block">Apellidos</label>
              <Input placeholder="Pérez López" value={apellidos} onChange={(e) => setApellidos(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="text-sm font-semibold text-muted-foreground mb-1.5 block">Área</label>
            <select
              value={areaId}
              onChange={(e) => setAreaId(e.target.value)}
              className="w-full border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white font-medium"
            >
              <option value="">— Selecciona un área del maestro —</option>
              {areas.map((a) => <option key={a.id} value={a.id}>{a.nombre}</option>)}
            </select>
          </div>

          {error && <p className="text-sm text-danger bg-danger/10 px-3 py-2 rounded-lg">{error}</p>}

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">Cancelar</Button>
            <Button type="submit" disabled={loading} className="flex-1">{loading ? 'Guardando...' : 'Guardar'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Página principal ───────────────────────────────────────────────────────
export function TrabajadoresPage() {
  const [trabajadores, setTrabajadores] = useState<Trabajador[]>([]);
  const [filtro, setFiltro] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editando, setEditando] = useState<Trabajador | null>(null);

  const cargar = async () => {
    try {
      setLoading(true);
      const data = await api.getTrabajadores();
      setTrabajadores(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  const filtrados = trabajadores.filter((t) => {
    const q = filtro.toLowerCase();
    return (
      t.cedula.includes(q) ||
      t.nombres.toLowerCase().includes(q) ||
      t.apellidos.toLowerCase().includes(q) ||
      t.area.toLowerCase().includes(q)
    );
  });

  const handleFiltroChange = (valor: string) => {
    setFiltro(valor);
  };

  const { paginaActual, setPaginaActual, totalPaginas, inicio, itemsPagina: trabajadoresPagina } = usePagination(filtrados, PAGE_SIZE);

  const handleToggleActivo = async (t: Trabajador) => {
    try {
      await api.actualizarTrabajador(t.id, { activo: !t.activo });
      setTrabajadores((prev) => prev.map((w) => w.id === t.id ? { ...w, activo: !t.activo } : w));
    } catch (err: any) {
      alert(err.message);
    }
  };

  const activos = trabajadores.filter((t) => t.activo).length;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight">Trabajadores</h2>
          <p className="text-muted-foreground mt-1">{activos} activos · {trabajadores.length} registrados</p>
        </div>
        <Button id="nuevo-trabajador-btn" onClick={() => { setEditando(null); setModalOpen(true); }} className="gap-2">
          <Plus size={18} /> Registrar Trabajador
        </Button>
      </div>

      {/* Buscador */}
      <Input
        id="buscar-trabajador-input"
        placeholder="Buscar por cédula, nombre, apellido o área..."
        value={filtro}
        onChange={(e) => handleFiltroChange(e.target.value)}
        className="max-w-md"
      />

      {/* Loading / Error / Vacío */}
      {loading && (
        <div className="flex items-center justify-center h-48">
          <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      )}
      {error && <p className="text-danger bg-danger/10 p-4 rounded-xl">{error}</p>}
      {!loading && filtrados.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            <UserCheck size={48} className="mx-auto mb-4 opacity-30" />
            <p className="font-semibold">{filtro ? 'No se encontraron resultados.' : 'No hay trabajadores registrados.'}</p>
          </CardContent>
        </Card>
      )}

      {/* Tabla */}
      {!loading && filtrados.length > 0 && (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-4 sm:px-6 py-4 font-semibold text-muted-foreground">Cédula</th>
                  <th className="text-left px-4 sm:px-6 py-4 font-semibold text-muted-foreground">Nombre</th>
                  <th className="text-left px-4 sm:px-6 py-4 font-semibold text-muted-foreground hidden sm:table-cell">Área</th>
                  <th className="text-left px-4 sm:px-6 py-4 font-semibold text-muted-foreground hidden md:table-cell">Estado</th>
                  <th className="text-right px-4 sm:px-6 py-4 font-semibold text-muted-foreground">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {trabajadoresPagina.map((t, idx) => (
                  <tr key={t.id} className={`border-b border-border/50 hover:bg-gray-50 transition-colors ${idx % 2 === 0 ? '' : 'bg-gray-50/30'}`}>
                    <td className="px-4 sm:px-6 py-4 font-mono text-sm text-muted-foreground">{t.cedula}</td>
                    <td className="px-4 sm:px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                          {t.nombres.charAt(0)}{t.apellidos.charAt(0)}
                        </div>
                        <div>
                          <span className="font-semibold">{t.nombres} {t.apellidos}</span>
                          <div className="sm:hidden mt-0.5">
                            <span className="bg-primary/5 text-primary text-[10px] font-semibold px-1.5 py-0.5 rounded-full">{t.area}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-4 hidden sm:table-cell">
                      <span className="bg-primary/5 text-primary text-xs font-semibold px-2 py-1 rounded-full">{t.area}</span>
                    </td>
                    <td className="px-4 sm:px-6 py-4 hidden md:table-cell">
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${t.activo ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-500'}`}>
                        {t.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-4 sm:px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => handleToggleActivo(t)} title={t.activo ? 'Desactivar' : 'Activar'} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                          {t.activo ? <ToggleRight size={20} className="text-success" /> : <ToggleLeft size={20} className="text-muted-foreground" />}
                        </button>
                        <button onClick={() => { setEditando(t); setModalOpen(true); }} className="p-1.5 rounded-lg hover:bg-primary/10 text-primary transition-colors">
                          <Pencil size={16} />
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
            totalItems={filtrados.length}
            pageSize={PAGE_SIZE}
            label="trabajadores"
            onPageChange={setPaginaActual}
          />
        </Card>
      )}

      {/* Modal */}
      {modalOpen && (
        <TrabajadorModal
          trabajador={editando}
          onSave={() => { setModalOpen(false); cargar(); }}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  );
}
