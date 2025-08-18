// src/screens/SelfieScreen.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useDispatch } from 'react-redux';
import { SelfieCapture } from '../components/SelfieCapture';
import { uploadSelfieToFirebase } from '../services/selfieService';
import { setSelfieUploaded } from '../store/slices/authSlice';
import Animated, { 
  FadeIn, 
  FadeOut,
  SlideInUp
} from 'react-native-reanimated';

export default function SelfieScreen() {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigation = useNavigation();
  const dispatch = useDispatch();
  
  const handleSelfieCapture = async (uri: string) => {
    try {
      setUploading(true);
      setError(null);
      
      // Upload selfie to Firebase Storage
      await uploadSelfieToFirebase(uri);
      
      // Update Redux state
      dispatch(setSelfieUploaded(true));
      
      // Navigate to profile completion
      navigation.navigate('Profile' as never);
    } catch (err) {
      setError('Failed to upload selfie. Please try again.');
      console.error('Selfie upload error:', err);
    } finally {
      setUploading(false);
    }
  };
  
  return (
    <View style={styles.container}>
      <Animated.View 
        entering={FadeIn.duration(500)} 
        style={styles.header}
      >
        <Text style={styles.title}>Take a Selfie</Text>
        <Text style={styles.subtitle}>
          This will be used to create funny AI images during the game
        </Text>
      </Animated.View>
      
      {uploading ? (
        <Animated.View 
          entering={FadeIn.duration(300)}
          exiting={FadeOut.duration(300)}
          style={styles.loadingContainer}
        >
          <ActivityIndicator size={24} color="#FF3B30" />
          <Text style={styles.loadingText}>Uploading your selfie...</Text>
          <Text style={styles.securityNote}>
            Your selfie is being securely processed and encrypted
          </Text>
        </Animated.View>
      ) : (
        <SelfieCapture onCapture={handleSelfieCapture} />
      )}
      
      {error && (
        <Animated.Text 
          entering={SlideInUp.duration(300)}
          style={styles.errorText}
        >
          {error}
        </Animated.Text>
      )}
      
      <Animated.View 
        entering={FadeIn.delay(500).duration(500)} 
        style={styles.privacyContainer}
      >
        <Text style={styles.privacyText}>
          Your selfie is stored securely and only used within the game.
          We never share your images with third parties.
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#CCC',
    textAlign: 'center',
    marginBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: 'white',
    fontSize: 18,
    marginTop: 20,
  },
  securityNote: {
    color: '#AAA',
    fontSize: 14,
    marginTop: 10,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  errorText: {
    color: '#FF3B30',
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
  },
  privacyContainer: {
    padding: 20,
    marginBottom: 20,
  },
  privacyText: {
    color: '#999',
    fontSize: 12,
    textAlign: 'center',
  }
});