const fs = require('fs');
const path = require('path');
const Ajv = require('ajv');

const DEFAULT_CONFIG = path.join(__dirname, '..', '..', 'data', 'config.json');
const DEFAULT_SCHEMA = path.join(__dirname, '..', '..', 'data', 'schema.json');

function loadJSON(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(content);
}

function validateConfig(config, schemaPath = DEFAULT_SCHEMA) {
  const ajv = new Ajv({ allErrors: true });
  const schema = loadJSON(schemaPath);
  const validate = ajv.compile(schema);
  const valid = validate(config);
  return { valid, errors: validate.errors };
}

function loadConfig(options = {}) {
  const configPath = options.configPath || process.env.SCRAPER_CONFIG || DEFAULT_CONFIG;
  const abs = path.isAbsolute(configPath) ? configPath : path.resolve(process.cwd(), configPath);
  if (!fs.existsSync(abs)) throw new Error(`Config file not found: ${abs}`);
  const config = loadJSON(abs);
  const { valid, errors } = validateConfig(config, options.schemaPath);
  if (!valid) {
    const msg = (errors || []).map(e => `${e.instancePath} ${e.message}`).join('; ');
    const err = new Error(`Config validation failed: ${msg}`);
    err.validation = errors;
    throw err;
  }
  return config;
}

module.exports = { loadConfig, validateConfig };
