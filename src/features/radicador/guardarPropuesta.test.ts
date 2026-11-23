import { describe, expect, it, vi } from 'vitest';
import { guardarPropuesta, type PuertosGuardado } from './guardarPropuesta';
import { PROPUESTA_VACIA, type PropuestaRadicacion, type TipologiaCatalogo } from '@/shared/catalogo/types';

/**
 * El inspector guarda; el agente propuso.
 *
 * Dos caminos y no uno: una tipología que abre expediente lo crea, y una que se
 * adjunta resuelve el radicado que nombró el documento y parchea ESE expediente.
 * Adjuntar al equivocado es más difícil de deshacer que crear uno de más, así que
 * cuando el radicado no resuelve esto falla en vez de adivinar.
 */
const QUERELLA: TipologiaCatalogo = {
  key: 'querella',
  label: 'Querella',
  filing: 'CREATE',
  stateMachine: 'querella',
  initialState: 'radicada',
  states: ['radicada', 'audiencia_programada'],
  citedArticle: 'art. 223, Ley 1801 de 2016',
  termDays: 15,
  fields: [
    { key: 'asunto', label: 'Asunto', type: 'LONG_TEXT', required: true },
    { key: 'direccionInmueble', label: 'Dirección', type: 'TEXT', required: false },
  ],
  admissionRequirements: [],
};

const APELACION: TipologiaCatalogo = {
  ...QUERELLA,
  key: 'apelacion',
  label: 'Apelación',
  filing: 'ATTACH',
  states: [],
  initialState: null,
  fields: [{ key: 'radicadoOrigen', label: 'Radicado de origen', type: 'TEXT', required: true }],
};

const DESPACHO = { inspeccion: 'Inspección Primera', municipio: 'Ciudad de Prueba' };

function puertos(sobrescribe: Partial<PuertosGuardado> = {}): PuertosGuardado {
  return {
    crearCaso: vi.fn().mockResolvedValue({ id: 'caso-1', filingNumber: 'QUE-1', currentStateCode: 'radicada' }),
    buscarPorRadicado: vi.fn().mockResolvedValue({ id: 'caso-1', filingNumber: 'QUE-2026-00102' }),
    parchearCampos: vi.fn().mockResolvedValue(undefined),
    cambiarEstado: vi.fn().mockResolvedValue(undefined),
    reemplazarPartes: vi.fn().mockResolvedValue(undefined),
    subirDocumento: vi.fn().mockResolvedValue(undefined),
    ...sobrescribe,
  };
}

function propuesta(extra: Partial<PropuestaRadicacion> = {}): PropuestaRadicacion {
  return { ...PROPUESTA_VACIA, tipoSolicitud: 'querella', campos: { asunto: 'Ruido nocturno' }, ...extra };
}

const archivo = (nombre: string) => new File(['x'], nombre, { type: 'application/octet-stream' });

describe('guardar la propuesta del radicador', () => {
  it('una tipología CREATE crea el expediente y aplica la etapa propuesta', async () => {
    const p = puertos();

    const r = await guardarPropuesta(p, {
      propuesta: propuesta({ estadoSugerido: 'audiencia_programada' }),
      entrada: QUERELLA,
      archivos: [],
      despacho: DESPACHO,
    });

    expect(p.crearCaso).toHaveBeenCalledWith(expect.objectContaining({ caseType: 'querella' }));
    expect(p.cambiarEstado).toHaveBeenCalledWith('caso-1', 'audiencia_programada');
    expect(r).toMatchObject({ caseId: 'caso-1', modo: 'CREATE' });
  });

  it('una tipología ATTACH resuelve el radicado y parchea ese expediente, sin crear ninguno', async () => {
    const p = puertos();

    const r = await guardarPropuesta(p, {
      propuesta: propuesta({ tipoSolicitud: 'apelacion', radicadoReferenciado: 'QUE-2026-00102' }),
      entrada: APELACION,
      archivos: [],
      despacho: DESPACHO,
    });

    expect(p.crearCaso).not.toHaveBeenCalled();
    expect(p.parchearCampos).toHaveBeenCalledWith('caso-1', expect.anything());
    expect(r.modo).toBe('ATTACH');
  });

  it('un radicado que no existe no adjunta a ciegas', async () => {
    const p = puertos({ buscarPorRadicado: vi.fn().mockResolvedValue(null) });

    await expect(
      guardarPropuesta(p, {
        propuesta: propuesta({ tipoSolicitud: 'apelacion', radicadoReferenciado: 'NO-EXISTE' }),
        entrada: APELACION,
        archivos: [],
        despacho: DESPACHO,
      }),
    ).rejects.toThrow(/NO-EXISTE/);

    expect(p.parchearCampos).not.toHaveBeenCalled();
  });

  it('una tipología ATTACH sin radicado referenciado tampoco adivina', async () => {
    const p = puertos();

    await expect(
      guardarPropuesta(p, {
        propuesta: propuesta({ tipoSolicitud: 'apelacion', radicadoReferenciado: null }),
        entrada: APELACION,
        archivos: [],
        despacho: DESPACHO,
      }),
    ).rejects.toThrow(/radicado/i);
  });

  it('descarta los campos que el catálogo no declara', async () => {
    const p = puertos();

    await guardarPropuesta(p, {
      propuesta: propuesta({ campos: { asunto: 'Ruido', inventado: 'x' } }),
      entrada: QUERELLA,
      archivos: [],
      despacho: DESPACHO,
    });

    const input = (p.crearCaso as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(input.caseMetadata).toContain('asunto');
    expect(input.caseMetadata).not.toContain('inventado');
  });

  it('las partes viajan estructuradas, no concatenadas en texto', async () => {
    const p = puertos();

    await guardarPropuesta(p, {
      propuesta: propuesta({
        partes: [{ rol: 'querellante', tipoId: 'CC', numeroId: '1', nombre: 'A. P.' }],
      }),
      entrada: QUERELLA,
      archivos: [],
      despacho: DESPACHO,
    });

    expect(p.reemplazarPartes).toHaveBeenCalledWith('caso-1', [
      expect.objectContaining({ partyRole: 'querellante', fullName: 'A. P.' }),
    ]);
  });

  it('sube cada adjunto al expediente ya resuelto', async () => {
    const p = puertos();

    await guardarPropuesta(p, {
      propuesta: propuesta(),
      entrada: QUERELLA,
      archivos: [archivo('a.pdf'), archivo('b.docx')],
      despacho: DESPACHO,
    });

    expect(p.subirDocumento).toHaveBeenCalledTimes(2);
    expect(p.subirDocumento).toHaveBeenCalledWith('caso-1', expect.objectContaining({ name: 'b.docx' }));
  });

  /**
   * El camino anterior ponía `venueCity: municipio || 'Manizales'`. Un despacho sin
   * configurar no es Manizales: se dice y no se radica.
   */
  it('sin despacho configurado no inventa municipio ni inspección', async () => {
    const p = puertos();

    await expect(
      guardarPropuesta(p, {
        propuesta: propuesta(),
        entrada: QUERELLA,
        archivos: [],
        despacho: { inspeccion: '', municipio: '' },
      }),
    ).rejects.toThrow(/despacho/i);

    expect(p.crearCaso).not.toHaveBeenCalled();
  });
});
