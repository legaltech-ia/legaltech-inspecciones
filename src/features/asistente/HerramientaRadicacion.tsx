import { useState } from 'react';
import { PALETA } from '@/theme/theme';
import { TEXTO } from '@/theme/escala';
import { pedirRecepcion } from '@/shared/recepcion/api';
import { leerCaseUpdate, limpiarMarcadores } from '@/shared/recepcion/marcadores';
import { PROPUESTA_VACIA, type PropuestaRadicacion } from '@/shared/catalogo/types';
import { PanelPropuesta } from '@/features/radicador/PanelPropuesta';
import { useBorradorRadicacion } from '@/features/radicador/borradorStore';
import { Markdown } from '@/shared/ai/Markdown';

/**
 * Radicar desde el chat general: el inspector suelta los documentos, el agente los
 * lee y propone, y el formulario aparece al lado.
 *
 * El agente **propone**. Mientras el inspector no pulse guardar no existe ningún
 * expediente: `pedirRecepcion` va sin `caseId` y la radicación automática está
 * apagada en el servicio, así que lo único que crea expediente es el botón —el de
 * `PanelPropuesta`, el mismo que usa el chat de radicación.
 */
export function HerramientaRadicacion() {
  // El borrador se persiste por inspector: una sesión vencida manda al login, y sin
  // esto el inspector volvía a un formulario vacío (ver borradorStore).
  const { texto, respuesta, setTexto, proponer } = useBorradorRadicacion();
  const [archivos, setArchivos] = useState<File[]>([]);
  const [leyendo, setLeyendo] = useState(false);
  const [fallo, setFallo] = useState<string | null>(null);

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

      {respuesta && <Markdown texto={respuesta} />}
      {fallo && (
        <p role="alert" style={estilos.error}>
          {fallo}
        </p>
      )}

      <PanelPropuesta archivos={archivos} />
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
  error: { fontSize: TEXTO.menor, color: PALETA.rojo, margin: '2px 0' },
} as const;
