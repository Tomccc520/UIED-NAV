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
import React, { useState, useCallback } from 'react';
import { debugLog } from '../../utils/debugHelper';

interface ShareButtonsProps {
  websiteId: string;
  websiteName: string;
  websiteDescription: string;
  websiteUrl: string;
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
 * 分享按钮组件
 */
const ShareButtons: React.FC<ShareButtonsProps> = ({
  websiteId,
  websiteName,
  websiteDescription,
  websiteUrl,
}) => {
  const [copied, setCopied] = useState(false);

  // 当前页面 URL
  const pageUrl = `${window.location.origin}/website/${websiteId}`;
  const shareText = `${websiteName} - ${websiteDescription}`;

  /**
   * 复制链接
   */
  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(pageUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      debugLog.error('复制失败:', err);
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
   * 分享到微博
   */
  const handleShareWeibo = useCallback(() => {
    const url = `https://service.weibo.com/share/share.php?url=${encodeURIComponent(pageUrl)}&title=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank', 'width=600,height=400');
  }, [pageUrl, shareText]);

  /**
   * 分享到 Twitter/X
   */
  const handleShareTwitter = useCallback(() => {
    const url = `https://twitter.com/intent/tweet?url=${encodeURIComponent(pageUrl)}&text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank', 'width=600,height=400');
  }, [pageUrl, shareText]);

  return (
    <div className="share-buttons">
      <span className="share-label">分享：</span>
      
      <button
        className="btn-share btn-share-copy"
        onClick={handleCopyLink}
        title="复制链接"
      >
        <CopyIcon />
        <span>{copied ? '已复制' : '复制链接'}</span>
      </button>
      
      <button
        className="btn-share btn-share-weibo"
        onClick={handleShareWeibo}
        title="分享到微博"
      >
        <WeiboIcon />
        <span>微博</span>
      </button>
      
      <button
        className="btn-share btn-share-twitter"
        onClick={handleShareTwitter}
        title="分享到 Twitter"
      >
        <TwitterIcon />
        <span>Twitter</span>
      </button>
    </div>
  );
};

export default ShareButtons;
// @pro-feature-end: sharing
