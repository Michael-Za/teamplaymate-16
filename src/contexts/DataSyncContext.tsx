import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { dataManagementService } from '../services/dataManagementService';
import { userDataManager } from '../services/userDataManager';
import { 
  mockPlayers, 
  mockMatches, 
  mockClubData, 
  mockAttendanceData,
  getAllMockData
} from '../services/mockDataService';
import { isDemoMode } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { useUserData } from './UserDataContext';

// Define the player action interface
export interface PlayerAction {
  id: string;
  playerId: string;
  playerName: string;
  actionType: string;
  minute: number;
  second: number;
  matchId: string;
  matchName: string;
  timestamp: string;
  details?: string;
  position?: {
    x: number;
    y: number;
    area: string;
  };
  created_at?: string;
}

// Define the data types
interface Player {
  id?: string;
  name: string;
  position: string;
  jersey_number?: number;
  age?: number;
  nationality?: string;
  [key: string]: any; // Allow additional properties
}

interface Match {
  id?: string;
  team_id?: string;
  opponent_name: string;
  match_date: string;
  [key: string]: any; // Allow additional properties
}

interface ClubData {
  id?: string;
  name: string;
  [key: string]: any; // Allow additional properties
}

interface AttendanceRecord {
  id: string;
  playerId: string;
  playerName: string;
  date: string;
  status: 'present' | 'absent' | 'late';
  notes?: string;
}

// Define the context type
interface DataSyncContextType {
  players: Player[];
  matches: Match[];
  clubData: ClubData | null;
  attendance: AttendanceRecord[];
  playerActions: PlayerAction[];
  loading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
  updatePlayer: (id: string, updates: Partial<Player>) => Promise<void>;
  addPlayer: (player: Omit<Player, 'id'>) => Promise<void>;
  deletePlayer: (id: string) => Promise<void>;
  addAttendanceRecord?: (record: Omit<AttendanceRecord, 'id'>) => Promise<void>; // Add attendance functions
  updateAttendanceRecord?: (id: string, updates: Partial<AttendanceRecord>) => Promise<void>;
  deleteAttendanceRecord?: (id: string) => Promise<void>;
  addPlayerAction?: (action: Omit<PlayerAction, 'id'>) => Promise<void>; // Add player action functions
  deletePlayerAction?: (id: string) => Promise<void>;
}

// Create the context
const DataSyncContext = createContext<DataSyncContextType | undefined>(undefined);

