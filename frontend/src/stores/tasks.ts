import { defineStore } from 'pinia';

interface Task {
    id: string;
    name: string;
    description?: string;
    config: any;
    createdAt: string;
    updatedAt: string;
    lastRunAt?: string;
    lastRunStatus?: 'success' | 'error' | 'running';
    runCount: number;
}

interface TasksState {
    tasks: Task[];
    loading: boolean;
    error: string | null;
}

export const useTasksStore = defineStore('tasks', {
    state: (): TasksState => ({
        tasks: [],
        loading: false,
        error: null
    }),

    getters: {
        getTaskById: (state) => (id: string): Task | undefined => {
            return state.tasks.find(task => task.id === id);
        },

        taskCount: (state): number => {
            return state.tasks.length;
        }
    },

    actions: {
        async fetchTasks(): Promise<void> {
            this.loading = true;
            this.error = null;
            try {
                const response = await fetch('/api/tasks');
                if (!response.ok) {
                    throw new Error('Erreur lors de la récupération des tâches');
                }
                this.tasks = await response.json();
            } catch (error: any) {
                this.error = error.message;
                throw error;
            } finally {
                this.loading = false;
            }
        },

        async fetchTask(id: string): Promise<Task> {
            this.loading = true;
            this.error = null;
            try {
                const response = await fetch(`/api/tasks/${id}`);
                if (!response.ok) {
                    throw new Error('Erreur lors de la récupération de la tâche');
                }
                return await response.json();
            } catch (error: any) {
                this.error = error.message;
                throw error;
            } finally {
                this.loading = false;
            }
        },

        async createTask(task: Partial<Task>): Promise<Task> {
            this.loading = true;
            this.error = null;
            try {
                const response = await fetch('/api/tasks', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(task)
                });
                if (!response.ok) {
                    throw new Error('Erreur lors de la création de la tâche');
                }
                const newTask = await response.json();
                this.tasks.push(newTask);
                return newTask;
            } catch (error: any) {
                this.error = error.message;
                throw error;
            } finally {
                this.loading = false;
            }
        },

        async updateTask(id: string, task: Partial<Task>): Promise<Task> {
            this.loading = true;
            this.error = null;
            try {
                const response = await fetch(`/api/tasks/${id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(task)
                });
                if (!response.ok) {
                    throw new Error('Erreur lors de la mise à jour de la tâche');
                }
                const updatedTask = await response.json();
                const index = this.tasks.findIndex(t => t.id === id);
                if (index !== -1) {
                    this.tasks[index] = updatedTask;
                }
                return updatedTask;
            } catch (error: any) {
                this.error = error.message;
                throw error;
            } finally {
                this.loading = false;
            }
        },

        async deleteTask(id: string): Promise<void> {
            this.loading = true;
            this.error = null;
            try {
                const response = await fetch(`/api/tasks/${id}`, {
                    method: 'DELETE'
                });
                if (!response.ok) {
                    throw new Error('Erreur lors de la suppression de la tâche');
                }
                this.tasks = this.tasks.filter(t => t.id !== id);
            } catch (error: any) {
                this.error = error.message;
                throw error;
            } finally {
                this.loading = false;
            }
        },

        async runTask(id: string): Promise<void> {
            const response = await fetch(`/api/tasks/${id}/run`, {
                method: 'POST'
            });
            if (!response.ok) {
                throw new Error('Erreur lors du lancement de la tâche');
            }
            return await response.json();
        },

        async duplicateTask(id: string): Promise<Task> {
            const response = await fetch(`/api/tasks/${id}/duplicate`, {
                method: 'POST'
            });
            if (!response.ok) {
                throw new Error('Erreur lors de la duplication de la tâche');
            }
            const duplicatedTask = await response.json();
            this.tasks.push(duplicatedTask);
            return duplicatedTask;
        }
    }
});
