// src/navigation/AuthNavigator.tsx
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import WelcomeScreen from '../screens/WelcomeScreen'; // Note: uppercase 'W' to match filename
import SignInScreen from '../screens/SignInScreen';
import SelfieScreen from '../screens/SelfieScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SubmitImageScreen from '../screens/SubmitImageScreen';
import WaitingForVotesScreen from '../screens/WaitingForVotesScreen';

const Stack = createStackNavigator();

export const AuthNavigator = () => {
  return (
    <Stack.Navigator 
      screenOptions={{ 
        headerShown: false,
        cardStyle: { backgroundColor: '#000' }
      }}
    >
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="SignIn" component={SignInScreen} />
      <Stack.Screen name="Selfie" component={SelfieScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="SubmitImage" component={SubmitImageScreen} />
      <Stack.Screen name="WaitingForVotes" component={WaitingForVotesScreen} />
    </Stack.Navigator>
  );
};