/**
 * @file importUIUXTools.js
 * @description 将UI/UX工具数据导入AI工具数据库 - 支持动态分类
 * @copyright 版权所有 (c) 2025 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 2.0.0 - 支持多种分类选项
 */

const fs = require('fs');
const path = require('path');

// 读取命令行参数
const args = process.argv.slice(2);
const targetCategory = args[0] || null; // 目标分类参数
const targetSubCategory = args[1] || null; // 目标子分类参数

// 🎯 支持的分类映射
const CATEGORY_MAPPINGS = {
  // AI写作工具
  'ai-xiezuo': {
    'writing': 'ai-xiezuo-writing',            // AI写作工具
    'paper': 'ai-xiezuo-paper',                // AI论文工具
    'detection': 'ai-xiezuo-detection',        // AI内容检测
    'bot': 'ai-xiezuo-bot',                    // AI聊天机器人
    'prompt': 'ai-xiezuo-prompt'               // AI写作提示
  },
  
  // AI生图工具
  'ai-shengtupicture': {
    'huihua': 'ai-shengtupicture-huihua',      // AI绘画工具
    'prompt': 'ai-shengtupicture-prompt',      // AI绘画提示
    'model': 'ai-shengtupicture-model',        // AI绘画模型
    'community': 'ai-shengtupicture-community' // AI绘画社区
  },
  
  // AI图片工具
  'ai-tupian': {
    'zengqiang': 'ai-tupian-zengqiang',        // AI图像增强
    'qushuiyin': 'ai-tupian-qushuiyin',        // AI图去水印
    'xiugai': 'ai-tupian-xiugai',              // AI图片修改
    'wusunfangda': 'ai-tupian-wusunfangda',    // AI无损放大
    'mote': 'ai-tupian-mote',                  // AI模特生成
    'chuli': 'ai-tupian-chuli',                // AI图象处理
    'koutu': 'ai-tupian-koutu',                // AI图片抠图
    'touxiang': 'ai-tupian-touxiang'           // AI头像生成
  },
  
  // AI视频工具
  'ai-shipin': {
    'shengcheng': 'ai-shipin-shengcheng',      // AI视频生成
    'koutu': 'ai-shipin-koutu',                // AI视频抠像
    'zimu': 'ai-shipin-zimu',                  // AI字幕翻译
    'zongjie': 'ai-shipin-zongjie',            // AI视频总结
    'jianji': 'ai-shipin-jianji',              // AI视频剪辑
    'wenan': 'ai-shipin-wenan',                // AI视频文案
    'huanlian': 'ai-shipin-huanlian',          // AI视频换脸
    'shuziren': 'ai-shipin-shuziren',          // AI虚拟数字人
    'qushuiyin': 'ai-shipin-qushuiyin',        // AI视频去水印
    'zengqiang': 'ai-shipin-zengqiang'         // AI视频画质增强
  },
  
  // AI音频工具
  'ai-yinpin': {
    'zhizuo': 'ai-yinpin-zhizuo',              // AI音频制作
    'tts': 'ai-yinpin-tts',                    // AI文字转音
    'kelong': 'ai-yinpin-kelong',              // AI音频克隆
    'fenli': 'ai-yinpin-fenli',                // AI人声分离
    'geshou': 'ai-yinpin-geshou',              // AI音乐歌手
    'bianqu': 'ai-yinpin-bianqu'               // AI编曲作曲
  },
  
  // 🆕 AI办公工具
  'ai-bangong': {
    'ppt': 'ai-bangong-ppt',                   // AI PPT
    'wendang': 'ai-bangong-wendang',           // AI文档工具
    'siweidaotu': 'ai-bangong-siweidaotu',     // AI思维导图
    'xiaolu': 'ai-bangong-xiaolu',             // AI效率工具
    'biaoge': 'ai-bangong-biaoge',             // AI表格处理
    'huiyi': 'ai-bangong-huiyi'                // AI会议工具
  },
  
  // 🆕 AI设计工具  
  'ai-sheji': {
    'logo': 'ai-sheji-logo',                   // AI Logo
    '3d': 'ai-sheji-3d',                       // AI 3D建模
    'gongju': 'ai-sheji-gongju',               // AI设计工具
    'jiemian': 'ai-sheji-jiemian',             // AI界面工具
    'touxiang': 'ai-sheji-touxiang',           // AI头像生成
    'mote': 'ai-sheji-mote',                   // AI模特生成
    'shinei': 'ai-sheji-shinei',               // AI室内生成
    'jianzhu': 'ai-sheji-jianzhu'              // AI建筑设计
  },
  
  // 🆕 AI开发工具
  'ai-kaifa': {
    'daimahua': 'ai-kaifa-daimahua',           // AI低代码
    'biancheng': 'ai-kaifa-biancheng'          // AI编程工具
  },
  
  // 🆕 AI学习平台
  'ai-xuexi': {
    'zhinan': 'ai-xuexi-zhinan',               // AI学习指南
    'wangzhan': 'ai-xuexi-wangzhan'            // AI学习网站
  },
  
  // 🆕 AI平台网站
  'ai-pingtai': {
    'damoxing': 'ai-pingtai-damoxing',         // AI大模型
    'yuanyuzhou': 'ai-pingtai-yuanyuzhou',     // AI元宇宙
    'kaifang': 'ai-pingtai-kaifang',           // AI开放平台
    'suanli': 'ai-pingtai-suanli',             // AI算力平台
    'guanli': 'ai-pingtai-guanli'              // AI管理机构
  },
  
  // 🆕 AI电商工具
  'ai-dianshang': {
    'shangpin': 'ai-dianshang-shangpin',       // AI商品工具
    'mote': 'ai-dianshang-mote'                // AI模特生成
  }
};

