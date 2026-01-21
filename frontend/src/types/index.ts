/**
 * Types de base pour l'application Generic Scraper
 */

// ============================================
// Types de configuration du scraper
// ============================================

export interface ScraperConfig {
    name: string;
    description?: string;
    url: string;
    workflow: WorkflowStep[];
    output?: OutputConfig;
    options?: ScraperOptions;
}

export interface WorkflowStep {
    id: string;
    type: string;
    name?: string;
    params: Record<string, any>;
    onSuccess?: string;
    onError?: string;
}

export interface OutputConfig {
    format?: 'json' | 'csv' | 'xlsx';
    filename?: string;
    path?: string;
}

export interface ScraperOptions {
    headless?: boolean;
    timeout?: number;
    userAgent?: string;
    viewport?: {
        width: number;
        height: number;
    };
    proxy?: string;
    cookies?: Record<string, string>;
}

// ============================================
// Types de tâches
// ============================================

export interface Task {
    id: string;
    name: string;
    description?: string;
    config: ScraperConfig;
    createdAt: string;
    updatedAt: string;
    lastRunAt?: string;
    lastRunStatus?: ExecutionStatus;
    runCount: number;
}

export interface TaskMetadata {
    taskId: string;
    displayName?: string;
    description?: string;
    runCount: number;
    successCount: number;
    failureCount: number;
    lastRunAt?: string;
    lastRunStatus?: ExecutionStatus;
    lastRunDurationMs?: number;
    avgDurationMs?: number;
    createdAt: string;
    updatedAt: string;
}

// ============================================
// Types d'exécution
// ============================================

export type ExecutionStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

export interface Execution {
    id: string;
    taskId: string;
    taskName?: string;
    status: ExecutionStatus;
    startedAt?: string;
    completedAt?: string;
    durationMs?: number;
    itemsExtracted: number;
    errorMessage?: string;
    errorStack?: string;
    outputFile?: string;
    createdAt: string;
}

export interface ExecutionLog {
    id: number;
    executionId: string;
    timestamp: string;
    level: LogLevel;
    message: string;
    stepId?: string;
    stepName?: string;
    metadata?: Record<string, any>;
}

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface ExecutionData {
    id: number;
    executionId: string;
    dataKey: string;
    dataType?: string;
    itemCount?: number;
    sampleData?: string;
    createdAt: string;
}

// ============================================
// Types de blocs (pour l'éditeur visuel)
// ============================================

export interface BlockDefinition {
    type: string;
    category: BlockCategory;
    name: string;
    description: string;
    icon: string;
    color: string;
    inputs: BlockPort[];
    outputs: BlockPort[];
    params: BlockParam[];
}

export type BlockCategory =
    | 'navigation'
    | 'interaction'
    | 'extraction'
    | 'transformation'
    | 'condition'
    | 'loop'
    | 'output';

export interface BlockPort {
    id: string;
    name: string;
    type: 'flow' | 'data';
    dataType?: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'any';
}

export interface BlockParam {
    name: string;
    label: string;
    type: 'text' | 'number' | 'boolean' | 'select' | 'textarea' | 'code';
    required?: boolean;
    default?: any;
    options?: Array<{ label: string; value: any }>;
    placeholder?: string;
    description?: string;
    validation?: {
        min?: number;
        max?: number;
        pattern?: string;
        message?: string;
    };
}

export interface BlockInstance {
    id: string;
    type: string;
    position: { x: number; y: number };
    params: Record<string, any>;
}

export interface BlockConnection {
    id: string;
    sourceBlockId: string;
    sourcePortId: string;
    targetBlockId: string;
    targetPortId: string;
}

// ============================================
// Types de paramètres
// ============================================

export interface AppSettings {
    appTheme: 'light' | 'dark' | 'system';
    maxConcurrentExecutions: number;
    logRetentionDays: number;
    executionRetentionDays: number;
}

// ============================================
// Types d'API
// ============================================

export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

export interface PaginatedResponse<T> {
    items: T[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}

// ============================================
// Types de filtres
// ============================================

export interface TaskFilters {
    search?: string;
    status?: ExecutionStatus;
    sortBy?: 'name' | 'createdAt' | 'updatedAt' | 'lastRunAt';
    sortOrder?: 'asc' | 'desc';
}

export interface ExecutionFilters {
    taskId?: string;
    status?: ExecutionStatus;
    dateFrom?: string;
    dateTo?: string;
    sortBy?: 'startedAt' | 'durationMs' | 'itemsExtracted';
    sortOrder?: 'asc' | 'desc';
}
