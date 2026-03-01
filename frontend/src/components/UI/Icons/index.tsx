/**
 * @file Icons/index.tsx
 * @description 自定义图标库组件
 * @copyright 版权所有 (c) 2024 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

import React from 'react';

interface IconProps {
  size?: number;
  color?: string;
  className?: string;
  style?: React.CSSProperties;
}

// 苹果设计规范：统一图标大小
const DEFAULT_ICON_SIZE = 20;

// 搜索图标
export const IconSearch: React.FC<IconProps> = ({ 
  size = DEFAULT_ICON_SIZE, 
  color = 'currentColor', 
  className = '',
  style 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    className={className}
    style={style}
  >
    <path 
      d="M21 21L16.514 16.506M19 10.5C19 15.194 15.194 19 10.5 19C5.806 19 2 15.194 2 10.5C2 5.806 5.806 2 10.5 2C15.194 2 19 5.806 19 10.5Z" 
      stroke={color} 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
  </svg>
);

// 菜单图标
export const IconMenu: React.FC<IconProps> = ({ 
  size = DEFAULT_ICON_SIZE, 
  color = 'currentColor', 
  className = '',
  style 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    className={className}
    style={style}
  >
    <path 
      d="M4 6H20M4 12H20M4 18H20" 
      stroke={color} 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
  </svg>
);

// 实验图标
export const IconExperiment: React.FC<IconProps> = ({ 
  size = DEFAULT_ICON_SIZE, 
  color = 'currentColor', 
  className = '',
  style 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    className={className}
    style={style}
  >
    <path 
      d="M9 2V6H15V2M10.5 20.5L14.5 14.5H9.5L13.5 8.5M7 14L7.5 15.5H16.5L17 14C17.5 13 17 12 16 12H8C7 12 6.5 13 7 14Z" 
      stroke={color} 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      fill={color}
      fillOpacity="0.1"
    />
  </svg>
);

// 通用工具图标 (原车载设计图标，现在改为通用工具)
export const IconTool: React.FC<IconProps> = ({ 
  size = DEFAULT_ICON_SIZE, 
  color = 'currentColor', 
  className = '',
  style 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    className={className}
    style={style}
  >
    <path 
      d="M5 13H8M2 9L4 10L5.27064 6.18807C5.53292 5.40125 5.66405 5.00784 5.90729 4.71698C6.12208 4.46013 6.39792 4.26132 6.70951 4.13878C7.06236 4 7.47705 4 8.30643 4H15.6936C16.523 4 16.9376 4 17.2905 4.13878C17.6021 4.26132 17.8779 4.46013 18.0927 4.71698C18.3359 5.00784 18.4671 5.40125 18.7294 6.18807L20 10L22 9M16 13H19M6.8 10H17.2C18.8802 10 19.7202 10 20.362 10.327C20.9265 10.6146 21.3854 11.0735 21.673 11.638C22 12.2798 22 13.1198 22 14.8V17.5C22 17.9647 22 18.197 21.9616 18.3902C21.8038 19.1836 21.1836 19.8038 20.3902 19.9616C20.197 20 19.9647 20 19.5 20H19C17.8954 20 17 19.1046 17 18C17 17.7239 16.7761 17.5 16.5 17.5H7.5C7.22386 17.5 7 17.7239 7 18C7 19.1046 6.10457 20 5 20H4.5C4.03534 20 3.80302 20 3.60982 19.9616C2.81644 19.8038 2.19624 19.1836 2.03843 18.3902C2 18.197 2 17.9647 2 17.5V14.8C2 13.1198 2 12.2798 2.32698 11.638C2.6146 11.0735 3.07354 10.6146 3.63803 10.327C4.27976 10 5.11984 10 6.8 10Z" 
      stroke={color} 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
  </svg>
);

// 更简洁的工具图标 (用于常用工具)
export const IconTools: React.FC<IconProps> = ({ 
  size = DEFAULT_ICON_SIZE, 
  color = 'currentColor', 
  className = '',
  style 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    className={className}
    style={style}
  >
    <path 
      d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" 
      stroke={color} 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
  </svg>
);

// 教育图标
export const IconEducation: React.FC<IconProps> = ({ 
  size = DEFAULT_ICON_SIZE, 
  color = 'currentColor', 
  className = '',
  style 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    className={className}
    style={style}
  >
    <path 
      d="M22 10v6M2 10l10-5 10 5-10 5z" 
      stroke={color} 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
    <path 
      d="M6 12v5c3 3 9 3 12 0v-5" 
      stroke={color} 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
  </svg>
);

// 学习图标
export const IconLearning: React.FC<IconProps> = ({ 
  size = DEFAULT_ICON_SIZE, 
  color = 'currentColor', 
  className = '',
  style 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    className={className}
    style={style}
  >
    <path 
      d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" 
      stroke={color} 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
    <path 
      d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" 
      stroke={color} 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
  </svg>
);

// 数字孪生图标 - 恢复原始线条样式
export const IconDigital: React.FC<IconProps> = ({ 
  size = DEFAULT_ICON_SIZE, 
  color = 'currentColor', 
  className = '',
  style 
}) => (
<svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
 <path d="M5 18C3.34315 18 2 16.6569 2 15V7.8C2 6.11984 2 5.27976 2.32698 4.63803C2.6146 4.07354 3.07354 3.6146 3.63803 3.32698C4.27976 3 5.11984 3 6.8 3H17.2C18.8802 3 19.7202 3 20.362 3.32698C20.9265 3.6146 21.3854 4.07354 21.673 4.63803C22 5.27976 22 6.11984 22 7.8V15C22 16.6569 20.6569 18 19 18M8.70803 21H15.292C15.8368 21 16.1093 21 16.2467 20.8889C16.3663 20.7923 16.4347 20.6461 16.4324 20.4925C16.4298 20.3157 16.2554 20.1064 15.9065 19.6879L12.6146 15.7375C12.4035 15.4842 12.298 15.3576 12.1716 15.3114C12.0608 15.2709 11.9392 15.2709 11.8284 15.3114C11.702 15.3576 11.5965 15.4842 11.3854 15.7375L8.09346 19.6879C7.74465 20.1064 7.57024 20.3157 7.56758 20.4925C7.56526 20.6461 7.63373 20.7923 7.75326 20.8889C7.89075 21 8.16318 21 8.70803 21Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
 </svg>
);

// 设计系统图标
export const IconSystem: React.FC<IconProps> = ({ 
  size = DEFAULT_ICON_SIZE, 
  color = 'currentColor', 
  className = '',
  style 
}) => (
<svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
 <path d="M20.5 7.27783L12 12.0001M12 12.0001L3.49997 7.27783M12 12.0001L12 21.5001M21 16.0586V7.94153C21 7.59889 21 7.42757 20.9495 7.27477C20.9049 7.13959 20.8318 7.01551 20.7354 6.91082C20.6263 6.79248 20.4766 6.70928 20.177 6.54288L12.777 2.43177C12.4934 2.27421 12.3516 2.19543 12.2015 2.16454C12.0685 2.13721 11.9315 2.13721 11.7986 2.16454C11.6484 2.19543 11.5066 2.27421 11.223 2.43177L3.82297 6.54288C3.52345 6.70928 3.37369 6.79248 3.26463 6.91082C3.16816 7.01551 3.09515 7.13959 3.05048 7.27477C3 7.42757 3 7.59889 3 7.94153V16.0586C3 16.4013 3 16.5726 3.05048 16.7254C3.09515 16.8606 3.16816 16.9847 3.26463 17.0893C3.37369 17.2077 3.52345 17.2909 3.82297 17.4573L11.223 21.5684C11.5066 21.726 11.6484 21.8047 11.7986 21.8356C11.9315 21.863 12.0685 21.863 12.2015 21.8356C12.3516 21.8047 12.4934 21.726 12.777 21.5684L20.177 17.4573C20.4766 17.2909 20.6263 17.2077 20.7354 17.0893C20.8318 16.9847 20.9049 16.8606 20.9495 16.7254C21 16.5726 21 16.4013 21 16.0586Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
 </svg>
);

// 设计团队图标 - 恢复原始线条样式
export const IconDesignTeam: React.FC<IconProps> = ({ 
  size = DEFAULT_ICON_SIZE, 
  color = 'currentColor', 
  className = '',
  style 
}) => (
<svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
 <path d="M15 9H15.01M9 9H9.01M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12ZM15.5 9C15.5 9.27614 15.2761 9.5 15 9.5C14.7239 9.5 14.5 9.27614 14.5 9C14.5 8.72386 14.7239 8.5 15 8.5C15.2761 8.5 15.5 8.72386 15.5 9ZM9.5 9C9.5 9.27614 9.27614 9.5 9 9.5C8.72386 9.5 8.5 9.27614 8.5 9C8.5 8.72386 8.72386 8.5 9 8.5C9.27614 8.5 9.5 8.72386 9.5 9ZM12 17.5C14.5005 17.5 16.5 15.667 16.5 14H7.5C7.5 15.667 9.4995 17.5 12 17.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
 </svg>
);

// 车载UI图标 - 恢复原始线条样式
export const IconCarUI: React.FC<IconProps> = ({ 
  size = DEFAULT_ICON_SIZE, 
  color = 'currentColor', 
  className = '',
  style 
}) => (
<svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
 <path d="M5 13H8M2 9L4 10L5.27064 6.18807C5.53292 5.40125 5.66405 5.00784 5.90729 4.71698C6.12208 4.46013 6.39792 4.26132 6.70951 4.13878C7.06236 4 7.47705 4 8.30643 4H15.6936C16.523 4 16.9376 4 17.2905 4.13878C17.6021 4.26132 17.8779 4.46013 18.0927 4.71698C18.3359 5.00784 18.4671 5.40125 18.7294 6.18807L20 10L22 9M16 13H19M6.8 10H17.2C18.8802 10 19.7202 10 20.362 10.327C20.9265 10.6146 21.3854 11.0735 21.673 11.638C22 12.2798 22 13.1198 22 14.8V17.5C22 17.9647 22 18.197 21.9616 18.3902C21.8038 19.1836 21.1836 19.8038 20.3902 19.9616C20.197 20 19.9647 20 19.5 20H19C17.8954 20 17 19.1046 17 18C17 17.7239 16.7761 17.5 16.5 17.5H7.5C7.22386 17.5 7 17.7239 7 18C7 19.1046 6.10457 20 5 20H4.5C4.03534 20 3.80302 20 3.60982 19.9616C2.81644 19.8038 2.19624 19.1836 2.03843 18.3902C2 18.197 2 17.9647 2 17.5V14.8C2 13.1198 2 12.2798 2.32698 11.638C2.6146 11.0735 3.07354 10.6146 3.63803 10.327C4.27976 10 5.11984 10 6.8 10Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
 </svg>
);

// 书籍图标
export const IconBook: React.FC<IconProps> = ({ 
  size = DEFAULT_ICON_SIZE, 
  color = 'currentColor', 
  className = '',
  style 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    className={className}
    style={style}
  >
    <path 
      d="M4 19.5C4 18.1193 5.11929 17 6.5 17H20V21C20 21.5523 19.5523 22 19 22H6.5C5.11929 22 4 20.8807 4 19.5ZM4 19.5V4C4 3.44772 4.44772 3 5 3H19C19.5523 3 20 3.44772 20 4V17M9 7H15M9 11H15" 
      stroke={color} 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
  </svg>
);

// 代码图标
export const IconCode: React.FC<IconProps> = ({ 
  size = DEFAULT_ICON_SIZE, 
  color = 'currentColor', 
  className = '',
  style 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    className={className}
    style={style}
  >
    <path 
      d="M16 18L22 12L16 6M8 6L2 12L8 18" 
      stroke={color} 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
  </svg>
);

// AI工具图标
export const IconAI: React.FC<IconProps> = ({ size = DEFAULT_ICON_SIZE, color = 'currentColor', className = '', style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={style}>
    <path d="M12 2L15.09 8.26L22 9L17 14L18.18 21L12 17.77L5.82 21L7 14L2 9L8.91 8.26L12 2Z" 
          fill={color} stroke={color} strokeWidth="1"/>
    <circle cx="12" cy="12" r="3" fill="white"/>
  </svg>
);

// 设计工具图标
export const IconDesign: React.FC<IconProps> = ({ size = DEFAULT_ICON_SIZE, color = 'currentColor', className = '', style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={style}>
    <path d="M12 2L2 7V17L12 22L22 17V7L12 2Z" stroke={color} strokeWidth="2" fill="none"/>
    <path d="M2 7L12 12L22 7" stroke={color} strokeWidth="2"/>
    <path d="M12 22V12" stroke={color} strokeWidth="2"/>
    <circle cx="12" cy="9" r="2" fill={color}/>
  </svg>
);

// UI设计图标
export const IconUI: React.FC<IconProps> = ({ size = DEFAULT_ICON_SIZE, color = 'currentColor', className = '', style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={style}>
    <rect x="3" y="4" width="18" height="14" rx="2" stroke={color} strokeWidth="2" fill="none"/>
    <rect x="6" y="8" width="4" height="2" fill={color}/>
    <rect x="12" y="8" width="6" height="2" fill={color}/>
    <rect x="6" y="12" width="8" height="2" fill={color}/>
  </svg>
);

// 图标库图标
export const IconIcons: React.FC<IconProps> = ({ size = DEFAULT_ICON_SIZE, color = 'currentColor', className = '', style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={style}>
    <circle cx="7" cy="7" r="3" stroke={color} strokeWidth="2" fill="none"/>
    <circle cx="17" cy="7" r="3" stroke={color} strokeWidth="2" fill="none"/>
    <circle cx="7" cy="17" r="3" stroke={color} strokeWidth="2" fill="none"/>
    <circle cx="17" cy="17" r="3" stroke={color} strokeWidth="2" fill="none"/>
    <path d="M7 10V14" stroke={color} strokeWidth="2"/>
    <path d="M10 7H14" stroke={color} strokeWidth="2"/>
    <path d="M17 10V14" stroke={color} strokeWidth="2"/>
    <path d="M10 17H14" stroke={color} strokeWidth="2"/>
  </svg>
);

// 字体图标
export const IconFont: React.FC<IconProps> = ({ size = DEFAULT_ICON_SIZE, color = 'currentColor', className = '', style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={style}>
    <path d="M4 4H20V6H18V20H16V6H8V20H6V6H4V4Z" fill={color}/>
    <path d="M8 10H16V12H8V10Z" fill={color}/>
    <path d="M10 14H14V16H10V14Z" fill={color}/>
  </svg>
);

// 配色图标
export const IconColor: React.FC<IconProps> = ({ size = DEFAULT_ICON_SIZE, color = 'currentColor', className = '', style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={style}>
    <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" fill="none"/>
    <path d="M12 2C16.97 2 21 6.03 21 11C21 13.76 19.24 16 17 16H15.5C14.67 16 14 16.67 14 17.5S14.67 19 15.5 19H17C19.76 19 22 16.76 22 14C22 6.27 16.73 1 12 1V2Z" 
          fill={color}/>
    <circle cx="6.5" cy="8.5" r="1.5" fill="#FF6B6B"/>
    <circle cx="8.5" cy="14.5" r="1.5" fill="#4ECDC4"/>
    <circle cx="15.5" cy="8.5" r="1.5" fill="#45B7D1"/>
    <circle cx="17.5" cy="13.5" r="1.5" fill="#96CEB4"/>
  </svg>
);

// 灵感图标
export const IconInspiration: React.FC<IconProps> = ({ size = DEFAULT_ICON_SIZE, color = 'currentColor', className = '', style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={style}>
    <path d="M12 2L15.5 8H20L16 12L17.5 18L12 15L6.5 18L8 12L4 8H8.5L12 2Z" 
          stroke={color} strokeWidth="2" fill="none"/>
    <circle cx="12" cy="10" r="2" fill={color}/>
  </svg>
);

// 资源图标
export const IconResource: React.FC<IconProps> = ({ size = DEFAULT_ICON_SIZE, color = 'currentColor', className = '', style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={style}>
    <rect x="3" y="3" width="18" height="18" rx="2" stroke={color} strokeWidth="2" fill="none"/>
    <rect x="7" y="7" width="3" height="3" fill={color}/>
    <rect x="14" y="7" width="3" height="3" fill={color}/>
    <rect x="7" y="14" width="3" height="3" fill={color}/>
    <rect x="14" y="14" width="3" height="3" fill={color}/>
  </svg>
);

// 教程图标
export const IconTutorial: React.FC<IconProps> = ({ size = DEFAULT_ICON_SIZE, color = 'currentColor', className = '', style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={style}>
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" stroke={color} strokeWidth="2" fill="none"/>
    <path d="M6.5 2H20V22H6.5A2.5 2.5 0 0 1 4 19.5V4.5A2.5 2.5 0 0 1 6.5 2Z" 
          stroke={color} strokeWidth="2" fill="none"/>
    <path d="M8 7H16" stroke={color} strokeWidth="2"/>
    <path d="M8 11H16" stroke={color} strokeWidth="2"/>
    <path d="M8 15H12" stroke={color} strokeWidth="2"/>
  </svg>
);

// 原型工具图标
export const IconPrototype: React.FC<IconProps> = ({ size = DEFAULT_ICON_SIZE, color = 'currentColor', className = '', style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={style}>
    <rect x="3" y="6" width="6" height="4" rx="1" stroke={color} strokeWidth="2" fill="none"/>
    <rect x="15" y="6" width="6" height="4" rx="1" stroke={color} strokeWidth="2" fill="none"/>
    <rect x="9" y="14" width="6" height="4" rx="1" stroke={color} strokeWidth="2" fill="none"/>
    <path d="M9 8H15" stroke={color} strokeWidth="2"/>
    <path d="M12 10V14" stroke={color} strokeWidth="2"/>
    <path d="M15 8L9 16" stroke={color} strokeWidth="2"/>
  </svg>
);

// 套件图标
export const IconKit: React.FC<IconProps> = ({ size = DEFAULT_ICON_SIZE, color = 'currentColor', className = '', style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={style}>
    <rect x="2" y="2" width="8" height="8" rx="1" stroke={color} strokeWidth="2" fill="none"/>
    <rect x="14" y="2" width="8" height="8" rx="1" stroke={color} strokeWidth="2" fill="none"/>
    <rect x="2" y="14" width="8" height="8" rx="1" stroke={color} strokeWidth="2" fill="none"/>
    <rect x="14" y="14" width="8" height="8" rx="1" stroke={color} strokeWidth="2" fill="none"/>
    <circle cx="6" cy="6" r="1" fill={color}/>
    <circle cx="18" cy="6" r="1" fill={color}/>
    <circle cx="6" cy="18" r="1" fill={color}/>
    <circle cx="18" cy="18" r="1" fill={color}/>
  </svg>
);

// 平面设计图标
export const IconGraphic: React.FC<IconProps> = ({ size = DEFAULT_ICON_SIZE, color = 'currentColor', className = '', style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={style}>
    <rect x="2" y="3" width="20" height="18" rx="2" stroke={color} strokeWidth="2" fill="none"/>
    <circle cx="8" cy="9" r="2" stroke={color} strokeWidth="2" fill="none"/>
    <path d="M2 18L8 12L13 17L22 8" stroke={color} strokeWidth="2" fill="none"/>
  </svg>
);

// 网页设计图标
export const IconWeb: React.FC<IconProps> = ({ size = DEFAULT_ICON_SIZE, color = 'currentColor', className = '', style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={style}>
    <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" fill="none"/>
    <path d="M2 12H22" stroke={color} strokeWidth="2"/>
    <path d="M12 2C14.5 4.5 16 8 16 12S14.5 19.5 12 22C9.5 19.5 8 16 8 12S9.5 4.5 12 2Z" 
          stroke={color} strokeWidth="2" fill="none"/>
  </svg>
);

// 视频图标
export const IconVideo: React.FC<IconProps> = ({ size = DEFAULT_ICON_SIZE, color = 'currentColor', className = '', style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={style}>
    <rect x="2" y="4" width="20" height="16" rx="2" stroke={color} strokeWidth="2" fill="none"/>
    <polygon points="10,9 15,12 10,15" fill={color}/>
  </svg>
);

// 音频图标
export const IconAudio: React.FC<IconProps> = ({ size = DEFAULT_ICON_SIZE, color = 'currentColor', className = '', style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={style}>
    <path d="M9 18V5L21 2V16" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="6" cy="18" r="3" stroke={color} strokeWidth="2" fill="none"/>
    <circle cx="18" cy="16" r="3" stroke={color} strokeWidth="2" fill="none"/>
  </svg>
);

// 图片图标
export const IconImage: React.FC<IconProps> = ({ size = DEFAULT_ICON_SIZE, color = 'currentColor', className = '', style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={style}>
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" stroke={color} strokeWidth="2" fill="none"/>
    <circle cx="8.5" cy="8.5" r="1.5" fill={color}/>
    <path d="M21 15L16 10L5 21" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// 动画图标
export const IconAnimation: React.FC<IconProps> = ({ size = DEFAULT_ICON_SIZE, color = 'currentColor', className = '', style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={style}>
    <circle cx="12" cy="12" r="3" stroke={color} strokeWidth="2" fill="none"/>
    <circle cx="12" cy="12" r="7" stroke={color} strokeWidth="2" fill="none" strokeDasharray="4 4"/>
    <circle cx="12" cy="12" r="11" stroke={color} strokeWidth="1" fill="none" strokeDasharray="2 6"/>
  </svg>
);

// 社区图标
export const IconCommunity: React.FC<IconProps> = ({ size = DEFAULT_ICON_SIZE, color = 'currentColor', className = '', style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={style}>
    <path d="M17 21V19C17 17.9 16.1 17 15 17H9C7.9 17 7 17.9 7 19V21" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="12" cy="11" r="4" stroke={color} strokeWidth="2" fill="none"/>
    <path d="M23 21V19C23 18.1 22.3 17.4 21.4 17.1" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M16.5 3.1C17.4 3.4 18 4.1 18 5S17.4 6.6 16.5 6.9" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M1 21V19C1 18.1 1.7 17.4 2.6 17.1" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M7.5 3.1C6.6 3.4 6 4.1 6 5S6.6 6.6 7.5 6.9" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// 规范图标
export const IconSpecs: React.FC<IconProps> = ({ size = DEFAULT_ICON_SIZE, color = 'currentColor', className = '', style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={style}>
    <rect x="3" y="3" width="18" height="18" rx="2" stroke={color} strokeWidth="2" fill="none"/>
    <path d="M8 8H16" stroke={color} strokeWidth="2"/>
    <path d="M8 12H16" stroke={color} strokeWidth="2"/>
    <path d="M8 16H12" stroke={color} strokeWidth="2"/>
    <circle cx="6" cy="8" r="1" fill={color}/>
    <circle cx="6" cy="12" r="1" fill={color}/>
    <circle cx="6" cy="16" r="1" fill={color}/>
  </svg>
);

// 移动端图标
export const IconMobile: React.FC<IconProps> = ({ size = DEFAULT_ICON_SIZE, color = 'currentColor', className = '', style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={style}>
    <rect x="5" y="2" width="14" height="20" rx="2" ry="2" stroke={color} strokeWidth="2" fill="none"/>
    <path d="M12 18H12.01" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// 数据图标
export const IconData: React.FC<IconProps> = ({ size = DEFAULT_ICON_SIZE, color = 'currentColor', className = '', style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={style}>
    <ellipse cx="12" cy="5" rx="9" ry="3" stroke={color} strokeWidth="2" fill="none"/>
    <path d="M21 12C21 13.66 16.97 15 12 15S3 13.66 3 12" stroke={color} strokeWidth="2"/>
    <path d="M3 5V19C3 20.66 7.03 22 12 22S21 20.66 21 19V5" stroke={color} strokeWidth="2"/>
  </svg>
);

// 博客图标
export const IconBlog: React.FC<IconProps> = ({ size = DEFAULT_ICON_SIZE, color = 'currentColor', className = '', style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={style}>
    <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" 
          stroke={color} strokeWidth="2" fill="none"/>
    <path d="M19.4 15C19.1277 15.8031 19.2583 16.7045 19.7294 17.4223C20.2005 18.1401 20.9674 18.5839 21.8 18.6C21.9239 19.0207 21.9659 19.4622 21.9212 19.8973C21.8766 20.3325 21.7467 20.752 21.54 21.13C20.9479 22.1412 19.8542 22.736 18.7 22.75C17.7999 22.7473 16.9359 22.3989 16.28 21.77L15.85 21.34C15.7526 21.2375 15.6026 21.1804 15.445 21.1804C15.2874 21.1804 15.1374 21.2375 15.04 21.34L14.62 21.77C13.9621 22.3998 13.0966 22.7489 12.195 22.75C11.2934 22.7511 10.4272 22.4032 9.77 21.77L9.33 21.34C9.2326 21.2375 9.0826 21.1804 8.92504 21.1804C8.76748 21.1804 8.61748 21.2375 8.52004 21.34L8.09004 21.77C7.43312 22.4009 6.5691 22.7493 5.67004 22.75C4.51933 22.7298 3.42836 22.1321 2.84004 21.12C2.6307 20.7447 2.49865 20.3273 2.45294 19.8935C2.40723 19.4598 2.44766 19.0194 2.57004 18.6C3.40258 18.5839 4.16954 18.1401 4.64065 17.4223C5.11175 16.7045 5.24231 15.8031 4.97004 15C5.24231 14.1969 5.11175 13.2955 4.64065 12.5777C4.16954 11.8599 3.40258 11.4161 2.57004 11.4C2.44766 10.9806 2.40723 10.5402 2.45294 10.1065C2.49865 9.67273 2.6307 9.25526 2.84004 8.88C3.43168 7.86696 4.52674 7.26894 5.68004 7.25C6.57992 7.25345 7.44377 7.60212 8.10004 8.23L8.53004 8.66C8.62748 8.76249 8.77748 8.81961 8.93504 8.81961C9.0926 8.81961 9.2426 8.76249 9.34004 8.66L9.77004 8.23C10.4279 7.60015 11.2934 7.25114 12.195 7.25C13.0966 7.24886 13.9628 7.59681 14.62 8.23L15.05 8.66C15.1474 8.76249 15.2974 8.81961 15.455 8.81961C15.6126 8.81961 15.7626 8.76249 15.86 8.66L16.29 8.23C16.9459 7.60107 17.8099 7.25258 18.71 7.25C19.8607 7.27019 20.9516 7.86787 21.54 8.88C21.7493 9.25526 21.8814 9.67273 21.9271 10.1065C21.9728 10.5402 21.9324 10.9806 21.81 11.4C20.9775 11.4161 20.2105 11.8599 19.7394 12.5777C19.2683 13.2955 19.1377 14.1969 19.41 15H19.4Z" 
          stroke={color} strokeWidth="2" fill="none"/>
  </svg>
);

// 素材图标
export const IconMaterial: React.FC<IconProps> = ({ size = DEFAULT_ICON_SIZE, color = 'currentColor', className = '', style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={style}>
    <path d="M4 21.4V2.6C4 2.26863 4.26863 2 4.6 2H16L20 6V21.4C20 21.7314 19.7314 22 19.4 22H4.6C4.26863 22 4 21.7314 4 21.4Z" 
          stroke={color} strokeWidth="2" fill="none"/>
    <path d="M16 2V6H20" stroke={color} strokeWidth="2" fill="none"/>
    <path d="M8 10H16" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    <path d="M8 14H16" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    <path d="M8 18H12" stroke={color} strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

// 模板图标
export const IconTemplate: React.FC<IconProps> = ({ size = DEFAULT_ICON_SIZE, color = 'currentColor', className = '', style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={style}>
    <rect x="3" y="3" width="18" height="18" rx="2" stroke={color} strokeWidth="2" fill="none"/>
    <path d="M3 9H21" stroke={color} strokeWidth="2"/>
    <path d="M9 9V21" stroke={color} strokeWidth="2"/>
    <circle cx="6" cy="6" r="1" fill={color}/>
    <circle cx="10" cy="6" r="1" fill={color}/>
    <circle cx="14" cy="6" r="1" fill={color}/>
  </svg>
);

// 3D设计图标
export const Icon3D: React.FC<IconProps> = ({ size = DEFAULT_ICON_SIZE, color = 'currentColor', className = '', style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={style}>
    <path d="M12 3L2 9L12 15L22 9L12 3Z" stroke={color} strokeWidth="2" fill="none"/>
    <path d="M2 9V15L12 21L22 15V9" stroke={color} strokeWidth="2" fill="none"/>
    <path d="M12 15V21" stroke={color} strokeWidth="2"/>
    <path d="M7 11.5V16.5" stroke={color} strokeWidth="2"/>
    <path d="M17 11.5V16.5" stroke={color} strokeWidth="2"/>
  </svg>
);

// 品牌设计图标
export const IconBrand: React.FC<IconProps> = ({ size = DEFAULT_ICON_SIZE, color = 'currentColor', className = '', style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={style}>
    <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" fill="none"/>
    <path d="M8 11L10 13L16 7" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 6L15 9L12 12L9 9L12 6Z" fill={color}/>
  </svg>
);

// 电商图标
export const IconEcommerce: React.FC<IconProps> = ({ size = DEFAULT_ICON_SIZE, color = 'currentColor', className = '', style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={style}>
    <path d="M3 5H5L5.4 7M5.4 7L7 14H17L19 7H5.4Z" stroke={color} strokeWidth="2" fill="none"/>
    <circle cx="9" cy="19" r="2" stroke={color} strokeWidth="2" fill="none"/>
    <circle cx="15" cy="19" r="2" stroke={color} strokeWidth="2" fill="none"/>
  </svg>
);

// 插件图标
export const IconPlugin: React.FC<IconProps> = ({ size = DEFAULT_ICON_SIZE, color = 'currentColor', className = '', style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={style}>
    <path d="M4 6H20C21.1 6 22 6.9 22 8V16C22 17.1 21.1 18 20 18H4C2.9 18 2 17.1 2 16V8C2 6.9 2.9 6 4 6Z" 
          stroke={color} strokeWidth="2" fill="none"/>
    <path d="M15 10H18C18.6 10 19 10.4 19 11V13C19 13.6 18.6 14 18 14H15V10Z" fill={color}/>
    <circle cx="7" cy="12" r="2" stroke={color} strokeWidth="2" fill="none"/>
    <path d="M11 12H13" stroke={color} strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

// 开发者图标
export const IconDeveloper: React.FC<IconProps> = ({ size = DEFAULT_ICON_SIZE, color = 'currentColor', className = '', style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={style}>
    <path d="M7 8L3 12L7 16M17 8L21 12L17 16" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M10 20L14 4" stroke={color} strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

// 学习图标
export const IconLearn: React.FC<IconProps> = ({ size = DEFAULT_ICON_SIZE, color = 'currentColor', className = '', style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={style}>
    <path d="M2 17L12 22L22 17M2 12L12 17L22 12M12 2L2 7L12 12L22 7L12 2Z" 
          stroke={color} strokeWidth="2" fill="none"/>
  </svg>
);

// 照片图标
export const IconPhoto: React.FC<IconProps> = ({ size = DEFAULT_ICON_SIZE, color = 'currentColor', className = '', style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={style}>
    <rect x="3" y="3" width="18" height="18" rx="2" stroke={color} strokeWidth="2" fill="none"/>
    <circle cx="8.5" cy="8.5" r="2.5" fill={color}/>
    <path d="M21 15L16 10L5 21" stroke={color} strokeWidth="2"/>
  </svg>
);

// 艺术图标
export const IconArt: React.FC<IconProps> = ({ size = DEFAULT_ICON_SIZE, color = 'currentColor', className = '', style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={style}>
    <circle cx="12" cy="12" r="3" fill={color}/>
    <path d="M12 2V6M12 18V22M22 12H18M6 12H2M19.07 19.07L16.24 16.24M19.07 4.93L16.24 7.76M4.93 19.07L7.76 16.24M4.93 4.93L7.76 7.76" 
          stroke={color} strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

// 印刷图标
export const IconPrint: React.FC<IconProps> = ({ size = DEFAULT_ICON_SIZE, color = 'currentColor', className = '', style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={style}>
    <path d="M6 9V2H18V9M6 18H4C3.46957 18 2.96086 17.7893 2.58579 17.4142C2.21071 17.0391 2 16.5304 2 16V11C2 10.4696 2.21071 9.96086 2.58579 9.58579C2.96086 9.21071 3.46957 9 4 9H20C20.5304 9 21.0391 9.21071 21.4142 9.58579C21.7893 9.96086 22 10.4696 22 11V16C22 16.5304 21.7893 17.0391 21.4142 17.4142C21.0391 17.7893 20.5304 18 20 18H18" 
          stroke={color} strokeWidth="2" fill="none"/>
    <path d="M6 14H18V22H6V14Z" stroke={color} strokeWidth="2" fill="none"/>
  </svg>
);

// 分析图标
export const IconAnalytics: React.FC<IconProps> = ({ size = DEFAULT_ICON_SIZE, color = 'currentColor', className = '', style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={style}>
    <path d="M21 21H4.6C4.03995 21 3.75992 21 3.54601 20.891C3.35785 20.7951 3.20487 20.6422 3.10899 20.454C3 20.2401 3 19.9601 3 19.4V3M20 16L16 12L12 16L8 12L4 16" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M21 10L17 6L13 10L9 6L5 10" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// 可视化图标
export const IconVisualization: React.FC<IconProps> = ({ size = DEFAULT_ICON_SIZE, color = 'currentColor', className = '', style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={style}>
    <rect x="3" y="3" width="18" height="18" rx="2" stroke={color} strokeWidth="2" fill="none"/>
    <path d="M8 17L8 13" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    <path d="M12 17L12 7" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    <path d="M16 17L16 10" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    <circle cx="8" cy="10" r="2" fill={color}/>
    <circle cx="12" cy="4" r="2" fill={color}/>
    <circle cx="16" cy="7" r="2" fill={color}/>
  </svg>
);

// Figma图标
export const IconFigma: React.FC<IconProps> = ({ size = DEFAULT_ICON_SIZE, color = 'currentColor', className = '', style }) => (
<svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
 <path d="M12 1.5H8.5C6.567 1.5 5 3.067 5 5C5 6.933 6.567 8.5 8.5 8.5M12 1.5V8.5M12 1.5H15.5C17.433 1.5 19 3.067 19 5C19 6.933 17.433 8.5 15.5 8.5M12 8.5H8.5M12 8.5V15.5M12 8.5H15.5M8.5 8.5C6.567 8.5 5 10.067 5 12C5 13.933 6.567 15.5 8.5 15.5M12 15.5H8.5M12 15.5V19C12 20.933 10.433 22.5 8.5 22.5C6.567 22.5 5 20.933 5 19C5 17.067 6.567 15.5 8.5 15.5C10.433 15.5 12 13.933 12 12C12 10.067 13.567 8.5 15.5 8.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
 </svg>
);

// 汽车图标
export const IconCar: React.FC<IconProps> = ({ size = DEFAULT_ICON_SIZE, color = 'currentColor', className = '', style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={style}>
    <path d="M5 11L6.5 6.5H17.5L19 11M14 17H19V14.5L19.5 11.5H4.5L5 14.5V17H6.5" 
          stroke={color} strokeWidth="2" fill="none"/>
    <circle cx="7.5" cy="14" r="1.5" fill={color}/>
    <circle cx="16.5" cy="14" r="1.5" fill={color}/>
  </svg>
);

// 游戏UI图标
export const IconGameUI: React.FC<IconProps> = ({ size = DEFAULT_ICON_SIZE, color = 'currentColor', className = '', style }) => (
<svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
 <path d="M5.99989 11H9.99989M7.99989 9V13M14.9999 12H15.0099M17.9999 10H18.0099M10.4488 5H13.5509C16.1758 5 17.4883 5 18.5184 5.49743C19.4254 5.9354 20.179 6.63709 20.6805 7.51059C21.2501 8.5027 21.3436 9.81181 21.5306 12.43L21.7766 15.8745C21.8973 17.5634 20.5597 19 18.8664 19C18.0005 19 17.1794 18.6154 16.6251 17.9502L16.2499 17.5C15.9068 17.0882 15.7351 16.8823 15.5398 16.7159C15.1302 16.3672 14.6344 16.1349 14.1043 16.0436C13.8514 16 13.5834 16 13.0473 16H10.9525C10.4164 16 10.1484 16 9.89553 16.0436C9.36539 16.1349 8.86957 16.3672 8.46 16.7159C8.26463 16.8823 8.09305 17.0882 7.74989 17.5L7.37473 17.9502C6.8204 18.6154 5.99924 19 5.13335 19C3.44013 19 2.1025 17.5634 2.22314 15.8745L2.46918 12.43C2.65619 9.81181 2.7497 8.5027 3.31926 7.51059C3.82074 6.63709 4.57433 5.9354 5.48135 5.49743C6.51151 5 7.82396 5 10.4488 5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
 </svg>
);

// 元宇宙与VR/AR设计图标
export const IconMetaverse: React.FC<IconProps> = ({ size = DEFAULT_ICON_SIZE, color = 'currentColor', className = '', style }) => (
<svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
 <path d="M17.8779 20.0899C16.1694 21.3312 14.1118 21.9998 12 21.9998C9.88821 21.9998 7.83063 21.3312 6.12215 20.0899M16.3837 3.01182C18.2818 3.93756 19.8381 5.44044 20.8295 7.30504C21.8209 9.16964 22.1966 11.3002 21.9027 13.3915M2.09742 13.3914C1.80352 11.3002 2.1792 9.16955 3.17063 7.30494C4.16205 5.44034 5.71832 3.93747 7.61639 3.01172M17.5 11.9998C17.5 15.0373 15.0376 17.4998 12 17.4998C8.96244 17.4998 6.50001 15.0373 6.50001 11.9998C6.50001 8.96219 8.96244 6.49976 12 6.49976C15.0376 6.49976 17.5 8.96219 17.5 11.9998Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
 </svg>
);

// AI设计图标
export const IconAIDesign: React.FC<IconProps> = ({ size = DEFAULT_ICON_SIZE, color = 'currentColor', className = '', style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={style}>
    <path d="M12 2L15.09 8.26L22 9L17 14L18.18 21L12 17.77L5.82 21L7 14L2 9L8.91 8.26L12 2Z" 
          stroke={color} strokeWidth="2" fill="none"/>
    <circle cx="12" cy="12" r="3" stroke={color} strokeWidth="2" fill="none"/>
    <path d="M12 9V15" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    <path d="M9 12H15" stroke={color} strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

// 其他内容图标
export const IconOtherContent: React.FC<IconProps> = ({ size = DEFAULT_ICON_SIZE, color = 'currentColor', className = '', style }) => (
<svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
 <path d="M21 11L13.4059 3.40589C12.887 2.88703 12.6276 2.6276 12.3249 2.44208C12.0564 2.27759 11.7638 2.15638 11.4577 2.08289C11.1124 2 10.7455 2 10.0118 2L6 2M3 8.7L3 10.6745C3 11.1637 3 11.4083 3.05526 11.6385C3.10425 11.8425 3.18506 12.0376 3.29472 12.2166C3.4184 12.4184 3.59136 12.5914 3.93726 12.9373L11.7373 20.7373C12.5293 21.5293 12.9253 21.9253 13.382 22.0737C13.7837 22.2042 14.2163 22.2042 14.618 22.0737C15.0747 21.9253 15.4707 21.5293 16.2627 20.7373L18.7373 18.2627C19.5293 17.4707 19.9253 17.0747 20.0737 16.618C20.2042 16.2163 20.2042 15.7837 20.0737 15.382C19.9253 14.9253 19.5293 14.5293 18.7373 13.7373L11.4373 6.43726C11.0914 6.09136 10.9184 5.9184 10.7166 5.79472C10.5376 5.68506 10.3425 5.60425 10.1385 5.55526C9.90829 5.5 9.6637 5.5 9.17452 5.5H6.2C5.0799 5.5 4.51984 5.5 4.09202 5.71799C3.7157 5.90973 3.40973 6.21569 3.21799 6.59202C3 7.01984 3 7.57989 3 8.7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
 </svg>
);

// ============ 电商相关图标 ============
// 店铺图标
export const IconStore: React.FC<IconProps> = ({ size = DEFAULT_ICON_SIZE, color = 'currentColor', className = '', style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={style}>
    <path d="M3 7V5C3 3.89543 3.89543 3 5 3H19C20.1046 3 21 3.89543 21 5V7" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M3 7H21V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V7Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M8 11V17" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M16 11V17" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 11V17" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// 相机图标
export const IconCamera: React.FC<IconProps> = ({ size = DEFAULT_ICON_SIZE, color = 'currentColor', className = '', style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={style}>
    <path d="M14.5 4H9.5L7 7H4C2.89543 7 2 7.89543 2 9V18C2 19.1046 2.89543 20 4 20H20C21.1046 20 22 19.1046 22 18V9C22 7.89543 21.1046 7 20 7H17L14.5 4Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="12" cy="13" r="3" stroke={color} strokeWidth="2"/>
  </svg>
);

// 布局图标
export const IconLayout: React.FC<IconProps> = ({ size = DEFAULT_ICON_SIZE, color = 'currentColor', className = '', style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={style}>
    <rect x="3" y="3" width="18" height="18" rx="2" stroke={color} strokeWidth="2"/>
    <path d="M9 9H15V15H9V9Z" stroke={color} strokeWidth="2"/>
    <path d="M9 3V9" stroke={color} strokeWidth="2"/>
    <path d="M15 9V21" stroke={color} strokeWidth="2"/>
    <path d="M9 15V21" stroke={color} strokeWidth="2"/>
    <path d="M3 9H9" stroke={color} strokeWidth="2"/>
    <path d="M15 9H21" stroke={color} strokeWidth="2"/>
  </svg>
);

// 营销图标
export const IconMarketing: React.FC<IconProps> = ({ size = DEFAULT_ICON_SIZE, color = 'currentColor', className = '', style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={style}>
    <path d="M3 11L18.5 2.5C19.6046 2 21 2.89543 21 4.5V11.5C21 13.1046 19.6046 14 18.5 13.5L3 11Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M11 11V17C11 18.1046 10.1046 19 9 19H7C5.89543 19 5 18.1046 5 17V11" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M3 11H21" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// 平台图标
export const IconPlatform: React.FC<IconProps> = ({ size = DEFAULT_ICON_SIZE, color = 'currentColor', className = '', style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={style}>
    <rect x="2" y="3" width="20" height="14" rx="2" stroke={color} strokeWidth="2"/>
    <path d="M8 21H16" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 17V21" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="7" cy="8" r="1" fill={color}/>
    <circle cx="12" cy="8" r="1" fill={color}/>
    <circle cx="17" cy="8" r="1" fill={color}/>
    <path d="M6 12H18" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// 直播图标
export const IconLiveStreaming: React.FC<IconProps> = ({ size = DEFAULT_ICON_SIZE, color = 'currentColor', className = '', style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={style}>
    <circle cx="12" cy="12" r="3" stroke={color} strokeWidth="2"/>
    <path d="M12 1V3" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 21V23" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M4.22 4.22L5.64 5.64" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M18.36 18.36L19.78 19.78" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M1 12H3" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M21 12H23" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M4.22 19.78L5.64 18.36" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M18.36 5.64L19.78 4.22" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// 客户服务图标
export const IconCustomerService: React.FC<IconProps> = ({ size = DEFAULT_ICON_SIZE, color = 'currentColor', className = '', style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={style}>
    <path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M8 9H16" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M8 13H14" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// 库存管理图标
export const IconInventory: React.FC<IconProps> = ({ size = DEFAULT_ICON_SIZE, color = 'currentColor', className = '', style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={style}>
    <path d="M16 4H18C19.1046 4 20 4.89543 20 6V18C20 19.1046 19.1046 20 18 20H6C4.89543 20 4 19.1046 4 18V6C4 4.89543 4.89543 4 6 4H8" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <rect x="8" y="2" width="8" height="4" rx="1" stroke={color} strokeWidth="2"/>
    <path d="M9 12L11 14L15 10" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// 支付处理图标
export const IconPayment: React.FC<IconProps> = ({ size = DEFAULT_ICON_SIZE, color = 'currentColor', className = '', style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={style}>
    <rect x="1" y="4" width="22" height="16" rx="2" stroke={color} strokeWidth="2"/>
    <path d="M1 10H23" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M7 15H9" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M13 15H17" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// 自动化图标
export const IconAutomation: React.FC<IconProps> = ({ size = DEFAULT_ICON_SIZE, color = 'currentColor', className = '', style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={style}>
    <circle cx="12" cy="12" r="3" stroke={color} strokeWidth="2"/>
    <path d="M19.4 15C19.2669 15.3016 19.2272 15.6362 19.286 15.9606C19.3448 16.285 19.4995 16.5843 19.73 16.82L19.79 16.88C19.976 17.0657 20.1235 17.2863 20.2241 17.5291C20.3248 17.7719 20.3766 18.0322 20.3766 18.295C20.3766 18.5578 20.3248 18.8181 20.2241 19.0609C20.1235 19.3037 19.976 19.5243 19.79 19.71C19.6043 19.896 19.3837 20.0435 19.1409 20.1441C18.8981 20.2448 18.6378 20.2966 18.375 20.2966C18.1122 20.2966 17.8519 20.2448 17.6091 20.1441C17.3663 20.0435 17.1457 19.896 16.96 19.71L16.9 19.65C16.6643 19.4195 16.365 19.2648 16.0406 19.206C15.7162 19.1472 15.3816 19.1869 15.08 19.32C14.7842 19.4468 14.532 19.6572 14.3543 19.9255C14.1766 20.1938 14.0813 20.5082 14.08 20.83V21C14.08 21.5304 13.8693 22.0391 13.4942 22.4142C13.1191 22.7893 12.6104 23 12.08 23C11.5496 23 11.0409 22.7893 10.6658 22.4142C10.2907 22.0391 10.08 21.5304 10.08 21V20.91C10.0723 20.579 9.96512 20.2573 9.77251 19.9887C9.5799 19.7201 9.31074 19.5176 9 19.41C8.69838 19.2769 8.36381 19.2372 8.03941 19.296C7.71502 19.3548 7.41568 19.5095 7.18 19.74L7.12 19.8C6.93425 19.986 6.71368 20.1335 6.47088 20.2341C6.22808 20.3348 5.96783 20.3866 5.705 20.3866C5.44217 20.3866 5.18192 20.3348 4.93912 20.2341C4.69632 20.1335 4.47575 19.986 4.29 19.8C4.10405 19.6143 3.95653 19.3937 3.85588 19.1509C3.75523 18.9081 3.70343 18.6478 3.70343 18.385C3.70343 18.1222 3.75523 17.8619 3.85588 17.6191C3.95653 17.3763 4.10405 17.1557 4.29 16.97L4.35 16.91C4.58054 16.6743 4.73519 16.375 4.794 16.0506C4.85282 15.7262 4.81312 15.3916 4.68 15.09C4.55324 14.7942 4.34276 14.542 4.07447 14.3643C3.80618 14.1866 3.49179 14.0913 3.17 14.09H3C2.46957 14.09 1.96086 13.8793 1.58579 13.5042C1.21071 13.1291 1 12.6204 1 12.09C1 11.5596 1.21071 11.0509 1.58579 10.6758C1.96086 10.3007 2.46957 10.09 3 10.09H3.09C3.42099 10.0823 3.742 9.97512 4.01062 9.78251C4.27925 9.5899 4.48167 9.32074 4.59 9.01C4.72312 8.70838 4.76282 8.37381 4.704 8.04941C4.64519 7.72502 4.49054 7.42568 4.26 7.19L4.2 7.13C4.01405 6.94425 3.86653 6.72368 3.76588 6.48088C3.66523 6.23808 3.61343 5.97783 3.61343 5.715C3.61343 5.45217 3.66523 5.19192 3.76588 4.94912C3.86653 4.70632 4.01405 4.48575 4.2 4.3C4.38575 4.11405 4.60632 3.96653 4.84912 3.86588C5.09192 3.76523 5.35217 3.71343 5.615 3.71343C5.87783 3.71343 6.13808 3.76523 6.38088 3.86588C6.62368 3.96653 6.84425 4.11405 7.03 4.3L7.09 4.36C7.32568 4.59054 7.62502 4.74519 7.94941 4.804C8.27381 4.86282 8.60838 4.82312 8.91 4.69H9C9.29577 4.56324 9.54802 4.35276 9.72569 4.08447C9.90337 3.81618 9.99872 3.50179 10 3.18V3C10 2.46957 10.2107 1.96086 10.5858 1.58579C10.9609 1.21071 11.4696 1 12 1C12.5304 1 13.0391 1.21071 13.4142 1.58579C13.7893 1.96086 14 2.46957 14 3V3.09C14.0013 3.41179 14.0966 3.72618 14.2743 3.99447C14.452 4.26276 14.7042 4.47324 15 4.6C15.3016 4.73312 15.6362 4.77282 15.9606 4.714C16.285 4.65519 16.5843 4.50054 16.82 4.27L16.88 4.21C17.0657 4.02405 17.2863 3.87653 17.5291 3.77588C17.7719 3.67523 18.0322 3.62343 18.295 3.62343C18.5578 3.62343 18.8181 3.67523 19.0609 3.77588C19.3037 3.87653 19.5243 4.02405 19.71 4.21C19.896 4.39575 20.0435 4.61632 20.1441 4.85912C20.2448 5.10192 20.2966 5.36217 20.2966 5.625C20.2966 5.88783 20.2448 6.14808 20.1441 6.39088C20.0435 6.63368 19.896 6.85425 19.71 7.04L19.65 7.1C19.4195 7.33568 19.2648 7.63502 19.206 7.95941C19.1472 8.28381 19.1869 8.61838 19.32 8.92V9C19.4468 9.29577 19.6572 9.54802 19.9255 9.72569C20.1938 9.90337 20.5082 9.99872 20.83 10H21C21.5304 10 22.0391 10.2107 22.4142 10.5858C22.7893 10.9609 23 11.4696 23 12C23 12.5304 22.7893 13.0391 22.4142 13.4142C22.0391 13.7893 21.5304 14 21 14H20.91C20.5882 14.0013 20.2738 14.0966 20.0055 14.2743C19.7372 14.452 19.5268 14.7042 19.4 15Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// 社交媒体图标
export const IconSocialMedia: React.FC<IconProps> = ({ size = DEFAULT_ICON_SIZE, color = 'currentColor', className = '', style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={style}>
    <circle cx="18" cy="5" r="3" stroke={color} strokeWidth="2"/>
    <circle cx="6" cy="12" r="3" stroke={color} strokeWidth="2"/>
    <circle cx="18" cy="19" r="3" stroke={color} strokeWidth="2"/>
    <path d="M8.59 13.51L15.42 17.49" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M15.41 6.51L8.59 10.49" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// 横幅设计图标
export const IconBanner: React.FC<IconProps> = ({ size = DEFAULT_ICON_SIZE, color = 'currentColor', className = '', style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={style}>
    <rect x="2" y="6" width="20" height="12" rx="2" stroke={color} strokeWidth="2"/>
    <path d="M6 10H18" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M6 14H14" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="17" cy="14" r="1" fill={color}/>
  </svg>
);

// 包装设计图标
export const IconPackage: React.FC<IconProps> = ({ size = DEFAULT_ICON_SIZE, color = 'currentColor', className = '', style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={style}>
    <path d="M16.5 9.4L7.55 4.24C7.21 4.09 6.81 4.23 6.66 4.57L6.24 5.5C6.09 5.84 6.23 6.24 6.57 6.39L16.5 12.28V9.4Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M7.5 4.21V19.79C7.5 20.14 7.86 20.35 8.18 20.18L21.18 13.18C21.36 13.09 21.5 12.9 21.5 12.68V6.32C21.5 6.1 21.36 5.91 21.18 5.82L8.18 3.82C7.86 3.65 7.5 3.86 7.5 4.21Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M7.5 4.21L21.5 6.32" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// 插画图标
export const IconIllustration: React.FC<IconProps> = ({ size = DEFAULT_ICON_SIZE, color = 'currentColor', className = '', style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={style}>
    <path d="M12 2L13.09 8.26L20 9L13.09 9.74L12 16L10.91 9.74L4 9L10.91 8.26L12 2Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M5 3V7" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M19 17V21" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M3 5H7" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M17 19H21" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// UI组件图标
export const IconComponents: React.FC<IconProps> = ({ size = DEFAULT_ICON_SIZE, color = 'currentColor', className = '', style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={style}>
    <rect x="3" y="3" width="8" height="8" rx="1" stroke={color} strokeWidth="2"/>
    <rect x="13" y="3" width="8" height="8" rx="1" stroke={color} strokeWidth="2"/>
    <rect x="3" y="13" width="8" height="8" rx="1" stroke={color} strokeWidth="2"/>
    <rect x="13" y="13" width="8" height="8" rx="1" stroke={color} strokeWidth="2"/>
  </svg>
);

// 样机工具图标
export const IconMockup: React.FC<IconProps> = ({ size = DEFAULT_ICON_SIZE, color = 'currentColor', className = '', style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={style}>
    <rect x="4" y="2" width="16" height="12" rx="2" stroke={color} strokeWidth="2"/>
    <path d="M8 18H16" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 14V18" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M6 22H18" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <rect x="7" y="5" width="10" height="6" rx="1" stroke={color} strokeWidth="1"/>
  </svg>
);

// 调色板图标
export const IconPalette: React.FC<IconProps> = ({ size = DEFAULT_ICON_SIZE, color = 'currentColor', className = '', style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={style}>
    <path d="M12 2C13.3132 2 14.6136 2.25866 15.8268 2.7612C17.0401 3.26375 18.1425 4.00035 19.0711 4.92893C19.9997 5.85752 20.7362 6.95991 21.2388 8.17317C21.7413 9.38642 22 10.6868 22 12C22 13.3132 21.7413 14.6136 21.2388 15.8268C20.7362 17.0401 19.9997 18.1425 19.0711 19.0711C18.1425 19.9997 17.0401 20.7362 15.8268 21.2388C14.6136 21.7413 13.3132 22 12 22C10.6868 22 9.38642 21.7413 8.17317 21.2388C6.95991 20.7362 5.85752 19.9997 4.92893 19.0711C4.00035 18.1425 3.26375 17.0401 2.7612 15.8268C2.25866 14.6136 2 13.3132 2 12C2 9.34784 3.05357 6.8043 4.92893 4.92893C6.8043 3.05357 9.34784 2 12 2Z" stroke={color} strokeWidth="2"/>
    <circle cx="8.5" cy="7" r="1.5" fill={color}/>
    <circle cx="15.5" cy="7" r="1.5" fill={color}/>
    <circle cx="18" cy="12" r="1.5" fill={color}/>
    <circle cx="15.5" cy="17" r="1.5" fill={color}/>
    <circle cx="8.5" cy="17" r="1.5" fill={color}/>
  </svg>
);

// 室内设计专用图标

// CAD软件图标
export const IconCAD: React.FC<IconProps> = ({ 
  size = DEFAULT_ICON_SIZE, 
  color = 'currentColor', 
  className = '',
  style 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    className={className}
    style={style}
  >
    <path 
      d="M3 3H21V21H3V3ZM5 5V19H19V5H5ZM7 7H17V9H7V7ZM7 11H17V13H7V11ZM7 15H13V17H7V15Z" 
      stroke={color} 
      strokeWidth="1.5" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      fill={color}
      fillOpacity="0.1"
    />
  </svg>
);

// 家具设计图标
export const IconFurniture: React.FC<IconProps> = ({ 
  size = DEFAULT_ICON_SIZE, 
  color = 'currentColor', 
  className = '',
  style 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    className={className}
    style={style}
  >
    <path 
      d="M4 11V19H6V21H8V19H16V21H18V19H20V11H18V9C18 6.79086 16.2091 5 14 5H10C7.79086 5 6 6.79086 6 9V11H4ZM8 9C8 7.89543 8.89543 7 10 7H14C15.1046 7 16 7.89543 16 9V11H8V9Z" 
      stroke={color} 
      strokeWidth="1.5" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      fill={color}
      fillOpacity="0.1"
    />
  </svg>
);

// 材质纹理图标
export const IconTexture: React.FC<IconProps> = ({ 
  size = DEFAULT_ICON_SIZE, 
  color = 'currentColor', 
  className = '',
  style 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    className={className}
    style={style}
  >
    <path 
      d="M3 3H9V9H3V3ZM11 3H17V9H11V3ZM19 3H21V9H19V3ZM3 11H9V17H3V11ZM11 11H17V17H11V11ZM19 11H21V17H19V11ZM3 19H9V21H3V19ZM11 19H17V21H11V19ZM19 19H21V21H19V19Z" 
      stroke={color} 
      strokeWidth="1.5" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      fill={color}
      fillOpacity="0.05"
    />
  </svg>
);

// 灯光设计图标
export const IconLighting: React.FC<IconProps> = ({ 
  size = DEFAULT_ICON_SIZE, 
  color = 'currentColor', 
  className = '',
  style 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    className={className}
    style={style}
  >
    <path 
      d="M9 21C9 19.9 8.1 19 7 19S5 19.9 5 21H9ZM12 2L13.09 8.26L22 9L13.09 9.74L12 16L10.91 9.74L2 9L10.91 8.26L12 2ZM15 17H17V19H15V17ZM17 15H19V17H17V15Z" 
      stroke={color} 
      strokeWidth="1.5" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      fill={color}
      fillOpacity="0.1"
    />
  </svg>
);

// 项目管理图标
export const IconProject: React.FC<IconProps> = ({ 
  size = DEFAULT_ICON_SIZE, 
  color = 'currentColor', 
  className = '',
  style 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    className={className}
    style={style}
  >
    <path 
      d="M16 4H18C19.1046 4 20 4.89543 20 6V18C20 19.1046 19.1046 20 18 20H6C4.89543 20 4 19.1046 4 18V6C4 4.89543 4.89543 4 6 4H8M16 4C16 2.89543 15.1046 2 14 2H10C8.89543 2 8 2.89543 8 4M16 4V6H8V4M8 12H16M8 16H12" 
      stroke={color} 
      strokeWidth="1.5" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
  </svg>
);

// VR漫游/元宇宙图标（复用现有的IconMetaverse）
export const IconVR = IconMetaverse;

// 更新DesignIcons导出
export const DesignIcons = {
  // 基础图标
  AI: IconAI,
  Design: IconDesign,
  UI: IconUI,
  Figma: IconFigma,
  Icons: IconIcons,
  Font: IconFont,
  Color: IconColor,
  Inspiration: IconInspiration,
  Resource: IconResource,
  Tutorial: IconTutorial,
  Prototype: IconPrototype,
  Kit: IconKit,
  Tool: IconTool,
  Tools: IconTools,
  Digital: IconDigital,
  System: IconSystem,
  CarUI: IconCarUI,
  DesignTeam: IconDesignTeam,
  
  // 平面设计相关图标
  Material: IconMaterial,
  Print: IconPrint,
  Graphic: IconGraphic,
  Brand: IconBrand,
  Photo: IconPhoto,
  Art: IconArt,
  Education: IconEducation,
  Learning: IconLearning,
  
  // 小写版本映射
  ai: IconAI,
  design: IconDesign,
  ui: IconUI,
  figma: IconFigma,
  icons: IconIcons,
  font: IconFont,
  color: IconColor,
  inspiration: IconInspiration,
  resource: IconResource,
  tutorial: IconTutorial,
  prototype: IconPrototype,
  kit: IconKit,
  tool: IconTool,
  tools: IconTools,
  digital: IconDigital,
  system: IconSystem,
  carui: IconCarUI,
  designteam: IconDesignTeam,
  
  // 平面设计相关图标小写版本
  material: IconMaterial,
  print: IconPrint,
  graphic: IconGraphic,
  brand: IconBrand,
  photo: IconPhoto,
  art: IconArt,
  education: IconEducation,
  learning: IconLearning,
  
  // 其他图标
  Book: IconBook,
  Code: IconCode,
  Web: IconWeb,
  Video: IconVideo,
  Audio: IconAudio,
  Image: IconImage,
  Animation: IconAnimation,
  Community: IconCommunity,
  Specs: IconSpecs,
  Mobile: IconMobile,
  Data: IconData,
  Blog: IconBlog,
  Template: IconTemplate,
  '3D': Icon3D,
  Ecommerce: IconEcommerce,
  Plugin: IconPlugin,
  Developer: IconDeveloper,
  Learn: IconLearn,
  Analytics: IconAnalytics,
  Visualization: IconVisualization,
  Car: IconCar,
  
  // 其他图标的小写版本
  book: IconBook,
  code: IconCode,
  web: IconWeb,
  video: IconVideo,
  audio: IconAudio,
  image: IconImage,
  animation: IconAnimation,
  community: IconCommunity,
  specs: IconSpecs,
  mobile: IconMobile,
  data: IconData,
  blog: IconBlog,
  template: IconTemplate,
  '3d': Icon3D,
  ecommerce: IconEcommerce,
  plugin: IconPlugin,
  developer: IconDeveloper,
  learn: IconLearn,
  analytics: IconAnalytics,
  visualization: IconVisualization,
  car: IconCar,
  gameui: IconGameUI,
  metaverse: IconMetaverse,
  aidesign: IconAIDesign,
  othercontent: IconOtherContent,
  
  // 电商相关图标
  Store: IconStore,
  Camera: IconCamera,
  Layout: IconLayout,
  Marketing: IconMarketing,
  Platform: IconPlatform,
  LiveStreaming: IconLiveStreaming,
  
  // 电商图标小写版本
  store: IconStore,
  camera: IconCamera,
  layout: IconLayout,
  marketing: IconMarketing,
  platform: IconPlatform,
  livestreaming: IconLiveStreaming,
  
  // 新增电商设计师专业图标
  Banner: IconBanner,
  Package: IconPackage,
  Illustration: IconIllustration,
  Components: IconComponents,
  Mockup: IconMockup,
  Palette: IconPalette,
  
  // 新增电商设计师图标小写版本
  banner: IconBanner,
  package: IconPackage,
  illustration: IconIllustration,
  components: IconComponents,
  mockup: IconMockup,
  palette: IconPalette,
  
  // 室内设计专用图标
  CAD: IconCAD,
  Furniture: IconFurniture,
  Texture: IconTexture,
  Lighting: IconLighting,
  Project: IconProject,
  VR: IconVR,
  
  // 室内设计图标小写版本
  cad: IconCAD,
  furniture: IconFurniture,
  texture: IconTexture,
  lighting: IconLighting,
  project: IconProject,
  vr: IconVR
};

// 导出 Untitled UI 图标组件
export { UntitledIcon, isValidIconKey } from './UntitledIcon';

// 默认导出
export default DesignIcons;