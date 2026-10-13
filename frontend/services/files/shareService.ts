import { Platform, Share } from 'react-native';
import { getFileBlob } from '../google-drive/driveApi';

/**
 * Share a file from Google Drive to any app (WhatsApp, email, etc.)
 * Uses the Web Share API on web and React Native Share on mobile.
 */
export async function shareFile(
  token: string,
  fileId: string,
  fileName: string,
  mimeType: string
): Promise<void> {
  if (Platform.OS === 'web') {
    // Web Share API
    const blob = await getFileBlob(token, fileId);
    const file = new File([blob], fileName, { type: mimeType });
    
    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        title: fileName,
        files: [file],
      });
    } else if (navigator.share) {
      // Fallback: share as link if files not supported
      await navigator.share({
        title: fileName,
        text: `Check out this file: ${fileName}`,
        url: `https://drive.google.com/file/d/${fileId}/view`,
      });
    } else {
      // Final fallback: copy Drive link to clipboard
      const url = `https://drive.google.com/file/d/${fileId}/view`;
      await navigator.clipboard.writeText(url);
      throw new Error('Link copied to clipboard! Share manually via your preferred app.');
    }
  } else {
    // Native: Use React Native Share API
    const driveUrl = `https://drive.google.com/file/d/${fileId}/view`;
    await Share.share({
      title: fileName,
      message: `${fileName}\n${driveUrl}`,
      url: driveUrl,
    });
  }
}
