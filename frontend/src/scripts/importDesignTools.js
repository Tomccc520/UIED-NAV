/**
 * @file importDesignTools.js
 * @description 将设计工具数据导入设计工具数据库 - 支持动态分类
 * @copyright 版权所有 (c) 2025 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

const fs = require('fs');
const path = require('path');

// 读取命令行参数
const args = process.argv.slice(2);

// 过滤掉--file参数，获取分类参数
let filteredArgs = args.filter((arg, index) => {
  if (arg === '--file') return false;
  if (index > 0 && args[index - 1] === '--file') return false;
  return true;
});

const targetCategory = filteredArgs[0] || null; // 目标分类参数
const targetSubCategory = filteredArgs[1] || null; // 目标子分类参数

// 🎯 支持的分类映射 - 基于designToolsDatabase.js
const CATEGORY_MAPPINGS = {
  // 常用工具
  'common-tools': {
    'efficiency': 'efficiency-tools',           // 效率工具
    'cutout': 'one-click-cutout',              // 一键抠图
    'online': 'online-tools',                  // 在线工具
    'office': 'collaborative-office',         // 协同办公
    'color': 'online-color',                   // 在线配色
    'docs': 'online-docs',                     // 在线文档
    'generator': 'online-generator',           // 在线生成
    'conversion': 'format-conversion'          // 格式转换
  },
  
  // 平面灵感
  'inspiration': {
    'general': 'inspiration-general',          // 平面灵感
    'poster': 'inspiration-poster',            // 海报灵感
    'logo': 'inspiration-logo',                // Logo灵感
    'packaging': 'inspiration-packaging',      // 包装灵感
    'branding': 'inspiration-branding',        // 品牌灵感
    'typography': 'inspiration-typography',    // 字体灵感
    'magazine': 'inspiration-magazine',        // 设计杂志
    'portfolio': 'inspiration-portfolio'       // 设计师作品集
  },
  
  // 设计素材
  'design-resources': {
    'plane': 'design-resources-plane',         // 平面素材
    'ui': 'design-resources-ui',               // UI素材
    'icons': 'design-resources-icons',         // 图标素材
    'images': 'design-resources-images',       // 可商用图库
    'illustrations': 'design-resources-illustrations', // 可商用插画
    'video': 'design-resources-video',         // 可商用视频
    'fonts': 'design-resources-fonts',         // 可商用字体
    'mockups': 'design-resources-mockups',     // 样机素材
    'fontwebsites': 'design-resources-fontwebsites', // 字体网站
    'soundeffects': 'design-resources-soundeffects', // 音效网站
    'ppt': 'design-resources-ppt',             // PPT资源
    '3d': 'design-resources-3d',               // 3D素材
    '3dmodels': 'design-resources-3dmodels',   // 3D模型
    'aepr': 'design-resources-aepr',           // AE/PR模板
    'cutout': 'design-resources-cutout'        // 免抠素材
  },
  
  // 字体资源
  'font': {
    'default': 'font'                          // 字体资源
  },
  
  // 配色工具
  'color': {
    'palette': 'color-palette',                // 配色方案
    'theory': 'color-theory',                  // 色彩理论
    'tools': 'color-tools',                    // 调色工具
    'inspiration': 'color-inspiration'         // 配色灵感
  },
  
  // 印刷设计
  'print': {
    'business': 'print-business',              // 名片设计
    'brochure': 'print-brochure',              // 宣传册
    'poster': 'print-poster',                  // 海报设计
    'packaging': 'print-packaging'             // 包装设计
  },
  
  // 图形设计
  'graphic': {
    'logo': 'graphic-logo',                    // 标志设计
    'illustration': 'graphic-illustration',    // 插画设计
    'icon': 'graphic-icon',                    // 图标设计
    'vector': 'graphic-vector'                 // 矢量图形
  },
  
  // 品牌设计
  'brand': {
    'identity': 'brand-identity',              // 品牌识别
    'guidelines': 'brand-guidelines',          // 品牌规范
    'cases': 'brand-cases',                    // 品牌案例
    'tools': 'brand-tools'                     // 品牌工具
  },
  
  // 图片处理
  'photo': {
    'editing': 'photo-editing',                // 图片编辑
    'filters': 'photo-filters',                // 滤镜效果
    'compression': 'photo-compression',        // 图片压缩
    'enhancement': 'photo-enhancement'         // 图片增强
  },
  
  // 艺术创作
  'art': {
    'painting': 'art-painting',                // 数字绘画
    'sketching': 'art-sketching',              // 草图绘制
    'concept': 'art-concept',                  // 概念艺术
    'tools': 'art-tools'                       // 绘画工具
  }
};

// 🎨 生成更好的工具描述
function generateBetterDescription(name, tags, url) {
  const tagDescriptions = {
    'design': '设计创作',
    'image': '图像处理',
    'color': '色彩工具',
    'font': '字体设计',
    'print': '印刷设计',
    'brand': '品牌设计',
    'vector': '矢量图形',
    'logo': '标志设计',
    'illustration': '插画设计',
    'photography': '摄影处理',
    'template': '模板素材',
    'free': '免费使用',
    'online': '在线工具',
    'tools': '工具集',
    'creative': '创意设计',
    'professional': '专业工具',
    'inspiration': '设计灵感',
    'mockup': '样机素材',
    'resource': '设计资源'
  };
  
  // 根据标签生成描述
  const relevantTags = tags.filter(tag => tagDescriptions[tag]).slice(0, 3);
  const tagDesc = relevantTags.map(tag => tagDescriptions[tag]).join('、');
  
  // 根据域名判断工具类型
  let platformDesc = '';
  if (url.includes('design')) platformDesc = '专业的';
  else if (url.includes('creative')) platformDesc = '创意';
  else if (url.includes('free')) platformDesc = '免费的';
  else if (url.includes('pro')) platformDesc = '专业';
  
  // 生成描述
  if (tagDesc) {
    return `${platformDesc}${tagDesc}工具，为设计师提供高效便捷的创作体验。`;
  } else {
    return `${platformDesc}设计工具，助力设计师轻松完成创作任务。`;
  }
}

// 🧠 智能分类识别函数
function identifyToolCategory(tool) {
  const text = (tool.name + ' ' + tool.description + ' ' + tool.url + ' ' + tool.tags.join(' ')).toLowerCase();
  
  // 常用工具识别
  if (text.match(/(效率|工具|在线|实用|便捷|协作|办公|生成|转换)/)) {
    if (text.match(/(抠图|背景|remove|cutout)/)) {
      return { category: 'common-tools', subCategory: 'one-click-cutout' };
    } else if (text.match(/(协作|办公|团队|collaboration)/)) {
      return { category: 'common-tools', subCategory: 'collaborative-office' };
    } else if (text.match(/(配色|颜色|color)/)) {
      return { category: 'common-tools', subCategory: 'online-color' };
    } else if (text.match(/(文档|docs|document)/)) {
      return { category: 'common-tools', subCategory: 'online-docs' };
    } else if (text.match(/(生成|generator|create)/)) {
      return { category: 'common-tools', subCategory: 'online-generator' };
    } else if (text.match(/(转换|convert|format)/)) {
      return { category: 'common-tools', subCategory: 'format-conversion' };
    } else {
      return { category: 'common-tools', subCategory: 'efficiency-tools' };
    }
  }
  
  // 设计灵感识别
  if (text.match(/(灵感|inspiration|创意|案例|展示|gallery|showcase)/)) {
    if (text.match(/(海报|poster)/)) {
      return { category: 'inspiration', subCategory: 'inspiration-poster' };
    } else if (text.match(/(logo|标志|商标)/)) {
      return { category: 'inspiration', subCategory: 'inspiration-logo' };
    } else if (text.match(/(包装|packaging)/)) {
      return { category: 'inspiration', subCategory: 'inspiration-packaging' };
    } else if (text.match(/(品牌|brand)/)) {
      return { category: 'inspiration', subCategory: 'inspiration-branding' };
    } else if (text.match(/(字体|typography|font)/)) {
      return { category: 'inspiration', subCategory: 'inspiration-typography' };
    } else if (text.match(/(杂志|magazine)/)) {
      return { category: 'inspiration', subCategory: 'inspiration-magazine' };
    } else if (text.match(/(作品集|portfolio)/)) {
      return { category: 'inspiration', subCategory: 'inspiration-portfolio' };
    } else {
      return { category: 'inspiration', subCategory: 'inspiration-general' };
    }
  }
  
  // 设计素材识别
  if (text.match(/(素材|资源|resource|material|template|mockup)/)) {
    if (text.match(/(ui|界面|interface)/)) {
      return { category: 'design-resources', subCategory: 'design-resources-ui' };
    } else if (text.match(/(图标|icon)/)) {
      return { category: 'design-resources', subCategory: 'design-resources-icons' };
    } else if (text.match(/(图片|图库|photo|image)/)) {
      return { category: 'design-resources', subCategory: 'design-resources-images' };
    } else if (text.match(/(插画|illustration)/)) {
      return { category: 'design-resources', subCategory: 'design-resources-illustrations' };
    } else if (text.match(/(视频|video)/)) {
      return { category: 'design-resources', subCategory: 'design-resources-video' };
    } else if (text.match(/(字体|font)/)) {
      return { category: 'design-resources', subCategory: 'design-resources-fonts' };
    } else if (text.match(/(样机|mockup)/)) {
      return { category: 'design-resources', subCategory: 'design-resources-mockups' };
    } else if (text.match(/(3d|三维|立体)/)) {
      return { category: 'design-resources', subCategory: 'design-resources-3d' };
    } else if (text.match(/(ae|pr|after effects|premiere)/)) {
      return { category: 'design-resources', subCategory: 'design-resources-aepr' };
    } else if (text.match(/(免抠|透明|cutout)/)) {
      return { category: 'design-resources', subCategory: 'design-resources-cutout' };
    } else {
      return { category: 'design-resources', subCategory: 'design-resources-plane' };
    }
  }
  
  // 配色工具识别
  if (text.match(/(配色|颜色|色彩|color|palette)/)) {
    if (text.match(/(理论|theory)/)) {
      return { category: 'color', subCategory: 'color-theory' };
    } else if (text.match(/(调色|编辑|editor)/)) {
      return { category: 'color', subCategory: 'color-tools' };
    } else if (text.match(/(灵感|inspiration)/)) {
      return { category: 'color', subCategory: 'color-inspiration' };
    } else {
      return { category: 'color', subCategory: 'color-palette' };
    }
  }
  
  // 印刷设计识别
  if (text.match(/(印刷|打印|print|名片|宣传册|包装)/)) {
    if (text.match(/(名片|business card)/)) {
      return { category: 'print', subCategory: 'print-business' };
    } else if (text.match(/(宣传册|brochure)/)) {
      return { category: 'print', subCategory: 'print-brochure' };
    } else if (text.match(/(包装|packaging)/)) {
      return { category: 'print', subCategory: 'print-packaging' };
    } else {
      return { category: 'print', subCategory: 'print-poster' };
    }
  }
  
  // 图形设计识别
  if (text.match(/(图形|矢量|vector|logo|标志|插画|illustration)/)) {
    if (text.match(/(logo|标志|商标)/)) {
      return { category: 'graphic', subCategory: 'graphic-logo' };
    } else if (text.match(/(插画|illustration)/)) {
      return { category: 'graphic', subCategory: 'graphic-illustration' };
    } else if (text.match(/(图标|icon)/)) {
      return { category: 'graphic', subCategory: 'graphic-icon' };
    } else {
      return { category: 'graphic', subCategory: 'graphic-vector' };
    }
  }
  
  // 品牌设计识别
  if (text.match(/(品牌|brand|vi|视觉识别|企业形象)/)) {
    if (text.match(/(识别|identity|vi)/)) {
      return { category: 'brand', subCategory: 'brand-identity' };
    } else if (text.match(/(规范|guidelines|标准)/)) {
      return { category: 'brand', subCategory: 'brand-guidelines' };
    } else if (text.match(/(案例|case|展示)/)) {
      return { category: 'brand', subCategory: 'brand-cases' };
    } else {
      return { category: 'brand', subCategory: 'brand-tools' };
    }
  }
  
  // 图片处理识别
  if (text.match(/(图片|照片|photo|image|修图|编辑)/)) {
    if (text.match(/(滤镜|filter|效果)/)) {
      return { category: 'photo', subCategory: 'photo-filters' };
    } else if (text.match(/(压缩|compress|优化)/)) {
      return { category: 'photo', subCategory: 'photo-compression' };
    } else if (text.match(/(增强|enhance|提升)/)) {
      return { category: 'photo', subCategory: 'photo-enhancement' };
    } else {
      return { category: 'photo', subCategory: 'photo-editing' };
    }
  }
  
  // 艺术创作识别
  if (text.match(/(绘画|艺术|art|painting|drawing|创作)/)) {
    if (text.match(/(草图|sketch)/)) {
      return { category: 'art', subCategory: 'art-sketching' };
    } else if (text.match(/(概念|concept)/)) {
      return { category: 'art', subCategory: 'art-concept' };
    } else if (text.match(/(工具|tool)/)) {
      return { category: 'art', subCategory: 'art-tools' };
    } else {
      return { category: 'art', subCategory: 'art-painting' };
    }
  }
  
  // 字体资源识别
  if (text.match(/(字体|font|typography|排版)/)) {
    return { category: 'font', subCategory: 'font' };
  }
  
  // 默认分类到设计素材
  return { category: 'design-resources', subCategory: 'design-resources-plane' };
}

// 读取提取的工具数据 - 支持动态指定文件
let extractedToolsPath = path.join(__dirname, '../data/uiux_tools_extracted_2025-06-18.js');

// 支持通过环境变量或命令行参数指定输入文件
if (process.env.INPUT_FILE) {
  extractedToolsPath = path.join(__dirname, '../data/', process.env.INPUT_FILE);
} else if (args.includes('--file')) {
  const fileIndex = args.indexOf('--file');
  if (fileIndex < args.length - 1) {
    extractedToolsPath = path.join(__dirname, '../data/', args[fileIndex + 1]);
  }
}

console.log('📂 输入文件路径：', extractedToolsPath);

/**
 * 🎯 严格的分类映射函数 - 完全按命令行参数强制分类
 */
