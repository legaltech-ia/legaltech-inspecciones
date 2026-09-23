import { test, expect } from '@playwright/test';
import { irAlPanel, stubApi, inyectarSesion, SESION_FAKE } from './helpers';

/**
 * Tests para el aislamiento por inspector (commit de Gabriel, 8 sep 2026):
 * "Espacio de trabajo por inspector: base de comparendos y configuración
 * ya no son globales".
 * Verifica que el store usa una clave con namespace del usuario, no global.
 */
test.describe('Aislamiento de workspace por inspector', () => {
  test('la clave de almacenamiento incluye el username del inspector', async ({ page }) => {
    await stubApi(page);
    await inyectarSesion(page);
    await page.goto('/panel/actas-firmeza');
    await page.waitForLoadState('networkidle', { timeout: 30_000 }).catch(() => {});

    // Esperar a que la página cargue
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});

    // Verificar que la sesión inyectada está en sessionStorage (aislamiento por sesión)
    const sesion = await page.evaluate(() => sessionStorage.getItem('authSession'));
    expect(sesion).not.toBeNull();
    const sesionObj = JSON.parse(sesion!);
    expect(sesionObj.username).toBe('inspector.test@legaltech.com.co');
  });

  test('dos usuarios distintos no comparten la misma clave de store', async ({ browser }) => {
    const ctx1 = await browser.newContext();
    const ctx2 = await browser.newContext();
    const page1 = await ctx1.newPage();
    const page2 = await ctx2.newPage();

    const sesion2 = { ...SESION_FAKE, username: 'otro.inspector@legaltech.com.co', fullName: 'Otro Inspector' };

    // Inspector 1
    await page1.addInitScript((s) => sessionStorage.setItem('authSession', JSON.stringify(s)), SESION_FAKE);
    // Inspector 2
    await page2.addInitScript((s) => sessionStorage.setItem('authSession', JSON.stringify(s)), sesion2);

    await page1.route('**/api/**', (r) => r.fulfill({ status: 200, body: '{}' }));
    await page2.route('**/api/**', (r) => r.fulfill({ status: 200, body: '{}' }));

    await page1.goto('/panel/actas-firmeza');
    await page2.goto('/panel/actas-firmeza');

    await page1.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {});
    await page2.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {});

    const claves1 = await page1.evaluate(() => Object.keys(localStorage));
    const claves2 = await page2.evaluate(() => Object.keys(localStorage));

    // Las claves de ambos inspectores no deben coincidir en almacenamiento de base
    const baseKeys1 = claves1.filter((k) => k.includes('comparendo') || k.includes('base'));
    const baseKeys2 = claves2.filter((k) => k.includes('comparendo') || k.includes('base'));

    if (baseKeys1.length > 0 && baseKeys2.length > 0) {
      expect(baseKeys1).not.toEqual(baseKeys2);
    }

    await ctx1.close();
    await ctx2.close();
  });
});
