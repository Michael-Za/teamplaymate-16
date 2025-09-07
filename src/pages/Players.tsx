import React, { useState } from 'react';
// Removed old Layout to avoid nested dashboards
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogTrigger } from '../components/ui/dialog';
import { ArrowLeft, User, Trophy, Target, Clock, Award, Camera, Upload, X, Maximize2, Plus } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import AddPlayerForm from '../components/AddPlayerForm';
import { PlayerPhotoUpload } from '../components/PlayerPhotoUpload';
import { useLanguage } from '../contexts/LanguageContext';

interface Player {
  id: string;
  number: number;
  name: string;
  nickname?: string;
  position: string;
  age: number;
  nationality: string;
  height?: number;
  weight?: number;
  secondaryPositions?: string[];
  dominantFoot: string;
  birthDate: Date;
  goals: number;
  assists: number;
  games: number;
  yellowCards: number;
  redCards: number;
  minutes: number;
  shots: number;
  shotsOnTarget: number;
  passes: number;
  passAccuracy: number;
  foulsCommitted: number;
  foulsReceived: number;
  ballsLost: number;
  ballsRecovered: number;
  duelsWon: number;
  duelsLost: number;
  crosses: number;
  saves?: number;
  photo?: string;
  shotMap?: { [key: string]: number };
}

