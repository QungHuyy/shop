import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import chatbotService, { ChatMessage } from '../../services/chatbotService';

interface UserInfo {
  id: string;
  name: string;
  isGuest: boolean;
}

export default function ChatbotScreen() {
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);
  const typingAnimationValue = useRef(new Animated.Value(0)).current;
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

  // Load chat history and user info on component mount
  useEffect(() => {
    initializeChatbot();
  }, []);

  // Listen for user authentication changes
  useEffect(() => {
    const checkUserChanges = async () => {
      const currentUserInfo = await chatbotService.getUserInfo();
      
      // If user changed, reload chat history
      if (userInfo && userInfo.id !== currentUserInfo.id) {
        console.log(`👤 User changed from ${userInfo.id} to ${currentUserInfo.id}`);
        await loadChatHistoryForUser(currentUserInfo.id);
      }
      
      setUserInfo(currentUserInfo);
    };

    // Check for user changes every few seconds when app is active
    const interval = setInterval(checkUserChanges, 3000);
    
    return () => clearInterval(interval);
  }, [userInfo]);

  // Auto-save messages whenever messages change
  useEffect(() => {
    if (messages.length > 0 && !isLoading && userInfo) {
      chatbotService.autoSaveMessages(messages);
    }
  }, [messages, isLoading, userInfo]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  // Typing animation
  useEffect(() => {
    if (isTyping) {
      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(typingAnimationValue, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(typingAnimationValue, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      );
      animation.start();
      return () => animation.stop();
    }
  }, [isTyping]);

  const initializeChatbot = async () => {
    try {
      setIsLoading(true);
      
      // Get user info
      const currentUserInfo = await chatbotService.getUserInfo();
      setUserInfo(currentUserInfo);
      
      // Load chat history for current user
      await loadChatHistoryForUser(currentUserInfo.id);
    } catch (error) {
      console.error('Error initializing chatbot:', error);
      // Fallback to welcome message
      const welcomeMessage = chatbotService.getWelcomeMessage();
      setMessages([welcomeMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadChatHistoryForUser = async (userId: string) => {
    try {
      const savedMessages = await chatbotService.loadChatHistory(userId);
      setMessages(savedMessages);
      
      // Don't show suggestions if there are previous conversations
      if (savedMessages.length > 1) {
        setShowSuggestions(false);
      } else {
        setShowSuggestions(true);
      }
    } catch (error) {
      console.error('Error loading chat history for user:', userId, error);
      // Fallback to welcome message
      const welcomeMessage = chatbotService.getWelcomeMessage(userId);
      setMessages([welcomeMessage]);
      setShowSuggestions(true);
    }
  };

  const sendMessage = async (text: string = inputText.trim()) => {
    if (!text) return;

    // Hide suggestions after first message
    setShowSuggestions(false);

    // Add user message
    const userMessage = chatbotService.createUserMessage(text);
    setMessages(prev => [...prev, userMessage]);
    setInputText('');

    // Show typing indicator
    setIsTyping(true);
    const typingMessage = chatbotService.createTypingMessage();
    setMessages(prev => [...prev, typingMessage]);

    try {
      // Get AI response
      const botResponse = await chatbotService.sendMessage(text);
      
      // Remove typing indicator and add bot response
      setMessages(prev => {
        const withoutTyping = prev.filter(msg => !msg.typing);
        const botMessage = chatbotService.createBotMessage(botResponse);
        return [...withoutTyping, botMessage];
      });
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Remove typing indicator and show error
      setMessages(prev => {
        const withoutTyping = prev.filter(msg => !msg.typing);
        const errorMessage = chatbotService.createBotMessage(
          'Xin lỗi, tôi đang gặp vấn đề. Vui lòng thử lại sau ít phút.'
        );
        return [...withoutTyping, errorMessage];
      });
    } finally {
      setIsTyping(false);
    }
  };

  const clearChat = () => {
    Alert.alert(
      'Xóa lịch sử trò chuyện',
      `Bạn có chắc muốn xóa toàn bộ lịch sử trò chuyện của ${userInfo?.isGuest ? 'khách' : userInfo?.name}? Thao tác này không thể hoàn tác.`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              await chatbotService.clearChatHistory(userInfo?.id);
              const welcomeMessage = chatbotService.getWelcomeMessage(userInfo?.id);
              setMessages([welcomeMessage]);
              setShowSuggestions(true);
              Alert.alert('Thành công', 'Đã xóa lịch sử trò chuyện');
            } catch (error) {
              console.error('Error clearing chat history:', error);
              Alert.alert('Lỗi', 'Có lỗi xảy ra khi xóa lịch sử');
            }
          },
        },
      ]
    );
  };

  const handleProductPress = (productId: string) => {
    console.log('🛍️ Navigating to product:', productId);
    router.push(`/products/${productId}` as any);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderProductChips = (productIds: string[]) => {
    if (!productIds || productIds.length === 0) return null;

    return (
      <View style={styles.productChipsContainer}>
        <Text style={styles.productChipsLabel}>📦 Sản phẩm được đề xuất:</Text>
        <View style={styles.productChips}>
          {productIds.map((productId, index) => (
            <TouchableOpacity
              key={index}
              style={styles.productChip}
              onPress={() => handleProductPress(productId)}
            >
              <Ionicons name="bag-outline" size={14} color="#007bff" />
              <Text style={styles.productChipText}>Xem sản phẩm {index + 1}</Text>
              <Ionicons name="chevron-forward" size={12} color="#007bff" />
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  const renderMessage = (message: ChatMessage, index: number) => {
    const isUser = message.sender === 'user';
    const isTyping = message.typing;

    return (
      <View
        key={message.id}
        style={[
          styles.messageContainer,
          isUser ? styles.userMessageContainer : styles.botMessageContainer,
        ]}
      >
        {!isUser && (
          <View style={styles.botAvatar}>
            <Ionicons name="chatbubble-ellipses" size={16} color="#fff" />
          </View>
        )}
        
        <View style={styles.messageWrapper}>
          <View
            style={[
              styles.messageBubble,
              isUser ? styles.userBubble : styles.botBubble,
              isTyping && styles.typingBubble,
            ]}
          >
            {isTyping ? (
              <View style={styles.typingIndicator}>
                <Animated.View
                  style={[
                    styles.typingDot,
                    {
                      opacity: typingAnimationValue,
                    },
                  ]}
                />
                <Animated.View
                  style={[
                    styles.typingDot,
                    {
                      opacity: typingAnimationValue,
                    },
                  ]}
                />
                <Animated.View
                  style={[
                    styles.typingDot,
                    {
                      opacity: typingAnimationValue,
                    },
                  ]}
                />
              </View>
            ) : (
              <Text style={[styles.messageText, isUser && styles.userMessageText]}>
                {message.text}
              </Text>
            )}
          </View>
          
          {/* Product chips for bot messages */}
          {!isUser && !isTyping && message.productIds && (
            renderProductChips(message.productIds)
          )}
        </View>
        
        {isUser && (
          <View style={styles.userAvatar}>
            <Ionicons name="person" size={16} color="#fff" />
          </View>
        )}
        
        {!isTyping && (
          <Text style={styles.timestamp}>{formatTime(message.timestamp)}</Text>
        )}
      </View>
    );
  };

  const renderSuggestions = () => {
    if (!showSuggestions || messages.length > 1) return null;

    const suggestions = chatbotService.getSuggestedQuestions();

    return (
      <View style={styles.suggestionsContainer}>
        <Text style={styles.suggestionsTitle}>💡 Gợi ý câu hỏi:</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.suggestionsList}
        >
          {suggestions.map((suggestion, index) => (
            <TouchableOpacity
              key={index}
              style={styles.suggestionButton}
              onPress={() => sendMessage(suggestion)}
            >
              <Text style={styles.suggestionText}>{suggestion}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderUserStatus = () => {
    if (!userInfo) return null;

    return (
      <View style={[styles.userStatus, userInfo.isGuest && styles.userStatusGuest]}>
        <Ionicons 
          name={userInfo.isGuest ? "person-outline" : "person"} 
          size={12} 
          color={userInfo.isGuest ? "#999" : "#007bff"} 
        />
        <Text style={[styles.userStatusText, userInfo.isGuest && styles.userStatusTextGuest]}>
          {userInfo.isGuest ? 'Khách' : userInfo.name}
        </Text>
        {!userInfo.isGuest && (
          <View style={styles.userStatusDot} />
        )}
      </View>
    );
  };

  // Show loading indicator while loading chat history
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007bff" />
          <Text style={styles.loadingText}>Đang tải lịch sử trò chuyện...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>Tư vấn viên AI 🤖</Text>
          <View style={styles.headerSubtitleContainer}>
            {renderUserStatus()}
            <Text style={styles.headerSubtitle}>
              {messages.length > 1 ? `${messages.filter(m => !m.typing).length} tin nhắn` : 'Sẵn sàng tư vấn'}
            </Text>
          </View>
        </View>
        
        <TouchableOpacity onPress={clearChat} style={styles.clearButton}>
          <Ionicons name="trash-outline" size={22} color="#ff4757" />
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
      >
        {messages.map((message, index) => renderMessage(message, index))}
      </ScrollView>

      {/* Suggestions */}
      {renderSuggestions()}

      {/* Input */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.inputContainer}
      >
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Hỏi về sản phẩm cụ thể..."
            placeholderTextColor="#999"
            multiline
            maxLength={500}
            editable={!isTyping}
          />
          
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!inputText.trim() || isTyping) && styles.sendButtonDisabled,
            ]}
            onPress={() => sendMessage()}
            disabled={!inputText.trim() || isTyping}
          >
            {isTyping ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="send" size={20} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
    elevation: 2,
  },
  backButton: {
    padding: 4,
    marginRight: 12,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSubtitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
  },
  userStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  userStatusGuest: {
    backgroundColor: '#f5f5f5',
  },
  userStatusText: {
    fontSize: 10,
    color: '#007bff',
    marginLeft: 4,
    fontWeight: '500',
  },
  userStatusTextGuest: {
    color: '#999',
  },
  userStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4caf50',
    marginLeft: 4,
  },
  clearButton: {
    padding: 4,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 32,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-end',
  },
  userMessageContainer: {
    justifyContent: 'flex-end',
  },
  botMessageContainer: {
    justifyContent: 'flex-start',
  },
  botAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#007bff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    alignSelf: 'flex-start',
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#28a745',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
    alignSelf: 'flex-end',
  },
  messageWrapper: {
    maxWidth: '75%',
  },
  messageBubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    elevation: 1,
  },
  userBubble: {
    backgroundColor: '#007bff',
  },
  botBubble: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e1e5e9',
  },
  typingBubble: {
    paddingVertical: 16,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
    color: '#333',
  },
  userMessageText: {
    color: '#fff',
  },
  timestamp: {
    fontSize: 10,
    color: '#999',
    marginTop: 4,
    marginHorizontal: 8,
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#666',
    marginHorizontal: 2,
  },
  productChipsContainer: {
    marginTop: 8,
  },
  productChipsLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 6,
    fontWeight: '500',
  },
  productChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  productChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f8ff',
    borderColor: '#007bff',
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 6,
    marginBottom: 4,
  },
  productChipText: {
    fontSize: 12,
    color: '#007bff',
    fontWeight: '500',
    marginHorizontal: 4,
  },
  suggestionsContainer: {
    backgroundColor: '#fff',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#e1e5e9',
  },
  suggestionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginHorizontal: 16,
    marginBottom: 12,
  },
  suggestionsList: {
    paddingHorizontal: 16,
  },
  suggestionButton: {
    backgroundColor: '#f1f3f4',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e1e5e9',
  },
  suggestionText: {
    fontSize: 14,
    color: '#333',
  },
  inputContainer: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e1e5e9',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e1e5e9',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    maxHeight: 100,
    marginRight: 12,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#007bff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
}); 