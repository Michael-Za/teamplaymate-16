  import React, { useState, useEffect } from 'react';
  import { motion } from 'framer-motion';
  import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
  import { Badge } from './ui/badge';
  import { Button } from './ui/button';
  import { Input } from './ui/input';
  import { Textarea } from './ui/textarea';
  import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
  import {
    Database,
    Users,
    Building2,
    Trophy,
    Activity,
    Calendar,
    BarChart3,
    Search,
    Filter,
    Plus,
    Download,
    Upload,
    Edit3,
    Trash2,
    User,
    CheckCircle,
    AlertCircle,
    Save,
    RefreshCw,
    Loader2,
    Mail,
    CreditCard,
    FileText,
    Heart,
    Settings,
    Equal,
    ThumbsUp,
    ThumbsDown,
    Clock,
    TrendingUp,
    ChevronDown
  } from 'lucide-react';
  import { useTheme } from '../contexts/ThemeContext';
  import { dataManagementService, Player, ClubData } from '../services/dataManagementService';
  import { toast } from 'sonner';
  import AddPlayerForm from './AddPlayerForm';

  export const DataManagementSection: React.FC = () => {
    const { theme, isHighContrast } = useTheme();
    const [activeTab, setActiveTab] = useState('players');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState<'connected' | 'reconnecting' | 'disconnected'>('connected');
    const [lastSync, setLastSync] = useState(new Date());
    const [systemHealth, setSystemHealth] = useState({
      emailService: 'operational',
      paymentSystem: 'active'
    });
    
    const [players, setPlayers] = useState<Player[]>([]);
    const [filteredPlayers, setFilteredPlayers] = useState<Player[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [showAddForm, setShowAddForm] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
    
    const [clubData, setClubData] = useState<ClubData | null>(null);
    
    const [showExportMenu, setShowExportMenu] = useState(false);
    const [showImportMenu, setShowImportMenu] = useState(false);

    // Initialize data
    useEffect(() => {
      loadData();
      const interval = setInterval(() => {
        setLastSync(new Date());
      }, 30000);
      return () => clearInterval(interval);
    }, []);

    // Filter players based on search term
    useEffect(() => {
      if (searchTerm) {
        setFilteredPlayers(
          players.filter(player => 
            player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            player.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (player.nationality && player.nationality.toLowerCase().includes(searchTerm.toLowerCase()))
          )
        );
      } else {
        setFilteredPlayers(players);
      }
    }, [searchTerm, players]);

    const loadData = async () => {
      try {
        setLoading(true);
        
        // Fetch data from the service
        const fetchedPlayers = await dataManagementService.getPlayers();
        const fetchedClubData = await dataManagementService.getClubData();
        
        setPlayers(fetchedPlayers);
        setFilteredPlayers(fetchedPlayers);
        setClubData(fetchedClubData);
      } catch (error) {
        console.error('Error loading data:', error);
        toast.error('Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    // Add useEffect to listen for data changes
    useEffect(() => {
      // Set up polling for data updates
      const interval = setInterval(() => {
        loadData();
      }, 30000); // Refresh every 30 seconds
      
      // Load data immediately
      loadData();
      
      // Subscribe to player updates
      dataManagementService.setPlayersUpdateCallback((updatedPlayers) => {
        setPlayers(updatedPlayers);
        setFilteredPlayers(updatedPlayers);
      });
      
      return () => {
        clearInterval(interval);
        dataManagementService.setPlayersUpdateCallback(null);
      };
    }, []);

    const handleSavePlayer = async (playerData: Partial<Player>) => {
      try {
        if (selectedPlayer && isEditing) {
          // Update existing player
          const updatedPlayer = await dataManagementService.updatePlayer(selectedPlayer.id!, playerData);
          if (updatedPlayer) {
            setPlayers(players.map(p => p.id === updatedPlayer.id ? updatedPlayer : p));
            toast.success('Player updated successfully!');
          }
        } else {
          // Add new player
          const newPlayer = await dataManagementService.createPlayer(playerData);
          if (newPlayer) {
            setPlayers([...players, newPlayer]);
            toast.success('Player added successfully!');
          }
        }
        setShowAddForm(false);
        setIsEditing(false);
        setSelectedPlayer(null);
      } catch (error) {
        console.error('Error saving player:', error);
        toast.error('Failed to save player');
      }
    };

    const handleDeletePlayer = async (playerId: string) => {
      try {
        const success = await dataManagementService.deletePlayer(playerId);
        if (success) {
          setPlayers(players.filter(p => p.id !== playerId));
          // Note: filteredPlayers will be updated automatically by the useEffect when players change
          toast.success('Player deleted successfully!');
        }
      } catch (error) {
        console.error('Error deleting player:', error);
        toast.error('Failed to delete player');
      }
    };

    const getPositionColor = (position: string) => {
      switch (position) {
        case 'GK': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100';
        case 'DEF': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100';
        case 'MID': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100';
        case 'FWD': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100';
        default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100';
      }
    };

    const getSkillColor = (skill: number) => {
      if (skill >= 80) return 'text-green-600 dark:text-green-400';
      if (skill >= 60) return 'text-yellow-600 dark:text-yellow-400';
      return 'text-red-600 dark:text-red-400';
    };

    const handleExportPlayers = async (format: 'csv' | 'json') => {
      try {
        const players = await dataManagementService.getPlayers();
        
        if (format === 'csv') {
          // Convert to CSV format
          const headers = [
            'ID', 'Name', 'Position', 'Age', 'Nationality', 'Goals', 
            'Assists', 'Minutes', 'Fitness', 'Technical Skills', 
            'Physical Skills', 'Tactical Skills', 'Mental Skills',
            'Medical Clearance', 'Notes'
          ];
          
          const csvContent = [
            headers.join(','),
            ...players.map(player => [
              player.id,
              `"${player.name}"`,
              player.position,
              player.age,
              `"${player.nationality || ''}"`,
              player.goals,
              player.assists,
              player.minutes,
              player.fitness,
              player.skills?.technical || 0,
              player.skills?.physical || 0,
              player.skills?.tactical || 0,
              player.skills?.mental || 0,
              player.medicalClearance ? 'Yes' : 'No',
              `"${player.notes || ''}"`
            ].join(','))
          ].join('\n');
          
          // Create and download CSV file
          const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.setAttribute('href', url);
          link.setAttribute('download', `players_${new Date().toISOString().split('T')[0]}.csv`);
          link.style.visibility = 'hidden';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        } else {
          // Convert to JSON format
          const jsonContent = JSON.stringify(players, null, 2);
          const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.setAttribute('href', url);
          link.setAttribute('download', `players_${new Date().toISOString().split('T')[0]}.json`);
          link.style.visibility = 'hidden';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
        
        toast.success(`Players exported successfully as ${format.toUpperCase()}!`);
      } catch (error) {
        console.error('Error exporting players:', error);
        toast.error('Failed to export players');
      }
    };

    const handleImportPlayers = async (event: React.ChangeEvent<HTMLInputElement>) => {
      try {
        const file = event.target.files?.[0];
        if (!file) return;
      
        const fileName = file.name;
        const fileExtension = fileName.split('.').pop()?.toLowerCase();
      
        if (fileExtension === 'csv') {
          // Handle CSV import
          const text = await file.text();
          const lines = text.split('\n').filter(line => line.trim() !== '');
        
          if (lines.length < 2) {
            toast.error('CSV file is empty or invalid');
            return;
          }
        
          const firstLine = lines[0];
          if (!firstLine) {
            toast.error('CSV file is empty or invalid');
            return;
          }
        
          const headers = firstLine.split(',').map(h => h.trim().replace(/"/g, ''));
          const playerData: Partial<Player>[] = [];
        
          for (let i = 1; i < lines.length; i++) {
            const line = lines[i];
            if (!line || line.trim() === '') continue;
          
            const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
            const player: Partial<Player> = {};
          
            headers.forEach((header, index) => {
              const rawValue = index < values.length ? values[index] : '';
              const value = rawValue ? rawValue.toString() : '';
              
              if (typeof header === 'string') {
                const headerLower = header.toLowerCase();
                if (headerLower === 'id') {
                  if (value) player.id = value;
                } else if (headerLower === 'name') {
                  if (value) player.name = value;
                } else if (headerLower === 'position') {
                  if (value) player.position = value;
                } else if (headerLower === 'age') {
                  const ageValue = value ? parseInt(value, 10) : 0;
                  player.age = isNaN(ageValue) ? 0 : ageValue;
                } else if (headerLower === 'nationality') {
                  if (value) player.nationality = value;
                } else if (headerLower === 'goals') {
                  const goalsValue = value ? parseInt(value, 10) : 0;
                  player.goals = isNaN(goalsValue) ? 0 : goalsValue;
                } else if (headerLower === 'assists') {
                  const assistsValue = value ? parseInt(value, 10) : 0;
                  player.assists = isNaN(assistsValue) ? 0 : assistsValue;
                } else if (headerLower === 'minutes') {
                  const minutesValue = value ? parseInt(value, 10) : 0;
                  player.minutes = isNaN(minutesValue) ? 0 : minutesValue;
                } else if (headerLower === 'fitness') {
                  const fitnessValue = value ? parseInt(value, 10) : 0;
                  player.fitness = isNaN(fitnessValue) ? 0 : fitnessValue;
                } else if (headerLower === 'technical skills') {
                  if (!player.skills) player.skills = { technical: 0, physical: 0, tactical: 0, mental: 0 };
                  const technicalValue = value ? parseInt(value, 10) : 0;
                  player.skills.technical = isNaN(technicalValue) ? 0 : technicalValue;
                } else if (headerLower === 'physical skills') {
                  if (!player.skills) player.skills = { technical: 0, physical: 0, tactical: 0, mental: 0 };
                  const physicalValue = value ? parseInt(value, 10) : 0;
                  player.skills.physical = isNaN(physicalValue) ? 0 : physicalValue;
                } else if (headerLower === 'tactical skills') {
                  if (!player.skills) player.skills = { technical: 0, physical: 0, tactical: 0, mental: 0 };
                  const tacticalValue = value ? parseInt(value, 10) : 0;
                  player.skills.tactical = isNaN(tacticalValue) ? 0 : tacticalValue;
                } else if (headerLower === 'mental skills') {
                  if (!player.skills) player.skills = { technical: 0, physical: 0, tactical: 0, mental: 0 };
                  const mentalValue = value ? parseInt(value, 10) : 0;
                  player.skills.mental = isNaN(mentalValue) ? 0 : mentalValue;
                } else if (headerLower === 'medical clearance') {
                  player.medicalClearance = value?.toLowerCase() === 'yes';
                } else if (headerLower === 'notes') {
                  if (value) player.notes = value;
                }
              }
            });
          
            if (player.name) {
              playerData.push(player);
            }
          }
        
          // Process imported players
          let successCount = 0;
          for (const player of playerData) {
            try {
              if (player.id) {
                // Update existing player
                await dataManagementService.updatePlayer(player.id, player);
                successCount++;
              } else {
                // Create new player
                await dataManagementService.createPlayer(player);
                successCount++;
              }
            } catch (error) {
              console.error('Error processing player:', player, error);
            }
          }
          
          toast.success(`Successfully imported ${successCount} players from CSV!`);
        } else if (fileExtension === 'json') {
          // Handle JSON import
          const text = await file.text();
          const players: Partial<Player>[] = JSON.parse(text);
        
          // Process imported players
          let successCount = 0;
          for (const player of players) {
            try {
              if (player.id) {
                // Update existing player
                await dataManagementService.updatePlayer(player.id, player);
                successCount++;
              } else {
                // Create new player
                await dataManagementService.createPlayer(player);
                successCount++;
              }
            } catch (error) {
              console.error('Error processing player:', player, error);
            }
          }
          
          toast.success(`Successfully imported ${successCount} players from JSON!`);
        } else {
          toast.error('Unsupported file format. Please use CSV or JSON files.');
          return;
        }
      
        // Refresh data
        loadData();
      } catch (error) {
        console.error('Error importing players:', error);
        toast.error('Failed to import players. Please check the file format and try again.');
      } finally {
        // Reset file input
        if (event.target) {
          event.target.value = '';
        }
      }
    };

    return (
      <>
        <motion.div
          id="data-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8"
        >
          <Card className={`${
            isHighContrast ? 'hc-card' :
            theme === 'midnight' ? 'bg-white border-gray-200' : 'bg-white border-gray-200'
          }`}>
            <CardHeader className={`border-b ${
              theme === 'midnight' ? 'border-gray-200' : 'border-gray-200'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${
                    theme === 'midnight' ? 'bg-indigo-500' : 'bg-indigo-500'
                  }`}>
                    <Database className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className={`${
                      theme === 'midnight' ? 'text-gray-900' : 'text-gray-900'
                    }`}>
                      DATA Management Center
                    </CardTitle>
                    <p className={`text-sm mt-1 ${
                      theme === 'midnight' ? 'text-gray-600' : 'text-gray-600'
                    }`}>
                      Comprehensive player and club data management with advanced features
                    </p>
                  </div>
                </div>
                
                {/* System Status Indicators */}
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${
                      connectionStatus === 'connected' ? 'bg-green-500' :
                      connectionStatus === 'reconnecting' ? 'bg-yellow-500 animate-pulse' :
                      'bg-red-500'
                    }`} />
                    <span className={`text-sm ${
                      theme === 'midnight' ? 'text-gray-600' : 'text-gray-600'
                    }`}>
                      {connectionStatus === 'connected' ? 'Online' :
                       connectionStatus === 'reconnecting' ? 'Reconnecting...' :
                       'Offline'}
                    </span>
                  </div>
                  
                  {/* Email Service Status */}
                  <div className="flex items-center space-x-1">
                    <Mail className={`h-4 w-4 ${
                      systemHealth.emailService === 'operational' ? 'text-green-500' :
                      systemHealth.emailService === 'delayed' ? 'text-yellow-500' :
                      'text-red-500'
                    }`} />
                    <span className={`text-xs ${
                      theme === 'midnight' ? 'text-gray-500' : 'text-gray-500'
                    }`}>
                      {systemHealth.emailService === 'operational' ? 'Email OK' :
                       systemHealth.emailService === 'delayed' ? 'Email Slow' :
                       'Email Down'}
                    </span>
                  </div>
                  
                  {/* PayPal Status */}
                  <div className="flex items-center space-x-1">
                    <CreditCard className={`h-4 w-4 ${
                      systemHealth.paymentSystem === 'active' ? 'text-green-500' :
                      systemHealth.paymentSystem === 'maintenance' ? 'text-yellow-500' :
                      'text-red-500'
                    }`} />
                    <span className={`text-xs ${
                      theme === 'midnight' ? 'text-gray-500' : 'text-gray-500'
                    }`}>
                      PayPal {systemHealth.paymentSystem === 'active' ? 'Active' :
                               systemHealth.paymentSystem === 'maintenance' ? 'Maintenance' :
                               'Error'}
                    </span>
                  </div>
                  
                  {/* Last Sync */}
                  <div className={`text-xs ${
                    theme === 'midnight' ? 'text-gray-500' : 'text-gray-500'
                  }`}>
                    Synced: {lastSync.toLocaleTimeString()}
                  </div>
                  
                  {/* Refresh Button */}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={loadData}
                    disabled={loading}
                    className={`${
                      theme === 'midnight' 
                        ? 'border-gray-300 text-gray-700 hover:bg-gray-100' 
                        : 'border-gray-300 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="p-6">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin" />
                  <span className="ml-2">Loading data...</span>
                </div>
              ) : (
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className={`grid w-full grid-cols-6 ${
                  theme === 'midnight' ? 'bg-gray-100' : 'bg-gray-100'
                }`}>
                  <TabsTrigger 
                    value="players" 
                    className={`flex items-center space-x-2 ${
                      theme === 'midnight' 
                        ? 'data-[state=active]:bg-indigo-600 data-[state=active]:text-white' 
                        : 'data-[state=active]:bg-indigo-500 data-[state=active]:text-white'
                    }`}
                  >
                    <Users className="h-4 w-4" />
                    <span>Players</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="club" 
                    className={`flex items-center space-x-2 ${
                      theme === 'midnight' 
                        ? 'data-[state=active]:bg-indigo-600 data-[state=active]:text-white' 
                        : 'data-[state=active]:bg-indigo-500 data-[state=active]:text-white'
                    }`}
                  >
                    <Building2 className="h-4 w-4" />
                    <span>Club</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="matches" 
                    className={`flex items-center space-x-2 ${
                      theme === 'midnight' 
                        ? 'data-[state=active]:bg-indigo-600 data-[state=active]:text-white' 
                        : 'data-[state=active]:bg-indigo-500 data-[state=active]:text-white'
                    }`}
                  >
                    <Trophy className="h-4 w-4" />
                    <span>Matches</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="training" 
                    className={`flex items-center space-x-2 ${
                      theme === 'midnight' 
                        ? 'data-[state=active]:bg-indigo-600 data-[state=active]:text-white' 
                        : 'data-[state=active]:bg-indigo-500 data-[state=active]:text-white'
                    }`}
                  >
                    <Activity className="h-4 w-4" />
                    <span>Training</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="events" 
                    className={`flex items-center space-x-2 ${
                      theme === 'midnight' 
                        ? 'data-[state=active]:bg-indigo-600 data-[state=active]:text-white' 
                        : 'data-[state=active]:bg-indigo-500 data-[state=active]:text-white'
                    }`}
                  >
                    <Calendar className="h-4 w-4" />
                    <span>Events</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="analytics" 
                    className={`flex items-center space-x-2 ${
                      theme === 'midnight' 
                        ? 'data-[state=active]:bg-indigo-600 data-[state=active]:text-white' 
                        : 'data-[state=active]:bg-indigo-500 data-[state=active]:text-white'
                    }`}
                  >
                    <BarChart3 className="h-4 w-4" />
                    <span>Analytics</span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="players" className="mt-6">
                  <div className="space-y-6">
                    {/* Search and Actions Bar */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
                      <div className="flex items-center space-x-2 flex-1 max-w-md">
                        <div className="relative flex-1">
                          <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${
                            theme === 'midnight' ? 'text-gray-400' : 'text-gray-400'
                          }`} />
                          <Input
                            placeholder="Search players..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className={`pl-10 ${
                              theme === 'midnight' 
                                ? 'bg-gray-800 border-gray-700 text-white' 
                                : 'bg-white border-gray-300 text-gray-900'
                            }`}
                          />
                        </div>
                        <Button 
                          variant="outline"
                          size="sm"
                          className={`${theme === 'midnight' 
                              ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                              : 'border-gray-300 text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          <Filter className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          onClick={() => setShowAddForm(true)}
                          className={`${
                            theme === 'midnight' 
                              ? 'bg-indigo-600 hover:bg-indigo-700' 
                              : 'bg-indigo-500 hover:bg-indigo-600'
                          }`}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Player
                        </Button>
                        
                        {/* Export Dropdown */}
                        <div className="relative">
                          <Button 
                            variant="outline"
                            onClick={() => setShowExportMenu(!showExportMenu)}
                            className={`${
                              theme === 'midnight' 
                                ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                                : 'border-gray-300 text-gray-700 hover:bg-gray-100'
                            }`}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Export
                            <ChevronDown className="h-4 w-4 ml-2" />
                          </Button>
                          
                          {showExportMenu && (
                            <div className="absolute right-0 mt-1 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                              <div className="py-1">
                                <button
                                  onClick={() => {
                                    handleExportPlayers('csv');
                                    setShowExportMenu(false);
                                  }}
                                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                >
                                  Export as CSV
                                </button>
                                <button
                                  onClick={() => {
                                    handleExportPlayers('json');
                                    setShowExportMenu(false);
                                  }}
                                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                >
                                  Export as JSON
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                        
                        {/* Import Dropdown */}
                        <div className="relative">
                          <Button 
                            variant="outline"
                            onClick={() => setShowImportMenu(!showImportMenu)}
                            className={`${
                              theme === 'midnight' 
                                ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                                : 'border-gray-300 text-gray-700 hover:bg-gray-100'
                            }`}
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            Import
                            <ChevronDown className="h-4 w-4 ml-2" />
                          </Button>
                          
                          {showImportMenu && (
                            <div className="absolute right-0 mt-1 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                              <div className="py-1">
                                <label className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer">
                                  Import CSV
                                  <input
                                    type="file"
                                    accept=".csv"
                                    onChange={(e) => {
                                      handleImportPlayers(e);
                                      setShowImportMenu(false);
                                    }}
                                    className="hidden"
                                  />
                                </label>
                                <label className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer">
                                  Import JSON
                                  <input
                                    type="file"
                                    accept=".json"
                                    onChange={(e) => {
                                      handleImportPlayers(e);
                                      setShowImportMenu(false);
                                    }}
                                    className="hidden"
                                  />
                                </label>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Add/Edit Player Form */}
                    {(showAddForm || (selectedPlayer && isEditing)) && (
                      <Card className={`${
                        theme === 'midnight' ? 'bg-white border-gray-200' : 'bg-white border-gray-200'
                      }`}>
                        <CardHeader>
                          <CardTitle className={`${
                            theme === 'midnight' ? 'text-gray-900' : 'text-gray-900'
                          }`}>
                            {selectedPlayer && isEditing ? 'Edit Player' : 'Add New Player'}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <AddPlayerForm
                            isOpen={true}
                            onClose={() => {
                              setShowAddForm(false);
                              setIsEditing(false);
                              setSelectedPlayer(null);
                            }}
                            onSave={(playerData) => {
                              handleSavePlayer(playerData);
                              setShowAddForm(false);
                              setIsEditing(false);
                              setSelectedPlayer(null);
                            }}
                          />
                        </CardContent>
                      </Card>
                    )}

                    {/* Players Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredPlayers.map((player) => (
                        <Card 
                          key={player.id} 
                          className={`hover:shadow-lg transition-shadow cursor-pointer ${
                            theme === 'midnight' ? 'bg-white border-gray-200' : 'bg-white border-gray-200'
                          }`}
                        >
                          <CardContent className="p-6">
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                                  <User className="h-5 w-5 text-gray-500" />
                                </div>
                                <div>
                                  <h3 className="font-semibold text-gray-900">{player.name}</h3>
                                  <p className="text-sm text-gray-500">{player.age} years • {player.nationality}</p>
                                </div>
                              </div>
                              <Badge className={getPositionColor(player.position)}>
                                {player.position}
                              </Badge>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                              <div>
                                <span className="font-medium">{player.goals}</span> goals
                              </div>
                              <div>
                                <span className="font-medium">{player.assists}</span> assists
                              </div>
                              <div>
                                <span className="font-medium">{player.minutes}</span> min
                              </div>
                              <div>
                                <span className="font-medium">{player.fitness}%</span> fitness
                              </div>
                            </div>

                            {player.skills && (
                              <div className="mb-4">
                                <div className={`text-xs mb-1 ${
                                  theme === 'midnight' ? 'text-gray-500' : 'text-gray-500'
                                }`}>Skills</div>
                                <div className="grid grid-cols-4 gap-2 text-xs">
                                  <div className="text-center">
                                    <div className={`font-semibold ${getSkillColor(player.skills?.technical || 0)}`}>
                                      {player.skills?.technical || 0}
                                    </div>
                                    <div className="text-gray-500">TEC</div>
                                  </div>
                                  <div className="text-center">
                                    <div className={`font-semibold ${getSkillColor(player.skills?.physical || 0)}`}>
                                      {player.skills?.physical || 0}
                                    </div>
                                    <div className="text-gray-500">PHY</div>
                                  </div>
                                  <div className="text-center">
                                    <div className={`font-semibold ${getSkillColor(player.skills?.tactical || 0)}`}>
                                      {player.skills?.tactical || 0}
                                    </div>
                                    <div className="text-gray-500">TAC</div>
                                  </div>
                                  <div className="text-center">
                                    <div className={`font-semibold ${getSkillColor(player.skills?.mental || 0)}`}>
                                      {player.skills?.mental || 0}
                                    </div>
                                    <div className="text-gray-500">MEN</div>
                                  </div>
                                </div>
                              </div>
                            )}

                            {player.notes && (
                              <div className="mb-4">
                                <div className={`text-xs mb-1 ${
                                  theme === 'midnight' ? 'text-gray-500' : 'text-gray-500'
                                }`}>Notes</div>
                                <p className={`text-xs ${
                                  theme === 'midnight' ? 'text-gray-700' : 'text-gray-700'
                                }`}>{player.notes}</p>
                              </div>
                            )}

                            <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                              <div className="flex items-center space-x-1">
                                {player.medicalClearance ? (
                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                ) : (
                                  <AlertCircle className="h-4 w-4 text-red-500" />
                                )}
                                <span className={`text-xs ${
                                  theme === 'midnight' ? 'text-gray-500' : 'text-gray-500'
                                }`}>
                                  Medical: {player.medicalClearance ? 'Clear' : 'Pending'}
                                </span>
                              </div>
                              <div className="flex space-x-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    if (player.id) {
                                      setSelectedPlayer(player);
                                      setIsEditing(true);
                                    }
                                  }}
                                  className={`${
                                    theme === 'midnight' 
                                      ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                                      : 'border-gray-300 text-gray-700 hover:bg-gray-100'
                                  }`}
                                  disabled={!player.id}
                                >
                                  <Edit3 className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    if (player.id) {
                                      handleDeletePlayer(player.id);
                                    }
                                  }}
                                  className={`${
                                    theme === 'midnight' 
                                      ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                                      : 'border-gray-300 text-gray-700 hover:bg-gray-100'
                                  }`}
                                  disabled={!player.id}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="club" className="mt-6">
                  <div className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                          <Building2 className="h-5 w-5" />
                          <span>Club Information</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium mb-1">Club Name</label>
                            <Input value={clubData?.name || ''} onChange={(e) => setClubData(prev => prev ? {...prev, name: e.target.value} : null)} />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">Founded</label>
                            <Input type="number" value={clubData?.founded || ''} onChange={(e) => setClubData(prev => prev ? {...prev, founded: parseInt(e.target.value) || 0} : null)} />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">Stadium</label>
                            <Input value={clubData?.stadium || ''} onChange={(e) => setClubData(prev => prev ? {...prev, stadium: e.target.value} : null)} />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">Capacity</label>
                            <Input type="number" value={clubData?.capacity || ''} onChange={(e) => setClubData(prev => prev ? {...prev, capacity: parseInt(e.target.value) || 0} : null)} />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">Phone</label>
                            <Input value={clubData?.phone || ''} onChange={(e) => setClubData(prev => prev ? {...prev, phone: e.target.value} : null)} />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">Email</label>
                            <Input value={clubData?.email || ''} onChange={(e) => setClubData(prev => prev ? {...prev, email: e.target.value} : null)} />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">President</label>
                            <Input value={clubData?.president || ''} onChange={(e) => setClubData(prev => prev ? {...prev, president: e.target.value} : null)} />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">Head Coach</label>
                            <Input value={clubData?.headCoach || ''} onChange={(e) => setClubData(prev => prev ? {...prev, headCoach: e.target.value} : null)} />
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium mb-1">Address</label>
                          <Input value={clubData?.address || ''} onChange={(e) => setClubData(prev => prev ? {...prev, address: e.target.value} : null)} />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium mb-1">Annual Budget (€)</label>
                            <Input type="number" value={clubData?.budget || ''} onChange={(e) => setClubData(prev => prev ? {...prev, budget: parseInt(e.target.value) || 0} : null)} />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">Trophies Won</label>
                            <Input type="number" value={clubData?.trophies || ''} onChange={(e) => setClubData(prev => prev ? {...prev, trophies: parseInt(e.target.value) || 0} : null)} />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">Website</label>
                            <Input value={clubData?.website || ''} onChange={(e) => setClubData(prev => prev ? {...prev, website: e.target.value} : null)} />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-1">Club Notes</label>
                          <Textarea
                            value={clubData?.notes || ''}
                            onChange={(e) => setClubData(prev => prev ? {...prev, notes: e.target.value} : null)}
                            placeholder="Club history, achievements, goals, strategic notes..."
                            rows={4}
                          />
                        </div>

                        <Button 
                          className="bg-green-600 hover:bg-green-700"
                          onClick={async () => {
                            if (clubData) {
                              try {
                                setSaving(true);
                                await dataManagementService.updateClubData(clubData);
                                toast.success('Club data updated successfully!');
                              } catch (error) {
                                console.error('Error updating club data:', error);
                                toast.error('Failed to update club data');
                              } finally {
                                setSaving(false);
                              }
                            }
                          }}
                          disabled={saving}
                        >
                          {saving ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Save className="h-4 w-4 mr-2" />
                          )}
                          {saving ? 'Saving...' : 'Save Club Data'}
                        </Button>
                      </CardContent>
                    </Card>

                    {/* Staff & Facilities */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center space-x-2">
                            <Users className="h-5 w-5" />
                            <span>Staff Overview</span>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium">Coaches</span>
                              <Badge variant="outline">{clubData?.staff?.coaches || 0}</Badge>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium">Medical Staff</span>
                              <Badge variant="outline">{clubData?.staff?.medical || 0}</Badge>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium">Administrative</span>
                              <Badge variant="outline">{clubData?.staff?.administrative || 0}</Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center space-x-2">
                            <Settings className="h-5 w-5" />
                            <span>Facilities</span>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium">Training Grounds</span>
                              <Badge variant="outline">{clubData?.facilities?.trainingGrounds || 0}</Badge>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium">Medical Center</span>
                              <Badge className={clubData?.facilities?.medicalCenter ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                                {clubData?.facilities?.medicalCenter ? 'Available' : 'Not Available'}
                              </Badge>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium">Gym</span>
                              <Badge className={clubData?.facilities?.gym ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                                {clubData?.facilities?.gym ? 'Available' : 'Not Available'}
                              </Badge>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium">Restaurant</span>
                              <Badge className={clubData?.facilities?.restaurant ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                                {clubData?.facilities?.restaurant ? 'Available' : 'Not Available'}
                              </Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="matches" className="mt-6">
                  <div className="space-y-6">
                    {/* Add Match Button */}
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-lg font-semibold">Match Management</h3>
                        <p className="text-sm text-gray-600">Schedule and track matches</p>
                      </div>
                      <Button className="bg-green-600 hover:bg-green-700">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Match
                      </Button>
                    </div>

                    {/* Match Statistics */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center space-x-2">
                            <Trophy className="h-5 w-5 text-yellow-500" />
                            <div>
                              <p className="text-sm text-gray-600">Total Matches</p>
                              <p className="text-2xl font-bold">48</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center space-x-2">
                            <ThumbsUp className="h-5 w-5 text-green-500" />
                            <div>
                              <p className="text-sm text-gray-600">Wins</p>
                              <p className="text-2xl font-bold">32</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center space-x-2">
                            <ThumbsDown className="h-5 w-5 text-red-500" />
                            <div>
                              <p className="text-sm text-gray-600">Losses</p>
                              <p className="text-2xl font-bold">10</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center space-x-2">
                            <Equal className="h-5 w-5 text-gray-500" />
                            <div>
                              <p className="text-sm text-gray-600">Draws</p>
                              <p className="text-2xl font-bold">6</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Recent Matches */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Recent Matches</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {[
                            'vs Barcelona',
                            'vs Real Madrid',
                            'vs Atletico Madrid',
                            'vs Valencia',
                            'vs Sevilla'
                          ].map((match) => (
                            <div key={match} className="flex items-center justify-between p-3 border rounded-lg">
                              <div className="flex items-center space-x-3">
                                <Badge className="bg-green-100 text-green-800">W</Badge>
                                <div>
                                  <p className="font-medium">{match}</p>
                                  <p className="text-sm text-gray-500">La Liga • Home</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-bold">3-1</p>
                                <p className="text-sm text-gray-500">Dec 15, 2024</p>
                              </div>
                              <Button variant="outline" size="sm">
                                <Edit3 className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="training" className="mt-6">
                  <div className="space-y-6">
                    {/* Add Training Session Button */}
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-lg font-semibold">Training Management</h3>
                        <p className="text-sm text-gray-600">Plan and track training sessions</p>
                      </div>
                      <Button className="bg-blue-600 hover:bg-blue-700">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Training Session
                      </Button>
                    </div>

                    {/* Training Statistics */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center space-x-2">
                            <Activity className="h-5 w-5 text-blue-500" />
                            <div>
                              <p className="text-sm text-gray-600">Total Sessions</p>
                              <p className="text-2xl font-bold">156</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center space-x-2">
                            <Clock className="h-5 w-5 text-green-500" />
                            <div>
                              <p className="text-sm text-gray-600">Avg Duration</p>
                              <p className="text-2xl font-bold">90m</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center space-x-2">
                            <Users className="h-5 w-5 text-purple-500" />
                            <div>
                              <p className="text-sm text-gray-600">Avg Attendance</p>
                              <p className="text-2xl font-bold">22</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center space-x-2">
                            <TrendingUp className="h-5 w-5 text-orange-500" />
                            <div>
                              <p className="text-sm text-gray-600">Intensity</p>
                              <p className="text-2xl font-bold">High</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Training Schedule */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Training Schedule</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map((day) => (
                            <div key={day} className="flex items-center justify-between p-3 border rounded-lg">
                              <div className="flex items-center space-x-3">
                                <Badge className="bg-blue-100 text-blue-800">{day}</Badge>
                                <div>
                                  <p className="font-medium">Tactical Training</p>
                                  <p className="text-sm text-gray-500">09:00 - 11:00 • High Intensity</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-bold">24/25 Players</p>
                                <p className="text-sm text-gray-500">96% Attendance</p>
                              </div>
                              <Button variant="outline" size="sm">
                                <Edit3 className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="events" className="mt-6">
                  <div className="space-y-6">
                    {/* Add Event Button */}
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-lg font-semibold">Event Management</h3>
                        <p className="text-sm text-gray-600">Schedule and manage team events</p>
                      </div>
                      <Button className="bg-purple-600 hover:bg-purple-700">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Event
                      </Button>
                    </div>

                    {/* Event Statistics */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-5 w-5 text-blue-500" />
                            <div>
                              <p className="text-sm text-gray-600">Total Events</p>
                              <p className="text-2xl font-bold">48</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center space-x-2">
                            <Trophy className="h-5 w-5 text-yellow-500" />
                            <div>
                              <p className="text-sm text-gray-600">Matches</p>
                              <p className="text-2xl font-bold">24</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center space-x-2">
                            <Activity className="h-5 w-5 text-green-500" />
                            <div>
                              <p className="text-sm text-gray-600">Training</p>
                              <p className="text-2xl font-bold">18</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center space-x-2">
                            <Users className="h-5 w-5 text-purple-500" />
                            <div>
                              <p className="text-sm text-gray-600">Meetings</p>
                              <p className="text-2xl font-bold">6</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Upcoming Events */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Upcoming Events</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {[
                            { type: 'match', title: 'vs Barcelona', date: 'Dec 20, 2024', time: '20:00', location: 'Camp Nou' },
                            { type: 'training', title: 'Tactical Training', date: 'Dec 18, 2024', time: '09:00', location: 'Training Ground' },
                            { type: 'meeting', title: 'Team Meeting', date: 'Dec 17, 2024', time: '14:00', location: 'Conference Room' },
                            { type: 'match', title: 'vs Atletico Madrid', date: 'Dec 23, 2024', time: '18:30', location: 'Wanda Metropolitano' },
                            { type: 'other', title: 'Medical Checkups', date: 'Dec 19, 2024', time: '10:00', location: 'Medical Center' }
                          ].map((event, index) => (
                            <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                              <div className="flex items-center space-x-3">
                                <Badge className={
                                  event.type === 'match' ? 'bg-yellow-100 text-yellow-800' :
                                  event.type === 'training' ? 'bg-blue-100 text-blue-800' :
                                  event.type === 'meeting' ? 'bg-purple-100 text-purple-800' :
                                  'bg-gray-100 text-gray-800'
                                }>
                                  {event.type === 'match' ? <Trophy className="h-3 w-3" /> :
                                   event.type === 'training' ? <Activity className="h-3 w-3" /> :
                                   event.type === 'meeting' ? <Users className="h-3 w-33" /> :
                                   <Calendar className="h-3 w-3" />}
                                </Badge>
                                <div>
                                  <p className="font-medium">{event.title}</p>
                                  <p className="text-sm text-gray-500">{event.location}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-bold">{event.time}</p>
                                <p className="text-sm text-gray-500">{event.date}</p>
                              </div>
                              <Button variant="outline" size="sm">
                                <Edit3 className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="analytics" className="mt-6">
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                        <CardContent className="p-4">
                          <div className="flex items-center space-x-3 mb-3">
                            <FileText className="h-8 w-8 text-blue-500" />
                            <div>
                              <h3 className="font-semibold">Player Performance Report</h3>
                              <p className="text-sm text-gray-500">Detailed individual statistics</p>
                            </div>
                          </div>
                          <Button size="sm" className="w-full">
                            <Download className="h-4 w-4 mr-2" />
                            Generate PDF
                          </Button>
                        </CardContent>
                      </Card>

                      <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                        <CardContent className="p-4">
                          <div className="flex items-center space-x-3 mb-3">
                            <BarChart3 className="h-8 w-8 text-green-500" />
                            <div>
                              <h3 className="font-semibold">Team Analytics</h3>
                              <p className="text-sm text-gray-500">Comprehensive team analysis</p>
                            </div>
                          </div>
                          <Button size="sm" className="w-full">
                            <Download className="h-4 w-4 mr-2" />
                            Generate PDF
                          </Button>
                        </CardContent>
                      </Card>

                      <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                        <CardContent className="p-4">
                          <div className="flex items-center space-x-3 mb-3">
                            <Heart className="h-8 w-8 text-red-500" />
                            <div>
                              <h3 className="font-semibold">Medical Report</h3>
                              <p className="text-sm text-gray-500">Health and fitness status</p>
                            </div>
                          </div>
                          <Button size="sm" className="w-full">
                            <Download className="h-4 w-4 mr-2" />
                            Generate PDF
                          </Button>
                        </CardContent>
                      </Card>

                      <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                        <CardContent className="p-4">
                          <div className="flex items-center space-x-3 mb-3">
                            <Calendar className="h-8 w-8 text-orange-500" />
                            <div>
                              <h3 className="font-semibold">Contract Overview</h3>
                              <p className="text-sm text-gray-500">Contract renewals and dates</p>
                            </div>
                          </div>
                          <Button size="sm" className="w-full">
                            <Download className="h-4 w-4 mr-2" />
                            Generate PDF
                          </Button>
                        </CardContent>
                      </Card>

                      <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                        <CardContent className="p-4">
                          <div className="flex items-center space-x-3 mb-3">
                            <Building2 className="h-8 w-8 text-indigo-500" />
                            <div>
                              <h3 className="font-semibold">Club Summary</h3>
                              <p className="text-sm text-gray-500">Complete club information</p>
                            </div>
                          </div>
                          <Button size="sm" className="w-full">
                            <Download className="h-4 w-4 mr-2" />
                            Generate PDF
                          </Button>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </>
    );
  }

export default DataManagementSection;
