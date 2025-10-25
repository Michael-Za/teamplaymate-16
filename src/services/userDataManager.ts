import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { Player, Team, Match, ClubData } from './dataManagementService';

// Define the attendance record interface
interface AttendanceRecord {
  id: string;
  playerId: string;
  playerName: string;
  date: string;
  status: 'present' | 'absent' | 'late';
  notes?: string;
}

// User data storage interface
interface UserDataSet {
  players: Player[];
  teams: Team[];
  matches: Match[];
  clubData: ClubData | null;
  attendance?: AttendanceRecord[]; // Add attendance data to user dataset
  createdAt: string;
  lastUpdated: string;
}

// Default empty dataset for new users
const DEFAULT_USER_DATASET: UserDataSet = {
  players: [],
  teams: [],
  matches: [],
  clubData: null,
  attendance: [], // Initialize with empty attendance array
  createdAt: new Date().toISOString(),
  lastUpdated: new Date().toISOString()
};

class UserDataManager {
  private userId: string | null = null;
  private cache = new Map<string, { data: any; timestamp: number }>();
  private cacheTimeout = 30 * 1000; // Reduce cache timeout to 30 seconds for fresher data
  private dataUpdateCallbacks: Array<(data: UserDataSet) => void> = [];

  // Initialize with user ID
  init(userId: string) {
    this.userId = userId;
    this.cache.clear();
  }

  // Register data update callback
  onDataUpdate(callback: (data: UserDataSet) => void) {
    this.dataUpdateCallbacks.push(callback);
    return () => {
      const index = this.dataUpdateCallbacks.indexOf(callback);
      if (index > -1) {
        this.dataUpdateCallbacks.splice(index, 1);
      }
    };
  }

