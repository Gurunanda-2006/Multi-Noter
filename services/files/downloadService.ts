import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { getFileBlob } from '../google-drive/driveApi';

/**
 * Downloads a file from Google Drive directly to the user's personal device.
 * Works seamlessly across Web, Android, and iOS.
 */
export async function downloadFileToDevice(
  token: string,
  fileId: string,
  fileName: string,
  mimeType: string
): Promise<void> {
  if (Platform.OS === 'web') {
    // Web: Fetch binary blob directly and trigger native browser download
    const blob = await getFileBlob(token, fileId);
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } else {
    // Native (Android / iOS): Download using expo-file-system to device storage
    const fileUri = `${FileSystem.documentDirectory}${fileName}`;
    const downloadRes = await FileSystem.downloadAsync(
      `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
      fileUri,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (downloadRes.status !== 200) {
      throw new Error(`Failed to download file (Status ${downloadRes.status})`);
    }
  }
}
