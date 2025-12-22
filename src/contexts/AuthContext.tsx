import React, { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';
import { rateLimiter, secureStorage } from '../utils/security';
import { userInitializationService } from '../services/userInitializationService';
import { sessionManager } from '../utils/sessionManager';

const passwordResetLimiter = rateLimiter.create(3, 300000); // 3 attempts per 5 minutes

interface UserProfile {
  id: string;
  email: string;
  name: string;
  picture?: string | undefined;
  avatar?: string | undefined;
  given_name?: string | undefined;
  family_name?: string | undefined;
  locale?: string | undefined;
  verified_email?: boolean | undefined;
  created_at?: string | undefined;
  location?: string | undefined;
  provider: 'google' | 'email';
  sport?: 'soccer' | 'futsal' | undefined;
  sportSelected?: boolean | undefined;
  display_name?: string | undefined;
  phone?: string | undefined;
  bio?: string | undefined;
  userNumber?: number | undefined;
}

interface AuthResponse<T = unknown> {
  data: T;
  error: string | null;
}

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  isNewUser: boolean;
  hasCompletedOnboarding: boolean;
  isInitialized: boolean;
  setUser: (user: UserProfile | null) => void;
  signUp: (
    email: string,
    password: string,
    additionalData?: Record<string, unknown>
  ) => Promise<AuthResponse<any>>;
  signIn: (email: string, password: string) => Promise<AuthResponse<any>>;
  signInWithGoogle: () => Promise<{ data: unknown; error: string | null }>;
  handleGoogleCallback: (code: string, state?: string) => Promise<AuthResponse<any>>;
  signOut: () => Promise<{ error: string | null }>;
  logout: () => Promise<void>;
  updateSportPreference: (sport: 'soccer' | 'futsal') => Promise<AuthResponse<any>>;
  completeOnboarding: () => void;
  skipOnboarding: () => void;
  login: (email: string, password: string) => Promise<AuthResponse<any>>;
  register: (
    email: string,
    password: string,
    additionalData?: Record<string, unknown>
  ) => Promise<AuthResponse<any>>;
  resetPassword: (email: string) => Promise<AuthResponse<any>>;
  verifyResetCode: (email: string, code: string) => Promise<{ data: { valid: boolean; message?: string }; error: string | null }>;
  resetPasswordWithCode: (
    email: string,
    code: string,
    newPassword: string
  ) => Promise<AuthResponse<any>>;
  updateProfile: (data: Partial<UserProfile>) => Promise<{ data: UserProfile | null; error: string | null }>;
  updateUser: (data: Partial<UserProfile>) => Promise<{ data: UserProfile | null; error: string | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export { useAuth };

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isNewUser, setIsNewUser] = useState(false);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      setLoading(true);
      if (event === 'SIGNED_IN' && session) {
        const { user: supabaseUser } = session;

        let { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('auth_user_id', supabaseUser.id)
          .single();

        let createdNewProfile = false;
        if (!profile) {
          createdNewProfile = true;
          const newUserPayload = {
            auth_user_id: supabaseUser.id,
            email: supabaseUser.email,
            first_name: supabaseUser.user_metadata.full_name || supabaseUser.email?.split('@')[0],
            last_name: '',
            sport_selected: false,
            status: 'active'
          };
          const { data: newProfile } = await supabase.from('profiles').insert(newUserPayload).select().single();
          profile = newProfile;
        }

        if (profile) {
          await userInitializationService.ensureDataSpace(supabaseUser.id);

          const userProfile: UserProfile = {
            id: supabaseUser.id,
            email: supabaseUser.email!,
            name: profile.first_name || supabaseUser.email!.split('@')[0],
            provider: (supabaseUser.app_metadata.provider === 'google' ? 'google' : 'email'),
            sportSelected: profile.sport_selected || false,
            avatar: supabaseUser.user_metadata.avatar_url,
            picture: supabaseUser.user_metadata.picture,
          };
          setUser(userProfile);
          setHasCompletedOnboarding(profile.sport_selected || false);

          const sessionData = {
            token: session.access_token,
            refreshToken: session.refresh_token,
            expiresAt: session.expires_at ? new Date(session.expires_at * 1000).getTime() : 0,
            userId: supabaseUser.id,
            profileId: profile.id
          };
          sessionManager.saveSession(sessionData);
          secureStorage.setItem('statsor_user', JSON.stringify(userProfile));
          
          if (createdNewProfile) {
            setIsNewUser(true);
            navigate('/select-sport');
          } else if (!profile.sport_selected) {
            navigate('/select-sport');
          } else {
            setIsNewUser(false);
            navigate('/dashboard');
          }
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        sessionManager.clearSession();
        secureStorage.removeItem('statsor_user');
        navigate('/signin');
      }
      setLoading(false);
    });

    // Initialize session from storage
    const storedUser = secureStorage.getItem('statsor_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Failed to parse stored user", e)
      }
    }
    setIsInitialized(true);
    setLoading(false);

    return () => {
      authListener?.unsubscribe();
    };
  }, [navigate]);


  const signUp = async (
    email: string,
    password: string,
    additionalData?: Record<string, unknown>
  ) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: additionalData?.name,
            location: additionalData?.location,
          },
        },
      });

      if (error) {
        toast.error(error.message);
        return { data: null, error: error.message };
      }

      if (data.user) {
        toast.success('Account created! Please check your email for verification.');
        return { data: { user: data.user }, error: null };
      }
      return { data: null, error: 'Signup failed' };

    } catch (error: any) {
      const errorMessage = error.message || 'An unexpected error occurred.';
      toast.error(errorMessage);
      return { data: null, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast.error(error.message);
        return { data: null, error: error.message };
      }

      if (data.user) {
        toast.success('Welcome back!');
        return { data: { user: data.user }, error: null };
      }
      return { data: null, error: 'Signin failed' };

    } catch (error: any) {
      const errorMessage = error.message || 'An unexpected error occurred.';
      toast.error(errorMessage);
      return { data: null, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
      });

      if (error) {
        toast.error(error.message);
        return { data: null, error: error.message };
      }
      return { data: {}, error: null };

    } catch (error: any) {
      const errorMessage = error.message || 'An unexpected error occurred.';
      toast.error(errorMessage);
      return { data: null, error: errorMessage };
    } finally {
      // Don't set loading to false here, as the page will redirect
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        toast.error(error.message);
        return { error: error.message };
      }
      toast.success('Logged out successfully');
      return { error: null };
    } catch (error: any) {
      const errorMessage = error.message || 'An unexpected error occurred.';
      toast.error(errorMessage);
      return { error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await signOut();
  };
  
  // --- Restored Placeholder Functions ---
  const handleGoogleCallback = async (code: string, state?: string): Promise<AuthResponse<any>> => {
    console.warn("handleGoogleCallback is not implemented with Supabase client-side auth.");
    return { data: null, error: "Not implemented" };
  };

  const verifyResetCode = async (email: string, code: string): Promise<{ data: { valid: boolean; message?: string; }; error: string | null; }> => {
    console.warn("verifyResetCode is not implemented.");
    return { data: { valid: false, message: "Not Implemented" }, error: "Not implemented" };
  };
  
  const resetPasswordWithCode = async (email: string, code: string, newPassword: string): Promise<AuthResponse<any>> => {
    console.warn("resetPasswordWithCode is not implemented.");
    return { data: null, error: "Not implemented" };
  };
  // ------------------------------------

  const updateSportPreference = async (sport: 'soccer' | 'futsal') => {
    if (!user) return { data: null, error: 'No user logged in' };
    
    const { error } = await supabase
      .from('profiles')
      .update({ sport, sport_selected: true })
      .eq('auth_user_id', user.id);
      
    if (error) {
      toast.error('Failed to save sport preference.');
      return { data: null, error: error.message };
    }

    const updatedUser = { ...user, sport, sportSelected: true };
    setUser(updatedUser);
    secureStorage.setItem('statsor_user', JSON.stringify(updatedUser));
    
    toast.success('Sport preference updated!');
    return { data: { user: updatedUser }, error: null };
  };

  const completeOnboarding = () => {
    setHasCompletedOnboarding(true);
    if(user) {
      const updatedUser = { ...user, sportSelected: true };
      setUser(updatedUser)
      secureStorage.setItem('statsor_user', JSON.stringify(updatedUser));
    }
  };

  const skipOnboarding = () => {
    setHasCompletedOnboarding(true);
    if(user) {
      const updatedUser = { ...user, sportSelected: true };
      setUser(updatedUser)
      secureStorage.setItem('statsor_user', JSON.stringify(updatedUser));
    }
  };

  const login = signIn;
  const register = signUp;

  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!user) return { data: null, error: 'No user logged in' };
    
    // Create a payload with only the fields that need updating
    const updatePayload: { first_name?: string; [key: string]: any } = {};
    if (data.name) {
      updatePayload.first_name = data.name;
    }
    // Add other updatable fields from 'data' here
    
    const { error } = await supabase
      .from('profiles')
      .update(updatePayload)
      .eq('auth_user_id', user.id);

    if (error) {
      toast.error('Failed to update profile.');
      return { data: null, error: error.message };
    }

    const updatedUser = { ...user, ...data };
    setUser(updatedUser);
    secureStorage.setItem('statsor_user', JSON.stringify(updatedUser));
    toast.success('Profile updated!');
    return { data: updatedUser, error: null };
  };

  const updateUser = updateProfile;

  const resetPassword = async (email: string) => {
    if (!passwordResetLimiter.isAllowed('reset')) {
      toast.error('Too many password reset attempts. Please wait before trying again.');
      return { data: null, error: 'Rate limit exceeded' };
    }
    
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/reset-password',
      });
      if (error) {
        toast.error(error.message);
        return { data: null, error: error.message };
      }
      toast.success('Password reset link sent! Check your email.');
      return { data: { message: 'Password reset link sent!' }, error: null };
    } catch (error: any) {
      const errorMessage = error.message || 'An unexpected error occurred.';
      toast.error(errorMessage);
      return { data: null, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    isNewUser,
    hasCompletedOnboarding,
    isInitialized,
    setUser,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    logout,
    updateSportPreference,
    completeOnboarding,
    skipOnboarding,
    login,
    register,
    resetPassword,
    updateProfile,
    updateUser,
    handleGoogleCallback,
    verifyResetCode,
    resetPasswordWithCode,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
