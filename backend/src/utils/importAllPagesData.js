/**
 * @file importAllPagesData.js
 * @description 后端API服务
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * 完整的数据导入脚本
 * 导入所有页面的分类和网站数据
 */

// ============ AI页面分类 ============
const aiCategories = [
  { id: 'ai-xiezuo', name: 'AI写作工具', icon: 'blog', color: '#6366f1', description: 'AI文案生成、论文写作和内容创作工具',
    subCategories: [
      { id: 'ai-xiezuo-writing', name: 'AI写作工具' },
      { id: 'ai-xiezuo-paper', name: 'AI论文工具' },
      { id: 'ai-xiezuo-detection', name: 'AI内容检测' },
      { id: 'ai-xiezuo-bot', name: 'AI机器人' },
      { id: 'ai-xiezuo-prompt', name: 'AI提示词' }
    ]
  },
  { id: 'ai-shengtupicture', name: 'AI生图工具', icon: 'image', color: '#dc2626', description: 'AI图像生成、绘画创作和艺术设计工具',
    subCategories: [
      { id: 'ai-shengtupicture-huihua', name: 'AI绘画工具' },
      { id: 'ai-shengtupicture-prompt', name: 'AI绘画提示' },
      { id: 'ai-shengtupicture-model', name: 'AI绘画模型' },
      { id: 'ai-shengtupicture-community', name: 'AI绘画社区' }
    ]
  },
  { id: 'ai-tupian', name: 'AI图片工具', icon: 'photo', color: '#059669', description: 'AI图片处理、修复、增强和编辑工具',
    subCategories: [
      { id: 'ai-tupian-zengqiang', name: 'AI图像增强' },
      { id: 'ai-tupian-qushuiyin', name: 'AI图去水印' },
      { id: 'ai-tupian-xiugai', name: 'AI图片修改' },
      { id: 'ai-tupian-wusunfangda', name: 'AI无损放大' },
      { id: 'ai-tupian-mote', name: 'AI模特生成' },
      { id: 'ai-tupian-chuli', name: 'AI图象处理' },
      { id: 'ai-tupian-koutu', name: 'AI图片抠图' },
      { id: 'ai-tupian-touxiang', name: 'AI头像生成' }
    ]
  },
  { id: 'ai-shipin', name: 'AI视频工具', icon: 'video', color: '#7c3aed', description: 'AI视频生成、编辑、处理和增强工具',
    subCategories: [
      { id: 'ai-shipin-shengcheng', name: 'AI视频生成' },
      { id: 'ai-shipin-koutu', name: 'AI视频抠像' },
      { id: 'ai-shipin-zimu', name: 'AI字幕翻译' },
      { id: 'ai-shipin-zongjie', name: 'AI视频总结' },
      { id: 'ai-shipin-jianji', name: 'AI视频剪辑' },
      { id: 'ai-shipin-wenan', name: 'AI视频文案' },
      { id: 'ai-shipin-huanlian', name: 'AI视频换脸' },
      { id: 'ai-shipin-shuziren', name: 'AI虚拟数字人' },
      { id: 'ai-shipin-qushuiyin', name: 'AI视频去水印' },
      { id: 'ai-shipin-zengqiang', name: 'AI视频画质增强' }
    ]
  },
  { id: 'ai-yinpin', name: 'AI音频工具', icon: 'music', color: '#ea580c', description: 'AI音频生成、处理、编辑和制作工具',
    subCategories: [
      { id: 'ai-yinpin-zhizuo', name: 'AI音频制作' },
      { id: 'ai-yinpin-tts', name: 'AI文字转音' },
      { id: 'ai-yinpin-kelong', name: 'AI音频克隆' },
      { id: 'ai-yinpin-fenli', name: 'AI人声分离' },
      { id: 'ai-yinpin-geshou', name: 'AI音乐歌手' },
      { id: 'ai-yinpin-bianqu', name: 'AI编曲作曲' }
    ]
  },
  { id: 'ai-bangong', name: 'AI办公工具', icon: 'briefcase', color: '#10b981', description: 'AI办公自动化、文档处理和效率提升工具',
    subCategories: [
      { id: 'ai-bangong-ppt', name: 'AI PPT' },
      { id: 'ai-bangong-wendang', name: 'AI文档工具' },
      { id: 'ai-bangong-siweidaotu', name: 'AI思维导图' },
      { id: 'ai-bangong-xiaolu', name: 'AI效率工具' },
      { id: 'ai-bangong-biaoge', name: 'AI表格处理' },
      { id: 'ai-bangong-huiyi', name: 'AI会议工具' }
    ]
  },
  { id: 'ai-sheji', name: 'AI设计工具', icon: 'palette', color: '#f59e0b', description: 'AI设计创作、界面设计和视觉创意工具',
    subCategories: [
      { id: 'ai-sheji-logo', name: 'AI Logo' },
      { id: 'ai-sheji-3d', name: 'AI 3D建模' },
      { id: 'ai-sheji-gongju', name: 'AI设计工具' },
      { id: 'ai-sheji-jiemian', name: 'AI界面工具' },
      { id: 'ai-sheji-touxiang', name: 'AI头像生成' },
      { id: 'ai-sheji-mote', name: 'AI模特生成' },
      { id: 'ai-sheji-shinei', name: 'AI室内生成' },
      { id: 'ai-sheji-jianzhu', name: 'AI建筑设计' }
    ]
  },
  { id: 'ai-kaifa', name: 'AI开发工具', icon: 'code', color: '#8b5cf6', description: 'AI编程辅助、低代码开发和技术工具',
    subCategories: [
      { id: 'ai-kaifa-daimahua', name: 'AI低代码' },
      { id: 'ai-kaifa-biancheng', name: 'AI编程工具' }
    ]
  },
  { id: 'ai-xuexi', name: 'AI学习平台', icon: 'academic-cap', color: '#06b6d4', description: 'AI学习资源、教育平台和知识获取工具',
    subCategories: [
      { id: 'ai-xuexi-zhinan', name: 'AI学习指南' },
      { id: 'ai-xuexi-wangzhan', name: 'AI学习网站' }
    ]
  },
  { id: 'ai-pingtai', name: 'AI平台网站', icon: 'globe-alt', color: '#ef4444', description: 'AI平台服务、开放接口和技术基础设施',
    subCategories: [
      { id: 'ai-pingtai-damoxing', name: 'AI大模型' },
      { id: 'ai-pingtai-yuanyuzhou', name: 'AI元宇宙' },
      { id: 'ai-pingtai-kaifang', name: 'AI开放平台' },
      { id: 'ai-pingtai-suanli', name: 'AI算力平台' },
      { id: 'ai-pingtai-guanli', name: 'AI管理机构' }
    ]
  },
  { id: 'ai-dianshang', name: 'AI电商工具', icon: 'shopping-cart', color: '#84cc16', description: 'AI电商运营、商品管理和营销推广工具',
    subCategories: [
      { id: 'ai-dianshang-shangpin', name: 'AI商品工具' },
      { id: 'ai-dianshang-mote', name: 'AI模特生成' }
    ]
  }
];