// Provider component
export const DataSyncProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const userDataContext = useUserData();
  const [players, setPlayers] = useState<Player[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [clubData, setClubData] = useState<ClubData | null>(null);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [playerActions, setPlayerActions] = useState<PlayerAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load data based on user type (demo or real)
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // For demo mode or when no user is authenticated, use mock data
        if (isDemoMode || !user) {
          setPlayers(mockPlayers);
          setMatches(mockMatches);
          setClubData(mockClubData);
          
          // Load attendance data from localStorage or use mock data
          try {
            const savedAttendance = localStorage.getItem('statsor_attendance');
            if (savedAttendance) {
              setAttendance(JSON.parse(savedAttendance));
            } else {
              // Fix the TypeScript error by specifying the correct status type
              const typedAttendanceData = mockAttendanceData.map(record => ({
                ...record,
                status: record.status as 'present' | 'absent' | 'late'
              }));
              setAttendance(typedAttendanceData);
            }
          } catch (e) {
            console.warn('Failed to load attendance data:', e);
            // Fallback to mock data
            const typedAttendanceData = mockAttendanceData.map(record => ({
              ...record,
              status: record.status as 'present' | 'absent' | 'late'
            }));
            setAttendance(typedAttendanceData);
          }
          
          // Load player actions from localStorage
          try {
            const savedPlayerActions = localStorage.getItem('statsor_player_actions');
            if (savedPlayerActions) {
              setPlayerActions(JSON.parse(savedPlayerActions));
            } else {
              setPlayerActions([]);
            }
          } catch (e) {
            console.warn('Failed to load player actions:', e);
            setPlayerActions([]);
          }
        } else {
          // For real users, use the user data context
          if (userDataContext && userDataContext.initialized) {
            setPlayers(userDataContext.players);
            setMatches(userDataContext.matches);
            setClubData(userDataContext.clubData);
            
            // Load attendance data from user data context
            try {
              const userAttendance = await userDataContext.getAttendance();
              setAttendance(userAttendance);
            } catch (e) {
              console.warn('Failed to load user attendance:', e);
              setAttendance([]);
            }
            
            // Load player actions from user data context (if available)
            setPlayerActions([]);
          }
        }
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Failed to load data');
        
        // Fallback to mock data
        setPlayers(mockPlayers);
        setMatches(mockMatches);
        setClubData(mockClubData);
        // Fix the TypeScript error by specifying the correct status type
        const typedAttendanceData = mockAttendanceData.map(record => ({
          ...record,
          status: record.status as 'present' | 'absent' | 'late'
        }));
        setAttendance(typedAttendanceData);
      } finally {
        setLoading(false);
      }
    };

    // Add a small delay to prevent blocking the UI
    const timer = setTimeout(() => {
      loadData();
    }, 0);

    return () => clearTimeout(timer);
  }, [user, userDataContext]);

  const refreshData = async () => {
    if (!isDemoMode && user && userDataContext.initialized) {
      await userDataContext.refreshData();
    }
  };

  const updatePlayer = async (id: string, updates: Partial<Player>) => {
    if (!isDemoMode && user && userDataContext.initialized) {
      await userDataContext.updatePlayer(id, updates);
    } else {
      // In demo mode, we don't actually update data, just simulate it
      console.log('Demo mode: Would update player', id, updates);
    }
  };

  const addPlayer = async (player: Omit<Player, 'id'>) => {
    if (!isDemoMode && user && userDataContext.initialized) {
      await userDataContext.addPlayer(player as any);
    } else {
      // In demo mode, we don't actually add data, just simulate it
      console.log('Demo mode: Would add player', player);
    }
  };

  const deletePlayer = async (id: string) => {
    if (!isDemoMode && user && userDataContext.initialized) {
      await userDataContext.deletePlayer(id);
    } else {
      // In demo mode, we don't actually delete data, just simulate it
      console.log('Demo mode: Would delete player', id);
    }
  };

  // Attendance management functions
  const addAttendanceRecord = async (record: Omit<AttendanceRecord, 'id'>) => {
    if (!isDemoMode && user && userDataContext.initialized) {
      await userDataContext.addAttendanceRecord(record);
    } else {
      // In demo mode, store in localStorage
      const savedAttendance = localStorage.getItem('statsor_attendance');
      let currentAttendance: AttendanceRecord[] = [];
      
      if (savedAttendance) {
        currentAttendance = JSON.parse(savedAttendance);
      }
      
      const newRecord: AttendanceRecord = {
        ...record,
        id: Date.now().toString()
      };
      
      currentAttendance.push(newRecord);
      localStorage.setItem('statsor_attendance', JSON.stringify(currentAttendance));
      setAttendance(currentAttendance);
    }
  };

  const updateAttendanceRecord = async (id: string, updates: Partial<AttendanceRecord>) => {
    if (!isDemoMode && user && userDataContext.initialized) {
      await userDataContext.updateAttendanceRecord(id, updates);
    } else {
      // In demo mode, update in localStorage
      const savedAttendance = localStorage.getItem('statsor_attendance');
      if (savedAttendance) {
        const currentAttendance: AttendanceRecord[] = JSON.parse(savedAttendance);
        const recordIndex = currentAttendance.findIndex(r => r.id === id);
        
        if (recordIndex !== -1) {
          currentAttendance[recordIndex] = {
            ...currentAttendance[recordIndex],
            ...updates
          };
          
          localStorage.setItem('statsor_attendance', JSON.stringify(currentAttendance));
          setAttendance(currentAttendance);
        }
      }
    }
  };

  const deleteAttendanceRecord = async (id: string) => {
    if (!isDemoMode && user && userDataContext.initialized) {
      await userDataContext.deleteAttendanceRecord(id);
    } else {
      // In demo mode, delete from localStorage
      const savedAttendance = localStorage.getItem('statsor_attendance');
      if (savedAttendance) {
        const currentAttendance: AttendanceRecord[] = JSON.parse(savedAttendance);
        const filteredAttendance = currentAttendance.filter(r => r.id !== id);
        
        localStorage.setItem('statsor_attendance', JSON.stringify(filteredAttendance));
        setAttendance(filteredAttendance);
      }
    }
  };

  // Player action management functions
  const addPlayerAction = async (action: Omit<PlayerAction, 'id'>) => {
    if (!isDemoMode && user && userDataContext.initialized) {
      // In real mode, add to the user data context
      console.log('Real mode: Adding player action', action);
      // TODO: Implement real player action storage
    } else {
      // In demo mode, store in localStorage
      const savedPlayerActions = localStorage.getItem('statsor_player_actions');
      let currentActions: PlayerAction[] = [];
      
      if (savedPlayerActions) {
        currentActions = JSON.parse(savedPlayerActions);
      }
      
      const newAction: PlayerAction = {
        ...action,
        id: Date.now().toString()
      };
      
      currentActions.push(newAction);
      localStorage.setItem('statsor_player_actions', JSON.stringify(currentActions));
      setPlayerActions(currentActions);
    }
  };

  const deletePlayerAction = async (id: string) => {
    if (!isDemoMode && user && userDataContext.initialized) {
      // In real mode, delete from the user data context
      console.log('Real mode: Deleting player action', id);
      // TODO: Implement real player action storage
    } else {
      // In demo mode, delete from localStorage
      const savedPlayerActions = localStorage.getItem('statsor_player_actions');
      if (savedPlayerActions) {
        const currentActions: PlayerAction[] = JSON.parse(savedPlayerActions);
        const filteredActions = currentActions.filter(a => a.id !== id);
        
        localStorage.setItem('statsor_player_actions', JSON.stringify(filteredActions));
        setPlayerActions(filteredActions);
      }
    }
  };

  const value = {
    players,
    matches,
    clubData,
    attendance,
    playerActions,
    loading,
    error,
    refreshData,
    updatePlayer,
    addPlayer,
    deletePlayer,
    addAttendanceRecord,
    updateAttendanceRecord,
    deleteAttendanceRecord,
    addPlayerAction,
    deletePlayerAction
  };

  return (
    <DataSyncContext.Provider value={value}>
      {children}
    </DataSyncContext.Provider>
  );
};

// Custom hook to use the data sync context
export const useDataSync = () => {
  const context = useContext(DataSyncContext);
  if (context === undefined) {
    throw new Error('useDataSync must be used within a DataSyncProvider');
  }
  return context;
};