#!/usr/bin/env node

/**
 * VPS Schedule Checker
 *
 * 매분마다 cron으로 실행되어 VpsSchedule 테이블을 확인하고
 * 실행할 시간이 된 스케줄이 있으면 자동으로 음악 생성을 시작합니다.
 */

const { PrismaClient } = require('@prisma/client');
const https = require('https');

const prisma = new PrismaClient();

// 환경변수 체크
const REQUIRED_ENV = ['DATABASE_URL', 'CRON_SECRET'];
for (const key of REQUIRED_ENV) {
  if (!process.env[key]) {
    console.error(`[Schedule Checker] ERROR: ${key} environment variable is missing`);
    process.exit(1);
  }
}

const API_URL = process.env.API_URL || 'https://heeling.one-q.xyz';
const CRON_SECRET = process.env.CRON_SECRET;

/**
 * API 호출 (fetch 대신 https 모듈 사용 - Node.js 18 미만 호환)
 */
function callAPI(path, data) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, API_URL);
    const body = JSON.stringify(data);

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
        'X-Cron-Secret': CRON_SECRET,
      },
    };

    const req = https.request(url, options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          resolve({ status: res.statusCode, data: parsed });
        } catch (err) {
          resolve({ status: res.statusCode, data: responseData });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.write(body);
    req.end();
  });
}

/**
 * 실행할 스케줄 찾기 (현재 시간 이전이고 아직 생성되지 않은 것)
 */
async function findDueSchedules() {
  const now = new Date();

  const schedules = await prisma.vpsSchedule.findMany({
    where: {
      scheduledTime: {
        lte: now,
      },
      isGenerated: false,
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          userType: true,
        },
      },
      category: {
        select: {
          id: true,
          slug: true,
          name: true,
        },
      },
    },
    orderBy: {
      scheduledTime: 'asc',
    },
  });

  return schedules;
}

/**
 * 스케줄 실행 (음악 생성 API 호출)
 */
async function executeSchedule(schedule) {
  console.log(`[Schedule Checker] Executing schedule ${schedule.id} for category ${schedule.category.name}`);

  try {
    const response = await callAPI('/api/admin/generate/schedules/run', {
      scheduleId: schedule.categoryId,
      generateConfig: {
        style: schedule.category.slug,
        mood: 'calm',
        instrumental: true,
        model: 'V5',
      },
    });

    if (response.status === 200 || response.status === 201) {
      await prisma.vpsSchedule.update({
        where: { id: schedule.id },
        data: {
          isGenerated: true,
          lastGeneratedAt: new Date(),
        },
      });

      console.log(`[Schedule Checker] ✓ Schedule ${schedule.id} executed successfully`);
      console.log(`[Schedule Checker] Response:`, response.data);
    } else {
      console.error(`[Schedule Checker] ✗ Schedule ${schedule.id} failed with status ${response.status}`);
      console.error(`[Schedule Checker] Response:`, response.data);
    }
  } catch (error) {
    console.error(`[Schedule Checker] ✗ Error executing schedule ${schedule.id}:`, error.message);
  }
}

/**
 * 메인 실행 함수
 */
async function main() {
  const startTime = new Date();
  console.log(`[Schedule Checker] Starting check at ${startTime.toISOString()}`);

  try {
    const dueSchedules = await findDueSchedules();

    if (dueSchedules.length === 0) {
      console.log('[Schedule Checker] No schedules due for execution');
      return;
    }

    console.log(`[Schedule Checker] Found ${dueSchedules.length} schedule(s) to execute`);

    for (const schedule of dueSchedules) {
      await executeSchedule(schedule);
    }

    const endTime = new Date();
    const duration = endTime - startTime;
    console.log(`[Schedule Checker] Completed in ${duration}ms`);
  } catch (error) {
    console.error('[Schedule Checker] Fatal error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error('[Schedule Checker] Unhandled error:', error);
  process.exit(1);
});
