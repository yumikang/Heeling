import { prisma } from './prisma';

// Mapping format: { "style_mood": ["playlistId1", "playlistId2", ...] }
type PresetPlaylistMapping = Record<string, string[]>;

// Get preset-playlist mapping from SystemSetting
async function getPresetPlaylistMapping(): Promise<PresetPlaylistMapping | null> {
  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { key: 'preset_playlist_mapping' },
    });

    if (!setting || !setting.value) {
      return null;
    }

    return setting.value as unknown as PresetPlaylistMapping;
  } catch (error) {
    console.error('[PlaylistMapper] Failed to get mapping config:', error);
    return null;
  }
}

// Get current max position in a playlist
async function getMaxPositionInPlaylist(playlistId: string): Promise<number> {
  try {
    const result = await prisma.playlistTrack.findFirst({
      where: { playlistId },
      orderBy: { position: 'desc' },
      select: { position: true },
    });
    return result?.position ?? 0;
  } catch {
    return 0;
  }
}

/**
 * Add a track to matching playlists based on style and mood
 * @param trackId - The created track ID
 * @param styleCode - Style code (e.g., 'piano', 'nature', 'cinema')
 * @param moodCode - Mood code (e.g., 'calm', 'dreamy', 'hopeful')
 * @returns Number of playlists the track was added to
 */
export async function addTrackToMatchingPlaylists(
  trackId: string,
  styleCode?: string,
  moodCode?: string
): Promise<{ success: boolean; playlistsAdded: number; playlistNames: string[] }> {
  if (!styleCode && !moodCode) {
    console.log('[PlaylistMapper] No style or mood provided, skipping playlist mapping');
    return { success: true, playlistsAdded: 0, playlistNames: [] };
  }

  try {
    const mappingConfig = await getPresetPlaylistMapping();

    if (!mappingConfig) {
      console.log('[PlaylistMapper] No mapping config found, skipping playlist mapping');
      return { success: true, playlistsAdded: 0, playlistNames: [] };
    }

    // Build key: "style_mood" format
    const mappingKey = `${styleCode || ''}_${moodCode || ''}`;
    console.log(`[PlaylistMapper] Looking for mapping key: ${mappingKey}`);

    // Get playlist IDs from mapping (direct ID mapping)
    const playlistIds = mappingConfig[mappingKey] || [];

    if (playlistIds.length === 0) {
      console.log(`[PlaylistMapper] No mapping found for key: ${mappingKey}`);
      return { success: true, playlistsAdded: 0, playlistNames: [] };
    }

    console.log(`[PlaylistMapper] Found ${playlistIds.length} playlist IDs for ${mappingKey}`);

    // Get playlist names for logging
    const playlists = await prisma.playlist.findMany({
      where: {
        id: { in: playlistIds },
        isPublic: true,
      },
      select: { id: true, name: true },
    });

    if (playlists.length === 0) {
      console.log('[PlaylistMapper] No active playlists found for IDs');
      return { success: true, playlistsAdded: 0, playlistNames: [] };
    }

    // Add track to each playlist
    let addedCount = 0;
    const addedNames: string[] = [];

    for (const playlist of playlists) {
      // Check if track is already in this playlist
      const existing = await prisma.playlistTrack.findUnique({
        where: {
          playlistId_trackId: {
            playlistId: playlist.id,
            trackId,
          },
        },
      });

      if (existing) {
        console.log(`[PlaylistMapper] Track already in playlist: ${playlist.name}`);
        continue;
      }

      // Get next position number
      const maxPosition = await getMaxPositionInPlaylist(playlist.id);

      // Add to playlist
      await prisma.playlistTrack.create({
        data: {
          playlistId: playlist.id,
          trackId,
          position: maxPosition + 1,
        },
      });

      addedCount++;
      addedNames.push(playlist.name);
      console.log(`[PlaylistMapper] Added track to playlist: ${playlist.name} (position: ${maxPosition + 1})`);
    }

    return {
      success: true,
      playlistsAdded: addedCount,
      playlistNames: addedNames,
    };
  } catch (error) {
    console.error('[PlaylistMapper] Error adding track to playlists:', error);
    return { success: false, playlistsAdded: 0, playlistNames: [] };
  }
}
