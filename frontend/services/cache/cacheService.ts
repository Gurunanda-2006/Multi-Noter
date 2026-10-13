import AsyncStorage from '@react-native-async-storage/async-storage';
import { CacheData, FolderStructure, StorageItem } from '../../types';

const CACHE_KEY = 'psh_cache_v1';
const CACHE_VERSION = 1;

export async function loadCache(): Promise<CacheData | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as CacheData;
    if (data.version !== CACHE_VERSION) return null;
    return data;
  } catch {
    return null;
  }
}

export async function saveCache(data: Partial<CacheData>): Promise<void> {
  try {
    const existing = await loadCache();
    const merged: CacheData = {
      version: CACHE_VERSION,
      ...(existing ?? {}),
      ...data,
    };
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(merged));
  } catch {
    // Cache writes are best-effort; never throw
  }
}

export async function clearCache(): Promise<void> {
  try {
    await AsyncStorage.removeItem(CACHE_KEY);
  } catch {}
}

export async function getCachedFolderStructure(): Promise<FolderStructure | null> {
  const cache = await loadCache();
  return cache?.folderStructure ?? null;
}

export async function cacheFolderStructure(structure: FolderStructure): Promise<void> {
  await saveCache({ folderStructure: structure });
}

export async function getCachedItems(): Promise<StorageItem[] | null> {
  const cache = await loadCache();
  return cache?.items ?? null;
}

export async function cacheItems(items: StorageItem[]): Promise<void> {
  await saveCache({ items, lastSyncAt: new Date().toISOString() });
}
