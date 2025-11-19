import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { PADDING, SPACING } from '../utils/designConstants';

const STATE = {
  IDLE: 'idle',
  CHECKING: 'checking',
  READY: 'ready',
  DENIED: 'denied',
  LIMITED: 'limited',
  OPENING: 'opening',
  CANCELED: 'canceled',
  ERROR: 'error',
};

export default function GalleryScreen() {
  const navigation = useNavigation();
  const [state, setState] = useState(STATE.CHECKING);
  const [error, setError] = useState(null);
  const isOpeningRef = useRef(false);

  const ensurePermission = useCallback(async () => {
    setState(STATE.CHECKING);
    setError(null);

    try {
      const p0 = await ImagePicker.getMediaLibraryPermissionsAsync();
      // Отладочный лог полного объекта разрешений
      console.log('[GalleryScreen] Permission object:', JSON.stringify(p0, null, 2));
      console.log('[GalleryScreen] status:', p0.status);
      console.log('[GalleryScreen] granted:', p0.granted);
      console.log('[GalleryScreen] canAskAgain:', p0.canAskAgain);
      if (Platform.OS === 'ios' && p0.accessPrivileges) {
        console.log('[GalleryScreen] accessPrivileges:', p0.accessPrivileges);
      }

      // Проверяем granted или limited (iOS частичный доступ)
      if (p0.granted) {
        // На iOS может быть частичный доступ (limited)
        if (Platform.OS === 'ios' && p0.accessPrivileges === 'limited') {
          console.log('[GalleryScreen] Limited access granted - treating as allowed');
          setState(STATE.LIMITED);
          return true;
        }
        console.log('[GalleryScreen] Full access granted');
        setState(STATE.READY);
        return true;
      }

      // Если не granted, но статус limited - тоже допустимо
      if (p0.status === 'limited') {
        console.log('[GalleryScreen] Limited status - treating as allowed');
        setState(STATE.LIMITED);
        return true;
      }

      // Если можно спросить снова - запрашиваем
      if (p0.canAskAgain !== false) {
        console.log('[GalleryScreen] Requesting permission...');
        const p1 = await ImagePicker.requestMediaLibraryPermissionsAsync();
        console.log('[GalleryScreen] Request result:', JSON.stringify(p1, null, 2));
        
        if (p1.granted) {
          if (Platform.OS === 'ios' && p1.accessPrivileges === 'limited') {
            console.log('[GalleryScreen] Limited access after request - treating as allowed');
            setState(STATE.LIMITED);
            return true;
          }
          console.log('[GalleryScreen] Full access granted after request');
          setState(STATE.READY);
          return true;
        }
        
        // Если статус limited после запроса - тоже допустимо
        if (p1.status === 'limited') {
          console.log('[GalleryScreen] Limited status after request - treating as allowed');
          setState(STATE.LIMITED);
          return true;
        }
        
        // iOS странность: accessPrivileges="all" но granted=false - попробуем открыть пикер
        if (Platform.OS === 'ios' && p1.accessPrivileges === 'all' && p1.canAskAgain === true) {
          console.log('[GalleryScreen] iOS quirk: accessPrivileges=all but granted=false - allowing anyway');
          setState(STATE.READY);
          return true;
        }
      }

      // iOS странность: accessPrivileges="all" но granted=false - попробуем открыть пикер
      if (Platform.OS === 'ios' && p0.accessPrivileges === 'all' && p0.canAskAgain === true) {
        console.log('[GalleryScreen] iOS quirk detected: accessPrivileges=all but granted=false - allowing anyway');
        setState(STATE.READY);
        return true;
      }

      // Отказ; возможно нельзя повторно спрашивать
      console.log('[GalleryScreen] Permission denied, canAskAgain:', p0.canAskAgain);
      setState(STATE.DENIED);
      return false;
    } catch (e) {
      console.error('[GalleryScreen] Permission error:', e);
      setState(STATE.ERROR);
      setError(String(e?.message ?? e));
      return false;
    }
  }, []);

  const openSettings = useCallback(() => {
    if (Platform.OS === 'ios') {
      Linking.openURL('app-settings:');
    } else {
      Linking.openSettings();
    }
  }, []);

  const pickImage = useCallback(async () => {
    if (isOpeningRef.current) {
      console.log('[GalleryScreen] Picker already opening, skipping...');
      return;
    }

    isOpeningRef.current = true;
    setError(null);
    setState(STATE.OPENING);

    try {
      // Проверяем разрешения, но даже если denied - пробуем открыть пикер
      const permission = await ImagePicker.getMediaLibraryPermissionsAsync();
      console.log('[GalleryScreen] Permission before pick:', JSON.stringify(permission, null, 2));
      
      // iOS странность: accessPrivileges="all" но granted=false - пробуем открыть
      const shouldTryOpen = permission.granted || 
        (Platform.OS === 'ios' && permission.accessPrivileges === 'all') ||
        permission.status === 'limited';
      
      if (!shouldTryOpen && permission.canAskAgain) {
        const requested = await ImagePicker.requestMediaLibraryPermissionsAsync();
        console.log('[GalleryScreen] Permission after request:', JSON.stringify(requested, null, 2));
      }

      // Пробуем открыть пикер даже если разрешение denied (iOS может разрешить)
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaType.Images,
        allowsEditing: false,
        quality: 1,
        selectionLimit: 1,
        exif: false,
      });

      if (result.canceled) {
        setState(STATE.CANCELED);
        isOpeningRef.current = false;
        // Не закрываем экран, показываем кнопку для повторной попытки
        return;
      }

      const asset = result.assets?.[0];
      if (!asset) {
        setState(STATE.ERROR);
        setError('No asset returned');
        isOpeningRef.current = false;
        return;
      }

      console.log('[GalleryScreen] Image selected, compressing...');
      
      // Compress the image
      const compressedImage = await ImageManipulator.manipulateAsync(
        asset.uri,
        [{ resize: { width: 1024 } }],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
      );

      console.log('[GalleryScreen] Image compressed, navigating...');
      setState(STATE.READY);
      isOpeningRef.current = false;
      
      // Navigate to analysis results with the image
      if (navigation && typeof navigation.navigate === 'function') {
        navigation.navigate('AnalysisResults', {
          imageUri: compressedImage.uri,
          source: 'gallery',
        });
      }
    } catch (e) {
      console.error('[GalleryScreen] Error picking image:', e);
      setState(STATE.ERROR);
      setError(String(e?.message ?? e));
      isOpeningRef.current = false;
    }
  }, [navigation]);

  // One-time permission check on first mount
  useEffect(() => {
    // Не запускаем пикер; только проверяем разрешение
    ensurePermission();
  }, [ensurePermission]);

  const handleClose = () => {
    if (navigation && typeof navigation.goBack === 'function') {
      navigation.goBack();
    }
  };

  const renderContent = () => {
    if (state === STATE.CHECKING || state === STATE.OPENING) {
      return (
        <View style={styles.content}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>
            {state === STATE.CHECKING ? 'Checking permissions...' : 'Opening gallery...'}
          </Text>
        </View>
      );
    }

    if (state === STATE.DENIED) {
      return (
        <View style={styles.permissionContainer}>
          <Ionicons name="images-outline" size={64} color="#8E8E93" />
          <Text style={styles.permissionTitle}>Gallery Access Required</Text>
          <Text style={styles.permissionText}>
            Please enable photo library access in your device settings to select photos of your meals.
          </Text>
          <TouchableOpacity style={styles.permissionButton} onPress={openSettings}>
            <Text style={styles.permissionButtonText}>Open Settings</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} onPress={handleClose}>
            <Text style={styles.secondaryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (state === STATE.ERROR) {
      return (
        <View style={styles.permissionContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#FF3B30" />
          <Text style={styles.permissionTitle}>Error</Text>
          <Text style={styles.permissionText}>{error || 'Failed to open gallery'}</Text>
          <TouchableOpacity style={styles.permissionButton} onPress={pickImage}>
            <Text style={styles.permissionButtonText}>Try Again</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} onPress={handleClose}>
            <Text style={styles.secondaryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      );
    }

    // READY, CANCELED, LIMITED - показываем кнопку для открытия пикера
    return (
      <View style={styles.content}>
        {state === STATE.CANCELED && (
          <View style={styles.messageContainer}>
            <Text style={styles.messageText}>Selection canceled</Text>
          </View>
        )}
        {state === STATE.LIMITED && (
          <View style={styles.messageContainer}>
            <Text style={styles.messageText}>Limited photo access. You can select photos from your library.</Text>
          </View>
        )}
        <TouchableOpacity style={styles.pickButton} onPress={pickImage}>
          <Ionicons name="images" size={24} color="#FFFFFF" />
          <Text style={styles.pickButtonText}>Pick from Library</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={handleClose}>
          <Ionicons name="close" size={24} color="#1C1C1E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Select Photo</Text>
        <View style={styles.headerButton} />
      </View>
      
      {renderContent()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: PADDING.screen,
    paddingVertical: SPACING.lg,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E7',
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: PADDING.screen,
  },
  loadingText: {
    fontSize: 16,
    color: '#8E8E93',
    marginTop: 16,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: PADDING.huge,
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
    marginBottom: 12,
    minWidth: 200,
    alignItems: 'center',
  },
  permissionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 200,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  pickButton: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 12,
  },
  pickButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  messageContainer: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: '#FFF3CD',
    borderRadius: 8,
  },
  messageText: {
    fontSize: 16,
    color: '#856404',
    textAlign: 'center',
  },
});
