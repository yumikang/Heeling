// Audio asset mapping for bundled local files
// React Native requires static require() calls for bundled assets

type AudioAssetMap = {
  [key: string]: number;
};

// Map track audioFile keys to bundled assets
// NOTE: Local audio files removed - using streaming URLs from backend instead
const audioAssets: AudioAssetMap = {
  // Audio files are now streamed from backend URLs
  // Local bundling disabled for MVP to reduce app size
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
