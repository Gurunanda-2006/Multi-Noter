import { DriveFile, DriveFolder, DriveQuota, FolderStructure } from '../../types';

const DRIVE_BASE = 'https://www.googleapis.com/drive/v3';
const UPLOAD_BASE = 'https://www.googleapis.com/upload/drive/v3';

function headers(token: string, extra: Record<string, string> = {}): HeadersInit {
  return { Authorization: `Bearer ${token}`, ...extra };
}

async function checkResponse(res: Response): Promise<void> {
  if (!res.ok) {
    let body = '';
    try { body = await res.text(); } catch {}
    const err: any = new Error(`Drive API error ${res.status}: ${body}`);
    err.status = res.status;
    err.body = body;
    throw err;
  }
}

// ---------- Folder operations ----------

export async function findFolder(
  token: string,
  name: string,
  parentId?: string
): Promise<DriveFolder | null> {
  const parentQuery = parentId ? ` and '${parentId}' in parents` : " and 'root' in parents";
  const q = encodeURIComponent(
    `name='${name.replace(/'/g, "\\'")}'${parentQuery} and mimeType='application/vnd.google-apps.folder' and trashed=false`
  );
  const url = `${DRIVE_BASE}/files?q=${q}&fields=files(id,name)&spaces=drive`;
  const res = await fetch(url, { headers: headers(token) });
  await checkResponse(res);
  const data = await res.json() as { files: DriveFolder[] };
  return data.files[0] ?? null;
}

export async function createFolder(
  token: string,
  name: string,
  parentId?: string
): Promise<DriveFolder> {
  const metadata: any = {
    name,
    mimeType: 'application/vnd.google-apps.folder',
  };
  if (parentId) metadata.parents = [parentId];

  const res = await fetch(`${DRIVE_BASE}/files?fields=id,name`, {
    method: 'POST',
    headers: headers(token, { 'Content-Type': 'application/json' }),
    body: JSON.stringify(metadata),
  });
  await checkResponse(res);
  return res.json() as Promise<DriveFolder>;
}

export async function findOrCreateFolder(
  token: string,
  name: string,
  parentId?: string
): Promise<DriveFolder> {
  const existing = await findFolder(token, name, parentId);
  if (existing) return existing;
  return createFolder(token, name, parentId);
}

// Initialize the full folder structure
export async function initializeFolderStructure(token: string): Promise<FolderStructure> {
  const root = await findOrCreateFolder(token, 'Personal Storage Hub');
  const [textNotes, pdfs, wordDocs, images, videos, other] = await Promise.all([
    findOrCreateFolder(token, 'Text Notes', root.id),
    findOrCreateFolder(token, 'PDFs', root.id),
    findOrCreateFolder(token, 'Word Documents', root.id),
    findOrCreateFolder(token, 'Images', root.id),
    findOrCreateFolder(token, 'Videos', root.id),
    findOrCreateFolder(token, 'Other Files', root.id),
  ]);
  return {
    rootId: root.id,
    textNotesId: textNotes.id,
    pdfsId: pdfs.id,
    wordDocumentsId: wordDocs.id,
    imagesId: images.id,
    videosId: videos.id,
    otherFilesId: other.id,
  };
}

// ---------- File listing ----------

export interface ListFilesOptions {
  parentId?: string;
  trashed?: boolean;
  pageToken?: string;
  pageSize?: number;
  orderBy?: string;
}

export async function listFiles(
  token: string,
  options: ListFilesOptions = {}
): Promise<{ files: DriveFile[]; nextPageToken?: string }> {
  const {
    parentId,
    trashed = false,
    pageToken,
    pageSize = 100,
    orderBy = 'modifiedTime desc',
  } = options;

  const conditions = [`trashed=${trashed}`];
  if (parentId) conditions.push(`'${parentId}' in parents`);

  const q = encodeURIComponent(conditions.join(' and '));
  const fields = 'nextPageToken,files(id,name,mimeType,size,createdTime,modifiedTime,parents,trashed,webViewLink,webContentLink,thumbnailLink,appProperties,description)';
  let url = `${DRIVE_BASE}/files?q=${q}&fields=${encodeURIComponent(fields)}&pageSize=${pageSize}&orderBy=${encodeURIComponent(orderBy)}&spaces=drive`;
  if (pageToken) url += `&pageToken=${encodeURIComponent(pageToken)}`;

  const res = await fetch(url, { headers: headers(token) });
  await checkResponse(res);
  return res.json() as Promise<{ files: DriveFile[]; nextPageToken?: string }>;
}

