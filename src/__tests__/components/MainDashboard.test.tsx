import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { MainDashboard } from '../../components/MainDashboard';

describe('MainDashboard', () => {
  const mockOnAnalyzePress = jest.fn();
  const mockOnStatsPress = jest.fn();
  const mockOnProfilePress = jest.fn();
  const mockRecentAnalyses = [];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    const { getByText } = render(
      <MainDashboard
        onAnalyzePress={mockOnAnalyzePress}
        onStatsPress={mockOnStatsPress}
        onProfilePress={mockOnProfilePress}
        recentAnalyses={mockRecentAnalyses}
      />
    );

    expect(getByText('EatSense')).toBeTruthy();
    expect(getByText('Calories Remaining')).toBeTruthy();
  });

  it('calls onAnalyzePress when FAB is pressed', () => {
    const { getByTestId } = render(
      <MainDashboard
        onAnalyzePress={mockOnAnalyzePress}
        onStatsPress={mockOnStatsPress}
        onProfilePress={mockOnProfilePress}
        recentAnalyses={mockRecentAnalyses}
      />
    );

    const fab = getByTestId('fab');
    fireEvent.press(fab);

    expect(mockOnAnalyzePress).toHaveBeenCalled();
  });

  it('calls onStatsPress when stats button is pressed', () => {
    const { getByText } = render(
      <MainDashboard
        onAnalyzePress={mockOnAnalyzePress}
        onStatsPress={mockOnStatsPress}
        onProfilePress={mockOnProfilePress}
        recentAnalyses={mockRecentAnalyses}
      />
    );

    const statsButton = getByText('View your statistics');
    fireEvent.press(statsButton);

    expect(mockOnStatsPress).toHaveBeenCalled();
  });
});