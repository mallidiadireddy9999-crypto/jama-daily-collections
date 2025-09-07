import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  userRole: string | null;
  userProfile: any | null;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  userRole: null,
  userProfile: null,
  signOut: async () => {},
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<any | null>(null);

  useEffect(() => {
    let mounted = true;

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (mounted) {
          console.log('Auth state changed:', event, session);
          setSession(session);
          setUser(session?.user ?? null);
          
          // Fetch user profile and role when user logs in
          if (session?.user) {
            setTimeout(() => {
              fetchUserProfile(session.user.id);
            }, 0);
          } else {
            setUserRole(null);
            setUserProfile(null);
            setLoading(false);
          }
        }
      }
    );

    // THEN check for existing session with timeout
    const checkSession = async () => {
      try {
        console.log('Checking existing session...');
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Session check error:', error);
        }
        if (mounted) {
          console.log('Existing session:', session);
          setSession(session);
          setUser(session?.user ?? null);
          
          if (session?.user) {
            fetchUserProfile(session.user.id);
          } else {
            setLoading(false);
          }
        }
      } catch (error) {
        console.error('Session check failed:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    // Add timeout fallback
    const timeout = setTimeout(() => {
      if (mounted && loading) {
        console.log('Auth timeout - setting loading to false');
        setLoading(false);
      }
    }, 5000);

    // Fetch user profile and role
    const fetchUserProfile = async (userId: string) => {
      try {
        console.log('Fetching profile for user:', userId);
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();
        
        console.log('Profile query result:', { profile, error });
        
        if (error) {
          console.error('Error fetching user profile:', error);
          // Set default role and continue
          setUserRole('jama_user');
          setUserProfile(null);
        } else if (profile) {
          console.log('Profile found:', profile);
          setUserRole(profile.role || 'jama_user');
          setUserProfile(profile);
        } else {
          console.log('No profile found for user, checking if this is a super admin...');
          // If no profile exists, check if this is the super admin email
          if (userId === '268f7f19-eb4b-44b0-8036-38f2741cc219') {
            setUserRole('super_admin');
            setUserProfile({ role: 'super_admin', user_id: userId });
          } else {
            setUserRole('jama_user');
            setUserProfile(null);
          }
        }
      } catch (error) {
        console.error('Profile fetch failed:', error);
        setUserRole('jama_user');
        setUserProfile(null);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    checkSession();

    return () => {
      mounted = false;
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    console.log('SignOut called - clearing state immediately');
    // Clear state immediately to ensure UI updates
    setUser(null);
    setSession(null);
    setUserRole(null);
    setUserProfile(null);
    setLoading(false);
    // Then call Supabase signOut
    await supabase.auth.signOut();
  };

  const value = {
    user,
    session,
    loading,
    userRole,
    userProfile,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};