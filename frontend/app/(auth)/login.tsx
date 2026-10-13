import React from 'react';
import {
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Redirect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../services/auth/useAuth';
import { LoadingIndicator } from '../../components/LoadingIndicator';
import { colors, spacing, typography, shadow } from '../../components/design/theme';

export default function LoginScreen() {
  const { isAuthenticated, isLoading, signIn, error } = useAuth();

  if (isLoading) {
    return <LoadingIndicator message="Connecting to Google Drive..." fullScreen />;
  }

  if (isAuthenticated) {
    return <Redirect href="/(tabs)/" />;
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <View style={styles.logoArea}>
            <View style={styles.logoSquare}>
              <Image
                source={require('../../assets/logo.png')}
                style={styles.logoImage}
                resizeMode="cover"
              />
            </View>
            <Text style={styles.appName}>Personal Storage Hub</Text>
            <Text style={styles.tagline}>Your central hub for personal notes & files</Text>
          </View>

          <View style={styles.features}>
            {[
              { icon: 'document-text-outline', label: 'Write & store plain text notes (.txt)' },
              { icon: 'cloud-upload-outline', label: 'Upload PDFs, Word docs, photos & videos' },
              { icon: 'folder-outline', label: 'Organized inside dedicated Drive folders' },
              { icon: 'search-outline', label: 'Instant search, preview, and trash management' },
              { icon: 'shield-checkmark-outline', label: 'Private & direct: no external database' },
            ].map((f) => (
              <View key={f.icon} style={styles.featureRow}>
                <View style={styles.featureIcon}>
                  <Ionicons name={f.icon as any} size={18} color={colors.accent} />
                </View>
                <Text style={styles.featureText}>{f.label}</Text>
              </View>
            ))}
          </View>

          {error ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle-outline" size={18} color={colors.danger} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={styles.signInBtn}
            onPress={signIn}
            activeOpacity={0.85}
            disabled={isLoading}
          >
            <View style={styles.googleIcon}>
              <Text style={styles.googleG}>G</Text>
            </View>
            <Text style={styles.signInText}>Connect Google Drive</Text>
          </TouchableOpacity>

          <Text style={styles.disclaimer}>
            Personal Storage Hub requests only the minimal drive.file scope needed to manage its own folder. It never touches or modifies any other files in your Drive.
          </Text>

          {Platform.OS !== 'web' ? (
            <Text style={styles.platformNote}>
              On mobile, run via an Expo development build for custom OAuth redirect handling.
            </Text>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: colors.surface,
    borderRadius: 0,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    gap: spacing.xl,
    ...shadow.md,
  },
  logoArea: { alignItems: 'center', gap: spacing.md },
  logoSquare: {
    width: 90,
    height: 90,
    borderRadius: 0,
    borderWidth: 2,
    borderColor: colors.accent,
    backgroundColor: colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  logoImage: {
    width: '100%',
    height: '100%',
    borderRadius: 0,
  },
  appName: { ...typography.h1, textAlign: 'center' },
  tagline: { ...typography.body, color: colors.textSecondary, textAlign: 'center' },
  features: { gap: spacing.md },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  featureIcon: {
    width: 36,
    height: 36,
    borderRadius: 0,
    backgroundColor: colors.accentLight,
    borderWidth: 1,
    borderColor: '#FED7AA',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  featureText: { ...typography.body, flex: 1, fontSize: 14 },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.dangerLight,
    borderRadius: 0,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.danger,
  },
  errorText: { ...typography.bodySmall, color: colors.danger, flex: 1 },
  signInBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    backgroundColor: colors.accent,
    borderRadius: 0,
    paddingVertical: spacing.base,
    paddingHorizontal: spacing.xl,
    ...shadow.sm,
  },
  googleIcon: {
    width: 26,
    height: 26,
    borderRadius: 0,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleG: { color: colors.accent, fontSize: 15, fontWeight: '700' },
  signInText: { ...typography.button, color: '#FFFFFF' },
  disclaimer: {
    ...typography.bodySmall,
    textAlign: 'center',
    color: colors.textSecondary,
    lineHeight: 18,
  },
  platformNote: {
    ...typography.caption,
    textAlign: 'center',
    color: colors.warning,
    backgroundColor: colors.warningLight,
    borderRadius: 0,
    padding: spacing.sm,
    lineHeight: 17,
    borderWidth: 1,
    borderColor: colors.warning,
  },
});
