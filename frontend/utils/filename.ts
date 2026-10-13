/**
 * Sanitize a string to be a safe filesystem / Drive filename.
 * Removes characters that are illegal in most filesystems.
 */
export function sanitizeFilename(name: string): string {
  return name
    .trim()
    .replace(/[\/\\:*?"<>|\x00-\x1F]/g, '_')  // illegal chars
    .replace(/\.{2,}/g, '.')                       // consecutive dots
    .replace(/^[.\s]+/, '')                         // leading dots/spaces
    .replace(/[.\s]+$/, '')                         // trailing dots/spaces
    .substring(0, 200);                             // max length
}

/**
 * Generate a filename for a text note.
 * Falls back to "Untitled Note" + timestamp for collision safety.
 */
export function generateNoteFilename(title: string): string {
  const base = sanitizeFilename(title) || `Untitled Note ${Date.now()}`;
  return `${base}.txt`;
}

/**
 * Generate a safe filename that won't collide with existing names.
 * Appends a counter suffix if needed.
 */
export function deduplicateFilename(name: string, existingNames: string[]): string {
  if (!existingNames.includes(name)) return name;
  const dotIndex = name.lastIndexOf('.');
  const base = dotIndex >= 0 ? name.substring(0, dotIndex) : name;
  const ext = dotIndex >= 0 ? name.substring(dotIndex) : '';
  let counter = 1;
  let candidate = `${base} (${counter})${ext}`;
  while (existingNames.includes(candidate)) {
    counter++;
    candidate = `${base} (${counter})${ext}`;
  }
  return candidate;
}

/**
 * Extract a display title from a filename (strips extension).
 */
export function filenameToTitle(filename: string): string {
  const dotIndex = filename.lastIndexOf('.');
  return dotIndex > 0 ? filename.substring(0, dotIndex) : filename;
}

/**
 * Format file size in human-readable form.
 */
export function formatFileSize(bytes?: number): string {
  if (bytes === undefined || bytes === null) return '';
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const value = bytes / Math.pow(1024, i);
  return `${value.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

/**
 * Format an ISO date string to a friendly short date.
 */
export function formatDate(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffDays === 0) {
    const diffHours = Math.floor(diffMs / 3600000);
    if (diffHours === 0) {
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return 'Just now';
      return `${diffMins}m ago`;
    }
    return `${diffHours}h ago`;
  }
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: diffDays > 365 ? 'numeric' : undefined });
}