// 🎨 生成更好的工具描述
function generateBetterDescription(name, tags, url) {
  const tagDescriptions = {
    'ai': 'AI智能',
    'image': '图像处理',
    'video': '视频编辑',
    'design': '设计创作',
    'edit': '编辑修改',
    'background': '背景处理',
    'remove': '智能移除',
    'upscale': '图像放大',
    'art': '艺术创作',
    'template': '模板素材',
    'free': '免费使用',
    'online': '在线工具',
    'prompt': '提示词',
    'writing': '文案写作',
    'generator': '生成器',
    'enhance': '质量增强',
    'watermark': '水印处理',
    'mobile': '移动端',
    'photoshop': 'PS插件',
    'color': '颜色调整',
    'icon': '图标制作'
  };
  
  // 根据标签生成描述
  const relevantTags = tags.filter(tag => tagDescriptions[tag]).slice(0, 3);
  const tagDesc = relevantTags.map(tag => tagDescriptions[tag]).join('、');
  
  // 根据域名判断工具类型
  let platformDesc = '';
  if (url.includes('ai')) platformDesc = 'AI驱动的';
  else if (url.includes('magic')) platformDesc = '智能化的';
  else if (url.includes('free')) platformDesc = '免费的';
  else if (url.includes('pro')) platformDesc = '专业的';
  
  // 生成描述
  if (tagDesc) {
    return `${platformDesc}${tagDesc}工具，为用户提供便捷高效的创作体验。`;
  } else {
    return `${platformDesc}在线工具，助力用户轻松完成创作任务。`;
  }
}

