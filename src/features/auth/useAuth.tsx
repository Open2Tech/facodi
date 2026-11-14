import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User, Session, AuthResponse } from '@supabase/supabase-js';
import { supabase } from '@/shared/api/supabase/supabaseClient';
import { signInWithEmail, signOutUser, signUpWithEmail } from './auth.api';
import { facodiRole, type FacodiRole } from '@/entities/facodi/access';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  role: FacodiRole;
  signUp: (email: string, password: string, username?: string) => Promise<{ data: AuthResponse['data'] | null; error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ data: AuthResponse['data'] | null; error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, nextSession) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      // INITIAL_SESSION is the SDK's hydration signal. Earlier auth events
      // must not briefly render the signed-out UI while storage is loading.
      if (event === 'INITIAL_SESSION') setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, username?: string) => {
    return signUpWithEmail(email, password, username);
  };

  const signIn = async (email: string, password: string) => {
    return signInWithEmail(email, password);
  };

  const signOut = async () => {
    await signOutUser();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, role: facodiRole(user?.app_metadata), signUp, signIn, signOut }}>
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
