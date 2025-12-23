// Audio asset mapping for bundled local files
// React Native requires static require() calls for bundled assets

type AudioAssetMap = {
  [key: string]: number;
};

// Map track audioFile keys to bundled assets
const audioAssets: AudioAssetMap = {
  cant_you_see: require('../../assets/audio/cant_you_see.mp3'),
  dreaming_in_dusk: require('../../assets/audio/Dreaming in Dusk.mp3'),
  dreams_in_slow_motion: require('../../assets/audio/Dreams in Slow Motion.mp3'),
  moonlight_murmur: require('../../assets/audio/Moonlight Murmur.mp3'),
  moonlight_reverie: require('../../assets/audio/Moonlight Reverie.mp3'),
  pink_cloud: require('../../assets/audio/Pink cloud.mp3'),
  still_as_the_sky: require('../../assets/audio/Still as the Sky.mp3'),
};

/**
 * Resolves an audio file key to either a bundled asset or URL
 * @param audioFile - Either a key from audioAssets or a full URL
 * @returns The bundled asset number or the original URL string
 */
export const resolveAudioFile = (audioFile: string): number | string => {
  // If it's a URL, return as-is
  if (audioFile.startsWith('http://') || audioFile.startsWith('https://')) {
    return audioFile;
  }

  // Look up in asset map
  const asset = audioAssets[audioFile];
  if (asset !== undefined) {
    return asset;
  }

  // Fallback - return original (may fail at runtime if not found)
  console.warn(`Audio asset not found for key: ${audioFile}`);
  return audioFile;
};

export default audioAssets;
