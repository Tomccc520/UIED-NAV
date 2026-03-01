/**
 * @file ToolCard/index.tsx
 * @description 通用工具卡片组件 - 使用统一的 WebsiteFavicon 组件处理图标
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 2.0.0 - 统一使用 WebsiteFavicon 组件
 * 
 * Requirements: 10.2 - WHEN 图标加载失败 THEN THE Frontend_App SHALL 显示默认图标
 */

import React from 'react';
import { Card } from '../UI';
import WebsiteFavicon from '../WebsiteFavicon';
import type { Tool } from '../../hooks/useNavigation';
import './index.mobile.css';

// 工具卡片属性接口
interface ToolCardProps {
  tool: Tool;
  onClick: (e: React.MouseEvent) => void;
  className?: string;
  index?: number; // 用于动画延迟
  showDirectArrow?: boolean; // 是否显示直达箭头
  onDirectVisit?: (tool: Tool, e: React.MouseEvent) => void; // 直达箭头点击回调
  arrowLabel?: string; // 箭头提示文案（如"直达网站"或"查看详情"）
  arrowIsExternal?: boolean; // 箭头是否指向外部链接（控制图标方向）
  directArrowNewWindow?: boolean; // 箭头链接是否在新窗口打开
}

// 保留导出类型和工具函数以兼容测试文件
export type IconLoadState = 'loading' | 'loaded' | 'fallback' | 'error';

/** 默认图标 */
export const DEFAULT_ICON = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"%3E%3Crect fill="%23f5f5f5" width="64" height="64" rx="8"/%3E%3Ctext x="32" y="38" text-anchor="middle" fill="%23999" font-size="20"%3E?%3C/text%3E%3C/svg%3E';

/** 获取图标URL列表（按优先级排序），保留用于测试兼容 */
export const getIconUrlList = (tool: Tool): string[] => {
  const urls: string[] = [];
  if (tool.iconUrl) urls.push(tool.iconUrl);
  if (tool.icon && tool.icon !== tool.iconUrl) urls.push(tool.icon);
  if (tool.url) {
    try {
      const domain = new URL(tool.url).hostname;
      urls.push(`https://favicon.im/${domain}?larger=true`);
      urls.push(`https://cravatar.cn/avatar/${domain}?d=identicon&s=64`);
      urls.push(`https://www.google.com/s2/favicons?domain=${domain}&sz=64`);
    } catch { /* 无效 URL */ }
  }
  return urls;
};

/** 生成基于名称首字母的 SVG 图标 */
export const generateNameBasedIcon = (name: string | undefined | null): string => {
  const safeName = name || '?';
  const initial = safeName.charAt(0).toUpperCase();
  const hue = safeName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 360;
  const bgColor = `hsl(${hue}, 60%, 90%)`;
  const textColor = `hsl(${hue}, 60%, 40%)`;
  return `data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"%3E%3Crect fill="${encodeURIComponent(bgColor)}" width="64" height="64" rx="8"/%3E%3Ctext x="32" y="42" text-anchor="middle" fill="${encodeURIComponent(textColor)}" font-size="28" font-weight="bold"%3E${encodeURIComponent(initial)}%3C/text%3E%3C/svg%3E`;
};

/** 图标加载降级逻辑 */
export const getNextIconFallback = (
  iconUrls: string[], currentIndex: number, toolName: string
): { nextSrc: string; nextIndex: number; state: IconLoadState } => {
  const nextIndex = currentIndex + 1;
  if (nextIndex < iconUrls.length) {
    return { nextSrc: iconUrls[nextIndex], nextIndex, state: 'fallback' };
  }
  return { nextSrc: generateNameBasedIcon(toolName), nextIndex, state: 'error' };
};

