/**
 * Action de login - Authentification sur un site web
 * 
 * Permet de se connecter à un site web avec différentes méthodes :
 * - Formulaire classique (username/password)
 * - Token Bearer/JWT
 * - Cookies prédéfinis
 * 
 * @module actions/login
 */

const logger = require('../utils/logger');

/**
 * Exécute l'action de login
 * 
 * @param {Page} page - Page Playwright
 * @param {Object} config - Configuration de l'action
 * @param {string} config.type - Type d'authentification: 'form', 'token', 'cookie'
 * @param {Object} config.credentials - Identifiants de connexion
 * @param {Object} config.selectors - Sélecteurs CSS pour les champs du formulaire
 * @param {Object} context - Contexte d'exécution
 * @returns {Promise<Object>} Résultat de l'authentification
 */
async function execute(page, config, context) {
  const { type = 'form', credentials, selectors, waitAfterLogin = 2000 } = config;
  
  logger.info(`Executing login action: ${type}`);
  
  try {
    let result;
    
    switch (type) {
      case 'form':
        result = await loginWithForm(page, credentials, selectors, config);
        break;
      case 'token':
        result = await loginWithToken(page, credentials, config);
        break;
      case 'cookie':
        result = await loginWithCookies(page, credentials, config);
        break;
      default:
        throw new Error(`Unknown login type: ${type}`);
    }
    
    // Attendre après le login
    if (waitAfterLogin > 0) {
      await page.waitForTimeout(waitAfterLogin);
    }
    
    // Vérifier si le login a réussi
    if (config.successSelector) {
      const success = await page.$(config.successSelector);
      if (!success) {
        throw new Error('Login failed: success selector not found');
      }
    }
    
    logger.info('Login successful');
    return result;
    
  } catch (error) {
    logger.error('Login failed:', error);
    throw error;
  }
}

/**
 * Login via formulaire classique
 * 
 * @param {Page} page - Page Playwright
 * @param {Object} credentials - Identifiants {username, password}
 * @param {Object} selectors - Sélecteurs {username, password, submit}
 * @param {Object} config - Configuration supplémentaire
 * @returns {Promise<Object>} Résultat
 */
async function loginWithForm(page, credentials, selectors, config) {
  const { 
    username, 
    password 
  } = credentials;
  
  const { 
    username: usernameSelector, 
    password: passwordSelector, 
    submit: submitSelector,
    timeout = 5000
  } = selectors;
  
  logger.debug('Login with form');
  
  // Attendre que le formulaire soit visible
  await page.waitForSelector(usernameSelector, { timeout });
  
  // Remplir le champ username
  await page.fill(usernameSelector, username);
  logger.debug(`Filled username field: ${usernameSelector}`);
  
  // Remplir le champ password
  await page.fill(passwordSelector, password);
  logger.debug(`Filled password field: ${passwordSelector}`);
  
  // Soumettre le formulaire
  if (submitSelector) {
    await page.click(submitSelector);
    logger.debug(`Clicked submit button: ${submitSelector}`);
  } else {
    // Si pas de bouton submit, presser Enter
    await page.press(passwordSelector, 'Enter');
    logger.debug('Pressed Enter to submit');
  }
  
  // Attendre la navigation
  if (config.waitForNavigation !== false) {
    await page.waitForLoadState('networkidle', { timeout: config.navigationTimeout || 10000 });
  }
  
  return { success: true, method: 'form' };
}

/**
 * Login via token (Bearer, JWT, etc.)
 * 
 * @param {Page} page - Page Playwright
 * @param {Object} credentials - Token {token, type}
 * @param {Object} config - Configuration
 * @returns {Promise<Object>} Résultat
 */
async function loginWithToken(page, credentials, config) {
  const { token, type = 'Bearer' } = credentials;
  const { storageType = 'localStorage', storageKey = 'authToken' } = config;
  
  logger.debug(`Login with token: ${type}`);
  
  if (storageType === 'localStorage') {
    // Stocker le token dans localStorage
    await page.evaluate(({ key, value, tokenType }) => {
      const tokenValue = tokenType === 'Bearer' ? `Bearer ${value}` : value;
      localStorage.setItem(key, tokenValue);
    }, { key: storageKey, value: token, tokenType: type });
    
    logger.debug(`Token stored in localStorage: ${storageKey}`);
    
  } else if (storageType === 'sessionStorage') {
    // Stocker le token dans sessionStorage
    await page.evaluate(({ key, value, tokenType }) => {
      const tokenValue = tokenType === 'Bearer' ? `Bearer ${value}` : value;
      sessionStorage.setItem(key, tokenValue);
    }, { key: storageKey, value: token, tokenType: type });
    
    logger.debug(`Token stored in sessionStorage: ${storageKey}`);
    
  } else if (storageType === 'cookie') {
    // Stocker le token dans un cookie
    await page.context().addCookies([{
      name: storageKey,
      value: type === 'Bearer' ? `Bearer ${token}` : token,
      domain: new URL(page.url()).hostname,
      path: '/',
      httpOnly: config.httpOnly || false,
      secure: config.secure || false
    }]);
    
    logger.debug(`Token stored in cookie: ${storageKey}`);
  }
  
  return { success: true, method: 'token', type };
}

/**
 * Login via cookies prédéfinis
 * 
 * @param {Page} page - Page Playwright
 * @param {Object} credentials - Cookies {cookies}
 * @param {Object} config - Configuration
 * @returns {Promise<Object>} Résultat
 */
async function loginWithCookies(page, credentials, config) {
  const { cookies } = credentials;
  
  if (!Array.isArray(cookies) || cookies.length === 0) {
    throw new Error('No cookies provided');
  }
  
  logger.debug(`Setting ${cookies.length} cookie(s)`);
  
  // Ajouter les cookies au contexte
  await page.context().addCookies(cookies.map(cookie => ({
    name: cookie.name,
    value: cookie.value,
    domain: cookie.domain || new URL(page.url()).hostname,
    path: cookie.path || '/',
    httpOnly: cookie.httpOnly || false,
    secure: cookie.secure || false,
    sameSite: cookie.sameSite || 'Lax',
    expires: cookie.expires || -1
  })));
  
  logger.debug('Cookies set successfully');
  
  // Recharger la page pour que les cookies prennent effet
  if (config.reloadAfterCookies !== false) {
    await page.reload({ waitUntil: 'networkidle' });
  }
  
  return { success: true, method: 'cookie', count: cookies.length };
}

/**
 * Exporter les cookies de session
 * 
 * @param {Page} page - Page Playwright
 * @returns {Promise<Array>} Liste des cookies
 */
async function exportCookies(page) {
  const cookies = await page.context().cookies();
  logger.debug(`Exported ${cookies.length} cookie(s)`);
  return cookies;
}

module.exports = {
  name: 'login',
  execute,
  exportCookies
};
