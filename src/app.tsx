// src/App.tsx
import React, { useEffect, useRef } from 'react';
import { StatusBar } from 'react-native';
import { Provider } from 'react-redux';
import { store } from './store';
import AppNavigator from './navigation/AppNavigator';
import { 
  registerForPushNotifications,
  getNotificationListeners
} from './services/notificationService';
import { setupNetworkMonitoring } from './utils/networkResilience';

export default function App() {
  // Register for push notifications on app start
  useEffect(() => {
    registerForPushNotifications();
    
    // Set up notification listeners
    const cleanupNotifications = getNotificationListeners();
    
    // Set up network monitoring
    const cleanupNetwork = setupNetworkMonitoring();
    
    return () => {
      cleanupNotifications();
      cleanupNetwork();
    };
  }, []);
  
  return (
    <Provider store={store}>
      <StatusBar barStyle="light-content" />
      <AppNavigator />
    </Provider>
  );
}
