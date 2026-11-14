import { useState, useEffect, useRef, createContext, useContext, ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { User, Session, AuthResponse } from '@supabase/supabase-js';
import { supabase } from '@/shared/api/supabase/supabaseClient';
import { signInWithEmail, signOutUser, signUpWithEmail } from '@/entities/auth/auth.api';
import { facodiRole, type FacodiRole } from '@/entities/facodi/access';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  role: FacodiRole;
  signUp: (email: string, password: string, name?: string, next?: string) => Promise<{ data: AuthResponse['data'] | null; error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ data: AuthResponse['data'] | null; error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const identity = useRef<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, nextSession) => {
      const nextIdentity = nextSession ? `${nextSession.user.id}:${facodiRole(nextSession.user.app_metadata)}` : null;
      if (identity.current !== nextIdentity || event === 'SIGNED_OUT') {
        // Clear before rendering a different identity, including role downgrades.
        void queryClient.cancelQueries();
        queryClient.clear();
        identity.current = nextIdentity;
      }
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      // INITIAL_SESSION is the SDK's hydration signal. Earlier auth events
      // must not briefly render the signed-out UI while storage is loading.
      if (event === 'INITIAL_SESSION') setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [queryClient]);

  const signUp = async (email: string, password: string, name?: string, next?: string) => {
    return signUpWithEmail(email, password, name, next);
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
