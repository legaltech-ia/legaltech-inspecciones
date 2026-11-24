// @vitest-environment jsdom
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { App } from 'antd';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { CaseParty } from '@/shared/legalCases/types';

/**
 * Cada reemplazo de partes borra e inserta las filas, y legalcase (IDENTITY) les da
 * ids nuevos. Si el expediente en memoria se queda con los viejos, el backend
 * seudonimiza ordenando por los nuevos y esta página rehidrata ordenando por los
 * viejos: con ids que cruzan el salto de dígito (9 contra 10) los dos órdenes no
 * coinciden y [PARTE_1] sale con el nombre de la otra persona dentro de un fallo
 * firmado, sin un solo marcador sin resolver que avise.
 */

const parte = (id: string, partyRole: string, fullName: string, identificationNumber: string): CaseParty => ({
  id,
  partyRole,
  identificationType: 'CC',
  identificationNumber,
  fullName,
});

// Orden lexicográfico (el del backend): «10» antes que «9» -> [PARTE_1] sería la segunda.
const PARTES_VIEJAS = [
  parte('9', 'querellante', 'Primera Persona Ficticia', '0000001'),
  parte('10', 'querellado', 'Segunda Persona Ficticia', '0000002'),
];

// Las que devuelve el PUT: «11» antes que «12» -> [PARTE_1] es la querellante.
const PARTES_NUEVAS = [
  parte('11', 'querellante', 'Primera Persona Ficticia', '0000001'),
  parte('12', 'querellado', 'Segunda Persona Ficticia', '0000002'),
];

const CASO = {
  id: 'c1',
  filingNumber: '2026-00001',
  judicialOfficeId: 'oficina-1',
  caseType: 'querella',
  rulingDate: null,
  venueCity: 'Cali',
  evidenceAssessment: null,
  legalReasoning: null,
  currentStateCode: 'audiencia_programada',
  caseMetadata: null,
  background: null,
  parties: PARTES_VIEJAS,
};

const getLegalCase = vi.fn();
const analizarEstructurado = vi.fn();
const actualizarCampos = vi.fn();
const reemplazarPartes = vi.fn();

vi.mock('./api', () => ({
  getLegalCase: (...args: unknown[]) => getLegalCase(...args),
  analizarEstructurado: (...args: unknown[]) => analizarEstructurado(...args),
  getExpedienteMarkdown: vi.fn(),
}));

vi.mock('@/shared/legalCases/api', () => ({
  useChangeCaseState: () => ({ mutate: vi.fn(), isPending: false }),
  useUpdateCaseFields: () => ({ mutate: actualizarCampos, isPending: false }),
  useReplaceCaseParties: () => ({ mutate: reemplazarPartes, isPending: false }),
}));

vi.mock('@/shared/documentos/api', () => ({
  useUploadCaseDocument: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

// pdfmake/docx no pintan nada aquí y arrastran APIs de navegador que jsdom no da.
vi.mock('@/shared/documentos/documentoLegalPdf', () => ({
  descargarDocumentoLegalPdf: vi.fn(),
  generarDocumentoLegalBlob: vi.fn(),
}));
vi.mock('@/shared/documentos/documentoLegalDocx', () => ({
  descargarDocumentoLegalDocx: vi.fn(),
  generarDocumentoLegalDocxBlob: vi.fn(),
}));

import { AnalisisPage } from './AnalisisPage';

// jsdom no implementa matchMedia y los breakpoints de antd lo usan (mismo stub que
// shared/comparendos/CargarBaseComparendosButton.test.tsx).
if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}

const EXTRAIDAS = [
  { role: 'querellante', fullName: 'Primera Persona Ficticia', identificationNumber: '0000001' },
  { role: 'querellado', fullName: 'Segunda Persona Ficticia', identificationNumber: '0000002' },
];

const CAMPOS_VACIOS = {
  competencia: '',
  antecedents: '',
  tramite: '',
  juridicProblem: '',
  descargos: '',
  pruebasObrantes: '',
  evidences: '',
  necesidadProporcionalidad: '',
  juridicResponse: '',
  juridicFundamentals: '',
  parteResolutiva: '',
  recursos: '',
  audiosTranscriptions: '',
};

beforeEach(() => {
  vi.clearAllMocks();
  getLegalCase.mockResolvedValue(CASO);
  actualizarCampos.mockImplementation(
    (vars: { fields: { caseMetadata?: string } }, opts?: { onSuccess?: (c: unknown) => void }) =>
      opts?.onSuccess?.({ ...CASO, caseMetadata: vars.fields.caseMetadata ?? null }),
  );
  reemplazarPartes.mockImplementation((_vars: unknown, opts?: { onSuccess?: (c: unknown) => void }) =>
    opts?.onSuccess?.({ ...CASO, parties: PARTES_NUEVAS }),
  );
  // 1ª pasada: el análisis extrae las partes de los documentos (lo que dispara el
  // reemplazo). 2ª pasada: el borrador vuelve seudonimizado con los ids nuevos.
  analizarEstructurado
    .mockResolvedValueOnce({ ...CAMPOS_VACIOS, competencia: 'Es competente este despacho.', extractedParties: EXTRAIDAS })
    .mockResolvedValueOnce({ ...CAMPOS_VACIOS, antecedents: 'Compareció [PARTE_1], identificado con [ID_1].' });
});

afterEach(cleanup);

function generar() {
  return fireEvent.click(screen.getByRole('button', { name: /borrador con IA/i }));
}

describe('AnalisisPage rehidrata con los ids que devolvió el reemplazo de partes', () => {
  it('tras reemplazar partes, [PARTE_1] es la parte que ordenan los ids nuevos', async () => {
    render(
      <MemoryRouter>
        <App>
          <AnalisisPage caseId="c1" />
        </App>
      </MemoryRouter>,
    );

    await waitFor(() => expect(screen.getByText('2026-00001')).toBeTruthy());

    generar();
    await waitFor(() => expect(reemplazarPartes).toHaveBeenCalled());
    await waitFor(() => expect(screen.getByDisplayValue('Es competente este despacho.')).toBeTruthy());

    generar();
    await waitFor(() =>
      expect(screen.getByDisplayValue('Compareció Primera Persona Ficticia, identificado con 0000001.')).toBeTruthy(),
    );
    expect(screen.queryByDisplayValue(/Segunda Persona Ficticia/)).toBeNull();
    // Montar la página entera (antd + dos pasadas de análisis) no cabe en los 5 s por
    // defecto cuando la suite corre en paralelo.
  }, 20000);
});
