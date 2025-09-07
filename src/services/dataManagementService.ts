// Production Data Management Service with Backend API Integration
import { api } from '../lib/api';
import { toast } from 'sonner';
import axios from 'axios';

export interface Player {
  id?: string;
  name: string;
  first_name?: string;
  last_name?: string;
  position: string;
  number?: number;
  age?: number;
  nationality?: string;
  email?: string;
  phone?: string;
  address?: string;
  date_of_birth?: string;
  contract_end?: string;
  contractEnd?: string;
  salary?: number;
  fitness?: number;
  injuries?: string[];
  notes?: string;
  skills?: {
    technical: number;
    physical: number;
    tactical: number;
    mental: number;
  };
  medicalClearance?: boolean;
  lastMedicalCheck?: string;
  joinDate?: string;
  goals?: number;
  assists?: number;
  minutes?: number;
  team_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ClubData {
  id?: string;
  name: string;
  founded: number;
  stadium: string;
  capacity: number;
  address: string;
  phone: string;
  email: string;
  budget: number;
  trophies: number;
  notes: string;
  staff: {
    coaches: number;
    medical: number;
    administrative: number;
  };
  facilities: {
    trainingGrounds: number;
    medicalCenter: boolean;
    gym: boolean;
    restaurant: boolean;
  };
  sponsors: {
    main: string;
    secondary: string[];
  };
  president?: string;
  headCoach?: string;
  website?: string;
  created_at?: string;
  updated_at?: string;
}

class DataManagementService {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes

  private getCachedData(key: string): any | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  private setCachedData(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  /**
   * Get all players for the current user's teams
   */
  async getPlayers(teamId?: string): Promise<Player[]> {
    try {
      const cacheKey = `players_${teamId || 'all'}`;
      const cached = this.getCachedData(cacheKey);
      if (cached) return cached;

      const token = localStorage.getItem('auth_token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      let url = api.players.list;
      if (teamId) {
        url += `?teamId=${teamId}`;
      }

      // Add timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await axios.get(url, { 
        headers,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      const players = response.data?.data || response.data || [];
      
      // Transform players if they have the API format
      const transformedPlayers = players.map((player: any) => 
        this.transformPlayerData(player)
      );
      
      this.setCachedData(cacheKey, transformedPlayers);
      return transformedPlayers;
    } catch (error: any) {
      // Handle timeout specifically
      if (error.name === 'AbortError' || error.code === 'ECONNABORTED') {
        console.warn('Player data request timed out');
        toast.warning('Request timed out. Showing demo data instead.');
      } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
        console.warn('Connection to server failed');
        toast.warning('Unable to connect to server. Showing demo data instead.');
      } else {
        console.error('Error fetching players:', error);
      }
      
      // Always fall back to mock data when API fails
      const fallbackPlayers = this.getFallbackPlayers();
      return fallbackPlayers;
    }
  }

  /**
   * Create a new player with Backend API
   */
  async createPlayer(playerData: Partial<Player>): Promise<Player | null> {
    try {
      const token = localStorage.getItem('auth_token');
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      };

      const response = await axios.post(api.players.create, playerData, { headers });
      const player = response.data?.data || response.data;

      // Clear cache
      this.clearPlayerCache();
      toast.success('Player created successfully');
      return player;
    } catch (error: any) {
      console.error('Error creating player:', error);
      const message = error.response?.data?.message || error.message || 'Failed to create player';
      toast.error(message);
      return null;
    }
  }

  /**
   * Update a player with Backend API
   */
  async updatePlayer(playerId: string, updates: Partial<Player>): Promise<Player | null> {
    try {
      const token = localStorage.getItem('auth_token');
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      };

      const response = await axios.put(api.players.update(playerId), updates, { headers });
      const player = response.data?.data || response.data;

      // Clear cache
      this.clearPlayerCache();
      toast.success('Player updated successfully');
      return player;
    } catch (error: any) {
      console.error('Error updating player:', error);
      const message = error.response?.data?.message || error.message || 'Failed to update player';
      toast.error(message);
      return null;
    }
  }