// ============ Design页面分类 ============
const designCategories = [
  { id: 'common-tools', name: '常用工具', icon: 'tools', color: '#6366F1', description: '设计师日常必备的实用工具集合',
    subCategories: [
      { id: 'efficiency-tools', name: '效率工具' },
      { id: 'one-click-cutout', name: '一键抠图' },
      { id: 'online-tools', name: '在线工具' },
      { id: 'collaborative-office', name: '协同办公' },
      { id: 'online-color', name: '在线配色' },
      { id: 'online-docs', name: '在线文档' },
      { id: 'online-generator', name: '在线生成' },
      { id: 'format-conversion', name: '格式转换' }
    ]
  },
  { id: 'inspiration', name: '平面灵感', icon: 'inspiration', color: '#3B82F6', description: '优秀平面设计作品与创意灵感展示',
    subCategories: [
      { id: 'inspiration-general', name: '平面灵感' },
      { id: 'inspiration-poster', name: '海报灵感' },
      { id: 'inspiration-logo', name: 'Logo灵感' },
      { id: 'inspiration-packaging', name: '包装灵感' },
      { id: 'inspiration-branding', name: '品牌灵感' },
      { id: 'inspiration-typography', name: '字体灵感' },
      { id: 'inspiration-magazine', name: '设计杂志' },
      { id: 'inspiration-portfolio', name: '设计师作品集' }
    ]
  },
  { id: 'design-resources', name: '设计素材', icon: 'material', color: '#F59E0B', description: '高质量设计素材与资源库',
    subCategories: [
      { id: 'design-resources-plane', name: '平面素材' },
      { id: 'design-resources-ui', name: 'UI素材' },
      { id: 'design-resources-icons', name: '图标素材' },
      { id: 'design-resources-images', name: '可商用图库' },
      { id: 'design-resources-illustrations', name: '可商用插画' },
      { id: 'design-resources-video', name: '可商用视频' },
      { id: 'design-resources-fonts', name: '可商用字体' },
      { id: 'design-resources-mockups', name: '样机素材' },
      { id: 'design-resources-fontwebsites', name: '字体网站' },
      { id: 'design-resources-soundeffects', name: '音效网站' },
      { id: 'design-resources-ppt', name: 'PPT资源' },
      { id: 'design-resources-3d', name: '3D素材' },
      { id: 'design-resources-3dmodels', name: '3D模型' },
      { id: 'design-resources-aepr', name: 'AE/PR模板' },
      { id: 'design-resources-cutout', name: '免抠素材' }
    ]
  },
  { id: 'font', name: '字体资源', icon: 'font', color: '#9C27B0', description: '中英文字体下载与字体设计工具', subCategories: [] },
  { id: 'color', name: '配色工具', icon: 'color', color: '#F44336', description: '色彩搭配、色彩理论与调色工具',
    subCategories: [
      { id: 'color-palette', name: '配色方案' },
      { id: 'color-theory', name: '色彩理论' },
      { id: 'color-tools', name: '调色工具' },
      { id: 'color-inspiration', name: '配色灵感' }
    ]
  },
  { id: 'print', name: '印刷设计', icon: 'print', color: '#607D8B', description: '印刷品设计相关的工具与资源',
    subCategories: [
      { id: 'print-business', name: '名片设计' },
      { id: 'print-brochure', name: '宣传册' },
      { id: 'print-poster', name: '海报设计' },
      { id: 'print-packaging', name: '包装设计' }
    ]
  },
  { id: 'graphic', name: '图形设计', icon: 'graphic', color: '#4CAF50', description: '图形创意、标志设计等图形设计工具',
    subCategories: [
      { id: 'graphic-logo', name: '标志设计' },
      { id: 'graphic-illustration', name: '插画设计' },
      { id: 'graphic-icon', name: '图标设计' },
      { id: 'graphic-vector', name: '矢量图形' }
    ]
  },
  { id: 'brand', name: '品牌设计', icon: 'brand', color: '#E91E63', description: '品牌视觉识别系统与品牌设计相关资源',
    subCategories: [
      { id: 'brand-identity', name: '品牌识别' },
      { id: 'brand-guidelines', name: '品牌规范' },
      { id: 'brand-cases', name: '品牌案例' },
      { id: 'brand-tools', name: '品牌工具' }
    ]
  },
  { id: 'photo', name: '图片处理', icon: 'photo', color: '#00BCD4', description: '图片编辑、修图与照片处理工具',
    subCategories: [
      { id: 'photo-editing', name: '图片编辑' },
      { id: 'photo-filters', name: '滤镜效果' },
      { id: 'photo-compression', name: '图片压缩' },
      { id: 'photo-enhancement', name: '图片增强' }
    ]
  },
  { id: 'art', name: '艺术创作', icon: 'art', color: '#795548', description: '数字艺术创作与绘画工具',
    subCategories: [
      { id: 'art-painting', name: '数字绘画' },
      { id: 'art-sketching', name: '草图绘制' },
      { id: 'art-concept', name: '概念艺术' },
      { id: 'art-tools', name: '绘画工具' }
    ]
  },
  { id: 'design-colleges', name: '设计高校', icon: 'education', color: '#FF9800', description: '国内外知名设计院校与艺术学院',
    subCategories: [{ id: 'design-colleges-default', name: '设计高校' }]
  },
  { id: 'self-learning', name: '自学网站', icon: 'learning', color: '#4FC3F7', description: '设计师自学平台与在线教育资源',
    subCategories: [{ id: 'self-learning-default', name: '自学网站' }]
  }
];

