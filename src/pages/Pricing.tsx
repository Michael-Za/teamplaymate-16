
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader } from '../components/ui/card';
import { Switch } from '../components/ui/switch';
import { Badge } from '../components/ui/badge';
import { Check, Crown, Star, CreditCard, Shield, Zap, Users, BarChart3, Loader2, AlertCircle, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { Link, useNavigate } from 'react-router-dom';
import { paypalService } from '../services/paypalService';

const Pricing: React.FC = () => {
  const { language } = useLanguage();
  const { theme } = useTheme();
  const { user } = useAuth();
  const { 
    plans, 
    currentPlan, 
    subscription, 
    loading, 
    subscribe, 
    cancelSubscription,
    hasFeature 
  } = useSubscription();
  const navigate = useNavigate();
  
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'yearly'>('yearly');

  const [paypalLoading, setPaypalLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'failed'>('idle');

  const handleSubscribe = async (planId: string) => {
    await handlePayPalPayment(planId);
  };

  const handlePayPalPayment = async (planId: string) => {
    if (!user) {
      toast.error(language === 'en' ? 'Please sign in to make a payment' : 'Por favor inicia sesión para hacer un pago');
      navigate('/signin');
      return;
    }

    const plan = plans.find(p => p.id === planId);
    if (!plan) {
      toast.error(language === 'en' ? 'Plan not found' : 'Plan no encontrado');
      return;
    }

    setPaypalLoading(true);
    setPaymentStatus('processing');

    try {
      // Check if user already has this plan
      const hasActive = paypalService.hasActiveSubscription(user.email, planId);
      if (hasActive) {
        toast.error(language === 'en' ? 'You already have an active subscription for this plan' : 'Ya tienes una suscripción activa para este plan');
        setPaymentStatus('failed');
        return;
      }

      // Check payment attempts
      const attempts = paypalService.getPaymentAttempts(user.email, planId);
      if (attempts > 3) {
        toast.error(language === 'en' ? 'Too many payment attempts. Please try again later.' : 'Demasiados intentos de pago. Por favor, inténtalo más tarde.');
        setPaymentStatus('failed');
        return;
      }

      const amount = billingInterval === 'yearly' ? plan.price : Math.round(plan.price / 12);
      
      const paymentData = {
        planId,
        planName: plan.name,
        amount,
        currency: 'EUR',
        billingInterval,
        userEmail: user.email,
        userId: user.id
      };

      const response = await paypalService.createPayment(paymentData);

      if (response.success && response.redirectUrl) {
        // Redirect to PayPal
        window.location.href = response.redirectUrl;
      } else {
        toast.error(response.error || (language === 'en' ? 'Payment failed' : 'Pago fallido'));
        setPaymentStatus('failed');
      }

    } catch (error) {
      console.error('PayPal payment error:', error);
      toast.error(language === 'en' ? 'Payment service error' : 'Error en el servicio de pago');
      setPaymentStatus('failed');
    } finally {
      setPaypalLoading(false);
    }
  };



  const handleCancelSubscription = async () => {
    const success = await cancelSubscription();
    if (success) {
      navigate('/dashboard');
    }
  };

  const getPlanPrice = (plan: any) => {
    if (billingInterval === 'yearly') {
      return plan.price;
    } else {
      // Monthly pricing (convert yearly to monthly)
      return Math.round(plan.price / 12);
    }
  };

  const getSavings = (plan: any) => {
    if (billingInterval === 'yearly' && plan.price > 0) {
      const monthlyPrice = Math.round(plan.price / 12);
      const yearlyTotal = monthlyPrice * 12;
      return yearlyTotal - plan.price;
    }
    return 0;
  };

  const features = [
    {
      icon: Users,
      title: language === 'en' ? 'Team Management' : 'Gestión de Equipos',
      description: language === 'en' ? 'Manage multiple teams and players' : 'Gestiona múltiples equipos y jugadores'
    },
    {
      icon: BarChart3,
      title: language === 'en' ? 'Advanced Analytics' : 'Analíticas Avanzadas',
      description: language === 'en' ? 'Detailed performance insights' : 'Insights detallados de rendimiento'
    },
    {
      icon: Zap,
      title: language === 'en' ? 'AI Assistant' : 'Asistente IA',
      description: language === 'en' ? 'Tactical AI recommendations' : 'Recomendaciones tácticas con IA'
    },
    {
      icon: Shield,
      title: language === 'en' ? 'Priority Support' : 'Soporte Prioritario',
      description: language === 'en' ? '24/7 dedicated support' : 'Soporte dedicado 24/7'
    }
  ];

  return (
    <div className={`min-h-screen py-16 px-4 ${
      theme === 'dark' 
        ? 'bg-black text-white' 
        : 'bg-white text-gray-900'
    }`}>
      {/* Simple geometric background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-20 right-20 w-32 h-32 ${
          theme === 'dark' ? 'bg-blue-600/10' : 'bg-blue-500/5'
        } rounded-lg rotate-45`}></div>
        <div className={`absolute bottom-20 left-20 w-24 h-24 ${
          theme === 'dark' ? 'bg-blue-500/10' : 'bg-blue-400/5'
        } rounded-full`}></div>
      </div>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16 relative z-10"
        >
          <motion.h1
            className={`text-4xl md:text-6xl font-bold mb-6 ${
              theme === 'dark'
                ? 'text-blue-400'
                : 'text-blue-600'
            }`}
          >
            {language === 'en' ? 'Choose Your Plan' : 'Escoge tu Plan'}
          </motion.h1>
          
          <motion.p
            className={`text-lg max-w-2xl mx-auto ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            {language === 'en' 
              ? "Simple, transparent pricing for teams of all sizes."
              : "Precios simples y transparentes para equipos de todos los tamaños."
            }
          </motion.p>
        </motion.div>

        {/* Billing Toggle */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="flex justify-center items-center mb-12 relative z-10"
        >
          <div className={`flex items-center space-x-4 p-3 rounded-lg ${
            theme === 'dark' 
              ? 'bg-gray-900 border border-gray-800' 
              : 'bg-gray-50 border border-gray-200'
          }`}>
            <span className={`text-sm font-medium ${
              billingInterval === 'monthly'
                ? (theme === 'dark' ? 'text-blue-400' : 'text-blue-600') 
                : (theme === 'dark' ? 'text-gray-500' : 'text-gray-400')
            }`}>
              {language === 'en' ? 'Monthly' : 'Mensual'}
            </span>
            
            <Switch
              checked={billingInterval === 'yearly'}
              onCheckedChange={(checked) => setBillingInterval(checked ? 'yearly' : 'monthly')}
              className="data-[state=checked]:bg-blue-600"
            />
            
            <span className={`text-sm font-medium ${
              billingInterval === 'yearly'
                ? (theme === 'dark' ? 'text-blue-400' : 'text-blue-600') 
                : (theme === 'dark' ? 'text-gray-500' : 'text-gray-400')
            }`}>
              {language === 'en' ? 'Annual' : 'Anual'}
            </span>
            
            {billingInterval === 'yearly' && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-blue-600 text-white text-xs px-3 py-1 rounded-full font-medium"
              >
                {language === 'en' ? 'Save 20%' : 'Ahorra 20%'}
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16 relative z-10">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + index * 0.1, duration: 0.5 }}
              whileHover={{ y: -5 }}
              className="relative"
            >
              <Card className={`h-full border transition-all duration-300 ${
                plan.popular 
                  ? (theme === 'dark'
                      ? 'bg-blue-950 border-blue-500 shadow-lg shadow-blue-500/20'
                      : 'bg-blue-50 border-blue-500 shadow-lg shadow-blue-500/10')
                  : (theme === 'dark'
                      ? 'bg-gray-900 border-gray-800 hover:border-gray-700 shadow-sm hover:shadow-md'
                      : 'bg-white border-gray-200 hover:border-gray-300 shadow-sm hover:shadow-md')
              }`}>
                {plan.popular && (
                   <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-20">
                     <div className="bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-medium">
                       {language === 'en' ? 'Most Popular' : 'Más Popular'}
                     </div>
                   </div>
                 )}

                <CardHeader className="text-center pb-4">
                  <h3 className={`text-2xl font-bold mb-4 ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>
                    {plan.name}
                  </h3>
                  
                  <div className="mb-4">
                    <span className={`text-4xl font-bold ${
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>
                      €{getPlanPrice(plan)}
                    </span>
                    <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      /{billingInterval === 'yearly' ? (language === 'en' ? 'year' : 'año') : (language === 'en' ? 'month' : 'mes')}
                    </span>
                    
                    {getSavings(plan) > 0 && (
                      <div className="mt-2">
                        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                          {language === 'en' ? `Save €${getSavings(plan)}` : `Ahorra €${getSavings(plan)}`}
                        </span>
                      </div>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, featureIndex) => (
                      <li
                        key={featureIndex}
                        className={`flex items-center space-x-3 text-sm ${
                          theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                        }`}
                      >
                        <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${
                          plan.popular
                            ? 'bg-blue-600'
                            : (theme === 'dark' ? 'bg-gray-600' : 'bg-gray-400')
                        }`}>
                          <Check className="w-3 h-3 text-white" />
                        </div>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="pt-4">
                    {currentPlan?.id === plan.id ? (
                      <div className="space-y-3">
                        <Button
                          disabled
                          className={`w-full py-3 font-semibold ${
                            theme === 'dark'
                              ? 'bg-green-600 text-white'
                              : 'bg-green-500 text-white'
                          }`}
                        >
                          <Check className="w-4 h-4 mr-2" />
                          {language === 'en' ? 'Current Plan' : 'Plan Actual'}
                        </Button>
                        {subscription?.status === 'active' && (
                          <Button
                            variant="outline"
                            onClick={handleCancelSubscription}
                            disabled={loading}
                            className="w-full py-3 text-red-600 border-red-300 hover:bg-red-50"
                          >
                            {loading ? (
                              <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            ) : (
                              <AlertCircle className="w-4 h-4 mr-2" />
                            )}
                            {loading ? '...' : language === 'en' ? 'Cancel' : 'Cancelar'}
                          </Button>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {plan.price > 0 && (
                          <Button
                            onClick={() => handlePayPalPayment(plan.id)}
                            disabled={paypalLoading}
                            className={`w-full py-3 font-semibold ${
                              plan.popular
                                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                : (theme === 'dark'
                                    ? 'bg-gray-700 hover:bg-gray-600 text-white'
                                    : 'bg-gray-900 hover:bg-gray-800 text-white')
                            }`}
                          >
                            {paypalLoading ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                {language === 'en' ? 'Processing...' : 'Procesando...'}
                              </>
                            ) : (
                              <>
                                <CreditCard className="w-4 h-4 mr-2" />
                                {language === 'en' ? 'Subscribe' : 'Suscribirse'}
                              </>
                            )}
                          </Button>
                        )}
                        
                        <Button
                          onClick={() => handleSubscribe(plan.id)}
                          disabled={loading}
                          variant="outline"
                          className="w-full py-3 font-semibold"
                        >
                          {loading && selectedPlan === plan.id ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin mr-2" />
                              {language === 'en' ? 'Processing...' : 'Procesando...'}
                            </>
                          ) : (
                            <>
                              {plan.price === 0 ? (
                                <>
                                  <Zap className="w-4 h-4 mr-2" />
                                  {language === 'en' ? 'Start Free' : 'Comenzar Gratis'}
                                </>
                              ) : (
                                language === 'en' ? 'Other Methods' : 'Otros Métodos'
                              )}
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Features Comparison */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="mb-16"
        >
          <h2 className="text-3xl font-bold text-center mb-12">
            {language === 'en' ? 'All Plans Include' : 'Todos los Planes Incluyen'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + index * 0.1, duration: 0.5 }}
                className="text-center"
              >
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${
                  theme === 'dark' ? 'bg-gray-800 text-green-400' : 'bg-green-100 text-green-600'
                }`}>
                  <feature.icon className="w-8 h-8" />
                </div>
                <h3 className={`text-lg font-semibold mb-2 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  {feature.title}
                </h3>
                <p className={`text-sm ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
              </motion.div>
              
        {/* FAQ Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.8 }}
          className="text-center"
        >
          <h2 className="text-3xl font-bold mb-8">
            {language === 'en' ? 'Frequently Asked Questions' : 'Preguntas Frecuentes'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {[
              {
                q: language === 'en' ? 'Can I change my plan anytime?' : '¿Puedo cambiar mi plan en cualquier momento?',
                a: language === 'en' ? 'Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.' : 'Sí, puedes actualizar o cambiar tu plan en cualquier momento. Los cambios tienen efecto inmediato.'
              },
              {
                q: language === 'en' ? 'Is there a free trial?' : '¿Hay una prueba gratuita?',
                a: language === 'en' ? 'Yes, all plans come with a 7-day free trial. No credit card required.' : 'Sí, todos los planes incluyen una prueba gratuita de 7 días. No se requiere tarjeta de crédito.'
              },
              {
                q: language === 'en' ? 'What payment methods do you accept?' : '¿Qué métodos de pago aceptan?',
                a: language === 'en' ? 'We accept all major credit cards, PayPal, and bank transfers for annual plans.' : 'Aceptamos todas las tarjetas de crédito principales, PayPal y transferencias bancarias para planes anuales.'
              },
              {
                q: language === 'en' ? 'Can I cancel anytime?' : '¿Puedo cancelar en cualquier momento?',
                a: language === 'en' ? 'Yes, you can cancel your subscription at any time. You\'ll continue to have access until the end of your billing period.' : 'Sí, puedes cancelar tu suscripción en cualquier momento. Mantendrás el acceso hasta el final de tu período de facturación.'
              }
            ].map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8 + index * 0.1, duration: 0.5 }}
                className={`p-6 rounded-lg ${
                  theme === 'dark' ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
                }`}
              >
                <h3 className={`font-semibold mb-2 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  {faq.q}
                </h3>
                <p className={`text-sm ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  {faq.a}
                </p>
              </motion.div>
            ))}
          </div>
              </motion.div>
              
        {/* CTA Section */}
              <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.8 }}
          className="text-center mt-16"
        >
          <h2 className="text-3xl font-bold mb-4">
            {language === 'en' ? 'Ready to Get Started?' : '¿Listo para Comenzar?'}
          </h2>
          <p className={`text-lg mb-8 ${
            theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
          }`}>
            {language === 'en' 
              ? "Join thousands of coaches who are already using Statsor to improve their team's performance."
              : "Únete a miles de entrenadores que ya están usando Statsor para mejorar el rendimiento de su equipo."
            }
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => navigate('/signup')}
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 text-lg"
            >
              {language === 'en' ? 'Start Free Trial' : 'Comenzar Prueba Gratuita'}
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/')}
              className="px-8 py-3 text-lg"
            >
              {language === 'en' ? 'Learn More' : 'Saber Más'}
            </Button>
                  </div>
        </motion.div>
                </div>
                
      {/* Payment Modal */}
        {showPaymentModal && (
          <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowPaymentModal(false)}
          >
            <div
              className={`max-w-md w-full rounded-lg p-6 shadow-lg border ${
                theme === 'dark'
                  ? 'bg-gray-900 border-gray-700'
                  : 'bg-white border-gray-200'
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center mb-6">
                <div className={`w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center ${
                  theme === 'dark' ? 'bg-blue-600' : 'bg-blue-500'
                }`}>
                  <CreditCard className="w-6 h-6 text-white" />
                </div>
                <h3 className={`text-xl font-bold mb-2 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  {language === 'en' ? 'Complete Payment' : 'Completar Pago'}
                </h3>
              </div>

              <div className="space-y-4">
                <div className={`p-4 rounded-lg border ${
                  theme === 'dark'
                    ? 'bg-gray-800 border-gray-700'
                    : 'bg-gray-50 border-gray-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className={`font-medium ${
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>
                      {selectedPlan && plans.find(p => p.id === selectedPlan)?.name}
                    </span>
                    <span className={`text-lg font-bold ${
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>
                      €{selectedPlan && getPlanPrice(plans.find(p => p.id === selectedPlan)!)}
                    </span>
                  </div>
                </div>

                <Button
                  onClick={() => selectedPlan && handlePayPalPayment(selectedPlan)}
                  disabled={paypalLoading}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                >
                  {paypalLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      {language === 'en' ? 'Processing...' : 'Procesando...'}
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4 mr-2" />
                      {language === 'en' ? 'Pay with PayPal' : 'Pagar con PayPal'}
                    </>
                  )}
                </Button>

                <Button
                  variant="outline"
                  onClick={() => setShowPaymentModal(false)}
                  className="w-full py-3 font-medium"
                >
                  {language === 'en' ? 'Cancel' : 'Cancelar'}
                </Button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
};



export default Pricing;
