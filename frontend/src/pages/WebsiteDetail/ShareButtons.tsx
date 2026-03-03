/**
 * @file pages/WebsiteDetail/ShareButtons.tsx
 * @description 分享按钮组件（Pro 功能）
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

// @pro-feature-start: sharing
import React, { useMemo, useState, useCallback } from 'react';

interface ShareButtonsProps {
  websiteId: string;
  websiteName: string;
  websiteDescription: string;
  websiteUrl: string;
  shareChannels?: ShareChannel[];
  shareText?: string;
}

/**
 * 分享渠道配置接口
 */
interface ShareChannel {
  key: string;
  name: string;
  enabled: boolean;
  sort: number;
  icon?: string;
}

/**
 * 复制图标
 */
const CopyIcon: React.FC<{ size?: number }> = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);

/**
 * 微博图标
 */
const WeiboIcon: React.FC<{ size?: number }> = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M10.098 20c-4.612 0-8.598-2.063-8.598-5.5 0-1.813 1.089-3.875 2.938-5.813 2.469-2.563 5.344-3.937 6.438-3.063.469.375.594 1.063.406 1.938-.125.5.438.188.438.188 1.656-.688 3.125-.813 3.656-.063.281.375.313.875.094 1.5-.125.375.063.438.313.5.563.125 1.094.313 1.531.625.438.313.188.688-.25.688-.5 0-1.063-.063-1.563-.063-.438 0-.313.438-.188.688.125.25.25.5.313.75.063.25-.063.5-.313.563-.25.063-.563-.063-.75-.188-.188-.125-.438-.063-.5.125-.063.188.063.438.188.563.125.125.188.313.063.5-.125.188-.375.25-.563.188-.188-.063-.375-.188-.5-.313-.125-.125-.313-.125-.438 0-.125.125-.125.313-.063.5.063.188.188.375.313.5.125.125.125.313 0 .438-.125.125-.313.188-.5.125-.188-.063-.375-.188-.5-.313-.125-.125-.313-.125-.438 0-.125.125-.188.313-.125.5.063.188.188.375.313.5.125.125.125.313 0 .438-.125.125-.313.188-.5.125-.188-.063-.375-.188-.5-.313-.125-.125-.313-.125-.438 0-.125.125-.188.313-.125.5.063.188.188.375.313.5.125.125.125.313 0 .438-.125.125-.313.188-.5.125-.188-.063-.375-.188-.5-.313-.125-.125-.313-.125-.438 0-.125.125-.188.313-.125.5.063.188.188.375.313.5.125.125.125.313 0 .438-.125.125-.313.188-.5.125-.188-.063-.375-.188-.5-.313-.125-.125-.313-.125-.438 0-.125.125-.188.313-.125.5.063.188.188.375.313.5.125.125.125.313 0 .438-.125.125-.313.188-.5.125z"/>
  </svg>
);

/**
 * Twitter/X 图标
 */
const TwitterIcon: React.FC<{ size?: number }> = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

/**
 * 通用分享图标（用于未单独定制的渠道）
 */
const ShareIcon: React.FC<{ size?: number }> = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="18" cy="5" r="3" />
    <circle cx="6" cy="12" r="3" />
    <circle cx="18" cy="19" r="3" />
    <path d="M8.7 10.9l6.6-3.8M8.7 13.1l6.6 3.8" />
  </svg>
);

/**
 * 默认分享渠道（当后台未配置时兜底）
 */
const DEFAULT_SHARE_CHANNELS: ShareChannel[] = [
  { key: 'copylink', name: '复制链接', enabled: true, sort: 1 },
  { key: 'weibo', name: '微博', enabled: true, sort: 2 },
  { key: 'twitter', name: 'Twitter', enabled: true, sort: 3 },
];

/**
 * 分享按钮组件
 */
