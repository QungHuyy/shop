import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableOpacity,
} from 'react-native';

const { width } = Dimensions.get('window');

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  message: string;
  type: ToastType;
  visible: boolean;
  onHide: () => void;
  duration?: number;
}

const Toast: React.FC<ToastProps> = ({
  message,
  type,
  visible,
  onHide,
  duration = 3000,
}) => {
  const translateY = new Animated.Value(-100);

  useEffect(() => {
    if (visible) {
      // Hiển thị toast
      Animated.sequence([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.delay(duration),
        Animated.timing(translateY, {
          toValue: -100,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        onHide();
      });
    }
  }, [visible]);

  const getToastStyle = () => {
    switch (type) {
      case 'success':
        return {
          backgroundColor: '#4CAF50',
          icon: '✅',
        };
      case 'error':
        return {
          backgroundColor: '#F44336',
          icon: '❌',
        };
      case 'warning':
        return {
          backgroundColor: '#FF9800',
          icon: '⚠️',
        };
      case 'info':
        return {
          backgroundColor: '#2196F3',
          icon: 'ℹ️',
        };
      default:
        return {
          backgroundColor: '#2196F3',
          icon: 'ℹ️',
        };
    }
  };

  const toastStyle = getToastStyle();

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: toastStyle.backgroundColor,
          transform: [{ translateY }],
        },
      ]}
    >
      <TouchableOpacity
        style={styles.content}
        onPress={onHide}
        activeOpacity={0.8}
      >
        <Text style={styles.icon}>{toastStyle.icon}</Text>
        <Text style={styles.message} numberOfLines={2}>
          {message}
        </Text>
        <TouchableOpacity onPress={onHide} style={styles.closeButton}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    zIndex: 9999,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  icon: {
    fontSize: 20,
    marginRight: 12,
  },
  message: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
    marginLeft: 8,
  },
  closeText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default Toast; 