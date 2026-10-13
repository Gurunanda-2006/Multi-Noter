import React, { useEffect, useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../services/auth/useAuth';
import { useDrive } from '../../features/file-library/useDrive';
import { restoreFromTrash, permanentlyDeleteFile } from '../../services/google-drive/driveApi';
import { EmptyState } from '../../components/EmptyState';
import { LoadingIndicator } from '../../components/LoadingIndicator';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { toast } from '../../components/Toast';
import { StorageItem } from '../../types';
import { formatDate, formatFileSize } from '../../utils/filename';
import { categoryIcon } from '../../utils/mime';
import { colors, radius, spacing, typography, shadow } from '../../components/design/theme';

export default function TrashScreen() {
  const { getValidToken } = useAuth();
  const { trashedItems, refreshTrash, refresh } = useDrive();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState<StorageItem | null>(null);
  const [actionType, setActionType] = useState<'restore' | 'delete' | null>(null);

  useEffect(() => {
    refreshTrash();
  }, [refreshTrash]);

  const handleActionConfirm = useCallback(async () => {
    if (!selectedItem || !actionType) return;
    try {
      const token = await getValidToken();
      if (actionType === 'restore') {
        await restoreFromTrash(token, selectedItem.id);
        toast.success(`Restored "${selectedItem.name}"`);
      } else {
        await permanentlyDeleteFile(token, selectedItem.id);
        toast.success(`Permanently deleted "${selectedItem.name}"`);
      }
      await refreshTrash();
      await refresh();
    } catch (e: any) {
      toast.error(e.message || `Failed to ${actionType} file.`);
    } finally {
      setSelectedItem(null);
      setActionType(null);
    }
  }, [selectedItem, actionType, getValidToken, refreshTrash, refresh]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Trash</Text>
        <TouchableOpacity onPress={refreshTrash} hitSlop={8}>
          <Ionicons name="refresh-outline" size={22} color={colors.accent} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={trashedItems}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        renderItem={({ item }) => (
          <View style={styles.trashRow}>
            <View style={styles.iconWrap}>
              <Ionicons name={categoryIcon(item.category) as any} size={24} color={colors.textSecondary} />
            </View>
            <View style={styles.itemInfo}>
              <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
              <Text style={styles.itemMeta}>
                {formatDate(item.modifiedTime)} · {formatFileSize(item.size)}
              </Text>
            </View>
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.iconBtn}
                onPress={() => {
                  setSelectedItem(item);
                  setActionType('restore');
                }}
              >
                <Ionicons name="arrow-undo-outline" size={20} color={colors.accent} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.iconBtn}
                onPress={() => {
                  setSelectedItem(item);
                  setActionType('delete');
                }}
              >
                <Ionicons name="trash-outline" size={20} color={colors.danger} />
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <EmptyState
            icon="trash-bin-outline"
            title="Trash is empty"
            description="Items moved to Trash will appear here."
          />
        }
      />

      <ConfirmDialog
        visible={actionType === 'restore'}
        title="Restore File"
        message={`Do you want to restore "${selectedItem?.name}" back to your active library?`}
        confirmLabel="Restore"
        icon="arrow-undo-outline"
        onConfirm={handleActionConfirm}
        onCancel={() => {
          setSelectedItem(null);
          setActionType(null);
        }}
      />

      <ConfirmDialog
        visible={actionType === 'delete'}
        title="Delete Permanently"
        message={`Are you sure you want to permanently delete "${selectedItem?.name}"? This action cannot be undone.`}
        confirmLabel="Delete Forever"
        danger
        icon="close-circle-outline"
        onConfirm={handleActionConfirm}
        onCancel={() => {
          setSelectedItem(null);
          setActionType(null);
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
  listContent: { padding: spacing.base, paddingBottom: 40 },
  trashRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.md,
    ...shadow.sm,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.sm,
    backgroundColor: colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemInfo: { flex: 1, gap: 2 },
  itemName: { ...typography.body, fontWeight: '500' },
  itemMeta: { ...typography.caption },
  actionButtons: { flexDirection: 'row', gap: spacing.sm },
  iconBtn: { padding: spacing.xs },
});
