import axios from 'axios';
import { toast } from 'sonner';
import { supabase } from './supabase';

// Define the AuthAPI interface to include all methods
interface AuthAPI {
  register: (data: any) => Promise<any>;
  login: (data: any) => Promise<any>;
  verifyGoogleToken: (code: string, codeVerifier: string) => Promise<any>;
  updateSportPreference: (sport: string) => Promise<any>;
  forgotPassword: (data: { email: string }) => Promise<any>;
  verifyResetCode: (data: { email: string; code: string }) => Promise<any>;
  resetPassword: (data: { email: string; code: string; password: string }) => Promise<any>;
  logout: (data?: { csrfToken?: string }) => Promise<any>;
  validateToken: (data: { token: string }) => Promise<any>;
  refreshToken: (data: { token: string }) => Promise<any>;
}

// API Configuration - use production URL in production, localhost in development
const isProduction = import.meta.env.PROD;
const API_BASE_URL = isProduction 
  ? (import.meta.env.VITE_API_URL || 'https://api.statsor.com')
  : (import.meta.env.VITE_API_URL || 'http://localhost:3001');

export const api = {
  baseURL: API_BASE_URL,
  
  // Auth endpoints
  auth: {
    register: `${API_BASE_URL}/api/v1/auth/register`,
    login: `${API_BASE_URL}/api/v1/auth/login`,
    google: `${API_BASE_URL}/api/v1/auth/google`,
    logout: `${API_BASE_URL}/api/v1/auth/logout`,
    me: `${API_BASE_URL}/api/v1/auth/me`,
    forgotPassword: `${API_BASE_URL}/api/v1/auth/forgot-password`,
    verifyResetCode: `${API_BASE_URL}/api/v1/auth/verify-reset-code`,
    resetPassword: `${API_BASE_URL}/api/v1/auth/reset-password`,
  },

  // Teams endpoints
  teams: {
    list: `${API_BASE_URL}/api/v1/teams`,
    create: `${API_BASE_URL}/api/v1/teams`,
    get: (id: string) => `${API_BASE_URL}/api/v1/teams/${id}`,
    update: (id: string) => `${API_BASE_URL}/api/v1/teams/${id}`,
    delete: (id: string) => `${API_BASE_URL}/api/v1/teams/${id}`,
    players: (id: string) => `${API_BASE_URL}/api/v1/teams/${id}/players`,
  },

  // Players endpoints
  players: {
    list: `${API_BASE_URL}/api/v1/players`,
    create: `${API_BASE_URL}/api/v1/players`,
    get: (id: string) => `${API_BASE_URL}/api/v1/players/${id}`,
    update: (id: string) => `${API_BASE_URL}/api/v1/players/${id}`,
    delete: (id: string) => `${API_BASE_URL}/api/v1/players/${id}`,
    stats: (id: string) => `${API_BASE_URL}/api/v1/players/${id}/stats`,
  },

  // Matches endpoints
  matches: {
    list: `${API_BASE_URL}/api/v1/matches`,
    create: `${API_BASE_URL}/api/v1/matches`,
    get: (id: string) => `${API_BASE_URL}/api/v1/matches/${id}`,
    update: (id: string) => `${API_BASE_URL}/api/v1/matches/${id}`,
    delete: (id: string) => `${API_BASE_URL}/api/v1/matches/${id}`,
    stats: (id: string) => `${API_BASE_URL}/api/v1/matches/${id}/stats`,
    events: (id: string) => `${API_BASE_URL}/api/v1/matches/${id}/events`,
  },

  // Chatbot endpoints
  chatbot: {
    chat: `${API_BASE_URL}/api/v1/chatbot/chat`,
    history: `${API_BASE_URL}/api/v1/chatbot/history`,
    suggestions: `${API_BASE_URL}/api/v1/chatbot/suggestions`,
    clear: `${API_BASE_URL}/api/v1/chatbot/clear`,
  },

  // Analytics endpoints
  analytics: {
    dashboard: `${API_BASE_URL}/api/v1/analytics/dashboard`,
    team: (id: string) => `${API_BASE_URL}/api/v1/analytics/team/${id}`,
    player: (id: string) => `${API_BASE_URL}/api/v1/analytics/player/${id}`,
    matches: `${API_BASE_URL}/api/v1/analytics/matches`,
    export: `${API_BASE_URL}/api/v1/analytics/export`,
  },

  // Upload endpoints
  upload: {
    image: `${API_BASE_URL}/api/v1/upload/image`,
    document: `${API_BASE_URL}/api/v1/upload/document`,
    delete: (id: string) => `${API_BASE_URL}/api/v1/upload/${id}`,
  },

  // Subscription endpoints
  subscription: {
    plans: `${API_BASE_URL}/api/v1/subscriptions/plans`,
    create: `${API_BASE_URL}/api/v1/subscriptions/create`,
    current: `${API_BASE_URL}/api/v1/subscriptions/current`,
    cancel: `${API_BASE_URL}/api/v1/subscriptions/cancel`,
    upgrade: `${API_BASE_URL}/api/v1/subscriptions/upgrade`,
  },

  // Health check
  health: `${API_BASE_URL}/api/v1/health`,

  // AI Chat endpoints
  aiChat: {
    messages: `${API_BASE_URL}/api/v1/aichat/messages`,
    history: `${API_BASE_URL}/api/v1/aichat/history`,
  },
};

