import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Keyboard,
  InputAccessoryView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface KeyboardDismissAccessoryProps {
  id?: string;
  label?: string;
}

export const KeyboardDismissAccessory: React.FC<KeyboardDismissAccessoryProps> = ({
  id = 'globalAccessory',
  label = 'Done',
}) => {
  const insets = useSafeAreaInsets();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', () => setVisible(true));
    const hideSub = Keyboard.addListener('keyboardDidHide', () => setVisible(false));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  if (Platform.OS === 'ios') {
    return (
      <InputAccessoryView nativeID={id} backgroundColor="#1a1a1a">
        <View style={[styles.iosBar, { paddingBottom: insets.bottom > 0 ? 6 : 0 }]}>
          <View style={{ flex: 1 }} />
          <TouchableOpacity onPress={() => Keyboard.dismiss()} style={styles.doneButton} activeOpacity={0.8}>
            <Text style={styles.doneText}>{label}</Text>
          </TouchableOpacity>
        </View>
      </InputAccessoryView>
    );
  }

  // Android fallback: small floating dismiss button when keyboard is visible
  if (!visible) return null;
  return (
    <View style={[styles.androidFloat, { bottom: insets.bottom + 12 }]} pointerEvents="box-none">
      <TouchableOpacity onPress={() => Keyboard.dismiss()} style={styles.androidButton} activeOpacity={0.8}>
        <Text style={styles.doneText}>{label}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  iosBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#333',
    backgroundColor: '#1a1a1a',
  },
  doneButton: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
  },
  doneText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  androidFloat: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'flex-end',
    paddingRight: 16,
  },
  androidButton: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
});

export default KeyboardDismissAccessory;



