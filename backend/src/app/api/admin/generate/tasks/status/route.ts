import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth-edge';

// GET: Get all GenerationTask statuses
export async function GET(request: NextRequest) {
  const authResult = await verifyAuth(request);
  if (!authResult.success) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    // Build where clause
    const where: any = {};
    if (status) {
      where.status = status;
    }

    // Get tasks
    const tasks = await prisma.generationTask.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    // Get counts by status
    const statusCounts = await prisma.generationTask.groupBy({
      by: ['status'],
      _count: true,
    });

    const counts = statusCounts.reduce((acc, item) => {
      acc[item.status] = item._count;
      return acc;
    }, {} as Record<string, number>);

    // Calculate summary statistics
    const total = await prisma.generationTask.count();
    const failed = counts.FAILED || 0;
    const deployed = counts.DEPLOYED || 0;
    const pending = (counts.PENDING || 0) + (counts.GENERATING || 0) + (counts.GENERATED || 0) +
                    (counts.DOWNLOADING || 0) + (counts.DEPLOYING || 0);

    return NextResponse.json({
      success: true,
      data: {
        tasks,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total,
        },
        summary: {
          total,
          deployed,
          pending,
          failed,
          successRate: total > 0 ? ((deployed / total) * 100).toFixed(2) : '0.00',
        },
        counts,
      },
    });
  } catch (error) {
    console.error('Get task status error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to get task status' },
      { status: 500 }
    );
  }
}

// DELETE: Clean up old failed tasks
export async function DELETE(request: NextRequest) {
  const authResult = await verifyAuth(request);
  if (!authResult.success) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const daysOld = parseInt(searchParams.get('days') || '30', 10);

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await prisma.generationTask.deleteMany({
      where: {
        status: 'FAILED',
        failedAt: {
          lt: cutoffDate,
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        deleted: result.count,
        message: `Deleted ${result.count} failed task(s) older than ${daysOld} days`,
      },
    });
  } catch (error) {
    console.error('Delete failed tasks error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to delete tasks' },
      { status: 500 }
    );
  }
}

// PATCH: Retry a failed task
export async function PATCH(request: NextRequest) {
  const authResult = await verifyAuth(request);
  if (!authResult.success) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, action } = body;

    if (!id || !action) {
      return NextResponse.json(
        { success: false, error: 'Task ID and action are required' },
        { status: 400 }
      );
    }

    const task = await prisma.generationTask.findUnique({
      where: { id },
    });

    if (!task) {
      return NextResponse.json(
        { success: false, error: 'Task not found' },
        { status: 404 }
      );
    }

    if (action === 'retry') {
      // Reset task to PENDING for retry
      if (task.status !== 'FAILED') {
        return NextResponse.json(
          { success: false, error: 'Only failed tasks can be retried' },
          { status: 400 }
        );
      }

      const updatedTask = await prisma.generationTask.update({
        where: { id },
        data: {
          status: 'PENDING',
          retryCount: 0, // Reset retry count
          error: null,
          failedAt: null,
          lastCheckedAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        data: updatedTask,
        message: 'Task reset for retry',
      });
    }

    if (action === 'cancel') {
      // Mark task as FAILED with cancellation message
      if (task.status === 'DEPLOYED') {
        return NextResponse.json(
          { success: false, error: 'Cannot cancel deployed tasks' },
          { status: 400 }
        );
      }

      const updatedTask = await prisma.generationTask.update({
        where: { id },
        data: {
          status: 'FAILED',
          failedAt: new Date(),
          error: 'Manually cancelled by admin',
        },
      });

      return NextResponse.json({
        success: true,
        data: updatedTask,
        message: 'Task cancelled',
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action. Use "retry" or "cancel"' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Update task error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to update task' },
      { status: 500 }
    );
  }
}
