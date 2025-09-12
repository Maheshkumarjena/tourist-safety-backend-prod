import { Server } from 'socket.io';
import http from 'http';
import { logger } from './logger';

let io: Server;

export const initSocket = (server: http.Server): void => {
    io = new Server(server, {
        cors: {
            origin: process.env.NODE_ENV === 'production'
                ? ['https://your-production-domain.com']
                : ['http://localhost:3000', 'http://localhost:3001'],
            methods: ['GET', 'POST']
        }
    });

    io.on('connection', (socket) => {
        logger.info('Client connected:', socket.id);

        socket.on('join-user-room', (userId: string) => {
            socket.join(`user-${userId}`);
            logger.info(`User ${userId} joined their room`);
        });

        socket.on('join-admin-room', () => {
            socket.join('admin-room');
            logger.info('Admin joined admin room');
        });

        socket.on('disconnect', () => {
            logger.info('Client disconnected:', socket.id);
        });
    });
};

export const getIO = (): Server => {
    if (!io) {
        throw new Error('Socket.io not initialized');
    }
    return io;
};

export const emitToUser = (userId: string, event: string, data: any): void => {
    io.to(`user-${userId}`).emit(event, data);
};

export const emitToAdmins = (event: string, data: any): void => {
    io.to('admin-room').emit(event, data);
};