const mapCategoryToDesign = (tool) => {
  // 如果指定了完整的分类，强制使用指定分类
  if (targetCategory && targetSubCategory) {
    const fullSubCategory = CATEGORY_MAPPINGS[targetCategory]?.[targetSubCategory];
    if (fullSubCategory) {
      console.log(`🎯 强制分类: ${tool.name || tool.id} → ${fullSubCategory}`);
      return { category: targetCategory, subCategory: fullSubCategory };
    } else {
      // 即使无效，也返回用户指定的分类
      const forcedSubCategory = `${targetCategory}-${targetSubCategory}`;
      console.log(`🎯 强制分类(自定义): ${tool.name || tool.id} → ${forcedSubCategory}`);
      return { category: targetCategory, subCategory: forcedSubCategory };
    }
  }
  
  // 如果只指定了主分类，强制使用该主分类的第一个子分类
  if (targetCategory && CATEGORY_MAPPINGS[targetCategory]) {
    const firstSubCategory = Object.values(CATEGORY_MAPPINGS[targetCategory])[0];
    console.log(`🎯 强制主分类: ${tool.name || tool.id} → ${firstSubCategory}`);
    return { category: targetCategory, subCategory: firstSubCategory };
  }
  
  // 如果指定了主分类但不在映射表中，仍然强制使用用户指定的分类
  if (targetCategory) {
    const forcedSubCategory = targetSubCategory ? `${targetCategory}-${targetSubCategory}` : `${targetCategory}-default`;
    console.log(`🎯 强制分类(用户指定): ${tool.name || tool.id} → ${forcedSubCategory}`);
    return { category: targetCategory, subCategory: forcedSubCategory };
  }
  
  // 如果没有指定分类，使用智能识别
  console.log(`🧠 智能识别: ${tool.name || tool.id}`);
  return identifyToolCategory(tool);
};

