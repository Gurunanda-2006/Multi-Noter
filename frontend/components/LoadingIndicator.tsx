import React from 'react';
import { ActivityIndicator, StyleSheet, View, Text } from 'react-native';
import { colors, spacing, typography } from './design/theme';

interface Props {
  message?: string;
  size?: 'small' | 'large';
  fullScreen?: boolean;
}

export function LoadingIndicator({ message, size = 'large', fullScreen = false }: Props) {
  return (
    <View style={[styles.container, fullScreen && styles.fullScreen]}>
      <ActivityIndicator size={size} color={colors.accent} />
      {message ? <Text style={styles.message}>{message}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  fullScreen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  message: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
