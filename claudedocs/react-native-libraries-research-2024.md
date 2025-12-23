# React Native Libraries Research for Meditation/Healing Music Streaming App
**Research Date**: November 25, 2025
**Focus**: Production-ready implementation patterns for audio streaming, offline sync, and cloud storage

---

## Table of Contents
1. [react-native-track-player](#1-react-native-track-player)
2. [react-native-video](#2-react-native-video)
3. [SQLite for React Native](#3-sqlite-for-react-native)
4. [Firebase Authentication](#4-firebase-authentication)
5. [AWS S3 Integration](#5-aws-s3-integration)
6. [Offline Sync Mechanisms](#6-offline-sync-mechanisms)

---

## 1. react-native-track-player

### Current Version & Stability
- **Latest Version**: 4.1.2 (published ~3 months ago)
- **Status**: Production-ready, actively maintained
- **npm Usage**: 40+ projects using it
- **Platform Support**: iOS, Android, with Expo support (experimental)

### Key Capabilities

#### Background Audio Playback
- Continues playing even when app is in background
- **iOS Configuration Required**:
  - Activate 'Audio, Airplay and Picture in Picture' background mode in Xcode
  - Without this, audio only plays when app is in foreground

```javascript
// AppKilledPlaybackBehavior options
await TrackPlayer.updateOptions({
  android: {
    appKilledPlaybackBehavior:
      AppKilledPlaybackBehavior.StopPlaybackAndRemoveNotification,
  },
});
```

#### Lock Screen Controls
- Full media control support on lock screen
- Works with Bluetooth devices, smartwatches, and car systems
- **iOS Simulator Limitation**: Apple removed Control Center support from iOS Simulator 11+, test on real devices

#### Queue Management
```javascript
// Add tracks to queue
await TrackPlayer.add([
  {
    id: '1',
    url: 'https://example.com/track.mp3',
    title: 'Track Title',
    artist: 'Artist Name',
    duration: 180,
    artwork: 'https://example.com/artwork.jpg',
  }
]);

// Remove tracks
await TrackPlayer.remove([trackId]);

// Get current queue
const queue = await TrackPlayer.getQueue();

// Replace queue
await TrackPlayer.reset();
await TrackPlayer.add(newTracks);
```

**V4 Update**: `remove()` now supports removing the current track. Next track in queue will auto-activate.

#### Crossfade Support
- **Status**: Not natively supported yet
- **Workaround**: Custom implementation required
- Open GitHub issue #670 tracking this feature

### Installation & Setup

```bash
npm install react-native-track-player
# or
yarn add react-native-track-player
```

#### 1. Register Playback Service (index.js)
```javascript
import { AppRegistry } from 'react-native';
import TrackPlayer from 'react-native-track-player';
import App from './App';
import { name as appName } from './app.json';
import { PlaybackService } from './services/PlaybackService';

AppRegistry.registerComponent(appName, () => App);
TrackPlayer.registerPlaybackService(() => PlaybackService);
```

#### 2. Setup Player Service (services/trackPlayerService.js)
```javascript
import TrackPlayer, {
  AppKilledPlaybackBehavior,
  Capability,
  RepeatMode,
  Event
} from 'react-native-track-player';

export async function setupPlayer() {
  let isSetup = false;
  try {
    // Check if player already initialized
    await TrackPlayer.getCurrentTrack();
    isSetup = true;
  } catch {
    await TrackPlayer.setupPlayer();
    await TrackPlayer.updateOptions({
      android: {
        appKilledPlaybackBehavior:
          AppKilledPlaybackBehavior.StopPlaybackAndRemoveNotification,
      },
      capabilities: [
        Capability.Play,
        Capability.Pause,
        Capability.SkipToNext,
        Capability.SkipToPrevious,
        Capability.SeekTo,
      ],
      compactCapabilities: [
        Capability.Play,
        Capability.Pause,
        Capability.SkipToNext,
      ],
      progressUpdateEventInterval: 2,
    });
    isSetup = true;
  } finally {
    return isSetup;
  }
}

export async function addTracks(tracks) {
  await TrackPlayer.add(tracks);
  await TrackPlayer.setRepeatMode(RepeatMode.Queue);
}
```

#### 3. Playback Service with Event Handlers
```javascript
// services/PlaybackService.js
import TrackPlayer, { Event } from 'react-native-track-player';

export async function PlaybackService() {
  TrackPlayer.addEventListener(Event.RemotePlay, () => TrackPlayer.play());
  TrackPlayer.addEventListener(Event.RemotePause, () => TrackPlayer.pause());
  TrackPlayer.addEventListener(Event.RemoteNext, () => TrackPlayer.skipToNext());
  TrackPlayer.addEventListener(Event.RemotePrevious, () => TrackPlayer.skipToPrevious());
  TrackPlayer.addEventListener(Event.RemoteSeek, ({ position }) => TrackPlayer.seekTo(position));
}
```

#### 4. Initialize in App Component
```javascript
import React, { useEffect, useState } from 'react';
import TrackPlayer from 'react-native-track-player';
import { setupPlayer, addTracks } from './services/trackPlayerService';

function App() {
  const [isPlayerReady, setIsPlayerReady] = useState(false);

  useEffect(() => {
    async function setup() {
      let isSetup = await setupPlayer();
      const queue = await TrackPlayer.getQueue();
      if (isSetup && queue.length <= 0) {
        await addTracks(yourTracksArray);
      }
      setIsPlayerReady(isSetup);
    }
    setup();
  }, []);

  if (!isPlayerReady) {
    return <ActivityIndicator />;
  }

  return <YourAppComponents />;
}
```

### Common Pitfalls & Best Practices

❌ **Don't**: Call `setupPlayer()` multiple times
✅ **Do**: Check if player is already initialized before setup

❌ **Don't**: Interact with TrackPlayer before setup completes
✅ **Do**: Wait for `setupPlayer()` promise to resolve

❌ **Don't**: Test lock screen controls on iOS Simulator
✅ **Do**: Test on real iOS devices

❌ **Don't**: Keep all player logic in one file
✅ **Do**: Decompose into separate service files for maintainability

### Additional Features
- Adaptive bitrate streaming (DASH, HLS, SmoothStreaming)
- Caching support for offline playback
- Fully customizable notification icons
- React Hooks for common use-cases
- Expo compatibility (with limitations on maintainer support)

### References
- [Official Documentation](https://rntp.dev/)
- [Getting Started Guide](https://rntp.dev/docs/basics/getting-started)
- [LogRocket Complete Guide (June 2024)](https://blog.logrocket.com/react-native-track-player-complete-guide/)
- [The Ultimate Guide](https://hyno.co/blog/the-ultimate-guide-to-react-native-track-player-comprehensive-overview-and-implementation.html)

---

## 2. react-native-video

### Overview
- **Status**: Most battle-tested open-source video player for React Native
- **V7 Features**: Full support for new React Native architecture
- **Key Capabilities**: DRM, offline playback, HLS/DASH streaming, caching

### Installation
```bash
npm install react-native-video react-native-video-cache
# or
yarn add react-native-video react-native-video-cache
```

### Video Streaming & Caching

#### Why Caching Matters
- **Performance**: Faster load times, reduced buffering
- **Bandwidth**: Reduced data consumption
- **Offline Support**: Uninterrupted playback without internet
- **User Experience**: Smooth streaming in low-bandwidth environments

### Approach 1: Using react-native-video-cache (Proxy-based)

**How it works**: Creates a local proxy server using AndroidVideoCache library. Once caching completes, serves videos from cache directory.

#### Android Configuration (AndroidManifest.xml)
```xml
<application
    ...
    android:largeHeap="true"
    android:hardwareAccelerated="true">
</application>
```

#### iOS Configuration (Podfile)
```ruby
$RNVideoUseVideoCaching=true
pod 'SPTPersistentCache', :modular_headers => true
pod 'DVAssetLoaderDelegate', :modular_headers => true
```

#### Implementation
```javascript
import Video from 'react-native-video';
import convertToProxyURL from 'react-native-video-cache';

<Video
  source={{ uri: convertToProxyURL(videoUrl) }}
  poster={thumbnailUrl}
  posterResizeMode="cover"
  bufferConfig={{
    minBufferMs: 2500,
    maxBufferMs: 3000,
  }}
  resizeMode="contain"
  paused={false}
/>
```

### Approach 2: Manual Caching with react-native-fs

```javascript
import Video from 'react-native-video';
import RNFS from 'react-native-fs';
import { useState, useEffect } from 'react';

const CachedVideoPlayer = ({ url, fileName }) => {
  const [videoPath, setVideoPath] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVideo = async () => {
      const path = `${RNFS.CachesDirectoryPath}/${fileName}`;
      const fileExists = await RNFS.exists(path);

      if (!fileExists) {
        // Download and cache
        await RNFS.downloadFile({
          fromUrl: url,
          toFile: path
        }).promise;
      }

      setVideoPath(path);
      setLoading(false);
    };

    fetchVideo();
  }, [url, fileName]);

  if (loading) return <ActivityIndicator />;

  return (
    <Video
      source={{ uri: `file://${videoPath}` }}
      controls
      resizeMode="contain"
    />
  );
};
```

**Android Permission Required**: For external storage caching, add permissions in AndroidManifest.xml and request at runtime (Android 6.0+).

### Approach 3: Offline Video SDK (Commercial)

**Features**:
- Direct integration with react-native-video (no player migration)
- Download HLS/DASH/SS videos with DRM support
- Queue multiple downloads with pause/resume
- Progress persistence across app restarts
- Subtitle and multi-audio track selection

### Optimization Tips

#### 1. Use CDN
- Host videos on Content Delivery Network for faster loading

#### 2. Adaptive Streaming
```javascript
<Video
  source={{
    uri: 'https://cdn.example.com/video.m3u8' // HLS
  }}
  // Player automatically adjusts quality based on network
/>
```

#### 3. Video Compression
- Use compression tools to reduce file size without quality loss
- Smaller files = faster loading + less bandwidth

#### 4. Buffer Configuration
```javascript
bufferConfig={{
  minBufferMs: 2500,      // Start playback after 2.5s buffered
  maxBufferMs: 3000,      // Maximum buffer
  bufferForPlaybackMs: 2500,
  bufferForPlaybackAfterRebufferMs: 5000
}}
```

### Common Pitfalls & Best Practices

❌ **Don't**: Use base64 encoding for video files (performance issues)
✅ **Do**: Use file paths and streaming URLs

❌ **Don't**: Rely on single upload attempt for large files
✅ **Do**: Implement retry logic for unstable networks

❌ **Don't**: Ignore React Native version requirements
✅ **Do**: Use RN 0.61+ for proper file fetch operations

### References
- [npm Package](https://www.npmjs.com/package/react-native-video)
- [Speed Up Video Loading with Caching](https://medium.com/@imranrafeek/speed-up-video-loading-in-react-native-with-local-caching-6068d780b04e)
- [HyScaler Complete Guide 2024](https://hyscaler.com/insights/ultimate-video-caching-guide-react-native/)
- [Complete Guide to Image & Video Caching](https://www.addwebsolution.com/blog/complete-guide-image-video-caching-react-native)
- [Offline Video SDK](https://www.thewidlarzgroup.com/offline-video-sdk)

---

## 3. SQLite for React Native

### Library Comparison

| Feature | expo-sqlite | react-native-sqlite-storage |
|---------|-------------|----------------------------|
| **Best For** | Expo projects, rapid prototyping | Feature-rich, non-Expo apps |
| **Integration** | Seamless with Expo ecosystem | Works with bare React Native |
| **Performance** | Good for moderate workloads | Better for complex queries |
| **Ejecting** | No eject needed | Requires eject from Expo |
| **Advanced Features** | Drizzle ORM, SQLCipher, Storage API | Advanced querying, transactions |
| **Complexity** | Simple, rapid development | More flexible, feature-rich |

### expo-sqlite

**Ideal for**: Expo managed workflow, lightweight apps, rapid development

#### Installation
```bash
npx expo install expo-sqlite
```

#### Features
- Persisted database across app restarts
- SQLCipher encryption support (Android, iOS, macOS)
- Drizzle ORM compatibility
- Storage API as drop-in for AsyncStorage
- No eject required from Expo

#### Performance
- Good for basic CRUD operations
- Not optimized for complex queries or large datasets
- Best for apps with moderate data needs

### react-native-sqlite-storage

**Ideal for**: Complex data relationships, large datasets, advanced querying

#### Installation
```bash
npm install react-native-sqlite-storage
```

#### When to Choose
- Managing complex data relationships
- Advanced querying capabilities required
- Larger datasets and heavy database operations
- Non-Expo or ejected projects

### Other Notable Libraries (2024)

**PowerSync Performance Benchmark Results**:
- **op-sqlite**: Successor to react-native-quick-sqlite
- **react-native-quick-sqlite**: Good performance baseline
- **PowerSync fork of react-native-quick-sqlite**: Enhanced performance
- **expo-sqlite**: Similar iOS performance, varies on Android

### Schema Migration Patterns

#### 1. Use PRAGMA user_version for Version Tracking

```typescript
async function migrateDbIfNeeded(db: SQLiteDatabase) {
  const DATABASE_VERSION = 3;

  const result = await db.getFirstAsync<{ user_version: number }>(
    'PRAGMA user_version'
  );
  let currentDbVersion = result?.user_version ?? 0;

  if (currentDbVersion >= DATABASE_VERSION) {
    return; // Database is up to date
  }

  // Apply migrations sequentially
  if (currentDbVersion === 0) {
    await db.execAsync(`
      PRAGMA journal_mode = 'wal';
      CREATE TABLE users (id INTEGER PRIMARY KEY NOT NULL, name TEXT NOT NULL, age INTEGER);
    `);
    currentDbVersion = 1;
  }

  if (currentDbVersion === 1) {
    await db.execAsync(`
      ALTER TABLE users ADD COLUMN email TEXT;
    `);
    currentDbVersion = 2;
  }

  if (currentDbVersion === 2) {
    await db.execAsync(`
      CREATE TABLE sessions (
        id INTEGER PRIMARY KEY NOT NULL,
        user_id INTEGER NOT NULL,
        token TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users (id)
      );
    `);
    currentDbVersion = 3;
  }

  await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
}
```

#### 2. Initialize with SQLiteProvider

```typescript
import { SQLiteProvider } from 'expo-sqlite';

export default function App() {
  return (
    <SQLiteProvider
      databaseName="meditation.db"
      onInit={migrateDbIfNeeded}
    >
      {/* Your app components */}
    </SQLiteProvider>
  );
}
```

#### 3. Use Transactions for Migrations

```javascript
async function applyMigration(db) {
  try {
    await db.execAsync('BEGIN TRANSACTION');

    // Apply migration SQL
    await db.execAsync(`
      CREATE TABLE tracks (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        artist TEXT,
        duration INTEGER,
        url TEXT NOT NULL,
        cached_path TEXT,
        created_at INTEGER DEFAULT (strftime('%s', 'now'))
      );
    `);

    await db.execAsync('COMMIT');
    console.log('Migration applied successfully');
  } catch (error) {
    await db.execAsync('ROLLBACK');
    console.error('Migration failed:', error);
    throw error;
  }
}
```

#### 4. Migration Log Table

```sql
CREATE TABLE IF NOT EXISTS migrations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  migration_name TEXT NOT NULL UNIQUE,
  applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Track applied migrations
INSERT INTO migrations (migration_name) VALUES ('create_tracks_table');
```

### Performance Optimization

#### 1. Enable WAL Mode (Write-Ahead Logging)

```sql
PRAGMA journal_mode = WAL;
```

**Benefits**:
- Multiple concurrent readers during write transactions
- Significantly improved performance
- Better concurrency

**Testing Results**: Using WAL with NORMAL synchronous mode is much faster than FULL synchronous mode.

#### 2. Additional PRAGMA Settings

```sql
-- Recommended for optimal performance
PRAGMA journal_mode = WAL;
PRAGMA synchronous = NORMAL;
PRAGMA temp_store = MEMORY;
PRAGMA mmap_size = 30000000000;
```

#### 3. Create Strategic Indexes

```sql
-- Index frequently queried columns
CREATE INDEX idx_tracks_artist ON tracks(artist);
CREATE INDEX idx_tracks_created_at ON tracks(created_at);

-- Covering index (includes all columns needed for query)
CREATE INDEX idx_tracks_search ON tracks(title, artist, duration);

-- Multi-column index for combined queries
CREATE INDEX idx_sessions_user_token ON sessions(user_id, token);
```

**Best Practices**:
- Index columns used in WHERE, JOIN, ORDER BY, GROUP BY
- Consider index overhead during inserts/updates
- Use EXPLAIN QUERY PLAN to verify index usage

#### 4. Batch Operations with Transactions

```javascript
// ❌ Slow: Individual operations
for (const track of tracks) {
  await db.runAsync(
    'INSERT INTO tracks (id, title, artist) VALUES (?, ?, ?)',
    track.id, track.title, track.artist
  );
}

// ✅ Fast: Batched in transaction
await db.execAsync('BEGIN TRANSACTION');
try {
  for (const track of tracks) {
    await db.runAsync(
      'INSERT INTO tracks (id, title, artist) VALUES (?, ?, ?)',
      track.id, track.title, track.artist
    );
  }
  await db.execAsync('COMMIT');
} catch (error) {
  await db.execAsync('ROLLBACK');
  throw error;
}
```

**Performance Impact**: Using transactions for batch operations provides massive speedup (10-100x for large batches).

#### 5. Use Prepared Statements

```javascript
// Expo SQLite prepared statement pattern
const statement = await db.prepareAsync(
  'INSERT INTO tracks (id, title, artist, duration, url) VALUES (?, ?, ?, ?, ?)'
);

try {
  for (const track of tracks) {
    await statement.executeAsync(
      track.id, track.title, track.artist, track.duration, track.url
    );
  }
} finally {
  await statement.finalizeAsync();
}
```

### Best Practices

✅ **Do**: Use parameterized queries to prevent SQL injection
```javascript
// Safe
db.runAsync('SELECT * FROM users WHERE id = ?', userId);

// ❌ Dangerous
db.execAsync(`SELECT * FROM users WHERE id = ${userId}`);
```

✅ **Do**: Define TypeScript interfaces for type safety
```typescript
interface Track {
  id: string;
  title: string;
  artist: string;
  duration: number;
  url: string;
  cached_path?: string;
}

const tracks = await db.getAllAsync<Track>('SELECT * FROM tracks');
```

✅ **Do**: Handle errors gracefully
```javascript
try {
  await db.runAsync('INSERT INTO tracks ...', ...params);
} catch (error) {
  if (error.message.includes('UNIQUE constraint')) {
    // Handle duplicate entry
  } else {
    throw error;
  }
}
```

### Using Drizzle ORM with Expo SQLite

```typescript
import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';

const expoDb = openDatabaseSync('meditation.db', { enableChangeListener: true });
const db = drizzle(expoDb);

// Define schema
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const tracks = sqliteTable('tracks', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  artist: text('artist'),
  duration: integer('duration'),
  url: text('url').notNull(),
});

// Query with type safety
const allTracks = await db.select().from(tracks);
```

### References
- [Expo SQLite Documentation](https://docs.expo.dev/versions/latest/sdk/sqlite/)
- [expo-sqlite vs react-native-sqlite-storage Comparison](https://npm-compare.com/expo-sqlite,react-native-sqlite-storage)
- [React Native Database Performance Comparison](https://www.powersync.com/blog/react-native-database-performance-comparison)
- [Navigating SQLite Migrations](https://medium.com/@hamzash863/navigating-sqlite-database-migrations-in-react-native-786d418655e6)
- [Mastering SQLite in React Native](https://30dayscoding.com/blog/working-with-sqlite-in-react-native-apps)
- [Drizzle ORM with Expo SQLite](https://orm.drizzle.team/docs/connect-expo-sqlite)

---

## 4. Firebase Authentication

### OAuth Provider Support

#### Google (Native Support)
✅ Firebase natively supports Google OAuth

#### Naver & Kakao (Custom Token Approach)
⚠️ Not natively supported by Firebase
✅ Requires custom token authentication flow

### Installation

```bash
# Firebase
npm install @react-native-firebase/app @react-native-firebase/auth

# Google Sign-In
npm install @react-native-google-signin/google-signin

# Korean Providers (Naver, Kakao)
npm install @react-native-seoul/naver-login
npm install @react-native-seoul/kakao-login
```

### Google OAuth Implementation

#### 1. Configure Firebase Project

**Android**:
- Add `google-services.json` to `android/app/` folder
- Add SHA-1 fingerprint in Firebase console (Debug + Production)

**iOS**:
- Add GoogleService-Info.plist
- Configure URL schemes in Info.plist

#### 2. Implementation Code

```javascript
import auth from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

// Configure Google Sign-In
GoogleSignin.configure({
  webClientId: 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com',
});

async function onGoogleButtonPress() {
  try {
    // Check if device supports Google Play
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

    // Get user's ID token
    const { idToken } = await GoogleSignin.signIn();

    // Create Firebase credential
    const googleCredential = auth.GoogleAuthProvider.credential(idToken);

    // Sign in to Firebase
    return auth().signInWithCredential(googleCredential);
  } catch (error) {
    console.error('Google Sign-In Error:', error);
    throw error;
  }
}

// Usage
<Button
  title="Sign in with Google"
  onPress={onGoogleButtonPress}
/>
```

### Naver & Kakao OAuth with Custom Tokens

**Architecture Flow**:
1. Use native SDK to authenticate with Naver/Kakao
2. Send access token to your backend (Firebase Cloud Function)
3. Backend verifies token with Naver/Kakao API
4. Backend creates Firebase custom token
5. Client signs in with custom token

#### 1. Kakao Login (Client-Side)

```javascript
import KakaoLogin from '@react-native-seoul/kakao-login';

async function signInWithKakao() {
  try {
    // Login with Kakao
    const result = await KakaoLogin.login();
    const { accessToken } = result;

    // Send to your backend
    const response = await fetch('https://your-api.com/auth/kakao', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accessToken }),
    });

    const { customToken } = await response.json();

    // Sign in to Firebase with custom token
    await auth().signInWithCustomToken(customToken);

    return auth().currentUser;
  } catch (error) {
    console.error('Kakao Sign-In Error:', error);
    throw error;
  }
}
```

#### 2. Naver Login (Client-Side)

```javascript
import NaverLogin from '@react-native-seoul/naver-login';

const naverKeys = {
  kConsumerKey: 'YOUR_NAVER_CLIENT_ID',
  kConsumerSecret: 'YOUR_NAVER_CLIENT_SECRET',
  kServiceAppName: 'YourAppName',
};

async function signInWithNaver() {
  try {
    // Login with Naver
    const { successResponse } = await NaverLogin.login(naverKeys);
    const { accessToken } = successResponse;

    // Send to your backend
    const response = await fetch('https://your-api.com/auth/naver', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accessToken }),
    });

    const { customToken } = await response.json();

    // Sign in to Firebase with custom token
    await auth().signInWithCustomToken(customToken);

    return auth().currentUser;
  } catch (error) {
    console.error('Naver Sign-In Error:', error);
    throw error;
  }
}
```

#### 3. Backend: Firebase Cloud Function

```javascript
// Firebase Cloud Function (Node.js)
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const axios = require('axios');

admin.initializeApp();

// Kakao Token Verification
exports.kakaoAuth = functions.https.onRequest(async (req, res) => {
  try {
    const { accessToken } = req.body;

    // Verify token with Kakao API
    const kakaoUser = await axios.get('https://kapi.kakao.com/v2/user/me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const uid = `kakao_${kakaoUser.data.id}`;

    // Create or update user in Firebase
    try {
      await admin.auth().getUser(uid);
    } catch (error) {
      // User doesn't exist, create new user
      await admin.auth().createUser({
        uid,
        displayName: kakaoUser.data.properties?.nickname,
        photoURL: kakaoUser.data.properties?.profile_image,
      });
    }

    // Create custom token
    const customToken = await admin.auth().createCustomToken(uid);

    res.json({ customToken });
  } catch (error) {
    console.error('Kakao Auth Error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

// Naver Token Verification
exports.naverAuth = functions.https.onRequest(async (req, res) => {
  try {
    const { accessToken } = req.body;

    // Verify token with Naver API
    const naverUser = await axios.get('https://openapi.naver.com/v1/nid/me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const uid = `naver_${naverUser.data.response.id}`;

    // Create or update user in Firebase
    try {
      await admin.auth().getUser(uid);
    } catch (error) {
      await admin.auth().createUser({
        uid,
        displayName: naverUser.data.response.name,
        email: naverUser.data.response.email,
        photoURL: naverUser.data.response.profile_image,
      });
    }

    // Create custom token
    const customToken = await admin.auth().createCustomToken(uid);

    res.json({ customToken });
  } catch (error) {
    console.error('Naver Auth Error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
});
```

### Token Management

#### Getting ID Token for API Requests

```javascript
import auth from '@react-native-firebase/auth';

async function getAuthToken() {
  const user = auth().currentUser;
  if (!user) return null;

  // Get ID token (auto-refreshes if expired)
  const idToken = await user.getIdToken();
  return idToken;
}

// Use in API requests
async function makeAuthenticatedRequest() {
  const token = await getAuthToken();

  const response = await fetch('https://your-api.com/protected', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  return response.json();
}
```

#### Listening to Auth State Changes

```javascript
import { useEffect, useState } from 'react';
import auth from '@react-native-firebase/auth';

function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const subscriber = auth().onAuthStateChanged((user) => {
      setUser(user);
      setLoading(false);
    });

    return subscriber; // Cleanup subscription
  }, []);

  return { user, loading };
}

// Usage in component
function App() {
  const { user, loading } = useAuth();

  if (loading) return <LoadingScreen />;
  if (!user) return <LoginScreen />;
  return <MainApp />;
}
```

#### Token Refresh

```javascript
// Tokens auto-refresh, but you can force refresh
const user = auth().currentUser;
const idToken = await user.getIdToken(true); // Force refresh
```

### Important 2024 Updates

⚠️ **Expo Go Limitation**:
- Avoid using Expo Go for OAuth implementation
- Use `expo-dev-client` instead for proper deep linking support

⚠️ **Expo SDK 49+**:
- GoogleAuth provider deprecated
- Use `@react-native-google-signin/google-signin` instead

⚠️ **Production Security**:
- Implement server-side token verification
- Never trust client-side authentication alone
- Validate tokens on every API request

### Common Pitfalls & Best Practices

❌ **Don't**: Store auth tokens in AsyncStorage or plain SQLite
✅ **Do**: Use secure storage (react-native-keychain)

❌ **Don't**: Trust client-side auth without backend verification
✅ **Do**: Verify ID tokens on backend for protected resources

❌ **Don't**: Hardcode sensitive keys in code
✅ **Do**: Use environment variables and proper key management

```javascript
// ❌ Bad
const API_KEY = 'sk_live_abc123...';

// ✅ Good
import Config from 'react-native-config';
const API_KEY = Config.FIREBASE_API_KEY;
```

### References
- [Google OAuth with Firebase in React Native](https://blog.openreplay.com/google-oauth-with-firebase-in-react-native/)
- [React Native Firebase Auth Documentation](https://rnfirebase.io/auth/usage)
- [Expo Google Authentication Guide](https://docs.expo.dev/guides/google-authentication/)
- [Firebase Custom Login (Kakao/Naver)](https://github.com/zaiyou12/firebase-custom-login)
- [Google Authentication 2024 Guide](https://medium.com/@ansonmathew/google-authentication-in-react-native-2024-64cacff395f7)

---

## 5. AWS S3 Integration

### Overview

**Use Case**: Uploading large audio/video files (150MB+) to S3 from React Native

**Challenge**: AWS SDK designed for web, not React Native (missing dependencies: buffer, http2, etc.)

**Solution**: Multipart upload with presigned URLs

### Why Multipart Upload?

✅ **Improved Throughput**: Upload parts in parallel
✅ **Network Resilience**: Restart only failed parts, not entire upload
✅ **Large File Support**: Required for files >5GB, recommended for >100MB
✅ **Progress Tracking**: Track progress per part

**Performance Gains**:
- Without transfer acceleration: 38% faster
- With transfer acceleration: 61% faster

### Architecture

```
Mobile App → API Gateway → Lambda → S3
              ↓
        Presigned URLs
              ↓
     Direct Upload to S3
```

**Benefits of Presigned URLs**:
- Keep S3 credentials private
- Time-limited access (default 15 min, configurable)
- Direct upload to S3 (no backend proxy)
- Secure and scalable

### Backend: Generate Presigned URLs

```javascript
// AWS Lambda or Express.js Backend
const AWS = require('aws-sdk');
const s3 = new AWS.S3();

// Initiate multipart upload
async function initiateMultipartUpload(fileName, fileType) {
  const params = {
    Bucket: 'your-bucket-name',
    Key: `uploads/${fileName}`,
    ContentType: fileType,
  };

  const multipart = await s3.createMultipartUpload(params).promise();
  return {
    uploadId: multipart.UploadId,
    key: multipart.Key,
  };
}

// Generate presigned URL for each part
async function getPresignedUrl(key, uploadId, partNumber) {
  const params = {
    Bucket: 'your-bucket-name',
    Key: key,
    PartNumber: partNumber,
    UploadId: uploadId,
    Expires: 3600, // 1 hour
  };

  return s3.getSignedUrl('uploadPart', params);
}

// Complete multipart upload
async function completeMultipartUpload(key, uploadId, parts) {
  const params = {
    Bucket: 'your-bucket-name',
    Key: key,
    UploadId: uploadId,
    MultipartUpload: {
      Parts: parts, // [{ ETag, PartNumber }, ...]
    },
  };

  return s3.completeMultipartUpload(params).promise();
}
```

### React Native: Upload Implementation

#### Option 1: Using expo-file-system (Recommended for Expo)

```javascript
import * as FileSystem from 'expo-file-system';
import { Buffer } from 'buffer';

const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunks

async function uploadLargeFile(fileUri, fileName, fileType) {
  try {
    // 1. Get file info
    const fileInfo = await FileSystem.getInfoAsync(fileUri);
    const fileSize = fileInfo.size;
    const totalParts = Math.ceil(fileSize / CHUNK_SIZE);

    // 2. Initiate multipart upload (call your backend)
    const initResponse = await fetch('https://your-api.com/s3/initiate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileName, fileType }),
    });
    const { uploadId, key } = await initResponse.json();

    // 3. Upload parts in parallel
    const uploadPromises = [];
    const parts = [];

    for (let partNumber = 1; partNumber <= totalParts; partNumber++) {
      uploadPromises.push(uploadPart(fileUri, key, uploadId, partNumber, fileSize));
    }

    // Wait for all parts to complete
    const results = await Promise.all(uploadPromises);
    results.forEach(({ partNumber, etag }) => {
      parts.push({ PartNumber: partNumber, ETag: etag });
    });

    // 4. Complete multipart upload
    const completeResponse = await fetch('https://your-api.com/s3/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, uploadId, parts }),
    });

    return completeResponse.json();
  } catch (error) {
    console.error('Upload failed:', error);
    throw error;
  }
}

async function uploadPart(fileUri, key, uploadId, partNumber, fileSize) {
  // Get presigned URL from backend
  const urlResponse = await fetch('https://your-api.com/s3/presigned-url', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key, uploadId, partNumber }),
  });
  const { presignedUrl } = await urlResponse.json();

  // Calculate byte range for this part
  const start = (partNumber - 1) * CHUNK_SIZE;
  const end = Math.min(start + CHUNK_SIZE, fileSize);

  // Read file chunk as base64
  const base64Chunk = await FileSystem.readAsStringAsync(fileUri, {
    encoding: FileSystem.EncodingType.Base64,
    position: start,
    length: end - start,
  });

  // Convert base64 to binary blob (requires polyfill)
  const binaryChunk = Buffer.from(base64Chunk, 'base64');

  // Upload part
  const uploadResponse = await fetch(presignedUrl, {
    method: 'PUT',
    body: binaryChunk,
    headers: {
      'Content-Type': 'application/octet-stream',
    },
  });

  // Get ETag from response (required for completion)
  const etag = uploadResponse.headers.get('ETag');

  return { partNumber, etag };
}
```

#### Option 2: Using rn-fetch-blob (For Bare React Native)

```javascript
import RNFetchBlob from 'rn-fetch-blob';

async function uploadWithRNFetchBlob(filePath, presignedUrl) {
  try {
    const response = await RNFetchBlob.fetch(
      'PUT',
      presignedUrl,
      {
        'Content-Type': 'application/octet-stream',
      },
      RNFetchBlob.wrap(filePath.replace('file://', ''))
    );

    const etag = response.respInfo.headers.ETag || response.respInfo.headers.etag;
    return etag;
  } catch (error) {
    console.error('Upload failed:', error);
    throw error;
  }
}
```

#### Option 3: Using XMLHttpRequest with Blob

```javascript
async function createBlobFromUri(uri) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.onload = function () {
      resolve(xhr.response);
    };
    xhr.onerror = function () {
      reject(new TypeError('Network request failed'));
    };
    xhr.responseType = 'blob';
    xhr.open('GET', uri, true);
    xhr.send(null);
  });
}

