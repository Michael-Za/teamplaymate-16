// Demo analytics service that provides realistic mock data for demo mode
export interface DemoPlayerStats {
  id: string;
  name: string;
  position: string;
  matches: number;
  goals: number;
  assists: number;
  rating: number;
  minutes: number;
  passAccuracy: number;
  form: 'excellent' | 'good' | 'average' | 'poor';
  fitnessLevel: number;
  injuryRisk: number;
}

export interface DemoTeamStats {
  totalMatches: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  winPercentage: number;
  totalAssists: number;
  cleanSheets: number;
  yellowCards: number;
  redCards: number;
}

export interface DemoMatchStats {
  month: string;
  wins: number;
  draws: number;
  losses: number;
  goals: number;
  assists: number;
  matchesPlayed: number;
}

export interface DemoPositionStats {
  position: string;
  playerCount: number;
  totalGoals: number;
  totalAssists: number;
  averageRating: number;
}

class DemoAnalyticsService {
  // Generate realistic player stats for demo
  getPlayerStats(): DemoPlayerStats[] {
    return [
      {
        id: '1',
        name: 'Lionel Messi',
        position: 'RW',
        matches: 42,
        goals: 35,
        assists: 28,
        rating: 9.2,
        minutes: 3650,
        passAccuracy: 89,
        form: 'excellent',
        fitnessLevel: 95,
        injuryRisk: 15
      },
      {
        id: '2',
        name: 'Cristiano Ronaldo',
        position: 'ST',
        matches: 38,
        goals: 32,
        assists: 12,
        rating: 8.9,
        minutes: 3320,
        passAccuracy: 82,
        form: 'excellent',
        fitnessLevel: 92,
        injuryRisk: 25
      },
      {
        id: '3',
        name: 'Neymar Jr',
        position: 'LW',
        matches: 40,
        goals: 28,
        assists: 35,
        rating: 8.7,
        minutes: 3480,
        passAccuracy: 85,
        form: 'good',
        fitnessLevel: 88,
        injuryRisk: 40
      },
      {
        id: '4',
        name: 'Kylian Mbappé',
        position: 'ST',
        matches: 45,
        goals: 42,
        assists: 15,
        rating: 9.1,
        minutes: 3870,
        passAccuracy: 80,
        form: 'excellent',
        fitnessLevel: 96,
        injuryRisk: 10
      },
      {
        id: '5',
        name: 'Kevin De Bruyne',
        position: 'CM',
        matches: 44,
        goals: 12,
        assists: 48,
        rating: 8.8,
        minutes: 3780,
        passAccuracy: 92,
        form: 'excellent',
        fitnessLevel: 90,
        injuryRisk: 20
      },
      {
        id: '6',
        name: 'Virgil van Dijk',
        position: 'CB',
        matches: 39,
        goals: 5,
        assists: 3,
        rating: 8.5,
        minutes: 3450,
        passAccuracy: 88,
        form: 'good',
        fitnessLevel: 87,
        injuryRisk: 18
      },
      {
        id: '7',
        name: 'Thibaut Courtois',
        position: 'GK',
        matches: 37,
        goals: 0,
        assists: 1,
        rating: 8.6,
        minutes: 3330,
        passAccuracy: 75,
        form: 'good',
        fitnessLevel: 91,
        injuryRisk: 22
      },
      {
        id: '8',
        name: 'Erling Haaland',
        position: 'ST',
        matches: 41,
        goals: 38,
        assists: 8,
        rating: 9.0,
        minutes: 3620,
        passAccuracy: 78,
        form: 'excellent',
        fitnessLevel: 94,
        injuryRisk: 12
      },
      {
        id: '9',
        name: 'Mohamed Salah',
        position: 'RW',
        matches: 39,
        goals: 29,
        assists: 22,
        rating: 8.7,
        minutes: 3450,
        passAccuracy: 83,
        form: 'good',
        fitnessLevel: 89,
        injuryRisk: 28
      },
      {
        id: '10',
        name: 'Luka Modrić',
        position: 'CM',
        matches: 36,
        goals: 6,
        assists: 25,
        rating: 8.4,
        minutes: 3120,
        passAccuracy: 91,
        form: 'good',
        fitnessLevel: 85,
        injuryRisk: 30
      },
      {
        id: '11',
        name: 'Sergio Ramos',
        position: 'CB',
        matches: 34,
        goals: 3,
        assists: 2,
        rating: 8.2,
        minutes: 2980,
        passAccuracy: 85,
        form: 'good',
        fitnessLevel: 83,
        injuryRisk: 35
      },
      {
        id: '12',
        name: 'Karim Benzema',
        position: 'ST',
        matches: 35,
        goals: 22,
        assists: 18,
        rating: 8.6,
        minutes: 3050,
        passAccuracy: 84,
        form: 'good',
        fitnessLevel: 86,
        injuryRisk: 22
      }
    ];
  }

