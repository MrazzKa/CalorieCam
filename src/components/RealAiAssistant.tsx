import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import ApiService from '../services/apiService';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../../app/i18n/hooks';
import { useTheme } from '../contexts/ThemeContext';
import { clientLog } from '../utils/clientLog';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface LabMetric {
  name: string;
  value: number;
  unit: string;
  isNormal: boolean;
  level: 'low' | 'normal' | 'high';
  comment?: string;
}

interface LabResult {
  id: string;
  metrics: LabMetric[];
  summary: string;
  recommendation: string;
}

interface RealAiAssistantProps {
  onClose: () => void;
}

type TabType = 'chat' | 'lab';

export const RealAiAssistant: React.FC<RealAiAssistantProps> = ({ onClose }) => {
  const { user } = useAuth();
  const { t, language } = useI18n();
  const { colors } = useTheme();
  const [activeTab, setActiveTab] = useState<TabType>('chat');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [labText, setLabText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [labResult, setLabResult] = useState<LabResult | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);

  // Load conversation history on mount
  useEffect(() => {
    const loadHistory = async () => {
      if (!user?.id) return;
      
      try {
        await clientLog('AiAssistant:loadingHistory').catch(() => {});
        const history = await ApiService.getConversationHistory(user.id, 10);
        
        if (Array.isArray(history) && history.length > 0) {
          const historyMessages: Message[] = history
            .slice(0, 10)
            .map((item: any, index: number) => ({
              id: `history-${index}-${Date.now()}`,
              role: item.role || (item.type === 'general_question' ? 'user' : 'assistant'),
              content: item.answer || item.question || '',
              timestamp: new Date(item.createdAt || Date.now()),
            }));
          setMessages(historyMessages.reverse());
        } else {
          // Add welcome message
          setMessages([
            {
              id: 'welcome-1',
              role: 'assistant',
              content: t('aiAssistant.welcome') || 'Hello! I\'m your AI nutrition assistant. How can I help you today?',
              timestamp: new Date(),
            },
          ]);
        }
      } catch (error) {
        console.error('[RealAiAssistant] Error loading history:', error);
        // Still show welcome message on error
        setMessages([
          {
            id: 'welcome-1',
            role: 'assistant',
            content: t('aiAssistant.welcome') || 'Hello! I\'m your AI nutrition assistant. How can I help you today?',
            timestamp: new Date(),
          },
        ]);
      }
    };

    loadHistory();
  }, [user?.id, t]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollViewRef.current && messages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const handleSend = useCallback(async () => {
    const trimmedInput = inputText.trim();
    if (!trimmedInput || isLoading || !user?.id) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: trimmedInput,
      timestamp: new Date(),
    };

    // Add user message immediately
    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      await clientLog('AiAssistant:messageSent', { messageLength: trimmedInput.length }).catch(() => {});

      // Call API
      const response = await ApiService.getGeneralQuestion(
        user.id,
        trimmedInput,
        language || 'en',
      );

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: response?.answer || t('aiAssistant.error') || 'Sorry, I could not process your question. Please try again.',
        timestamp: new Date(),
      };

      await clientLog('AiAssistant:messageReceived', { 
        hasAnswer: !!response?.answer,
        answerLength: response?.answer?.length || 0,
      }).catch(() => {});

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error: any) {
      console.error('[RealAiAssistant] Error sending message:', error);
      
      // Check for quota exceeded error
      const isQuotaExceeded = 
        error?.status === 503 ||
        error?.status === 429 ||
        error?.payload?.code === 'AI_QUOTA_EXCEEDED' ||
        error?.message?.includes('quota') ||
        error?.message?.includes('AI_QUOTA_EXCEEDED');
      
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: isQuotaExceeded
          ? (t('aiAssistant.quotaExceeded') || 'AI Assistant quota exceeded. The service is temporarily unavailable. Please try again later.')
          : (t('aiAssistant.error') || 'Sorry, something went wrong. Please try again later.'),
        timestamp: new Date(),
      };

      await clientLog('AiAssistant:messageError', { 
        message: error?.message || String(error),
        status: error?.status,
        code: error?.payload?.code,
        isQuotaExceeded,
      }).catch(() => {});

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      // Focus input after sending
      setTimeout(() => {
        if (inputRef.current && typeof inputRef.current.focus === 'function') {
          inputRef.current.focus();
        }
      }, 100);
    }
  }, [inputText, isLoading, user?.id, language, t]);

  const handleClose = useCallback(async () => {
    if (onClose && typeof onClose === 'function') {
      await clientLog('AiAssistant:closed').catch(() => {});
      onClose();
    }
  }, [onClose]);

  const handleAnalyzeLabResults = useCallback(async () => {
    const trimmedText = labText.trim();
    if (!trimmedText || isLoading || !user?.id) return;

    setIsLoading(true);
    setLabResult(null);

    try {
      await clientLog('AiAssistant:labResultsAnalyzed', { textLength: trimmedText.length }).catch(() => {});

      const response = await ApiService.analyzeLabResults(
        user.id,
        trimmedText,
        language || 'en',
      );

      setLabResult({
        id: response.id || `lab-${Date.now()}`,
        metrics: response.metrics || [],
        summary: response.summary || '',
        recommendation: response.recommendation || '',
      });

      setLabText('');
    } catch (error: any) {
      console.error('[RealAiAssistant] Error analyzing lab results:', error);
      
      const isQuotaExceeded = 
        error?.status === 503 ||
        error?.status === 429 ||
        error?.payload?.code === 'AI_QUOTA_EXCEEDED';
      
      const errorMessage = isQuotaExceeded
        ? (t('aiAssistant.quotaExceeded') || 'AI Assistant quota exceeded. Please try again later.')
        : (t('aiAssistant.error') || 'Sorry, something went wrong. Please try again later.');

      setLabResult({
        id: `error-${Date.now()}`,
        metrics: [],
        summary: errorMessage,
        recommendation: '',
      });

      await clientLog('AiAssistant:labResultsError', { 
        message: error?.message || String(error),
        status: error?.status,
      }).catch(() => {});
    } finally {
      setIsLoading(false);
    }
  }, [labText, isLoading, user?.id, language, t]);

  const renderMessage = (message: Message) => {
    const isUser = message.role === 'user';
    
    return (
      <View
        key={message.id}
        style={[
          styles.messageContainer,
          isUser ? styles.userMessageContainer : styles.assistantMessageContainer,
        ]}
      >
        <View
          style={[
            styles.messageBubble,
            isUser
              ? { backgroundColor: colors.primary || '#007AFF' }
              : { backgroundColor: colors.surfaceMuted || '#F2F2F7' },
          ]}
        >
          <Text
            style={[
              styles.messageText,
              isUser
                ? { color: colors.onPrimary || '#FFFFFF' }
                : { color: colors.text || '#000000' },
            ]}
          >
            {message.content}
          </Text>
        </View>
      </View>
    );
  };

  const renderLabResults = () => {
    if (!labResult) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="medical" size={64} color={colors.textTertiary || '#8E8E93'} />
          <Text style={[styles.emptyText, { color: colors.textSecondary || '#6B7280' }]}>
            {t('aiAssistant.labResults.empty') || 'Paste your lab results text below to analyze'}
          </Text>
        </View>
      );
    }

    return (
      <ScrollView style={styles.labResultsContainer} contentContainerStyle={styles.labResultsContent}>
        {labResult.summary && (
          <View style={[styles.labSection, { backgroundColor: colors.surfaceMuted || '#F2F2F7' }]}>
            <Text style={[styles.labSectionTitle, { color: colors.text || '#000000' }]}>
              {t('aiAssistant.labResults.summary') || 'Summary'}
            </Text>
            <Text style={[styles.labSectionText, { color: colors.text || '#000000' }]}>
              {labResult.summary}
            </Text>
          </View>
        )}

        {labResult.metrics && labResult.metrics.length > 0 && (
          <View style={styles.labMetricsContainer}>
            <Text style={[styles.labSectionTitle, { color: colors.text || '#000000' }]}>
              {t('aiAssistant.labResults.metrics') || 'Metrics'}
            </Text>
            {labResult.metrics.map((metric, index) => (
              <View
                key={index}
                style={[
                  styles.labMetricCard,
                  {
                    backgroundColor: colors.surface || '#FFFFFF',
                    borderColor: metric.isNormal
                      ? colors.success || '#34C759'
                      : metric.level === 'high'
                      ? colors.error || '#FF3B30'
                      : colors.warning || '#FF9500',
                  },
                ]}
              >
                <View style={styles.labMetricHeader}>
                  <Text style={[styles.labMetricName, { color: colors.text || '#000000' }]}>
                    {metric.name}
                  </Text>
                  <View
                    style={[
                      styles.labMetricBadge,
                      {
                        backgroundColor: metric.isNormal
                          ? (colors.success + '20') || '#34C75920'
                          : metric.level === 'high'
                          ? (colors.error + '20') || '#FF3B3020'
                          : (colors.warning + '20') || '#FF950020',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.labMetricBadgeText,
                        {
                          color: metric.isNormal
                            ? colors.success || '#34C759'
                            : metric.level === 'high'
                            ? colors.error || '#FF3B30'
                            : colors.warning || '#FF9500',
                        },
                      ]}
                    >
                      {metric.level.toUpperCase()}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.labMetricValue, { color: colors.text || '#000000' }]}>
                  {metric.value} {metric.unit}
                </Text>
                {metric.comment && (
                  <Text style={[styles.labMetricComment, { color: colors.textSecondary || '#6B7280' }]}>
                    {metric.comment}
                  </Text>
                )}
              </View>
            ))}
          </View>
        )}

        {labResult.recommendation && (
          <View style={[styles.labSection, { backgroundColor: colors.surfaceMuted || '#F2F2F7' }]}>
            <Text style={[styles.labSectionTitle, { color: colors.text || '#000000' }]}>
              {t('aiAssistant.labResults.recommendation') || 'Recommendations'}
            </Text>
            <Text style={[styles.labSectionText, { color: colors.text || '#000000' }]}>
              {labResult.recommendation}
            </Text>
          </View>
        )}

        <View style={[styles.labDisclaimer, { backgroundColor: colors.warning + '20' || '#FF950020' }]}>
          <Ionicons name="warning" size={16} color={colors.warning || '#FF9500'} />
          <Text style={[styles.labDisclaimerText, { color: colors.text || '#000000' }]}>
            {t('aiAssistant.labResults.disclaimer') || 'This is not a medical diagnosis. Please consult a healthcare professional for medical decisions.'}
          </Text>
        </View>
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background || '#FFFFFF' }]} edges={['bottom']}>
      {/* Tabs */}
      <View style={[styles.tabsContainer, { backgroundColor: colors.surface || '#FFFFFF', borderBottomColor: colors.border || '#E5E5EA' }]}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'chat' && { borderBottomColor: colors.primary || '#007AFF' },
          ]}
          onPress={() => setActiveTab('chat')}
        >
          <Ionicons
            name="chatbubbles"
            size={20}
            color={activeTab === 'chat' ? colors.primary || '#007AFF' : colors.textTertiary || '#8E8E93'}
          />
          <Text
            style={[
              styles.tabText,
              {
                color: activeTab === 'chat' ? colors.primary || '#007AFF' : colors.textTertiary || '#8E8E93',
              },
            ]}
          >
            {t('aiAssistant.tabs.chat') || 'Chat'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'lab' && { borderBottomColor: colors.primary || '#007AFF' },
          ]}
          onPress={() => setActiveTab('lab')}
        >
          <Ionicons
            name="medical"
            size={20}
            color={activeTab === 'lab' ? colors.primary || '#007AFF' : colors.textTertiary || '#8E8E93'}
          />
          <Text
            style={[
              styles.tabText,
              {
                color: activeTab === 'lab' ? colors.primary || '#007AFF' : colors.textTertiary || '#8E8E93',
              },
            ]}
          >
            {t('aiAssistant.tabs.labResults') || 'Blood Tests'}
          </Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {activeTab === 'chat' ? (
          <>
            {/* Messages */}
            <ScrollView
              ref={scrollViewRef}
              style={styles.messagesContainer}
              contentContainerStyle={styles.messagesContent}
              showsVerticalScrollIndicator={false}
            >
          {messages.length === 0 && !isLoading && (
            <View style={styles.emptyState}>
              <Ionicons name="chatbubbles" size={64} color={colors.textTertiary || '#8E8E93'} />
              <Text style={[styles.emptyText, { color: colors.textSecondary || '#6B7280' }]}>
                {t('aiAssistant.emptyState') || 'Start a conversation with your AI assistant'}
              </Text>
            </View>
          )}
          
          {messages.map(renderMessage)}
          
          {isLoading && (
            <View style={[styles.messageContainer, styles.assistantMessageContainer]}>
              <View style={[styles.messageBubble, { backgroundColor: colors.surfaceMuted || '#F2F2F7' }]}>
                <ActivityIndicator size="small" color={colors.primary || '#007AFF'} />
                <Text style={[styles.messageText, { color: colors.textSecondary || '#6B7280', marginLeft: 8 }]}>
                  {t('aiAssistant.typing') || 'Assistant is typing...'}
                </Text>
              </View>
            </View>
          )}
        </ScrollView>

            {/* Input */}
            <View style={[styles.inputContainer, { backgroundColor: colors.surface || '#FFFFFF', borderTopColor: colors.border || '#E5E5EA' }]}>
              <TextInput
                ref={inputRef}
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.inputBackground || '#F2F2F7',
                    color: colors.text || '#000000',
                    borderColor: colors.border || '#E5E5EA',
                  },
                ]}
                placeholder={t('aiAssistant.placeholder') || 'Type your question...'}
                placeholderTextColor={colors.textTertiary || '#8E8E93'}
                value={inputText}
                onChangeText={setInputText}
                onSubmitEditing={handleSend}
                multiline
                maxLength={500}
                editable={!isLoading}
                returnKeyType="send"
              />
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  {
                    backgroundColor:
                      inputText.trim() && !isLoading
                        ? colors.primary || '#007AFF'
                        : colors.surfaceMuted || '#E5E5EA',
                  },
                ]}
                onPress={handleSend}
                disabled={!inputText.trim() || isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color={colors.onPrimary || '#FFFFFF'} />
                ) : (
                  <Ionicons
                    name="send"
                    size={20}
                    color={
                      inputText.trim() && !isLoading
                        ? colors.onPrimary || '#FFFFFF'
                        : colors.textTertiary || '#8E8E93'
                    }
                  />
                )}
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            {renderLabResults()}
            {/* Lab Results Input */}
            <View style={[styles.inputContainer, { backgroundColor: colors.surface || '#FFFFFF', borderTopColor: colors.border || '#E5E5EA' }]}>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.inputBackground || '#F2F2F7',
                    color: colors.text || '#000000',
                    borderColor: colors.border || '#E5E5EA',
                  },
                ]}
                placeholder={t('aiAssistant.labResults.placeholder') || 'Paste your lab results text here...'}
                placeholderTextColor={colors.textTertiary || '#8E8E93'}
                value={labText}
                onChangeText={setLabText}
                multiline
                maxLength={2000}
                editable={!isLoading}
                returnKeyType="done"
              />
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  {
                    backgroundColor:
                      labText.trim() && !isLoading
                        ? colors.primary || '#007AFF'
                        : colors.surfaceMuted || '#E5E5EA',
                  },
                ]}
                onPress={handleAnalyzeLabResults}
                disabled={!labText.trim() || isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color={colors.onPrimary || '#FFFFFF'} />
                ) : (
                  <Ionicons
                    name="analytics"
                    size={20}
                    color={
                      labText.trim() && !isLoading
                        ? colors.onPrimary || '#FFFFFF'
                        : colors.textTertiary || '#8E8E93'
                    }
                  />
                )}
              </TouchableOpacity>
            </View>
          </>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardView: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
    opacity: 0.7,
  },
  messageContainer: {
    marginBottom: 12,
    flexDirection: 'row',
  },
  userMessageContainer: {
    justifyContent: 'flex-end',
  },
  assistantMessageContainer: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 18,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    gap: 8,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    fontSize: 16,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    paddingHorizontal: 16,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    gap: 6,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  labResultsContainer: {
    flex: 1,
  },
  labResultsContent: {
    padding: 16,
    paddingBottom: 8,
  },
  labSection: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  labSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  labSectionText: {
    fontSize: 16,
    lineHeight: 24,
  },
  labMetricsContainer: {
    marginBottom: 16,
  },
  labMetricCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
  },
  labMetricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  labMetricName: {
    fontSize: 16,
    fontWeight: '600',
  },
  labMetricBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  labMetricBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  labMetricValue: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  labMetricComment: {
    fontSize: 14,
    lineHeight: 20,
  },
  labDisclaimer: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 8,
    gap: 8,
    marginTop: 8,
  },
  labDisclaimerText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
  },
});

