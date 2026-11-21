// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import type { TipoMulta } from '@/derecho';
import { EstadoEnCola } from './EstadoEnCola';
import { VIA_CONMUTACION, VIA_PRONTO_PAGO, viaAdmiteTipo } from './viaAcogida';

/**
 * La restricción del art. 180 par. ya estaba modelada, pero la cola de trabajo
 * no la miraba: una multa tipo 3 o 4 aparecía como "Pendiente" en conmutación,
 * que es ofrecer un trámite que la ley no permite. Esto lo congela.
 */

afterEach(cleanup);

describe('estado de un comparendo en la cola de la vía', () => {
  it('conmutación: un tipo 3 o 4 no está pendiente, dice que no procede', () => {
    ([3, 4] as TipoMulta[]).forEach((tipoMulta) => {
      cleanup();
      render(<EstadoEnCola via={VIA_CONMUTACION} tipoMulta={tipoMulta} enEdicion={false} />);
      expect(screen.getByText('No procede')).toBeDefined();
      expect(screen.queryByText('Pendiente')).toBeNull();
    });
  });

  it('conmutación: un tipo 1 o 2 sí está pendiente', () => {
    ([1, 2] as TipoMulta[]).forEach((tipoMulta) => {
      cleanup();
      render(<EstadoEnCola via={VIA_CONMUTACION} tipoMulta={tipoMulta} enEdicion={false} />);
      expect(screen.getByText('Pendiente')).toBeDefined();
    });
  });

  it('pronto pago: no tiene esa restricción, los cuatro tipos quedan pendientes', () => {
    ([1, 2, 3, 4] as TipoMulta[]).forEach((tipoMulta) => {
      cleanup();
      render(<EstadoEnCola via={VIA_PRONTO_PAGO} tipoMulta={tipoMulta} enEdicion={false} />);
      expect(screen.getByText('Pendiente')).toBeDefined();
    });
  });

  it('la edición en curso no puede tapar que la vía no procede', () => {
    render(<EstadoEnCola via={VIA_CONMUTACION} tipoMulta={4} enEdicion />);
    expect(screen.getByText('No procede')).toBeDefined();
    expect(screen.queryByText('En edición')).toBeNull();
  });
});

describe('la cuenta de la cola solo suma el trabajo de esa vía', () => {
  const base: TipoMulta[] = [2, 4, 3, 2, 4, 4];

  it('conmutación cuenta 2 de los 6 comparendos de la base de demostración', () => {
    expect(base.filter((t) => viaAdmiteTipo(VIA_CONMUTACION, t))).toHaveLength(2);
  });

  it('pronto pago cuenta los 6', () => {
    expect(base.filter((t) => viaAdmiteTipo(VIA_PRONTO_PAGO, t))).toHaveLength(6);
  });
});
