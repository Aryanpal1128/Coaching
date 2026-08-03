import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext();

// Derive the Socket.IO server URL from VITE_API_URL.
// VITE_API_URL is "https://your-backend.onrender.com/api/v1" — strip the path
// to get the base server URL that Socket.IO connects to.
const getSocketUrl = () => {
  const apiUrl = import.meta.env.VITE_API_URL;
  if (apiUrl) {
    // Remove the /api/v1 path suffix — Socket.IO connects to the root server
    try {
      const url = new URL(apiUrl);
      return url.origin; // e.g. https://your-backend.onrender.com
    } catch {
      return apiUrl;
    }
  }
  // Local development fallback (Vite proxy does not handle WebSocket upgrades
  // so we still need the explicit backend URL in dev)
  return 'http://localhost:5001';
};

export const SocketProvider = ({ children, user }) => {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const socketUrl = getSocketUrl();
    const newSocket = io(socketUrl, {
      transports: ['polling', 'websocket'],
      withCredentials: true
    });

    setSocket(newSocket);

    if (user && user._id) {
      newSocket.emit('join_user_room', user._id);
    }

    return () => newSocket.close();
  }, [user]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
