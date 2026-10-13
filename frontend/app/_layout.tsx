import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '../services/auth/useAuth';
import { DriveProvider } from '../features/file-library/useDrive';
import { ToastContainer } from '../components/Toast';
import { GlassBackground } from '../components/GlassBackground';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <DriveProvider>
          <GlassBackground>
            <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: 'transparent' } }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="(auth)" options={{ headerShown: false }} />
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="note-editor" options={{ presentation: 'modal' }} />
              <Stack.Screen name="upload" />
              <Stack.Screen name="file-viewer" />
            </Stack>
            <ToastContainer />
            <StatusBar style="light" />
          </GlassBackground>
        </DriveProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
