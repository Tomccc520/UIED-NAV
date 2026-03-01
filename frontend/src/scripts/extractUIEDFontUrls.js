/**
 * @file extractUIEDFontUrls.js
 * @description UIED网站文章数据提取脚本 - 专用版
 * @copyright 版权所有 (c) 2025 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

/**
 * UIED网站文章数据提取脚本 - 专版 (优化版)
 * 在浏览器控制台中运行此脚本来提取所有文章链接、标题和缩略图
 * 
 * 🆕 v1.0 功能特性：
 * - 专为UIED网站文章页面优化
 * - 智能文章数据识别和分类
 * - 提取文章链接、标题、缩略图
 * - 改进数据清洗和去重逻辑
 * - 优化标签提取算法
 * - 增加数据质量验证
 * 
 * 使用方法：
 * 1. 打开UIED分类页面（如：https://www.uied.cn/category/pingmian/font）
 * 2. 按F12打开开发者工具
 * 3. 在Console中粘贴并运行此脚本
 * 4. 脚本会自动提取并格式化所有文章数据
 */

// URL标准化函数，用于改进去重逻辑
function normalizeUrl(url) {
  try {
    const urlObj = new URL(url);
    // 移除末尾斜杠，统一协议为https，移除默认端口
    let normalized = `${urlObj.protocol}//${urlObj.hostname}`;
    
    // 添加非默认端口
    if (urlObj.port && 
        !((urlObj.protocol === 'http:' && urlObj.port === '80') ||
          (urlObj.protocol === 'https:' && urlObj.port === '443'))) {
      normalized += `:${urlObj.port}`;
    }
    
    // 添加路径（移除末尾斜杠）
    let pathname = urlObj.pathname;
    if (pathname !== '/' && pathname.endsWith('/')) {
      pathname = pathname.slice(0, -1);
    }
    normalized += pathname;
    
    // 保留查询参数和hash
    if (urlObj.search) {
      normalized += urlObj.search;
    }
    if (urlObj.hash) {
      normalized += urlObj.hash;
    }
    
    return normalized.toLowerCase();
  } catch (error) {
    console.warn('URL标准化失败:', url, error);
    return url.toLowerCase();
  }
}

// 🆕 文章分类智能识别
function identifyArticleCategory(title, description, url) {
  const text = (title + ' ' + description + ' ' + url).toLowerCase();
  
  // 根据URL路径识别分类
  const pathname = new URL(url).pathname;
  
  // 字体相关文章
  if (text.match(/(字体|font|typography|排版)/)) {
    if (text.match(/(中文|汉字|简体|繁体)/)) {
      return { category: 'font', subCategory: 'font-chinese' };
    } else if (text.match(/(英文|western|latin)/)) {
      return { category: 'font', subCategory: 'font-english' };
    } else if (text.match(/(图标|icon)/)) {
      return { category: 'font', subCategory: 'font-icon' };
    } else {
      return { category: 'font', subCategory: 'font-general' };
    }
  }
  
  // 设计相关文章
  if (text.match(/(设计|design|ui|ux|界面|交互)/)) {
    if (text.match(/(ui|界面|用户界面)/)) {
      return { category: 'design', subCategory: 'design-ui' };
    } else if (text.match(/(ux|交互|用户体验)/)) {
      return { category: 'design', subCategory: 'design-ux' };
    } else if (text.match(/(平面|graphic|海报|banner)/)) {
      return { category: 'design', subCategory: 'design-graphic' };
    } else {
      return { category: 'design', subCategory: 'design-general' };
    }
  }
  
  // 工具相关文章
  if (text.match(/(工具|tool|软件|app|插件|plugin)/)) {
    return { category: 'tools', subCategory: 'tools-software' };
  }
  
  // 素材相关文章
  if (text.match(/(素材|resource|图片|图标|模板|template)/)) {
    return { category: 'resources', subCategory: 'resources-materials' };
  }
  
  // 教程相关文章
  if (text.match(/(教程|tutorial|教学|学习|how to)/)) {
    return { category: 'tutorial', subCategory: 'tutorial-guide' };
  }
  
  // 灵感相关文章
  if (text.match(/(灵感|inspiration|创意|作品|showcase)/)) {
    return { category: 'inspiration', subCategory: 'inspiration-showcase' };
  }
  
  // 默认分类
  return { category: 'general', subCategory: 'general-article' };
}

