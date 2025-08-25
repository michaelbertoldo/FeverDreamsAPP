import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { RootState } from '../store';

// Import screens
import WelcomeScreen from '../screens/WelcomeScreen';
import SignInScreen from '../screens/SignInScreen';
import SelfieScreen from '../screens/SelfieScreen';
import HomeScreen from '../screens/HomeScreen';
import ProfileScreen from '../screens/ProfileScreen';
import GalleryScreen from '../screens/GalleryScreen';
import GameLobbyScreen from '../screens/GameLobbyScreen';
import GamePlayScreen from '../screens/GamePlayScreen';
import VotingScreen from '../screens/VotingScreen';
import RoundResultsScreen from '../screens/RoundResultsScreen';
import FinalResultsScreen from '../screens/FinalResultsScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Define navigation types
export type RootStackParamList = {
  Welcome: undefined;
  SignIn: undefined;
  Selfie: undefined;
  MainTabs: undefined;
  GameLobby: { gameCode?: string };
  GamePlay: undefined;
  Voting: undefined;
  RoundResults: undefined;
  FinalResults: undefined;
};

// Main Tab Navigator
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#1a1a1a',
          borderTopColor: '#333',
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: '#FF6B6B',
        tabBarInactiveTintColor: '#888',
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;
          
          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          } else if (route.name === 'Gallery') {
            iconName = focused ? 'images' : 'images-outline';
          } else {
            iconName = 'help-outline';
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
}

// Main App Navigator
export default function AppNavigator() {
  const { user, selfieUploaded } = useSelector((state: RootState) => state.auth);
  const { currentGameId } = useSelector((state: RootState) => state.game);

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: '#000' },
      }}
    >
      {!user ? (
        // Auth flow
        <>
          <Stack.Screen name="Welcome" component={WelcomeScreen} />
          <Stack.Screen name="SignIn" component={SignInScreen} />
        </>
      ) : !selfieUploaded ? (
        // Selfie upload flow
        <Stack.Screen name="Selfie" component={SelfieScreen} />
      ) : currentGameId ? (
        // In-game flow
        <>
          <Stack.Screen name="GameLobby" component={GameLobbyScreen} />
          <Stack.Screen name="GamePlay" component={GamePlayScreen} />
          <Stack.Screen name="Voting" component={VotingScreen} />
          <Stack.Screen name="RoundResults" component={RoundResultsScreen} />
          <Stack.Screen name="FinalResults" component={FinalResultsScreen} />
        </>
      ) : (
        // Main app flow
        <>
          <Stack.Screen name="MainTabs" component={MainTabs} />
          <Stack.Screen name="GameLobby" component={GameLobbyScreen} />
          <Stack.Screen name="GamePlay" component={GamePlayScreen} />
          <Stack.Screen name="Voting" component={VotingScreen} />
          <Stack.Screen name="RoundResults" component={RoundResultsScreen} />
          <Stack.Screen name="FinalResults" component={FinalResultsScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}