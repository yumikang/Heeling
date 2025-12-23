import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth-edge';
import { readFile, writeFile, mkdir } from 'fs/promises';
import path from 'path';

// Cache file location
const CACHE_DIR = path.join(process.cwd(), '.cache', 'generation');
const SUNO_CACHE_FILE = path.join(CACHE_DIR, 'suno-tasks.json');
const GEMINI_CACHE_FILE = path.join(CACHE_DIR, 'gemini-titles.json');
const IMAGEN_CACHE_FILE = path.join(CACHE_DIR, 'imagen-images.json');
const API_USAGE_FILE = path.join(CACHE_DIR, 'api-usage.json');

interface SunoTaskCache {
  taskId: string;
  title: string;
  style: string;
  mood: string;
  status: string;
  tracks: Array<{
    id: string;
    audioUrl: string;
    imageUrl: string;
    duration: number;
  }>;
  createdAt: string;
  completedAt?: string;
}

interface GeminiTitleCache {
  keyword: string;
  style: string;
  mood: string;
  titles: Array<{
    ko: string;
    en: string;
  }>;
  createdAt: string;
}

interface ImagenCache {
  title: string;
  theme: string;
  prompt: string;
  imageUrl: string;
  createdAt: string;
}

interface APIUsageRecord {
  date: string;  // YYYY-MM-DD
  suno: { calls: number; success: number; failed: number; tracks: number };
  gemini: { calls: number; success: number; failed: number; titles: number };
  imagen: { calls: number; success: number; failed: number; images: number };
}

interface CacheData {
  suno: Record<string, SunoTaskCache>;
  gemini: Record<string, GeminiTitleCache>;
  imagen: Record<string, ImagenCache>;
}

// Ensure cache directory exists
async function ensureCacheDir() {
  await mkdir(CACHE_DIR, { recursive: true });
}

// Load cache from file
async function loadCache(type: 'suno' | 'gemini' | 'imagen'): Promise<Record<string, any>> {
  const files: Record<string, string> = {
    suno: SUNO_CACHE_FILE,
    gemini: GEMINI_CACHE_FILE,
    imagen: IMAGEN_CACHE_FILE,
  };
  try {
    const data = await readFile(files[type], 'utf8');
    return JSON.parse(data);
  } catch {
    return {};
  }
}

// Save cache to file
async function saveCache(type: 'suno' | 'gemini' | 'imagen', data: Record<string, any>) {
  await ensureCacheDir();
  const files: Record<string, string> = {
    suno: SUNO_CACHE_FILE,
    gemini: GEMINI_CACHE_FILE,
    imagen: IMAGEN_CACHE_FILE,
  };
  await writeFile(files[type], JSON.stringify(data, null, 2));
}