/**
 * 转换工具数据格式
 */
const transformTool = (tool) => {
  const { category, subCategory } = mapCategoryToDesign(tool);
  
  // 🎨 优化标题
  let cleanName = tool.name;
  if (cleanName.includes('                    ')) {
    cleanName = cleanName.split('                    ')[0].trim();
  }
  cleanName = cleanName.replace(/[：:]\s*$/, '').trim();
  
  // 🎨 优化简介
  let cleanDescription = tool.description;
  if (cleanDescription.startsWith('优质的')) {
    cleanDescription = cleanDescription.replace(/^优质的/, '').trim();
  }
  if (cleanDescription.includes('工具网站')) {
    cleanDescription = cleanDescription.replace(/工具网站$/, '').trim();
  }
  if (cleanDescription.includes('                    ')) {
    const parts = cleanDescription.split('                    ');
    cleanDescription = parts[0].trim();
  }
  if (cleanDescription === cleanName || cleanDescription.includes(cleanName)) {
    cleanDescription = generateBetterDescription(cleanName, tool.tags, tool.url);
  }
  if (cleanDescription && !cleanDescription.match(/[。.!！]$/)) {
    cleanDescription += '。';
  }
  
  // 生成iconUrl
  const generateIconUrl = (url) => {
    try {
      const urlObj = new URL(url);
      const domain = urlObj.hostname;
      return `https://t3.gstatic.cn/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&size=128&url=${domain}`;
    } catch (error) {
      return 'https://t3.gstatic.cn/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&size=128&url=example.com';
    }
  };

  // 生成唯一ID
  const baseId = `design-${tool.id}`;
  const timestamp = Date.now();
  const uniqueId = `${baseId}-${timestamp}`;

  return {
    id: uniqueId,
    name: cleanName,
    description: cleanDescription,
    url: tool.url,
    iconUrl: tool.iconUrl || generateIconUrl(tool.url),
    category,
    subcategory: subCategory, // 注意：design数据库使用subcategory而不是subCategory
    tags: tool.tags.filter(tag => tag !== 'tool'),
    isHot: tool.isHot || false,
    isFeatured: tool.isFeatured || false,
    isNew: true,
    rating: tool.rating || 4.0
  };
};

