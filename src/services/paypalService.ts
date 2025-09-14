import { api } from '../lib/api';

interface PayPalPaymentData {
  planId: string;
  planName: string;
  amount: number;
  currency: string;
  billingInterval: 'monthly' | 'yearly';
  userEmail: string;
  userId?: string;
}

interface PayPalResponse {
  success: boolean;
  paymentId?: string;
  error?: string;
  redirectUrl?: string;
}

class PayPalService {
  private paypalClientId = import.meta.env.VITE_PAYPAL_CLIENT_ID || 'your_paypal_client_id';
  private paypalEmail = 'statsor1@gmail.com'; // Your PayPal business email

  // Track payment attempts and successful payments
  private paymentAttempts = new Map<string, number>();
  private successfulPayments = new Map<string, boolean>();

  async createPayment(paymentData: PayPalPaymentData): Promise<PayPalResponse> {
    try {
      // Validate required parameters
      if (!paymentData.userEmail || !paymentData.planId) {
        return {
          success: false,
          error: 'Missing required payment information'
        };
      }

      // Check if user has already paid for this plan
      const paymentKey = `${paymentData.userEmail}-${paymentData.planId}`;
      if (this.successfulPayments.get(paymentKey)) {
        return {
          success: false,
          error: 'Payment already completed for this plan'
        };
      }

      // Track payment attempt
      const attempts = this.paymentAttempts.get(paymentKey) || 0;
      this.paymentAttempts.set(paymentKey, attempts + 1);

      // Create subscription with backend API
      const response = await fetch(api.subscription.create, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          plan_id: paymentData.planId,
          payment_method: 'paypal',
          billing_cycle: paymentData.billingInterval,
          amount: paymentData.amount
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = 'Failed to create subscription';
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          // If parsing fails, use the raw text
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      
      if (result.payment_data && result.payment_data.result) {
        // Store payment data in localStorage for verification
        localStorage.setItem('pendingPayment', JSON.stringify({
          ...paymentData,
          paypalOrderId: result.payment_data.result.id,
          timestamp: Date.now()
        }));

        return {
          success: true,
          paymentId: result.payment_data.result.id,
          redirectUrl: result.payment_data.result.links.find((link: any) => link.rel === 'approve').href
        };
      }

      return {
        success: false,
        error: 'Failed to create PayPal payment'
      };

    } catch (error) {
      console.error('PayPal payment error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment service temporarily unavailable'
      };
    }
  }

  async verifyPayment(paymentId: string): Promise<boolean> {
    try {
      const pendingPayment = localStorage.getItem('pendingPayment');
      if (!pendingPayment) return false;

      const paymentData = JSON.parse(pendingPayment);
      
      // Confirm subscription payment with backend API
      const response = await fetch(`${api.baseURL}/api/v1/subscriptions/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          paypal_order_id: paymentId
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = 'Failed to confirm payment';
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          // If parsing fails, use the raw text
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      
      if (result.subscription && result.subscription.status === 'active') {
        // Mark payment as successful
        const paymentKey = `${paymentData.userEmail}-${paymentData.planId}`;
        this.successfulPayments.set(paymentKey, true);
        
        // Clear pending payment
        localStorage.removeItem('pendingPayment');

        // Store successful payment in localStorage
        await this.storeSuccessfulPayment(paymentData, paymentId);

        return true;
      }

      return false;

    } catch (error) {
      console.error('Payment verification error:', error);
      return false;
    }
  }

  private async storeSuccessfulPayment(paymentData: PayPalPaymentData, paymentId: string) {
    try {
      // Store in localStorage for demo (replace with database call)
      const payments = JSON.parse(localStorage.getItem('payments') || '[]');
      payments.push({
        paymentId,
        userEmail: paymentData.userEmail,
        userId: paymentData.userId,
        planId: paymentData.planId,
        planName: paymentData.planName,
        amount: paymentData.amount,
        currency: paymentData.currency,
        billingInterval: paymentData.billingInterval,
        paypalEmail: this.paypalEmail,
        timestamp: new Date().toISOString(),
        status: 'completed'
      });
      localStorage.setItem('payments', JSON.stringify(payments));

      console.log('Payment stored:', paymentData);

    } catch (error) {
      console.error('Error storing payment:', error);
    }
  }

  // Get payment history for a user
  getPaymentHistory(userEmail: string) {
    try {
      const payments = JSON.parse(localStorage.getItem('payments') || '[]');
      return payments.filter((payment: any) => payment.userEmail === userEmail);
    } catch (error) {
      console.error('Error getting payment history:', error);
      return [];
    }
  }

  // Check if user has active subscription
  hasActiveSubscription(userEmail: string, planId: string): boolean {
    if (!userEmail || !planId) return false;
    const paymentKey = `${userEmail}-${planId}`;
    return this.successfulPayments.get(paymentKey) || false;
  }

  // Get payment attempts for a user
  getPaymentAttempts(userEmail: string, planId: string): number {
    if (!userEmail || !planId) return 0;
    const paymentKey = `${userEmail}-${planId}`;
    return this.paymentAttempts.get(paymentKey) || 0;
  }

  // Reset payment attempts (for testing)
  resetPaymentAttempts(userEmail: string, planId: string) {
    const paymentKey = `${userEmail}-${planId}`;
    this.paymentAttempts.delete(paymentKey);
    this.successfulPayments.delete(paymentKey);
  }
}

export const paypalService = new PayPalService();