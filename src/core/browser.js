/**
 * Browser management class - Playwright wrapper
 * Handles browser lifecycle, context, pages, and resource optimization
 */

const { chromium, firefox, webkit } = require('playwright');
const { getLogger } = require('../utils/logger');

class Browser {
  constructor(config = {}) {
    this.config = config;
    this.browser = null;
    this.context = null;
    this.pagePool = [];
    this.activePagesCount = 0;
    this.logger = getLogger();
    this.isLaunched = false;
  }

  /**
   * Launch browser with configured options (T2.1.1 & T2.1.2)
   * @param {Object} options - Browser launch options
   * @returns {Promise<void>}
   */
  async launch(options = {}) {
    if (this.isLaunched) {
      this.logger.warn('Browser already launched');
      return;
    }

    const launchOptions = {
      headless: options.headless !== false,
      slowMo: options.slowMo || 0,
      timeout: options.timeout || 30000,
      args: options.args || [],
      ...options.launchOptions
    };

    this.logger.info('Launching browser', { 
      browserType: options.browserType || 'chromium',
      headless: launchOptions.headless 
    });

    try {
      // Select browser type
      const browserType = options.browserType || 'chromium';
      const playwright = { chromium, firefox, webkit };
      
      if (!playwright[browserType]) {
        throw new Error(`Unsupported browser type: ${browserType}`);
      }

      // Launch browser
      this.browser = await playwright[browserType].launch(launchOptions);

      // Create browser context (T2.1.3)
      await this.createContext(options);

      this.isLaunched = true;
      this.logger.info('Browser launched successfully');
    } catch (error) {
      this.logger.error('Failed to launch browser', { error: error.message });
      throw error;
    }
  }

  /**
   * Create browser context with options (T2.1.3)
   * @param {Object} options - Context options
   * @returns {Promise<void>}
   */
  async createContext(options = {}) {
    const contextOptions = {
      viewport: options.viewport || { width: 1920, height: 1080 },
      userAgent: options.userAgent || null,
      locale: options.locale || 'fr-FR',
      timezoneId: options.timezoneId || null,
      permissions: options.permissions || [],
      geolocation: options.geolocation || null,
      colorScheme: options.colorScheme || 'light',
      acceptDownloads: options.acceptDownloads !== false,
      ignoreHTTPSErrors: options.ignoreHTTPSErrors || false,
      ...options.contextOptions
    };

    this.logger.debug('Creating browser context', { viewport: contextOptions.viewport });

    try {
      this.context = await this.browser.newContext(contextOptions);

      // Set default timeout for context
      if (options.timeout) {
        this.context.setDefaultTimeout(options.timeout);
      }

      this.logger.info('Browser context created');
    } catch (error) {
      this.logger.error('Failed to create browser context', { error: error.message });
      throw error;
    }
  }

  /**
   * Create a new page or reuse from pool (T2.1.4)
   * @param {Object} options - Page options
   * @returns {Promise<Page>} Playwright page instance
   */
  async newPage(options = {}) {
    if (!this.context) {
      throw new Error('Browser context not initialized. Call launch() first.');
    }

    let page;

    // Try to reuse page from pool (T2.1.4)
    if (this.pagePool.length > 0 && options.reusePages !== false) {
      page = this.pagePool.pop();
      this.logger.debug('Reusing page from pool', { poolSize: this.pagePool.length });
    } else {
      // Create new page
      page = await this.context.newPage();
      this.logger.debug('Created new page', { activePagesCount: this.activePagesCount + 1 });
    }

    this.activePagesCount++;

    // Setup resource blocking if enabled (T2.1.5)
    if (this.config.resourceBlocking?.enabled) {
      await this.setupResourceBlocking(page, this.config.resourceBlocking);
    }

    // Setup page event handlers
    this.setupPageHandlers(page);

    return page;
  }

  /**
   * Setup resource blocking for optimization (T2.1.5)
   * @param {Page} page - Playwright page
   * @param {Object} config - Resource blocking configuration
   * @returns {Promise<void>}
   */
  async setupResourceBlocking(page, config) {
    const blockedTypes = config.types || ['image', 'font', 'media'];
    const blockedDomains = config.domains || [];

    this.logger.debug('Setting up resource blocking', { 
      types: blockedTypes, 
      domains: blockedDomains 
    });

    await page.route('**/*', (route) => {
      const request = route.request();
      const resourceType = request.resourceType();
      const url = request.url();

      // Block by resource type
      if (blockedTypes.includes(resourceType)) {
        route.abort();
        return;
      }

      // Block by domain
      if (blockedDomains.some(domain => url.includes(domain))) {
        route.abort();
        return;
      }

      // Continue with the request
      route.continue();
    });
  }

