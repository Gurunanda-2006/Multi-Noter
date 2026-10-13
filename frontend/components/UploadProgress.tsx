import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { UploadTask } from '../types';
import { categoryIcon } from '../utils/mime';
import { formatFileSize } from '../utils/filename';
import { colors, radius, spacing, typography } from './design/theme';

interface Props {
  task: UploadTask;
}

export function UploadProgressItem({ task }: Props) {
  const isError = task.status === 'error';
  const isDone = task.status === 'done';

  return (
    <View style={[styles.container, isError && styles.containerError]}>
      <View style={styles.header}>
        <Ionicons
          name={categoryIcon(task.category) as any}
          size={20}
          color={isError ? colors.danger : colors.accent}
        />
        <Text style={styles.name} numberOfLines={1}>{task.fileName}</Text>
        <Ionicons
          name={isDone ? 'checkmark-circle' : isError ? 'close-circle' : 'cloud-upload-outline'}
          size={18}
          color={isDone ? colors.success : isError ? colors.danger : colors.textDisabled}
        />
      </View>
      <View style={styles.barBg}>
        <View
          style={[
            styles.barFill,
            { width: `${task.progress}%` as any },
            isError && styles.barFillError,
          ]}
        />
      </View>
      {task.error ? (
        <Text style={styles.errorText}>{task.error}</Text>
      ) : (
        <Text style={styles.subText}>
          {isDone
            ? `Saved to ${task.category}`
            : `${task.progress}% · ${formatFileSize(task.fileSize)}`}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.base,
    gap: spacing.sm,
  },
  containerError: {
    borderColor: colors.danger,
    backgroundColor: colors.dangerLight,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  name: {
    ...typography.body,
    flex: 1,
  },
  barBg: {
    height: 4,
    backgroundColor: colors.borderLight,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: colors.accent,
    borderRadius: radius.full,
  },
  barFillError: {
    backgroundColor: colors.danger,
  },
  subText: {
    ...typography.caption,
  },
  errorText: {
    ...typography.caption,
    color: colors.danger,
  },
});
