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
    params?: Record<string, any>;
    next?: string | string[];
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
    delay?: number;
    retries?: number;
}

export interface Task {
    id: string;
    name: string;
    description?: string;
    config: ScraperConfig;
    createdAt: string;
    updatedAt: string;
    lastRunAt?: string;
    lastRunStatus?: 'success' | 'error' | 'running';
    runCount: number;
}
