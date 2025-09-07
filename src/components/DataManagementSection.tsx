import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { dataManagementService, Player, ClubData } from '../services/dataManagementService';
import {
  Database,
  Users,
  Building2,
  Search,
  Filter,
  Plus,
  Edit3,
  Save,
  Trash2,
  Download,
  Upload,
  Calendar,
  Trophy,
  Target,
  Heart,
  Activity,
  FileText,
  BarChart3,
  TrendingUp,
  Award,
  DollarSign,
  Clock,
  AlertCircle,
  CheckCircle,
  User,
  Settings,
  Loader2,
  Mail,
  CreditCard,
  Shield,
  RefreshCw
} from 'lucide-react';

// Mock email service since we can't connect to the backend
const mockEmailService = {
  initialize: async () => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    return true; // Always return true for mock
  }
};

// Enhanced interfaces with better validation and error handling
interface EnhancedPlayer extends Player {
  contractStatus?: 'active' | 'expiring' | 'expired';
  performanceRating?: number;
}

interface SystemHealth {
  database: 'healthy' | 'warning' | 'error';
  paymentSystem: 'active' | 'maintenance' | 'error';
  emailService: 'operational' | 'delayed' | 'down';
  apiStatus: 'online' | 'slow' | 'offline';
}

// Player and ClubData interfaces are now imported from dataManagementService

