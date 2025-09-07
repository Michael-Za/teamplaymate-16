import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Textarea } from '../components/ui/textarea';
import { 
  Table as TableIcon, 
  Plus, 
  Search, 
  Edit, 
  Save, 
  X, 
  User, 
  Download, 
  Upload, 
  Star, 
  CheckCircle, 
  AlertCircle,
  Filter,
  Eye,
  EyeOff,
  Calendar,
  Clock,
  Target,
  Trophy,
  TrendingUp,
  Award,
  Shield
} from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '../contexts/LanguageContext';

interface Player {
  id: string;
  name: string;
  number: number;
  position: string;
  role: string;
  notes: string;
  rating: number;
  status: 'available' | 'injured' | 'suspended';
  goals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
  matchesPlayed: number;
  createdAt: Date;
}

// Add this new interface for player actions
interface PlayerAction {
  id: string;
  playerId: string;
  playerName: string;
  actionType: 'goal' | 'assist' | 'yellowCard' | 'redCard' | 'foul' | 'save' | 'substitution';
  matchId: string;
  matchName: string;
  timestamp: string;
  minute: number;
  position: {
    x: number; // Field position X coordinate (0-100)
    y: number; // Field position Y coordinate (0-100)
    area: string; // e.g., "Penalty Area", "Midfield", "Right Wing"
  };
  details: string; // Additional details about the action
  created_at: string;
}

interface Formation {
  id: string;
  name: string;
  description: string;
  players: string[]; // Player IDs
}

