import React, { useCallback, useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../services/auth/useAuth';
import { useDrive } from '../features/file-library/useDrive';
import {
  uploadFile,
  updateFileContent,
  getFileContent,
  getFileMetadata,
} from '../services/google-drive/driveApi';
import { generateNoteFilename } from '../utils/filename';
import { validateNoteContent } from '../utils/validation';
import { toast } from '../components/Toast';
import { LoadingIndicator } from '../components/LoadingIndicator';
import { colors, spacing, typography, shadow } from '../components/design/theme';

export default function NoteEditorScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEditing = !!id;

  const { getValidToken } = useAuth();
  const { folderStructure, refresh } = useDrive();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingNote, setIsLoadingNote] = useState(isEditing);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!isEditing) return;
    (async () => {
      try {
        setIsLoadingNote(true);
        const token = await getValidToken();
        const [meta, text] = await Promise.all([
          getFileMetadata(token, id!),
          getFileContent(token, id!),
        ]);
        setTitle(meta.appProperties?.title ?? meta.name.replace(/\.txt$/, ''));
        setContent(text);
        setTags(meta.appProperties?.tags ?? '');
      } catch (e: any) {
        setLoadError(e.message ?? 'Failed to load note.');
      } finally {
        setIsLoadingNote(false);
      }
    })();
  }, [id, isEditing, getValidToken]);

  const handleSave = useCallback(async () => {
    const validationError = validateNoteContent(title, content);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    if (!folderStructure) {
      toast.error('Google Drive folder structure is not ready.');
      return;
    }

    try {
      setIsSaving(true);
      const token = await getValidToken();
      const resolvedTitle = title.trim() || `Untitled Note ${Date.now()}`;
      const filename = generateNoteFilename(resolvedTitle);
      const appProps = {
        pshManaged: 'true',
        title: resolvedTitle,
        tags: tags.trim(),
      };
      const preview = content.trim().substring(0, 200);

      if (isEditing && id) {
        await updateFileContent(token, id, {
          name: filename,
          content,
          mimeType: 'text/plain',
          appProperties: appProps,
          description: preview,
        });
        toast.success('Note updated in Google Drive.');
      } else {
        await uploadFile(token, {
          name: filename,
          mimeType: 'text/plain',
          content,
          parentId: folderStructure.textNotesId,
          appProperties: appProps,
          description: preview,
        });
        toast.success('Note saved to Google Drive.');
      }

      await refresh();
      router.back();
    } catch (e: any) {
      toast.error(e.message ?? 'Failed to save note. Text is preserved.');
    } finally {
      setIsSaving(false);
    }
  }, [title, content, tags, folderStructure, getValidToken, isEditing, id, refresh]);

  if (isLoadingNote) {
    return <LoadingIndicator message="Loading note from Drive..." fullScreen />;
  }

  if (loadError) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.danger} />
          <Text style={styles.errorTitle}>Error Loading Note</Text>
          <Text style={styles.errorMsg}>{loadError}</Text>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backBtnText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.kav}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <View style={styles.toolbar}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={8} style={styles.closeBtn}>
            <Ionicons name="close-outline" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.toolbarTitle}>{isEditing ? 'Edit Note' : 'New Note'}</Text>
          <TouchableOpacity
            style={[styles.saveBtn, isSaving && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={isSaving}
            activeOpacity={0.85}
          >
            <Text style={styles.saveBtnText}>{isSaving ? 'Saving...' : 'Save'}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <TextInput
            style={styles.titleInput}
            value={title}
            onChangeText={setTitle}
            placeholder="Title (optional)"
            placeholderTextColor={colors.textDisabled}
            returnKeyType="next"
            maxLength={200}
          />

          <TextInput
            style={styles.tagsInput}
            value={tags}
            onChangeText={setTags}
            placeholder="Tags (e.g. personal, work, ideas)"
            placeholderTextColor={colors.textDisabled}
            returnKeyType="next"
            maxLength={300}
          />

          <TextInput
            style={styles.contentInput}
            value={content}
            onChangeText={setContent}
            placeholder="Write your note here... supports plain text, code, ideas, lists, and unicode characters."
            placeholderTextColor={colors.textDisabled}
            multiline
            textAlignVertical="top"
            autoFocus={!isEditing}
            scrollEnabled={false}
          />

          <Text style={styles.charCount}>{content.length.toLocaleString()} characters</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  kav: { flex: 1 },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 0,
    backgroundColor: colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolbarTitle: { ...typography.h3, color: colors.textPrimary },
  saveBtn: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.accent,
    borderRadius: 0,
    ...shadow.sm,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { ...typography.button, color: '#FFFFFF' },
  scroll: { flex: 1 },
  scrollContent: { padding: spacing.base, gap: spacing.sm, paddingBottom: 60 },
  titleInput: {
    ...typography.h2,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: spacing.sm,
    color: colors.textPrimary,
  },
  tagsInput: {
    ...typography.bodySmall,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    paddingVertical: spacing.sm,
    color: colors.textSecondary,
  },
  contentInput: {
    ...typography.body,
    minHeight: 300,
    lineHeight: 24,
    paddingTop: spacing.md,
    color: colors.textPrimary,
  },
  charCount: {
    ...typography.caption,
    textAlign: 'right',
    marginTop: spacing.sm,
    color: colors.textDisabled,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl,
    gap: spacing.md,
  },
  errorTitle: { ...typography.h3, color: colors.danger },
  errorMsg: { ...typography.body, color: colors.textSecondary, textAlign: 'center' },
  backBtn: {
    marginTop: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    backgroundColor: colors.accent,
    borderRadius: 0,
  },
  backBtnText: { ...typography.button, color: '#FFFFFF' },
});
