import React, { useEffect } from 'react';
import { StatusBar, LogBox } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { Provider } from 'react-redux';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { store } from './src/store';
import AppNavigator from './src/navigation/AppNavigator';
import { initializeSocket } from './src/services/socketService';

// Ignore specific warnings during development
LogBox.ignoreLogs(['Setting a timer']);

export default function App() {
  useEffect(() => {
    // Initialize socket connection
    initializeSocket();
  }, []);

  return (
    <SafeAreaProvider>
      <Provider store={store}>
        <StatusBar barStyle="light-content" backgroundColor="#000" />
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      </Provider>
    </SafeAreaProvider>
  );
}