import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { AnalysisFlow } from '../../components/AnalysisFlow';

// Mock expo-image-picker
jest.mock('expo-image-picker', () => ({
  requestCameraPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  requestMediaLibraryPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  launchCameraAsync: jest.fn(() => Promise.resolve({ canceled: false, assets: [{ uri: 'test-image.jpg' }] })),
  launchImageLibraryAsync: jest.fn(() => Promise.resolve({ canceled: false, assets: [{ uri: 'test-image.jpg' }] })),
  MediaTypeOptions: {
    Images: 'Images',
  },
}));

// Mock API
jest.mock('../../lib/api', () => ({
  analyzeImage: jest.fn(() => Promise.resolve({
    items: [
      {
        label: 'Test Food',
        kcal: 200,
        protein: 10,
        fat: 5,
        carbs: 20,
        gramsMean: 100,
      },
    ],
  })),
}));

describe('AnalysisFlow', () => {
  const mockOnClose = jest.fn();
  const mockOnAnalysisComplete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    const { getByText } = render(
      <AnalysisFlow
        onClose={mockOnClose}
        onAnalysisComplete={mockOnAnalysisComplete}
        source="camera"
      />
    );

    expect(getByText('Analyzing your dish...')).toBeTruthy();
  });

  it('calls onClose when close button is pressed', () => {
    const { getByTestId } = render(
      <AnalysisFlow
        onClose={mockOnClose}
        onAnalysisComplete={mockOnAnalysisComplete}
        source="camera"
      />
    );

    const closeButton = getByTestId('close-button');
    fireEvent.press(closeButton);

    expect(mockOnClose).toHaveBeenCalled();
  });
});