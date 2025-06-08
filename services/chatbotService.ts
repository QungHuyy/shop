import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL, API_BASE_URL, USER_API, PRODUCT_API, CART_API, FAVORITE_API, COMMENT_API, COUPON_API, ORDER_API, CHATBOT_API, IMAGE_SEARCH_API } from '../config/api';


export interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  typing?: boolean;
  productIds?: string[];
}

export interface ChatResponse {
  reply: string;
  error?: string;
}

export interface ProductMention {
  id: string;
  name: string;
  startIndex: number;
  endIndex: number;
}

export interface ChatHistory {
  messages: ChatMessage[];
  lastUpdated: string;
  userId: string;
}

const CHAT_HISTORY_PREFIX = 'chatbot_history_user_';
const OLD_CHAT_HISTORY_KEY = 'chatbot_history';

class ChatbotService {
  // Get current user ID from AsyncStorage
  async getCurrentUserId(): Promise<string> {
    try {
      const userStr = await AsyncStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        return user._id || 'guest';
      }
      return 'guest';
    } catch (error) {
      console.error('❌ Error getting user ID:', error);
      return 'guest';
    }
  }

  // Generate storage key for current user
  async getUserChatKey(userId?: string): Promise<string> {
    const currentUserId = userId || await this.getCurrentUserId();
    return `${CHAT_HISTORY_PREFIX}${currentUserId}`;
  }

  // Send message to chatbot and get AI response
  async sendMessage(message: string): Promise<string> {
    try {
      console.log('🤖 Sending message to chatbot:', message);
      
      const response = await fetch(`${CHATBOT_API}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: ChatResponse = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      console.log('✅ Received bot response:', data.reply);
      return data.reply;
    } catch (error) {
      console.error('❌ Chatbot service error:', error);
      
      // Fallback responses for common scenarios
      return this.getFallbackResponse(message);
    }
  }

  // Save chat history to AsyncStorage for specific user
  async saveChatHistory(messages: ChatMessage[], userId?: string): Promise<void> {
    try {
      const currentUserId = userId || await this.getCurrentUserId();
      const storageKey = await this.getUserChatKey(currentUserId);
      
      // Filter out typing messages before saving
      const permanentMessages = messages.filter(msg => !msg.typing);
      
      const chatHistory: ChatHistory = {
        messages: permanentMessages,
        lastUpdated: new Date().toISOString(),
        userId: currentUserId,
      };

      await AsyncStorage.setItem(storageKey, JSON.stringify(chatHistory));
      console.log(`💾 Chat history saved for user: ${currentUserId}`);
    } catch (error) {
      console.error('❌ Error saving chat history:', error);
    }
  }

  // Load chat history from AsyncStorage for specific user
  async loadChatHistory(userId?: string): Promise<ChatMessage[]> {
    try {
      const currentUserId = userId || await this.getCurrentUserId();
      const storageKey = await this.getUserChatKey(currentUserId);
      
      // Try to load user-specific chat history
      let stored = await AsyncStorage.getItem(storageKey);
      
      // If no user-specific history found, try to migrate from old format
      if (!stored && currentUserId !== 'guest') {
        stored = await this.migrateOldChatHistory(currentUserId);
      }
      
      if (!stored) {
        console.log(`📝 No chat history found for user: ${currentUserId}, starting fresh`);
        return [this.getWelcomeMessage(currentUserId)];
      }

      const chatHistory: ChatHistory = JSON.parse(stored);
      
      // Convert timestamp strings back to Date objects
      const messages = chatHistory.messages.map(msg => ({
        ...msg,
        timestamp: new Date(msg.timestamp),
      }));

      console.log(`📚 Loaded ${messages.length} messages for user: ${currentUserId}`);
      return messages;
    } catch (error) {
      console.error('❌ Error loading chat history:', error);
      const userId = await this.getCurrentUserId();
      return [this.getWelcomeMessage(userId)];
    }
  }

  // Migrate old chat history to user-specific format
  async migrateOldChatHistory(userId: string): Promise<string | null> {
    try {
      const oldHistory = await AsyncStorage.getItem(OLD_CHAT_HISTORY_KEY);
      if (oldHistory) {
        console.log(`🔄 Migrating old chat history to user: ${userId}`);
        
        // Save old history to user-specific key
        const storageKey = await this.getUserChatKey(userId);
        const parsedHistory = JSON.parse(oldHistory);
        
        // Update format if needed
        const migratedHistory: ChatHistory = {
          messages: parsedHistory.messages || [],
          lastUpdated: parsedHistory.lastUpdated || new Date().toISOString(),
          userId: userId,
        };
        
        await AsyncStorage.setItem(storageKey, JSON.stringify(migratedHistory));
        
        // Remove old format
        await AsyncStorage.removeItem(OLD_CHAT_HISTORY_KEY);
        
        console.log('✅ Migration completed');
        return JSON.stringify(migratedHistory);
      }
    } catch (error) {
      console.error('❌ Error during migration:', error);
    }
    return null;
  }

  // Clear chat history for specific user
  async clearChatHistory(userId?: string): Promise<void> {
    try {
      const currentUserId = userId || await this.getCurrentUserId();
      const storageKey = await this.getUserChatKey(currentUserId);
      
      await AsyncStorage.removeItem(storageKey);
      console.log(`🗑️ Chat history cleared for user: ${currentUserId}`);
    } catch (error) {
      console.error('❌ Error clearing chat history:', error);
    }
  }

  // Clear all chat histories (for debugging/admin)
  async clearAllChatHistories(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const chatKeys = keys.filter(key => key.startsWith(CHAT_HISTORY_PREFIX));
      
      await AsyncStorage.multiRemove([...chatKeys, OLD_CHAT_HISTORY_KEY]);
      console.log(`🗑️ Cleared ${chatKeys.length} chat histories`);
    } catch (error) {
      console.error('❌ Error clearing all chat histories:', error);
    }
  }

  // Get user info for personalized messages
  async getUserInfo(): Promise<{id: string, name: string, isGuest: boolean}> {
    try {
      const userStr = await AsyncStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        return {
          id: user._id || 'guest',
          name: user.fullname || 'Người dùng',
          isGuest: false,
        };
      }
      return {
        id: 'guest',
        name: 'Khách',
        isGuest: true,
      };
    } catch (error) {
      return {
        id: 'guest',
        name: 'Khách',
        isGuest: true,
      };
    }
  }

  // Auto-save messages (call this after each message exchange)
  async autoSaveMessages(messages: ChatMessage[]): Promise<void> {
    // Debounce auto-save to avoid too frequent writes
    if (this.autoSaveTimeout) {
      clearTimeout(this.autoSaveTimeout);
    }

    this.autoSaveTimeout = setTimeout(() => {
      this.saveChatHistory(messages);
    }, 1000); // Save 1 second after last message
  }

  private autoSaveTimeout: number | null = null;

  // Parse product IDs from message text
  parseProductIds(text: string): string[] {
    const idPattern = /\[ID:\s*([a-fA-F0-9]{24})\]/g;
    const matches = [];
    let match;
    
    while ((match = idPattern.exec(text)) !== null) {
      matches.push(match[1]);
    }
    
    return matches;
  }

  // Extract product mentions with positions for highlighting
  extractProductMentions(text: string): ProductMention[] {
    const mentions: ProductMention[] = [];
    const pattern = /(.*?)\s*\[ID:\s*([a-fA-F0-9]{24})\]/g;
    let match;
    
    while ((match = pattern.exec(text)) !== null) {
      const productName = match[1].trim();
      const productId = match[2];
      const startIndex = match.index;
      const endIndex = match.index + match[0].length;
      
      mentions.push({
        id: productId,
        name: productName,
        startIndex,
        endIndex
      });
    }
    
    return mentions;
  }

  // Format message text to remove ID tags and make it cleaner
  formatMessageText(text: string): string {
    // Remove [ID: xxx] tags for cleaner display
    return text.replace(/\s*\[ID:\s*[a-fA-F0-9]{24}\]/g, '');
  }

  // Generate unique message ID
  generateMessageId(): string {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }

  // Create user message object
  createUserMessage(text: string): ChatMessage {
    return {
      id: this.generateMessageId(),
      text,
      sender: 'user',
      timestamp: new Date(),
    };
  }

  // Create bot message object with product parsing
  createBotMessage(text: string, typing = false): ChatMessage {
    const productIds = this.parseProductIds(text);
    const cleanText = this.formatMessageText(text);
    
    return {
      id: this.generateMessageId(),
      text: cleanText,
      sender: 'bot',
      timestamp: new Date(),
      typing,
      productIds: productIds.length > 0 ? productIds : undefined,
    };
  }

  // Create typing indicator
  createTypingMessage(): ChatMessage {
    return this.createBotMessage('Đang soạn tin...', true);
  }

  // Fallback responses when API fails
  private getFallbackResponse(message: string): string {
    const lowerMessage = message.toLowerCase();
    
    // Greetings
    if (lowerMessage.includes('chào') || lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
      return 'Xin chào! Rất vui được gặp bạn tại Hệ thống Thời trang H&A. Tôi là trợ lý ảo – Tôi có thể giúp gì cho bạn?';
    }
    
    // Product specific queries
    if (lowerMessage.includes('áo thun') || lowerMessage.includes('t-shirt')) {
      return 'H&A có nhiều mẫu áo thun đẹp cho nam và nữ! Chúng tôi có áo thun basic, áo thun form rộng, áo thun in họa tiết. Bạn muốn xem áo thun nam hay nữ? Có phong cách nào đặc biệt không?';
    }
    
    if (lowerMessage.includes('quần') || lowerMessage.includes('jeans')) {
      return 'H&A có đa dạng các loại quần: jeans, kaki, short, jogger. Quần jeans của chúng tôi có nhiều kiểu dáng: skinny, slim fit, regular, baggy. Bạn muốn tìm quần gì và size bao nhiêu?';
    }
    
    if (lowerMessage.includes('váy') || lowerMessage.includes('đầm')) {
      return 'H&A có nhiều mẫu váy và đầm xinh xắn! Váy dự tiệc, váy công sở, váy dạo phố, đầm maxi, đầm suông... Bạn đang tìm kiểu váy nào và cho dịp gì?';
    }
    
    // Style advice
    if (lowerMessage.includes('phối đồ') || lowerMessage.includes('outfit') || lowerMessage.includes('mix')) {
      return 'Để phối đồ đẹp, bạn nên chọn trang phục phù hợp với dáng người và màu da. Với áo thun basic, bạn có thể kết hợp với quần jeans và giày sneaker cho outfit năng động. Bạn muốn được tư vấn phối đồ cho dịp nào?';
    }
    
    if (lowerMessage.includes('xu hướng') || lowerMessage.includes('trend')) {
      return 'Xu hướng thời trang hiện nay đang thiên về phong cách Y2K, Minimalism và Oversized. Áo phông form rộng, quần ống suông, và màu sắc pastel đang rất được ưa chuộng. Bạn quan tâm đến phong cách nào?';
    }
    
    // Information queries
    if (lowerMessage.includes('giá') || lowerMessage.includes('bao nhiêu')) {
      return 'Sản phẩm tại H&A có giá từ 200.000 - 1.500.000 VNĐ. Áo thun từ 200.000 - 400.000 VNĐ, quần jeans từ 400.000 - 700.000 VNĐ, váy đầm từ 350.000 - 900.000 VNĐ. Bạn đang quan tâm đến sản phẩm nào?';
    }
    
    if (lowerMessage.includes('size') || lowerMessage.includes('kích thước')) {
      return 'H&A có đầy đủ size S, M, L cho cả nam và nữ. Size S phù hợp với người dưới 55kg, M cho người 55-65kg, L cho người 65-75kg. Bạn có thể tham khảo bảng size chi tiết khi chọn sản phẩm. Bạn thường mặc size nào?';
    }
    
    if (lowerMessage.includes('giao hàng') || lowerMessage.includes('ship')) {
      return 'H&A hỗ trợ giao hàng toàn quốc trong 1-3 ngày làm việc. Phí ship từ 20.000 VNĐ. Đơn hàng trên 500.000 VNĐ được freeship! Bạn muốn biết thêm thông tin về chính sách giao hàng?';
    }
    
    if (lowerMessage.includes('cảm ơn') || lowerMessage.includes('thanks')) {
      return 'Cảm ơn bạn đã tin tưởng H&A! Nếu cần tư vấn thêm về sản phẩm thời trang nào, đừng ngại hỏi tôi nhé! 😊';
    }
    
    // Non-fashion related queries
    if (lowerMessage.includes('thời tiết') || lowerMessage.includes('dự báo')) {
      return 'Xin lỗi, tôi không thể cung cấp thông tin về thời tiết. Tôi chỉ có thể tư vấn về sản phẩm thời trang tại H&A. Bạn cần tư vấn trang phục phù hợp với thời tiết hiện tại không?';
    }
    
    if (lowerMessage.includes('chính trị') || lowerMessage.includes('bầu cử') || lowerMessage.includes('chiến tranh')) {
      return 'Xin lỗi, tôi không thể thảo luận về các chủ đề chính trị. Tôi chỉ có thể tư vấn về sản phẩm thời trang tại H&A. Bạn cần tìm sản phẩm thời trang nào không?';
    }
    
    if (lowerMessage.includes('đầu tư') || lowerMessage.includes('chứng khoán') || lowerMessage.includes('bitcoin')) {
      return 'Xin lỗi, tôi không thể tư vấn về đầu tư hay tài chính. Tôi chỉ có thể tư vấn về sản phẩm thời trang tại H&A. Bạn cần tìm sản phẩm thời trang nào không?';
    }
    
    // Default fallback
    return 'Tôi là trợ lý tư vấn thời trang của H&A. Tôi có thể giúp bạn tìm sản phẩm cụ thể, tư vấn phối đồ và gợi ý outfit phù hợp với dáng người, màu da và dịp sử dụng. Bạn cần tư vấn về sản phẩm thời trang nào?';
  }

  // Get personalized welcome message
  getWelcomeMessage(userId?: string): ChatMessage {
    return this.createBotMessage(
      'Xin chào! Rất vui được gặp bạn tại Hệ thống Thời trang H&A. Tôi là trợ lý ảo – Tôi có thể giúp gì cho bạn?'
    );
  }

  // Get suggested questions
  getSuggestedQuestions(): string[] {
    return [
      'Có áo thun nam nào đẹp không?',
      'Gợi ý outfit đi làm',
      'Váy dự tiệc giá tốt',
      'Quần jeans nữ trending',
      'Phối đồ mùa hè như thế nào?',
      'Xu hướng thời trang mùa này',
      'Tư vấn đồ cho người mập',
      'Áo khoác phù hợp thời tiết lạnh'
    ];
  }
}

export default new ChatbotService(); 