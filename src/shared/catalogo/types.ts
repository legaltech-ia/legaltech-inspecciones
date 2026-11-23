/**
 * El catálogo de tipologías del cerebro activo, tal como lo sirve legalcase.
 *
 * Es lo único que le dice al frontend qué se puede radicar en esta oficina y qué
 * campos pide cada cosa. Nada de esto se declara aquí: el código no nombra ninguna
 * tipología, y por eso el mismo formulario sirve a otra oficina.
 */
export type ModoGuardado = 'CREATE' | 'ATTACH';

export type TipoCampo = 'TEXT' | 'LONG_TEXT' | 'DATE' | 'NUMBER' | 'PARTY';

export interface CampoCatalogo {
  key: string;
  label: string;
  type: TipoCampo;
  required: boolean;
}

export interface RequisitoAdmision {
  key: string;
  label: string;
  citedArticle: string | null;
}

export interface TipologiaCatalogo {
  key: string;
  label: string;
  /** CREATE abre expediente; ATTACH se adjunta a uno que ya está en el sistema. */
  filing: ModoGuardado;
  stateMachine: string | null;
  initialState: string | null;
  states: string[];
  citedArticle: string | null;
  termDays: number | null;
  fields: CampoCatalogo[];
  admissionRequirements: RequisitoAdmision[];
}

/** Cómo el agente reporta un requisito de admisión: lo mira, no lo resuelve. */
export interface RequisitoEvaluado {
  key: string;
  cumplido: boolean;
  norma: string | null;
}

export interface PartePropuesta {
  rol: string | null;
  tipoId: string | null;
  numeroId: string | null;
  nombre: string | null;
}

/**
 * Lo que el agente propone. El inspector lo corrige y lo guarda; hasta entonces no
 * existe ningún expediente.
 */
export interface PropuestaRadicacion {
  tipoSolicitud: string | null;
  listoParaRadicar: boolean;
  /** Una clave por campo que el catálogo declare para la tipología, y ninguna otra. */
  campos: Record<string, string | null>;
  partes: PartePropuesta[];
  estadoSugerido: string | null;
  /** El radicado que el documento nombra, si se refiere a un proceso anterior. */
  radicadoReferenciado: string | null;
  requisitos: RequisitoEvaluado[];
  observaciones: string | null;
}

export const PROPUESTA_VACIA: PropuestaRadicacion = {
  tipoSolicitud: null,
  listoParaRadicar: false,
  campos: {},
  partes: [],
  estadoSugerido: null,
  radicadoReferenciado: null,
  requisitos: [],
  observaciones: null,
};
