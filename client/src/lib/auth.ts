import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { apiRequest } from './queryClient';
import { User } from '@shared/schema';
import { AuthContextType } from '@/types';

// Create context with default values
const defaultAuth: AuthContextType = {
  user: null,
  isLoading: false, // Set initial loading to false
  error: null,
  login: async () => { throw new Error('Not implemented'); },
  logout: async () => { throw new Error('Not implemented'); }
};

const AuthContext = createContext<AuthContextType>(defaultAuth);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false); // Start with false
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
    console.log('Auth login function called with:', username);
    setError(null);
    setIsLoading(true);

    try {
      // Always use demo users for now
      if (true) {
        console.log(`Using demo ${username} user for development`);
        
        // Create demo user based on role
        let role = 'student';
        if (username === 'admin') role = 'admin';
        if (username === 'lecturer') role = 'lecturer';
        
        // Check password - for demo, we only accept "password"
        if (password !== 'password') {
          console.error('Invalid password for demo login');
          throw new Error('Invalid password. For demo, please use "password"');
        }
        
        console.log('Creating demo user with role:', role);
        const demoUser = {
          id: username === 'admin' ? 1 : username === 'lecturer' ? 2 : 3,
          username,
          firstName: username.charAt(0).toUpperCase() + username.slice(1),
          lastName: 'User',
          email: `${username}@example.com`,
          role,
          studentId: role === 'student' ? 'STU001' : null,
          createdAt: new Date()
        };
        
        // Save user to localStorage for persistence
        console.log('Saving user to localStorage:', demoUser);
        localStorage.setItem('demo_user', JSON.stringify(demoUser));
        
        console.log('Setting user in state');
        setUser(demoUser as User);
        
        console.log('Login successful, returning user:', demoUser);
        return demoUser;
      }
      
      // Server login flow (uncommented)
      // Uncomment for production use:
      /*
      const res = await apiRequest('POST', '/api/auth/login', { username, password });
      const userData = await res.json();
      setUser(userData);
      
      // Invalidate any cached queries that might contain user-specific data
      queryClient.invalidateQueries();
      return userData;
      */
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
