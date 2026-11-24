import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { PALETA } from '@/theme/theme';
import { TEXTO } from '@/theme/escala';

/**
 * La prosa del agente, pintada.
 *
 * El modelo contesta en Markdown; pintado como texto plano el inspector leía
 * `### **Datos faltantes**` en mitad de la respuesta. No se cambió el chat por
 * una librería de chat: lo que faltaba era el renderizador, no el chat.
 *
 * Sin `rehype-raw` a propósito: lo que contesta el modelo es dato, no plantilla,
 * así que el HTML que venga dentro se escapa en vez de ejecutarse.
 */
export function Markdown({ texto }: { texto: string }) {
  return (
    <div style={estilos.raiz}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={componentes}>
        {texto}
      </ReactMarkdown>
    </div>
  );
}

// El agente no escribe el título de la página: sus encabezados son subtítulos
// dentro de una respuesta, y empiezan donde la jerarquía del chat los deja.
const componentes = {
  h1: (props: object) => <h4 style={estilos.titulo} {...props} />,
  h2: (props: object) => <h4 style={estilos.titulo} {...props} />,
  h3: (props: object) => <h4 style={estilos.titulo} {...props} />,
  h4: (props: object) => <h5 style={estilos.titulo} {...props} />,
  p: (props: object) => <p style={estilos.parrafo} {...props} />,
  ul: (props: object) => <ul style={estilos.lista} {...props} />,
  ol: (props: object) => <ol style={estilos.lista} {...props} />,
  li: (props: object) => <li style={estilos.elemento} {...props} />,
  table: (props: object) => <table style={estilos.tabla} {...props} />,
  th: (props: object) => <th style={estilos.celdaTitulo} {...props} />,
  td: (props: object) => <td style={estilos.celda} {...props} />,
  code: (props: object) => <code style={estilos.codigo} {...props} />,
  blockquote: (props: object) => <blockquote style={estilos.cita} {...props} />,
  a: (props: object) => <a style={estilos.enlace} target="_blank" rel="noreferrer" {...props} />,
  hr: () => <hr style={estilos.linea} />,
};

const estilos = {
  raiz: { display: 'grid', gap: 2 },
  titulo: {
    fontSize: TEXTO.base,
    fontWeight: 650,
    color: PALETA.texto,
    margin: '12px 0 2px',
  },
  parrafo: { margin: '0 0 8px' },
  lista: { margin: '0 0 8px', paddingLeft: 20 },
  elemento: { margin: '2px 0' },
  tabla: {
    borderCollapse: 'collapse' as const,
    margin: '4px 0 10px',
    fontSize: TEXTO.menor,
    width: '100%',
  },
  celdaTitulo: {
    textAlign: 'left' as const,
    fontWeight: 650,
    padding: '4px 8px',
    borderBottom: `1px solid ${PALETA.borde}`,
    color: PALETA.textoSuave,
  },
  celda: { padding: '4px 8px', borderBottom: `1px solid ${PALETA.borde}`, verticalAlign: 'top' as const },
  codigo: {
    fontFamily: 'JetBrains Mono, ui-monospace, monospace',
    fontSize: '0.92em',
    background: PALETA.fondo,
    padding: '1px 4px',
    borderRadius: 4,
  },
  cita: {
    margin: '4px 0 10px',
    padding: '2px 0 2px 10px',
    borderLeft: `2px solid ${PALETA.borde}`,
    color: PALETA.textoSuave,
  },
  enlace: { color: PALETA.azul },
  linea: { border: 0, borderTop: `1px solid ${PALETA.borde}`, margin: '10px 0' },
} as const;
