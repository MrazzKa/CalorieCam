// SMOKE TEST: Максимально простой App для диагностики
// Это временная версия для проверки, работает ли базовый RN/Expo рантайм
// После диагностики вернуть оригинальный App.js (из git history или App.js.backup если есть)

import React, { useEffect } from 'react';
import { View, Text, Button, ScrollView, StyleSheet } from 'react-native';
import { clientLog } from './src/utils/clientLog';

export default function App() {
  useEffect(() => {
    clientLog('App:mounted').catch(() => {});
  }, []);

  const handlePing = async () => {
    await clientLog('App:pingButtonPressed').catch(() => {});
    try {
      const res = await fetch('https://caloriecam-production.up.railway.app/.well-known/health');
      const text = await res.text();
      await clientLog('App:pingSuccess', {
        status: res.status,
        body: text.slice(0, 200),
      }).catch(() => {});
    } catch (e) {
      await clientLog('App:pingError', {
        message: e?.message || String(e),
      }).catch(() => {});
    }
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
    >
      <Text style={styles.title}>
        EatSense Smoke Test
      </Text>
      <Text style={styles.subtitle}>
        Если вы видите этот экран — JS дерево смонтировалось.
      </Text>
      <Button title="Ping API" onPress={handlePing} />
      <Text style={styles.buildInfo}>
        Build: {process.env.EXPO_PUBLIC_ENV || 'n/a'}
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 14,
    color: '#444',
    textAlign: 'center',
    marginBottom: 24,
  },
  buildInfo: {
    fontSize: 12,
    color: '#888',
    marginTop: 16,
  },
});