// ============ 3D页面分类 ============
const threeDCategories = [
  { id: 'threed-software', name: '三维软件', icon: '3d', color: '#6f42c1', description: '专业3D建模、渲染、动画软件',
    subCategories: [
      { id: 'threed-software-modeling', name: '建模软件' },
      { id: 'threed-software-rendering', name: '渲染软件' },
      { id: 'threed-software-animation', name: '动画软件' },
      { id: 'threed-software-cad', name: 'CAD软件' }
    ]
  },
  { id: 'threed-models', name: '3D模型', icon: 'material', color: '#e74c3c', description: '3D模型资源和素材库',
    subCategories: [
      { id: 'threed-models-free', name: '免费模型' },
      { id: 'threed-models-paid', name: '付费模型' },
      { id: 'threed-models-game', name: '游戏模型' },
      { id: 'threed-models-arch', name: '建筑模型' }
    ]
  },
  { id: 'cloud-rendering', name: '云渲染', icon: 'system', color: '#f39c12', description: '云端渲染服务和渲染农场',
    subCategories: [
      { id: 'cloud-rendering-service', name: '云渲染服务' },
      { id: 'cloud-rendering-farm', name: '渲染农场' },
      { id: 'cloud-rendering-gpu', name: 'GPU云渲染' },
      { id: 'cloud-rendering-ai', name: 'AI云渲染' }
    ]
  },
  { id: 'texture-materials', name: '贴图网站', icon: 'photo', color: '#27ae60', description: '材质贴图和纹理资源',
    subCategories: [
      { id: 'texture-materials-pbr', name: 'PBR贴图' },
      { id: 'texture-materials-hdri', name: 'HDRI贴图' },
      { id: 'texture-materials-seamless', name: '无缝贴图' },
      { id: 'texture-materials-procedural', name: '程序贴图' }
    ]
  },
  { id: 'threed-community', name: '交流社区', icon: 'community', color: '#9b59b6', description: '3D设计社区和学习平台',
    subCategories: [
      { id: 'threed-community-forums', name: '论坛社区' },
      { id: 'threed-community-learning', name: '学习社区' },
      { id: 'threed-community-portfolio', name: '作品展示' },
      { id: 'threed-community-collaboration', name: '协作平台' }
    ]
  },
  { id: 'vr-ar-dev', name: 'VR/AR开发', icon: 'metaverse', color: '#e67e22', description: '虚拟现实和增强现实开发工具',
    subCategories: [
      { id: 'vr-ar-engines', name: 'VR/AR引擎' },
      { id: 'vr-ar-content', name: '内容制作' },
      { id: 'vr-ar-platforms', name: '发布平台' },
      { id: 'vr-ar-tools', name: '开发工具' }
    ]
  },
  { id: 'game-engines', name: '游戏引擎', icon: 'gameui', color: '#3498db', description: '游戏开发引擎和相关工具',
    subCategories: [
      { id: 'game-engines-3d', name: '3D游戏引擎' },
      { id: 'game-engines-2d', name: '2D游戏引擎' },
      { id: 'game-engines-mobile', name: '移动游戏引擎' },
      { id: 'game-engines-tools', name: '游戏开发工具' }
    ]
  },
  { id: 'threed-printing', name: '3D打印', icon: 'digital', color: '#16a085', description: '3D打印软件和服务',
    subCategories: [
      { id: 'threed-printing-slicers', name: '切片软件' },
      { id: 'threed-printing-design', name: '打印设计' },
      { id: 'threed-printing-services', name: '打印服务' },
      { id: 'threed-printing-materials', name: '打印材料' }
    ]
  },
  { id: 'digital-sculpting', name: '数字雕刻', icon: 'art', color: '#8e44ad', description: '数字雕刻和造型工具',
    subCategories: [
      { id: 'digital-sculpting-character', name: '角色雕刻' },
      { id: 'digital-sculpting-environment', name: '环境雕刻' },
      { id: 'digital-sculpting-hard-surface', name: '硬表面雕刻' },
      { id: 'digital-sculpting-retopology', name: '重拓扑工具' }
    ]
  },
  { id: 'motion-capture', name: '动作捕捉', icon: 'animation', color: '#d35400', description: '动作捕捉和动画工具',
    subCategories: [
      { id: 'motion-capture-hardware', name: '捕捉设备' },
      { id: 'motion-capture-software', name: '捕捉软件' },
      { id: 'motion-capture-ai', name: 'AI动捕' },
      { id: 'motion-capture-cleanup', name: '动画清理' }
    ]
  },
  { id: 'arch-visualization', name: '建筑可视化', icon: 'visualization', color: '#c0392b', description: '建筑和室内设计可视化工具',
    subCategories: [
      { id: 'arch-visualization-rendering', name: '建筑渲染' },
      { id: 'arch-visualization-realtime', name: '实时可视化' },
      { id: 'arch-visualization-vr', name: 'VR建筑体验' },
      { id: 'arch-visualization-lighting', name: '照明设计' }
    ]
  },
  { id: 'ai-models', name: 'AI模型', icon: 'ai', color: '#ff6b6b', description: 'AI驱动的3D模型生成和处理工具',
    subCategories: [
      { id: 'ai-models-generation', name: '3D模型生成' },
      { id: 'ai-models-optimization', name: '模型优化' },
      { id: 'ai-models-animation', name: 'AI动画' },
      { id: 'ai-models-texturing', name: 'AI贴图' }
    ]
  }
];