// List ALL files under root folder (all sub-folders)
export async function listAllAppFiles(
  token: string,
  structure: FolderStructure
): Promise<DriveFile[]> {
  const folderIds = [
    structure.textNotesId,
    structure.pdfsId,
    structure.wordDocumentsId,
    structure.imagesId,
    structure.videosId,
    structure.otherFilesId,
  ];

  const allFiles: DriveFile[] = [];
  await Promise.all(
    folderIds.map(async (folderId) => {
      let pageToken: string | undefined;
      do {
        const result = await listFiles(token, {
          parentId: folderId,
          trashed: false,
          pageToken,
          pageSize: 100,
        });
        allFiles.push(...result.files);
        pageToken = result.nextPageToken;
      } while (pageToken);
    })
  );

  return allFiles;
}

export async function listTrashedAppFiles(
  token: string,
  structure: FolderStructure
): Promise<DriveFile[]> {
  // Drive trashed files lose their parents, so we query trashed=true and filter by name/appProperties
  // Best approach: list all trashed files and filter by those with our app marker
  const fields = 'nextPageToken,files(id,name,mimeType,size,createdTime,modifiedTime,trashed,webViewLink,webContentLink,thumbnailLink,appProperties,description)';
  const q = encodeURIComponent('trashed=true');
  const url = `${DRIVE_BASE}/files?q=${q}&fields=${encodeURIComponent(fields)}&pageSize=100&spaces=drive`;
  const res = await fetch(url, { headers: headers(token) });
  await checkResponse(res);
  const data = await res.json() as { files: DriveFile[]; nextPageToken?: string };
  // Filter to only our app's files using appProperties marker
  return data.files.filter(f => f.appProperties?.pshManaged === 'true');
}

// ---------- File content ----------

export async function getFileContent(token: string, fileId: string): Promise<string> {
  const res = await fetch(`${DRIVE_BASE}/files/${fileId}?alt=media`, {
    headers: headers(token),
  });
  await checkResponse(res);
  return res.text();
}

export async function getFileBlob(token: string, fileId: string): Promise<Blob> {
  const res = await fetch(`${DRIVE_BASE}/files/${fileId}?alt=media`, {
    headers: headers(token),
  });
  await checkResponse(res);
  return res.blob();
}

export async function getFileMetadata(token: string, fileId: string): Promise<DriveFile> {
  const fields = 'id,name,mimeType,size,createdTime,modifiedTime,parents,trashed,webViewLink,webContentLink,thumbnailLink,appProperties,description';
  const res = await fetch(`${DRIVE_BASE}/files/${fileId}?fields=${encodeURIComponent(fields)}`, {
    headers: headers(token),
  });
  await checkResponse(res);
  return res.json() as Promise<DriveFile>;
}

// ---------- Simple upload (< 5 MB) ----------

export async function uploadFile(
  token: string,
  {
    name,
    mimeType,
    content,
    parentId,
    appProperties,
    description,
  }: {
    name: string;
    mimeType: string;
    content: Blob | string;
    parentId: string;
    appProperties?: Record<string, string>;
    description?: string;
  }
): Promise<DriveFile> {
  const metadata: any = {
    name,
    parents: [parentId],
    appProperties: { pshManaged: 'true', ...appProperties },
  };
  if (description) metadata.description = description;

  const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType });
  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', blob);

  const res = await fetch(
    `${UPLOAD_BASE}/files?uploadType=multipart&fields=id,name,mimeType,size,createdTime,modifiedTime,parents,webViewLink,webContentLink,thumbnailLink,appProperties,description`,
    { method: 'POST', headers: headers(token), body: form }
  );
  await checkResponse(res);
  return res.json() as Promise<DriveFile>;
}

// ---------- Update existing file ----------

export async function updateFileContent(
  token: string,
  fileId: string,
  {
    name,
    content,
    mimeType,
    appProperties,
    description,
  }: {
    name?: string;
    content: Blob | string;
    mimeType: string;
    appProperties?: Record<string, string>;
    description?: string;
  }
): Promise<DriveFile> {
  const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType });

  // Update metadata separately if name changed
  if (name || appProperties || description) {
    const metaBody: any = {};
    if (name) metaBody.name = name;
    if (appProperties) metaBody.appProperties = { pshManaged: 'true', ...appProperties };
    if (description) metaBody.description = description;
    const metaRes = await fetch(`${DRIVE_BASE}/files/${fileId}`, {
      method: 'PATCH',
      headers: headers(token, { 'Content-Type': 'application/json' }),
      body: JSON.stringify(metaBody),
    });
    await checkResponse(metaRes);
  }

  // Update content
  const res = await fetch(
    `${UPLOAD_BASE}/files/${fileId}?uploadType=media&fields=id,name,mimeType,size,createdTime,modifiedTime,parents,webViewLink,webContentLink,thumbnailLink,appProperties,description`,
    { method: 'PATCH', headers: headers(token, { 'Content-Type': mimeType }), body: blob }
  );
  await checkResponse(res);
  return res.json() as Promise<DriveFile>;
}

