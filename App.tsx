import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Provider } from 'react-redux';
import { store } from './src/store';
import AppNavigator from './src/navigation/AppNavigator';
import { setupNetworkMonitoring } from './src/utils/networkResilience';

export default function App() {
  useEffect(() => {
    // Set up network monitoring with error handling
    try {
      const cleanupNetwork = setupNetworkMonitoring();
      return () => {
        if (cleanupNetwork) {
          cleanupNetwork();
        }
      };
    } catch (error) {
      console.log('Network monitoring setup failed:', error);
    }
  }, []);

  return (
    <Provider store={store}>
      <StatusBar style="light" />
      <AppNavigator />
    </Provider>
  );
}