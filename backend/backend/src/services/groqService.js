import Groq from 'groq-sdk';

class GroqService {
  constructor() {
    this.groq = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });
  }

  async generateChatResponse(message, context = {}) {
    try {
      const chatCompletion = await this.groq.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'You are a helpful football team management assistant. Provide concise and useful responses to help coaches and players manage their teams effectively.',
          },
          {
            role: 'user',
            content: message,
          },
        ],
        model: 'llama3-groq-70b-8192-tool-use-preview',
        temperature: 0.7,
        max_tokens: 1024,
      });

      return chatCompletion.choices[0]?.message?.content || 'No response generated.';
    } catch (error) {
      console.error('Error generating chat response:', error);
      throw error;
    }
  }

  async analyzeTeam(teamData) {
    try {
      const prompt = `
        Analyze the following team data and provide insights:
        
        Team Name: ${teamData.name}
        Sport: ${teamData.sport}
        Players: ${teamData.players?.length || 0}
        Recent Matches: ${teamData.recentMatches?.length || 0}
        
        Please provide:
        1. Overall team performance assessment
        2. Strengths and weaknesses
        3. Recommendations for improvement
        4. Player development suggestions
      `;

      const chatCompletion = await this.groq.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'You are a sports analyst specializing in team performance analysis. Provide detailed, actionable insights.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        model: 'llama3-groq-70b-8192-tool-use-preview',
        temperature: 0.5,
        max_tokens: 2048,
      });

      return chatCompletion.choices[0]?.message?.content || 'No analysis generated.';
    } catch (error) {
      console.error('Error analyzing team:', error);
      throw error;
    }
  }

  async predictMatch(matchData) {
    try {
      const prompt = `
        Based on the following match data, predict the outcome:
        
        Home Team: ${matchData.homeTeam}
        Away Team: ${matchData.awayTeam}
        Home Team Stats: ${JSON.stringify(matchData.homeStats)}
        Away Team Stats: ${JSON.stringify(matchData.awayStats)}
        Recent Form: ${matchData.recentForm}
        
        Please provide:
        1. Match prediction (win/draw/lose probabilities)
        2. Expected scoreline
        3. Key factors influencing the result
        4. Recommended strategies
      `;

      const chatCompletion = await this.groq.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'You are a sports predictor and strategist. Provide data-driven predictions with clear reasoning.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        model: 'llama3-groq-70b-8192-tool-use-preview',
        temperature: 0.5,
        max_tokens: 1536,
      });

      return chatCompletion.choices[0]?.message?.content || 'No prediction generated.';
    } catch (error) {
      console.error('Error predicting match:', error);
      throw error;
    }
  }

  async generateTrainingPlan(teamData, goals) {
    try {
      const prompt = `
        Create a training plan for the following team:
        
        Team Name: ${teamData.name}
        Sport: ${teamData.sport}
        Players: ${JSON.stringify(teamData.players)}
        Current Fitness Levels: ${JSON.stringify(teamData.fitnessLevels)}
        Goals: ${JSON.stringify(goals)}
        
        Please provide:
        1. Weekly training schedule (5 days)
        2. Specific drills and exercises
        3. Duration and intensity recommendations
        4. Progress tracking methods
      `;

      const chatCompletion = await this.groq.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'You are a professional sports trainer. Create comprehensive, practical training plans.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        model: 'llama3-groq-70b-8192-tool-use-preview',
        temperature: 0.5,
        max_tokens: 2048,
      });

      return chatCompletion.choices[0]?.message?.content || 'No training plan generated.';
    } catch (error) {
      console.error('Error generating training plan:', error);
      throw error;
    }
  }

  async checkStatus() {
    try {
      // Simple health check by making a small request
      const chatCompletion = await this.groq.chat.completions.create({
        messages: [
          {
            role: 'user',
            content: 'Hello',
          },
        ],
        model: 'llama3-groq-70b-8192-tool-use-preview',
        temperature: 0.1,
        max_tokens: 10,
      });

      return {
        status: 'online',
        model: 'llama3-groq-70b-8192-tool-use-preview',
        response: chatCompletion.choices[0]?.message?.content,
      };
    } catch (error) {
      console.error('Error checking Groq service status:', error);
      throw error;
    }
  }
}

export default GroqService;