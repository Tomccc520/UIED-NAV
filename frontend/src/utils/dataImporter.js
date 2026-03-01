/**
 * @file dataImporter.js
 * @description 数据导入工具 - 用于批量导入网址数据
 * @copyright 版权所有 (c) 2025 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

/**
 * 批量导入网址数据的工具函数
 * 使用方法：
 * 1. 准备CSV格式数据
 * 2. 调用 importFromCSV() 或 importFromJSON()
 * 3. 将生成的数据复制到 websiteDatabase.js 中
 */

/**
 * 从CSV格式导入数据
 * CSV格式：name,description,url,category,tags,isNew,isFeatured,isHot
 * @param {string} csvData - CSV格式的数据
 * @returns {Array} 格式化后的网站数据
 */
export const importFromCSV = (csvData) => {
  const lines = csvData.trim().split('\n');
  const websites = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',');
    const website = {
      id: `import_${Date.now()}_${i}`,
      name: values[0]?.trim() || '',
      description: values[1]?.trim() || '',
      url: values[2]?.trim() || '',
      category: values[3]?.trim() || '1',
      isNew: values[5]?.trim().toLowerCase() === 'true',
      isFeatured: values[6]?.trim().toLowerCase() === 'true',
      isHot: values[7]?.trim().toLowerCase() === 'true',
      tags: values[4] ? values[4].split('|').map(tag => tag.trim()) : []
    };
    
    if (website.name && website.url) {
      websites.push(website);
    }
  }

  return websites;
};

/**
 * 从JSON格式导入数据
 * @param {Array} jsonData - JSON格式的网站数据数组
 * @returns {Array} 格式化后的网站数据
 */
export const importFromJSON = (jsonData) => {
  return jsonData.map((item, index) => ({
    id: item.id || `import_${Date.now()}_${index}`,
    name: item.name || '',
    description: item.description || '',
    url: item.url || '',
    category: item.category || '1',
    isNew: Boolean(item.isNew),
    isFeatured: Boolean(item.isFeatured),
    isHot: Boolean(item.isHot),
    tags: Array.isArray(item.tags) ? item.tags : []
  })).filter(website => website.name && website.url);
};

/**
 * 生成网站ID（基于名称和时间戳）
 * @param {string} name - 网站名称
 * @param {string} category - 分类
 * @returns {string} 生成的ID
 */
export const generateWebsiteId = (name, category) => {
  const prefix = getCategoryPrefix(category);
  const timestamp = Date.now();
  const nameHash = name.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 3);
  return `${prefix}_${nameHash}_${timestamp}`;
};

/**
 * 根据分类获取ID前缀
 * @param {string} categoryId - 分类ID
 * @returns {string} ID前缀
 */
const getCategoryPrefix = (categoryId) => {
  const prefixMap = {
    '1': 'ai',
    '2': 'ui',
    '3': 'gd',
    '4': 'dm',
    '5': 'ct',
    '6': 'di',
    '7': 'pt',
    '8': 'if',
    '9': 'at',
    '10': 'dt',
    '11': 'ir',
    '12': 'dt',
    '13': 'fd',
    '14': 'ds',
    '15': 'dc'
  };
  return prefixMap[categoryId] || 'misc';
};

/**
 * 从网站URL自动获取favicon
 * @param {string} url - 网站URL
 * @returns {string} favicon URL
 */
export const getFaviconUrl = (url) => {
  try {
    const domain = new URL(url).origin;
    return `${domain}/favicon.ico`;
  } catch {
    return '';
  }
};

/**
 * 批量处理网址数据，自动添加favicon和生成ID
 * @param {Array} websites - 网站数据数组
 * @returns {Array} 处理后的网站数据
 */
export const processWebsiteData = (websites) => {
  return websites.map(website => ({
    ...website,
    id: website.id || generateWebsiteId(website.name, website.category),
    icon: website.icon || getFaviconUrl(website.url),
    // 确保必需字段有默认值
    isNew: website.isNew || false,
    isFeatured: website.isFeatured || false,
    isHot: website.isHot || false,
    tags: website.tags || []
  }));
};

/**
 * 验证网站数据格式
 * @param {Object} website - 网站数据对象
 * @returns {Object} 验证结果
 */
export const validateWebsiteData = (website) => {
  const errors = [];
  
  if (!website.name || website.name.trim() === '') {
    errors.push('网站名称不能为空');
  }
  
  if (!website.url || website.url.trim() === '') {
    errors.push('网站URL不能为空');
  }
  
  try {
    new URL(website.url);
  } catch {
    errors.push('网站URL格式不正确');
  }
  
  if (!website.category) {
    errors.push('必须指定分类');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * 生成可直接使用的JavaScript代码
 * @param {Array} websites - 网站数据数组
 * @param {string} categoryName - 分类名称（用于变量名）
 * @returns {string} JavaScript代码字符串
 */
export const generateJavaScriptCode = (websites, categoryName) => {
  const variableName = categoryName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  
  return `// ${categoryName}网站数据
export const ${variableName} = [
${websites.map(website => `  {
    id: '${website.id}',
    name: '${website.name}',
    description: '${website.description}',
    url: '${website.url}',
    category: '${website.category}',
    isNew: ${website.isNew},
    isFeatured: ${website.isFeatured},
    isHot: ${website.isHot},
    tags: ${JSON.stringify(website.tags)}
  }`).join(',\n')}
];`;
};

// CSV模板示例
export const CSV_TEMPLATE = `name,description,url,category,tags,isNew,isFeatured,isHot
示例网站,这是一个示例网站描述,https://example.com,1,设计|工具|示例,false,true,false
另一个网站,另一个示例描述,https://another.com,2,UI|设计,true,false,true`;

// JSON模板示例
export const JSON_TEMPLATE = [
  {
    name: "示例网站",
    description: "这是一个示例网站描述",
    url: "https://example.com",
    category: "1",
    tags: ["设计", "工具", "示例"],
    isNew: false,
    isFeatured: true,
    isHot: false
  },
  {
    name: "另一个网站",
    description: "另一个示例描述",
    url: "https://another.com",
    category: "2",
    tags: ["UI", "设计"],
    isNew: true,
    isFeatured: false,
    isHot: true
  }
];

/**
 * 使用示例：
 * 
 * // 1. 从CSV导入
 * const csvData = `网站名,描述,URL,分类,标签,新站,推荐,热门
 * ChatGPT,AI对话工具,https://chat.openai.com,1,AI|对话,false,true,true`;
 * const websites = importFromCSV(csvData);
 * 
 * // 2. 处理数据
 * const processedWebsites = processWebsiteData(websites);
 * 
 * // 3. 生成代码
 * const code = generateJavaScriptCode(processedWebsites, 'AI工具');
 * console.log(code);
 */

const dataImporter = {
  importFromCSV,
  importFromJSON,
  generateWebsiteId,
  getFaviconUrl,
  processWebsiteData,
  validateWebsiteData,
  generateJavaScriptCode,
  CSV_TEMPLATE,
  JSON_TEMPLATE
};

export default dataImporter;
