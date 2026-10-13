import React, { useEffect, useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  Linking,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../services/auth/useAuth';
import { useDrive } from '../features/file-library/useDrive';
import {
  getFileMetadata,
  getFileContent,
  moveToTrash,
  permanentlyDeleteFile,
} from '../services/google-drive/driveApi';
import { downloadFileToDevice } from '../services/files/downloadService';
import { shareFile } from '../services/files/shareService';
import { formatFileSize, formatDate } from '../utils/filename';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { LoadingIndicator } from '../components/LoadingIndicator';
import { GlassBackground } from '../components/GlassBackground';
import { toast } from '../components/Toast';
import { DriveFile } from '../types';
import { colors, radius, spacing, typography, shadow } from '../components/design/theme';

export default function FileViewerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getValidToken } = useAuth();
  const { items, refresh } = useDrive();

  const [metadata, setMetadata] = useState<DriveFile | null>(null);
  const [textContent, setTextContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showTrashConfirm, setShowTrashConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const localItem = items.find((i) => i.id === id);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        setIsLoading(true);
        const token = await getValidToken();
        const meta = await getFileMetadata(token, id);
        setMetadata(meta);

        if (meta.mimeType.startsWith('text/') || meta.mimeType === 'application/json') {
          const content = await getFileContent(token, id);
          setTextContent(content);
        }
      } catch (err: any) {
        toast.error(err.message || 'Failed to load file details.');
      } finally {
        setIsLoading(false);
      }
    })();
  }, [id, getValidToken]);

  const handleOpenInDrive = () => {
    const link = metadata?.webViewLink || localItem?.webViewLink;
    if (link) {
      Linking.openURL(link);
    } else {
      toast.error('No Drive link available for this item.');
    }
  };

  const handleDownload = useCallback(async () => {
    if (!id) return;
    try {
      const fileName = metadata?.name || localItem?.name || 'download';
      const mime = metadata?.mimeType || localItem?.mimeType || 'application/octet-stream';
      toast.info(`Downloading "${fileName}"...`);
      const token = await getValidToken();
      await downloadFileToDevice(token, id, fileName, mime);
      toast.success(`Downloaded "${fileName}" to your device!`);
    } catch (e: any) {
      toast.error(e.message ?? 'Download failed.');
    }
  }, [id, metadata, localItem, getValidToken]);

  const handleShare = useCallback(async () => {
    if (!id) return;
    try {
      const fileName = metadata?.name || localItem?.name || 'File';
      const mime = metadata?.mimeType || localItem?.mimeType || 'application/octet-stream';
      const token = await getValidToken();
      await shareFile(token, id, fileName, mime);
      toast.success('Shared successfully!');
    } catch (e: any) {
      if (e.message?.includes('clipboard')) {
        toast.info(e.message);
      } else {
        toast.error(e.message ?? 'Share failed.');
      }
    }
  }, [id, metadata, localItem, getValidToken]);

  const handleTrash = useCallback(async () => {
    if (!id) return;
    try {
      const token = await getValidToken();
      await moveToTrash(token, id);
      await refresh();
      toast.success('Moved to Trash');
      router.back();
    } catch (e: any) {
      toast.error(e.message || 'Failed to move to Trash');
    } finally {
      setShowTrashConfirm(false);
    }
  }, [id, getValidToken, refresh]);

  const handleDeletePermanently = useCallback(async () => {
    if (!id) return;
    try {
      const token = await getValidToken();
      await permanentlyDeleteFile(token, id);
      await refresh();
      toast.success('Permanently deleted');
      router.back();
    } catch (e: any) {
      toast.error(e.message || 'Failed to delete permanently');
    } finally {
      setShowDeleteConfirm(false);
    }
  }, [id, getValidToken, refresh]);

  if (isLoading) {
    return <LoadingIndicator message="Loading file..." fullScreen />;
  }

  const name = metadata?.name || localItem?.name || 'File';
  const mimeType = metadata?.mimeType || localItem?.mimeType || '';
  const size = metadata?.size ? parseInt(String(metadata.size), 10) : localItem?.size;
  const isImage = mimeType.startsWith('image/');

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8} style={styles.headerBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{name}</Text>
        <View style={styles.headerRightActions}>
          <TouchableOpacity onPress={handleShare} hitSlop={8} style={styles.headerBtn}>
            <Ionicons name="share-outline" size={20} color={colors.accent} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleOpenInDrive} hitSlop={8} style={styles.headerBtn}>
            <Ionicons name="open-outline" size={20} color={colors.accent} />
          </TouchableOpacity>
        </View>
      </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {isImage && metadata?.thumbnailLink ? (
            <View style={styles.imagePreviewWrap}>
              <Image
                source={{ uri: metadata.thumbnailLink.replace(/=s\d+/, '=s800') }}
                style={styles.imagePreview}
                resizeMode="contain"
              />
            </View>
          ) : textContent !== null ? (
            <View style={styles.textContainer}>
              <Text style={styles.textContent}>{textContent}</Text>
            </View>
          ) : (
            <View style={styles.defaultPreviewWrap}>
              <Ionicons name="document-text-outline" size={56} color={colors.textDisabled} />
              <Text style={styles.previewNotice}>
                Preview not directly available inside this view. Open in Google Drive or download to view.
              </Text>
            </View>
          )}

          <View style={styles.detailsCard}>
            <Text style={styles.cardTitle}>File Details</Text>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Name</Text>
              <Text style={styles.detailValue} numberOfLines={2}>{name}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Size</Text>
              <Text style={styles.detailValue}>{formatFileSize(size)}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>MIME Type</Text>
              <Text style={styles.detailValue}>{mimeType}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Modified</Text>
              <Text style={styles.detailValue}>
                {metadata?.modifiedTime ? formatDate(metadata.modifiedTime) : 'N/A'}
              </Text>
            </View>
          </View>

          <View style={styles.actionsSection}>
            <TouchableOpacity style={styles.primaryAction} onPress={handleOpenInDrive} activeOpacity={0.8}>
              <Ionicons name="logo-google" size={18} color="#000" />
              <Text style={styles.primaryActionText}>Open in Google Drive</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryAction} onPress={handleShare} activeOpacity={0.8}>
              <Ionicons name="share-outline" size={18} color={colors.info} />
              <Text style={[styles.secondaryActionText, { color: colors.info }]}>Share File</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryAction} onPress={handleDownload} activeOpacity={0.8}>
              <Ionicons name="download-outline" size={18} color={colors.accent} />
              <Text style={[styles.secondaryActionText, { color: colors.accent }]}>Download to Device</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.secondaryAction, { borderColor: 'rgba(248, 113, 113, 0.3)' }]}
              onPress={() => setShowTrashConfirm(true)}
              activeOpacity={0.8}
            >
              <Ionicons name="trash-outline" size={18} color={colors.danger} />
              <Text style={[styles.secondaryActionText, { color: colors.danger }]}>Move to Trash</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.secondaryAction, { backgroundColor: colors.dangerLight, borderColor: 'rgba(248, 113, 113, 0.3)' }]}
              onPress={() => setShowDeleteConfirm(true)}
              activeOpacity={0.8}
            >
              <Ionicons name="close-circle-outline" size={18} color={colors.danger} />
              <Text style={[styles.secondaryActionText, { color: colors.danger }]}>Delete Permanently</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        <ConfirmDialog
          visible={showTrashConfirm}
          title="Move to Trash"
          message={`Are you sure you want to move "${name}" to Google Drive Trash?`}
          confirmLabel="Move to Trash"
          icon="trash-outline"
          onConfirm={handleTrash}
          onCancel={() => setShowTrashConfirm(false)}
        />

        <ConfirmDialog
          visible={showDeleteConfirm}
          title="Delete Permanently"
          message={`Are you sure you want to permanently delete "${name}"? This operation cannot be undone.`}
          danger
          confirmLabel="Delete Forever"
          icon="close-circle-outline"
          onConfirm={handleDeletePermanently}
          onCancel={() => setShowDeleteConfirm(false)}
        />
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
  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: 0,
    backgroundColor: colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { ...typography.h3, flex: 1, marginHorizontal: spacing.sm, color: colors.textPrimary },
  headerRightActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  scroll: { flex: 1 },
  scrollContent: { padding: spacing.base, gap: spacing.base, paddingBottom: 60 },
  imagePreviewWrap: {
    width: '100%',
    height: 300,
    backgroundColor: colors.surface,
    borderRadius: 0,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  imagePreview: { width: '100%', height: '100%' },
  textContainer: {
    backgroundColor: colors.surface,
    padding: spacing.base,
    borderRadius: 0,
    borderWidth: 1,
    borderColor: colors.border,
  },
  textContent: { ...typography.body, lineHeight: 22, color: colors.textPrimary },
  defaultPreviewWrap: {
    backgroundColor: colors.surface,
    borderRadius: 0,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  previewNotice: { ...typography.bodySmall, textAlign: 'center', maxWidth: 300, color: colors.textSecondary },
  detailsCard: {
    backgroundColor: colors.surface,
    borderRadius: 0,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.base,
    gap: spacing.md,
    ...shadow.sm,
  },
  cardTitle: { ...typography.h3, color: colors.textPrimary },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md },
  detailLabel: { ...typography.bodySmall, color: colors.textSecondary },
  detailValue: { ...typography.bodySmall, fontWeight: '500', flexShrink: 1, textAlign: 'right', color: colors.textPrimary },
  actionsSection: { gap: spacing.sm, marginTop: spacing.xs },
  primaryAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
    borderRadius: 0,
    paddingVertical: spacing.md,
    gap: spacing.sm,
    ...shadow.sm,
  },
  primaryActionText: { ...typography.button, color: '#FFFFFF', fontWeight: '700' },
  secondaryAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderRadius: 0,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  secondaryActionText: { ...typography.button, color: colors.textPrimary },
});