// Load API usage stats
async function loadApiUsage(): Promise<APIUsageRecord[]> {
  try {
    const data = await readFile(API_USAGE_FILE, 'utf8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

// Save API usage stats
async function saveApiUsage(data: APIUsageRecord[]) {
  await ensureCacheDir();
  await writeFile(API_USAGE_FILE, JSON.stringify(data, null, 2));
}

// Get today's date in YYYY-MM-DD format
function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

// Record API call
async function recordApiCall(
  apiType: 'suno' | 'gemini' | 'imagen',
  success: boolean,
  count: number = 1
) {
  const usage = await loadApiUsage();
  const today = getTodayDate();

  let todayRecord = usage.find(r => r.date === today);
  if (!todayRecord) {
    todayRecord = {
      date: today,
      suno: { calls: 0, success: 0, failed: 0, tracks: 0 },
      gemini: { calls: 0, success: 0, failed: 0, titles: 0 },
      imagen: { calls: 0, success: 0, failed: 0, images: 0 },
    };
    usage.push(todayRecord);
  }

  todayRecord[apiType].calls += 1;
  if (success) {
    todayRecord[apiType].success += 1;
    if (apiType === 'suno') todayRecord.suno.tracks += count;
    else if (apiType === 'gemini') todayRecord.gemini.titles += count;
    else if (apiType === 'imagen') todayRecord.imagen.images += count;
  } else {
    todayRecord[apiType].failed += 1;
  }

  // Keep last 30 days only
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const filtered = usage.filter(r => new Date(r.date) >= thirtyDaysAgo);

  await saveApiUsage(filtered);
}

// Generate cache key for Suno
function getSunoCacheKey(title: string, style: string, mood: string): string {
  return `${title}_${style}_${mood}`.toLowerCase().replace(/\s+/g, '_');
}

// Generate cache key for Gemini titles
function getGeminiCacheKey(keyword: string, style: string, mood: string): string {
  return `${keyword}_${style}_${mood}`.toLowerCase().replace(/\s+/g, '_');
}

// GET: Check cache / list cached items
export async function GET(request: NextRequest) {
  const authResult = await verifyAuth(request);
  if (!authResult.success) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') as 'suno' | 'gemini' | null;
    const action = searchParams.get('action');

    // Get API usage statistics
    if (action === 'usage') {
      const usage = await loadApiUsage();

      // Calculate totals
      const totals = {
        suno: { calls: 0, success: 0, failed: 0, tracks: 0 },
        gemini: { calls: 0, success: 0, failed: 0, titles: 0 },
        imagen: { calls: 0, success: 0, failed: 0, images: 0 },
      };

      usage.forEach(record => {
        totals.suno.calls += record.suno.calls;
        totals.suno.success += record.suno.success;
        totals.suno.failed += record.suno.failed;
        totals.suno.tracks += record.suno.tracks;
        totals.gemini.calls += record.gemini.calls;
        totals.gemini.success += record.gemini.success;
        totals.gemini.failed += record.gemini.failed;
        totals.gemini.titles += record.gemini.titles;
        totals.imagen.calls += record.imagen.calls;
        totals.imagen.success += record.imagen.success;
        totals.imagen.failed += record.imagen.failed;
        totals.imagen.images += record.imagen.images;
      });

      // Get today's record
      const today = getTodayDate();
      const todayRecord = usage.find(r => r.date === today) || {
        date: today,
        suno: { calls: 0, success: 0, failed: 0, tracks: 0 },
        gemini: { calls: 0, success: 0, failed: 0, titles: 0 },
        imagen: { calls: 0, success: 0, failed: 0, images: 0 },
      };

      return NextResponse.json({
        success: true,
        data: {
          today: todayRecord,
          totals,
          history: usage.slice(-7),  // Last 7 days
        },
      });
    }

    // List all cached items
    if (action === 'list') {
      const sunoCache = await loadCache('suno');
      const geminiCache = await loadCache('gemini');
      const imagenCache = await loadCache('imagen');

      return NextResponse.json({
        success: true,
        data: {
          suno: {
            count: Object.keys(sunoCache).length,
            items: Object.values(sunoCache).map((item: any) => ({
              key: getSunoCacheKey(item.title, item.style, item.mood),
              title: item.title,
              style: item.style,
              mood: item.mood,
              status: item.status,
              trackCount: item.tracks?.length || 0,
              createdAt: item.createdAt,
            })),
          },
          gemini: {
            count: Object.keys(geminiCache).length,
            items: Object.values(geminiCache).map((item: any) => ({
              key: getGeminiCacheKey(item.keyword, item.style, item.mood),
              keyword: item.keyword,
              style: item.style,
              mood: item.mood,
              titleCount: item.titles?.length || 0,
              createdAt: item.createdAt,
            })),
          },
          imagen: {
            count: Object.keys(imagenCache).length,
            items: Object.values(imagenCache).map((item: any) => ({
              title: item.title,
              theme: item.theme,
              imageUrl: item.imageUrl,
              createdAt: item.createdAt,
            })),
          },
        },
      });
    }

    // Check specific cache
    const title = searchParams.get('title');
    const keyword = searchParams.get('keyword');
    const style = searchParams.get('style') || '';
    const mood = searchParams.get('mood') || '';
    const taskId = searchParams.get('taskId');

    if (type === 'suno') {
      const cache = await loadCache('suno');

      // Check by taskId
      if (taskId) {
        const found = Object.values(cache).find((item: any) => item.taskId === taskId);
        if (found) {
          console.log('[Cache API] Found Suno cache by taskId:', taskId);
          return NextResponse.json({
            success: true,
            data: { found: true, cached: found },
          });
        }
        return NextResponse.json({
          success: true,
          data: { found: false },
        });
      }

      // Check by title/style/mood
      if (title) {
        const key = getSunoCacheKey(title, style, mood);
        const cached = cache[key];
        if (cached && cached.status === 'SUCCESS') {
          console.log('[Cache API] Found Suno cache:', key);
          return NextResponse.json({
            success: true,
            data: { found: true, cached },
          });
        }
      }
    }

    if (type === 'gemini' && keyword) {
      const cache = await loadCache('gemini');
      const key = getGeminiCacheKey(keyword, style, mood);
      const cached = cache[key];
      if (cached) {
        console.log('[Cache API] Found Gemini cache:', key);
        return NextResponse.json({
          success: true,
          data: { found: true, cached },
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: { found: false },
    });
  } catch (error) {
    console.error('[Cache API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Cache lookup failed' },
      { status: 500 }
    );
  }
}

// POST: Save to cache
export async function POST(request: NextRequest) {
  const authResult = await verifyAuth(request);
  if (!authResult.success) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { type, data } = body;

    if (type === 'suno') {
      const { taskId, title, style, mood, status, tracks } = data;
      const cache = await loadCache('suno');
      const key = getSunoCacheKey(title, style, mood);

      cache[key] = {
        taskId,
        title,
        style,
        mood,
        status,
        tracks: tracks || [],
        createdAt: cache[key]?.createdAt || new Date().toISOString(),
        completedAt: status === 'SUCCESS' ? new Date().toISOString() : undefined,
      };

      await saveCache('suno', cache);
      console.log('[Cache API] Saved Suno cache:', key);

      return NextResponse.json({
        success: true,
        data: { key, saved: true },
      });
    }

    if (type === 'gemini') {
      const { keyword, style, mood, titles } = data;
      const cache = await loadCache('gemini');
      const key = getGeminiCacheKey(keyword, style, mood);

      cache[key] = {
        keyword,
        style,
        mood,
        titles,
        createdAt: new Date().toISOString(),
      };

      await saveCache('gemini', cache);
      console.log('[Cache API] Saved Gemini cache:', key);

      return NextResponse.json({
        success: true,
        data: { key, saved: true },
      });
    }

    if (type === 'imagen') {
      const { title, theme, prompt, imageUrl, success: callSuccess } = data;

      // Record API usage
      await recordApiCall('imagen', callSuccess !== false, 1);

      // Save to cache if successful
      if (callSuccess !== false && imageUrl) {
        const cache = await loadCache('imagen');
        const key = `${title}_${theme}_${Date.now()}`.toLowerCase().replace(/\s+/g, '_');

        cache[key] = {
          title,
          theme,
          prompt,
          imageUrl,
          createdAt: new Date().toISOString(),
        };

        await saveCache('imagen', cache);
        console.log('[Cache API] Saved Imagen cache:', key);
      }

      return NextResponse.json({
        success: true,
        data: { recorded: true },
      });
    }

    // Record API usage without caching
    if (type === 'usage') {
      const { apiType, success: callSuccess, count } = data;
      if (['suno', 'gemini', 'imagen'].includes(apiType)) {
        await recordApiCall(apiType, callSuccess, count || 1);
        return NextResponse.json({
          success: true,
          data: { recorded: true },
        });
      }
    }

    return NextResponse.json(
      { success: false, error: 'Invalid cache type' },
      { status: 400 }
    );
  } catch (error) {
    console.error('[Cache API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Cache save failed' },
      { status: 500 }
    );
  }
}

// DELETE: Clear cache
export async function DELETE(request: NextRequest) {
  const authResult = await verifyAuth(request);
  if (!authResult.success) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') as 'suno' | 'gemini' | 'all' | null;
    const key = searchParams.get('key');

    if (type === 'all') {
      await saveCache('suno', {});
      await saveCache('gemini', {});
      await saveCache('imagen', {});
      console.log('[Cache API] Cleared all caches');
      return NextResponse.json({ success: true, data: { cleared: 'all' } });
    }

    if (type && key && ['suno', 'gemini', 'imagen'].includes(type)) {
      const cache = await loadCache(type as 'suno' | 'gemini' | 'imagen');
      delete cache[key];
      await saveCache(type as 'suno' | 'gemini' | 'imagen', cache);
      console.log('[Cache API] Deleted cache:', type, key);
      return NextResponse.json({ success: true, data: { cleared: key } });
    }

    if (type && ['suno', 'gemini', 'imagen'].includes(type)) {
      await saveCache(type as 'suno' | 'gemini' | 'imagen', {});
      console.log('[Cache API] Cleared', type, 'cache');
      return NextResponse.json({ success: true, data: { cleared: type } });
    }

    return NextResponse.json(
      { success: false, error: 'Type is required' },
      { status: 400 }
    );
  } catch (error) {
    console.error('[Cache API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Cache clear failed' },
      { status: 500 }
    );
  }
}
