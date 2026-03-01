/**
 * @file import3DTools.js
 * @description 将3D工具数据导入3D工具数据库 - 支持动态分类
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

// 🎯 支持的分类映射 - 基于threeDToolsDatabase.js，参考UIUX命名风格
const CATEGORY_MAPPINGS = {
  // 三维软件
  'threed-software': {
    'modeling': 'threed-software-modeling',        // 建模软件
    'rendering': 'threed-software-rendering',      // 渲染软件
    'animation': 'threed-software-animation',      // 动画软件
    'cad': 'threed-software-cad'                   // CAD软件
  },
  
  // 3D模型
  'threed-models': {
    'free': 'threed-models-free',              // 免费模型
    'paid': 'threed-models-paid',              // 付费模型
    'game': 'threed-models-game',              // 游戏模型
    'arch': 'threed-models-arch'               // 建筑模型
  },
  
  // 云渲染
  'cloud-rendering': {
    'service': 'cloud-rendering-service',   // 云渲染服务
    'farm': 'cloud-rendering-farm',        // 渲染农场
    'gpu': 'cloud-rendering-gpu',          // GPU云渲染
    'ai': 'cloud-rendering-ai'             // AI云渲染
  },
  
  // 贴图网站
  'texture-materials': {
    'pbr': 'texture-materials-pbr',                 // PBR贴图
    'hdri': 'texture-materials-hdri',               // HDRI贴图
    'seamless': 'texture-materials-seamless',       // 无缝贴图
    'procedural': 'texture-materials-procedural'    // 程序贴图
  },
  
  // 交流社区
  'threed-community': {
    'forums': 'threed-community-forums',          // 论坛社区
    'learning': 'threed-community-learning',      // 学习社区
    'portfolio': 'threed-community-portfolio',    // 作品展示
    'collaboration': 'threed-community-collaboration' // 协作平台
  }
};

// 🎨 生成更好的工具描述
function generateBetterDescription(name, tags, url) {
  const tagDescriptions = {
    '3D建模': '3D建模工具',
    '渲染': '渲染引擎',
    '动画': '动画制作',
    'VR': '虚拟现实',
    'AR': '增强现实',
    '游戏': '游戏开发',
    'CAD': 'CAD设计',
    '雕刻': '数字雕刻',
    '可视化': '数据可视化',
    '贴图': '材质贴图',
    '云渲染': '云端渲染',
    '模型': '3D模型',
    '社区': '交流社区',
    'free': '免费使用',
    'online': '在线工具',
    'professional': '专业工具',
    'realtime': '实时渲染',
    'gpu': 'GPU加速'
  };
  
  // 根据标签生成描述
  const relevantTags = tags.filter(tag => tagDescriptions[tag]).slice(0, 3);
  const tagDesc = relevantTags.map(tag => tagDescriptions[tag]).join('、');
  
  // 根据域名判断工具类型
  let platformDesc = '';
  if (url.includes('3d')) platformDesc = '专业的';
  else if (url.includes('render')) platformDesc = '高性能';
  else if (url.includes('free')) platformDesc = '免费的';
  else if (url.includes('cloud')) platformDesc = '云端';
  
  // 生成描述
  if (tagDesc) {
    return `${platformDesc}${tagDesc}，为3D设计师提供专业的创作工具和服务。`;
  } else {
    return `${platformDesc}3D设计工具，助力3D设计师提升创作效率和质量。`;
  }
}

// 🧠 智能分类识别函数
function identifyToolCategory(tool) {
  const text = (tool.name + ' ' + tool.description + ' ' + tool.url + ' ' + tool.tags.join(' ')).toLowerCase();
  
  // 三维软件识别
  if (text.match(/(blender|maya|3ds max|cinema4d|软件|建模|雕刻)/)) {
    if (text.match(/(建模|modeling)/)) {
      return { category: 'threed-software', subCategory: 'threed-software-modeling' };
    } else if (text.match(/(渲染|render)/)) {
      return { category: 'threed-software', subCategory: 'threed-software-rendering' };
    } else if (text.match(/(动画|animation)/)) {
      return { category: 'threed-software', subCategory: 'threed-software-animation' };
    } else if (text.match(/(cad|工程|机械)/)) {
      return { category: 'threed-software', subCategory: 'threed-software-cad' };
    } else {
      return { category: 'threed-software', subCategory: 'threed-software-modeling' };
    }
  }
  
  // 3D模型识别
  if (text.match(/(模型|model|asset|mesh|obj|fbx|素材)/)) {
    if (text.match(/(免费|free)/)) {
      return { category: 'threed-models', subCategory: 'threed-models-free' };
    } else if (text.match(/(游戏|game)/)) {
      return { category: 'threed-models', subCategory: 'threed-models-game' };
    } else if (text.match(/(建筑|arch)/)) {
      return { category: 'threed-models', subCategory: 'threed-models-arch' };
    } else {
      return { category: 'threed-models', subCategory: 'threed-models-paid' };
    }
  }
  
  // 云渲染识别
  if (text.match(/(云渲染|cloud render|render farm|gpu cloud|在线渲染)/)) {
    if (text.match(/(服务|service)/)) {
      return { category: 'cloud-rendering', subCategory: 'cloud-rendering-service' };
    } else if (text.match(/(农场|farm)/)) {
      return { category: 'cloud-rendering', subCategory: 'cloud-rendering-farm' };
    } else if (text.match(/(gpu)/)) {
      return { category: 'cloud-rendering', subCategory: 'cloud-rendering-gpu' };
    } else if (text.match(/(ai|人工智能)/)) {
      return { category: 'cloud-rendering', subCategory: 'cloud-rendering-ai' };
    } else {
      return { category: 'cloud-rendering', subCategory: 'cloud-rendering-service' };
    }
  }
  
  // 贴图网站识别
  if (text.match(/(贴图|纹理|texture|material|pbr|hdri)/)) {
    if (text.match(/(pbr)/)) {
      return { category: 'texture-materials', subCategory: 'texture-materials-pbr' };
    } else if (text.match(/(hdri|hdr)/)) {
      return { category: 'texture-materials', subCategory: 'texture-materials-hdri' };
    } else if (text.match(/(无缝|seamless|tile)/)) {
      return { category: 'texture-materials', subCategory: 'texture-materials-seamless' };
    } else if (text.match(/(程序|procedural)/)) {
      return { category: 'texture-materials', subCategory: 'texture-materials-procedural' };
    } else {
      return { category: 'texture-materials', subCategory: 'texture-materials-pbr' };
    }
  }
  
  // 交流社区识别
  if (text.match(/(社区|论坛|交流|学习|教程|portfolio|community|forum)/)) {
    if (text.match(/(论坛|forum)/)) {
      return { category: 'threed-community', subCategory: 'threed-community-forums' };
    } else if (text.match(/(学习|教程|learning|tutorial)/)) {
      return { category: 'threed-community', subCategory: 'threed-community-learning' };
    } else if (text.match(/(作品|portfolio|展示|gallery)/)) {
      return { category: 'threed-community', subCategory: 'threed-community-portfolio' };
    } else if (text.match(/(协作|collaboration|team)/)) {
      return { category: 'threed-community', subCategory: 'threed-community-collaboration' };
    } else {
      return { category: 'threed-community', subCategory: 'threed-community-forums' };
    }
  }
  
  // 渲染引擎识别
  if (text.match(/(渲染|render|引擎|engine)/)) {
    if (text.match(/(实时|real.*time|rt)/)) {
      return { category: 'rendering', subCategory: 'rendering-realtime' };
    } else if (text.match(/(gpu)/)) {
      return { category: 'rendering', subCategory: 'rendering-gpu' };
    } else if (text.match(/(云|cloud)/)) {
      return { category: 'rendering', subCategory: 'rendering-cloud' };
    } else {
      return { category: 'rendering', subCategory: 'rendering-offline' };
    }
  }
  
  // 动画制作识别
  if (text.match(/(动画|animation|motion|特效|fx)/)) {
    if (text.match(/(角色|character)/)) {
      return { category: 'animation', subCategory: 'animation-character' };
    } else if (text.match(/(运动图形|motion)/)) {
      return { category: 'animation', subCategory: 'animation-motion' };
    } else if (text.match(/(特效|fx|effect)/)) {
      return { category: 'animation', subCategory: 'animation-fx' };
    } else if (text.match(/(物理|simulation|模拟)/)) {
      return { category: 'animation', subCategory: 'animation-simulation' };
    } else {
      return { category: 'animation', subCategory: 'animation-character' };
    }
  }
  
  // VR/AR识别
  if (text.match(/(vr|ar|虚拟现实|增强现实|混合现实)/)) {
    if (text.match(/(vr|虚拟现实)/)) {
      return { category: 'vr-ar', subCategory: 'vr-engines' };
    } else if (text.match(/(ar|增强现实)/)) {
      return { category: 'vr-ar', subCategory: 'ar-tools' };
    } else if (text.match(/(混合现实|mixed reality)/)) {
      return { category: 'vr-ar', subCategory: 'mixed-reality' };
    } else {
      return { category: 'vr-ar', subCategory: 'vr-content' };
    }
  }
  
  // 游戏开发识别
  if (text.match(/(游戏|game|unity|unreal)/)) {
    if (text.match(/(引擎|engine)/)) {
      return { category: 'game-dev', subCategory: 'game-engines' };
    } else if (text.match(/(资产|asset)/)) {
      return { category: 'game-dev', subCategory: 'game-assets' };
    } else if (text.match(/(工具|tool)/)) {
      return { category: 'game-dev', subCategory: 'game-tools' };
    } else if (text.match(/(发布|publish)/)) {
      return { category: 'game-dev', subCategory: 'game-publishing' };
    } else {
      return { category: 'game-dev', subCategory: 'game-engines' };
    }
  }
  
  // CAD设计识别
  if (text.match(/(cad|工程|机械|建筑|工业设计)/)) {
    if (text.match(/(机械|mechanical)/)) {
      return { category: 'cad', subCategory: 'cad-mechanical' };
    } else if (text.match(/(建筑|architectural)/)) {
      return { category: 'cad', subCategory: 'cad-architectural' };
    } else if (text.match(/(工业|industrial)/)) {
      return { category: 'cad', subCategory: 'cad-industrial' };
    } else if (text.match(/(仿真|simulation)/)) {
      return { category: 'cad', subCategory: 'cad-simulation' };
    } else {
      return { category: 'cad', subCategory: 'cad-mechanical' };
    }
  }
  
  // 数字雕刻识别
  if (text.match(/(雕刻|sculpt|zbrush)/)) {
    if (text.match(/(角色|character)/)) {
      return { category: 'sculpting', subCategory: 'sculpting-character' };
    } else if (text.match(/(环境|environment)/)) {
      return { category: 'sculpting', subCategory: 'sculpting-environment' };
    } else if (text.match(/(硬表面|hard surface)/)) {
      return { category: 'sculpting', subCategory: 'sculpting-hard-surface' };
    } else if (text.match(/(重拓扑|retopology)/)) {
      return { category: 'sculpting', subCategory: 'sculpting-retopology' };
    } else {
      return { category: 'sculpting', subCategory: 'sculpting-character' };
    }
  }
  
  // 可视化识别
  if (text.match(/(可视化|visualization|viz)/)) {
    if (text.match(/(建筑|arch)/)) {
      return { category: 'visualization', subCategory: 'viz-architectural' };
    } else if (text.match(/(数据|data)/)) {
      return { category: 'visualization', subCategory: 'viz-data' };
    } else if (text.match(/(科学|scientific)/)) {
      return { category: 'visualization', subCategory: 'viz-scientific' };
    } else if (text.match(/(交互|interactive)/)) {
      return { category: 'visualization', subCategory: 'viz-interactive' };
    } else {
      return { category: 'visualization', subCategory: 'viz-architectural' };
    }
  }
  
  // 默认分类到三维软件
  return { category: 'threed-software', subCategory: 'threed-software-modeling' };
}

// 读取提取的工具数据 - 支持动态指定文件
let extractedToolsPath = path.join(__dirname, '../data/threed_tools_extracted_2025.js');

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
const mapCategoryTo3D = (tool) => {
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
  const { category, subCategory } = mapCategoryTo3D(tool);
  
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
  const baseId = `threed-${tool.id}`;
  const timestamp = Date.now();
  const uniqueId = `${baseId}-${timestamp}`;

  return {
    id: uniqueId,
    name: cleanName,
    description: cleanDescription,
    url: tool.url,
    iconUrl: tool.iconUrl || generateIconUrl(tool.url),
    category,
    subcategory: subCategory,
    tags: tool.tags.filter(tag => tag !== 'tool'),
    isHot: tool.isHot || false,
    isFeatured: tool.isFeatured || false,
    isNew: true,
    rating: tool.rating || 4.0
  };
};

/**
 * 读取现有的3D工具数据库
 */
