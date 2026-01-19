/**
 * Prototype action: pagination
 * Exports a `run` function which receives a `page` (Playwright) and params.
 */
async function run(context, params = {}) {
  const { page } = context;
  const { nextSelector, maxPages = 10, waitFor = 1000 } = params;
  if (!page || !nextSelector) throw new Error('pagination action requires `page` and `nextSelector`');

  let count = 0;
  while (count < maxPages) {
    const next = await page.$(nextSelector);
    if (!next) break;
    await Promise.all([page.waitForTimeout(waitFor), next.click()]);
    count += 1;
  }
  return { pagesVisited: count };
}

module.exports = { run };
