/**
 * @file TableSkeleton/index.tsx
 * @description 表格骨架屏组件
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

import { Skeleton, Card } from 'antd';

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
}

export default function TableSkeleton({ rows = 5, columns = 4 }: TableSkeletonProps) {
  return (
    <Card>
      {/* 表头骨架 */}
      <div style={{ marginBottom: 16 }}>
        <Skeleton.Input active style={{ width: '100%', height: 40 }} />
      </div>

      {/* 表格行骨架 */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={rowIndex}
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${columns}, 1fr)`,
            gap: 16,
            marginBottom: 12,
          }}
        >
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton.Input
              key={colIndex}
              active
              style={{ width: '100%', height: 32 }}
            />
          ))}
        </div>
      ))}

      {/* 分页骨架 */}
      <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end' }}>
        <Skeleton.Button active style={{ width: 200 }} />
      </div>
    </Card>
  );
}
