/**
 * @file useSettings.ts
 * @description 前端用户界面组件
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

import { useState, useEffect } from 'react';
import {
  settingService,
  NavMenuItem,
  FooterGroup,
  FriendLink
} from '../services/settingService';
import { debugLog } from '../utils/debugHelper';

// 导航菜单 Hook
export const useNavMenus = () => {
  const [menus, setMenus] = useState<NavMenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchMenus = async () => {
      try {
        setLoading(true);
        const data = await settingService.getNavMenus();
        // 只返回可见的菜单
        const visibleMenus = data.filter(menu => menu.visible);
        setMenus(visibleMenus);
        setError(null);
      } catch (err) {
        setError(err as Error);
        debugLog.error('Failed to fetch nav menus:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMenus();
  }, []);

  return { menus, loading, error };
};

// 页脚分组 Hook
export const useFooterGroups = () => {
  const [groups, setGroups] = useState<FooterGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        setLoading(true);
        const data = await settingService.getFooterGroups();
        // 只返回可见的分组和链接
        const visibleGroups = data
          .filter(group => group.visible)
          .map(group => ({
            ...group,
            links: group.links.filter(link => link.visible)
          }));
        setGroups(visibleGroups);
        setError(null);
      } catch (err) {
        setError(err as Error);
        debugLog.error('Failed to fetch footer groups:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchGroups();
  }, []);

  return { groups, loading, error };
};

// 友情链接 Hook
export const useFriendLinks = () => {
  const [links, setLinks] = useState<FriendLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchLinks = async () => {
      try {
        setLoading(true);
        const data = await settingService.getFriendLinks();
        setLinks(data);
        setError(null);
      } catch (err) {
        setError(err as Error);
        debugLog.error('Failed to fetch friend links:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLinks();
  }, []);

  return { links, loading, error };
};
