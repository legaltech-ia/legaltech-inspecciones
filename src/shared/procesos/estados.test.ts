import { describe, it, expect } from 'vitest';
import {
  ESTADOS_POST_FALLO,
  ESTADO_COLOR,
  ESTADO_LABEL,
  colorEstado,
  estaFinalizado,
  etiquetaEstado,
} from './types';

/**
 * Corrección pedida por ChatGPT sobre PR #2 (inspecciones-redesign):
 * ESTADOS_POST_FALLO es el catálogo de estados procesales/jurídicos que ya
 * usan comparendo/acta/apelación; el ciclo de vida técnico del expediente
 * (ACTIVO/FINALIZADO) es una noción aparte y no debe reinterpretar ni
 * reemplazar ese catálogo. Este test fija ambas cosas por separado.
 */
describe('ESTADOS_POST_FALLO y estaFinalizado son catálogos independientes', () => {
  it('ESTADOS_POST_FALLO conserva su lista original de estados procesales', () => {
    expect(ESTADOS_POST_FALLO).toEqual([
      'fallo_emitido',
      'en_firmeza',
      'apelado',
      'archivada',
      'conciliada',
      'confirmado',
      'revocado',
      'expedida',
    ]);
  });

  it('FINALIZADO no forma parte del catálogo procesal', () => {
    expect(ESTADOS_POST_FALLO.includes('FINALIZADO')).toBe(false);
  });

  it('estaFinalizado solo mira el ciclo de vida técnico, no el catálogo procesal', () => {
    expect(estaFinalizado('FINALIZADO')).toBe(true);
    expect(estaFinalizado('ACTIVO')).toBe(false);
    // Un estado del catálogo procesal no es, por sí solo, un ciclo de vida finalizado.
    expect(estaFinalizado('fallo_emitido')).toBe(false);
    expect(estaFinalizado('archivada')).toBe(false);
  });
});

/**
 * El panel mostraba "Sin asunto registrado · undefined": el único expediente
 * de la bandeja tenía `current_state_code` NULL y `etiquetaEstado` declaraba
 * recibir `string`, así que su fallback `?? codigo` devolvía el propio
 * `undefined`. El `as EstadoQuerella` del mapeo lo ocultaba en compilación.
 */
describe('etiquetaEstado y colorEstado toleran un expediente sin estado', () => {
  it('un estado ausente se lee "Sin estado", nunca "undefined"', () => {
    expect(etiquetaEstado(undefined)).toBe('Sin estado');
    expect(etiquetaEstado(null)).toBe('Sin estado');
    expect(etiquetaEstado('')).toBe('Sin estado');
  });

  it('un código desconocido se muestra tal cual, que es informativo', () => {
    expect(etiquetaEstado('estado_que_no_existe')).toBe('estado_que_no_existe');
  });

  it('un código conocido conserva su etiqueta', () => {
    expect(etiquetaEstado('en_firmeza')).toBe(ESTADO_LABEL['en_firmeza']);
  });

  it('el color cae en "default" sin estado, sin reventar', () => {
    expect(colorEstado(undefined)).toBe('default');
    expect(colorEstado('en_firmeza')).toBe(ESTADO_COLOR['en_firmeza']);
  });
});
