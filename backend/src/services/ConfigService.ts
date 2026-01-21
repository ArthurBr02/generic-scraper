import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

interface TaskMetadata {
    id: string;
    name: string;
    description?: string;
    configFile: string;
    createdAt: string;
    updatedAt: string;
    lastRunAt?: string;
    lastRunStatus?: 'success' | 'error' | 'running';
    runCount: number;
}

interface Task extends TaskMetadata {
    config: any;
}

class ConfigService {
    private configsDir: string;
    private metadataFile: string;
    private metadata: Map<string, TaskMetadata>;

    constructor(configsDir: string = './configs') {
        this.configsDir = path.resolve(configsDir);
        this.metadataFile = path.join(this.configsDir, '.metadata.json');
        this.metadata = new Map();
        this.loadMetadata();
    }

    private loadMetadata(): void {
        if (fs.existsSync(this.metadataFile)) {
            try {
                const data = JSON.parse(fs.readFileSync(this.metadataFile, 'utf8'));
                this.metadata = new Map(Object.entries(data));
            } catch (error) {
                console.error('Error loading metadata:', error);
                this.metadata = new Map();
            }
        }
    }

    private saveMetadata(): void {
        const data = Object.fromEntries(this.metadata);
        fs.writeFileSync(this.metadataFile, JSON.stringify(data, null, 2));
    }

    private getConfigFiles(): string[] {
        if (!fs.existsSync(this.configsDir)) {
            fs.mkdirSync(this.configsDir, { recursive: true });
            return [];
        }
        return fs.readdirSync(this.configsDir)
            .filter(file => file.endsWith('.json') && file !== '.metadata.json');
    }

    private readConfigFile(filename: string): any {
        const filePath = path.join(this.configsDir, filename);
        const content = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(content);
    }

    private writeConfigFile(filename: string, config: any): void {
        const filePath = path.join(this.configsDir, filename);
        fs.writeFileSync(filePath, JSON.stringify(config, null, 2));
    }

    getAllTasks(): Task[] {
        const files = this.getConfigFiles();
        const tasks: Task[] = [];

        for (const file of files) {
            try {
                const config = this.readConfigFile(file);
                const id = path.basename(file, '.json');
                let meta = this.metadata.get(id);

                // Create metadata if not exists
                if (!meta) {
                    meta = {
                        id,
                        name: config.name || id,
                        description: config.description,
                        configFile: file,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                        runCount: 0
                    };
                    this.metadata.set(id, meta);
                    this.saveMetadata();
                }

                tasks.push({
                    ...meta,
                    config
                });
            } catch (error) {
                console.error(`Error loading config ${file}:`, error);
            }
        }

        return tasks;
    }

    getTask(id: string): Task | null {
        const filename = `${id}.json`;
        const filePath = path.join(this.configsDir, filename);

        if (!fs.existsSync(filePath)) {
            return null;
        }

        try {
            const config = this.readConfigFile(filename);
            let meta = this.metadata.get(id);

            if (!meta) {
                meta = {
                    id,
                    name: config.name || id,
                    description: config.description,
                    configFile: filename,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    runCount: 0
                };
                this.metadata.set(id, meta);
                this.saveMetadata();
            }

            return {
                ...meta,
                config
            };
        } catch (error) {
            console.error(`Error loading task ${id}:`, error);
            return null;
        }
    }

    createTask(name: string, description: string | undefined, config: any): Task {
        const id = uuidv4();
        const filename = `${id}.json`;
        const now = new Date().toISOString();

        // Add name and description to config
        config.name = name;
        if (description) {
            config.description = description;
        }

        // Write config file
        this.writeConfigFile(filename, config);

        // Create metadata
        const meta: TaskMetadata = {
            id,
            name,
            description,
            configFile: filename,
            createdAt: now,
            updatedAt: now,
            runCount: 0
        };

        this.metadata.set(id, meta);
        this.saveMetadata();

        return {
            ...meta,
            config
        };
    }

    updateTask(id: string, name?: string, description?: string, config?: any): Task | null {
        const task = this.getTask(id);
        if (!task) {
            return null;
        }

        const now = new Date().toISOString();
        const updatedConfig = config || task.config;

        if (name) {
            updatedConfig.name = name;
        }
        if (description !== undefined) {
            updatedConfig.description = description;
        }

        // Write updated config
        this.writeConfigFile(task.configFile, updatedConfig);

        // Update metadata
        const meta = this.metadata.get(id)!;
        if (name) meta.name = name;
        if (description !== undefined) meta.description = description;
        meta.updatedAt = now;

        this.metadata.set(id, meta);
        this.saveMetadata();

        return {
            ...meta,
            config: updatedConfig
        };
    }

    deleteTask(id: string): boolean {
        const task = this.getTask(id);
        if (!task) {
            return false;
        }

        const filePath = path.join(this.configsDir, task.configFile);
        try {
            fs.unlinkSync(filePath);
            this.metadata.delete(id);
            this.saveMetadata();
            return true;
        } catch (error) {
            console.error(`Error deleting task ${id}:`, error);
            return false;
        }
    }

    duplicateTask(id: string): Task | null {
        const task = this.getTask(id);
        if (!task) {
            return null;
        }

        const newName = `${task.name} (copie)`;
        return this.createTask(newName, task.description, { ...task.config });
    }

    updateTaskRunStats(id: string, status: 'success' | 'error' | 'running'): void {
        const meta = this.metadata.get(id);
        if (!meta) {
            return;
        }

        meta.lastRunAt = new Date().toISOString();
        meta.lastRunStatus = status;
        
        if (status === 'success' || status === 'error') {
            meta.runCount++;
        }

        this.metadata.set(id, meta);
        this.saveMetadata();
    }

    validateConfig(config: any): { valid: boolean; errors: string[] } {
        const errors: string[] = [];

        // Basic validation
        if (!config.url && !config.workflow) {
            errors.push('Config must have either "url" or "workflow" property');
        }

        if (config.workflow && !Array.isArray(config.workflow)) {
            errors.push('Workflow must be an array');
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }
}

export default ConfigService;
