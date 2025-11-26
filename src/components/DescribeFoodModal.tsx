import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SwipeClosableModal } from './common/SwipeClosableModal';

interface DescribeFoodModalProps {
  visible: boolean;
  onClose: () => void;
  onAnalyze: (description: string) => void;
}

export const DescribeFoodModal: React.FC<DescribeFoodModalProps> = ({ visible, onClose, onAnalyze }) => {
  const [description, setDescription] = useState('');

  const handleAnalyze = () => {
    if (description.trim()) {
      if (onAnalyze && typeof onAnalyze === 'function') {
        onAnalyze(description.trim());
      }
      setDescription('');
      if (onClose && typeof onClose === 'function') {
        onClose();
      }
    }
  };

  return (
    <SwipeClosableModal
      visible={visible}
      onClose={onClose}
      swipeDirection="down"
      enableSwipe={true}
      enableBackdropClose={true}
      animationType="slide"
    >
      <View style={styles.content}>
        <Text style={styles.title}>Describe Your Food</Text>
        <Text style={styles.subtitle}>Tell us what you ate and we&apos;ll analyze it</Text>
        
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            placeholder="e.g., Grilled chicken breast with rice and vegetables"
            placeholderTextColor="#95A5A6"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>
        
        <TouchableOpacity 
          style={[styles.analyzeButton, !description.trim() && styles.analyzeButtonDisabled]} 
          onPress={handleAnalyze}
          disabled={!description.trim()}
        >
          <Ionicons name="sparkles" size={20} color="white" />
          <Text style={styles.analyzeButtonText}>Analyze</Text>
        </TouchableOpacity>
      </View>
    </SwipeClosableModal>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C3E50',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#7F8C8D',
    textAlign: 'center',
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 24,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#2C3E50',
    backgroundColor: '#F8F9FA',
    minHeight: 100,
  },
  analyzeButton: {
    backgroundColor: '#3498DB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  analyzeButtonDisabled: {
    backgroundColor: '#BDC3C7',
  },
  analyzeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
