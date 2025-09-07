import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'sonner';

export interface Plan {
  id: string;
  name: string;
  price: number;
  currency: string;
  interval: 'monthly' | 'yearly';
  features: string[];
  maxTeams: number;
  maxPlayers: number;
  aiAccess: boolean;
  priority: boolean;
  popular?: boolean;
}

export interface Subscription {
  id: string;
  planId: string;
  status: 'active' | 'canceled' | 'past_due' | 'trialing';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  trialEnd?: string;
}

export interface PaymentMethod {
  id: string;
  type: 'card' | 'paypal';
  last4?: string;
  brand?: string;
  expMonth?: number;
  expYear?: number;
}

interface SubscriptionContextType {
  plans: Plan[];
  currentPlan: Plan | null;
  subscription: Subscription | null;
  paymentMethods: PaymentMethod[];
  loading: boolean;
  subscribe: (planId: string, paymentMethodId?: string) => Promise<boolean>;
  cancelSubscription: () => Promise<boolean>;
  updatePaymentMethod: (paymentMethodId: string) => Promise<boolean>;
  addPaymentMethod: (paymentData: any) => Promise<boolean>;
  removePaymentMethod: (paymentMethodId: string) => Promise<boolean>;
  getPlanFeatures: (planId: string) => Plan | null;
  hasFeature: (feature: string) => boolean;
  canCreateTeam: () => boolean;
  canAddPlayer: (currentCount: number) => boolean;
  canUseAI: () => boolean;
  getUsageStats: () => { teams: number; players: number; aiUsage: number };
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};

const defaultPlans: Plan[] = [
  {
    id: 'starter',
    name: 'STARTER',
    price: 0,
    currency: 'EUR',
    interval: 'monthly',
    features: [
      '7-day free trial',
      '1 team',
      'Max. 20 actions per match',
      'Basic email support'
    ],
    maxTeams: 1,
    maxPlayers: 20,
    aiAccess: false,
    priority: false
  },
  {
    id: 'pro',
    name: 'PRO',
    price: 299,
    currency: 'EUR',
    interval: 'yearly',
    features: [
      '1 team included',
      'Additional teams: +150€/year',
      'Up to 2 users per team',
      'Offline registration',
      'Real-time statistics',
      'Access to tactical AI assistant',
      'Standard support'
    ],
    maxTeams: 1,
    maxPlayers: 50,
    aiAccess: true,
    priority: false,
    popular: true
  },
  {
    id: 'club',
    name: 'CLUB',
    price: 250,
    currency: 'EUR',
    interval: 'monthly',
    features: [
      'From 6 teams',
      'Multi-user and role control',
      'Comparative reports and global dashboard',
      'Personalized onboarding',
      'Priority support'
    ],
    maxTeams: 6,
    maxPlayers: 200,
    aiAccess: true,
    priority: true
  }
];

