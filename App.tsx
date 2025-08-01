// App.tsx
import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Provider } from 'react-redux';
import { store } from './src/store';
import AppNavigator from './src/navigation/AppNavigator';
import { setupNetworkMonitoring } from './src/utils/networkResilience';

export default function App() {
  useEffect(() => {
    // Set up network monitoring
    const cleanupNetwork = setupNetworkMonitoring();
    
    return () => {
      cleanupNetwork();
    };
  }, []);

  return (
    <Provider store={store}>
      <StatusBar style="light" />
      <AppNavigator />
    </Provider>
  );
}