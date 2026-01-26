-- Migration: Ajouter la colonne workflow_id à execution_logs
-- Date: 2026-01-27
-- Description: Supporte le tracking multi-workflow dans les logs

-- Ajouter la colonne workflow_id si elle n'existe pas déjà
ALTER TABLE execution_logs ADD COLUMN workflow_id TEXT DEFAULT 'main';

-- Créer un index pour améliorer les performances de recherche
CREATE INDEX IF NOT EXISTS idx_execution_logs_workflow_id ON execution_logs(workflow_id);