// 🧠 智能分类识别函数
function identifyToolCategory(tool) {
  const text = (tool.name + ' ' + tool.description + ' ' + tool.url + ' ' + tool.tags.join(' ')).toLowerCase();
  
  // AI写作工具识别
  if (text.match(/(写作|文案|文本|论文|内容|检测|提示词|prompt|chatgpt|gpt|claude|gemini|文字|编辑|润色|改写)/)) {
    if (text.match(/(论文|学术|研究|paper|academic)/)) {
      return { category: 'ai-xiezuo', subCategory: 'ai-xiezuo-paper' };
    } else if (text.match(/(检测|原创|抄袭|ai检测|detection)/)) {
      return { category: 'ai-xiezuo', subCategory: 'ai-xiezuo-detection' };
    } else if (text.match(/(机器人|聊天|对话|助手|bot|chat)/)) {
      return { category: 'ai-xiezuo', subCategory: 'ai-xiezuo-bot' };
    } else if (text.match(/(提示词|prompt|咒语|指令)/)) {
      return { category: 'ai-xiezuo', subCategory: 'ai-xiezuo-prompt' };
    } else {
      return { category: 'ai-xiezuo', subCategory: 'ai-xiezuo-writing' };
    }
  }
  
  // AI生图工具识别
  if (text.match(/(绘画|生图|图像生成|ai画|midjourney|stable diffusion|dall-e|画图|艺术|创作)/)) {
    if (text.match(/(模型|model|训练|自定义)/)) {
      return { category: 'ai-shengtupicture', subCategory: 'ai-shengtupicture-model' };
    } else if (text.match(/(提示|prompt|咒语)/)) {
      return { category: 'ai-shengtupicture', subCategory: 'ai-shengtupicture-prompt' };
    } else if (text.match(/(社区|gallery|展示|分享)/)) {
      return { category: 'ai-shengtupicture', subCategory: 'ai-shengtupicture-community' };
    } else {
      return { category: 'ai-shengtupicture', subCategory: 'ai-shengtupicture-huihua' };
    }
  }
  
  // AI图片工具识别
  if (text.match(/(图片|图像|照片|抠图|去水印|放大|增强|修复|头像|模特)/)) {
    if (text.match(/(放大|超分辨率|upscale)/)) {
      return { category: 'ai-tupian', subCategory: 'ai-tupian-wusunfangda' };
    } else if (text.match(/(去水印|watermark)/)) {
      return { category: 'ai-tupian', subCategory: 'ai-tupian-qushuiyin' };
    } else if (text.match(/(抠图|背景|remove|bg)/)) {
      return { category: 'ai-tupian', subCategory: 'ai-tupian-koutu' };
    } else if (text.match(/(头像|avatar|肖像)/)) {
      return { category: 'ai-tupian', subCategory: 'ai-tupian-touxiang' };
    } else if (text.match(/(模特|人像|虚拟)/)) {
      return { category: 'ai-tupian', subCategory: 'ai-tupian-mote' };
    } else if (text.match(/(增强|enhance|质量)/)) {
      return { category: 'ai-tupian', subCategory: 'ai-tupian-zengqiang' };
    } else if (text.match(/(修改|编辑|edit)/)) {
      return { category: 'ai-tupian', subCategory: 'ai-tupian-xiugai' };
    } else {
      return { category: 'ai-tupian', subCategory: 'ai-tupian-chuli' };
    }
  }
  
  // AI视频工具识别
  if (text.match(/(视频|video|影像|剪辑|换脸|数字人|字幕)/)) {
    if (text.match(/(生成|generate|创作)/)) {
      return { category: 'ai-shipin', subCategory: 'ai-shipin-shengcheng' };
    } else if (text.match(/(抠像|绿幕|背景)/)) {
      return { category: 'ai-shipin', subCategory: 'ai-shipin-koutu' };
    } else if (text.match(/(字幕|翻译|subtitle)/)) {
      return { category: 'ai-shipin', subCategory: 'ai-shipin-zimu' };
    } else if (text.match(/(总结|摘要|summary)/)) {
      return { category: 'ai-shipin', subCategory: 'ai-shipin-zongjie' };
    } else if (text.match(/(剪辑|编辑|edit)/)) {
      return { category: 'ai-shipin', subCategory: 'ai-shipin-jianji' };
    } else if (text.match(/(文案|脚本|script)/)) {
      return { category: 'ai-shipin', subCategory: 'ai-shipin-wenan' };
    } else if (text.match(/(换脸|face|swap)/)) {
      return { category: 'ai-shipin', subCategory: 'ai-shipin-huanlian' };
    } else if (text.match(/(数字人|虚拟|avatar)/)) {
      return { category: 'ai-shipin', subCategory: 'ai-shipin-shuziren' };
    } else if (text.match(/(去水印|watermark)/)) {
      return { category: 'ai-shipin', subCategory: 'ai-shipin-qushuiyin' };
    } else if (text.match(/(画质|增强|enhance)/)) {
      return { category: 'ai-shipin', subCategory: 'ai-shipin-zengqiang' };
    } else {
      return { category: 'ai-shipin', subCategory: 'ai-shipin-shengcheng' };
    }
  }
  
  // AI音频工具识别
  if (text.match(/(音频|音乐|声音|语音|配音|歌曲|作曲)/)) {
    if (text.match(/(制作|生成|create)/)) {
      return { category: 'ai-yinpin', subCategory: 'ai-yinpin-zhizuo' };
    } else if (text.match(/(文字转音|tts|语音合成)/)) {
      return { category: 'ai-yinpin', subCategory: 'ai-yinpin-tts' };
    } else if (text.match(/(克隆|clone|模仿)/)) {
      return { category: 'ai-yinpin', subCategory: 'ai-yinpin-kelong' };
    } else if (text.match(/(分离|separate|提取)/)) {
      return { category: 'ai-yinpin', subCategory: 'ai-yinpin-fenli' };
    } else if (text.match(/(歌手|singer|演唱)/)) {
      return { category: 'ai-yinpin', subCategory: 'ai-yinpin-geshou' };
    } else if (text.match(/(编曲|作曲|compose)/)) {
      return { category: 'ai-yinpin', subCategory: 'ai-yinpin-bianqu' };
    } else {
      return { category: 'ai-yinpin', subCategory: 'ai-yinpin-zhizuo' };
    }
  }
  
  // 🆕 AI办公工具识别
  if (text.match(/(办公|ppt|演示|文档|表格|效率|会议|协作|思维导图|excel|word|powerpoint)/)) {
    if (text.match(/(ppt|演示|presentation|slide)/)) {
      return { category: 'ai-bangong', subCategory: 'ai-bangong-ppt' };
    } else if (text.match(/(文档|word|doc|文件)/)) {
      return { category: 'ai-bangong', subCategory: 'ai-bangong-wendang' };
    } else if (text.match(/(思维导图|脑图|mindmap|mind)/)) {
      return { category: 'ai-bangong', subCategory: 'ai-bangong-siweidaotu' };
    } else if (text.match(/(表格|excel|sheet|数据|统计)/)) {
      return { category: 'ai-bangong', subCategory: 'ai-bangong-biaoge' };
    } else if (text.match(/(会议|转录|记录|meeting)/)) {
      return { category: 'ai-bangong', subCategory: 'ai-bangong-huiyi' };
    } else {
      return { category: 'ai-bangong', subCategory: 'ai-bangong-xiaolu' };
    }
  }
  
  // 🆕 AI设计工具识别
  if (text.match(/(设计工具|ui设计|ux设计|界面设计|logo|品牌|室内设计|建筑设计|3d建模)/)) {
    if (text.match(/(logo|标志|品牌|商标)/)) {
      return { category: 'ai-sheji', subCategory: 'ai-sheji-logo' };
    } else if (text.match(/(3d|建模|三维|模型)/)) {
      return { category: 'ai-sheji', subCategory: 'ai-sheji-3d' };
    } else if (text.match(/(界面|ui|ux|原型|wireframe)/)) {
      return { category: 'ai-sheji', subCategory: 'ai-sheji-jiemian' };
    } else if (text.match(/(室内|装修|interior)/)) {
      return { category: 'ai-sheji', subCategory: 'ai-sheji-shinei' };
    } else if (text.match(/(建筑|architecture|房屋)/)) {
      return { category: 'ai-sheji', subCategory: 'ai-sheji-jianzhu' };
    } else {
      return { category: 'ai-sheji', subCategory: 'ai-sheji-gongju' };
    }
  }
  
  // 🆕 AI开发工具识别
  if (text.match(/(编程|代码|开发|低代码|no-code|程序|软件开发)/)) {
    if (text.match(/(低代码|无代码|no-code|low-code|拖拽)/)) {
      return { category: 'ai-kaifa', subCategory: 'ai-kaifa-daimahua' };
    } else {
      return { category: 'ai-kaifa', subCategory: 'ai-kaifa-biancheng' };
    }
  }
  
  // 🆕 AI学习平台识别
  if (text.match(/(学习|教育|培训|课程|教程|知识|指南)/)) {
    if (text.match(/(指南|教程|tutorial|guide)/)) {
      return { category: 'ai-xuexi', subCategory: 'ai-xuexi-zhinan' };
    } else {
      return { category: 'ai-xuexi', subCategory: 'ai-xuexi-wangzhan' };
    }
  }
  
  // 🆕 AI平台网站识别
  if (text.match(/(平台|api|大模型|模型|gpt|claude|元宇宙|算力|云计算)/)) {
    if (text.match(/(大模型|gpt|claude|gemini|llm)/)) {
      return { category: 'ai-pingtai', subCategory: 'ai-pingtai-damoxing' };
    } else if (text.match(/(元宇宙|metaverse|虚拟世界|vr|ar)/)) {
      return { category: 'ai-pingtai', subCategory: 'ai-pingtai-yuanyuzhou' };
    } else if (text.match(/(api|开放平台|接口|开发者)/)) {
      return { category: 'ai-pingtai', subCategory: 'ai-pingtai-kaifang' };
    } else if (text.match(/(算力|云计算|gpu|计算资源)/)) {
      return { category: 'ai-pingtai', subCategory: 'ai-pingtai-suanli' };
    } else if (text.match(/(管理|监管|政策|标准)/)) {
      return { category: 'ai-pingtai', subCategory: 'ai-pingtai-guanli' };
    } else {
      return { category: 'ai-pingtai', subCategory: 'ai-pingtai-kaifang' };
    }
  }
  
  // 🆕 AI电商工具识别
  if (text.match(/(电商|商品|店铺|营销|推广|商业|ecommerce|淘宝|天猫|京东)/)) {
    if (text.match(/(商品|产品|描述|详情)/)) {
      return { category: 'ai-dianshang', subCategory: 'ai-dianshang-shangpin' };
    } else {
      return { category: 'ai-dianshang', subCategory: 'ai-dianshang-mote' };
    }
  }
  
  // 默认分类到AI图像增强
  return { category: 'ai-tupian', subCategory: 'ai-tupian-zengqiang' };
}

