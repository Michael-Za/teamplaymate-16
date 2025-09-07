import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { 
  Bot, 
  Send, 
  Database, 
  BarChart3, 
  Target, 
  Shield, 
  Users, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  Play,
  Pause,
  Square,
  RotateCcw,
  Settings,
  FileText,
  Search,
  Download,
  Copy,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  type?: 'text' | 'analysis' | 'prediction';
  data?: any;
}

interface APIAnalysis {
  endpoint: string;
  method: string;
  responseTime: number;
  statusCode: number;
  dataSize: number;
  errors: number;
  successRate: number;
}

const AIAssistant: React.FC = () => {
  useTheme(); // Just call the hook without destructuring since we don't use the values
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      content: 'Hello! I\'m your AI Bot API Analyzer. I can help you analyze API performance, identify bottlenecks, and optimize your system. What would you like to analyze today?',
      sender: 'ai',
      timestamp: new Date(),
      type: 'text'
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [apiAnalyses, setApiAnalyses] = useState<APIAnalysis[]>([]);
  const [activeTab, setActiveTab] = useState('chat');

  // Mock API analysis data
  useEffect(() => {
    const mockAnalyses: APIAnalysis[] = [
      {
        endpoint: '/api/matches',
        method: 'GET',
        responseTime: 245,
        statusCode: 200,
        dataSize: 2.4,
        errors: 0,
        successRate: 100
      },
      {
        endpoint: '/api/players',
        method: 'POST',
        responseTime: 189,
        statusCode: 201,
        dataSize: 1.8,
        errors: 2,
        successRate: 98
      },
      {
        endpoint: '/api/analytics',
        method: 'GET',
        responseTime: 567,
        statusCode: 200,
        dataSize: 5.2,
        errors: 5,
        successRate: 95
      },
      {
        endpoint: '/api/auth',
        method: 'POST',
        responseTime: 123,
        statusCode: 200,
        dataSize: 0.8,
        errors: 0,
        successRate: 100
      }
    ];
    setApiAnalyses(mockAnalyses);
  }, []);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: inputMessage,
      sender: 'user',
      timestamp: new Date(),
      type: 'text'
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputMessage;
    setInputMessage('');
    setIsLoading(true);

    try {
      // Simulate API analysis
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      let aiResponse = '';
      if (currentInput.toLowerCase().includes('api') || currentInput.toLowerCase().includes('performance')) {
        aiResponse = `I've analyzed your API performance. Here are the key findings:
        
1. **Slowest Endpoint**: /api/analytics (567ms avg response time)
2. **Highest Error Rate**: /api/analytics (5 errors in last 100 requests)
3. **Best Performing**: /api/auth (123ms avg, 100% success rate)

Recommendations:
- Optimize database queries for analytics endpoint
- Implement caching for frequently accessed data
- Add retry mechanism for failed requests`;
      } else {
        aiResponse = `I'm your AI Bot API Analyzer. I can help you with:
        
- API performance analysis
- Bottleneck identification
- Error rate monitoring
- Response time optimization
- Data size reduction strategies

What specific API metrics would you like to analyze?`;
      }

      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: aiResponse,
        sender: 'ai',
        timestamp: new Date(),
        type: 'analysis'
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: 'I apologize, but I\'m experiencing technical difficulties. Please try again in a moment.',
        sender: 'ai',
        timestamp: new Date(),
        type: 'text'
      };
      setMessages(prev => [...prev, errorMessage]);
      toast.error('Connection issue - please try again');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (successRate: number) => {
    if (successRate >= 98) return 'bg-green-100 text-green-800';
    if (successRate >= 95) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getPerformanceColor = (responseTime: number) => {
    if (responseTime <= 200) return 'text-green-600';
    if (responseTime <= 400) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
              <Bot className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                AI Bot API Analyzer
              </h1>
              <p className="text-gray-600">
                Analyze API performance and optimize your system
              </p>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Chat Interface */}
          <div className="lg:col-span-2">
            <Card className="bg-white border-gray-200">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>API Analysis Chat</span>
                  <Badge className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                    AI Powered
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="h-96 overflow-y-auto space-y-4 p-4 bg-gray-50 rounded-lg">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            message.sender === 'user'
                              ? 'bg-blue-500 text-white'
                              : 'bg-gray-200 text-gray-900'
                          }`}
                        >
                          <p className="text-sm">{message.content}</p>
                          <p className="text-xs mt-1 text-gray-500">
                            {message.timestamp.toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))}
                    {isLoading && (
                      <div className="flex justify-start">
                        <div className="bg-gray-200 text-gray-900 px-4 py-2 rounded-lg">
                          <div className="flex items-center space-x-2">
                            <div className="flex space-x-1">
                              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                            </div>
                            <span className="text-sm text-gray-600">AI is analyzing...</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex space-x-2">
                    <Textarea
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      placeholder="Ask about API performance, bottlenecks, or optimization..."
                      className="flex-1 border-gray-200 focus:border-blue-500"
                      disabled={isLoading}
                      onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                    />
                    <Button 
                      onClick={handleSendMessage}
                      className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
                      disabled={isLoading || !inputMessage.trim()}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* API Analytics Dashboard */}
          <div>
            <Card className="bg-white border-gray-200">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2 text-blue-500" />
                  API Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {apiAnalyses.map((analysis, index) => (
                    <div key={index} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center space-x-2">
                            <Badge 
                              className={`${
                                analysis.method === 'GET' ? 'bg-green-100 text-green-800' :
                                analysis.method === 'POST' ? 'bg-blue-100 text-blue-800' :
                                'bg-purple-100 text-purple-800'
                              }`}
                            >
                              {analysis.method}
                            </Badge>
                            <span className="font-medium text-sm">{analysis.endpoint}</span>
                          </div>
                          <div className="flex items-center space-x-4 mt-2 text-sm">
                            <span className={getPerformanceColor(analysis.responseTime)}>
                              {analysis.responseTime}ms
                            </span>
                            <span>{analysis.dataSize}KB</span>
                            <Badge className={getStatusColor(analysis.successRate)}>
                              {analysis.successRate}%
                            </Badge>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">{analysis.errors} errors</div>
                          <div className="text-xs text-gray-500">last 100 reqs</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 pt-4 border-t border-gray-200">
                  <h3 className="font-semibold mb-3">Quick Actions</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <Button size="sm" variant="outline" className="text-xs">
                      <Target className="h-3 w-3 mr-1" />
                      Optimize
                    </Button>
                    <Button size="sm" variant="outline" className="text-xs">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Diagnose
                    </Button>
                    <Button size="sm" variant="outline" className="text-xs">
                      <Database className="h-3 w-3 mr-1" />
                      Cache
                    </Button>
                    <Button size="sm" variant="outline" className="text-xs">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      Scale
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* API Insights */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8"
        >
          <Card className="bg-white border-gray-200">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Database className="h-5 w-5 mr-2 text-purple-500" />
                API Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center">
                    <CheckCircle className="h-8 w-8 text-green-500 mr-3" />
                    <div>
                      <p className="text-2xl font-bold text-green-700">98%</p>
                      <p className="text-sm text-green-600">Success Rate</p>
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center">
                    <TrendingUp className="h-8 w-8 text-blue-500 mr-3" />
                    <div>
                      <p className="text-2xl font-bold text-blue-700">245ms</p>
                      <p className="text-sm text-blue-600">Avg Response</p>
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <div className="flex items-center">
                    <Users className="h-8 w-8 text-purple-500 mr-3" />
                    <div>
                      <p className="text-2xl font-bold text-purple-700">1.2M</p>
                      <p className="text-sm text-purple-600">Requests/day</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default AIAssistant;