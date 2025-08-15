import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import WelcomeScreen from '../screens/WelcomeScreen';
import SignInScreen from '../screens/SignInScreen';
import SelfieScreen from '../screens/SelfieScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SubmitImageScreen from '../screens/SubmitImageScreen';
import WaitingForVotesScreen from '../screens/WaitingForVotesScreen';

// FIX: Create stack navigator properly - NO ID NEEDED
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

export default AuthNavigator;
