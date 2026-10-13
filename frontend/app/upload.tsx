import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../services/auth/useAuth';
import { useDrive } from '../features/file-library/useDrive';
import { uploadFile, initiateResumableUpload, uploadChunk } from '../services/google-drive/driveApi';
import { classifyFile, categoryLabel, categoryIcon } from '../utils/mime';
import { formatFileSize, sanitizeFilename } from '../utils/filename';
import { validateFileSize } from '../utils/validation';
import { UploadProgressItem } from '../components/UploadProgress';
import { toast } from '../components/Toast';
import { UploadTask, FileCategory } from '../types';
import { colors, radius, spacing, typography, shadow } from '../components/design/theme';

export default function UploadScreen() {
  const { getValidToken } = useAuth();
  const { folderStructure, refresh } = useDrive();
  const [tasks, setTasks] = useState<UploadTask[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const getFolderIdForCategory = (category: FileCategory): string | undefined => {
    if (!folderStructure) return undefined;
    switch (category) {
      case 'text-notes':
        return folderStructure.textNotesId;
      case 'pdfs':
        return folderStructure.pdfsId;
      case 'word-documents':
        return folderStructure.wordDocumentsId;
      case 'images':
        return folderStructure.imagesId;
      case 'videos':
        return folderStructure.videosId;
      case 'other':
      default:
        return folderStructure.otherFilesId;
    }
  };

  const processAndUploadFile = async (file: {
    name: string;
    size?: number;
    mimeType?: string;
    uri: string;
    fileObj?: File | Blob;
  }) => {
    if (!folderStructure) {
      toast.error('Google Drive folder structure is not initialized.');
      return;
    }

    const cleanName = sanitizeFilename(file.name) || `file_${Date.now()}`;
    const detectedMime = file.mimeType || 'application/octet-stream';
    const category = classifyFile(detectedMime, cleanName);
    const parentId = getFolderIdForCategory(category);

    if (!parentId) {
      toast.error('Destination folder not found.');
      return;
    }

    const fileSize = file.size || 0;
    const sizeErr = validateFileSize(fileSize);
    if (sizeErr) {
      toast.error(sizeErr);
      return;
    }

    const taskId = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const newTask: UploadTask = {
      id: taskId,
      fileName: cleanName,
      fileSize,
      mimeType: detectedMime,
      category,
      progress: 10,
      status: 'uploading',
    };

    setTasks((prev) => [newTask, ...prev]);

    try {
      const token = await getValidToken();

      let blobData: Blob;
      if (Platform.OS === 'web' && file.fileObj) {
        blobData = file.fileObj;
      } else {
        const response = await fetch(file.uri);
        blobData = await response.blob();
      }

      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, progress: 40 } : t))
      );

      // Resumable upload if larger than 5MB
      if (fileSize > 5 * 1024 * 1024) {
        const uploadUrl = await initiateResumableUpload(token, {
          name: cleanName,
          mimeType: detectedMime,
          fileSize,
          parentId,
          appProperties: {
            title: cleanName,
            category,
          },
        });

        setTasks((prev) =>
          prev.map((t) => (t.id === taskId ? { ...t, progress: 60 } : t))
        );

        // Upload single large chunk or stream
        const uploaded = await uploadChunk(uploadUrl, blobData, 0, fileSize);
        setTasks((prev) =>
          prev.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  progress: 100,
                  status: 'done',
                  driveFileId: uploaded?.id,
                }
              : t
          )
        );
      } else {
        // Multipart upload
        const uploaded = await uploadFile(token, {
          name: cleanName,
          mimeType: detectedMime,
          content: blobData,
          parentId,
          appProperties: {
            title: cleanName,
            category,
          },
        });

        setTasks((prev) =>
          prev.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  progress: 100,
                  status: 'done',
                  driveFileId: uploaded.id,
                }
              : t
          )
        );
      }

      toast.success(`Uploaded ${cleanName} to ${categoryLabel(category)}`);
      await refresh();
    } catch (err: any) {
      const errorMsg = err.message || 'Upload failed.';
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId
            ? { ...t, status: 'error', error: errorMsg, progress: 0 }
            : t
        )
      );
      toast.error(`Failed to upload ${cleanName}: ${errorMsg}`);
    }
  };

  const handlePickDocument = async () => {
    try {
      setIsProcessing(true);
      const result = await DocumentPicker.getDocumentAsync({
        copyToCacheDirectory: true,
        multiple: true,
        type: '*/*',
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        for (const asset of result.assets) {
          await processAndUploadFile({
            name: asset.name,
            size: asset.size ?? 0,
            mimeType: asset.mimeType ?? undefined,
            uri: asset.uri,
            fileObj: (asset as any).file,
          });
        }
      }
    } catch (e: any) {
      toast.error(e.message || 'Failed to select document.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePickMedia = async (mediaType: ImagePicker.MediaTypeOptions) => {
    try {
      setIsProcessing(true);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: mediaType,
        allowsMultipleSelection: true,
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        for (const asset of result.assets) {
          const fileName =
            asset.fileName ||
            `media_${Date.now()}.${asset.type === 'video' ? 'mp4' : 'jpg'}`;
          await processAndUploadFile({
            name: fileName,
            size: asset.fileSize ?? 0,
            mimeType:
              asset.mimeType ||
              (asset.type === 'video' ? 'video/mp4' : 'image/jpeg'),
            uri: asset.uri,
            fileObj: (asset as any).file,
          });
        }
      }
    } catch (e: any) {
      toast.error(e.message || 'Failed to select media.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Upload Files</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.subtitle}>
          Files are automatically categorized and placed into the corresponding Google Drive folder.
        </Text>

        <View style={styles.pickerSection}>
          <TouchableOpacity
            style={styles.pickerButton}
            onPress={handlePickDocument}
            disabled={isProcessing}
            activeOpacity={0.8}
          >
            <View style={[styles.iconWrap, { backgroundColor: '#EEF2FF' }]}>
              <Ionicons name="document-attach-outline" size={28} color={colors.accent} />
            </View>
            <View style={styles.pickerTextWrap}>
              <Text style={styles.pickerButtonTitle}>Select Documents / Any Files</Text>
              <Text style={styles.pickerButtonSub}>PDFs, Word documents, text files, archives, and more</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.pickerButton}
            onPress={() => handlePickMedia(ImagePicker.MediaTypeOptions.Images)}
            disabled={isProcessing}
            activeOpacity={0.8}
          >
            <View style={[styles.iconWrap, { backgroundColor: '#F0FDF4' }]}>
              <Ionicons name="image-outline" size={28} color={colors.success} />
            </View>
            <View style={styles.pickerTextWrap}>
              <Text style={styles.pickerButtonTitle}>Select Photos / Images</Text>
              <Text style={styles.pickerButtonSub}>JPEG, PNG, WEBP, GIF, HEIC</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.pickerButton}
            onPress={() => handlePickMedia(ImagePicker.MediaTypeOptions.Videos)}
            disabled={isProcessing}
            activeOpacity={0.8}
          >
            <View style={[styles.iconWrap, { backgroundColor: '#FDF4FF' }]}>
              <Ionicons name="videocam-outline" size={28} color="#A855F7" />
            </View>
            <View style={styles.pickerTextWrap}>
              <Text style={styles.pickerButtonTitle}>Select Videos</Text>
              <Text style={styles.pickerButtonSub}>MP4, MOV, WEBM, MKV</Text>
            </View>
          </TouchableOpacity>
        </View>

        {tasks.length > 0 && (
          <View style={styles.tasksSection}>
            <View style={styles.tasksHeader}>
              <Text style={styles.tasksTitle}>Upload History / Queue</Text>
              <TouchableOpacity onPress={() => setTasks([])} hitSlop={8}>
                <Text style={styles.clearText}>Clear</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.tasksList}>
              {tasks.map((task) => (
                <UploadProgressItem key={task.id} task={task} />
              ))}
            </View>
          </View>
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
  headerTitle: { ...typography.h3 },
  scroll: { flex: 1 },
  scrollContent: { padding: spacing.base, gap: spacing.base, paddingBottom: 40 },
  subtitle: { ...typography.bodySmall, color: colors.textSecondary },
  pickerSection: { gap: spacing.md },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.base,
    gap: spacing.base,
    ...shadow.sm,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerTextWrap: { flex: 1, gap: 2 },
  pickerButtonTitle: { ...typography.body, fontWeight: '600' },
  pickerButtonSub: { ...typography.caption },
  tasksSection: { marginTop: spacing.md, gap: spacing.md },
  tasksHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tasksTitle: { ...typography.h3 },
  clearText: { ...typography.bodySmall, color: colors.accent },
  tasksList: { gap: spacing.sm },
});
