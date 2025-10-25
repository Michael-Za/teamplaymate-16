import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { Loader2, CheckCircle, XCircle, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/button';

const GoogleCallback: React.FC = () => {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const { handleGoogleCallback } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const processCallback = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Handle URL fragment parameters for implicit flow
        const hash = window.location.hash.substring(1);
        const params = new URLSearchParams(hash);
        
        const accessToken = params.get('access_token');
        const tokenType = params.get('token_type');
        
        // If we have an access token in the fragment, set the session
        if (accessToken && tokenType) {
          // For implicit flow, we only get an access token (no refresh token)
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: '' // Empty for implicit flow
          });
          
          if (error) {
            throw new Error(`Session setup error: ${error.message}`);
          }
          
          if (data?.session) {
            // Use the handleGoogleCallback function from AuthContext
            const result = await handleGoogleCallback();
            
            if (result.error) {
              throw new Error(result.error);
            }
            
            setSuccess(true);
            toast.success('Authentication successful! Redirecting...');
            
            // Small delay before redirect to show success state
            setTimeout(() => {
              navigate('/dashboard');
            }, 1500);
            return;
          }
        }
        
        // Fallback: try to get existing session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          throw new Error(`Google OAuth error: ${error.message}`);
        }

        if (session) {
          // Use the handleGoogleCallback function from AuthContext
          const result = await handleGoogleCallback();
          
          if (result.error) {
            throw new Error(result.error);
          }
          
          setSuccess(true);
          toast.success('Authentication successful! Redirecting...');
          
          // Small delay before redirect to show success state
          setTimeout(() => {
            navigate('/dashboard');
          }, 1500);
          return;
        }

        // Check if there's an error in the URL
        const urlParams = new URLSearchParams(window.location.search);
        const errorParam = urlParams.get('error');
        if (errorParam) {
          throw new Error(`Google OAuth error: ${errorParam}`);
        }

        throw new Error('No authentication data found. Please try signing in again.');
        
      } catch (err: any) {
        console.error('Google callback error:', err);
        const errorMessage = err.message || 'Authentication failed';
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    processCallback();
  }, [handleGoogleCallback, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 via-blue-900 to-black">
        <div className="text-center space-y-6">
          <div className="relative">
            <Loader2 className="h-16 w-16 text-blue-500 animate-spin mx-auto" />
            <div className="absolute inset-0 h-16 w-16 border-4 border-blue-200 rounded-full animate-pulse"></div>
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-white">Authenticating with Google</h2>
            <p className="text-gray-300">Please wait while we process your authentication...</p>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 via-green-900 to-black">
        <div className="text-center space-y-6">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-white">Authentication Successful!</h2>
            <p className="text-gray-300">Welcome to Statsor. Redirecting to your dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 via-red-900 to-black p-4">
        <div className="max-w-md w-full text-center space-y-6">
          <XCircle className="h-16 w-16 text-red-500 mx-auto" />
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-white">Authentication Error</h2>
            <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-4">
              <p className="text-red-200 text-sm">{error}</p>
            </div>
            <p className="text-gray-300 text-sm">
              Don't worry! You can try signing in again or use email authentication.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <Button 
              onClick={() => navigate('/signin')} 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Return to Sign In
            </Button>
            <Button 
              onClick={() => navigate('/signup')} 
              variant="outline"
              className="w-full border-gray-600 text-gray-300 hover:bg-gray-800"
            >
              Create New Account
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default GoogleCallback;