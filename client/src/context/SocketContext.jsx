import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(); //This creates a global container, This will store: socket, connected state

/*
<SocketProvider>
  <App />
</SocketProvider>
*/
export const SocketProvider = ({ children }) => {
  const { token } = useAuth();
  const socketRef = useRef(null); //Why useRef: Keeps same socket instance across renders, Doesn’t trigger re-renders when changed
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!token) return;

    // Create socket connection — pass JWT in auth handshake
    socketRef.current = io('http://localhost:5000', {
      auth: { token },          // this is what our server middleware reads //Sends JWT to backend
      transports: ['websocket'], // skip polling, go straight to WS //Direct WebSocket connection
    });

    socketRef.current.on('connect', () => { //Fires when connection succeeds
      console.log('Socket connected:', socketRef.current.id);
      setConnected(true); //connected = true
    });

    socketRef.current.on('disconnect', () => {
      console.log('Socket disconnected');
      setConnected(false);
    });

    socketRef.current.on('connect_error', (err) => {
      console.error('Socket connection error:', err.message);
    });

    // Cleanup on logout or token change
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect(); //User logs out (token changes), Component unmounts, Prevents: Memory leaks, duplicate connections
        socketRef.current = null;
      }
    };
  }, [token]);

  
/*
Makes available to entire app:

socket → actual connection
connected → status
*/
  return (
    <SocketContext.Provider value={{ socket: socketRef.current, connected }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);

//This file React Socket Context: it creates a global, reusable Socket.IO connection that any component can use.
/*
Without this:

Every component might create its own socket
Multiple connections → bugs + performance issues

With this:

Single connection
Shared everywhere
Clean lifecycle (connect/disconnect)
*/