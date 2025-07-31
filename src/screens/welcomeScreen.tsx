// src/screens/WelcomeScreen.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const WelcomeScreen = () => {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>FeverDreams</Text>
      <Text style={styles.subtitle}>AI Party Game</Text>
      
      <TouchableOpacity 
        style={styles.button}
        onPress={() => navigation.navigate('SignIn' as never)}
      >
        <Text style={styles.buttonText}>Get Started</Text>
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
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FF3B30',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 20,
    color: 'white',
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

export default WelcomeScreen;

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

const signInStyles = StyleSheet.create({
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

// src/screens/SelfieScreen.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useDispatch } from 'react-redux';
import { SelfieCapture } from '../components/SelfieCapture';
import { setSelfieUploaded } from '../store/slices/authSlice';

const SelfieScreen = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const [uploading, setUploading] = useState(false);

  const handleSelfieCapture = async (uri: string) => {
    try {
      setUploading(true);
      // TODO: Upload selfie to storage service
      console.log('Selfie captured:', uri);
      
      // Simulate upload delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      dispatch(setSelfieUploaded(true));
      navigation.navigate('Profile' as never);
    } catch (error) {
      console.error('Error uploading selfie:', error);
      Alert.alert('Error', 'Failed to upload selfie. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Take a Selfie</Text>
        <Text style={styles.subtitle}>
          This will be used to create funny AI images during the game
        </Text>
      </View>
      
      <SelfieCapture onCapture={handleSelfieCapture} />
      
      {uploading && (
        <View style={styles.overlay}>
          <Text style={styles.uploadingText}>Uploading your selfie...</Text>
        </View>
      )}
    </View>
  );
};

const selfieStyles = StyleSheet.create({
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
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadingText: {
    color: 'white',
    fontSize: 18,
  },
});

export default SelfieScreen;

// src/screens/ProfileScreen.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { logout } from '../store/slices/authSlice';

const ProfileScreen = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);

  const handleLogout = () => {
    dispatch(logout());
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile</Text>
      <Text style={styles.welcome}>Welcome, {user?.displayName || 'Player'}!</Text>
      
      <TouchableOpacity style={styles.button} onPress={handleLogout}>
        <Text style={styles.buttonText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
};

const profileStyles = StyleSheet.create({
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
    marginBottom: 20,
  },
  welcome: {
    fontSize: 18,
    color: '#ccc',
    marginBottom: 40,
  },
  button: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ProfileScreen;