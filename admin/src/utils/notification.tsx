/**
 * @file utils/notification.ts
 * @description 统一的通知工具函数
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

import { message, notification } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, InfoCircleOutlined, WarningOutlined } from '@ant-design/icons';

// 配置 message 全局位置
message.config({
  top: 80,
  duration: 3,
  maxCount: 3,
});

// 配置 notification 全局位置
notification.config({
  placement: 'topRight',
  top: 80,
  duration: 4.5,
});

/**
 * 成功提示
 */
export const showSuccess = (content: string, description?: string) => {
  if (description) {
    notification.success({
      message: content,
      description,
      icon: <CheckCircleOutlined style={{ color: '#10B981' }} />,
    });
  } else {
    message.success({
      content,
      icon: <CheckCircleOutlined />,
    });
  }
};

/**
 * 错误提示
 */
export const showError = (content: string, description?: string) => {
  if (description) {
    notification.error({
      message: content,
      description,
      icon: <CloseCircleOutlined style={{ color: '#EF4444' }} />,
    });
  } else {
    message.error({
      content,
      icon: <CloseCircleOutlined />,
    });
  }
};

/**
 * 警告提示
 */
export const showWarning = (content: string, description?: string) => {
  if (description) {
    notification.warning({
      message: content,
      description,
      icon: <WarningOutlined style={{ color: '#F59E0B' }} />,
    });
  } else {
    message.warning({
      content,
      icon: <WarningOutlined />,
    });
  }
};

/**
 * 信息提示
 */
export const showInfo = (content: string, description?: string) => {
  if (description) {
    notification.info({
      message: content,
      description,
      icon: <InfoCircleOutlined style={{ color: '#3B82F6' }} />,
    });
  } else {
    message.info({
      content,
      icon: <InfoCircleOutlined />,
    });
  }
};

/**
 * 加载提示
 */
export const showLoading = (content: string = '加载中...') => {
  return message.loading(content, 0); // 0 表示不自动关闭
};

/**
 * 带撤销功能的成功提示
 */
export const showSuccessWithUndo = (
  content: string,
  onUndo: () => void,
  description?: string
) => {
  notification.success({
    message: content,
    description,
    icon: <CheckCircleOutlined style={{ color: '#10B981' }} />,
    btn: (
      <button
        onClick={() => {
          onUndo();
          notification.destroy();
        }}
        style={{
          padding: '4px 12px',
          background: 'transparent',
          border: '1px solid #3B82F6',
          borderRadius: 4,
          color: '#3B82F6',
          cursor: 'pointer',
          fontSize: 14,
        }}
      >
        撤销
      </button>
    ),
    duration: 6,
  });
};
