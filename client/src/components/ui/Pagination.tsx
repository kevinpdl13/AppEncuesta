import { ChevronLeft, ChevronRight } from 'lucide-react';

type PaginationProps = {
  /** Número de la página actual (1-indexed) */
  paginaActual: number;
  /** Total de páginas disponibles */
  totalPaginas: number;
  /** Índice de inicio del slice actual (0-indexed) */
  inicio: number;
  /** Cantidad total de ítems después de filtrar */
  totalItems: number;
  /** Cantidad de ítems por página */
  pageSize: number;
  /** Label para el texto "de X [label]" */
  label?: string;
  /** Callback para cambiar de página */
  onPageChange: (page: number) => void;
};

/**
 * Componente de paginación reutilizable.
 * Siempre es visible. Muestra el contador y los botones de navegación.
 */
export function Pagination({
  paginaActual,
  totalPaginas,
  inicio,
  totalItems,
  pageSize,
  label = 'registros',
  onPageChange,
}: PaginationProps) {
  const fin = Math.min(inicio + pageSize, totalItems);

  return (
    <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-t border-border/50 bg-gray-50/30">
      <span className="text-xs text-muted-foreground">
        Mostrando {totalItems === 0 ? 0 : inicio + 1}–{fin} de {totalItems} {label}
      </span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(Math.max(1, paginaActual - 1))}
          disabled={paginaActual === 1}
          className="p-1.5 rounded-lg border border-border bg-white text-muted-foreground hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          aria-label="Página anterior"
        >
          <ChevronLeft size={16} />
        </button>

        {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            onClick={() => onPageChange(n)}
            aria-label={`Página ${n}`}
            className={`w-8 h-8 rounded-lg text-xs font-semibold transition-colors ${
              n === paginaActual
                ? 'bg-primary text-white border border-primary'
                : 'bg-white border border-border text-muted-foreground hover:bg-gray-50'
            }`}
          >
            {n}
          </button>
        ))}

        <button
          onClick={() => onPageChange(Math.min(totalPaginas, paginaActual + 1))}
          disabled={paginaActual === totalPaginas}
          className="p-1.5 rounded-lg border border-border bg-white text-muted-foreground hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          aria-label="Página siguiente"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
