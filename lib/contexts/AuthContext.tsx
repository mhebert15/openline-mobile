import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import type { User } from '../types/database.types';
import { supabase } from '../supabase/client';

interface AuthContextType {
  user: User | null;
  supabaseUser: SupabaseUser | null;
  loading: boolean;
  signIn: (email: string) => Promise<{ success: boolean; message: string }>;
  verifyOtp: (email: string, token: string) => Promise<{ success: boolean; message: string }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const initializingRef = useRef(true);

  useEffect(() => {
    // Check for existing session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSupabaseUser(session?.user ?? null);
      if (session?.user) {
        loadUserProfile(session.user);
      } else {
        setLoading(false);
      }
      initializingRef.current = false;
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      console.log('Auth state change event:', _event);

      // Skip INITIAL_SESSION event as we handle it with getSession()
      if (_event === 'INITIAL_SESSION') {
        return;
      }

      setSupabaseUser(session?.user ?? null);
      if (session?.user) {
        // Don't set loading to true for profile updates - only show loading on initial load
        // This prevents flickering when the profile is reloaded
        loadUserProfileSilently(session.user);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function loadUserProfile(authUser: SupabaseUser) {
    try {
      console.log('Loading profile for user:', authUser.id, authUser.email);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (error) {
        console.error('Error loading user profile:', error);
        // Profile should be auto-created by trigger, but handle edge case
        // Create a basic user from auth data even if profile fetch fails
        console.log('Creating fallback user from auth data');
        setUser({
          id: authUser.id,
          email: authUser.email || '',
          full_name: authUser.email?.split('@')[0] || 'User',
          role: 'medical_rep',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as User);
      } else {
        console.log('Profile loaded successfully:', data);
        // Map profile data to User type
        setUser({
          id: data.id,
          email: data.email,
          full_name: data.full_name,
          role: data.user_type === 'medical_rep' ? 'medical_rep' : 'admin',
          created_at: data.created_at,
          updated_at: data.updated_at,
        });
      }
    } catch (error) {
      console.error('Unexpected error loading user profile:', error);
      // Don't set user to null on error - keep the basic auth user data
      setUser({
        id: authUser.id,
        email: authUser.email || '',
        full_name: authUser.email?.split('@')[0] || 'User',
        role: 'medical_rep',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as User);
    } finally {
      console.log('Profile load complete, setting loading to false');
      setLoading(false);
    }
  }

  // Silent version that doesn't trigger loading state
  async function loadUserProfileSilently(authUser: SupabaseUser) {
    try {
      console.log('Silently loading profile for user:', authUser.id);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (error) {
        console.error('Error loading user profile:', error);
        setUser({
          id: authUser.id,
          email: authUser.email || '',
          full_name: authUser.email?.split('@')[0] || 'User',
          role: 'medical_rep',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as User);
      } else {
        setUser({
          id: data.id,
          email: data.email,
          full_name: data.full_name,
          role: data.user_type === 'medical_rep' ? 'medical_rep' : 'admin',
          created_at: data.created_at,
          updated_at: data.updated_at,
        });
      }
    } catch (error) {
      console.error('Unexpected error loading user profile:', error);
      setUser({
        id: authUser.id,
        email: authUser.email || '',
        full_name: authUser.email?.split('@')[0] || 'User',
        role: 'medical_rep',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as User);
    }
    // Don't set loading to false - we're not showing a loading screen for this
  }

  async function signIn(email: string) {
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
        },
      });

      if (error) {
        return {
          success: false,
          message: error.message,
        };
      }

      return {
        success: true,
        message: 'Check your email for the OTP code',
      };
    } catch (error) {
      console.error('Error signing in:', error);
      return {
        success: false,
        message: 'Failed to send OTP. Please try again.',
      };
    }
  }

  async function verifyOtp(email: string, token: string) {
    try {
      console.log('Verifying OTP for:', email, 'token:', token);
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'email',
      });

      console.log('OTP verification result:', { data, error });

      if (error) {
        console.error('OTP verification error:', error);
        return {
          success: false,
          message: error.message,
        };
      }

      console.log('OTP verified successfully, session:', data.session?.user?.email);
      return {
        success: true,
        message: 'Successfully signed in',
      };
    } catch (error) {
      console.error('Unexpected error verifying OTP:', error);
      return {
        success: false,
        message: 'Failed to verify OTP. Please try again.',
      };
    }
  }

  async function signOut() {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSupabaseUser(null);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  }

  return (
    <AuthContext.Provider value={{ user, supabaseUser, loading, signIn, verifyOtp, signOut }}>
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
