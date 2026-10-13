import React, { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useDrive } from '../../features/file-library/useDrive';
import { FileCard } from '../../components/FileCard';
import { SearchBar } from '../../components/SearchBar';
import { EmptyState } from '../../components/EmptyState';
import { LoadingIndicator } from '../../components/LoadingIndicator';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { toast } from '../../components/Toast';
import { StorageItem, FileCategory, SortOption } from '../../types';
import { sortItems, filterItems } from '../../services/files/fileService';
import { categoryLabel } from '../../utils/mime';
import { useAuth } from '../../services/auth/useAuth';
import { moveToTrash, permanentlyDeleteFile } from '../../services/google-drive/driveApi';
import { colors, radius, spacing, typography, shadow } from '../../components/design/theme';

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'name', label: 'Name' },
  { value: 'type', label: 'Type' },
];

export default function AllItemsScreen() {
  const { category: categoryParam } = useLocalSearchParams<{ category?: FileCategory }>();
  const { items, isLoading, isSyncing, refresh } = useDrive();
  const { getValidToken } = useAuth();

  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortOption>('newest');
  const [selectedCategory, setSelectedCategory] = useState<FileCategory | undefined>(categoryParam as FileCategory | undefined);

  // Selected item ID for row selection
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  // Deletion modal states
  const [targetItem, setTargetItem] = useState<StorageItem | null>(null);
  const [showChoiceModal, setShowChoiceModal] = useState(false);
  const [showTrashConfirm, setShowTrashConfirm] = useState(false);
  const [showPermanentConfirm, setShowPermanentConfirm] = useState(false);

  const activeItems = useMemo(() => {
    const filtered = filterItems(
      items.filter((i) => !i.trashed),
      { category: selectedCategory, search }
    );
    return sortItems(filtered, sort);
  }, [items, search, sort, selectedCategory]);

  const handlePress = useCallback((item: StorageItem) => {
    if (item.category === 'text-notes') {
      router.push({ pathname: '/note-editor', params: { id: item.id } });
    } else {
      router.push({ pathname: '/file-viewer', params: { id: item.id } });
    }
  }, []);

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

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>All Items</Text>
        <TouchableOpacity onPress={refresh} disabled={isSyncing} hitSlop={8}>
          <Ionicons
            name="refresh-outline"
            size={22}
            color={isSyncing ? colors.textDisabled : colors.accent}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.searchWrap}>
        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder="Search items by name or title..."
        />
      </View>

      <View style={styles.filtersRow}>
        <View style={styles.sortRow}>
          {SORT_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={[
                styles.sortChip,
                sort === opt.value && styles.sortChipActive,
              ]}
              onPress={() => setSort(opt.value)}
            >
              <Text
                style={[
                  styles.sortChipText,
                  sort === opt.value && styles.sortChipTextActive,
                ]}
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.catScroll}>
        {(['text-notes', 'pdfs', 'word-documents', 'images', 'videos', 'other'] as FileCategory[]).map(
          (cat) => (
            <TouchableOpacity
              key={cat}
              style={[
                styles.catChip,
                selectedCategory === cat && styles.catChipActive,
              ]}
              onPress={() =>
                setSelectedCategory(selectedCategory === cat ? undefined : cat)
              }
            >
              <Text
                style={[
                  styles.catChipText,
                  selectedCategory === cat && styles.catChipTextActive,
                ]}
              >
                {categoryLabel(cat)}
              </Text>
            </TouchableOpacity>
          )
        )}
      </View>

      {isLoading && activeItems.length === 0 ? (
        <LoadingIndicator message="Loading items..." />
      ) : (
        <FlatList
          data={activeItems}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <FileCard
              item={item}
              isSelected={selectedItemId === item.id}
              onPress={handlePress}
              onSelectPress={handleToggleSelect}
              onDeletePress={handleDeleteTrigger}
            />
          )}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
          ListEmptyComponent={
            <EmptyState
              icon="folder-open-outline"
              title="No items found"
              description={
                search
                  ? 'Try searching with a different keyword.'
                  : 'Upload files or write text notes to see them here.'
              }
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
            <Text style={styles.modalTitle}>Delete Item</Text>
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
                <View style={[styles.choiceIconWrap, { backgroundColor: '#EEF2FF' }]}>
                  <Ionicons name="trash-bin-outline" size={20} color={colors.accent} />
                </View>
                <View style={styles.choiceTextWrap}>
                  <Text style={styles.choiceTitle}>Move to Trash</Text>
                  <Text style={styles.choiceDesc}>Temporarily delete. You can restore it anytime from Trash.</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.choiceBtn, { borderColor: '#FEE2E2' }]}
                onPress={() => {
                  setShowChoiceModal(false);
                  setShowPermanentConfirm(true);
                }}
              >
                <View style={[styles.choiceIconWrap, { backgroundColor: '#FEF2F2' }]}>
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
  title: { ...typography.h2 },
  searchWrap: { padding: spacing.base, backgroundColor: colors.surface },
  filtersRow: { paddingHorizontal: spacing.base, paddingBottom: spacing.sm, backgroundColor: colors.surface },
  sortRow: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  sortChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    backgroundColor: colors.borderLight,
  },
  sortChipActive: { backgroundColor: colors.accentLight },
  sortChipText: { ...typography.caption, fontWeight: '500', color: colors.textSecondary },
  sortChipTextActive: { color: colors.accent },
  catScroll: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    flexWrap: 'wrap',
  },
  catChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  catChipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  catChipText: { ...typography.caption, fontWeight: '500', color: colors.textSecondary },
  catChipTextActive: { color: '#FFF' },
  listContent: { padding: spacing.base, paddingBottom: 40 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.base,
  },
  modalCard: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.xl,
    gap: spacing.md,
    ...shadow.md,
  },
  modalIconWrap: {
    width: 56,
    height: 56,
    borderRadius: radius.full,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  modalTitle: { ...typography.h3, textAlign: 'center' },
  modalSubtitle: { ...typography.bodySmall, textAlign: 'center', color: colors.textSecondary },
  choiceButtons: { gap: spacing.md, marginVertical: spacing.sm },
  choiceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.base,
    gap: spacing.md,
    backgroundColor: colors.surface,
  },
  choiceIconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  choiceTextWrap: { flex: 1, gap: 2 },
  choiceTitle: { ...typography.body, fontWeight: '700' },
  choiceDesc: { ...typography.caption },
  cancelBtn: {
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.borderLight,
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  cancelBtnText: { ...typography.button, color: colors.textSecondary },
});
