import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Animated,
  Alert,
  TextInput,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import ApiService from '../services/apiService';

const { width, height } = Dimensions.get('window');

const OnboardingScreen = ({ navigation }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    age: 25,
    height: 170, // cm
    weight: 70, // kg
    gender: '',
    activityLevel: '',
    goal: '',
    targetWeight: 70,
  });

  const scrollViewRef = useRef(null);
  // Simplify animations to avoid blank-step issues on some devices
  const slideAnimation = useRef(new Animated.Value(0)).current;
  const fadeAnimation = useRef(new Animated.Value(1)).current;
  const heightAnimation = useRef(new Animated.Value(170)).current;
  const weightAnimation = useRef(new Animated.Value(70)).current;
  const ageAnimation = useRef(new Animated.Value(25)).current;

  const steps = [
    { id: 'welcome', title: 'Welcome to CalorieCam' },
    { id: 'personal', title: 'Personal Information' },
    { id: 'physical', title: 'Physical Stats' },
    { id: 'activity', title: 'Activity Level' },
    { id: 'goals', title: 'Your Goals' },
    { id: 'plan', title: 'Choose Your Plan' },
  ];

  const genders = [
    { id: 'male', label: 'Male', icon: 'male' },
    { id: 'female', label: 'Female', icon: 'female' },
    { id: 'other', label: 'Other', icon: 'person' },
  ];

  const activityLevels = [
    { id: 'sedentary', label: 'Sedentary', description: 'Little to no exercise' },
    { id: 'lightly_active', label: 'Lightly Active', description: 'Light exercise 1-3 days/week' },
    { id: 'moderately_active', label: 'Moderately Active', description: 'Moderate exercise 3-5 days/week' },
    { id: 'very_active', label: 'Very Active', description: 'Heavy exercise 6-7 days/week' },
    { id: 'extremely_active', label: 'Extremely Active', description: 'Very heavy exercise, physical job' },
  ];

  const goals = [
    { id: 'lose_weight', label: 'Lose Weight', icon: 'trending-down' },
    { id: 'maintain_weight', label: 'Maintain Weight', icon: 'remove' },
    { id: 'gain_weight', label: 'Gain Weight', icon: 'trending-up' },
  ];

  const plans = [
    {
      id: 'free',
      name: 'Free Plan',
      price: '$0',
      features: ['Basic food analysis', 'Daily calorie tracking', 'Basic statistics'],
      popular: false,
    },
    {
      id: 'premium',
      name: 'Premium Plan',
      price: '$9.99/month',
      features: ['Advanced AI analysis', 'Personalized recommendations', 'Health insights', 'Priority support'],
      popular: true,
    },
  ];

  // Synchronize animations with profile data
  useEffect(() => {
    Animated.parallel([
      Animated.timing(heightAnimation, {
        toValue: profileData.height,
        duration: 300,
        useNativeDriver: false,
      }),
      Animated.timing(weightAnimation, {
        toValue: profileData.weight,
        duration: 300,
        useNativeDriver: false,
      }),
      Animated.timing(ageAnimation, {
        toValue: profileData.age,
        duration: 300,
        useNativeDriver: false,
      }),
    ]).start();
  }, [profileData.height, profileData.weight, profileData.age]);

  const nextStep = () => {
    // Валидация для каждого шага
    if (currentStep === 1) { // Personal step
      if (!profileData.firstName.trim() || !profileData.lastName.trim()) {
        Alert.alert('Required Fields', 'Please enter your first and last name.');
        return;
      }
    } else if (currentStep === 2) { // Physical step
      if (!profileData.gender) {
        Alert.alert('Required Field', 'Please select your gender.');
        return;
      }
    } else if (currentStep === 3) { // Activity step
      if (!profileData.activityLevel) {
        Alert.alert('Required Field', 'Please select your activity level.');
        return;
      }
    } else if (currentStep === 4) { // Goals step
      if (!profileData.goal) {
        Alert.alert('Required Field', 'Please select your goal.');
        return;
      }
    }

    if (currentStep < steps.length - 1) {
      const nextStepIndex = currentStep + 1;
      setCurrentStep(nextStepIndex);
      scrollViewRef.current?.scrollTo({ x: nextStepIndex * width, animated: true });
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      const prevStepIndex = currentStep - 1;
      setCurrentStep(prevStepIndex);
      scrollViewRef.current?.scrollTo({ x: prevStepIndex * width, animated: true });
    }
  };

  const handleComplete = async () => {
    try {
      // Проверяем, есть ли уже профиль
      try {
        await ApiService.getUserProfile();
        // Если профиль существует, обновляем его
        await ApiService.updateUserProfile(profileData);
      } catch (error) {
        // Если профиля нет, создаем новый
        await ApiService.createUserProfile(profileData);
      }
      
      await ApiService.completeOnboarding();
      navigation.replace('MainTabs');
    } catch (error) {
      console.error('Onboarding error:', error);
      // Показываем предупреждение, но все равно переходим к главному экрану
      Alert.alert(
        'Setup Complete', 
        'Profile saved locally. You can complete setup later in settings.',
        [{ text: 'OK', onPress: () => navigation.replace('MainTabs') }]
      );
    }
  };

  // Interactive Slider Component (native Slider only)
  const InteractiveSlider = ({ 
    value, 
    minimumValue, 
    maximumValue, 
    onValueChange, 
    unit, 
    step = 1,
    animatedValue 
  }) => {
    // Ensure value is within bounds
    const clampedValue = Math.max(minimumValue, Math.min(maximumValue, value));
    const [tempValue, setTempValue] = useState(clampedValue);
    useEffect(() => {
      const newValue = Math.max(minimumValue, Math.min(maximumValue, value));
      if (Math.abs(newValue - tempValue) > 0.1) { // Only update if significant change
        setTempValue(newValue);
      }
    }, [value, minimumValue, maximumValue]);
    return (
      <View style={styles.interactiveSliderContainer}>
        <Animated.Text style={styles.sliderValue}>
          {Math.round(tempValue)}{unit}
        </Animated.Text>
        
        <View style={styles.gestureSliderContainer}>
          <Slider
            style={styles.slider}
            minimumValue={minimumValue}
            maximumValue={maximumValue}
            value={tempValue}
            step={step}
            onValueChange={(v) => setTempValue(v)}
            onSlidingComplete={(v) => onValueChange(v)}
            minimumTrackTintColor="#007AFF"
            maximumTrackTintColor="#E5E5E7"
            thumbStyle={styles.sliderThumb}
          />
          
          <View style={styles.sliderIndicators}>
            <Text style={styles.sliderIndicatorText}>{minimumValue}{unit}</Text>
            <Text style={styles.sliderIndicatorText}>{maximumValue}{unit}</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderWelcomeStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.welcomeContent}>
        <View style={styles.logoContainer}>
          <Ionicons name="camera" size={80} color="#007AFF" />
        </View>
        <Text style={styles.welcomeTitle}>Welcome to CalorieCam</Text>
        <Text style={styles.welcomeSubtitle}>
          Your AI-powered nutrition companion. Let's personalize your experience!
        </Text>
        <View style={styles.featuresList}>
          <View style={styles.featureItem}>
            <Ionicons name="camera" size={24} color="#007AFF" />
            <Text style={styles.featureText}>AI Food Analysis</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="analytics" size={24} color="#007AFF" />
            <Text style={styles.featureText}>Smart Tracking</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="heart" size={24} color="#007AFF" />
            <Text style={styles.featureText}>Health Insights</Text>
          </View>
        </View>
      </View>
    </View>
  );

  const renderPersonalStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Tell us about yourself</Text>
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>First Name</Text>
        <TextInput
          style={styles.textInput}
          value={profileData.firstName}
          onChangeText={(text) => setProfileData({ ...profileData, firstName: text })}
          placeholder="Enter your first name"
          placeholderTextColor="#8E8E93"
        />
      </View>
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Last Name</Text>
        <TextInput
          style={styles.textInput}
          value={profileData.lastName}
          onChangeText={(text) => setProfileData({ ...profileData, lastName: text })}
          placeholder="Enter your last name"
          placeholderTextColor="#8E8E93"
        />
      </View>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Age</Text>
            <InteractiveSlider
              value={profileData.age}
              minimumValue={16}
              maximumValue={100}
              onValueChange={(value) => setProfileData({ ...profileData, age: Math.round(value) })}
              unit=" years"
              step={1}
              animatedValue={ageAnimation}
            />
          </View>
    </View>
  );

  const renderPhysicalStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Your physical stats</Text>
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Height</Text>
        <InteractiveSlider
          value={profileData.height}
          minimumValue={120}
          maximumValue={220}
          onValueChange={(value) => setProfileData({ ...profileData, height: Math.round(value) })}
          unit=" cm"
          step={1}
          animatedValue={heightAnimation}
        />
      </View>
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Weight</Text>
        <InteractiveSlider
          value={profileData.weight}
          minimumValue={30}
          maximumValue={200}
          onValueChange={(value) => setProfileData({ ...profileData, weight: Math.round(value) })}
          unit=" kg"
          step={0.5}
          animatedValue={weightAnimation}
        />
      </View>
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Gender</Text>
        <View style={styles.optionsContainer}>
          {genders.map((gender) => (
            <TouchableOpacity
              key={gender.id}
              style={[
                styles.optionButton,
                profileData.gender === gender.id && styles.optionButtonSelected,
              ]}
              onPress={() => setProfileData({ ...profileData, gender: gender.id })}
            >
              <Ionicons
                name={gender.icon}
                size={24}
                color={profileData.gender === gender.id ? '#FFFFFF' : '#007AFF'}
              />
              <Text
                style={[
                  styles.optionText,
                  profileData.gender === gender.id && styles.optionTextSelected,
                ]}
              >
                {gender.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );

  const renderActivityStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>How active are you?</Text>
      <View style={styles.activityContainer}>
        {activityLevels.map((level) => (
          <TouchableOpacity
            key={level.id}
            style={[
              styles.activityButton,
              profileData.activityLevel === level.id && styles.activityButtonSelected,
            ]}
            onPress={() => setProfileData({ ...profileData, activityLevel: level.id })}
          >
            <Text
              style={[
                styles.activityLabel,
                profileData.activityLevel === level.id && styles.activityLabelSelected,
              ]}
            >
              {level.label}
            </Text>
            <Text
              style={[
                styles.activityDescription,
                profileData.activityLevel === level.id && styles.activityDescriptionSelected,
              ]}
            >
              {level.description}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderGoalsStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>What's your goal?</Text>
      <View style={styles.goalsContainer}>
        {goals.map((goal) => (
          <TouchableOpacity
            key={goal.id}
            style={[
              styles.goalButton,
              profileData.goal === goal.id && styles.goalButtonSelected,
            ]}
            onPress={() => setProfileData({ ...profileData, goal: goal.id })}
          >
            <Ionicons
              name={goal.icon}
              size={32}
              color={profileData.goal === goal.id ? '#FFFFFF' : '#007AFF'}
            />
            <Text
              style={[
                styles.goalText,
                profileData.goal === goal.id && styles.goalTextSelected,
              ]}
            >
              {goal.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderPlanStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Choose your plan</Text>
      <View style={styles.plansContainer}>
        {plans.map((plan) => (
          <TouchableOpacity
            key={plan.id}
            style={[
              styles.planButton,
              plan.popular && styles.planButtonPopular,
            ]}
            onPress={() => setProfileData({ ...profileData, selectedPlan: plan.id })}
          >
            {plan.popular && (
              <View style={styles.popularBadge}>
                <Text style={styles.popularText}>Most Popular</Text>
              </View>
            )}
            <Text style={styles.planName}>{plan.name}</Text>
            <Text style={styles.planPrice}>{plan.price}</Text>
            <View style={styles.planFeatures}>
              {plan.features.map((feature, index) => (
                <Text key={index} style={styles.planFeature}>• {feature}</Text>
              ))}
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return renderWelcomeStep();
      case 1:
        return renderPersonalStep();
      case 2:
        return renderPhysicalStep();
      case 3:
        return renderActivityStep();
      case 4:
        return renderGoalsStep();
      case 5:
        return renderPlanStep();
      default:
        return renderWelcomeStep();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${((currentStep + 1) / steps.length) * 100}%` },
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            {currentStep + 1} of {steps.length}
          </Text>
        </View>
      </View>

      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
        style={styles.scrollView}
      >
        {steps.map((_, index) => (
          <View key={index} style={styles.stepWrapper}>
            {index === currentStep && renderStep()}
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.buttonContainer}>
          {currentStep > 0 && (
            <TouchableOpacity style={styles.backButton} onPress={prevStep}>
              <Ionicons name="chevron-back" size={24} color="#007AFF" />
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            style={[
              styles.nextButton,
              currentStep === steps.length - 1 && styles.completeButton,
            ]}
            onPress={currentStep === steps.length - 1 ? handleComplete : nextStep}
          >
            <Text style={styles.nextButtonText}>
              {currentStep === steps.length - 1 ? 'Complete Setup' : 'Next'}
            </Text>
            <Ionicons
              name={currentStep === steps.length - 1 ? 'checkmark' : 'chevron-forward'}
              size={24}
              color="#FFFFFF"
            />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  progressContainer: {
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: '#E5E5E7',
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 14,
    color: '#8E8E93',
  },
  scrollView: {
    flex: 1,
  },
  stepWrapper: {
    width: width,
    flex: 1,
  },
  stepContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1C1C1E',
    textAlign: 'center',
    marginBottom: 40,
  },
  welcomeContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  welcomeTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1C1C1E',
    textAlign: 'center',
    marginBottom: 16,
  },
  welcomeSubtitle: {
    fontSize: 18,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
  },
  featuresList: {
    width: '100%',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
  },
  featureText: {
    fontSize: 16,
    color: '#1C1C1E',
    marginLeft: 16,
  },
  inputGroup: {
    marginBottom: 30,
  },
  inputLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 12,
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E5E7',
    fontSize: 16,
    color: '#1C1C1E',
  },
  textInputValue: {
    fontSize: 16,
    color: '#1C1C1E',
  },
  sliderContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  sliderValue: {
    fontSize: 24,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 16,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderThumb: {
    backgroundColor: '#007AFF',
    width: 20,
    height: 20,
  },
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  optionButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginHorizontal: 8,
    borderWidth: 2,
    borderColor: '#E5E5E7',
  },
  optionButtonSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  optionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
    marginTop: 8,
  },
  optionTextSelected: {
    color: '#FFFFFF',
  },
  activityContainer: {
    gap: 12,
  },
  activityButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    borderWidth: 2,
    borderColor: '#E5E5E7',
  },
  activityButtonSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  activityLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  activityLabelSelected: {
    color: '#FFFFFF',
  },
  activityDescription: {
    fontSize: 14,
    color: '#8E8E93',
  },
  activityDescriptionSelected: {
    color: '#E3F2FD',
  },
  goalsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  goalButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginHorizontal: 8,
    borderWidth: 2,
    borderColor: '#E5E5E7',
  },
  goalButtonSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  goalText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
    marginTop: 12,
  },
  goalTextSelected: {
    color: '#FFFFFF',
  },
  plansContainer: {
    gap: 16,
  },
  planButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    borderWidth: 2,
    borderColor: '#E5E5E7',
    position: 'relative',
  },
  planButtonPopular: {
    borderColor: '#007AFF',
  },
  popularBadge: {
    position: 'absolute',
    top: -8,
    right: 20,
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  planName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  planPrice: {
    fontSize: 24,
    fontWeight: '700',
    color: '#007AFF',
    marginBottom: 16,
  },
  planFeatures: {
    gap: 8,
  },
  planFeature: {
    fontSize: 14,
    color: '#8E8E93',
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  backButtonText: {
    fontSize: 16,
    color: '#007AFF',
    marginLeft: 4,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  completeButton: {
    backgroundColor: '#34C759',
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginRight: 8,
  },
  // Interactive Slider Styles
  interactiveSliderContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#007AFF',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  gestureSliderContainer: {
    width: '100%',
    alignItems: 'center',
  },
  sliderIndicators: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 8,
  },
  sliderIndicatorText: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '500',
  },
});

export default OnboardingScreen;
