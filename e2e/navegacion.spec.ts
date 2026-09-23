import { test, expect } from '@playwright/test';
import { irAlPanel } from './helpers';

const RUTAS = [
  { path: '', label: /dashboard|inicio|bienvenido|panel/i },
  { path: '/procesos', label: /mis procesos|expedientes/i },
  { path: '/querellas', label: /querella|nueva querella/i },
  { path: '/comparendos', label: /comparendo/i },
  { path: '/actas-firmeza', label: /actas de firmeza|firmeza/i },
  { path: '/ajustes', label: /ajustes|configuraci/i },
];

test.describe('Navegación — rutas del panel cargan', () => {
  for (const { path, label } of RUTAS) {
    test(`/panel${path} renderiza contenido reconocible`, async ({ page }) => {
      await irAlPanel(page, path);
      // React montó — verificar que la sección tiene texto esperado
      await expect(page.getByText(label).first()).toBeVisible({ timeout: 15_000 });
    });
  }
});
