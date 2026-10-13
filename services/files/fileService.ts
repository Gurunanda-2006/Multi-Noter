import { DriveFile, FileCategory, StorageItem } from '../../types';
import { classifyFile } from '../../utils/mime';
import { filenameToTitle } from '../../utils/filename';

export function driveFileToStorageItem(
  file: DriveFile,
  category: FileCategory
): StorageItem {
  const tagsRaw = file.appProperties?.tags ?? '';
  const tags = tagsRaw ? tagsRaw.split(',').map((t) => t.trim()).filter(Boolean) : undefined;

  return {
    id: file.id,
    name: file.name,
    title: file.appProperties?.title ?? filenameToTitle(file.name),
    category,
    mimeType: file.mimeType,
    size: file.size ? parseInt(String(file.size), 10) : undefined,
    createdTime: file.createdTime,
    modifiedTime: file.modifiedTime,
    trashed: file.trashed ?? false,
    webViewLink: file.webViewLink,
    webContentLink: file.webContentLink,
    thumbnailLink: file.thumbnailLink,
    preview: file.description,
    tags,
    description: file.description,
  };
}

export function classifyDriveFile(file: DriveFile): FileCategory {
  return classifyFile(file.mimeType, file.name);
}

export function sortItems(
  items: StorageItem[],
  sort: 'newest' | 'oldest' | 'name' | 'type'
): StorageItem[] {
  const copy = [...items];
  switch (sort) {
    case 'newest':
      return copy.sort((a, b) => b.modifiedTime.localeCompare(a.modifiedTime));
    case 'oldest':
      return copy.sort((a, b) => a.modifiedTime.localeCompare(b.modifiedTime));
    case 'name':
      return copy.sort((a, b) => a.name.localeCompare(b.name));
    case 'type':
      return copy.sort((a, b) => a.mimeType.localeCompare(b.mimeType));
    default:
      return copy;
  }
}

export function filterItems(
  items: StorageItem[],
  { category, search }: { category?: FileCategory; search?: string }
): StorageItem[] {
  let result = items;
  if (category) {
    result = result.filter((i) => i.category === category);
  }
  if (search && search.trim()) {
    const q = search.trim().toLowerCase();
    result = result.filter(
      (i) =>
        i.name.toLowerCase().includes(q) ||
        (i.title ?? '').toLowerCase().includes(q) ||
        (i.preview ?? '').toLowerCase().includes(q)
    );
  }
  return result;
}
