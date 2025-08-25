import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Ionicons } from '@expo/vector-icons';

type WelcomeNavigationProp = StackNavigationProp<RootStackParamList, 'Welcome'>;

export default function WelcomeScreen() {
  const navigation = useNavigation<WelcomeNavigationProp>();

  const handleContinueWithApple = () => {
    navigation.navigate('SignIn');
  };

  const handleContinueWithEmail = () => {
    navigation.navigate('SignIn');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>🎭</Text>
          <Text style={styles.title}>AI Party Game</Text>
          <Text style={styles.subtitle}>Where creativity meets AI hilarity!</Text>
        </View>

        {/* Features */}
        <View style={styles.featuresContainer}>
          <View style={styles.featureItem}>
            <Ionicons name="camera" size={24} color="#FF6B6B" />
            <Text style={styles.featureText}>Take a selfie</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="bulb" size={24} color="#4ECDC4" />
            <Text style={styles.featureText}>Answer funny prompts</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="sparkles" size={24} color="#FFE66D" />
            <Text style={styles.featureText}>AI generates hilarious images</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="heart" size={24} color="#FF6B6B" />
            <Text style={styles.featureText}>Vote for the funniest</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.appleButton}
            onPress={handleContinueWithApple}
          >
            <Ionicons name="logo-apple" size={24} color="#000" />
            <Text style={styles.appleButtonText}>Continue with Apple</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.emailButton}
            onPress={handleContinueWithEmail}
          >
            <Ionicons name="mail" size={24} color="#FFF" />
            <Text style={styles.emailButtonText}>Sign in with Email</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            By continuing, you agree to our Terms of Service and Privacy Policy
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    marginTop: 60,
  },
  logo: {
    fontSize: 80,
    marginBottom: 20,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#888',
    textAlign: 'center',
    lineHeight: 24,
  },
  featuresContainer: {
    marginVertical: 40,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  featureText: {
    color: '#FFF',
    fontSize: 18,
    marginLeft: 15,
    fontWeight: '500',
  },
  actionsContainer: {
    gap: 15,
  },
  appleButton: {
    backgroundColor: '#FFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 25,
    gap: 10,
  },
  appleButtonText: {
    color: '#000',
    fontSize: 18,
    fontWeight: '600',
  },
  emailButton: {
    backgroundColor: '#FF6B6B',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 25,
    gap: 10,
  },
  emailButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  footerText: {
    color: '#666',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
});