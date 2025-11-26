import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SwipeClosableModal } from './common/SwipeClosableModal';

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  onCameraPress: () => void;
  onGalleryPress: () => void;
  onDescribePress: () => void;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  visible,
  onClose,
  onCameraPress,
  onGalleryPress,
  onDescribePress
}) => {
  return (
    <SwipeClosableModal
      visible={visible}
      onClose={onClose}
      swipeDirection="down"
      enableSwipe={true}
      enableBackdropClose={true}
      animationType="fade"
    >
      <View style={styles.content}>
        <Text style={styles.title}>Add Food</Text>
        
        <View style={styles.options}>
          <TouchableOpacity style={styles.option} onPress={onCameraPress}>
            <View style={styles.optionIcon}>
              <Ionicons name="camera" size={24} color="#3498DB" />
            </View>
            <Text style={styles.optionText}>Camera</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.option} onPress={onGalleryPress}>
            <View style={styles.optionIcon}>
              <Ionicons name="images" size={24} color="#3498DB" />
            </View>
            <Text style={styles.optionText}>Gallery</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.option} onPress={onDescribePress}>
            <View style={styles.optionIcon}>
              <Ionicons name="create" size={24} color="#3498DB" />
            </View>
            <Text style={styles.optionText}>Describe Food</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SwipeClosableModal>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50',
    textAlign: 'center',
    marginBottom: 30,
  },
  options: {
    gap: 20,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E8F4FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  optionText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C3E50',
  },
});
