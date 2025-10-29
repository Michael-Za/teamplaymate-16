import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { 
  Users, 
  Trophy, 
  TrendingUp, 
  Calendar, 
  Plus, 
  Settings, 
  Crown,
  BarChart3,
  Target,
  Activity,
  Star,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { subscriptionService } from '../services/subscriptionService';
import { InteractiveDashboard } from '../components/InteractiveDashboard';
import { StatsCard } from '../components/StatsCard';
import { dataManagementService } from '../services/dataManagementService';
import { initializePlayers } from '../utils/playerSetupUtils';
// NotificationDemo removed - no more automatic demo notifications

interface Team {
  id: string;
  name: string;
  players: number;
  matches: number;
  wins: number;
  losses: number;
  draws: number;
}

interface Match {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  date: string;
  status: 'scheduled' | 'live' | 'completed';
}

const Dashboard: React.FC = () => {
  console.log('Dashboard component rendering...');
  const { user } = useAuth();
  const { language } = useLanguage();
  const { theme } = useTheme();
  
  console.log('User:', user);
  console.log('Language:', language);
  console.log('Theme:', theme);
  
  const [teams, setTeams] = useState<Team[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [subscriptionSummary, setSubscriptionSummary] = useState<any>(null);
  const [playersInitialized, setPlayersInitialized] = useState(false);

  const canCreateTeam = () => {
    if (!user?.id) return false;
    return subscriptionService.canCreateResource(user.id, 'teams');
  };

  useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true);
      try {
        // Initialize players if not already done
        if (!playersInitialized) {
          try {
            await initializePlayers();
            setPlayersInitialized(true);
          } catch (initError) {
            console.error('Error initializing players:', initError);
          }
        }

        // Load real data from backend
        const playerData = await dataManagementService.getPlayers();
        const clubData = await dataManagementService.getClubData();
        
        // Transform data for dashboard
        if (playerData && playerData.length > 0) {
          // Create a team based on the players
          const team: Team = {
            id: clubData?.id || '1',
            name: clubData?.name || 'My Team',
            players: playerData.length,
            matches: 0,
            wins: 0,
            losses: 0,
            draws: 0
          };
          setTeams([team]);
        } else {
          // Fallback to localStorage if no real data
          const savedTeams = localStorage.getItem('statsor_teams');
          if (savedTeams) {
            setTeams(JSON.parse(savedTeams));
          } else {
            setTeams([]);
          }
        }

        // Load matches from localStorage as fallback
        const savedMatches = localStorage.getItem('statsor_matches');
        if (savedMatches) {
          setMatches(JSON.parse(savedMatches));
        } else {
          setMatches([]);
        }
      } catch (error) {
        console.error('Error loading dashboard data:', error);
        // Fallback to localStorage
        try {
          const savedTeams = localStorage.getItem('statsor_teams');
          const savedMatches = localStorage.getItem('statsor_matches');
          
          if (savedTeams) {
            setTeams(JSON.parse(savedTeams));
          } else {
            setTeams([]);
          }

          if (savedMatches) {
            setMatches(JSON.parse(savedMatches));
          } else {
            setMatches([]);
          }
        } catch (fallbackError) {
          console.error('Error loading fallback data:', fallbackError);
          setTeams([]);
          setMatches([]);
        }
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
    
    // Subscribe to player updates
    dataManagementService.setPlayersUpdateCallback((updatedPlayers) => {
      // Update teams with new player count
      setTeams(prevTeams => {
        if (prevTeams.length > 0 && prevTeams[0]) {
          const updatedTeams = [...prevTeams];
          updatedTeams[0] = {
            id: prevTeams[0].id,
            name: prevTeams[0].name,
            players: updatedPlayers.length,
            matches: prevTeams[0].matches,
            wins: prevTeams[0].wins,
            losses: prevTeams[0].losses,
            draws: prevTeams[0].draws
          };
          return updatedTeams;
        }
        return prevTeams;
      });
    });
    
    if (user?.id) {
      subscriptionService.getSubscriptionSummary(user.id).then(summary => {
        setSubscriptionSummary(summary);
      });
    }
    
    return () => {
      dataManagementService.setPlayersUpdateCallback(null);
    };
  }, [user]); // Remove teams from dependency array to prevent infinite loop

  const handleCreateTeam = async () => {
    if (!newTeamName.trim()) {
      toast.error(language === 'en' ? 'Please enter a team name' : 'Por favor ingresa un nombre de equipo');
      return;
    }

    const canCreate = await canCreateTeam();
    if (!canCreate) {
      toast.error(language === 'en' ? 'You have reached the maximum number of teams for your plan' : 'Has alcanzado el número máximo de equipos para tu plan');
      return;
    }

    const newTeam: Team = {
      id: Date.now().toString(),
      name: newTeamName,
      players: 0,
      matches: 0,
      wins: 0,
      losses: 0,
      draws: 0
    };
    
    const updatedTeams = [...teams, newTeam];
    setTeams(updatedTeams);
    localStorage.setItem('statsor_teams', JSON.stringify(updatedTeams));
    localStorage.setItem('statsor_team_count', updatedTeams.length.toString());
  };

  return (
    <div className={`min-h-screen transition-all duration-500 ${
      theme === 'midnight' ? 'bg-gray-900' : 'bg-gray-50'
    }`}>
      <InteractiveDashboard />
    </div>
  );
};

export default Dashboard;
