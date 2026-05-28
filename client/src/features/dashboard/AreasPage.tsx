import { useState, useEffect, useCallback } from 'react';
import { api } from '../../lib/api';
import type { Area } from '../../types';

export function AreasPage() {
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState<Area | null>(null);
  const [form, setForm] = useState({ nombre: '', descripcion: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const cargar = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.getAreas();
      setAreas(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const abrirNuevo = () => {
    setEditando(null);
    setForm({ nombre: '', descripcion: '' });
    setError('');
    setShowForm(true);
  };

  const abrirEditar = (area: Area) => {
    setEditando(area);
    setForm({ nombre: area.nombre, descripcion: area.descripcion ?? '' });
    setError('');
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nombre.trim()) { setError('El nombre es obligatorio.'); return; }
    try {
      setSaving(true);
      setError('');
      if (editando) {
        await api.actualizarArea(editando.id, { nombre: form.nombre.trim(), descripcion: form.descripcion || undefined });
      } else {
        await api.crearArea({ nombre: form.nombre.trim(), descripcion: form.descripcion || undefined });
      }
      setShowForm(false);
      await cargar();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (area: Area) => {
    try { await api.actualizarArea(area.id, { activo: !area.activo }); await cargar(); } catch (e: any) { alert(e.message); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta área?')) return;
    try { await api.eliminarArea(id); await cargar(); } catch (e: any) { alert(e.message); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Áreas de la Empresa</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Departamentos o secciones para clasificar trabajadores.</p>
        </div>
        <button onClick={abrirNuevo} className="bg-primary text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-primary/90 transition shadow-sm">
          + Nueva Área
        </button>
      </div>

      {/* Formulario inline */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6 animate-in slide-in-from-top duration-200">
          <h3 className="font-bold mb-4 text-gray-800">{editando ? 'Editar Área' : 'Nueva Área'}</h3>
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Nombre *</label>
                <input className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder="Ej: Producción, Calidad, RRHH"
                  value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Descripción</label>
                <input className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder="Descripción opcional"
                  value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))} />
              </div>
            </div>
            {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
            <div className="flex gap-3">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium hover:bg-gray-50 transition">Cancelar</button>
              <button type="submit" disabled={saving} className="px-6 py-2 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary/90 transition disabled:opacity-60">
                {saving ? 'Guardando...' : editando ? 'Actualizar' : 'Crear'}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      ) : areas.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
          <p className="text-4xl mb-3">🏢</p>
          <p className="font-semibold text-gray-700">Sin áreas registradas</p>
          <p className="text-sm text-muted-foreground mt-1">Crea las áreas para poder asignar trabajadores.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wide">
              <tr>
                <th className="text-left px-5 py-3">Área</th>
                <th className="text-left px-5 py-3 hidden sm:table-cell">Descripción</th>
                <th className="text-center px-5 py-3">Estado</th>
                <th className="text-right px-5 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {areas.map(area => (
                <tr key={area.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-3.5 font-semibold text-gray-900">{area.nombre}</td>
                  <td className="px-5 py-3.5 text-muted-foreground hidden sm:table-cell">{area.descripcion ?? '—'}</td>
                  <td className="px-5 py-3.5 text-center">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${area.activo ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                      {area.activo ? 'Activa' : 'Inactiva'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => abrirEditar(area)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-primary transition" title="Editar">✏️</button>
                      <button onClick={() => handleToggle(area)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-amber-500 transition" title={area.activo ? 'Desactivar' : 'Activar'}>
                        {area.activo ? '🔒' : '🔓'}
                      </button>
                      <button onClick={() => handleDelete(area.id)} className="p-2 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500 transition" title="Eliminar">🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
