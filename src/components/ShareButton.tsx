// src/components/ShareButton.tsx
import React, { useState } from 'react';
import { StyleSheet, Modal, View } from 'react-native';
import { AnimatedButton } from './ui/AnimatedButton';
import { MemeEditor } from './MemeEditor';
import { shareImage } from '../services/sharingService';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';

interface ShareButtonProps {
  imageUrl: string;
  onShareStart?: () => void;
  onShareComplete?: (success: boolean) => void;
  style?: any;
}

export const ShareButton: React.FC<ShareButtonProps> = ({
  imageUrl,
  onShareStart,
  onShareComplete,
  style,
}) => {
  // State
  const [isSharing, setIsSharing] = useState(false);
  const [showMemeEditor, setShowMemeEditor] = useState(false);
  
  // Handle quick share
  const handleQuickShare = async () => {
    try {
      setIsSharing(true);
      onShareStart?.();
      
      const success = await shareImage(imageUrl, {
        title: 'Check out this image!',
        message: 'Created with AI Party Game',
        saveToMediaLibrary: true,
      });
      
      onShareComplete?.(success);
    } catch (error) {
      console.error('Error sharing image:', error);
      onShareComplete?.(false);
    } finally {
      setIsSharing(false);
    }
  };
  
  // Handle meme editor open
  const handleOpenMemeEditor = () => {
    setShowMemeEditor(true);
    onShareStart?.();
  };
  
  // Handle meme share complete
  const handleMemeShareComplete = (success: boolean) => {
    onShareComplete?.(success);
  };
  
  return (
    <>
      <View style={[styles.container, style]}>
        <AnimatedButton
          text="Share"
          variant="primary"
          size="medium"
          onPress={handleQuickShare}
          loading={isSharing}
          disabled={isSharing || showMemeEditor}
          icon={<Ionicons name="share-outline" size={20} color={colors.text.primary} />}
          iconPosition="left"
          style={styles.shareButton}
        />
        
        <AnimatedButton
          text="Create Meme"
          variant="outline"
          size="medium"
          onPress={handleOpenMemeEditor}
          disabled={isSharing || showMemeEditor}
          icon={<Ionicons name="create-outline" size={20} color={colors.primary} />}
          iconPosition="left"
          style={styles.memeButton}
        />
      </View>
      
      <Modal
        visible={showMemeEditor}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowMemeEditor(false)}
      >
        <MemeEditor
          imageUrl={imageUrl}
          onClose={() => setShowMemeEditor(false)}
          onShare={handleMemeShareComplete}
        />
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareButton: {
    marginRight: 8,
  },
  memeButton: {
    marginLeft: 8,
  },
});