/** 验证图标降级行为 */
export const validateIconFallback = (
  loadAttempts: string[], finalSrc: string, iconUrls: string[], toolName: string
): { isValid: boolean; reason: string } => {
  if (loadAttempts.length === 0) return { isValid: false, reason: 'No load attempts made' };
  for (let i = 0; i < loadAttempts.length && i < iconUrls.length; i++) {
    if (loadAttempts[i] !== iconUrls[i]) return { isValid: false, reason: `Load order mismatch at index ${i}` };
  }
  if (!finalSrc || finalSrc.length === 0) return { isValid: false, reason: 'Final source is empty' };
  const isInAttempts = loadAttempts.includes(finalSrc);
  const isNameBasedIcon = finalSrc.includes('data:image/svg+xml');
  if (!isInAttempts && !isNameBasedIcon) return { isValid: false, reason: 'Final source is neither a loaded URL nor a default icon' };
  if (finalSrc === '' || finalSrc === 'undefined' || finalSrc === 'null') return { isValid: false, reason: 'Final source is invalid' };
  return { isValid: true, reason: 'Fallback behavior is correct' };
};

/**
 * 通用工具卡片组件
 */
const ToolCard: React.FC<ToolCardProps> = ({ tool, onClick, className = '', index = 0, showDirectArrow = false, onDirectVisit, arrowLabel = '直达网站', arrowIsExternal = true, directArrowNewWindow = true }) => {
  // 安全获取工具名称
  const toolName = tool?.name || '未知工具';

  // 判断网站是否失效
  const isFailed = tool?.status === 'failed';
  
  return (
    <div className="tool-card-wrapper">
      <Card
        hoverable
        className={`tool-item-card ${className} ${isFailed ? 'tool-item-card-failed' : ''}`}
        onClick={onClick}
      >
        {/* 置顶标识 */}
        {tool?.isPinned && (
          <div className="tool-item-pinned-badge" title="置顶推荐">
            <span className="tool-item-pinned-icon">📌</span>
          </div>
        )}
        
        {/* 失效标识 */}
        {isFailed && (
          <div className="tool-item-failed-badge" title={tool?.statusMessage || '网站可能无法访问'}>
            <span className="tool-item-failed-icon">!</span>
          </div>
        )}
        
        {/* 左侧大图标 - 使用统一的 WebsiteFavicon 组件 */}
        <div className={`tool-item-icon-large ${isFailed ? 'tool-item-icon-failed' : ''}`}>
          <WebsiteFavicon
            websiteUrl={tool?.url}
            iconUrl={tool?.iconUrl || tool?.icon}
            name={toolName}
            size={44}
            className={isFailed ? 'tool-icon-img-failed' : ''}
          />
        </div>

        {/* 右侧内容区域 - 标题、简介、标签 */}
        <div className="tool-item-content-right">
          <h4 className="tool-item-name">{toolName}</h4>
          <p className="tool-item-description">{tool?.description || ''}</p>
          {tool?.tags && tool.tags.length > 0 && (
            <div className="tool-item-tags">
              {tool.tags.slice(0, 3).map((tag, tagIndex) => (
                <span key={tagIndex} className="tool-tag">{tag}</span>
              ))}
            </div>
          )}
        </div>

        {/* 直达箭头 - 鼠标移入卡片时显示 */}
        {showDirectArrow && tool?.url && (
          <a
            href={arrowIsExternal ? tool.url : undefined}
            target={arrowIsExternal && directArrowNewWindow ? '_blank' : undefined}
            rel={arrowIsExternal && directArrowNewWindow ? 'noopener noreferrer' : undefined}
            className="tool-item-direct-arrow"
            onClick={(e) => {
              e.stopPropagation();
              if (onDirectVisit) {
                e.preventDefault();
                onDirectVisit(tool, e);
              }
            }}
          >
            {arrowIsExternal ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M7 17L17 7" />
                <path d="M7 7h10v10" />
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18l6-6-6-6" />
              </svg>
            )}
            <span className="direct-arrow-tooltip">{arrowLabel}</span>
          </a>
        )}
      </Card>
    </div>
  );
};

export default ToolCard;
