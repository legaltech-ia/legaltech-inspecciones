// @vitest-environment jsdom
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const pedirRecepcion = vi.fn();
const guardar = vi.fn();

vi.mock('@/shared/recepcion/api', () => ({ pedirRecepcion: (...args: unknown[]) => pedirRecepcion(...args) }));
vi.mock('@/shared/catalogo/api', () => ({
  useCaseTypeCatalog: () => ({ data: CATALOGO, isError: false }),
}));
vi.mock('@/features/radicador/useGuardarPropuesta', () => ({
  useGuardarPropuesta: () => ({ mutateAsync: guardar, isPending: false }),
}));

import { HerramientaRadicacion } from './HerramientaRadicacion';
import { HERRAMIENTAS } from './herramientas';
import type { TipologiaCatalogo } from '@/shared/catalogo/types';

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
    fields: [{ key: 'asunto', label: 'Asunto', type: 'LONG_TEXT', required: true }],
    admissionRequirements: [],
  },
];

const MARCADOR =
  '<case_update>{"tipoSolicitud":"querella","listoParaRadicar":true,' +
  '"campos":{"asunto":"Ruido nocturno"},"partes":[],"estadoSugerido":null,' +
  '"radicadoReferenciado":null,"requisitos":[],"observaciones":null}</case_update>';

afterEach(cleanup);
beforeEach(() => {
  pedirRecepcion.mockReset();
  guardar.mockReset();
  guardar.mockResolvedValue({ caseId: 'caso-1', filingNumber: 'QUE-1', modo: 'CREATE' });
});

describe('la herramienta de radicación del chat general', () => {
  it('la pila la ofrece y no exige un caso abierto', () => {
    const radicar = HERRAMIENTAS.find((h) => h.clave === 'radicar');

    expect(radicar).toBeDefined();
    expect(radicar?.requiereCaso).toBeFalsy();
    expect(radicar?.tipos).toBeUndefined();
  });

  it('muestra el formulario con lo que el agente propuso', async () => {
    pedirRecepcion.mockResolvedValue(`Revisé el documento.\n\n${MARCADOR}`);
    render(<HerramientaRadicacion />);

    fireEvent.change(screen.getByLabelText('Qué va a radicar'), { target: { value: 'adjunto la solicitud' } });
    fireEvent.click(screen.getByRole('button', { name: /revisar/i }));

    const asunto = (await screen.findByLabelText('Asunto')) as HTMLTextAreaElement;
    expect(asunto.value).toBe('Ruido nocturno');
  });

  /** El anti-objetivo del diseño, puesto como prueba. */
  it('no radica nada hasta que el inspector pulsa guardar', async () => {
    pedirRecepcion.mockResolvedValue(MARCADOR);
    render(<HerramientaRadicacion />);

    fireEvent.change(screen.getByLabelText('Qué va a radicar'), { target: { value: 'adjunto la solicitud' } });
    fireEvent.click(screen.getByRole('button', { name: /revisar/i }));
    await screen.findByLabelText('Asunto');

    expect(guardar).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: /guardar/i }));

    await waitFor(() => expect(guardar).toHaveBeenCalledTimes(1));
  });

  it('al guardar muestra el radicado que quedó', async () => {
    pedirRecepcion.mockResolvedValue(MARCADOR);
    render(<HerramientaRadicacion />);

    fireEvent.change(screen.getByLabelText('Qué va a radicar'), { target: { value: 'adjunto la solicitud' } });
    fireEvent.click(screen.getByRole('button', { name: /revisar/i }));
    await screen.findByLabelText('Asunto');
    fireEvent.click(screen.getByRole('button', { name: /guardar/i }));

    expect((await screen.findByRole('status')).textContent).toMatch(/QUE-1/);
  });

  it('si el agente no propone tipología, lo dice y no ofrece guardar', async () => {
    pedirRecepcion.mockResolvedValue('No encaja en ninguna tipología de esta oficina.');
    render(<HerramientaRadicacion />);

    fireEvent.change(screen.getByLabelText('Qué va a radicar'), { target: { value: 'una consulta' } });
    fireEvent.click(screen.getByRole('button', { name: /revisar/i }));

    await waitFor(() => expect(screen.getByText(/No encaja/)).toBeDefined());
    expect(screen.queryByRole('button', { name: /guardar/i })).toBeNull();
  });
});
