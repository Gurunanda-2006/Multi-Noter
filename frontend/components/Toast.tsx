import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, shadow } from './design/theme';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
}

const ToastConfig: Record<ToastType, { bg: string; border: string; icon: string; iconColor: string; textColor: string }> = {
  success: { bg: '#F0FDF4', border: '#BBF7D0', icon: 'checkmark-circle-outline', iconColor: colors.success, textColor: '#166534' },
  error: { bg: '#FEF2F2', border: '#FECACA', icon: 'close-circle-outline', iconColor: colors.danger, textColor: '#991B1B' },
  info: { bg: '#EFF6FF', border: '#BFDBFE', icon: 'information-circle-outline', iconColor: colors.info, textColor: '#1E40AF' },
  warning: { bg: '#FFFBEB', border: '#FDE68A', icon: 'warning-outline', iconColor: colors.warning, textColor: '#92400E' },
};

type ToastListener = (msg: ToastMessage) => void;
const listeners: ToastListener[] = [];

export const toast = {
  show(type: ToastType, message: string) {
    const msg: ToastMessage = { id: Date.now().toString(), type, message };
    listeners.forEach((l) => l(msg));
  },
  success(message: string) { this.show('success', message); },
  error(message: string) { this.show('error', message); },
  info(message: string) { this.show('info', message); },
  warning(message: string) { this.show('warning', message); },
};

export function ToastContainer() {
  const [messages, setMessages] = useState<ToastMessage[]>([]);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: string) => {
    const t = timers.current.get(id);
    if (t) clearTimeout(t);
    timers.current.delete(id);
    setMessages((prev) => prev.filter((m) => m.id !== id));
  }, []);

  useEffect(() => {
    const listener: ToastListener = (msg) => {
      setMessages((prev) => [...prev.slice(-2), msg]);
      const t = setTimeout(() => dismiss(msg.id), 4000);
      timers.current.set(msg.id, t);
    };
    listeners.push(listener);
    return () => {
      const idx = listeners.indexOf(listener);
      if (idx >= 0) listeners.splice(idx, 1);
    };
  }, [dismiss]);

  if (messages.length === 0) return null;

  return (
    <View style={styles.container} pointerEvents="box-none">
      {messages.map((msg) => {
        const config = ToastConfig[msg.type];
        return (
          <TouchableOpacity
            key={msg.id}
            style={[styles.toast, { backgroundColor: config.bg, borderColor: config.border }]}
            onPress={() => dismiss(msg.id)}
            activeOpacity={0.9}
          >
            <Ionicons name={config.icon as any} size={20} color={config.iconColor} />
            <Text style={[styles.text, { color: config.textColor }]} numberOfLines={3}>{msg.message}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 100 : 80,
    left: spacing.base,
    right: spacing.base,
    gap: spacing.sm,
    zIndex: 9999,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    borderRadius: 0,
    borderWidth: 1,
    ...shadow.md,
  },
  text: {
    ...typography.body,
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
  },
});