// 🆕 数据质量验证
function validateArticleData(article) {
  const issues = [];
  
  // 检查必要字段
  if (!article.title || article.title.length < 2) {
    issues.push('标题过短或缺失');
  }
  if (!article.url || !article.url.startsWith('http')) {
    issues.push('URL无效');
  }
  if (!article.description && !article.excerpt) {
    issues.push('描述或摘要缺失');
  }
  
  // 检查URL有效性
  try {
    new URL(article.url);
  } catch {
    issues.push('URL格式错误');
  }
  
  // 检查是否为UIED文章链接
  if (!article.url.includes('uied.cn') || !article.url.match(/\/\d+\.html/)) {
    issues.push('非UIED文章链接');
  }
  
  return {
    isValid: issues.length === 0,
    issues: issues
  };
}

// UIED网站专用提取函数（优化版）
async function extractUIEDArticleData() {
  console.log('📖 UIED网站文章数据提取开始... (v1.0)');
  console.log('当前页面:', window.location.href);
  
  const results = [];
  let linkIndex = 1;
  let validCount = 0;
  let invalidCount = 0;

  // 检测页面类型
  const currentUrl = window.location.href;
  const hostname = window.location.hostname;
  
  if (!hostname.includes('uied.cn')) {
    console.log('❌ 这不是UIED网站，请在UIED网站页面运行此脚本');
    return [];
  }

  // UIED网站文章页面的特殊选择器（专门优化）
  const selectors = [
    // 主要的文章链接选择器
    '.article-item a[href*=".html"]',          // 文章项链接
    '.post-item a[href*=".html"]',             // 帖子项链接
    '.entry-item a[href*=".html"]',            // 条目项链接
    '.content-item a[href*=".html"]',          // 内容项链接
    '.card a[href*=".html"]',                  // 卡片中的文章链接
    '.item a[href*=".html"]',                  // 通用项目中的文章链接
    'article a[href*=".html"]',                // article标签中的链接
    '.post a[href*=".html"]',                  // 帖子链接
    '.entry a[href*=".html"]',                 // 条目链接
    '.grid-item a[href*=".html"]',             // 网格项中的文章链接
    '.list-item a[href*=".html"]',             // 列表项中的文章链接
    // UIED特有的结构
    '.uied-card a[href*=".html"]',             // UIED卡片中的文章
    '.category-item a[href*=".html"]',         // 分类项目中的文章
    '.article-card a[href*=".html"]',          // 文章卡片
    '.content-card a[href*=".html"]',          // 内容卡片
    // 更广泛的搜索
    'div[class*="item"] a[href*=".html"]',     // 包含item类名的div中的文章链接
    'div[class*="card"] a[href*=".html"]',     // 包含card类名的div中的文章链接
    'div[class*="post"] a[href*=".html"]',     // 包含post类名的div中的文章链接
    'div[class*="article"] a[href*=".html"]',  // 包含article类名的div中的文章链接
    // 通用文章链接（作为备选）
    'a[href*="uied.cn"][href*=".html"]',       // 所有UIED文章链接
    'a[href*="/"][href$=".html"]',             // 所有以.html结尾的链接
  ];

  console.log('🔍 开始扫描UIED页面文章链接...');

  // 先获取所有可能的文章链接 - 使用Map进行有效去重
  const articleLinksMap = new Map();
  
  selectors.forEach(selector => {
    try {
      const links = document.querySelectorAll(selector);
      console.log(`📋 选择器 "${selector}" 找到 ${links.length} 个链接`);
      
      links.forEach(link => {
        const url = link.href;
        const title = link.textContent?.trim() || 
                     link.title?.trim() || 
                     link.getAttribute('alt')?.trim() || 
                     '未知文章';
        
        // 检查是否为UIED文章链接（包含数字.html格式）
        if (url && 
            url.startsWith('http') && 
            url.includes('uied.cn') && 
            url.match(/\/\d+\.html/) &&
            !url.startsWith('javascript:') &&
            !url.startsWith('mailto:') &&
            title.length > 1) {
          
          const normalizedUrl = normalizeUrl(url);
          
          // 使用标准化URL作为key进行去重，但保留原始URL
          if (!articleLinksMap.has(normalizedUrl)) {
            articleLinksMap.set(normalizedUrl, {
              originalUrl: url,
              title: title,
              element: link
            });
          }
        }
      });
    } catch (error) {
      console.warn(`⚠️ 选择器 "${selector}" 执行出错:`, error);
    }
  });

  const articleInfos = Array.from(articleLinksMap.values());
  console.log(`🎯 找到 ${articleInfos.length} 个UIED文章链接`);
        
  // 如果没有找到链接，提示用户
  if (articleInfos.length === 0) {
    console.log('❌ 未找到任何UIED文章链接');
    console.log('💡 可能的原因：');
    console.log('   - 页面结构不符合预期');
    console.log('   - 页面还未完全加载');
    console.log('   - 网站使用了动态加载');
    return [];
  }

  // 获取页面分类信息
  let category = 'general';
  const pathname = window.location.pathname;
  if (pathname.includes('font')) {
    category = 'font';
  } else if (pathname.includes('pingmian')) {
    category = 'design';
  } else if (pathname.includes('ui')) {
    category = 'ui';
  } else if (pathname.includes('ux')) {
    category = 'ux';
  }

  // 处理每个文章
  let processedCount = 0;
  
  console.log(`🔄 开始处理 ${articleInfos.length} 个文章...`);
  
  for (const articleInfo of articleInfos) {
    try {
      processedCount++;
      console.log(`⏳ 处理第 ${processedCount}/${articleInfos.length} 个文章: ${articleInfo.title}`);
      
      // 获取描述信息和缩略图
      let description = '';
      let thumbnail = '';
      let excerpt = '';
      
      const parent = articleInfo.element.closest('article, .item, .card, .post-item, .article-item, .content-item, div, li');
      if (parent) {
        // 尝试从多个位置获取描述
        const descElements = parent.querySelectorAll('.description, .desc, .excerpt, .summary, .content, p');
        for (const elem of descElements) {
          const text = elem.textContent?.trim();
          if (text && text.length > 20 && !text.includes(articleInfo.title)) {
            description = text;
            break;
          }
        }
        
        // 获取缩略图
        const imgElement = parent.querySelector('img');
        if (imgElement) {
          thumbnail = imgElement.src || 
                     imgElement.getAttribute('data-src') || 
                     imgElement.getAttribute('data-lazy') || 
                     imgElement.getAttribute('data-original') || '';
        }
        
        // 如果没有找到专门的描述，从父元素文本中提取
        if (!description) {
          const fullText = parent.textContent?.trim() || '';
          const lines = fullText.split('\n').map(line => line.trim()).filter(line => line);
          for (const line of lines) {
            if (line.length > 20 && line !== articleInfo.title && !line.startsWith('http')) {
              description = line;
              break;
            }
          }
        }
        
        // 限制描述长度
        if (description && description.length > 200) {
          excerpt = description.substring(0, 200) + '...';
        } else {
          excerpt = description;
        }
      }
      
      if (!description || description.length < 10) {
        description = `来自UIED的优质文章：${articleInfo.title}`;
        excerpt = description;
      }

      // 🆕 智能文章分类识别
      const articleCategory = identifyArticleCategory(articleInfo.title, description, articleInfo.originalUrl);

      const newItem = {
        id: linkIndex++,
        title: articleInfo.title,
        description: description,
        excerpt: excerpt,
        url: articleInfo.originalUrl,
        thumbnail: thumbnail,
        category: articleCategory.category,
        subCategory: articleCategory.subCategory,
        tags: extractArticleTags(articleInfo.title, description, articleInfo.originalUrl),
        isHot: false,
        isFeatured: false,
        isNew: false,
        source: 'UIED文章',
        extractedFrom: currentUrl,
        publishTime: '', // 可以尝试从页面提取发布时间
        author: 'UIED' // 默认作者
      };
      
      // 🆕 数据质量验证
      const validation = validateArticleData(newItem);
      if (validation.isValid) {
        results.push(newItem);
        validCount++;
        console.log(`✅ 成功添加: ${articleInfo.title} -> ${articleInfo.originalUrl}`);
      } else {
        invalidCount++;
        console.log(`❌ 数据质量问题: ${articleInfo.title} - ${validation.issues.join(', ')}`);
      }
      
      // 添加小延迟避免处理过快
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      console.warn(`⚠️ 处理文章 "${articleInfo.title}" 时出错:`, error);
      invalidCount++;
      continue;
    }
  }

  console.log(`🎯 处理完成！`);
  console.log(`✅ 有效文章: ${validCount} 个`);
  console.log(`❌ 无效文章: ${invalidCount} 个`);
  console.log(`📊 成功率: ${((validCount / (validCount + invalidCount)) * 100).toFixed(1)}%`);
  
  return results;
}