// ============ Ecommerce页面分类 ============
const ecommerceCategories = [
  { id: 'design-inspiration', name: '电商灵感', icon: 'inspiration', color: '#6366F1', description: '电商设计灵感和案例展示',
    subCategories: [
      { id: 'ecommerce-showcase', name: '电商展示' },
      { id: 'ecommerce-banner', name: '电商Banner' },
      { id: 'ecommerce-detail', name: '详情页设计' },
      { id: 'ecommerce-homepage', name: '首页设计' }
    ]
  },
  { id: 'store-design', name: '店铺装修', icon: 'store', color: '#3B82F6', description: '电商店铺装修和模板',
    subCategories: [
      { id: 'store-builder', name: '店铺搭建' },
      { id: 'store-template', name: '店铺模板' },
      { id: 'store-decoration', name: '店铺装饰' },
      { id: 'store-navigation', name: '店铺导航' }
    ]
  },
  { id: 'product-photo', name: '产品摄影', icon: 'camera', color: '#F59E0B', description: '产品摄影和图片处理',
    subCategories: [
      { id: 'photo-editing', name: '图片编辑' },
      { id: 'photo-background', name: '背景处理' },
      { id: 'photo-retouching', name: '图片修饰' },
      { id: 'photo-studio', name: '摄影棚' }
    ]
  },
  { id: 'marketing-tools', name: '营销工具', icon: 'marketing', color: '#10B981', description: '电商营销和推广工具',
    subCategories: [
      { id: 'marketing-poster', name: '营销海报' },
      { id: 'marketing-video', name: '营销视频' },
      { id: 'marketing-social', name: '社交营销' },
      { id: 'marketing-email', name: '邮件营销' }
    ]
  },
  { id: 'data-analysis', name: '数据分析', icon: 'chart', color: '#8B5CF6', description: '电商数据分析和报表',
    subCategories: [
      { id: 'data-dashboard', name: '数据看板' },
      { id: 'data-report', name: '数据报表' },
      { id: 'data-tracking', name: '数据追踪' },
      { id: 'data-visualization', name: '数据可视化' }
    ]
  }
];

// ============ Interior页面分类 ============
const interiorCategories = [
  { id: 'cad-software', name: 'CAD软件', icon: 'cad', color: '#34495e', description: '专业CAD绘图和建筑设计软件',
    subCategories: [
      { id: 'cad-2d', name: '2D CAD' },
      { id: 'cad-3d', name: '3D CAD' },
      { id: 'cad-bim', name: 'BIM软件' },
      { id: 'cad-free', name: '免费CAD' }
    ]
  },
  { id: '3d-modeling', name: '3D建模', icon: '3d', color: '#6f42c1', description: '室内空间3D建模和设计软件',
    subCategories: [
      { id: '3d-general', name: '通用建模' },
      { id: '3d-parametric', name: '参数化建模' },
      { id: '3d-sculpting', name: '雕刻建模' },
      { id: '3d-procedural', name: '程序化建模' }
    ]
  },
  { id: 'rendering', name: '渲染软件', icon: 'visualization', color: '#e74c3c', description: '室内效果图渲染和可视化工具',
    subCategories: [
      { id: 'rendering-realtime', name: '实时渲染' },
      { id: 'rendering-offline', name: '离线渲染' },
      { id: 'rendering-gpu', name: 'GPU渲染' },
      { id: 'rendering-cloud', name: '云渲染' }
    ]
  },
  { id: 'vr-walkthrough', name: 'VR漫游', icon: 'metaverse', color: '#27ae60', description: '虚拟现实室内漫游和展示工具',
    subCategories: [
      { id: 'vr-headset', name: 'VR头显' },
      { id: 'vr-web', name: 'Web VR' },
      { id: 'vr-mobile', name: '移动VR' },
      { id: 'ar-tools', name: 'AR工具' }
    ]
  },
  { id: 'furniture-design', name: '家具设计', icon: 'furniture', color: '#f39c12', description: '家具设计和定制化工具',
    subCategories: [
      { id: 'furniture-modeling', name: '家具建模' },
      { id: 'furniture-catalog', name: '家具目录' },
      { id: 'furniture-custom', name: '定制家具' },
      { id: 'furniture-library', name: '家具库' }
    ]
  },
  { id: 'material-library', name: '材质库', icon: 'texture', color: '#9b59b6', description: '室内设计材质和纹理资源库',
    subCategories: [
      { id: 'material-pbr', name: 'PBR材质' },
      { id: 'material-texture', name: '纹理贴图' },
      { id: 'material-fabric', name: '面料材质' },
      { id: 'material-wood', name: '木材材质' }
    ]
  },
  { id: 'lighting-design', name: '灯光设计', icon: 'lighting', color: '#e67e22', description: '室内灯光设计和照明计算工具',
    subCategories: [
      { id: 'lighting-calculation', name: '照明计算' },
      { id: 'lighting-simulation', name: '灯光模拟' },
      { id: 'lighting-ies', name: 'IES灯光' },
      { id: 'lighting-smart', name: '智能照明' }
    ]
  },
  { id: 'project-management', name: '项目管理', icon: 'project', color: '#3498db', description: '室内设计项目管理和协作工具',
    subCategories: [
      { id: 'project-planning', name: '项目规划' },
      { id: 'project-collaboration', name: '团队协作' },
      { id: 'project-budget', name: '预算管理' },
      { id: 'project-timeline', name: '进度管理' }
    ]
  }
];

// ============ Font页面分类 ============
const fontCategories = [
  { id: 'chinese-fonts', name: '中文字体', icon: 'font', color: '#FF6B6B', description: '优质中文字体资源下载',
    subCategories: [
      { id: 'chinese-serif', name: '中文衬线' },
      { id: 'chinese-sans', name: '中文无衬线' },
      { id: 'chinese-calligraphy', name: '中文书法' },
      { id: 'chinese-decorative', name: '中文装饰' }
    ]
  },
  { id: 'english-fonts', name: '英文字体', icon: 'font', color: '#4ECDC4', description: '精选英文字体库',
    subCategories: [
      { id: 'english-serif', name: '英文衬线' },
      { id: 'english-sans', name: '英文无衬线' },
      { id: 'english-script', name: '英文手写' },
      { id: 'english-display', name: '英文展示' }
    ]
  },
  { id: 'font-tools', name: '字体工具', icon: 'tool', color: '#45B7D1', description: '字体设计与管理工具',
    subCategories: [
      { id: 'font-editor', name: '字体编辑器' },
      { id: 'font-manager', name: '字体管理器' },
      { id: 'font-converter', name: '字体转换器' },
      { id: 'font-inspector', name: '字体检测器' }
    ]
  },
  { id: 'font-pairing', name: '字体搭配', icon: 'palette', color: '#96CEB4', description: '字体配对与搭配工具',
    subCategories: [
      { id: 'pairing-tools', name: '搭配工具' },
      { id: 'pairing-gallery', name: '搭配灵感' },
      { id: 'pairing-guide', name: '搭配指南' },
      { id: 'pairing-analysis', name: '搭配分析' }
    ]
  },
  { id: 'web-fonts', name: 'Web字体', icon: 'web', color: '#FFEAA7', description: '网页字体服务与CDN',
    subCategories: [
      { id: 'web-cdn', name: '字体CDN' },
      { id: 'web-optimization', name: '字体优化' },
      { id: 'web-loading', name: '字体加载' },
      { id: 'web-fallback', name: '字体回退' }
    ]
  },
  { id: 'font-resources', name: '字体资源', icon: 'resource', color: '#DDA0DD', description: '字体学习与资源站点',
    subCategories: [
      { id: 'font-learning', name: '字体学习' },
      { id: 'font-community', name: '字体社区' },
      { id: 'font-blog', name: '字体博客' },
      { id: 'font-news', name: '字体资讯' }
    ]
  }
];

