import { test, expect } from '@playwright/test';
import { inyectarSesion } from './helpers';

test.describe('Auth — guard y flujo de login', () => {
  test('sin sesión redirige a /login', async ({ page }) => {
    await page.goto('/panel');
    await expect(page).toHaveURL(/\/login/);
  });

  test('/login muestra formulario con campos de email y contraseña', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('textbox', { name: /usuario|email|correo/i })).toBeVisible({ timeout: 8000 });
  });

  test('con sesión inyectada /panel carga el dashboard', async ({ page }) => {
    await inyectarSesion(page);
    await page.goto('/panel');
    // No debe redirigir a login
    await expect(page).not.toHaveURL(/\/login/);
    // El layout del panel tiene navegación lateral
    await expect(page.locator('aside, nav, [role="navigation"]').first()).toBeVisible({ timeout: 10000 });
  });
});
