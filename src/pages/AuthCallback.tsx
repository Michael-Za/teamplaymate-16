import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';

const AuthCallback = () => {
  const navigate = useNavigate();
  const { setUser } = useAuth();

  useEffect(() => {
    // Set a timeout fallback in case something hangs
    const timeoutId = setTimeout(() => {
      console.error('[AuthCallback] Timeout - redirecting to signin');
      toast.error('Authentication is taking too long. Please try again.');
      navigate('/signin', { replace: true });
    }, 15000); // 15 second timeout

    const handleCallback = async () => {
      try {
        console.log('[AuthCallback] Starting OAuth callback handling...');
        console.log('[AuthCallback] Current URL:', window.location.href);
        
        // Parse URL parameters
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const searchParams = new URLSearchParams(window.location.search);
        
        console.log('[AuthCallback] Hash params:', Object.fromEntries(hashParams));
        console.log('[AuthCallback] Search params:', Object.fromEntries(searchParams));
        
        // Check for OAuth errors first
        const error_param = searchParams.get('error') || hashParams.get('error');
        const error_description = searchParams.get('error_description') || hashParams.get('error_description');
        
        if (error_param) {
          console.error('[AuthCallback] OAuth error:', error_param, error_description);
          toast.error(`Authentication failed: ${error_description || error_param}`);
          setTimeout(() => navigate('/signin', { replace: true }), 2000);
          return;
        }

        // Check if we have tokens directly in the hash (implicit flow)
        const access_token = hashParams.get('access_token');
        const refresh_token = hashParams.get('refresh_token');
        
        if (access_token) {
          console.log('[AuthCallback] Found access token in hash, setting session...');
          
          // Set the session using the tokens from the URL
          const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
            access_token,
            refresh_token: refresh_token || ''
          });
          
          if (sessionError) {
            console.error('[AuthCallback] Session setup error:', sessionError);
            toast.error(`Authentication failed: ${sessionError.message}`);
            setTimeout(() => navigate('/signin', { replace: true }), 2000);
            return;
          }
          
          if (!sessionData.session) {
            console.error('[AuthCallback] No session after setting tokens');
            toast.error('Authentication failed. No session created.');
            setTimeout(() => navigate('/signin', { replace: true }), 2000);
            return;
          }
          
          const session = sessionData.session;
          const user = session.user;
          console.log('[AuthCallback] Session established successfully');
          console.log('[AuthCallback] User:', user.email);

          // Check if user profile exists in our database
          let { data: profile } = await supabase
            .from('profiles')
            .select('*, user_number')
            .eq('auth_user_id', user.id)
            .single();

          if (!profile) {
            console.log('[AuthCallback] Creating new user profile...');
            // Create profile for new user
            const { error: profileError } = await supabase
              .from('profiles')
              .insert({
                auth_user_id: user.id,
                email: user.email,
                first_name: user.user_metadata?.given_name || user.user_metadata?.name?.split(' ')[0] || '',
                last_name: user.user_metadata?.family_name || user.user_metadata?.name?.split(' ').slice(1).join(' ') || '',
                avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture,
                sport_selected: false,
                status: 'active'
              });

            if (profileError) {
              console.error('[AuthCallback] Profile creation error:', profileError);
              toast.error(`Failed to create profile: ${profileError.message}`);
              setTimeout(() => navigate('/signin', { replace: true }), 2000);
              return;
            }
            
            console.log('[AuthCallback] Profile created successfully');

            // Verify profile was created
            console.log('[AuthCallback] Verifying profile creation...');
            const { data: newProfile, error: verifyError } = await supabase
              .from('profiles')
              .select('*')
              .eq('auth_user_id', user.id)
              .single();

            if (verifyError || !newProfile) {
              console.error('[AuthCallback] Profile verification failed:', verifyError);
              toast.error(`Profile creation failed: ${verifyError?.message || 'Unknown error'}`);
              setTimeout(() => navigate('/signin', { replace: true }), 2000);
              return;
            }

            console.log('[AuthCallback] Profile verified:', newProfile.id);
            profile = newProfile;

            // Create free subscription for new user
            console.log('[AuthCallback] Creating subscription...');
            const { error: subscriptionError } = await supabase
              .from('subscriptions')
              .insert({
                user_id: newProfile.id,
                plan_id: 'free',
                status: 'active',
                start_date: new Date().toISOString(),
                end_date: null,
                cancel_at_period_end: false
              });

            if (subscriptionError) {
              console.error('[AuthCallback] Subscription creation error:', subscriptionError);
              // Don't fail the signup, just log the error
            } else {
              console.log('[AuthCallback] Subscription created successfully');
            }
          }

          // Store user data in localStorage with extended expiry
          const userProfile = {
            id: user.id,
            email: user.email,
            name: user.user_metadata?.name || user.email?.split('@')[0],
            picture: user.user_metadata?.avatar_url || user.user_metadata?.picture,
            provider: 'google' as const,
            sportSelected: profile?.sport_selected || false,
            sport: profile?.sport as 'soccer' | 'futsal' | undefined,
            userNumber: profile?.user_number
          };

          // Store tokens with 30-day expiry
          localStorage.setItem('auth_token', session.access_token);
          localStorage.setItem('refresh_token', session.refresh_token || '');
          localStorage.setItem('token_expires_at', (Date.now() + 30 * 24 * 60 * 60 * 1000).toString());
          localStorage.setItem('statsor_user', JSON.stringify(userProfile));
          localStorage.setItem('user_type', 'real'); // Mark as real user, not demo

          // Update AuthContext state immediately
          setUser(userProfile);

          console.log('[AuthCallback] User profile stored, redirecting...');
          console.log('[AuthCallback] Sport selected:', profile?.sport_selected);
          toast.success('Welcome! Successfully signed in with Google.');

          // Small delay to ensure state is updated
          setTimeout(() => {
            // Redirect based on sport selection
            if (!profile?.sport_selected) {
              // New user - needs to select sport
              console.log('[AuthCallback] Redirecting to sport selection...');
              toast.info('Welcome! Please select your sport to continue.');
              navigate('/select-sport', { replace: true });
            } else {
              // Returning user - go to dashboard
              console.log('[AuthCallback] Redirecting to dashboard...');
              navigate('/dashboard', { replace: true });
            }
          }, 500);
          return;
        }
        
        // If no access token in hash, try to get code for PKCE flow
        const code = searchParams.get('code') || hashParams.get('code');
        
        if (code) {
          console.log('[AuthCallback] Found auth code, exchanging for session...');
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          
          if (error) {
            console.error('[AuthCallback] Code exchange error:', error);
            toast.error(`Authentication failed: ${error.message}`);
            setTimeout(() => navigate('/signin', { replace: true }), 2000);
            return;
          }
          
          if (!data.session) {
            console.error('[AuthCallback] No session after code exchange');
            toast.error('Authentication failed. No session created.');
            setTimeout(() => navigate('/signin', { replace: true }), 2000);
            return;
          }
          
          const session = data.session;
          console.log('[AuthCallback] Session obtained successfully');
          console.log('[AuthCallback] User:', session.user.email);

          // User is authenticated
          const user = session.user;
          
          // Check if user profile exists in our database
          let { data: profile } = await supabase
            .from('profiles')
            .select('*, user_number')
            .eq('auth_user_id', user.id)
            .single();

          if (!profile) {
            console.log('[AuthCallback] Creating new user profile...');
            // Create profile for new user
            const { error: profileError } = await supabase
              .from('profiles')
              .insert({
                auth_user_id: user.id,
                email: user.email,
                first_name: user.user_metadata?.given_name || user.user_metadata?.name?.split(' ')[0] || '',
                last_name: user.user_metadata?.family_name || user.user_metadata?.name?.split(' ').slice(1).join(' ') || '',
                avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture,
                sport_selected: false,
                status: 'active'
              });

            if (profileError) {
              console.error('[AuthCallback] Profile creation error:', profileError);
              toast.error(`Failed to create profile: ${profileError.message}`);
              setTimeout(() => navigate('/signin', { replace: true }), 2000);
              return;
            }
            
            console.log('[AuthCallback] Profile created successfully');

            // Verify profile was created
            console.log('[AuthCallback] Verifying profile creation...');
            const { data: newProfile, error: verifyError } = await supabase
              .from('profiles')
              .select('*')
              .eq('auth_user_id', user.id)
              .single();

            if (verifyError || !newProfile) {
              console.error('[AuthCallback] Profile verification failed:', verifyError);
              toast.error(`Profile creation failed: ${verifyError?.message || 'Unknown error'}`);
              setTimeout(() => navigate('/signin', { replace: true }), 2000);
              return;
            }

            console.log('[AuthCallback] Profile verified:', newProfile.id);
            profile = newProfile;

            // Create free subscription for new user
            console.log('[AuthCallback] Creating subscription...');
            const { error: subscriptionError } = await supabase
              .from('subscriptions')
              .insert({
                user_id: newProfile.id,
                plan_id: 'free',
                status: 'active',
                start_date: new Date().toISOString(),
                end_date: null,
                cancel_at_period_end: false
              });

            if (subscriptionError) {
              console.error('[AuthCallback] Subscription creation error:', subscriptionError);
              // Don't fail the signup, just log the error
            } else {
              console.log('[AuthCallback] Subscription created successfully');
            }
          }

          // Store user data in localStorage with extended expiry
          const userProfile = {
            id: user.id,
            email: user.email,
            name: user.user_metadata?.name || user.email?.split('@')[0],
            picture: user.user_metadata?.avatar_url || user.user_metadata?.picture,
            provider: 'google' as const,
            sportSelected: profile?.sport_selected || false,
            sport: profile?.sport as 'soccer' | 'futsal' | undefined,
            userNumber: profile?.user_number
          };

          // Store tokens with 30-day expiry
          localStorage.setItem('auth_token', session.access_token);
          localStorage.setItem('refresh_token', session.refresh_token || '');
          localStorage.setItem('token_expires_at', (Date.now() + 30 * 24 * 60 * 60 * 1000).toString());
          localStorage.setItem('statsor_user', JSON.stringify(userProfile));
          localStorage.setItem('user_type', 'real'); // Mark as real user, not demo

          // Update AuthContext state immediately
          setUser(userProfile);

          console.log('[AuthCallback] User profile stored, redirecting...');
          console.log('[AuthCallback] Sport selected:', profile?.sport_selected);
          toast.success('Welcome! Successfully signed in with Google.');

          // Small delay to ensure state is updated
          setTimeout(() => {
            // Redirect based on sport selection
            if (!profile?.sport_selected) {
              // New user - needs to select sport
              console.log('[AuthCallback] Redirecting to sport selection...');
              toast.info('Welcome! Please select your sport to continue.');
              navigate('/select-sport', { replace: true });
            } else {
              // Returning user - go to dashboard
              console.log('[AuthCallback] Redirecting to dashboard...');
              navigate('/dashboard', { replace: true });
            }
          }, 500);
        } else {
          // No code found, try to get existing session
          console.log('[AuthCallback] No code found, checking for existing session...');
          const { data: { session }, error } = await supabase.auth.getSession();
          
          if (error || !session) {
            console.error('[AuthCallback] No session available:', error);
            toast.error('Authentication failed. Please try signing in again.');
            setTimeout(() => navigate('/signin', { replace: true }), 2000);
            return;
          }
          
          // Process existing session (same logic as above)
          const user = session.user;
          let { data: profile } = await supabase
            .from('profiles')
            .select('*, user_number')
            .eq('auth_user_id', user.id)
            .single();

          if (!profile) {
            const { error: profileError } = await supabase
              .from('profiles')
              .insert({
                auth_user_id: user.id,
                email: user.email,
                first_name: user.user_metadata?.given_name || '',
                last_name: user.user_metadata?.family_name || '',
                avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture,
                sport_selected: false,
                status: 'active'
              });

            if (!profileError) {
              const { data: newProfile } = await supabase
                .from('profiles')
                .select('*')
                .eq('auth_user_id', user.id)
                .single();
              profile = newProfile;
            }
          }

          const userProfile = {
            id: user.id,
            email: user.email,
            name: user.user_metadata?.name || user.email?.split('@')[0],
            picture: user.user_metadata?.avatar_url || user.user_metadata?.picture,
            provider: 'google' as const,
            sportSelected: profile?.sport_selected || false,
            sport: profile?.sport as 'soccer' | 'futsal' | undefined,
            userNumber: profile?.user_number
          };

          localStorage.setItem('auth_token', session.access_token);
          localStorage.setItem('refresh_token', session.refresh_token || '');
          localStorage.setItem('token_expires_at', (Date.now() + 30 * 24 * 60 * 60 * 1000).toString());
          localStorage.setItem('statsor_user', JSON.stringify(userProfile));
          localStorage.setItem('user_type', 'real');

          setUser(userProfile);
          toast.success('Welcome back!');
          
          setTimeout(() => {
            navigate('/dashboard', { replace: true });
          }, 500);
        }
      } catch (error) {
        console.error('[AuthCallback] Unexpected error:', error);
        toast.error('An unexpected error occurred. Please try again.');
        setTimeout(() => navigate('/signin', { replace: true }), 2000);
      } finally {
        clearTimeout(timeoutId); // Always clear timeout
      }
    };

    handleCallback();

    return () => {
      clearTimeout(timeoutId); // Cleanup on unmount
    };
  }, [navigate, setUser]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-900">Completing sign in...</h2>
        <p className="text-gray-600 mt-2">Please wait while we set up your account</p>
      </div>
    </div>
  );
};

export default AuthCallback;
