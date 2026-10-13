# Personal Storage Hub

Personal Storage Hub is a clean, minimal personal knowledge and file storage application built with React Native (Expo Router) and Node.js. It saves all your text notes and uploaded files directly into your personal Google Drive, making Drive the ultimate source of truth without requiring any third-party database.

## Features

- **Save Text Notes**: Write and edit notes directly; automatically saved as `.txt` files in Google Drive.
- **Auto-Categorized Uploads**: Upload documents, images, and videos; files are classified by MIME type into dedicated Drive folders (`Text Notes`, `PDFs`, `Word Documents`, `Images`, `Videos`, `Other Files`).
- **Resumable Uploads**: Large files stream via Google Drive Resumable Upload protocol.
- **Drive as Source of Truth**: Clear local cache anytime; the app rebuilds history straight from Google Drive metadata.
- **Trash & Recovery**: Move items to Drive trash, view trashed files, restore them, or permanently delete them.
- **Cross-Platform**: Runs on Web, Android, and iOS.
- **Zero Database**: No Firebase, Supabase, Mongo, or PostgreSQL needed.

## Tech Stack

- **Frontend**: React Native, Expo SDK 51, Expo Router, TypeScript
- **Backend / Token Exchange**: Node.js, Express, TypeScript
- **Auth**: Google OAuth 2.0 PKCE, `expo-auth-session`, `expo-secure-store`
- **Cloud Storage**: Google Drive API v3

## Documentation

For full setup, Google Cloud credentials, and deployment guides, see [docs/SETUP.md](./docs/SETUP.md).
