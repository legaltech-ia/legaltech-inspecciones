import { test, expect } from '@playwright/test';
import { irAlPanel } from './helpers';

/**
 * Tests del módulo de Actas de Firmeza (Gabriel Ladino, sep 7-8 2026).
 * Opera 100% en cliente — FileReader + docxtemplater — sin backend.
 */
test.describe('Actas de Firmeza — módulo offline', () => {
  test.beforeEach(async ({ page }) => {
    await irAlPanel(page, '/actas-firmeza');
  });

  test('página carga y muestra el botón de cargar base', async ({ page }) => {
    await expect(
      page.getByText(/cargar base|base de comparendos/i).first(),
    ).toBeVisible({ timeout: 10_000 });
  });

  test('muestra estado vacío o tabla cuando no hay base cargada', async ({ page }) => {
    const tabla = page.locator('.ant-table');
    const vacio = page.getByText(/sin comparendos|cargue la base|no hay datos|sin registros|sin expedientes/i);
    await expect(tabla.or(vacio).first()).toBeVisible({ timeout: 10_000 });
  });

  test('botón de generación masiva existe en el DOM', async ({ page }) => {
    const btn = page.getByRole('button', { name: /generar todas|actas/i });
    await expect(btn.first()).toBeAttached({ timeout: 10_000 });
  });

  test('campo de búsqueda/filtro está presente', async ({ page }) => {
    const search = page
      .getByRole('searchbox')
      .or(page.locator('input[placeholder]').first());
    await expect(search.first()).toBeVisible({ timeout: 10_000 });
  });
});
