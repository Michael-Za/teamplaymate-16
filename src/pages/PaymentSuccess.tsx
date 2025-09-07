import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, ArrowRight, Home, CreditCard } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { paypalService } from '../services/paypalService';
import { toast } from 'sonner';

const PaymentSuccess: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { theme } = useTheme();
  const [verifying, setVerifying] = useState(true);
  const [paymentVerified, setPaymentVerified] = useState(false);

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        const paymentId = searchParams.get('paymentId');
        const payerId = searchParams.get('PayerID');
        
        if (paymentId) {
          // Verify payment with PayPal service
          const verified = await paypalService.verifyPayment(paymentId);
          
          if (verified) {
            setPaymentVerified(true);
            toast.success(language === 'en' ? 'Payment verified successfully!' : '¡Pago verificado exitosamente!');
          } else {
            toast.error(language === 'en' ? 'Payment verification failed' : 'Verificación de pago fallida');
          }
        }
      } catch (error) {
        console.error('Payment verification error:', error);
        toast.error(language === 'en' ? 'Error verifying payment' : 'Error al verificar el pago');
      } finally {
        setVerifying(false);
      }
    };

    verifyPayment();
  }, [searchParams, language]);

  return (
    <div className={`min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 ${
      theme === 'dark' 
        ? 'bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white' 
        : 'bg-gradient-to-br from-blue-50 via-white to-green-50 text-gray-900'
    }`}>
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full space-y-8"
      >
        <div className="text-center">
          {verifying ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="mx-auto h-16 w-16 rounded-full border-4 border-green-500 border-t-transparent"
            />
          ) : paymentVerified ? (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
              className="mx-auto h-16 w-16 rounded-full bg-green-500 flex items-center justify-center"
            >
              <CheckCircle className="h-8 w-8 text-white" />
            </motion.div>
          ) : (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
              className="mx-auto h-16 w-16 rounded-full bg-red-500 flex items-center justify-center"
            >
              <CreditCard className="h-8 w-8 text-white" />
            </motion.div>
          )}

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-6 text-3xl font-bold"
          >
            {verifying 
              ? (language === 'en' ? 'Verifying Payment...' : 'Verificando Pago...')
              : paymentVerified
                ? (language === 'en' ? 'Payment Successful!' : '¡Pago Exitoso!')
                : (language === 'en' ? 'Payment Failed' : 'Pago Fallido')
            }
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-2 text-sm opacity-70"
          >
            {verifying 
              ? (language === 'en' ? 'Please wait while we verify your payment...' : 'Por favor espera mientras verificamos tu pago...')
              : paymentVerified
                ? (language === 'en' ? 'Your subscription has been activated successfully!' : '¡Tu suscripción ha sido activada exitosamente!')
                : (language === 'en' ? 'There was an issue with your payment. Please try again.' : 'Hubo un problema con tu pago. Por favor, inténtalo de nuevo.')
            }
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-4"
        >
          {!verifying && (
            <>
              <Button
                onClick={() => navigate('/dashboard')}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                <ArrowRight className="w-4 h-4 mr-2" />
                {language === 'en' ? 'Go to Dashboard' : 'Ir al Panel'}
              </Button>
              
              <Button
                onClick={() => navigate('/')}
                variant="outline"
                className="w-full"
              >
                <Home className="w-4 h-4 mr-2" />
                {language === 'en' ? 'Back to Home' : 'Volver al Inicio'}
              </Button>
            </>
          )}
        </motion.div>

        {paymentVerified && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-8 p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
          >
            <h3 className="text-sm font-semibold text-green-800 dark:text-green-200 mb-2">
              {language === 'en' ? 'What happens next?' : '¿Qué pasa ahora?'}
            </h3>
            <ul className="text-sm text-green-700 dark:text-green-300 space-y-1">
              <li>• {language === 'en' ? 'You\'ll receive a confirmation email' : 'Recibirás un email de confirmación'}</li>
              <li>• {language === 'en' ? 'Your subscription is now active' : 'Tu suscripción ya está activa'}</li>
              <li>• {language === 'en' ? 'Access all premium features immediately' : 'Accede a todas las funciones premium inmediatamente'}</li>
            </ul>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default PaymentSuccess; 