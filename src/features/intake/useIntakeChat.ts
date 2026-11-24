import { useCallback, useState } from 'react';
import { DESPACHO } from '@/derecho';
import { pedirRecepcion } from '@/shared/recepcion/api';
import { leerCaseFiled, leerCaseUpdate, limpiarMarcadores } from '@/shared/recepcion/marcadores';
import { useBorradorRadicacion } from '@/features/radicador/borradorStore';
import { PROPUESTA_VACIA, type PropuestaRadicacion } from '@/shared/catalogo/types';

export interface ChatMessage {
  rol: 'agente' | 'inspector';
  texto: string;
  streaming?: boolean;
}

/** Lo que emite `<case_filed>` cuando el expediente lo abrió el backend. */
export interface CasoRadicado {
  id: string;
  filingNumber: string;
  currentStateCode: string;
  readyForFallo: boolean;
}

/**
 * La conversación de radicación.
 *
 * Lo que el agente extrae se acumula en el borrador compartido, que es de donde
 * lee el formulario y de donde sale lo que se guarda. Antes vivía en un `draft`
 * propio, de solo lectura y con claves fijas —hechos, pretensión, juzgado—, que
 * el catálogo del cerebro no declara: la ficha se quedaba en «Aún no informado»
 * aunque el agente hubiera leído el documento entero.
 */
export function useIntakeChat() {
  const [mensajes, setMensajes] = useState<ChatMessage[]>([
    {
      rol: 'agente',
      texto: `Buenos días. Soy el asistente de radicación de la ${DESPACHO.nombre}. ¿Cuál es el motivo de su solicitud hoy?`,
    },
  ]);
  const [cargando, setCargando] = useState(false);
  const [casoRadicado, setCasoRadicado] = useState<CasoRadicado | null>(null);

  const enviar = useCallback(
    async (texto: string, archivos?: File[]) => {
      if (!texto.trim() || cargando) return;

      setMensajes((prev) => [
        ...prev,
        { rol: 'inspector', texto: texto.trim() },
        { rol: 'agente', texto: '', streaming: true },
      ]);
      setCargando(true);

      try {
        // Sin caseId: este ES el chat de radicación. Lo que abre el expediente es
        // el botón de guardar del formulario, no esta llamada.
        const respuesta = await pedirRecepcion({ texto: texto.trim(), archivos });
        const leida = leerCaseUpdate<Partial<PropuestaRadicacion>>(respuesta);
        const radicado = leerCaseFiled<CasoRadicado>(respuesta);

        responder(setMensajes, limpiarMarcadores(respuesta));
        if (leida) acumular(leida, archivos);
        if (radicado) setCasoRadicado(radicado);
      } catch {
        responder(setMensajes, 'Hubo un error al procesar la solicitud. Por favor intente de nuevo.');
      } finally {
        setCargando(false);
      }
    },
    [cargando],
  );

  return { mensajes, cargando, enviar, casoRadicado };
}

function responder(setMensajes: React.Dispatch<React.SetStateAction<ChatMessage[]>>, texto: string) {
  setMensajes((prev) => [...prev.slice(0, -1), { rol: 'agente', texto }]);
}

/**
 * Funde el turno sobre lo que ya había: una conversación va completando el caso, y
 * un turno que solo aporta la dirección no puede borrar las partes del anterior.
 * Lo nuevo gana sobre la clave repetida; las listas vacías no pisan a las llenas.
 */
function acumular(leida: Partial<PropuestaRadicacion>, archivos?: File[]) {
  const { propuesta, documentos, proponer } = useBorradorRadicacion.getState();
  const previa = propuesta ?? PROPUESTA_VACIA;

  proponer(
    useBorradorRadicacion.getState().respuesta ?? '',
    {
      ...previa,
      ...soloLoQueTrae(leida),
      campos: { ...previa.campos, ...(leida.campos ?? {}) },
      partes: leida.partes?.length ? leida.partes : previa.partes,
      requisitos: leida.requisitos?.length ? leida.requisitos : previa.requisitos,
    },
    [...documentos, ...(archivos ?? []).map((archivo) => archivo.name)],
  );
}

/** Un hueco no pisa un dato: el agente devuelve null en lo que todavía no sabe. */
function soloLoQueTrae(leida: Partial<PropuestaRadicacion>): Partial<PropuestaRadicacion> {
  return Object.fromEntries(
    Object.entries(leida).filter(([, valor]) => valor !== undefined && valor !== null),
  ) as Partial<PropuestaRadicacion>;
}