// 页面与分类的映射
const pageCategories = {
  ai: aiCategories,
  design: designCategories,
  '3d': threeDCategories,
  ecommerce: ecommerceCategories,
  interior: interiorCategories,
  font: fontCategories
};

// 导入分类函数
async function importCategories(pageSlug, categories) {
  console.log(`\n📂 导入 ${pageSlug} 页面的分类...`);
  
  // 获取页面
  const page = await prisma.page.findUnique({ where: { slug: pageSlug } });
  if (!page) {
    console.log(`  ⚠️ 页面 ${pageSlug} 不存在，跳过`);
    return 0;
  }
  
  let imported = 0;
  let order = 0;
  
  for (const cat of categories) {
    order++;
    const mainSlug = `${pageSlug}-${cat.id}`;
    
    // 创建或更新主分类
    let mainCategory = await prisma.category.findUnique({ where: { slug: mainSlug } });
    if (!mainCategory) {
      mainCategory = await prisma.category.create({
        data: {
          name: cat.name,
          slug: mainSlug,
          description: cat.description || '',
          icon: cat.icon || '',
          color: cat.color || '#6366f1',
          order: order,
          visible: true
        }
      });
      imported++;
      console.log(`  ✅ 创建主分类: ${cat.name}`);
    }
    
    // 关联到页面
    const existingLink = await prisma.pageCategory.findFirst({
      where: { pageId: page.id, categoryId: mainCategory.id }
    });
    if (!existingLink) {
      await prisma.pageCategory.create({
        data: { pageId: page.id, categoryId: mainCategory.id, order: order }
      });
    }
    
    // 创建子分类
    if (cat.subCategories && cat.subCategories.length > 0) {
      let subOrder = 0;
      for (const sub of cat.subCategories) {
        subOrder++;
        const subSlug = `${pageSlug}-${sub.id}`;
        
        let subCategory = await prisma.category.findUnique({ where: { slug: subSlug } });
        if (!subCategory) {
          subCategory = await prisma.category.create({
            data: {
              name: sub.name,
              slug: subSlug,
              description: sub.description || '',
              icon: '',
              color: cat.color || '#6366f1',
              parentId: mainCategory.id,
              order: subOrder,
              visible: true
            }
          });
          imported++;
        }
        
        // 子分类也关联到页面
        const existingSubLink = await prisma.pageCategory.findFirst({
          where: { pageId: page.id, categoryId: subCategory.id }
        });
        if (!existingSubLink) {
          await prisma.pageCategory.create({
            data: { pageId: page.id, categoryId: subCategory.id, order: order * 100 + subOrder }
          });
        }
      }
    }
  }
  
  console.log(`  📊 导入了 ${imported} 个分类`);
  return imported;
}

