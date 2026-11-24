import { useState } from 'react';
import { PALETA } from '@/theme/theme';
import { TEXTO } from '@/theme/escala';
import { pedirRecepcion } from '@/shared/recepcion/api';
import { leerCaseUpdate, limpiarMarcadores } from '@/shared/recepcion/marcadores';
import { useCaseTypeCatalog } from '@/shared/catalogo/api';
import { PROPUESTA_VACIA, type PropuestaRadicacion } from '@/shared/catalogo/types';
import { FormularioPropuesta } from '@/features/radicador/FormularioPropuesta';
import { useBorradorRadicacion } from '@/features/radicador/borradorStore';
import { resolverTipologia } from '@/shared/catalogo/tipologia';
import { useGuardarPropuesta } from '@/features/radicador/useGuardarPropuesta';

/**
 * Radicar desde el chat general: el inspector suelta los documentos, el agente los
 * lee y propone, y el formulario aparece al lado.
 *
 * El agente **propone**. Mientras el inspector no pulse guardar no existe ningún
 * expediente: `pedirRecepcion` va sin `caseId` y la radicación automática está
 * apagada en el servicio, así que lo único que crea expediente es el botón.
 */
export function HerramientaRadicacion() {
  // El borrador se persiste por inspector: una sesión vencida manda al login, y sin
  // esto el inspector volvía a un formulario vacío (ver borradorStore).
  const { texto, respuesta, propuesta, documentos, setTexto, setPropuesta, proponer, limpiar } =
    useBorradorRadicacion();
  const [archivos, setArchivos] = useState<File[]>([]);
  const [radicado, setRadicado] = useState<string | null>(null);
  const [leyendo, setLeyendo] = useState(false);
  const [fallo, setFallo] = useState<string | null>(null);

  // Los File no se persisten: si el borrador los recuerda y en memoria no hay
  // ninguno, el expediente nacería sin sus documentos y nadie lo diría.
  const faltanDocumentos = documentos.length > 0 && archivos.length === 0;

  const catalogo = useCaseTypeCatalog();
  const guardar = useGuardarPropuesta();

  const entrada = resolverTipologia(catalogo.data, propuesta?.tipoSolicitud);
  // El agente propuso algo que el catálogo no declara: sin esto el inspector se
  // quedaba sin botón de guardar y sin saber por qué.
  const tipologiaDesconocida = Boolean(propuesta?.tipoSolicitud) && !entrada;

  const revisar = async () => {
    setLeyendo(true);
    setFallo(null);
    try {
      const contestacion = await pedirRecepcion({ texto, archivos });
      const leida = leerCaseUpdate<PropuestaRadicacion>(contestacion);
      proponer(
        limpiarMarcadores(contestacion),
        leida ? { ...PROPUESTA_VACIA, ...leida } : null,
        archivos.map((archivo) => archivo.name),
      );
    } catch {
      setFallo('No se pudo leer el documento. Intente de nuevo.');
    } finally {
      setLeyendo(false);
    }
  };

  const confirmar = async () => {
    if (!propuesta || !entrada) return;
    setFallo(null);
    try {
      const hecho = await guardar.mutateAsync({ propuesta, entrada, archivos });
      setRadicado(hecho.filingNumber ?? hecho.caseId);
      // Ya está radicado: dejarlo como borrador lo ofrecería otra vez al recargar.
      limpiar();
      setArchivos([]);
    } catch (e) {
      setFallo(e instanceof Error ? e.message : 'No se pudo guardar.');
    }
  };

  return (
    <div style={estilos.panel}>
      <label style={estilos.etiqueta} htmlFor="queRadicar">
        Qué va a radicar
      </label>
      <textarea
        id="queRadicar"
        rows={3}
        style={estilos.control}
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        placeholder="Describa el asunto o adjunte los documentos y el agente los revisa."
      />
      <input
        type="file"
        multiple
        aria-label="Documentos"
        style={estilos.control}
        onChange={(e) => setArchivos(Array.from(e.target.files ?? []))}
      />
      <button type="button" style={estilos.boton} onClick={revisar} disabled={leyendo || !texto.trim()}>
        {leyendo ? 'Revisando…' : 'Revisar documentos'}
      </button>

      {respuesta && <p style={estilos.prosa}>{respuesta}</p>}
      {fallo && (
        <p role="alert" style={estilos.error}>
          {fallo}
        </p>
      )}
      {tipologiaDesconocida && (
        <p role="alert" style={estilos.error}>
          El agente propuso «{propuesta?.tipoSolicitud}», que no es una tipología de este
          despacho. Elíjala en el formulario antes de guardar.
        </p>
      )}
      {faltanDocumentos && (
        <p role="alert" style={estilos.error}>
          Vuelva a adjuntar {documentos.join(', ')}: los documentos del borrador no se conservan y el
          expediente se guardaría sin ellos.
        </p>
      )}

      {propuesta && (
        <FormularioPropuesta
          catalogo={catalogo.data}
          error={catalogo.isError}
          propuesta={propuesta}
          onCambio={setPropuesta}
        />
      )}

      {propuesta && entrada && !radicado && (
        <button type="button" style={estilos.botonPrimario} onClick={confirmar} disabled={guardar.isPending}>
          {guardar.isPending ? 'Guardando…' : 'Guardar y radicar'}
        </button>
      )}

      {radicado && (
        <p role="status" style={estilos.prosa}>
          Radicado {radicado}. El expediente y sus documentos ya están en el sistema.
        </p>
      )}
    </div>
  );
}

const estilos = {
  panel: { display: 'grid', gap: 6, padding: 12 },
  etiqueta: { fontSize: TEXTO.menor, fontWeight: 600, color: PALETA.textoSuave },
  control: {
    fontSize: TEXTO.base,
    padding: '6px 8px',
    border: `1px solid ${PALETA.borde}`,
    borderRadius: 6,
    background: PALETA.superficie,
    color: PALETA.texto,
  },
  boton: {
    fontSize: TEXTO.base,
    padding: '6px 10px',
    borderRadius: 6,
    border: `1px solid ${PALETA.borde}`,
    background: PALETA.superficie,
    color: PALETA.texto,
    cursor: 'pointer',
  },
  botonPrimario: {
    fontSize: TEXTO.base,
    padding: '6px 10px',
    borderRadius: 6,
    border: `1px solid ${PALETA.azul}`,
    background: PALETA.azul,
    color: PALETA.superficie,
    cursor: 'pointer',
  },
  prosa: { fontSize: TEXTO.menor, color: PALETA.texto, margin: '2px 0' },
  error: { fontSize: TEXTO.menor, color: PALETA.rojo, margin: '2px 0' },
} as const;
