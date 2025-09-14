import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Check, Mail, CreditCard, Star, Zap, Crown, Users, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import { Link, useNavigate } from 'react-router-dom';
import { Switch } from '../components/ui/switch';

const Pricing: React.FC = () => {
  const { language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'yearly'>('yearly');

  const handleContactSales = () => {
    window.location.href = 'mailto:statsor1@gmail.com?subject=Custom Plan Inquiry&body=Hello, I would like to inquire about the Custom Plan pricing.';
  };

  const handleGetStarted = (plan: string) => {
    if (!user) {
      toast.info(language === 'en' ? 'Please sign in to get started' : 'Por favor inicia sesión para comenzar');
      navigate('/signin');
      return;
    }
    
    if (plan === 'free') {
      toast.success(language === 'en' ? 'You are now on the Free plan' : 'Ahora estás en el plan Gratuito');
      navigate('/dashboard');
    } else if (plan === 'pro') {
      toast.success(language === 'en' ? 'Redirecting to payment page...' : 'Redirigiendo a la página de pago...');
      // In a real implementation, you would integrate with a payment provider here
    }
  };

  const getProPrice = () => {
    return billingInterval === 'yearly' ? '€99' : '€9.99';
  };

  const getProPeriod = () => {
    return billingInterval === 'yearly' 
      ? (language === 'en' ? '/year' : '/año') 
      : (language === 'en' ? '/month' : '/mes');
  };

  const getSavings = () => {
    if (billingInterval === 'yearly') {
      return '€20';
    }
    return null;
  };

  const plans = [
    {
      id: 'free',
      name: language === 'en' ? 'Free Plan' : 'Plan Gratuito',
      price: language === 'en' ? 'Free' : 'Gratuito',
      period: '',
      icon: <Star className="w-6 h-6 text-gray-600" />,
      color: 'gray',
      features: [
        language === 'en' ? '1 dashboard' : '1 tablero',
        language === 'en' ? 'Up to 3 widgets (bar, line, pie)' : 'Hasta 3 widgets (barra, línea, circular)',
        language === 'en' ? 'Manual data upload only (CSV, Excel)' : 'Solo carga manual de datos (CSV, Excel)',
        language === 'en' ? 'Up to 5 players max' : 'Hasta 5 jugadores máximo',
        language === 'en' ? 'Export only in PNG' : 'Exportar solo en PNG',
        language === 'en' ? 'Data history of 7 days' : 'Historial de datos de 7 días',
        language === 'en' ? '1 user per account' : '1 usuario por cuenta',
        language === 'en' ? 'No collaboration features' : 'Sin funciones de colaboración',
        language === 'en' ? 'No chatbot access' : 'Sin acceso al chatbot',
        language === 'en' ? 'Visible Statsor branding (no customization)' : 'Marca visible de Statsor (sin personalización)',
        language === 'en' ? 'Light mode only' : 'Solo modo claro',
        language === 'en' ? 'Support via email (response in 48–72h)' : 'Soporte por correo electrónico (respuesta en 48–72h)',
        language === 'en' ? 'Monthly upload limit: 5 uploads' : 'Límite mensual de cargas: 5 cargas'
      ]
    },
    {
      id: 'pro',
      name: language === 'en' ? 'Pro Plan' : 'Plan Pro',
      price: getProPrice(),
      period: getProPeriod(),
      icon: <Zap className="w-6 h-6 text-blue-600" />,
      color: 'blue',
      popular: true,
      features: [
        language === 'en' ? 'Unlimited dashboards' : 'Tableros ilimitados',
        language === 'en' ? 'Up to 15 widgets per dashboard (advanced types: stacked bars, gauges, KPIs, trendlines, etc.)' : 'Hasta 15 widgets por tablero (tipos avanzados: barras apiladas, medidores, KPIs, líneas de tendencia, etc.)',
        language === 'en' ? 'Real-time data sync via APIs and Google Sheets' : 'Sincronización de datos en tiempo real a través de APIs y Google Sheets',
        language === 'en' ? 'Unlimited players' : 'Jugadores ilimitados',
        language === 'en' ? 'Export in PNG and PDF' : 'Exportar en PNG y PDF',
        language === 'en' ? 'Data history of up to 90 days' : 'Historial de datos de hasta 90 días',
        language === 'en' ? 'Up to 5 users' : 'Hasta 5 usuarios',
        language === 'en' ? 'Basic chatbot access for answering questions' : 'Acceso básico al chatbot para responder preguntas',
        language === 'en' ? 'Dark mode and basic theme customization' : 'Modo oscuro y personalización básica de temas',
        language === 'en' ? 'Email support (response in 24h)' : 'Soporte por correo electrónico (respuesta en 24h)',
        language === 'en' ? 'Monthly upload limit: 50 uploads' : 'Límite mensual de cargas: 50 cargas'
      ]
    },
    {
      id: 'custom',
      name: language === 'en' ? 'Custom Plan' : 'Plan Personalizado',
      price: language === 'en' ? 'Custom pricing' : 'Precio personalizado',
      period: '',
      icon: <Crown className="w-6 h-6 text-yellow-500" />,
      color: 'yellow',
      features: [
        language === 'en' ? 'Unlimited players and large datasets' : 'Jugadores ilimitados y grandes conjuntos de datos',
        language === 'en' ? 'Unlimited widgets' : 'Widgets ilimitados',
        language === 'en' ? 'Full chatbot capabilities (analytics + interactive Q&A)' : 'Capacidades completas del chatbot (análisis + preguntas y respuestas interactivas)',
        language === 'en' ? 'Custom dashboard design & layout' : 'Diseño y disposición personalizados del tablero',
        language === 'en' ? 'White-labeling (your logo, colors, domain)' : 'Etiquetado blanco (tu logo, colores, dominio)',
        language === 'en' ? 'Access to beta features' : 'Acceso a funciones beta',
        language === 'en' ? 'Up to 50 users (or more)' : 'Hasta 50 usuarios (o más)',
        language === 'en' ? 'Team collaboration tools' : 'Herramientas de colaboración en equipo',
        language === 'en' ? '1:1 onboarding & training' : 'Incorporación y capacitación 1:1',
        language === 'en' ? 'Premium support (response in <12h)' : 'Soporte premium (respuesta en <12h)',
        language === 'en' ? 'Monthly upload limit: Unlimited' : 'Límite mensual de cargas: Ilimitado'
      ]
    }
  ];

  return (
    <div className="min-h-screen py-16 px-4 bg-gradient-to-br from-gray-50 to-white text-gray-900">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900">
            {language === 'en' ? 'Simple Pricing Plans' : 'Planes de Precios Simples'}
          </h1>
          <p className="text-lg max-w-2xl mx-auto text-gray-600">
            {language === 'en' 
              ? "Choose the plan that fits your needs. No hidden fees, no surprises."
              : "Elige el plan que se adapte a tus necesidades. Sin tarifas ocultas, sin sorpresas."}
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="flex justify-center items-center mb-16">
          <div className="flex items-center space-x-4 p-4 rounded-xl bg-white shadow-sm border border-gray-200">
            <span className={`text-sm font-medium px-3 py-1 rounded-lg transition-colors ${
              billingInterval === 'monthly'
                ? 'bg-blue-100 text-blue-700' 
                : 'text-gray-500'
            }`}>
              {language === 'en' ? 'Monthly' : 'Mensual'}
            </span>
            
            <Switch
              checked={billingInterval === 'yearly'}
              onCheckedChange={(checked) => setBillingInterval(checked ? 'yearly' : 'monthly')}
              className="data-[state=checked]:bg-blue-600"
            />
            
            <span className={`text-sm font-medium px-3 py-1 rounded-lg transition-colors ${
              billingInterval === 'yearly'
                ? 'bg-blue-100 text-blue-700' 
                : 'text-gray-500'
            }`}>
              {language === 'en' ? 'Annual' : 'Anual'}
            </span>
            
            {billingInterval === 'yearly' && (
              <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs px-3 py-1 rounded-full font-medium animate-pulse">
                {language === 'en' ? 'Save €20' : 'Ahorra €20'}
              </div>
            )}
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          {plans.map((plan) => (
            <Card 
              key={plan.id} 
              className={`h-full border rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 ${
                plan.id === 'pro'
                  ? 'border-blue-300 ring-2 ring-blue-100' 
                  : 'border-gray-200'
              }`}
            >
              
              <CardHeader className="text-center pb-6 pt-8 bg-gradient-to-b from-white to-gray-50 relative">
                <div className="flex justify-center mb-4">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
                    plan.id === 'free' ? 'bg-gray-100' :
                    plan.id === 'pro' ? 'bg-blue-100' :
                    'bg-gradient-to-r from-yellow-100 to-amber-100'
                  }`}>
                    {plan.icon}
                  </div>
                </div>
                
                <CardTitle className="text-2xl font-bold mb-2 text-gray-900">
                  {plan.name}
                </CardTitle>
                
                <div className="mb-4">
                  <span className="text-4xl font-bold text-gray-900">
                    {plan.price}
                  </span>
                  {plan.period && (
                    <span className="text-base text-gray-600">
                      {plan.period}
                    </span>
                  )}
                </div>
                
              </CardHeader>

              <CardContent className="space-y-6 pt-10 pb-8">
                <ul className="space-y-4">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start space-x-3 text-sm text-gray-700">
                      <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5 ${
                        plan.id === 'free' ? 'bg-gray-100' :
                        plan.id === 'pro' ? 'bg-blue-100' :
                        'bg-gradient-to-r from-yellow-100 to-amber-100'
                      }`}>
                        <Check className={`w-3 h-3 ${
                          plan.id === 'free' ? 'text-gray-600' :
                          plan.id === 'pro' ? 'text-blue-600' :
                          'text-yellow-600'
                        }`} />
                      </div>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <div className="pt-4">
                  {plan.id === 'custom' ? (
                    <Button
                      onClick={handleContactSales}
                      className="w-full py-3 font-semibold rounded-xl bg-gradient-to-r from-gray-900 to-black hover:from-gray-800 hover:to-gray-900 text-white shadow-lg hover:shadow-xl transition-all"
                    >
                      <Mail className="w-4 h-4 mr-2" />
                      {language === 'en' ? 'Contact Sales' : 'Contactar Ventas'}
                    </Button>
                  ) : (
                    <Button
                      onClick={() => handleGetStarted(plan.id)}
                      className={`w-full py-3 font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all ${
                        plan.id === 'pro' 
                          ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white' 
                          : 'bg-gray-900 hover:bg-gray-800 text-white'
                      }`}
                    >
                      {plan.id === 'pro' ? (
                        <>
                          <CreditCard className="w-4 h-4 mr-2" />
                          {language === 'en' ? 'Subscribe Now' : 'Suscribirse Ahora'}
                        </>
                      ) : (
                        language === 'en' ? 'Get Started' : 'Comenzar'
                      )}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Features Comparison */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">
            {language === 'en' ? 'Plan Features Comparison' : 'Comparación de Características'}
          </h2>
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="grid grid-cols-4 gap-0">
              <div className="p-6 bg-gray-50 border-r border-gray-200">
                <h3 className="font-semibold text-gray-900">
                  {language === 'en' ? 'Features' : 'Características'}
                </h3>
              </div>
              <div className="p-6 border-r border-gray-200 text-center">
                <Star className="w-5 h-5 text-gray-600 mx-auto mb-2" />
                <h3 className="font-semibold text-gray-900">
                  {language === 'en' ? 'Free' : 'Gratuito'}
                </h3>
              </div>
              <div className="p-6 border-r border-gray-200 text-center relative">
                <Zap className="w-5 h-5 text-blue-600 mx-auto mb-2" />
                <h3 className="font-semibold text-gray-900">
                  {language === 'en' ? 'Pro' : 'Pro'}
                </h3>
              </div>
              <div className="p-6 text-center">
                <Crown className="w-5 h-5 text-yellow-500 mx-auto mb-2" />
                <h3 className="font-semibold text-gray-900">
                  {language === 'en' ? 'Custom' : 'Personalizado'}
                </h3>
              </div>
            </div>
            
            {[
              language === 'en' ? 'Dashboards' : 'Tableros',
              language === 'en' ? 'Widgets' : 'Widgets',
              language === 'en' ? 'Players' : 'Jugadores',
              language === 'en' ? 'Data Export' : 'Exportar Datos',
              language === 'en' ? 'Data History' : 'Historial de Datos',
              language === 'en' ? 'Users' : 'Usuarios',
              language === 'en' ? 'Chatbot Access' : 'Acceso al Chatbot',
              language === 'en' ? 'Theme Customization' : 'Personalización de Temas',
              language === 'en' ? 'Support' : 'Soporte',
              language === 'en' ? 'Upload Limit' : 'Límite de Cargas'
            ].map((feature, index) => (
              <div key={index} className="grid grid-cols-4 gap-0 border-t border-gray-200">
                <div className="p-4 bg-gray-50 border-r border-gray-200 font-medium text-gray-700">
                  {feature}
                </div>
                <div className="p-4 border-r border-gray-200 text-center">
                  {index === 0 && '1'}
                  {index === 1 && '3'}
                  {index === 2 && '5'}
                  {index === 3 && 'PNG'}
                  {index === 4 && '7 days'}
                  {index === 5 && '1'}
                  {index === 6 && '×'}
                  {index === 7 && '×'}
                  {index === 8 && '<72h'}
                  {index === 9 && '5'}
                </div>
                <div className="p-4 border-r border-gray-200 text-center font-semibold text-blue-600">
                  {index === 0 && '∞'}
                  {index === 1 && '15'}
                  {index === 2 && '∞'}
                  {index === 3 && 'PNG/PDF'}
                  {index === 4 && '90 days'}
                  {index === 5 && '5'}
                  {index === 6 && '✓'}
                  {index === 7 && '✓'}
                  {index === 8 && '<24h'}
                  {index === 9 && '50'}
                </div>
                <div className="p-4 text-center font-semibold text-yellow-600">
                  {index === 0 && '∞'}
                  {index === 1 && '∞'}
                  {index === 2 && '∞'}
                  {index === 3 && 'All formats'}
                  {index === 4 && '∞'}
                  {index === 5 && '50+'}
                  {index === 6 && 'Advanced'}
                  {index === 7 && 'Full'}
                  {index === 8 && '<12h'}
                  {index === 9 && '∞'}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">
            {language === 'en' ? 'Frequently Asked Questions' : 'Preguntas Frecuentes'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {[
              {
                q: language === 'en' ? 'Can I change my plan anytime?' : '¿Puedo cambiar mi plan en cualquier momento?',
                a: language === 'en' ? 'Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.' : 'Sí, puedes actualizar o cambiar tu plan en cualquier momento. Los cambios surten efecto inmediatamente.'
              },
              {
                q: language === 'en' ? 'Is there a free trial?' : '¿Hay una prueba gratuita?',
                a: language === 'en' ? 'Yes, the Free plan is always available at no cost. You can upgrade anytime to access more features.' : 'Sí, el plan Gratuito siempre está disponible sin costo. Puedes actualizar en cualquier momento para acceder a más funciones.'
              },
              {
                q: language === 'en' ? 'What payment methods do you accept?' : '¿Qué métodos de pago aceptan?',
                a: language === 'en' ? 'We accept all major credit cards including Visa, Mastercard, and American Express, as well as PayPal.' : 'Aceptamos todas las tarjetas de crédito principales incluyendo Visa, Mastercard y American Express, así como PayPal.'
              },
              {
                q: language === 'en' ? 'Can I cancel anytime?' : '¿Puedo cancelar en cualquier momento?',
                a: language === 'en' ? 'Yes, you can cancel your subscription at any time. You will continue to have access until the end of your billing period.' : 'Sí, puedes cancelar tu suscripción en cualquier momento. Continuarás teniendo acceso hasta el final de tu período de facturación.'
              }
            ].map((faq, index) => (
              <div key={index} className="p-6 rounded-2xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow">
                <h3 className="font-semibold mb-3 text-gray-900 flex items-start">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mr-3 mt-0.5">
                    {index + 1}
                  </div>
                  {faq.q}
                </h3>
                <p className="text-sm text-gray-600 pl-9">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center py-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-3xl text-white mb-20">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {language === 'en' ? 'Ready to get started?' : '¿Listo para comenzar?'}
          </h2>
          <p className="text-lg mb-8 max-w-2xl mx-auto text-blue-100">
            {language === 'en' 
              ? 'Join thousands of teams using Statsor to make data-driven decisions.' 
              : 'Únete a miles de equipos que usan Statsor para tomar decisiones basadas en datos.'}
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button 
              onClick={() => handleGetStarted('free')}
              className="bg-white text-blue-600 hover:bg-gray-100 font-semibold py-3 px-8 rounded-xl shadow-lg"
            >
              {language === 'en' ? 'Start Free' : 'Comenzar Gratis'}
            </Button>
            <Button 
              onClick={() => handleGetStarted('pro')}
              className="bg-transparent border-2 border-white text-white hover:bg-white/10 font-semibold py-3 px-8 rounded-xl"
            >
              {language === 'en' ? 'View Pro Plan' : 'Ver Plan Pro'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pricing;