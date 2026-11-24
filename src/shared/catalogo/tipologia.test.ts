import { describe, expect, it } from 'vitest';
import { resolverTipologia } from './tipologia';
import type { TipologiaCatalogo } from './types';

/**
 * El agente devuelve `tipoSolicitud` como texto, y a veces devuelve el label
 * («Apelación») donde el catálogo tiene la key («apelacion»). Comparando solo la
 * key, el formulario se quedaba sin tipología: ni campos, ni botón de guardar, ni
 * explicación. Lector tolerante aquí, contrato estricto en el prompt.
 */
const CATALOGO: TipologiaCatalogo[] = [
  {
    key: 'apelacion',
    label: 'Apelación',
    filing: 'ATTACH',
    stateMachine: 'apelacion',
    initialState: 'radicada',
    states: ['radicada'],
    citedArticle: null,
    termDays: null,
    fields: [],
    admissionRequirements: [],
  },
  {
    key: 'acta_firmeza',
    label: 'Acta de firmeza',
    filing: 'ATTACH',
    stateMachine: 'acta_firmeza',
    initialState: 'pendiente',
    states: ['pendiente'],
    citedArticle: null,
    termDays: null,
    fields: [],
    admissionRequirements: [],
  },
];

describe('resolver la tipología que propuso el agente', () => {
  it('por su key, que es el contrato', () => {
    expect(resolverTipologia(CATALOGO, 'apelacion')?.key).toBe('apelacion');
  });

  it('por su label, que es lo que el modelo devuelve a veces', () => {
    expect(resolverTipologia(CATALOGO, 'Apelación')?.key).toBe('apelacion');
  });

  it('sin que acentos ni mayúsculas lo rompan', () => {
    expect(resolverTipologia(CATALOGO, 'APELACION')?.key).toBe('apelacion');
    expect(resolverTipologia(CATALOGO, 'Acta de Firmeza')?.key).toBe('acta_firmeza');
  });

  it('nada cuando no se parece a ninguna: no se adivina una tipología', () => {
    expect(resolverTipologia(CATALOGO, 'tutela')).toBeUndefined();
    expect(resolverTipologia(CATALOGO, null)).toBeUndefined();
    expect(resolverTipologia(undefined, 'apelacion')).toBeUndefined();
  });
});
