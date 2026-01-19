/**
 * Prototype action: scroll
 * Performs incremental scrolls on the page.
 */
async function run(context, params = {}) {
  const { page } = context;
  const { step = 500, iterations = 10, waitFor = 200 } = params;
  if (!page) throw new Error('scroll action requires `page`');

  for (let i = 0; i < iterations; i += 1) {
    await page.evaluate((s) => { window.scrollBy(0, s); }, step);
    await page.waitForTimeout(waitFor);
  }
  return { scrolled: true, iterations };
}

module.exports = { run };
