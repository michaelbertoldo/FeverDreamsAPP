// src/screens/HomeScreen.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

type HomeScreenNavigationProp = StackNavigationProp<any>;

const HomeScreen = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();

  const handleStartPlaying = () => {
    // Navigate to game creation/joining flow
    console.log('Create/Join game pressed');
    // You can add navigation logic here later
    // navigation.navigate('GameLobby');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>AI Party Game</Text>
      <Text style={styles.subtitle}>Ready to have some fun?</Text>
      
      <TouchableOpacity 
        style={styles.button}
        onPress={handleStartPlaying}
      >
        <Text style={styles.buttonText}>Start Playing</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#ccc',
    marginBottom: 50,
  },
  button: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 25,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default HomeScreen;