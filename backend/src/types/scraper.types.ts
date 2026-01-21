/**
 * Type definitions for the Generic Scraper
 * These types mirror the scraper configuration format
 */

export interface ScraperConfig {
  name: string;
  description?: string;
  target?: TargetConfig;
  browser?: BrowserConfig;
  workflow?: WorkflowConfig | string;
  workflows?: WorkflowConfig[];
  output?: OutputConfig;
  errorHandling?: ErrorHandlingConfig;
  scheduling?: SchedulingConfig;
}

export interface TargetConfig {
  url: string;
  baseUrl?: string;
  authentication?: AuthenticationConfig;
}

export interface AuthenticationConfig {
  type: 'basic' | 'token' | 'cookie' | 'form';
  credentials?: {
    username?: string;
    password?: string;
    token?: string;
  };
  loginUrl?: string;
  loginSteps?: WorkflowStep[];
}

export interface BrowserConfig {
  headless?: boolean;
  timeout?: number;
  viewport?: {
    width: number;
    height: number;
  };
  userAgent?: string;
  proxy?: string;
  slowMo?: number;
  blockResources?: string[]; // Types of resources to block (images, stylesheets, fonts, etc.)
  args?: string[]; // Additional browser launch arguments
}

export interface WorkflowConfig {
  name?: string;
  description?: string;
  steps: WorkflowStep[];
  continueOnError?: boolean; // Global continue on error setting
}

export interface WorkflowStep {
  id?: string;
  name?: string;
  type: ActionType; // Use ActionType instead of string
  config?: Record<string, any>;
  retry?: RetryConfig;
  timeout?: number;
  continueOnError?: boolean;
  condition?: StepCondition;
  output?: string; // Key to store step result in workflow data
}

// Available action types based on registered actions
export type ActionType =
  | 'navigate'
  | 'click'
  | 'wait'
  | 'scroll'
  | 'input'
  | 'api'
  | 'pagination'
  | 'extract'
  | 'loop'
  | 'condition'
  | 'subWorkflow'
  | 'login'
  | 'form';

export interface StepCondition {
  type: 'element' | 'url' | 'variable' | 'custom';
  value?: any;
  operator?: 'equals' | 'contains' | 'exists' | 'not-exists';
}

export interface RetryConfig {
  retries?: number;
  delay?: number;
  backoffMultiplier?: number;
  maxRetryDelay?: number;
  screenshotOnError?: boolean;
}

export interface OutputConfig {
  path?: string;
  format?: 'json' | 'csv'; // Only json and csv are supported, not xlsx or txt
  encoding?: string;
  pretty?: boolean;
  append?: boolean;
  includeMetadata?: boolean;
  // CSV specific options
  columns?: string[]; // Column selection for CSV
  delimiter?: string; // CSV delimiter (default: ',')
  withHeaders?: boolean; // Include headers in CSV (default: true)
}

export interface ErrorHandlingConfig {
  retries?: number;
  retryDelay?: number;
  continueOnError?: boolean;
  screenshotOnError?: boolean;
  screenshotPath?: string;
}

export interface SchedulingConfig {
  enabled?: boolean;
  cron?: string;
  timezone?: string;
  runOnStart?: boolean;
  stateFile?: string;
}

export interface ScraperResult {
  success: boolean;
  data?: Record<string, any>; // Extracted data by output key
  duration?: number; // Duration in milliseconds
  metadata?: ScraperMetadata;
}

export interface ScraperMetadata {
  startTime?: string;
  endTime?: string;
  configName?: string;
  url?: string;
  steps?: number; // Number of steps executed
  workflow?: string; // Workflow name
}

export interface ActionSchema {
  type: string;
  description: string;
  schema: Record<string, any>;
  examples?: any[];
}

export interface ValidationResult {
  valid: boolean;
  errors?: ValidationError[];
}

export interface ValidationError {
  instancePath: string;
  message: string;
  params?: Record<string, any>;
}

export interface ExecutionOptions {
  headless?: boolean;
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
  onProgress?: (event: ProgressEvent) => void;
}

export interface ProgressEvent {
  type: 'step-start' | 'step-complete' | 'step-error' | 'data-extracted';
  step?: WorkflowStep;
  data?: any;
  error?: string;
  timestamp: number;
}

// Extractor types
export type ExtractorType = 'text' | 'attribute' | 'html' | 'list';

export interface ExtractorConfig {
  type: ExtractorType;
  selector?: string;
  attribute?: string; // For attribute extractor
  fields?: ExtractorFieldConfig[]; // For list extractor
  multiple?: boolean; // Extract multiple elements
  transform?: string; // Transform function (trim, lowercase, uppercase, etc.)
}

export interface ExtractorFieldConfig {
  name: string;
  type: ExtractorType;
  selector?: string;
  attribute?: string;
  transform?: string;
  default?: any;
}

// Pagination types
export interface PaginationConfig {
  type: 'click' | 'url' | 'scroll';
  maxPages?: number;
  maxItems?: number;
  // For click pagination
  nextButtonSelector?: string;
  // For URL pagination
  urlPattern?: string;
  startPage?: number;
  // For scroll pagination
  scrollDelay?: number;
  scrollDistance?: number;
  detectEndSelector?: string;
}

// Common action configurations
export interface NavigateActionConfig {
  url: string;
  waitUntil?: 'load' | 'domcontentloaded' | 'networkidle';
  timeout?: number;
  referer?: string;
}

export interface ClickActionConfig {
  selector: string;
  button?: 'left' | 'right' | 'middle';
  clickCount?: number;
  delay?: number;
  force?: boolean;
  waitAfter?: number;
}

export interface WaitActionConfig {
  type: 'timeout' | 'selector' | 'navigation' | 'networkidle' | 'function' | 'url';
  duration?: number; // For timeout
  selector?: string; // For selector wait
  timeout?: number;
  state?: 'attached' | 'detached' | 'visible' | 'hidden';
}

export interface ScrollActionConfig {
  type: 'page' | 'element' | 'bottom' | 'top' | 'into-view';
  selector?: string; // For element scroll
  x?: number;
  y?: number;
  smooth?: boolean;
}

export interface InputActionConfig {
  type: 'fill' | 'type' | 'press' | 'select' | 'check' | 'uncheck' | 'upload';
  selector: string;
  value?: string | string[];
  delay?: number; // For type action
  clear?: boolean; // Clear before input
}

export interface ApiActionConfig {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  url: string;
  headers?: Record<string, string>;
  body?: any;
  responseType?: 'json' | 'text' | 'blob' | 'arrayBuffer';
  timeout?: number;
  useBrowserCookies?: boolean;
}

export interface LoopActionConfig {
  type: 'items' | 'count' | 'while';
  items?: string; // Variable name containing items array
  count?: number; // Number of iterations
  condition?: string; // Condition expression for while loop
  steps: WorkflowStep[]; // Steps to execute in loop
  maxIterations?: number; // Safety limit
}

export interface ConditionActionConfig {
  type: 'element' | 'url' | 'variable' | 'custom';
  condition: string | boolean;
  thenSteps?: WorkflowStep[];
  elseSteps?: WorkflowStep[];
}