  // Generate realistic team stats for demo
  getTeamStats(): DemoTeamStats {
    return {
      totalMatches: 42,
      wins: 28,
      draws: 8,
      losses: 6,
      goalsFor: 102,
      goalsAgainst: 45,
      winPercentage: 66.7,
      totalAssists: 78,
      cleanSheets: 18,
      yellowCards: 62,
      redCards: 3
    };
  }

  // Generate realistic monthly performance data for demo
  getMonthlyPerformance(): DemoMatchStats[] {
    return [
      { month: 'Aug', wins: 5, draws: 1, losses: 0, goals: 18, assists: 12, matchesPlayed: 6 },
      { month: 'Sep', wins: 6, draws: 1, losses: 1, goals: 22, assists: 15, matchesPlayed: 8 },
      { month: 'Oct', wins: 5, draws: 2, losses: 1, goals: 19, assists: 18, matchesPlayed: 8 },
      { month: 'Nov', wins: 4, draws: 1, losses: 2, goals: 15, assists: 10, matchesPlayed: 7 },
      { month: 'Dec', wins: 3, draws: 2, losses: 1, goals: 12, assists: 8, matchesPlayed: 6 },
      { month: 'Jan', wins: 5, draws: 0, losses: 1, goals: 17, assists: 14, matchesPlayed: 6 }
    ];
  }

  // Generate realistic position statistics for demo
  getPositionStats(): DemoPositionStats[] {
    return [
      { position: 'ST', playerCount: 4, totalGoals: 126, totalAssists: 71, averageRating: 8.8 },
      { position: 'RW', playerCount: 2, totalGoals: 64, totalAssists: 50, averageRating: 8.7 },
      { position: 'LW', playerCount: 1, totalGoals: 28, totalAssists: 35, averageRating: 8.7 },
      { position: 'CM', playerCount: 2, totalGoals: 18, totalAssists: 73, averageRating: 8.6 },
      { position: 'CB', playerCount: 2, totalGoals: 8, totalAssists: 5, averageRating: 8.35 },
      { position: 'GK', playerCount: 1, totalGoals: 0, totalAssists: 1, averageRating: 8.6 }
    ];
  }

  // Generate realistic match history for demo
  getMatchHistory() {
    return [
      {
        id: '1',
        opponent: 'Real Madrid',
        date: '2024-01-15',
        result: '4-3',
        type: 'League',
        location: 'Home',
        goals: [
          { player: 'Messi', minute: 12 },
          { player: 'Mbappé', minute: 28 },
          { player: 'Messi', minute: 67 },
          { player: 'Haaland', minute: 89 }
        ],
        assists: [
          { player: 'De Bruyne', to: 'Messi' },
          { player: 'Neymar', to: 'Mbappé' },
          { player: 'Salah', to: 'Messi' },
          { player: 'De Bruyne', to: 'Haaland' }
        ]
      },
      {
        id: '2',
        opponent: 'Bayern Munich',
        date: '2024-01-10',
        result: '2-3',
        type: 'Champions League',
        location: 'Away',
        goals: [
          { player: 'Ronaldo', minute: 34 },
          { player: 'Benzema', minute: 78 }
        ],
        assists: [
          { player: 'Modrić', to: 'Ronaldo' },
          { player: 'Ramos', to: 'Benzema' }
        ]
      },
      {
        id: '3',
        opponent: 'Atlético Madrid',
        date: '2024-01-05',
        result: '2-0',
        type: 'League',
        location: 'Home',
        goals: [
          { player: 'Mbappé', minute: 45 },
          { player: 'Messi', minute: 72 }
        ],
        assists: [
          { player: 'De Bruyne', to: 'Mbappé' },
          { player: 'Neymar', to: 'Messi' }
        ]
      }
    ];
  }
}

export const demoAnalyticsService = new DemoAnalyticsService();