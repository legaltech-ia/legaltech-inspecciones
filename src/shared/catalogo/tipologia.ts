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
    catalogo.find((entrada) => normalizar(entrada.label) === buscado)
  );
}
