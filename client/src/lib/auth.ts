import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { apiRequest } from './queryClient';
import { User } from '@shared/schema';
import { AuthContextType } from '@/types';

// Create a default admin user for automatic login
const autoUser: User = {
  id: 1,
  username: 'admin',
  password: 'password-hash', // Not actually used for validation
  firstName: 'Admin',
  lastName: 'User',
  email: 'admin@example.com',
  role: 'admin',
  studentId: null,
  createdAt: new Date()
};

// Create context with auto-login values
const defaultAuth: AuthContextType = {
  user: autoUser, // Set a default user instead of null
  isLoading: false,
  error: null,
  login: async () => autoUser, // Return the default user
  logout: async () => {}
};

const AuthContext = createContext<AuthContextType>(defaultAuth);

export function AuthProvider({ children }: { children: ReactNode }) {
  // Initialize with the auto user to skip authentication completely
  const [user, setUser] = useState<User | null>(autoUser);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Check if user is already logged in
  useEffect(() => {
    let isMounted = true;
    
    const checkAuth = async () => {
      try {
        // For production:
        /*
        const res = await fetch('/api/auth/user', {
          credentials: 'include',
        });

        if (res.ok) {
          const userData = await res.json();
          if (isMounted) setUser(userData);
        }
        */

        // For demo purposes, check localStorage for session
        const savedUser = localStorage.getItem('demo_user');
        if (savedUser) {
          try {
            const userData = JSON.parse(savedUser);
            if (isMounted) setUser(userData);
          } catch (e) {
            console.error('Failed to parse saved user', e);
            localStorage.removeItem('demo_user'); // Clear invalid data
          }
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
    console.log('Auto-login enabled - bypassing all validation');
    setError(null);
    
    // Always use the auto admin user for simplicity
    console.log('Using pre-configured admin user');
    const demoUser = autoUser;
    
    // Save user to localStorage
    localStorage.setItem('demo_user', JSON.stringify(demoUser));
    
    // Update state
    setUser(demoUser);
    
    console.log('Auto-login successful, returning user:', demoUser);
    return demoUser;
  };

  const logout = async () => {
    setIsLoading(true);

    try {
      // Mock logout (server call disabled for now)
      // await apiRequest('POST', '/api/auth/logout');
      
      // Remove user from localStorage for demo
      localStorage.removeItem('demo_user');
      
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
