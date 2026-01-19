/**
 * Prototype action: api
 * Sends a request via Playwright's request context or node `fetch` fallback.
 */
const fetch = (...args) => import('node-fetch').then(({default: f}) => f(...args));

async function run(context, params = {}) {
  const { requestContext } = context;
  const { url, method = 'GET', headers = {}, body } = params;
  if (!url) throw new Error('api action requires `url`');

  if (requestContext && typeof requestContext.fetch === 'function') {
    const res = await requestContext.fetch(url, { method, headers, body });
    const text = await res.text();
    return { status: res.status(), body: text };
  }

  const res = await fetch(url, { method, headers, body });
  const text = await res.text();
  return { status: res.status, body: text };
}

module.exports = { run };