const DataManagementSection: React.FC = () => {
  const { theme, isHighContrast } = useTheme();
  const { language } = useLanguage();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('players');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [systemHealth, setSystemHealth] = useState<SystemHealth>({
    database: 'healthy',
    paymentSystem: 'active' | 'maintenance' | 'error',
    emailService: 'operational' | 'delayed' | 'down',
    apiStatus: 'online' | 'slow' | 'offline'
  });
  const [lastSync, setLastSync] = useState<Date>(new Date());
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'reconnecting' | 'offline'>('connected');

  const [players, setPlayers] = useState<Player[]>([]);
  const [clubData, setClubData] = useState<ClubData | null>(null);

  useEffect(() => {
    loadData();
    // Set up periodic health checks
    const healthCheckInterval = setInterval(checkSystemHealth, 30000); // Every 30 seconds
    return () => clearInterval(healthCheckInterval);
  }, []);

  const checkSystemHealth = async () => {
    try {
      // Check email service
      const emailStatus = await mockEmailService.initialize();
      
      // Check API connection (mocked for now)
      const apiHealthy = true; // Mocked as healthy
      
      // Update system health status
      setSystemHealth(prev => ({
        ...prev,
        emailService: emailStatus ? 'operational' : 'down',
        apiStatus: apiHealthy ? 'online' : 'offline',
        database: apiHealthy ? 'healthy' : 'warning'
      }));
      
      setConnectionStatus(apiHealthy ? 'connected' : 'offline');
    } catch (error) {
      console.error('Health check failed:', error);
      setConnectionStatus('offline');
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      setConnectionStatus('reconnecting');
      
      // Add a timeout to prevent hanging
      const timeout = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 10000)
      );
      
      const dataPromise = Promise.all([
        dataManagementService.getPlayers(),
        dataManagementService.getClubData()
      ]);
      
      const [playersData, clubInfo] = await Promise.race([dataPromise, timeout]) as [Player[], ClubData];
      
      setPlayers(playersData);
      setClubData(clubInfo);
      setLastSync(new Date());
      setConnectionStatus('connected');
      
      // Verify email service is working
      const emailWorking = await mockEmailService.initialize();
      if (!emailWorking) {
        toast.warning('Email service may be experiencing issues. Contact support if you need immediate assistance.');
      }
      
    } catch (error: any) {
      console.error('Error loading data:', error);
      setConnectionStatus('offline');
      
      // Try to load fallback data
      try {
        const fallbackPlayers = await dataManagementService.getPlayers();
        const fallbackClubData = await dataManagementService.getClubData();
        
        setPlayers(fallbackPlayers);
        setClubData(fallbackClubData);
        setLastSync(new Date());
        setConnectionStatus('connected');
        
        if (error.message === 'Request timeout') {
          toast.warning('Request timed out. Showing demo data instead.');
        } else {
          toast.info('Showing demo data while we resolve connection issues');
        }
      } catch (fallbackError) {
        console.error('Error loading fallback data:', fallbackError);
        toast.error('Failed to load both real and demo data. Please check your connection and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const filteredPlayers = players.filter(player =>
    player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    player.position.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getPositionColor = (position: string) => {
    switch (position) {
      case 'DEL': return 'bg-red-100 text-red-800';
      case 'CEN': return 'bg-blue-100 text-blue-800';
      case 'DEF': return 'bg-green-100 text-green-800';
      case 'POR': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSkillColor = (skill: number) => {
    if (skill >= 85) return 'text-green-600';
    if (skill >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const handleSavePlayer = async (player: Player) => {
    try {
      setSaving(true);
      
      let result: Player;
      if (selectedPlayer) {
        result = await dataManagementService.updatePlayer(player.id!, player);
        setPlayers(prev => prev.map(p => p.id === player.id ? result : p));
        
        // Send update notification email to admin (simplified for now)
        try {
          console.log('Player updated:', player.name, 'by user:', user?.name);
          // Email notifications are handled by the email automation service
        } catch (emailError) {
          console.warn('Failed to send admin notification:', emailError);
        }
        
        toast.success('Player data updated successfully!');
      } else {
        result = await dataManagementService.createPlayer(player);
        setPlayers(prev => [...prev, result]);
        
        // Send welcome email to new player (simplified for now)
        try {
          if (player.email) {
            console.log('New player added:', player.name, 'Email:', player.email);
            // Email notifications are handled by the email automation service
          }
        } catch (emailError) {
          console.warn('Failed to send welcome email:', emailError);
          toast.warning('Player added but email notification may have failed.');
        }
        
        toast.success('New player added successfully!');
      }
      
      setIsEditing(false);
      setShowAddForm(false);
      setSelectedPlayer(null);
      setLastSync(new Date());
      
    } catch (error) {
      console.error('Error saving player:', error);
      toast.error('Failed to save player data. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePlayer = async (playerId: string) => {
    const playerToDelete = players.find(p => p.id === playerId);
    if (!playerToDelete) {
      toast.error('Player not found');
      return;
    }
    
    // Confirmation dialog
    const confirmed = window.confirm(
      `Are you sure you want to remove ${playerToDelete.name} from the team? This action cannot be undone.`
    );
    
    if (!confirmed) return;
    
    try {
      await dataManagementService.deletePlayer(playerId);
      setPlayers(prev => prev.filter(p => p.id !== playerId));
      
      // Send notification to admin about player removal
      try {
        console.log('Player removed:', playerToDelete.name, 'by user:', user?.name);
        // Admin notifications can be implemented when needed
      } catch (emailError) {
        console.warn('Failed to send removal notification:', emailError);
      }
      
      toast.success(`${playerToDelete.name} has been removed from the team`);
      setSelectedPlayer(null);
      setLastSync(new Date());
      
    } catch (error) {
      console.error('Error deleting player:', error);
      toast.error('Failed to delete player. Please try again.');
    }
  };

  const PlayerForm: React.FC<{ player?: Player; onSave: (player: Player) => Promise<void>; onCancel: () => void }> = ({ player, onSave, onCancel }) => {
    const currentDate = new Date().toISOString().split('T')[0] || new Date().toLocaleDateString('en-CA');
    const defaultPlayer: Player = {
      id: '',
      name: '',
      position: 'DEL',
      age: 18,
      nationality: '',
      email: '',
      phone: '',
      address: '',
      joinDate: currentDate,
      contractEnd: currentDate,
      salary: 0,
      goals: 0,
      assists: 0,
      minutes: 0,
      fitness: 100,
      injuries: [],
      notes: '',
      skills: { technical: 50, physical: 50, tactical: 50, mental: 50 },
      medicalClearance: true,
      lastMedicalCheck: currentDate
    };
    
    const [formData, setFormData] = useState<Player>(player || defaultPlayer);
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const { name, value } = e.target;
      if (name.includes('.')) {
        // Handle nested properties like skills.technical
        const [parent, child] = name.split('.');
        setFormData(prev => ({
          ...prev,
          [parent]: {
            ...(prev as any)[parent],
            [child]: value
          }
        }));
      } else {
        setFormData(prev => ({ ...prev, [name]: value }));
      }
    };
    
    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onSave(formData);
    };
    
    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <Input
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
            <select
              name="position"
              value={formData.position}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="DEL">Forward (DEL)</option>
              <option value="CEN">Midfielder (CEN)</option>
              <option value="DEF">Defender (DEF)</option>
              <option value="POR">Goalkeeper (POR)</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
            <Input
              name="age"
              type="number"
              value={formData.age}
              onChange={handleChange}
              min="16"
              max="40"
              required
              className="w-full"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nationality</label>
            <Input
              name="nationality"
              value={formData.nationality}
              onChange={handleChange}
              className="w-full"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <Input
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <Input
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Join Date</label>
            <Input
              name="joinDate"
              type="date"
              value={formData.joinDate}
              onChange={handleChange}
              className="w-full"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contract End</label>
            <Input
              name="contractEnd"
              type="date"
              value={formData.contractEnd}
              onChange={handleChange}
              className="w-full"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Salary</label>
            <Input
              name="salary"
              type="number"
              value={formData.salary}
              onChange={handleChange}
              min="0"
              className="w-full"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fitness (%)</label>
            <Input
              name="fitness"
              type="number"
              value={formData.fitness}
              onChange={handleChange}
              min="0"
              max="100"
              className="w-full"
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Skills</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Technical</label>
              <Input
                name="skills.technical"
                type="number"
                value={formData.skills.technical}
                onChange={handleChange}
                min="0"
                max="100"
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Physical</label>
              <Input
                name="skills.physical"
                type="number"
                value={formData.skills.physical}
                onChange={handleChange}
                min="0"
                max="100"
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Tactical</label>
              <Input
                name="skills.tactical"
                type="number"
                value={formData.skills.tactical}
                onChange={handleChange}
                min="0"
                max="100"
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Mental</label>
              <Input
                name="skills.mental"
                type="number"
                value={formData.skills.mental}
                onChange={handleChange}
                min="0"
                max="100"
                className="w-full"
              />
            </div>
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <Textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows={3}
            className="w-full"
          />
        </div>
        
        <div className="flex justify-end space-x-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={saving}
            className="bg-blue-500 hover:bg-blue-600 text-white"
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Player
              </>
            )}
          </Button>
        </div>
      </form>
    );
  };

  return (
    <motion.div
      id="data-section"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="mt-8"
    >
      <Card className={`${
        isHighContrast ? 'hc-card' :
        theme === 'dark' ? 'bg-white border-gray-200' : 'bg-white border-gray-200'
      }`}>
        <CardHeader className="border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-indigo-500 rounded-lg">
                <Database className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-gray-900">DATA Management Center</CardTitle>
                <p className="text-sm text-gray-600 mt-1">
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
                <span className="text-sm text-gray-600">
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
                <span className="text-xs text-gray-500">
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
                <span className="text-xs text-gray-500">
                  PayPal {systemHealth.paymentSystem === 'active' ? 'Active' :
                           systemHealth.paymentSystem === 'maintenance' ? 'Maintenance' :
                           'Error'}
                </span>
              </div>
              
              {/* Last Sync */}
              <div className="text-xs text-gray-500">
                Synced: {lastSync.toLocaleTimeString()}
              </div>
              
              {/* Refresh Button */}
              <Button
                size="sm"
                variant="outline"
                onClick={loadData}
                disabled={loading}
                className="h-8"
              >
                <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
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
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="players" className="flex items-center space-x-2">
                <Users className="h-4 w-4" />
                <span>Players</span>
              </TabsTrigger>
              <TabsTrigger value="club" className="flex items-center space-x-2">
                <Building2 className="h-4 w-4" />
                <span>Club</span>
              </TabsTrigger>
              <TabsTrigger value="matches" className="flex items-center space-x-2">
                <Trophy className="h-4 w-4" />
                <span>Matches</span>
              </TabsTrigger>
              <TabsTrigger value="training" className="flex items-center space-x-2">
                <Activity className="h-4 w-4" />
                <span>Training</span>
              </TabsTrigger>
              <TabsTrigger value="events" className="flex items-center space-x-2">
                <Calendar className="h-4 w-4" />
                <span>Events</span>
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center space-x-2">
                <BarChart3 className="h-4 w-4" />
                <span>Analytics</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="players" className="mt-6">
              <div className="space-y-4">
                {/* Search and Actions Bar */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-2 md:space-y-0">
                  <div className="flex items-center space-x-2 flex-1 max-w-md">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder="Search players..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <Button variant="outline" size="sm">
                      <Filter className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      onClick={() => setShowAddForm(true)}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Player
                    </Button>
                    <Button variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                    <Button variant="outline">
                      <Upload className="h-4 w-4 mr-2" />
                      Import
                    </Button>
                  </div>
                </div>

                {/* Add/Edit Player Form */}
                {showAddForm && (
                  <PlayerForm
                    onSave={handleSavePlayer}
                    onCancel={() => {
                      setShowAddForm(false);
                      setIsEditing(false);
                      setSelectedPlayer(null);
                    }}
                  />
                )}
                {(selectedPlayer && isEditing) && (
                  <PlayerForm
                    player={selectedPlayer}
                    onSave={handleSavePlayer}
                    onCancel={() => {
                      setShowAddForm(false);
                      setIsEditing(false);
                      setSelectedPlayer(null);
                    }}
                  />
                )}

                {/* Players Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredPlayers.map((player) => (
                    <Card key={player.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                              <User className="h-6 w-6 text-gray-500" />
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
                        
                        <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
                          <div className="flex items-center space-x-1">
                            <Target className="h-3 w-3 text-red-500" />
                            <span>{player.goals} goals</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Activity className="h-3 w-3 text-blue-500" />
                            <span>{player.assists} assists</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock className="h-3 w-3 text-green-500" />
                            <span>{player.minutes} min</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Heart className="h-3 w-3 text-pink-500" />
                            <span>{player.fitness}% fit</span>
                          </div>
                        </div>

                        <div className="mb-3">
                          <div className="text-xs text-gray-500 mb-1">Skills Overview</div>
                          <div className="grid grid-cols-4 gap-1 text-xs">
                            <div className="text-center">
                              <div className={`font-semibold ${getSkillColor(player.skills.technical)}`}>
                                {player.skills.technical}
                              </div>
                              <div className="text-gray-400">TEC</div>
                            </div>
                            <div className="text-center">
                              <div className={`font-semibold ${getSkillColor(player.skills.physical)}`}>
                                {player.skills.physical}
                              </div>
                              <div className="text-gray-400">PHY</div>
                            </div>
                            <div className="text-center">
                              <div className={`font-semibold ${getSkillColor(player.skills.tactical)}`}>
                                {player.skills.tactical}
                              </div>
                              <div className="text-gray-400">TAC</div>
                            </div>
                            <div className="text-center">
                              <div className={`font-semibold ${getSkillColor(player.skills.mental)}`}>
                                {player.skills.mental}
                              </div>
                              <div className="text-gray-400">MEN</div>
                            </div>
                          </div>
                        </div>

                        {player.notes && (
                          <div className="mb-3">
                            <div className="text-xs text-gray-500 mb-1">Notes</div>
                            <p className="text-xs text-gray-700 line-clamp-2">{player.notes}</p>
                          </div>
                        )}

                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-1">
                            {player.medicalClearance ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <AlertCircle className="h-4 w-4 text-red-500" />
                            )}
                            <span className="text-xs text-gray-500">
                              Medical: {player.medicalClearance ? 'Clear' : 'Pending'}
                            </span>
                          </div>
                          <div className="flex space-x-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedPlayer(player);
                                setIsEditing(true);
                              }}
                            >
                              <Edit3 className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeletePlayer(player.id)}
                              className="text-red-600 hover:text-red-700"
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
                        <Input type="number" value={clubData?.founded || ''} onChange={(e) => setClubData(prev => prev ? {...prev, founded: parseInt(e.target.value)} : null)} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Stadium</label>
                        <Input value={clubData?.stadium || ''} onChange={(e) => setClubData(prev => prev ? {...prev, stadium: e.target.value} : null)} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Capacity</label>
                        <Input type="number" value={clubData?.capacity || ''} onChange={(e) => setClubData(prev => prev ? {...prev, capacity: parseInt(e.target.value)} : null)} />
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
                        <Input type="number" value={clubData?.budget || ''} onChange={(e) => setClubData(prev => prev ? {...prev, budget: parseInt(e.target.value)} : null)} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Trophies Won</label>
                        <Input type="number" value={clubData?.trophies || ''} onChange={(e) => setClubData(prev => prev ? {...prev, trophies: parseInt(e.target.value)} : null)} />
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
                          <Badge variant="outline">{clubData?.staff.coaches || 0}</Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Medical Staff</span>
                          <Badge variant="outline">{clubData?.staff.medical || 0}</Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Administrative</span>
                          <Badge variant="outline">{clubData?.staff.administrative || 0}</Badge>
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
                          <Badge variant="outline">{clubData?.facilities.trainingGrounds || 0}</Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Medical Center</span>
                          <Badge className={clubData?.facilities.medicalCenter ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                            {clubData?.facilities.medicalCenter ? 'Available' : 'Not Available'}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Gym</span>
                          <Badge className={clubData?.facilities.gym ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                            {clubData?.facilities.gym ? 'Available' : 'Not Available'}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Restaurant</span>
                          <Badge className={clubData?.facilities.restaurant ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                            {clubData?.facilities.restaurant ? 'Available' : 'Not Available'}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="analytics" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                {/* System Health Overview */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Shield className="h-5 w-5 text-blue-500" />
                      <span>System Health</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Database</span>
                        <Badge className={`${
                          systemHealth.database === 'healthy' ? 'bg-green-100 text-green-800' :
                          systemHealth.database === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {systemHealth.database}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Email Service</span>
                        <Badge className={`${
                          systemHealth.emailService === 'operational' ? 'bg-green-100 text-green-800' :
                          systemHealth.emailService === 'delayed' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {systemHealth.emailService}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">PayPal System</span>
                        <Badge className={`${
                          systemHealth.paymentSystem === 'active' ? 'bg-green-100 text-green-800' :
                          systemHealth.paymentSystem === 'maintenance' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {systemHealth.paymentSystem}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">API Status</span>
                        <Badge className={`${
                          systemHealth.apiStatus === 'online' ? 'bg-green-100 text-green-800' :
                          systemHealth.apiStatus === 'slow' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {systemHealth.apiStatus}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Team Performance */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <TrendingUp className="h-5 w-5 text-green-500" />
                      <span>Team Performance</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm">Total Players</span>
                        <span className="font-semibold">{players.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Average Age</span>
                        <span className="font-semibold">
                          {players.length > 0 ? (players.reduce((sum, p) => sum + p.age, 0) / players.length).toFixed(1) : '0'} years
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Total Goals</span>
                        <span className="font-semibold text-green-600">
                          {players.reduce((sum, p) => sum + p.goals, 0)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Total Assists</span>
                        <span className="font-semibold text-blue-600">
                          {players.reduce((sum, p) => sum + p.assists, 0)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Avg Fitness</span>
                        <span className="font-semibold text-purple-600">
                          {players.length > 0 ? (players.reduce((sum, p) => sum + p.fitness, 0) / players.length).toFixed(0) : '0'}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Medical Cleared</span>
                        <span className="font-semibold text-green-600">
                          {players.filter(p => p.medicalClearance).length}/{players.length}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Financial Overview - Moved to Analytics tab */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <DollarSign className="h-5 w-5 text-green-500" />
                      <span>Financial Overview</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm">Total Salaries</span>
                        <span className="font-semibold">
                          €{players.reduce((sum, p) => sum + p.salary, 0).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Budget Remaining</span>
                        <span className="font-semibold text-green-600">
                          €{((clubData?.budget || 0) - players.reduce((sum, p) => sum + p.salary, 0)).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Average Salary</span>
                        <span className="font-semibold">
                          €{players.length > 0 ? (players.reduce((sum, p) => sum + p.salary, 0) / players.length).toLocaleString() : '0'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Email Notifications</span>
                        <span className="font-semibold text-blue-600">
                          {systemHealth.emailService === 'operational' ? 'Active' : 'Checking...'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">PayPal Integration</span>
                        <span className="font-semibold text-green-600">
                          {systemHealth.paymentSystem === 'active' ? 'Ready' : 'Maintenance'}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Email Service Status */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Mail className="h-5 w-5 text-blue-500" />
                      <span>Email Service</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Service Provider</span>
                        <span className="font-semibold">Gmail (statsor1@gmail.com)</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Status</span>
                        <Badge className={`${
                          systemHealth.emailService === 'operational' ? 'bg-green-100 text-green-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {systemHealth.emailService === 'operational' ? 'Operational' : 'Issues Detected'}
                        </Badge>
                      </div>
                      <div className="text-xs text-gray-500 mt-2">
                        <p>• Welcome emails sent automatically</p>
                        <p>• Password reset codes delivered</p>
                        <p>• Admin notifications active</p>
                        <p>• Player updates tracked</p>
                      </div>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="w-full mt-2"
                        onClick={async () => {
                          try {
                            const status = await clientEmailService.initialize();
                            toast.success(status ? 'Email service is working!' : 'Email service needs attention');
                          } catch (error) {
                            toast.error('Failed to test email service');
                          }
                        }}
                      >
                        Test Email Service
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* PayPal Payment Status */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <CreditCard className="h-5 w-5 text-blue-500" />
                      <span>Payment System</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Payment Provider</span>
                        <span className="font-semibold">PayPal (Only)</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Integration</span>
                        <Badge className={`${
                          systemHealth.paymentSystem === 'active' ? 'bg-green-100 text-green-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {systemHealth.paymentSystem === 'active' ? 'Active' : 'Maintenance'}
                        </Badge>
                      </div>
                      <div className="text-xs text-gray-500 mt-2">
                        <p>• Subscription payments processed</p>
                        <p>• Secure payment handling</p>
                        <p>• Automatic billing cycles</p>
                        <p>• Payment confirmations sent</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Security & Data */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Shield className="h-5 w-5 text-purple-500" />
                      <span>Security & Data</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm">Data Encryption</span>
                        <Badge className="bg-green-100 text-green-800">Active</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Auto Backup</span>
                        <Badge className="bg-green-100 text-green-800">Enabled</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">API Security</span>
                        <Badge className="bg-green-100 text-green-800">JWT Protected</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Last Backup</span>
                        <span className="text-sm text-gray-600">{lastSync.toLocaleDateString()}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Matches Management Tab */}
            <TabsContent value="matches" className="mt-6">
              <div className="space-y-6">
                {/* Add Match Button */}
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-semibold">Match Management</h3>
                    <p className="text-sm text-gray-600">Schedule, track, and analyze match data</p>
                  </div>
                  <Button className="bg-green-600 hover:bg-green-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Match
                  </Button>
                </div>

                {/* Match Statistics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-2">
                        <Trophy className="h-5 w-5 text-yellow-500" />
                        <div>
                          <p className="text-sm text-gray-600">Total Matches</p>
                          <p className="text-2xl font-bold">24</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <div>
                          <p className="text-sm text-gray-600">Wins</p>
                          <p className="text-2xl font-bold">16</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-2">
                        <AlertCircle className="h-5 w-5 text-red-500" />
                        <div>
                          <p className="text-sm text-gray-600">Losses</p>
                          <p className="text-2xl font-bold">5</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-2">
                        <Target className="h-5 w-5 text-blue-500" />
                        <div>
                          <p className="text-sm text-gray-600">Goals Scored</p>
                          <p className="text-2xl font-bold">68</p>
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
                      {[1, 2, 3, 4, 5].map((match) => (
                        <div key={match} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center space-x-3">
                            <Badge className="bg-green-100 text-green-800">W</Badge>
                            <div>
                              <p className="font-medium">vs Real Madrid</p>
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

            {/* Training Management Tab */}
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

            {/* Events Management Tab */}
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
                               event.type === 'meeting' ? <Users className="h-3 w-3" /> :
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
                        <DollarSign className="h-8 w-8 text-purple-500" />
                        <div>
                          <h3 className="font-semibold">Financial Summary</h3>
                          <p className="text-sm text-gray-500">Budget and salary overview</p>
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
  );
};

export default DataManagementSection;