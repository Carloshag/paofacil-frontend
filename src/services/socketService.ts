import { io, Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config/api';

const SERVER_URL = API_URL.replace('/api', '');

let socket: Socket | null = null;

export const connectSocket = async (): Promise<Socket> => {
  const token = await AsyncStorage.getItem('@paofacil:token');

  if (socket) {
    if (socket.connected && socket.auth && (socket.auth as any).token === token) {
      return socket;
    }
    console.log('[Socket] Token alterado ou desconectado. Reiniciando conexão...');
    socket.disconnect();
  }

  socket = io(SERVER_URL, {
    auth: { token },
    transports: ['websocket'],
    reconnectionAttempts: 5,
    reconnectionDelay: 2000,
  });

  socket.on('connect', () => {
    console.log('[Socket] Conectado:', socket?.id);
  });

  socket.on('connect_error', (err) => {
    console.warn('[Socket] Erro de conexão:', err.message);
  });

  socket.on('disconnect', (reason) => {
    console.log('[Socket] Desconectado:', reason);
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const getSocket = (): Socket | null => socket;
