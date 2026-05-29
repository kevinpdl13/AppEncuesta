// ============================================================
// ConfirmDeleteModal — modal de confirmación de eliminación.
// Duplicado en PeriodosPage, PreguntasPage, etc.
// ============================================================

import { Trash2 } from 'lucide-react';
import { Button } from './Button';

export type ConfirmDeleteModalProps = {
  title?: string;
  description?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDeleteModal({
  title = '¿Eliminar elemento?',
  description = 'Esta acción no se puede deshacer.',
  onConfirm,
  onCancel,
}: ConfirmDeleteModalProps) {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8 text-center animate-in zoom-in duration-200">
        <div className="w-16 h-16 bg-danger/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-danger/20">
          <Trash2 size={28} className="text-danger" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
        <p className="text-xs text-muted-foreground mb-6 leading-relaxed">{description}</p>
        <div className="flex gap-3">
          <Button variant="outline" onClick={onCancel} className="flex-1 py-2 text-xs font-bold">
            Cancelar
          </Button>
          <Button onClick={onConfirm} className="flex-1 bg-danger hover:bg-danger/90 text-white font-bold py-2 text-xs">
            Eliminar
          </Button>
        </div>
      </div>
    </div>
  );
}