// 读取提取的工具数据
const extractedToolsPath = path.join(__dirname, '../data/uiux_tools_extracted_2025-06-16.js');
const extractedToolsContent = fs.readFileSync(extractedToolsPath, 'utf8');

// 解析导出的工具数据
const extractedToolsMatch = extractedToolsContent.match(/export const extractedTools = (\[[\s\S]*?\]);/);
if (!extractedToolsMatch) {
  console.error('❌ 无法解析提取的工具数据');
  process.exit(1);
}

const extractedTools = eval(extractedToolsMatch[1]);

/**
 * 🎯 严格的分类映射函数 - 完全按命令行参数强制分类
 * @param {Object} tool 工具对象
 * @returns {Object} 包含category和subCategory的对象
 */
const mapCategoryToAI = (tool) => {
  // 如果指定了完整的分类，强制使用指定分类（完全禁用智能判断）
  if (targetCategory && targetSubCategory) {
    const fullSubCategory = CATEGORY_MAPPINGS[targetCategory]?.[targetSubCategory];
    if (fullSubCategory) {
      console.log(`🎯 强制分类: ${tool.name || tool.id} → ${fullSubCategory}`);
      return { category: targetCategory, subCategory: fullSubCategory };
    } else {
      console.warn(`⚠️ 无效的分类组合: ${targetCategory}-${targetSubCategory}`);
      // 即使无效，也返回用户指定的分类
      const forcedSubCategory = `${targetCategory}-${targetSubCategory}`;
      console.log(`🎯 强制分类(自定义): ${tool.name || tool.id} → ${forcedSubCategory}`);
      return { category: targetCategory, subCategory: forcedSubCategory };
    }
  }
  
  // 如果只指定了主分类，强制使用该主分类的第一个子分类（不进行智能判断）
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
 * @param {Object} tool 原始工具数据
 * @returns {Object} 转换后的工具数据
 */
const transformTool = (tool) => {
  const { category, subCategory } = mapCategoryToAI(tool);
  
  // 🎨 优化标题 - 清理和美化
  let cleanName = tool.name;
  // 移除多余的空白和重复内容
  if (cleanName.includes('                    ')) {
    cleanName = cleanName.split('                    ')[0].trim();
  }
  // 移除多余的标点符号
  cleanName = cleanName.replace(/[：:]\s*$/, '').trim();
  // 移除重复的工具名称
  const nameParts = cleanName.split(/[：:]/).map(part => part.trim());
  if (nameParts.length > 1 && nameParts[0] === nameParts[1]) {
    cleanName = nameParts[0];
  }
  
  // 🎨 优化简介 - 清理和美化
  let cleanDescription = tool.description;
  // 移除"优质的"前缀
  if (cleanDescription.startsWith('优质的')) {
    cleanDescription = cleanDescription.replace(/^优质的/, '').trim();
  }
  // 移除"工具网站"后缀
  if (cleanDescription.includes('工具网站')) {
    cleanDescription = cleanDescription.replace(/工具网站$/, '').trim();
  }
  // 移除重复的内容
  if (cleanDescription.includes('                    ')) {
    const parts = cleanDescription.split('                    ');
    cleanDescription = parts[0].trim();
  }
  // 如果简介和标题重复，生成更好的简介
  if (cleanDescription === cleanName || cleanDescription.includes(cleanName)) {
    cleanDescription = generateBetterDescription(cleanName, tool.tags, tool.url);
  }
  // 确保简介以句号结尾
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

  // 生成唯一ID，避免重复
  const baseId = `uiux-${tool.id}`;
  const timestamp = Date.now();
  const uniqueId = `${baseId}-${timestamp}`;

  return {
    id: uniqueId, // 使用时间戳确保ID唯一
    name: cleanName,
    description: cleanDescription,
    url: tool.url,
    iconUrl: tool.iconUrl || generateIconUrl(tool.url), // 🔥 添加iconUrl字段
    category,
    subCategory,
    tags: tool.tags.filter(tag => tag !== 'tool'), // 移除通用的tool标签
    isHot: tool.isHot || false,
    isFeatured: tool.isFeatured || false,
    isNew: true, // 新导入的工具标记为新增
    pricing: 'freemium', // 默认定价模式
    rating: tool.rating || 4.0
  };
};

/**
 * 读取现有的AI工具数据库
 * @returns {string} 现有文件内容
 */
const readExistingTools = () => {
  try {
    const aiToolsPath = path.join(__dirname, '../data/aiToolsDatabase.js');
    const content = fs.readFileSync(aiToolsPath, 'utf8');
    return content;
  } catch (error) {
    console.error('读取现有工具数据失败:', error);
    return null;
  }
};

/**
 * 清理之前导入的UIUX工具数据（只清理目标分类中的）
 * @param {string} content 文件内容
 * @param {string} targetSubCategory 目标子分类
 * @returns {string} 清理后的内容
 */
const cleanPreviousImports = (content, targetSubCategory) => {
  // 只删除目标分类中以uiux-开头的工具条目
  const lines = content.split('\n');
  const cleanedLines = [];
  let skipLines = false;
  let braceCount = 0;
  let isTargetCategory = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // 检测是否是uiux工具的开始
    if (line.includes("id: 'uiux-")) {
      skipLines = true;
      braceCount = 0;
      isTargetCategory = false;
      
      // 继续读取，检查是否是目标分类
      let j = i + 1;
      while (j < lines.length && braceCount >= 0) {
        const nextLine = lines[j];
        const openBraces = (nextLine.match(/{/g) || []).length;
        const closeBraces = (nextLine.match(/}/g) || []).length;
        braceCount += openBraces - closeBraces;
        
        // 检查是否是目标分类
        if (nextLine.includes(`subCategory: '${targetSubCategory}'`)) {
          isTargetCategory = true;
          break;
        }
        
        // 如果到了工具条目结束还没找到目标分类，说明不是目标分类
        if (nextLine.trim() === '}' && braceCount <= 0) {
          break;
        }
        j++;
      }
      
      // 如果不是目标分类，保留这个工具
      if (!isTargetCategory) {
        cleanedLines.push(line);
        skipLines = false;
        continue;
      } else {
        // 是目标分类，跳过这个工具
        braceCount = 0;
        continue;
      }
    }
    
    if (skipLines && isTargetCategory) {
      // 计算大括号，确定工具条目的结束
      const openBraces = (line.match(/{/g) || []).length;
      const closeBraces = (line.match(/}/g) || []).length;
      braceCount += openBraces - closeBraces;
      
      // 如果找到了工具条目的结束
      if (line.trim() === '}' && braceCount <= 0) {
        skipLines = false;
        isTargetCategory = false;
        // 如果下一行是逗号，也跳过
        if (i + 1 < lines.length && lines[i + 1].trim() === ',') {
          i++; // 跳过逗号行
        }
        continue;
      }
      continue;
    }
    
    cleanedLines.push(line);
  }
  
  return cleanedLines.join('\n');
};