async function uploadBlob(blob, presignedUrl) {
  const response = await fetch(presignedUrl, {
    method: 'PUT',
    body: blob,
    headers: {
      'Content-Type': 'application/octet-stream',
    },
  });

  return response.headers.get('ETag');
}
```

### Upload Progress Tracking

```javascript
import * as FileSystem from 'expo-file-system';

async function uploadWithProgress(fileUri, presignedUrl, onProgress) {
  const uploadResumable = FileSystem.createUploadTask(
    presignedUrl,
    fileUri,
    {
      httpMethod: 'PUT',
      headers: {
        'Content-Type': 'application/octet-stream',
      },
    },
    (data) => {
      const progress = data.totalBytesSent / data.totalBytesExpectedToSend;
      onProgress(progress * 100); // 0-100%
    }
  );

  const response = await uploadResumable.uploadAsync();
  return response;
}

// Usage
<Button
  onPress={() => {
    uploadWithProgress(
      fileUri,
      presignedUrl,
      (percent) => setUploadProgress(percent)
    );
  }}
/>
<ProgressBar progress={uploadProgress} />
```

### CORS Configuration

**Important**: Enable CORS on S3 bucket for web/mobile uploads

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedOrigins": ["*"],
    "ExposeHeaders": ["ETag"]
  }
]
```

