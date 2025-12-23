import { Template } from './types';

// 기본 템플릿
export const DEFAULT_TEMPLATES: Template[] = [
  {
    id: 'default-title',
    name: '기본 제목 템플릿',
    type: 'title',
    content: '힐링 음악 제목을 생성해주세요. 키워드: {keywords}, 분위기: {mood}',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'default-lyrics',
    name: '기본 가사 템플릿',
    type: 'lyrics',
    content: '평화롭고 편안한 힐링 가사를 작성해주세요. 주제: {keywords}',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'default-suno',
    name: '기본 Suno 프롬프트',
    type: 'suno',
    content: 'Ambient, Relaxing, {style}, Peaceful, Healing, {mood}',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'default-image',
    name: '기본 이미지 프롬프트',
    type: 'image',
    content: 'Serene {category} landscape, {mood} atmosphere, soft pastel colors, album artwork style',
    createdAt: new Date().toISOString(),
  },
];

// 스타일 옵션
export const STYLES = [
  { value: 'piano', label: '피아노' },
  { value: 'nature', label: '자연' },
  { value: 'meditation', label: '명상' },
  { value: 'sleep', label: '수면' },
  { value: 'focus', label: '집중' },
  { value: 'cafe', label: '카페' },
  { value: 'classical', label: '클래식' },
  { value: 'lofi', label: '로파이' },
  { value: 'cinema', label: '시네마' },
];

// 분위기 옵션
export const MOODS = [
  { value: 'calm', label: '평온' },
  { value: 'dreamy', label: '몽환' },
  { value: 'focused', label: '집중' },
  { value: 'emotional', label: '서정' },
  { value: 'hopeful', label: '희망' },
];

// 곡 수 옵션
export const TRACK_COUNTS = [
  { value: 2, label: '1곡 (2트랙)', batches: 1 },
  { value: 10, label: '10곡', batches: 5 },
  { value: 20, label: '20곡', batches: 10 },
  { value: 30, label: '30곡', batches: 15 },
];
