import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Modal,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import ApiService from '../services/apiService';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AiAssistantProps {
  visible: boolean;
  onClose: () => void;
}

const AiAssistant: React.FC<AiAssistantProps> = ({ visible, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [threads, setThreads] = useState<Record<'nutrition'|'health'|'general', Message[]>>({
    nutrition: [],
    health: [],
    general: [],
  });
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [assistantType, setAssistantType] = useState<'nutrition' | 'health' | 'general'>('nutrition');
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (visible) {
      loadConversationHistory();
    }
  }, [visible]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadConversationHistory = async () => {
    try {
      const history = await ApiService.getConversationHistory();
      const formattedMessages = history.map((item: any) => [
        {
          id: `${item.id}-question`,
          type: 'user' as const,
          content: item.question,
          timestamp: new Date(item.createdAt),
        },
        {
          id: `${item.id}-answer`,
          type: 'assistant' as const,
          content: item.answer,
          timestamp: new Date(item.createdAt),
        },
      ]).flat();
      
      setThreads(prev => ({ ...prev, [assistantType]: formattedMessages } as any));
      setMessages(formattedMessages);
    } catch (error) {
      console.error('Failed to load conversation history:', error);
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const sendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputText.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setThreads(prev => ({ ...prev, [assistantType]: [...(prev[assistantType]||[]), userMessage] }));
    setInputText('');
    setIsLoading(true);

    try {
      let response;
      switch (assistantType) {
        case 'nutrition':
          response = await ApiService.getNutritionAdvice(inputText.trim());
          break;
        case 'health':
          response = await ApiService.getHealthCheck(inputText.trim());
          break;
        case 'general':
          response = await ApiService.getGeneralQuestion(inputText.trim());
          break;
        default:
          response = await ApiService.getNutritionAdvice(inputText.trim());
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: response.answer,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
      setThreads(prev => ({ ...prev, [assistantType]: [...(prev[assistantType]||[]), assistantMessage] }));
    } catch (error) {
      console.error('Failed to send message:', error);
      Alert.alert('Error', 'Failed to get response from AI assistant. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const clearConversation = () => {
    Alert.alert(
      'Clear Conversation',
      'Are you sure you want to clear the conversation history?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear', style: 'destructive', onPress: () => {
          setMessages([]);
          setThreads(prev => ({ ...prev, [assistantType]: [] }));
        } },
      ]
    );
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderMessage = (message: Message) => (
    <View
      key={message.id}
      style={[
        styles.messageContainer,
        message.type === 'user' ? styles.userMessage : styles.assistantMessage,
      ]}
    >
      <View
        style={[
          styles.messageBubble,
          message.type === 'user' ? styles.userBubble : styles.assistantBubble,
        ]}
      >
        <Text
          style={[
            styles.messageText,
            message.type === 'user' ? styles.userText : styles.assistantText,
          ]}
        >
          {message.content}
        </Text>
        <Text
          style={[
            styles.messageTime,
            message.type === 'user' ? styles.userTime : styles.assistantTime,
          ]}
        >
          {formatTime(message.timestamp)}
        </Text>
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.assistantIcon}>
              <Ionicons name="chatbubble" size={24} color="#FFFFFF" />
            </View>
            <View>
              <Text style={styles.headerTitle}>AI Assistant</Text>
              <Text style={styles.headerSubtitle}>
                {assistantType === 'nutrition' && 'Nutrition Expert'}
                {assistantType === 'health' && 'Health Advisor'}
                {assistantType === 'general' && 'General Assistant'}
              </Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity onPress={clearConversation} style={styles.headerButton}>
              <Ionicons name="trash" size={20} color="#8E8E93" />
            </TouchableOpacity>
            <TouchableOpacity onPress={onClose} style={styles.headerButton}>
              <Ionicons name="close" size={24} color="#8E8E93" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.typeSelector}>
          <TouchableOpacity
            style={[
              styles.typeButton,
              assistantType === 'nutrition' && styles.typeButtonActive,
            ]}
            onPress={() => { setAssistantType('nutrition'); setMessages(threads.nutrition || []); }}
          >
            <Ionicons
              name="nutrition"
              size={20}
              color={assistantType === 'nutrition' ? '#FFFFFF' : '#007AFF'}
            />
            <Text
              style={[
                styles.typeButtonText,
                assistantType === 'nutrition' && styles.typeButtonTextActive,
              ]}
            >
              Nutrition
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.typeButton,
              assistantType === 'health' && styles.typeButtonActive,
            ]}
            onPress={() => { setAssistantType('health'); setMessages(threads.health || []); }}
          >
            <Ionicons
              name="heart"
              size={20}
              color={assistantType === 'health' ? '#FFFFFF' : '#007AFF'}
            />
            <Text
              style={[
                styles.typeButtonText,
                assistantType === 'health' && styles.typeButtonTextActive,
              ]}
            >
              Health
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.typeButton,
              assistantType === 'general' && styles.typeButtonActive,
            ]}
            onPress={() => { setAssistantType('general'); setMessages(threads.general || []); }}
          >
            <Ionicons
              name="help-circle"
              size={20}
              color={assistantType === 'general' ? '#FFFFFF' : '#007AFF'}
            />
            <Text
              style={[
                styles.typeButtonText,
                assistantType === 'general' && styles.typeButtonTextActive,
              ]}
            >
              General
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        >
          {messages.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="chatbubbles" size={48} color="#C7C7CC" />
              <Text style={styles.emptyTitle}>Start a conversation</Text>
              <Text style={styles.emptySubtitle}>
                Ask me anything about nutrition, health, or general wellness!
              </Text>
            </View>
          ) : (
            messages.map(renderMessage)
          )}
          {isLoading && (
            <View style={[styles.messageContainer, styles.assistantMessage]}>
              <View style={[styles.messageBubble, styles.assistantBubble]}>
                <View style={styles.typingIndicator}>
                  <View style={styles.typingDot} />
                  <View style={styles.typingDot} />
                  <View style={styles.typingDot} />
                </View>
              </View>
            </View>
          )}
        </ScrollView>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.inputContainer}
        >
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.textInput}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Ask me anything..."
              placeholderTextColor="#8E8E93"
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                (!inputText.trim() || isLoading) && styles.sendButtonDisabled,
              ]}
              onPress={sendMessage}
              disabled={!inputText.trim() || isLoading}
            >
              <Ionicons
                name="send"
                size={20}
                color={(!inputText.trim() || isLoading) ? '#C7C7CC' : '#FFFFFF'}
              />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E7',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  assistantIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    padding: 8,
    marginLeft: 8,
  },
  typeSelector: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E7',
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginHorizontal: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5E7',
  },
  typeButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#007AFF',
    marginLeft: 6,
  },
  typeButtonTextActive: {
    color: '#FFFFFF',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 20,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1C1C1E',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 22,
  },
  messageContainer: {
    marginBottom: 16,
  },
  userMessage: {
    alignItems: 'flex-end',
  },
  assistantMessage: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
  },
  userBubble: {
    backgroundColor: '#007AFF',
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5E7',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userText: {
    color: '#FFFFFF',
  },
  assistantText: {
    color: '#1C1C1E',
  },
  messageTime: {
    fontSize: 12,
    marginTop: 4,
  },
  userTime: {
    color: '#E3F2FD',
    textAlign: 'right',
  },
  assistantTime: {
    color: '#8E8E93',
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#8E8E93',
    marginHorizontal: 2,
  },
  inputContainer: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E5E7',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  textInput: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    maxHeight: 100,
    marginRight: 12,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#E5E5E7',
  },
});

export default AiAssistant;
