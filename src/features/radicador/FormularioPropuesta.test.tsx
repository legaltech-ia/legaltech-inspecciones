// @vitest-environment jsdom
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { FormularioPropuesta } from './FormularioPropuesta';
import { PROPUESTA_VACIA, type PropuestaRadicacion, type TipologiaCatalogo } from '@/shared/catalogo/types';

/**
 * El formulario pinta lo que diga el catálogo del cerebro, no una lista fija.
 *
 * Es lo que hace que la misma pantalla sirva al consultorio jurídico sin tocar
 * TypeScript: si el cerebro declara una tipología nueva, aquí aparece.
 */
afterEach(cleanup);

const CATALOGO: TipologiaCatalogo[] = [
  {
    key: 'querella',
    label: 'Querella',
    filing: 'CREATE',
    stateMachine: 'querella',
    initialState: 'radicada',
    states: ['radicada', 'audiencia_programada'],
    citedArticle: 'art. 223, Ley 1801 de 2016',
    termDays: 15,
    fields: [
      { key: 'querellante', label: 'Querellante', type: 'PARTY', required: true },
      { key: 'direccionInmueble', label: 'Dirección del inmueble', type: 'TEXT', required: false },
    ],
    admissionRequirements: [],
  },
  {
    key: 'apelacion',
    label: 'Apelación',
    filing: 'ATTACH',
    stateMachine: null,
    initialState: null,
    states: [],
    citedArticle: null,
    termDays: null,
    fields: [{ key: 'radicadoOrigen', label: 'Radicado de origen', type: 'TEXT', required: true }],
    admissionRequirements: [],
  },
];

function propuesta(tipo: string | null, campos: Record<string, string | null> = {}): PropuestaRadicacion {
  return { ...PROPUESTA_VACIA, tipoSolicitud: tipo, campos };
}

describe('formulario de la propuesta de radicación', () => {
  it('pinta los campos que declara el catálogo, no una lista fija', () => {
    render(<FormularioPropuesta catalogo={CATALOGO} propuesta={propuesta('querella')} onCambio={vi.fn()} />);

    expect(screen.getByLabelText('Querellante')).toBeDefined();
    expect(screen.getByLabelText('Dirección del inmueble')).toBeDefined();
  });

  it('cambia los campos cuando el inspector cambia la tipología', () => {
    const onCambio = vi.fn();
    render(<FormularioPropuesta catalogo={CATALOGO} propuesta={propuesta('querella')} onCambio={onCambio} />);

    fireEvent.change(screen.getByLabelText('Tipo de solicitud'), { target: { value: 'apelacion' } });

    expect(onCambio).toHaveBeenCalledWith(expect.objectContaining({ tipoSolicitud: 'apelacion' }));
  });

  it('solo ofrece las tipologías del catálogo', () => {
    render(<FormularioPropuesta catalogo={CATALOGO} propuesta={propuesta(null)} onCambio={vi.fn()} />);

    const opciones = Array.from(screen.getByLabelText('Tipo de solicitud').querySelectorAll('option'))
      .map((o) => o.getAttribute('value'))
      .filter((v) => v);

    expect(opciones).toEqual(['querella', 'apelacion']);
  });

  it('marca qué campos llenó la IA, para que el inspector sepa qué revisar', () => {
    render(
      <FormularioPropuesta
        catalogo={CATALOGO}
        propuesta={propuesta('querella', { querellante: 'A. Pérez' })}
        onCambio={vi.fn()}
      />,
    );

    expect(screen.getByLabelText('Querellante').getAttribute('data-origen')).toBe('ia');
    expect(screen.getByLabelText('Dirección del inmueble').getAttribute('data-origen')).toBe('inspector');
  });

  it('dice si la tipología crea expediente o se adjunta a uno', () => {
    render(<FormularioPropuesta catalogo={CATALOGO} propuesta={propuesta('apelacion')} onCambio={vi.fn()} />);

    expect(screen.getByRole('note').textContent).toMatch(/adjunta/i);
  });

  it('explica el problema cuando el catálogo no resuelve, en vez de quedarse en blanco', () => {
    render(<FormularioPropuesta catalogo={undefined} error propuesta={propuesta(null)} onCambio={vi.fn()} />);

    expect(screen.getByRole('alert').textContent).toMatch(/catálogo/i);
  });

  /**
   * Adjuntar al expediente equivocado cuesta mas de deshacer que crear uno de mas, asi
   * que el radicado al que se va a adjuntar es LO QUE MAS tiene que ver el inspector.
   */
  it('una tipologia que se adjunta muestra el radicado destino, y se puede corregir', () => {
    const onCambio = vi.fn();
    render(
      <FormularioPropuesta
        catalogo={CATALOGO}
        propuesta={{ ...propuesta('apelacion'), radicadoReferenciado: 'QUE-2026-00102' }}
        onCambio={onCambio}
      />,
    );

    const destino = screen.getByLabelText('Expediente al que se adjunta') as HTMLInputElement;
    expect(destino.value).toBe('QUE-2026-00102');

    fireEvent.change(destino, { target: { value: 'QUE-2026-00103' } });
    expect(onCambio).toHaveBeenCalledWith(
      expect.objectContaining({ radicadoReferenciado: 'QUE-2026-00103' }),
    );
  });

  it('una tipologia que abre expediente no pide radicado destino', () => {
    render(<FormularioPropuesta catalogo={CATALOGO} propuesta={propuesta('querella')} onCambio={vi.fn()} />);

    expect(screen.queryByLabelText('Expediente al que se adjunta')).toBeNull();
  });
});
