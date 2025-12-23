import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const format = searchParams.get('format') || 'json';
  // const clientVersion = parseInt(searchParams.get('version') || '0', 10);

  // In a real scenario, we would check a global version or last updated timestamp.
  // For now, we always return all active tracks.

  try {
    const tracks = await prisma.track.findMany({
      where: { isActive: true },
      select: {
        id: true,
        title: true,
        fileUrl: true,
        thumbnailUrl: true,
        composer: true,
        updatedAt: true,
      }
    });

    // Map DB fields to API response format
    const formattedTracks = tracks.map(t => ({
      id: t.id,
      title: t.title,
      artist: t.composer || 'Unknown',
      url: t.fileUrl,
      artwork: t.thumbnailUrl || '',
      version: t.updatedAt.getTime(), // Use timestamp as version
    }));

    const currentVersion = Date.now(); // Simple versioning for now

    if (format === 'xml') {
      const xml = `
      <response>
        <status>update_available</status>
        <version>${currentVersion}</version>
        <tracks>
          ${formattedTracks.map(t => `
            <track id="${t.id}" version="${t.version}">
              <title>${t.title}</title>
              <artist>${t.artist}</artist>
              <url>${t.url}</url>
              <artwork>${t.artwork}</artwork>
            </track>
          `).join('')}
        </tracks>
      </response>
    `;
      return new NextResponse(xml, {
        headers: { 'Content-Type': 'application/xml' },
      });
    } else {
      return NextResponse.json({
        status: 'update_available',
        version: currentVersion,
        tracks: formattedTracks
      });
    }
  } catch (error) {
    console.error('Sync API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
