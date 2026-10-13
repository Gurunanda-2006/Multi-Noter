import React, { useCallback, useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../services/auth/useAuth';
import { useDrive } from '../../features/file-library/useDrive';
import { FileCard } from '../../components/FileCard';
import { SearchBar } from '../../components/SearchBar';
import { LoadingIndicator } from '../../components/LoadingIndicator';
import { EmptyState } from '../../components/EmptyState';
import { StorageItem, FileCategory } from '../../types';
import { categoryLabel, categoryIcon } from '../../utils/mime';
import { formatFileSize } from '../../utils/filename';
import { colors, radius, shadow, spacing, typography } from '../../components/design/theme';

const CATEGORIES: FileCategory[] = ['text-notes', 'pdfs', 'word-documents', 'images', 'videos', 'other'];

export default function HomeScreen() {
  const { session } = useAuth();
  const { items, isLoading, isSyncing, refresh, quota, error, isReady } = useDrive();
  const [search, setSearch] = useState('');

  const recentItems = items
    .filter((i) => !i.trashed)
    .sort((a, b) => b.modifiedTime.localeCompare(a.modifiedTime))
    .slice(0, 5);

  const searchResults = search.trim()
    ? items.filter(
        (i) =>
          !i.trashed &&
          (i.name.toLowerCase().includes(search.toLowerCase()) ||
            (i.title ?? '').toLowerCase().includes(search.toLowerCase()))
      )
    : [];

  const handleItemPress = useCallback((item: StorageItem) => {
    if (item.category === 'text-notes') {
      router.push({ pathname: '/note-editor', params: { id: item.id } });
    } else {
      router.push({ pathname: '/file-viewer', params: { id: item.id } });
    }
  }, []);

  const handleCategoryPress = useCallback((cat: FileCategory) => {
    if (cat === 'text-notes') router.push('/(tabs)/text-notes');
    else if (cat === 'images') router.push('/(tabs)/images');
    else if (cat === 'pdfs' || cat === 'word-documents') router.push('/(tabs)/documents');
    else if (cat === 'videos') router.push('/(tabs)/videos');
    else router.push({ pathname: '/(tabs)/all-items', params: { category: cat } });
  }, []);

  const userInitial = session?.userInfo?.name?.charAt(0).toUpperCase() ?? '?';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.appName}>Personal Storage Hub</Text>
          <View style={styles.driveStatus}>
            <View style={[styles.dot, isReady ? styles.dotGreen : styles.dotOrange]} />
            <Text style={styles.driveStatusText}>
              {isReady ? 'Connected to Drive' : 'Connecting...'}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.avatar}
          onPress={() => router.push('/(tabs)/settings')}
        >
          <Text style={styles.avatarText}>{userInitial}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isSyncing}
            onRefresh={refresh}
            tintColor={colors.accent}
          />
        }
      >
        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder="Search items..."
        />

        {search.trim().length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}
            </Text>
            {searchResults.length === 0 ? (
              <EmptyState icon="search-outline" title="No matching items found" />
            ) : (
              <View style={styles.itemList}>
                {searchResults.map((item) => (
                  <FileCard key={item.id} item={item} onPress={handleItemPress} />
                ))}
              </View>
            )}
          </View>
        ) : (
          <>
            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.actionBtn, { flex: 1 }]}
                onPress={() => router.push('/note-editor')}
                activeOpacity={0.85}
              >
                <View style={[styles.actionIconWrap, { backgroundColor: '#EEF2FF' }]}>
                  <Ionicons name="pencil-outline" size={24} color={colors.accent} />
                </View>
                <Text style={styles.actionLabel}>Save Text</Text>
                <Text style={styles.actionSub}>Write a plain-text note</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionBtn, { flex: 1 }]}
                onPress={() => router.push('/upload')}
                activeOpacity={0.85}
              >
                <View style={[styles.actionIconWrap, { backgroundColor: '#F0FDF4' }]}>
                  <Ionicons name="cloud-upload-outline" size={24} color={colors.success} />
                </View>
                <Text style={styles.actionLabel}>Upload Files</Text>
                <Text style={styles.actionSub}>Documents & media</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Categories</Text>
              <View style={styles.categoryGrid}>
                {CATEGORIES.map((cat) => {
                  const count = items.filter((i) => i.category === cat && !i.trashed).length;
                  return (
                    <TouchableOpacity
                      key={cat}
                      style={styles.categoryCard}
                      onPress={() => handleCategoryPress(cat)}
                      activeOpacity={0.85}
                    >
                      <Ionicons
                        name={categoryIcon(cat) as any}
                        size={22}
                        color={colors.accent}
                      />
                      <Text style={styles.categoryLabel}>{categoryLabel(cat)}</Text>
                      <Text style={styles.categoryCount}>{count}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{items.filter((i) => !i.trashed).length}</Text>
                <Text style={styles.statLabel}>Saved Items</Text>
              </View>
              {quota && (
                <View style={styles.statBox}>
                  <Text style={styles.statValue}>
                    {formatFileSize(quota.usageInDrive)}
                  </Text>
                  <Text style={styles.statLabel}>Drive Quota Used</Text>
                </View>
              )}
            </View>

            {error ? (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle-outline" size={16} color={colors.danger} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Recently Saved</Text>
                <TouchableOpacity onPress={() => router.push('/(tabs)/all-items')}>
                  <Text style={styles.seeAll}>See All</Text>
                </TouchableOpacity>
              </View>
              {isLoading && items.length === 0 ? (
                <LoadingIndicator message="Fetching from Google Drive..." />
              ) : recentItems.length === 0 ? (
                <EmptyState
                  icon="cloud-outline"
                  title="No items in Drive"
                  description="Save a text note or upload documents & media."
                  actionLabel="Save Text"
                  onAction={() => router.push('/note-editor')}
                />
              ) : (
                <View style={styles.itemList}>
                  {recentItems.map((item) => (
                    <FileCard key={item.id} item={item} onPress={handleItemPress} />
                  ))}
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerLeft: { gap: 2, flex: 1 },
  appName: { ...typography.h2 },
  driveStatus: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  dot: { width: 8, height: 8, borderRadius: 4 },
  dotGreen: { backgroundColor: colors.success },
  dotOrange: { backgroundColor: colors.warning },
  driveStatusText: { ...typography.caption },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: radius.full,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.md,
  },
  avatarText: { color: '#FFF', fontWeight: '700', fontSize: 16 },
  scroll: { flex: 1 },
  scrollContent: { padding: spacing.base, gap: spacing.base, paddingBottom: 40 },
  actions: { flexDirection: 'row', gap: spacing.md },
  actionBtn: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.base,
    gap: spacing.xs,
    ...shadow.sm,
  },
  actionIconWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: { ...typography.h3, marginTop: spacing.xs },
  actionSub: { ...typography.bodySmall },
  section: { gap: spacing.md },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { ...typography.h3 },
  seeAll: { ...typography.bodySmall, color: colors.accent },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  categoryCard: {
    width: '31%',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.xs,
    alignItems: 'flex-start',
    ...shadow.sm,
  },
  categoryLabel: { ...typography.caption, fontWeight: '500', color: colors.textSecondary },
  categoryCount: { ...typography.h3, color: colors.textPrimary },
  statsRow: { flexDirection: 'row', gap: spacing.md },
  statBox: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.base,
    alignItems: 'center',
    gap: spacing.xs,
  },
  statValue: { ...typography.h2, color: colors.accent },
  statLabel: { ...typography.caption },
  itemList: { gap: spacing.sm },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.dangerLight,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  errorText: { ...typography.bodySmall, color: colors.danger, flex: 1 },
});
