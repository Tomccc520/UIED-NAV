/**
 * @file categoryService.ts
 * @description 前端用户界面组件
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

import api from './api';
import { unwrapApiList, unwrapApiResponse } from '../utils/apiResponse';

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  color: string;
  description?: string;
  parentId?: string;
  order: number;
  visible: boolean;
  children?: Category[];
  _count?: {
    websites: number;
  };
}

export const categoryService = {
  // 获取所有分类（树形结构）
  getAll: async (): Promise<Category[]> => {
    const response = await api.get('/categories');
    return unwrapApiList<Category>(response.data);
  },

  // 获取所有分类（扁平列表）
  getAllFlat: async (): Promise<Category[]> => {
    const response = await api.get('/categories', { params: { flat: 'true' } });
    return unwrapApiList<Category>(response.data);
  },

  // 获取单个分类
  getById: async (id: string): Promise<Category> => {
    const response = await api.get(`/categories/${id}`);
    return unwrapApiResponse<Category>(response.data, {} as Category);
  },

  // 通过 slug 获取分类
  getBySlug: async (slug: string): Promise<Category> => {
    const response = await api.get(`/categories/slug/${slug}`);
    return unwrapApiResponse<Category>(response.data, {} as Category);
  },

  // 获取主分类（没有父分类的）
  getMainCategories: async (): Promise<Category[]> => {
    const all = await categoryService.getAll();
    return all.filter(c => !c.parentId);
  },

  // 获取子分类
  getSubCategories: async (parentId: string): Promise<Category[]> => {
    const all = await categoryService.getAllFlat();
    return all.filter(c => c.parentId === parentId);
  },
};

export default categoryService;
