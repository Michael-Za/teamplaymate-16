import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { 
  ArrowLeft, 
  Shield, 
  CheckCircle, 
  CreditCard, 
  Lock, 
  Star,
  Loader2,
  AlertCircle,
  Crown
} from 'lucide-react';
import { toast } from 'sonner';
import { paypalService } from '../services/paypalService';

interface Plan {
  id: string;
  name: string;
  price: number;
  currency: string;
  features: string[];
  popular?: boolean;
}

const PayPalPayment: React.FC = () => {
  const { language } = useLanguage();
  const { theme } = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [loading, setLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'failed'>('idle');
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'yearly'>('monthly');

  // Mock plan data - in real app, this would come from props or API
  const plans: Plan[] = [
    {
      id: 'basic',
      name: language === 'en' ? 'Basic Plan' : 'Plan Básico',
      price: 9.99,
      currency: 'EUR',
      features: [
        language === 'en' ? 'Up to 25 players' : 'Hasta 25 jugadores',
        language === 'en' ? 'Basic analytics' : 'Análisis básico',
        language === 'en' ? 'Match reports' : 'Reportes de partidos',
        language === 'en' ? 'Email support' : 'Soporte por email'
      ]
    },
    {
      id: 'pro',
      name: language === 'en' ? 'Pro Plan' : 'Plan Pro',
      price: 19.99,
      currency: 'EUR',
      popular: true,
      features: [
        language === 'en' ? 'Up to 100 players' : 'Hasta 100 jugadores',
        language === 'en' ? 'Advanced analytics' : 'Análisis avanzado',
        language === 'en' ? 'Real-time tracking' : 'Seguimiento en tiempo real',
        language === 'en' ? 'Priority support' : 'Soporte prioritario'
      ]
    },
    {
      id: 'enterprise',
      name: language === 'en' ? 'Enterprise Plan' : 'Plan Empresarial',
      price: 49.99,
      currency: 'EUR',
      features: [
        language === 'en' ? 'Unlimited players' : 'Jugadores ilimitados',
        language === 'en' ? 'Custom analytics' : 'Análisis personalizado',
        language === 'en' ? 'API access' : 'Acceso a API',
        language === 'en' ? '24/7 support' : 'Soporte 24/7'
      ]
    }
  ];

  useEffect(() => {
    const planId = searchParams.get('plan');
    if (planId) {
      const plan = plans.find(p => p.id === planId);
      if (plan) {
        setSelectedPlan(plan);
      }
    }
  }, [searchParams]);

  const handlePayment = async () => {
    if (!user || !selectedPlan) {
      toast.error(language === 'en' ? 'Please select a plan and sign in' : 'Por favor selecciona un plan e inicia sesión');
      return;
    }

    setLoading(true);
    setPaymentStatus('processing');

    try {
      const amount = billingInterval === 'yearly' ? selectedPlan.price * 10 : selectedPlan.price; // 2 months free for yearly
      
      const paymentData = {
        planId: selectedPlan.id,
        planName: selectedPlan.name,
        amount,
        currency: selectedPlan.currency,
        billingInterval,
        userEmail: user.email,
        userId: user.id
      };

      const response = await paypalService.createPayment(paymentData);

      if (response.success && response.redirectUrl) {
        setPaymentStatus('success');
        toast.success(language === 'en' ? 'Redirecting to PayPal...' : 'Redirigiendo a PayPal...');
        setTimeout(() => {
          window.location.href = response.redirectUrl!;
        }, 1500);
      } else {
        setPaymentStatus('failed');
        toast.error(response.error || (language === 'en' ? 'Payment failed' : 'Pago fallido'));
      }
    } catch (error) {
      console.error('PayPal payment error:', error);
      setPaymentStatus('failed');
      toast.error(language === 'en' ? 'Payment service error' : 'Error en el servicio de pago');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = () => {
    switch (paymentStatus) {
      case 'processing':
        return <Loader2 className="w-8 h-8 animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle className="w-8 h-8 text-green-500" />;
      case 'failed':
        return <AlertCircle className="w-8 h-8 text-red-500" />;
      default:
        return <CreditCard className="w-8 h-8 text-gray-500" />;
    }
  };

  const getStatusMessage = () => {
    switch (paymentStatus) {
      case 'processing':
        return language === 'en' ? 'Processing your payment...' : 'Procesando tu pago...';
      case 'success':
        return language === 'en' ? 'Redirecting to PayPal...' : 'Redirigiendo a PayPal...';
      case 'failed':
        return language === 'en' ? 'Payment failed. Please try again.' : 'Pago fallido. Por favor, inténtalo de nuevo.';
      default:
        return language === 'en' ? 'Ready to process payment' : 'Listo para procesar el pago';
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      theme === 'dark' 
        ? 'bg-gradient-to-br from-gray-900 via-black to-gray-900' 
        : 'bg-gradient-to-br from-gray-50 to-white'
    }`}>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center mb-8"
        >
          <Button
            variant="ghost"
            onClick={() => navigate('/pricing')}
            className={`mr-4 ${
              theme === 'dark' ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {language === 'en' ? 'Back to Pricing' : 'Volver a Precios'}
          </Button>
          <h1 className={`text-3xl font-bold ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            {language === 'en' ? 'PayPal Payment' : 'Pago con PayPal'}
          </h1>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Plan Selection */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className={`h-fit ${
              theme === 'dark' 
                ? 'bg-gray-800 border-gray-700' 
                : 'bg-white border-gray-200'
            }`}>
              <CardHeader>
                <h2 className={`text-xl font-semibold ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  {language === 'en' ? 'Select Your Plan' : 'Selecciona tu Plan'}
                </h2>
              </CardHeader>
              <CardContent className="space-y-4">
                {plans.map((plan) => (
                  <motion.div
                    key={plan.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-300 ${
                      selectedPlan?.id === plan.id
                        ? theme === 'dark'
                          ? 'border-yellow-500 bg-yellow-500/10'
                          : 'border-blue-500 bg-blue-50'
                        : theme === 'dark'
                          ? 'border-gray-600 hover:border-gray-500'
                          : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedPlan(plan)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <h3 className={`font-semibold ${
                          theme === 'dark' ? 'text-white' : 'text-gray-900'
                        }`}>
                          {plan.name}
                        </h3>
                        {plan.popular && (
                          <Badge className="ml-2 bg-yellow-500 text-black">
                            <Crown className="w-3 h-3 mr-1" />
                            {language === 'en' ? 'Popular' : 'Popular'}
                          </Badge>
                        )}
                      </div>
                      <div className={`text-right ${
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}>
                        <div className="text-2xl font-bold">
                          €{billingInterval === 'yearly' ? (plan.price * 10).toFixed(2) : plan.price.toFixed(2)}
                        </div>
                        <div className={`text-sm ${
                          theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                          /{billingInterval === 'yearly' ? (language === 'en' ? 'year' : 'año') : (language === 'en' ? 'month' : 'mes')}
                        </div>
                      </div>
                    </div>
                    <div className="space-y-1">
                      {plan.features.map((feature, index) => (
                        <div key={index} className="flex items-center text-sm">
                          <CheckCircle className={`w-4 h-4 mr-2 ${
                            theme === 'dark' ? 'text-green-400' : 'text-green-500'
                          }`} />
                          <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>
                            {feature}
                          </span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                ))}

                {/* Billing Interval Toggle */}
                <div className={`p-4 rounded-lg border ${
                  theme === 'dark' ? 'border-gray-600 bg-gray-700/50' : 'border-gray-200 bg-gray-50'
                }`}>
                  <h4 className={`font-medium mb-3 ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>
                    {language === 'en' ? 'Billing Cycle' : 'Ciclo de Facturación'}
                  </h4>
                  <div className="flex space-x-2">
                    <Button
                      variant={billingInterval === 'monthly' ? 'default' : 'outline'}
                      onClick={() => setBillingInterval('monthly')}
                      className="flex-1"
                    >
                      {language === 'en' ? 'Monthly' : 'Mensual'}
                    </Button>
                    <Button
                      variant={billingInterval === 'yearly' ? 'default' : 'outline'}
                      onClick={() => setBillingInterval('yearly')}
                      className="flex-1"
                    >
                      {language === 'en' ? 'Yearly' : 'Anual'}
                      <Badge className="ml-2 bg-green-500 text-white text-xs">
                        {language === 'en' ? '2 months free' : '2 meses gratis'}
                      </Badge>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Payment Section */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className={`h-fit ${
              theme === 'dark' 
                ? 'bg-gradient-to-br from-gray-800 via-gray-900 to-black border-yellow-500/30' 
                : 'bg-gradient-to-br from-white to-gray-50 border-blue-200'
            }`}>
              <CardHeader>
                <div className="flex items-center justify-center mb-4">
                  {getStatusIcon()}
                </div>
                <h2 className={`text-xl font-semibold text-center ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  {language === 'en' ? 'Secure PayPal Payment' : 'Pago Seguro con PayPal'}
                </h2>
                <p className={`text-center ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  {getStatusMessage()}
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* PayPal Logo */}
                <div className="flex items-center justify-center">
                  <div className={`p-4 rounded-full ${
                    theme === 'dark' ? 'bg-yellow-500/20' : 'bg-blue-100'
                  }`}>
                    <svg className="w-16 h-16 text-yellow-500" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-.635 4.005c-.08.52-.527.901-1.05.901zm2.18-14.97c-.524 0-.968.382-1.05.9l-.635 4.005c-.08.52-.527.901-1.05.901H4.331l1.635-10.337h5.11c1.76 0 3.027.351 3.716 1.425.517.806.414 1.895-.317 3.114-.731 1.22-2.065 1.992-3.719 1.992H9.256z"/>
                    </svg>
                  </div>
                </div>

                {/* Order Summary */}
                {selectedPlan && (
                  <div className={`p-4 rounded-lg border ${
                    theme === 'dark' ? 'border-gray-600 bg-gray-700/50' : 'border-gray-200 bg-gray-50'
                  }`}>
                    <h3 className={`font-semibold mb-3 ${
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>
                      {language === 'en' ? 'Order Summary' : 'Resumen del Pedido'}
                    </h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>
                          {selectedPlan.name}
                        </span>
                        <span className={theme === 'dark' ? 'text-white' : 'text-gray-900'}>
                          €{billingInterval === 'yearly' ? (selectedPlan.price * 10).toFixed(2) : selectedPlan.price.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>
                          {language === 'en' ? 'Billing Cycle' : 'Ciclo de Facturación'}
                        </span>
                        <span className={theme === 'dark' ? 'text-white' : 'text-gray-900'}>
                          {billingInterval === 'yearly' ? (language === 'en' ? 'Yearly' : 'Anual') : (language === 'en' ? 'Monthly' : 'Mensual')}
                        </span>
                      </div>
                      {billingInterval === 'yearly' && (
                        <div className="flex justify-between text-green-500">
                          <span>{language === 'en' ? 'Discount (2 months free)' : 'Descuento (2 meses gratis)'}</span>
                          <span>-€{(selectedPlan.price * 2).toFixed(2)}</span>
                        </div>
                      )}
                      <hr className={theme === 'dark' ? 'border-gray-600' : 'border-gray-200'} />
                      <div className="flex justify-between font-semibold text-lg">
                        <span className={theme === 'dark' ? 'text-white' : 'text-gray-900'}>
                          {language === 'en' ? 'Total' : 'Total'}
                        </span>
                        <span className={theme === 'dark' ? 'text-white' : 'text-gray-900'}>
                          €{billingInterval === 'yearly' ? (selectedPlan.price * 10).toFixed(2) : selectedPlan.price.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Payment Button */}
                <Button
                  onClick={handlePayment}
                  disabled={loading || !selectedPlan || paymentStatus === 'processing'}
                  className={`w-full h-14 text-lg font-semibold transition-all duration-300 transform hover:scale-105 ${
                    theme === 'dark'
                      ? 'bg-gradient-to-r from-yellow-600 via-yellow-500 to-yellow-600 hover:from-yellow-500 hover:via-yellow-400 hover:to-yellow-500 text-black shadow-lg shadow-yellow-500/25'
                      : 'bg-gradient-to-r from-blue-600 via-blue-500 to-blue-600 hover:from-blue-500 hover:via-blue-400 hover:to-blue-500 text-white shadow-lg shadow-blue-500/25'
                  }`}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin mr-3" />
                      {language === 'en' ? 'Processing...' : 'Procesando...'}
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-.635 4.005c-.08.52-.527.901-1.05.901zm2.18-14.97c-.524 0-.968.382-1.05.9l-.635 4.005c-.08.52-.527.901-1.05.901H4.331l1.635-10.337h5.11c1.76 0 3.027.351 3.716 1.425.517.806.414 1.895-.317 3.114-.731 1.22-2.065 1.992-3.719 1.992H9.256z"/>
                      </svg>
                      {language === 'en' ? 'Pay with PayPal' : 'Pagar con PayPal'}
                    </>
                  )}
                </Button>

                {/* Security Features */}
                <div className="space-y-3">
                  <div className={`flex items-center justify-center text-sm ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    <Shield className="w-4 h-4 mr-2" />
                    {language === 'en' ? 'Protected by PayPal Buyer Protection' : 'Protegido por PayPal Buyer Protection'}
                  </div>
                  <div className={`flex items-center justify-center text-sm ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    <Lock className="w-4 h-4 mr-2" />
                    {language === 'en' ? '256-bit SSL encryption' : 'Cifrado SSL de 256 bits'}
                  </div>
                  <div className="flex items-center justify-center space-x-4">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} className="w-4 h-4 text-yellow-500 fill-current" />
                    ))}
                  </div>
                  <p className={`text-center text-xs ${
                    theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                  }`}>
                    {language === 'en' ? 'Trusted by millions worldwide' : 'Confiado por millones en todo el mundo'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default PayPalPayment;