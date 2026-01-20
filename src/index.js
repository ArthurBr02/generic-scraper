#!/usr/bin/env node

const minimist = require('minimist');
const path = require('path');
const fs = require('fs');
const { loadConfig } = require('./utils/configLoader');
const { ScraperError } = require('./utils/error-handler');
const Scraper = require('./core/scraper');
const Scheduler = require('./core/scheduler');

/**
 * Point d'entrée CLI du Generic Scraper
 * Usage: node src/index.js --config ./data/config.json
 */

async function main() {
  try {
    // Parsing des arguments de ligne de commande
    const args = minimist(process.argv.slice(2), {
      string: ['config', 'output', 'format'],
      boolean: ['help', 'version', 'headless', 'daemon', 'schedule'],
      alias: {
        c: 'config',
        h: 'help',
        v: 'version',
        o: 'output',
        f: 'format',
        d: 'daemon',
        s: 'schedule'
      },
      default: {
        config: './data/config.json'
      }
    });

    // Affichage de l'aide
    if (args.help) {
      displayHelp();
      process.exit(0);
    }

    // Affichage de la version
    if (args.version) {
      const pkg = require('../package.json');
      console.log(`Generic Scraper v${pkg.version}`);
      process.exit(0);
    }

    // Chargement de la configuration
    const configPath = path.isAbsolute(args.config)
      ? args.config
      : path.resolve(process.cwd(), args.config);

    console.log(`🔄 Chargement de la configuration depuis: ${configPath}`);
    const config = loadConfig({ configPath });

    // Override des options via CLI si spécifiées
    if (args.output) {
      config.output = config.output || {};
      config.output.path = args.output;
    }
    if (args.format) {
      config.output = config.output || {};
      config.output.format = args.format;
    }
    if (args.headless !== undefined) {
      config.browser = config.browser || {};
      config.browser.headless = args.headless;
    }

    console.log(`✅ Configuration chargée avec succès: ${config.name || 'sans nom'}`);
    
    // Charger le workflow si spécifié
    let workflowConfig = null;
    if (config.workflow) {
      const workflowPath = path.isAbsolute(config.workflow)
        ? config.workflow
        : path.resolve(path.dirname(configPath), config.workflow);
      
      if (fs.existsSync(workflowPath)) {
        console.log(`📋 Chargement du workflow: ${workflowPath}`);
        workflowConfig = JSON.parse(fs.readFileSync(workflowPath, 'utf8'));
      } else {
        console.log(`⚠️  Fichier de workflow introuvable: ${workflowPath}`);
      }
    }

    // Créer l'instance du scraper
    const scraper = new Scraper({
      ...config,
      workflow: workflowConfig
    });

    // Si mode schedule/daemon, utiliser le scheduler
    if (args.daemon || args.schedule || config.scheduling?.enabled) {
      console.log('\n📅 Démarrage du scheduler...\n');
      
      const scheduler = new Scheduler(config, () => new Scraper({
        ...config,
        workflow: workflowConfig
      }));

      if (args.daemon) {
        scheduler.runDaemon();
      } else {
        scheduler.start();
        
        console.log('✅ Scheduler démarré!');
        console.log(`⏰ Expression cron: ${config.scheduling.cron}`);
        console.log(`🌍 Timezone: ${config.scheduling.timezone || 'système'}`);
        console.log('\n💡 Appuyez sur Ctrl+C pour arrêter\n');
        
        // Keep process alive
        process.on('SIGINT', () => {
          console.log('\n\n🛑 Arrêt du scheduler...');
          scheduler.stop();
          process.exit(0);
        });
      }
      return;
    }

    // Exécuter le scraping
    console.log('\n🚀 Démarrage du scraping...\n');
    const results = await scraper.execute();

    // Afficher les résultats
    console.log('\n✅ Scraping terminé avec succès!');
    console.log(`📊 Durée: ${results.duration}ms`);
    
    if (results.data && Object.keys(results.data).length > 0) {
      console.log(`📦 Données extraites:`);
      for (const [key, value] of Object.entries(results.data)) {
        if (Array.isArray(value)) {
          console.log(`   - ${key}: ${value.length} éléments`);
        } else if (typeof value === 'object') {
          console.log(`   - ${key}: ${Object.keys(value).length} propriétés`);
        } else {
          console.log(`   - ${key}: ${value}`);
        }
      }
    }

    console.log('\n✨ Terminé!\n');

  } catch (error) {
    handleError(error);
    process.exit(1);
  }
}

/**
 * Affiche l'aide de la ligne de commande
 */
function displayHelp() {
  console.log(`
┌─────────────────────────────────────────────────────────┐
│           Generic Scraper - CLI Help                    │
└─────────────────────────────────────────────────────────┘

Usage:
  node src/index.js [options]

Options:
  -c, --config <path>    Chemin vers le fichier de configuration
                         (défaut: ./data/config.json)
  
  -o, --output <path>    Dossier de sortie des données
                         (surcharge la config)
  
  -f, --format <format>  Format de sortie: json, csv
                         (surcharge la config)
  
  --headless             Active/désactive le mode headless
                         (surcharge la config)
  
  -s, --schedule         Démarre le scheduler (exécution planifiée)
  
  -d, --daemon           Démarre en mode daemon (arrière-plan)
  
  -h, --help             Affiche cette aide
  
  -v, --version          Affiche la version

Exemples:
  # Utiliser la config par défaut
  node src/index.js

  # Spécifier une config custom
  node src/index.js --config ./configs/examples/simple-scrape.json

  # Override du format de sortie
  node src/index.js --config ./data/config.json --format csv

  # Mode non-headless (avec navigateur visible)
  node src/index.js --headless false

  # Démarrer le scheduler
  node src/index.js --schedule

  # Démarrer en mode daemon
  node src/index.js --daemon

Documentation:
  Voir ./documentation/plan.md pour plus de détails
`);
}

/**
 * Gère les erreurs et affiche des messages appropriés
 */
function handleError(error) {
  console.error('\n❌ Erreur:');
  
  if (error instanceof ScraperError) {
    console.error(`   ${error.message}`);
    if (error.details) {
      console.error(`   Détails: ${JSON.stringify(error.details, null, 2)}`);
    }
  } else if (error.validation) {
    console.error(`   Validation de la configuration échouée:`);
    error.validation.forEach((err, i) => {
      console.error(`   ${i + 1}. ${err.instancePath} ${err.message}`);
    });
  } else if (error.code === 'ENOENT') {
    console.error(`   Fichier introuvable: ${error.path}`);
  } else {
    console.error(`   ${error.message}`);
    if (process.env.DEBUG) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
  }
  
  console.error('\nUtilisez --help pour voir les options disponibles.\n');
}

// Lancement de l'application
if (require.main === module) {
  main();
}

module.exports = { main, displayHelp };
