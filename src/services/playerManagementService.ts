/**
 * Centralized Player Management Service
 * Single source of truth for all player operations
 * Ensures data synchronization across all platform sections
 */

import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

export interface PlayerData {
  // Core identification
  id?: string;
  profile_id?: string;
  team_id?: string;

  // Basic information
  name: string;
  first_name?: string;
  last_name?: string;
  nickname?: string;

  // Position and physical attributes
  position: string;
  jersey_number?: number;
  age?: number;
  date_of_birth?: string;
  nationality?: string;
  height?: number;
  weight?: number;
  preferred_foot?: string;
  secondary_positions?: string[];

  // Contact and personal
  email?: string;
  phone?: string;
  address?: string;
  photo_url?: string;

  // Contract and financial
  contract_start?: string;
  contract_end?: string;
  salary?: number;
  market_value?: number;
  join_date?: string;

  // Health and fitness
  fitness?: number;
  injuries?: string[];
  medical_clearance?: boolean;
  last_medical_check?: string;

  // Performance statistics
  goals?: number;
  assists?: number;
  minutes?: number;
  games?: number;
  yellow_cards?: number;
  red_cards?: number;
  shots?: number;
  shots_on_target?: number;
  passes?: number;
  pass_accuracy?: number;
  fouls_committed?: number;
  fouls_received?: number;
  balls_lost?: number;
  balls_recovered?: number;
  duels_won?: number;
  duels_lost?: number;
  crosses?: number;
  saves?: number;

  // Additional data
  skills?: {
    technical: number;
    physical: number;
    tactical: number;
    mental: number;
  };
  shot_map?: Record<string, number>;
  notes?: string;
  status?: string;

  // Timestamps
  created_at?: string;
  updated_at?: string;

  // Allow additional properties for flexibility
  [key: string]: any;
}

interface ValidationError {
  field: string;
  message: string;
}

class PlayerManagementService {
  private updateCallbacks: Set<() => void> = new Set();

  /**
   * Register a callback to be notified when players are updated
   */
  onPlayersUpdated(callback: () => void): () => void {
    this.updateCallbacks.add(callback);
    return () => this.updateCallbacks.delete(callback);
  }