// ============ 示例网站数据 ============
// AI工具网站
const aiWebsites = [
  { name: 'ChatGPT', description: 'OpenAI开发的AI对话助手，支持多种任务', url: 'https://chat.openai.com/', category: 'ai-xiezuo', subCategory: 'ai-xiezuo-bot', isHot: true, isFeatured: true },
  { name: 'Claude', description: 'Anthropic开发的AI助手，擅长分析和写作', url: 'https://claude.ai/', category: 'ai-xiezuo', subCategory: 'ai-xiezuo-bot', isHot: true, isFeatured: true },
  { name: '文心一言', description: '百度推出的AI对话助手', url: 'https://yiyan.baidu.com/', category: 'ai-xiezuo', subCategory: 'ai-xiezuo-bot', isHot: true },
  { name: '通义千问', description: '阿里云推出的AI大模型', url: 'https://tongyi.aliyun.com/', category: 'ai-xiezuo', subCategory: 'ai-xiezuo-bot', isHot: true },
  { name: 'Gemini', description: 'Google AI推出的智能助手', url: 'https://gemini.google.com/', category: 'ai-xiezuo', subCategory: 'ai-xiezuo-bot', isHot: true, isFeatured: true },
  { name: 'DeepSeek', description: '深度求索AI智能助手', url: 'https://www.deepseek.com/', category: 'ai-xiezuo', subCategory: 'ai-xiezuo-bot', isHot: true },
  { name: 'Coze', description: '新一代AI大模型智能体开发平台', url: 'https://www.coze.cn/', category: 'ai-xiezuo', subCategory: 'ai-xiezuo-bot', isHot: true, isFeatured: true },
  { name: 'Grammarly', description: '免费AI写作助手，提供个性化AI指导', url: 'https://www.grammarly.com/', category: 'ai-xiezuo', subCategory: 'ai-xiezuo-writing', isHot: true, isFeatured: true },
  { name: 'Copy.ai', description: '先进的AI写作和内容生成平台', url: 'https://www.copy.ai/', category: 'ai-xiezuo', subCategory: 'ai-xiezuo-writing', isHot: true },
  { name: 'Jasper', description: 'AI写作助手，帮助创建营销内容', url: 'https://www.jasper.ai/', category: 'ai-xiezuo', subCategory: 'ai-xiezuo-writing', isFeatured: true },
  { name: 'Paperpal', description: 'AI学术写作工具，提供语法检查和论文优化', url: 'https://paperpal.com/', category: 'ai-xiezuo', subCategory: 'ai-xiezuo-paper', isHot: true, isFeatured: true },
  { name: 'Elicit', description: 'AI研究助手，帮助快速找到相关论文', url: 'https://elicit.org/', category: 'ai-xiezuo', subCategory: 'ai-xiezuo-paper', isHot: true, isFeatured: true },
  { name: 'Turnitin', description: '全球领先的学术诚信和抄袭检测平台', url: 'https://www.turnitin.com/', category: 'ai-xiezuo', subCategory: 'ai-xiezuo-detection', isHot: true, isFeatured: true },
  { name: 'Midjourney', description: 'AI图像生成工具，创造惊艳的艺术作品', url: 'https://www.midjourney.com/', category: 'ai-shengtupicture', subCategory: 'ai-shengtupicture-huihua', isHot: true, isFeatured: true },
  { name: 'DALL-E', description: 'OpenAI的AI图像生成模型', url: 'https://openai.com/dall-e-3', category: 'ai-shengtupicture', subCategory: 'ai-shengtupicture-huihua', isHot: true },
  { name: 'Stable Diffusion', description: '开源AI图像生成模型', url: 'https://stability.ai/', category: 'ai-shengtupicture', subCategory: 'ai-shengtupicture-huihua', isHot: true },
  { name: 'Remove.bg', description: 'AI自动去除图片背景', url: 'https://www.remove.bg/', category: 'ai-tupian', subCategory: 'ai-tupian-koutu', isHot: true, isFeatured: true },
  { name: 'Cleanup.pictures', description: 'AI去除图片中的物体和水印', url: 'https://cleanup.pictures/', category: 'ai-tupian', subCategory: 'ai-tupian-qushuiyin', isFeatured: true },
  { name: 'Topaz Labs', description: '专业AI图像增强软件', url: 'https://www.topazlabs.com/', category: 'ai-tupian', subCategory: 'ai-tupian-zengqiang', isFeatured: true },
  { name: 'Runway', description: 'AI视频生成和编辑平台', url: 'https://runwayml.com/', category: 'ai-shipin', subCategory: 'ai-shipin-shengcheng', isHot: true, isFeatured: true },
  { name: 'Pika', description: 'AI视频生成工具', url: 'https://pika.art/', category: 'ai-shipin', subCategory: 'ai-shipin-shengcheng', isHot: true },
  { name: 'HeyGen', description: 'AI数字人视频生成', url: 'https://www.heygen.com/', category: 'ai-shipin', subCategory: 'ai-shipin-shuziren', isFeatured: true },
  { name: 'ElevenLabs', description: 'AI语音合成和克隆', url: 'https://elevenlabs.io/', category: 'ai-yinpin', subCategory: 'ai-yinpin-tts', isHot: true, isFeatured: true },
  { name: 'Suno', description: 'AI音乐生成', url: 'https://suno.ai/', category: 'ai-yinpin', subCategory: 'ai-yinpin-bianqu', isHot: true },
  { name: 'Notion AI', description: 'Notion内置的AI写作助手', url: 'https://www.notion.so/product/ai', category: 'ai-bangong', subCategory: 'ai-bangong-wendang', isHot: true, isFeatured: true },
  { name: 'Gamma', description: 'AI演示文稿生成', url: 'https://gamma.app/', category: 'ai-bangong', subCategory: 'ai-bangong-ppt', isHot: true },
  { name: 'Canva AI', description: 'Canva的AI设计功能', url: 'https://www.canva.com/', category: 'ai-sheji', subCategory: 'ai-sheji-gongju', isHot: true, isFeatured: true },
  { name: 'Looka', description: 'AI Logo设计', url: 'https://looka.com/', category: 'ai-sheji', subCategory: 'ai-sheji-logo', isFeatured: true },
  { name: 'GitHub Copilot', description: 'AI编程助手', url: 'https://github.com/features/copilot', category: 'ai-kaifa', subCategory: 'ai-kaifa-biancheng', isHot: true, isFeatured: true },
  { name: 'Cursor', description: 'AI驱动的代码编辑器', url: 'https://cursor.sh/', category: 'ai-kaifa', subCategory: 'ai-kaifa-biancheng', isHot: true },
];

// 3D工具网站
const threeDWebsites = [
  { name: 'Blender', description: '免费开源的3D创作套件', url: 'https://www.blender.org/', category: 'threed-software', subCategory: 'threed-software-modeling', isHot: true, isFeatured: true },
  { name: 'Maya', description: 'Autodesk专业级3D建模软件', url: 'https://www.autodesk.com/products/maya/', category: 'threed-software', subCategory: 'threed-software-modeling', isHot: true, isFeatured: true },
  { name: '3ds Max', description: 'Autodesk专业3D建模和渲染软件', url: 'https://www.autodesk.com/products/3ds-max/', category: 'threed-software', subCategory: 'threed-software-modeling', isHot: true },
  { name: 'Cinema 4D', description: 'Maxon专业3D建模和动画软件', url: 'https://www.maxon.net/cinema-4d', category: 'threed-software', subCategory: 'threed-software-animation', isHot: true },
  { name: 'SketchUp', description: '易学易用的3D建模软件', url: 'https://www.sketchup.com/', category: 'threed-software', subCategory: 'threed-software-modeling', isHot: true, isFeatured: true },
  { name: 'V-Ray', description: '业界领先的渲染引擎', url: 'https://www.chaosgroup.com/vray', category: 'threed-software', subCategory: 'threed-software-rendering', isHot: true, isFeatured: true },
  { name: 'Octane Render', description: '基于GPU的无偏差渲染器', url: 'https://home.otoy.com/render/octane-render/', category: 'threed-software', subCategory: 'threed-software-rendering', isHot: true },
  { name: 'TurboSquid', description: '全球最大的3D模型市场', url: 'https://www.turbosquid.com/', category: 'threed-models', subCategory: 'threed-models-paid', isHot: true, isFeatured: true },
  { name: 'Sketchfab', description: '3D模型展示和下载平台', url: 'https://sketchfab.com/', category: 'threed-models', subCategory: 'threed-models-free', isHot: true, isFeatured: true },
  { name: 'CGTrader', description: '3D模型和VR/AR资产市场', url: 'https://www.cgtrader.com/', category: 'threed-models', subCategory: 'threed-models-paid', isHot: true, isFeatured: true },
  { name: 'Poliigon', description: '高质量PBR材质和贴图库', url: 'https://www.poliigon.com/', category: 'texture-materials', subCategory: 'texture-materials-pbr', isHot: true, isFeatured: true },
  { name: 'HDRI Haven', description: '免费高质量HDRI环境贴图', url: 'https://hdrihaven.com/', category: 'texture-materials', subCategory: 'texture-materials-hdri', isHot: true, isFeatured: true },
  { name: 'Unity', description: '跨平台游戏引擎', url: 'https://unity.com/', category: 'game-engines', subCategory: 'game-engines-3d', isHot: true, isFeatured: true },
  { name: 'Unreal Engine', description: 'Epic Games高端游戏引擎', url: 'https://www.unrealengine.com/', category: 'game-engines', subCategory: 'game-engines-3d', isHot: true, isFeatured: true },
  { name: 'ZBrush', description: '业界领先的数字雕刻软件', url: 'https://pixologic.com/', category: 'digital-sculpting', subCategory: 'digital-sculpting-character', isHot: true, isFeatured: true },
  { name: 'ArtStation', description: '数字艺术作品展示平台', url: 'https://www.artstation.com/', category: 'threed-community', subCategory: 'threed-community-portfolio', isHot: true, isFeatured: true },
];

