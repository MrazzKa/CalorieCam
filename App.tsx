import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { URLS } from './src/config/env';
import { ping } from './src/lib/ping';
import { MainDashboard } from './src/components/MainDashboard';
import { AnalysisFlow } from './src/components/AnalysisFlow';
import { AnalysisResults } from './src/components/AnalysisResults';
import { BottomSheet } from './src/components/BottomSheet';
import { StatisticsModal } from './src/components/StatisticsModal';
import { DescribeFoodModal } from './src/components/DescribeFoodModal';
import { ProfileModal } from './src/components/ProfileModal';

export default function App() {
  const [isTestingAPI, setIsTestingAPI] = useState(false);
  const [currentScreen, setCurrentScreen] = useState<'dashboard' | 'analysis' | 'results'>('dashboard');
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [recentAnalyses, setRecentAnalyses] = useState<any[]>([]);
  const [analysisSource, setAnalysisSource] = useState<'camera' | 'gallery'>('camera');
  const [showBottomSheet, setShowBottomSheet] = useState(false);
  const [showStatistics, setShowStatistics] = useState(false);
  const [showDescribeFood, setShowDescribeFood] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const testAPIConnection = async () => {
    setIsTestingAPI(true);
    try {
      const result = await ping();
      if (result.ok) {
        Alert.alert(
          'API Connected',
          `Server is running!\n\nStatus: ${result.status}\nURL: ${result.url}`,
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'API Error',
          `Server error.\n\nStatus: ${result.status}\nError: ${result.error || 'Unknown error'}`,
          [{ text: 'OK' }]
        );
      }
    } catch (error: any) {
      Alert.alert(
        'Connection Error',
        `Cannot connect to server.\n\nError: ${error.message}`,
        [{ text: 'OK' }]
      );
    } finally {
      setIsTestingAPI(false);
    }
  };

  const handleStartAnalysis = () => {
    setShowBottomSheet(true);
  };

  const handleCameraPress = () => {
    setShowBottomSheet(false);
    setAnalysisSource('camera');
    setCurrentScreen('analysis');
  };

  const handleGalleryPress = () => {
    setShowBottomSheet(false);
    setAnalysisSource('gallery');
    setCurrentScreen('analysis');
  };

  const handleDescribePress = () => {
    setShowBottomSheet(false);
    setShowDescribeFood(true);
  };

  const handleDescribeAnalyze = (description: string) => {
    Alert.alert('Text Analysis', `Analyzing: "${description}"`);
  };

  const handleCloseAnalysis = () => {
    setCurrentScreen('dashboard');
    setAnalysisResult(null);
    setSelectedImage(null);
  };

  const handleAnalysisComplete = (result: any, imageUri: string) => {
    setAnalysisResult(result);
    setSelectedImage(imageUri);
    
    const newAnalysis = {
      id: Date.now().toString(),
      result,
      imageUri,
      timestamp: new Date(),
      dishName: result?.items?.[0]?.label || 'Unknown dish',
      calories: result?.items?.reduce((sum: number, item: any) => sum + (item.kcal || 0), 0) || 0,
    };
    
    setRecentAnalyses((prev: any[]) => [newAnalysis, ...prev.slice(0, 4)]);
    setCurrentScreen('results');
  };

  const handleEditAnalysis = () => {
    Alert.alert('Edit', 'Edit function will be available in the next version');
  };

  const handleShareAnalysis = () => {
    Alert.alert('Share', 'Share function will be available in the next version');
  };

  const handleStatsPress = () => {
    setShowStatistics(true);
  };

  const handleCloseStatistics = () => {
    setShowStatistics(false);
  };

  const handleProfilePress = () => {
    setShowProfile(true);
  };

  const handleCloseProfile = () => {
    setShowProfile(false);
  };

  if (currentScreen === 'analysis') {
    return (
      <AnalysisFlow
        onClose={handleCloseAnalysis}
        onAnalysisComplete={handleAnalysisComplete}
        source={analysisSource}
      />
    );
  }

  if (currentScreen === 'results' && analysisResult && selectedImage) {
    return (
      <AnalysisResults
        imageUri={selectedImage}
        result={analysisResult}
        onClose={handleCloseAnalysis}
        onEdit={handleEditAnalysis}
        onShare={handleShareAnalysis}
      />
    );
  }

  return (
    <>
      <MainDashboard
        onAnalyzePress={handleStartAnalysis}
        onStatsPress={handleStatsPress}
        onProfilePress={handleProfilePress}
        recentAnalyses={recentAnalyses}
      />

      <BottomSheet
        visible={showBottomSheet}
        onClose={() => setShowBottomSheet(false)}
        onCameraPress={handleCameraPress}
        onGalleryPress={handleGalleryPress}
        onDescribePress={handleDescribePress}
      />

      <StatisticsModal
        visible={showStatistics}
        onClose={handleCloseStatistics}
      />

      <DescribeFoodModal
        visible={showDescribeFood}
        onClose={() => setShowDescribeFood(false)}
        onAnalyze={handleDescribeAnalyze}
      />

      <ProfileModal
        visible={showProfile}
        onClose={handleCloseProfile}
      />
    </>
  );
}