/**
 * 🎯 显示使用说明
 */
const showUsage = () => {
  console.log('📖 使用说明:');
  console.log('');
  console.log('🎯 智能分类 (推荐):');
  console.log('   node importUIUXTools.js');
  console.log('   → 自动识别工具类型并分配合适的分类');
  console.log('');
  console.log('🎯 指定主分类:');
  console.log('   node importUIUXTools.js ai-tupian');
  console.log('   → 所有工具强制导入到AI图片工具的第一个子分类');
  console.log('');
  console.log('🎯 指定详细分类:');
  console.log('   node importUIUXTools.js ai-tupian koutu');
  console.log('   → 全部导入到AI图片抠图分类');
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
 * 将新工具添加到AI工具数据库
 */
const importTools = () => {
  // 如果用户输入了help参数，显示使用说明
  if (args.includes('--help') || args.includes('-h')) {
    showUsage();
    return;
  }
  
  console.log('🚀 开始导入UI/UX工具数据...');
  
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
    const key = tool.subCategory;
    categoryStats[key] = (categoryStats[key] || 0) + 1;
  });
  
  console.log('📈 分类统计:');
  Object.entries(categoryStats).forEach(([subCategory, count]) => {
    const displayName = subCategory.replace(/^ai-[^-]+-/, '').replace(/-/g, ' ');
    console.log(`  ${displayName}: ${count} 个工具`);
  });
  
  // 读取现有数据库文件
  let existingContent = readExistingTools();
  if (!existingContent) {
    console.error('❌ 无法读取现有数据库文件');
    return;
  }
  
  // 不清理任何数据，只添加新数据
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
    subCategory: '${tool.subCategory}',
    tags: [${tool.tags.map(tag => `'${tag}'`).join(', ')}],
    isHot: ${tool.isHot},
    isFeatured: ${tool.isFeatured},
    isNew: ${tool.isNew},
    pricing: '${tool.pricing}',
    rating: ${tool.rating}
  }`;
  }).join(',\n');
  
  // 找到aiTools数组的结束位置并插入新工具
  const aiToolsEndMatch = existingContent.match(/(\s*)\];\s*\n\s*\/\/ 工具查询函数/);
  if (!aiToolsEndMatch) {
    console.error('❌ 无法找到aiTools数组的结束位置');
    return;
  }
  
  // 在数组结束前插入新工具
  const insertPosition = aiToolsEndMatch.index;
  const beforeInsert = existingContent.substring(0, insertPosition);
  const afterInsert = existingContent.substring(insertPosition);
  
  // 检查是否需要在前面添加逗号
  const beforeTrimmed = beforeInsert.trim();
  const needsComma = !beforeTrimmed.endsWith('[') && !beforeTrimmed.endsWith(',');
  const commaPrefix = needsComma ? ',' : '';
  
  // 确保插入位置正确，避免产生 {, 这样的语法错误
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
      
      const aiToolsPath = path.join(__dirname, '../data/aiToolsDatabase.js');
      fs.writeFileSync(aiToolsPath, fixedContent, 'utf8');
      console.log('✅ 语法错误已修复，工具数据导入成功！');
    } else {
      const aiToolsPath = path.join(__dirname, '../data/aiToolsDatabase.js');
      fs.writeFileSync(aiToolsPath, newContent, 'utf8');
      console.log('✅ 工具数据导入成功！');
    }
    
    const aiToolsPath = path.join(__dirname, '../data/aiToolsDatabase.js');
    console.log(`📝 已更新文件: ${aiToolsPath}`);
    
    // 验证导入结果
    console.log('\n🔍 验证导入结果...');
    const finalContent = fs.readFileSync(aiToolsPath, 'utf8');
    const finalContentLines = finalContent.split('\n').length;
    console.log(`📄 文件总行数: ${finalContentLines}`);
    
    // 检查工具总数
    const totalUiuxToolCount = (finalContent.match(/id: 'uiux-/g) || []).length;
    console.log(`📊 数据库中UIUX工具总数: ${totalUiuxToolCount}`);
    
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