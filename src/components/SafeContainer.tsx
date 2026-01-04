// src/components/SafeContainer.tsx - FIXED EXPORTS
import React from 'react';
import { View, StyleSheet, ViewStyle, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import KeyboardDismissAccessory from './KeyboardDismissAccessory';

// ================== SafeContainer Component ==================
interface SafeContainerProps {
  children: React.ReactNode;
  style?: ViewStyle;
  backgroundColor?: string;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
}

export const SafeContainer: React.FC<SafeContainerProps> = ({
  children,
  style,
  backgroundColor = '#1a1a1a',
  edges = ['top', 'bottom']
}) => {
  const insets = useSafeAreaInsets();
  
  const paddingTop = edges.includes('top') ? insets.top + 16 : 16;
  const paddingBottom = edges.includes('bottom') ? insets.bottom + 16 : 16;
  const paddingLeft = edges.includes('left') ? insets.left + 16 : 16;
  const paddingRight = edges.includes('right') ? insets.right + 16 : 16;
  
  return (
    <View style={[
      safeContainerStyles.container,
      {
        backgroundColor,
        paddingTop,
        paddingBottom,
        paddingLeft,
        paddingRight,
      },
      style
    ]}>
      {children}
      {/* Global keyboard dismiss accessory */}
      <KeyboardDismissAccessory />
    </View>
  );
};

const safeContainerStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

// ================== SafeHeader Component ==================
interface SafeHeaderProps {
  title: string;
  onBackPress?: () => void;
  rightAction?: {
    icon: string;
    onPress: () => void;
  };
  backgroundColor?: string;
}

export const SafeHeader: React.FC<SafeHeaderProps> = ({
  title,
  onBackPress,
  rightAction,
  backgroundColor = '#1a1a1a'
}) => {
  const insets = useSafeAreaInsets();
  
  return (
    <View style={[
      safeHeaderStyles.container,
      { 
        backgroundColor,
        paddingTop: insets.top + 8,
      }
    ]}>
      <View style={safeHeaderStyles.content}>
        {/* Back Button */}
        {onBackPress ? (
          <TouchableOpacity 
            onPress={onBackPress} 
            style={safeHeaderStyles.backButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
        ) : (
          <View style={safeHeaderStyles.placeholder} />
        )}
        
        {/* Title */}
        <Text style={safeHeaderStyles.title} numberOfLines={1}>{title}</Text>
        
        {/* Right Action */}
        {rightAction ? (
          <TouchableOpacity 
            onPress={rightAction.onPress} 
            style={safeHeaderStyles.rightAction}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name={rightAction.icon as any} size={24} color="#fff" />
          </TouchableOpacity>
        ) : (
          <View style={safeHeaderStyles.placeholder} />
        )}
      </View>
    </View>
  );
};

const safeHeaderStyles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 22,
  },
  title: {
    flex: 1,
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginHorizontal: 12,
  },
  rightAction: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 22,
  },
  placeholder: {
    width: 44,
    height: 44,
  },
});

// ================== SafeBottomButton Component ==================
interface SafeBottomButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  backgroundColor?: string;
  style?: any;
}

export const SafeBottomButton: React.FC<SafeBottomButtonProps> = ({
  title,
  onPress,
  disabled = false,
  loading = false,
  backgroundColor = '#FF6B6B',
  style
}) => {
  const insets = useSafeAreaInsets();
  
  return (
    <View style={[
      safeBottomButtonStyles.container,
      { paddingBottom: insets.bottom + 16 }
    ]}>
      <TouchableOpacity
        style={[
          safeBottomButtonStyles.button,
          { backgroundColor: disabled ? '#666' : backgroundColor },
          style
        ]}
        onPress={onPress}
        disabled={disabled || loading}
        activeOpacity={0.8}
      >
        {loading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Text style={safeBottomButtonStyles.buttonText}>{title}</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const safeBottomButtonStyles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 16,
    backgroundColor: '#1a1a1a',
  },
  button: {
    paddingVertical: 16,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});

// Default export for convenience
export default SafeContainer;
