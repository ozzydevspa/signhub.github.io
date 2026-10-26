import {test, expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';
import {renderInterpretations} from '../../lib/interpretations.mjs';

const root = new URL('../../', import.meta.url);
const source = await readFile(new URL('index.html', root), 'utf8');
const original = JSON.parse(await readFile(new URL('interpretations.json', root), 'utf8'));
const fixture = await readFile(new URL('tests/fixtures/test-pattern.webm', root));
const mediaResponse = {contentType: 'video/webm', body: fixture, headers: {'Accept-Ranges': 'bytes'}};
async function expectNoHorizontalOverflow(page) {
  const layout = await page.evaluate(() => ({
    viewport: innerWidth,
    width: document.documentElement.scrollWidth,
    overflowing: [...document.querySelectorAll('body *')]
      .filter(element => element.getBoundingClientRect().right > innerWidth + 1)
      .slice(0, 8).map(element => element.id || element.className || element.tagName)
  }));
  expect(layout.width, JSON.stringify(layout)).toBeLessThanOrEqual(layout.viewport);
}
async function ready(page, {broken = false, invalid = false, prefix = ''} = {}) {
  const data = structuredClone(original);
  for (const index of [0, 1, 5]) {
    const block = data.blocks[index];
    block.src = 'assets/test-video.webm';
    block.segments.forEach((item, i) => Object.assign(item, {start: i + 0.5, end: i + 1.1}));
  }
  if (invalid) data.blocks[0].segments[0].end = 100;
  if (prefix) await page.route(`**${prefix}/assets/*`, route => route.continue({url: route.request().url().replace(prefix, '')}));
  await page.route('**/assets/test-video.webm', route => broken ? route.abort() : route.fulfill(mediaResponse));
  await page.route(`http://127.0.0.1:4173${prefix}/`, route => route.fulfill({contentType: 'text/html; charset=utf-8', body: renderInterpretations(data, source)}));
  await page.goto(`${prefix}/`);
}

test('Pending state: seven honest placeholders, no video requests, usable on mobile', async ({page}) => {
  const errors = [], media = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => {if (request.resourceType() === 'media') media.push(request.url());});
  await page.goto('/');
  await expect(page.getByText('Video pendiente', {exact: true})).toHaveCount(7);
  await expect(page.locator('video')).toHaveCount(0);
  await page.screenshot({path: 'test-results/landing-desktop.png', fullPage: true});
  for (const width of [320, 360, 390, 650, 768, 1024]) {
    await page.setViewportSize({width, height: 844});
    await expectNoHorizontalOverflow(page);
  }
  // System font metrics differ between Windows and the Linux deployment runner.
  // Exercise wider fallback glyphs without pinning the test to the marketing copy.
  await page.evaluate(() => { document.documentElement.style.fontFamily = 'Verdana, sans-serif'; });
  for (const width of [320, 390, 768]) {
    await page.setViewportSize({width, height: 844});
    await expectNoHorizontalOverflow(page);
  }
  await page.evaluate(() => { document.documentElement.style.removeProperty('font-family'); });
  await page.setViewportSize({width: 390, height: 844});
  await page.screenshot({path: 'test-results/landing-mobile.png', fullPage: true});
  expect(errors).toEqual([]);
  expect(media).toEqual([]);
});

test('Keyboard opens a timed fragment, highlights text, stops at its end and restores focus', async ({page}) => {
  await ready(page);
  const card = page.locator('[data-interpretation="presentacion"]');
  const video = card.locator('video');
  expect(await video.getAttribute('src')).toBeNull();
  await video.evaluate(v => { window.firstSeek = null; v.addEventListener('seeked', () => { window.firstSeek ??= v.currentTime; }); });
  const cue = page.getByRole('button', {name: 'Ver en Lengua de Señas Chilena: Conoce SignHub', exact: true});
  await cue.focus();
  await page.keyboard.press('Enter');
  await expect(video).toBeVisible();
  await expect.poll(() => video.evaluate(v => v.currentTime)).toBeGreaterThanOrEqual(0.5);
  await expect.poll(() => page.evaluate(() => window.firstSeek)).toBeCloseTo(0.5, 1);
  await expect(page.locator('#texto-presentacion')).toHaveClass(/sign-text-active/);
  await expect(card.locator('.sign-status')).toContainText('Fragmento finalizado');
  expect(await video.evaluate(v => v.paused && v.currentTime >= 1.1 && v.currentTime < 1.7)).toBe(true);
  await card.getByRole('button', {name: 'Cerrar video'}).click();
  await expect(cue).toBeFocused();
  await expect(video).toBeHidden();
});

