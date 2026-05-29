// ============================================================
// EmptyState — estado vacío/sin datos reutilizable.
// ============================================================

import type { ReactNode } from 'react';

export type EmptyStateProps = {
  icon?: ReactNode;
  title: string;
  description?: string;
};

export function EmptyState({ icon, title, description }: EmptyStateProps) {
  return (
    <div className="text-center py-16 text-muted-foreground">
      {icon && <div className="text-4xl mb-3">{icon}</div>}
      <p className="font-semibold">{title}</p>
      {description && <p className="text-sm mt-1">{description}</p>}
    </div>
  );
}
