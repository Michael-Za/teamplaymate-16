import databaseService from './database.js';

class AiChatHistoryService {
  constructor() {
    this.db = databaseService;
  }

  async addMessage(userId, message, response, context = {}) {
    try {
      const chatMessage = await this.db.create('ai_chat_history', {
        user_id: userId,
        message,
        response,
        context: JSON.stringify(context),
        created_at: new Date(),
      });

      return chatMessage;
    } catch (error) {
      console.error('Error saving AI chat message:', error);
      throw error;
    }
  }

  async getHistory(userId, limit = 10) {
    try {
      const history = await this.db.findMany(
        'ai_chat_history',
        { user_id: userId },
        { orderBy: 'created_at', ascending: false, limit }
      );

      return history.map((item) => ({
        ...item,
        context: item.context ? JSON.parse(item.context) : {},
      }));
    } catch (error) {
      console.error('Error fetching AI chat history:', error);
      throw error;
    }
  }
}

export default AiChatHistoryService;