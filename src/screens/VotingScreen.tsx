// src/screens/VotingScreen.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const VotingScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Voting Screen</Text>
      <Text style={styles.subtitle}>Vote for the funniest image!</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
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
  },
});

export default VotingScreen;