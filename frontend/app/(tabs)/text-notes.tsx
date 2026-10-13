import React, { useMemo, useState, useCallback } from 'react';
import {
  FlatList,
  Modal,
  Platform,
  RefreshControl,
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
import { EmptyState } from '../../components/EmptyState';
import { LoadingIndicator } from '../../components/LoadingIndicator';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { toast } from '../../components/Toast';
import { StorageItem } from '../../types';
import { moveToTrash, permanentlyDeleteFile } from '../../services/google-drive/driveApi';
import { downloadFileToDevice } from '../../services/files/downloadService';
import { shareFile } from '../../services/files/shareService';
import { colors, radius, spacing, typography, shadow } from '../../components/design/theme';

export default function TextNotesScreen() {
  const { items, isLoading, isSyncing, refresh } = useDrive();
  const { getValidToken } = useAuth();
  const [search, setSearch] = useState('');

  // Selected note item ID for row selection
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  // Deletion modal states
  const [targetItem, setTargetItem] = useState<StorageItem | null>(null);
  const [showChoiceModal, setShowChoiceModal] = useState(false);
  const [showTrashConfirm, setShowTrashConfirm] = useState(false);
  const [showPermanentConfirm, setShowPermanentConfirm] = useState(false);

  const notes = useMemo(() => {
    const all = items.filter((i) => !i.trashed && i.category === 'text-notes');
    if (search.trim()) {
      const q = search.toLowerCase();
      return all.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          (i.title ?? '').toLowerCase().includes(q) ||
          (i.preview ?? '').toLowerCase().includes(q)
      );
    }
    return all.sort((a, b) => b.modifiedTime.localeCompare(a.modifiedTime));
  }, [items, search]);

  const handlePress = (item: StorageItem) => {
    router.push({ pathname: '/note-editor', params: { id: item.id } });
  };

  const handleToggleSelect = (item: StorageItem) => {
    setSelectedItemId((prev) => (prev === item.id ? null : item.id));
  };

  const handleDeleteTrigger = (item: StorageItem) => {
    setTargetItem(item);
    setShowChoiceModal(true);
  };

  const handleTemporaryTrash = useCallback(async () => {
    if (!targetItem) return;
    try {
      const token = await getValidToken();
      await moveToTrash(token, targetItem.id);
      await refresh();
      toast.success(`"${targetItem.name}" moved to Trash.`);
      setSelectedItemId(null);
    } catch (e: any) {
      toast.error(e.message ?? 'Failed to move to Trash.');
    } finally {
      setShowTrashConfirm(false);
      setTargetItem(null);
    }
  }, [targetItem, getValidToken, refresh]);

  const handlePermanentDelete = useCallback(async () => {
    if (!targetItem) return;
    try {
      const token = await getValidToken();
      await permanentlyDeleteFile(token, targetItem.id);
      await refresh();
      toast.success(`"${targetItem.name}" permanently deleted.`);
      setSelectedItemId(null);
    } catch (e: any) {
      toast.error(e.message ?? 'Failed to delete permanently.');
    } finally {
      setShowPermanentConfirm(false);
      setTargetItem(null);
    }
  }, [targetItem, getValidToken, refresh]);

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
        <Text style={styles.title}>Text Notes</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => router.push('/note-editor')}
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchWrap}>
        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder="Search notes..."
        />
      </View>

      {isLoading && notes.length === 0 ? (
        <LoadingIndicator message="Loading notes from Drive..." />
      ) : (
        <FlatList
          data={notes}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <FileCard
              item={item}
              isSelected={selectedItemId === item.id}
              onPress={handlePress}
              onSelectPress={handleToggleSelect}
              onDeletePress={handleDeleteTrigger}
              onDownloadPress={handleDownload}
              onSharePress={handleShare}
            />
          )}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
          ListEmptyComponent={
            <EmptyState
              icon="document-text-outline"
              title="No notes found"
              description="Write and save text notes directly into your Drive."
              actionLabel="Write Note"
              onAction={() => router.push('/note-editor')}
            />
          }
          refreshControl={
            <RefreshControl
              refreshing={isSyncing}
              onRefresh={refresh}
              tintColor={colors.accent}
            />
          }
        />
      )}

      {/* Choice Modal: Temporarily Delete (Move to Trash) vs Permanently Delete */}
      <Modal
        visible={showChoiceModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowChoiceModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconWrap}>
              <Ionicons name="trash-outline" size={32} color={colors.danger} />
            </View>
            <Text style={styles.modalTitle}>Delete Note</Text>
            <Text style={styles.modalSubtitle}>
              How would you like to delete "{targetItem?.title ?? targetItem?.name}"?
            </Text>

            <View style={styles.choiceButtons}>
              <TouchableOpacity
                style={styles.choiceBtn}
                onPress={() => {
                  setShowChoiceModal(false);
                  setShowTrashConfirm(true);
                }}
              >
                <View style={[styles.choiceIconWrap, { backgroundColor: colors.accentLight }]}>
                  <Ionicons name="trash-bin-outline" size={20} color={colors.accent} />
                </View>
                <View style={styles.choiceTextWrap}>
                  <Text style={styles.choiceTitle}>Move to Trash</Text>
                  <Text style={styles.choiceDesc}>Temporarily delete. You can restore it anytime from Trash.</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.choiceBtn, { borderColor: 'rgba(248, 113, 113, 0.3)' }]}
                onPress={() => {
                  setShowChoiceModal(false);
                  setShowPermanentConfirm(true);
                }}
              >
                <View style={[styles.choiceIconWrap, { backgroundColor: colors.dangerLight }]}>
                  <Ionicons name="close-circle-outline" size={20} color={colors.danger} />
                </View>
                <View style={styles.choiceTextWrap}>
                  <Text style={[styles.choiceTitle, { color: colors.danger }]}>Delete Permanently</Text>
                  <Text style={styles.choiceDesc}>Removes forever from your Google Drive. Cannot be undone.</Text>
                </View>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => {
                setShowChoiceModal(false);
                setTargetItem(null);
              }}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Confirmation: Move to Trash */}
      <ConfirmDialog
        visible={showTrashConfirm}
        title="Move to Trash"
        message={`"${targetItem?.title ?? targetItem?.name}" will be moved to Google Drive Trash. You can recover it from the Trash tab.`}
        confirmLabel="Move to Trash"
        icon="trash-outline"
        onConfirm={handleTemporaryTrash}
        onCancel={() => {
          setShowTrashConfirm(false);
          setTargetItem(null);
        }}
      />

      {/* Confirmation: Delete Permanently */}
      <ConfirmDialog
        visible={showPermanentConfirm}
        title="Delete Permanently"
        message={`"${targetItem?.title ?? targetItem?.name}" will be permanently removed from Google Drive. This cannot be undone.`}
        confirmLabel="Delete Forever"
        cancelLabel="Cancel"
        danger
        icon="close-circle-outline"
        onConfirm={handlePermanentDelete}
        onCancel={() => {
          setShowPermanentConfirm(false);
          setTargetItem(null);
        }}
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
  title: { ...typography.h2, color: colors.textPrimary },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 0,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.sm,
  },
  searchWrap: { paddingHorizontal: spacing.base, paddingTop: spacing.md, paddingBottom: spacing.xs },
  listContent: {
    padding: spacing.base,
    paddingBottom: 40,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.base,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: colors.surface,
    borderRadius: 0,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    gap: spacing.md,
    ...shadow.lg,
  },
  modalIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 0,
    backgroundColor: colors.dangerLight,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  modalTitle: { ...typography.h3, textAlign: 'center', color: colors.textPrimary },
  modalSubtitle: { ...typography.bodySmall, textAlign: 'center', color: colors.textSecondary },
  choiceButtons: { gap: spacing.md, marginVertical: spacing.sm },
  choiceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 0,
    padding: spacing.base,
    gap: spacing.md,
    backgroundColor: colors.surface,
  },
  choiceIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  choiceTextWrap: { flex: 1, gap: 2 },
  choiceTitle: { ...typography.body, fontWeight: '700', color: colors.textPrimary },
  choiceDesc: { ...typography.caption, color: colors.textSecondary },
  cancelBtn: {
    paddingVertical: spacing.md,
    borderRadius: 0,
    backgroundColor: colors.borderLight,
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  cancelBtnText: { ...typography.button, color: colors.textPrimary },
});
