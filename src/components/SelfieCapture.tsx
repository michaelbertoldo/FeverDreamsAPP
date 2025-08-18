// src/components/SelfieCapture.tsx
import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring 
} from 'react-native-reanimated';

interface SelfieCaptureProps {
  onCapture: (uri: string) => void;
}

export const SelfieCapture: React.FC<SelfieCaptureProps> = ({ onCapture }) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [selfieUri, setSelfieUri] = useState<string | null>(null);
  const [facing, setFacing] = useState<CameraType>('front');
  const cameraRef = useRef<CameraView>(null);
  const faceOutlineScale = useSharedValue(1);
  
  // Request permissions on mount
  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, [permission, requestPermission]);
  
  // Animated face outline style
  const outlineStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: withSpring(faceOutlineScale.value) }],
      borderColor: 'white',
      borderWidth: 2,
      borderRadius: 150,
      width: 300,
      height: 300,
      position: 'absolute'
    };
  });
  
  // Take picture function
  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        faceOutlineScale.value = 0.9;
        setTimeout(() => {
          faceOutlineScale.value = 1;
        }, 100);
        
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
        });
        
        if (photo) {
          setSelfieUri(photo.uri);
        }
      } catch (error) {
        console.error('Error taking picture:', error);
        Alert.alert('Error', 'Failed to take picture. Please try again.');
      }
    }
  };
  
  // Pick from library function
  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Sorry, we need camera roll permissions to select a photo.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets && result.assets[0]) {
        setSelfieUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to select image. Please try again.');
    }
  };
  
  // Submit selfie
  const submitSelfie = () => {
    if (selfieUri) {
      onCapture(selfieUri);
    }
  };
  
  // Render camera permission check
  if (!permission) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>Requesting camera permission...</Text>
      </View>
    );
  }
  
  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>Camera permission is required to take selfies.</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      {selfieUri ? (
        // Preview captured selfie
        <View style={styles.previewContainer}>
          <Image source={{ uri: selfieUri }} style={styles.preview} />
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.button} onPress={() => setSelfieUri(null)}>
              <Text style={styles.buttonText}>Retake</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.primaryButton]} onPress={submitSelfie}>
              <Text style={styles.primaryButtonText}>Use This Selfie</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        // Camera view for capturing
        <View style={styles.cameraContainer}>
          <CameraView
            ref={cameraRef}
            style={styles.camera}
            facing={facing}
          />
          <View pointerEvents="none" style={styles.overlay}>
            <Animated.View style={outlineStyle} />
            <Text style={styles.instructionText}>
              Position your face within the outline
            </Text>
          </View>
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.button} onPress={pickImage}>
              <Text style={styles.buttonText}>Choose from Library</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.primaryButton]} onPress={takePicture}>
              <Text style={styles.primaryButtonText}>Take Selfie</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  cameraContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  preview: {
    width: 300,
    height: 300,
    borderRadius: 150,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    padding: 20,
  },
  button: {
    padding: 15,
    borderRadius: 25,
    backgroundColor: '#333',
    alignItems: 'center',
    minWidth: 150,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
  },
  primaryButton: {
    backgroundColor: '#FF3B30',
  },
  primaryButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  instructionText: {
    color: 'white',
    fontSize: 16,
    position: 'absolute',
    bottom: 100,
    textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 10,
    borderRadius: 10,
  },
  permissionText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
    margin: 20,
  },
});