test('Clicking text seeks; changing blocks pauses previous video; a FAQ chapter reveals its answer', async ({page}) => {
  await ready(page);
  const first = page.locator('[data-interpretation="presentacion"]');
  await first.locator('.sign-open').click();
  await expect.poll(() => first.locator('video').evaluate(v => !v.paused)).toBe(true);
  await page.locator('#texto-personal p').click();
  const second = page.locator('[data-interpretation="proyecto"]');
  await expect.poll(() => second.locator('video').evaluate(v => v.currentTime)).toBeGreaterThanOrEqual(1.5);
  expect(await first.locator('video').evaluate(v => v.paused)).toBe(true);
  const faq = page.locator('[data-interpretation="preguntas"]');
  await faq.locator('.sign-open').click();
  await faq.getByRole('button', {name: 'Niños, niñas y adolescentes', exact: true}).click();
  await expect(page.locator('#texto-menores')).toBeVisible();
  await expect.poll(() => faq.locator('video').evaluate(v => v.currentTime)).toBeGreaterThanOrEqual(1.5);
  await page.screenshot({path: 'test-results/ready-player.png', fullPage: true});
});

test('Media errors stay visual, retry works, and invalid timings do not play the wrong text', async ({page}) => {
  await ready(page, {broken: true});
  const card = page.locator('[data-interpretation="presentacion"]');
  await card.locator('.sign-open').click();
  await expect(card.locator('.sign-status')).toContainText('No pudimos cargar');
  await page.unroute('**/assets/test-video.webm');
  await page.route('**/assets/test-video.webm', route => route.fulfill(mediaResponse));
  await card.getByRole('button', {name: 'Ver bloque completo'}).click();
  await expect.poll(() => card.locator('video').evaluate(v => !v.paused)).toBe(true);
  await ready(page, {invalid: true});
  await page.getByRole('button', {name: 'Ver en Lengua de Señas Chilena: Conoce SignHub', exact: true}).click();
  await expect(card.locator('.sign-status')).toContainText('no coincide');
  expect(await card.locator('video').evaluate(v => v.paused)).toBe(true);
});

test('Relative video paths work under the GitHub Pages project prefix', async ({page}) => {
  await ready(page, {prefix: '/signhub.github.io'});
  const card = page.locator('[data-interpretation="presentacion"]');
  await card.locator('.sign-open').click();
  await expect.poll(() => card.locator('video').evaluate(v => !v.paused)).toBe(true);
  expect(await card.locator('video').evaluate(v => v.currentSrc)).toContain('/signhub.github.io/assets/test-video.webm');
});

test('A host without seek support cannot silently play a different fragment', async ({page}) => {
  await ready(page);
  await page.unroute('**/assets/test-video.webm');
  await page.route('**/assets/test-video.webm', route => route.fulfill({contentType: 'video/webm', body: fixture}));
  await page.getByRole('button', {name: 'Ver en Lengua de Señas Chilena: Conoce SignHub', exact: true}).click();
  const card = page.locator('[data-interpretation="presentacion"]');
  await expect(card.locator('.sign-status')).toContainText('no permite saltar');
  expect(await card.locator('video').evaluate(v => v.paused)).toBe(true);
  await card.getByRole('button', {name: 'Ver bloque completo'}).click();
  await expect.poll(() => card.locator('video').evaluate(v => !v.paused)).toBe(true);
});

test('An open player stays within a narrow screen and its controls remain usable', async ({page}) => {
  await page.setViewportSize({width: 320, height: 844});
  await page.emulateMedia({reducedMotion: 'reduce'});
  await ready(page);
  const card = page.locator('[data-interpretation="proyecto"]');
  await card.locator('.sign-open').click();
  await expect(card.locator('video')).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await card.getByRole('button', {name: 'Tu diccionario personal', exact: true}).click();
  await expect(card.locator('.sign-status')).toContainText('Fragmento: Tu diccionario personal');
  await card.screenshot({path: 'test-results/ready-player-mobile.png'});
  await card.getByRole('button', {name: 'Cerrar video'}).click();
  await expect(card.locator('.sign-open')).toBeFocused();
});

test('Without JavaScript all original text and pending notices remain readable', async ({browser}) => {
  const context = await browser.newContext({javaScriptEnabled: false});
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:4173/');
  await expect(page.getByText('Video pendiente', {exact: true})).toHaveCount(7);
  const mainHeading = page.getByRole('heading', {level: 1});
  await expect(mainHeading).toHaveCount(1);
  await expect(mainHeading).toBeVisible();
  await expect(mainHeading).toHaveText(/\S/);
  await context.close();
});
