import React, { useState } from 'react';
import {
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../services/auth/useAuth';
import { useDrive } from '../../features/file-library/useDrive';
import { clearCache } from '../../services/cache/cacheService';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { toast } from '../../components/Toast';
import { formatFileSize } from '../../utils/filename';
import { colors, radius, spacing, typography, shadow } from '../../components/design/theme';

export default function SettingsScreen() {
  const { session, signOut } = useAuth();
  const { quota, refresh, items } = useDrive();
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const [showClearCacheConfirm, setShowClearCacheConfirm] = useState(false);

  const handleClearCache = async () => {
    await clearCache();
    toast.success('Local cache cleared. Syncing fresh from Drive...');
    await refresh();
    setShowClearCacheConfirm(false);
  };

  const handleSignOut = async () => {
    setShowSignOutConfirm(false);
    await signOut();
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Google Account</Text>
          <View style={styles.card}>
            <View style={styles.accountRow}>
              {session?.userInfo?.picture ? (
                <Image source={{ uri: session.userInfo.picture }} style={styles.avatarImg} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarText}>
                    {session?.userInfo?.name?.charAt(0) || 'U'}
                  </Text>
                </View>
              )}
              <View style={styles.accountDetails}>
                <Text style={styles.accountName}>{session?.userInfo?.name || 'Google User'}</Text>
                <Text style={styles.accountEmail}>{session?.userInfo?.email || 'Not connected'}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Storage & Quota</Text>
          <View style={styles.card}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Managed Items</Text>
              <Text style={styles.infoValue}>{items.length} items</Text>
            </View>
            {quota && (
              <>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Drive Storage Used</Text>
                  <Text style={styles.infoValue}>{formatFileSize(quota.usageInDrive)}</Text>
                </View>
                {quota.limit > 0 && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Total Account Limit</Text>
                    <Text style={styles.infoValue}>{formatFileSize(quota.limit)}</Text>
                  </View>
                )}
              </>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Maintenance</Text>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => setShowClearCacheConfirm(true)}
            activeOpacity={0.8}
          >
            <View style={[styles.actionIconWrap, { backgroundColor: colors.accentLight }]}>
              <Ionicons name="refresh-circle-outline" size={22} color={colors.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.actionTitle}>Clear Local Cache</Text>
              <Text style={styles.actionSubtitle}>Force rebuild library from Google Drive</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionCard, { marginTop: spacing.sm }]}
            onPress={() => setShowSignOutConfirm(true)}
            activeOpacity={0.8}
          >
            <View style={[styles.actionIconWrap, { backgroundColor: colors.dangerLight }]}>
              <Ionicons name="log-out-outline" size={22} color={colors.danger} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.actionTitle, { color: colors.danger }]}>Disconnect Account</Text>
              <Text style={styles.actionSubtitle}>Your files in Google Drive remain safe and intact</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.versionText}>Personal Storage Hub v1.0.0</Text>
          <Text style={styles.sourceText}>Powered by Google Drive API v3</Text>
        </View>
      </ScrollView>

      <ConfirmDialog
        visible={showClearCacheConfirm}
        title="Clear Cache"
        message="This will delete the local metadata cache and re-fetch everything directly from Google Drive. Your actual files will not be affected."
        confirmLabel="Clear Cache"
        onConfirm={handleClearCache}
        onCancel={() => setShowClearCacheConfirm(false)}
      />

      <ConfirmDialog
        visible={showSignOutConfirm}
        title="Disconnect Google Drive"
        message="Are you sure you want to sign out? Your files in Google Drive will remain completely untouched, and you can reconnect anytime."
        confirmLabel="Sign Out"
        danger
        onConfirm={handleSignOut}
        onCancel={() => setShowSignOutConfirm(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: { ...typography.h2, color: colors.textPrimary },
  scroll: { flex: 1 },
  scrollContent: {
    padding: spacing.base,
    gap: spacing.xl,
    paddingBottom: 40,
  },
  section: { gap: spacing.sm },
  sectionHeader: {
    ...typography.caption,
    textTransform: 'uppercase',
    color: colors.textSecondary,
    letterSpacing: 0.8,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 0,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.base,
    gap: spacing.md,
    ...shadow.sm,
  },
  accountRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatarImg: { width: 50, height: 50, borderRadius: 0 },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 0,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#FFFFFF', fontWeight: '700', fontSize: 20 },
  accountDetails: { flex: 1, gap: 2 },
  accountName: { ...typography.body, fontWeight: '600', color: colors.textPrimary },
  accountEmail: { ...typography.bodySmall, color: colors.textSecondary },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  infoLabel: { ...typography.bodySmall, color: colors.textSecondary },
  infoValue: { ...typography.bodySmall, fontWeight: '600', color: colors.textPrimary },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 0,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.base,
    gap: spacing.md,
    ...shadow.sm,
  },
  actionIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionTitle: { ...typography.body, fontWeight: '600', color: colors.textPrimary },
  actionSubtitle: { ...typography.caption, color: colors.textSecondary },
  footer: { alignItems: 'center', gap: 4, marginTop: spacing.md },
  versionText: { ...typography.caption, color: colors.textDisabled },
  sourceText: { ...typography.caption, color: colors.textDisabled },
});
