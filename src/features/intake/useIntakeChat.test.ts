// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const pedirRecepcion = vi.fn();
vi.mock('@/shared/recepcion/api', () => ({ pedirRecepcion: (...args: unknown[]) => pedirRecepcion(...args) }));

import { useIntakeChat } from './useIntakeChat';
import { useBorradorRadicacion } from '@/features/radicador/borradorStore';
import { useAuth } from '@/shared/auth/auth';

function marcador(json: string) {
  return `Anotado.\n\n<case_update>${json}</case_update>`;
}

beforeEach(() => {
  pedirRecepcion.mockReset();
  useAuth.setState({ usuario: { id: 'inspector-1', nombre: 'A.', rol: 'inspector', despacho: 'd1' } });
  localStorage.clear();
  useBorradorRadicacion.getState().limpiar();
});
afterEach(() => vi.clearAllMocks());

/**
 * El chat de radicación es una conversación: el inspector cuenta el caso en varios
 * turnos. Lo que el agente extrajo en el turno 1 no puede desaparecer en el turno 2,
 * porque lo que se guarda al final es lo acumulado.
 */
describe('la conversación de radicación', () => {
  it('deja la propuesta del agente donde el formulario la lee', async () => {
    pedirRecepcion.mockResolvedValue(
      marcador('{"tipoSolicitud":"querella","campos":{"asunto":"Ruido"},"partes":[]}'),
    );
    const { result } = renderHook(() => useIntakeChat());

    await act(() => result.current.enviar('Vengo a poner una querella por ruido'));

    const propuesta = useBorradorRadicacion.getState().propuesta;
    expect(propuesta?.tipoSolicitud).toBe('querella');
    expect(propuesta?.campos.asunto).toBe('Ruido');
  });

  it('un turno nuevo completa lo anterior, no lo borra', async () => {
    const { result } = renderHook(() => useIntakeChat());

    pedirRecepcion.mockResolvedValue(
      marcador('{"tipoSolicitud":"querella","campos":{"asunto":"Ruido"},"partes":[]}'),
    );
    await act(() => result.current.enviar('Querella por ruido'));

    pedirRecepcion.mockResolvedValue(
      marcador('{"campos":{"direccionInmueble":"Calle 5"},"partes":[{"rol":"querellante","nombre":"A. Pérez"}]}'),
    );
    await act(() => result.current.enviar('La dirección es Calle 5, y el querellante es A. Pérez'));

    const propuesta = useBorradorRadicacion.getState().propuesta;
    expect(propuesta?.campos).toMatchObject({ asunto: 'Ruido', direccionInmueble: 'Calle 5' });
    expect(propuesta?.tipoSolicitud).toBe('querella');
    expect(propuesta?.partes).toHaveLength(1);
  });

  it('la prosa que ve el inspector no lleva el marcador dentro', async () => {
    pedirRecepcion.mockResolvedValue(marcador('{"tipoSolicitud":"querella","campos":{}}'));
    const { result } = renderHook(() => useIntakeChat());

    await act(() => result.current.enviar('Hola'));

    const ultimo = result.current.mensajes[result.current.mensajes.length - 1];
    expect(ultimo.texto).toBe('Anotado.');
  });

  it('si la llamada falla lo dice y no toca lo ya extraído', async () => {
    const { result } = renderHook(() => useIntakeChat());

    pedirRecepcion.mockResolvedValue(marcador('{"tipoSolicitud":"querella","campos":{"asunto":"Ruido"}}'));
    await act(() => result.current.enviar('Querella por ruido'));

    pedirRecepcion.mockRejectedValue(new Error('sin red'));
    await act(() => result.current.enviar('otra cosa'));

    expect(useBorradorRadicacion.getState().propuesta?.campos.asunto).toBe('Ruido');
    expect(result.current.mensajes[result.current.mensajes.length - 1].texto).toMatch(/error/i);
  });
});
