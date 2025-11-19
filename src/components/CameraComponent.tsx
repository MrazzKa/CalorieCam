import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Camera, CameraType } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';

interface CameraComponentProps {
  onPhotoTaken: (uri: string) => void;
  onClose: () => void;
}

export const CameraComponent: React.FC<CameraComponentProps> = ({
  onPhotoTaken,
  onClose,
}) => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [type, setType] = useState(CameraType.back);
  const [flashMode, setFlashMode] = useState<'off' | 'on' | 'auto'>('auto');
  const cameraRef = useRef<Camera>(null);

  const getCameraPermissions = useCallback(async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    setHasPermission(status === 'granted');
  }, []);

  useEffect(() => {
    void getCameraPermissions();
  }, [getCameraPermissions]);

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          base64: false,
        });
        onPhotoTaken(photo.uri);
      } catch (error) {
        console.error('Error taking picture:', error);
        Alert.alert('Error', 'Failed to take picture');
      }
    }
  };

  const flipCamera = () => {
    setType(current => (current === CameraType.back ? CameraType.front : CameraType.back));
  };

  const toggleFlash = () => {
    setFlashMode(current => {
      if (current === 'off') return 'on';
      if (current === 'on') return 'auto';
      return 'off';
    });
  };

  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>Requesting camera permission...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>No access to camera</Text>
        <TouchableOpacity style={styles.button} onPress={onClose}>
          <Text style={styles.buttonText}>Close</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Camera
        style={styles.camera}
        type={type}
        ref={cameraRef}
        flashMode={flashMode}
      >
        <View style={styles.overlay}>
          <View style={styles.topControls}>
            <TouchableOpacity style={styles.controlButton} onPress={onClose}>
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.controlButton} onPress={toggleFlash}>
              <Ionicons 
                name={flashMode === 'off' ? 'flash-off' : flashMode === 'on' ? 'flash' : 'flash'} 
                size={24} 
                color="white" 
              />
            </TouchableOpacity>
          </View>

          <View style={styles.bottomControls}>
            <TouchableOpacity style={styles.flipButton} onPress={flipCamera}>
              <Ionicons name="camera-reverse" size={24} color="white" />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
              <View style={styles.captureButtonInner} />
            </TouchableOpacity>
            
            <View style={styles.placeholder} />
          </View>
        </View>
      </Camera>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'space-between',
  },
  topControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingHorizontal: 20,
  },
  bottomControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 50,
    paddingHorizontal: 20,
  },
  controlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  flipButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#3498DB',
  },
  placeholder: {
    width: 44,
  },
  message: {
    fontSize: 18,
    color: 'white',
    textAlign: 'center',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#3498DB',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    alignSelf: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
