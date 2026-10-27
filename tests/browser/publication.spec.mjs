import {test, expect} from '@playwright/test';

test('Corporate root and SignHub have separate identities, navigation and contacts', async ({page}) => {
  const failures = [];
  page.on('response', response => {if(response.status() >= 400) failures.push(response.url());});
  await page.goto('/');
  await expect(page).toHaveTitle(/OZZYDEV/);
  await expect(page.locator('a[href="mailto:contacto@ozzydev.cl"]')).toBeVisible();
  await page.getByRole('link', {name: 'Explora SignHub'}).click();
  await expect(page).toHaveURL(/\/signhub\/$/);
  await expect(page).toHaveTitle(/SignHub/);
  await page.reload();
  await expect(page.getByText('Video pendiente', {exact:true})).toHaveCount(7);
  await expect(page.locator('a[href="mailto:soporte@ozzydev.cl"]')).toBeVisible();
  await page.getByRole('navigation', {name:'Principal'}).getByRole('link', {name:'OZZYDEV'}).click();
  await expect(page).toHaveURL('http://127.0.0.1:4173/');
  expect(failures).toEqual([]);
});

test('Direct legal links and legacy URLs work without JavaScript; contacts stay separated', async ({browser}) => {
  const context = await browser.newContext({javaScriptEnabled:false});
  const page = await context.newPage();
  for (const prefix of ['/signhub/legal/', '/legal/']) {
    for (const document of ['privacidad', 'terminos', 'eliminar-cuenta', 'menores', 'comunidad', 'promociones']) {
      const response = await page.goto(`${prefix}${document}.html`);
      expect(response.status()).toBe(200);
      await expect(page.getByRole('heading', {level:1})).toBeVisible();
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href',`https://www.ozzydev.cl/signhub/legal/${document}.html`);
      await expect(page.locator('body')).not.toContainText('ozzykundev@gmail.com');
    }
    await page.goto(`${prefix}eliminar-cuenta.html`);
    await expect(page.locator('a[href^="mailto:privacidad@ozzydev.cl"]').first()).toBeVisible();
    await page.getByRole('link',{name:'Volver al proyecto'}).click();
    await expect(page).toHaveURL(/\/signhub\/$/);
  }
  await context.close();
});

test('Directory slash and casing match Pages, corporate layout fits narrow screens', async ({page}) => {
  await page.goto('/signhub');
  await expect(page).toHaveURL(/\/signhub\/$/);
  expect((await page.request.get('/SignHub/')).status()).toBe(404);
  await page.goto('/');
  for(const width of [320,390,768,1280]) {
    await page.setViewportSize({width,height:900});
    expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
  }
  await page.screenshot({path:'test-results/corporate-desktop.png',fullPage:true});
  await page.setViewportSize({width:390,height:844});
  await page.screenshot({path:'test-results/corporate-mobile.png',fullPage:true});
});

test('Deletion request only prepares email for the privacy inbox', async ({page}) => {
  await page.goto('/signhub/legal/eliminar-cuenta.html');
  await page.locator('input[name="email"]').fill('test@example.invalid');
  await page.getByRole('button',{name:'Preparar correo'}).click();
  await expect(page.getByRole('status')).toContainText('privacidad@ozzydev.cl');
  await expect(page.getByRole('status')).toContainText('Aún no se ha enviado');
});
