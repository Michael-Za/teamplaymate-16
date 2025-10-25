import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { 
  Users, 
  Trophy, 
  Target, 
  Calendar, 
  TrendingUp, 
  Shield, 
  Zap, 
  Award,
  User,
  BarChart3,
  Clock,
  CheckCircle,
  Crosshair,
  Medal,
  AlertTriangle,
  XCircle,
  Activity,
  Footprints,
  X
} from 'lucide-react';
import { realAnalyticsService, RealTeamStats, RealMatchPerformance, RealPositionStats, RealPlayerPerformance } from '../services/realAnalyticsService';
import { useAuth } from '../contexts/AuthContext';
import { useDataSync } from '../contexts/DataSyncContext';
import { isDemoMode } from '../lib/supabase';
import { demoAnalyticsService, DemoPlayerStats, DemoTeamStats, DemoMatchStats, DemoPositionStats } from '../services/demoAnalyticsService';
import { toast } from 'sonner';

// Adapter functions to convert demo data to real data types
const convertDemoTeamStatsToReal = (demoStats: DemoTeamStats): RealTeamStats => {
  return {
    totalMatches: demoStats.totalMatches,
    wins: demoStats.wins,
    draws: demoStats.draws,
    losses: demoStats.losses,
    goalsFor: demoStats.goalsFor,
    goalsAgainst: demoStats.goalsAgainst,
    winPercentage: demoStats.winPercentage,
    totalAssists: demoStats.totalAssists,
    foulsCommitted: Math.floor(demoStats.totalMatches * 12), // Estimate
    foulsReceived: Math.floor(demoStats.totalMatches * 10)   // Estimate
  };
};

const convertDemoPlayerStatsToReal = (demoStats: DemoPlayerStats): RealPlayerPerformance => {
  return {
    playerId: demoStats.id,
    name: demoStats.name,
    position: demoStats.position,
    matchesPlayed: demoStats.matches,
    goals: demoStats.goals,
    assists: demoStats.assists,
    averageRating: demoStats.rating,
    totalMinutes: demoStats.minutes,
    passAccuracy: demoStats.passAccuracy,
    form: demoStats.form === 'excellent' ? 95 : demoStats.form === 'good' ? 80 : demoStats.form === 'average' ? 65 : 50
  };
};

const convertDemoMatchStatsToReal = (demoStats: DemoMatchStats): RealMatchPerformance => {
  return {
    month: demoStats.month,
    wins: demoStats.wins,
    draws: demoStats.draws,
    losses: demoStats.losses,
    goals: demoStats.goals,
    assists: demoStats.assists,
    matchesPlayed: demoStats.matchesPlayed
  };
};

const convertDemoPositionStatsToReal = (demoStats: DemoPositionStats): RealPositionStats => {
  return {
    position: demoStats.position,
    playerCount: demoStats.playerCount,
    totalGoals: demoStats.totalGoals,
    totalAssists: demoStats.totalAssists,
    averageRating: demoStats.averageRating
  };
};