const readExistingTools = () => {
  try {
    const threeDToolsPath = path.join(__dirname, '../data/threeDToolsDatabase.js');
    const content = fs.readFileSync(threeDToolsPath, 'utf8');
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
  console.log('   node import3DTools.js');
  console.log('   → 自动识别工具类型并分配合适的分类');
  console.log('');
  console.log('🎯 指定输入文件:');
  console.log('   node import3DTools.js --file threed_tools_extracted_2025.js');
  console.log('   → 指定要导入的数据文件');
  console.log('');
  console.log('🎯 指定主分类:');
  console.log('   node import3DTools.js software');
  console.log('   → 所有工具强制导入到三维软件的第一个子分类');
  console.log('');
  console.log('🎯 指定详细分类:');
  console.log('   node import3DTools.js software modeling');
  console.log('   → 全部导入到建模软件分类');
  console.log('');
  console.log('🎯 指定文件和分类:');
  console.log('   node import3DTools.js --file data.js software modeling');
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
 * 将新工具添加到3D工具数据库
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
    console.log('  node import3DTools.js --file filename.js');
    console.log('  或设置环境变量：INPUT_FILE=filename.js node import3DTools.js');
    console.log('');
    console.log('📖 查看完整帮助：');
    console.log('  node import3DTools.js --help');
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
  
  console.log('🚀 开始导入3D工具数据...');
  
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
  
  // 找到allThreeDTools数组的结束位置并插入新工具
  let threeDToolsEndMatch = existingContent.match(/(\s*)\];\s*\n\s*\/\/ 获取指定分类的工具/);
  
  if (!threeDToolsEndMatch) {
    // 如果找不到注释，尝试查找其他模式
    threeDToolsEndMatch = existingContent.match(/(\s*)\];\s*\n\s*\/\/ 辅助函数/);
  }
  
  if (!threeDToolsEndMatch) {
    // 尝试查找export语句
    threeDToolsEndMatch = existingContent.match(/(\s*)\];\s*\n\s*export const getToolsByCategory/);
  }
  
  if (!threeDToolsEndMatch) {
    // 最后尝试简单的数组结束模式
    threeDToolsEndMatch = existingContent.match(/(\s*)\];\s*\n\s*\/\//);
  }
  
  if (!threeDToolsEndMatch) {
    console.error('❌ 无法找到allThreeDTools数组的结束位置');
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
  const insertPosition = threeDToolsEndMatch.index;
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
      
      const threeDToolsPath = path.join(__dirname, '../data/threeDToolsDatabase.js');
      fs.writeFileSync(threeDToolsPath, fixedContent, 'utf8');
      console.log('✅ 语法错误已修复，3D工具数据导入成功！');
    } else {
      const threeDToolsPath = path.join(__dirname, '../data/threeDToolsDatabase.js');
      fs.writeFileSync(threeDToolsPath, newContent, 'utf8');
      console.log('✅ 3D工具数据导入成功！');
    }
    
    const threeDToolsPath = path.join(__dirname, '../data/threeDToolsDatabase.js');
    console.log(`📝 已更新文件: ${threeDToolsPath}`);
    
    // 验证导入结果
    console.log('\n🔍 验证导入结果...');
    const finalContent = fs.readFileSync(threeDToolsPath, 'utf8');
    const finalContentLines = finalContent.split('\n').length;
    console.log(`📄 文件总行数: ${finalContentLines}`);
    
    // 检查工具总数
    const totalThreeDToolCount = (finalContent.match(/id: 'threed-/g) || []).length;
    console.log(`📊 数据库中3D工具总数: ${totalThreeDToolCount}`);
    
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

console.log('✅ 3D工具导入脚本创建成功！'); 