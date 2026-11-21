import { describe, expect, it } from 'vitest';
import { LIMITE_MEMBRETE_BYTES, membreteExcedeLimite } from './membrete';

/**
 * El membrete se guarda como dataURL en localStorage junto con el resto de la
 * configuración del despacho. Sin tope, una foto de varios MB agota la cuota
 * del navegador y la escritura falla: el inspector ve "Membrete guardado" y
 * pierde también municipio, inspector e inspección.
 */
describe('límite de tamaño del membrete', () => {
  it('acepta un membrete de despacho normal (800x200, decenas de KB)', () => {
    expect(membreteExcedeLimite({ size: 60_000 })).toBe(false);
  });

  it('rechaza una foto de varios MB antes de escribirla en localStorage', () => {
    expect(membreteExcedeLimite({ size: 4_000_000 })).toBe(true);
  });

  it('el límite deja margen bajo la cuota típica de localStorage (~5 MB)', () => {
    expect(LIMITE_MEMBRETE_BYTES * 1.37).toBeLessThan(5_000_000); // base64 ≈ 1.37x el binario
  });
});
