import { io, Socket } from 'socket.io-client';
import type {
    TaskStatusEvent,
    TaskProgressEvent,
    TaskLogEvent,
    TaskStepEvent,
    TaskDataEvent,
    TaskCompleteEvent,
    TaskErrorEvent
} from '../types/websocket';

type EventCallback<T> = (data: T) => void;

class WebSocketService {
    private socket: Socket | null = null;
    private url: string;
    private connected: boolean = false;
    private reconnectAttempts: number = 0;
    private maxReconnectAttempts: number = 5;
    private eventHandlers: Map<string, Set<EventCallback<any>>> = new Map();

    constructor(url: string = 'http://localhost:3000') {
        this.url = url;
    }

    /**
     * Connecte au serveur WebSocket
     */
    connect(): void {
        if (this.socket?.connected) {
            console.log('✅ WebSocket already connected');
            return;
        }

        console.log('🔌 Connecting to WebSocket server...', this.url);

        this.socket = io(this.url, {
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            reconnectionAttempts: this.maxReconnectAttempts
        });

        this.socket.on('connect', () => {
            console.log('✅ WebSocket connected', this.socket?.id);
            this.connected = true;
            this.reconnectAttempts = 0;
            this.triggerEvent('connect', {});
        });

        this.socket.on('disconnect', (reason) => {
            console.log('🔌 WebSocket disconnected:', reason);
            this.connected = false;
            this.triggerEvent('disconnect', { reason });
        });

        this.socket.on('connect_error', (error) => {
            console.error('❌ WebSocket connection error:', error.message);
            this.reconnectAttempts++;
            
            if (this.reconnectAttempts >= this.maxReconnectAttempts) {
                console.error('❌ Max reconnection attempts reached');
                this.disconnect();
            }
            
            this.triggerEvent('error', { error: error.message });
        });

        // Enregistrer les événements du serveur
        this.registerServerEvents();
    }

    /**
     * Enregistre tous les événements envoyés par le serveur
     */
    private registerServerEvents(): void {
        if (!this.socket) return;

        this.socket.on('task:status', (data: TaskStatusEvent) => {
            console.log('📡 Received task:status', data);
            this.triggerEvent('task:status', data);
        });

        this.socket.on('task:progress', (data: TaskProgressEvent) => {
            console.log('📡 Received task:progress', data);
            this.triggerEvent('task:progress', data);
        });

        this.socket.on('task:log', (data: TaskLogEvent) => {
            console.log('📡 Received task:log', data);
            this.triggerEvent('task:log', data);
        });

        this.socket.on('task:step', (data: TaskStepEvent) => {
            console.log('📡 Received task:step', data);
            this.triggerEvent('task:step', data);
        });

        this.socket.on('task:data', (data: TaskDataEvent) => {
            console.log('📡 Received task:data', data);
            this.triggerEvent('task:data', data);
        });

        this.socket.on('task:complete', (data: TaskCompleteEvent) => {
            console.log('📡 Received task:complete', data);
            this.triggerEvent('task:complete', data);
        });

        this.socket.on('task:error', (data: TaskErrorEvent) => {
            console.error('📡 Received task:error', data);
            this.triggerEvent('task:error', data);
        });
    }

    /**
     * Déconnecte du serveur WebSocket
     */
    disconnect(): void {
        if (this.socket) {
            console.log('🔌 Disconnecting from WebSocket server...');
            this.socket.disconnect();
            this.socket = null;
            this.connected = false;
        }
    }

    /**
     * Vérifie si le socket est connecté
     */
    isConnected(): boolean {
        return this.connected && this.socket !== null;
    }

    /**
     * Démarre une tâche
     */
    startTask(taskId: string): Promise<{ success: boolean; executionId?: string; error?: string }> {
        return new Promise((resolve, reject) => {
            if (!this.socket?.connected) {
                reject(new Error('WebSocket not connected'));
                return;
            }

            console.log('📤 Sending task:start', taskId);

            this.socket.emit('task:start', taskId, (response) => {
                console.log('📥 Received task:start response', response);
                resolve(response);
            });
        });
    }

    /**
     * Arrête une exécution
     */
    stopTask(executionId: string): Promise<{ success: boolean; error?: string }> {
        return new Promise((resolve, reject) => {
            if (!this.socket?.connected) {
                reject(new Error('WebSocket not connected'));
                return;
            }

            console.log('📤 Sending task:stop', executionId);

            this.socket.emit('task:stop', executionId, (response) => {
                console.log('📥 Received task:stop response', response);
                resolve(response);
            });
        });
    }

    /**
     * Enregistre un callback pour un événement
     */
    on<T = any>(event: string, callback: EventCallback<T>): void {
        if (!this.eventHandlers.has(event)) {
            this.eventHandlers.set(event, new Set());
        }
        this.eventHandlers.get(event)!.add(callback);
    }

    /**
     * Retire un callback pour un événement
     */
    off<T = any>(event: string, callback: EventCallback<T>): void {
        const handlers = this.eventHandlers.get(event);
        if (handlers) {
            handlers.delete(callback);
        }
    }

    /**
     * Déclenche les callbacks d'un événement
     */
    private triggerEvent<T = any>(event: string, data: T): void {
        const handlers = this.eventHandlers.get(event);
        if (handlers) {
            handlers.forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in event handler for ${event}:`, error);
                }
            });
        }
    }

    /**
     * Retire tous les event handlers
     */
    removeAllListeners(): void {
        this.eventHandlers.clear();
    }
}

// Instance singleton
export const webSocketService = new WebSocketService(
    import.meta.env.VITE_API_URL || 'http://localhost:3000'
);

export default webSocketService;
