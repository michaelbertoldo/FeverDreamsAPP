// src/components/MemeEditor.tsx
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Image } from 'expo-image';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { AnimatedButton } from './ui/AnimatedButton';
import { createAndShareMeme } from '../services/sharingService';
import { colors, typography, spacing, borderRadius } from '../theme';

interface MemeEditorProps {
  imageUrl: string;
  onClose: () => void;
  onShare: (success: boolean) => void;
}

type StickerType = 'none' | 'winner' | 'funny' | 'party';
type StickerPosition = 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight';

export const MemeEditor: React.FC<MemeEditorProps> = ({
  imageUrl,
  onClose,
  onShare,
}) => {
  // State
  const [topText, setTopText] = useState('');
  const [bottomText, setBottomText] = useState('');
  const [selectedSticker, setSelectedSticker] = useState<StickerType>('none');
  const [stickerPosition, setStickerPosition] = useState<StickerPosition>('bottomRight');
  const [isSharing, setIsSharing] = useState(false);
  
  // Animation values
  const editorHeight = useSharedValue(0);
  const previewScale = useSharedValue(1);
  
  // Refs
  const scrollViewRef = useRef<ScrollView>(null);
  
  // Handle share button press
  const handleShare = async () => {
    try {
      setIsSharing(true);
      
      // Animate preview before sharing
      previewScale.value = withSpring(1.05, { damping: 10, stiffness: 100 });
      setTimeout(() => {
        previewScale.value = withSpring(1, { damping: 10, stiffness: 100 });
      }, 300);
      
      // Create and share meme
      const success = await createAndShareMeme(
        imageUrl,
        {
          topText,
          bottomText,
          stickerType: selectedSticker,
          stickerPosition,
        },
        {
          title: 'Check out my AI Party Game meme!',
          message: 'Created with AI Party Game',
          saveToMediaLibrary: true,
        }
      );
      
      // Notify parent component
      onShare(success);
      
      // Close editor if successful
      if (success) {
        setTimeout(() => {
          onClose();
        }, 500);
      }
    } catch (error) {
      console.error('Error sharing meme:', error);
      onShare(false);
    } finally {
      setIsSharing(false);
    }
  };
  
  // Animated styles
  const previewStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: previewScale.value }],
    };
  });
  
  // Sticker options with proper typing
  const stickerOptions: Array<{
    id: StickerType;
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
  }> = [
    { id: 'none', label: 'None', icon: 'close-circle-outline' },
    { id: 'winner', label: 'Winner', icon: 'trophy-outline' },
    { id: 'funny', label: 'Funny', icon: 'happy-outline' },
    { id: 'party', label: 'Party', icon: 'beer-outline' },
  ];
  
  // Position options with proper typing
  const positionOptions: Array<{
    id: StickerPosition;
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
  }> = [
    { id: 'topLeft', label: 'Top Left', icon: 'arrow-up-outline' },
    { id: 'topRight', label: 'Top Right', icon: 'arrow-up-outline' },
    { id: 'bottomLeft', label: 'Bottom Left', icon: 'arrow-down-outline' },
    { id: 'bottomRight', label: 'Bottom Right', icon: 'arrow-down-outline' },
  ];
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Meme Editor</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={24} color={colors.text.primary} />
        </TouchableOpacity>
      </View>
      
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[styles.previewContainer, previewStyle]}>
          <View style={styles.memeContainer}>
            <Image
              source={{ uri: imageUrl }}
              style={styles.memeImage}
              contentFit="cover"
            />
            
            {topText ? (
              <Text style={styles.memeTopText}>{topText.toUpperCase()}</Text>
            ) : null}
            
            {bottomText ? (
              <Text style={styles.memeBottomText}>{bottomText.toUpperCase()}</Text>
            ) : null}
            
            {selectedSticker !== 'none' && (
              <Image
                source={getStickerSource(selectedSticker)}
                style={[
                  styles.sticker,
                  getStickerStyle(stickerPosition),
                ]}
                contentFit="contain"
              />
            )}
          </View>
        </Animated.View>
        
        <View style={styles.editorSection}>
          <Text style={styles.sectionTitle}>Text</Text>
          
          <TextInput
            style={styles.textInput}
            placeholder="Top text"
            placeholderTextColor={colors.text.tertiary}
            value={topText}
            onChangeText={setTopText}
            maxLength={50}
          />
          
          <TextInput
            style={styles.textInput}
            placeholder="Bottom text"
            placeholderTextColor={colors.text.tertiary}
            value={bottomText}
            onChangeText={setBottomText}
            maxLength={50}
          />
        </View>
        
        <View style={styles.editorSection}>
          <Text style={styles.sectionTitle}>Sticker</Text>
          
          <View style={styles.optionsGrid}>
            {stickerOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.optionButton,
                  selectedSticker === option.id && styles.selectedOption,
                ]}
                onPress={() => setSelectedSticker(option.id)}
              >
                <Ionicons
                  name={option.icon}
                  size={24}
                  color={
                    selectedSticker === option.id
                      ? colors.text.primary
                      : colors.text.tertiary
                  }
                />
                <Text
                  style={[
                    styles.optionLabel,
                    selectedSticker === option.id && styles.selectedOptionLabel,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        
        {selectedSticker !== 'none' && (
          <Animated.View
            entering={FadeIn.duration(300)}
            exiting={FadeOut.duration(300)}
            style={styles.editorSection}
          >
            <Text style={styles.sectionTitle}>Sticker Position</Text>
            
            <View style={styles.optionsGrid}>
              {positionOptions.map((option) => (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.optionButton,
                    stickerPosition === option.id && styles.selectedOption,
                  ]}
                  onPress={() => setStickerPosition(option.id)}
                >
                  <Ionicons
                    name={option.icon}
                    size={24}
                    color={
                      stickerPosition === option.id
                        ? colors.text.primary
                        : colors.text.tertiary
                    }
                  />
                  <Text
                    style={[
                      styles.optionLabel,
                      stickerPosition === option.id && styles.selectedOptionLabel,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>
        )}
      </ScrollView>
      
      <View style={styles.footer}>
        <AnimatedButton
          text="Share Meme"
          variant="primary"
          size="medium"
          onPress={handleShare}
          loading={isSharing}
          disabled={isSharing}
          icon={<Ionicons name="share-outline" size={20} color={colors.text.primary} />}
          iconPosition="left"
          style={styles.shareButton}
        />
      </View>
    </View>
  );
};

// Helper function to get sticker source
const getStickerSource = (sticker: StickerType) => {
  switch (sticker) {
    case 'winner':
      return require('../assets/stickers/winner.png');
    case 'funny':
      return require('../assets/stickers/funny.png');
    case 'party':
      return require('../assets/stickers/party.png');
    default:
      return null;
  }
};

// Helper function to get sticker position style
const getStickerStyle = (position: StickerPosition) => {
  switch (position) {
    case 'topLeft':
      return styles.stickerTopLeft;
    case 'topRight':
      return styles.stickerTopRight;
    case 'bottomLeft':
      return styles.stickerBottomLeft;
    case 'bottomRight':
    default:
      return styles.stickerBottomRight;
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.background.tertiary,
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  closeButton: {
    padding: spacing.xs,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  previewContainer: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  memeContainer: {
    position: 'relative',
    width: '100%',
    aspectRatio: 1,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  memeImage: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.background.tertiary,
  },
  memeTopText: {
    position: 'absolute',
    top: spacing.md,
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: typography.fontSize.xxl,
    fontWeight: 'bold',
    color: colors.text.primary,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 3,
    padding: spacing.xs,
  },
  memeBottomText: {
    position: 'absolute',
    bottom: spacing.md,
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: typography.fontSize.xxl,
    fontWeight: 'bold',
    color: colors.text.primary,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 3,
    padding: spacing.xs,
  },
  sticker: {
    position: 'absolute',
    width: '25%',
    height: '25%',
  },
  stickerTopLeft: {
    top: spacing.md,
    left: spacing.md,
  },
  stickerTopRight: {
    top: spacing.md,
    right: spacing.md,
  },
  stickerBottomLeft: {
    bottom: spacing.md,
    left: spacing.md,
  },
  stickerBottomRight: {
    bottom: spacing.md,
    right: spacing.md,
  },
  editorSection: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  textInput: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    color: colors.text.primary,
    fontSize: typography.fontSize.md,
    marginBottom: spacing.sm,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -spacing.xs,
  },
  optionButton: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    margin: spacing.xs,
    width: '22%',
  },
  selectedOption: {
    backgroundColor: colors.primary,
  },
  optionLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  selectedOptionLabel: {
    color: colors.text.primary,
  },
  footer: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.background.tertiary,
  },
  shareButton: {
    width: '100%',
  },
});