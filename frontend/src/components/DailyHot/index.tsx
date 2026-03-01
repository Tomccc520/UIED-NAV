/**
 * @file index.tsx
 * @description 每日热榜组件 - 展示多平台热榜聚合数据
 * @copyright Tomda (https://www.tomda.top)
 * @copyright UIED技术团队 (https://fsuied.com)
 * @author UIED技术团队
 * @createDate 2026.02.21
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { getDailyHot, getDailyHotPlatforms } from '../../services/dailyHotService';
import { DailyHotItem, DailyHotPlatform } from '../../types/dailyHot';
import { RankingListSkeleton } from '../Skeleton';
import './index.css';

interface DailyHotProps {
  title?: string;
  limit?: number;
  className?: string;
}

const DailyHot: React.FC<DailyHotProps> = ({
  title = '全网热榜',
  limit = 20,
  className = ''
}) => {
  const [platforms, setPlatforms] = useState<DailyHotPlatform[]>([]);
  const [activePlatform, setActivePlatform] = useState<string>('');
  const [items, setItems] = useState<DailyHotItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [platformLoading, setPlatformLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const refreshRef = useRef(false);

  // 获取平台列表
  useEffect(() => {
    const fetchPlatforms = async () => {
      try {
        setPlatformLoading(true);
        const data = await getDailyHotPlatforms();
        // 过滤掉未启用的平台
        const activePlatforms = data
          .filter(p => p.isEnabled !== false)
          .sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0));
        if (activePlatforms.length > 0) {
          setPlatforms(activePlatforms);
          // 默认选中第一个平台
          setActivePlatform(activePlatforms[0].platformTitle);
        } else {
          throw new Error('平台列表为空');
        }
      } catch (err) {
        console.error('获取热榜平台失败:', err);
        // 如果失败，设置默认平台
        const defaultPlatforms = [
          { platformTitle: '哔哩哔哩', displayName: 'B站' },
          { platformTitle: '知乎', displayName: '知乎' },
          { platformTitle: '微博', displayName: '微博' },
          { platformTitle: '今日头条', displayName: '头条' }
        ];
        setPlatforms(defaultPlatforms);
        setActivePlatform(defaultPlatforms[0].platformTitle);
      } finally {
        setPlatformLoading(false);
      }
    };

    fetchPlatforms();
  }, []);

  /**
   * 若平台列表为空或 activePlatform 未设置，避免页面一直处于 loading
   */
  useEffect(() => {
    if (!platformLoading && !activePlatform) {
      setLoading(false);
      setError('暂无可用热榜平台，请稍后重试');
    }
  }, [platformLoading, activePlatform]);

  // 获取选中平台的热榜数据
  useEffect(() => {
    if (!activePlatform) return;

    const fetchHotList = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const refresh = refreshRef.current ? 1 : undefined;
        const response = await getDailyHot({ 
          title: activePlatform,
          limit,
          refresh
        });
        
        /**
         * 响应是 Record<string, DailyHotItem[]>，兼容平台标题 / 显示名称两种键名
         */
        const activeMeta = platforms.find((platform) => platform.platformTitle === activePlatform);
        const list = response[activePlatform]
          || (activeMeta?.displayName ? response[activeMeta.displayName] : undefined)
          || [];
        setItems(list);
        setLastUpdated(new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }));
      } catch (err) {
        console.error(`获取${activePlatform}热榜失败:`, err);
        setError('获取数据失败，请稍后重试');
        setItems([]);
      } finally {
        setLoading(false);
        refreshRef.current = false;
        setRefreshing(false);
      }
    };

    fetchHotList();
  }, [activePlatform, limit, refreshKey, platforms]);

  const handlePlatformChange = (platformTitle: string) => {
    if (platformTitle === activePlatform) return;
    setActivePlatform(platformTitle);
  };

  const handleRefresh = () => {
    refreshRef.current = true;
    setRefreshing(true);
    setRefreshKey((prev) => prev + 1);
  };

  const activePlatformMeta = useMemo(
    () => platforms.find(platform => platform.platformTitle === activePlatform),
    [platforms, activePlatform]
  );

  if (platformLoading && platforms.length === 0) {
    return (
      <div className={`daily-hot-container ${className}`}>
        <div className="daily-hot-header">
          <h2 className="daily-hot-title">🔥 {title}</h2>
        </div>
        <RankingListSkeleton count={5} />
      </div>
    );
  }

  return (
    <div className={`daily-hot-container ${className}`}>
      <div className="daily-hot-header">
        <div className="daily-hot-title-area">
          <h2 className="daily-hot-title">
            <span className="fire-icon">🔥</span>
            {title}
          </h2>
          <span className="daily-hot-subtitle">
            聚合全平台热点，实时更新
          </span>
        </div>

        <div className="daily-hot-actions">
          <span className="daily-hot-status">
            {loading ? '加载中' : `共 ${items.length} 条`}
            {lastUpdated && !loading ? ` · ${lastUpdated}` : ''}
          </span>
          {activePlatformMeta?.url && (
            <a
              className="daily-hot-platform-link"
              href={activePlatformMeta.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              访问平台
            </a>
          )}
          <button
            type="button"
            className={`daily-hot-refresh ${refreshing ? 'is-refreshing' : ''}`}
            onClick={handleRefresh}
            disabled={loading}
          >
            刷新
          </button>
        </div>
      </div>

      <div className="daily-hot-tabs">
        {platforms.map(platform => (
          <button
            key={platform.platformTitle}
            type="button"
            className={`daily-hot-tab ${activePlatform === platform.platformTitle ? 'active' : ''}`}
            onClick={() => handlePlatformChange(platform.platformTitle)}
          >
            {platform.icon && (
              <img
                src={platform.icon}
                alt={platform.displayName || platform.platformTitle}
                className="daily-hot-tab-icon"
                loading="lazy"
              />
            )}
            {platform.displayName || platform.platformTitle}
          </button>
        ))}
      </div>

      <div className="daily-hot-content-area">
        {loading ? (
          <RankingListSkeleton count={10} />
        ) : error ? (
          <div className="daily-hot-error">
            <div className="daily-hot-error-icon">⚠️</div>
            <div className="daily-hot-error-message">{error}</div>
            <button 
              className="daily-hot-retry-button" 
              onClick={() => {
                const current = activePlatform;
                setActivePlatform('');
                setTimeout(() => setActivePlatform(current), 10);
              }}
            >
              重新加载
            </button>
          </div>
        ) : items.length === 0 ? (
          <div className="daily-hot-empty">暂无数据</div>
        ) : (
          <div className="daily-hot-list">
            {items.map((item, index) => (
              <a 
                key={`${item.url}-${index}`} 
                href={item.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="daily-hot-item"
              >
                <div className={`daily-hot-rank rank-${index < 3 ? index + 1 : 'other'}`}>
                  {index + 1}
                </div>
                
                <div className="daily-hot-item-content">
                  <div className="daily-hot-item-title" title={item.title}>
                    {item.title}
                  </div>
                  
                  <div className="daily-hot-meta">
                    {item.hotValue && (
                      <span className="daily-hot-fire">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M17.66 11.2C17.43 10.9 17.15 10.64 16.89 10.38C16.22 9.78 15.46 9.35 14.82 8.72C13.33 7.26 13 4.85 13.95 3C13.05 3.22 12.17 3.62 11.5 4.19C9.81 5.61 9.3 8.1 10.4 10C10.71 10.53 11.1 11.03 11.46 11.55C11.85 12.11 12.3 12.68 12.44 13.35C12.75 14.86 11.96 16.36 10.53 16.89C9.43 17.29 8.21 16.86 7.6 15.85C7.36 15.45 7.24 15 7.21 14.54C7.18 14.07 7.25 13.6 7.42 13.17C6.88 13.53 6.42 14.04 6.13 14.64C5.45 16.03 5.76 17.81 6.94 18.84C8.4 20.11 10.64 20.3 12.33 19.34C14.03 18.38 14.87 16.33 14.28 14.45C14.15 14.04 13.93 13.66 13.64 13.33L13.19 12.82C13.11 12.73 13.03 12.64 12.95 12.55L12.75 12.32C13.43 12.63 14.21 12.72 14.95 12.57C15.69 12.42 16.35 12.03 16.86 11.49C17.15 11.19 17.41 10.89 17.66 11.2Z" />
                        </svg>
                        {item.hotValue}
                      </span>
                    )}
                    {item.author && <span className="daily-hot-author">{item.author}</span>}
                  </div>
                </div>
                
                {item.cover && (
                  <div className="daily-hot-cover">
                    <img src={item.cover} alt={item.title} loading="lazy" />
                  </div>
                )}
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DailyHot;