const Players = () => {
  const { t } = useLanguage();
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [isAddPlayerFormOpen, setIsAddPlayerFormOpen] = useState(false);
  const [showMoreStats, setShowMoreStats] = useState(false);
  const [modalCard, setModalCard] = useState<'player' | 'performance' | 'stats' | 'shotMap' | null>(null);
  const [performanceFilter, setPerformanceFilter] = useState<'all' | 'home' | 'away'>('all');
  const [showStatsOverlay, setShowStatsOverlay] = useState(false);
  const [photoUploadPlayer, setPhotoUploadPlayer] = useState<Player | null>(null);

  const [players, setPlayers] = useState<Player[]>([
    {
      id: '1',
      number: 9,
      name: 'Fernando Torres',
      position: 'DEL',
      age: 28,
      nationality: 'España',
      dominantFoot: 'derecha',
      birthDate: new Date('1995-03-20'),
      goals: 5,
      assists: 3,
      games: 8,
      yellowCards: 0,
      redCards: 0,
      minutes: 480,
      shots: 12,
      shotsOnTarget: 8,
      passes: 120,
      passAccuracy: 85,
      foulsCommitted: 2,
      foulsReceived: 8,
      ballsLost: 15,
      ballsRecovered: 25,
      duelsWon: 18,
      duelsLost: 7,
      crosses: 5,
      photo: '/placeholder.svg',
      shotMap: { 'top-left': 2, 'top-center': 1, 'top-right': 0, 'middle-left': 0, 'middle-center': 1, 'middle-right': 1, 'bottom-left': 0, 'bottom-center': 0, 'bottom-right': 0 }
    },
    {
      id: '2',
      number: 8,
      name: 'Pablo Sánchez',
      position: 'CEN',
      age: 26,
      nationality: 'España',
      dominantFoot: 'izquierda',
      birthDate: new Date('1997-07-15'),
      goals: 2,
      assists: 6,
      games: 8,
      yellowCards: 2,
      redCards: 0,
      minutes: 465,
      shots: 8,
      shotsOnTarget: 5,
      passes: 180,
      passAccuracy: 92,
      foulsCommitted: 4,
      foulsReceived: 5,
      ballsLost: 12,
      ballsRecovered: 28,
      duelsWon: 22,
      duelsLost: 9,
      crosses: 12,
      photo: '/placeholder.svg',
      shotMap: { 'top-left': 1, 'top-center': 0, 'top-right': 1, 'middle-left': 0, 'middle-center': 0, 'middle-right': 0, 'bottom-left': 0, 'bottom-center': 0, 'bottom-right': 0 }
    },
    {
      id: '3',
      number: 4,
      name: 'Juan Pérez',
      position: 'DEL',
      age: 24,
      nationality: 'Argentina',
      dominantFoot: 'derecha',
      birthDate: new Date('1999-11-10'),
      goals: 3,
      assists: 2,
      games: 7,
      yellowCards: 1,
      redCards: 0,
      minutes: 420,
      shots: 10,
      shotsOnTarget: 6,
      passes: 95,
      passAccuracy: 78,
      foulsCommitted: 3,
      foulsReceived: 6,
      ballsLost: 18,
      ballsRecovered: 20,
      duelsWon: 15,
      duelsLost: 8,
      crosses: 3,
      photo: '/placeholder.svg',
      shotMap: { 'top-left': 0, 'top-center': 1, 'top-right': 1, 'middle-left': 1, 'middle-center': 0, 'middle-right': 0, 'bottom-left': 0, 'bottom-center': 0, 'bottom-right': 0 }
    },
    {
      id: '4',
      number: 1,
      name: 'Alejandro Martínez',
      position: 'POR',
      age: 30,
      nationality: 'España',
      dominantFoot: 'derecha',
      birthDate: new Date('1993-05-12'),
      goals: 0,
      assists: 0,
      games: 8,
      yellowCards: 0,
      redCards: 0,
      minutes: 720,
      shots: 0,
      shotsOnTarget: 0,
      passes: 65,
      passAccuracy: 88,
      foulsCommitted: 1,
      foulsReceived: 2,
      ballsLost: 5,
      ballsRecovered: 8,
      duelsWon: 3,
      duelsLost: 1,
      crosses: 0,
      saves: 15,
      photo: '/placeholder.svg',
      shotMap: { 'top-left': 0, 'top-center': 0, 'top-right': 0, 'middle-left': 0, 'middle-center': 0, 'middle-right': 0, 'bottom-left': 0, 'bottom-center': 0, 'bottom-right': 0 }
    },
    {
      id: '5',
      number: 2,
      name: 'David González',
      position: 'DEF',
      age: 27,
      nationality: 'Brasil',
      dominantFoot: 'izquierda',
      birthDate: new Date('1996-09-08'),
      goals: 1,
      assists: 0,
      games: 8,
      yellowCards: 1,
      redCards: 0,
      minutes: 480,
      shots: 3,
      shotsOnTarget: 1,
      passes: 150,
      passAccuracy: 90,
      foulsCommitted: 8,
      foulsReceived: 2,
      ballsLost: 8,
      ballsRecovered: 35,
      duelsWon: 25,
      duelsLost: 6,
      crosses: 8,
      photo: '/placeholder.svg',
      shotMap: { 'top-left': 0, 'top-center': 0, 'top-right': 0, 'middle-left': 0, 'middle-center': 1, 'middle-right': 0, 'bottom-left': 0, 'bottom-center': 0, 'bottom-right': 0 }
    }
  ]);

  const handleAddPlayer = (newPlayerData: Omit<Player, 'id'>) => {
    const newPlayer: Player = {
      ...newPlayerData,
      id: Date.now().toString() // Simple ID generation
    };
    setPlayers(prev => [...prev, newPlayer]);
  };

  const handlePhotoSave = (playerId: string, photoUrl: string) => {
    setPlayers(prev => prev.map(player => 
      player.id === playerId ? { ...player, photo: photoUrl } : player
    ));
    setPhotoUploadPlayer(null);
  };
  const renderPlayerDetail = () => {
    if (!selectedPlayer) return null;

    // Datos de performance simulados por partido (últimos partidos)
    const allPerformanceData = [
      { match: 'vs Real', date: '12 Dic', score: 5.5, rival: 'Real Madrid', location: 'away' },
      { match: 'vs Arsenal', date: '17 Dic', score: 8.5, rival: 'Arsenal', location: 'home' },
      { match: 'vs Wolves', date: '25 Dic', score: 9.5, rival: 'Wolverhampton', location: 'away' },
      { match: 'vs West Ham', date: '29 Dic', score: 6.8, rival: 'West Ham', location: 'home' },
      { match: 'vs Aston Villa', date: '4 Ene', score: 7.8, rival: 'Aston Villa', location: 'away' },
      { match: 'vs Brighton', date: '8 Ene', score: 8.5, rival: 'Brighton', location: 'home' },
      { match: 'vs Fulham', date: '15 Ene', score: 6.5, rival: 'Fulham', location: 'away' },
      { match: 'vs Man City', date: '29 Ene', score: 5.5, rival: 'Manchester City', location: 'home' },
      { match: 'vs Everton', date: '6 Feb', score: 6.5, rival: 'Everton', location: 'away' },
      { match: 'vs Sheffield', date: '17 Feb', score: 9.5, rival: 'Sheffield United', location: 'home' },
      { match: 'vs Chelsea', date: '24 Feb', score: 6.8, rival: 'Chelsea', location: 'away' }
    ];

    const performanceData = performanceFilter === 'all' 
      ? allPerformanceData 
      : allPerformanceData.filter(match => match.location === performanceFilter);

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button
            onClick={() => setSelectedPlayer(null)}
            variant="outline"
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t('players.back')}</span>
          </Button>
        </div>

        {/* Main Layout: Corrected structure as per mockup */}
        <div className="grid grid-cols-12 gap-6 h-[700px]">
          
          {/* LEFT: Player Card (Full height, spans 3 columns) */}
          <div className="col-span-3 h-full">
            <Card 
              className="p-6 bg-white text-gray-900 h-full cursor-pointer hover:shadow-xl transition-all duration-300 group relative flex flex-col"
              onClick={() => setModalCard('player')}
            >
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <Maximize2 className="w-4 h-4 text-gray-600" />
              </div>
              
              {/* Player Photo */}
              <div className="relative mx-auto mb-6">
                {selectedPlayer.photo ? (
                  <img 
                    src={selectedPlayer.photo} 
                    alt={selectedPlayer.name}
                    className="w-32 h-32 rounded-xl object-cover border-4 border-green-200"
                  />
                ) : (
                  <div className="w-32 h-32 bg-gradient-to-br from-green-600 to-green-800 rounded-xl flex items-center justify-center text-white text-3xl font-bold border-4 border-green-200">
                    {selectedPlayer.number}
                  </div>
                )}
                <button className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-600 rounded-full border-2 border-white flex items-center justify-center hover:bg-green-700 shadow-lg transition-colors">
                  <Camera 
                    className="w-4 h-4 text-white" 
                    onClick={(e) => {
                      e.stopPropagation();
                      setPhotoUploadPlayer(selectedPlayer);
                    }}
                  />
                </button>
              </div>

              {/* Player Name & Position */}
              <div className="text-center space-y-3 mb-6">
                <h1 className="text-2xl font-bold text-gray-900">{selectedPlayer.name}</h1>
                <div className="flex items-center justify-center space-x-2 text-gray-600">
                  <span className="text-sm">🏴</span>
                  <span className="text-sm font-medium">{selectedPlayer.position}</span>
                </div>
              </div>

              {/* Key Stats */}
              <div className="space-y-4 pt-4 border-t border-gray-200 flex-1">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 text-sm">{t('players.position')}</span>
                  <span className="font-bold text-gray-900">{selectedPlayer.position}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 text-sm">{t('players.games')}</span>
                  <span className="font-bold text-gray-900">{selectedPlayer.games}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 text-sm">{t('players.goals')}</span>
                  <span className="font-bold text-green-600">{selectedPlayer.goals}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 text-sm">{t('players.assists')}</span>
                  <span className="font-bold text-blue-600">{selectedPlayer.assists}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 text-sm">{t('players.minutes')}</span>
                  <span className="font-bold text-gray-900">{selectedPlayer.minutes}</span>
                </div>
              </div>
            </Card>
          </div>

          {/* RIGHT SIDE: Two rows */}
          <div className="col-span-9 h-full flex flex-col gap-6">
            
            {/* TOP ROW: Performance Chart (full width) */}
            <div className="h-1/2">
              <Card 
                className="p-6 h-full cursor-pointer hover:shadow-xl transition-all duration-300 group relative"
                onClick={() => setModalCard('performance')}
              >
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Maximize2 className="w-4 h-4 text-gray-600" />
                </div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold">{t('players.performance')}</h3>
                  <div className="flex space-x-1">
                    <button 
                      className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                        performanceFilter === 'all' 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setPerformanceFilter('all');
                      }}
                    >
                      All
                    </button>
                    <button 
                      className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                        performanceFilter === 'home' 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setPerformanceFilter('home');
                      }}
                    >
                      At home
                    </button>
                    <button 
                      className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                        performanceFilter === 'away' 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setPerformanceFilter('away');
                      }}
                    >
                      Away
                    </button>
                  </div>
                </div>
                
                <div className="h-[calc(100%-80px)]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={performanceData} margin={{ top: 10, right: 10, left: 10, bottom: 40 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fontSize: 10 }}
                        interval={0}
                        angle={-45}
                        textAnchor="end"
                        height={40}
                      />
                      <YAxis 
                        domain={[0, 10]}
                        tick={{ fontSize: 10 }}
                      />
                      <Tooltip 
                        formatter={(value) => [`${value}/10`, 'Nota']}
                        labelFormatter={(label, payload) => {
                          if (payload && payload[0]) {
                            const data = payload[0].payload;
                            return `${data.rival} - ${data.date}`;
                          }
                          return label;
                        }}
                        contentStyle={{
                          backgroundColor: '#1f2937',
                          border: 'none',
                          borderRadius: '8px',
                          color: 'white'
                        }}
                      />
                      <Bar 
                        dataKey="score" 
                        fill="#f97316"
                        radius={[4, 4, 0, 0]}
                        maxBarSize={15}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </div>

            {/* BOTTOM ROW: Shot Map and Statistics side by side */}
            <div className="h-1/2 grid grid-cols-2 gap-6">
              
              {/* Shot Map (left) */}
              <Card 
                className="p-6 bg-blue-50 cursor-pointer hover:shadow-xl transition-all duration-300 group relative h-full"
                onClick={() => setModalCard('shotMap')}
              >
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Maximize2 className="w-4 h-4 text-blue-600" />
                </div>
                <h3 className="text-lg font-bold mb-6 text-blue-900">{t('players.shot.map')}</h3>
                  
                <div className="flex justify-center mb-4">
                  <div className="border border-blue-400 rounded-lg p-4 bg-white">
                    <div className="grid grid-cols-3 gap-2 w-48 h-32">
                      {Object.entries(selectedPlayer.shotMap || {}).map(([zone, goals]) => (
                        <div
                          key={zone}
                          className="bg-white border border-blue-400 rounded flex items-center justify-center text-lg font-bold text-blue-700 hover:bg-blue-50 transition-colors"
                        >
                          {goals}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                  
                <p className="text-center text-xs text-blue-600">
                  Goles por zona de la portería
                </p>
              </Card>

              {/* Statistics (right) */}
              <Card 
                className="p-6 cursor-pointer hover:shadow-xl transition-all duration-300 group relative h-full flex flex-col"
                onClick={() => setModalCard('stats')}
              >
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Maximize2 className="w-4 h-4 text-gray-600" />
                </div>
                <h3 className="text-lg font-bold mb-6">{t('players.general.stats')}</h3>
                  
                {/* Only 3 Main Stats */}
                <div className="space-y-4 flex-1">
                  <div className="flex justify-between items-center py-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Clock className="w-3 h-3 text-blue-600" />
                      </div>
                      <span className="text-gray-600 text-sm">Minutos jugados</span>
                    </div>
                    <span className="font-bold text-lg">{selectedPlayer.minutes}</span>
                  </div>
                  
                  <div className="flex justify-between items-center py-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-green-100 rounded-lg flex items-center justify-center">
                        <Target className="w-3 h-3 text-green-600" />
                      </div>
                      <span className="text-gray-600 text-sm">Tiros a portería</span>
                    </div>
                    <span className="font-bold text-lg">{selectedPlayer.shotsOnTarget}</span>
                  </div>
                  
                  <div className="flex justify-between items-center py-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-red-100 rounded-lg flex items-center justify-center">
                        <Target className="w-3 h-3 text-red-600" />
                      </div>
                      <span className="text-gray-600 text-sm">Tiros fuera</span>
                    </div>
                    <span className="font-bold text-lg">{selectedPlayer.shots - selectedPlayer.shotsOnTarget}</span>
                  </div>
                </div>

                {/* Show More Button - Opens Overlay */}
                <Button
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowStatsOverlay(true);
                  }}
                  className="w-full mt-4 border-gray-300 hover:bg-gray-50 text-xs"
                >
                  {t('players.more.stats')}
                </Button>
              </Card>
            </div>
          </div>
        </div>

        {/* Stats Overlay - Large square overlay for all stats */}
        {showStatsOverlay && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg p-8 max-w-4xl w-full max-h-[80vh] overflow-y-auto relative">
              <button 
                onClick={() => setShowStatsOverlay(false)}
                className="absolute top-4 right-4 z-10 p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              
              <h2 className="text-3xl font-bold mb-8">Estadísticas Completas - {selectedPlayer.name}</h2>
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-blue-600">Estadísticas Ofensivas</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between p-4 bg-gray-50 rounded-lg">
                      <span>Goles</span>
                      <span className="font-bold text-green-600">{selectedPlayer.goals}</span>
                    </div>
                    <div className="flex justify-between p-4 bg-gray-50 rounded-lg">
                      <span>Asistencias</span>
                      <span className="font-bold text-blue-600">{selectedPlayer.assists}</span>
                    </div>
                    <div className="flex justify-between p-4 bg-gray-50 rounded-lg">
                      <span>Tiros</span>
                      <span className="font-bold">{selectedPlayer.shots}</span>
                    </div>
                    <div className="flex justify-between p-4 bg-gray-50 rounded-lg">
                      <span>Tiros a portería</span>
                      <span className="font-bold">{selectedPlayer.shotsOnTarget}</span>
                    </div>
                    <div className="flex justify-between p-4 bg-gray-50 rounded-lg">
                      <span>Centros</span>
                      <span className="font-bold">{selectedPlayer.crosses}</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-purple-600">Estadísticas Defensivas</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between p-4 bg-gray-50 rounded-lg">
                      <span>Duelos ganados</span>
                      <span className="font-bold">{selectedPlayer.duelsWon}</span>
                    </div>
                    <div className="flex justify-between p-4 bg-gray-50 rounded-lg">
                      <span>Duelos perdidos</span>
                      <span className="font-bold">{selectedPlayer.duelsLost}</span>
                    </div>
                    <div className="flex justify-between p-4 bg-gray-50 rounded-lg">
                      <span>Balones recuperados</span>
                      <span className="font-bold">{selectedPlayer.ballsRecovered}</span>
                    </div>
                    <div className="flex justify-between p-4 bg-gray-50 rounded-lg">
                      <span>Balones perdidos</span>
                      <span className="font-bold">{selectedPlayer.ballsLost}</span>
                    </div>
                    <div className="flex justify-between p-4 bg-gray-50 rounded-lg">
                      <span>Precisión de pases</span>
                      <span className="font-bold">{selectedPlayer.passAccuracy}%</span>
                    </div>
                  </div>
                </div>
                <div className="col-span-2 space-y-6">
                  <h3 className="text-xl font-bold text-orange-600">Disciplina</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex justify-between p-4 bg-gray-50 rounded-lg">
                      <span>Tarjetas amarillas</span>
                      <span className="font-bold text-yellow-600">{selectedPlayer.yellowCards}</span>
                    </div>
                    <div className="flex justify-between p-4 bg-gray-50 rounded-lg">
                      <span>Tarjetas rojas</span>
                      <span className="font-bold text-red-600">{selectedPlayer.redCards}</span>
                    </div>
                    <div className="flex justify-between p-4 bg-gray-50 rounded-lg">
                      <span>Faltas cometidas</span>
                      <span className="font-bold">{selectedPlayer.foulsCommitted}</span>
                    </div>
                    <div className="flex justify-between p-4 bg-gray-50 rounded-lg">
                      <span>Faltas recibidas</span>
                      <span className="font-bold">{selectedPlayer.foulsReceived}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modals for expanded views */}
        <Dialog open={modalCard !== null} onOpenChange={() => setModalCard(null)}>
          <DialogContent className="max-w-6xl w-[90vw] h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setModalCard(null)}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            
            {modalCard === 'player' && (
              <div className="bg-gradient-to-b from-gray-900 to-gray-800 text-white p-8 rounded-lg">
                <div className="text-center space-y-6">
                  <div className="relative mx-auto w-64 h-64">
                    {selectedPlayer.photo ? (
                      <img 
                        src={selectedPlayer.photo} 
                        alt={selectedPlayer.name}
                        className="w-64 h-64 rounded-xl object-cover border-4 border-white/20"
                      />
                    ) : (
                      <div className="w-64 h-64 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl flex items-center justify-center text-white text-8xl font-bold border-4 border-white/20">
                        {selectedPlayer.number}
                      </div>
                    )}
                  </div>
                  <h1 className="text-5xl font-bold">{selectedPlayer.name}</h1>
                  <div className="text-2xl text-white/80">{selectedPlayer.position}</div>
                  <div className="grid grid-cols-3 gap-8 mt-8 text-center">
                    <div>
                      <div className="text-3xl font-bold">{selectedPlayer.games}</div>
                      <div className="text-white/70">Partidos</div>
                    </div>
                    <div>
                      <div className="text-3xl font-bold text-green-400">{selectedPlayer.goals}</div>
                      <div className="text-white/70">Goles</div>
                    </div>
                    <div>
                      <div className="text-3xl font-bold text-blue-400">{selectedPlayer.assists}</div>
                      <div className="text-white/70">Asistencias</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {modalCard === 'performance' && (
              <div className="p-8">
                <h2 className="text-3xl font-bold mb-8">Performance Detallado</h2>
                <div style={{ width: '100%', height: '600px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={performanceData} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fontSize: 14 }}
                        interval={0}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis 
                        domain={[0, 100]}
                        tick={{ fontSize: 14 }}
                      />
                      <Tooltip 
                        formatter={(value) => [`${value} pts`, 'Puntuación']}
                        labelFormatter={(label, payload) => {
                          if (payload && payload[0]) {
                            const data = payload[0].payload;
                            return `${data.rival} - ${data.date}`;
                          }
                          return label;
                        }}
                        contentStyle={{
                          backgroundColor: '#1f2937',
                          border: 'none',
                          borderRadius: '8px',
                          color: 'white'
                        }}
                      />
                      <Bar 
                        dataKey="score" 
                        fill="#10b981"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {modalCard === 'stats' && (
              <div className="p-8">
                <h2 className="text-3xl font-bold mb-8">Estadísticas Completas</h2>
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <h3 className="text-xl font-bold text-blue-600">Estadísticas Ofensivas</h3>
                    <div className="space-y-4">
                      <div className="flex justify-between p-4 bg-gray-50 rounded-lg">
                        <span>Goles</span>
                        <span className="font-bold text-green-600">{selectedPlayer.goals}</span>
                      </div>
                      <div className="flex justify-between p-4 bg-gray-50 rounded-lg">
                        <span>Asistencias</span>
                        <span className="font-bold text-blue-600">{selectedPlayer.assists}</span>
                      </div>
                      <div className="flex justify-between p-4 bg-gray-50 rounded-lg">
                        <span>Tiros</span>
                        <span className="font-bold">{selectedPlayer.shots}</span>
                      </div>
                      <div className="flex justify-between p-4 bg-gray-50 rounded-lg">
                        <span>Tiros a portería</span>
                        <span className="font-bold">{selectedPlayer.shotsOnTarget}</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <h3 className="text-xl font-bold text-purple-600">Estadísticas Defensivas</h3>
                    <div className="space-y-4">
                      <div className="flex justify-between p-4 bg-gray-50 rounded-lg">
                        <span>Duelos ganados</span>
                        <span className="font-bold">{selectedPlayer.duelsWon}</span>
                      </div>
                      <div className="flex justify-between p-4 bg-gray-50 rounded-lg">
                        <span>Balones recuperados</span>
                        <span className="font-bold">{selectedPlayer.ballsRecovered}</span>
                      </div>
                      <div className="flex justify-between p-4 bg-gray-50 rounded-lg">
                        <span>Precisión de pases</span>
                        <span className="font-bold">{selectedPlayer.passAccuracy}%</span>
                      </div>
                      <div className="flex justify-between p-4 bg-gray-50 rounded-lg">
                        <span>Faltas cometidas</span>
                        <span className="font-bold">{selectedPlayer.foulsCommitted}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {modalCard === 'shotMap' && (
              <div className="p-8 bg-blue-50">
                <h2 className="text-3xl font-bold mb-8 text-blue-900">Mapa de Disparos Detallado</h2>
                <div className="flex justify-center">
                  <div className="grid grid-cols-3 gap-4 w-96 h-64">
                    {Object.entries(selectedPlayer.shotMap || {}).map(([zone, goals]) => (
                      <div
                        key={zone}
                        className="border-4 border-blue-400 bg-blue-200 rounded-lg flex flex-col items-center justify-center text-2xl font-bold text-blue-800 hover:bg-blue-300 transition-colors"
                      >
                        <div className="text-4xl">{goals}</div>
                        <div className="text-sm text-blue-600 capitalize">{zone.replace('-', ' ')}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <p className="text-center text-lg text-blue-700 mt-8">
                  Distribución de goles por zona de la portería
                </p>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Photo Upload Modal */}
        {photoUploadPlayer && (
          <PlayerPhotoUpload
            isOpen={true}
            onClose={() => setPhotoUploadPlayer(null)}
            onPhotoSave={(photoUrl) => handlePhotoSave(photoUploadPlayer.id, photoUrl)}
            currentPhoto={photoUploadPlayer.photo}
            playerName={photoUploadPlayer.name}
            playerId={photoUploadPlayer.id}
          />
        )}
      </div>
    );
  };

  const renderPlayersList = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{t('players.title')}</h1>
        <Button
          onClick={() => setIsAddPlayerFormOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>{t('players.add')}</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {players.map((player) => (
          <Card 
            key={player.id} 
            className="p-6 cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => setSelectedPlayer(player)}
          >
            <div className="flex items-center space-x-4">
              <div className="relative">
                {player.photo ? (
                  <img 
                    src={player.photo} 
                    alt={player.name}
                    className="w-12 h-12 rounded-full object-cover border-2 border-blue-500"
                  />
                ) : (
                  <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                    {player.number}
                  </div>
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">{player.name}</h3>
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    setPhotoUploadPlayer(player);
                  }}
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Camera className="w-4 h-4" />
                </Button>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                    {player.position}
                  </span>
                  <span className="text-sm text-gray-600">{player.age} años</span>
                </div>
              </div>
            </div>
            
            <div className="mt-4 grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-lg font-bold text-green-600">{player.goals}</div>
                <div className="text-xs text-gray-600">{t('players.goals')}</div>
              </div>
              <div>
                <div className="text-lg font-bold text-blue-600">{player.assists}</div>
                <div className="text-xs text-gray-600">{t('players.assists')}</div>
              </div>
              <div>
                <div className="text-lg font-bold text-gray-600">{player.games}</div>
                <div className="text-xs text-gray-600">{t('players.games')}</div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <AddPlayerForm
        isOpen={isAddPlayerFormOpen}
        onClose={() => setIsAddPlayerFormOpen(false)}
        onSave={handleAddPlayer}
      />
    </div>
  );

  return (
    // Use only the main app layout (ResponsiveLayout wraps this route in App.tsx)
    <div className="p-6">
      {selectedPlayer ? renderPlayerDetail() : renderPlayersList()}
    </div>
  );
};

export default Players;