  // Notify all callbacks of data updates
  private notifyDataUpdate(data: UserDataSet) {
    this.dataUpdateCallbacks.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error('Error in data update callback:', error);
      }
    });
  }

  // Cache management
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

  // Check if user data exists with timeout
  async userHasData(): Promise<boolean> {
    if (!this.userId) return false;
    
    try {
      // Add timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout

      const { data, error } = await supabase
        .from('user_datasets')
        .select('id')
        .eq('user_id', this.userId)
        .maybeSingle();
      
      clearTimeout(timeoutId);

      if (error) {
        console.error('Error checking user data:', error);
        return false;
      }
      
      return !!data;
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.warn('User data check timed out');
      } else {
        console.error('Error checking user data:', error);
      }
      return false;
    }
  }

  // Initialize user data for new users with timeout
  async initializeUserData(): Promise<boolean> {
    if (!this.userId) {
      console.error('User ID not set');
      return false;
    }

    try {
      // Check if user already has data
      const hasData = await this.userHasData();
      if (hasData) {
        console.log('User already has data, skipping initialization');
        return true;
      }

      // Add timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      // Create initial dataset
      const { data, error } = await supabase
        .from('user_datasets')
        .insert([{
          user_id: this.userId,
          data: DEFAULT_USER_DATASET,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .maybeSingle();

      clearTimeout(timeoutId);

      if (error) {
        console.error('Error initializing user data:', error);
        toast.error('Failed to initialize user data');
        return false;
      }

      console.log('User data initialized successfully');
      this.notifyDataUpdate(DEFAULT_USER_DATASET);
      return true;
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.warn('User data initialization timed out');
      } else {
        console.error('Error initializing user data:', error);
      }
      toast.error('Failed to initialize user data');
      return false;
    }
  }

  // Load user data with timeout
  async loadUserData(): Promise<UserDataSet | null> {
    if (!this.userId) {
      console.error('User ID not set');
      return null;
    }

    try {
      // Check cache first
      const cached = this.getCachedData('user_data');
      if (cached) {
        return cached;
      }

      // Add timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      // Load from database
      const { data, error } = await supabase
        .from('user_datasets')
        .select('data')
        .eq('user_id', this.userId)
        .maybeSingle();

      clearTimeout(timeoutId);

      if (error) {
        console.error('Error loading user data:', error);
        return null;
      }

      if (!data) {
        // No data found, initialize with default
        await this.initializeUserData();
        return DEFAULT_USER_DATASET;
      }

      const userData = data.data as UserDataSet;
      this.setCachedData('user_data', userData);
      return userData;
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.warn('User data loading timed out');
      } else {
        console.error('Error loading user data:', error);
      }
      return null;
    }
  }

  // Save user data with timeout
  async saveUserData(userData: UserDataSet): Promise<boolean> {
    if (!this.userId) {
      console.error('User ID not set');
      return false;
    }

    try {
      const updatedData = {
        ...userData,
        lastUpdated: new Date().toISOString()
      };

      // Add timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      const { error } = await supabase
        .from('user_datasets')
        .update({
          data: updatedData,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', this.userId);

      clearTimeout(timeoutId);

      if (error) {
        console.error('Error saving user data:', error);
        toast.error('Failed to save data');
        return false;
      }

      // Update cache
      this.setCachedData('user_data', updatedData);
      this.notifyDataUpdate(updatedData);
      return true;
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.warn('User data saving timed out');
      } else {
        console.error('Error saving user data:', error);
      }
      toast.error('Failed to save data');
      return false;
    }
  }

  // Player management
  async getPlayers(): Promise<Player[]> {
    const userData = await this.loadUserData();
    return userData?.players || [];
  }

  async addPlayer(player: Omit<Player, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<Player | null> {
    try {
      if (!this.userId) {
        toast.error('User not authenticated');
        return null;
      }

      const userData = await this.loadUserData();
      if (!userData) {
        toast.error('Failed to load user data');
        return null;
      }

      const newPlayer: Player = {
        ...player,
        id: Date.now().toString(),
        user_id: this.userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      userData.players.push(newPlayer);
      const success = await this.saveUserData(userData);
      
      if (success) {
        toast.success('Player added successfully');
        return newPlayer;
      }
      
      return null;
    } catch (error) {
      console.error('Error adding player:', error);
      toast.error('Failed to add player');
      return null;
    }
  }

  async updatePlayer(id: string, updates: Partial<Player>): Promise<Player | null> {
    try {
      if (!this.userId) {
        toast.error('User not authenticated');
        return null;
      }

      const userData = await this.loadUserData();
      if (!userData) {
        toast.error('Failed to load user data');
        return null;
      }

      const playerIndex = userData.players.findIndex(p => p.id === id);
      if (playerIndex === -1) {
        toast.error('Player not found');
        return null;
      }

      const updatedPlayer = {
        ...userData.players[playerIndex],
        ...updates,
        updated_at: new Date().toISOString()
      };

      userData.players[playerIndex] = updatedPlayer;
      const success = await this.saveUserData(userData);
      
      if (success) {
        toast.success('Player updated successfully');
        return updatedPlayer;
      }
      
      return null;
    } catch (error) {
      console.error('Error updating player:', error);
      toast.error('Failed to update player');
      return null;
    }
  }

  async deletePlayer(id: string): Promise<boolean> {
    try {
      if (!this.userId) {
        toast.error('User not authenticated');
        return false;
      }

      const userData = await this.loadUserData();
      if (!userData) {
        toast.error('Failed to load user data');
        return false;
      }

      const playerIndex = userData.players.findIndex(p => p.id === id);
      if (playerIndex === -1) {
        toast.error('Player not found');
        return false;
      }

      userData.players.splice(playerIndex, 1);
      const success = await this.saveUserData(userData);
      
      if (success) {
        toast.success('Player deleted successfully');
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error deleting player:', error);
      toast.error('Failed to delete player');
      return false;
    }
  }

  // Team management
  async getTeams(): Promise<Team[]> {
    const userData = await this.loadUserData();
    return userData?.teams || [];
  }

  async addTeam(team: Omit<Team, 'id' | 'owner_id' | 'created_at' | 'updated_at'>): Promise<Team | null> {
    try {
      if (!this.userId) {
        toast.error('User not authenticated');
        return null;
      }

      const userData = await this.loadUserData();
      if (!userData) {
        toast.error('Failed to load user data');
        return null;
      }

      const newTeam: Team = {
        ...team,
        id: Date.now().toString(),
        owner_id: this.userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      userData.teams.push(newTeam);
      const success = await this.saveUserData(userData);
      
      if (success) {
        toast.success('Team added successfully');
        return newTeam;
      }
      
      return null;
    } catch (error) {
      console.error('Error adding team:', error);
      toast.error('Failed to add team');
      return null;
    }
  }

  // Match management
  async getMatches(): Promise<Match[]> {
    const userData = await this.loadUserData();
    return userData?.matches || [];
  }

  async addMatch(match: Omit<Match, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<Match | null> {
    try {
      if (!this.userId) {
        toast.error('User not authenticated');
        return null;
      }

      const userData = await this.loadUserData();
      if (!userData) {
        toast.error('Failed to load user data');
        return null;
      }

      const newMatch: Match = {
        ...match,
        id: Date.now().toString(),
        user_id: this.userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      userData.matches.push(newMatch);
      const success = await this.saveUserData(userData);
      
      if (success) {
        toast.success('Match added successfully');
        return newMatch;
      }
      
      return null;
    } catch (error) {
      console.error('Error adding match:', error);
      toast.error('Failed to add match');
      return null;
    }
  }

  // Club data management functions
  async updateClubData(updates: Partial<ClubData>): Promise<ClubData | null> {
    try {
      if (!this.userId) {
        toast.error('User not authenticated');
        return null;
      }

      const userData = await this.loadUserData();
      if (!userData) {
        toast.error('Failed to load user data');
        return null;
      }

      // Ensure the club data has a name
      const updatedClubData = {
        ...userData.clubData,
        ...updates,
        id: userData.clubData?.id || Date.now().toString(),
        name: updates.name || userData.clubData?.name || 'My Club' // Ensure name is always present
      };

      userData.clubData = updatedClubData;
      const success = await this.saveUserData(userData);
      
      if (success) {
        toast.success('Club data updated successfully');
        return updatedClubData;
      }
      
      return null;
    } catch (error) {
      console.error('Error updating club data:', error);
      toast.error('Failed to update club data');
      return null;
    }
  }

  // Attendance management functions
  async getAttendance(): Promise<AttendanceRecord[]> {
    const userData = await this.loadUserData();
    return userData?.attendance || [];
  }

  async addAttendanceRecord(record: Omit<AttendanceRecord, 'id'>): Promise<AttendanceRecord | null> {
    try {
      if (!this.userId) {
        toast.error('User not authenticated');
        return null;
      }

      const userData = await this.loadUserData();
      if (!userData) {
        toast.error('Failed to load user data');
        return null;
      }

      const newRecord: AttendanceRecord = {
        ...record,
        id: Date.now().toString()
      };

      if (!userData.attendance) {
        userData.attendance = [];
      }
      
      userData.attendance.push(newRecord);
      const success = await this.saveUserData(userData);
      
      if (success) {
        toast.success('Attendance record added successfully');
        return newRecord;
      }
      
      return null;
    } catch (error) {
      console.error('Error adding attendance record:', error);
      toast.error('Failed to add attendance record');
      return null;
    }
  }

  async updateAttendanceRecord(id: string, updates: Partial<AttendanceRecord>): Promise<AttendanceRecord | null> {
    try {
      if (!this.userId) {
        toast.error('User not authenticated');
        return null;
      }

      const userData = await this.loadUserData();
      if (!userData || !userData.attendance) {
        toast.error('Failed to load user data');
        return null;
      }

      const recordIndex = userData.attendance.findIndex(r => r.id === id);
      if (recordIndex === -1) {
        toast.error('Attendance record not found');
        return null;
      }

      const updatedRecord = {
        ...userData.attendance[recordIndex],
        ...updates
      };

      userData.attendance[recordIndex] = updatedRecord;
      const success = await this.saveUserData(userData);
      
      if (success) {
        toast.success('Attendance record updated successfully');
        return updatedRecord;
      }
      
      return null;
    } catch (error) {
      console.error('Error updating attendance record:', error);
      toast.error('Failed to update attendance record');
      return null;
    }
  }

  async deleteAttendanceRecord(id: string): Promise<boolean> {
    try {
      if (!this.userId) {
        toast.error('User not authenticated');
        return false;
      }

      const userData = await this.loadUserData();
      if (!userData || !userData.attendance) {
        toast.error('Failed to load user data');
        return false;
      }

      const recordIndex = userData.attendance.findIndex(r => r.id === id);
      if (recordIndex === -1) {
        toast.error('Attendance record not found');
        return false;
      }

      userData.attendance.splice(recordIndex, 1);
      const success = await this.saveUserData(userData);
      
      if (success) {
        toast.success('Attendance record deleted successfully');
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error deleting attendance record:', error);
      toast.error('Failed to delete attendance record');
      return false;
    }
  }
}

export const userDataManager = new UserDataManager();