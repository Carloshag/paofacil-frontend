import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

import { User, UserRole } from '../types';
import { API_URL } from '../config/api';
import { disconnectSocket } from '../services/socketService';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  verify: (email: string, code: string) => Promise<void>;
  resendVerificationCode: (email: string) => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  resetPassword: (email: string, code: string, newPassword: string) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
  requiresVerification: boolean;
  setRequiresVerification: (val: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [requiresVerification, setRequiresVerification] = useState(false);

  useEffect(() => {
    const loadSession = async () => {
      try {
        const savedUser = await AsyncStorage.getItem('@paofacil:user');
        const savedToken = await AsyncStorage.getItem('@paofacil:token');
        if (savedUser && savedToken) {
          setUser(JSON.parse(savedUser));
        }
      } catch (e) {
        console.error('Failed to load session', e);
      }
    };
    loadSession();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, senha: password }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.require_verification) {
          setRequiresVerification(true);
          throw new Error(data.error);
        }
        const errorMessage = data.details?.[0]?.message || data.error || 'Erro ao fazer login. Verifique suas credenciais.';
        throw new Error(errorMessage);
      }

      const { token, user: backendUser } = data;

      const loggedUser: User = {
        id: backendUser.id.toString(),
        name: backendUser.nome,
        email: backendUser.email,
        role: backendUser.role as UserRole
      };

      await AsyncStorage.setItem('@paofacil:token', token);
      await AsyncStorage.setItem('@paofacil:user', JSON.stringify(loggedUser));
      setUser(loggedUser);
      setRequiresVerification(false);
    } catch (err: any) {
      setError(err.message || 'Erro ao fazer login.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const registerUser = async (name: string, email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: name, email, senha: password }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = data.details?.[0]?.message || data.error || 'Erro ao criar conta.';
        throw new Error(errorMessage);
      }

      setRequiresVerification(true);
    } catch (err: any) {
      setError(err.message || 'Erro ao criar conta.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const resendVerificationCode = async (email: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/auth/resend-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = data.details?.[0]?.message || data.error || 'Erro ao reenviar código.';
        throw new Error(errorMessage);
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao reenviar código.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const verify = async (email: string, code: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/auth/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = data.details?.[0]?.message || data.error || 'Erro ao verificar código.';
        throw new Error(errorMessage);
      }

      const { token, user: backendUser } = data;

      const loggedUser: User = {
        id: backendUser.id.toString(),
        name: backendUser.nome,
        email: backendUser.email,
        role: backendUser.role as UserRole
      };

      await AsyncStorage.setItem('@paofacil:token', token);
      await AsyncStorage.setItem('@paofacil:user', JSON.stringify(loggedUser));
      setUser(loggedUser);
      setRequiresVerification(false);
    } catch (err: any) {
      setError(err.message || 'Erro ao verificar código.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const requestPasswordReset = async (email: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = data.details?.[0]?.message || data.error || 'Erro ao solicitar redefinição de senha.';
        throw new Error(errorMessage);
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao solicitar redefinição de senha.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (email: string, code: string, novaSenha: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code, novaSenha }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = data.details?.[0]?.message || data.error || 'Erro ao redefinir senha.';
        throw new Error(errorMessage);
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao redefinir senha.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    await AsyncStorage.removeItem('@paofacil:token');
    await AsyncStorage.removeItem('@paofacil:user');
    disconnectSocket();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register: registerUser, verify, resendVerificationCode, requestPasswordReset, resetPassword, logout, isLoading, error, requiresVerification, setRequiresVerification }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
