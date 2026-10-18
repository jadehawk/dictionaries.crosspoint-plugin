import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
const root = new URL('../dictionaries.crosspoint-plugin/', import.meta.url);
const get = async (path) => JSON.parse(await readFile(new URL(path, root), 'utf8'));
const manifest = await get('manifest.json');
const device = await get('device.json');
const index = await get('catalog/index.json');
test('manifest and device metadata agree', () => {
  assert.equal(manifest.name, 'dictionaries');
  assert.equal(manifest.version, device.version);
  assert.match(manifest.version, /^\d+\.\d+\.\d+$/);
});
test('every manifest path exists', async () => {
  for (const file of manifest.files) await readFile(new URL(file, root));
});
test('standalone catalog contains all dictionary pages', async () => {
  const prefix = 'https://github.com/jadehawk/dictionaries.crosspoint-plugin/releases/download/dictionaries/';
  assert.ok(index.items.length > 0);
  for (const entry of index.items) {
    assert.equal(entry.base, prefix);
    assert.deepEqual(entry.files, [entry.id+'.ifo',entry.id+'.idx',entry.id+'.dict.dz']);
  }
  let all = [];
  for (let page=1;page<=Math.ceil(index.items.length / device.browse.page_size);page++) {
    const catalog = await get('catalog/all-'+page+'.json');
    all.push(...catalog.items.slice(0, device.browse.page_size));
  }
  assert.deepEqual(all.map(e=>e.id), index.items.map(e=>e.id));
});
test('runtime uses standalone catalog URLs', async () => {
  const plugin = await readFile(new URL('plugin.js', root), 'utf8');
  assert.match(device.browse.url,/jadehawk\/dictionaries.crosspoint-plugin/);
  assert.match(plugin,/jadehawk\/dictionaries.crosspoint-plugin/);
  assert.doesNotMatch(plugin,/itsthisjustin\/sd-plugins/);
});
