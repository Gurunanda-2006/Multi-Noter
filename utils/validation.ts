/**
 * Returns true if the text is not empty or whitespace-only.
 */
export function isNonEmptyText(text: string): boolean {
  return text.trim().length > 0;
}

/**
 * Returns a validation error message or null if valid.
 */
export function validateNoteContent(title: string, content: string): string | null {
  if (!isNonEmptyText(content)) {
    return 'Note content cannot be empty.';
  }
  return null;
}

/**
 * Validate file size. maxMB defaults to 5000 (5 GB, Drive limit).
 */
export function validateFileSize(bytes: number, maxMB = 5000): string | null {
  const maxBytes = maxMB * 1024 * 1024;
  if (bytes > maxBytes) {
    return `File exceeds the maximum allowed size of ${maxMB} MB.`;
  }
  return null;
}

/**
 * Returns true if the MIME type is supported for upload.
 * "Other" is always allowed; this checks known categories.
 */
export function isSupportedMimeType(mimeType: string): boolean {
  // All MIME types are accepted; we just classify them.
  return !!mimeType;
}
