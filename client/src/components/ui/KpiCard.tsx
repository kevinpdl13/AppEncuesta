// ============================================================
// KpiCard — tarjeta KPI reutilizable (Power BI style).
// Reemplaza las 2 copias idénticas en ReportesV2Page y EvaluacionesPage.
// ============================================================

import type { ReactNode } from 'react';

export type KpiCardProps = {
  label: string;
  value: string | number;
  sub?: string;
  color: string;
  icon?: ReactNode;
};

export function KpiCard({ label, value, sub, color, icon }: KpiCardProps) {
  return (
    <div className="rounded-2xl p-5 bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all duration-350 flex items-center justify-between group overflow-hidden relative">
      <div className="relative z-10">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{label}</p>
        <p className={`text-3xl font-black mt-2 ${color} tracking-tight`}>{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-1 font-medium">{sub}</p>}
      </div>
      {icon && (
        <div className="p-3 rounded-xl bg-gray-50 group-hover:bg-gray-100/80 transition-colors duration-350 text-gray-400 shrink-0 relative z-10">
          {icon}
        </div>
      )}
      {/* Dynamic Background subtle micro-animation glow */}
      <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-gradient-to-br from-gray-100/10 to-gray-200/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
    </div>
  );
}
