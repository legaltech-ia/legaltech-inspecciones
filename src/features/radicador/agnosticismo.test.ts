import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/**
 * Trinquete de agnosticismo del radicador.
 *
 * La inspección de convivencia es una de once oficinas previstas. Lo único que hace
 * que esta pantalla sepa de querellas es el catálogo del cerebro, así que el código
 * no puede nombrar ninguna tipología: si alguien vuelve a escribir una aquí, esto se
 * pone rojo y hay que llevarla al OKF.
 */
const AQUI = dirname(fileURLToPath(import.meta.url));
const DOMINIO = /querella|comparendo|quejoso|queja\b|acta.?de.?firmeza|apelaci[oó]n/i;

function ficherosDeCodigo(carpeta: string): string[] {
  return readdirSync(carpeta, { withFileTypes: true })
    .flatMap((entrada) => {
      const ruta = join(carpeta, entrada.name);
      if (entrada.isDirectory()) return ficherosDeCodigo(ruta);
      return /\.tsx?$/.test(entrada.name) && !/\.test\.tsx?$/.test(entrada.name) ? [ruta] : [];
    });
}

/**
 * Deuda declarada al levantar el trinquete (23 nov 2026). Son 553 líneas de UI viva y
 * enrutada —`radicar/:tipo`— que montan el chat y la ficha fija de la apelación; su
 * reemplazo es el formulario del catálogo más `guardarPropuesta`, y es trabajo propio.
 *
 * Esta lista SOLO puede encoger. No añadas entradas: lleva la tipología al OKF.
 */
const PENDIENTES = ['RadicarDocumentoPage.tsx', 'useRadicacionIA.ts'];

describe('el radicador no sabe de ninguna tipología', () => {
  it('no aparecen ficheros nuevos que nombren una tipología', () => {
    const culpables = ficherosDeCodigo(AQUI)
      .filter((ruta) => DOMINIO.test(readFileSync(ruta, 'utf8')))
      .map((ruta) => ruta.split(/[\\/]/).pop() as string)
      .filter((nombre) => !PENDIENTES.includes(nombre));

    expect(culpables).toEqual([]);
  });

  it('la deuda declarada no miente: cada entrada sigue nombrando una tipología', () => {
    const vivos = new Set(ficherosDeCodigo(AQUI).map((ruta) => ruta.split(/[\\/]/).pop()));
    const yaResueltos = PENDIENTES.filter(
      (nombre) => !vivos.has(nombre) || !DOMINIO.test(readFileSync(join(AQUI, nombre), 'utf8')),
    );

    expect(yaResueltos).toEqual([]);
  });

  /**
   * La skill `/radicar` se fue: no hablaba con la red, su prompt terminaba diciendo
   * «No radicas nada» y citaba los arts. 231-233 y 223 en literales de TypeScript.
   * El camino vivo es el agente del OKF más `POST /legal/recepcion`.
   *
   * El resto de `skills.ts` SIGUE citando normas en TypeScript, y eso es la misma
   * migración que ya se hizo con los prompts del backend —llevarlos al OKF— pero del
   * lado del frontend: trabajo propio, no de esta tarea. Lo que este test fija es que
   * la de radicación no vuelva.
   */
  it('la skill de radicación no vuelve a TypeScript', () => {
    const skills = readFileSync(join(AQUI, '..', 'asistente', 'skills.ts'), 'utf8');

    expect(skills).not.toContain('/radicar');
    expect(skills).not.toMatch(/arts?\.\s*231/);
  });
});
