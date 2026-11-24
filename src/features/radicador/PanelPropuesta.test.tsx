// @vitest-environment jsdom
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const guardar = vi.fn();

vi.mock('@/shared/catalogo/api', () => ({ useCaseTypeCatalog: () => ({ data: CATALOGO, isError: false }) }));
vi.mock('./useGuardarPropuesta', () => ({
  useGuardarPropuesta: () => ({ mutateAsync: guardar, isPending: false }),
}));

import { PanelPropuesta } from './PanelPropuesta';
import { useBorradorRadicacion } from './borradorStore';
import { useAuth } from '@/shared/auth/auth';
import { PROPUESTA_VACIA, type PropuestaRadicacion, type TipologiaCatalogo } from '@/shared/catalogo/types';

const CATALOGO: TipologiaCatalogo[] = [
  {
    key: 'querella',
    label: 'Querella',
    filing: 'CREATE',
    stateMachine: 'querella',
    initialState: 'radicada',
    states: ['radicada'],
    citedArticle: 'art. 223, Ley 1801 de 2016',
    termDays: 15,
    fields: [
      { key: 'querellante', label: 'Querellante', type: 'PARTY', required: true },
      { key: 'asunto', label: 'Asunto', type: 'LONG_TEXT', required: true },
    ],
    admissionRequirements: [],
  },
];

function proponer(propuesta: Partial<PropuestaRadicacion>, documentos: string[] = []) {
  useBorradorRadicacion
    .getState()
    .proponer('Revisé el escrito.', { ...PROPUESTA_VACIA, ...propuesta }, documentos);
}

afterEach(cleanup);
beforeEach(() => {
  guardar.mockReset();
  guardar.mockResolvedValue({ caseId: 'caso-1', filingNumber: 'QUE-2026-00111', modo: 'CREATE' });
  useAuth.setState({ usuario: { id: 'inspector-1', nombre: 'A.', rol: 'inspector', despacho: 'd1' } });
  localStorage.clear();
  useBorradorRadicacion.getState().limpiar();
});

/**
 * El panel que convierte la propuesta del agente en un expediente. Lo comparten
 * los dos caminos de radicación —el chat de radicación, que abre expediente, y la
 * herramienta del chat general, que además adjunta—, porque el botón de guardar es
 * lo único que radica: el agente propone y nada existe hasta que el inspector pulsa.
 */
describe('el panel de la propuesta', () => {
  it('pinta los campos que declara el catálogo', () => {
    proponer({ tipoSolicitud: 'querella', campos: { asunto: 'Ruido nocturno' } });
    render(<PanelPropuesta archivos={[]} />);

    expect((screen.getByLabelText('Asunto') as HTMLTextAreaElement).value).toBe('Ruido nocturno');
  });

  it('sin propuesta todavía no pinta formulario ni ofrece guardar', () => {
    render(<PanelPropuesta archivos={[]} />);

    expect(screen.queryByRole('button', { name: /guardar/i })).toBeNull();
  });

  it('guarda lo que el agente propuso y lo que el inspector corrigió', async () => {
    proponer({ tipoSolicitud: 'querella', campos: { asunto: 'Ruido nocturno' } });
    render(<PanelPropuesta archivos={[]} />);

    fireEvent.change(screen.getByLabelText('Asunto'), { target: { value: 'Ruido nocturno, calle 5' } });
    fireEvent.click(screen.getByRole('button', { name: /guardar/i }));

    await waitFor(() => expect(guardar).toHaveBeenCalledTimes(1));
    expect(guardar.mock.calls[0][0].propuesta.campos.asunto).toBe('Ruido nocturno, calle 5');
  });

  it('al guardar dice el radicado que quedó', async () => {
    proponer({ tipoSolicitud: 'querella', campos: { asunto: 'Ruido' } });
    render(<PanelPropuesta archivos={[]} />);

    fireEvent.click(screen.getByRole('button', { name: /guardar/i }));

    expect((await screen.findByRole('status')).textContent).toMatch(/QUE-2026-00111/);
  });

  it('si el guardado falla lo dice, y no se pierde lo escrito', async () => {
    guardar.mockRejectedValue(new Error('El despacho no está configurado: falta el municipio.'));
    proponer({ tipoSolicitud: 'querella', campos: { asunto: 'Ruido' } });
    render(<PanelPropuesta archivos={[]} />);

    fireEvent.click(screen.getByRole('button', { name: /guardar/i }));

    expect((await screen.findByRole('alert')).textContent).toMatch(/municipio/);
    expect((screen.getByLabelText('Asunto') as HTMLTextAreaElement).value).toBe('Ruido');
  });

  it('avisa qué documentos hay que volver a adjuntar', () => {
    proponer({ tipoSolicitud: 'querella', campos: {} }, ['escrito.pdf']);
    render(<PanelPropuesta archivos={[]} />);

    expect(screen.getByRole('alert').textContent).toMatch(/escrito\.pdf/);
  });

  it('una tipología que el catálogo no declara se dice, y no se guarda', () => {
    proponer({ tipoSolicitud: 'tutela', campos: {} });
    render(<PanelPropuesta archivos={[]} />);

    expect(screen.getByRole('alert').textContent).toMatch(/tutela/);
    expect(screen.queryByRole('button', { name: /guardar/i })).toBeNull();
  });

  /** Las personas se guardan en case_parties; si no se ven, nadie las revisa. */
  it('muestra las partes que el agente identificó, con su rol', () => {
    proponer({
      tipoSolicitud: 'querella',
      campos: {},
      partes: [{ rol: 'querellante', tipoId: 'CC', numeroId: '1234', nombre: 'A. Pérez' }],
    });
    render(<PanelPropuesta archivos={[]} />);

    expect(screen.getByText(/A\. Pérez/)).toBeDefined();
    expect(screen.getByText(/Querellante/)).toBeDefined();
  });

  it('dice cuando la tipología pide personas y el agente no identificó ninguna', () => {
    proponer({ tipoSolicitud: 'querella', campos: {}, partes: [] });
    render(<PanelPropuesta archivos={[]} />);

    expect(screen.getByText(/sin personas identificadas/i)).toBeDefined();
  });
});
