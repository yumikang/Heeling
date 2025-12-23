import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth-edge';

interface Schedule {
  id: string;
  name: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'once';
  intervalDays?: number; // daily일 때 간격 (1, 2, 3, 7)
  runTime?: string; // 실행 시간 (HH:MM)
  count: number; // 생성 횟수 (1 = 2곡)
  style?: string; // 음악 스타일
  mood?: string; // 음악 무드
  templateId: string;
  autoDeploy?: boolean; // 자동 배포 여부
  nextRun: string;
  lastRun?: string;
  isActive: boolean;
  createdAt: string;
}

// Calculate next run date based on frequency
function calculateNextRun(frequency: string, fromDate?: Date): string {
  const now = fromDate || new Date();
  const nextRun = new Date(now);

  switch (frequency) {
    case 'daily':
      nextRun.setDate(nextRun.getDate() + 1);
      nextRun.setHours(9, 0, 0, 0); // 9 AM
      break;
    case 'weekly':
      nextRun.setDate(nextRun.getDate() + 7);
      nextRun.setHours(9, 0, 0, 0);
      break;
    case 'monthly':
      nextRun.setMonth(nextRun.getMonth() + 1);
      nextRun.setHours(9, 0, 0, 0);
      break;
    case 'once':
      // One-time schedules should be set manually
      break;
  }

  return nextRun.toISOString();
}

// GET: Load all schedules
export async function GET(request: NextRequest) {
  const authResult = await verifyAuth(request);
  if (!authResult.success) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { key: 'ai_schedules' },
    });

    const schedules: Schedule[] = (setting?.value as unknown as Schedule[]) || [];

    return NextResponse.json({
      success: true,
      data: schedules,
    });
  } catch (error) {
    console.error('Load schedules error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to load schedules' },
      { status: 500 }
    );
  }
}

// POST: Create new schedule
export async function POST(request: NextRequest) {
  const authResult = await verifyAuth(request);
  if (!authResult.success) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, frequency, intervalDays, runTime, count, style, mood, templateId, autoDeploy, nextRun } = body;

    if (!name || !frequency || !count) {
      return NextResponse.json(
        { success: false, error: 'Name, frequency, and count are required' },
        { status: 400 }
      );
    }

    // Get existing schedules
    const setting = await prisma.systemSetting.findUnique({
      where: { key: 'ai_schedules' },
    });

    const schedules: Schedule[] = (setting?.value as unknown as Schedule[]) || [];

    // Create new schedule
    const newSchedule: Schedule = {
      id: `schedule_${Date.now()}`,
      name,
      frequency,
      intervalDays: intervalDays || 1,
      runTime: runTime || '09:00',
      count: parseInt(count, 10) || 1,
      style: style || 'piano',
      mood: mood || 'calm',
      templateId: templateId || '',
      autoDeploy: autoDeploy ?? false,
      nextRun: nextRun || calculateNextRun(frequency),
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    schedules.push(newSchedule);

    // Save schedules
    await prisma.systemSetting.upsert({
      where: { key: 'ai_schedules' },
      update: { value: schedules as any },
      create: { key: 'ai_schedules', value: schedules as any },
    });

    return NextResponse.json({
      success: true,
      data: newSchedule,
    });
  } catch (error) {
    console.error('Create schedule error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to create schedule' },
      { status: 500 }
    );
  }
}

// PUT: Update schedule (toggle active, update settings)
export async function PUT(request: NextRequest) {
  const authResult = await verifyAuth(request);
  if (!authResult.success) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, name, frequency, intervalDays, runTime, count, style, mood, templateId, autoDeploy, nextRun, isActive } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Schedule ID is required' },
        { status: 400 }
      );
    }

    // Get existing schedules
    const setting = await prisma.systemSetting.findUnique({
      where: { key: 'ai_schedules' },
    });

    const schedules: Schedule[] = (setting?.value as unknown as Schedule[]) || [];
    const scheduleIndex = schedules.findIndex(s => s.id === id);

    if (scheduleIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Schedule not found' },
        { status: 404 }
      );
    }

    // Update schedule
    schedules[scheduleIndex] = {
      ...schedules[scheduleIndex],
      ...(name !== undefined && { name }),
      ...(frequency !== undefined && { frequency }),
      ...(intervalDays !== undefined && { intervalDays }),
      ...(runTime !== undefined && { runTime }),
      ...(count !== undefined && { count: parseInt(count, 10) }),
      ...(style !== undefined && { style }),
      ...(mood !== undefined && { mood }),
      ...(templateId !== undefined && { templateId }),
      ...(autoDeploy !== undefined && { autoDeploy }),
      ...(nextRun !== undefined && { nextRun }),
      ...(isActive !== undefined && { isActive }),
    };

    // Save schedules
    await prisma.systemSetting.upsert({
      where: { key: 'ai_schedules' },
      update: { value: schedules as any },
      create: { key: 'ai_schedules', value: schedules as any },
    });

    return NextResponse.json({
      success: true,
      data: schedules[scheduleIndex],
    });
  } catch (error) {
    console.error('Update schedule error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to update schedule' },
      { status: 500 }
    );
  }
}

// DELETE: Delete schedule
export async function DELETE(request: NextRequest) {
  const authResult = await verifyAuth(request);
  if (!authResult.success) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Schedule ID is required' },
        { status: 400 }
      );
    }

    // Get existing schedules
    const setting = await prisma.systemSetting.findUnique({
      where: { key: 'ai_schedules' },
    });

    const schedules: Schedule[] = (setting?.value as unknown as Schedule[]) || [];
    const filteredSchedules = schedules.filter(s => s.id !== id);

    if (filteredSchedules.length === schedules.length) {
      return NextResponse.json(
        { success: false, error: 'Schedule not found' },
        { status: 404 }
      );
    }

    // Save schedules
    await prisma.systemSetting.upsert({
      where: { key: 'ai_schedules' },
      update: { value: filteredSchedules as any },
      create: { key: 'ai_schedules', value: filteredSchedules as any },
    });

    return NextResponse.json({
      success: true,
      message: 'Schedule deleted successfully',
    });
  } catch (error) {
    console.error('Delete schedule error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to delete schedule' },
      { status: 500 }
    );
  }
}
