import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/shared/api/client';
import { subirDocumento } from '@/shared/documentos/api';
import {
  legalCasesKeys,
  useChangeCaseState,
  useCreateLegalCase,
  useReplaceCaseParties,
  useUpdateCaseFields,
} from '@/shared/legalCases/api';
import type { LegalCase } from '@/shared/legalCases/types';
import { useInspeccionStore } from '@/store/inspeccionStore';
import { guardarPropuesta, type PeticionGuardado, type PuertosGuardado } from './guardarPropuesta';

/**
 * El guardado del radicador: aquí se vuelven reales las llamadas y en
 * `guardarPropuesta` vive la decisión de crear o adjuntar.
 */
export function useGuardarPropuesta() {
  const queryClient = useQueryClient();
  const crear = useCreateLegalCase();
  const estado = useChangeCaseState();
  const campos = useUpdateCaseFields();
  const partes = useReplaceCaseParties();
  const { municipio, inspeccion } = useInspeccionStore((s) => s.config);

  const puertos: PuertosGuardado = {
    crearCaso: (input) => crear.mutateAsync(input),
    buscarPorRadicado: buscarPorRadicado,
    parchearCampos: (id, fields) => campos.mutateAsync({ id, fields }),
    cambiarEstado: (id, state) => estado.mutateAsync({ id, state }),
    reemplazarPartes: (id, lista) => partes.mutateAsync({ id, parties: lista }),
    subirDocumento,
  };

  return useMutation({
    mutationFn: (peticion: Omit<PeticionGuardado, 'despacho'>) =>
      guardarPropuesta(puertos, { ...peticion, despacho: { municipio, inspeccion } }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: legalCasesKeys.all });
    },
  });
}

/** Null cuando no hay expediente con ese radicado: el 404 de legalcase no es un error aquí. */
async function buscarPorRadicado(radicado: string): Promise<LegalCase | null> {
  try {
    return await apiFetch<LegalCase>(`/legal-cases/filing-number/${encodeURIComponent(radicado)}`);
  } catch {
    return null;
  }
}
