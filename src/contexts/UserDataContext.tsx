import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { userDataManager } from '../services/userDataManager';
import { Player, Team, Match, ClubData } from '../services/dataManagementService';
import { isDemoMode } from '../lib/supabase';

// Define the attendance record interface
interface AttendanceRecord {
  id: string;
  playerId: string;
  playerName: string;
  date: string;
  status: 'present' | 'absent' | 'late';
  notes?: string;
}

// Define the user data context type
interface UserDataContextType {
  players: Player[];
  teams: Team[];
  matches: Match[];
  clubData: ClubData | null;
  loading: boolean;
  error: string | null;
  initialized: boolean;
  refreshData: () => Promise<void>;
  addPlayer: (player: Omit<Player, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<Player | null>;
  updatePlayer: (id: string, updates: Partial<Player>) => Promise<Player | null>;
  deletePlayer: (id: string) => Promise<boolean>;
  addTeam: (team: Omit<Team, 'id' | 'owner_id' | 'created_at' | 'updated_at'>) => Promise<Team | null>;
  addMatch: (match: Omit<Match, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<Match | null>;
  updateClubData: (updates: Partial<ClubData>) => Promise<ClubData | null>;
  getAttendance: () => Promise<AttendanceRecord[]>; // Add attendance functions
  addAttendanceRecord: (record: Omit<AttendanceRecord, 'id'>) => Promise<AttendanceRecord | null>;
  updateAttendanceRecord: (id: string, updates: Partial<AttendanceRecord>) => Promise<AttendanceRecord | null>;
  deleteAttendanceRecord: (id: string) => Promise<boolean>;
}

// Create the context
const UserDataContext = createContext<UserDataContextType | undefined>(undefined);

// Provider component
export const UserDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isInitialized } = useAuth();
  const [players, setPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [clubData, setClubData] = useState<ClubData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  // Load user data when user is authenticated
  const loadData = useCallback(async () => {
    // In demo mode, don't try to load real user data
    if (isDemoMode) {
      setLoading(false);
      setInitialized(true);
      return;
    }

    if (!user?.id || !isInitialized) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Initialize user data manager with user ID
      userDataManager.init(user.id);
      
      // Check if user has data, initialize if not
      const hasData = await userDataManager.userHasData();
      if (!hasData) {
        await userDataManager.initializeUserData();
      }
      
      // Load all user data
      const userData = await userDataManager.loadUserData();
      if (userData) {
        setPlayers(userData.players);
        setTeams(userData.teams);
        setMatches(userData.matches);
        setClubData(userData.clubData);
        setInitialized(true);
      }
    } catch (err) {
      console.error('Error loading user data:', err);
      setError('Failed to load user data');
    } finally {
      setLoading(false);
    }
  }, [user, isInitialized]);

  // Refresh all data
  const refreshData = useCallback(async () => {
    await loadData();
  }, [loadData]);

  // Initialize data when user changes
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Subscribe to data updates
  useEffect(() => {
    // In demo mode, don't subscribe to real data updates
    if (isDemoMode || !user?.id) return;
    
    const unsubscribe = userDataManager.onDataUpdate((data) => {
      setPlayers(data.players);
      setTeams(data.teams);
      setMatches(data.matches);
      setClubData(data.clubData);
    });
    
    return unsubscribe;
  }, [user?.id]);

  // Player management functions
  const addPlayer = useCallback(async (player: Omit<Player, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    // In demo mode, don't try to add real player data
    if (isDemoMode) {
      console.log('Demo mode: Would add player', player);
      await refreshData();
      return null;
    }
    
    try {
      const result = await userDataManager.addPlayer(player);
      if (result) {
        await refreshData();
      }
      return result;
    } catch (err) {
      console.error('Error adding player:', err);
      setError('Failed to add player');
      return null;
    }
  }, [refreshData]);

  const updatePlayer = useCallback(async (id: string, updates: Partial<Player>) => {
    // In demo mode, don't try to update real player data
    if (isDemoMode) {
      console.log('Demo mode: Would update player', id, updates);
      await refreshData();
      return null;
    }
    
    try {
      const result = await userDataManager.updatePlayer(id, updates);
      if (result) {
        await refreshData();
      }
      return result;
    } catch (err) {
      console.error('Error updating player:', err);
      setError('Failed to update player');
      return null;
    }
  }, [refreshData]);

