import React, { useMemo } from 'react';
import { StyleSheet, View, Text, FlatList, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useDrive } from '../../features/file-library/useDrive';
import { FileCard } from '../../components/FileCard';
import { EmptyState } from '../../components/EmptyState';
import { colors, spacing, typography } from '../../components/design/theme';

export default function DocumentsScreen() {
  const { items, isSyncing, refresh } = useDrive();
  const docs = useMemo(
    () =>
      items.filter(
        (i) => !i.trashed && (i.category === 'pdfs' || i.category === 'word-documents')
      ),
    [items]
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Documents</Text>
      </View>
      <FlatList
        data={docs}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        renderItem={({ item }) => (
          <FileCard
            item={item}
            onPress={(i) => router.push({ pathname: '/file-viewer', params: { id: i.id } })}
          />
        )}
        ListEmptyComponent={
          <EmptyState
            icon="document-outline"
            title="No documents yet"
            description="Upload PDF or Word documents from your device."
            actionLabel="Upload File"
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
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: { ...typography.h2 },
  listContent: { padding: spacing.base, paddingBottom: 40 },
});