/**
 * 读取现有的设计工具数据库
 */
const readExistingTools = () => {
  try {
    const designToolsPath = path.join(__dirname, '../data/designToolsDatabase.js');
    const content = fs.readFileSync(designToolsPath, 'utf8');
    return content;
  } catch (error) {
    console.error('读取现有工具数据失败:', error);
    return null;
  }
};

/**
 * 🎯 显示使用说明
 */
const showUsage = () => {
  console.log('📖 使用说明:');
  console.log('');
  console.log('🎯 智能分类 (推荐):');
  console.log('   node importDesignTools.js');
  console.log('   → 自动识别工具类型并分配合适的分类');
  console.log('');
  console.log('🎯 指定输入文件:');
  console.log('   node importDesignTools.js --file uiux_tools_extracted_2025.js');
  console.log('   → 指定要导入的数据文件');
  console.log('');
  console.log('🎯 指定主分类:');
  console.log('   node importDesignTools.js inspiration');
  console.log('   → 所有工具强制导入到平面灵感的第一个子分类');
  console.log('');
  console.log('🎯 指定详细分类:');
  console.log('   node importDesignTools.js inspiration poster');
  console.log('   → 全部导入到海报灵感分类');
  console.log('');
  console.log('🎯 指定文件和分类:');
  console.log('   node importDesignTools.js --file data.js inspiration poster');
  console.log('   → 导入指定文件到指定分类');
  console.log('');
  console.log('📋 支持的分类:');
  Object.entries(CATEGORY_MAPPINGS).forEach(([category, subCategories]) => {
    console.log(`   ${category}:`);
    Object.entries(subCategories).forEach(([key, fullKey]) => {
      const name = fullKey.replace(`${category}-`, '').replace(/-/g, ' ');
      console.log(`     ${key} → ${name}`);
    });
    console.log('');
  });
};

