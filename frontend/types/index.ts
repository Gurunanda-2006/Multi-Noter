export type FileCategory =
  | 'text-notes'
  | 'pdfs'
  | 'word-documents'
  | 'images'
  | 'videos'
  | 'other';

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: number;
  createdTime: string;
  modifiedTime: string;
  parents?: string[];
  trashed?: boolean;
  webViewLink?: string;
  webContentLink?: string;
  thumbnailLink?: string;
  appProperties?: Record<string, string>;
  description?: string;
}

export interface DriveFolder {
  id: string;
  name: string;
}

export interface FolderStructure {
  rootId: string;
  textNotesId: string;
  pdfsId: string;
  wordDocumentsId: string;
  imagesId: string;
  videosId: string;
  otherFilesId: string;
}

export interface StorageItem {
  id: string;                // Drive file ID
  name: string;
  title?: string;            // For text notes
  category: FileCategory;
  mimeType: string;
  size?: number;
  createdTime: string;
  modifiedTime: string;
  trashed: boolean;
  webViewLink?: string;
  webContentLink?: string;
  thumbnailLink?: string;
  preview?: string;          // Short text preview for notes
  tags?: string[];
  description?: string;
}

export interface TextNote {
  id?: string;               // Drive file ID (undefined when new)
  title: string;
  content: string;
  tags?: string[];
  createdTime?: string;
  modifiedTime?: string;
}

export interface UploadTask {
  id: string;                // Local tracking ID
  fileName: string;
  fileSize: number;
  mimeType: string;
  category: FileCategory;
  progress: number;          // 0-100
  status: 'pending' | 'uploading' | 'done' | 'error';
  error?: string;
  driveFileId?: string;
}

export interface AuthSession {
  accessToken: string;
  expiresAt: number;         // Unix ms
  userInfo?: {
    email: string;
    name: string;
    picture?: string;
  };
}

export interface DriveQuota {
  limit: number;
  usage: number;
  usageInDrive: number;
}

export type SortOption = 'newest' | 'oldest' | 'name' | 'type';
export type ViewMode = 'list' | 'grid';

export interface LibraryFilter {
  category?: FileCategory;
  search?: string;
  sort: SortOption;
  view: ViewMode;
  trashed?: boolean;
}

export interface CacheData {
  folderStructure?: FolderStructure;
  lastSyncAt?: string;
  items?: StorageItem[];
  userInfo?: AuthSession['userInfo'];
  version: number;
}

export interface ApiError {
  code: number;
  message: string;
  details?: string;
}
