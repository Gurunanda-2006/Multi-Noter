import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { FolderStructure, StorageItem, DriveQuota } from '../../types';
import {
  initializeFolderStructure,
  listAllAppFiles,
  listTrashedAppFiles,
  getStorageQuota,
} from '../../services/google-drive/driveApi';
import { driveFileToStorageItem, classifyDriveFile } from '../../services/files/fileService';
import {
  getCachedFolderStructure,
  cacheFolderStructure,
  getCachedItems,
  cacheItems,
} from '../../services/cache/cacheService';
import { useAuth } from '../../services/auth/useAuth';

interface DriveContextType {
  isReady: boolean;
  isLoading: boolean;
  isSyncing: boolean;
  folderStructure: FolderStructure | null;
  items: StorageItem[];
  trashedItems: StorageItem[];
  quota: DriveQuota | null;
  error: string | null;
  refresh: () => Promise<void>;
  refreshTrash: () => Promise<void>;
  clearError: () => void;
}

const DriveContext = createContext<DriveContextType | null>(null);

export function DriveProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, getValidToken } = useAuth();
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [folderStructure, setFolderStructure] = useState<FolderStructure | null>(null);
  const [items, setItems] = useState<StorageItem[]>([]);
  const [trashedItems, setTrashedItems] = useState<StorageItem[]>([]);
  const [quota, setQuota] = useState<DriveQuota | null>(null);
  const [error, setError] = useState<string | null>(null);
  const initRef = useRef(false);

  const initialize = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      setIsLoading(true);
      setError(null);

      // Try loading folder structure from cache first
      let structure = await getCachedFolderStructure();
      const token = await getValidToken();

      if (!structure) {
        structure = await initializeFolderStructure(token);
        await cacheFolderStructure(structure);
      } else {
        // Refresh in background to ensure folders still exist
        initializeFolderStructure(token)
          .then((s) => {
            setFolderStructure(s);
            cacheFolderStructure(s);
          })
          .catch(() => {});
      }

      setFolderStructure(structure);

      // Load cached items for immediate display
      const cached = await getCachedItems();
      if (cached && cached.length > 0) {
        setItems(cached);
      }

      // Fetch fresh from Drive
      const [driveFiles, quotaData] = await Promise.all([
        listAllAppFiles(token, structure),
        getStorageQuota(token).catch(() => null),
      ]);

      const storageItems = driveFiles.map((f) => {
        const category = classifyDriveFile(f);
        return driveFileToStorageItem(f, category);
      });

      setItems(storageItems);
      setQuota(quotaData);
      await cacheItems(storageItems);
      setIsReady(true);
    } catch (e: any) {
      setError(e.message ?? 'Failed to connect to Google Drive.');
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, getValidToken]);

  useEffect(() => {
    if (isAuthenticated && !initRef.current) {
      initRef.current = true;
      initialize();
    } else if (!isAuthenticated) {
      initRef.current = false;
      setIsReady(false);
      setItems([]);
      setFolderStructure(null);
    }
  }, [isAuthenticated, initialize]);

  const refresh = useCallback(async () => {
    if (!folderStructure || !isAuthenticated) return;
    try {
      setIsSyncing(true);
      setError(null);
      const token = await getValidToken();
      const [driveFiles, quotaData] = await Promise.all([
        listAllAppFiles(token, folderStructure),
        getStorageQuota(token).catch(() => null),
      ]);
      const storageItems = driveFiles.map((f) => {
        const category = classifyDriveFile(f);
        return driveFileToStorageItem(f, category);
      });
      setItems(storageItems);
      if (quotaData) setQuota(quotaData);
      await cacheItems(storageItems);
    } catch (e: any) {
      setError(e.message ?? 'Refresh failed.');
    } finally {
      setIsSyncing(false);
    }
  }, [folderStructure, isAuthenticated, getValidToken]);

  const refreshTrash = useCallback(async () => {
    if (!folderStructure || !isAuthenticated) return;
    try {
      const token = await getValidToken();
      const files = await listTrashedAppFiles(token, folderStructure);
      const trashed = files.map((f) => {
        const category = classifyDriveFile(f);
        return driveFileToStorageItem(f, category);
      });
      setTrashedItems(trashed);
    } catch (e: any) {
      setError(e.message ?? 'Failed to load trash.');
    }
  }, [folderStructure, isAuthenticated, getValidToken]);

  const clearError = useCallback(() => setError(null), []);

  return React.createElement(
    DriveContext.Provider,
    {
      value: {
        isReady,
        isLoading,
        isSyncing,
        folderStructure,
        items,
        trashedItems,
        quota,
        error,
        refresh,
        refreshTrash,
        clearError,
      },
    },
    children
  );
}

export function useDrive(): DriveContextType {
  const ctx = useContext(DriveContext);
  if (!ctx) throw new Error('useDrive must be used within DriveProvider');
  return ctx;
}
