# Personal Storage Hub — Setup & Google Cloud Configuration Guide

Personal Storage Hub is a cross-platform (Android, iOS, Web) application that lets you save text notes and upload files straight into your own Google Drive.

---

## 1. Google Cloud Console Setup

1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project (e.g. `Personal Storage Hub`).
3. Navigate to **APIs & Services > Library**.
4. Search for **Google Drive API** and click **Enable**.

### Configure OAuth Consent Screen
1. Navigate to **APIs & Services > OAuth consent screen**.
2. Select User Type: **External** (or Internal if using Google Workspace).
3. Set Application name: `Personal Storage Hub`.
4. Provide your support email.
5. In **Scopes**, add:
   - `openid`
   - `https://www.googleapis.com/auth/userinfo.email`
   - `https://www.googleapis.com/auth/userinfo.profile`
   - `https://www.googleapis.com/auth/drive.file` (Allows creating and managing files created by this app only).
6. In **Test users**, add your personal Google account email so you can sign in during development.

---

## 2. Create OAuth Client IDs

Under **APIs & Services > Credentials > Create Credentials > OAuth client ID**:

### Web Client ID
- Application type: **Web application**
- Authorized JavaScript origins: `http://localhost:8081`, `http://localhost:3001`
- Authorized redirect URIs:
  - `http://localhost:8081/auth/callback`
  - `http://localhost:3001/auth/callback`
- Note down: `Client ID` and `Client Secret`.

### Android Client ID
- Application type: **Android**
- Package name: `com.personal.storagehub`
- SHA-1 certificate fingerprint:
  - Run `keytool -keystore ~/.android/debug.keystore -list -v` (password: `android`) or get fingerprint from EAS.

### iOS Client ID
- Application type: **iOS**
- Bundle ID: `com.personal.storagehub`

---

## 3. Environment Variables Configuration

Copy `.env.example` to `.env` in the root directory:
```bash
cp .env.example .env
```
Populate the values with your credentials:
```env
EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB=your_web_client_id.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_CLIENT_ID_ANDROID=your_android_client_id.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_CLIENT_ID_IOS=your_ios_client_id.apps.googleusercontent.com
EXPO_PUBLIC_API_URL=http://localhost:3001

SERVER_PORT=3001
SESSION_SECRET=a_very_secure_random_string_at_least_32_chars
GOOGLE_CLIENT_ID_SERVER=your_web_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_web_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3001/auth/callback
```

---

## 4. Running the Application

### Start the Express Backend Server
```bash
cd server
npm install
npm run dev
```

### Start the Expo Frontend
In a new terminal at the project root:
```bash
npm install
npm run web      # Run on browser
npm run android  # Run on Android (Requires Expo Dev Client for native OAuth)
npm run ios      # Run on iOS (Requires Expo Dev Client for native OAuth)
```

### Running Unit Tests
```bash
npm run test
```

---

## 5. Security Architecture

- **Drive Scope**: Uses `https://www.googleapis.com/auth/drive.file` exclusively. The app cannot read or delete your private files created outside of Personal Storage Hub.
- **Client Secrets**: Client secrets are kept exclusively on the Node/Express backend (`server/`). The frontend web client interacts via secure sessions.
- **Tokens on Mobile**: Tokens are securely stored using Android Keystore / iOS Keychain via `expo-secure-store`.
