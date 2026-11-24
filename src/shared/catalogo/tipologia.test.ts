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
    key: 'querella',
    label: 'Querella',
    filing: 'CREATE',
    stateMachine: 'querella',
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

  /**
   * Medido contra el modelo real: en 2 de cada 4 querellas devuelve `querrella`.
   * Con cinco tipologías distintas, una letra de diferencia no deja dudas sobre
   * cuál es; y la elegida se ve en el desplegable, donde el inspector la cambia.
   */
  it('aguanta una letra de más o de menos, que es lo que el modelo escribe', () => {
    expect(resolverTipologia(CATALOGO, 'apelacionn')?.key).toBe('apelacion');
    expect(resolverTipologia(CATALOGO, 'apelacio')?.key).toBe('apelacion');
    expect(resolverTipologia(CATALOGO, 'apelasion')?.key).toBe('apelacion');
  });

  /** La cadena exacta que devolvió el modelo en la medición. */
  it('«querrella», que es lo que devolvió el modelo, es la querella', () => {
    expect(resolverTipologia(CATALOGO, 'querrella')?.key).toBe('querella');
  });

  it('nada cuando no se parece a ninguna: no se adivina una tipología', () => {
    expect(resolverTipologia(CATALOGO, 'tutela')).toBeUndefined();
    expect(resolverTipologia(CATALOGO, 'queja')).toBeUndefined();
    expect(resolverTipologia(CATALOGO, null)).toBeUndefined();
    expect(resolverTipologia(undefined, 'apelacion')).toBeUndefined();
  });

  /** Dos candidatas a una letra significa que no se sabe cuál: mejor preguntar. */
  it('no elige cuando dos tipologías quedan igual de cerca', () => {
    const parecidas = [
      { ...CATALOGO[0], key: 'auto_a', label: 'Auto A' },
      { ...CATALOGO[0], key: 'auto_b', label: 'Auto B' },
    ];

    expect(resolverTipologia(parecidas, 'auto_c')).toBeUndefined();
  });
});
