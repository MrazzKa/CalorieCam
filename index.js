// CRITICAL: These imports MUST be first for Reanimated and Gesture Handler to work correctly
import 'react-native-gesture-handler';
import 'react-native-reanimated';
import 'react-native-url-polyfill/auto';

import { registerRootComponent } from 'expo';
import React from 'react';
import { View, Text } from 'react-native';

// Wrap App import in try-catch to handle import errors
let App;
try {
  App = require('./App').default;
} catch (error) {
  console.error('[index.js] Failed to import App:', error);
  console.error('[index.js] Error stack:', error.stack);
  // Fallback App that shows error
  App = () => (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#FFFFFF' }}>
      <Text style={{ fontSize: 16, color: '#E74C3C', textAlign: 'center' }}>
        Error loading app. Please restart.
      </Text>
      <Text style={{ fontSize: 12, color: '#666', textAlign: 'center', marginTop: 10 }}>
        {error.message}
      </Text>
    </View>
  );
}

registerRootComponent(App);