### Common Pitfalls & Best Practices

❌ **Don't**: Upload without retry logic
✅ **Do**: Implement exponential backoff retry

```javascript
async function uploadWithRetry(uploadFn, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await uploadFn();
    } catch (error) {
      if (attempt === maxRetries) throw error;

      // Exponential backoff
      const delay = Math.pow(2, attempt) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}
```

❌ **Don't**: Use base64 encoding unnecessarily (memory issues)
✅ **Do**: Use file paths and binary data directly

❌ **Don't**: Upload entire 150MB+ files in single request
✅ **Do**: Use multipart upload with 5-10MB chunks

❌ **Don't**: Forget to handle partial upload failures
✅ **Do**: Track uploaded parts, retry only failed parts

❌ **Don't**: Hardcode Content-MD5 checksum incorrectly
✅ **Do**: Use base64-encoded 128-bit MD5 digest

```javascript
import { Md5 } from 'react-native-quick-md5';

const md5Hash = Md5.hash(binaryData);
const base64Md5 = btoa(String.fromCharCode(...Buffer.from(md5Hash, 'hex')));
```

### Security Best Practices

✅ Validate file types on backend before generating presigned URLs
✅ Limit presigned URL expiration (15-60 minutes)
✅ Implement rate limiting on upload endpoints
✅ Scan uploaded files for malware
✅ Use IAM roles with least privilege for S3 access

