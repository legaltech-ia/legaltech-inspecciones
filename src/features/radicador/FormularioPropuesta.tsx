import { useMemo } from 'react';
import { PALETA, ELEVACION } from '@/theme/theme';
import { TEXTO } from '@/theme/escala';
import { resolverTipologia } from '@/shared/catalogo/tipologia';
import type { CampoCatalogo, PropuestaRadicacion, TipologiaCatalogo } from '@/shared/catalogo/types';

/**
 * El formulario de la propuesta, pintado desde el catálogo del cerebro.
 *
 * No nombra ninguna tipología ni ningún campo: si el cerebro declara una tipología
 * nueva, aquí aparece sin tocar este fichero. Esa es la prueba de que la misma
 * pantalla sirve a otra oficina.
 *
 * Recibe el catálogo y la propuesta por props a propósito: la red queda en el
 * llamador y este componente se puede probar sin montar React Query.
 */
export interface FormularioPropuestaProps {
  catalogo: TipologiaCatalogo[] | undefined;
  propuesta: PropuestaRadicacion;
  onCambio: (propuesta: PropuestaRadicacion) => void;
  /** El catálogo no resolvió: se dice, en vez de pintar un formulario vacío. */
  error?: boolean;
}

export function FormularioPropuesta({ catalogo, propuesta, onCambio, error }: FormularioPropuestaProps) {
  const tipologia = useMemo(
    () => resolverTipologia(catalogo, propuesta.tipoSolicitud),
    [catalogo, propuesta.tipoSolicitud],
  );

  if (error || !catalogo) {
    return (
      <div role="alert" style={estilos.aviso}>
        No se pudo leer el catálogo de tipologías del despacho, así que no hay formulario que
        mostrar. Reintente en un momento; si sigue igual, el cerebro de esta oficina no declara
        tipologías y hay que revisarlo antes de radicar.
      </div>
    );
  }

  const cambiarTipologia = (key: string) =>
    onCambio({ ...propuesta, tipoSolicitud: key || null, campos: {} });

  const cambiarCampo = (key: string, valor: string) =>
    onCambio({ ...propuesta, campos: { ...propuesta.campos, [key]: valor } });

  return (
    <div style={estilos.panel}>
      <label style={estilos.etiqueta} htmlFor="tipoSolicitud">
        Tipo de solicitud
      </label>
      <select
        id="tipoSolicitud"
        style={estilos.control}
        value={tipologia?.key ?? ''}
        onChange={(e) => cambiarTipologia(e.target.value)}
      >
        <option value="">Sin determinar</option>
        {catalogo.map((entrada) => (
          <option key={entrada.key} value={entrada.key}>
            {entrada.label}
          </option>
        ))}
      </select>

      {tipologia && <Encabezado tipologia={tipologia} />}

      {tipologia?.filing === 'ATTACH' && (
        <>
          {/* Lo que MÁS tiene que ver el inspector: adjuntar al expediente equivocado
              cuesta más de deshacer que crear uno de más. El agente solo reporta el
              radicado que leyó en el documento; aquí se corrige. */}
          <label style={estilos.etiqueta} htmlFor="radicadoReferenciado">
            Expediente al que se adjunta
          </label>
          <input
            id="radicadoReferenciado"
            type="text"
            style={{ ...estilos.control, ...estilos.controlDestino }}
            value={propuesta.radicadoReferenciado ?? ''}
            data-origen={propuesta.radicadoReferenciado ? 'ia' : 'inspector'}
            placeholder="Radicado del expediente que ya existe"
            onChange={(e) => onCambio({ ...propuesta, radicadoReferenciado: e.target.value || null })}
          />
        </>
      )}

      {tipologia?.fields.map((campo) => (
        <Campo
          key={campo.key}
          campo={campo}
          valor={propuesta.campos[campo.key] ?? ''}
          llenadoPorIa={propuesta.campos[campo.key] != null}
          onCambio={(valor) => cambiarCampo(campo.key, valor)}
        />
      ))}
    </div>
  );
}

/** Lo que el inspector necesita saber antes de guardar: si esto abre expediente o no. */
function Encabezado({ tipologia }: { tipologia: TipologiaCatalogo }) {
  const destino =
    tipologia.filing === 'ATTACH'
      ? 'Se adjunta al expediente que ya existe; no abre uno nuevo.'
      : 'Abre un expediente nuevo.';
  return (
    <p role="note" style={estilos.nota}>
      {destino}
      {tipologia.citedArticle ? ` ${tipologia.citedArticle}.` : ''}
      {tipologia.termDays ? ` Término: ${tipologia.termDays} días hábiles.` : ''}
    </p>
  );
}

function Campo({
  campo,
  valor,
  llenadoPorIa,
  onCambio,
}: {
  campo: CampoCatalogo;
  valor: string;
  llenadoPorIa: boolean;
  onCambio: (valor: string) => void;
}) {
  // El origen viaja como atributo para que el realce sea del tema y no de este fichero.
  const comunes = {
    id: campo.key,
    value: valor,
    'data-origen': llenadoPorIa ? 'ia' : 'inspector',
    'aria-required': campo.required,
    onChange: (e: { target: { value: string } }) => onCambio(e.target.value),
    style: { ...estilos.control, ...(llenadoPorIa ? estilos.controlIa : {}) },
  };

  return (
    <>
      {/* La etiqueta es exactamente la del catálogo: lo obligatorio lo dice aria-required. */}
      <label style={estilos.etiqueta} htmlFor={campo.key}>
        {campo.label}
      </label>
      {campo.type === 'LONG_TEXT' ? (
        <textarea {...comunes} rows={4} />
      ) : (
        <input {...comunes} type={tipoHtml(campo.type)} />
      )}
    </>
  );
}

function tipoHtml(tipo: CampoCatalogo['type']): string {
  return tipo === 'DATE' ? 'date' : tipo === 'NUMBER' ? 'number' : 'text';
}

const estilos = {
  panel: {
    display: 'grid',
    gap: 6,
    padding: 12,
    background: PALETA.superficie,
    borderRadius: 8,
    boxShadow: ELEVACION.base,
  },
  etiqueta: { fontSize: TEXTO.menor, fontWeight: 600, color: PALETA.textoSuave },
  control: {
    fontSize: TEXTO.base,
    padding: '6px 8px',
    border: `1px solid ${PALETA.borde}`,
    borderRadius: 6,
    background: PALETA.fondo,
    color: PALETA.texto,
  },
  // Lo que llenó la IA se ve distinto: es lo que el inspector tiene que revisar.
  controlIa: { borderColor: PALETA.azul, background: PALETA.azulSuave },
  // El destino se ve distinto del resto: es lo que no se puede deshacer facil.
  controlDestino: { borderColor: PALETA.morado, background: PALETA.moradoBg, fontWeight: 600 },
  nota: { fontSize: TEXTO.menor, color: PALETA.textoSuave, margin: '2px 0 6px' },
  aviso: {
    fontSize: TEXTO.base,
    padding: 12,
    borderRadius: 8,
    border: `1px solid ${PALETA.borde}`,
    color: PALETA.texto,
  },
} as const;
