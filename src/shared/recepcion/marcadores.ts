/**
 * El protocolo del agente de recepción: su respuesta es prosa para el humano
 * con marcadores incrustados que llevan los datos estructurados.
 *
 * `<case_update>` trae lo que el agente leyó del caso; `<case_filed>` aparece
 * solo cuando además radicó el expediente (ver IntakeCaseCreationGate en
 * legal). Vive aquí porque lo hablan tres pantallas —el chat de radicación, el
 * de recursos y el área de trabajo del expediente— y cada una tenía su propia
 * copia de las mismas dos expresiones regulares.
 */
// El objeto JSON ancla la captura: el agente nombra el marcador en la prosa
// antes de emitirlo y sin el ancla se leía esa mención en vez del dato.
const CASE_UPDATE_RE = /<case_update>\s*(\{[\s\S]*?\})\s*<\/case_update>/;
const CASE_FILED_RE = /<case_filed>\s*(\{[\s\S]*?\})\s*<\/case_filed>/;
/** La mención entre acentos graves, que no es marcador y no debe cortar el texto. */
const MENCION_RE = /`<\/?case_(?:update|filed)>`/g;

function leerMarcador<T>(texto: string, expresion: RegExp): T | null {
  const encontrado = expresion.exec(texto);
  if (!encontrado) return null;
  try {
    return JSON.parse(encontrado[1]) as T;
  } catch {
    // Un marcador a medio escribir no es un error del que haya que avisar: la
    // prosa del agente sigue siendo útil aunque el JSON venga roto.
    return null;
  }
}

/**
 * El `<case_update>` del agente, con `campos` aplanado al nivel de arriba.
 *
 * El marcador pasó de claves fijas a un `campos` genérico que declara el catálogo del
 * cerebro, y los lectores que ya existían —la ficha del intake, la del recurso y la
 * extracción del área de trabajo— seguían leyendo las claves arriba. Aplanar aquí los
 * recupera en un solo sitio: lo de `campos` sube, y lo que el marcador trae arriba
 * (tipoSolicitud, partes, estadoSugerido, radicadoReferenciado, requisitos) gana si se
 * repite, porque es lo que el protocolo define.
 */
export const leerCaseUpdate = <T>(texto: string): T | null => {
  const bruto = leerMarcador<Record<string, unknown>>(texto, CASE_UPDATE_RE);
  if (!bruto) return null;
  const campos = bruto.campos;
  return (
    campos && typeof campos === 'object' && !Array.isArray(campos)
      ? { ...(campos as Record<string, unknown>), ...bruto }
      : bruto
  ) as T;
};

export const leerCaseFiled = <T>(texto: string): T | null => leerMarcador<T>(texto, CASE_FILED_RE);

/**
 * Deja solo lo que el humano debe leer. Quita también el marcador abierto sin
 * cerrar: mientras la respuesta se está escribiendo, el usuario no debe ver
 * medio JSON apareciendo en el chat.
 */
export function limpiarMarcadores(texto: string): string {
  return texto
    .replace(MENCION_RE, '')
    .replace(/<case_update>[\s\S]*?<\/case_update>/g, '')
    .replace(/<case_filed>[\s\S]*?<\/case_filed>/g, '')
    .replace(/<case_update>[\s\S]*/, '')
    .replace(/<case_filed>[\s\S]*/, '')
    .trim();
}

/** Quita las claves que el agente devolvió vacías: un hueco no pisa un dato. */
export function soloLoQueTrae<T extends object>(campos: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(campos).filter(([, v]) => v !== undefined && v !== null && v !== ''),
  ) as Partial<T>;
}
