import {
  buildCaseMetadata,
  parseCaseMetadata,
  type CaseParty,
  type CreateLegalCaseInput,
  type LegalCase,
} from '@/shared/legalCases/types';
import type { PropuestaRadicacion, TipologiaCatalogo } from '@/shared/catalogo/types';

/**
 * Guardar lo que el agente propuso, que es cuando el expediente empieza a existir.
 *
 * La lógica vive aquí y no en el hook para poder probarla sin montar React Query: el
 * hook solo construye los puertos con las mutaciones de verdad.
 */
export interface PuertosGuardado {
  crearCaso: (input: CreateLegalCaseInput) => Promise<LegalCase>;
  buscarPorRadicado: (radicado: string) => Promise<LegalCase | null>;
  parchearCampos: (id: string, fields: Record<string, string>) => Promise<unknown>;
  cambiarEstado: (id: string, state: string) => Promise<unknown>;
  reemplazarPartes: (id: string, partes: CaseParty[]) => Promise<unknown>;
  subirDocumento: (caseId: string, archivo: File) => Promise<unknown>;
}

export interface DespachoGuardado {
  inspeccion: string;
  municipio: string;
}

export interface PeticionGuardado {
  propuesta: PropuestaRadicacion;
  entrada: TipologiaCatalogo;
  archivos: File[];
  despacho: DespachoGuardado;
}

export interface ResultadoGuardado {
  caseId: string;
  filingNumber: string | null;
  modo: TipologiaCatalogo['filing'];
}

export async function guardarPropuesta(
  puertos: PuertosGuardado,
  peticion: PeticionGuardado,
): Promise<ResultadoGuardado> {
  const adjunta = peticion.entrada.filing === 'ATTACH';
  const expediente = adjunta ? await adjuntar(puertos, peticion) : await crear(puertos, peticion);

  // Sobre un expediente que ya existe NO se toca ni su estado ni sus partes. El estado
  // corre la máquina del destino, no la de lo que se adjunta; y `PUT /parties` es
  // reemplazo completo, así que escribir ahí borraría las partes ya registradas —de
  // donde leen Mis procesos, el encabezado del documento y el seudonimizador—.
  if (!adjunta) {
    await aplicarEtapa(puertos, peticion, expediente.caseId);
    await aplicarPartes(puertos, peticion, expediente.caseId);
  }
  await subirTodo(puertos, peticion, expediente.caseId);

  return expediente;
}

async function crear(puertos: PuertosGuardado, peticion: PeticionGuardado): Promise<ResultadoGuardado> {
  const caso = await puertos.crearCaso(entradaDeCreacion(peticion));
  return { caseId: caso.id, filingNumber: caso.filingNumber ?? null, modo: 'CREATE' };
}

/**
 * El agente no consulta la base: solo reporta el radicado que leyó en el documento.
 * Resolverlo es de este lado, y si no resuelve se dice — adjuntar al expediente
 * equivocado cuesta más de deshacer que crear uno de más.
 */
async function adjuntar(puertos: PuertosGuardado, peticion: PeticionGuardado): Promise<ResultadoGuardado> {
  const radicado = peticion.propuesta.radicadoReferenciado?.trim();
  if (!radicado) {
    throw new Error(
      `La tipología «${peticion.entrada.label}» se adjunta a un expediente que ya existe, y la ` +
        'propuesta no trae el radicado al que se refiere. Indíquelo antes de guardar.',
    );
  }

  const caso = await puertos.buscarPorRadicado(radicado);
  if (!caso) {
    throw new Error(
      `No hay ningún expediente con el radicado ${radicado}, así que no se adjunta nada. ` +
        'Verifique el radicado del documento.',
    );
  }

  // FUNDIR, no sobrescribir: `PATCH /fields` con caseMetadata es escritura escalar, así
  // que mandar solo lo nuevo borraría los hechos y la dirección que el expediente ya
  // tenía. Lo nuevo gana sobre la clave repetida; el resto se conserva.
  const yaTenia = parseCaseMetadata<Record<string, unknown>>(caso.caseMetadata ?? null);
  const fundido = { ...yaTenia, ...JSON.parse(metadatos(peticion)) };

  await puertos.parchearCampos(caso.id, { caseMetadata: buildCaseMetadata(fundido) });
  return { caseId: caso.id, filingNumber: caso.filingNumber ?? null, modo: 'ATTACH' };
}

function entradaDeCreacion(peticion: PeticionGuardado): CreateLegalCaseInput {
  const { inspeccion, municipio } = peticion.despacho;
  // className y judicialOfficeId son NOT NULL en el backend, y venueCity encabeza el
  // documento. Un despacho sin configurar NO es Manizales: se dice y no se radica.
  if (!inspeccion.trim() || !municipio.trim()) {
    throw new Error(
      'El despacho no está configurado: falta la inspección o el municipio. Complételo en ' +
        'Ajustes antes de radicar — no se inventa ninguno de los dos.',
    );
  }

  return {
    caseType: peticion.entrada.key,
    className: peticion.entrada.label,
    judicialOfficeId: inspeccion,
    venueCity: municipio,
    caseMetadata: metadatos(peticion),
  };
}

/**
 * Solo las claves que el catálogo declara, y nunca las que marca como persona: un
 * dato que nadie pidió no se guarda, y una persona no se guarda como texto.
 *
 * Las de tipo PARTY viajan por `case_parties` —de donde leen Mis procesos, el
 * encabezado del documento y el seudonimizador—. El agente a veces las devuelve
 * además dentro de `campos`, y ahí el nombre acababa en los metadatos del
 * expediente, cuando no como «[object Object]».
 */
function metadatos(peticion: PeticionGuardado): string {
  const declaradas = new Set(
    peticion.entrada.fields.filter((campo) => campo.type !== 'PARTY').map((campo) => campo.key),
  );
  const campos = Object.entries(peticion.propuesta.campos)
    .filter(([key, valor]) => declaradas.has(key) && valor != null)
    .reduce<Record<string, string>>((acc, [key, valor]) => ({ ...acc, [key]: String(valor) }), {});

  return buildCaseMetadata({
    ...campos,
    ...(peticion.propuesta.observaciones ? { observaciones: peticion.propuesta.observaciones } : {}),
  });
}

/** Solo si el catálogo admite ese estado para esta tipología. */
async function aplicarEtapa(puertos: PuertosGuardado, peticion: PeticionGuardado, caseId: string) {
  const estado = peticion.propuesta.estadoSugerido;
  if (estado && peticion.entrada.states.includes(estado)) {
    await puertos.cambiarEstado(caseId, estado);
  }
}

/**
 * Estructuradas, nunca concatenadas en texto: de `case_parties` leen Mis procesos, el
 * encabezado del fallo y el seudonimizador que decide qué nombres tapar.
 */
async function aplicarPartes(puertos: PuertosGuardado, peticion: PeticionGuardado, caseId: string) {
  const partes: CaseParty[] = peticion.propuesta.partes
    .filter((parte) => parte.nombre?.trim())
    .map((parte) => ({
      partyRole: parte.rol ?? '',
      identificationType: parte.tipoId ?? '',
      identificationNumber: parte.numeroId ?? '',
      fullName: parte.nombre ?? '',
    }));

  if (partes.length > 0) {
    await puertos.reemplazarPartes(caseId, partes);
  }
}

async function subirTodo(puertos: PuertosGuardado, peticion: PeticionGuardado, caseId: string) {
  for (const archivo of peticion.archivos) {
    await puertos.subirDocumento(caseId, archivo);
  }
}
