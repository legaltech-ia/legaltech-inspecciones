import type { CaseStateHistoryEntry } from './types';

/**
 * Cómo se rotula una actuación del historial de estados, igual para querellas, quejas
 * y comparendos.
 *
 * `reason` es la columna de auditoría del cambio de etapa y legalcase la escribe como
 * texto de máquina en inglés —«State changed OUT OF FLOW from radicada to
 * audiencia_programada»—. Ese rastro tiene que existir, pero no delante de quien
 * redacta un acto administrativo: de la pantalla al documento solo hay un copiar y
 * pegar, y el servicio legal ya lo filtra antes de mandárselo al modelo
 * (CaseContextService). Cuando alguien escriba un motivo de verdad, pasa solo.
 */
const MOTIVO_DE_MAQUINA = 'State changed';

export function motivoDelInspector(reason: string | null | undefined): string | undefined {
  const motivo = (reason ?? '').trim();
  return motivo.length > 0 && !motivo.startsWith(MOTIVO_DE_MAQUINA) ? motivo : undefined;
}

export function tituloActuacion(h: CaseStateHistoryEntry): string {
  return h.stateName ?? motivoDelInspector(h.reason) ?? h.stateCode ?? 'Actuación';
}

export function descripcionActuacion(h: CaseStateHistoryEntry): string | undefined {
  return h.stateName ? motivoDelInspector(h.reason) : undefined;
}
