import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Default premium pricing config
const DEFAULT_PREMIUM_CONFIG = {
  yearly: {
    price: 59900,
    label: '연간 구독',
    description: '월 ₩4,992 (50% 할인)',
  },
  monthly: {
    price: 9900,
    label: '월간 구독',
    description: '언제든 해지 가능',
  },
  trial: {
    days: 7,
    enabled: true,
  },
  features: [
    { icon: 'musical-note', text: '모든 트랙 무제한 재생' },
    { icon: 'cloud-download', text: '오프라인 다운로드' },
    { icon: 'volume-high', text: '고품질 오디오' },
    { icon: 'moon', text: '고급 수면 기능' },
    { icon: 'ban', text: '광고 없는 경험' },
  ],
};

// GET: Public API for mobile app to fetch premium pricing
export async function GET() {
  try {
    const configs = await prisma.appConfig.findMany({
      where: { category: 'premium' },
    });

    // Build response from database or use defaults
    if (configs.length === 0) {
      return NextResponse.json({
        success: true,
        data: DEFAULT_PREMIUM_CONFIG,
      });
    }

    // Convert flat configs to structured object
    const configMap = configs.reduce((acc, config) => {
      acc[config.key] = config.value;
      return acc;
    }, {} as Record<string, string>);

    const response = {
      yearly: {
        price: parseInt(configMap['premium.yearly.price'] || '59900'),
        label: configMap['premium.yearly.label'] || '연간 구독',
        description: configMap['premium.yearly.description'] || '월 ₩4,992 (50% 할인)',
      },
      monthly: {
        price: parseInt(configMap['premium.monthly.price'] || '9900'),
        label: configMap['premium.monthly.label'] || '월간 구독',
        description: configMap['premium.monthly.description'] || '언제든 해지 가능',
      },
      trial: {
        days: parseInt(configMap['premium.trial.days'] || '7'),
        enabled: configMap['premium.trial.enabled'] !== 'false',
      },
      features: DEFAULT_PREMIUM_CONFIG.features, // Features are hardcoded for now
    };

    return NextResponse.json({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error('Error fetching premium config:', error);
    // Return defaults on error
    return NextResponse.json({
      success: true,
      data: DEFAULT_PREMIUM_CONFIG,
    });
  }
}