// 🆕 从标题、描述和URL中提取文章相关标签（专门优化）
function extractArticleTags(title, description, url) {
  const text = (title + ' ' + description + ' ' + url).toLowerCase();
  const tags = [];
  
  // 文章内容标签
  const articleKeywords = {
    // 字体相关
    'font': ['字体', 'font', 'typography', '排版', '字形', '字型'],
    'chinese-font': ['中文字体', '汉字', '简体', '繁体', '楷体', '宋体', '黑体'],
    'english-font': ['英文字体', 'western', 'latin', 'typeface'],
    'icon-font': ['图标字体', 'icon font', 'iconfont', '图标'],
    
    // 设计相关
    'ui-design': ['ui', 'ui设计', '界面设计', '用户界面', 'interface'],
    'ux-design': ['ux', 'ux设计', '用户体验', '交互设计', 'user experience'],
    'visual-design': ['视觉设计', 'visual', '平面设计', 'graphic'],
    'web-design': ['网页设计', 'web', '网站设计', 'website'],
    'mobile-design': ['移动设计', 'mobile', 'app设计', '手机'],
    
    // 工具相关
    'design-tool': ['设计工具', 'tool', 'software', '软件', 'app'],
    'photoshop': ['photoshop', 'ps', 'adobe'],
    'figma': ['figma', '原型工具'],
    'sketch': ['sketch', 'sketch工具'],
    
    // 素材相关
    'resource': ['素材', 'resource', '资源', '下载'],
    'template': ['模板', 'template', 'psd', '源文件'],
    'mockup': ['样机', 'mockup', '贴图'],
    'icon': ['图标', 'icon', 'svg', '矢量'],
    'image': ['图片', '图像', 'photo', '照片'],
    
    // 技术相关
    'frontend': ['前端', 'frontend', 'html', 'css', 'javascript'],
    'development': ['开发', 'development', '编程', 'code'],
    'responsive': ['响应式', 'responsive', '自适应'],
    
    // 内容类型
    'tutorial': ['教程', 'tutorial', '教学', '学习', 'how to'],
    'inspiration': ['灵感', 'inspiration', '创意', 'creative'],
    'showcase': ['作品集', 'showcase', '展示', 'portfolio'],
    'trend': ['趋势', 'trend', '流行', '热门'],
    'news': ['资讯', 'news', '新闻', '动态'],
    
    // 行业相关
    'ecommerce': ['电商', 'ecommerce', '商城', '购物'],
    'branding': ['品牌', 'brand', '标志', 'logo'],
    'marketing': ['营销', 'marketing', '推广'],
    
    // 特征标签
    'free': ['免费', 'free', '开源', 'open source'],
    'premium': ['付费', 'premium', '高级', 'pro'],
    'collection': ['合集', 'collection', '精选', '推荐']
  };

  // 检查关键词匹配
  Object.entries(articleKeywords).forEach(([category, words]) => {
    if (words.some(word => text.includes(word))) {
      tags.push(category);
    }
  });

  // 🆕 根据URL路径推断标签
  const lowerUrl = url.toLowerCase();
  
  // URL路径分析
  if (lowerUrl.includes('/category/')) {
    const pathParts = lowerUrl.split('/category/')[1]?.split('/');
    if (pathParts) {
      pathParts.forEach(part => {
        if (part === 'pingmian') tags.push('design');
        if (part === 'font') tags.push('font');
        if (part === 'ui') tags.push('ui-design');
        if (part === 'ux') tags.push('ux-design');
        if (part === 'tool') tags.push('design-tool');
      });
    }
  }
  
  // 特殊内容识别
  if (text.includes('2024') || text.includes('2025')) tags.push('trend', 'news');
  if (text.includes('最新') || text.includes('new') || text.includes('最近')) tags.push('news');
  if (text.includes('精选') || text.includes('推荐') || text.includes('best')) tags.push('collection');
  if (text.includes('完整') || text.includes('详细') || text.includes('全面')) tags.push('tutorial');

  // 🆕 去重并按优先级排序
  const uniqueTags = [...new Set(tags)];
  
  // 如果没有标签，根据内容智能推断
  if (uniqueTags.length === 0) {
    if (text.includes('设计') || text.includes('design')) {
      uniqueTags.push('design');
    } else if (text.includes('字体') || text.includes('font')) {
      uniqueTags.push('font');
    } else if (text.includes('工具') || text.includes('tool')) {
      uniqueTags.push('design-tool');
    } else {
      uniqueTags.push('general');
    }
  }
  
  // 标签优先级排序
  const priorityTags = ['font', 'ui-design', 'ux-design', 'design-tool', 'tutorial', 'inspiration'];
  const sortedTags = uniqueTags.sort((a, b) => {
    const aPriority = priorityTags.includes(a) ? 0 : 1;
    const bPriority = priorityTags.includes(b) ? 0 : 1;
    return aPriority - bPriority;
  });
  
  return sortedTags.slice(0, 8); // 最多8个标签
}

