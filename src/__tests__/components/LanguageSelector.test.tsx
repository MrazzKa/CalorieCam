import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { LanguageSelector } from '../../components/LanguageSelector';

describe('LanguageSelector', () => {
  it('renders selected language correctly', () => {
    render(
      <LanguageSelector
        selectedLanguage="en"
        onLanguageChange={() => {}}
      />
    );
    
    expect(screen.getByText('English')).toBeTruthy();
  });

  it('opens modal when selector is pressed', () => {
    render(
      <LanguageSelector
        selectedLanguage="en"
        onLanguageChange={() => {}}
      />
    );
    
    fireEvent.press(screen.getByText('English'));
    expect(screen.getByText('Select Language')).toBeTruthy();
  });

  it('calls onLanguageChange when language is selected', () => {
    const onLanguageChange = jest.fn();
    render(
      <LanguageSelector
        selectedLanguage="en"
        onLanguageChange={onLanguageChange}
      />
    );
    
    fireEvent.press(screen.getByText('English'));
    fireEvent.press(screen.getByText('Spanish'));
    expect(onLanguageChange).toHaveBeenCalledWith('es');
  });

  it('closes modal when language is selected', async () => {
    render(
      <LanguageSelector
        selectedLanguage="en"
        onLanguageChange={() => {}}
      />
    );
    
    fireEvent.press(screen.getByText('English'));
    fireEvent.press(screen.getByText('Spanish'));
    
    await waitFor(() => {
      expect(screen.queryByText('Select Language')).toBeNull();
    });
  });

  it('shows checkmark for selected language', () => {
    render(
      <LanguageSelector
        selectedLanguage="en"
        onLanguageChange={() => {}}
      />
    );
    
    fireEvent.press(screen.getByText('English'));
    expect(screen.getByTestId('checkmark-en')).toBeTruthy();
  });

  it('closes modal when close button is pressed', () => {
    render(
      <LanguageSelector
        selectedLanguage="en"
        onLanguageChange={() => {}}
      />
    );
    
    fireEvent.press(screen.getByText('English'));
    fireEvent.press(screen.getByTestId('close-button'));
    expect(screen.queryByText('Select Language')).toBeNull();
  });
});
