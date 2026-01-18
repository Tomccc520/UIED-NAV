/**
 * @file CardSkeleton/index.tsx
 * @description 卡片骨架屏组件
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

import { Skeleton, Card } from 'antd';

interface CardSkeletonProps {
  count?: number;
  avatar?: boolean;
  paragraph?: { rows?: number };
}

export default function CardSkeleton({ 
  count = 1, 
  avatar = false,
  paragraph = { rows: 3 }
}: CardSkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <Card key={index} style={{ marginBottom: 16 }}>
          <Skeleton
            active
            avatar={avatar}
            paragraph={paragraph}
          />
        </Card>
      ))}
    </>
  );
}
