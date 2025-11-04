import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User } from '../types/database.types';
import { mockAuthService } from '../mock/services';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string) => Promise<{ success: boolean; message: string }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session on mount
    checkUser();
  }, []);

  async function checkUser() {
    try {
      const currentUser = await mockAuthService.getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.error('Error checking user:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  async function signIn(email: string) {
    try {
      const result = await mockAuthService.sendMagicLink(email);

      // In a real app, the user would click the magic link in their email
      // For demo purposes, we'll automatically sign them in after a delay
      if (result.success) {
        setTimeout(async () => {
          const user = await mockAuthService.getCurrentUser();
          setUser(user);
        }, 2000);
      }

      return result;
    } catch (error) {
      console.error('Error signing in:', error);
      return {
        success: false,
        message: 'Failed to send magic link. Please try again.',
      };
    }
  }

  async function signOut() {
    try {
      await mockAuthService.signOut();
      setUser(null);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
