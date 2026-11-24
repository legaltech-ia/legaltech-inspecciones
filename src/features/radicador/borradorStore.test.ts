// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { useBorradorRadicacion } from './borradorStore';
import { useAuth } from '@/shared/auth/auth';
import { PROPUESTA_VACIA } from '@/shared/catalogo/types';

/**
 * El agente de recepción tiene memoria, y la radicación no cuelga de ningún
 * expediente todavía: sin identificar la conversación, todas las radicaciones de un
 * inspector caen en el mismo hilo. El borrador es quien sabe dónde empieza y dónde
 * acaba una radicación, así que la clave del hilo vive aquí.
 */
beforeEach(() => {
  useAuth.setState({ usuario: { id: 'inspector-1', nombre: 'A.', rol: 'inspector', despacho: 'd1' } });
  localStorage.clear();
  useBorradorRadicacion.getState().limpiar();
});

describe('el hilo de conversación del borrador', () => {
  it('es el mismo durante toda la radicación', () => {
    const primera = useBorradorRadicacion.getState().conversacion();
    useBorradorRadicacion.getState().setTexto('voy contando el caso');

    expect(useBorradorRadicacion.getState().conversacion()).toBe(primera);
  });

  it('la siguiente radicación empieza con otro hilo', () => {
    const primera = useBorradorRadicacion.getState().conversacion();
    useBorradorRadicacion.getState().proponer('ok', { ...PROPUESTA_VACIA }, []);

    useBorradorRadicacion.getState().limpiar();

    expect(useBorradorRadicacion.getState().conversacion()).not.toBe(primera);
  });

  it('sobrevive a que al inspector lo saquen al login a media radicación', () => {
    const antes = useBorradorRadicacion.getState().conversacion();

    expect(JSON.parse(localStorage.getItem('borrador-radicacion:inspector-1') ?? '{}').state.conversacionId).toBe(
      antes,
    );
  });
});