/**
 * 将新工具添加到设计工具数据库
 */
const importTools = () => {
  // 如果用户输入了help参数，显示使用说明
  if (args.includes('--help') || args.includes('-h')) {
    showUsage();
    return;
  }
  
  // 检查输入文件是否存在
  if (!fs.existsSync(extractedToolsPath)) {
    console.error('❌ 找不到提取的工具数据文件');
    console.log('请确保文件存在：', extractedToolsPath);
    console.log('');
    console.log('💡 使用方法：');
    console.log('  node importDesignTools.js --file filename.js');
    console.log('  或设置环境变量：INPUT_FILE=filename.js node importDesignTools.js');
    console.log('');
    console.log('📖 查看完整帮助：');
    console.log('  node importDesignTools.js --help');
    return;
  }
  
  // 读取和解析工具数据
  const extractedToolsContent = fs.readFileSync(extractedToolsPath, 'utf8');
  const extractedToolsMatch = extractedToolsContent.match(/export const extractedTools = (\[[\s\S]*?\]);/);
  if (!extractedToolsMatch) {
    console.error('❌ 无法解析提取的工具数据');
    console.error('请确保文件包含：export const extractedTools = [...];');
    return;
  }
  
  const extractedTools = eval(extractedToolsMatch[1]);
  console.log(`📂 成功读取 ${extractedTools.length} 个工具数据`);
  console.log('');
  
  console.log('🚀 开始导入设计工具数据...');
  
  // 显示当前分类策略
  if (targetCategory && targetSubCategory) {
    console.log(`🎯 强制分类: 所有工具 → ${targetCategory}-${targetSubCategory}`);
  } else if (targetCategory) {
    console.log(`🎯 强制主分类: 所有工具 → ${targetCategory} (使用第一个子分类)`);
  } else {
    console.log('🧠 智能分类: 自动识别工具类型');
  }
  
  // 转换工具数据
  const transformedTools = extractedTools.map(transformTool);
  
  console.log(`📊 共转换了 ${transformedTools.length} 个工具`);
  
  // 按分类统计
  const categoryStats = {};
  transformedTools.forEach(tool => {
    const key = tool.subcategory;
    categoryStats[key] = (categoryStats[key] || 0) + 1;
  });
  
  console.log('📈 分类统计:');
  Object.entries(categoryStats).forEach(([subCategory, count]) => {
    const displayName = subCategory.replace(/^[^-]+-/, '').replace(/-/g, ' ');
    console.log(`  ${displayName}: ${count} 个工具`);
  });
  
  // 读取现有数据库文件
  let existingContent = readExistingTools();
  if (!existingContent) {
    console.error('❌ 无法读取现有数据库文件');
    return;
  }
  
  console.log('📝 准备添加新工具数据（不删除现有数据）...');
  
  // 生成新工具的代码
  const newToolsCode = transformedTools.map(tool => {
    return `  {
    id: '${tool.id}',
    name: '${tool.name.replace(/'/g, "\\'")}',
    description: '${tool.description.replace(/'/g, "\\'")}',
    url: '${tool.url}',
    iconUrl: '${tool.iconUrl}',
    category: '${tool.category}',
    subcategory: '${tool.subcategory}',
    tags: [${tool.tags.map(tag => `'${tag}'`).join(', ')}],
    isHot: ${tool.isHot},
    isFeatured: ${tool.isFeatured},
    isNew: ${tool.isNew},
    rating: ${tool.rating}
  }`;
  }).join(',\n');
  
  // 找到designTools数组的结束位置并插入新工具
  // 尝试多种模式匹配数组结束位置
  let designToolsEndMatch = existingContent.match(/(\s*)\];\s*\n\s*\/\/ 导出所有工具数据/);
  
  if (!designToolsEndMatch) {
    // 如果找不到"导出所有工具数据"注释，尝试查找其他模式
    designToolsEndMatch = existingContent.match(/(\s*)\];\s*\n\s*\/\/ 辅助函数/);
  }
  
  if (!designToolsEndMatch) {
    // 如果还找不到，尝试查找export语句
    designToolsEndMatch = existingContent.match(/(\s*)\];\s*\n\s*export const allDesignTools/);
  }
  
  if (!designToolsEndMatch) {
    // 最后尝试简单的数组结束模式
    designToolsEndMatch = existingContent.match(/(\s*)\];\s*\n\s*\/\//);
  }
  
  if (!designToolsEndMatch) {
    console.error('❌ 无法找到designTools数组的结束位置');
    console.log('📋 数据库文件结构可能已变更，请检查文件格式');
    
    // 显示文件末尾内容以便调试
    const lines = existingContent.split('\n');
    const lastLines = lines.slice(-20);
    console.log('📄 文件末尾20行内容:');
    lastLines.forEach((line, index) => {
      console.log(`${lines.length - 20 + index + 1}: ${line}`);
    });
    return;
  }
  
  // 在数组结束前插入新工具
  const insertPosition = designToolsEndMatch.index;
  const beforeInsert = existingContent.substring(0, insertPosition);
  const afterInsert = existingContent.substring(insertPosition);
  
  // 检查是否需要在前面添加逗号
  const beforeTrimmed = beforeInsert.trim();
  const needsComma = !beforeTrimmed.endsWith('[') && !beforeTrimmed.endsWith(',');
  const commaPrefix = needsComma ? ',' : '';
  
  let insertContent = newToolsCode;
  if (commaPrefix) {
    insertContent = commaPrefix + '\n' + newToolsCode;
  }
  
  const newContent = beforeInsert + insertContent + '\n' + afterInsert;
  
  // 写入文件前进行语法检查
  try {
    // 检查是否有语法错误（如 {, 这样的问题）
    const syntaxErrors = [];
    const lines = newContent.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line === '{,') {
        syntaxErrors.push(`第${i + 1}行: 发现语法错误 "{,"`);
      }
    }
    
    if (syntaxErrors.length > 0) {
      console.error('❌ 发现语法错误:');
      syntaxErrors.forEach(error => console.error(`  ${error}`));
      console.log('🔧 正在自动修复...');
      
      // 自动修复 {, 错误
      const fixedContent = newContent.replace(/\s*\{\s*,\s*\n/g, '\n');
      
      const designToolsPath = path.join(__dirname, '../data/designToolsDatabase.js');
      fs.writeFileSync(designToolsPath, fixedContent, 'utf8');
      console.log('✅ 语法错误已修复，设计工具数据导入成功！');
    } else {
      const designToolsPath = path.join(__dirname, '../data/designToolsDatabase.js');
      fs.writeFileSync(designToolsPath, newContent, 'utf8');
      console.log('✅ 设计工具数据导入成功！');
    }
    
    const designToolsPath = path.join(__dirname, '../data/designToolsDatabase.js');
    console.log(`📝 已更新文件: ${designToolsPath}`);
    
    // 验证导入结果
    console.log('\n🔍 验证导入结果...');
    const finalContent = fs.readFileSync(designToolsPath, 'utf8');
    const finalContentLines = finalContent.split('\n').length;
    console.log(`📄 文件总行数: ${finalContentLines}`);
    
    // 检查工具总数
    const totalDesignToolCount = (finalContent.match(/id: 'design-/g) || []).length;
    console.log(`📊 数据库中设计工具总数: ${totalDesignToolCount}`);
    
    // 最终语法检查
    const finalSyntaxErrors = (finalContent.match(/\{\s*,/g) || []).length;
    if (finalSyntaxErrors === 0) {
      console.log('✅ 语法检查通过');
    } else {
      console.warn(`⚠️ 仍有 ${finalSyntaxErrors} 个语法问题需要手动修复`);
    }
    
  } catch (error) {
    console.error('❌ 写入文件失败:', error);
  }
};

// 运行导入脚本
importTools(); 