import { classifyFile, categoryLabel } from '../utils/mime';

describe('MIME & File Classification', () => {
  it('correctly classifies PDF files', () => {
    expect(classifyFile('application/pdf', 'document.pdf')).toBe('pdfs');
    expect(classifyFile('application/octet-stream', 'manual.PDF')).toBe('pdfs');
  });

  it('correctly classifies Word documents', () => {
    expect(classifyFile('application/msword', 'report.doc')).toBe('word-documents');
    expect(classifyFile('application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'proposal.docx')).toBe('word-documents');
    expect(classifyFile('application/octet-stream', 'notes.docx')).toBe('word-documents');
  });

  it('correctly classifies Images', () => {
    expect(classifyFile('image/jpeg', 'photo.jpg')).toBe('images');
    expect(classifyFile('image/png', 'diagram.png')).toBe('images');
    expect(classifyFile('image/webp', 'avatar.webp')).toBe('images');
    expect(classifyFile('application/octet-stream', 'picture.JPEG')).toBe('images');
  });

  it('correctly classifies Videos', () => {
    expect(classifyFile('video/mp4', 'recording.mp4')).toBe('videos');
    expect(classifyFile('video/quicktime', 'movie.mov')).toBe('videos');
    expect(classifyFile('video/webm', 'clip.webm')).toBe('videos');
  });

  it('correctly classifies Text Notes', () => {
    expect(classifyFile('text/plain', 'note.txt')).toBe('text-notes');
    expect(classifyFile('text/markdown', 'readme.md')).toBe('text-notes');
  });

  it('falls back to Other Files for unrecognized types', () => {
    expect(classifyFile('application/zip', 'archive.zip')).toBe('other');
    expect(classifyFile('application/x-tar', 'backup.tar.gz')).toBe('other');
    expect(classifyFile('unknown/type', 'unknownfile')).toBe('other');
  });

  it('returns human-readable labels', () => {
    expect(categoryLabel('text-notes')).toBe('Text Notes');
    expect(categoryLabel('pdfs')).toBe('PDFs');
    expect(categoryLabel('word-documents')).toBe('Word Documents');
    expect(categoryLabel('images')).toBe('Images');
    expect(categoryLabel('videos')).toBe('Videos');
    expect(categoryLabel('other')).toBe('Other Files');
  });
});
