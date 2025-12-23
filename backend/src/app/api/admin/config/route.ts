import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Default premium pricing config
const DEFAULT_PREMIUM_CONFIG = {
  'premium.yearly.price': '59900',
  'premium.yearly.label': '연간 구독',
  'premium.yearly.description': '월 ₩4,992 (50% 할인)',
  'premium.monthly.price': '9900',
  'premium.monthly.label': '월간 구독',
  'premium.monthly.description': '언제든 해지 가능',
  'premium.trial.days': '7',
  'premium.trial.enabled': 'true',
};

// GET: Fetch all configs or by category
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    const configs = await prisma.appConfig.findMany({
      where: category ? { category } : undefined,
      orderBy: { key: 'asc' },
    });

    // If premium category requested and no configs exist, return defaults
    if (category === 'premium' && configs.length === 0) {
      const defaultConfigs = Object.entries(DEFAULT_PREMIUM_CONFIG).map(([key, value]) => ({
        key,
        value,
        category: 'premium',
        updatedAt: new Date(),
      }));
      return NextResponse.json({ success: true, data: defaultConfigs });
    }

    // Convert to object format for easier consumption
    const configObject = configs.reduce((acc, config) => {
      acc[config.key] = config.value;
      return acc;
    }, {} as Record<string, string>);

    return NextResponse.json({ success: true, data: configs, config: configObject });
  } catch (error) {
    console.error('Error fetching configs:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch configs' }, { status: 500 });
  }
}

// PUT: Update configs (bulk update)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { configs } = body as { configs: { key: string; value: string; category?: string }[] };

    if (!configs || !Array.isArray(configs)) {
      return NextResponse.json({ success: false, error: 'Invalid configs format' }, { status: 400 });
    }

    // Upsert all configs
    const results = await Promise.all(
      configs.map((config) =>
        prisma.appConfig.upsert({
          where: { key: config.key },
          update: { value: config.value },
          create: {
            key: config.key,
            value: config.value,
            category: config.category || 'general',
          },
        })
      )
    );

    return NextResponse.json({ success: true, data: results });
  } catch (error) {
    console.error('Error updating configs:', error);
    return NextResponse.json({ success: false, error: 'Failed to update configs' }, { status: 500 });
  }
}
