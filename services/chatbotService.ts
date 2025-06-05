export interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  typing?: boolean;
}

export interface ChatResponse {
  reply: string;
  error?: string;
}

const API_BASE_URL = 'http://192.168.1.45:8000/api';

class ChatbotService {
  // Send message to chatbot and get AI response
  async sendMessage(message: string): Promise<string> {
    try {
      console.log('🤖 Sending message to chatbot:', message);
      
      const response = await fetch(`${API_BASE_URL}/Chatbot/chat`, {
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

  // Create bot message object
  createBotMessage(text: string, typing = false): ChatMessage {
    return {
      id: this.generateMessageId(),
      text,
      sender: 'bot',
      timestamp: new Date(),
      typing,
    };
  }

  // Create typing indicator
  createTypingMessage(): ChatMessage {
    return this.createBotMessage('Đang soạn tin...', true);
  }

  // Fallback responses when API fails
  private getFallbackResponse(message: string): string {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('chào') || lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
      return 'Chào bạn! Tôi là trợ lý tư vấn thời trang. Tôi có thể giúp bạn tìm kiếm sản phẩm phù hợp. Bạn đang tìm loại trang phục nào?';
    }
    
    if (lowerMessage.includes('áo thun') || lowerMessage.includes('t-shirt')) {
      return 'Chúng tôi có nhiều mẫu áo thun đẹp cho nam và nữ! Bạn muốn xem áo thun nam hay nữ? Có phong cách nào đặc biệt không?';
    }
    
    if (lowerMessage.includes('quần') || lowerMessage.includes('jeans')) {
      return 'Chúng tôi có đa dạng các loại quần: jeans, kaki, short, jogger. Bạn muốn tìm quần gì và size bao nhiêu?';
    }
    
    if (lowerMessage.includes('váy') || lowerMessage.includes('đầm')) {
      return 'Chúng tôi có nhiều mẫu váy và đầm xinh xắn! Bạn muốn váy dự tiệc, váy công sở hay váy dạo phố?';
    }
    
    if (lowerMessage.includes('giá') || lowerMessage.includes('bao nhiêu')) {
      return 'Giá sản phẩm của chúng tôi rất đa dạng từ 200.000 - 1.500.000 VNĐ tùy theo loại. Bạn có thể xem chi tiết giá khi chọn sản phẩm cụ thể!';
    }
    
    if (lowerMessage.includes('size') || lowerMessage.includes('kích thước')) {
      return 'Chúng tôi có đầy đủ size S, M, L. Bạn có thể tham khảo bảng size chi tiết khi chọn sản phẩm. Bạn thường mặc size nào?';
    }
    
    if (lowerMessage.includes('giao hàng') || lowerMessage.includes('ship')) {
      return 'Chúng tôi hỗ trợ giao hàng toàn quốc trong 1-3 ngày làm việc. Phí ship từ 20.000 VNĐ. Đơn hàng trên 500.000 VNĐ được freeship!';
    }
    
    if (lowerMessage.includes('cảm ơn') || lowerMessage.includes('thanks')) {
      return 'Cảm ơn bạn đã tin tưởng! Nếu cần tư vấn thêm về sản phẩm nào, đừng ngại hỏi tôi nhé! 😊';
    }
    
    // Default fallback
    return 'Tôi là trợ lý tư vấn thời trang. Tôi có thể giúp bạn tìm áo thun, quần jeans, váy đầm, phụ kiện và tư vấn phối đồ. Bạn muốn tìm gì hôm nay?';
  }

  // Get welcome message
  getWelcomeMessage(): ChatMessage {
    return this.createBotMessage(
      'Chào mừng bạn đến với trợ lý tư vấn thời trang! 👗✨\n\nTôi có thể giúp bạn:\n• Tìm sản phẩm phù hợp\n• Tư vấn phối đồ\n• Gợi ý theo dịp & thời tiết\n• Thông tin về size, chất liệu\n\nBạn muốn tôi tư vấn gì hôm nay?'
    );
  }

  // Get suggested questions
  getSuggestedQuestions(): string[] {
    return [
      'Tôi muốn tìm áo thun nam',
      'Gợi ý outfit đi làm',
      'Váy dự tiệc có gì?',
      'Quần jeans nữ trending',
      'Phối đồ mùa hè',
      'Size chart như thế nào?'
    ];
  }
}

export default new ChatbotService(); 