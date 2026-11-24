import type { TipologiaCatalogo } from './types';

/** Para comparar lo que escribió un modelo con lo que declara el catálogo. */
const normalizar = (valor: string) =>
  valor
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();

/**
 * La tipología que el agente propuso, buscada primero por `key` —que es el
 * contrato— y después por `label`.
 *
 * El prompt exige la `key`, pero el agente devuelve texto y a veces devuelve el
 * label. Comparando solo la `key`, «Apelación» no encontraba nada y el inspector
 * se quedaba sin campos ni botón de guardar, sin explicación. Nada de adivinar:
 * o coincide con una de las dos, o no hay tipología.
 */
export function resolverTipologia(
  catalogo: TipologiaCatalogo[] | undefined,
  propuesto: string | null | undefined,
): TipologiaCatalogo | undefined {
  if (!catalogo || !propuesto) return undefined;
  const buscado = normalizar(propuesto);
  return (
    catalogo.find((entrada) => normalizar(entrada.key) === buscado) ??
    catalogo.find((entrada) => normalizar(entrada.label) === buscado) ??
    porUnaLetra(catalogo, buscado)
  );
}

/**
 * Último recurso: una sola letra de diferencia, y solo si una única tipología queda
 * a esa distancia.
 *
 * Medido contra el modelo real: en 2 de cada 4 corridas devuelve la clave con una
 * letra de más. Con un catálogo de pocas entradas distintas eso no es ambiguo, y la
 * elegida se ve en el desplegable. Si hay dos candidatas no se elige ninguna: adivinar
 * la tipología es peor que preguntarla.
 */
function porUnaLetra(catalogo: TipologiaCatalogo[], buscado: string): TipologiaCatalogo | undefined {
  const cerca = catalogo.filter(
    (entrada) => aUnaEdicion(normalizar(entrada.key), buscado) || aUnaEdicion(normalizar(entrada.label), buscado),
  );
  return cerca.length === 1 ? cerca[0] : undefined;
}

/** Distancia de edición de exactamente uno: una letra cambiada, metida o quitada. */
function aUnaEdicion(a: string, b: string): boolean {
  if (Math.abs(a.length - b.length) > 1) return false;
  const [corta, larga] = a.length <= b.length ? [a, b] : [b, a];

  let i = 0;
  let j = 0;
  let diferencias = 0;
  while (i < corta.length && j < larga.length) {
    if (corta[i] === larga[j]) {
      i += 1;
      j += 1;
      continue;
    }
    if (++diferencias > 1) return false;
    j += 1;
    if (corta.length === larga.length) i += 1;
  }
  return diferencias + (larga.length - j) === 1;
}
