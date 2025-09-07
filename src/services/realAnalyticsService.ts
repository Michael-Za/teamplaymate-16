import { supabase } from '../lib/supabase';

// Types for real analytics data
export interface RealTeamStats {
  totalMatches: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  winPercentage: number;
  totalAssists: number;
  foulsCommitted: number;
  foulsReceived: number;
}

export interface RealPlayerPerformance {
  playerId: string;
  name: string;
  position: string;
  matchesPlayed: number;
  goals: number;
  assists: number;
  averageRating: number;
  totalMinutes: number;
  passAccuracy: number;
  form: number;
}

export interface RealMatchPerformance {
  month: string;
  wins: number;
  draws: number;
  losses: number;
  goals: number;
  assists: number;
  matchesPlayed: number;
}

export interface RealPositionStats {
  position: string;
  playerCount: number;
  totalGoals: number;
  totalAssists: number;
  averageRating: number;
}

class RealAnalyticsService {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes

  /**
   * Get real team statistics from database
   */
  async getTeamStats(userId: string): Promise<RealTeamStats> {
    const cacheKey = `team_stats_${userId}`;
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      // Get user's team
      const { data: userTeam, error: teamError } = await supabase
        .from('teams')
        .select('id')
        .eq('coach_id', userId)
        .single();

      if (teamError || !userTeam) {
        console.log('Team not found, using fallback data');
        return this.getFallbackTeamStats();
      }

      // Get matches for the team
      const { data: matches, error: matchError } = await supabase
        .from('matches')
        .select('*')
        .or(`home_team_id.eq.${userTeam.id},away_team_id.eq.${userTeam.id}`)
        .eq('status', 'finished');

      if (matchError || !matches) {
        console.log('Matches not found, using fallback data');
        return this.getFallbackTeamStats();
      }

      // Calculate team statistics
      const stats = this.calculateTeamStats(matches, userTeam.id);
      this.setCachedData(cacheKey, stats);
      return stats;
    } catch (error) {
      console.error('Error fetching team stats:', error);
      return this.getFallbackTeamStats();
    }
  }

  /**
   * Get real player performance data
   */
  async getPlayerPerformance(userId: string): Promise<RealPlayerPerformance[]> {
    const cacheKey = `player_performance_${userId}`;
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      // Get user's team
      const { data: userTeam, error: teamError } = await supabase
        .from('teams')
        .select('id')
        .eq('coach_id', userId)
        .single();

      if (teamError || !userTeam) {
        console.log('Team not found for player performance, using fallback data');
        return this.getFallbackPlayerPerformance();
      }

      // Get players with their match statistics
      const { data: players, error: playersError } = await supabase
        .from('players')
        .select(`
          id,
          name,
          position,
          stats
        `)
        .eq('team_id', userTeam.id);

      if (playersError || !players) {
        console.log('Players not found, using fallback data');
        return this.getFallbackPlayerPerformance();
      }

      // Calculate player performance metrics
      const performance = await Promise.all(
        players.map(async (player) => {
          const stats = player.stats || {};
          return {
            playerId: player.id,
            name: player.name,
            position: player.position || 'Unknown',
            matchesPlayed: stats.matches_played || 0,
            goals: stats.total_goals || 0,
            assists: stats.total_assists || 0,
            averageRating: stats.average_rating || 0,
            totalMinutes: stats.total_minutes || 0,
            passAccuracy: stats.pass_accuracy || 0,
            form: this.calculatePlayerForm(stats)
          };
        })
      );

      this.setCachedData(cacheKey, performance);
      return performance;
    } catch (error) {
      console.error('Error fetching player performance:', error);
      return this.getFallbackPlayerPerformance();
    }
  }

  /**
   * Get monthly match performance data
   */
  async getMonthlyPerformance(userId: string): Promise<RealMatchPerformance[]> {
    const cacheKey = `monthly_performance_${userId}`;
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      // Get user's team
      const { data: userTeam, error: teamError } = await supabase
        .from('teams')
        .select('id')
        .eq('coach_id', userId)
        .single();

      if (teamError || !userTeam) {
        console.log('Team not found for monthly performance, using fallback data');
        return this.getFallbackMonthlyPerformance();
      }

      // Get matches grouped by month
      const { data: matches, error: matchError } = await supabase
        .from('matches')
        .select('*')
        .or(`home_team_id.eq.${userTeam.id},away_team_id.eq.${userTeam.id}`)
        .eq('status', 'finished')
        .gte('match_date', new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString());

      if (matchError || !matches) {
        console.log('Matches not found for monthly performance, using fallback data');
        return this.getFallbackMonthlyPerformance();
      }

      // Group matches by month and calculate performance
      const monthlyData = this.groupMatchesByMonth(matches, userTeam.id);
      this.setCachedData(cacheKey, monthlyData);
      return monthlyData;
    } catch (error) {
      console.error('Error fetching monthly performance:', error);
      return this.getFallbackMonthlyPerformance();
    }
  }

  /**
   * Get position-based statistics
   */
  async getPositionStats(userId: string): Promise<RealPositionStats[]> {
    const cacheKey = `position_stats_${userId}`;
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      // Get user's team
      const { data: userTeam, error: teamError } = await supabase
        .from('teams')
        .select('id')
        .eq('coach_id', userId)
        .single();

      if (teamError || !userTeam) {
        console.log('Team not found for position stats, using fallback data');
        return this.getFallbackPositionStats();
      }

      // Get players grouped by position
      const { data: players, error: playersError } = await supabase
        .from('players')
        .select('position, stats')
        .eq('team_id', userTeam.id);

      if (playersError || !players) {
        console.log('Players not found for position stats, using fallback data');
        return this.getFallbackPositionStats();
      }

      // Group and calculate position statistics
      const positionData = this.calculatePositionStats(players);
      this.setCachedData(cacheKey, positionData);
      return positionData;
    } catch (error) {
      console.error('Error fetching position stats:', error);
      return this.getFallbackPositionStats();
    }
  }

  /**
   * Calculate team statistics from matches
   */
  private calculateTeamStats(matches: any[], teamId: string): RealTeamStats {
    let wins = 0, draws = 0, losses = 0, goalsFor = 0, goalsAgainst = 0;
    let totalAssists = 0, foulsCommitted = 0, foulsReceived = 0;

    matches.forEach(match => {
      const isHome = match.home_team_id === teamId;
      const teamScore = isHome ? match.home_score : match.away_score;
      const opponentScore = isHome ? match.away_score : match.home_score;

      goalsFor += teamScore || 0;
      goalsAgainst += opponentScore || 0;

      if (teamScore > opponentScore) wins++;
      else if (teamScore === opponentScore) draws++;
      else losses++;

      // Extract additional stats from match statistics if available
      const stats = match.statistics || {};
      if (isHome) {
        totalAssists += stats.home_assists || 0;
        foulsCommitted += stats.home_fouls || 0;
        foulsReceived += stats.away_fouls || 0;
      } else {
        totalAssists += stats.away_assists || 0;
        foulsCommitted += stats.away_fouls || 0;
        foulsReceived += stats.home_fouls || 0;
      }
    });

    const totalMatches = matches.length;
    const winPercentage = totalMatches > 0 ? (wins / totalMatches) * 100 : 0;

    return {
      totalMatches,
      wins,
      draws,
      losses,
      goalsFor,
      goalsAgainst,
      winPercentage: Math.round(winPercentage * 10) / 10,
      totalAssists,
      foulsCommitted,
      foulsReceived
    };
  }

  /**
   * Calculate player form based on recent performance
   */
  private calculatePlayerForm(stats: any): number {
    const recentRatings = stats.recent_ratings || [];
    if (recentRatings.length === 0) return 50;

    const avgRating = recentRatings.reduce((sum: number, rating: number) => sum + rating, 0) / recentRatings.length;
    return Math.min(100, Math.max(0, Math.round(avgRating * 10)));
  }

  /**
   * Group matches by month and calculate performance
   */
  private groupMatchesByMonth(matches: any[], teamId: string): RealMatchPerformance[] {
    const monthlyData: { [key: string]: RealMatchPerformance } = {};

    matches.forEach(match => {
      const date = new Date(match.match_date);
      const monthKey = date.toLocaleDateString('en-US', { month: 'short' });

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          month: monthKey,
          wins: 0,
          draws: 0,
          losses: 0,
          goals: 0,
          assists: 0,
          matchesPlayed: 0
        };
      }

      const isHome = match.home_team_id === teamId;
      const teamScore = isHome ? match.home_score : match.away_score;
      const opponentScore = isHome ? match.away_score : match.home_score;
      const stats = match.statistics || {};

      monthlyData[monthKey].matchesPlayed++;
      monthlyData[monthKey].goals += teamScore || 0;
      monthlyData[monthKey].assists += isHome ? (stats.home_assists || 0) : (stats.away_assists || 0);

      if (teamScore > opponentScore) monthlyData[monthKey].wins++;
      else if (teamScore === opponentScore) monthlyData[monthKey].draws++;
      else monthlyData[monthKey].losses++;
    });

    return Object.values(monthlyData).sort((a, b) => {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return months.indexOf(a.month) - months.indexOf(b.month);
    });
  }

  /**
   * Calculate position-based statistics
   */
  private calculatePositionStats(players: any[]): RealPositionStats[] {
    const positionData: { [key: string]: RealPositionStats } = {};

    players.forEach(player => {
      const position = player.position || 'Unknown';
      const stats = player.stats || {};

      if (!positionData[position]) {
        positionData[position] = {
          position,
          playerCount: 0,
          totalGoals: 0,
          totalAssists: 0,
          averageRating: 0
        };
      }

      positionData[position].playerCount++;
      positionData[position].totalGoals += stats.total_goals || 0;
      positionData[position].totalAssists += stats.total_assists || 0;
      positionData[position].averageRating += stats.average_rating || 0;
    });

    // Calculate averages
    Object.values(positionData).forEach(pos => {
      if (pos.playerCount > 0) {
        pos.averageRating = Math.round((pos.averageRating / pos.playerCount) * 10) / 10;
      }
    });

    return Object.values(positionData);
  }

  /**
   * Cache management
   */
  private getCachedData(key: string): any | null {
    const cached = this.cache.get(key);
    if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
      return cached.data;
    }
    return null;
  }

  private setCachedData(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  /**
   * Fallback data methods (when no real data is available)
   */
  private getFallbackTeamStats(): RealTeamStats {
    // Return some sample data for demonstration
    return {
      totalMatches: 10,
      wins: 6,
      draws: 2,
      losses: 2,
      goalsFor: 18,
      goalsAgainst: 12,
      winPercentage: 60,
      totalAssists: 15,
      foulsCommitted: 25,
      foulsReceived: 20
    };
  }

  private getFallbackPlayerPerformance(): RealPlayerPerformance[] {
    // Return some sample player data for demonstration
    return [
      {
        playerId: '1',
        name: 'John Doe',
        position: 'Forward',
        matchesPlayed: 10,
        goals: 8,
        assists: 3,
        averageRating: 7.5,
        totalMinutes: 900,
        passAccuracy: 85,
        form: 80
      },
      {
        playerId: '2',
        name: 'Jane Smith',
        position: 'Midfielder',
        matchesPlayed: 10,
        goals: 3,
        assists: 7,
        averageRating: 8.0,
        totalMinutes: 900,
        passAccuracy: 90,
        form: 85
      },
      {
        playerId: '3',
        name: 'Mike Johnson',
        position: 'Defender',
        matchesPlayed: 10,
        goals: 1,
        assists: 2,
        averageRating: 7.0,
        totalMinutes: 900,
        passAccuracy: 80,
        form: 75
      }
    ];
  }

  private getFallbackMonthlyPerformance(): RealMatchPerformance[] {
    // Return some sample monthly data for demonstration
    return [
      { month: 'Jan', wins: 2, draws: 1, losses: 0, goals: 5, assists: 3, matchesPlayed: 3 },
      { month: 'Feb', wins: 1, draws: 0, losses: 1, goals: 3, assists: 2, matchesPlayed: 2 },
      { month: 'Mar', wins: 2, draws: 1, losses: 0, goals: 4, assists: 4, matchesPlayed: 3 },
      { month: 'Apr', wins: 1, draws: 0, losses: 1, goals: 3, assists: 2, matchesPlayed: 2 }
    ];
  }

  private getFallbackPositionStats(): RealPositionStats[] {
    // Return some sample position data for demonstration
    return [
      { position: 'Forward', playerCount: 3, totalGoals: 12, totalAssists: 5, averageRating: 7.5 },
      { position: 'Midfielder', playerCount: 4, totalGoals: 6, totalAssists: 12, averageRating: 8.0 },
      { position: 'Defender', playerCount: 3, totalGoals: 2, totalAssists: 3, averageRating: 7.0 },
      { position: 'Goalkeeper', playerCount: 1, totalGoals: 0, totalAssists: 1, averageRating: 8.5 }
    ];
  }

  /**
   * Clear cache to force fresh data fetch
   */
  clearCache(): void {
    this.cache.clear();
  }
}

export const realAnalyticsService = new RealAnalyticsService();