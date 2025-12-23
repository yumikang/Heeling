/**
 * Heeling - Healing Music App
 * @format
 */

import { AppRegistry } from 'react-native';
import TrackPlayer from 'react-native-track-player';
import App from './App';
import { name as appName } from './app.json';
import { PlaybackService } from './src/services/PlaybackService';

// Register the app
AppRegistry.registerComponent(appName, () => App);

// Register the playback service for background audio
TrackPlayer.registerPlaybackService(() => PlaybackService);