  const deletePlayer = useCallback(async (id: string) => {
    // In demo mode, don't try to delete real player data
    if (isDemoMode) {
      console.log('Demo mode: Would delete player', id);
      await refreshData();
      return false;
    }
    
    try {
      const result = await userDataManager.deletePlayer(id);
      if (result) {
        await refreshData();
      }
      return result;
    } catch (err) {
      console.error('Error deleting player:', err);
      setError('Failed to delete player');
      return false;
    }
  }, [refreshData]);

  // Team management functions
  const addTeam = useCallback(async (team: Omit<Team, 'id' | 'owner_id' | 'created_at' | 'updated_at'>) => {
    // In demo mode, don't try to add real team data
    if (isDemoMode) {
      console.log('Demo mode: Would add team', team);
      await refreshData();
      return null;
    }
    
    try {
      const result = await userDataManager.addTeam(team);
      if (result) {
        await refreshData();
      }
      return result;
    } catch (err) {
      console.error('Error adding team:', err);
      setError('Failed to add team');
      return null;
    }
  }, [refreshData]);

  // Match management functions
  const addMatch = useCallback(async (match: Omit<Match, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    // In demo mode, don't try to add real match data
    if (isDemoMode) {
      console.log('Demo mode: Would add match', match);
      await refreshData();
      return null;
    }
    
    try {
      const result = await userDataManager.addMatch(match);
      if (result) {
        await refreshData();
      }
      return result;
    } catch (err) {
      console.error('Error adding match:', err);
      setError('Failed to add match');
      return null;
    }
  }, [refreshData]);

  // Club data management functions
  const updateClubData = useCallback(async (updates: Partial<ClubData>) => {
    // In demo mode, don't try to update real club data
    if (isDemoMode) {
      console.log('Demo mode: Would update club data', updates);
      await refreshData();
      return null;
    }
    
    try {
      const result = await userDataManager.updateClubData(updates);
      if (result) {
        await refreshData();
      }
      return result;
    } catch (err) {
      console.error('Error updating club data:', err);
      setError('Failed to update club data');
      return null;
    }
  }, [refreshData]);

  // Attendance management functions
  const getAttendance = useCallback(async () => {
    // In demo mode, return empty array or mock data
    if (isDemoMode) {
      return [];
    }
    return await userDataManager.getAttendance();
  }, []);

  const addAttendanceRecord = useCallback(async (record: Omit<AttendanceRecord, 'id'>) => {
    // In demo mode, don't try to add real attendance data
    if (isDemoMode) {
      console.log('Demo mode: Would add attendance record', record);
      await refreshData();
      return null;
    }
    
    try {
      const result = await userDataManager.addAttendanceRecord(record);
      if (result) {
        await refreshData();
      }
      return result;
    } catch (err) {
      console.error('Error adding attendance record:', err);
      setError('Failed to add attendance record');
      return null;
    }
  }, [refreshData]);

  const updateAttendanceRecord = useCallback(async (id: string, updates: Partial<AttendanceRecord>) => {
    // In demo mode, don't try to update real attendance data
    if (isDemoMode) {
      console.log('Demo mode: Would update attendance record', id, updates);
      await refreshData();
      return null;
    }
    
    try {
      const result = await userDataManager.updateAttendanceRecord(id, updates);
      if (result) {
        await refreshData();
      }
      return result;
    } catch (err) {
      console.error('Error updating attendance record:', err);
      setError('Failed to update attendance record');
      return null;
    }
  }, [refreshData]);

  const deleteAttendanceRecord = useCallback(async (id: string) => {
    // In demo mode, don't try to delete real attendance data
    if (isDemoMode) {
      console.log('Demo mode: Would delete attendance record', id);
      await refreshData();
      return false;
    }
    
    try {
      const result = await userDataManager.deleteAttendanceRecord(id);
      if (result) {
        await refreshData();
      }
      return result;
    } catch (err) {
      console.error('Error deleting attendance record:', err);
      setError('Failed to delete attendance record');
      return false;
    }
  }, [refreshData]);

  const value = {
    players,
    teams,
    matches,
    clubData,
    loading,
    error,
    initialized,
    refreshData,
    addPlayer,
    updatePlayer,
    deletePlayer,
    addTeam,
    addMatch,
    updateClubData,
    getAttendance,
    addAttendanceRecord,
    updateAttendanceRecord,
    deleteAttendanceRecord
  };

  return (
    <UserDataContext.Provider value={value}>
      {children}
    </UserDataContext.Provider>
  );
};

// Custom hook to use the user data context
export const useUserData = () => {
  const context = useContext(UserDataContext);
  if (context === undefined) {
    throw new Error('useUserData must be used within a UserDataProvider');
  }
  return context;
};