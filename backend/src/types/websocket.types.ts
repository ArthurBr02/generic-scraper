/**
 * Types pour les événements WebSocket
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
    outputFile?: string;
}

/**
 * Événements Client → Server
 */
export interface ClientToServerEvents {
    'task:start': (taskId: string, callback: (response: { success: boolean; executionId?: string; error?: string }) => void) => void;
    'task:stop': (executionId: string, callback: (response: { success: boolean; error?: string }) => void) => void;
}

/**
 * Événements Server → Client
 */
export interface ServerToClientEvents {
    'task:status': (data: {
        executionId: string;
        taskId: string;
        status: ExecutionStatus;
    }) => void;

    'task:progress': (data: {
        executionId: string;
        taskId: string;
        progress: number;
        currentStep?: string;
    }) => void;

    'task:log': (data: {
        executionId: string;
        taskId: string;
        log: LogEntry;
    }) => void;

    'task:step': (data: {
        executionId: string;
        taskId: string;
        step: string;
        stepIndex: number;
        totalSteps: number;
    }) => void;

    'task:data': (data: {
        executionId: string;
        taskId: string;
        data: Record<string, any>;
        itemCount: number;
    }) => void;

    'task:complete': (data: {
        executionId: string;
        taskId: string;
        duration: number;
        itemsExtracted: number;
        outputFile?: string;
    }) => void;

    'task:error': (data: {
        executionId: string;
        taskId: string;
        error: string;
        step?: string;
    }) => void;
}

/**
 * Types pour les données inter-serveur
 */
export interface InterServerEvents {
    ping: () => void;
}

/**
 * Données stockées dans le socket
 */
export interface SocketData {
    userId?: string;
    sessionId?: string;
}