  /**
   * Delete a player with Backend API
   */
  async deletePlayer(playerId: string): Promise<boolean> {
    try {
      const token = localStorage.getItem('auth_token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      await axios.delete(api.players.delete(playerId), { headers });

      // Clear cache
      this.clearPlayerCache();
      toast.success('Player deleted successfully');
      return true;
    } catch (error: any) {
      console.error('Error deleting player:', error);
      const message = error.response?.data?.message || error.message || 'Failed to delete player';
      toast.error(message);
      return false;
    }
  }

  private clearPlayerCache(): void {
    const keys = Array.from(this.cache.keys()).filter(key => key.startsWith('players_'));
    keys.forEach(key => this.cache.delete(key));
  }

  /**
   * Get club data
   */
  async getClubData(): Promise<ClubData> {
    const cacheKey = 'club_data';
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      const token = localStorage.getItem('auth_token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      // Add timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await axios.get(api.teams.list, { 
        headers,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      const teams = response.data?.data || response.data || [];
      
      // Get the first team as club data, or use fallback
      const clubData = teams.length > 0 ? this.transformTeamToClubData(teams[0]) : this.getFallbackClubData();
      this.setCachedData(cacheKey, clubData);
      return clubData;
    } catch (error: any) {
      // Handle timeout specifically
      if (error.name === 'AbortError' || error.code === 'ECONNABORTED') {
        console.warn('Club data request timed out');
        toast.warning('Request timed out. Showing demo club data instead.');
      } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
        console.warn('Connection to server failed');
        toast.warning('Unable to connect to server. Showing demo club data instead.');
      } else {
        console.error('Error fetching club data:', error);
      }
      
      // Always fall back to mock data when API fails
      const fallbackClubData = this.getFallbackClubData();
      return fallbackClubData;
    }
  }

