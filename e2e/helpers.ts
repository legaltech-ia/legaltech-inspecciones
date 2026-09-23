import type { Page } from '@playwright/test';

export const SESION_FAKE = {
  status: 'SUCCESS',
  message: 'OK',
  username: 'inspector.test@legaltech.com.co',
  accessToken: 'fake-access-token-playwright',
  idToken: 'fake-id-token',
  refreshToken: 'fake-refresh-token',
  fullName: 'Inspector de Prueba',
};

/** Workspace context que satisface el bootstrap en main.tsx. */
const WORKSPACE_FAKE = {
  workspaceId: 'ws-test',
  brainId: 'brain-test',
  displayName: 'Inspección de Prueba',
  contextId: 'ctx-test',
};

/**
 * Monta los stubs de API ANTES de cualquier goto.
 * - workspace-context: respuesta mínima para que main.tsx monte React.
 * - resto de /api/*: respuesta vacía genérica.
 */
export async function stubApi(page: Page) {
  await page.route(/\/api\/workspace-context/, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(WORKSPACE_FAKE),
    }),
  );
}

/** Inyecta la sesión via addInitScript (corre antes de cualquier script de la página). */
export async function inyectarSesion(page: Page) {
  await page.addInitScript((sesion) => {
    sessionStorage.setItem('authSession', JSON.stringify(sesion));
  }, SESION_FAKE);
}

/**
 * Navega al panel autenticado y espera a que React monte.
 * Llama a stubApi + inyectarSesion ANTES del goto.
 */
export async function irAlPanel(page: Page, ruta = '') {
  await stubApi(page);
  await inyectarSesion(page);
  await page.goto(`/panel${ruta}`);
  // Espera a que el AppLayout monte (nav lateral o superior siempre presente en /panel)
  // El spinner de Suspense aparece primero; el nav aparece cuando el chunk cargó.
  await page.locator('aside, nav, [role="navigation"], .ant-layout-sider').first()
    .waitFor({ state: 'visible', timeout: 20_000 });
}
