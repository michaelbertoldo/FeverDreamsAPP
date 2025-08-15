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
import SubmitImageScreen from '../screens/SubmitImageScreen';
import WaitingForVotesScreen from '../screens/WaitingForVotesScreen';

import { RootState } from '../store';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Auth Navigator
const AuthNavigator = () => {
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
    </Stack.Navigator>
  );
};

// Main Tab Navigator - FIXED ICON SIZE
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
          
          // FIXED: Ensure size is always a number
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
  return (
    <Stack.Navigator
      screenOptions={{ 
        headerShown: false,
        cardStyle: { backgroundColor: '#000' }
      }}
    >
      <Stack.Screen name="GameLobby" component={GameLobbyScreen} />
      <Stack.Screen name="Prompt" component={PromptScreen} />
      <Stack.Screen name="SubmitImage" component={SubmitImageScreen} />
      <Stack.Screen name="WaitingForVotes" component={WaitingForVotesScreen} />
      <Stack.Screen name="Voting" component={VotingScreen} />
      <Stack.Screen name="Results" component={ResultsScreen} />
    </Stack.Navigator>
  );
};

// Root Navigator - FIXED WITH SAFETY CHECKS
const AppNavigator = () => {
  const authState = useSelector((state: RootState) => state.auth);
  const gameState = useSelector((state: RootState) => state.game);
  
  // Safety checks for undefined values
  const user = authState?.user;
  const selfieUploaded = authState?.selfieUploaded || false;
  const gameId = gameState?.gameId;
  
  console.log('🎮 Navigation state:', { user: !!user, selfieUploaded, gameId: !!gameId });
  
  const getActiveNavigator = () => {
    if (!user) {
      console.log('📱 Showing Auth Navigator');
      return <AuthNavigator />;
    }
    
    if (!selfieUploaded) {
      console.log('📸 Showing Selfie Screen');
      return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Selfie" component={SelfieScreen} />
        </Stack.Navigator>
      );
    }
    
    if (gameId) {
      console.log('🎮 Showing Game Navigator');
      return <GameNavigator />;
    }
    
    console.log('🏠 Showing Main Navigator');
    return <MainTabNavigator />;
  };
  
  return (
    <NavigationContainer>
      {getActiveNavigator()}
    </NavigationContainer>
  );
};

export default AppNavigator;