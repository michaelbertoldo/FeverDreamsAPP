// src/navigation/AppNavigator.tsx - FIXED VERSION
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';

// Import the correct AuthNavigator that includes Profile screen
import AuthNavigator from './AuthNavigator';

// Auth Screens (for fallback stack)
import SelfieScreen from '../screens/SelfieScreen';
import ProfileScreen from '../screens/ProfileScreen';

// Main Screens
import HomeScreen from '../screens/HomeScreen';
import GalleryScreen from '../screens/GalleryScreen';

// Game Screens
import GameLobbyScreen from '../screens/GameLobbyScreen';
import PromptScreen from '../screens/PromptScreen';
import VotingScreen from '../screens/VotingScreen';
import ResultsScreen from '../screens/ResultsScreen';
import SubmitImageScreen from '../screens/SubmitImageScreen';
import WaitingForVotesScreen from '../screens/WaitingForVotesScreen';

import { RootState } from '../store';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Main Tab Navigator
const MainTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#1C1C1E',
          borderTopColor: '#2C2C2E',
        },
        tabBarActiveTintColor: '#FF3B30',
        tabBarInactiveTintColor: '#8E8E93',
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'help-outline';
          
          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          } else if (route.name === 'Gallery') {
            iconName = focused ? 'images' : 'images-outline';
          }
          
          const iconSize = typeof size === 'number' ? size : 24;
          
          return <Ionicons name={iconName} size={iconSize} color={color} />;
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
  const { status } = useSelector((state: RootState) => state.game);
  console.log('🎮 GameNavigator - current status:', status);
  
  const renderGameScreen = () => {
    switch (status) {
      case 'waiting':
        return <Stack.Screen name="GameLobby" component={GameLobbyScreen} />;
      case 'playing':
        return <Stack.Screen name="Prompt" component={PromptScreen} />;
      case 'voting':
        return <Stack.Screen name="Voting" component={VotingScreen} />;
      case 'results':
        return <Stack.Screen name="Results" component={ResultsScreen} />;
      default:
        return <Stack.Screen name="GameLobby" component={GameLobbyScreen} />;
    }
  };

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: '#000' }
      }}
    >
      {renderGameScreen()}
    </Stack.Navigator>
  );
};

// Onboarding Stack Navigator (for selfie/profile completion)
const OnboardingNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{ 
        headerShown: false,
        cardStyle: { backgroundColor: '#000' }
      }}
    >
      <Stack.Screen name="Selfie" component={SelfieScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
    </Stack.Navigator>
  );
};

// Root Navigator
const AppNavigator = () => {
  const authState = useSelector((state: RootState) => state.auth);
  const gameState = useSelector((state: RootState) => state.game);
  
  const user = authState?.user;
  const selfieUploaded = authState?.selfieUploaded || false;
  const gameId = gameState?.gameId;
  const gameStatus = gameState?.status;
  
  console.log('🔍 Navigation State:', { 
    hasUser: !!user, 
    selfieUploaded, 
    hasGameId: !!gameId,
    gameStatus
  });
  
  const getActiveNavigator = () => {
    // Not authenticated - show auth flow
    if (!user) {
      console.log('📱 Showing AuthNavigator (not authenticated)');
      return <AuthNavigator />;
    }
    
    // Authenticated but no selfie - show onboarding flow with Profile screen
    if (!selfieUploaded) {
      console.log('📱 Showing OnboardingNavigator (selfie needed)');
      return <OnboardingNavigator />;
    }
    
    // In game - show game flow
    if (gameId) {
      console.log('📱 Showing GameNavigator (in game, status:', gameStatus, ')');
      return <GameNavigator />;
    }
    
    // Default - show main app
    console.log('📱 Showing MainTabNavigator (main app)');
    return <MainTabNavigator />;
  };
  
  return (
    <NavigationContainer>
      {getActiveNavigator()}
    </NavigationContainer>
  );
};

export default AppNavigator;