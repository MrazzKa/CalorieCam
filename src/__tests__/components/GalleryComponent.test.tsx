import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { GalleryComponent } from '../../components/GalleryComponent';

// Mock expo-media-library
jest.mock('expo-media-library', () => ({
  requestPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  getAlbumsAsync: jest.fn(() => Promise.resolve([
    { title: 'Camera Roll', id: '1' }
  ])),
  getAssetsAsync: jest.fn(() => Promise.resolve({
    assets: [
      { id: '1', uri: 'file://test1.jpg' },
      { id: '2', uri: 'file://test2.jpg' }
    ]
  }))
}));

describe('GalleryComponent', () => {
  it('renders loading state initially', () => {
    render(<GalleryComponent onImageSelect={() => {}} onClose={() => {}} />);
    expect(screen.getByText('Loading gallery...')).toBeTruthy();
  });

  it('renders images after loading', async () => {
    render(<GalleryComponent onImageSelect={() => {}} onClose={() => {}} />);
    
    await waitFor(() => {
      expect(screen.queryByText('Loading gallery...')).toBeNull();
    });
  });

  it('calls onImageSelect when image is pressed', async () => {
    const onImageSelect = jest.fn();
    render(<GalleryComponent onImageSelect={onImageSelect} onClose={() => {}} />);
    
    await waitFor(() => {
      const image = screen.getByTestId('image-1');
      fireEvent.press(image);
      expect(onImageSelect).toHaveBeenCalledWith('file://test1.jpg');
    });
  });

  it('calls onClose when close button is pressed', () => {
    const onClose = jest.fn();
    render(<GalleryComponent onImageSelect={() => {}} onClose={onClose} />);
    
    fireEvent.press(screen.getByTestId('close-button'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('shows selected state for selected image', async () => {
    render(<GalleryComponent onImageSelect={() => {}} onClose={() => {}} />);
    
    await waitFor(() => {
      const image = screen.getByTestId('image-1');
      fireEvent.press(image);
      expect(screen.getByTestId('selected-overlay-1')).toBeTruthy();
    });
  });
});
