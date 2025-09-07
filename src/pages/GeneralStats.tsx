import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { TrendingUp, Target, Shield, Users, ChevronRight, Trophy, Activity, Clock, AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { realAnalyticsService, RealTeamStats, RealPlayerPerformance, RealMatchPerformance, RealPositionStats } from '../services/realAnalyticsService';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

const GeneralStats: React.FC = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [teamStats, setTeamStats] = useState<RealTeamStats | null>(null);
  const [performanceData, setPerformanceData] = useState<RealMatchPerformance[]>([]);
  const [positionStats, setPositionStats] = useState<RealPositionStats[]>([]);
  const [playerPerformance, setPlayerPerformance] = useState<RealPlayerPerformance[]>([]);

  useEffect(() => {
    loadRealAnalytics();
  }, []);

  const loadRealAnalytics = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error('Please log in to view analytics');
        setLoading(false);
        return;
      }

      console.log('Loading analytics for user:', user.id);
      
      // Load all analytics data
      const [teamStatsData, monthlyData, positionData, playerData] = await Promise.all([
        realAnalyticsService.getTeamStats(user.id),
        realAnalyticsService.getMonthlyPerformance(user.id),
        realAnalyticsService.getPositionStats(user.id),
        realAnalyticsService.getPlayerPerformance(user.id)
      ]);

      console.log('Loaded analytics data:', { teamStatsData, monthlyData, positionData, playerData });

      setTeamStats(teamStatsData);
      setPerformanceData(monthlyData);
      setPositionStats(positionData);
      setPlayerPerformance(playerData);
    } catch (error) {
      console.error('Error loading analytics:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  // Fallback data when no real data is available
  const fallbackTeamStats = {
    totalMatches: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    totalAssists: 0,
    foulsCommitted: 0,
    foulsReceived: 0,
    winPercentage: 0,
    wins: 0,
    draws: 0,
    losses: 0
  };

  const currentTeamStats = teamStats || fallbackTeamStats;
  const currentPerformanceData = performanceData.length > 0 ? performanceData : [];
  const currentPositionStats = positionStats.length > 0 ? positionStats : [];

  // Calculate aggregated stats for the 4 blocks
  const performanceStats = {
    wins: currentTeamStats.wins,
    draws: currentTeamStats.draws,
    losses: currentTeamStats.losses,
    winPercentage: currentTeamStats.winPercentage
  };

  const attackStats = {
    goalsFor: currentTeamStats.goalsFor,
    totalAssists: currentTeamStats.totalAssists,
    shotsOnGoal: 0, // Not in current data
    shotsOffGoal: 0 // Not in current data
  };

  const defenseStats = {
    goalsAgainst: currentTeamStats.goalsAgainst,
    ballsRecovered: 0, // Not in current data
    duelsWon: 0, // Not in current data
    saves: 0 // Not in current data
  };

  const disciplineStats = {
    foulsCommitted: currentTeamStats.foulsCommitted,
    foulsReceived: currentTeamStats.foulsReceived,
    yellowCards: 0, // Not in current data
    redCards: 0 // Not in current data
  };

  console.log('Rendering stats:', { 
    currentTeamStats, 
    currentPerformanceData, 
    currentPositionStats,
    performanceStats,
    attackStats,
    defenseStats,
    disciplineStats
  });

  // Colors for charts
  const COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4'];

  return (
    <div className="p-4 md:p-6 space-y-6 w-full">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 whitespace-nowrap">{t('stats.title')}</h1>
        <div className="text-sm text-gray-500 whitespace-nowrap">{t('general.season')} 2024/25</div>
      </div>

      {/* 4 Statistics Blocks */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {/* Performance */}
        <Card className="border-l-4 border-l-purple-500 shadow-sm h-full">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 md:gap-3">
              <div className="w-8 h-8 md:w-10 md:h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <TrendingUp className="h-4 w-4 md:h-5 md:w-5 text-purple-600" />
              </div>
              <span className="text-base md:text-lg font-semibold truncate">{t('performance')}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 md:gap-4">
              <div className="text-center p-2 md:p-3 bg-blue-50 rounded-lg">
                <p className="text-xs md:text-sm text-blue-600 font-medium truncate">{t('stats.wins')}</p>
                <p className="text-lg md:text-xl font-bold text-blue-700 truncate">{performanceStats.wins}</p>
              </div>
              <div className="text-center p-2 md:p-3 bg-gray-50 rounded-lg">
                <p className="text-xs md:text-sm text-gray-600 font-medium truncate">{t('stats.draws')}</p>
                <p className="text-lg md:text-xl font-bold text-gray-700 truncate">{performanceStats.draws}</p>
              </div>
              <div className="text-center p-2 md:p-3 bg-red-50 rounded-lg">
                <p className="text-xs md:text-sm text-red-600 font-medium truncate">{t('stats.losses')}</p>
                <p className="text-lg md:text-xl font-bold text-red-700 truncate">{performanceStats.losses}</p>
              </div>
              <div className="text-center p-2 md:p-3 bg-purple-50 rounded-lg">
                <p className="text-xs md:text-sm text-purple-600 font-medium truncate">Win %</p>
                <p className="text-lg md:text-xl font-bold text-purple-700 truncate">{performanceStats.winPercentage}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Attack */}
        <Card className="border-l-4 border-l-green-500 shadow-sm h-full">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 md:gap-3">
              <div className="w-8 h-8 md:w-10 md:h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Target className="h-4 w-4 md:h-5 md:w-5 text-green-600" />
              </div>
              <span className="text-base md:text-lg font-semibold truncate">{t('attack')}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 md:gap-4">
              <div className="text-center p-2 md:p-3 bg-green-50 rounded-lg">
                <p className="text-xs md:text-sm text-green-600 font-medium truncate">{t('stats.goals.for')}</p>
                <p className="text-lg md:text-xl font-bold text-green-700 truncate">{attackStats.goalsFor}</p>
              </div>
              <div className="text-center p-2 md:p-3 bg-blue-50 rounded-lg">
                <p className="text-xs md:text-sm text-blue-600 font-medium truncate">{t('stats.assists.total')}</p>
                <p className="text-lg md:text-xl font-bold text-blue-700 truncate">{attackStats.totalAssists}</p>
              </div>
              <div className="text-center p-2 md:p-3 bg-purple-50 rounded-lg">
                <p className="text-xs md:text-sm text-purple-600 font-medium truncate">{t('stats.shots.goal')}</p>
                <p className="text-lg md:text-xl font-bold text-purple-700 truncate">{attackStats.shotsOnGoal}</p>
              </div>
              <div className="text-center p-2 md:p-3 bg-yellow-50 rounded-lg">
                <p className="text-xs md:text-sm text-yellow-600 font-medium truncate">{t('stats.shots.out')}</p>
                <p className="text-lg md:text-xl font-bold text-yellow-700 truncate">{attackStats.shotsOffGoal}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Defense */}
        <Card className="border-l-4 border-l-blue-500 shadow-sm h-full">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 md:gap-3">
              <div className="w-8 h-8 md:w-10 md:h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Shield className="h-4 w-4 md:h-5 md:w-5 text-blue-600" />
              </div>
              <span className="text-base md:text-lg font-semibold truncate">{t('defense')}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 md:gap-4">
              <div className="text-center p-2 md:p-3 bg-red-50 rounded-lg">
                <p className="text-xs md:text-sm text-red-600 font-medium truncate">{t('stats.goals.against')}</p>
                <p className="text-lg md:text-xl font-bold text-red-700 truncate">{defenseStats.goalsAgainst}</p>
              </div>
              <div className="text-center p-2 md:p-3 bg-teal-50 rounded-lg">
                <p className="text-xs md:text-sm text-teal-600 font-medium truncate">{t('stats.balls.recovered')}</p>
                <p className="text-lg md:text-xl font-bold text-teal-700 truncate">{defenseStats.ballsRecovered}</p>
              </div>
              <div className="text-center p-2 md:p-3 bg-yellow-50 rounded-lg">
                <p className="text-xs md:text-sm text-yellow-600 font-medium truncate">{t('stats.duels.won')}</p>
                <p className="text-lg md:text-xl font-bold text-yellow-700 truncate">{defenseStats.duelsWon}</p>
              </div>
              <div className="text-center p-2 md:p-3 bg-indigo-50 rounded-lg">
                <p className="text-xs md:text-sm text-indigo-600 font-medium truncate">{t('stats.saves')}</p>
                <p className="text-lg md:text-xl font-bold text-indigo-700 truncate">{defenseStats.saves}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Discipline */}
        <Card className="border-l-4 border-l-red-500 shadow-sm h-full">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 md:gap-3">
              <div className="w-8 h-8 md:w-10 md:h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="h-4 w-4 md:h-5 md:w-5 text-red-600" />
              </div>
              <span className="text-base md:text-lg font-semibold truncate">{t('discipline')}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 md:gap-4">
              <div className="text-center p-2 md:p-3 bg-red-50 rounded-lg">
                <p className="text-xs md:text-sm text-red-600 font-medium truncate">{t('stats.fouls.committed')}</p>
                <p className="text-lg md:text-xl font-bold text-red-700 truncate">{disciplineStats.foulsCommitted}</p>
              </div>
              <div className="text-center p-2 md:p-3 bg-green-50 rounded-lg">
                <p className="text-xs md:text-sm text-green-600 font-medium truncate">{t('stats.fouls.received')}</p>
                <p className="text-lg md:text-xl font-bold text-green-700 truncate">{disciplineStats.foulsReceived}</p>
              </div>
              <div className="text-center p-2 md:p-3 bg-yellow-50 rounded-lg">
                <p className="text-xs md:text-sm text-yellow-600 font-medium truncate">{t('stats.yellow.cards')}</p>
                <p className="text-lg md:text-xl font-bold text-yellow-700 truncate">{disciplineStats.yellowCards}</p>
              </div>
              <div className="text-center p-2 md:p-3 bg-red-50 rounded-lg">
                <p className="text-xs md:text-sm text-red-600 font-medium truncate">{t('stats.red.cards')}</p>
                <p className="text-lg md:text-xl font-bold text-red-700 truncate">{disciplineStats.redCards}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Trends Chart */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-600 flex-shrink-0" />
            <span className="truncate">{t('performanceTrends')}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : currentPerformanceData.length > 0 ? (
            <div className="h-64 md:h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={currentPerformanceData}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.3} />
                  <XAxis 
                    dataKey="month" 
                    tick={{ fontSize: 12 }}
                    tickMargin={10}
                    tickFormatter={(value) => value.toString().substring(0, 3)}
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    tickMargin={10}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #e5e7eb', 
                      borderRadius: '0.5rem',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                    formatter={(value) => [value, '']}
                    labelFormatter={(label) => `Month: ${label}`}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="wins" 
                    stackId="1" 
                    stroke="#3b82f6" 
                    fill="#3b82f6" 
                    fillOpacity={0.6} 
                    strokeWidth={2}
                    name={t('stats.wins')} 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="goals" 
                    stackId="2" 
                    stroke="#10b981" 
                    fill="#10b981" 
                    fillOpacity={0.6} 
                    strokeWidth={2}
                    name={t('players.goals')} 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="assists" 
                    stackId="3" 
                    stroke="#8b5cf6" 
                    fill="#8b5cf6" 
                    fillOpacity={0.6} 
                    strokeWidth={2}
                    name={t('players.assists')} 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Activity className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-base">{t('stats.no.performance.data')}</p>
              <p className="text-sm mt-1">{t('stats.add.matches.for.trends')}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Position Stats Chart */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-green-600 flex-shrink-0" />
            <span className="truncate">{t('positionStats')}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : currentPositionStats.length > 0 ? (
            <div className="h-64 md:h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={currentPositionStats}
                  margin={{ top: 20, right: 30, left: 20, bottom: 50 }}
                >
                  <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.3} />
                  <XAxis 
                    dataKey="position" 
                    angle={-45} 
                    textAnchor="end" 
                    height={60}
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => value.toString().substring(0, 4)}
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    tickMargin={10}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #e5e7eb', 
                      borderRadius: '0.5rem',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                    formatter={(value) => [value, '']}
                  />
                  <Bar 
                    dataKey="totalGoals" 
                    fill="#10b981" 
                    name={t('players.goals')}
                    radius={[4, 4, 0, 0]}
                  >
                    {currentPositionStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                  <Bar 
                    dataKey="totalAssists" 
                    fill="#3b82f6" 
                    name={t('players.assists')}
                    radius={[4, 4, 0, 0]}
                  >
                    {currentPositionStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-base">{t('stats.no.position.data')}</p>
              <p className="text-sm mt-1">{t('stats.add.players.matches.for.stats')}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default GeneralStats;