const ShareButtons: React.FC<ShareButtonsProps> = ({
  websiteId,
  websiteName,
  websiteDescription,
  websiteUrl: _websiteUrl,
  shareChannels: shareChannelsProp,
  shareText,
}) => {
  const [copied, setCopied] = useState(false);

  /**
   * 统一读取当前详情页链接，优先使用真实 URL（兼容自定义固定链接）
   */
  const pageUrl = useMemo(() => {
    if (typeof window !== 'undefined' && window.location?.href) {
      return window.location.href;
    }
    return `/website/${websiteId}`;
  }, [websiteId]);

  /**
   * 统一构建分享文案，支持后台自定义文案覆盖
   */
  const shareTextValue = String(shareText || '').trim() || `${websiteName} - ${websiteDescription}`;

  /**
   * 过滤并排序分享渠道，确保“后台开关 + 排序”即时生效
   */
  const enabledChannels = useMemo(() => {
    const source = Array.isArray(shareChannelsProp) && shareChannelsProp.length > 0
      ? shareChannelsProp
      : DEFAULT_SHARE_CHANNELS;
    return source
      .filter(channel => channel && channel.enabled !== false)
      .sort((a, b) => Number(a.sort || 0) - Number(b.sort || 0));
  }, [shareChannelsProp]);

  /**
   * 打开分享窗口（统一尺寸）
   */
  const openShareWindow = useCallback((url: string) => {
    window.open(url, '_blank', 'width=760,height=620,noopener,noreferrer');
  }, []);

  /**
   * 复制链接
   */
  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(pageUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // 降级方案
      const textArea = document.createElement('textarea');
      textArea.value = pageUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [pageUrl]);

  /**
   * 渠道路由：按渠道 key 执行分享动作
   */
  const handleShareByChannel = useCallback((channelKey: string) => {
    const encodedUrl = encodeURIComponent(pageUrl);
    const encodedText = encodeURIComponent(shareTextValue);
    const encodedTitle = encodeURIComponent(websiteName);
    const encodedSummary = encodeURIComponent(websiteDescription);

    if (channelKey === 'copylink') {
      handleCopyLink().catch(() => {});
      return;
    }
    if (channelKey === 'weibo') {
      openShareWindow(`https://service.weibo.com/share/share.php?url=${encodedUrl}&title=${encodedText}`);
      return;
    }
    if (channelKey === 'twitter') {
      openShareWindow(`https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}`);
      return;
    }
    if (channelKey === 'facebook') {
      openShareWindow(`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`);
      return;
    }
    if (channelKey === 'linkedin') {
      openShareWindow(`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`);
      return;
    }
    if (channelKey === 'qq') {
      openShareWindow(`https://connect.qq.com/widget/shareqq/index.html?url=${encodedUrl}&title=${encodedTitle}&summary=${encodedSummary}`);
      return;
    }
    if (channelKey === 'qzone') {
      openShareWindow(`https://sns.qzone.qq.com/cgi-bin/qzshare/cgi_qzshare_onekey?url=${encodedUrl}&title=${encodedTitle}&summary=${encodedSummary}`);
      return;
    }
    if (channelKey === 'wechat') {
      openShareWindow(`https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodedUrl}`);
      return;
    }
    openShareWindow(`https://service.weibo.com/share/share.php?url=${encodedUrl}&title=${encodedText}`);
  }, [
    handleCopyLink,
    openShareWindow,
    pageUrl,
    shareTextValue,
    websiteDescription,
    websiteName,
  ]);

  /**
   * 渲染渠道图标
   */
  const renderChannelIcon = (key: string) => {
    if (key === 'copylink') return <CopyIcon />;
    if (key === 'weibo') return <WeiboIcon />;
    if (key === 'twitter') return <TwitterIcon />;
    return <ShareIcon />;
  };

  return (
    <div className="share-buttons">
      {enabledChannels.map((channel) => (
        <button
          key={channel.key}
          className={`btn-share btn-share-${channel.key}`}
          onClick={() => handleShareByChannel(channel.key)}
          title={channel.name}
        >
          {renderChannelIcon(channel.key)}
          <span>{channel.key === 'copylink' && copied ? '已复制' : channel.name}</span>
        </button>
      ))}
    </div>
  );
};

export default ShareButtons;
// @pro-feature-end: sharing
