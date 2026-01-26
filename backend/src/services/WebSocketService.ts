import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { logger } from '../utils/logger.js';
import {
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
} from '../types/websocket.types.js';

export type TypedSocketServer = SocketIOServer<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
>;

let io: TypedSocketServer | null = null;
let executionServiceInstance: any = null;

/**
 * Configure le service d'exécution
 */
export function setExecutionService(service: any): void {
    executionServiceInstance = service;
}

/**
 * Initialise le serveur WebSocket
 */
export function initWebSocket(httpServer: HTTPServer, corsOrigin: string): TypedSocketServer {
    io = new SocketIOServer<
        ClientToServerEvents,
        ServerToClientEvents,
        InterServerEvents,
        SocketData
    >(httpServer, {
        cors: {
            origin: corsOrigin,
            credentials: true,
        },
        transports: ['websocket', 'polling'],
    });

    io.on('connection', (socket) => {
        logger.info(`🔌 WebSocket client connected: ${socket.id}`);

        // Événement de démarrage de tâche
        socket.on('task:start', async (taskId, callback) => {
            try {
                logger.info(`📡 Received task:start for task ${taskId} from ${socket.id}`);
                
                if (!executionServiceInstance) {
                    callback({
                        success: false,
                        error: 'ExecutionService not initialized'
                    });
                    return;
                }

                const executionId = await executionServiceInstance.startTask(taskId);
                
                callback({
                    success: true,
                    executionId
                });
            } catch (error: any) {
                logger.error('Error starting task', { error: error.message, taskId });
                callback({
                    success: false,
                    error: error.message
                });
            }
        });

        // Événement d'arrêt de tâche
        socket.on('task:stop', async (executionId, callback) => {
            try {
                logger.info(`📡 Received task:stop for execution ${executionId} from ${socket.id}`);
                
                if (!executionServiceInstance) {
                    callback({
                        success: false,
                        error: 'ExecutionService not initialized'
                    });
                    return;
                }

                await executionServiceInstance.stopTask(executionId);
                
                callback({
                    success: true
                });
            } catch (error: any) {
                logger.error('Error stopping task', { error: error.message, executionId });
                callback({
                    success: false,
                    error: error.message
                });
            }
        });

        socket.on('disconnect', (reason) => {
            logger.info(`🔌 WebSocket client disconnected: ${socket.id} (${reason})`);
        });

        socket.on('error', (error) => {
            logger.error('WebSocket error', { error: error.message, socketId: socket.id });
        });
    });

    logger.info('✅ WebSocket server initialized');

    return io;
}

/**
 * Retourne l'instance du serveur WebSocket
 */
export function getWebSocketServer(): TypedSocketServer {
    if (!io) {
        throw new Error('WebSocket server not initialized. Call initWebSocket first.');
    }
    return io;
}

/**
 * Émet un événement vers tous les clients connectés
 */
export function emitToAll<K extends keyof ServerToClientEvents>(
    event: K,
    ...args: Parameters<ServerToClientEvents[K]>
): void {
    if (io) {
        // @ts-ignore - Socket.io typing issue with emit
        io.emit(event, ...args);
    }
}

/**
 * Émet un événement vers un client spécifique
 */
export function emitToClient<K extends keyof ServerToClientEvents>(
    socketId: string,
    event: K,
    ...args: Parameters<ServerToClientEvents[K]>
): void {
    if (io) {
        // @ts-ignore - Socket.io typing issue with emit
        io.to(socketId).emit(event, ...args);
    }
}
