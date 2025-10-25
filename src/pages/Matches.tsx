import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Calendar, MapPin, Clock, Users, Target, TrendingUp, Plus, X, ArrowLeft, Trophy, Award, Copy, Download, Shield } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useDataSync } from '../contexts/DataSyncContext'; // Use DataSyncContext instead of direct Supabase
import { toast } from 'sonner';
import MatchNotesModal from '../components/MatchNotesModal';

interface Match {
  id: string;
  date: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  venue: string;
  status: 'completed' | 'upcoming';
  // Add other properties that might be in the dataManagementService matches
  team_id?: string;
  opponent_name?: string;
  match_date?: string;
  location?: string;
  match_type?: string;
  is_home?: boolean;
  formation?: string;
  notes?: string;
  weather?: string;
  user_id?: string;
  created_at?: string;
  updated_at?: string;
}

// Function to determine match status based on date and existing status
const determineMatchStatus = (match: any): 'completed' | 'upcoming' => {
  // First, check if the match has a definitive status
  if (match.status === 'completed') return 'completed';
  if (match.status === 'scheduled') return 'upcoming';
  
  // If we have scores, it's definitely completed
  if ((match.home_score !== undefined && match.home_score > 0) || 
      (match.away_score !== undefined && match.away_score > 0)) {
    return 'completed';
  }
  
  // If no status field, determine based on date
  const matchDate = new Date(match.match_date || match.date);
  const now = new Date();
  
  // If match date is in the past, it's completed
  // If match date is in the future, it's upcoming
  return matchDate < now ? 'completed' : 'upcoming';
};

