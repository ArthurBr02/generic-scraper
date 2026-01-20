/**
 * Session Manager - Gestion des sessions et cookies
 * 
 * Permet de :
 * - Sauvegarder les sessions (cookies, localStorage, sessionStorage)
 * - Restaurer les sessions entre exécutions
 * - Gérer la persistance des sessions
 * - Exporter/importer les états de session
 * 
 * @module core/session
 */

const fs = require('fs').promises;
const path = require('path');
const logger = require('../utils/logger');

class SessionManager {
  /**
   * @param {Object} options - Options de configuration
   * @param {string} options.sessionDir - Dossier de stockage des sessions
   * @param {boolean} options.autoSave - Sauvegarde automatique
   */
  constructor(options = {}) {
    this.sessionDir = options.sessionDir || path.join(process.cwd(), 'sessions');
    this.autoSave = options.autoSave !== false;
    this.sessions = new Map();
  }

  /**
   * Initialiser le gestionnaire de sessions
   */
  async initialize() {
    try {
      await fs.mkdir(this.sessionDir, { recursive: true });
      logger.info(`Session manager initialized: ${this.sessionDir}`);
    } catch (error) {
      logger.error('Failed to initialize session manager', error);
      throw error;
    }
  }

  /**
   * Sauvegarder une session
   * 
   * @param {string} sessionName - Nom de la session
   * @param {Page} page - Page Playwright
   * @param {Object} options - Options supplémentaires
   * @returns {Promise<Object>} Session sauvegardée
   */
  async saveSession(sessionName, page, options = {}) {
    try {
      const session = {
        name: sessionName,
        timestamp: new Date().toISOString(),
        url: page.url(),
        cookies: [],
        localStorage: {},
        sessionStorage: {},
        metadata: options.metadata || {}
      };

      // Extraire les cookies
      if (options.saveCookies !== false) {
        session.cookies = await page.context().cookies();
        logger.debug(`Saved ${session.cookies.length} cookie(s)`);
      }

      // Extraire localStorage
      if (options.saveLocalStorage !== false) {
        session.localStorage = await page.evaluate(() => {
          const items = {};
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            items[key] = localStorage.getItem(key);
          }
          return items;
        });
        logger.debug(`Saved ${Object.keys(session.localStorage).length} localStorage item(s)`);
      }

      // Extraire sessionStorage
      if (options.saveSessionStorage !== false) {
        session.sessionStorage = await page.evaluate(() => {
          const items = {};
          for (let i = 0; i < sessionStorage.length; i++) {
            const key = sessionStorage.key(i);
            items[key] = sessionStorage.getItem(key);
          }
          return items;
        });
        logger.debug(`Saved ${Object.keys(session.sessionStorage).length} sessionStorage item(s)`);
      }

      // Sauvegarder dans la Map
      this.sessions.set(sessionName, session);

      // Sauvegarder sur disque
      if (this.autoSave || options.persist) {
        await this.persistSession(sessionName, session);
      }

      logger.info(`Session saved: ${sessionName}`);
      return session;

    } catch (error) {
      logger.error(`Failed to save session: ${sessionName}`, error);
      throw error;
    }
  }

  /**
   * Restaurer une session
   * 
   * @param {string} sessionName - Nom de la session
   * @param {Page} page - Page Playwright
   * @param {Object} options - Options supplémentaires
   * @returns {Promise<boolean>} Succès de la restauration
   */
  async restoreSession(sessionName, page, options = {}) {
    try {
      // Charger depuis la Map ou le disque
      let session = this.sessions.get(sessionName);
      
      if (!session) {
        session = await this.loadSession(sessionName);
      }

      if (!session) {
        throw new Error(`Session not found: ${sessionName}`);
      }

      // Restaurer les cookies
      if (options.restoreCookies !== false && session.cookies.length > 0) {
        await page.context().addCookies(session.cookies);
        logger.debug(`Restored ${session.cookies.length} cookie(s)`);
      }

      // Naviguer vers l'URL de la session si demandé
      if (options.navigateToUrl && session.url) {
        await page.goto(session.url, { waitUntil: 'domcontentloaded' });
      }

      // Restaurer localStorage
      if (options.restoreLocalStorage !== false && Object.keys(session.localStorage).length > 0) {
        await page.evaluate((items) => {
          for (const [key, value] of Object.entries(items)) {
            localStorage.setItem(key, value);
          }
        }, session.localStorage);
        logger.debug(`Restored ${Object.keys(session.localStorage).length} localStorage item(s)`);
      }

      // Restaurer sessionStorage
      if (options.restoreSessionStorage !== false && Object.keys(session.sessionStorage).length > 0) {
        await page.evaluate((items) => {
          for (const [key, value] of Object.entries(items)) {
            sessionStorage.setItem(key, value);
          }
        }, session.sessionStorage);
        logger.debug(`Restored ${Object.keys(session.sessionStorage).length} sessionStorage item(s)`);
      }

      logger.info(`Session restored: ${sessionName}`);
      return true;

    } catch (error) {
      logger.error(`Failed to restore session: ${sessionName}`, error);
      throw error;
    }
  }

  /**
   * Persister une session sur disque
   * 
   * @param {string} sessionName - Nom de la session
   * @param {Object} session - Données de session
   * @returns {Promise<string>} Chemin du fichier
   */
  async persistSession(sessionName, session) {
    const filePath = path.join(this.sessionDir, `${sessionName}.json`);
    
    try {
      await fs.writeFile(filePath, JSON.stringify(session, null, 2));
      logger.debug(`Session persisted to: ${filePath}`);
      return filePath;
    } catch (error) {
      logger.error(`Failed to persist session: ${sessionName}`, error);
      throw error;
    }
  }

  /**
   * Charger une session depuis le disque
   * 
   * @param {string} sessionName - Nom de la session
   * @returns {Promise<Object|null>} Session chargée
   */
  async loadSession(sessionName) {
    const filePath = path.join(this.sessionDir, `${sessionName}.json`);
    
    try {
      const content = await fs.readFile(filePath, 'utf8');
      const session = JSON.parse(content);
      this.sessions.set(sessionName, session);
      logger.debug(`Session loaded from: ${filePath}`);
      return session;
    } catch (error) {
      if (error.code === 'ENOENT') {
        logger.debug(`Session file not found: ${sessionName}`);
        return null;
      }
      logger.error(`Failed to load session: ${sessionName}`, error);
      throw error;
    }
  }

  /**
   * Supprimer une session
   * 
   * @param {string} sessionName - Nom de la session
   * @param {boolean} deleteFile - Supprimer aussi le fichier
   * @returns {Promise<boolean>} Succès de la suppression
   */
  async deleteSession(sessionName, deleteFile = true) {
    try {
      // Supprimer de la Map
      this.sessions.delete(sessionName);

      // Supprimer le fichier
      if (deleteFile) {
        const filePath = path.join(this.sessionDir, `${sessionName}.json`);
        try {
          await fs.unlink(filePath);
          logger.debug(`Session file deleted: ${filePath}`);
        } catch (error) {
          if (error.code !== 'ENOENT') {
            throw error;
          }
        }
      }

      logger.info(`Session deleted: ${sessionName}`);
      return true;

    } catch (error) {
      logger.error(`Failed to delete session: ${sessionName}`, error);
      throw error;
    }
  }

  /**
   * Lister toutes les sessions disponibles
   * 
   * @returns {Promise<Array<string>>} Liste des noms de sessions
   */
  async listSessions() {
    try {
      const files = await fs.readdir(this.sessionDir);
      const sessions = files
        .filter(f => f.endsWith('.json'))
        .map(f => f.replace('.json', ''));
      
      logger.debug(`Found ${sessions.length} session(s)`);
      return sessions;
    } catch (error) {
      logger.error('Failed to list sessions', error);
      return [];
    }
  }

  /**
   * Vérifier si une session existe
   * 
   * @param {string} sessionName - Nom de la session
   * @returns {Promise<boolean>} Existe ou non
   */
  async hasSession(sessionName) {
    if (this.sessions.has(sessionName)) {
      return true;
    }

    const filePath = path.join(this.sessionDir, `${sessionName}.json`);
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Nettoyer les sessions expirées
   * 
   * @param {number} maxAge - Âge maximum en ms (défaut: 7 jours)
   * @returns {Promise<number>} Nombre de sessions supprimées
   */
  async cleanExpiredSessions(maxAge = 7 * 24 * 60 * 60 * 1000) {
    try {
      const sessions = await this.listSessions();
      let deleted = 0;
      const now = Date.now();

      for (const sessionName of sessions) {
        const session = await this.loadSession(sessionName);
        if (session && session.timestamp) {
          const age = now - new Date(session.timestamp).getTime();
          if (age > maxAge) {
            await this.deleteSession(sessionName);
            deleted++;
          }
        }
      }

      logger.info(`Cleaned ${deleted} expired session(s)`);
      return deleted;

    } catch (error) {
      logger.error('Failed to clean expired sessions', error);
      return 0;
    }
  }
}

module.exports = SessionManager;
