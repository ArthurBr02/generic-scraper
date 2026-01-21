/**
 * Database type definitions
 */

// Execution status enum
export type ExecutionStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

// Log level enum
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

// Setting type enum
export type SettingType = 'string' | 'number' | 'boolean' | 'json';

// Data type enum
export type DataType = 'array' | 'object' | 'string' | 'number';

/**
 * Execution record
 */
export interface Execution {
  id: string;
  task_id: string;
  task_name?: string;
  status: ExecutionStatus;
  started_at?: string;
  completed_at?: string;
  duration_ms?: number;
  items_extracted?: number;
  error_message?: string;
  error_stack?: string;
  output_file?: string;
  created_at?: string;
}

/**
 * Execution log record
 */
export interface ExecutionLog {
  id?: number;
  execution_id: string;
  timestamp?: string;
  level: LogLevel;
  message: string;
  step_id?: string;
  step_name?: string;
  metadata?: string; // JSON string
}

/**
 * Execution data record (summary of extracted data)
 */
export interface ExecutionData {
  id?: number;
  execution_id: string;
  data_key: string;
  data_type?: DataType;
  item_count?: number;
  sample_data?: string; // JSON string
  created_at?: string;
}

/**
 * Task metadata record
 */
export interface TaskMetadata {
  task_id: string;
  display_name?: string;
  description?: string;
  run_count?: number;
  success_count?: number;
  failure_count?: number;
  last_run_at?: string;
  last_run_status?: ExecutionStatus;
  last_run_duration_ms?: number;
  avg_duration_ms?: number;
  created_at?: string;
  updated_at?: string;
}

/**
 * Application setting record
 */
export interface Setting {
  key: string;
  value: string;
  type?: SettingType;
  description?: string;
  updated_at?: string;
}

/**
 * Create execution input
 */
export interface CreateExecutionInput {
  id: string;
  taskId: string;
  taskName?: string;
}

/**
 * Update execution input
 */
export interface UpdateExecutionInput {
  status?: ExecutionStatus;
  completedAt?: string;
  durationMs?: number;
  itemsExtracted?: number;
  errorMessage?: string;
  errorStack?: string;
  outputFile?: string;
}

/**
 * Create log input
 */
export interface CreateLogInput {
  executionId: string;
  level: LogLevel;
  message: string;
  stepId?: string;
  stepName?: string;
  metadata?: Record<string, any>;
}

/**
 * Update task stats input
 */
export interface UpdateTaskStatsInput {
  taskId: string;
  success: boolean;
  durationMs?: number;
  displayName?: string;
  description?: string;
}
