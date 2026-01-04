// src/components/AIDebugScreen.tsx
// Use this component to test and debug AI generation
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  StyleSheet,
  ActivityIndicator
} from 'react-native';
import { SafeContainer, SafeHeader } from './SafeContainer';
import { generateAIImage, testAIGeneration, getDebugInfo } from '../services/aiService';

interface DebugScreenProps {
  navigation: any;
}

export const AIDebugScreen: React.FC<DebugScreenProps> = ({ navigation }) => {
  const [prompt, setPrompt] = useState('superhero flying through the sky');
  const [selfieUrl, setSelfieUrl] = useState('https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop&crop=face');
  const [generatedImage, setGeneratedImage] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [apiStatus, setApiStatus] = useState<'unknown' | 'working' | 'error'>('unknown');

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  const testAPIConnection = async () => {
    addLog('🔧 Testing API connection...');
    try {
      const isWorking = await testAIGeneration();
      if (isWorking) {
        setApiStatus('working');
        addLog('✅ API connection successful');
      } else {
        setApiStatus('error');
        addLog('❌ API connection failed');
      }
    } catch (error) {
      setApiStatus('error');
      addLog(`❌ API test error: ${error.message}`);
    }
  };

  const generateTestImage = async () => {
    if (!prompt.trim()) {
      Alert.alert('Error', 'Please enter a prompt');
      return;
    }

    setIsGenerating(true);
    setGeneratedImage('');
    addLog(`🎨 Starting generation with prompt: "${prompt}"`);
    addLog(`🖼️ Using selfie URL: ${selfieUrl ? 'YES' : 'NO'}`);

    // Log debug info
    const debugInfo = getDebugInfo();
    addLog(`🔍 Debug info: ${JSON.stringify(debugInfo)}`);

    try {
      const imageUrl = await generateAIImage(prompt, selfieUrl);
      setGeneratedImage(imageUrl);
      addLog(`✅ Generation successful: ${imageUrl}`);
      
      // Check if it's a fallback/error image
      if (imageUrl.includes('placeholder') || imageUrl.includes('picsum')) {
        addLog('⚠️ WARNING: This appears to be a fallback image, not real AI generation');
      }
    } catch (error) {
      addLog(`❌ Generation failed: ${error.message}`);
      Alert.alert('Generation Failed', error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const clearLogs = () => setLogs([]);

    return (
    <SafeContainer backgroundColor="#1a1a1a">
      {/* Fixed Header */}
      <SafeHeader 
        title="🎨 AI Generation Debug"
        onBackPress={() => navigation.goBack()}
        backgroundColor="#1a1a1a"
      />

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >

      {/* API Status */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>API Status</Text>
        <View style={styles.statusRow}>
          <View style={[styles.statusDot, { backgroundColor: 
            apiStatus === 'working' ? '#4CAF50' : 
            apiStatus === 'error' ? '#F44336' : '#FFC107' 
          }]} />
          <Text style={styles.statusText}>
            {apiStatus === 'working' ? 'Connected' : 
             apiStatus === 'error' ? 'Disconnected' : 'Unknown'}
          </Text>
          <TouchableOpacity onPress={testAPIConnection} style={styles.testButton}>
            <Text style={styles.testButtonText}>Test</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Input Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Test Parameters</Text>
        
        <Text style={styles.label}>Prompt:</Text>
        <TextInput
          style={styles.textInput}
          value={prompt}
          onChangeText={setPrompt}
          placeholder="Enter your prompt..."
          multiline
        />

        <Text style={styles.label}>Selfie URL (optional):</Text>
        <TextInput
          style={styles.textInput}
          value={selfieUrl}
          onChangeText={setSelfieUrl}
          placeholder="https://example.com/selfie.jpg"
        />

                  <TouchableOpacity 
            onPress={generateTestImage} 
            style={[styles.generateButton, isGenerating && styles.disabledButton]}
            disabled={isGenerating}
            activeOpacity={0.8}
          >
            {isGenerating ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator color="white" size="small" />
                <Text style={styles.generateButtonText}> Generating...</Text>
              </View>
            ) : (
              <Text style={styles.generateButtonText}>🎨 Generate Image</Text>
            )}
          </TouchableOpacity>
      </View>

              {/* Results Section */}
        {generatedImage && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Generated Image</Text>
            <View style={styles.imageContainer}>
              <Image source={{ uri: generatedImage }} style={styles.generatedImage} />
            </View>
            <Text style={styles.imageUrl} selectable numberOfLines={2}>
              {generatedImage}
            </Text>
          </View>
        )}

      {/* Logs Section */}
      <View style={styles.section}>
        <View style={styles.logsHeader}>
          <Text style={styles.sectionTitle}>Debug Logs</Text>
          <TouchableOpacity onPress={clearLogs} style={styles.clearButton}>
            <Text style={styles.clearButtonText}>Clear</Text>
          </TouchableOpacity>
        </View>
        <ScrollView style={styles.logsContainer} nestedScrollEnabled>
          {logs.map((log, index) => (
            <Text key={index} style={styles.logText} selectable>{log}</Text>
          ))}
          {logs.length === 0 && (
            <Text style={styles.noLogsText}>No logs yet. Test the API or generate an image.</Text>
          )}
        </ScrollView>
      </View>

              {/* Instructions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔧 Debugging Steps</Text>
          <Text style={styles.instructionText}>
            1. First, test API connection{'\n'}
            2. Check that REPLICATE_API_TOKEN is set in functions/.env{'\n'}
            3. Make sure server is running (npm run dev in server/){'\n'}
            4. Try generating with a simple prompt{'\n'}
            5. Check logs for specific error messages{'\n'}
            6. If using mock images, set FORCE_REAL_AI = true in aiService.ts
          </Text>
        </View>

        {/* Bottom padding for scroll */}
        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeContainer>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  section: {
    backgroundColor: '#2a2a2a',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  statusText: {
    color: '#fff',
    flex: 1,
  },
  testButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    minHeight: 44, // Good touch target
  },
  testButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  label: {
    color: '#ccc',
    marginBottom: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  textInput: {
    backgroundColor: '#333',
    color: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#555',
    fontSize: 16,
    minHeight: 52,
  },
  generateButton: {
    backgroundColor: '#FF6B6B',
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  disabledButton: {
    backgroundColor: '#666',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  generateButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  imageContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
  },
  generatedImage: {
    width: '100%',
    height: 300,
  },
  imageUrl: {
    color: '#ccc',
    fontSize: 12,
    textAlign: 'center',
  },
  logsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  clearButton: {
    backgroundColor: '#666',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  clearButtonText: {
    color: '#fff',
    fontSize: 12,
  },
  logsContainer: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 12,
    maxHeight: 200,
  },
  logText: {
    color: '#ccc',
    fontSize: 12,
    fontFamily: 'monospace',
    marginBottom: 4,
    lineHeight: 16,
  },
  noLogsText: {
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 20,
  },
  instructionText: {
    color: '#ccc',
    fontSize: 14,
    lineHeight: 20,
  },
  bottomPadding: {
    height: 20,
  },
});
