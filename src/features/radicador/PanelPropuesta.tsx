import { useState } from 'react';
import { PALETA } from '@/theme/theme';
import { TEXTO } from '@/theme/escala';
import { useCaseTypeCatalog } from '@/shared/catalogo/api';
import { resolverTipologia } from '@/shared/catalogo/tipologia';
import type { PropuestaRadicacion, TipologiaCatalogo } from '@/shared/catalogo/types';
import { FormularioPropuesta } from './FormularioPropuesta';
import { useBorradorRadicacion } from './borradorStore';
import { useGuardarPropuesta } from './useGuardarPropuesta';

/**
 * La propuesta del agente, revisable y guardable. Lo único que radica.
 *
 * Lo comparten los dos caminos: el chat de radicación —que abre expediente— y la
 * herramienta del chat general —que además adjunta a uno que ya existe—. Antes el
 * primero pintaba una ficha de solo lectura y no tenía botón: el expediente lo abría
 * el backend por su cuenta, y al apagarse esa compuerta («al guardar», decisión de
 * David) ese camino se quedó sin forma de radicar nada.
 */
export function PanelPropuesta({ archivos }: { archivos: File[] }) {
  const { propuesta, documentos, setPropuesta, limpiar } = useBorradorRadicacion();
  const catalogo = useCaseTypeCatalog();
  const guardar = useGuardarPropuesta();
  const [radicado, setRadicado] = useState<string | null>(null);
  const [incidencias, setIncidencias] = useState<string[]>([]);
  const [fallo, setFallo] = useState<string | null>(null);

  const entrada = resolverTipologia(catalogo.data, propuesta?.tipoSolicitud);
  const tipologiaDesconocida = Boolean(propuesta?.tipoSolicitud) && !entrada;
  // Los File no se persisten: si el borrador los recuerda y en memoria no hay
  // ninguno, el expediente nacería sin sus documentos y nadie lo diría.
  const faltanDocumentos = documentos.length > 0 && archivos.length === 0;

  // El radicado se dice aunque el borrador ya esté limpio: es la confirmación de
  // que el expediente existe, y borrarla de la pantalla al guardar es cruel.
  if (radicado) {
    return (
      <div role="status" style={estilos.panel}>
        <p style={estilos.prosa}>
          Radicado {radicado}.{' '}
          {incidencias.length === 0
            ? 'El expediente y sus documentos ya están en el sistema.'
            : 'El expediente ya existe, pero quedó algo pendiente:'}
        </p>
        {/* El expediente YA existe: lo que falta se completa sobre él, no se radica otra vez. */}
        {incidencias.map((incidencia) => (
          <p key={incidencia} style={estilos.error}>
            {incidencia}
          </p>
        ))}
      </div>
    );
  }

  if (!propuesta) return null;

  const confirmar = async () => {
    if (!entrada) return;
    setFallo(null);
    try {
      const hecho = await guardar.mutateAsync({ propuesta, entrada, archivos });
      setRadicado(hecho.filingNumber ?? hecho.caseId);
      setIncidencias(hecho.incidencias);
      // Ya está radicado: dejarlo como borrador lo ofrecería otra vez al recargar.
      limpiar();
    } catch (e) {
      // El borrador NO se toca: lo que el inspector escribió sigue en pantalla.
      setFallo(e instanceof Error ? e.message : 'No se pudo guardar.');
    }
  };

  return (
    <div style={estilos.panel}>
      {tipologiaDesconocida && (
        <p role="alert" style={estilos.error}>
          El agente propuso «{propuesta.tipoSolicitud}», que no es una tipología de este despacho.
          Elíjala abajo antes de guardar.
        </p>
      )}
      {faltanDocumentos && (
        <p role="alert" style={estilos.error}>
          Vuelva a adjuntar {documentos.join(', ')}: los documentos del borrador no se conservan y el
          expediente se guardaría sin ellos.
        </p>
      )}
      {fallo && (
        <p role="alert" style={estilos.error}>
          {fallo}
        </p>
      )}

      <FormularioPropuesta
        catalogo={catalogo.data}
        error={catalogo.isError}
        propuesta={propuesta}
        onCambio={setPropuesta}
      />

      {entrada && <Personas entrada={entrada} propuesta={propuesta} />}

      {entrada && (
        <button type="button" style={estilos.botonPrimario} onClick={confirmar} disabled={guardar.isPending}>
          {guardar.isPending ? 'Guardando…' : 'Guardar y radicar'}
        </button>
      )}
    </div>
  );
}

/**
 * Quiénes quedan registrados. Se muestran porque se guardan: de `case_parties` leen
 * Mis procesos, el encabezado del documento y el seudonimizador, y una parte mal
 * leída que nadie mira se arrastra hasta el fallo.
 */
function Personas({ entrada, propuesta }: { entrada: TipologiaCatalogo; propuesta: PropuestaRadicacion }) {
  const pidePersonas = entrada.fields.some((campo) => campo.type === 'PARTY');
  if (!pidePersonas) return null;

  const etiqueta = (rol: string) =>
    entrada.fields.find((campo) => campo.key === rol)?.label ?? rol;

  return (
    <div style={estilos.personas}>
      <span style={estilos.etiqueta}>Personas</span>
      {propuesta.partes.length === 0 ? (
        <span style={estilos.prosa}>
          Sin personas identificadas todavía: dígaselo al agente en el chat.
        </span>
      ) : (
        propuesta.partes.map((parte, i) => (
          <span key={`${parte.rol}-${i}`} style={estilos.prosa}>
            <strong>{etiqueta(parte.rol ?? '')}:</strong> {parte.nombre}
            {parte.numeroId ? ` (${parte.tipoId ?? 'ID'} ${parte.numeroId})` : ''}
          </span>
        ))
      )}
    </div>
  );
}

const estilos = {
  panel: { display: 'grid', gap: 8 },
  personas: {
    display: 'grid',
    gap: 2,
    padding: '8px 10px',
    borderRadius: 8,
    border: `1px solid ${PALETA.borde}`,
  },
  etiqueta: { fontSize: TEXTO.menor, fontWeight: 600, color: PALETA.textoSuave },
  prosa: { fontSize: TEXTO.menor, color: PALETA.texto, margin: 0 },
  error: { fontSize: TEXTO.menor, color: PALETA.rojo, margin: 0 },
  botonPrimario: {
    fontSize: TEXTO.base,
    padding: '8px 10px',
    borderRadius: 6,
    border: `1px solid ${PALETA.azul}`,
    background: PALETA.azul,
    color: PALETA.superficie,
    cursor: 'pointer',
  },
} as const;
