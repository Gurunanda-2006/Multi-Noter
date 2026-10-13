import React from 'react';
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StorageItem } from '../types';
import { categoryIcon } from '../utils/mime';
import { formatDate, formatFileSize } from '../utils/filename';
import { colors, radius, shadow, spacing, typography } from './design/theme';

interface Props {
  item: StorageItem;
  isSelected?: boolean;
  onPress: (item: StorageItem) => void;
  onSelectPress?: (item: StorageItem) => void;
  onDeletePress?: (item: StorageItem) => void;
  onDownloadPress?: (item: StorageItem) => void;
  onSharePress?: (item: StorageItem) => void;
  onMenuPress?: (item: StorageItem) => void;
}

export function FileCard({
  item,
  isSelected,
  onPress,
  onSelectPress,
  onDeletePress,
  onDownloadPress,
  onSharePress,
  onMenuPress,
}: Props) {
  const showThumbnail = item.category === 'images' && !!item.thumbnailLink;

  return (
    <View style={[styles.card, isSelected && styles.cardSelected]}>
      {/* Selection checkbox */}
      {onSelectPress ? (
        <TouchableOpacity
          style={styles.selectBtn}
          onPress={() => onSelectPress(item)}
          hitSlop={8}
          activeOpacity={0.7}
        >
          <Ionicons
            name={isSelected ? 'checkbox' : 'square-outline'}
            size={22}
            color={isSelected ? colors.accent : colors.textDisabled}
          />
        </TouchableOpacity>
      ) : null}

      {/* Main card content */}
      <TouchableOpacity
        style={styles.contentWrap}
        onPress={() => onPress(item)}
        activeOpacity={0.8}
      >
        <View style={styles.preview}>
          {showThumbnail ? (
            <Image source={{ uri: item.thumbnailLink! }} style={styles.thumbnail} />
          ) : (
            <View style={[styles.iconContainer, { backgroundColor: categoryBgColor(item.category) }]}>
              <Ionicons name={categoryIcon(item.category) as any} size={26} color={categoryFgColor(item.category)} />
            </View>
          )}
        </View>

        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={2}>{item.title ?? item.name}</Text>
          {item.preview ? (
            <Text style={styles.previewText} numberOfLines={1}>{item.preview}</Text>
          ) : null}
          <View style={styles.meta}>
            <Text style={styles.metaText}>{formatDate(item.modifiedTime)}</Text>
            {item.size ? <Text style={styles.metaText}>{formatFileSize(item.size)}</Text> : null}
          </View>
        </View>
      </TouchableOpacity>

      {/* Right-side actions: Share, Download, Delete, Menu */}
      <View style={styles.rightActionWrap}>
        {onSharePress ? (
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => onSharePress(item)}
            activeOpacity={0.7}
            hitSlop={6}
          >
            <Ionicons name="share-outline" size={18} color={colors.accent} />
          </TouchableOpacity>
        ) : null}

        {onDownloadPress ? (
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => onDownloadPress(item)}
            activeOpacity={0.7}
            hitSlop={6}
          >
            <Ionicons name="download-outline" size={18} color={colors.accent} />
          </TouchableOpacity>
        ) : null}

        {isSelected && onDeletePress ? (
          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={() => onDeletePress(item)}
            activeOpacity={0.8}
          >
            <Ionicons name="trash-outline" size={14} color="#FFFFFF" />
            <Text style={styles.deleteBtnText}>Delete</Text>
          </TouchableOpacity>
        ) : onMenuPress ? (
          <TouchableOpacity onPress={() => onMenuPress(item)} hitSlop={8} style={styles.menu}>
            <Ionicons name="ellipsis-vertical" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

function categoryBgColor(cat: StorageItem['category']): string {
  const map: Record<string, string> = {
    'text-notes': '#FFF7ED',
    pdfs: '#FEF2F2',
    'word-documents': '#EFF6FF',
    images: '#F0FDF4',
    videos: '#FAF5FF',
    other: '#FFFBEB',
  };
  return map[cat] ?? '#F3F4F6';
}

function categoryFgColor(cat: StorageItem['category']): string {
  const map: Record<string, string> = {
    'text-notes': '#EA580C',
    pdfs: '#EF4444',
    'word-documents': '#3B82F6',
    images: '#16A34A',
    videos: '#9333EA',
    other: '#D97706',
  };
  return map[cat] ?? '#6B7280';
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 0,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.base,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    ...shadow.sm,
  },
  cardSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.accentLight,
  },
  selectBtn: {
    padding: 2,
  },
  contentWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  preview: {
    width: 48,
    height: 48,
    flexShrink: 0,
  },
  thumbnail: {
    width: 48,
    height: 48,
    borderRadius: 0,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
    gap: 2,
  },
  name: {
    ...typography.body,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  previewText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  meta: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: 2,
  },
  metaText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  rightActionWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionBtn: {
    width: 32,
    height: 32,
    borderRadius: 0,
    backgroundColor: colors.accentLight,
    borderWidth: 1,
    borderColor: '#FED7AA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.danger,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs + 2,
    borderRadius: 0,
  },
  deleteBtnText: {
    ...typography.caption,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  menu: {
    padding: 4,
  },
});
