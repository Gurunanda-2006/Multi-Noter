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
  onMenuPress?: (item: StorageItem) => void;
}

export function FileCard({
  item,
  isSelected,
  onPress,
  onSelectPress,
  onDeletePress,
  onMenuPress,
}: Props) {
  const showThumbnail = item.category === 'images' && !!item.thumbnailLink;

  return (
    <View style={[styles.card, isSelected && styles.cardSelected]}>
      {/* Selection checkbox/radio on the left */}
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

      {/* Main card content clickable area */}
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
              <Ionicons name={categoryIcon(item.category) as any} size={28} color={categoryFgColor(item.category)} />
            </View>
          )}
        </View>

        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={2}>{item.title ?? item.name}</Text>
          {item.preview ? (
            <Text style={styles.preview2} numberOfLines={1}>{item.preview}</Text>
          ) : null}
          <View style={styles.meta}>
            <Text style={styles.metaText}>{formatDate(item.modifiedTime)}</Text>
            {item.size ? <Text style={styles.metaText}>{formatFileSize(item.size)}</Text> : null}
          </View>
        </View>
      </TouchableOpacity>

      {/* Right-side action area: When selected, shows a prominent Delete button */}
      <View style={styles.rightActionWrap}>
        {isSelected && onDeletePress ? (
          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={() => onDeletePress(item)}
            activeOpacity={0.8}
          >
            <Ionicons name="trash-outline" size={18} color="#FFFFFF" />
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
    'text-notes': '#EEF2FF', pdfs: '#FEF2F2', 'word-documents': '#EFF6FF',
    images: '#F0FDF4', videos: '#FDF4FF', other: '#FFFBEB',
  };
  return map[cat] ?? '#F3F4F6';
}

function categoryFgColor(cat: StorageItem['category']): string {
  const map: Record<string, string> = {
    'text-notes': '#4F46E5', pdfs: '#EF4444', 'word-documents': '#3B82F6',
    images: '#22C55E', videos: '#A855F7', other: '#F59E0B',
  };
  return map[cat] ?? '#6B7280';
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
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
    backgroundColor: '#FAFAFF',
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
    width: 50,
    height: 50,
    flexShrink: 0,
  },
  thumbnail: {
    width: 50,
    height: 50,
    borderRadius: radius.md,
  },
  iconContainer: {
    width: 50,
    height: 50,
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
  },
  preview2: {
    ...typography.bodySmall,
  },
  meta: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: 2,
  },
  metaText: {
    ...typography.caption,
  },
  rightActionWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.danger,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
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
