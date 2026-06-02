/**
 * ESM loader — mocks models/index.js so unit tests avoid a real DB connection.
 *
 * Usage: NODE_OPTIONS="--import=./test/mock-models.mjs" mocha ...
 */
import { register } from 'node:module';
import { pathToFileURL, fileURLToPath } from 'node:url';

// Compute the absolute file URL for models/index.js relative to this loader.
const loaderDir = new URL('.', import.meta.url);
const modelsUrl = new URL('../models/index.js', loaderDir).href;

// Write a mock module to disk so the hook can resolve to a file (preserves functions).
const mockCode = `export default {
  Sequelize: { Op: {} },
  Translation: {
    findAll: async () => [],
  },
};
`;
const mockUrl = new URL('./mock-models-impl.mjs', loaderDir).href;

register('data:text/javascript,' + encodeURIComponent(`
import { writeFileSync } from 'node:fs';
const mockUrl = ${JSON.stringify(mockUrl)};
const modelsUrl = ${JSON.stringify(modelsUrl)};
const mockCode = ${JSON.stringify(mockCode)};
writeFileSync(new URL(mockUrl), mockCode);
export async function resolve(specifier, context, nextResolve) {
  const parentUrl = context?.parentURL;
  let resolved = specifier;
  if (parentUrl && (specifier.startsWith('./') || specifier.startsWith('../'))) {
    try { resolved = new URL(specifier, parentUrl).href; } catch {}
  }
  if (resolved === modelsUrl) {
    return { url: mockUrl, shortCircuit: true };
  }
  return nextResolve(specifier, context);
}
`), import.meta.url);
