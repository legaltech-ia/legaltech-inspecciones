import { describe, expect, it } from 'vitest';
import type { CaseStateHistoryEntry } from './types';
import { descripcionActuacion, motivoDelInspector, tituloActuacion } from './historial';

const entrada = (e: Partial<CaseStateHistoryEntry>): CaseStateHistoryEntry => ({
  stateCode: 'audiencia_programada',
  stateName: 'Audiencia programada',
  changedAt: '2026-11-24T10:00:00',
  reason: null,
  ...e,
});

describe('motivo del cambio de etapa', () => {
  it('no muestra el texto de máquina que escribe legalcase', () => {
    const fuera = entrada({ reason: 'State changed OUT OF FLOW from radicada to audiencia_programada' });
    expect(descripcionActuacion(fuera)).toBeUndefined();
    expect(tituloActuacion(fuera)).toBe('Audiencia programada');
  });

  it('un motivo escrito por el inspector sí se muestra', () => {
    expect(descripcionActuacion(entrada({ reason: 'Se reprograma por inasistencia del querellado.' }))).toBe(
      'Se reprograma por inasistencia del querellado.',
    );
  });

  it('sin nombre de estado, el título no cae en el texto de máquina', () => {
    const sinNombre = entrada({ stateName: null, reason: 'State changed from radicada to audiencia_programada' });
    expect(tituloActuacion(sinNombre)).toBe('audiencia_programada');
  });

  it('un motivo vacío no es motivo', () => {
    expect(motivoDelInspector('   ')).toBeUndefined();
  });
});
