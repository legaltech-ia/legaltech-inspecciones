import { ApiError, apiFetch } from '@/shared/api/client';
import type { LegalCase } from '@/shared/legalCases/types';

/**
 * El expediente al que se adjunta lo resuelve el frontend: el agente solo reporta
 * el radicado que leyó en el documento.
 *
 * Null SOLO con un 404. Cualquier otro fallo se propaga: un `catch` que devolvía
 * null en todos los casos le decía al inspector "no hay ningún expediente con ese
 * radicado" cuando lo que pasaba era que la sesión había vencido o el servicio no
 * contestó, y eso le hace corregir un radicado que estaba bien.
 */
export async function buscarPorRadicado(radicado: string): Promise<LegalCase | null> {
  try {
    return await apiFetch<LegalCase>(`/legal-cases/filing-number/${encodeURIComponent(radicado)}`);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}
