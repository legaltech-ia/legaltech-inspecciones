import { useMutation, useQueryClient } from '@tanstack/react-query';
import { subirDocumento } from '@/shared/documentos/api';
import {
  legalCasesKeys,
  useChangeCaseState,
  useCreateLegalCase,
  useReplaceCaseParties,
  useUpdateCaseFields,
} from '@/shared/legalCases/api';
import { useInspeccionStore } from '@/store/inspeccionStore';
import { buscarPorRadicado } from './buscarPorRadicado';
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
