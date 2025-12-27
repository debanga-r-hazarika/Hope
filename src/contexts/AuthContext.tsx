import { createContext, useContext, useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  requiresPasswordChange: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [requiresPasswordChange, setRequiresPasswordChange] = useState(false);

  const checkPasswordChangeRequired = async (authUserId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('requires_password_change')
        .eq('auth_user_id', authUserId)
        .maybeSingle();

      if (error) {
        console.error('Error checking password change requirement:', error);
        return false;
      }

      return data?.requires_password_change ?? false;
    } catch (err) {
      console.error('Error checking password change requirement:', err);
      return false;
    }
  };

  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (!isMounted) return;

      if (error) {
        console.error('Auth session error:', error.message);
        setUser(null);
        setRequiresPasswordChange(false);
      } else {
        const currentUser = data.session?.user ?? null;
        setUser(currentUser);
        if (currentUser) {
          const needsChange = await checkPasswordChangeRequired(currentUser.id);
          setRequiresPasswordChange(needsChange);
        } else {
          setRequiresPasswordChange(false);
        }
      }
      setLoading(false);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      (async () => {
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        if (currentUser) {
          const needsChange = await checkPasswordChangeRequired(currentUser.id);
          setRequiresPasswordChange(needsChange);
        } else {
          setRequiresPasswordChange(false);
        }
        setLoading(false);
      })();
    });

    void init();

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      return { error: error.message };
    }
    const currentUser = data.user ?? null;
    setUser(currentUser);
    if (currentUser) {
      const needsChange = await checkPasswordChangeRequired(currentUser.id);
      setRequiresPasswordChange(needsChange);
    }
    return {};
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Sign out error:', error.message);
    }
    setUser(null);
    setRequiresPasswordChange(false);
  };

  return (
    <AuthContext.Provider value={{ user, loading, requiresPasswordChange, signIn, signOut }}>
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
