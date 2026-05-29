import { useState, useEffect, useCallback } from 'react';
import { api } from '../../lib/api';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { ConfirmDeleteModal } from '../../components/ui/ConfirmDeleteModal';
import {
  Calendar,
  Sparkles,
  AlertCircle,
  Settings
} from 'lucide-react';
import type { Periodo } from '../../types';

// Subcomponents
import { PeriodoModal } from './periodos/PeriodoModal';
import { TarjetaPeriodo } from './periodos/TarjetaPeriodo';
import { GruposModal } from './periodos/GruposModal';

export function PeriodosPage() {
  const [periodos, setPeriodos] = useState<Periodo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editando, setEditando] = useState<Periodo | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Groups modal control
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

      {/* Info Alert */}
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

      {/* States */}
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

      {/* Period List */}
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

      {/* Create / Edit Modal */}
      {modalOpen && (
        <PeriodoModal
          periodo={editando}
          onClose={() => setModalOpen(false)}
          onSaved={cargar}
        />
      )}

      {/* Delete Confirmation Modal */}
      {confirmDeleteId && (
        <ConfirmDeleteModal
          title="¿Eliminar período?"
          description="Si este período tiene respuestas registradas de las encuestas o cuestionarios activos, no podrá eliminarse. Se recomienda simplemente desactivarlo."
          onConfirm={() => handleDelete(confirmDeleteId)}
          onCancel={() => setConfirmDeleteId(null)}
        />
      )}

      {/* Groups Management Modal */}
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
