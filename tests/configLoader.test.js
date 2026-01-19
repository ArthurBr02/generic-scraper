const path = require('path');
const { loadConfig, validateConfig } = require('../src/utils/configLoader');

test('loads and validates default config', () => {
  const config = loadConfig({ configPath: path.join(__dirname, '..', 'data', 'config.json') });
  expect(config).toBeDefined();
  const { valid } = validateConfig(config, path.join(__dirname, '..', 'data', 'schema.json'));
  expect(valid).toBe(true);
});
