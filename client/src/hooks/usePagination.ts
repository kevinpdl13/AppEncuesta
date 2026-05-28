import { useState, useEffect } from 'react';

/**
 * Hook reutilizable de paginación.
 * Recibe el array total de ítems y el tamaño de página.
 * Devuelve los ítems de la página actual y los controles necesarios.
 */
export function usePagination<T>(items: T[], pageSize: number) {
  const [paginaActual, setPaginaActual] = useState(1);

  // Reiniciar a la página 1 cuando cambia el array de entrada (ej. al filtrar)
  useEffect(() => {
    setPaginaActual(1);
  }, [items.length]);

  const totalPaginas = Math.max(1, Math.ceil(items.length / pageSize));
  const inicio = (paginaActual - 1) * pageSize;
  const itemsPagina = items.slice(inicio, inicio + pageSize);

  return {
    paginaActual,
    setPaginaActual,
    totalPaginas,
    inicio,
    itemsPagina,
  };
}
