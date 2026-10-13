import { FileCategory } from '../types';

const PDF_MIME = 'application/pdf';

const WORD_MIMES = new Set([
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.oasis.opendocument.text',
]);

const IMAGE_MIMES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/bmp',
  'image/svg+xml',
  'image/tiff',
  'image/heic',
  'image/heif',
]);

const VIDEO_MIMES = new Set([
  'video/mp4',
  'video/quicktime',
  'video/webm',
  'video/avi',
  'video/x-msvideo',
  'video/mpeg',
  'video/ogg',
  'video/3gpp',
  'video/x-matroska',
]);

const TEXT_MIMES = new Set([
  'text/plain',
  'text/markdown',
  'text/csv',
  'text/html',
  'text/xml',
  'application/json',
]);

const WORD_EXTENSIONS = new Set(['.doc', '.docx', '.odt']);
const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp', '.svg', '.tiff', '.heic', '.heif']);
const VIDEO_EXTENSIONS = new Set(['.mp4', '.mov', '.webm', '.avi', '.mpeg', '.mpg', '.ogv', '.mkv', '.3gp']);
const TEXT_EXTENSIONS = new Set(['.txt', '.md', '.csv', '.json', '.xml', '.html']);

export function classifyFile(mimeType: string, filename: string): FileCategory {
  const ext = filename.includes('.')
    ? '.' + filename.split('.').pop()!.toLowerCase()
    : '';

  const mime = mimeType.toLowerCase().split(';')[0].trim();

  if (mime === PDF_MIME || ext === '.pdf') return 'pdfs';
  if (WORD_MIMES.has(mime) || WORD_EXTENSIONS.has(ext)) return 'word-documents';
  if (IMAGE_MIMES.has(mime) || IMAGE_EXTENSIONS.has(ext)) return 'images';
  if (VIDEO_MIMES.has(mime) || VIDEO_EXTENSIONS.has(ext)) return 'videos';
  if (TEXT_MIMES.has(mime) || TEXT_EXTENSIONS.has(ext)) return 'text-notes';
  return 'other';
}

export function categoryLabel(category: FileCategory): string {
  const labels: Record<FileCategory, string> = {
    'text-notes': 'Text Notes',
    pdfs: 'PDFs',
    'word-documents': 'Word Documents',
    images: 'Images',
    videos: 'Videos',
    other: 'Other Files',
  };
  return labels[category] ?? 'Other Files';
}

export function categoryIcon(category: FileCategory): string {
  const icons: Record<FileCategory, string> = {
    'text-notes': 'document-text-outline',
    pdfs: 'document-outline',
    'word-documents': 'reader-outline',
    images: 'image-outline',
    videos: 'videocam-outline',
    other: 'attach-outline',
  };
  return icons[category] ?? 'attach-outline';
}
