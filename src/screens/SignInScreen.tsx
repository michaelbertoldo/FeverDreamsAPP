// src/screens/SignInScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
  FlatList,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useDispatch } from 'react-redux';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { setUser } from '../store/slices/authSlice';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

type SignInNavigationProp = StackNavigationProp<RootStackParamList, 'SignIn'>;

export default function SignInScreen() {
  const navigation = useNavigation<SignInNavigationProp>();
  const dispatch = useDispatch();
  
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showEmailSuggestions, setShowEmailSuggestions] = useState(false);
  const [recentEmails, setRecentEmails] = useState<string[]>([]);
  
  // Common email providers for suggestions
  const emailProviders = [
    'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 
    'icloud.com', 'aol.com', 'protonmail.com', 'mail.com'
  ];
  
  // Load recent emails from storage
  useEffect(() => {
    loadRecentEmails();
  }, []);
  
  const loadRecentEmails = async () => {
    try {
      const stored = await AsyncStorage.getItem('recentEmails');
      if (stored) {
        setRecentEmails(JSON.parse(stored));
      }
    } catch (error) {
      console.log('Error loading recent emails:', error);
    }
  };
  
  const saveRecentEmail = async (email: string) => {
    try {
      const updated = [email, ...recentEmails.filter(e => e !== email)].slice(0, 5);
      setRecentEmails(updated);
      await AsyncStorage.setItem('recentEmails', JSON.stringify(updated));
    } catch (error) {
      console.log('Error saving recent email:', error);
    }
  };
  
  // Generate email suggestions based on input
  const getEmailSuggestions = () => {
    if (!email.includes('@')) {
      // Show recent emails and common providers
      return [...recentEmails, ...emailProviders.map(provider => `@${provider}`)];
    }
    
    const [localPart, domain] = email.split('@');
    if (!domain) {
      // Show domain suggestions
      return emailProviders.map(provider => `${localPart}@${provider}`);
    }
    
    // Show exact matches and similar domains
    return emailProviders
      .filter(provider => provider.startsWith(domain))
      .map(provider => `${localPart}@${provider}`);
  };
  
  const handleEmailSelect = (suggestion: string) => {
    if (suggestion.startsWith('@')) {
      // User selected a domain, append to current input
      setEmail(email + suggestion);
    } else if (suggestion.includes('@')) {
      // User selected a complete email
      setEmail(suggestion);
    }
    setShowEmailSuggestions(false);
  };

  const handleSignIn = () => {
    if (!email || !displayName) {
      Alert.alert('Missing Info', 'Please fill in all fields');
      return;
    }

    // Save email to recent emails
    saveRecentEmail(email);

    // Mock sign in (replace with real auth)
    const mockUser = {
      id: `user_${Date.now()}`,
      email,
      displayName,
    };

    dispatch(setUser(mockUser));
    // Navigation will be handled automatically by AppNavigator based on Redux state
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={28} color="#FFF" />
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.title}>Let's Get Started!</Text>
          <Text style={styles.subtitle}>Enter your details to play</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="you@example.com"
              placeholderTextColor="#666"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                setShowEmailSuggestions(text.length > 0);
              }}
              onFocus={() => setShowEmailSuggestions(email.length > 0)}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
            
            {/* Email Suggestions */}
            {showEmailSuggestions && (
              <View style={styles.suggestionsContainer}>
                <FlatList
                  data={getEmailSuggestions()}
                  keyExtractor={(item, index) => `suggestion-${index}`}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.suggestionItem}
                      onPress={() => handleEmailSelect(item)}
                    >
                      <Text style={styles.suggestionText}>{item}</Text>
                      {recentEmails.includes(item) && (
                        <Ionicons name="time" size={16} color="#FF6B6B" />
                      )}
                    </TouchableOpacity>
                  )}
                  style={styles.suggestionsList}
                  keyboardShouldPersistTaps="handled"
                />
              </View>
            )}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Display Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Your funny name"
              placeholderTextColor="#666"
              value={displayName}
              onChangeText={setDisplayName}
              maxLength={20}
            />
          </View>
        </View>

        <TouchableOpacity style={styles.continueButton} onPress={handleSignIn}>
          <Text style={styles.continueText}>Continue</Text>
        </TouchableOpacity>
        
        {/* Quick Email Buttons */}
        {recentEmails.length > 0 && (
          <View style={styles.quickEmailContainer}>
            <Text style={styles.quickEmailLabel}>Quick Sign In:</Text>
            <View style={styles.quickEmailButtons}>
              {recentEmails.slice(0, 3).map((recentEmail, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.quickEmailButton}
                  onPress={() => {
                    setEmail(recentEmail);
                    setDisplayName(recentEmail.split('@')[0]); // Use email prefix as display name
                  }}
                >
                  <Text style={styles.quickEmailButtonText}>
                    {recentEmail.split('@')[0]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </KeyboardAvoidingView>
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
  },
  backButton: {
    marginBottom: 20,
  },
  header: {
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#888',
  },
  form: {
    gap: 20,
  },
  inputContainer: {
    gap: 8,
  },
  label: {
    fontSize: 16,
    color: '#CCC',
  },
  input: {
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    color: '#FFF',
    borderWidth: 1,
    borderColor: '#333',
  },
  continueButton: {
    backgroundColor: '#FF6B6B',
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
    marginTop: 40,
  },
  continueText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },
  suggestionsContainer: {
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#333',
    maxHeight: 200,
    marginTop: 5,
  },
  suggestionsList: {
    maxHeight: 200,
  },
  suggestionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  suggestionText: {
    color: '#FFF',
    fontSize: 16,
  },
  quickEmailContainer: {
    marginTop: 30,
    alignItems: 'center',
  },
  quickEmailLabel: {
    color: '#888',
    fontSize: 14,
    marginBottom: 15,
  },
  quickEmailButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  quickEmailButton: {
    backgroundColor: 'rgba(255, 107, 107, 0.2)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FF6B6B',
  },
  quickEmailButtonText: {
    color: '#FF6B6B',
    fontSize: 14,
    fontWeight: '600',
  },
});