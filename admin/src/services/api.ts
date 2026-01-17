/**
 * @file api.ts
 * @description 管理后台组件
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

import axios from 'axios';

const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器 - 添加 token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器 - 处理 401 错误
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // 获取请求的URL
      const requestUrl = error.config?.url || '';
      
      // 如果是登录接口的401错误，不跳转（让登录页面自己处理错误提示）
      if (requestUrl.includes('/auth/login')) {
        return Promise.reject(error);
      }
      
      // 如果当前已经在登录页面，不跳转（避免闪烁）
      if (window.location.pathname === '/login') {
        return Promise.reject(error);
      }
      
      // 其他情况：token 过期或无效，跳转到登录页
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

// 认证 API
export const authApi = {
  login: (data: { username: string; password: string }) =>
    api.post('/auth/login', data),
  verify: () => api.get('/auth/verify'),
  logout: () => api.post('/auth/logout'),
  changePassword: (data: { oldPassword: string; newPassword: string }) =>
    api.put('/auth/password', data),
};

// 分类 API
export const categoryApi = {
  getAll: () => api.get('/categories?flat=true'), // 获取扁平列表用于管理
  getTree: () => api.get('/categories'), // 获取树形结构
  getTreePaginated: (params: { page?: number; pageSize?: number }) => 
    api.get<PaginatedResponse<any>>('/categories', { params }),
  getById: (id: string) => api.get(`/categories/${id}`),
  create: (data: any) => api.post('/categories', data),
  update: (id: string, data: any) => api.put(`/categories/${id}`, data),
  delete: (id: string) => api.delete(`/categories/${id}`),
};

// 分页响应类型
export interface PaginationInfo {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasMore: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationInfo;
}

// 网站 API
export const websiteApi = {
  getAll: (params?: any) => api.get('/websites', { params }),
  getPaginated: (params: { page?: number; pageSize?: number; category?: string; search?: string }) => 
    api.get<PaginatedResponse<any>>('/websites', { params }),
  getById: (id: string) => api.get(`/websites/${id}`),
  create: (data: any) => api.post('/websites', data),
  update: (id: string, data: any) => api.put(`/websites/${id}`, data),
  delete: (id: string) => api.delete(`/websites/${id}`),
};

// 导航菜单 API
export const navMenuApi = {
  getAll: () => api.get('/admin/settings/nav-menus'),
  getFlat: () => api.get('/admin/settings/nav-menus/flat'),
  create: (data: any) => api.post('/admin/settings/nav-menus', data),
  update: (id: string, data: any) => api.put(`/admin/settings/nav-menus/${id}`, data),
  delete: (id: string) => api.delete(`/admin/settings/nav-menus/${id}`),
};

// 页脚 API
export const footerApi = {
  getGroups: () => api.get('/admin/settings/footer-groups'),
  createGroup: (data: any) => api.post('/admin/settings/footer-groups', data),
  updateGroup: (id: string, data: any) =>
    api.put(`/admin/settings/footer-groups/${id}`, data),
  deleteGroup: (id: string) => api.delete(`/admin/settings/footer-groups/${id}`),
  createLink: (data: any) => api.post('/admin/settings/footer-links', data),
  updateLink: (id: string, data: any) =>
    api.put(`/admin/settings/footer-links/${id}`, data),
  deleteLink: (id: string) => api.delete(`/admin/settings/footer-links/${id}`),
};

// 友情链接 API
export const friendLinkApi = {
  getAll: () => api.get('/admin/settings/friend-links/all'),
  create: (data: any) => api.post('/admin/settings/friend-links', data),
  update: (id: string, data: any) =>
    api.put(`/admin/settings/friend-links/${id}`, data),
  delete: (id: string) => api.delete(`/admin/settings/friend-links/${id}`),
};

// Favicon API 配置
export const faviconApiService = {
  getAll: () => api.get('/favicon-api'),
  getEnabled: () => api.get('/favicon-api/enabled'),
  create: (data: any) => api.post('/favicon-api', data),
  update: (id: string, data: any) => api.put(`/favicon-api/${id}`, data),
  delete: (id: string) => api.delete(`/favicon-api/${id}`),
  fetchFavicon: (url: string) => api.get('/favicon-api/fetch', { params: { url } }),
};
