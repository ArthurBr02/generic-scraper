/**
 * Action: API Request
 * Effectue des requêtes HTTP/API en utilisant fetch dans le contexte du navigateur
 * Permet de mixer scraping et API calls avec gestion des cookies de session
 */

const { resolveTemplate } = require('../utils/template');

/**
 * Execute API request action
 * @param {Object} page - Playwright page instance
 * @param {Object} config - Action configuration
 * @param {string} config.method - HTTP method (GET, POST, PUT, DELETE, PATCH)
 * @param {string} config.url - Request URL (supports templates)
 * @param {Object} config.headers - Request headers (supports templates)
 * @param {Object|string} config.body - Request body (supports templates)
 * @param {string} config.responseType - Response type: 'json', 'text', 'blob', 'arrayBuffer'
 * @param {string} config.saveAs - Variable name to save response in context
 * @param {number} config.timeout - Request timeout in ms
 * @param {Object} context - Execution context
 * @returns {Promise<any>} Response data
 */
async function execute(page, config, context) {
  const {
    method = 'GET',
    url,
    headers = {},
    body = null,
    responseType = 'json',
    saveAs = null,
    timeout = 30000
  } = config;

  // Validate required parameters
  if (!url) {
    throw new Error('API action requires a url parameter');
  }

  const logger = context.logger || console;
  
  // Apply templates to url, headers, and body
  const processedUrl = resolveTemplate(url, context);
  const processedHeaders = {};
  
  // Process headers with template support
  for (const [key, value] of Object.entries(headers)) {
    processedHeaders[key] = typeof value === 'string' 
      ? resolveTemplate(value, context) 
      : value;
  }

  // Process body with template support
  let processedBody = null;
  if (body !== null) {
    if (typeof body === 'string') {
      processedBody = resolveTemplate(body, context);
    } else if (typeof body === 'object') {
      // Deep clone and process object body
      processedBody = JSON.parse(resolveTemplate(JSON.stringify(body), context));
    }
  }

  logger.info(`API ${method} ${processedUrl}`);
  logger.debug(`Headers: ${JSON.stringify(processedHeaders)}`);
  if (processedBody) {
    logger.debug(`Body: ${typeof processedBody === 'string' ? processedBody : JSON.stringify(processedBody)}`);
  }

  try {
    // Execute fetch in browser context to use cookies and session
    const response = await page.evaluate(
      async ({ method, url, headers, body, responseType, timeout }) => {
        // Create abort controller for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        try {
          const fetchOptions = {
            method,
            headers,
            signal: controller.signal
          };

          // Add body for methods that support it
          if (body && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
            fetchOptions.body = typeof body === 'string' 
              ? body 
              : JSON.stringify(body);
            
            // Set Content-Type if not already set and body is object
            if (typeof body !== 'string' && !headers['Content-Type']) {
              fetchOptions.headers['Content-Type'] = 'application/json';
            }
          }

          const res = await fetch(url, fetchOptions);
          clearTimeout(timeoutId);

          // Extract response data
          let data;
          switch (responseType) {
            case 'json':
              data = await res.json();
              break;
            case 'text':
              data = await res.text();
              break;
            case 'blob':
              const blob = await res.blob();
              data = await new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.readAsDataURL(blob);
              });
              break;
            case 'arrayBuffer':
              const buffer = await res.arrayBuffer();
              data = Array.from(new Uint8Array(buffer));
              break;
            default:
              data = await res.text();
          }

          return {
            status: res.status,
            statusText: res.statusText,
            headers: Object.fromEntries(res.headers.entries()),
            ok: res.ok,
            data
          };
        } catch (error) {
          if (error.name === 'AbortError') {
            throw new Error(`Request timeout after ${timeout}ms`);
          }
          throw error;
        }
      },
      { 
        method, 
        url: processedUrl, 
        headers: processedHeaders, 
        body: processedBody,
        responseType,
        timeout
      }
    );

    // Log response status
    if (response.ok) {
      logger.info(`API response: ${response.status} ${response.statusText}`);
    } else {
      logger.warn(`API response: ${response.status} ${response.statusText}`);
    }
    
    logger.debug(`Response data: ${JSON.stringify(response.data).substring(0, 500)}...`);

    // Save to context if saveAs is specified
    if (saveAs) {
      context[saveAs] = response.data;
      logger.debug(`Saved response to context.${saveAs}`);
    }

    return {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      ok: response.ok,
      data: response.data
    };

  } catch (error) {
    logger.error(`API request failed: ${error.message}`);
    throw error;
  }
}

module.exports = {
  name: 'api',
  execute
};