  /**
   * Notify all registered callbacks that players have been updated
   */
  private notifyPlayersUpdated(): void {
    this.updateCallbacks.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.error('[PlayerManagement] Error in update callback:', error);
      }
    });
  }

  /**
   * Get the current user's profile ID
   */
  private async getUserProfileId(): Promise<string | null> {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        console.error('[PlayerManagement] No authenticated user:', userError);
        toast.error('Please sign in to continue');
        return null;
      }

      console.log('[PlayerManagement] Looking up profile for user:', user.id);

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('auth_user_id', user.id)
        .maybeSingle();

      if (profileError) {
        console.error('[PlayerManagement] Profile lookup error:', profileError);
        toast.error('Error accessing your profile. Please try refreshing the page.');
        return null;
      }

      if (!profile) {
        console.error('[PlayerManagement] No profile found for user:', user.id);
        console.log('[PlayerManagement] Attempting to create profile...');

        // Try to create profile if it doesn't exist
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert({
            auth_user_id: user.id,
            email: user.email,
            ['first_name']: user.user_metadata?.['first_name'] || user.email?.split('@')[0] || 'User',
            ['last_name']: user.user_metadata?.['last_name'] || '',
            sport: 'soccer',
            sport_selected: false,
            status: 'active',
            role: 'manager'
          })
          .select('id')
          .single();

        if (createError) {
          console.error('[PlayerManagement] Failed to create profile:', createError);
          toast.error('Failed to create your profile. Please contact support.');
          return null;
        }

        console.log('[PlayerManagement] Profile created successfully:', newProfile.id);
        toast.success('Profile created successfully!');
        return newProfile.id;
      }

      console.log('[PlayerManagement] Profile found:', profile.id);
      return profile.id;
    } catch (error) {
      console.error('[PlayerManagement] Error getting profile ID:', error);
      toast.error('An unexpected error occurred. Please try again.');
      return null;
    }
  }

  /**
   * Validate player data before database operations
   */
  private validatePlayerData(player: Partial<PlayerData>): ValidationError[] {
    const errors: ValidationError[] = [];

    // Required fields
    if (!player.name || player.name.trim() === '') {
      errors.push({ field: 'name', message: 'Player name is required' });
    }

    if (!player.position || player.position.trim() === '') {
      errors.push({ field: 'position', message: 'Position is required' });
    }

    // Validate jersey number if provided
    if (player.jersey_number !== undefined && player.jersey_number !== null) {
      if (player.jersey_number < 1 || player.jersey_number > 99) {
        errors.push({ field: 'jersey_number', message: 'Jersey number must be between 1 and 99' });
      }
    }

    // Validate age if provided
    if (player.age !== undefined && player.age !== null) {
      if (player.age < 10 || player.age > 100) {
        errors.push({ field: 'age', message: 'Age must be between 10 and 100' });
      }
    }

    // Validate email format if provided
    if (player.email && player.email.trim() !== '') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(player.email)) {
        errors.push({ field: 'email', message: 'Invalid email format' });
      }
    }

    return errors;
  }

  /**
   * Transform frontend player data to database format
   */
  private transformToDbFormat(player: Partial<PlayerData>, profileId: string): any {
    // Extract and map all fields with proper snake_case naming
    const dbData: any = {
      profile_id: profileId,

      // Basic info
      name: player.name?.trim() || '',
      first_name: player.first_name?.trim() || player.name?.split(' ')[0]?.trim() || '',
      last_name: player.last_name?.trim() || player.name?.split(' ').slice(1).join(' ').trim() || '',
      nickname: player.nickname?.trim() || null,

      // Position and physical
      position: player.position?.trim() || '',
      jersey_number: player.jersey_number || player['number'] || null,
      age: player.age || null,
      date_of_birth: player.date_of_birth || player['birthDate'] || null,
      nationality: player.nationality?.trim() || null,
      height: player.height || null,
      weight: player.weight || null,
      preferred_foot: player.preferred_foot || player['dominantFoot'] || null,
      secondary_positions: player.secondary_positions || player['secondaryPositions'] || null,

      // Contact
      email: player.email?.trim() || null,
      phone: player.phone?.trim() || null,
      address: player.address?.trim() || null,
      photo_url: player.photo_url || player['photo'] || null,

      // Contract
      contract_start: player.contract_start || null,
      contract_end: player.contract_end || player['contract_end'] || null,
      salary: player.salary || null,
      market_value: player.market_value || null,
      join_date: player.join_date || player['joinDate'] || new Date().toISOString().split('T')[0],

      // Health
      fitness: player.fitness !== undefined ? player.fitness : 85,
      injuries: player.injuries || null,
      medical_clearance: player.medical_clearance !== undefined ? player.medical_clearance : true,
      last_medical_check: player.last_medical_check || player['lastMedicalCheck'] || null,

      // Statistics
      goals: player.goals || 0,
      assists: player.assists || 0,
      minutes: player.minutes || 0,
      games: player.games || 0,
      yellow_cards: player.yellow_cards || player['yellowCards'] || 0,
      red_cards: player.red_cards || player['redCards'] || 0,
      shots: player.shots || 0,
      shots_on_target: player.shots_on_target || player['shotsOnTarget'] || 0,
      passes: player.passes || 0,
      pass_accuracy: player.pass_accuracy || player['passAccuracy'] || 0,
      fouls_committed: player.fouls_committed || player['foulsCommitted'] || 0,
      fouls_received: player.fouls_received || player['foulsReceived'] || 0,
      balls_lost: player.balls_lost || player['ballsLost'] || 0,
      balls_recovered: player.balls_recovered || player['ballsRecovered'] || 0,
      duels_won: player.duels_won || player['duelsWon'] || 0,
      duels_lost: player.duels_lost || player['duelsLost'] || 0,
      crosses: player.crosses || 0,
      saves: player.saves || 0,

      // Additional data
      skills: player.skills || { technical: 80, physical: 80, tactical: 80, mental: 80 },
      shot_map: player.shot_map || player['shotMap'] || {
        'top-left': 0, 'top-center': 0, 'top-right': 0,
        'middle-left': 0, 'middle-center': 0, 'middle-right': 0,
        'bottom-left': 0, 'bottom-center': 0, 'bottom-right': 0
      },
      notes: player.notes?.trim() || null,
      status: player.status || 'active',

      // Team association
      team_id: player.team_id || null,
    };

    return dbData;
  }

  /**
   * Create a new player with full validation and error handling
   */
  async createPlayer(playerData: Partial<PlayerData>): Promise<{ success: boolean; data?: PlayerData; errors?: ValidationError[] }> {
    try {
      console.log('[PlayerManagement] Creating player:', playerData);

      // Get profile ID
      const profileId = await this.getUserProfileId();
      if (!profileId) {
        toast.error('Please sign in to add players');
        return { success: false, errors: [{ field: 'auth', message: 'Not authenticated' }] };
      }

      // Validate player data
      const validationErrors = this.validatePlayerData(playerData);
      if (validationErrors.length > 0) {
        console.error('[PlayerManagement] Validation errors:', validationErrors);
        validationErrors.forEach(err => toast.error(err.message));
        return { success: false, errors: validationErrors };
      }

      // Transform to database format
      const dbData = this.transformToDbFormat(playerData, profileId);
      dbData.created_at = new Date().toISOString();
      dbData.updated_at = new Date().toISOString();

      console.log('[PlayerManagement] Inserting player into database:', dbData);

      // Insert into database with atomic transaction
      const { data, error } = await supabase
        .from('players')
        .insert([dbData])
        .select()
        .single();

      if (error) {
        console.error('[PlayerManagement] Database error:', error);
        toast.error(`Failed to create player: ${error.message}`);
        return { success: false, errors: [{ field: 'database', message: error.message }] };
      }

      if (!data) {
        console.error('[PlayerManagement] No data returned from insert');
        toast.error('Failed to create player: No data returned');
        return { success: false, errors: [{ field: 'database', message: 'No data returned' }] };
      }

      console.log('[PlayerManagement] Player created successfully:', data.id);
      toast.success('Player added successfully!');

      // Notify all listeners
      this.notifyPlayersUpdated();

      return { success: true, data };
    } catch (error: any) {
      console.error('[PlayerManagement] Unexpected error:', error);
      toast.error(`Failed to create player: ${error.message || 'Unknown error'}`);
      return { success: false, errors: [{ field: 'system', message: error.message || 'Unknown error' }] };
    }
  }

  /**
   * Update an existing player
   */
  async updatePlayer(playerId: string, updates: Partial<PlayerData>): Promise<{ success: boolean; data?: PlayerData; errors?: ValidationError[] }> {
    try {
      console.log('[PlayerManagement] Updating player:', playerId, updates);

      if (!playerId) {
        return { success: false, errors: [{ field: 'id', message: 'Player ID is required' }] };
      }

      // Get profile ID
      const profileId = await this.getUserProfileId();
      if (!profileId) {
        toast.error('Please sign in to update players');
        return { success: false, errors: [{ field: 'auth', message: 'Not authenticated' }] };
      }

      // Validate updates
      const validationErrors = this.validatePlayerData(updates);
      if (validationErrors.length > 0) {
        console.error('[PlayerManagement] Validation errors:', validationErrors);
        validationErrors.forEach(err => toast.error(err.message));
        return { success: false, errors: validationErrors };
      }

      // Transform to database format (without profile_id override)
      const dbUpdates = this.transformToDbFormat(updates, profileId);
      delete dbUpdates.profile_id; // Don't update profile_id
      delete dbUpdates.created_at; // Don't update created_at
      dbUpdates.updated_at = new Date().toISOString();

      console.log('[PlayerManagement] Updating player in database:', dbUpdates);

      // Update in database with atomic transaction
      const { data, error } = await supabase
        .from('players')
        .update(dbUpdates)
        .eq('id', playerId)
        .eq('profile_id', profileId) // Ensure user owns this player
        .select()
        .single();

      if (error) {
        console.error('[PlayerManagement] Database error:', error);
        toast.error(`Failed to update player: ${error.message}`);
        return { success: false, errors: [{ field: 'database', message: error.message }] };
      }

      if (!data) {
        console.error('[PlayerManagement] No data returned from update');
        toast.error('Failed to update player: Player not found or access denied');
        return { success: false, errors: [{ field: 'database', message: 'Player not found' }] };
      }

      console.log('[PlayerManagement] Player updated successfully:', data.id);
      toast.success('Player updated successfully!');

      // Notify all listeners
      this.notifyPlayersUpdated();

      return { success: true, data };
    } catch (error: any) {
      console.error('[PlayerManagement] Unexpected error:', error);
      toast.error(`Failed to update player: ${error.message || 'Unknown error'}`);
      return { success: false, errors: [{ field: 'system', message: error.message || 'Unknown error' }] };
    }
  }

  /**
   * Delete a player
   */
  async deletePlayer(playerId: string): Promise<{ success: boolean; errors?: ValidationError[] }> {
    try {
      console.log('[PlayerManagement] Deleting player:', playerId);

      if (!playerId) {
        return { success: false, errors: [{ field: 'id', message: 'Player ID is required' }] };
      }

      // Get profile ID
      const profileId = await this.getUserProfileId();
      if (!profileId) {
        toast.error('Please sign in to delete players');
        return { success: false, errors: [{ field: 'auth', message: 'Not authenticated' }] };
      }

      // Delete from database
      const { error } = await supabase
        .from('players')
        .delete()
        .eq('id', playerId)
        .eq('profile_id', profileId); // Ensure user owns this player

      if (error) {
        console.error('[PlayerManagement] Database error:', error);
        toast.error(`Failed to delete player: ${error.message}`);
        return { success: false, errors: [{ field: 'database', message: error.message }] };
      }

      console.log('[PlayerManagement] Player deleted successfully:', playerId);
      toast.success('Player deleted successfully!');

      // Notify all listeners
      this.notifyPlayersUpdated();

      return { success: true };
    } catch (error: any) {
      console.error('[PlayerManagement] Unexpected error:', error);
      toast.error(`Failed to delete player: ${error.message || 'Unknown error'}`);
      return { success: false, errors: [{ field: 'system', message: error.message || 'Unknown error' }] };
    }
  }

  /**
   * Get all players for the current user
   */
  async getPlayers(teamId?: string): Promise<PlayerData[]> {
    try {
      console.log('[PlayerManagement] Fetching players, teamId:', teamId);

      // Get profile ID
      const profileId = await this.getUserProfileId();
      if (!profileId) {
        console.log('[PlayerManagement] No profile ID, returning empty array');
        return [];
      }

      // Build query
      let query = supabase
        .from('players')
        .select('*')
        .eq('profile_id', profileId);

      if (teamId) {
        query = query.eq('team_id', teamId);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error('[PlayerManagement] Database error:', error);
        return [];
      }

      console.log(`[PlayerManagement] Fetched ${data?.length || 0} players`);
      return data || [];
    } catch (error) {
      console.error('[PlayerManagement] Unexpected error:', error);
      return [];
    }
  }

  /**
   * Get a single player by ID
   */
  async getPlayer(playerId: string): Promise<PlayerData | null> {
    try {
      console.log('[PlayerManagement] Fetching player:', playerId);

      if (!playerId) {
        return null;
      }

      // Get profile ID
      const profileId = await this.getUserProfileId();
      if (!profileId) {
        return null;
      }

      const { data, error } = await supabase
        .from('players')
        .select('*')
        .eq('id', playerId)
        .eq('profile_id', profileId)
        .maybeSingle();

      if (error) {
        console.error('[PlayerManagement] Database error:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('[PlayerManagement] Unexpected error:', error);
      return null;
    }
  }

  /**
   * Force refresh of player data from server
   */
  async refreshPlayers(): Promise<void> {
    this.notifyPlayersUpdated();
  }
}

// Export singleton instance
export const playerManagementService = new PlayerManagementService();
