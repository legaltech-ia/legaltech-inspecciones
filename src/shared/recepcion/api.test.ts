// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { pedirRecepcion } from './api';

/**
 * El agente de recepción tiene memoria. Si todas las radicaciones de un inspector
 * van sin identificar la conversación, caen en el mismo hilo y el agente propone la
 * querella de hoy acordándose de los documentos de la de ayer — se midió: repetía
 * literalmente su respuesta anterior.
 */
const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  fetchMock.mockResolvedValue({ ok: true, json: async () => ({ data: 'listo' }) });
  vi.stubGlobal('fetch', fetchMock);
});

const urlLlamada = () => String(fetchMock.mock.calls[0][0]);

describe('la llamada al agente de recepción', () => {
  it('identifica la conversación, para que cada radicación tenga su propio hilo', async () => {
    await pedirRecepcion({ texto: 'una querella', conversacionId: 'radicacion-abc' });

    expect(urlLlamada()).toContain('conversationId=radicacion-abc');
  });

  it('sin conversación no manda el parámetro: el servicio decide', async () => {
    await pedirRecepcion({ texto: 'una querella' });

    expect(urlLlamada()).not.toContain('conversationId');
  });

  it('un documento sobre un expediente que ya existe sigue mandando su caseId', async () => {
    await pedirRecepcion({ texto: 'un escrito', caseId: 'caso-1', conversacionId: 'radicacion-abc' });

    expect(urlLlamada()).toContain('caseId=caso-1');
    expect(urlLlamada()).toContain('conversationId=radicacion-abc');
  });

  it('escapa lo que va en la URL, para que un valor no invente otro parámetro', async () => {
    await pedirRecepcion({ texto: 'x', conversacionId: 'a b&caseId=otro' });

    const parametros = new URLSearchParams(urlLlamada().split('?')[1]);
    expect(parametros.get('conversationId')).toBe('a b&caseId=otro');
    expect(parametros.get('caseId')).toBeNull();
  });
});
