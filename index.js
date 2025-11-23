// CRITICAL: These imports MUST be first for Reanimated and Gesture Handler to work correctly
import 'react-native-gesture-handler';
import 'react-native-reanimated';
import 'react-native-url-polyfill/auto';

// Глобальный перехват JS-ошибок — покажем красный экран вместо «пустоты»
if (global.ErrorUtils?.setGlobalHandler) {
  const prev = global.ErrorUtils.getGlobalHandler?.();
  
  global.ErrorUtils.setGlobalHandler((err, isFatal) => {
    console.error('[GLOBAL_ERROR]', String(err), err?.stack, { isFatal });
    
    try {
      // Покажем простой фуллскрин, если React ещё не успел смонтироваться
      const { AppRegistry } = require('react-native');
      
      const CrashScreen = () => {
        const { View, Text } = require('react-native');
        return (
          <View style={{flex: 1, backgroundColor: '#0b0b0b', justifyContent: 'center', padding: 24}}>
            <Text style={{color: '#ff5555', fontSize: 18, fontWeight: '700', marginBottom: 8}}>
              App crashed
            </Text>
            <Text selectable style={{color: '#fff', marginBottom: 8}}>
              {String(err)}
            </Text>
            <Text selectable style={{color: '#bbb', fontSize: 12}}>
              {err?.stack || 'no stack'}
            </Text>
          </View>
        );
      };
      
      // Попытка зарегистрировать crash screen (не всегда сработает, но попробуем)
      try {
        AppRegistry.registerComponent('EatSenseCrash', () => CrashScreen);
      } catch (e) {
        // Игнорируем, если уже зарегистрирован
      }
    } catch (e) {
      // Игнорируем ошибки в обработчике ошибок
    }
    
    if (prev && typeof prev === 'function') {
      prev(err, isFatal);
    }
  });
}

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
