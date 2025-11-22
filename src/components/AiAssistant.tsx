import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useI18n } from '../../app/i18n/hooks';
import ApiService from '../services/apiService';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { MotiView, useReducedMotion } from 'moti';

const FLOW_IDS = ['injury_triage', 'nutrition_goal_setup', 'hydration_check'] as const;

type FlowId = typeof FLOW_IDS[number];

interface FlowCard {
  id: FlowId;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const FLOW_CARDS: FlowCard[] = [
  { id: 'injury_triage', title: 'assistant.flow.injury.title', description: 'assistant.flow.injury.desc', icon: 'medkit' },
  { id: 'nutrition_goal_setup', title: 'assistant.flow.nutrition.title', description: 'assistant.flow.nutrition.desc', icon: 'restaurant' },
  { id: 'hydration_check', title: 'assistant.flow.hydration.title', description: 'assistant.flow.hydration.desc', icon: 'water' },
];

const AiAssistant = ({ visible, onClose }) => {
  const { t } = useI18n();
  const { user } = useAuth();
  const { tokens } = useTheme();
  const styles = useMemo(() => createStyles(tokens), [tokens]);
  const reduceMotion = useReducedMotion();
  const userId = user?.id;

  const [flows, setFlows] = useState<FlowCard[]>(FLOW_CARDS);
  const [currentFlow, setCurrentFlow] = useState<FlowId | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [step, setStep] = useState<any>(null);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [summary, setSummary] = useState<string | null>(null);
  const [complete, setComplete] = useState(false);

  const fetchFlows = useCallback(async () => {
    try {
      const result = await ApiService.listAssistantFlows();
      if (Array.isArray(result)) {
        setFlows(
          result.map((f) => FLOW_CARDS.find((card) => card.id === f.id) || {
            id: f.id,
            title: f.title,
            description: f.description,
            icon: 'chatbubbles',
          }),
        );
      }
    } catch (error) {
      console.warn('Failed to load assistant flows', error);
    }
  }, []);

  const fetchHistory = useCallback(async () => {
    if (!userId) return;
    try {
      const result = await ApiService.getConversationHistory(userId, 10);
      setHistory(result || []);
    } catch (error) {
      console.warn('Failed to load assistant history', error);
    }
  }, [userId]);

  useEffect(() => {
    if (visible) {
      void fetchFlows();
      void fetchHistory();
      setCurrentFlow(null);
      setSessionId(null);
      setStep(null);
      setSummary(null);
      setComplete(false);
    }
  }, [visible, fetchFlows, fetchHistory]);

  const startFlow = async (flowId: FlowId) => {
    if (!userId) return;
    setLoading(true);
    try {
      const response = await ApiService.startAssistantSession(flowId, userId, true);
      setCurrentFlow(flowId);
      setSessionId(response.sessionId || null);
      setStep(response.step);
      setSummary(response.summary || null);
      setComplete(response.complete);
      setInput('');
    } catch (error) {
      console.error('Failed to start flow', error);
    } finally {
      setLoading(false);
    }
  };

  const sendFlowStep = async (value: string) => {
    if (!userId || !currentFlow || loading) {
      return;
    }
    const message = value.trim() || input.trim();
    if (!message) {
      return;
    }
    setLoading(true);
    try {
      let activeSessionId = sessionId;
      if (!activeSessionId) {
        const startResponse = await ApiService.startAssistantSession(currentFlow, userId, true);
        activeSessionId = startResponse.sessionId;
        setSessionId(activeSessionId || null);
        setStep(startResponse.step);
        setSummary(startResponse.summary || null);
        setComplete(startResponse.complete);
        if (startResponse.complete) {
          await fetchHistory();
          setLoading(false);
          return;
        }
      }

      const response = await ApiService.sendAssistantSessionStep(activeSessionId!, userId, message);
      setStep(response.step);
      setSummary(response.summary || null);
      setComplete(response.complete);
      setSessionId(response.complete ? null : response.sessionId || activeSessionId);
      setInput('');
      if (response.complete && response.summary) {
        await fetchHistory();
      }
    } catch (error) {
      console.error('Failed to submit flow step', error);
    } finally {
      setLoading(false);
    }
  };

  const cancelFlow = async () => {
    if (!userId || !currentFlow) {
      setCurrentFlow(null);
      setStep(null);
      setSummary(null);
      return;
    }
    try {
      if (sessionId) {
        await ApiService.cancelAssistantSession(sessionId, userId);
      }
    } catch (error) {
      console.warn('Cancel flow failed', error);
    } finally {
      setCurrentFlow(null);
      setSessionId(null);
      setStep(null);
      setSummary(null);
    }
  };

  const renderQuickReplies = (suggestions?: string[]) => {
    if (!suggestions || suggestions.length === 0) {
      return null;
    }
    return (
      <View style={styles.quickReplies}>
        {(suggestions || []).map((reply) => (
          <TouchableOpacity
            key={reply}
            style={styles.quickReplyButton}
            onPress={() => sendFlowStep(reply)}
          >
            <Text style={styles.quickReplyText}>{reply}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderSummary = () => {
    if (!summary) {
      return null;
    }
    return (
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>{t('assistant.summaryTitle')}</Text>
        <Text style={styles.summaryBody}>{summary}</Text>
        <TouchableOpacity style={styles.summaryDone} onPress={cancelFlow}>
          <Text style={styles.summaryDoneText}>{t('assistant.done')}</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderFlowStep = () => {
    if (!step || complete) {
      return renderSummary();
    }
    return (
      <View style={styles.stepCard}>
        <Text style={styles.stepPrompt}>{step.prompt}</Text>
        {renderQuickReplies(step.suggestions || step.quickReplies)}
        <TextInput
          style={styles.stepInput}
          value={input}
          onChangeText={setInput}
          placeholder={t('assistant.inputPlaceholder')}
          placeholderTextColor={tokens.colors.textSubdued}
          multiline
        />
        <TouchableOpacity
          style={[styles.primaryButton, (!input.trim() || loading) && styles.primaryButtonDisabled]}
          onPress={() => sendFlowStep(input)}
          disabled={!input.trim() || loading}
        >
          {loading ? (
            <ActivityIndicator color={tokens.states.primary.on} />
          ) : (
            <Text style={styles.primaryButtonText}>{t('assistant.next')}</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton} onPress={cancelFlow}>
          <Text style={styles.secondaryButtonText}>{t('assistant.cancel')}</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderFlowPicker = () => (
    <View style={styles.flowList}>
      <Text style={styles.sectionTitle}>{t('assistant.chooseFlow')}</Text>
      {(flows || []).map((flow, index) => (
        <MotiView
          key={flow.id}
          from={reduceMotion ? undefined : { opacity: 0, translateY: 12 }}
          animate={reduceMotion ? undefined : { opacity: 1, translateY: 0 }}
          transition={{ delay: reduceMotion ? 0 : index * 60, type: 'timing', duration: 260 }}
        >
          <TouchableOpacity style={styles.flowCard} onPress={() => startFlow(flow.id as FlowId)}>
            <View style={styles.flowIconWrapper}>
              <Ionicons name={flow.icon} size={24} color={tokens.colors.primary} />
            </View>
            <View style={styles.flowContent}>
              <Text style={styles.flowTitle}>{t(flow.title)}</Text>
              <Text style={styles.flowDescription}>{t(flow.description)}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={tokens.colors.textSubdued} />
          </TouchableOpacity>
        </MotiView>
      ))}
      <View style={styles.divider} />
      <Text style={styles.sectionTitle}>{t('assistant.recentAdvice')}</Text>
      <ScrollView style={styles.historyList}>
        {history.length === 0 ? (
          <Text style={styles.emptyHistory}>{t('assistant.historyEmpty')}</Text>
        ) : (
          (history || []).map((item) => (
            <View key={item.id} style={styles.historyItem}>
              <Text style={styles.historyAnswer}>{item.answer}</Text>
              <Text style={styles.historyDate}>{new Date(item.createdAt).toLocaleString()}</Text>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={() => onClose && typeof onClose === 'function' ? onClose() : null}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t('assistant.title')}</Text>
          <TouchableOpacity onPress={() => onClose && typeof onClose === 'function' ? onClose() : null}>
            <Ionicons name="close" size={24} color={tokens.colors.textSecondary} />
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {currentFlow ? renderFlowStep() : renderFlowPicker()}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const createStyles = (tokens: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: tokens.colors.background,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: tokens.spacing.xl,
      paddingVertical: tokens.spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: tokens.colors.borderMuted,
      backgroundColor: tokens.states.surface.base ?? tokens.colors.surface,
    },
    headerTitle: {
      fontSize: tokens.typography.headingM.fontSize,
      fontWeight: tokens.typography.headingM.fontWeight,
      color: tokens.colors.textPrimary,
    },
    scrollContent: {
      padding: tokens.spacing.xl,
      gap: tokens.spacing.xl,
    },
    flowList: {
      gap: tokens.spacing.lg,
    },
    flowCard: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: tokens.spacing.lg,
      backgroundColor: tokens.colors.card,
      borderRadius: tokens.radii.lg,
      borderWidth: 1,
      borderColor: tokens.colors.borderMuted,
      gap: tokens.spacing.md,
      ...(tokens.states.cardShadow || tokens.elevations.sm),
    },
    flowIconWrapper: {
      width: 44,
      height: 44,
      borderRadius: tokens.radii.pill,
      backgroundColor: tokens.colors.primaryTint,
      alignItems: 'center',
      justifyContent: 'center',
    },
    flowContent: {
      flex: 1,
      gap: tokens.spacing.xs,
    },
    flowTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: tokens.colors.textPrimary,
    },
    flowDescription: {
      fontSize: 14,
      color: tokens.colors.textSecondary,
    },
    divider: {
      height: 1,
      backgroundColor: tokens.colors.borderMuted,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: tokens.colors.textPrimary,
      marginBottom: tokens.spacing.sm,
    },
    historyList: {
      maxHeight: 240,
    },
    emptyHistory: {
      fontSize: 14,
      color: tokens.colors.textSecondary,
    },
    historyItem: {
      backgroundColor: tokens.colors.card,
      borderRadius: tokens.radii.md,
      padding: tokens.spacing.md,
      marginBottom: tokens.spacing.md,
      borderWidth: 1,
      borderColor: tokens.colors.borderMuted,
      ...(tokens.states.cardShadow || tokens.elevations.xs),
    },
    historyAnswer: {
      fontSize: 14,
      color: tokens.colors.textPrimary,
    },
    historyDate: {
      fontSize: 12,
      color: tokens.colors.textTertiary,
      marginTop: tokens.spacing.xs,
    },
    stepCard: {
      backgroundColor: tokens.colors.card,
      borderRadius: tokens.radii.lg,
      padding: tokens.spacing.xl,
      gap: tokens.spacing.md,
      borderWidth: 1,
      borderColor: tokens.colors.borderMuted,
      ...(tokens.states.cardShadow || tokens.elevations.sm),
    },
    stepPrompt: {
      fontSize: 17,
      fontWeight: '600',
      color: tokens.colors.textPrimary,
    },
    quickReplies: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: tokens.spacing.sm,
    },
    quickReplyButton: {
      paddingHorizontal: tokens.spacing.lg,
      paddingVertical: tokens.spacing.sm,
      borderRadius: tokens.radii.pill,
      backgroundColor: tokens.colors.primaryTint,
      borderWidth: 1,
      borderColor: tokens.colors.primary,
    },
    quickReplyText: {
      color: tokens.colors.primary,
      fontWeight: '500',
    },
    stepInput: {
      minHeight: 90,
      borderWidth: 1,
      borderColor: tokens.colors.borderMuted,
      borderRadius: tokens.radii.md,
      padding: tokens.spacing.md,
      fontSize: 15,
      textAlignVertical: 'top',
      backgroundColor: tokens.colors.inputBackground,
      color: tokens.colors.textPrimary,
    },
    primaryButton: {
      backgroundColor: tokens.states.primary.base,
      borderRadius: tokens.radii.md,
      paddingVertical: tokens.spacing.md,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: tokens.states.primary.border || tokens.states.primary.base,
    },
    primaryButtonDisabled: {
      backgroundColor: tokens.states.primary.disabled,
      borderColor: tokens.states.primary.disabledBorder || tokens.states.primary.disabled,
    },
    primaryButtonText: {
      color: tokens.states.primary.on,
      fontWeight: tokens.typography.bodyStrong.fontWeight,
      fontSize: 16,
    },
    secondaryButton: {
      alignItems: 'center',
      paddingVertical: tokens.spacing.sm,
    },
    secondaryButtonText: {
      color: tokens.colors.primary,
      fontWeight: '500',
    },
    summaryCard: {
      backgroundColor: tokens.colors.card,
      borderRadius: tokens.radii.lg,
      padding: tokens.spacing.xl,
      gap: tokens.spacing.md,
      borderWidth: 1,
      borderColor: tokens.colors.borderMuted,
      ...(tokens.states.cardShadow || tokens.elevations.sm),
    },
    summaryTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: tokens.colors.textPrimary,
    },
    summaryBody: {
      fontSize: 15,
      lineHeight: 22,
      color: tokens.colors.textSecondary,
    },
    summaryDone: {
      alignSelf: 'flex-end',
      backgroundColor: tokens.states.primary.base,
      borderRadius: tokens.radii.md,
      paddingHorizontal: tokens.spacing.lg,
      paddingVertical: tokens.spacing.sm,
    },
    summaryDoneText: {
      color: tokens.states.primary.on,
      fontWeight: '600',
    },
  });

export default AiAssistant;
