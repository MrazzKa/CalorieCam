// TEMPORARY SAFE STUB: Simple AiAssistant to prevent crashes
// Real implementation moved to RealAiAssistant.tsx for debugging
// This stub will be replaced once the real component is fixed

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { clientLog } from '../utils/clientLog';

interface AiAssistantProps {
  visible: boolean;
  onClose: () => void;
}

const AiAssistant: React.FC<AiAssistantProps> = ({ visible, onClose }) => {
  useEffect(() => {
    if (visible) {
      clientLog('AiAssistant:opened').catch(() => {});
    }
  }, [visible]);

  if (!visible) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>AI-ассистент</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#000" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Ionicons name="chatbubbles" size={64} color="#007AFF" />
          </View>
          
          <Text style={styles.mainTitle}>
            AI-ассистент скоро будет доступен
          </Text>
          
          <Text style={styles.description}>
            Тестируем первую версию приложения. Сейчас раздел ассистента временно отключён,
            но всё остальное уже работает.
          </Text>
        </View>
      </SafeAreaView>
    </Modal>
  );
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
});

export default AiAssistant;
