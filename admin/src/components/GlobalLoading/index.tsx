/**
 * @file GlobalLoading/index.tsx
 * @description 全局加载指示器组件
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

import { Spin } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';

interface GlobalLoadingProps {
  loading?: boolean;
  tip?: string;
}

export default function GlobalLoading({ loading = false, tip = '加载中...' }: GlobalLoadingProps) {
  if (!loading) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(4px)',
        zIndex: 9999,
      }}
    >
      <Spin
        indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />}
        tip={tip}
        size="large"
      />
    </div>
  );
}
