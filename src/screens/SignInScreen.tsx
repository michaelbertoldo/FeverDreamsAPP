// src/screens/SignInScreen.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useDispatch } from 'react-redux';
import * as AppleAuthentication from 'expo-apple-authentication';
import { appleSignIn } from '../store/slices/authSlice';
import { AppDispatch } from '../store';

const SignInScreen = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch<AppDispatch>();
  const [loading, setLoading] = useState(false);

  const handleAppleSignIn = async () => {
    try {
      setLoading(true);
      await dispatch(appleSignIn()).unwrap();
      navigation.navigate('Selfie' as never);
    } catch (error) {
      console.error('Sign in error:', error);
      Alert.alert('Sign In Error', 'Failed to sign in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to FeverDreams</Text>
      <Text style={styles.subtitle}>Sign in to start playing</Text>
      
      <AppleAuthentication.AppleAuthenticationButton
        buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
        buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE}
        cornerRadius={5}
        style={styles.appleButton}
        onPress={handleAppleSignIn}
      />
      
      <TouchableOpacity 
        style={styles.skipButton}
        onPress={() => navigation.navigate('Selfie' as never)}
      >
        <Text style={styles.skipText}>Skip for now</Text>
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
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#ccc',
    textAlign: 'center',
    marginBottom: 50,
  },
  appleButton: {
    width: 200,
    height: 50,
    marginBottom: 20,
  },
  skipButton: {
    marginTop: 20,
  },
  skipText: {
    color: '#999',
    fontSize: 16,
    textDecorationLine: 'underline',
  },
});

export default SignInScreen;