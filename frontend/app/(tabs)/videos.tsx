import React, { useMemo, useCallback } from 'react';
import {
  FlatList,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuth } from '../../services/auth/useAuth';
import { useDrive } from '../../features/file-library/useDrive';
import { FileCard } from '../../components/FileCard';
import { EmptyState } from '../../components/EmptyState';
import { toast } from '../../components/Toast';
import { StorageItem } from '../../types';
import { downloadFileToDevice } from '../../services/files/downloadService';
import { shareFile } from '../../services/files/shareService';
import { colors, spacing, typography } from '../../components/design/theme';

export default function VideosScreen() {
  const { items, isSyncing, refresh } = useDrive();
  const { getValidToken } = useAuth();

  const videoItems = useMemo(
    () => items.filter((i) => !i.trashed && i.category === 'videos'),
    [items]
  );

  const handleDownload = useCallback(async (item: StorageItem) => {
    try {
      toast.info(`Downloading "${item.name}"...`);
      const token = await getValidToken();
      await downloadFileToDevice(token, item.id, item.name, item.mimeType);
      toast.success(`Downloaded "${item.name}" to your device!`);
    } catch (e: any) {
      toast.error(e.message ?? 'Failed to download file.');
    }
  }, [getValidToken]);

  const handleShare = useCallback(async (item: StorageItem) => {
    try {
      const token = await getValidToken();
      await shareFile(token, item.id, item.name, item.mimeType);
      toast.success('Shared successfully!');
    } catch (e: any) {
      if (e.message?.includes('clipboard')) {
        toast.info(e.message);
      } else {
        toast.error(e.message ?? 'Share failed.');
      }
    }
  }, [getValidToken]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Videos</Text>
      </View>
      <FlatList
        data={videoItems}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        renderItem={({ item }) => (
          <FileCard
            item={item}
            onPress={(i) => router.push({ pathname: '/file-viewer', params: { id: i.id } })}
            onDownloadPress={handleDownload}
            onSharePress={handleShare}
          />
        )}
        ListEmptyComponent={
          <EmptyState
            icon="videocam-outline"
            title="No videos yet"
            description="Upload videos from your device to see them here."
            actionLabel="Upload Video"
            onAction={() => router.push('/upload')}
          />
        }
        refreshControl={
          <RefreshControl refreshing={isSyncing} onRefresh={refresh} tintColor={colors.accent} />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'transparent' },
  header: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  title: { ...typography.h2 },
  listContent: {
    padding: spacing.base,
    paddingBottom: Platform.OS === 'ios' ? 100 : 80,
  },
});
