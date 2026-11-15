// @vitest-environment jsdom
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PilaHerramientas } from './PilaHerramientas';

/**
 * AsistentePage montaba la pila sin `ancho`, `colapsada` ni `onColapsar`, así
 * que pulsar «contraer» lanzaba `onColapsar is not a function` en la cara del
 * inspector. Este test pulsa el botón de verdad, no sólo comprueba las props.
 */
// PdfViewer arrastra pdfjs-dist, que al importarse asume un canvas de
// navegador (DOMMatrix) que jsdom no provee. Acá sólo llega por composición.
vi.mock('@/shared/documentos/PdfViewer', () => ({ PdfViewer: () => null }));

afterEach(cleanup);

describe('contraer la pila de herramientas', () => {
  it('pulsar contraer invoca onColapsar sin lanzar', () => {
    const onColapsar = vi.fn();
    render(
      <PilaHerramientas
        abiertas={[]}
        caso={null}
        artefacto={null}
        onAbrir={vi.fn()}
        onCerrar={vi.fn()}
        ancho={392}
        colapsada={false}
        onColapsar={onColapsar}
      />,
    );

    fireEvent.click(screen.getByLabelText('Contraer las herramientas'));

    expect(onColapsar).toHaveBeenCalledWith(true);
  });

  it('pulsar expandir en el riel contraído invoca onColapsar sin lanzar', () => {
    const onColapsar = vi.fn();
    render(
      <PilaHerramientas
        abiertas={[]}
        caso={null}
        artefacto={null}
        onAbrir={vi.fn()}
        onCerrar={vi.fn()}
        ancho={392}
        colapsada
        onColapsar={onColapsar}
      />,
    );

    fireEvent.click(screen.getByLabelText('Expandir las herramientas'));

    expect(onColapsar).toHaveBeenCalledWith(false);
  });
});
