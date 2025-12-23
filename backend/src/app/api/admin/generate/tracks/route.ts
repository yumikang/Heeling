import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth-edge';

interface GeneratedTrack {
  id: string;
  title: string;
  titleEn?: string;
  audioUrl: string;
  duration: number;
  imageUrl?: string;
  style?: string;
  mood?: string;
  generatedAt?: string;
  batchId?: string;
  deployed?: boolean;
  deployedAt?: string;
  dbTrackId?: string;
}

// GET: Get all generated tracks
export async function GET(request: NextRequest) {
  const authResult = await verifyAuth(request);
  if (!authResult.success) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { key: 'generated_tracks' },
    });

    const tracks: GeneratedTrack[] = (setting?.value as unknown as GeneratedTrack[]) || [];

    return NextResponse.json({
      success: true,
      data: tracks,
    });
  } catch (error) {
    console.error('Load tracks error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to load tracks' },
      { status: 500 }
    );
  }
}

// POST: Save generated tracks
export async function POST(request: NextRequest) {
  const authResult = await verifyAuth(request);
  if (!authResult.success) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { tracks } = body;

    if (!tracks || !Array.isArray(tracks)) {
      return NextResponse.json(
        { success: false, error: 'Tracks array is required' },
        { status: 400 }
      );
    }

    // Get existing tracks
    const setting = await prisma.systemSetting.findUnique({
      where: { key: 'generated_tracks' },
    });

    const existingTracks: GeneratedTrack[] = (setting?.value as unknown as GeneratedTrack[]) || [];

    // Add new tracks (prepend to show newest first)
    const updatedTracks = [...tracks, ...existingTracks];

    // Save tracks
    await prisma.systemSetting.upsert({
      where: { key: 'generated_tracks' },
      update: { value: updatedTracks as any },
      create: { key: 'generated_tracks', value: updatedTracks as any },
    });

    return NextResponse.json({
      success: true,
      data: { count: tracks.length },
    });
  } catch (error) {
    console.error('Save tracks error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to save tracks' },
      { status: 500 }
    );
  }
}

// PATCH: Update a track (title, imageUrl) or bulk update deployed status
export async function PATCH(request: NextRequest) {
  const authResult = await verifyAuth(request);
  if (!authResult.success) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, title, titleEn, imageUrl, deployed, deployedAt, dbTrackId, bulkUpdate } = body;

    // Get existing tracks
    const setting = await prisma.systemSetting.findUnique({
      where: { key: 'generated_tracks' },
    });

    const existingTracks: GeneratedTrack[] = (setting?.value as unknown as GeneratedTrack[]) || [];

    // Bulk update (for deployed status after deployment)
    if (bulkUpdate && Array.isArray(bulkUpdate)) {
      const updateMap = new Map<string, { deployed?: boolean; deployedAt?: string; dbTrackId?: string }>();
      bulkUpdate.forEach((item: { id: string; deployed?: boolean; deployedAt?: string; dbTrackId?: string }) => {
        updateMap.set(item.id, item);
      });

      existingTracks.forEach((track, index) => {
        const update = updateMap.get(track.id);
        if (update) {
          if (update.deployed !== undefined) existingTracks[index].deployed = update.deployed;
          if (update.deployedAt !== undefined) existingTracks[index].deployedAt = update.deployedAt;
          if (update.dbTrackId !== undefined) existingTracks[index].dbTrackId = update.dbTrackId;
        }
      });

      // Save tracks
      await prisma.systemSetting.upsert({
        where: { key: 'generated_tracks' },
        update: { value: existingTracks as any },
        create: { key: 'generated_tracks', value: existingTracks as any },
      });

      return NextResponse.json({
        success: true,
        data: { updated: bulkUpdate.length },
      });
    }

    // Single track update
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Track ID is required' },
        { status: 400 }
      );
    }

    // Find and update the track
    const trackIndex = existingTracks.findIndex(t => t.id === id);
    if (trackIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Track not found' },
        { status: 404 }
      );
    }

    // Update only provided fields
    if (title !== undefined) existingTracks[trackIndex].title = title;
    if (titleEn !== undefined) existingTracks[trackIndex].titleEn = titleEn;
    if (imageUrl !== undefined) existingTracks[trackIndex].imageUrl = imageUrl;
    if (deployed !== undefined) existingTracks[trackIndex].deployed = deployed;
    if (deployedAt !== undefined) existingTracks[trackIndex].deployedAt = deployedAt;
    if (dbTrackId !== undefined) existingTracks[trackIndex].dbTrackId = dbTrackId;

    // Save tracks
    await prisma.systemSetting.upsert({
      where: { key: 'generated_tracks' },
      update: { value: existingTracks as any },
      create: { key: 'generated_tracks', value: existingTracks as any },
    });

    return NextResponse.json({
      success: true,
      data: existingTracks[trackIndex],
    });
  } catch (error) {
    console.error('Update track error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to update track' },
      { status: 500 }
    );
  }
}

// DELETE: Delete tracks by IDs
export async function DELETE(request: NextRequest) {
  const authResult = await verifyAuth(request);
  if (!authResult.success) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { ids } = body;

    if (!ids || !Array.isArray(ids)) {
      return NextResponse.json(
        { success: false, error: 'IDs array is required' },
        { status: 400 }
      );
    }

    // Get existing tracks
    const setting = await prisma.systemSetting.findUnique({
      where: { key: 'generated_tracks' },
    });

    const existingTracks: GeneratedTrack[] = (setting?.value as unknown as GeneratedTrack[]) || [];

    // Filter out deleted tracks
    const idsSet = new Set(ids);
    const updatedTracks = existingTracks.filter(t => !idsSet.has(t.id));

    // Save tracks
    await prisma.systemSetting.upsert({
      where: { key: 'generated_tracks' },
      update: { value: updatedTracks as any },
      create: { key: 'generated_tracks', value: updatedTracks as any },
    });

    return NextResponse.json({
      success: true,
      data: { deleted: ids.length },
    });
  } catch (error) {
    console.error('Delete tracks error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to delete tracks' },
      { status: 500 }
    );
  }
}