  /**
   * Update club data
   */
  async updateClubData(clubData: Partial<ClubData>): Promise<ClubData> {
    try {
      const token = localStorage.getItem('auth_token');
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      };
      
      // Get current teams to find the team to update
      const response = await axios.get(api.teams.list, { headers });
      const teams = response.data?.data || response.data || [];
      
      if (teams.length > 0) {
        const teamId = teams[0].id;
        const updateResponse = await axios.put(api.teams.update(teamId), clubData, { headers });
        const updatedTeam = updateResponse.data?.data || updateResponse.data;
        const updatedClubData = this.transformTeamToClubData(updatedTeam);
        this.setCachedData('club_data', updatedClubData);
        return updatedClubData;
      } else {
        // Create new team if none exists
        const createResponse = await axios.post(api.teams.create, clubData, { headers });
        const newTeam = createResponse.data?.data || createResponse.data;
        const newClubData = this.transformTeamToClubData(newTeam);
        this.setCachedData('club_data', newClubData);
        return newClubData;
      }
    } catch (error) {
      console.error('Error updating club data:', error);
      throw error;
    }
  }

  /**
   * Transform team data to club data format
   */
  private transformTeamToClubData(team: any): ClubData {
    return {
      id: team.id,
      name: team.name || 'My Team',
      founded: team.founded || new Date().getFullYear(),
      stadium: team.stadium || 'Home Stadium',
      capacity: team.capacity || 50000,
      address: team.address || '',
      phone: team.phone || '',
      email: team.email || '',
      budget: team.budget || 1000000,
      trophies: team.trophies || 0,
      notes: team.notes || '',
      staff: team.staff || {
        coaches: 5,
        medical: 3,
        administrative: 8
      },
      facilities: team.facilities || {
        trainingGrounds: 2,
        medicalCenter: true,
        gym: true,
        restaurant: true
      },
      sponsors: team.sponsors || {
        main: 'Main Sponsor',
        secondary: ['Sponsor 1', 'Sponsor 2']
      },
      president: team.president || '',
      headCoach: team.headCoach || team.head_coach || '',
      website: team.website || '',
      created_at: team.created_at,
      updated_at: team.updated_at
    };
  }

  /**
   * Transform API player data to our Player interface
   */
  private transformPlayerData(apiPlayer: any): Player {
    const now = new Date().toISOString();
    const firstName = apiPlayer.first_name || apiPlayer.name?.split(' ')[0] || '';
    const lastName = apiPlayer.last_name || apiPlayer.name?.split(' ').slice(1).join(' ') || '';
    return {
      id: apiPlayer.id?.toString() || '',
      name: `${firstName} ${lastName}`.trim() || 'Unknown Player',
      first_name: firstName,
      last_name: lastName,
      position: this.mapPosition(apiPlayer.position) || 'DEL',
      age: apiPlayer.age || this.calculateAge(apiPlayer.date_of_birth) || 25,
      nationality: apiPlayer.nationality || 'Unknown',
      email: apiPlayer.email || '',
      phone: apiPlayer.phone || '',
      address: apiPlayer.address || '',
      date_of_birth: apiPlayer.date_of_birth || '',
      contract_end: apiPlayer.contract_end || '',
      salary: apiPlayer.salary || 0,
      team_id: apiPlayer.team_id || '',
      goals: apiPlayer.statistics?.goals || 0,
      assists: apiPlayer.statistics?.assists || 0,
      minutes: apiPlayer.statistics?.minutes || 0,
      fitness: apiPlayer.fitness || Math.floor(Math.random() * 20) + 80,
      injuries: apiPlayer.injuries || [],
      notes: apiPlayer.notes || '',
      skills: {
        technical: apiPlayer.skills?.technical || Math.floor(Math.random() * 30) + 70,
        physical: apiPlayer.skills?.physical || Math.floor(Math.random() * 30) + 70,
        tactical: apiPlayer.skills?.tactical || Math.floor(Math.random() * 30) + 70,
        mental: apiPlayer.skills?.mental || Math.floor(Math.random() * 30) + 70
      },
      medicalClearance: apiPlayer.medicalClearance ?? true,
      lastMedicalCheck: apiPlayer.lastMedicalCheck || new Date().toISOString().split('T')[0],
      joinDate: apiPlayer.join_date || apiPlayer.joinDate || new Date().toISOString().split('T')[0],
      contractEnd: apiPlayer.contract_end || apiPlayer.contractEnd || '',
      number: apiPlayer.jersey_number || Math.floor(Math.random() * 99) + 1,
      created_at: apiPlayer.created_at || now,
      updated_at: apiPlayer.updated_at || now
    };
  }

  /**
   * Transform our Player data for API submission
   */
  private transformPlayerForAPI(player: Partial<Player>): any {
    return {
      first_name: player.first_name || player.name?.split(' ')[0],
      last_name: player.last_name || player.name?.split(' ').slice(1).join(' '),
      position: player.position,
      age: player.age,
      nationality: player.nationality,
      email: player.email,
      phone: player.phone,
      address: player.address,
      date_of_birth: player.date_of_birth,
      contract_end: player.contract_end || player.contractEnd,
      salary: player.salary,
      fitness: player.fitness,
      injuries: player.injuries,
      notes: player.notes,
      skills: player.skills,
      medicalClearance: player.medicalClearance,
      lastMedicalCheck: player.lastMedicalCheck,
      join_date: player.joinDate
    };
  }

  /**
   * Map API position to our position format
   */
  private mapPosition(apiPosition: string): string {
    const positionMap: { [key: string]: string } = {
      'forward': 'DEL',
      'striker': 'DEL',
      'midfielder': 'CEN',
      'midfield': 'CEN',
      'defender': 'DEF',
      'defense': 'DEF',
      'goalkeeper': 'POR',
      'keeper': 'POR'
    };
    
    return positionMap[apiPosition?.toLowerCase()] || apiPosition || 'DEL';
  }

  /**
   * Calculate age from date of birth
   */
  private calculateAge(dateOfBirth: string): number {
    if (!dateOfBirth) return 25;
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }

  /**
   * Generate fallback players data for demo purposes
   */
  private getFallbackPlayers(): Player[] {
    const now = new Date().toISOString();
    const positions = ['DEL', 'CEN', 'DEF', 'POR'];
    
    return [
      {
        id: '1',
        name: 'Lionel Messi',
        position: 'DEL',
        age: 36,
        nationality: 'Argentina',
        email: 'lionel@example.com',
        phone: '+1234567890',
        address: '123 Barcelona St, Spain',
        date_of_birth: '1987-06-24',
        contract_end: '2025-06-30',
        salary: 750000,
        fitness: 92,
        injuries: [],
        notes: 'Exceptional dribbling and finishing skills',
        skills: {
          technical: 95,
          physical: 80,
          tactical: 88,
          mental: 90
        },
        medicalClearance: true,
        lastMedicalCheck: '2024-01-15',
        joinDate: '2023-07-01',
        goals: 35,
        assists: 18,
        minutes: 2850,
        team_id: '1',
        created_at: now,
        updated_at: now
      },
      {
        id: '2',
        name: 'Cristiano Ronaldo',
        position: 'DEL',
        age: 39,
        nationality: 'Portugal',
        email: 'cristiano@example.com',
        phone: '+1234567891',
        address: '456 Turin Ave, Italy',
        date_of_birth: '1985-02-05',
        contract_end: '2025-06-30',
        salary: 700000,
        fitness: 88,
        injuries: ['Knee'],
        notes: 'Powerful shooter with great aerial ability',
        skills: {
          technical: 90,
          physical: 85,
          tactical: 82,
          mental: 92
        },
        medicalClearance: true,
        lastMedicalCheck: '2024-01-20',
        joinDate: '2023-07-01',
        goals: 28,
        assists: 12,
        minutes: 2700,
        team_id: '1',
        created_at: now,
        updated_at: now
      },
      {
        id: '3',
        name: 'Kevin De Bruyne',
        position: 'CEN',
        age: 32,
        nationality: 'Belgium',
        email: 'kevin@example.com',
        phone: '+1234567892',
        address: '789 Manchester Rd, UK',
        date_of_birth: '1991-06-28',
        contract_end: '2026-06-30',
        salary: 600000,
        fitness: 90,
        injuries: [],
        notes: 'Excellent passer and playmaker',
        skills: {
          technical: 92,
          physical: 85,
          tactical: 90,
          mental: 88
        },
        medicalClearance: true,
        lastMedicalCheck: '2024-01-10',
        joinDate: '2023-07-01',
        goals: 12,
        assists: 25,
        minutes: 2800,
        team_id: '1',
        created_at: now,
        updated_at: now
      },
      {
        id: '4',
        name: 'Virgil van Dijk',
        position: 'DEF',
        age: 32,
        nationality: 'Netherlands',
        email: 'virgil@example.com',
        phone: '+1234567893',
        address: '101 Liverpool Ln, UK',
        date_of_birth: '1991-07-08',
        contract_end: '2026-06-30',
        salary: 450000,
        fitness: 94,
        injuries: [],
        notes: 'Dominant center-back with great leadership',
        skills: {
          technical: 85,
          physical: 92,
          tactical: 88,
          mental: 90
        },
        medicalClearance: true,
        lastMedicalCheck: '2024-01-12',
        joinDate: '2023-07-01',
        goals: 5,
        assists: 3,
        minutes: 2750,
        team_id: '1',
        created_at: now,
        updated_at: now
      },
      {
        id: '5',
        name: 'Manuel Neuer',
        position: 'POR',
        age: 37,
        nationality: 'Germany',
        email: 'manuel@example.com',
        phone: '+1234567894',
        address: '202 Munich Blvd, Germany',
        date_of_birth: '1986-03-27',
        contract_end: '2025-06-30',
        salary: 400000,
        fitness: 89,
        injuries: [],
        notes: 'Sweeper-keeper with excellent distribution',
        skills: {
          technical: 88,
          physical: 85,
          tactical: 87,
          mental: 91
        },
        medicalClearance: true,
        lastMedicalCheck: '2024-01-08',
        joinDate: '2023-07-01',
        goals: 0,
        assists: 2,
        minutes: 2700,
        team_id: '1',
        created_at: now,
        updated_at: now
      }
    ];
  }

  /**
   * Generate fallback club data for demo purposes
   */
  private getFallbackClubData(): ClubData {
    const now = new Date().toISOString();
    
    return {
      id: '1',
      name: 'Demo FC',
      founded: 1902,
      stadium: 'Demo Stadium',
      capacity: 80000,
      address: '123 Football Ave, City, Country',
      phone: '+1234567890',
      email: 'info@demofc.com',
      budget: 25000000,
      trophies: 15,
      notes: 'Demo club for testing purposes',
      staff: {
        coaches: 8,
        medical: 5,
        administrative: 12
      },
      facilities: {
        trainingGrounds: 3,
        medicalCenter: true,
        gym: true,
        restaurant: true
      },
      sponsors: {
        main: 'Demo Corp',
        secondary: ['Sponsor A', 'Sponsor B', 'Sponsor C']
      },
      president: 'John President',
      headCoach: 'Jane Coach',
      website: 'www.demofc.com',
      created_at: now,
      updated_at: now
    };
  }

  /**
   * Clear all cached data
   */
  clearCache(): void {
    this.cache.clear();
  }
}

// Export singleton instance
export const dataManagementService = new DataManagementService();