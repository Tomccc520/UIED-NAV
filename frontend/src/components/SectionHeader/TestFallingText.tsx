/**
 * @file TestFallingText.tsx
 * @description 测试FallingText组件的简单页面
 * @copyright 版权所有 (c) 2025 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

import React from 'react';
import FallingText from './FallingText';

const TestFallingText: React.FC = () => {
  return (
    <div style={{ 
      padding: '2rem', 
      maxWidth: '800px', 
      margin: '0 auto',
      backgroundColor: '#f5f5f5',
      minHeight: '100vh'
    }}>
      <h1>FallingText 动效测试</h1>
      
      <div style={{ 
        backgroundColor: 'white', 
        padding: '2rem', 
        borderRadius: '8px',
        marginBottom: '2rem',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <h2>悬停触发 (Hover)</h2>
        <FallingText
          text="AI 人工智能 GPT-4 Claude DeepSeek 文心一言 通义千问 AIGC 生成式AI 大模型"
          highlightWords={["AI", "GPT-4", "Claude", "DeepSeek"]}
          colorMap={{
            "AI": "highlight-purple",
            "GPT-4": "highlight-green",
            "Claude": "highlight-green",
            "DeepSeek": "highlight-orange"
          }}
          trigger="hover"
          fontSize="1.2rem"
        />
      </div>

      <div style={{ 
        backgroundColor: 'white', 
        padding: '2rem', 
        borderRadius: '8px',
        marginBottom: '2rem',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <h2>点击触发 (Click)</h2>
        <FallingText
          text="UI UX 设计 Figma Sketch Adobe XD Photoshop 原型设计 交互设计"
          highlightWords={["UI", "UX", "Figma", "Sketch", "Adobe"]}
          colorMap={{
            "UI": "highlight-purple",
            "UX": "highlight-purple",
            "Figma": "highlight-green",
            "Sketch": "highlight-green",
            "Adobe": "highlight-orange"
          }}
          trigger="click"
          fontSize="1.2rem"
        />
      </div>

      <div style={{ 
        backgroundColor: 'white', 
        padding: '2rem', 
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <h2>自动触发 (Auto)</h2>
        <FallingText
          text="UIED 工具导航 设计 开发 效率 创意 专业 精选"
          highlightWords={["UIED", "工具", "设计", "开发"]}
          colorMap={{
            "UIED": "highlight-purple",
            "工具": "highlight-green",
            "设计": "highlight-orange",
            "开发": "highlight-red"
          }}
          trigger="auto"
          fontSize="1.2rem"
        />
      </div>

      <div style={{ marginTop: '2rem', fontSize: '0.9rem', color: '#666' }}>
        <p>说明：</p>
        <ul>
          <li>第一个区域：鼠标悬停时触发文字下落动画</li>
          <li>第二个区域：点击时触发文字下落动画</li>
          <li>第三个区域：页面加载后自动触发文字下落动画</li>
        </ul>
        <p>如果看到调试信息显示 "Matter: ✓"，说明物理引擎加载成功。</p>
      </div>
    </div>
  );
};

export default TestFallingText; 