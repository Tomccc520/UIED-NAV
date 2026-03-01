/**
 * @file SectionHeader/index.tsx
 * @description 通用区块标题组件 - 支持不同页面的标题展示和文字下落动画
 * @copyright 版权所有 (c) 2025 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 2.0.0
 */
import React from 'react';
import { useLocation } from 'react-router-dom';
import './index.css';
import FallingText from './FallingText';

interface SectionHeaderProps {
  /** 自定义标题，如果不提供则根据路由自动判断 */
  title?: string;
  /** 自定义描述，如果不提供则根据路由自动判断 */
  description?: string;
  /** 自定义文字下落动画的文本内容 */
  fallingText?: string;
  /** 自定义高亮词汇 */
  highlightWords?: string[];
  /** 自定义颜色映射 */
  colorMap?: Record<string, string>;
  /** 是否启用文字下落动画 */
  enableAnimation?: boolean;
  /** 背景图片地址，默认使用bg.jpg */
  backgroundImage?: string;
  /** 自定义CSS类名 */
  className?: string;
  /** 是否显示背景图片 */
  showBackground?: boolean;
}

/**
 * 通用区块标题组件
 * 根据当前路由自动显示对应的标题和内容
 * 支持文字下落动画效果
 * 
 * @param props 组件属性
 * @returns 区块标题JSX元素
 */
