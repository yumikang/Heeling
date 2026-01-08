/**
 * Heeling - Healing Music App
 * @format
 */

import { registerRootComponent } from 'expo';
import TrackPlayer from 'react-native-track-player';
import App from './App';
import { PlaybackService } from './src/services/PlaybackService';

// Register the app using Expo's registerRootComponent
// This ensures Expo modules are properly initialized
registerRootComponent(App);

// Register the playback service for background audio
TrackPlayer.registerPlaybackService(() => PlaybackService);
