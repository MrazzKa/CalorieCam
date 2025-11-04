import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Slider from '@react-native-community/slider';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as ImageManipulator from 'expo-image-manipulator';
import { PADDING, SPACING, BORDER_RADIUS } from '../utils/designConstants';

export default function CameraScreen() {
  const navigation = useNavigation();
  const [permission, requestPermission] = useCameraPermissions();
  const [isLoading, setIsLoading] = useState(false);
  const cameraRef = useRef(null);
  const [zoom, setZoom] = useState(0); // Start at minimum zoom level
  const [facing, setFacing] = useState('back');
  const [flashMode, setFlashMode] = useState('off');

  console.log('CameraScreen loaded');

  const takePicture = async () => {
    if (cameraRef.current && !isLoading) {
      setIsLoading(true);
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          base64: false,
        });

        // Compress the image
        const compressedImage = await ImageManipulator.manipulateAsync(
          photo.uri,
          [{ resize: { width: 1024 } }],
          { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
        );

        // Navigate to analysis results with the image
        navigation.navigate('AnalysisResults', {
          imageUri: compressedImage.uri,
          source: 'camera',
        });
      } catch (error) {
        console.error('Error taking picture:', error);
        Alert.alert('Error', 'Failed to take picture. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleClose = () => {
    navigation.goBack();
  };

  if (!permission) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.permissionContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.permissionText}>Requesting camera permission...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.permissionContainer}>
          <Ionicons name="camera-off" size={64} color="#8E8E93" />
          <Text style={styles.permissionTitle}>Camera Access Required</Text>
          <Text style={styles.permissionText}>
            Please enable camera access in your device settings to take photos of your meals.
          </Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>Request Permission</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.permissionButton, { backgroundColor: '#8E8E93', marginTop: 10 }]} onPress={handleClose}>
            <Text style={styles.permissionButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <CameraView
        style={styles.camera}
        facing={facing}
        ref={cameraRef}
        zoom={zoom}
        enableZoomGesture
      >
        <View style={styles.cameraOverlay}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.headerButton} onPress={handleClose}>
              <Ionicons name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Take Photo</Text>
            <View style={styles.headerButton} />
          </View>

          {/* Camera Controls */}
          <View style={styles.controls}>
            <View style={styles.controlRow}>
              <TouchableOpacity 
                style={styles.controlButton}
                onPress={() => {
                  const modes = ['off', 'on', 'auto'];
                  const currentIndex = modes.indexOf(flashMode);
                  const nextIndex = (currentIndex + 1) % modes.length;
                  setFlashMode(modes[nextIndex]);
                }}
              >
                <Ionicons 
                  name={
                    flashMode === 'off' ? 'flash-off' :
                    flashMode === 'on' ? 'flash' : 'flash-outline'
                  } 
                  size={24} 
                  color="#FFFFFF" 
                />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.captureButton, isLoading && styles.captureButtonDisabled]}
                onPress={takePicture}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <View style={styles.captureButtonInner} />
                )}
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.controlButton}
                onPress={() => {
                  setFacing(facing === 'back' ? 'front' : 'back');
                }}
              >
                <Ionicons name="camera-reverse" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <View style={styles.zoomContainer}>
              <Slider
                style={{ width: '100%' }}
                minimumValue={0}
                maximumValue={1}
                step={0.01}
                value={zoom}
                minimumTrackTintColor="#FFFFFF"
                maximumTrackTintColor="rgba(255,255,255,0.3)"
                onValueChange={setZoom}
              />
            </View>
          </View>
        </View>
      </CameraView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: PADDING.xl,
    paddingHorizontal: PADDING.screen,
    paddingBottom: PADDING.xl,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  controls: {
    paddingBottom: PADDING.huge,
    paddingHorizontal: PADDING.screen,
  },
  zoomContainer: {
    marginTop: 16,
    paddingHorizontal: 10,
  },
  controlRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  controlButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  captureButtonDisabled: {
    opacity: 0.6,
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#007AFF',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    backgroundColor: '#F2F2F7',
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1C1C1E',
    marginTop: 20,
    marginBottom: 12,
    textAlign: 'center',
  },
  permissionText: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 30,
  },
  permissionButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  permissionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