### References
- [AWS Blog: Uploading Large Objects with Multipart Upload](https://aws.amazon.com/blogs/compute/uploading-large-objects-to-amazon-s3-using-multipart-upload-and-transfer-acceleration/)
- [Handling Large File Uploads with S3 Pre-signed URLs](https://www.pullrequest.com/blog/handling-large-file-uploads-in-react-securely-using-aws-s3-pre-signed-urls/)
- [Multipart Uploads with S3 in Node.js and React](https://blog.logrocket.com/multipart-uploads-s3-node-js-react/)
- [React Native Upload to S3 with Presigned URL](https://stackoverflow.com/questions/37760355/react-native-upload-to-s3-with-presigned-url)
- [Large Media Asset Uploading](https://ahartzog.medium.com/large-media-asset-uploading-with-react-native-multipart-with-retry-handling-22d0dc3cd94b)

---

## 6. Offline Sync Mechanisms

### Overview

**Key Strategies**:
1. **Version-Based Sync**: Track last sync timestamp
2. **Delta Sync**: Only sync changed data
3. **Tombstone Deletion**: Soft delete with replication
4. **Conflict Resolution**: Last-write-wins or custom logic

### Recommended Libraries

#### 1. WatermelonDB (Recommended)
- **Best For**: Offline-first React Native apps
- **Features**:
  - Built on SQLite
  - Optimized for large datasets
  - Observable queries (real-time updates)
  - Sync adapter included
- **Note**: Requires backend implementation

#### 2. PouchDB/CouchDB
- **Best For**: Built-in server sync, bi-directional replication
- **Features**:
  - Complete sync solution
  - Live replication
  - Automatic conflict resolution
  - No custom backend needed

#### 3. react-native-offline
- **Best For**: Network state management, offline queue
- **Features**:
  - Redux integration
  - Automatic request queuing
  - Retry logic

### Sync Patterns

#### 1. Version-Based Sync (Timestamp)

**Concept**: Track last sync time, fetch only newer data

```javascript
// Local SQLite schema
CREATE TABLE sync_metadata (
  key TEXT PRIMARY KEY,
  last_sync_timestamp INTEGER
);

CREATE TABLE tracks (
  id TEXT PRIMARY KEY,
  title TEXT,
  artist TEXT,
  server_updated_at INTEGER, -- Server timestamp
  local_updated_at INTEGER,   -- Local modification time
  is_dirty INTEGER DEFAULT 0  -- Needs upload
);

// Sync logic
async function syncTracks() {
  // 1. Get last sync timestamp
  const lastSync = await db.getFirstAsync(
    'SELECT last_sync_timestamp FROM sync_metadata WHERE key = ?',
    'tracks_sync'
  );
  const lastSyncTime = lastSync?.last_sync_timestamp || 0;

  // 2. Fetch updates from server
  const response = await fetch(`https://api.example.com/tracks/sync?since=${lastSyncTime}`);
  const { tracks: serverTracks, timestamp: serverTimestamp } = await response.json();

  // 3. Apply server updates to local DB
  await db.execAsync('BEGIN TRANSACTION');
  try {
    for (const track of serverTracks) {
      await db.runAsync(
        `INSERT OR REPLACE INTO tracks
         (id, title, artist, server_updated_at, is_dirty)
         VALUES (?, ?, ?, ?, 0)`,
        track.id, track.title, track.artist, track.updated_at
      );
    }

    // 4. Update last sync timestamp
    await db.runAsync(
      'INSERT OR REPLACE INTO sync_metadata (key, last_sync_timestamp) VALUES (?, ?)',
      'tracks_sync', serverTimestamp
    );

    await db.execAsync('COMMIT');
  } catch (error) {
    await db.execAsync('ROLLBACK');
    throw error;
  }

  // 5. Upload local changes
  await uploadDirtyRecords();
}

async function uploadDirtyRecords() {
  const dirtyTracks = await db.getAllAsync(
    'SELECT * FROM tracks WHERE is_dirty = 1'
  );

  if (dirtyTracks.length === 0) return;

  // Upload to server
  const response = await fetch('https://api.example.com/tracks/batch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tracks: dirtyTracks }),
  });

  if (response.ok) {
    // Clear dirty flags
    const ids = dirtyTracks.map(t => t.id);
    await db.runAsync(
      `UPDATE tracks SET is_dirty = 0 WHERE id IN (${ids.map(() => '?').join(',')})`,
      ...ids
    );
  }
}
```

#### 2. Delta Sync (Couchbase Lite Pattern)

**Concept**: Replicate only changed parts of documents

```javascript
// Using Couchbase Lite in React Native
import { Database, Replicator, ReplicatorConfiguration } from 'react-native-couchbase-lite';

async function setupDeltaSync() {
  // Create or open database
  const database = new Database('meditation-db');
  await database.open();

  // Configure replicator with delta sync
  const config = new ReplicatorConfiguration(
    database,
    'wss://your-sync-gateway.example.com/meditation'
  );

  // Enable delta sync (only changed parts replicated)
  config.enableDeltaSync = true;

  // Continuous replication
  config.continuous = true;

  // Bidirectional sync
  config.replicatorType = ReplicatorConfiguration.ReplicatorType.PUSH_AND_PULL;

  const replicator = new Replicator(config);

  // Listen for changes
  replicator.addChangeListener((change) => {
    console.log('Sync progress:', change.status.progress);
  });

  // Start syncing
  await replicator.start();
}
```

**Benefits**:
- Significant bandwidth savings
- Faster sync for large documents
- Automatic by Couchbase Lite when enabled

#### 3. Tombstone Deletion Pattern

**Concept**: Soft delete records, replicate deletions

```javascript
// Schema with tombstone support
CREATE TABLE tracks (
  id TEXT PRIMARY KEY,
  title TEXT,
  artist TEXT,
  deleted INTEGER DEFAULT 0,    -- Tombstone flag
  deleted_at INTEGER,            -- When deleted
  updated_at INTEGER NOT NULL
);

// Soft delete (creates tombstone)
async function softDeleteTrack(trackId) {
  const now = Date.now();
  await db.runAsync(
    `UPDATE tracks
     SET deleted = 1, deleted_at = ?, updated_at = ?, is_dirty = 1
     WHERE id = ?`,
    now, now, trackId
  );
}

// Sync handles tombstones
async function syncWithTombstones(lastSyncTime) {
  // Fetch from server (includes tombstones)
  const response = await fetch(`https://api.example.com/tracks/sync?since=${lastSyncTime}`);
  const { tracks, deletions } = await response.json();

  // Apply updates
  for (const track of tracks) {
    await db.runAsync(
      'INSERT OR REPLACE INTO tracks (id, title, artist, updated_at) VALUES (?, ?, ?, ?)',
      track.id, track.title, track.artist, track.updated_at
    );
  }

  // Apply deletions (tombstones)
  for (const deletion of deletions) {
    await db.runAsync(
      'UPDATE tracks SET deleted = 1, deleted_at = ? WHERE id = ?',
      deletion.deleted_at, deletion.id
    );
  }

  // Cleanup old tombstones (older than 30 days)
  const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
  await db.runAsync(
    'DELETE FROM tracks WHERE deleted = 1 AND deleted_at < ?',
    thirtyDaysAgo
  );
}

// Upload local deletions
async function uploadLocalDeletions() {
  const deletedTracks = await db.getAllAsync(
    'SELECT id, deleted_at FROM tracks WHERE deleted = 1 AND is_dirty = 1'
  );

  if (deletedTracks.length > 0) {
    await fetch('https://api.example.com/tracks/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deletions: deletedTracks }),
    });
  }
}
```

#### 4. Conflict Resolution

**Last Write Wins (LWW)**:

```javascript
async function resolveConflict(localTrack, serverTrack) {
  // Compare timestamps
  if (serverTrack.updated_at > localTrack.updated_at) {
    // Server wins
    await db.runAsync(
      'UPDATE tracks SET title = ?, artist = ?, updated_at = ?, is_dirty = 0 WHERE id = ?',
      serverTrack.title, serverTrack.artist, serverTrack.updated_at, serverTrack.id
    );
    return 'server';
  } else {
    // Local wins, keep dirty flag to upload
    return 'local';
  }
}
```

**Custom Resolution**:

```javascript
async function mergeConflict(localTrack, serverTrack) {
  // Custom logic: Merge non-conflicting fields
  const merged = {
    id: localTrack.id,
    title: serverTrack.title, // Use server title
    artist: localTrack.artist, // Keep local artist
    duration: Math.max(localTrack.duration, serverTrack.duration), // Use max
    updated_at: Date.now(),
  };

  await db.runAsync(
    'UPDATE tracks SET title = ?, artist = ?, duration = ?, updated_at = ?, is_dirty = 1 WHERE id = ?',
    merged.title, merged.artist, merged.duration, merged.updated_at, merged.id
  );

  return merged;
}
```

### Network State Management

```javascript
import NetInfo from '@react-native-community/netinfo';

// Monitor network state
const unsubscribe = NetInfo.addEventListener(state => {
  console.log('Connection type:', state.type);
  console.log('Is connected?', state.isConnected);

  if (state.isConnected) {
    // Trigger sync when back online
    syncTracks();
  }
});

// Check before sync
async function syncIfOnline() {
  const state = await NetInfo.fetch();

  if (state.isConnected) {
    await syncTracks();
  } else {
    console.log('Offline, sync deferred');
  }
}
```

### Optimistic Updates

```javascript
// Update UI immediately, sync in background
async function createTrackOptimistic(track) {
  // 1. Immediately update local DB and UI
  await db.runAsync(
    'INSERT INTO tracks (id, title, artist, is_dirty) VALUES (?, ?, ?, 1)',
    track.id, track.title, track.artist
  );

  // 2. Trigger re-render (if using observables or state)
  notifyTrackCreated(track);

  // 3. Upload in background
  try {
    await fetch('https://api.example.com/tracks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(track),
    });

    // Clear dirty flag on success
    await db.runAsync('UPDATE tracks SET is_dirty = 0 WHERE id = ?', track.id);
  } catch (error) {
    // Keep dirty flag, retry later
    console.error('Upload failed, will retry:', error);
  }
}
```

### PouchDB Example (Complete Sync Solution)

```javascript
import PouchDB from 'pouchdb-react-native';
import SQLite from 'react-native-sqlite-2';

// Initialize PouchDB with SQLite adapter
PouchDB.plugin(require('pouchdb-adapter-react-native-sqlite').default);

const localDB = new PouchDB('meditation_tracks', {
  adapter: 'react-native-sqlite',
  location: 'default',
});

const remoteDB = new PouchDB('https://your-couchdb.example.com/meditation_tracks', {
  auth: {
    username: 'user',
    password: 'pass',
  },
});

// Setup bidirectional sync
function setupSync() {
  const sync = localDB.sync(remoteDB, {
    live: true,        // Continuous sync
    retry: true,       // Retry on errors
  })
  .on('change', (info) => {
    console.log('Sync change:', info);
  })
  .on('paused', () => {
    console.log('Sync paused (caught up)');
  })
  .on('active', () => {
    console.log('Sync active (replicating)');
  })
  .on('error', (err) => {
    console.error('Sync error:', err);
  });

  return sync;
}

// CRUD with automatic sync
async function createTrack(track) {
  const doc = {
    _id: track.id,
    type: 'track',
    ...track,
  };

  await localDB.put(doc);
  // PouchDB automatically syncs to remote
}

async function updateTrack(trackId, updates) {
  const doc = await localDB.get(trackId);
  const updated = { ...doc, ...updates };
  await localDB.put(updated);
}

async function deleteTrack(trackId) {
  const doc = await localDB.get(trackId);
  await localDB.remove(doc);
  // Deletion is synced as tombstone
}

// Query with live updates
function watchTracks(callback) {
  const changes = localDB.changes({
    since: 'now',
    live: true,
    include_docs: true,
    filter: (doc) => doc.type === 'track',
  });

  changes.on('change', (change) => {
    callback(change.doc);
  });

  return changes; // Call changes.cancel() to stop watching
}
```

### Best Practices

✅ **Do**: Use transactions for batch operations
```javascript
await db.execAsync('BEGIN TRANSACTION');
try {
  // Multiple operations
  await db.execAsync('COMMIT');
} catch (error) {
  await db.execAsync('ROLLBACK');
}
```

✅ **Do**: Implement exponential backoff for retries
```javascript
async function retryWithBackoff(fn, maxRetries = 5) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
    }
  }
}
```

✅ **Do**: Batch sync operations
```javascript
// Sync every 5 minutes or on specific triggers
let syncTimer;
function scheduleSyncBatch() {
  clearTimeout(syncTimer);
  syncTimer = setTimeout(() => {
    syncTracks();
  }, 5 * 60 * 1000); // 5 minutes
}
```

✅ **Do**: Show sync status to users
```javascript
<View>
  <Text>Last synced: {lastSyncTime}</Text>
  {isSyncing && <ActivityIndicator />}
  <Button onPress={manualSync}>Sync Now</Button>