const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  description,
  fallingText,
  highlightWords,
  colorMap,
  enableAnimation = true,
  backgroundImage = '/bg.jpg',
  className = '',
  showBackground = true
}) => {
  const location = useLocation();
  
  // 根据路由路径确定页面内容
  const getPageContent = () => {
    const path = location.pathname;
    
    if (path.includes('/ai')) {
      return {
        title: title || '发现强大的AI工具',
        description: description || '聚合国内外AI精选内容，探索AI技术前沿与应用',
        fallingText: fallingText || 'AI 人工智能 GPT-4 Claude DeepSeek 文心一言 通义千问 AIGC 生成式AI 大模型 Stable Diffusion Midjourney DALL-E 智谱AI 自然语言处理 多模态 MiniMax 百川智能 讯飞星火 Sora OpenAI',
        highlightWords: highlightWords || ["AI", "GPT", "Claude", "DeepSeek", "文心一言", "通义千问"],
        colorMap: colorMap || {
          "AI": "highlight-purple",
          "人工智能": "highlight-purple",
          "GPT-4": "highlight-green",
          "Claude": "highlight-blue",
          "DeepSeek": "highlight-orange",
          "文心一言": "highlight-red",
          "通义千问": "highlight-pink",
          "AIGC": "highlight-teal",
          "大模型": "highlight-orange",
          "智谱AI": "highlight-green",
          "Sora": "highlight-blue",
          "OpenAI": "highlight-purple"
        }
      };
    } else if (path.includes('/uiux')) {
      return {
        title: title || '发现专业UI/UX工具',
        description: description || '精选UI/UX设计师必备工具与资源，提升设计效率与创意灵感',
        fallingText: fallingText || '设计师日常 熬夜改稿 甲方需求 无限修改 996福报 设计秃头 UI设计 UX体验 Figma神器 Sketch经典 Adobe全家桶 原型设计 交互动效 用户体验 界面美学 设计系统 色彩理论 字体搭配 图标设计 响应式布局 移动端适配 网页设计 视觉层次 用户研究 可用性测试 设计规范 品牌视觉 创意灵感 设计趋势',
        highlightWords: highlightWords || ["熬夜改稿", "甲方需求", "无限修改", "996福报", "设计秃头", "UI设计", "UX体验", "Figma神器", "Sketch经典", "Adobe全家桶", "原型设计", "交互动效"],
        colorMap: colorMap || {
          "熬夜改稿": "highlight-red",
          "甲方需求": "highlight-orange", 
          "无限修改": "highlight-red",
          "996福报": "highlight-red",
          "设计秃头": "highlight-orange",
          "设计师日常": "highlight-purple",
          "UI设计": "highlight-purple",
          "UX体验": "highlight-blue",
          "Figma神器": "highlight-green",
          "Sketch经典": "highlight-orange",
          "Adobe全家桶": "highlight-red",
          "原型设计": "highlight-teal",
          "交互动效": "highlight-pink",
          "用户体验": "highlight-blue",
          "界面美学": "highlight-purple",
          "设计系统": "highlight-green",
          "色彩理论": "highlight-orange",
          "字体搭配": "highlight-teal",
          "图标设计": "highlight-pink",
          "响应式布局": "highlight-blue",
          "移动端适配": "highlight-green",
          "网页设计": "highlight-purple",
          "视觉层次": "highlight-orange",
          "用户研究": "highlight-blue",
          "可用性测试": "highlight-teal",
          "设计规范": "highlight-green",
          "品牌视觉": "highlight-red",
          "创意灵感": "highlight-pink",
          "设计趋势": "highlight-purple"
        }
      };
    } else if (path.includes('/font')) {
      return {
        title: title || '发现优质字体资源',
        description: description || '精选中英文字体、字体工具与资源，提升设计品质与视觉表达',
        fallingText: fallingText || '字体设计 Typography 思源黑体 思源宋体 Google Fonts Adobe Fonts 中文字体 英文字体 衬线字体 无衬线字体 手写字体 装饰字体 字体搭配 字体管理 FontForge Glyphs Web字体 字体优化 字体授权 商用字体 免费字体 字体下载 字体编辑器 字体识别 字体预览 字体转换',
        highlightWords: highlightWords || ["字体设计", "Typography", "思源黑体", "思源宋体", "Google Fonts", "Adobe Fonts", "中文字体", "英文字体", "字体搭配", "字体管理", "FontForge", "Glyphs"],
        colorMap: colorMap || {
          "字体设计": "highlight-purple",
          "Typography": "highlight-blue",
          "思源黑体": "highlight-green",
          "思源宋体": "highlight-orange",
          "Google Fonts": "highlight-red",
          "Adobe Fonts": "highlight-pink",
          "中文字体": "highlight-teal",
          "英文字体": "highlight-purple",
          "衬线字体": "highlight-blue",
          "无衬线字体": "highlight-green",
          "手写字体": "highlight-orange",
          "装饰字体": "highlight-red",
          "字体搭配": "highlight-pink",
          "字体管理": "highlight-teal",
          "FontForge": "highlight-purple",
          "Glyphs": "highlight-blue",
          "Web字体": "highlight-green",
          "字体优化": "highlight-orange",
          "字体授权": "highlight-red",
          "商用字体": "highlight-pink",
          "免费字体": "highlight-teal",
          "字体编辑器": "highlight-purple",
          "字体识别": "highlight-blue",
          "字体预览": "highlight-green",
          "字体转换": "highlight-orange"
        }
      };
    } else if (path.includes('/search')) {
      return {
        title: title || '全站搜索',
        description: description || '搜索全站工具与资源，快速找到您需要的内容',
        fallingText: fallingText || '搜索 查找 工具 资源 AI工具 UI设计 开发工具 效率提升 创意灵感 技术前沿 最新资讯 热门推荐 精选内容 专业工具',
        highlightWords: highlightWords || ["搜索", "查找", "工具", "资源", "AI工具", "UI设计"],
        colorMap: colorMap || {
          "搜索": "highlight-purple",
          "查找": "highlight-blue",
          "工具": "highlight-green",
          "资源": "highlight-orange",
          "AI工具": "highlight-red",
          "UI设计": "highlight-pink",
          "开发工具": "highlight-teal",
          "效率提升": "highlight-green",
          "创意灵感": "highlight-purple",
          "技术前沿": "highlight-blue"
        }
      };
    } else {
      // 默认内容（首页）
      return {
        title: title || 'UIED 工具导航',
        description: description || '发现优质工具与资源，提升工作效率与创意灵感',
        fallingText: fallingText || 'UIED 工具导航 效率工具 创意资源 AI工具 UI设计 开发工具 在线工具 免费资源 设计灵感 技术前沿 生产力 创新科技 数字化转型',
        highlightWords: highlightWords || ["UIED", "工具导航", "效率工具", "创意资源", "AI工具", "UI设计"],
        colorMap: colorMap || {
          "UIED": "highlight-purple",
          "工具导航": "highlight-blue",
          "效率工具": "highlight-green",
          "创意资源": "highlight-orange",
          "AI工具": "highlight-red",
          "UI设计": "highlight-pink",
          "开发工具": "highlight-teal",
          "在线工具": "highlight-green",
          "免费资源": "highlight-blue",
          "设计灵感": "highlight-purple",
          "技术前沿": "highlight-orange"
        }
      };
    }
  };

  const pageContent = getPageContent();

  return (
    <header className={`hero-section-header ${className} ${showBackground ? 'with-background' : ''}`}>
      {/* 背景图片层 */}
      {showBackground && (
        <div 
          className="hero-section-header-bg"
          style={{
            backgroundImage: `url(${backgroundImage})`
          }}
        >
          <div className="hero-section-header-overlay" />
        </div>
      )}
      
      <h2 className="hero-main-title">
        <div className="hero-text-container">
          {enableAnimation ? (
            <FallingText
              text={pageContent.fallingText}
              highlightWords={pageContent.highlightWords}
              highlightClass="highlighted"
              colorMap={pageContent.colorMap}
              trigger="hover"
              backgroundColor="transparent"
              wireframes={false}
              gravity={0.3}
              fontSize="1.6rem"
              mouseConstraintStiffness={0.8}
              density={0.01}
              frictionAir={0.03}
              restitution={0.8}
            />
          ) : (
            <span>{pageContent.title}</span>
          )}
        </div>
      </h2>
      {pageContent.description && (
        <p className="hero-section-desc">
          {pageContent.description}
        </p>
      )}
    </header>
  );
};

export default SectionHeader; 