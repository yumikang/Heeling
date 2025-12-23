/**
 * Categories API
 * 카테고리 조회
 */

import { get } from './client';
import { CategoriesResponse, Category } from '@/types/api';

/**
 * 활성화된 카테고리 목록 조회
 *
 * @returns 카테고리 목록 (sortOrder 순)
 *
 * @example
 * ```ts
 * const categories = await getCategories();
 * categories.data.forEach(cat => {
 *   console.log(cat.name, cat.icon, cat.color);
 * });
 * ```
 */
export const getCategories = async (): Promise<CategoriesResponse> => {
  return get<CategoriesResponse>('/categories');
};

/**
 * 카테고리 목록을 배열로 반환 (편의 함수)
 *
 * @returns 카테고리 배열
 */
export const getCategoriesList = async (): Promise<Category[]> => {
  const response = await getCategories();
  return response.data;
};

export default {
  getCategories,
  getCategoriesList,
};