  /**
   * Setup page event handlers for logging and debugging
   * @param {Page} page - Playwright page
   */
  setupPageHandlers(page) {
    // Log console messages
    page.on('console', msg => {
      this.logger.debug(`Browser console [${msg.type()}]: ${msg.text()}`);
    });

    // Log page errors
    page.on('pageerror', error => {
      this.logger.error('Page error', { error: error.message });
    });

    // Log failed requests
    page.on('requestfailed', request => {
      this.logger.warn('Request failed', { 
        url: request.url(), 
        failure: request.failure()?.errorText 
      });
    });

    // Log responses (optional, can be verbose)
    if (this.logger.level === 'silly') {
      page.on('response', response => {
        this.logger.silly('Response received', { 
          url: response.url(), 
          status: response.status() 
        });
      });
    }
  }

  /**
   * Release a page back to the pool (T2.1.4)
   * @param {Page} page - Page to release
   * @param {Object} options - Release options
   * @returns {Promise<void>}
   */
  async releasePage(page, options = {}) {
    if (!page) return;

    this.activePagesCount--;

    if (options.close || this.pagePool.length >= (this.config.maxPoolSize || 5)) {
      // Close the page if pool is full or explicitly requested
      await page.close();
      this.logger.debug('Page closed', { activePagesCount: this.activePagesCount });
    } else {
      // Return to pool for reuse
      try {
        // Clear page state before returning to pool
        await page.goto('about:blank');
        await page.evaluate(() => localStorage.clear());
        await page.evaluate(() => sessionStorage.clear());
        
        this.pagePool.push(page);
        this.logger.debug('Page returned to pool', { poolSize: this.pagePool.length });
      } catch (error) {
        // If clearing fails, close the page
        await page.close();
        this.logger.warn('Failed to clear page, closed instead', { error: error.message });
      }
    }
  }

  /**
   * Get current browser context
   * @returns {BrowserContext|null}
   */
  getContext() {
    return this.context;
  }

  /**
   * Get current browser instance
   * @returns {Browser|null}
   */
  getBrowser() {
    return this.browser;
  }

  /**
   * Check if browser is launched
   * @returns {boolean}
   */
  isReady() {
    return this.isLaunched && this.browser !== null && this.context !== null;
  }

  /**
   * Get browser statistics
   * @returns {Object} Browser stats
   */
  getStats() {
    return {
      isLaunched: this.isLaunched,
      activePagesCount: this.activePagesCount,
      poolSize: this.pagePool.length,
      browserType: this.browser ? 'chromium' : null
    };
  }

  /**
   * Close all pages in pool
   * @returns {Promise<void>}
   */
  async closePooledPages() {
    this.logger.debug('Closing pooled pages', { count: this.pagePool.length });
    
    await Promise.all(
      this.pagePool.map(page => page.close().catch(err => 
        this.logger.warn('Failed to close pooled page', { error: err.message })
      ))
    );
    
    this.pagePool = [];
  }

  /**
   * Close browser context (T2.1.3)
   * @returns {Promise<void>}
   */
  async closeContext() {
    if (this.context) {
      this.logger.info('Closing browser context');
      await this.closePooledPages();
      await this.context.close();
      this.context = null;
    }
  }

  /**
   * Close browser and cleanup (T2.1.3)
   * @returns {Promise<void>}
   */
  async close() {
    if (!this.isLaunched) {
      return;
    }

    this.logger.info('Closing browser', this.getStats());

    try {
      // Close all pooled pages
      await this.closePooledPages();

      // Close context
      await this.closeContext();

      // Close browser
      if (this.browser) {
        await this.browser.close();
        this.browser = null;
      }

      this.isLaunched = false;
      this.activePagesCount = 0;
      
      this.logger.info('Browser closed successfully');
    } catch (error) {
      this.logger.error('Error closing browser', { error: error.message });
      throw error;
    }
  }

  /**
   * Create a screenshot utility for error handling
   * @param {Page} page - Page to screenshot
   * @param {string} name - Screenshot name
   * @returns {Promise<Buffer|null>}
   */
  async screenshot(page, name = 'screenshot') {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `${name}-${timestamp}.png`;
      const path = `./logs/screenshots/${filename}`;
      
      const buffer = await page.screenshot({ path, fullPage: true });
      this.logger.info('Screenshot captured', { filename });
      
      return buffer;
    } catch (error) {
      this.logger.error('Failed to capture screenshot', { error: error.message });
      return null;
    }
  }
}

module.exports = Browser;