const CommandTable: React.FC = () => {
  const { t } = useLanguage();
  const [players, setPlayers] = useState<Player[]>(() => {
    const savedPlayers = localStorage.getItem('statsor_command_players');
    if (savedPlayers) {
      try {
        const parsed = JSON.parse(savedPlayers);
        return parsed.map((player: any) => ({
          ...player,
          createdAt: new Date(player.createdAt)
        }));
      } catch (error) {
        console.error('Error parsing players:', error);
        return [];
      }
    }
    return [];
  });
  
  const [formations, setFormations] = useState<Formation[]>(() => {
    const savedFormations = localStorage.getItem('statsor_command_formations');
    if (savedFormations) {
      try {
        return JSON.parse(savedFormations);
      } catch (error) {
        console.error('Error parsing formations:', error);
        return [
          { 
            id: '1', 
            name: '4-3-3', 
            description: 'Balanced attacking formation', 
            players: [] 
          },
          { 
            id: '2', 
            name: '4-4-2', 
            description: 'Classic formation with two strikers', 
            players: [] 
          },
          { 
            id: '3', 
            name: '3-5-2', 
            description: 'Midfield-dominant formation', 
            players: [] 
          }
        ];
      }
    }
    return [
      { 
        id: '1', 
        name: '4-3-3', 
        description: 'Balanced attacking formation', 
        players: [] 
      },
      { 
        id: '2', 
        name: '4-4-2', 
        description: 'Classic formation with two strikers', 
        players: [] 
      },
      { 
        id: '3', 
        name: '3-5-2', 
        description: 'Midfield-dominant formation', 
        players: [] 
      }
    ];
  });
  
  const [selectedFormation, setSelectedFormation] = useState<string>('1');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddingPlayer, setIsAddingPlayer] = useState(false);
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);
  const [showStatistics, setShowStatistics] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedPosition, setSelectedPosition] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showImportMenu, setShowImportMenu] = useState(false);
  
  const [newPlayer, setNewPlayer] = useState({
    name: '',
    number: 0,
    position: 'DEL',
    role: '',
    notes: '',
    rating: 3.0,
    status: 'available' as 'available' | 'injured' | 'suspended',
    goals: 0,
    assists: 0,
    yellowCards: 0,
    redCards: 0,
    matchesPlayed: 0
  });
  
  const [editPlayer, setEditPlayer] = useState({
    name: '',
    number: 0,
    position: 'DEL',
    role: '',
    notes: '',
    rating: 3.0,
    status: 'available' as 'available' | 'injured' | 'suspended',
    goals: 0,
    assists: 0,
    yellowCards: 0,
    redCards: 0,
    matchesPlayed: 0
  });

  // Add new state for player actions
  const [playerActions, setPlayerActions] = useState<PlayerAction[]>(() => {
    const savedActions = localStorage.getItem('statsor_player_actions');
    if (savedActions) {
      try {
        return JSON.parse(savedActions);
      } catch (error) {
        console.error('Error parsing player actions:', error);
        return [];
      }
    }
    return [];
  });

  // Add state for showing the football field visualization
  const [showFieldVisualization, setShowFieldVisualization] = useState(false);
  const [selectedPlayerAction, setSelectedPlayerAction] = useState<PlayerAction | null>(null);

  // Refs for dropdown menus
  const exportMenuRef = useRef<HTMLDivElement>(null);
  const importMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
      if (importMenuRef.current && !importMenuRef.current.contains(event.target as Node)) {
        setShowImportMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Save data to localStorage
  useEffect(() => {
    localStorage.setItem('statsor_command_players', JSON.stringify(players));
    localStorage.setItem('statsor_command_formations', JSON.stringify(formations));
  }, [players, formations]);

  // Save player actions to localStorage
  useEffect(() => {
    localStorage.setItem('statsor_player_actions', JSON.stringify(playerActions));
  }, [playerActions]);

  const handleAddPlayer = () => {
    if (!newPlayer.name.trim() || newPlayer.number <= 0) {
      toast.error('Please enter player name and number');
      return;
    }

    const player: Player = {
      id: Date.now().toString(),
      name: newPlayer.name,
      number: newPlayer.number,
      position: newPlayer.position,
      role: newPlayer.role,
      notes: newPlayer.notes,
      rating: newPlayer.rating,
      status: newPlayer.status,
      goals: newPlayer.goals,
      assists: newPlayer.assists,
      yellowCards: newPlayer.yellowCards,
      redCards: newPlayer.redCards,
      matchesPlayed: newPlayer.matchesPlayed,
      createdAt: new Date()
    };

    setPlayers(prev => [...prev, player]);
    setNewPlayer({ 
      name: '', 
      number: 0, 
      position: 'DEL', 
      role: '', 
      notes: '',
      rating: 3.0,
      status: 'available',
      goals: 0,
      assists: 0,
      yellowCards: 0,
      redCards: 0,
      matchesPlayed: 0
    });
    setIsAddingPlayer(false);
    toast.success('Player added successfully!');
  };

  const startEditingPlayer = (player: Player) => {
    setEditingPlayerId(player.id);
    setEditPlayer({
      name: player.name,
      number: player.number,
      position: player.position,
      role: player.role,
      notes: player.notes,
      rating: player.rating,
      status: player.status,
      goals: player.goals,
      assists: player.assists,
      yellowCards: player.yellowCards,
      redCards: player.redCards,
      matchesPlayed: player.matchesPlayed
    });
  };

  const saveEditingPlayer = () => {
    if (!editPlayer.name.trim() || editPlayer.number <= 0) {
      toast.error('Please enter player name and number');
      return;
    }

    setPlayers(prev => 
      prev.map(player => 
        player.id === editingPlayerId 
          ? { ...player, ...editPlayer } 
          : player
      )
    );
    
    setEditingPlayerId(null);
    toast.success('Player updated successfully!');
  };

  // Add new function to add player actions
  const addPlayerAction = (playerId: string, actionType: PlayerAction['actionType'], details: string = '') => {
    const player = players.find(p => p.id === playerId);
    if (!player) return;

    const action: PlayerAction = {
      id: Date.now().toString(),
      playerId: player.id,
      playerName: player.name,
      actionType,
      matchId: 'current_match', // This would be dynamic in a real app
      matchName: 'Current Match',
      timestamp: new Date().toISOString(),
      minute: Math.floor(Math.random() * 90) + 1, // Mock minute
      position: {
        x: Math.floor(Math.random() * 100),
        y: Math.floor(Math.random() * 100),
        area: 'Midfield'
      },
      details,
      created_at: new Date().toISOString()
    };

    setPlayerActions(prev => [...prev, action]);

    // Update player stats
    setPlayers(prev => 
      prev.map(p => {
        if (p.id === playerId) {
          const updatedPlayer = { ...p };
          switch (actionType) {
            case 'goal':
              updatedPlayer.goals += 1;
              break;
            case 'assist':
              updatedPlayer.assists += 1;
              break;
            case 'yellowCard':
              updatedPlayer.yellowCards += 1;
              break;
            case 'redCard':
              updatedPlayer.redCards += 1;
          }
          return updatedPlayer;
        }
        return p;
      })
    );

    toast.success(`${actionType} recorded for ${player.name}!`);
  };

  // Add function to delete player actions
  const deletePlayerAction = (actionId: string) => {
    const action = playerActions.find(a => a.id === actionId);
    if (!action) return;

    setPlayerActions(prev => prev.filter(a => a.id !== actionId));

    // Revert player stats if needed
    setPlayers(prev => 
      prev.map(p => {
        if (p.id === action.playerId) {
          const updatedPlayer = { ...p };
          switch (action.actionType) {
            case 'goal':
              updatedPlayer.goals = Math.max(0, updatedPlayer.goals - 1);
              break;
            case 'assist':
              updatedPlayer.assists = Math.max(0, updatedPlayer.assists - 1);
              break;
            case 'yellowCard':
              updatedPlayer.yellowCards = Math.max(0, updatedPlayer.yellowCards - 1);
              break;
            case 'redCard':
              updatedPlayer.redCards = Math.max(0, updatedPlayer.redCards - 1);
          }
          return updatedPlayer;
        }
        return p;
      })
    );

    toast.success('Action deleted successfully!');
  };

  const cancelEditingPlayer = () => {
    setEditingPlayerId(null);
  };

  const handleDeletePlayer = (id: string) => {
    setPlayers(prev => prev.filter(player => player.id !== id));
    
    // Remove player from all formations
    setFormations(prev => 
      prev.map(formation => ({
        ...formation,
        players: formation.players.filter(playerId => playerId !== id)
      }))
    );
    
    toast.success('Player deleted successfully!');
  };

  // Add player to formation
  const addPlayerToFormation = (playerId: string) => {
    setFormations(prev => 
      prev.map(formation => 
        formation.id === selectedFormation
          ? { 
              ...formation, 
              players: formation.players.includes(playerId) 
                ? formation.players 
                : [...formation.players, playerId] 
            }
          : formation
      )
    );
    toast.success('Player added to formation!');
  };

  // Remove player from formation
  const removePlayerFromFormation = (playerId: string) => {
    setFormations(prev => 
      prev.map(formation => 
        formation.id === selectedFormation
          ? { 
              ...formation, 
              players: formation.players.filter(id => id !== playerId) 
            }
          : formation
      )
    );
    toast.success('Player removed from formation!');
  };

  // Filter and sort players
  const filteredPlayers = players
    .filter(player => {
      const matchesSearch = player.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        player.position.toLowerCase().includes(searchQuery.toLowerCase()) ||
        player.role.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = selectedStatus === 'all' || player.status === selectedStatus;
      const matchesPosition = selectedPosition === 'all' || player.position === selectedPosition;
      
      return matchesSearch && matchesStatus && matchesPosition;
    })
    .sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'number':
          aValue = a.number;
          bValue = b.number;
          break;
        case 'rating':
          aValue = a.rating;
          bValue = b.rating;
          break;
        case 'goals':
          aValue = a.goals;
          bValue = b.goals;
          break;
        case 'assists':
          aValue = a.assists;
          bValue = b.assists;
          break;
        case 'matches':
          aValue = a.matchesPlayed;
          bValue = b.matchesPlayed;
          break;
        default:
          return 0;
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  // Get selected formation
  const currentFormation = formations.find(f => f.id === selectedFormation) || formations[0];

  // Get players in current formation
  const formationPlayers = currentFormation 
    ? currentFormation.players.map(playerId => 
        players.find(p => p.id === playerId)
      ).filter(Boolean) as Player[]
    : [];

  // Export players to CSV
  const exportToCSV = () => {
    try {
      const headers = ['Name', 'Number', 'Position', 'Role', 'Rating', 'Status', 'Goals', 'Assists', 'Yellow Cards', 'Red Cards', 'Matches Played', 'Notes', 'Created At'];
      const csvContent = [
        headers.join(','),
        ...filteredPlayers.map(player => [
          `"${player.name.replace(/"/g, '""')}"`,
          player.number,
          player.position,
          `"${player.role.replace(/"/g, '""')}"`,
          player.rating,
          player.status,
          player.goals,
          player.assists,
          player.yellowCards,
          player.redCards,
          player.matchesPlayed,
          `"${player.notes.replace(/"/g, '""')}"`,
          player.createdAt.toISOString()
        ].join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `command_table_players_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success(`Exported ${filteredPlayers.length} players successfully!`);
    } catch (error) {
      toast.error('Failed to export players. Please try again.');
      console.error('Export error:', error);
    }
  };

  // Export players to JSON
  const exportToJSON = () => {
    try {
      const data = {
        exportedAt: new Date().toISOString(),
        playerCount: filteredPlayers.length,
        players: filteredPlayers.map(player => ({
          ...player,
          createdAt: player.createdAt.toISOString()
        }))
      };
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `command_table_players_${new Date().toISOString().split('T')[0]}.json`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success(`Exported ${filteredPlayers.length} players as JSON successfully!`);
    } catch (error) {
      toast.error('Failed to export players as JSON. Please try again.');
      console.error('JSON export error:', error);
    }
  };

  // Import players from CSV
  const importFromCSV = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size exceeds 5MB limit. Please choose a smaller file.');
      event.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const lines = content.split('\n').filter(line => line.trim());
        
        if (lines.length <= 1) {
          toast.error('CSV file is empty or invalid.');
          return;
        }
        
        // Parse headers
        const headerLine = lines[0];
        if (!headerLine) {
          toast.error('CSV file is missing headers.');
          return;
        }
        
        const headers = headerLine.split(',').map(header => header.trim().replace(/"/g, ''));
        const requiredHeaders = ['Name', 'Number'];
        const missingHeaders = requiredHeaders.filter(header => !headers.includes(header));
        
        if (missingHeaders.length > 0) {
          toast.error(`Missing required columns: ${missingHeaders.join(', ')}`);
          return;
        }
        
        const importedPlayers: Player[] = [];
        const errors: string[] = [];

        // Process each line (skip header)
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i];
          if (!line) continue;
          
          try {
            // Simple CSV parsing (handles quoted values)
            const values: string[] = [];
            let current = '';
            let inQuotes = false;
            
            for (let j = 0; j < line.length; j++) {
              const char = line[j];
              
              if (char === '"' && (j === 0 || line[j-1] !== '\\')) {
                inQuotes = !inQuotes;
              } else if (char === ',' && !inQuotes) {
                values.push(current.trim());
                current = '';
              } else {
                current += char;
              }
            }
            values.push(current.trim());
            
            // Map values to player object
            const playerData: any = {};
            headers.forEach((header, index) => {
              playerData[header] = values[index] || '';
            });
            
            // Validate required fields
            if (!playerData['Name'] || !playerData['Number']) {
              errors.push(`Row ${i+1}: Missing name or number`);
              continue;
            }
            
            // Create player object
            const player: Player = {
              id: Date.now().toString() + Math.random().toString(36).substr(2, 9) + i,
              name: playerData['Name'].replace(/"/g, '').trim(),
              number: parseInt(playerData['Number']) || 0,
              position: playerData['Position']?.replace(/"/g, '').trim() || 'DEL',
              role: playerData['Role']?.replace(/"/g, '').trim() || '',
              notes: playerData['Notes']?.replace(/"/g, '').trim() || '',
              rating: parseFloat(playerData['Rating']) || 3.0,
              status: (playerData['Status'] === 'available' || playerData['Status'] === 'injured' || playerData['Status'] === 'suspended') 
                ? playerData['Status'] 
                : 'available',
              goals: parseInt(playerData['Goals']) || 0,
              assists: parseInt(playerData['Assists']) || 0,
              yellowCards: parseInt(playerData['Yellow Cards']) || 0,
              redCards: parseInt(playerData['Red Cards']) || 0,
              matchesPlayed: parseInt(playerData['Matches Played']) || 0,
              createdAt: playerData['Created At'] ? new Date(playerData['Created At']) : new Date()
            };
            
            importedPlayers.push(player);
          } catch (lineError) {
            errors.push(`Row ${i+1}: Parsing error`);
            console.error(`Error parsing row ${i+1}:`, lineError);
          }
        }

        if (errors.length > 0) {
          toast.error(`Import completed with ${errors.length} errors. Check console for details.`);
          console.error('Import errors:', errors);
        }

        if (importedPlayers.length > 0) {
          setPlayers(prev => [...prev, ...importedPlayers]);
          toast.success(`Imported ${importedPlayers.length} players successfully!`);
        } else if (errors.length === 0) {
          toast.warning('No valid players found in the file.');
        }
      } catch (error) {
        toast.error('Failed to import players. Please check the file format.');
        console.error('Import error:', error);
      }
    };
    
    reader.onerror = () => {
      toast.error('Failed to read the file. Please try again.');
    };
    
    reader.readAsText(file);
    event.target.value = ''; // Reset input
  };

  // Import players from JSON
  const importFromJSON = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size exceeds 5MB limit. Please choose a smaller file.');
      event.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);
        
        if (!data.players || !Array.isArray(data.players)) {
          toast.error('Invalid JSON format. Missing players array.');
          return;
        }
        
        const importedPlayers: Player[] = data.players.map((player: any, index: number) => ({
          id: player.id || Date.now().toString() + Math.random().toString(36).substr(2, 9) + index,
          name: player.name || '',
          number: player.number || 0,
          position: player.position || 'DEL',
          role: player.role || '',
          notes: player.notes || '',
          rating: player.rating || 3.0,
          status: (player.status === 'available' || player.status === 'injured' || player.status === 'suspended') 
            ? player.status 
            : 'available',
          goals: player.goals || 0,
          assists: player.assists || 0,
          yellowCards: player.yellowCards || 0,
          redCards: player.redCards || 0,
          matchesPlayed: player.matchesPlayed || 0,
          createdAt: player.createdAt ? new Date(player.createdAt) : new Date()
        })).filter((player: Player) => player.name && player.number);
        
        if (importedPlayers.length > 0) {
          setPlayers(prev => [...prev, ...importedPlayers]);
          toast.success(`Imported ${importedPlayers.length} players successfully!`);
        } else {
          toast.warning('No valid players found in the file.');
        }
      } catch (error) {
        toast.error('Failed to import players. Please check the JSON format.');
        console.error('JSON import error:', error);
      }
    };
    
    reader.onerror = () => {
      toast.error('Failed to read the file. Please try again.');
    };
    
    reader.readAsText(file);
    event.target.value = ''; // Reset input
  };

  // Get unique positions for filter
  const positions = Array.from(new Set(players.map(p => p.position)));

  // Render star rating
  const renderRating = (rating: number) => {
    return (
      <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
          <Star 
            key={i} 
            className={`w-4 h-4 ${i < Math.floor(rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
          />
        ))}
        <span className="ml-1 text-sm">{rating.toFixed(1)}</span>
      </div>
    );
  };

  // Render status badge
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'available':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Available</Badge>;
      case 'injured':
        return <Badge className="bg-red-100 text-red-800"><AlertCircle className="w-3 h-3 mr-1" />Injured</Badge>;
      case 'suspended':
        return <Badge className="bg-yellow-100 text-yellow-800"><AlertCircle className="w-3 h-3 mr-1" />Suspended</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">Unknown</Badge>;
    }
  };

  // Toggle sort order
  const toggleSortOrder = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  // Get sort icon
  const getSortIcon = (column: string) => {
    if (sortBy !== column) return null;
    return sortOrder === 'asc' ? '↑' : '↓';
  };

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center">
          <TableIcon className="mr-3 h-8 w-8 text-blue-600" />
          Command Table
        </h1>
        <div className="flex flex-wrap gap-2">
          <Button 
            onClick={() => setIsAddingPlayer(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Player
          </Button>
          
          {/* Export Dropdown */}
          <div className="relative" ref={exportMenuRef}>
            <Button 
              variant="outline"
              onClick={() => {
                setShowExportMenu(!showExportMenu);
                setShowImportMenu(false);
              }}
            >
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            {showExportMenu && (
              <div className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg py-1 z-10 border">
                <button
                  onClick={() => {
                    exportToCSV();
                    setShowExportMenu(false);
                  }}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Export as CSV
                </button>
                <button
                  onClick={() => {
                    exportToJSON();
                    setShowExportMenu(false);
                  }}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Export as JSON
                </button>
              </div>
            )}
          </div>
          
          {/* Import Dropdown */}
          <div className="relative" ref={importMenuRef}>
            <Button 
              variant="outline"
              onClick={() => {
                setShowImportMenu(!showImportMenu);
                setShowExportMenu(false);
              }}
            >
              <Upload className="mr-2 h-4 w-4" />
              Import
            </Button>
            {showImportMenu && (
              <div className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg py-1 z-10 border">
                <label className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer">
                  <span>Import from CSV</span>
                  <input 
                    type="file" 
                    accept=".csv" 
                    className="hidden" 
                    onChange={(e) => {
                      importFromCSV(e);
                      setShowImportMenu(false);
                    }} 
                  />
                </label>
                <label className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer">
                  <span>Import from JSON</span>
                  <input 
                    type="file" 
                    accept=".json" 
                    className="hidden" 
                    onChange={(e) => {
                      importFromJSON(e);
                      setShowImportMenu(false);
                    }} 
                  />
                </label>
              </div>
            )}
          </div>
          
          <Button 
            variant="outline"
            onClick={() => setShowStatistics(!showStatistics)}
          >
            {showStatistics ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
            {showStatistics ? 'Hide Stats' : 'Show Stats'}
          </Button>
        </div>
      </div>

      {/* Formation Selector */}
      <div className="mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Target className="mr-2 h-5 w-5 text-blue-600" />
              Formation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2 mb-4">
              {formations.map(formation => (
                <Button
                  key={formation.id}
                  variant={selectedFormation === formation.id ? 'default' : 'outline'}
                  onClick={() => setSelectedFormation(formation.id)}
                  className="flex items-center"
                >
                  {formation.name}
                  <span className="ml-2 text-xs opacity-70">{formation.description}</span>
                </Button>
              ))}
            </div>
            
            {currentFormation && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold mb-2">{currentFormation.name} Formation</h3>
                    <p className="text-sm text-gray-600">{currentFormation.description}</p>
                  </div>
                  <Badge variant="secondary">
                    {formationPlayers.length} players
                  </Badge>
                </div>
                
                {/* Formation Visualization */}
                <div className="mt-4 flex justify-center">
                  <div className="relative w-full max-w-md h-80 bg-green-100 rounded-lg border-2 border-green-300">
                    {/* Goalkeeper */}
                    <div className="absolute top-4 left-1/2 transform -translate-x-1/2">
                      <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                        {formationPlayers[0]?.number || '?'}
                      </div>
                      <div className="text-xs text-center mt-1 truncate w-20">
                        {formationPlayers[0]?.name || 'Goalkeeper'}
                      </div>
                      {formationPlayers[0] && (
                        <div className="text-xs text-center text-gray-600">
                          {renderRating(formationPlayers[0].rating)}
                        </div>
                      )}
                    </div>
                    
                    {/* Defenders */}
                    <div className="absolute top-20 left-1/4 transform -translate-x-1/2">
                      <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                        {formationPlayers[1]?.number || '?'}
                      </div>
                      <div className="text-xs text-center mt-1 truncate w-20">
                        {formationPlayers[1]?.name || 'Defender'}
                      </div>
                      {formationPlayers[1] && (
                        <div className="text-xs text-center text-gray-600">
                          {renderRating(formationPlayers[1].rating)}
                        </div>
                      )}
                    </div>
                    
                    <div className="absolute top-20 right-1/4 transform translate-x-1/2">
                      <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                        {formationPlayers[2]?.number || '?'}
                      </div>
                      <div className="text-xs text-center mt-1 truncate w-20">
                        {formationPlayers[2]?.name || 'Defender'}
                      </div>
                      {formationPlayers[2] && (
                        <div className="text-xs text-center text-gray-600">
                          {renderRating(formationPlayers[2].rating)}
                        </div>
                      )}
                    </div>
                    
                    {/* Midfielders */}
                    <div className="absolute top-36 left-1/2 transform -translate-x-1/2">
                      <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                        {formationPlayers[3]?.number || '?'}
                      </div>
                      <div className="text-xs text-center mt-1 truncate w-20">
                        {formationPlayers[3]?.name || 'Midfielder'}
                      </div>
                      {formationPlayers[3] && (
                        <div className="text-xs text-center text-gray-600">
                          {renderRating(formationPlayers[3].rating)}
                        </div>
                      )}
                    </div>
                    
                    {/* Forwards */}
                    <div className="absolute bottom-20 left-1/4 transform -translate-x-1/2">
                      <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                        {formationPlayers[4]?.number || '?'}
                      </div>
                      <div className="text-xs text-center mt-1 truncate w-20">
                        {formationPlayers[4]?.name || 'Forward'}
                      </div>
                      {formationPlayers[4] && (
                        <div className="text-xs text-center text-gray-600">
                          {renderRating(formationPlayers[4].rating)}
                        </div>
                      )}
                    </div>
                    
                    <div className="absolute bottom-20 right-1/4 transform translate-x-1/2">
                      <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                        {formationPlayers[5]?.number || '?'}
                      </div>
                      <div className="text-xs text-center mt-1 truncate w-20">
                        {formationPlayers[5]?.name || 'Forward'}
                      </div>
                      {formationPlayers[5] && (
                        <div className="text-xs text-center text-gray-600">
                          {renderRating(formationPlayers[5].rating)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add Player Form */}
      {isAddingPlayer && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Add New Player</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Player Name *</label>
              <Input
                placeholder="Enter player name"
                value={newPlayer.name}
                onChange={(e) => setNewPlayer(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-1 block">Number *</label>
              <Input
                type="number"
                min="1"
                max="99"
                placeholder="Enter number"
                value={newPlayer.number || ''}
                onChange={(e) => setNewPlayer(prev => ({ ...prev, number: parseInt(e.target.value) || 0 }))}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-1 block">Position</label>
              <select
                value={newPlayer.position}
                onChange={(e) => setNewPlayer(prev => ({ ...prev, position: e.target.value }))}
                className="w-full p-2 border rounded"
              >
                <option value="POR">Goalkeeper (POR)</option>
                <option value="DEF">Defender (DEF)</option>
                <option value="CEN">Midfielder (CEN)</option>
                <option value="DEL">Forward (DEL)</option>
              </select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-1 block">Role</label>
              <Input
                placeholder="Enter role"
                value={newPlayer.role}
                onChange={(e) => setNewPlayer(prev => ({ ...prev, role: e.target.value }))}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-1 block">Rating</label>
              <Input
                type="number"
                min="0"
                max="5"
                step="0.1"
                placeholder="Enter rating (0-5)"
                value={newPlayer.rating}
                onChange={(e) => setNewPlayer(prev => ({ ...prev, rating: parseFloat(e.target.value) || 0 }))}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-1 block">Status</label>
              <select
                value={newPlayer.status}
                onChange={(e) => setNewPlayer(prev => ({ ...prev, status: e.target.value as any }))}
                className="w-full p-2 border rounded"
              >
                <option value="available">Available</option>
                <option value="injured">Injured</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-1 block">Goals</label>
              <Input
                type="number"
                min="0"
                placeholder="Enter goals"
                value={newPlayer.goals}
                onChange={(e) => setNewPlayer(prev => ({ ...prev, goals: parseInt(e.target.value) || 0 }))}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-1 block">Assists</label>
              <Input
                type="number"
                min="0"
                placeholder="Enter assists"
                value={newPlayer.assists}
                onChange={(e) => setNewPlayer(prev => ({ ...prev, assists: parseInt(e.target.value) || 0 }))}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-1 block">Yellow Cards</label>
              <Input
                type="number"
                min="0"
                placeholder="Enter yellow cards"
                value={newPlayer.yellowCards}
                onChange={(e) => setNewPlayer(prev => ({ ...prev, yellowCards: parseInt(e.target.value) || 0 }))}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-1 block">Red Cards</label>
              <Input
                type="number"
                min="0"
                placeholder="Enter red cards"
                value={newPlayer.redCards}
                onChange={(e) => setNewPlayer(prev => ({ ...prev, redCards: parseInt(e.target.value) || 0 }))}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-1 block">Matches Played</label>
              <Input
                type="number"
                min="0"
                placeholder="Enter matches played"
                value={newPlayer.matchesPlayed}
                onChange={(e) => setNewPlayer(prev => ({ ...prev, matchesPlayed: parseInt(e.target.value) || 0 }))}
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="text-sm font-medium mb-1 block">Notes</label>
              <Textarea
                placeholder="Enter notes about the player"
                value={newPlayer.notes}
                onChange={(e) => setNewPlayer(prev => ({ ...prev, notes: e.target.value }))}
                rows={2}
              />
            </div>
            
            <div className="md:col-span-2 flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsAddingPlayer(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddPlayer}>
                Add Player
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add Player Actions Section */}
      <div className="mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center">
                <Target className="mr-2 h-5 w-5 text-blue-600" />
                Match Events Tracking
              </span>
              <Button 
                onClick={() => setShowFieldVisualization(!showFieldVisualization)}
                variant="outline"
                size="sm"
              >
                {showFieldVisualization ? 'Hide Field' : 'Show Field'}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {showFieldVisualization && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold mb-4 text-center">Football Field Visualization</h3>
                <div className="relative bg-green-500 rounded-lg h-64 overflow-hidden">
                  {/* Football pitch markings */}
                  <div className="absolute inset-0 border-4 border-white rounded-lg">
                    {/* Center line */}
                    <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-white"></div>
                    {/* Center circle */}
                    <div className="absolute top-1/2 left-1/2 w-16 h-16 border-4 border-white rounded transform -translate-x-1/2 -translate-y-1/2"></div>
                    {/* Penalty areas */}
                    <div className="absolute top-1/2 left-4 w-12 h-24 border-4 border-white rounded transform -translate-y-1/2"></div>
                    <div className="absolute top-1/2 right-4 w-12 h-24 border-4 border-white rounded transform -translate-y-1/2"></div>
                  </div>
                  
                  {/* Player action markers */}
                  {playerActions.map((action) => (
                    <div
                      key={action.id}
                      className={`absolute w-4 h-4 rounded-full border-2 border-white cursor-pointer transform -translate-x-1/2 -translate-y-1/2 ${
                        action.actionType === 'goal' ? 'bg-green-500' :
                        action.actionType === 'assist' ? 'bg-blue-500' :
                        action.actionType === 'yellowCard' ? 'bg-yellow-500' :
                        action.actionType === 'redCard' ? 'bg-red-500' :
                        'bg-purple-500'
                      }`}
                      style={{
                        left: `${action.position.x}%`,
                        top: `${action.position.y}%`
                      }}
                      onClick={() => setSelectedPlayerAction(action)}
                      title={`${action.playerName} - ${action.actionType} at ${action.minute}'`}
                    />
                  ))}
                </div>
                
                {selectedPlayerAction && (
                  <div className="mt-4 p-3 bg-white rounded-lg border">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold">{selectedPlayerAction.playerName}</h4>
                        <p className="text-sm text-gray-600">
                          {selectedPlayerAction.actionType} at {selectedPlayerAction.minute}' in {selectedPlayerAction.matchName}
                        </p>
                        {selectedPlayerAction.details && (
                          <p className="text-sm mt-1">{selectedPlayerAction.details}</p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedPlayerAction(null)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Button 
                onClick={() => {
                  const playerId = players[0]?.id;
                  if (playerId) addPlayerAction(playerId, 'goal', 'Great shot from outside the box');
                }}
                className="bg-green-600 hover:bg-green-700"
              >
                <Target className="mr-2 h-4 w-4" />
                Record Goal
              </Button>
              
              <Button 
                onClick={() => {
                  const playerId = players[0]?.id;
                  if (playerId) addPlayerAction(playerId, 'assist', 'Perfect cross to the striker');
                }}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Award className="mr-2 h-4 w-4" />
                Record Assist
              </Button>
              
              <Button 
                onClick={() => {
                  const playerId = players[0]?.id;
                  if (playerId) addPlayerAction(playerId, 'yellowCard', 'Unsporting behavior');
                }}
                className="bg-yellow-600 hover:bg-yellow-700"
              >
                <Award className="mr-2 h-4 w-4" />
                Yellow Card
              </Button>
              
              <Button 
                onClick={() => {
                  const playerId = players[0]?.id;
                  if (playerId) addPlayerAction(playerId, 'redCard', 'Serious foul');
                }}
                className="bg-red-600 hover:bg-red-700"
              >
                <Award className="mr-2 h-4 w-4" />
                Red Card
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Stats */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="relative md:col-span-2">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search players..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full p-2 pl-10 border rounded"
          >
            <option value="all">All Statuses</option>
            <option value="available">Available</option>
            <option value="injured">Injured</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
        
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <select
            value={selectedPosition}
            onChange={(e) => setSelectedPosition(e.target.value)}
            className="w-full p-2 pl-10 border rounded"
          >
            <option value="all">All Positions</option>
            {positions.map(position => (
              <option key={position} value={position}>{position}</option>
            ))}
          </select>
        </div>
        
        <div className="flex items-center justify-center md:justify-start">
          <div className="bg-blue-50 px-3 py-2 rounded-lg">
            <span className="text-sm font-medium text-blue-700">
              Players: {filteredPlayers.length}
            </span>
          </div>
        </div>
      </div>

      {/* Players Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <User className="mr-2 h-5 w-5 text-blue-600" />
            Players List
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredPlayers.length > 0 ? (
            <div className="rounded-md border overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th 
                      className="h-12 px-4 text-left align-middle font-medium text-gray-500 cursor-pointer hover:bg-gray-100"
                      onClick={() => { setSortBy('name'); toggleSortOrder(); }}
                    >
                      Player {getSortIcon('name')}
                    </th>
                    <th 
                      className="h-12 px-4 text-left align-middle font-medium text-gray-500 cursor-pointer hover:bg-gray-100"
                      onClick={() => { setSortBy('number'); toggleSortOrder(); }}
                    >
                      # {getSortIcon('number')}
                    </th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-gray-500">Position</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-gray-500">Role</th>
                    {showStatistics && (
                      <>
                        <th 
                          className="h-12 px-4 text-left align-middle font-medium text-gray-500 cursor-pointer hover:bg-gray-100"
                          onClick={() => { setSortBy('rating'); toggleSortOrder(); }}
                        >
                          Rating {getSortIcon('rating')}
                        </th>
                        <th className="h-12 px-4 text-left align-middle font-medium text-gray-500">Status</th>
                        <th 
                          className="h-12 px-4 text-left align-middle font-medium text-gray-500 cursor-pointer hover:bg-gray-100"
                          onClick={() => { setSortBy('goals'); toggleSortOrder(); }}
                        >
                          Goals {getSortIcon('goals')}
                        </th>
                        <th 
                          className="h-12 px-4 text-left align-middle font-medium text-gray-500 cursor-pointer hover:bg-gray-100"
                          onClick={() => { setSortBy('assists'); toggleSortOrder(); }}
                        >
                          Assists {getSortIcon('assists')}
                        </th>
                        <th 
                          className="h-12 px-4 text-left align-middle font-medium text-gray-500"
                        >
                          Yellow Cards
                        </th>
                        <th 
                          className="h-12 px-4 text-left align-middle font-medium text-gray-500"
                        >
                          Red Cards
                        </th>
                        <th 
                          className="h-12 px-4 text-left align-middle font-medium text-gray-500 cursor-pointer hover:bg-gray-100"
                          onClick={() => { setSortBy('matches'); toggleSortOrder(); }}
                        >
                          Matches {getSortIcon('matches')}
                        </th>

                      </>
                    )}
                    <th className="h-12 px-4 text-left align-middle font-medium text-gray-500">Notes</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPlayers.map(player => (
                    <tr key={player.id} className="border-b hover:bg-gray-50">
                      {editingPlayerId === player.id ? (
                        <>
                          <td className="p-4 align-middle">
                            <div className="flex items-center">
                              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold mr-2">
                                {editPlayer.number || player.number}
                              </div>
                              <Input
                                value={editPlayer.name}
                                onChange={(e) => setEditPlayer(prev => ({ ...prev, name: e.target.value }))}
                                className="w-32"
                              />
                            </div>
                          </td>
                          <td className="p-4 align-middle">
                            <Input
                              type="number"
                              min="1"
                              max="99"
                              value={editPlayer.number || ''}
                              onChange={(e) => setEditPlayer(prev => ({ ...prev, number: parseInt(e.target.value) || 0 }))}
                              className="w-16"
                            />
                          </td>
                          <td className="p-4 align-middle">
                            <select
                              value={editPlayer.position}
                              onChange={(e) => setEditPlayer(prev => ({ ...prev, position: e.target.value }))}
                              className="w-full p-1 border rounded"
                            >
                              <option value="POR">Goalkeeper (POR)</option>
                              <option value="DEF">Defender (DEF)</option>
                              <option value="CEN">Midfielder (CEN)</option>
                              <option value="DEL">Forward (DEL)</option>
                            </select>
                          </td>
                          <td className="p-4 align-middle">
                            <Input
                              value={editPlayer.role}
                              onChange={(e) => setEditPlayer(prev => ({ ...prev, role: e.target.value }))}
                              className="w-32"
                            />
                          </td>
                          {showStatistics && (
                            <>
                              <td className="p-4 align-middle">
                                <Input
                                  type="number"
                                  min="0"
                                  max="5"
                                  step="0.1"
                                  value={editPlayer.rating}
                                  onChange={(e) => setEditPlayer(prev => ({ ...prev, rating: parseFloat(e.target.value) || 0 }))}
                                  className="w-20"
                                />
                              </td>
                              <td className="p-4 align-middle">
                                <select
                                  value={editPlayer.status}
                                  onChange={(e) => setEditPlayer(prev => ({ ...prev, status: e.target.value as any }))}
                                  className="w-full p-1 border rounded"
                                >
                                  <option value="available">Available</option>
                                  <option value="injured">Injured</option>
                                  <option value="suspended">Suspended</option>
                                </select>
                              </td>
                              <td className="p-4 align-middle">
                                <Input
                                  type="number"
                                  min="0"
                                  value={editPlayer.goals}
                                  onChange={(e) => setEditPlayer(prev => ({ ...prev, goals: parseInt(e.target.value) || 0 }))}
                                  className="w-16"
                                />
                              </td>
                              <td className="p-4 align-middle">
                                <Input
                                  type="number"
                                  min="0"
                                  value={editPlayer.assists}
                                  onChange={(e) => setEditPlayer(prev => ({ ...prev, assists: parseInt(e.target.value) || 0 }))}
                                  className="w-16"
                                />
                              </td>
                              <td className="p-4 align-middle">
                                <Input
                                  type="number"
                                  min="0"
                                  value={editPlayer.yellowCards}
                                  onChange={(e) => setEditPlayer(prev => ({ ...prev, yellowCards: parseInt(e.target.value) || 0 }))}
                                  className="w-16"
                                />
                              </td>
                              <td className="p-4 align-middle">
                                <Input
                                  type="number"
                                  min="0"
                                  value={editPlayer.redCards}
                                  onChange={(e) => setEditPlayer(prev => ({ ...prev, redCards: parseInt(e.target.value) || 0 }))}
                                  className="w-16"
                                />
                              </td>
                              <td className="p-4 align-middle">
                                <Input
                                  type="number"
                                  min="0"
                                  value={editPlayer.matchesPlayed}
                                  onChange={(e) => setEditPlayer(prev => ({ ...prev, matchesPlayed: parseInt(e.target.value) || 0 }))}
                                  className="w-16"
                                />
                              </td>

                            </>
                          )}
                          <td className="p-4 align-middle">
                            <Textarea
                              value={editPlayer.notes}
                              onChange={(e) => setEditPlayer(prev => ({ ...prev, notes: e.target.value }))}
                              className="w-48"
                              rows={2}
                            />
                          </td>
                          <td className="p-4 align-middle">
                            <div className="flex space-x-1">
                              <Button
                                size="sm"
                                onClick={saveEditingPlayer}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <Save className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={cancelEditingPlayer}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="p-4 align-middle">
                            <div className="flex items-center">
                              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold mr-2">
                                {player.number}
                              </div>
                              <div>
                                <div className="font-medium">{player.name}</div>
                              </div>
                            </div>
                          </td>
                          <td className="p-4 align-middle">
                            <div className="font-medium">#{player.number}</div>
                          </td>
                          <td className="p-4 align-middle">
                            <Badge variant="secondary">{player.position}</Badge>
                          </td>
                          <td className="p-4 align-middle">{player.role}</td>
                          {showStatistics && (
                            <>
                              <td className="p-4 align-middle">
                                {renderRating(player.rating)}
                              </td>
                              <td className="p-4 align-middle">
                                {renderStatusBadge(player.status)}
                              </td>
                              <td className="p-4 align-middle font-medium">{player.goals}</td>
                              <td className="p-4 align-middle font-medium">{player.assists}</td>
                              <td className="p-4 align-middle font-medium text-yellow-600">{player.yellowCards}</td>
                              <td className="p-4 align-middle font-medium text-red-600">{player.redCards}</td>
                              <td className="p-4 align-middle">{player.matchesPlayed}</td>

                            </>
                          )}
                          <td className="p-4 align-middle max-w-xs">
                            <div className="text-sm text-gray-600 line-clamp-2">
                              {player.notes}
                            </div>
                          </td>
                          <td className="p-4 align-middle">
                            <div className="flex flex-wrap gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => startEditingPlayer(player)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeletePlayer(player.id)}
                                className="text-red-500 hover:text-red-700"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                              {currentFormation && !currentFormation.players.includes(player.id) ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => addPlayerToFormation(player.id)}
                                  className="text-green-500 hover:text-green-700"
                                >
                                  <Plus className="h-4 w-4" />
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => removePlayerFromFormation(player.id)}
                                  className="text-yellow-500 hover:text-yellow-700"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              )}
                              {/* Action buttons for tracking events */}
                              <div className="flex space-x-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => addPlayerAction(player.id, 'goal')}
                                  className="text-green-500 hover:text-green-700"
                                  title="Record Goal"
                                >
                                  <Target className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => addPlayerAction(player.id, 'assist')}
                                  className="text-blue-500 hover:text-blue-700"
                                  title="Record Assist"
                                >
                                  <Award className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => addPlayerAction(player.id, 'yellowCard')}
                                  className="text-yellow-500 hover:text-yellow-700"
                                  title="Record Yellow Card"
                                >
                                  <Award className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => addPlayerAction(player.id, 'redCard')}
                                  className="text-red-500 hover:text-red-700"
                                  title="Record Red Card"
                                >
                                  <Shield className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <User className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p>No players found</p>
              <p className="text-sm">
                {searchQuery || selectedStatus !== 'all' || selectedPosition !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Add your first player using the button above'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CommandTable;
