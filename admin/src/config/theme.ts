/**
 * @file config/theme.ts
 * @description Ant Design 主题配置
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

import type { ThemeConfig } from 'antd';

// 主题配置
export const theme: ThemeConfig = {
  token: {
    // === 颜色系统（基于 Analytics Dashboard 配色）===
    colorPrimary: '#3B82F6',      // 信任蓝
    colorSuccess: '#10B981',       // 成功绿
    colorWarning: '#F59E0B',       // 警告橙
    colorError: '#EF4444',         // 错误红
    colorInfo: '#3B82F6',          // 信息蓝
    colorLink: '#3B82F6',          // 链接色
    
    // 文本色系统
    colorText: '#1E293B',          // 主要文本
    colorTextSecondary: '#64748B', // 次要文本
    colorTextTertiary: '#94A3B8',  // 辅助文本
    colorTextQuaternary: '#CBD5E1', // 占位文本
    colorTextDisabled: '#CBD5E1',  // 禁用文本
    
    // 背景色系统
    colorBgContainer: '#FFFFFF',   // 容器背景
    colorBgElevated: '#FFFFFF',    // 浮层背景
    colorBgLayout: '#F8FAFC',      // 布局背景
    colorBgSpotlight: '#F1F5F9',   // 聚光灯背景
    colorBgMask: 'rgba(0, 0, 0, 0.45)', // 遮罩背景
    
    // 边框色系统
    colorBorder: '#E2E8F0',        // 主边框
    colorBorderSecondary: '#F1F5F9', // 次边框
    colorSplit: '#F1F5F9',         // 分割线
    
    // === 字体系统 ===
    fontFamily: "'Open Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    fontFamilyCode: "'Fira Code', 'Courier New', monospace",
    fontSize: 14,
    fontSizeLG: 16,
    fontSizeSM: 12,
    fontSizeXL: 20,
    fontSizeHeading1: 30,
    fontSizeHeading2: 24,
    fontSizeHeading3: 20,
    fontSizeHeading4: 18,
    fontSizeHeading5: 16,
    fontWeightStrong: 600,
    
    // === 行高系统 ===
    lineHeight: 1.5,
    lineHeightLG: 1.75,
    lineHeightSM: 1.25,
    lineHeightHeading1: 1.25,
    lineHeightHeading2: 1.25,
    lineHeightHeading3: 1.3,
    lineHeightHeading4: 1.4,
    lineHeightHeading5: 1.5,
    
    // === 间距系统（8px 网格）===
    padding: 16,
    paddingXS: 8,
    paddingSM: 12,
    paddingLG: 20,
    paddingXL: 24,
    margin: 16,
    marginXS: 8,
    marginSM: 12,
    marginLG: 20,
    marginXL: 24,
    
    // === 圆角系统 ===
    borderRadius: 8,
    borderRadiusLG: 12,
    borderRadiusSM: 6,
    borderRadiusXS: 4,
    borderRadiusOuter: 8,
    
    // === 阴影系统 ===
    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    boxShadowSecondary: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    boxShadowTertiary: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    
    // === 动画系统 ===
    motionDurationFast: '0.15s',
    motionDurationMid: '0.2s',
    motionDurationSlow: '0.3s',
    motionEaseInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    motionEaseOut: 'cubic-bezier(0, 0, 0.2, 1)',
    
    // === 尺寸系统 ===
    controlHeight: 32,
    controlHeightLG: 40,
    controlHeightSM: 24,
    controlHeightXS: 20,
    
    // === Z-index 系统 ===
    zIndexBase: 0,
    zIndexPopupBase: 1000,
  },
  
  components: {
    // === 布局组件 ===
    Layout: {
      headerBg: '#FFFFFF',
      headerHeight: 64,
      headerPadding: '0 24px',
      siderBg: '#FFFFFF',
      bodyBg: '#F8FAFC',
      footerBg: '#FFFFFF',
      footerPadding: '24px 50px',
      triggerBg: '#FFFFFF',
      triggerColor: '#1E293B',
      lightSiderBg: '#FFFFFF',
      lightTriggerBg: '#FFFFFF',
      lightTriggerColor: '#1E293B',
    },
    
    // === 菜单组件 ===
    Menu: {
      itemBg: 'transparent',
      itemSelectedBg: '#EFF6FF',
      itemSelectedColor: '#3B82F6',
      itemHoverBg: '#F8FAFC',
      itemActiveBg: '#DBEAFE',
      itemColor: '#333333', // TDesign 风格：主菜单使用 #333
      itemBorderRadius: 6,
      itemMarginInline: 8,
      itemPaddingInline: 12,
      iconSize: 16,
      iconMarginInlineEnd: 10,
      itemMarginBlock: 4,
      itemHeight: 40,
      collapsedIconSize: 16,
      subMenuItemBg: 'transparent',
      activeBarBorderWidth: 0, // 移除竖条
      activeBarWidth: 0, // 移除竖条
      activeBarHeight: 0, // 移除竖条
      // 子菜单样式
      groupTitleColor: '#8C8C8C', // 子菜单分组标题颜色
      groupTitleFontSize: 12,
      subMenuItemBorderRadius: 6,
    },
    
    // === 表格组件 ===
    Table: {
      headerBg: '#F8FAFC',
      headerColor: '#475569',
      headerSortActiveBg: '#F1F5F9',
      headerSortHoverBg: '#F1F5F9',
      rowHoverBg: '#F8FAFC',
      rowSelectedBg: '#EFF6FF',
      rowSelectedHoverBg: '#DBEAFE',
      borderColor: '#F1F5F9',
      headerBorderRadius: 8,
      cellPaddingBlock: 12,
      cellPaddingInline: 16,
      cellFontSize: 14,
      headerSplitColor: '#E2E8F0',
      fixedHeaderSortActiveBg: '#F1F5F9',
      fontWeightStrong: 600, // 表头字体加粗
    },
    
    // === 卡片组件 ===
    Card: {
      headerBg: 'transparent',
      headerFontSize: 18,
      headerFontSizeSM: 16,
      headerHeight: 56,
      headerHeightSM: 48,
      boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', // 添加轻微阴影
      boxShadowTertiary: '0 0 0 0 transparent',
      borderRadiusLG: 12,
      paddingLG: 24,
      padding: 20,
      paddingSM: 16,
      colorBorderSecondary: '#F1F5F9',
      colorTextHeading: '#1E293B',
    },
    
    // === 按钮组件 ===
    Button: {
      primaryShadow: '0 0 0 0 transparent', // 移除按钮阴影
      dangerShadow: '0 0 0 0 transparent',  // 移除按钮阴影
      borderRadius: 6,
      borderRadiusLG: 8,
      borderRadiusSM: 4,
      controlHeight: 32,
      controlHeightLG: 40,
      controlHeightSM: 24,
      fontWeight: 500,
      paddingContentHorizontal: 16,
      paddingContentHorizontalLG: 20,
      paddingContentHorizontalSM: 12,
    },
    
    // === 输入框组件 ===
    Input: {
      borderRadius: 6,
      controlHeight: 32,
      controlHeightLG: 40,
      controlHeightSM: 24,
      paddingBlock: 4,
      paddingInline: 11,
      paddingBlockLG: 7,
      paddingInlineLG: 11,
      paddingBlockSM: 0,
      paddingInlineSM: 7,
      activeBorderColor: '#3B82F6',
      hoverBorderColor: '#60A5FA',
      activeShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)',
      errorActiveShadow: '0 0 0 3px rgba(239, 68, 68, 0.1)',
    },
    
    // === 表单组件 ===
    Form: {
      labelFontSize: 14,
      labelColor: '#475569',
      labelRequiredMarkColor: '#EF4444',
      itemMarginBottom: 20,
    },
    
    // === 选择器组件 ===
    Select: {
      borderRadius: 6,
      controlHeight: 32,
      controlHeightLG: 40,
      controlHeightSM: 24,
    },
    
    // === 标签组件 ===
    Tag: {
      borderRadiusSM: 4,
      defaultBg: '#F1F5F9',
      defaultColor: '#64748B',
    },
    
    // === 消息提示组件 ===
    Message: {
      contentBg: '#FFFFFF',
      contentPadding: '10px 16px',
      borderRadiusLG: 8,
      colorText: '#1E293B',
      colorSuccess: '#10B981',
      colorError: '#EF4444',
      colorWarning: '#F59E0B',
      colorInfo: '#3B82F6',
    },
    
    // === 通知组件 ===
    Notification: {
      width: 384,
      borderRadiusLG: 12,
      paddingContentHorizontal: 20,
      paddingContentVertical: 16,
    },
    
    // === 模态框组件 ===
    Modal: {
      headerBg: '#FFFFFF',
      contentBg: '#FFFFFF',
      borderRadiusLG: 12,
      boxShadow: '0 4px 12px 0 rgba(0, 0, 0, 0.08)', // 保留模态框阴影（需要浮层效果）
      titleFontSize: 18,
      titleLineHeight: 1.5,
    },
    
    // === 抽屉组件 ===
    Drawer: {
      footerPaddingBlock: 16,
      footerPaddingInline: 24,
    },
    
    // === Tooltip 组件 ===
    Tooltip: {
      colorBgSpotlight: 'rgba(0, 0, 0, 0.85)',
      colorTextLightSolid: '#FFFFFF',
      borderRadius: 6,
    },
    
    // === Popover 组件 ===
    Popover: {
      colorBgElevated: '#FFFFFF',
      colorText: '#1E293B',
      borderRadiusLG: 8,
    },
    
    // === Popconfirm 组件 ===
    Popconfirm: {
      colorWarning: '#F59E0B',
    },
    
    // === 分页组件 ===
    Pagination: {
      itemActiveBg: '#3B82F6',
      itemActiveColorDisabled: '#FFFFFF',
      itemLinkBg: '#FFFFFF',
      itemBg: '#FFFFFF',
      itemSize: 32,
      itemSizeSM: 24,
      borderRadius: 6,
      itemActiveBgDisabled: '#F1F5F9',
      colorPrimary: '#3B82F6',
      colorPrimaryHover: '#60A5FA',
      colorText: '#1E293B',
      colorTextDisabled: '#CBD5E1',
    },
    
    // === 空状态组件 ===
    Empty: {
      colorTextDescription: '#94A3B8',
      fontSize: 14,
    },
    
    // === 加载组件 ===
    Spin: {
      colorPrimary: '#3B82F6',
      dotSize: 20,
      dotSizeSM: 14,
      dotSizeLG: 32,
    },
    
    // === 骨架屏组件 ===
    Skeleton: {
      colorFill: '#F1F5F9',
      colorFillContent: '#E2E8F0',
      borderRadiusSM: 4,
    },
    
    // === 开关组件 ===
    Switch: {
      trackHeight: 22,
      trackHeightSM: 16,
      trackMinWidth: 44,
      trackMinWidthSM: 28,
      handleSize: 18,
      handleSizeSM: 12,
    },
    
    // === 滑块组件 ===
    Slider: {
      railSize: 4,
      handleSize: 14,
      handleSizeHover: 16,
      dotSize: 8,
    },
  },
};
