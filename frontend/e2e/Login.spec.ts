import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:5173';

test.describe('Login Page', () => {
  test.beforeEach(async ({ page }) => {
    // In your test file (e.g. beforeEach)
// await page.addInitScript(() => {
//   (function () {
//     const noop = () => {};
//     const makeNoopProxy = () =>
//       new Proxy(
//         {},
//         {
//           get: () => noop,
//         }
//       );

//     const fakeGL = makeNoopProxy();

//     // Minimal numeric constants some libs might check
//     (fakeGL as any).FLOAT = 5126;
//     (fakeGL as any).UNSIGNED_BYTE = 5121;
//     (fakeGL as any).TRIANGLES = 4;

//     // Minimal no-op implementations used by many libs
//     fakeGL.getExtension = () => null;
//     fakeGL.createTexture = noop;
//     fakeGL.bindTexture = noop;
//     fakeGL.texImage2D = noop;
//     fakeGL.texParameteri = noop;
//     fakeGL.generateMipmap = noop;
//     fakeGL.createBuffer = noop;
//     fakeGL.bindBuffer = noop;
//     fakeGL.bufferData = noop;
//     fakeGL.createShader = noop;
//     fakeGL.shaderSource = noop;
//     fakeGL.compileShader = noop;
//     fakeGL.createProgram = noop;
//     fakeGL.attachShader = noop;
//     fakeGL.linkProgram = noop;
//     fakeGL.useProgram = noop;
//     fakeGL.getAttribLocation = () => 0;
//     fakeGL.enableVertexAttribArray = noop;
//     fakeGL.vertexAttribPointer = noop;
//     fakeGL.drawArrays = noop;
//     fakeGL.viewport = noop;
//     fakeGL.clearColor = noop;
//     fakeGL.clear = noop;

//     // Override canvas.getContext so code receives fakeGL
//     // Note: function runs in browser context
//     HTMLCanvasElement.prototype.getContext = function (_type: any) {
//       return fakeGL;
//     };

//     // Ensure WebGLRenderingContext exists
//     if (typeof (window as any).WebGLRenderingContext === 'undefined') {
//       (window as any).WebGLRenderingContext = function WebGLRenderingContext() {};
//     }
//   })();
// });

    await page.goto(`${BASE}/login`);
  });

  test('login page shows UI elements', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Welcome Back' })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Username' })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Password' })).toBeVisible();
    await expect(page.getByRole('button', { name: /Sign In|Sign In to/i })).toBeVisible();
    await expect(page.getByRole('checkbox', { name: /Remember me/i })).toBeVisible();
    await expect(page.getByText('Seamless Multi-Cluster')).toBeVisible();
    await expect(page.getByText('Built for the Future.')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Toggle full screen' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'English' })).toBeVisible();
    await expect(page.locator('canvas')).toBeVisible();
  });

  test('success with admin/admin logs in and redirects', async ({ page }) => {
    await page.getByRole('textbox', { name: 'Username' }).fill('admin');
    await page.getByRole('textbox', { name: 'Password' }).fill('admin');
    await page.getByRole('button', { name: /Sign In|Sign In to/i }).click();

    await expect(page).toHaveURL('/', { timeout: 10000 });
  });

  test('remember me checkbox persists behavior', async ({ page }) => {
    await page.getByRole('textbox', { name: 'Username' }).fill('admin');
    await page.getByRole('textbox', { name: 'Password' }).fill('admin');
    await page.getByRole('checkbox', { name: /Remember me/i }).check();
    await page.getByRole('button', { name: /Sign In|Sign In to/i }).click();

    await expect(page).toHaveURL('/', { timeout: 10000 });

    const token = await page.evaluate(() => localStorage.getItem('jwtToken'));
    expect(token).toBeTruthy();
  });
});
