import {
  sanitizeFilename,
  generateNoteFilename,
  deduplicateFilename,
  filenameToTitle,
  formatFileSize,
} from '../utils/filename';

describe('Filename Utilities', () => {
  it('sanitizes illegal characters', () => {
    expect(sanitizeFilename('invalid/name:test*file?.txt')).toBe('invalid_name_test_file_.txt');
    expect(sanitizeFilename('hello<>|world')).toBe('hello___world');
  });

  it('generates safe note filenames', () => {
    expect(generateNoteFilename('My Great Idea')).toBe('My Great Idea.txt');
    expect(generateNoteFilename('')).toMatch(/^Untitled Note \d+\.txt$/);
  });

  it('deduplicates filenames with counters', () => {
    const existing = ['report.docx', 'report (1).docx'];
    expect(deduplicateFilename('report.docx', existing)).toBe('report (2).docx');
    expect(deduplicateFilename('unique.pdf', existing)).toBe('unique.pdf');
  });

  it('extracts titles from filenames', () => {
    expect(filenameToTitle('Meeting Notes.txt')).toBe('Meeting Notes');
    expect(filenameToTitle('Contract.pdf')).toBe('Contract');
  });

  it('formats byte sizes cleanly', () => {
    expect(formatFileSize(0)).toBe('0 B');
    expect(formatFileSize(1024)).toBe('1.0 KB');
    expect(formatFileSize(1048576)).toBe('1.0 MB');
    expect(formatFileSize(1073741824)).toBe('1.0 GB');
  });
});