export const SubscriptionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [plans] = useState<Plan[]>(defaultPlans);
  const [currentPlan, setCurrentPlan] = useState<Plan | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(false);

  // Load subscription data on mount
  useEffect(() => {
    loadSubscriptionData();
  }, []);

  const loadSubscriptionData = async () => {
    setLoading(true);
    try {
      // Load from localStorage for demo
      const savedSubscription = localStorage.getItem('statsor_subscription');
      const savedPaymentMethods = localStorage.getItem('statsor_payment_methods');
      
      if (savedSubscription) {
        const sub = JSON.parse(savedSubscription);
        setSubscription(sub);
        const plan = plans.find(p => p.id === sub.planId);
        setCurrentPlan(plan || null);
      } else {
        // Default to starter plan
        setCurrentPlan(plans[0]);
      }

      if (savedPaymentMethods) {
        setPaymentMethods(JSON.parse(savedPaymentMethods));
      }
    } catch (error) {
      console.error('Error loading subscription data:', error);
    } finally {
      setLoading(false);
    }
  };

  const subscribe = async (planId: string, paymentMethodId?: string): Promise<boolean> => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const plan = plans.find(p => p.id === planId);
      if (!plan) {
        toast.error('Plan not found');
        return false;
      }

      const newSubscription: Subscription = {
        id: `sub_${Date.now()}`,
        planId,
        status: 'active',
        currentPeriodStart: new Date().toISOString(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
        cancelAtPeriodEnd: false,
        trialEnd: plan.price === 0 ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() : undefined
      };

      setSubscription(newSubscription);
      setCurrentPlan(plan);
      
      // Save to localStorage
      localStorage.setItem('statsor_subscription', JSON.stringify(newSubscription));
      
      toast.success(`Successfully subscribed to ${plan.name} plan!`);
      return true;
    } catch (error) {
      console.error('Subscription error:', error);
      toast.error('Failed to subscribe. Please try again.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const cancelSubscription = async (): Promise<boolean> => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (subscription) {
        const updatedSubscription = {
          ...subscription,
          status: 'canceled' as const,
          cancelAtPeriodEnd: true
        };
        
        setSubscription(updatedSubscription);
        localStorage.setItem('statsor_subscription', JSON.stringify(updatedSubscription));
        
        toast.success('Subscription canceled successfully');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Cancel subscription error:', error);
      toast.error('Failed to cancel subscription');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const updatePaymentMethod = async (paymentMethodId: string): Promise<boolean> => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('Payment method updated successfully');
      return true;
    } catch (error) {
      console.error('Update payment method error:', error);
      toast.error('Failed to update payment method');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const addPaymentMethod = async (paymentData: any): Promise<boolean> => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const newPaymentMethod: PaymentMethod = {
        id: `pm_${Date.now()}`,
        type: 'card',
        last4: paymentData.last4 || '1234',
        brand: paymentData.brand || 'visa',
        expMonth: paymentData.expMonth || 12,
        expYear: paymentData.expYear || 2025
      };
      
      const updatedMethods = [...paymentMethods, newPaymentMethod];
      setPaymentMethods(updatedMethods);
      localStorage.setItem('statsor_payment_methods', JSON.stringify(updatedMethods));
      
      toast.success('Payment method added successfully');
      return true;
    } catch (error) {
      console.error('Add payment method error:', error);
      toast.error('Failed to add payment method');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const removePaymentMethod = async (paymentMethodId: string): Promise<boolean> => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const updatedMethods = paymentMethods.filter(pm => pm.id !== paymentMethodId);
      setPaymentMethods(updatedMethods);
      localStorage.setItem('statsor_payment_methods', JSON.stringify(updatedMethods));
      
      toast.success('Payment method removed successfully');
      return true;
    } catch (error) {
      console.error('Remove payment method error:', error);
      toast.error('Failed to remove payment method');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const getPlanFeatures = (planId: string): Plan | null => {
    return plans.find(plan => plan.id === planId) || null;
  };

  const hasFeature = (feature: string): boolean => {
    if (!currentPlan) return false;
    
    switch (feature) {
      case 'ai_access':
        return currentPlan.aiAccess;
      case 'priority_support':
        return currentPlan.priority;
      case 'multiple_teams':
        return currentPlan.maxTeams > 1;
      case 'advanced_analytics':
        return currentPlan.id !== 'starter';
      default:
        return false;
    }
  };

  const canCreateTeam = (): boolean => {
    if (!currentPlan) return false;
    // Get current team count from localStorage or context
    const currentTeams = parseInt(localStorage.getItem('statsor_team_count') || '0');
    return currentTeams < currentPlan.maxTeams;
  };

  const canAddPlayer = (currentCount: number): boolean => {
    if (!currentPlan) return false;
    return currentCount < currentPlan.maxPlayers;
  };

  const canUseAI = (): boolean => {
    return hasFeature('ai_access');
  };

  const getUsageStats = () => {
    return {
      teams: parseInt(localStorage.getItem('statsor_team_count') || '0'),
      players: parseInt(localStorage.getItem('statsor_player_count') || '0'),
      aiUsage: parseInt(localStorage.getItem('statsor_ai_usage_count') || '0')
    };
  };

  const value: SubscriptionContextType = {
    plans,
    currentPlan,
    subscription,
    paymentMethods,
    loading,
    subscribe,
    cancelSubscription,
    updatePaymentMethod,
    addPaymentMethod,
    removePaymentMethod,
    getPlanFeatures,
    hasFeature,
    canCreateTeam,
    canAddPlayer,
    canUseAI,
    getUsageStats
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};