// src/components/SelfieCapture.tsx
import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Camera } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring 
} from 'react-native-reanimated';

export const SelfieCapture = ({ onCapture }) => {
  const [hasPermission, setHasPermission] = useState(null);
  const [selfieUri, setSelfieUri] = useState(null);
  const cameraRef = useRef(null);
  const faceOutlineScale = useSharedValue(1);
  
  // Request camera permissions on mount
  React.useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);
  
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
      faceOutlineScale.value = 0.9;
      setTimeout(() => {
        faceOutlineScale.value = 1;
      }, 100);
      
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        skipProcessing: false,
      });
      
      setSelfieUri(photo.uri);
    }
  };
  
  // Pick from library function
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    
    if (!result.canceled) {
      setSelfieUri(result.assets[0].uri);
    }
  };
  
  // Submit selfie
  const submitSelfie = () => {
    if (selfieUri) {
      onCapture(selfieUri);
    }
  };
  
  // Render camera permission check
  if (hasPermission === null) {
    return <View style={styles.container}><Text>Requesting camera permission...</Text></View>;
  }
  
  if (hasPermission === false) {
    return <View style={styles.container}><Text>No access to camera. Please enable camera permissions.</Text></View>;
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
          <Camera
            ref={cameraRef}
            style={styles.camera}
            type={Camera.Constants.Type.front}
            ratio="1:1"
          >
            <View style={styles.cameraContent}>
              <Animated.View style={outlineStyle} />
              <Text style={styles.instructionText}>
                Position your face within the outline
              </Text>
            </View>
          </Camera>
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
  cameraContent: {
    flex: 1,
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
  }
});
