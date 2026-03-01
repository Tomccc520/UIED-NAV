/**
 * @file index.ts
 * @description 前端用户界面组件
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

// 自定义UI组件库统一导出
export { default as Button } from './Button';
export { default as Input } from './Input';
export { default as Card } from './Card';
export { default as Chip } from './Chip';
export { default as Modal } from './Modal';
export { default as WebsiteExitModal } from './WebsiteExitModal';
export { Row, Col } from './Grid';

// 基本图标组件导出
export { 
  IconSearch, 
  IconMenu,
  IconExperiment, 
  IconBook, 
  IconCode,
  IconTool,         // 通用工具图标
  IconTools,        // 常用工具图标
  IconDigital,      // 数字孪生图标
  IconSystem,       // 设计系统图标
  IconDesignTeam,   // 设计团队图标
  IconCarUI,        // 车载UI图标
  IconEducation,    // 教育图标
  IconLearning,     // 学习图标
  IconInspiration,  // 灵感图标
  IconMaterial,     // 素材图标
  IconFont,         // 字体图标
  IconColor,        // 配色图标
  IconPrint,        // 印刷图标
  IconGraphic,      // 图形设计图标
  IconBrand,        // 品牌设计图标
  IconPhoto,        // 图片处理图标
  IconArt,          // 艺术创作图标
  
  // 电商相关图标
  IconStore,        // 店铺图标
  IconCamera,       // 相机图标
  IconLayout,       // 布局图标
  IconMarketing,    // 营销图标
  IconPlatform,     // 平台图标
  IconLiveStreaming,// 直播图标
  
  // 电商设计师专业图标
  IconBanner,       // 横幅设计图标
  IconPackage,      // 包装设计图标
  IconIllustration, // 插画图标
  IconComponents,   // UI组件图标
  IconMockup,       // 样机工具图标
  IconPalette,      // 调色板图标
  
  // 室内设计专用图标
  IconCAD,          // CAD软件图标
  IconFurniture,    // 家具设计图标
  IconTexture,      // 材质纹理图标
  IconLighting,     // 灯光设计图标
  IconProject,      // 项目管理图标
  IconVR,           // VR漫游图标
  Icon3D            // 3D建模图标
} from './Icons/index';

// 导出设计图标库 
export { default as DesignIcons } from './Icons/index'; 