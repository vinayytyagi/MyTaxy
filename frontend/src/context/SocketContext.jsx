import React, { createContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

export const SocketContext = createContext();

const socket = io(`${import.meta.env.VITE_BASE_URL}`, {
    withCredentials: true,
    transports: ['websocket', 'polling'],
    cors: {
        origin: import.meta.env.VITE_FRONTEND_URL || 'http://localhost:5173',
        methods: ['GET', 'POST'],
        credentials: true
    }
});

const SocketProvider = ({ children }) => {
    const [isConnected, setIsConnected] = useState(socket.connected);

    useEffect(() => {
        function onConnect() {
            setIsConnected(true);
            console.log('Socket connected');
        }

        function onDisconnect() {
            setIsConnected(false);
            console.log('Socket disconnected');
        }

        socket.on('connect', onConnect);
        socket.on('disconnect', onDisconnect);

        return () => {
            socket.off('connect', onConnect);
            socket.off('disconnect', onDisconnect);
        };
    }, []);

    const joinUser = (userId) => {
        if (isConnected && userId) {
            socket.emit("join", { userType: "user", userId });
        }
    };

    const joinCaptain = (captainId) => {
        if (isConnected && captainId) {
            socket.emit("join", { userType: "captain", userId: captainId });
        }
    };

    return (
        <SocketContext.Provider value={{ socket, isConnected, joinUser, joinCaptain }}>
            {children}
        </SocketContext.Provider>
    );
};

export default SocketProvider;