import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/shared/api/client';
import { useWorkspaceContextStore } from '@/store/workspaceContextStore';
import type { TipologiaCatalogo } from './types';

/**
 * El catálogo de tipologías del cerebro del workspace activo.
 *
 * La misma lista que alimenta el prompt del radicador en `legal`: si las dos bocas se
 * alimentaran de listas distintas volveríamos a tener catálogos que divergen.
 *
 * Un cerebro sin tipologías responde 404 y aquí llega como error, no como lista vacía:
 * un formulario en blanco sin explicación es peor que un aviso.
 */
export function useCaseTypeCatalog() {
  const brainId = useWorkspaceContextStore((s) => s.context?.brainId);

  return useQuery({
    queryKey: ['case-type-catalog', brainId],
    enabled: Boolean(brainId),
    // El YAML del cerebro no cambia en caliente: entra con el despliegue.
    staleTime: 5 * 60_000,
    queryFn: () =>
      apiFetch<TipologiaCatalogo[]>(`/case-type-catalog?brainId=${encodeURIComponent(brainId as string)}`),
  });
}
