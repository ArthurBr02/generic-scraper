async function retry(fn, options = {}) {
  const retries = options.retries ?? 3;
  const delay = options.delay ?? 500;
  const onRetry = options.onRetry;

  let attempt = 0;
  while (attempt <= retries) {
    try {
      return await fn(attempt);
    } catch (err) {
      if (attempt === retries) throw err;
      attempt += 1;
      if (typeof onRetry === 'function') onRetry(err, attempt);
      await new Promise(res => setTimeout(res, delay));
    }
  }
}

module.exports = { retry };
