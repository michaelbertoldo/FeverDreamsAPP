// src/navigation/AppNavigator.tsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';

// Auth Screens
import WelcomeScreen from '../screens/WelcomeScreen';
import SignInScreen from '../screens/SignInScreen';
import SelfieScreen from '../screens/SelfieScreen';

// Main Screens
import HomeScreen from '../screens/HomeScreen';
import ProfileScreen from '../screens/ProfileScreen';
import GalleryScreen from '../screens/GalleryScreen';

// Game Screens
import GameLobbyScreen from '../screens/GameLobbyScreen';
import PromptScreen from '../screens/PromptScreen';
import VotingScreen from '../screens/VotingScreen';
import ResultsScreen from '../screens/ResultsScreen';

import { RootState } from '../store';
import { colors, navigationTheme } from '../theme';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Auth Navigator
const AuthNavigator = () => {
  return (
    <Stack.Navigator 
      screenOptions={{ 
        headerShown: false,
        cardStyle: { backgroundColor: colors.background.primary }
      }}
    >
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="SignIn" component={SignInScreen} />
      <Stack.Screen name="Selfie" component={SelfieScreen} />
    </Stack.Navigator>
  );
};

// Main Tab Navigator
const MainTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.background.secondary,
          borderTopColor: colors.background.tertiary,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.text.tertiary,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          
          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          } else if (route.name === 'Gallery') {
            iconName = focused ? 'images' : 'images-outline';
          }
          
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Gallery" component={GalleryScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

// Game Navigator
const GameNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{ 
        headerShown: false,
        cardStyle: { backgroundColor: colors.background.primary }
      }}
    >
      <Stack.Screen name="GameLobby" component={GameLobbyScreen} />
      <Stack.Screen name="Prompt" component={PromptScreen} />
      <Stack.Screen name="Voting" component={VotingScreen} />
      <Stack.Screen name="Results" component={ResultsScreen} />
    </Stack.Navigator>
  );
};

// Root Navigator
const AppNavigator = () => {
  const { user, selfieUploaded } = useSelector((state: RootState) => state.auth);
  const { gameId, status } = useSelector((state: RootState) => state.game);
  
  // Determine which navigator to show
  const getActiveNavigator = () => {
    if (!user) {
      return <AuthNavigator />;
    }
    
    if (!selfieUploaded) {
      return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Selfie" component={SelfieScreen} />
        </Stack.Navigator>
      );
    }
    
    if (gameId) {
      return <GameNavigator />;
    }
    
    return <MainTabNavigator />;
  };
  
  return (
    <NavigationContainer theme={navigationTheme}>
      {getActiveNavigator()}
    </NavigationContainer>
  );
};

export default AppNavigator;
