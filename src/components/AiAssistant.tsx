// AI Assistant with safe error handling
// Wrapped in ErrorBoundary to prevent crashes

import React, { useEffect, useState, Suspense } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { clientLog } from '../utils/clientLog';
import { ErrorBoundary } from './ErrorBoundary';
import { useI18n } from '../../app/i18n/hooks';
import { useTheme } from '../contexts/ThemeContext';
import { RealAiAssistant } from './RealAiAssistant';

interface AiAssistantProps {
  visible: boolean;
  onClose: () => void;
}

// Safe fallback component
const AiAssistantFallback: React.FC<{ onClose: () => void; t: (key: string) => string }> = ({ onClose, t }) => {
  const { colors } = useTheme();
  
  return (
    <View style={styles.fallbackContent}>
      <View style={styles.iconContainer}>
        <Ionicons name="chatbubbles" size={64} color={colors.primary || '#007AFF'} />
      </View>
      
      <Text style={[styles.mainTitle, { color: colors.text }]}>
        {t('aiAssistant.unavailable') || 'AI Assistant temporarily unavailable'}
      </Text>
      
      <Text style={[styles.description, { color: colors.textSecondary }]}>
        {t('aiAssistant.unavailableDescription') || 
          'We are testing the first version of the app. The assistant section is temporarily disabled, but everything else is working.'}
      </Text>
      
      <TouchableOpacity 
        style={[styles.closeButtonLarge, { backgroundColor: colors.primary || '#007AFF' }]}
        onPress={onClose}
      >
        <Text style={[styles.closeButtonText, { color: colors.onPrimary || '#FFFFFF' }]}>
          {t('common.close') || 'Close'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

// Main component with error boundary
const AiAssistantContent: React.FC<AiAssistantProps> = ({ visible, onClose }) => {
  const { t } = useI18n();
  const { colors } = useTheme();
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (visible) {
      clientLog('AiAssistant:opened').catch(() => {});
      setHasError(false);
    }
  }, [visible]);

  useEffect(() => {
    if (visible) {
      // Try to initialize AI Assistant
      clientLog('AiAssistant:initializing').catch(() => {});
      
      // Future: Load real AI Assistant implementation here
      // For now, just show fallback
      
      clientLog('AiAssistant:ready').catch(() => {});
    }
  }, [visible]);

  if (!visible) {
    return null;
  }

  const handleClose = async () => {
    await clientLog('AiAssistant:closed').catch(() => {});
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: colors.surface || '#FFFFFF' }]}>
        <View style={[styles.header, { borderBottomColor: colors.border || '#E5E5EA' }]}>
          <Text style={[styles.title, { color: colors.text }]}>
            {t('dashboard.aiAssistant') || 'AI Assistant'}
          </Text>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={colors.text || '#000'} />
          </TouchableOpacity>
        </View>
        
        <ErrorBoundary>
          {hasError ? (
            <AiAssistantFallback onClose={handleClose} t={t} />
          ) : (
            <Suspense fallback={
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary || '#007AFF'} />
                <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                  {t('common.loading') || 'Loading...'}
                </Text>
              </View>
            }>
              <RealAiAssistant onClose={handleClose} />
            </Suspense>
          )}
        </ErrorBoundary>
      </SafeAreaView>
    </Modal>
  );
};

const AiAssistant: React.FC<AiAssistantProps> = (props) => {
  return <AiAssistantContent {...props} />;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  closeButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  fallbackContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  iconContainer: {
    marginBottom: 24,
  },
  mainTitle: {
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 12,
    color: '#000000',
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.7,
    color: '#000000',
    lineHeight: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  closeButtonLarge: {
    marginTop: 24,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AiAssistant;
