import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '../services/auth/useAuth';
import { DriveProvider } from '../features/file-library/useDrive';
import { ToastContainer } from '../components/Toast';
import { View, StyleSheet } from 'react-native';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <DriveProvider>
          <View style={styles.root}>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="(auth)" options={{ headerShown: false }} />
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="note-editor" options={{ presentation: 'modal' }} />
              <Stack.Screen name="upload" />
              <Stack.Screen name="file-viewer" />
            </Stack>
            <ToastContainer />
            <StatusBar style="dark" />
          </View>
        </DriveProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FAFAFA' },
});