// 转换为文章数据库格式
function convertToArticleFormat(data) {
  return data.map((item, index) => {
    // 生成ID (使用文章URL中的数字)
    let id;
    try {
      const urlMatch = item.url.match(/\/(\d+)\.html/);
      id = urlMatch ? `article-${urlMatch[1]}` : `article-${index + 1}`;
    } catch {
      id = `article-${index + 1}`;
    }
    
    return {
      id: id,
      title: item.title,
      description: item.description,
      excerpt: item.excerpt || item.description,
      url: item.url,
      thumbnail: item.thumbnail || '',
      category: item.category,
      subCategory: item.subCategory,
      tags: item.tags,
      isHot: item.isHot || false,
      isFeatured: item.isFeatured || false,
      isNew: item.isNew || false,
      author: item.author || 'UIED',
      publishTime: item.publishTime || new Date().toISOString(),
      source: item.source,
      extractedFrom: item.extractedFrom,
      language: 'zh-CN'
    };
  });
}

// 导出为JSON格式
function exportToJSON(data) {
  // 标准JSON导出
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `uied_articles_${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  console.log('📥 数据已导出为JSON文件');
  console.log('✅ 已包含文章标题、链接、缩略图');
  
  // 文章格式导出
  const articlesData = convertToArticleFormat(data);
  const articlesJsonString = `/**
 * @file articleDatabase.js
 * @description 从UIED网站提取的文章数据
 * @copyright 版权所有 (c) 2025 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 * 
 * 提取时间: ${new Date().toLocaleString()}
 * 文章数量: ${articlesData.length}
 */

// 导出文章数据
export const extractedArticles = ${JSON.stringify(articlesData, null, 2)};
`;
  
  const articlesBlob = new Blob([articlesJsonString], { type: 'application/javascript' });
  const articlesUrl = URL.createObjectURL(articlesBlob);
  const articlesLink = document.createElement('a');
  articlesLink.href = articlesUrl;
  articlesLink.download = `articleDatabase_extracted_${new Date().toISOString().split('T')[0]}.js`;
  document.body.appendChild(articlesLink);
  articlesLink.click();
  document.body.removeChild(articlesLink);
  URL.revokeObjectURL(articlesUrl);
  
  console.log('📥 数据已导出为文章数据库格式JS文件');
  console.log('✅ 可直接用于网站文章系统');
  
  // 将数据保存到全局变量供用户访问
  window.extractedArticlesData = articlesData;
}

// 导出为CSV格式
function exportToCSV(data) {
  const headers = ['ID', '标题', '描述', '网址', '分类', '子分类', '标签', '图标URL', '语言', '许可证', '来源'];
  const csvRows = [headers.join(',')];
  
  data.forEach(item => {
    const fontData = convertToFontToolsFormat([item])[0];
    const row = [
      fontData.id,
      `"${fontData.name.replace(/"/g, '""')}"`,
      `"${fontData.description.replace(/"/g, '""')}"`,
      fontData.url,
      fontData.category,
      fontData.subCategory,
      `"${fontData.tags.join(', ')}"`,
      fontData.iconUrl || '',
      fontData.language,
      fontData.license,
      item.source || 'UIED字体分类'
    ];
    csvRows.push(row.join(','));
  });
  
  const csvString = csvRows.join('\n');
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `uied_font_tools_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  console.log('📥 数据已导出为CSV文件');
  console.log('✅ 已包含字体工具详细信息');
}

// 主执行函数
async function runUIEDArticleExtraction() {
  console.log('📖 UIED网站文章数据提取');
  console.log('----------------------------------------');
  
  console.log('⏳ 开始提取文章数据，请耐心等待...');
  
  try {
    const data = await extractUIEDArticleData();
  
    console.log('✅ 提取完成！');
    console.log(`📊 总共找到 ${data.length} 个有效文章`);
    
    if (data.length > 0) {
      console.log('');
      console.log('🔍 前5个提取的文章示例：');
      console.table(data.slice(0, 5));
  
      // 分类统计
      const categoryStats = {};
      data.forEach(article => {
        const key = `${article.category} -> ${article.subCategory}`;
        categoryStats[key] = (categoryStats[key] || 0) + 1;
      });
      
      console.log('');
      console.log('📊 文章分类统计：');
      Object.entries(categoryStats).forEach(([category, count]) => {
        console.log(`  ${category}: ${count}篇文章`);
      });

      console.log('');
      console.log('💾 数据已自动导出为JSON文件和文章数据库格式');
      console.log('🔧 其他操作：');
      console.log('   - 输入 exportToCSV(extractedArticleData) 导出CSV格式');
      console.log('   - 输入 console.log(extractedArticlesData) 查看文章格式数据');
    
      // 将数据保存到全局变量
      window.extractedArticleData = data;
    
      // 自动导出JSON文件
      exportToJSON(data);
    } else {
      console.log('❌ 没有找到有效的文章链接');
      console.log('💡 可能的原因：');
      console.log('   - 页面结构发生了变化');
      console.log('   - 网络连接问题');
      console.log('   - 页面还未完全加载');
      console.log('   - 网站使用了动态加载内容');
      console.log('');
      console.log('🔧 建议：');
      console.log('   - 确保页面完全加载后再运行脚本');
      console.log('   - 检查浏览器控制台是否有错误信息');
      console.log('   - 尝试刷新页面后重新运行');
      console.log('   - 检查是否在正确的UIED分类页面');
    }
  } catch (error) {
    console.error('❌ 提取过程中发生错误:', error);
    console.log('🔧 请尝试：');
    console.log('   - 刷新页面后重新运行');
    console.log('   - 检查网络连接');
    console.log('   - 确认在UIED网站页面运行');
    console.log('   - 联系技术支持');
  }
}

// 🆕 一键转换功能 - 专为UIED文章优化
console.log('');
console.log('🚀 =============== UIED文章一键转换功能 ===============');
console.log('💡 现在您可以直接在浏览器中转换文章数据！');
console.log('');

/**
 * 🆕 UIED文章一键转换并复制到剪贴板
 * @param {Array} extractedData - 提取的原始数据
 * @param {Object} options - 转换选项
 */
window.convertArticlesAndCopy = function(extractedData, options = {}) {
  try {
    console.log('🎯 开始UIED文章一键转换和复制...');
    
    if (!extractedData || !Array.isArray(extractedData)) {
      console.error('❌ 请提供有效的数组数据');
      return;
    }
    
    // 转换数据
    const converted = convertToArticleFormat(extractedData);
    
    // 生成代码
    const code = `/**
 * @file articleDatabase.js - 新增UIED文章
 * @description 从UIED网站提取的文章数据
 * @copyright 版权所有 (c) 2025 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 * 
 * 提取时间: ${new Date().toLocaleString()}
 * 文章数量: ${converted.length}
 */

