import assert from 'node:assert/strict';
import {stat} from 'node:fs/promises';
import path from 'node:path';

const escape = value => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const icon = '<svg viewBox="0 0 32 32" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M11 27H7a3 3 0 0 1-3-3v-6a2 2 0 0 1 4 0v3h3M11 27h5a4 4 0 0 0 4-4V12a2 2 0 0 0-4 0v6M16 18V8a2 2 0 0 0-4 0v10M12 18v-7a2 2 0 0 0-4 0v7M23 6l2-2m0 7h3m-5 5 2 2"/></svg>';

export async function validateInterpretations(data, html, root) {
  assert.equal(data.language, 'Lengua de Señas Chilena');
  assert(Array.isArray(data.blocks) && data.blocks.length > 0, 'Missing interpretation blocks');
  const ids = new Set(), targets = new Set();
  async function asset(value, extensions) {
    if (value === null) return;
    assert(typeof value === 'string' && value.length > 0, 'Use null for an unpublished asset');
    if (value.startsWith('https://')) {
      const url = new URL(value);
      assert(!url.username && !url.password, 'Do not put credentials in a public video URL');
      return;
    }
    assert(/^assets\/[\w./-]+$/.test(value) && !value.split('/').includes('..'), 'Use assets/... or a public HTTPS URL');
    assert(extensions.includes(path.extname(value).toLowerCase()), 'Unsupported media extension');
    assert((await stat(path.join(root, value))).isFile(), `Missing asset: ${value}`);
  }
  for (const block of data.blocks) {
    assert(/^[a-z][a-z0-9-]*$/.test(block.id) && !ids.has(block.id), 'Invalid or duplicate block id');
    ids.add(block.id);
    assert(typeof block.title === 'string' && block.title.trim(), 'Missing title');
    assert.equal(html.split(`<!-- interpretation:${block.id} -->`).length - 1, 1, `Expected one slot for ${block.id}`);
    await asset(block.src, ['.mp4', '.webm']);
    await asset(block.poster, ['.jpg', '.jpeg', '.png', '.webp']);
    assert(Array.isArray(block.segments) && block.segments.length > 0, 'Missing text segments');
    let previousEnd = 0;
    for (const segment of block.segments) {
      assert(/^[a-z][a-z0-9-]*$/.test(segment.target) && !targets.has(segment.target), 'Duplicate or invalid text target');
      targets.add(segment.target);
      assert.equal(html.split(`id="${segment.target}"`).length - 1, 1, `Missing or duplicate text: ${segment.target}`);
      assert(typeof segment.label === 'string' && segment.label.trim(), 'Missing segment label');
      if (segment.start === null && segment.end === null) continue;
      assert(Number.isFinite(segment.start) && segment.start >= 0 && Number.isFinite(segment.end) && segment.end > segment.start, 'Invalid segment time range');
      assert(segment.start >= previousEnd, 'Segments must be ordered and must not overlap');
      previousEnd = segment.end;
    }
  }
  assert.equal((html.match(/<!-- interpretation:/g) || []).length, ids.size, 'Unknown interpretation slot');
}

export function renderInterpretations(data, html) {
  for (const block of data.blocks) {
    const title = escape(block.title), available = Boolean(block.src);
    const card = `<aside class="interpretation ${available ? 'is-available' : 'is-pending'}" data-interpretation="${block.id}" aria-labelledby="sign-title-${block.id}">
      <div class="sign-summary"><span class="sign-icon">${icon}</span><div class="sign-heading"><span class="sign-kicker">En lengua de señas chilena</span><h3 id="sign-title-${block.id}">${title}</h3><p>${available ? 'La interpretación de este bloque, a tu ritmo.' : 'Estamos preparando la interpretación de este bloque.'}</p></div>
      ${available ? `<button type="button" class="button sign-open" aria-expanded="false" aria-controls="sign-panel-${block.id}" hidden><span aria-hidden="true">▷</span> Ver en LSCh</button><noscript><a href="${escape(block.src)}">Abrir video de interpretación</a></noscript>` : '<span class="sign-pending-label">Video pendiente</span>'}</div>
      ${available ? `<div id="sign-panel-${block.id}" class="sign-panel" hidden><video controls playsinline muted preload="none" aria-label="Interpretación en Lengua de Señas Chilena: ${title}"></video><p class="sign-status" role="status" aria-live="polite"></p><div class="sign-player-actions"><button type="button" class="sign-full">Ver bloque completo</button><button type="button" class="sign-close">Cerrar video</button></div><p class="sign-help">Elige un fragmento aquí o junto al texto. Cada fragmento se pausa al terminar.</p><div class="sign-chapters" role="group" aria-label="Fragmentos: ${title}"></div></div>` : ''}
    </aside>`;
    html = html.replace(`<!-- interpretation:${block.id} -->`, () => card);
  }
  const json = JSON.stringify(data).replaceAll('<', '\\u003c');
  return html.replace('</body>', `<script id="sign-interpretations" type="application/json">${json}</script><script type="module" src="assets/interpretations.js"></script></body>`);
}