// Auth API functions
export const authAPI: AuthAPI = {
  register: async (data: any) => {
    // Check if mock auth is enabled
    const enableMockAuth = import.meta.env.VITE_ENABLE_MOCK_AUTH === 'true';
    
    if (!enableMockAuth) {
      // Use real registration
      try {
        const response = await fetch(`${API_BASE_URL}/api/v1/auth/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data)
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || 'Registration failed');
        }

        const result = await response.json();
        return {
          data: {
            success: true,
            data: result,
            message: 'Registration successful. Please check your email for verification.'
          }
        };
      } catch (error: any) {
        return {
          data: {
            success: false,
            error: error.message,
            message: 'Registration failed'
          }
        };
      }
    } else {
      // Use mock implementation for development
      try {
        const response = await fetch(`${API_BASE_URL}/api/v1/auth/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data)
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || 'Registration failed');
        }

        const result = await response.json();
        return {
          data: {
            success: true,
            data: result,
            message: 'Registration successful. Please check your email for verification.'
          }
        };
      } catch (error: any) {
        return {
          data: {
            success: false,
            error: error.message,
            message: 'Registration failed'
          }
        };
      }
    }
  },
  
  login: async (data: any) => {
    // Check if mock auth is enabled
    const enableMockAuth = import.meta.env.VITE_ENABLE_MOCK_AUTH === 'true';
    
    if (!enableMockAuth) {
      // Use real login
      try {
        const response = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data)
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || 'Login failed');
        }

        const result = await response.json();
        return {
          data: {
            success: true,
            data: result,
            message: 'Login successful'
          }
        };
      } catch (error: any) {
        return {
          data: {
            success: false,
            error: error.message,
            message: 'Login failed'
          }
        };
      }
    } else {
      // Use mock implementation for development
      try {
        const response = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data)
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || 'Login failed');
        }

        const result = await response.json();
        return {
          data: {
            success: true,
            data: result,
            message: 'Login successful'
          }
        };
      } catch (error: any) {
        return {
          data: {
            success: false,
            error: error.message,
            message: 'Login failed'
          }
        };
      }
    }
  },
  
  verifyGoogleToken: async (code: string, codeVerifier: string) => {
    // Check if mock auth is enabled
    const enableMockAuth = import.meta.env.VITE_ENABLE_MOCK_AUTH === 'true';
    
    if (!enableMockAuth) {
      // Use real Google OAuth verification
      try {
        const response = await fetch(`${API_BASE_URL}/api/v1/auth/google/callback`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ code, codeVerifier })
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || 'Google authentication failed');
        }

        const result = await response.json();
        return {
          data: {
            success: true,
            data: result
          }
        };
      } catch (error: any) {
        return {
          data: {
            success: false,
            message: error.message || 'Google authentication failed',
            error: error.message || 'Unknown error'
          }
        };
      }
    } else {
      // Use mock implementation for development
      try {
        // In production, this would call your backend
        // For now, we'll simulate a successful response
        console.log('Google OAuth verification would happen here');
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Return mock success response
        return {
          data: {
            success: true,
            data: {
              user: {
                id: 'mock_user_' + Date.now(),
                email: 'user@example.com',
                name: 'Test User',
                provider: 'google',
                sportSelected: false,
                created_at: new Date().toISOString()
              },
              token: 'mock_auth_token_' + Date.now()
            }
          }
        };
      } catch (error) {
        console.error('Google token verification error:', error);
        return {
          data: {
            success: false,
            message: error instanceof Error ? error.message : 'Google authentication failed',
            error: error instanceof Error ? error.message : 'Unknown error'
          }
        };
      }
    }
  },
  
  updateSportPreference: async (sport: string) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Update user in localStorage
    const savedUser = localStorage.getItem('statsor_user');
    if (savedUser) {
      const user = JSON.parse(savedUser);
      user.sport = sport;
      user.sportSelected = true;
      localStorage.setItem('statsor_user', JSON.stringify(user));
    }
    
    return {
      data: {
        success: true,
        data: { sport },
        message: 'Sport preference updated successfully'
      }
    };
  },

  forgotPassword: async (data: { email: string }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to send reset email');
      }

      const result = await response.json();
      return {
        data: {
          success: true,
          data: result,
          message: result.message || 'If the email exists, a reset link has been sent.'
        }
      };
    } catch (error: any) {
      return {
        data: {
          success: false,
          error: error.message,
          message: 'Failed to send reset email'
        }
      };
    }
  },

  verifyResetCode: async (data: { email: string; code: string }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/verify-reset-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Invalid reset code');
      }

      const result = await response.json();
      return {
        data: {
          success: true,
          data: result,
          message: result.message || 'Reset code verified successfully'
        }
      };
    } catch (error: any) {
      return {
        data: {
          success: false,
          error: error.message,
          message: 'Invalid or expired reset code'
        }
      };
    }
  },

  resetPassword: async (data: { email: string; code: string; password: string }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to reset password');
      }

      const result = await response.json();
      return {
        data: {
          success: true,
          data: result,
          message: result.message || 'Password reset successful'
        }
      };
    } catch (error: any) {
      return {
        data: {
          success: false,
          error: error.message,
          message: 'Failed to reset password. Please try again.'
        }
      };
    }
  },
  
  logout: async (data?: { csrfToken?: string }) => {
    try {
      const token = localStorage.getItem('auth_token');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      if (data?.csrfToken) {
        headers['X-CSRF-Token'] = data.csrfToken;
      }

      const response = await fetch(`${API_BASE_URL}/api/v1/auth/logout`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ refreshToken: localStorage.getItem('refresh_token') })
      });

      if (!response.ok) {
        console.warn('Logout API call failed, but proceeding with local logout');
      }

      return { success: true };
    } catch (error) {
      console.warn('Logout API error:', error);
      return { success: true }; // Always succeed locally
    }
  },
  
  // Token validation method
  validateToken: async (data: { token: string }) => {
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // In a real implementation, this would validate with your backend
      console.log('Token validation would happen here');
      
      return { data: { valid: true } };
    } catch (error) {
      console.error('Token validation error:', error);
      return { data: { valid: false } };
    }
  },
  
  // Token refresh method
  refreshToken: async (data: { token: string }) => {
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // In a real implementation, this would refresh with your backend
      console.log('Token refresh would happen here');
      
      return { data: { token: 'new_mock_token_' + Date.now() } };
    } catch (error) {
      console.error('Token refresh error:', error);
      return { data: { token: null } };
    }
  }
};

// Chatbot API
export const chatbotAPI = {
  sendMessage: async (message: string) => {
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // In a real implementation, this would call your chatbot backend
      console.log('Chat message would be sent:', message);
      
      // Return mock response
      return {
        data: {
          success: true,
          data: {
            response: "This is a mock response from the AI assistant. In a real deployment, this would connect to your AI service.",
            suggestions: ["Try asking about player statistics", "Ask about team performance", "Request match analysis"]
          }
        }
      };
    } catch (error) {
      console.error('Chat API error:', error);
      // Provide helpful fallback response
      return {
        data: {
          success: false,
          error: 'AI chat service is currently unavailable. Please try again later.',
          data: {
            response: 'I apologize, but the AI chat service is temporarily unavailable. Please try again in a few moments.',
            suggestions: ['Check your internet connection', 'Try refreshing the page', 'Contact support if the issue persists']
          }
        }
      };
    }
  }
};

export default api;