// ---------- Resumable upload (for large files) ----------

export async function initiateResumableUpload(
  token: string,
  {
    name,
    mimeType,
    fileSize,
    parentId,
    appProperties,
  }: {
    name: string;
    mimeType: string;
    fileSize: number;
    parentId: string;
    appProperties?: Record<string, string>;
  }
): Promise<string> {
  const metadata = {
    name,
    parents: [parentId],
    appProperties: { pshManaged: 'true', ...appProperties },
  };
  const res = await fetch(
    `${UPLOAD_BASE}/files?uploadType=resumable`,
    {
      method: 'POST',
      headers: headers(token, {
        'Content-Type': 'application/json',
        'X-Upload-Content-Type': mimeType,
        'X-Upload-Content-Length': String(fileSize),
      }),
      body: JSON.stringify(metadata),
    }
  );
  await checkResponse(res);
  const location = res.headers.get('Location');
  if (!location) throw new Error('No upload location returned by Drive API.');
  return location;
}

export async function uploadChunk(
  uploadUrl: string,
  chunk: Blob,
  start: number,
  total: number
): Promise<DriveFile | null> {
  const end = start + chunk.size - 1;
  const res = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Range': `bytes ${start}-${end}/${total}`,
      'Content-Length': String(chunk.size),
    },
    body: chunk,
  });
  // 200/201 = done, 308 = more chunks needed
  if (res.status === 200 || res.status === 201) {
    return res.json() as Promise<DriveFile>;
  }
  if (res.status === 308) return null; // more chunks needed
  await checkResponse(res);
  return null;
}

// ---------- Rename ----------

export async function renameFile(token: string, fileId: string, newName: string): Promise<void> {
  const res = await fetch(`${DRIVE_BASE}/files/${fileId}`, {
    method: 'PATCH',
    headers: headers(token, { 'Content-Type': 'application/json' }),
    body: JSON.stringify({ name: newName }),
  });
  await checkResponse(res);
}

// ---------- Trash / Delete ----------

export async function moveToTrash(token: string, fileId: string): Promise<void> {
  const res = await fetch(`${DRIVE_BASE}/files/${fileId}`, {
    method: 'PATCH',
    headers: headers(token, { 'Content-Type': 'application/json' }),
    body: JSON.stringify({ trashed: true }),
  });
  await checkResponse(res);
}

export async function restoreFromTrash(token: string, fileId: string): Promise<void> {
  const res = await fetch(`${DRIVE_BASE}/files/${fileId}`, {
    method: 'PATCH',
    headers: headers(token, { 'Content-Type': 'application/json' }),
    body: JSON.stringify({ trashed: false }),
  });
  await checkResponse(res);
}

export async function permanentlyDeleteFile(token: string, fileId: string): Promise<void> {
  const res = await fetch(`${DRIVE_BASE}/files/${fileId}`, {
    method: 'DELETE',
    headers: headers(token),
  });
  // 204 = success
  if (res.status !== 204 && !res.ok) {
    await checkResponse(res);
  }
}

// ---------- Storage quota ----------

export async function getStorageQuota(token: string): Promise<DriveQuota> {
  const res = await fetch(`${DRIVE_BASE}/about?fields=storageQuota`, {
    headers: headers(token),
  });
  await checkResponse(res);
  const data = await res.json() as { storageQuota: { limit: string; usage: string; usageInDrive: string } };
  return {
    limit: parseInt(data.storageQuota.limit ?? '0', 10),
    usage: parseInt(data.storageQuota.usage ?? '0', 10),
    usageInDrive: parseInt(data.storageQuota.usageInDrive ?? '0', 10),
  };
}

// ---------- User info ----------

export async function getUserInfo(token: string): Promise<{ email: string; name: string; picture?: string }> {
  const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: headers(token),
  });
  await checkResponse(res);
  const data = await res.json() as { email: string; name: string; picture?: string };
  return data;
}
