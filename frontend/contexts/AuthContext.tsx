'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { authApi } from '../lib/api';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: 'STUDENT' | 'ADMIN';
  studentId?: string;
  gender?: string;
  course?: string;
  yearOfStudy?: number;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string, role?: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (data: Record<string, unknown>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const accessToken = localStorage.getItem('accessToken');
    if (storedUser && accessToken) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.clear();
      }
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string, role = 'STUDENT') => {
    const res = await authApi.login({ email, password, role });
    if (!res.success || !res.data) {
      throw new Error(res.message ?? 'Login failed');
    }
    const { user: userData, accessToken, refreshToken } = res.data as {
      user: User;
      accessToken: string;
      refreshToken: string;
    };
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      setUser(null);
    }
  }, []);

  const register = useCallback(async (data: Record<string, unknown>) => {
    const res = await authApi.registerStudent(data);
    if (!res.success || !res.data) {
      throw new Error(res.message ?? 'Registration failed');
    }
    const { student, accessToken, refreshToken } = res.data as {
      student: User;
      accessToken: string;
      refreshToken: string;
    };
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('user', JSON.stringify(student));
    setUser(student);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        register,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
