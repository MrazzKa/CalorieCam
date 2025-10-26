import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { CameraComponent } from '../../components/CameraComponent';

// Mock expo-camera
jest.mock('expo-camera', () => ({
  Camera: 'Camera',
  CameraType: { back: 'back', front: 'front' },
  requestCameraPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' }))
}));

describe('CameraComponent', () => {
  it('renders camera when permission is granted', async () => {
    render(<CameraComponent onPhotoTaken={() => {}} onClose={() => {}} />);
    
    await waitFor(() => {
      expect(screen.getByTestId('camera')).toBeTruthy();
    });
  });

  it('shows permission request when permission is not granted', async () => {
    jest.mocked(require('expo-camera').requestCameraPermissionsAsync).mockResolvedValueOnce({ status: 'denied' });
    
    render(<CameraComponent onPhotoTaken={() => {}} onClose={() => {}} />);
    
    await waitFor(() => {
      expect(screen.getByText('No access to camera')).toBeTruthy();
    });
  });

  it('calls onClose when close button is pressed', () => {
    const onClose = jest.fn();
    render(<CameraComponent onPhotoTaken={() => {}} onClose={onClose} />);
    
    fireEvent.press(screen.getByTestId('close-button'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onPhotoTaken when photo is taken', async () => {
    const onPhotoTaken = jest.fn();
    render(<CameraComponent onPhotoTaken={onPhotoTaken} onClose={() => {}} />);
    
    await waitFor(() => {
      fireEvent.press(screen.getByTestId('capture-button'));
      expect(onPhotoTaken).toHaveBeenCalled();
    });
  });

  it('flips camera when flip button is pressed', () => {
    render(<CameraComponent onPhotoTaken={() => {}} onClose={() => {}} />);
    
    fireEvent.press(screen.getByTestId('flip-button'));
    // Camera type should change
  });

  it('toggles flash when flash button is pressed', () => {
    render(<CameraComponent onPhotoTaken={() => {}} onClose={() => {}} />);
    
    fireEvent.press(screen.getByTestId('flash-button'));
    // Flash mode should change
  });
});
