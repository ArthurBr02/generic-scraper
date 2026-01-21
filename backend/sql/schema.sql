-- ============================================
-- Generic Scraper V2 - Database Schema
-- SQLite 3.x
-- ============================================

-- ============================================
-- Table: executions
-- Historique des exécutions de tâches
-- ============================================
CREATE TABLE IF NOT EXISTS executions (
  id TEXT PRIMARY KEY,                    -- UUID de l'exécution
  task_id TEXT NOT NULL,                  -- ID de la tâche (nom du fichier config)
  task_name TEXT,                         -- Nom lisible de la tâche
  status TEXT NOT NULL DEFAULT 'pending', -- pending, running, completed, failed, cancelled
  started_at DATETIME,                    -- Date/heure de début
  completed_at DATETIME,                  -- Date/heure de fin
  duration_ms INTEGER,                    -- Durée en millisecondes
  items_extracted INTEGER DEFAULT 0,      -- Nombre d'éléments extraits
  error_message TEXT,                     -- Message d'erreur si échec
  error_stack TEXT,                       -- Stack trace si échec
  output_file TEXT,                       -- Chemin du fichier de sortie
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_executions_task_id ON executions(task_id);
CREATE INDEX IF NOT EXISTS idx_executions_status ON executions(status);
CREATE INDEX IF NOT EXISTS idx_executions_started_at ON executions(started_at);

-- ============================================
-- Table: execution_logs
-- Logs détaillés de chaque exécution
-- ============================================
CREATE TABLE IF NOT EXISTS execution_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  execution_id TEXT NOT NULL,             -- Référence à executions.id
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  level TEXT NOT NULL,                    -- debug, info, warn, error
  message TEXT NOT NULL,
  step_id TEXT,                           -- ID de l'étape du workflow
  step_name TEXT,                         -- Nom de l'étape
  metadata TEXT,                          -- JSON avec données supplémentaires
  FOREIGN KEY (execution_id) REFERENCES executions(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_execution_logs_execution_id ON execution_logs(execution_id);
CREATE INDEX IF NOT EXISTS idx_execution_logs_level ON execution_logs(level);

-- ============================================
-- Table: execution_data
-- Données extraites par exécution (résumé)
-- ============================================
CREATE TABLE IF NOT EXISTS execution_data (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  execution_id TEXT NOT NULL,             -- Référence à executions.id
  data_key TEXT NOT NULL,                 -- Clé de la donnée (ex: "products", "articles")
  data_type TEXT,                         -- Type: array, object, string, number
  item_count INTEGER,                     -- Nombre d'éléments si array
  sample_data TEXT,                       -- Échantillon JSON (premiers éléments)
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (execution_id) REFERENCES executions(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_execution_data_execution_id ON execution_data(execution_id);

-- ============================================
-- Table: tasks_metadata
-- Métadonnées des tâches (stats, dernière exécution)
-- ============================================
CREATE TABLE IF NOT EXISTS tasks_metadata (
  task_id TEXT PRIMARY KEY,               -- ID de la tâche (nom du fichier config)
  display_name TEXT,                      -- Nom affiché
  description TEXT,                       -- Description
  run_count INTEGER DEFAULT 0,            -- Nombre total d'exécutions
  success_count INTEGER DEFAULT 0,        -- Nombre de succès
  failure_count INTEGER DEFAULT 0,        -- Nombre d'échecs
  last_run_at DATETIME,                   -- Dernière exécution
  last_run_status TEXT,                   -- Statut de la dernière exécution
  last_run_duration_ms INTEGER,           -- Durée de la dernière exécution
  avg_duration_ms INTEGER,                -- Durée moyenne
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- Table: settings
-- Paramètres de l'application
-- ============================================
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT,
  type TEXT DEFAULT 'string',             -- string, number, boolean, json
  description TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Paramètres par défaut
INSERT OR IGNORE INTO settings (key, value, type, description) VALUES
  ('app_theme', 'system', 'string', 'Thème de l''application: light, dark, system'),
  ('max_concurrent_executions', '1', 'number', 'Nombre max d''exécutions simultanées'),
  ('log_retention_days', '30', 'number', 'Durée de conservation des logs en jours'),
  ('execution_retention_days', '90', 'number', 'Durée de conservation des exécutions en jours');