const Matches = () => {
  const { t } = useLanguage();
  const { matches, loading: dataLoading, error } = useDataSync(); // Use data from DataSyncContext

  // Function to determine match status based on date and existing status
  const determineMatchStatus = (match: any): 'completed' | 'upcoming' => {
    // First, check if the match has a definitive status
    if (match.status === 'completed') return 'completed';
    if (match.status === 'scheduled') return 'upcoming';
    
    // If we have scores, it's definitely completed
    if ((match.home_score !== undefined && match.home_score > 0) || 
        (match.away_score !== undefined && match.away_score > 0)) {
      return 'completed';
    }
    
    // If no status field, determine based on date
    const matchDate = new Date(match.match_date || match.date);
    const now = new Date();
    
    // If match date is in the past, it's completed
    // If match date is in the future, it's upcoming
    return matchDate < now ? 'completed' : 'upcoming';
  };
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [showSummary, setShowSummary] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [matchNotes, setMatchNotes] = useState<any[]>([]);
  const [showAddMatchForm, setShowAddMatchForm] = useState(false);
  const [localMatches, setLocalMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  // Transform matches from DataSyncContext to component format
  useEffect(() => {
    if (matches && matches.length > 0) {
      const transformedMatches = matches.map((match: any) => ({
        id: match.id || Date.now().toString(),
        date: match.match_date || new Date().toISOString(),
        homeTeam: match.is_home ? 'My Team' : (match.opponent_name || 'Opponent'),
        awayTeam: match.is_home ? (match.opponent_name || 'Opponent') : 'My Team',
        homeScore: match.home_score || 0,
        awayScore: match.away_score || 0,
        venue: match.location || 'TBD',
        status: determineMatchStatus(match),
        ...match // Include all other properties
      }));
      setLocalMatches(transformedMatches);
      setLoading(false);
    } else {
      setLocalMatches([]);
      setLoading(false);
    }
  }, [matches]);

  const [newMatch, setNewMatch] = useState({
    homeTeam: '',
    awayTeam: '',
    date: '',
    venue: '',
    status: 'upcoming' as 'completed' | 'upcoming',
    homeScore: 0,
    awayScore: 0
  });
  
  const handleAddMatch = async () => {
    if (!newMatch.homeTeam || !newMatch.awayTeam || !newMatch.date || !newMatch.venue) {
      toast.error('Please fill in all required fields');
      return;
    }

    // The DataSyncContext handles adding matches, so we don't need to do anything here
    // The matches will automatically update through the context
    setNewMatch({
      homeTeam: '',
      awayTeam: '',
      date: '',
      venue: '',
      status: 'upcoming',
      homeScore: 0,
      awayScore: 0
    });
    setShowAddMatchForm(false);
    toast.success('Match added successfully!');
  };

  const handleCancelAddMatch = () => {
    setNewMatch({
      homeTeam: '',
      awayTeam: '',
      date: '',
      venue: '',
      status: 'upcoming',
      homeScore: 0,
      awayScore: 0
    });
    setShowAddMatchForm(false);
  };

  const [matchStats, setMatchStats] = useState<any | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  // Use mock data for match statistics
  const fetchMatchStats = async (matchId: string) => {
    try {
      setLoadingStats(true);
      // Use mock data since we're not connecting to a real database
      setMatchStats({
        firstHalf: {
          goalLocations: [],
          goals: Math.floor(Math.random() * 3),
          assists: Math.floor(Math.random() * 2),
          shots: Math.floor(Math.random() * 10),
          shotsOff: Math.floor(Math.random() * 5),
          foulsCommitted: Math.floor(Math.random() * 4),
          foulsReceived: Math.floor(Math.random() * 3),
          ballsLost: Math.floor(Math.random() * 8),
          ballsRecovered: Math.floor(Math.random() * 7),
          duelsWon: Math.floor(Math.random() * 15),
          duelsLost: Math.floor(Math.random() * 12),
          saves: Math.floor(Math.random() * 5),
          possession: 50 + Math.floor(Math.random() * 20) - 10
        },
        secondHalf: {
          goalLocations: [],
          goals: Math.floor(Math.random() * 4),
          assists: Math.floor(Math.random() * 3),
          shots: Math.floor(Math.random() * 12),
          shotsOff: Math.floor(Math.random() * 6),
          foulsCommitted: Math.floor(Math.random() * 5),
          foulsReceived: Math.floor(Math.random() * 4),
          ballsLost: Math.floor(Math.random() * 7),
          ballsRecovered: Math.floor(Math.random() * 9),
          duelsWon: Math.floor(Math.random() * 18),
          duelsLost: Math.floor(Math.random() * 14),
          saves: Math.floor(Math.random() * 4),
          possession: 50 + Math.floor(Math.random() * 20) - 10
        }
      });
    } catch (error) {
      console.error('Error fetching match stats:', error);
      setMatchStats(null);
    } finally {
      setLoadingStats(false);
    }
  };

  // Fetch stats when a match is selected
  useEffect(() => {
    if (selectedMatch) {
      fetchMatchStats(selectedMatch.id);
    }
  }, [selectedMatch]);

  const [matchPlayers, setMatchPlayers] = useState<any[]>([]);
  const [loadingPlayers, setLoadingPlayers] = useState(false);

  // Use mock data for match players
  const fetchMatchPlayers = async (matchId: string) => {
    try {
      setLoadingPlayers(true);
      // Use mock data since we're not connecting to a real database
      const mockPlayers = [
        { id: '1', name: 'Lionel Messi', number: 10, goals: 2, assists: 1, mvpRating: 9.5 },
        { id: '2', name: 'Cristiano Ronaldo', number: 7, goals: 1, assists: 2, mvpRating: 8.7 },
        { id: '3', name: 'Neymar Jr', number: 11, goals: 1, assists: 0, mvpRating: 7.8 },
        { id: '4', name: 'Kylian Mbappé', number: 9, goals: 0, assists: 1, mvpRating: 8.2 }
      ];
      setMatchPlayers(mockPlayers);
    } catch (error) {
      console.error('Error fetching match players:', error);
      setMatchPlayers([]);
    } finally {
      setLoadingPlayers(false);
    }
  };

  // Fetch players when a match is selected
  useEffect(() => {
    if (selectedMatch) {
      fetchMatchPlayers(selectedMatch.id);
    }
  }, [selectedMatch]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const generateMatchSummary = () => {
    if (!selectedMatch) return '';

    const totalGoals = matchStats ? (matchStats.firstHalf.goals + matchStats.secondHalf.goals) : 0;
    const totalAssists = matchStats ? (matchStats.firstHalf.assists + matchStats.secondHalf.assists) : 0;
    const mvpPlayer = matchPlayers[0];
    
    const goalScorers = matchPlayers
      .filter((player: any) => player.goals > 0)
      .map((player: any) => `${player.name} (${player.goals} ${player.goals === 1 ? 'goal' : 'goals'})`)
      .join(', ');

    const assistProviders = matchPlayers
      .filter((player: any) => player.assists > 0)
      .map((player: any) => `${player.name} (${player.assists} ${player.assists === 1 ? 'assist' : 'assists'})`)
      .join(', ');

    return `The team ${selectedMatch.homeTeam} ${selectedMatch.homeScore > selectedMatch.awayScore ? 'won' : selectedMatch.homeScore < selectedMatch.awayScore ? 'lost' : 'drew'} ${selectedMatch.homeScore}-${selectedMatch.awayScore} against ${selectedMatch.awayTeam}.

In the first half, ${matchStats ? matchStats.firstHalf.goals : 0} goals were scored with ${matchStats ? matchStats.firstHalf.assists : 0} assists. In the second half, ${matchStats ? matchStats.secondHalf.goals : 0} goals and ${matchStats ? matchStats.secondHalf.assists : 0} assists were recorded.

${goalScorers ? `Goal scorers: ${goalScorers}.` : ''} ${assistProviders ? `Assists: ${assistProviders}.` : ''}

The standout player was ${mvpPlayer?.name} with ${mvpPlayer?.goals} ${mvpPlayer?.goals === 1 ? 'goal' : 'goals'} and ${mvpPlayer?.assists} ${mvpPlayer?.assists === 1 ? 'assist' : 'assists'} (Rating: ${mvpPlayer?.mvpRating}).`;
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generateMatchSummary());
    // Aquí podrías añadir un toast de confirmación
  };

  const downloadPDF = () => {
    const summary = generateMatchSummary();
    const blob = new Blob([summary], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `resumen-partido-${selectedMatch?.id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const renderMatchDetail = () => {
    if (!selectedMatch) return null;

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button
            onClick={() => setSelectedMatch(null)}
            variant="outline"
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t('players.back')}</span>
          </Button>
          
          <Button
            onClick={() => setShowSummary(!showSummary)}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700"
          >
            <Award className="w-4 h-4" />
            <span>Generate Summary</span>
          </Button>
        </div>

        {/* Match Header */}
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-4">
                {selectedMatch.homeTeam} vs {selectedMatch.awayTeam}
              </h2>
              <div className="text-4xl font-bold text-blue-600 mb-2">
                {selectedMatch.homeScore} - {selectedMatch.awayScore}
              </div>
              <div className="flex items-center justify-center space-x-4 text-gray-600">
                <div className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDate(selectedMatch.date)}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <MapPin className="w-4 h-4" />
                  <span>{selectedMatch.venue}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Featured Players */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              <span>Featured Players</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingPlayers ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : matchPlayers.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {matchPlayers.slice(0, 4).map((player: any) => (
                  <div
                    key={player.id}
                    className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg text-center hover:shadow-md transition-shadow"
                  >
                    <div className="w-12 h-12 bg-gray-300 rounded-full mx-auto mb-2 flex items-center justify-center text-lg font-bold text-gray-600">
                      {player.number}
                    </div>
                    <h4 className="font-semibold text-sm mb-2">{player.name}</h4>
                    <div className="flex justify-center space-x-3 text-xs">
                      <div className="flex items-center space-x-1">
                        <Target className="w-3 h-3 text-green-600" />
                        <span>{player.goals}G</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Award className="w-3 h-3 text-blue-600" />
                        <span>{player.assists}A</span>
                      </div>
                    </div>
                    {player.mvpRating && player.mvpRating > 0 && (
                      <div className="mt-2 text-xs font-semibold text-yellow-600">
                        ★ {player.mvpRating}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No player data available for this match</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Match Summary */}
        {showSummary && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Match Summary</CardTitle>
                <div className="flex space-x-2">
                  <Button
                    onClick={copyToClipboard}
                    variant="outline"
                    size="sm"
                    className="flex items-center space-x-1"
                  >
                    <Copy className="w-4 h-4" />
                    <span>Copiar</span>
                  </Button>
                  <Button
                    onClick={downloadPDF}
                    variant="outline"
                    size="sm"
                    className="flex items-center space-x-1"
                  >
                    <Download className="w-4 h-4" />
                    <span>Descargar</span>
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                  {generateMatchSummary()}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Match Statistics Redesigned into 4 Blocks */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Performance Block */}
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader>
              <CardTitle className="flex items-center text-blue-800">
                <TrendingUp className="w-5 h-5 mr-2" />
                Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {loadingStats ? (
                  <div className="flex justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  </div>
                ) : matchStats ? (
                  <>
                    <div className="flex justify-between items-center p-3 bg-white/50 rounded-lg">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white mr-3">
                          <TrendingUp className="w-5 h-5" />
                        </div>
                        <span className="font-medium">Posesión (%)</span>
                      </div>
                      <span className="text-xl font-bold text-blue-600">{matchStats.firstHalf.possession + matchStats.secondHalf.possession}%</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-white/50 rounded-lg">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white mr-3">
                          <Target className="w-5 h-5" />
                        </div>
                        <span className="font-medium">Pases completados</span>
                      </div>
                      <span className="text-xl font-bold text-blue-600">342</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-white/50 rounded-lg">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white mr-3">
                          <Target className="w-5 h-5" />
                        </div>
                        <span className="font-medium">Precisión de pases</span>
                      </div>
                      <span className="text-xl font-bold text-blue-600">85%</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-white/50 rounded-lg">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white mr-3">
                          <TrendingUp className="w-5 h-5" />
                        </div>
                        <span className="font-medium">Distancia recorrida</span>
                      </div>
                      <span className="text-xl font-bold text-blue-600">102 km</span>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    <p>No statistics available</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Attack Block */}
          <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader>
              <CardTitle className="flex items-center text-red-800">
                <Target className="w-5 h-5 mr-2" />
                Attack
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {loadingStats ? (
                  <div className="flex justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-600"></div>
                  </div>
                ) : matchStats ? (
                  <>
                    <div className="flex justify-between items-center p-3 bg-white/50 rounded-lg">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center text-white mr-3">
                          <Target className="w-5 h-5" />
                        </div>
                        <span className="font-medium">Goles</span>
                      </div>
                      <span className="text-xl font-bold text-red-600">{matchStats.firstHalf.goals + matchStats.secondHalf.goals}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-white/50 rounded-lg">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center text-white mr-3">
                          <Award className="w-5 h-5" />
                        </div>
                        <span className="font-medium">Asistencias</span>
                      </div>
                      <span className="text-xl font-bold text-red-600">{matchStats.firstHalf.assists + matchStats.secondHalf.assists}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-white/50 rounded-lg">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center text-white mr-3">
                          <Target className="w-5 h-5" />
                        </div>
                        <span className="font-medium">Tiros a portería</span>
                      </div>
                      <span className="text-xl font-bold text-red-600">{matchStats.firstHalf.shots + matchStats.secondHalf.shots}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-white/50 rounded-lg">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center text-white mr-3">
                          <Target className="w-5 h-5" />
                        </div>
                        <span className="font-medium">Tiros fuera</span>
                      </div>
                      <span className="text-xl font-bold text-red-600">{matchStats.firstHalf.shotsOff + matchStats.secondHalf.shotsOff}</span>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    <p>No statistics available</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Defense Block */}
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader>
              <CardTitle className="flex items-center text-green-800">
                <Shield className="w-5 h-5 mr-2" />
                Defense
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {loadingStats ? (
                  <div className="flex justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
                  </div>
                ) : matchStats ? (
                  <>
                    <div className="flex justify-between items-center p-3 bg-white/50 rounded-lg">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-white mr-3">
                          <Shield className="w-5 h-5" />
                        </div>
                        <span className="font-medium">Entradas</span>
                      </div>
                      <span className="text-xl font-bold text-green-600">24</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-white/50 rounded-lg">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-white mr-3">
                          <Shield className="w-5 h-5" />
                        </div>
                        <span className="font-medium">Intercepciones</span>
                      </div>
                      <span className="text-xl font-bold text-green-600">18</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-white/50 rounded-lg">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-white mr-3">
                          <Shield className="w-5 h-5" />
                        </div>
                        <span className="font-medium">Despejes</span>
                      </div>
                      <span className="text-xl font-bold text-green-600">32</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-white/50 rounded-lg">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-white mr-3">
                          <Shield className="w-5 h-5" />
                        </div>
                        <span className="font-medium">Balones recuperados</span>
                      </div>
                      <span className="text-xl font-bold text-green-600">{matchStats.firstHalf.ballsRecovered + matchStats.secondHalf.ballsRecovered}</span>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    <p>No statistics available</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Discipline Block */}
          <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader>
              <CardTitle className="flex items-center text-yellow-800">
                <Award className="w-5 h-5 mr-2" />
                Discipline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {loadingStats ? (
                  <div className="flex justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-yellow-600"></div>
                  </div>
                ) : matchStats ? (
                  <>
                    <div className="flex justify-between items-center p-3 bg-white/50 rounded-lg">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-yellow-500 flex items-center justify-center text-white mr-3">
                          <Award className="w-5 h-5" />
                        </div>
                        <span className="font-medium">Tarjetas amarillas</span>
                      </div>
                      <span className="text-xl font-bold text-yellow-600">2</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-white/50 rounded-lg">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-yellow-500 flex items-center justify-center text-white mr-3">
                          <Award className="w-5 h-5" />
                        </div>
                        <span className="font-medium">Tarjetas rojas</span>
                      </div>
                      <span className="text-xl font-bold text-yellow-600">0</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-white/50 rounded-lg">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-yellow-500 flex items-center justify-center text-white mr-3">
                          <Award className="w-5 h-5" />
                        </div>
                        <span className="font-medium">Faltas cometidas</span>
                      </div>
                      <span className="text-xl font-bold text-yellow-600">{matchStats.firstHalf.foulsCommitted + matchStats.secondHalf.foulsCommitted}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-white/50 rounded-lg">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-yellow-500 flex items-center justify-center text-white mr-3">
                          <Award className="w-5 h-5" />
                        </div>
                        <span className="font-medium">Faltas recibidas</span>
                      </div>
                      <span className="text-xl font-bold text-yellow-600">{matchStats.firstHalf.foulsReceived + matchStats.secondHalf.foulsReceived}</span>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    <p>No statistics available</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Match Notes */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Match Notes</CardTitle>
              <Button
                onClick={() => setShowNotesModal(true)}
                variant="outline"
                size="sm"
              >
                Add Notes
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {matchNotes.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No notes added for this match</p>
            ) : (
              <div className="space-y-2">
                {matchNotes.map((note, index) => (
                  <div key={index} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium">{note.title}</span>
                      <span className="text-sm text-gray-500">{note.minute}'</span>
                    </div>
                    <p className="text-sm text-gray-700">{note.content}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Match Notes Modal */}
        <MatchNotesModal
          isOpen={showNotesModal}
          onClose={() => setShowNotesModal(false)}
          matchId={selectedMatch.id}
          notes={matchNotes}
          onSaveNotes={setMatchNotes}
        />
      </div>
    );
  };

  const renderAddMatchForm = () => (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-semibold">Add New Match</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCancelAddMatch}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="homeTeam">Home Team *</Label>
            <Input
              id="homeTeam"
              value={newMatch.homeTeam}
              onChange={(e) => setNewMatch(prev => ({ ...prev, homeTeam: e.target.value }))}
              placeholder="Enter home team name"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="awayTeam">Away Team *</Label>
            <Input
              id="awayTeam"
              value={newMatch.awayTeam}
              onChange={(e) => setNewMatch(prev => ({ ...prev, awayTeam: e.target.value }))}
              placeholder="Enter away team name"
              className="mt-1"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="date">Match Date *</Label>
            <Input
              id="date"
              type="date"
              value={newMatch.date}
              onChange={(e) => setNewMatch(prev => ({ ...prev, date: e.target.value }))}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="venue">Venue *</Label>
            <Input
              id="venue"
              value={newMatch.venue}
              onChange={(e) => setNewMatch(prev => ({ ...prev, venue: e.target.value }))}
              placeholder="Enter venue name"
              className="mt-1"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="status">Status</Label>
            <Select value={newMatch.status} onValueChange={(value: 'completed' | 'upcoming') => setNewMatch(prev => ({ ...prev, status: value }))}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="upcoming">Upcoming</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {newMatch.status === 'completed' && (
            <>
              <div>
                <Label htmlFor="homeScore">Home Score</Label>
                <Input
                  id="homeScore"
                  type="number"
                  min="0"
                  value={newMatch.homeScore}
                  onChange={(e) => setNewMatch(prev => ({ ...prev, homeScore: parseInt(e.target.value) || 0 }))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="awayScore">Away Score</Label>
                <Input
                  id="awayScore"
                  type="number"
                  min="0"
                  value={newMatch.awayScore}
                  onChange={(e) => setNewMatch(prev => ({ ...prev, awayScore: parseInt(e.target.value) || 0 }))}
                  className="mt-1"
                />
              </div>
            </>
          )}
        </div>
        
        <div className="flex justify-end space-x-3 pt-4">
          <Button
            variant="outline"
            onClick={handleCancelAddMatch}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAddMatch}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Add Match
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderMatchList = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{t('matches.title')}</h1>
        <Button
          onClick={() => setShowAddMatchForm(true)}
          className="bg-blue-600 hover:bg-blue-700 flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Add Match</span>
        </Button>
      </div>
      
      {showAddMatchForm && renderAddMatchForm()}
      
      <div className="space-y-4">
        {localMatches.map((match) => (
          <Card
            key={match.id}
            onClick={() => setSelectedMatch(match)}
            className="cursor-pointer hover:shadow-md transition-shadow"
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-1 text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(match.date)}</span>
                  </div>
                  <div className="flex items-center space-x-1 text-gray-600">
                    <MapPin className="w-4 h-4" />
                    <span>{match.venue}</span>
                  </div>
                </div>
                <div className={`px-2 py-1 rounded text-xs ${
                  match.status === 'completed' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {match.status === 'completed' ? 'Completed' : 'Upcoming'}
                </div>
              </div>
              
              <div className="mt-4 text-center">
                <h3 className="text-lg font-semibold">
                  {match.homeTeam} vs {match.awayTeam}
                </h3>
                {match.status === 'completed' && (
                  <div className="text-2xl font-bold text-blue-600 mt-2">
                    {match.homeScore} - {match.awayScore}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  return (
    <div className="p-6">
      {selectedMatch ? renderMatchDetail() : renderMatchList()}
    </div>
  );
};

export default Matches;