// src/screens/GalleryScreen.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const GalleryScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Gallery</Text>
      <Text style={styles.subtitle}>Your saved AI creations</Text>
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

export default GalleryScreen;