import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors } from './design/theme';

interface Props {
  children: React.ReactNode;
  overlay?: boolean;
}

export function GlassBackground({ children }: Props) {
  return (
    <View style={styles.container}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: colors.background,
  },
});
