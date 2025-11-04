import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { useI18n } from '../i18n/hooks';
import { PADDING, SPACING } from '../utils/designConstants';

export default function GalleryScreen() {
  const navigation = useNavigation();
  const { t } = useI18n();
  const [hasPermission, setHasPermission] = useState(null);
  const [images, setImages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  console.log('GalleryScreen loaded');

  const [openedOnce, setOpenedOnce] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      if (!openedOnce) {
        // Request permissions first, then open picker (on focus to avoid iOS hangs)
        getMediaLibraryPermissions();
        setOpenedOnce(true);
      }
      return () => {};
    }, [openedOnce])
  );

  const getMediaLibraryPermissions = async () => {
    try {
      console.log('[GalleryScreen] Checking media library permissions...');
      const current = await ImagePicker.getMediaLibraryPermissionsAsync();
      console.log('[GalleryScreen] Current permission status:', current.status);
      
      // On iOS, if permission is denied, we can still try to launch picker
      // Expo will handle permission request automatically
      if (current.status === 'denied') {
        console.log('[GalleryScreen] Permission denied - trying to launch picker anyway (Expo will request)');
        // Just try to launch - Expo will show permission dialog if needed
        loadImages();
        return;
      }
      
      let status = current.status;
      if (status !== 'granted' && status !== 'limited') {
        console.log('[GalleryScreen] Requesting permission...');
        const req = await ImagePicker.requestMediaLibraryPermissionsAsync();
        status = req.status;
        console.log('[GalleryScreen] Permission request result:', status);
      }
      
      const allowed = status === 'granted' || status === 'limited';
      console.log('[GalleryScreen] Permission allowed:', allowed);
      setHasPermission(allowed);
      
      if (allowed) {
        // Small delay to ensure state is updated
        setTimeout(() => {
          loadImages();
        }, 100);
      } else {
        // If still not allowed, try launching anyway - Expo might handle it
        console.log('[GalleryScreen] Permission not granted, but trying to launch picker...');
        loadImages();
      }
    } catch (e) {
      console.error('[GalleryScreen] Permission error:', e);
      // Try to launch picker anyway - might work
      console.log('[GalleryScreen] Trying to launch picker despite error...');
      loadImages();
    }
  };

  const loadImages = async () => {
    try {
      setIsLoading(true);
      setHasPermission(true); // Set to true to allow loading
      console.log('[GalleryScreen] Launching image library...');
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: false,
        quality: 0.8,
        allowsEditing: false,
        selectionLimit: 1,
      });

      console.log('[GalleryScreen] Image picker result:', {
        canceled: result.canceled,
        hasAssets: !!result.assets?.[0],
      });

      if (!result.canceled && result.assets?.[0]) {
        const asset = result.assets[0];
        console.log('[GalleryScreen] Image selected, compressing...');
        
        // Compress the image
        const compressedImage = await ImageManipulator.manipulateAsync(
          asset.uri,
          [{ resize: { width: 1024 } }],
          { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
        );

        console.log('[GalleryScreen] Image compressed, navigating...');
        setIsLoading(false);
        // Navigate to analysis results with the image
        navigation.navigate('AnalysisResults', {
          imageUri: compressedImage.uri,
          source: 'gallery',
        });
      } else {
        // User cancelled, go back immediately
        console.log('[GalleryScreen] User cancelled or no image selected');
        setIsLoading(false);
        navigation.goBack();
      }
    } catch (error) {
      console.error('[GalleryScreen] Error loading images:', error);
      setIsLoading(false);
      
      // Check if it's a permission error
      if (error.code === 'E_PERMISSION_MISSING' || error.message?.includes('permission')) {
        Alert.alert(
          t('gallery.accessDenied'),
          t('gallery.accessDeniedText'),
          [
            { text: t('common.cancel'), onPress: () => navigation.goBack(), style: 'cancel' },
            { text: t('gallery.settings'), onPress: () => {
              // On iOS, can't open settings directly, but Expo handles it
              navigation.goBack();
            }},
          ]
        );
      } else {
        Alert.alert(t('common.error'), t('gallery.error'));
        navigation.goBack();
      }
    }
  };

  const handleClose = () => {
    navigation.goBack();
  };

  if (hasPermission === null) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.permissionContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.permissionText}>Requesting gallery permission...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (hasPermission === false) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.permissionContainer}>
          <Ionicons name="images-outline" size={64} color="#8E8E93" />
          <Text style={styles.permissionTitle}>Gallery Access Required</Text>
          <Text style={styles.permissionText}>
            Please enable photo library access in your device settings to select photos of your meals.
          </Text>
          <TouchableOpacity style={styles.permissionButton} onPress={handleClose}>
            <Text style={styles.permissionButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={handleClose}>
          <Ionicons name="close" size={24} color="#1C1C1E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Select Photo</Text>
        <View style={styles.headerButton} />
      </View>
      
      <View style={styles.content}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading gallery...</Text>
      </View>
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
  },
  permissionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
