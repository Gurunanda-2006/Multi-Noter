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
import { colors, radius, spacing, typography, glassCard } from './design/theme';

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
          <View style={[styles.checkbox, isSelected && styles.checkboxActive]}>
            {isSelected && (
              <Ionicons name="checkmark" size={14} color="#FFF" />
            )}
          </View>
        </TouchableOpacity>
      ) : null}

      {/* Main content */}
      <TouchableOpacity
        style={styles.contentWrap}
        onPress={() => onPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.preview}>
          {showThumbnail ? (
            <Image source={{ uri: item.thumbnailLink! }} style={styles.thumbnail} />
          ) : (
            <View style={[styles.iconContainer, { backgroundColor: categoryBgColor(item.category) }]}>
              <Ionicons name={categoryIcon(item.category) as any} size={24} color={categoryFgColor(item.category)} />
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

      {/* Right-side actions: Share, Download, Delete */}
      <View style={styles.rightActionWrap}>
        {onSharePress ? (
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => onSharePress(item)}
            activeOpacity={0.7}
            hitSlop={6}
          >
            <Ionicons name="share-outline" size={18} color={colors.info} />
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
          </TouchableOpacity>
        ) : onMenuPress ? (
          <TouchableOpacity onPress={() => onMenuPress(item)} hitSlop={8} style={styles.menu}>
            <Ionicons name="ellipsis-vertical" size={16} color={colors.textSecondary} />
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

function categoryBgColor(cat: StorageItem['category']): string {
  const map: Record<string, string> = {
    'text-notes': 'rgba(99, 102, 241, 0.2)',
    pdfs: 'rgba(248, 113, 113, 0.2)',
    'word-documents': 'rgba(96, 165, 250, 0.2)',
    images: 'rgba(52, 211, 153, 0.2)',
    videos: 'rgba(168, 85, 247, 0.2)',
    other: 'rgba(251, 191, 36, 0.2)',
  };
  return map[cat] ?? 'rgba(255, 255, 255, 0.1)';
}

function categoryFgColor(cat: StorageItem['category']): string {
  const map: Record<string, string> = {
    'text-notes': '#818CF8',
    pdfs: '#F87171',
    'word-documents': '#60A5FA',
    images: '#34D399',
    videos: '#A78BFA',
    other: '#FBBF24',
  };
  return map[cat] ?? colors.textSecondary;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(20, 30, 25, 0.78)',
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
    padding: spacing.base,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  cardSelected: {
    borderColor: colors.accent,
    backgroundColor: 'rgba(52, 211, 153, 0.15)',
  },
  selectBtn: {
    padding: 2,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: colors.textDisabled,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  contentWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  preview: {
    width: 46,
    height: 46,
    flexShrink: 0,
  },
  thumbnail: {
    width: 46,
    height: 46,
    borderRadius: radius.md,
  },
  iconContainer: {
    width: 46,
    height: 46,
    borderRadius: radius.md,
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
    fontSize: 14,
  },
  previewText: {
    ...typography.bodySmall,
    fontSize: 12,
  },
  meta: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: 2,
  },
  metaText: {
    ...typography.caption,
    fontSize: 10,
  },
  rightActionWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionBtn: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtn: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menu: {
    padding: 4,
  },
});
