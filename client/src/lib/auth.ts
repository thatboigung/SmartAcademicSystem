import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { apiRequest } from './queryClient';
import { User } from '@shared/schema';
import { AuthContextType } from '@/types';

// Create context with default values
const defaultAuth: AuthContextType = {
  user: null,
  isLoading: true,
  error: null,
  login: async () => { throw new Error('Not implemented'); },
  logout: async () => { throw new Error('Not implemented'); }
};

const AuthContext = createContext<AuthContextType>(defaultAuth);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Check if user is already logged in
  useEffect(() => {
    let isMounted = true;
    
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/user', {
          credentials: 'include',
        });

        if (res.ok) {
          const userData = await res.json();
          if (isMounted) setUser(userData);
        } 
      } catch (err) {
        console.error('Auth check error:', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    checkAuth();
    
    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (username: string, password: string) => {
    setError(null);
    setIsLoading(true);

    try {
      // For development - handle demo users
      if ((username === 'admin' || username === 'lecturer' || username === 'student') && password === 'password') {
        console.log(`Using demo ${username} user for development`);
        
        // Create demo user based on role
        const demoUser = {
          id: username === 'admin' ? 1 : username === 'lecturer' ? 2 : 3,
          username,
          firstName: username.charAt(0).toUpperCase() + username.slice(1),
          lastName: 'User',
          email: `${username}@example.com`,
          role: username,
          studentId: username === 'student' ? 'STU001' : null,
          createdAt: new Date()
        };
        
        setUser(demoUser as User);
        return demoUser;
      }
      
      // Normal login flow
      const res = await apiRequest('POST', '/api/auth/login', { username, password });
      const userData = await res.json();
      setUser(userData);
      
      // Invalidate any cached queries that might contain user-specific data
      queryClient.invalidateQueries();
      return userData;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);

    try {
      await apiRequest('POST', '/api/auth/logout');
      setUser(null);
      
      // Clear all cached queries on logout
      queryClient.clear();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const authValue: AuthContextType = {
    user,
    isLoading,
    error,
    login,
    logout,
  };

  return React.createElement(AuthContext.Provider, { value: authValue }, children);
}

export function useAuth() {
  return useContext(AuthContext);
}
