import React from 'react';
import { ImageBackground, StyleSheet, View, Platform } from 'react-native';

const bgImage = require('../assets/background.jpg');

interface Props {
  children: React.ReactNode;
  overlay?: boolean;
}

export function GlassBackground({ children, overlay = true }: Props) {
  return (
    <ImageBackground
      source={bgImage}
      style={styles.background}
      resizeMode="cover"
    >
      {overlay && <View style={styles.overlay} />}
      {children}
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#0a0f0d',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
});