// Design工具网站
const designWebsites = [
  { name: 'Notion', description: '全能的工作空间，支持笔记、项目管理', url: 'https://www.notion.so', category: 'common-tools', subCategory: 'efficiency-tools', isHot: true, isFeatured: true },
  { name: 'Remove.bg', description: 'AI一键抠图工具', url: 'https://www.remove.bg', category: 'common-tools', subCategory: 'one-click-cutout', isHot: true, isFeatured: true },
  { name: 'TinyPNG', description: '在线图片压缩工具', url: 'https://tinypng.com', category: 'common-tools', subCategory: 'online-tools', isHot: true, isFeatured: true },
  { name: 'Photopea', description: '在线版Photoshop', url: 'https://www.photopea.com', category: 'common-tools', subCategory: 'online-tools', isHot: true, isFeatured: true },
  { name: 'Coolors', description: '快速生成配色方案', url: 'https://coolors.co', category: 'common-tools', subCategory: 'online-color', isHot: true, isFeatured: true },
  { name: 'Dribbble', description: '设计师社区，优秀设计作品分享', url: 'https://dribbble.com', category: 'inspiration', subCategory: 'inspiration-general', isHot: true, isFeatured: true },
  { name: 'Behance', description: 'Adobe旗下全球最大的创意作品展示平台', url: 'https://www.behance.net/', category: 'inspiration', subCategory: 'inspiration-general', isHot: true, isFeatured: true },
  { name: '站酷 ZCOOL', description: '中国最大的设计师互动平台', url: 'https://www.zcool.com.cn/', category: 'inspiration', subCategory: 'inspiration-general', isHot: true, isFeatured: true },
  { name: '花瓣网', description: '设计师寻找灵感的天堂', url: 'https://huaban.com/', category: 'inspiration', subCategory: 'inspiration-general', isHot: true, isFeatured: true },
  { name: 'Pinterest', description: '丰富的视觉素材平台', url: 'http://www.pinterest.com', category: 'inspiration', subCategory: 'inspiration-general', isHot: true },
  { name: 'LogoLounge', description: '全球最大的Logo设计灵感平台', url: 'https://www.logolounge.com/', category: 'inspiration', subCategory: 'inspiration-logo', isHot: true, isFeatured: true },
  { name: 'PosterSpy', description: '电影海报设计灵感收集平台', url: 'https://posterspy.com/', category: 'inspiration', subCategory: 'inspiration-poster', isHot: true, isFeatured: true },
  { name: 'Iconfont', description: '阿里巴巴矢量图标库', url: 'https://www.iconfont.cn/', category: 'design-resources', subCategory: 'design-resources-icons', isHot: true, isFeatured: true },
  { name: 'Unsplash', description: '免费高质量图片素材库', url: 'https://unsplash.com/', category: 'design-resources', subCategory: 'design-resources-images', isHot: true, isFeatured: true },
  { name: 'Pexels', description: '免费素材图片和视频', url: 'https://www.pexels.com/', category: 'design-resources', subCategory: 'design-resources-images', isHot: true },
  { name: 'unDraw', description: '开源插画库，可自定义颜色', url: 'https://undraw.co/', category: 'design-resources', subCategory: 'design-resources-illustrations', isHot: true, isFeatured: true },
];

// Ecommerce工具网站
const ecommerceWebsites = [
  { name: 'Dribbble电商', description: '全球最大的设计师社区，电商设计灵感', url: 'https://dribbble.com/tags/ecommerce', category: 'design-inspiration', subCategory: 'ecommerce-showcase', isHot: true, isFeatured: true },
  { name: 'Behance电商', description: 'Adobe旗下创意平台，电商设计作品', url: 'https://www.behance.net/search/projects?field=ui%2Fux&tags=ecommerce', category: 'design-inspiration', subCategory: 'ecommerce-showcase', isHot: true },
  { name: '大美工', description: '收罗优秀电商设计、网店设计灵感', url: 'https://dameigong.cn/', category: 'design-inspiration', subCategory: 'ecommerce-showcase', isHot: true, isFeatured: true },
  { name: 'Shopify', description: '全球领先的电商建站平台', url: 'https://www.shopify.com/', category: 'store-design', subCategory: 'store-builder', isHot: true, isFeatured: true },
  { name: 'WooCommerce', description: 'WordPress电商插件', url: 'https://woocommerce.com/', category: 'store-design', subCategory: 'store-builder', isHot: true },
  { name: 'Canva', description: '在线设计工具，产品图片编辑', url: 'https://www.canva.com/', category: 'product-photo', subCategory: 'photo-editing', isHot: true, isFeatured: true },
];

