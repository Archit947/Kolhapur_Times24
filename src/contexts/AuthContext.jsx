import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      else {
        setProfile(null);
        sessionStorage.removeItem('admin_profile');
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchProfile(userId) {
    if (signingOut) return;
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('[AuthContext] fetchProfile error:', error.message, '| code:', error.code);
        const cached = sessionStorage.getItem('admin_profile');
        if (cached) {
          const cachedProfile = JSON.parse(cached);
          if (cachedProfile.id === userId) {
            setProfile(cachedProfile);
            return;
          }
        }
      } else if (data) {
        setProfile(data);
        sessionStorage.setItem('admin_profile', JSON.stringify(data));
      } else {
        console.warn('[AuthContext] No profile row for user:', userId);
        setSigningOut(true);
        sessionStorage.removeItem('admin_profile');
        setProfile(null);
        setUser(null);
        await supabase.auth.signOut({ scope: 'local' });
      }
    } catch (err) {
      console.error('[AuthContext] fetchProfile exception:', err);
    } finally {
      setLoading(false);
    }
  }

  async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  }

  async function signOut() {
    sessionStorage.removeItem('admin_profile');
    await supabase.auth.signOut({ scope: 'local' });
  }

  const isAdmin = profile?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, profile, loading, isAdmin, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
