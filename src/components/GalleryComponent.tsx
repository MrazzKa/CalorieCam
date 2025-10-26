import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, FlatList, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';

interface GalleryComponentProps {
  onImageSelect: (imageUri: string) => void;
  onClose: () => void;
}

export const GalleryComponent: React.FC<GalleryComponentProps> = ({
  onImageSelect,
  onClose,
}) => {
  const [images, setImages] = useState<MediaLibrary.Asset[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadImages();
  }, []);

  const loadImages = async () => {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Please grant access to your photo library');
        return;
      }

      const albums = await MediaLibrary.getAlbumsAsync();
      const cameraRoll = albums.find(album => album.title === 'Camera Roll');
      
      if (cameraRoll) {
        const assets = await MediaLibrary.getAssetsAsync({
          album: cameraRoll,
          first: 50,
          mediaType: 'photo',
          sortBy: 'creationTime',
        });
        setImages(assets.assets);
      }
    } catch (error) {
      console.error('Error loading images:', error);
      Alert.alert('Error', 'Failed to load images from gallery');
    } finally {
      setLoading(false);
    }
  };

  const handleImageSelect = (imageUri: string) => {
    setSelectedImage(imageUri);
    onImageSelect(imageUri);
  };

  const renderImage = ({ item }: { item: MediaLibrary.Asset }) => (
    <TouchableOpacity
      style={styles.imageContainer}
      onPress={() => handleImageSelect(item.uri)}
    >
      <Image source={{ uri: item.uri }} style={styles.image} />
      {selectedImage === item.uri && (
        <View style={styles.selectedOverlay}>
          <Ionicons name="checkmark-circle" size={24} color="#2ECC71" />
        </View>
      )}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading gallery...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Ionicons name="close" size={24} color="#2C3E50" />
        </TouchableOpacity>
        <Text style={styles.title}>Select Photo</Text>
        <View style={styles.placeholder} />
      </View>

      <FlatList
        data={images}
        renderItem={renderImage}
        keyExtractor={(item) => item.id}
        numColumns={3}
        contentContainerStyle={styles.gallery}
        showsVerticalScrollIndicator={false}
      />
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
    paddingHorizontal: 16,
    paddingVertical: 12,
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#7F8C8D',
  },
  gallery: {
    padding: 8,
  },
  imageContainer: {
    flex: 1,
    aspectRatio: 1,
    margin: 4,
    borderRadius: 8,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  selectedOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
  },
});
