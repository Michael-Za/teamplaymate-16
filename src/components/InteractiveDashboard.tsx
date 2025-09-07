import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { 
  Trophy, 
  Target, 
  TrendingUp, 
  Users,
  Play,
  Pause,
  RotateCcw,
  Timer,
  Plus,
  Minus,
  Goal,
  UserX,
  MapPin,
  BarChart3,
  Activity,
  Award,
  Settings,
  Shield,
  Bot,
  BookOpen
} from 'lucide-react';

// Match Timer Component
const MatchTimer: React.FC = () => {
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const { theme, isHighContrast } = useTheme();
  const { language } = useLanguage();

  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    if (isRunning && !isPaused) {
      intervalId = setInterval(() => setTime(time => time + 1), 1000);
    }
    return () => clearInterval(intervalId);
  }, [isRunning, isPaused]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startTimer = () => {
    setIsRunning(true);
    setIsPaused(false);
  };

  const pauseTimer = () => {
    setIsPaused(!isPaused);
  };

  const resetTimer = () => {
    setTime(0);
    setIsRunning(false);
    setIsPaused(false);
  };

  return (
    <Card className={`glass-card animate-fade-in hover-lift ${
      theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
    }`}>
      <CardHeader>
        <CardTitle className="text-center gradient-text-primary animate-soft-pulse">
          {language === 'en' ? 'Match Timer' : 'Cronómetro'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center">
          <div className="text-4xl font-bold mb-4 font-mono text-glow animate-breathe">
            {formatTime(time)}
          </div>
          <div className="flex justify-center space-x-2">
            <Button
              onClick={startTimer}
              disabled={isRunning && !isPaused}
              size="sm"
              className="glass-button hover-glow focus-glow"
            >
              <Play className="w-4 h-4" />
            </Button>
            <Button
              onClick={pauseTimer}
              disabled={!isRunning}
              size="sm"
              className="glass-button hover-glow focus-glow"
              variant="outline"
            >
              <Pause className="w-4 h-4" />
            </Button>
            <Button
              onClick={resetTimer}
              size="sm"
              className="glass-button hover-glow focus-glow"
              variant="outline"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Team Score Component
const TeamScore: React.FC<{ teamName: string; color: string }> = ({ teamName, color }) => {
  const [score, setScore] = useState(0);
  const { theme, isHighContrast } = useTheme();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      setMousePosition({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
  };

  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => {
    setIsHovered(false);
    setMousePosition({ x: 0, y: 0 });
  };

  const tiltX = isHovered ? (mousePosition.y - 120) / 10 : 0;
  const tiltY = isHovered ? (mousePosition.x - 120) / -10 : 0;

  return (
    <motion.div
      ref={cardRef}
      animate={{
        rotateX: tiltX,
        rotateY: tiltY,
        z: isHovered ? 20 : 0,
        scale: isHovered ? 1.02 : 1
      }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 20
      }}
      style={{
        transformStyle: 'preserve-3d',
        perspective: 1000
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="cursor-pointer relative"
    >
      {/* 3D Cursor Follower */}
      <motion.div
        className="absolute pointer-events-none z-10"
        animate={{
          x: mousePosition.x - 8,
          y: mousePosition.y - 8,
          opacity: isHovered ? 1 : 0
        }}
        transition={{ type: "spring", stiffness: 500, damping: 28 }}
      >
        <div className="w-4 h-4 rounded-full bg-primary/40 blur-sm" />
      </motion.div>

      {/* Interactive Light Effect */}
      <motion.div
        className="absolute inset-0 pointer-events-none rounded-lg"
        style={{
          background: isHovered 
            ? `radial-gradient(300px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(255,255,255,0.1), transparent 40%)`
            : 'none'
        }}
      />

      <Card className="glass-card relative overflow-hidden animate-slide-in-up hover-lift">
        <CardContent className="p-6">
          <div className="text-center">
            <motion.div 
              className={`w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center ${
                isHighContrast ? 'bg-black border-2 border-black' : color
              }`}
              animate={{
                scale: isHovered ? 1.1 : 1,
                rotateY: isHovered ? 15 : 0,
                z: isHovered ? 15 : 0
              }}
              transition={{ duration: 0.3 }}
              style={{ transformStyle: 'preserve-3d' }}
            >
              <Trophy className="w-8 h-8 text-white" />
            </motion.div>
            <motion.h3 
              className="font-bold text-lg mb-2 gradient-text-subtle"
              animate={{
                x: isHovered ? 2 : 0,
                z: isHovered ? 10 : 0
              }}
              transition={{ duration: 0.3 }}
              style={{ transformStyle: 'preserve-3d' }}
            >
              {teamName}
            </motion.h3>
            <motion.div 
              className="text-3xl font-bold mb-4 text-glow animate-breathe"
              animate={{
                scale: isHovered ? 1.05 : 1,
                z: isHovered ? 15 : 0
              }}
              transition={{ duration: 0.3 }}
              style={{ transformStyle: 'preserve-3d' }}
            >
              {score}
            </motion.div>
            <div className="flex justify-center space-x-2">
              <Button
                onClick={() => setScore(score + 1)}
                size="sm"
                className="glass-button hover-glow focus-glow animate-gentle-float"
              >
                <Plus className="w-4 h-4" />
              </Button>
              <Button
                onClick={() => setScore(Math.max(0, score - 1))}
                size="sm"
                className="glass-button hover-glow focus-glow animate-gentle-float"
                variant="outline"
              >
                <Minus className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

// Action Buttons Component
const ActionButtons: React.FC = () => {
  const { theme, isHighContrast } = useTheme();
  const { language } = useLanguage();
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [hoveredAction, setHoveredAction] = useState<string | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      setMousePosition({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
  };

  const handleMouseEnter = () => {};
  const handleMouseLeave = () => {
    setHoveredAction(null);
    setMousePosition({ x: 0, y: 0 });
  };

  const actions = [
    { id: 'goal_favor', label: language === 'en' ? 'Goal For' : 'Gol a Favor', color: isHighContrast ? 'hc-button-primary' : 'bg-green-500', icon: Goal },
    { id: 'goal_against', label: language === 'en' ? 'Goal Against' : 'Gol en Contra', color: isHighContrast ? 'hc-button-primary' : 'bg-red-500', icon: Goal },
    { id: 'assist', label: language === 'en' ? 'Assist' : 'Asistencia', color: isHighContrast ? 'hc-button-primary' : 'bg-blue-500', icon: Target },
    { id: 'foul_favor', label: language === 'en' ? 'Foul For' : 'Falta a Favor', color: isHighContrast ? 'hc-button-secondary' : 'bg-yellow-500', icon: UserX },
    { id: 'foul_against', label: language === 'en' ? 'Foul Against' : 'Falta en Contra', color: isHighContrast ? 'hc-button-secondary' : 'bg-orange-500', icon: UserX },
    { id: 'shot_goal', label: language === 'en' ? 'Shot on Goal' : 'Tiro a Portería', color: isHighContrast ? 'hc-button-primary' : 'bg-purple-500', icon: Activity },
    { id: 'shot_out', label: language === 'en' ? 'Shot Out' : 'Tiro Fuera', color: isHighContrast ? 'hc-button-secondary' : 'bg-gray-500', icon: Activity },
    { id: 'corner_favor', label: language === 'en' ? 'Corner For' : 'Corner a Favor', color: isHighContrast ? 'hc-button-primary' : 'bg-teal-500', icon: MapPin },
    { id: 'corner_against', label: language === 'en' ? 'Corner Against' : 'Corner en Contra', color: isHighContrast ? 'hc-button-secondary' : 'bg-pink-500', icon: MapPin },
    { id: 'offside', label: language === 'en' ? 'Offside' : 'Fuera de Juego', color: isHighContrast ? 'hc-button-secondary' : 'bg-indigo-500', icon: UserX },
    { id: 'penalty_favor', label: language === 'en' ? 'Penalty For' : 'Penalty a Favor', color: isHighContrast ? 'hc-button-primary' : 'bg-green-600', icon: Award },
    { id: 'penalty_against', label: language === 'en' ? 'Penalty Against' : 'Penalty en Contra', color: isHighContrast ? 'hc-button-primary' : 'bg-red-600', icon: Award }
  ];

  const handleActionClick = (actionId: string) => {
    setSelectedAction(actionId);
    
    // Show toast notification for the action
    const actionLabel = actions.find(a => a.id === actionId)?.label || actionId;
    toast.success(`${actionLabel} registered!`, {
      duration: 2000,
      position: 'top-right'
    });
    
    // Store action in localStorage for persistence
    const existingActions = JSON.parse(localStorage.getItem('match_actions') || '[]');
    const newAction = {
      id: Date.now(),
      type: actionId,
      label: actionLabel,
      timestamp: new Date().toISOString(),
      minute: Math.floor(Math.random() * 90) + 1 // Mock minute for demo
    };
    existingActions.push(newAction);
    localStorage.setItem('match_actions', JSON.stringify(existingActions));
    
    // Add haptic feedback simulation
    setTimeout(() => setSelectedAction(null), 200);
  };

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="relative"
    >
      {/* 3D Cursor Follower */}
      <motion.div
        className="absolute pointer-events-none z-20"
        animate={{
          x: mousePosition.x - 6,
          y: mousePosition.y - 6,
          opacity: hoveredAction ? 1 : 0
        }}
        transition={{ type: "spring", stiffness: 500, damping: 28 }}
      >
        <div className="w-3 h-3 rounded-full bg-primary/50 blur-sm" />
      </motion.div>

      {/* Interactive Light Effect */}
      <motion.div
        className="absolute inset-0 pointer-events-none rounded-lg"
        style={{
          background: hoveredAction 
            ? `radial-gradient(200px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(255,255,255,0.08), transparent 40%)`
            : 'none'
        }}
      />

      <Card className={`relative overflow-hidden ${
        isHighContrast ? 'hc-card' :
        theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      }`}>
        <CardHeader>
          <CardTitle>
            {language === 'en' ? 'Actions' : 'Acciones'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-2">
            {actions.map((action) => {
              const isHovered = hoveredAction === action.id;
              return (
                <motion.div
                  key={action.id}
                  whileHover={{ 
                    scale: 1.05,
                    rotateX: 5,
                    rotateY: 5,
                    z: 10
                  }}
                  whileTap={{ scale: 0.95 }}
                  animate={{
                    scale: selectedAction === action.id ? 0.95 : 1,
                  }}
                  onMouseEnter={() => setHoveredAction(action.id)}
                  onMouseLeave={() => setHoveredAction(null)}
                  style={{
                    transformStyle: 'preserve-3d',
                    perspective: 1000
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 20
                  }}
                >
                  <Button
                    onClick={() => handleActionClick(action.id)}
                    variant={isHighContrast ? undefined : "outline"}
                    className={`w-full h-16 flex flex-col items-center justify-center text-xs p-2 ${
                      isHighContrast ? action.color : `${action.color} text-white border-none hover:opacity-80`
                    } transition-all duration-200 relative overflow-hidden`}
                  >
                    <motion.div
                      animate={{
                        scale: isHovered ? 1.1 : 1,
                        z: isHovered ? 5 : 0
                      }}
                      transition={{ duration: 0.2 }}
                      style={{ transformStyle: 'preserve-3d' }}
                    >
                      <action.icon className="w-4 h-4 mb-1" />
                    </motion.div>
                    <motion.span 
                      className="text-center leading-tight"
                      animate={{
                        y: isHovered ? -1 : 0,
                        z: isHovered ? 3 : 0
                      }}
                      transition={{ duration: 0.2 }}
                      style={{ transformStyle: 'preserve-3d' }}
                    >
                      {action.label}
                    </motion.span>
                  </Button>
                </motion.div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

// Player Field Component
const PlayerField: React.FC = () => {
  const { theme, isHighContrast } = useTheme();
  const { language } = useLanguage();
  
  const players = [
    { name: 'Pablo', position: 'GK', jersey: '1' },
    { name: 'Lean', position: 'DEF', jersey: '2' },
    { name: 'Adrián', position: 'DEF', jersey: '3' },
    { name: 'Julio', position: 'MID', jersey: '4' },
    { name: 'Luis', position: 'MID', jersey: '5' },
    { name: 'Nil', position: 'FWD', jersey: '6' },
    { name: 'Roberto', position: 'FWD', jersey: '7' },
    { name: 'Pol', position: 'SUB', jersey: '8' }
  ];

  return (
    <Card className={`${
      isHighContrast ? 'hc-card' :
      theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
    }`}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{language === 'en' ? 'Players' : 'Jugadores'}</span>
          <Button size="sm" className="bg-green-600 hover:bg-green-700">
            <Plus className="w-4 h-4 mr-1" />
            {language === 'en' ? 'Add' : 'Agregar'}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2">
          {players.map((player, index) => (
            <motion.div
              key={player.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`p-3 rounded-lg border flex items-center space-x-3 ${
                isHighContrast ? 'border-black bg-white' :
                theme === 'dark' ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-gray-50'
              } ${player.position === 'SUB' ? 'opacity-50' : ''}`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                isHighContrast ? 'bg-black text-white border-2 border-black' :
                player.position === 'GK' ? 'bg-yellow-500 text-white' :
                player.position === 'DEF' ? 'bg-blue-500 text-white' :
                player.position === 'MID' ? 'bg-green-500 text-white' :
                player.position === 'FWD' ? 'bg-red-500 text-white' : 'bg-gray-500 text-white'
              }`}>
                {player.jersey}
              </div>
              <div className="flex-1">
                <div className={`font-semibold text-sm ${
                  isHighContrast ? 'text-black' : ''
                }`}>{player.name}</div>
                <div className={`text-xs ${
                  isHighContrast ? 'text-black opacity-70' : 'opacity-70'
                }`}>{player.position}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export const InteractiveDashboard: React.FC = () => {
  const { theme, isHighContrast } = useTheme();
  const { language } = useLanguage();
  const { user } = useAuth();
  const [evolutionData, setEvolutionData] = useState([
    { partido: 1, victories: 0, points: 0 },
    { partido: 2, victories: 50, points: 1 },
    { partido: 3, victories: 100, points: 3 },
    { partido: 4, victories: 25, points: 1 },
    { partido: 5, victories: 100, points: 3 },
    { partido: 6, victories: 100, points: 3 }
  ]);

  const playersData = [
    { name: 'Fernando Torres', position: 'DEL', minutes: 480, goals: 5, assists: 3, fitness: 8, shots: 12, cards: 2, fitCom: 2 },
    { name: 'Pablo Sánchez', position: 'CEN', minutes: 465, goals: 2, assists: 6, fitness: 6, shots: 8, cards: 2, fitCom: 4 },
    { name: 'Juan Pérez', position: 'DEL', minutes: 420, goals: 3, assists: 2, fitness: 6, shots: 10, cards: 1, fitCom: 3 },
    { name: 'Miguel Rodríguez', position: 'CEN', minutes: 390, goals: 1, assists: 4, fitness: 3, shots: 6, cards: 3, fitCom: 5 },
    { name: 'David González', position: 'DEF', minutes: 480, goals: 1, assists: 0, fitness: 2, shots: 3, cards: 1, fitCom: 8 }
  ];

  return (
    <div className={`min-h-screen transition-all duration-500 ${
      isHighContrast ? 'hc-dashboard' :
      theme === 'dark' 
        ? 'bg-white text-gray-900' 
        : 'bg-white text-gray-900'
    }`}>
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className={`text-3xl font-bold mb-2 ${
            isHighContrast ? 'text-black' : ''
          }`}>
            Home
          </h1>
        </motion.div>

        {/* Stats Cards - Made all cards the same size with standardized font sizes */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="h-full">
            <Card className="bg-blue-500 text-white border-0 h-full flex flex-col">
              <CardContent className="p-6 flex flex-col flex-grow">
                <div className="flex items-center justify-between flex-grow">
                  <div>
                    <p className="text-blue-100 text-sm font-medium">Points</p>
                    <p className="text-3xl font-bold mt-1">24</p>
                    <p className="text-blue-100 text-xs mt-1">Temporada actual</p>
                  </div>
                  <Trophy className="h-12 w-12 text-blue-200" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="h-full">
            <Card className="bg-green-500 text-white border-0 h-full flex flex-col">
              <CardContent className="p-6 flex flex-col flex-grow">
                <div className="flex items-center justify-between flex-grow">
                  <div>
                    <p className="text-green-100 text-sm font-medium">Último Resultado</p>
                    <p className="text-lg font-bold mt-1">CD Statsor 5-3 Jaén</p>
                    <p className="text-green-100 text-xs mt-1">hace 3 días</p>
                  </div>
                  <Target className="h-12 w-12 text-green-200" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="h-full">
            <Card className="bg-purple-500 text-white border-0 h-full flex flex-col">
              <CardContent className="p-6 flex flex-col flex-grow">
                <div className="flex items-center justify-between flex-grow">
                  <div>
                    <p className="text-purple-100 text-sm font-medium">% Victories</p>
                    <p className="text-3xl font-bold mt-1">66.7%</p>
                    <p className="text-purple-100 text-xs mt-1">6 de 12 partidos</p>
                  </div>
                  <TrendingUp className="h-12 w-12 text-purple-200" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="h-full">
            <Card className="bg-orange-500 text-white border-0 h-full flex flex-col">
              <CardContent className="p-6 flex flex-col flex-grow">
                <div className="flex items-center justify-between flex-grow">
                  <div>
                    <p className="text-orange-100 text-sm font-medium">Season - Jaén</p>
                    <p className="text-lg font-bold mt-1">Age</p>
                    <p className="text-orange-100 text-xs mt-1">División</p>
                  </div>
                  <Users className="h-12 w-12 text-orange-200" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Evolution Chart and Players Table - Expanded to full width for better visibility */}
        <div className="grid grid-cols-1 gap-8 mb-8">
          {/* Evolution Chart - Now takes full width */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}>
            <Card className={`${
              isHighContrast ? 'hc-card' :
              theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            }`}>
              <CardHeader>
                <CardTitle>Evolution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80 relative"> {/* Increased height for better visibility */}
                  <svg className="w-full h-full" viewBox="0 0 400 200">
                    <defs>
                      <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.1" />
                      </linearGradient>
                      <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.8" />
                        <stop offset="100%" stopColor="#8b5cf6" stopOpacity="1" />
                      </linearGradient>
                    </defs>
                    {/* Smooth path for the line with distinct colors - increased strokeWidth for smoother line */}
                    <path
                      d="M 50 150 C 100 100, 150 50, 200 25 S 300 50, 350 150"
                      stroke="url(#lineGradient)"
                      strokeWidth="6"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    {/* Area fill */}
                    <path
                      d="M 50 150 C 100 100, 150 50, 200 25 S 300 50, 350 150 L 350 180 L 50 180 Z"
                      fill="url(#gradient)"
                    />
                    {/* Data points with clearer visibility - increased radius for clearer points */}
                    {evolutionData.map((point, index) => (
                      <circle
                        key={index}
                        cx={50 + (index * 60)}
                        cy={180 - (point.victories * 1.3)}
                        r="8"
                        fill="#8b5cf6"
                        stroke="white"
                        strokeWidth="4"
                      />
                    ))}
                  </svg>
                  <div className="absolute bottom-4 left-0 right-0 flex justify-between px-12 text-sm text-gray-500">
                    {evolutionData.map((point, index) => (
                      <span key={index}>Partido {point.partido}</span>
                    ))}
                  </div>
                </div>
                {/* Enhanced tooltip information with requested data */}
                <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm"> {/* Increased margin and made responsive */}
                  <div className="p-4 bg-purple-50 rounded-lg"> {/* Increased padding */}
                    <p className="text-purple-600 font-semibold">Partido 6</p>
                    <p className="text-gray-600">% Victories: 100%</p>
                    <p className="text-gray-600">For: 3</p>
                    <p className="text-gray-600">Against: 0</p>
                    <p className="text-gray-600">Points: 3</p>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <p className="text-purple-600 font-semibold">Partido 5</p>
                    <p className="text-gray-600">% Victories: 100%</p>
                    <p className="text-gray-600">For: 4</p>
                    <p className="text-gray-600">Against: 1</p>
                    <p className="text-gray-600">Points: 3</p>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <p className="text-purple-600 font-semibold">Partido 4</p>
                    <p className="text-gray-600">% Victories: 25%</p>
                    <p className="text-gray-600">For: 1</p>
                    <p className="text-gray-600">Against: 3</p>
                    <p className="text-gray-600">Points: 0</p>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <p className="text-purple-600 font-semibold">Partido 3</p>
                    <p className="text-gray-600">% Victories: 100%</p>
                    <p className="text-gray-600">For: 3</p>
                    <p className="text-gray-600">Against: 0</p>
                    <p className="text-gray-600">Points: 3</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Players Table - Now takes full width */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 }}>
            <Card className={`${
              isHighContrast ? 'hc-card' :
              theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            }`}>
              <CardHeader>
                <CardTitle>Players</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3">Player</th> {/* Increased padding */}
                        <th className="text-center py-3">Pos</th>
                        <th className="text-center py-3">Min</th>
                        <th className="text-center py-3">Goals</th>
                        <th className="text-center py-3">Assists</th>
                        <th className="text-center py-3">Fit</th>
                        <th className="text-center py-3">Shots</th>
                        <th className="text-center py-3">Tarj</th>
                        <th className="text-center py-3">Fit Com</th>
                      </tr>
                    </thead>
                    <tbody>
                      {playersData.map((player, index) => (
                        <tr key={index} className="border-b hover:bg-gray-50">
                          <td className="py-3 font-medium">{player.name}</td> {/* Increased padding */}
                          <td className="text-center py-3">
                            <Badge variant="outline" className={`text-xs ${
                              player.position === 'DEL' ? 'bg-red-100 text-red-800' :
                              player.position === 'CEN' ? 'bg-blue-100 text-blue-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {player.position}
                            </Badge>
                          </td>
                          <td className="text-center py-3">{player.minutes}</td>
                          <td className="text-center py-3 font-semibold text-green-600">{player.goals}</td>
                          <td className="text-center py-3 font-semibold text-blue-600">{player.assists}</td>
                          <td className="text-center py-3">{player.fitness}</td>
                          <td className="text-center py-3">{player.shots}</td>
                          <td className="text-center py-3">
                            <Badge variant="outline" className="text-xs bg-yellow-100 text-yellow-800">
                              {player.cards}
                            </Badge>
                          </td>
                          <td className="text-center py-3">{player.fitCom}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Upcoming Matches */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
          <Card className={`${
            isHighContrast ? 'hc-card' :
            theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}>
            <CardHeader>
              <CardTitle>Próximos Partidos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div>
                    <p className="font-semibold">25 Julio 2025</p>
                    <p className="text-sm text-gray-600">CD Statsor vs Jaén FS</p>
                    <p className="text-sm text-gray-500">Pabellón Municipal</p>
                  </div>
                  <Button variant="outline" size="sm">Ver Detalles</Button>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div>
                    <p className="font-semibold">1 Agosto 2025</p>
                    <p className="text-sm text-gray-600">CD Statsor vs Granada CF</p>
                    <p className="text-sm text-gray-500">Estadio Nuevo Los Cármenes</p>
                  </div>
                  <Button variant="outline" size="sm">Ver Detalles</Button>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div>
                    <p className="font-semibold">8 Agosto 2025</p>
                    <p className="text-sm text-gray-600">CD Statsor vs Real Madrid</p>
                    <p className="text-sm text-gray-500">Santiago Bernabéu</p>
                  </div>
                  <Button variant="outline" size="sm">Ver Detalles</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Management Sections Navigation - REMOVED as per user request */}
        
      </div>
    </div>
  );
};