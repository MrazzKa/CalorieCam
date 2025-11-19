import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface FeedbackScreenProps {
  onClose: () => void;
}

export const FeedbackScreen: React.FC<FeedbackScreenProps> = ({ onClose }) => {
  const [feedback, setFeedback] = useState('');
  const [rating, setRating] = useState(0);
  const [category, setCategory] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = [
    { id: 'bug', label: 'Bug Report', icon: 'bug' },
    { id: 'feature', label: 'Feature Request', icon: 'bulb' },
    { id: 'ui', label: 'UI/UX Issue', icon: 'design' },
    { id: 'performance', label: 'Performance', icon: 'speedometer' },
    { id: 'other', label: 'Other', icon: 'chatbubble' },
  ];

  const handleSubmit = async () => {
    if (!feedback.trim()) {
      Alert.alert('Error', 'Please enter your feedback');
      return;
    }

    if (!category) {
      Alert.alert('Error', 'Please select a category');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      Alert.alert(
        'Thank you!',
        'Your feedback has been submitted successfully',
        [{ text: 'OK', onPress: () => onClose && typeof onClose === 'function' ? onClose() : null }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStars = () => {
    return Array.from({ length: 5 }, (_, index) => (
      <TouchableOpacity
        key={index}
        onPress={() => setRating(index + 1)}
        style={styles.star}
      >
        <Ionicons
          name={index < rating ? 'star' : 'star-outline'}
          size={24}
          color={index < rating ? '#F39C12' : '#BDC3C7'}
        />
      </TouchableOpacity>
    ));
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Ionicons name="close" size={24} color="#2C3E50" />
        </TouchableOpacity>
        <Text style={styles.title}>Send Feedback</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How would you rate your experience?</Text>
          <View style={styles.ratingContainer}>
            {renderStars()}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Category</Text>
          <View style={styles.categoriesContainer}>
            {(categories || []).map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.categoryButton,
                  category === cat.id && styles.selectedCategoryButton,
                ]}
                onPress={() => setCategory(cat.id)}
              >
                <Ionicons
                  name={cat.icon as any}
                  size={20}
                  color={category === cat.id ? '#3498DB' : '#7F8C8D'}
                />
                <Text
                  style={[
                    styles.categoryText,
                    category === cat.id && styles.selectedCategoryText,
                  ]}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Feedback</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Tell us what you think..."
            placeholderTextColor="#BDC3C7"
            value={feedback}
            onChangeText={setFeedback}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
          />
        </View>

        <TouchableOpacity
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <Ionicons name="hourglass" size={20} color="white" />
          ) : (
            <Ionicons name="send" size={20} color="white" />
          )}
          <Text style={styles.submitButtonText}>
            {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  closeButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  placeholder: {
    width: 40,
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 12,
  },
  ratingContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  star: {
    padding: 4,
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    backgroundColor: '#F8F9FA',
    gap: 6,
  },
  selectedCategoryButton: {
    backgroundColor: '#E3F2FD',
    borderColor: '#3498DB',
  },
  categoryText: {
    fontSize: 12,
    color: '#7F8C8D',
    fontWeight: '500',
  },
  selectedCategoryText: {
    color: '#3498DB',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E9ECEF',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#2C3E50',
    backgroundColor: '#F8F9FA',
    minHeight: 120,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3498DB',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    marginTop: 20,
  },
  submitButtonDisabled: {
    backgroundColor: '#BDC3C7',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