// 新增文章数据 - 请将以下数据添加到文章数组中
${JSON.stringify(converted, null, 2).replace(/^\[/, '').replace(/\]$/, '')}`;
    
    // 复制到剪贴板
    if (navigator.clipboard) {
      navigator.clipboard.writeText(code).then(() => {
        console.log('✅ 代码已复制到剪贴板');
      }).catch(err => {
        console.warn('⚠️ 自动复制失败，请手动复制:', err);
        console.log('📋 代码内容：');
        console.log(code);
      });
    } else {
      console.log('📋 代码内容（请手动复制）：');
      console.log(code);
    }
    
    console.log('');
    console.log('🎉 文章转换完成！');
    console.log('📋 可直接用于网站文章数据库');
    console.log('');
    
    return { converted, code };
    
  } catch (error) {
    console.error('❌ 转换过程中出错:', error);
  }
};

// 使用说明
console.log('📖 UIED文章提取使用说明:');
console.log('');
console.log('1. 🚀 运行提取:');
console.log('   runUIEDArticleExtraction();');
console.log('');
console.log('2. 📋 一键转换并复制:');
console.log('   convertArticlesAndCopy(extractedArticleData);');
console.log('');
console.log('3. 📥 导出CSV:');
console.log('   exportToCSV(extractedArticleData);');
console.log('');
console.log('💡 提示: 专门针对UIED网站文章页面优化');
console.log('🎯 目标页面: https://www.uied.cn/category/pingmian/font');
console.log('📝 提取内容: 文章链接、标题、缩略图、分类、标签');
console.log('===============================================');

// 自动运行提取
runUIEDArticleExtraction(); 