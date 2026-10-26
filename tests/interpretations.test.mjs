import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {validateInterpretations, renderInterpretations} from '../lib/interpretations.mjs';

const root = new URL('../', import.meta.url);
const html = await readFile(new URL('index.html', root), 'utf8');
const original = JSON.parse(await readFile(new URL('interpretations.json', root), 'utf8'));
const validate = data => validateInterpretations(data, html, fileURLToPath(root));
test('Every block and text target exists; unpublished videos have no empty player', async () => {
  await validate(original);
  const output = renderInterpretations(original, html);
  assert.equal((output.match(/Video pendiente/g) || []).length, 7);
  assert(!output.includes('<video'));
  assert(!output.includes('<!-- interpretation:'));
});
test('Reject invalid, overlapping and partially specified times', async () => {
  for (const values of [[-1, 1], [2, 1], [0, null], ['0', 1]]) {
    const data = structuredClone(original);
    [data.blocks[0].segments[0].start, data.blocks[0].segments[0].end] = values;
    await assert.rejects(validate(data), /Invalid segment/);
  }
  const data = structuredClone(original);
  Object.assign(data.blocks[1].segments[0], {start: 0, end: 5});
  Object.assign(data.blocks[1].segments[1], {start: 4, end: 8});
  await assert.rejects(validate(data), /overlap/);
});
test('Reject broken text bindings and unsafe or missing video sources', async () => {
  const missing = structuredClone(original);
  missing.blocks[0].segments[0].target = 'missing';
  await assert.rejects(validate(missing), /Missing or duplicate text/);
  for (const src of ['', 'javascript:alert(1)', '../secret.mp4', 'assets/../secret.mp4', 'https://user:password@example.com/video.mp4', 'assets/missing.mp4']) {
    const data = structuredClone(original);
    data.blocks[0].src = src;
    await assert.rejects(validate(data));
  }
});
test('Videos can be independent or share a source; whole-block video can precede timestamps', async () => {
  const data = structuredClone(original);
  data.blocks[0].src = data.blocks[1].src = 'https://example.com/interpretacion.mp4';
  await validate(data);
  const output = renderInterpretations(data, html);
  assert.equal((output.match(/<video /g) || []).length, 2);
  assert.equal((output.match(/preload="none"/g) || []).length, 2);
  assert(!output.includes('<video src='));
});
test('Manifest content cannot close the inline JSON script', () => {
  const data = structuredClone(original);
  data.blocks[0].title = '</script><script>alert(1)</script>';
  const output = renderInterpretations(data, html);
  assert(!output.includes('</script><script>alert(1)'));
  assert(output.includes('\\u003c/script>'));
});
