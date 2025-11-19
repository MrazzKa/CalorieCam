import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, Animated, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { height } = Dimensions.get('window');

interface DescribeFoodModalProps {
  visible: boolean;
  onClose: () => void;
  onAnalyze: (description: string) => void;
}

export const DescribeFoodModal: React.FC<DescribeFoodModalProps> = ({ visible, onClose, onAnalyze }) => {
  const [description, setDescription] = useState('');
  const slideAnim = useRef(new Animated.Value(height)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: height,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, slideAnim]);

  const handleClose = () => {
    Animated.timing(slideAnim, {
      toValue: height,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      onClose();
    });
  };

  const handleAnalyze = () => {
    if (description.trim()) {
      onAnalyze(description.trim());
      setDescription('');
      handleClose();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} onPress={handleClose} />
        <Animated.View
          style={[
            styles.modal,
            {
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.handle} />
          
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
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  backdrop: {
    flex: 1,
  },
  modal: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 34,
    maxHeight: height * 0.6,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#BDC3C7',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 20,
  },
  content: {
    paddingHorizontal: 24,
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
