import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      else setLoading(false);
    });

    // Listen for auth changes
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
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();  // maybeSingle returns null (not error) when 0 rows found

      if (error) {
        console.error('[AuthContext] fetchProfile error:', error.message, '| code:', error.code);
        // Fall back to cached profile if available
        const cached = sessionStorage.getItem('admin_profile');
        if (cached) {
          const cachedProfile = JSON.parse(cached);
          // Only use cache if the userId matches (prevent stale session reuse)
          if (cachedProfile.id === userId) {
            console.warn('[AuthContext] Using cached profile due to fetch error');
            setProfile(cachedProfile);
            return;
          }
        }
      } else if (data) {
        setProfile(data);
        // Cache profile so page refresh doesn't lose admin state
        sessionStorage.setItem('admin_profile', JSON.stringify(data));
      } else {
        // data is null — user row doesn't exist (stale/orphaned session)
        console.warn('[AuthContext] No profile row found for user:', userId, '— signing out stale session');
        sessionStorage.removeItem('admin_profile');
        await supabase.auth.signOut();
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
    await supabase.auth.signOut();
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