// Interior工具网站
const interiorWebsites = [
  { name: 'AutoCAD', description: 'Autodesk专业CAD设计软件', url: 'https://www.autodesk.com/products/autocad/', category: 'cad-software', subCategory: 'cad-2d', isHot: true, isFeatured: true },
  { name: 'SketchUp', description: '易学易用的3D建模软件', url: 'https://www.sketchup.com/', category: '3d-modeling', subCategory: '3d-general', isHot: true, isFeatured: true },
  { name: '3ds Max', description: 'Autodesk专业3D建模和渲染软件', url: 'https://www.autodesk.com/products/3ds-max/', category: '3d-modeling', subCategory: '3d-general', isHot: true },
  { name: 'V-Ray', description: '业界领先的渲染引擎', url: 'https://www.chaosgroup.com/vray', category: 'rendering', subCategory: 'rendering-offline', isHot: true, isFeatured: true },
  { name: 'Lumion', description: '专业的建筑可视化和景观渲染软件', url: 'https://lumion.com/', category: 'rendering', subCategory: 'rendering-realtime', isHot: true, isFeatured: true },
  { name: 'Enscape', description: '实时渲染和虚拟现实插件', url: 'https://enscape3d.com/', category: 'vr-walkthrough', subCategory: 'vr-web', isHot: true, isFeatured: true },
  { name: '酷家乐', description: '在线室内设计平台', url: 'https://www.kujiale.com/', category: 'vr-walkthrough', subCategory: 'vr-web', isHot: true, isFeatured: true },
  { name: '3D溜溜网', description: '专业的3D模型素材下载网站', url: 'https://www.3d66.com/', category: 'furniture-design', subCategory: 'furniture-library', isHot: true, isFeatured: true },
];

// Font工具网站
const fontWebsites = [
  { name: 'Google Fonts', description: '免费开源字体库', url: 'https://fonts.google.com/', category: 'web-fonts', subCategory: 'web-cdn', isHot: true, isFeatured: true },
  { name: 'Adobe Fonts', description: 'Adobe字体服务', url: 'https://fonts.adobe.com/', category: 'english-fonts', subCategory: 'english-sans', isHot: true, isFeatured: true },
  { name: '字由', description: '设计师必备字体工具', url: 'https://www.hellofont.cn/', category: 'font-tools', subCategory: 'font-manager', isHot: true, isFeatured: true },
  { name: '方正字库', description: '中国知名字体厂商', url: 'https://www.foundertype.com/', category: 'chinese-fonts', subCategory: 'chinese-sans', isHot: true, isFeatured: true },
  { name: '汉仪字库', description: '专业中文字体设计', url: 'https://www.hanyi.com.cn/', category: 'chinese-fonts', subCategory: 'chinese-sans', isHot: true },
  { name: 'Font Squirrel', description: '免费商用字体下载', url: 'https://www.fontsquirrel.com/', category: 'english-fonts', subCategory: 'english-sans', isHot: true, isFeatured: true },
  { name: 'DaFont', description: '免费字体下载网站', url: 'https://www.dafont.com/', category: 'english-fonts', subCategory: 'english-display', isHot: true },
  { name: 'Fontpair', description: '字体搭配灵感', url: 'https://fontpair.co/', category: 'font-pairing', subCategory: 'pairing-gallery', isHot: true, isFeatured: true },
];

// 页面与网站的映射
const pageWebsites = {
  ai: aiWebsites,
  design: designWebsites,
  '3d': threeDWebsites,
  ecommerce: ecommerceWebsites,
  interior: interiorWebsites,
  font: fontWebsites
};

// 导入网站函数
async function importWebsites(pageSlug, websites) {
  console.log(`\n🌐 导入 ${pageSlug} 页面的网站...`);
  
  let imported = 0;
  let skipped = 0;
  
  for (const site of websites) {
    try {
      // 查找分类 - 优先子分类
      const subCategorySlug = site.subCategory ? `${pageSlug}-${site.subCategory}` : null;
      const mainCategorySlug = `${pageSlug}-${site.category}`;
      
      let category = null;
      if (subCategorySlug) {
        category = await prisma.category.findUnique({ where: { slug: subCategorySlug } });
      }
      if (!category) {
        category = await prisma.category.findUnique({ where: { slug: mainCategorySlug } });
      }
      
      if (!category) {
        console.log(`  ⚠️ 找不到分类: ${site.subCategory || site.category}, 跳过: ${site.name}`);
        skipped++;
        continue;
      }
      
      // 检查是否已存在
      const existing = await prisma.website.findFirst({ where: { url: site.url } });
      if (existing) {
        skipped++;
        continue;
      }
      
      // 创建网站
      await prisma.website.create({
        data: {
          name: site.name,
          description: site.description,
          url: site.url,
          categoryId: category.id,
          isNew: site.isNew || false,
          isFeatured: site.isFeatured || false,
          isHot: site.isHot || false,
          tags: JSON.stringify(site.tags || []),
          order: 0,
        }
      });
      imported++;
    } catch (error) {
      if (!error.message.includes('Unique constraint')) {
        console.error(`  ❌ 导入失败: ${site.name}`, error.message);
      }
      skipped++;
    }
  }
  
  console.log(`  ✅ 导入: ${imported} 个, 跳过: ${skipped} 个`);
  return imported;
}

// 主函数
async function main() {
  console.log('🚀 开始导入所有页面数据...\n');
  console.log('=' .repeat(50));
  
  let totalCategories = 0;
  let totalWebsites = 0;
  
  // 导入各页面的分类
  for (const [pageSlug, categories] of Object.entries(pageCategories)) {
    const count = await importCategories(pageSlug, categories);
    totalCategories += count;
  }
  
  console.log('\n' + '=' .repeat(50));
  
  // 导入各页面的网站
  for (const [pageSlug, websites] of Object.entries(pageWebsites)) {
    const count = await importWebsites(pageSlug, websites);
    totalWebsites += count;
  }
  
  console.log('\n' + '=' .repeat(50));
  
  // 显示统计
  const categoryCount = await prisma.category.count();
  const websiteCount = await prisma.website.count();
  const pageCount = await prisma.page.count();
  
  console.log('\n📊 数据库统计:');
  console.log(`  - 页面: ${pageCount} 个`);
  console.log(`  - 分类: ${categoryCount} 个`);
  console.log(`  - 网站: ${websiteCount} 个`);
  console.log(`\n✨ 本次导入: ${totalCategories} 个分类, ${totalWebsites} 个网站`);
}

main()
  .catch((error) => {
    console.error('💥 导入失败:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
