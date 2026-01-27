/**
 * DatabaseService - SQLite database management
 * Handles all database operations for the Generic Scraper
 */

import sqlite3 from 'sqlite3';
import * as path from 'path';
import * as fs from 'fs';
import { promisify } from 'util';
import { fileURLToPath } from 'url';
import { logger } from '../utils/logger.js';

// Define __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import type {
  Execution,
  ExecutionLog,
  ExecutionData,
  TaskMetadata,
  Setting,
  CreateExecutionInput,
  UpdateExecutionInput,
  CreateLogInput,
  UpdateTaskStatsInput,
  ExecutionStatus,
  LogLevel
} from '../types/database.types';

/**
 * Database service for managing scraper executions, logs, and metadata
 */
export class DatabaseService {
  private db: sqlite3.Database;
  private dbPath: string;
  
  // Promisified methods
  private run: (sql: string, ...params: any[]) => Promise<any>;
  private get: (sql: string, ...params: any[]) => Promise<any>;
  private all: (sql: string, ...params: any[]) => Promise<any[]>;
  private exec: (sql: string) => Promise<void>;

  constructor(dbPath?: string) {
    this.dbPath = dbPath || process.env.DATABASE_PATH || path.resolve(__dirname, '../../../data/scraper.db');
    
    // Create data directory if it doesn't exist
    const dir = path.dirname(this.dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    // Initialize database connection
    this.db = new sqlite3.Database(this.dbPath);
    
    // Promisify database methods
    this.run = promisify(this.db.run.bind(this.db));
    this.get = promisify(this.db.get.bind(this.db));
    this.all = promisify(this.db.all.bind(this.db));
    this.exec = promisify(this.db.exec.bind(this.db));
  }

  /**
   * Initialize database (run migrations, set pragmas)
   */
  async init(): Promise<void> {
    try {
      logger.info('Setting PRAGMA journal_mode = WAL...');
      await this.run('PRAGMA journal_mode = WAL');
      
      logger.info('Setting PRAGMA foreign_keys = ON...');
      await this.run('PRAGMA foreign_keys = ON');
      
      logger.info('Running migrations...');
      await this.runMigrations();
      
      logger.info('Database initialization completed');
    } catch (error: any) {
      logger.error('Database initialization failed', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  /**
   * Run database migrations (create tables)
   */
  private async runMigrations(): Promise<void> {
    try {
      const schemaPath = path.resolve(__dirname, '../../sql/schema.sql');
      logger.info(`Loading schema from: ${schemaPath}`);
      
      if (!fs.existsSync(schemaPath)) {
        throw new Error(`Schema file not found at: ${schemaPath}`);
      }
      
      const schema = fs.readFileSync(schemaPath, 'utf8');
      logger.info(`Schema file loaded (${schema.length} bytes)`);
      
      logger.info('Executing schema SQL...');
      await this.exec(schema);
      logger.info('Schema executed successfully');
      
      logger.info('Running additional migrations...');
      await this.runAdditionalMigrations();
      logger.info('Additional migrations completed');
    } catch (error: any) {
      logger.error('Migration failed', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  /**
   * Run additional migrations (column additions, etc.)
   */
  private async runAdditionalMigrations(): Promise<void> {
    try {
      // Verify that execution_logs table exists first
      const tables = await this.all(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='execution_logs'"
      );
      
      if (tables.length === 0) {
        logger.info('execution_logs table does not exist yet, skipping migrations');
        return;
      }
      
      // Check if workflow_id column exists in execution_logs
      const columns = await this.all('PRAGMA table_info(execution_logs)');
      const hasWorkflowId = columns.some((col: any) => col.name === 'workflow_id');
      
      if (!hasWorkflowId) {
        logger.info('Adding workflow_id column to execution_logs table');
        await this.run('ALTER TABLE execution_logs ADD COLUMN workflow_id TEXT DEFAULT \'main\'');
        await this.run('CREATE INDEX IF NOT EXISTS idx_execution_logs_workflow_id ON execution_logs(workflow_id)');
        logger.info('Migration completed: workflow_id column added');
      }
      
      // Check if workflow_id column exists in execution_data
      const dataColumns = await this.all('PRAGMA table_info(execution_data)');
      const hasDataWorkflowId = dataColumns.some((col: any) => col.name === 'workflow_id');
      
      if (!hasDataWorkflowId) {
        logger.info('Adding workflow_id column to execution_data table');
        await this.run('ALTER TABLE execution_data ADD COLUMN workflow_id TEXT DEFAULT \'main\'');
        await this.run('CREATE INDEX IF NOT EXISTS idx_execution_data_workflow_id ON execution_data(workflow_id)');
        logger.info('Migration completed: workflow_id column added to execution_data');
      }
    } catch (error: any) {
      logger.error('Migration failed', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  // ============================================
  // Executions
  // ============================================

  /**
   * Create a new execution record
   */
  async createExecution(input: CreateExecutionInput): Promise<void> {
    await this.run(
      `INSERT INTO executions (id, task_id, task_name, status, started_at)
       VALUES (?, ?, ?, ?, ?)`,
      input.id,
      input.taskId,
      input.taskName || null,
      'running',
      new Date().toISOString()
    );
  }

  /**
   * Update an execution record
   */
  async updateExecution(id: string, data: UpdateExecutionInput): Promise<void> {
    const fields: string[] = [];
    const values: any[] = [];
    
    if (data.status !== undefined) {
      fields.push('status = ?');
      values.push(data.status);
    }
    if (data.completedAt !== undefined) {
      fields.push('completed_at = ?');
      values.push(data.completedAt);
    }
    if (data.durationMs !== undefined) {
      fields.push('duration_ms = ?');
      values.push(data.durationMs);
    }
    if (data.itemsExtracted !== undefined) {
      fields.push('items_extracted = ?');
      values.push(data.itemsExtracted);
    }
    if (data.errorMessage !== undefined) {
      fields.push('error_message = ?');
      values.push(data.errorMessage);
    }
    if (data.errorStack !== undefined) {
      fields.push('error_stack = ?');
      values.push(data.errorStack);
    }
    if (data.outputFile !== undefined) {
      fields.push('output_file = ?');
      values.push(data.outputFile);
    }
    
    if (fields.length === 0) {
      return;
    }
    
    values.push(id);
    await this.run(
      `UPDATE executions SET ${fields.join(', ')} WHERE id = ?`,
      ...values
    );
  }

  /**
   * Get an execution by ID
   */
  async getExecution(id: string): Promise<Execution | null> {
    return await this.get('SELECT * FROM executions WHERE id = ?', id);
  }

  /**
   * Get executions for a specific task
   */
  async getExecutionsByTask(taskId: string, limit: number = 50): Promise<Execution[]> {
    return await this.all(
      `SELECT * FROM executions 
       WHERE task_id = ? 
       ORDER BY started_at DESC 
       LIMIT ?`,
      taskId,
      limit
    );
  }

  /**
   * Get recent executions (all tasks)
   */
  async getRecentExecutions(limit: number = 50): Promise<Execution[]> {
    return await this.all(
      `SELECT * FROM executions 
       ORDER BY started_at DESC 
       LIMIT ?`,
      limit
    );
  }

  /**
   * Get executions by status
   */
  async getExecutionsByStatus(status: ExecutionStatus, limit: number = 50): Promise<Execution[]> {
    return await this.all(
      `SELECT * FROM executions 
       WHERE status = ? 
       ORDER BY started_at DESC 
       LIMIT ?`,
      status,
      limit
    );
  }

  /**
   * Delete old executions
   */
  async deleteOldExecutions(daysToKeep: number = 90): Promise<number> {
    const result = await this.run(
      `DELETE FROM executions 
       WHERE created_at < datetime('now', '-' || ? || ' days')`,
      daysToKeep
    );
    return result.changes || 0;
  }

  // ============================================
  // Execution Logs
  // ============================================

  /**
   * Add a log entry
   */
  async addLog(input: CreateLogInput): Promise<void> {
    await this.run(
      `INSERT INTO execution_logs (execution_id, level, message, step_id, step_name, metadata)
       VALUES (?, ?, ?, ?, ?, ?)`,
      input.executionId,
      input.level,
      input.message,
      input.stepId || null,
      input.stepName || null,
      input.metadata ? JSON.stringify(input.metadata) : null
    );
  }

  /**
   * Get logs for an execution
   */
  async getLogsByExecution(executionId: string): Promise<ExecutionLog[]> {
    return await this.all(
      `SELECT * FROM execution_logs 
       WHERE execution_id = ? 
       ORDER BY timestamp ASC`,
      executionId
    );
  }

  /**
   * Get logs by level
   */
  async getLogsByLevel(executionId: string, level: LogLevel): Promise<ExecutionLog[]> {
    return await this.all(
      `SELECT * FROM execution_logs 
       WHERE execution_id = ? AND level = ? 
       ORDER BY timestamp ASC`,
      executionId,
      level
    );
  }

  // ============================================
  // Execution Data
  // ============================================

  /**
   * Add execution data summary
   */
  async addExecutionData(
    executionId: string,
    dataKey: string,
    data: any
  ): Promise<void> {
    const dataType = Array.isArray(data) ? 'array' : typeof data;
    const itemCount = Array.isArray(data) ? data.length : 1;
    
    // Create sample data (first 3 items for arrays, or the whole data if small)
    let sampleData: any = data;
    if (Array.isArray(data) && data.length > 3) {
      sampleData = data.slice(0, 3);
    }
    
    await this.run(
      `INSERT INTO execution_data (execution_id, data_key, data_type, item_count, sample_data)
       VALUES (?, ?, ?, ?, ?)`,
      executionId,
      dataKey,
      dataType,
      itemCount,
      JSON.stringify(sampleData)
    );
  }

  /**
   * Get execution data
   */
  async getExecutionData(executionId: string): Promise<ExecutionData[]> {
    return await this.all(
      `SELECT * FROM execution_data 
       WHERE execution_id = ? 
       ORDER BY created_at ASC`,
      executionId
    );
  }

  // ============================================
  // Task Metadata
  // ============================================

  /**
   * Update task statistics
   */
  async updateTaskStats(input: UpdateTaskStatsInput): Promise<void> {
    const successVal = input.success ? 1 : 0;
    const failureVal = input.success ? 0 : 1;
    const status = input.success ? 'completed' : 'failed';
    
    await this.run(
      `INSERT INTO tasks_metadata (
         task_id, display_name, description, 
         run_count, success_count, failure_count, 
         last_run_at, last_run_status, last_run_duration_ms
       )
       VALUES (?, ?, ?, 1, ?, ?, datetime('now'), ?, ?)
       ON CONFLICT(task_id) DO UPDATE SET
         display_name = COALESCE(?, display_name),
         description = COALESCE(?, description),
         run_count = run_count + 1,
         success_count = success_count + ?,
         failure_count = failure_count + ?,
         last_run_at = datetime('now'),
         last_run_status = ?,
         last_run_duration_ms = ?,
         avg_duration_ms = CASE 
           WHEN ? IS NOT NULL THEN 
             CAST((COALESCE(avg_duration_ms, 0) * run_count + ?) AS INTEGER) / (run_count + 1)
           ELSE avg_duration_ms
         END,
         updated_at = datetime('now')`,
      input.taskId,
      input.displayName || null,
      input.description || null,
      successVal,
      failureVal,
      status,
      input.durationMs || null,
      input.displayName || null,
      input.description || null,
      successVal,
      failureVal,
      status,
      input.durationMs || null,
      input.durationMs || null,
      input.durationMs || null
    );
  }

  /**
   * Get task metadata
   */
  async getTaskMetadata(taskId: string): Promise<TaskMetadata | null> {
    return await this.get('SELECT * FROM tasks_metadata WHERE task_id = ?', taskId);
  }

  /**
   * Get all tasks metadata
   */
  async getAllTasksMetadata(): Promise<TaskMetadata[]> {
    return await this.all(
      `SELECT * FROM tasks_metadata 
       ORDER BY last_run_at DESC`
    );
  }

  // ============================================
  // Settings
  // ============================================

  /**
   * Get a setting value
   */
  async getSetting(key: string): Promise<any> {
    const row = await this.get('SELECT value, type FROM settings WHERE key = ?', key);
    if (!row) return null;
    
    switch (row.type) {
      case 'number': return Number(row.value);
      case 'boolean': return row.value === 'true';
      case 'json': return JSON.parse(row.value);
      default: return row.value;
    }
  }

  /**
   * Set a setting value
   */
  async setSetting(key: string, value: any, type: string = 'string'): Promise<void> {
    const strValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
    await this.run(
      `INSERT INTO settings (key, value, type, updated_at)
       VALUES (?, ?, ?, datetime('now'))
       ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = datetime('now')`,
      key,
      strValue,
      type,
      strValue
    );
  }

  /**
   * Get all settings
   */
  async getAllSettings(): Promise<Record<string, any>> {
    const rows = await this.all('SELECT key, value, type FROM settings');
    const settings: Record<string, any> = {};
    
    for (const row of rows) {
      switch (row.type) {
        case 'number':
          settings[row.key] = Number(row.value);
          break;
        case 'boolean':
          settings[row.key] = row.value === 'true';
          break;
        case 'json':
          settings[row.key] = JSON.parse(row.value);
          break;
        default:
          settings[row.key] = row.value;
      }
    }
    
    return settings;
  }

  // ============================================
  // Utility
  // ============================================

  /**
   * Execute a SQL query (public wrapper for run)
   */
  async executeRun(sql: string, params?: any[]): Promise<any> {
    return this.run(sql, ...(params || []));
  }

  /**
   * Get a single row (public wrapper for get)
   */
  async executeGet(sql: string, params?: any[]): Promise<any> {
    return this.get(sql, ...(params || []));
  }

  /**
   * Get all rows (public wrapper for all)
   */
  async executeAll(sql: string, params?: any[]): Promise<any[]> {
    return this.all(sql, ...(params || []));
  }

  /**
   * Execute SQL script (public wrapper for exec)
   */
  async executeExec(sql: string): Promise<void> {
    return this.exec(sql);
  }

  /**
   * Close database connection
   */
  async close(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.close((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  /**
   * Get database statistics
   */
  async getStats(): Promise<{
    totalExecutions: number;
    runningExecutions: number;
    completedExecutions: number;
    failedExecutions: number;
    totalTasks: number;
  }> {
    const totalExecutions = await this.get('SELECT COUNT(*) as count FROM executions');
    const runningExecutions = await this.get('SELECT COUNT(*) as count FROM executions WHERE status = ?', 'running');
    const completedExecutions = await this.get('SELECT COUNT(*) as count FROM executions WHERE status = ?', 'completed');
    const failedExecutions = await this.get('SELECT COUNT(*) as count FROM executions WHERE status = ?', 'failed');
    const totalTasks = await this.get('SELECT COUNT(*) as count FROM tasks_metadata');
    
    return {
      totalExecutions: totalExecutions?.count || 0,
      runningExecutions: runningExecutions?.count || 0,
      completedExecutions: completedExecutions?.count || 0,
      failedExecutions: failedExecutions?.count || 0,
      totalTasks: totalTasks?.count || 0
    };
  }
}

// Export singleton instance
export const databaseService = new DatabaseService();
