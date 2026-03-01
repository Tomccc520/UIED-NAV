/**
 * @file WebsiteExitModal.tsx
 * @description 网站跳转确认弹窗组件
 * @copyright 版权所有 (c) 2025 UIED技术团队
 * @version 1.3.1 - 修复自动跳转重复问题
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Modal from './Modal';
import Button from './Button';
import './WebsiteExitModal.css';

// 弹窗配置接口
interface ExitModalConfig {
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  showReport?: boolean;
  reportText?: string;
  // 自动跳转配置
  autoRedirect?: boolean;
  autoRedirectSeconds?: number;
  // 广告配置
  showAd?: boolean;
  adCode?: string;
  adPosition?: 'top' | 'bottom';
  logo?: string;
  showAgreementLinks?: boolean;
  userAgreementText?: string;
  userAgreementUrl?: string;
  copyrightAgreementText?: string;
  copyrightAgreementUrl?: string;
}

// 网站跳转弹窗属性接口
interface WebsiteExitModalProps {
  /** 是否显示弹窗 */
  visible: boolean;
  /** 目标网站信息 */
  website: {
    name: string;
    url: string;
    description?: string;
  } | null;
  /** 关闭回调 */
  onClose: () => void;
  /** 确认访问回调 */
  onConfirm: () => void;
  /** 举报回调 */
  onReport?: (url: string, reason: string) => void;
  /** 自定义配置 */
  config?: ExitModalConfig;
}

// 默认配置
const defaultConfig: ExitModalConfig = {
  title: '即将离开本站',
  description: '您即将访问第三方网站，请注意保护个人信息安全。',
  confirmText: '继续访问',
  cancelText: '返回',
  showReport: true,
  reportText: '举报此链接',
  autoRedirect: false,
  autoRedirectSeconds: 5,
  showAd: false,
  adCode: '',
  adPosition: 'bottom',
  logo: '',
  showAgreementLinks: false,
  userAgreementText: '',
  userAgreementUrl: '',
  copyrightAgreementText: '',
  copyrightAgreementUrl: '',
};

// 广告渲染组件
const AdContainer: React.FC<{ code: string }> = ({ code }) => {
  if (!code) return null;
  
  return (
    <div 
      className="exit-modal-ad"
      dangerouslySetInnerHTML={{ __html: code }}
    />
  );
};

/**
 * 网站跳转确认弹窗组件
 */
const WebsiteExitModal: React.FC<WebsiteExitModalProps> = ({
  visible,
  website,
  onClose,
  onConfirm,
  onReport,
  config = {}
}) => {
  // 合并配置
  const mergedConfig = { ...defaultConfig, ...config };
  
  // 倒计时状态
  const [countdown, setCountdown] = useState(mergedConfig.autoRedirectSeconds || 5);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const hasRedirectedRef = useRef(false); // 防止重复跳转
  const onConfirmRef = useRef(onConfirm); // 使用 ref 存储回调避免依赖问题
  
  // 更新 ref
  useEffect(() => {
    onConfirmRef.current = onConfirm;
  }, [onConfirm]);

  // 重置状态
  useEffect(() => {
    if (visible && mergedConfig.autoRedirect) {
      setCountdown(mergedConfig.autoRedirectSeconds || 5);
      hasRedirectedRef.current = false;
    }
  }, [visible, mergedConfig.autoRedirect, mergedConfig.autoRedirectSeconds]);

  // 清理定时器
  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // 倒计时逻辑
  useEffect(() => {
    if (!visible || !mergedConfig.autoRedirect) {
      clearTimer();
      return;
    }

    timerRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearTimer();
          // 防止重复跳转
          if (!hasRedirectedRef.current) {
            hasRedirectedRef.current = true;
            // 使用 setTimeout 确保状态更新后再调用
            setTimeout(() => {
              onConfirmRef.current();
            }, 0);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return clearTimer;
  }, [visible, mergedConfig.autoRedirect, clearTimer]);

  if (!website) return null;

  // 确认按钮文字（带倒计时）
  const confirmButtonText = mergedConfig.autoRedirect && countdown > 0
    ? `${mergedConfig.confirmText} (${countdown}s)`
    : mergedConfig.confirmText;

  const showAgreements = Boolean(
    mergedConfig.showAgreementLinks
    && (mergedConfig.userAgreementText || mergedConfig.copyrightAgreementText)
  );

  // 手动点击确认
  const handleConfirm = () => {
    clearTimer();
    hasRedirectedRef.current = true;
    onConfirm();
  };

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      width={480}
      className="website-exit-modal"
      maskClosable={true}
    >
      <div className="exit-modal-content">
        {/* 顶部广告位 */}
        {mergedConfig.showAd && mergedConfig.adPosition === 'top' && mergedConfig.adCode && (
          <AdContainer code={mergedConfig.adCode} />
        )}

        {/* 警告图标和标题 */}
        <div className="exit-modal-header">
          {mergedConfig.logo && (
            <img className="exit-modal-logo" src={mergedConfig.logo} alt="logo" />
          )}
          <div className="warning-icon">⚠️</div>
          <h2 className="exit-modal-title">{mergedConfig.title}</h2>
        </div>

        {/* 网站信息 */}
        <div className="target-website-info">
          <div className="website-basic-info">
            <h3 className="website-name">{website.name}</h3>
            <p className="website-url">{new URL(website.url).hostname}</p>
            {website.description && (
              <p className="website-description">{website.description}</p>
            )}
          </div>
        </div>

        {/* 安全警告 */}
        <div className="security-warning">
          <div className="warning-content">
            <p className="warning-text">
              {mergedConfig.description}
            </p>
          </div>
        </div>

        {showAgreements && (
          <div className="exit-modal-agreements">
            {mergedConfig.userAgreementText && (
              mergedConfig.userAgreementUrl ? (
                <a
                  className="agreement-link"
                  href={mergedConfig.userAgreementUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  {mergedConfig.userAgreementText}
                </a>
              ) : (
                <span className="agreement-text">{mergedConfig.userAgreementText}</span>
              )
            )}
            {mergedConfig.copyrightAgreementText && (
              mergedConfig.copyrightAgreementUrl ? (
                <a
                  className="agreement-link"
                  href={mergedConfig.copyrightAgreementUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  {mergedConfig.copyrightAgreementText}
                </a>
              ) : (
                <span className="agreement-text">{mergedConfig.copyrightAgreementText}</span>
              )
            )}
          </div>
        )}

        {/* 底部广告位 */}
        {mergedConfig.showAd && mergedConfig.adPosition === 'bottom' && mergedConfig.adCode && (
          <AdContainer code={mergedConfig.adCode} />
        )}

        {/* 操作按钮 */}
        <div className="exit-modal-actions">
          <Button onClick={onClose}>
            {mergedConfig.cancelText}
          </Button>
          <Button 
            type="primary" 
            onClick={handleConfirm}
          >
            {confirmButtonText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default WebsiteExitModal; 