</View>
```

❌ **Don't**: Sync large datasets on cellular without user consent
```javascript
const state = await NetInfo.fetch();
if (state.type === 'cellular' && dataSize > 10_000_000) {
  // Ask user permission
  showSyncWarning('Large download on cellular data');
}
```

❌ **Don't**: Forget to handle concurrent modifications
```javascript
// Use optimistic locking with version field
UPDATE tracks SET title = ?, version = version + 1
WHERE id = ? AND version = ?
```

❌ **Don't**: Delete data permanently without tombstones
```javascript
// ❌ Bad
DELETE FROM tracks WHERE id = ?;

// ✅ Good
UPDATE tracks SET deleted = 1, deleted_at = ? WHERE id = ?;
```

### References
- [Couchbase Lite Remote Sync](https://cbl-reactnative.dev/DataSync/remote-sync-gateway)
- [Handling Offline Mode in React Native](https://www.around25.com/blog/handling-offline-mode-in-react-native)
- [Building Offline-first Applications](https://dev.to/zidanegimiga/building-offline-first-applications-with-react-native-3626)
- [Offline First Approach](https://medium.com/@vitorbritto/offline-first-how-to-apply-this-approach-in-react-native-e2ed7af29cde)
- [Building an Offline Realtime Sync Engine](https://gist.github.com/pesterhazy/3e039677f2e314cb77ffe3497ebca07b)
- [React Native Offline Package](https://www.npmjs.com/package/react-native-offline)
- [React Native Offline Tutorial](https://www.bacancytechnology.com/blog/react-native-offline-support)

---

## Summary & Recommendations

### For Your Meditation/Healing Music Streaming App

#### Audio Playback
✅ **Use**: `react-native-track-player` v4.1.2
- Production-ready for background audio
- Lock screen controls built-in
- Queue management for playlists
- Note: Crossfade requires custom implementation

#### Video Playback (if needed)
✅ **Use**: `react-native-video` with `react-native-video-cache`
- Proxy-based caching for offline playback
- Configure buffer settings for smooth streaming

#### Local Database
✅ **Use**: `expo-sqlite` (if using Expo) or `react-native-sqlite-storage` (bare RN)
- Implement PRAGMA user_version for migrations
- Enable WAL mode for performance
- Use transactions for batch operations
- Create indexes on frequently queried columns

#### Authentication
✅ **Use**: `@react-native-firebase/auth` with OAuth providers
- Google: Native Firebase support
- Naver/Kakao: Custom token flow via Cloud Functions
- Implement secure token management

#### Cloud Storage
✅ **Use**: AWS S3 with presigned URLs and multipart upload
- 5MB chunks for 150MB+ files
- Parallel upload with retry logic
- expo-file-system for Expo, rn-fetch-blob for bare RN

#### Offline Sync
✅ **Recommended Pattern**: Version-based sync with tombstone deletions
- Track last_sync_timestamp
- Soft delete with deleted flag
- Conflict resolution: Last-write-wins
- Use `@react-native-community/netinfo` for network awareness
- Consider WatermelonDB for complex offline-first needs

### Implementation Priority

1. **Phase 1**: Audio playback + Local database
2. **Phase 2**: Authentication + Cloud storage
3. **Phase 3**: Offline sync + Caching
4. **Phase 4**: Video (if needed) + Advanced features

---

**Document Version**: 1.0
**Last Updated**: November 25, 2025
**Confidence Level**: High (based on 2024 sources and official documentation)
