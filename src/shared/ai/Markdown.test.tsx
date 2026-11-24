// @vitest-environment jsdom
import { render, screen, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { Markdown } from './Markdown';

/**
 * El modelo contesta en Markdown. Pintado como texto plano, el inspector leía
 * literalmente `### **Datos faltantes**` en medio de la respuesta.
 */
afterEach(cleanup);

describe('la prosa del agente', () => {
  it('pinta los títulos como títulos, no como almohadillas', () => {
    render(<Markdown texto={'### Datos faltantes\n\nFalta el año.'} />);

    expect(screen.getByRole('heading', { name: 'Datos faltantes' })).toBeDefined();
    expect(screen.queryByText(/###/)).toBeNull();
  });

  it('pinta la negrilla como negrilla', () => {
    const { container } = render(<Markdown texto="El **radicado** es obligatorio." />);

    expect(container.querySelector('strong')?.textContent).toBe('radicado');
    expect(container.textContent).not.toMatch(/\*\*/);
  });

  it('pinta las listas como listas: así llega la mitad de lo que contesta', () => {
    const { container } = render(<Markdown texto={'- Querellante\n- Querellado'} />);

    expect(container.querySelectorAll('li')).toHaveLength(2);
  });

  it('pinta las tablas, que es como el agente devuelve los campos', () => {
    const tabla = ['| Campo | Valor |', '| --- | --- |', '| Radicado | QUE-2026-00102 |'].join('\n');

    const { container } = render(<Markdown texto={tabla} />);

    expect(container.querySelector('table')).not.toBeNull();
    expect(container.querySelectorAll('tbody tr')).toHaveLength(1);
  });

  /** Lo que llega del modelo es dato, no plantilla: nada de HTML crudo. */
  it('no ejecuta HTML que venga dentro de la respuesta', () => {
    const { container } = render(<Markdown texto={'<img src=x onerror="alert(1)">\n\nTexto normal.'} />);

    expect(container.querySelector('img')).toBeNull();
    expect(container.textContent).toContain('Texto normal.');
  });

  it('un texto corriente sigue viéndose igual', () => {
    render(<Markdown texto="Buenos días, ¿cuál es el motivo de su solicitud?" />);

    expect(screen.getByText(/Buenos días/)).toBeDefined();
  });
});
