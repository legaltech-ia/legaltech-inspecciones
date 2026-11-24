import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Decirle al inspector "ese radicado no existe" cuando el servicio no contestó le
 * hace corregir un radicado que estaba bien, y adjuntar al expediente equivocado
 * cuesta más de deshacer que crear uno de más. Solo un 404 significa que no hay
 * expediente con ese radicado.
 */
const apiFetch = vi.fn();

vi.mock('@/shared/api/client', () => ({
  apiFetch: (...args: unknown[]) => apiFetch(...args),
  ApiError: class ApiError extends Error {
    constructor(
      public status: number,
      message: string,
    ) {
      super(message);
      this.name = 'ApiError';
    }
  },
}));

import { ApiError } from '@/shared/api/client';
import { buscarPorRadicado } from './buscarPorRadicado';

beforeEach(() => apiFetch.mockReset());

describe('buscar el expediente al que se adjunta', () => {
  it('devuelve el expediente cuando el radicado existe', async () => {
    apiFetch.mockResolvedValue({ id: 'caso-1', filingNumber: 'QUE-2026-00102' });

    expect(await buscarPorRadicado('QUE-2026-00102')).toMatchObject({ id: 'caso-1' });
  });

  it('un 404 es null: de verdad no hay expediente con ese radicado', async () => {
    apiFetch.mockRejectedValueOnce(new ApiError(404, 'No encontrado'));

    expect(await buscarPorRadicado('QUE-2026-99999')).toBeNull();
  });

  it('una sesión vencida NO se cuenta como radicado inexistente', async () => {
    apiFetch.mockRejectedValueOnce(new ApiError(401, 'Sesión expirada'));

    await expect(buscarPorRadicado('QUE-2026-00102')).rejects.toThrow(/sesión/i);
  });

  it('un servicio caído NO se cuenta como radicado inexistente', async () => {
    apiFetch.mockRejectedValueOnce(new ApiError(500, 'Error 500'));

    await expect(buscarPorRadicado('QUE-2026-00102')).rejects.toThrow();
  });

  it('una red caída tampoco', async () => {
    apiFetch.mockRejectedValueOnce(new TypeError('Failed to fetch'));

    await expect(buscarPorRadicado('QUE-2026-00102')).rejects.toThrow(/fetch/i);
  });
});
