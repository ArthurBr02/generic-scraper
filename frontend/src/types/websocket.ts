/**
 * Types pour les événements WebSocket (frontend)
 */

export type ExecutionStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

export interface LogEntry {
    timestamp: string;
    level: LogLevel;
    message: string;
    workflowId?: string;
    data?: any;
}

export interface Execution {
    id: string;
    taskId: string;
    status: ExecutionStatus;
    startedAt: string;
    completedAt?: string;
    currentStep?: string;
    progress: number; // 0-100
    logs: LogEntry[];
    data: Record<string, any>;
    error?: string;
}

// Événements émis par le serveur
export interface TaskStatusEvent {
    executionId: string;
    taskId: string;
    status: ExecutionStatus;
}

export interface TaskProgressEvent {
    executionId: string;
    taskId: string;
    progress: number;
    currentStep?: string;
}

export interface TaskLogEvent {
    executionId: string;
    taskId: string;
    log: LogEntry;
}

export interface TaskStepEvent {
    executionId: string;
    taskId: string;
    step: string;
    stepIndex: number;
    totalSteps: number;
}

export interface TaskDataEvent {
    executionId: string;
    taskId: string;
    data: Record<string, any>;
    itemCount: number;
}

export interface TaskCompleteEvent {
    executionId: string;
    taskId: string;
    duration: number;
    itemsExtracted: number;
    outputFile?: string;
}

export interface TaskErrorEvent {
    executionId: string;
    taskId: string;
    error: string;
    step?: string;
}
