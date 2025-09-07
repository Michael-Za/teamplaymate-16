import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  Plus, 
  Search, 
  Filter, 
  Video, 
  FileText, 
  Star, 
  MessageCircle,
  Flag,
  ThumbsUp,
  ThumbsDown,
  Award,
  Target,
  Users,
  Clock,
  BookOpen,
  Zap,
  TrendingUp
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

interface SkillSwap {
  id: string;
  user_id: string;
  username: string;
  user_avatar?: string;
  user_reputation: number;
  offer_title: string;
  offer_description: string;
  request_title: string;
  request_description: string;
  skill_category: 'technical' | 'tactical' | 'physical' | 'mental';
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  media_urls: string[];
  tactic_board_data?: any;
  status: 'active' | 'matched' | 'completed';
  votes: {
    helpful: number;
    not_helpful: number;
  };
  created_at: string;
  expires_at?: string;
}

interface TacticBoard {
  id: string;
  title: string;
  description: string;
  board_data: any; // Tldraw data
  created_by: string;
  skill_category: string;
  votes: number;
  created_at: string;
}

export const SkillSwapMarketplace: React.FC = () => {
  const { user } = useAuth();
  const [skillSwaps, setSkillSwaps] = useState<SkillSwap[]>([]);
  const [tacticBoards, setTacticBoards] = useState<TacticBoard[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTacticModal, setShowTacticModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('browse');

  const [newSwap, setNewSwap] = useState({
    offer_title: '',
    offer_description: '',
    request_title: '',
    request_description: '',
    skill_category: 'technical' as const,
    difficulty_level: 'beginner' as const,
    media_files: [] as File[]
  });

  const skillCategories = [
    { value: 'technical', label: 'Technical Skills', icon: '⚽', color: 'bg-blue-100 text-blue-800' },
    { value: 'tactical', label: 'Tactical Knowledge', icon: '🧠', color: 'bg-purple-100 text-purple-800' },
    { value: 'physical', label: 'Physical Training', icon: '💪', color: 'bg-red-100 text-red-800' },
    { value: 'mental', label: 'Mental Game', icon: '🎯', color: 'bg-green-100 text-green-800' }
  ];

  const difficultyLevels = [
    { value: 'beginner', label: 'Beginner', color: 'bg-green-100 text-green-800' },
    { value: 'intermediate', label: 'Intermediate', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'advanced', label: 'Advanced', color: 'bg-red-100 text-red-800' }
  ];

  useEffect(() => {
    loadSkillSwaps();
    loadTacticBoards();
  }, []);

  const loadSkillSwaps = async () => {
    try {
      const { data, error } = await supabase
        .from('skill_swaps')
        .select(`
          *,
          users (
            name,
            picture,
            reputation_score
          )
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedSwaps = data?.map(swap => ({
        id: swap.id,
        user_id: swap.user_id,
        username: swap.users?.name || 'Anonymous',
        user_avatar: swap.users?.picture,
        user_reputation: swap.users?.reputation_score || 0,
        offer_title: swap.offer_title,
        offer_description: swap.offer_description,
        request_title: swap.request_title,
        request_description: swap.request_description,
        skill_category: swap.skill_category,
        difficulty_level: swap.difficulty_level,
        media_urls: swap.media_urls || [],
        tactic_board_data: swap.tactic_board_data,
        status: swap.status,
        votes: swap.votes || { helpful: 0, not_helpful: 0 },
        created_at: swap.created_at,
        expires_at: swap.expires_at
      })) || [];

      setSkillSwaps(formattedSwaps);
    } catch (error) {
      console.error('Error loading skill swaps:', error);
    }
  };

  const loadTacticBoards = async () => {
    try {
      const { data, error } = await supabase
        .from('tactic_boards')
        .select(`
          *,
          users (
            name
          )
        `)
        .order('votes', { ascending: false })
        .limit(20);

      if (error) throw error;

      const formattedBoards = data?.map(board => ({
        id: board.id,
        title: board.title,
        description: board.description,
        board_data: board.board_data,
        created_by: board.users?.name || 'Anonymous',
        skill_category: board.skill_category,
        votes: board.votes || 0,
        created_at: board.created_at
      })) || [];

      setTacticBoards(formattedBoards);
    } catch (error) {
      console.error('Error loading tactic boards:', error);
    }
  };

  const createSkillSwap = async () => {
    if (!user) {
      toast.error('Please sign in to create a skill swap');
      return;
    }

    try {
      // Upload media files to Cloudflare R2
      const mediaUrls = await Promise.all(
        newSwap.media_files.map(file => uploadToCloudflare(file))
      );

      const { data, error } = await supabase
        .from('skill_swaps')
        .insert({
          user_id: user.id,
          offer_title: newSwap.offer_title,
          offer_description: newSwap.offer_description,
          request_title: newSwap.request_title,
          request_description: newSwap.request_description,
          skill_category: newSwap.skill_category,
          difficulty_level: newSwap.difficulty_level,
          media_urls: mediaUrls,
          status: 'active',
          votes: { helpful: 0, not_helpful: 0 },
          created_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
        });

      if (error) throw error;

      toast.success('Skill swap created successfully!');
      setShowCreateModal(false);
      setNewSwap({
        offer_title: '',
        offer_description: '',
        request_title: '',
        request_description: '',
        skill_category: 'technical',
        difficulty_level: 'beginner',
        media_files: []
      });
      loadSkillSwaps();

      // Award reputation points for sharing
      await updateUserReputation(user.id, 1, 'skill_share');

    } catch (error) {
      console.error('Error creating skill swap:', error);
      toast.error('Failed to create skill swap');
    }
  };

  const uploadToCloudflare = async (file: File): Promise<string> => {
    // Mock Cloudflare R2 upload - implement actual upload in production
    await new Promise(resolve => setTimeout(resolve, 1000));
    return `https://cloudflare-r2.example.com/skills/${Date.now()}-${file.name}`;
  };

  const updateUserReputation = async (userId: string, points: number, reason: string) => {
    try {
      const { error } = await supabase.rpc('update_user_reputation', {
        user_id: userId,
        points_change: points,
        reason: reason
      });

      if (error) throw error;
    } catch (error) {
      console.error('Error updating reputation:', error);
    }
  };

  const voteOnSkillSwap = async (swapId: string, voteType: 'helpful' | 'not_helpful') => {
    try {
      const swap = skillSwaps.find(s => s.id === swapId);
      if (!swap) return;

      const updatedVotes = {
        ...swap.votes,
        [voteType]: swap.votes[voteType] + 1
      };

      const { error } = await supabase
        .from('skill_swaps')
        .update({ votes: updatedVotes })
        .eq('id', swapId);

      if (error) throw error;

      // Update local state
      setSkillSwaps(prev => prev.map(s => 
        s.id === swapId ? { ...s, votes: updatedVotes } : s
      ));

      // Award reputation points for helpful votes
      if (voteType === 'helpful') {
        await updateUserReputation(swap.user_id, 1, 'helpful_vote_received');
      }

    } catch (error) {
      console.error('Error voting on skill swap:', error);
    }
  };

  const filteredSkillSwaps = skillSwaps.filter(swap => {
    const matchesSearch = swap.offer_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         swap.request_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         swap.offer_description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || swap.skill_category === selectedCategory;
    const matchesDifficulty = selectedDifficulty === 'all' || swap.difficulty_level === selectedDifficulty;
    
    return matchesSearch && matchesCategory && matchesDifficulty;
  });

  const renderSkillSwapCard = (swap: SkillSwap) => (
    <motion.div
      key={swap.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg border shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="p-6">
        {/* User Info */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
              {swap.user_avatar ? (
                <img src={swap.user_avatar} alt="" className="w-10 h-10 rounded-full" />
              ) : (
                swap.username.charAt(0).toUpperCase()
              )}
            </div>
            <div>
              <div className="font-semibold">{swap.username}</div>
              <div className="flex items-center space-x-1 text-sm text-gray-500">
                <Star className="w-3 h-3 text-yellow-500" />
                <span>{swap.user_reputation} rep</span>
              </div>
            </div>
          </div>
          
          <div className="flex space-x-2">
            <Badge className={skillCategories.find(c => c.value === swap.skill_category)?.color}>
              {skillCategories.find(c => c.value === swap.skill_category)?.icon} {swap.skill_category}
            </Badge>
            <Badge className={difficultyLevels.find(d => d.value === swap.difficulty_level)?.color}>
              {swap.difficulty_level}
            </Badge>
          </div>
        </div>

        {/* Offer Section */}
        <div className="mb-4 p-4 bg-green-50 rounded-lg border-l-4 border-green-500">
          <div className="flex items-center space-x-2 mb-2">
            <Award className="w-4 h-4 text-green-600" />
            <h3 className="font-semibold text-green-800">Offering</h3>
          </div>
          <h4 className="font-medium mb-1">{swap.offer_title}</h4>
          <p className="text-sm text-gray-700">{swap.offer_description}</p>
        </div>

        {/* Request Section */}
        <div className="mb-4 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
          <div className="flex items-center space-x-2 mb-2">
            <Target className="w-4 h-4 text-blue-600" />
            <h3 className="font-semibold text-blue-800">Looking for</h3>
          </div>
          <h4 className="font-medium mb-1">{swap.request_title}</h4>
          <p className="text-sm text-gray-700">{swap.request_description}</p>
        </div>

        {/* Media */}
        {swap.media_urls.length > 0 && (
          <div className="mb-4">
            <div className="flex space-x-2 overflow-x-auto">
              {swap.media_urls.map((url, index) => (
                <div key={index} className="flex-shrink-0">
                  {url.includes('video') ? (
                    <video
                      src={url}
                      className="w-24 h-24 rounded object-cover cursor-pointer"
                      onClick={() => window.open(url, '_blank')}
                    />
                  ) : (
                    <img
                      src={url}
                      alt={`Media ${index + 1}`}
                      className="w-24 h-24 rounded object-cover cursor-pointer"
                      onClick={() => window.open(url, '_blank')}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => voteOnSkillSwap(swap.id, 'helpful')}
              className="flex items-center space-x-1 text-sm text-gray-500 hover:text-green-600"
            >
              <ThumbsUp className="w-4 h-4" />
              <span>{swap.votes.helpful}</span>
            </button>
            
            <button
              onClick={() => voteOnSkillSwap(swap.id, 'not_helpful')}
              className="flex items-center space-x-1 text-sm text-gray-500 hover:text-red-600"
            >
              <ThumbsDown className="w-4 h-4" />
              <span>{swap.votes.not_helpful}</span>
            </button>
            
            <button className="flex items-center space-x-1 text-sm text-gray-500 hover:text-blue-600">
              <MessageCircle className="w-4 h-4" />
              <span>Contact</span>
            </button>
          </div>
          
          <div className="text-xs text-gray-500">
            {new Date(swap.created_at).toLocaleDateString()}
          </div>
        </div>
      </div>
    </motion.div>
  );

  const renderCreateForm = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* What you're offering */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-green-800 flex items-center">
            <Award className="w-5 h-5 mr-2" />
            What are you offering?
          </h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Skill Title
            </label>
            <Input
              value={newSwap.offer_title}
              onChange={(e) => setNewSwap(prev => ({ ...prev, offer_title: e.target.value }))}
              placeholder="e.g., Free kick techniques"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <Textarea
              value={newSwap.offer_description}
              onChange={(e) => setNewSwap(prev => ({ ...prev, offer_description: e.target.value }))}
              placeholder="Describe what you can teach and your experience..."
              rows={4}
            />
          </div>
        </div>

        {/* What you're looking for */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-blue-800 flex items-center">
            <Target className="w-5 h-5 mr-2" />
            What are you looking for?
          </h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Skill Wanted
            </label>
            <Input
              value={newSwap.request_title}
              onChange={(e) => setNewSwap(prev => ({ ...prev, request_title: e.target.value }))}
              placeholder="e.g., Defensive positioning"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <Textarea
              value={newSwap.request_description}
              onChange={(e) => setNewSwap(prev => ({ ...prev, request_description: e.target.value }))}
              placeholder="Describe what you want to learn..."
              rows={4}
            />
          </div>
        </div>
      </div>

      {/* Category and Difficulty */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Category
          </label>
          <select
            value={newSwap.skill_category}
            onChange={(e) => setNewSwap(prev => ({ ...prev, skill_category: e.target.value as any }))}
            className="w-full h-10 px-3 border border-gray-300 rounded-md"
          >
            {skillCategories.map(category => (
              <option key={category.value} value={category.value}>
                {category.icon} {category.label}
              </option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Difficulty Level
          </label>
          <select
            value={newSwap.difficulty_level}
            onChange={(e) => setNewSwap(prev => ({ ...prev, difficulty_level: e.target.value as any }))}
            className="w-full h-10 px-3 border border-gray-300 rounded-md"
          >
            {difficultyLevels.map(level => (
              <option key={level.value} value={level.value}>
                {level.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Media Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Supporting Media (Optional)
        </label>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
          <div className="text-center">
            <Video className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600">
              Upload videos or images to demonstrate your skills
            </p>
            <Button
              onClick={() => document.getElementById('media-upload')?.click()}
              variant="outline"
              className="mt-2"
            >
              Choose Files
            </Button>
            <input
              id="media-upload"
              type="file"
              multiple
              accept="image/*,video/*"
              onChange={(e) => {
                const files = Array.from(e.target.files || []);
                setNewSwap(prev => ({ ...prev, media_files: files }));
              }}
              className="hidden"
            />
          </div>
          
          {newSwap.media_files.length > 0 && (
            <div className="mt-4">
              <p className="text-sm text-gray-600 mb-2">
                Selected files: {newSwap.media_files.length}
              </p>
              <div className="flex flex-wrap gap-2">
                {newSwap.media_files.map((file, index) => (
                  <Badge key={index} variant="outline">
                    {file.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end space-x-4">
        <Button
          onClick={() => setShowCreateModal(false)}
          variant="outline"
        >
          Cancel
        </Button>
        
        <Button
          onClick={createSkillSwap}
          disabled={!newSwap.offer_title || !newSwap.request_title}
          className="bg-green-600 hover:bg-green-700"
        >
          Create Skill Swap
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Skill Swap Marketplace</h1>
          <p className="text-gray-600">Trade football skills and knowledge with the community</p>
        </div>
        
        <Button
          onClick={() => setShowCreateModal(true)}
          className="bg-green-600 hover:bg-green-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Skill Swap
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="browse">Browse Swaps</TabsTrigger>
          <TabsTrigger value="tactics">Tactic Boards</TabsTrigger>
          <TabsTrigger value="my-swaps">My Swaps</TabsTrigger>
        </TabsList>

        <TabsContent value="browse" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search skills..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="h-10 px-3 border border-gray-300 rounded-md"
                >
                  <option value="all">All Categories</option>
                  {skillCategories.map(category => (
                    <option key={category.value} value={category.value}>
                      {category.icon} {category.label}
                    </option>
                  ))}
                </select>
                
                <select
                  value={selectedDifficulty}
                  onChange={(e) => setSelectedDifficulty(e.target.value)}
                  className="h-10 px-3 border border-gray-300 rounded-md"
                >
                  <option value="all">All Levels</option>
                  {difficultyLevels.map(level => (
                    <option key={level.value} value={level.value}>
                      {level.label}
                    </option>
                  ))}
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Skill Swaps Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredSkillSwaps.map(renderSkillSwapCard)}
          </div>
        </TabsContent>

        <TabsContent value="tactics" className="space-y-6">
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">Tactic Boards</h3>
            <p className="text-gray-500 mb-4">
              Interactive tactical diagrams created by the community
            </p>
            <Button
              onClick={() => setShowTacticModal(true)}
              className="bg-purple-600 hover:bg-purple-700"
            >
              Create Tactic Board
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="my-swaps" className="space-y-6">
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">Your Skill Swaps</h3>
            <p className="text-gray-500 mb-4">
              Manage your active skill exchanges
            </p>
            <Button
              onClick={() => setShowCreateModal(true)}
              className="bg-green-600 hover:bg-green-700"
            >
              Create Your First Swap
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      {/* Create Skill Swap Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Skill Swap</DialogTitle>
          </DialogHeader>
          {renderCreateForm()}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SkillSwapMarketplace;