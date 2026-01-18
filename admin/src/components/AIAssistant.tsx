/**
 * @file AIAssistant.tsx
 * @description AI 助手组件占位符 - 开源版暂不提供
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

import { Card, Typography, Button, Space } from 'antd';
import { RobotOutlined, LockOutlined } from '@ant-design/icons';

const { Title, Paragraph } = Typography;

/**
 * AI 助手组件 - 开源版占位符
 * Pro 版本将提供完整的 AI 对话功能
 */
export default function AIAssistant() {
  return (
    <Card
      style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        width: 400,
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        zIndex: 1000,
      }}
    >
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <div style={{ textAlign: 'center' }}>
          <RobotOutlined style={{ fontSize: 48, color: '#1890ff' }} />
          <Title level={4} style={{ marginTop: 16 }}>AI 智能助手</Title>
        </div>
        
        <Paragraph type="secondary" style={{ textAlign: 'center', margin: 0 }}>
          AI 助手功能在个人版和企业版中提供
        </Paragraph>

        <div style={{ 
          background: '#f5f5f5', 
          padding: 16, 
          borderRadius: 8,
          border: '1px dashed #d9d9d9'
        }}>
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <LockOutlined />
              <span>智能数据分析</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <LockOutlined />
              <span>自然语言查询</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <LockOutlined />
              <span>操作建议推荐</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <LockOutlined />
              <span>数据洞察报告</span>
            </div>
          </Space>
        </div>

        <Button type="primary" block href="https://fsuied.com/pricing" target="_blank">
          了解 Pro 版本
        </Button>
      </Space>
    </Card>
  );
}
