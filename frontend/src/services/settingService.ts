/**
 * @file settingService.ts
 * @description 前端用户界面组件
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

import api from './api';
import { unwrapApiList } from '../utils/apiResponse';

// 导航菜单类型
export interface NavMenuItem {
  id: string;
  text: string;
  link: string | null;
  external: boolean;
  label: string | null;
  labelType: string | null;
  icon: string | null;
  parentId: string | null;
  order: number;
  visible: boolean;
  children?: NavMenuItem[];
}

// 页脚链接类型
export interface FooterLink {
  id: string;
  text: string;
  url: string;
  external: boolean;
  order: number;
  visible: boolean;
}

// 页脚分组类型
export interface FooterGroup {
  id: string;
  title: string;
  order: number;
  visible: boolean;
  links: FooterLink[];
}

// 友情链接类型
export interface FriendLink {
  id: string;
  name: string;
  url: string;
  order: number;
  visible: boolean;
}

export const settingService = {
  // 获取导航菜单（树形结构）
  getNavMenus: async (): Promise<NavMenuItem[]> => {
    const response = await api.get('/settings/nav-menus');
    return unwrapApiList<NavMenuItem>(response.data);
  },

  // 获取页脚分组（含链接）
  getFooterGroups: async (): Promise<FooterGroup[]> => {
    const response = await api.get('/settings/footer-groups');
    return unwrapApiList<FooterGroup>(response.data);
  },

  // 获取友情链接
  getFriendLinks: async (): Promise<FriendLink[]> => {
    const response = await api.get('/settings/friend-links');
    return unwrapApiList<FriendLink>(response.data);
  },
};

export default settingService;