const GeneralStats: React.FC = () => {
  // Remove useTranslation since it's not imported
  const { user } = useAuth();
  const { refreshData } = useDataSync();
  const [loading, setLoading] = useState(true);
  const [teamStats, setTeamStats] = useState<RealTeamStats | null>(null);
  const [performanceData, setPerformanceData] = useState<RealMatchPerformance[]>([]);
  const [positionStats, setPositionStats] = useState<RealPositionStats[]>([]);
  const [playerPerformance, setPlayerPerformance] = useState<RealPlayerPerformance[]>([]);
  const [activeSection, setActiveSection] = useState<string | null>(null);

  useEffect(() => {
    const loadAnalytics = async () => {
      if (!user) return;
      
      setLoading(true);
      try {
        let teamStatsData: RealTeamStats, monthlyData: RealMatchPerformance[], positionData: RealPositionStats[], playerData: RealPlayerPerformance[];
        
        if (isDemoMode) {
          // Use demo analytics service for more realistic mock data
          // These are synchronous operations, so they're fast
          const demoTeamStats = demoAnalyticsService.getTeamStats();
          const demoMonthlyData = demoAnalyticsService.getMonthlyPerformance();
          const demoPositionData = demoAnalyticsService.getPositionStats();
          const demoPlayerData = demoAnalyticsService.getPlayerStats();
          
          // Convert demo data to real data types
          teamStatsData = convertDemoTeamStatsToReal(demoTeamStats);
          monthlyData = demoMonthlyData.map(convertDemoMatchStatsToReal);
          positionData = demoPositionData.map(convertDemoPositionStatsToReal);
          playerData = demoPlayerData.map(convertDemoPlayerStatsToReal);
        } else {
          // Load all analytics data from real service with timeout protection
          try {
            // Add timeout to prevent hanging requests
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
            
            const results = await Promise.allSettled([
              realAnalyticsService.getTeamStats(user.id),
              realAnalyticsService.getMonthlyPerformance(user.id),
              realAnalyticsService.getPositionStats(user.id),
              realAnalyticsService.getPlayerPerformance(user.id)
            ]);
            
            clearTimeout(timeoutId);
            
            // Handle results individually to prevent one failure from blocking others
            teamStatsData = results[0].status === 'fulfilled' ? results[0].value : fallbackTeamStats;
            monthlyData = results[1].status === 'fulfilled' ? results[1].value : [];
            positionData = results[2].status === 'fulfilled' ? results[2].value : [];
            playerData = results[3].status === 'fulfilled' ? results[3].value : [];
          } catch (error) {
            console.error('Error loading analytics with timeout protection:', error);
            // Fallback to default data
            teamStatsData = fallbackTeamStats;
            monthlyData = [];
            positionData = [];
            playerData = [];
          }
        }

        setTeamStats(teamStatsData);
        setPerformanceData(monthlyData);
        setPositionStats(positionData);
        setPlayerPerformance(playerData);
      } catch (error) {
        console.error('Error loading analytics:', error);
        toast.error('Failed to load analytics data');
        // Set fallback data on error
        setTeamStats(fallbackTeamStats);
        setPerformanceData([]);
        setPositionStats([]);
        setPlayerPerformance([]);
      } finally {
        setLoading(false);
      }
    };

    // Debounce the loading to prevent excessive requests
    const timer = setTimeout(() => {
      loadAnalytics();
    }, 100);

    return () => clearTimeout(timer);
  }, [user]);

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
  const currentPlayerPerformance = playerPerformance.length > 0 ? playerPerformance : [];

  // Colors for charts
  const COLORS = ['#8B5CF6', '#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#06B6D4'];

  // Calculate aggregated stats for the 4 blocks
  const performanceStats = {
    minutesPlayed: Math.round((currentTeamStats.totalMatches || 0) * 90),
    goals: currentTeamStats.goalsFor,
    assists: currentTeamStats.totalAssists,
    passCompletionRate: Math.round(85 + (Math.random() * 10)),
    duelsWon: Math.round((currentTeamStats.goalsFor || 0) * 2.5),
    shotsOnTarget: Math.round((currentTeamStats.goalsFor || 0) * 1.8),
    mvpIndex: Math.round(((currentTeamStats.goalsFor || 0) + (currentTeamStats.totalAssists || 0)) * 2)
  };

  // Calculate performance overview metrics
  const performanceOverview = {
    form: currentTeamStats.winPercentage >= 70 ? 'Excellent' : 
          currentTeamStats.winPercentage >= 50 ? 'Good' : 
          currentTeamStats.winPercentage >= 30 ? 'Average' : 'Poor',
    formColor: currentTeamStats.winPercentage >= 70 ? 'text-green-500' : 
               currentTeamStats.winPercentage >= 50 ? 'text-blue-500' : 
               currentTeamStats.winPercentage >= 30 ? 'text-yellow-500' : 'text-red-500',
    goalsPerGame: currentTeamStats.totalMatches > 0 ? 
                  (currentTeamStats.goalsFor / currentTeamStats.totalMatches).toFixed(2) : '0.00',
    assistsPerGame: currentTeamStats.totalMatches > 0 ? 
                    (currentTeamStats.totalAssists / currentTeamStats.totalMatches).toFixed(2) : '0.00',
    cleanSheets: Math.floor(currentTeamStats.totalMatches * 0.3), // Estimate
    possession: Math.round(55 + (Math.random() * 8)), // Estimate
    shotsPerGame: currentTeamStats.totalMatches > 0 ? 
                  ((currentTeamStats.goalsFor * 1.8) / currentTeamStats.totalMatches).toFixed(1) : '0.0',
    accuratePasses: Math.round((performanceStats.passCompletionRate / 100) * 450) // Estimate
  };

  // Calculate team summary metrics
  const teamSummary = {
    totalPlayers: currentPlayerPerformance.length,
    avgAge: Math.round(25 + (Math.random() * 5)),
    topScorer: currentPlayerPerformance.length > 0 ? 
               currentPlayerPerformance.reduce((top, player) => 
                 player.goals > top.goals ? player : top, currentPlayerPerformance[0]) : 
               null,
    topAssister: currentPlayerPerformance.length > 0 ? 
                 currentPlayerPerformance.reduce((top, player) => 
                   player.assists > top.assists ? player : top, currentPlayerPerformance[0]) : 
                 null,
    mostMinutes: currentPlayerPerformance.length > 0 ? 
                 currentPlayerPerformance.reduce((top, player) => 
                   player.totalMinutes > top.totalMinutes ? player : top, currentPlayerPerformance[0]) : 
                 null,
    bestPasser: currentPlayerPerformance.length > 0 ? 
                currentPlayerPerformance.reduce((top, player) => 
                  player.passAccuracy > top.passAccuracy ? player : top, currentPlayerPerformance[0]) : 
                null,
    totalValue: currentPlayerPerformance.length > 0 ? 
                currentPlayerPerformance.reduce((sum, player) => sum + (Math.random() * 10 + 5), 0).toFixed(1) : '0.0'
  };

  const attackStats = {
    shotsOnTarget: Math.round((currentTeamStats.goalsFor || 0) * 1.8),
    shotsOffTarget: Math.round((currentTeamStats.goalsFor || 0) * 1.2),
    goals: currentTeamStats.goalsFor,
    assists: currentTeamStats.totalAssists,
    keyPasses: Math.round((currentTeamStats.totalAssists || 0) * 2.5),
    dribblesSuccessful: Math.round((currentTeamStats.goalsFor || 0) * 1.5),
  };

  const defenseStats = {
    ballsRecovered: Math.round((currentTeamStats.goalsAgainst || 0) * 2.5),
    interceptions: Math.round((currentTeamStats.goalsAgainst || 0) * 1.8),
    tacklesWon: Math.round((currentTeamStats.goalsAgainst || 0) * 2),
    goalsConceded: currentTeamStats.goalsAgainst,
    defensiveDuelsWon: Math.round((currentTeamStats.goalsAgainst || 0) * 2.2)
  };

  const disciplineStats = {
    foulsCommitted: currentTeamStats.foulsCommitted,
    foulsReceived: currentTeamStats.foulsReceived,
    yellowCards: Math.round((currentTeamStats.foulsCommitted || 0) * 0.4),
    redCards: Math.round((currentTeamStats.foulsCommitted || 0) * 0.05),
  };

  // Detailed data for each section
  const sectionDetails = {
    performance: [
      { label: 'Minutes Played', value: performanceStats.minutesPlayed, icon: <Clock className="h-5 w-5 text-blue-500" /> },
      { label: 'Goals', value: performanceStats.goals, icon: <Target className="h-5 w-5 text-green-500" /> },
      { label: 'Assists', value: performanceStats.assists, icon: <Users className="h-5 w-5 text-blue-500" /> },
      { label: 'Pass Completion', value: `${performanceStats.passCompletionRate}%`, icon: <Activity className="h-5 w-5 text-indigo-500" /> },
      { label: 'Duels Won', value: performanceStats.duelsWon, icon: <CheckCircle className="h-5 w-5 text-green-500" /> },
      { label: 'Shots On Target', value: performanceStats.shotsOnTarget, icon: <Crosshair className="h-5 w-5 text-green-500" /> },
      { label: 'MVP Index', value: performanceStats.mvpIndex, icon: <Medal className="h-5 w-5 text-yellow-500" /> }
    ],
    attack: [
      { label: 'Shots On Target', value: attackStats.shotsOnTarget, icon: <Crosshair className="h-5 w-5 text-green-500" /> },
      { label: 'Shots Off Target', value: attackStats.shotsOffTarget, icon: <Crosshair className="h-5 w-5 text-yellow-500" /> },
      { label: 'Goals', value: attackStats.goals, icon: <Target className="h-5 w-5 text-green-500" /> },
      { label: 'Assists', value: attackStats.assists, icon: <Users className="h-5 w-5 text-indigo-500" /> },
      { label: 'Key Passes', value: attackStats.keyPasses, icon: <Activity className="h-5 w-5 text-purple-500" /> },
      { label: 'Dribbles Successful', value: attackStats.dribblesSuccessful, icon: <Footprints className="h-5 w-5 text-teal-500" /> },
    ],
    defense: [
      { label: 'Balls Recovered', value: defenseStats.ballsRecovered, icon: <CheckCircle className="h-5 w-5 text-teal-500" /> },
      { label: 'Interceptions', value: defenseStats.interceptions, icon: <Zap className="h-5 w-5 text-yellow-500" /> },
      { label: 'Tackles Won', value: defenseStats.tacklesWon, icon: <Shield className="h-5 w-5 text-green-500" /> },
      { label: 'Goals Conceded', value: defenseStats.goalsConceded, icon: <XCircle className="h-5 w-5 text-red-500" /> },
      { label: 'Defensive Duels', value: defenseStats.defensiveDuelsWon, icon: <CheckCircle className="h-5 w-5 text-blue-500" /> }
    ],
    discipline: [
      { label: 'Fouls Committed', value: disciplineStats.foulsCommitted, icon: <XCircle className="h-5 w-5 text-red-500" /> },
      { label: 'Fouls Received', value: disciplineStats.foulsReceived, icon: <CheckCircle className="h-5 w-5 text-green-500" /> },
      { label: 'Yellow Cards', value: disciplineStats.yellowCards, icon: <AlertTriangle className="h-5 w-5 text-yellow-500" /> },
      { label: 'Red Cards', value: disciplineStats.redCards, icon: <AlertTriangle className="h-5 w-5 text-red-700" /> },
    ]
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900">General Statistics</h1>
            <div className="text-sm text-gray-500">Season 2024/25</div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="bg-white border border-gray-200 rounded-lg shadow-sm">
                <CardContent className="p-4">
                  <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
                    <div className="h-6 bg-gray-100 rounded"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-white border border-gray-200 rounded-lg shadow-sm">
              <CardContent className="p-4 h-64 flex items-center justify-center">
                <div className="animate-pulse">
                  <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
                  <div className="h-48 bg-gray-100 rounded"></div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-white border border-gray-200 rounded-lg shadow-sm">
              <CardContent className="p-4 h-64 flex items-center justify-center">
                <div className="animate-pulse">
                  <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
                  <div className="h-48 bg-gray-100 rounded"></div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Render detailed view for a specific section
  if (activeSection) {
    const details = sectionDetails[activeSection as keyof typeof sectionDetails] || [];
    const sectionTitles: Record<string, string> = {
      performance: 'Performance',
      attack: 'Attack',
      defense: 'Defense',
      discipline: 'Discipline'
    };
    
    const sectionIcons: Record<string, JSX.Element> = {
      performance: <TrendingUp className="h-5 w-5 text-purple-600" />,
      attack: <Target className="h-5 w-5 text-green-600" />,
      defense: <Shield className="h-5 w-5 text-blue-600" />,
      discipline: <AlertTriangle className="h-5 w-5 text-red-600" />
    };

    return (
      <div className="min-h-screen bg-white p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              {sectionIcons[activeSection]}
              <h1 className="text-2xl font-bold text-gray-900">{sectionTitles[activeSection]}</h1>
            </div>
            <button 
              onClick={() => setActiveSection(null)}
              className="p-1 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Close"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          {/* Performance Overview Section */}
          {activeSection === 'performance' && (
            <div className="mb-6">
              <Card className="bg-white border border-gray-200 rounded-lg shadow-sm mb-6">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <BarChart3 className="h-4 w-4 text-purple-600" />
                    <span>Performance Overview</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="text-sm text-purple-700 font-medium">Current Form</div>
                    <div className={`text-xl font-bold mt-1 ${performanceOverview.formColor}`}>
                      {performanceOverview.form}
                    </div>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="text-sm text-blue-700 font-medium">Goals Per Game</div>
                    <div className="text-xl font-bold mt-1 text-blue-900">
                      {performanceOverview.goalsPerGame}
                    </div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="text-sm text-green-700 font-medium">Assists Per Game</div>
                    <div className="text-xl font-bold mt-1 text-green-900">
                      {performanceOverview.assistsPerGame}
                    </div>
                  </div>
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <div className="text-sm text-yellow-700 font-medium">Possession</div>
                    <div className="text-xl font-bold mt-1 text-yellow-900">
                      {performanceOverview.possession}%
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Team Summary Section */}
          {activeSection === 'performance' && (
            <div className="mb-6">
              <Card className="bg-white border border-gray-200 rounded-lg shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Users className="h-4 w-4 text-indigo-600" />
                    <span>Team Summary</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="text-sm text-gray-500">Total Players</div>
                    <div className="text-2xl font-bold mt-1 text-gray-900">
                      {teamSummary.totalPlayers}
                    </div>
                  </div>
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="text-sm text-gray-500">Average Age</div>
                    <div className="text-2xl font-bold mt-1 text-gray-900">
                      {teamSummary.avgAge} yrs
                    </div>
                  </div>
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="text-sm text-gray-500">Team Value</div>
                    <div className="text-2xl font-bold mt-1 text-gray-900">
                      €{teamSummary.totalValue}M
                    </div>
                  </div>
                  {teamSummary.topScorer && (
                    <div className="border border-gray-200 rounded-lg p-4">
                      <div className="text-sm text-gray-500">Top Scorer</div>
                      <div className="font-bold mt-1 text-gray-900">
                        {teamSummary.topScorer.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {teamSummary.topScorer.goals} goals
                      </div>
                    </div>
                  )}
                  {teamSummary.topAssister && (
                    <div className="border border-gray-200 rounded-lg p-4">
                      <div className="text-sm text-gray-500">Top Assister</div>
                      <div className="font-bold mt-1 text-gray-900">
                        {teamSummary.topAssister.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {teamSummary.topAssister.assists} assists
                      </div>
                    </div>
                  )}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="text-sm text-gray-500">Clean Sheets</div>
                    <div className="text-2xl font-bold mt-1 text-gray-900">
                      {performanceOverview.cleanSheets}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {details.map((item, index) => (
              <Card key={index} className="bg-white border border-gray-200 rounded-lg shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {item.icon}
                      <span className="font-medium text-gray-700 text-sm">{item.label}</span>
                    </div>
                  </div>
                  <p className="text-xl font-bold mt-2 text-gray-900">{item.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-white border border-gray-200 rounded-lg shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Activity className="h-4 w-4 text-blue-600" />
                  <span>Trends</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {currentPerformanceData.length > 0 ? (
                  <div className="h-64 w-full">
                    <div className="h-full flex items-center justify-center">
                      <div className="text-center">
                        <Activity className="mx-auto h-12 w-12 text-gray-300 mb-2" />
                        <p className="text-gray-500">Performance trends chart</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Activity className="mx-auto h-8 w-8 text-gray-300 mb-2" />
                    <p className="text-sm">No data available</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-white border border-gray-200 rounded-lg shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <User className="h-4 w-4 text-purple-600" />
                  <span>Player Efficiency</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="h-64 w-full">
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center">
                      <User className="mx-auto h-12 w-12 text-gray-300 mb-2" />
                      <p className="text-gray-500">Player efficiency visualization</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Player efficiency data for radar chart (simplified)
  const playerEfficiencyData = currentPlayerPerformance.slice(0, 5).map(player => ({
    name: player.name.split(' ')[0],
    goals: player.goals,
    assists: player.assists,
    passAccuracy: player.passAccuracy,
  }));

  return (
    <div className="min-h-screen bg-white p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">General Statistics</h1>
          <div className="text-sm text-gray-500">Season 2024/25</div>
        </div>

        {/* Performance Overview Section */}
        <Card className="bg-white border border-gray-200 rounded-lg shadow-sm mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <BarChart3 className="h-4 w-4 text-purple-600" />
              <span>Performance Overview</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-sm text-purple-700 font-medium">Current Form</div>
              <div className={`text-xl font-bold mt-1 ${performanceOverview.formColor}`}>
                {performanceOverview.form}
              </div>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-sm text-blue-700 font-medium">Goals Per Game</div>
              <div className="text-xl font-bold mt-1 text-blue-900">
                {performanceOverview.goalsPerGame}
              </div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-sm text-green-700 font-medium">Assists Per Game</div>
              <div className="text-xl font-bold mt-1 text-green-900">
                {performanceOverview.assistsPerGame}
              </div>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="text-sm text-yellow-700 font-medium">Possession</div>
              <div className="text-xl font-bold mt-1 text-yellow-900">
                {performanceOverview.possession}%
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Team Summary Section */}
        <Card className="bg-white border border-gray-200 rounded-lg shadow-sm mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="h-4 w-4 text-indigo-600" />
              <span>Team Summary</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="text-sm text-gray-500">Total Players</div>
              <div className="text-2xl font-bold mt-1 text-gray-900">
                {teamSummary.totalPlayers}
              </div>
            </div>
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="text-sm text-gray-500">Average Age</div>
              <div className="text-2xl font-bold mt-1 text-gray-900">
                {teamSummary.avgAge} yrs
              </div>
            </div>
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="text-sm text-gray-500">Team Value</div>
              <div className="text-2xl font-bold mt-1 text-gray-900">
                €{teamSummary.totalValue}M
              </div>
            </div>
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="text-sm text-gray-500">Clean Sheets</div>
              <div className="text-2xl font-bold mt-1 text-gray-900">
                {performanceOverview.cleanSheets}
              </div>
            </div>
            {teamSummary.topScorer && (
              <div className="border border-gray-200 rounded-lg p-4 md:col-span-2 lg:col-span-1">
                <div className="text-sm text-gray-500">Top Scorer</div>
                <div className="font-bold mt-1 text-gray-900">
                  {teamSummary.topScorer.name}
                </div>
                <div className="text-sm text-gray-500">
                  {teamSummary.topScorer.goals} goals
                </div>
              </div>
            )}
            {teamSummary.topAssister && (
              <div className="border border-gray-200 rounded-lg p-4 md:col-span-2 lg:col-span-1">
                <div className="text-sm text-gray-500">Top Assister</div>
                <div className="font-bold mt-1 text-gray-900">
                  {teamSummary.topAssister.name}
                </div>
                <div className="text-sm text-gray-500">
                  {teamSummary.topAssister.assists} assists
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 4 Statistics Blocks - Simplified to match dashboard style */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Performance Block */}
          <Card 
            className="bg-gradient-to-r from-purple-500 to-purple-600 text-white border-0 shadow-lg cursor-pointer hover:shadow-xl transition-shadow"
            onClick={() => setActiveSection('performance')}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">Performance</p>
                  <p className="text-2xl font-bold mt-1">{performanceStats.goals + performanceStats.assists}</p>
                  <p className="text-purple-100 text-xs mt-1">Goals & Assists</p>
                </div>
                <TrendingUp className="h-10 w-10 text-purple-200" />
              </div>
            </CardContent>
          </Card>

          {/* Attack Block */}
          <Card 
            className="bg-gradient-to-r from-green-500 to-green-600 text-white border-0 shadow-lg cursor-pointer hover:shadow-xl transition-shadow"
            onClick={() => setActiveSection('attack')}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Attack</p>
                  <p className="text-2xl font-bold mt-1">{attackStats.goals}</p>
                  <p className="text-green-100 text-xs mt-1">Goals Scored</p>
                </div>
                <Target className="h-10 w-10 text-green-200" />
              </div>
            </CardContent>
          </Card>

          {/* Defense Block */}
          <Card 
            className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0 shadow-lg cursor-pointer hover:shadow-xl transition-shadow"
            onClick={() => setActiveSection('defense')}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Defense</p>
                  <p className="text-2xl font-bold mt-1">{defenseStats.tacklesWon}</p>
                  <p className="text-blue-100 text-xs mt-1">Tackles Won</p>
                </div>
                <Shield className="h-10 w-10 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          {/* Discipline Block */}
          <Card 
            className="bg-gradient-to-r from-orange-500 to-orange-600 text-white border-0 shadow-lg cursor-pointer hover:shadow-xl transition-shadow"
            onClick={() => setActiveSection('discipline')}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm font-medium">Discipline</p>
                  <p className="text-2xl font-bold mt-1">{disciplineStats.yellowCards + disciplineStats.redCards}</p>
                  <p className="text-orange-100 text-xs mt-1">Cards</p>
                </div>
                <AlertTriangle className="h-10 w-10 text-orange-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Simplified Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Performance Trends */}
          <Card className="bg-white border border-gray-200 rounded-lg shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Activity className="h-4 w-4 text-blue-600" />
                <span>Performance Trends</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="h-48 w-full flex items-center justify-center">
                <div className="text-center">
                  <Activity className="mx-auto h-10 w-10 text-gray-300 mb-2" />
                  <p className="text-gray-500 text-sm">Performance metrics visualization</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Player Efficiency */}
          <Card className="bg-white border border-gray-200 rounded-lg shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="h-4 w-4 text-purple-600" />
                <span>Player Efficiency</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="h-48 w-full flex items-center justify-center">
                <div className="text-center">
                  <User className="mx-auto h-10 w-10 text-gray-300 mb-2" />
                  <p className="text-gray-500 text-sm">Player efficiency visualization</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default GeneralStats;