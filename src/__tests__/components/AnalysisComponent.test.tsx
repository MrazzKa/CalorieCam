import React from 'react';
import { render, waitFor, fireEvent, screen } from '@testing-library/react-native';
import { AnalysisComponent } from '../../components/AnalysisComponent';

// Mock analyzeImage function
jest.mock('../../lib/api', () => ({
  analyzeImage: jest.fn(() => Promise.resolve({
    items: [
      {
        label: 'Test Food',
        kcal: 100,
        protein: 10,
        fat: 5,
        carbs: 15
      }
    ]
  }))
}));

describe('AnalysisComponent', () => {
  it('renders analysis steps correctly', () => {
    render(
      <AnalysisComponent
        imageUri="test-image.jpg"
        onAnalysisComplete={() => {}}
        onClose={() => {}}
      />
    );
    
    expect(screen.getByText('Uploaded')).toBeTruthy();
    expect(screen.getByText('Analyzing')).toBeTruthy();
    expect(screen.getByText('Calculating calories')).toBeTruthy();
  });

  it('shows progress during analysis', () => {
    render(
      <AnalysisComponent
        imageUri="test-image.jpg"
        onAnalysisComplete={() => {}}
        onClose={() => {}}
      />
    );
    
    expect(screen.getByText('Analyzing...')).toBeTruthy();
  });

  it('calls onAnalysisComplete when analysis is finished', async () => {
    const onAnalysisComplete = jest.fn();
    render(
      <AnalysisComponent
        imageUri="test-image.jpg"
        onAnalysisComplete={onAnalysisComplete}
        onClose={() => {}}
      />
    );
    
    await waitFor(() => {
      expect(onAnalysisComplete).toHaveBeenCalled();
    });
  });

  it('calls onClose when close button is pressed', () => {
    const onClose = jest.fn();
    render(
      <AnalysisComponent
        imageUri="test-image.jpg"
        onAnalysisComplete={() => {}}
        onClose={onClose}
      />
    );
    
    fireEvent.press(screen.getByTestId('close-button'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('shows error state when analysis fails', async () => {
    jest.mocked(require('../../lib/api').analyzeImage).mockRejectedValueOnce(new Error('Analysis failed'));
    
    render(
      <AnalysisComponent
        imageUri="test-image.jpg"
        onAnalysisComplete={() => {}}
        onClose={() => {}}
      />
    );
    
    await waitFor(() => {
      expect(screen.getByText('Analysis failed')).toBeTruthy();
    });
  });

  it('calls retry when retry button is pressed', async () => {
    jest.mocked(require('../../lib/api').analyzeImage).mockRejectedValueOnce(new Error('Analysis failed'));
    
    render(
      <AnalysisComponent
        imageUri="test-image.jpg"
        onAnalysisComplete={() => {}}
        onClose={() => {}}
      />
    );
    
    await waitFor(() => {
      fireEvent.press(screen.getByText('Try Again'));
      expect(require('../../lib/api').analyzeImage).toHaveBeenCalledTimes(2);
    });
  });
});
