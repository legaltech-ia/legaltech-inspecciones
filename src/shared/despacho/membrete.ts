/**
 * El membrete viaja como dataURL dentro de la configuración del despacho, que
 * se persiste en localStorage. Sin tope, una foto de varios MB agota la cuota
 * del navegador y la escritura falla entera: se pierde también municipio,
 * inspector e inspección. El checklist pide 800x200, decenas de KB.
 */
export const LIMITE_MEMBRETE_BYTES = 1_000_000;

export function membreteExcedeLimite(archivo: { size: number }): boolean {
  return archivo.size > LIMITE_MEMBRETE_BYTES;
}
