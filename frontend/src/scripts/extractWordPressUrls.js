/**
 * WordPress导航网站网址提取脚本 - 88设计网专版 (优化版)
 * 在浏览器控制台中运行此脚本来提取所有导航链接
 * 
 * 🆕 v2.0 优化功能：
 * - 增强AI工具识别和分类
 * - 改进数据清洗和去重逻辑
 * - 优化标签提取算法
 * - 支持更多网站结构
 * - 增加数据质量验证
 * 
 * 使用方法：
 * 1. 打开您的WordPress导航网站（如：https://www.88sheji.cn/favorites/changyongtuijian）
 * 2. 按F12打开开发者工具
 * 3. 在Console中粘贴并运行此脚本
 * 4. 脚本会自动提取并格式化所有链接数据
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

// 🆕 AI工具智能分类识别
function identifyAIToolCategory(title, description, url) {
  const text = (title + ' ' + description + ' ' + url).toLowerCase();
  
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
  
  // 默认分类
  return { category: 'other', subCategory: 'other' };
}

// 🆕 数据质量验证
function validateToolData(tool) {
  const issues = [];
  
  // 检查必要字段
  if (!tool.title || tool.title.length < 2) {
    issues.push('标题过短或缺失');
  }
  if (!tool.url || !tool.url.startsWith('http')) {
    issues.push('URL无效');
  }
  if (!tool.description || tool.description.length < 10) {
    issues.push('描述过短');
  }
  
  // 检查URL有效性
  try {
    new URL(tool.url);
  } catch {
    issues.push('URL格式错误');
  }
  
  // 检查是否为有效的外部链接
  if (tool.url.includes('88sheji.cn') || tool.url.includes('localhost')) {
    issues.push('非外部链接');
  }
  
  return {
    isValid: issues.length === 0,
    issues: issues
  };
}

// 88设计网专用提取函数（优化版）
async function extract88DesignData() {
  console.log('🎨 88设计网专用数据提取开始... (v2.0 优化版)');
  console.log('当前页面:', window.location.href);
  
  const results = [];
  let linkIndex = 1;
  let validCount = 0;
  let invalidCount = 0;

  // 检测页面类型
  const currentUrl = window.location.href;
  const hostname = window.location.hostname;
  
  if (!hostname.includes('88sheji.cn')) {
    console.log('❌ 这不是88设计网，请在88设计网页面运行此脚本');
    return [];
  }

  // 88设计网收藏夹页面的特殊选择器（优化版）
  const selectors = [
    // 主要的网站链接选择器
    'a[href*="/sites/"]',       // 指向详情页的链接
    '.site-item a',             // 网站项目链接
    '.site-link a',             // 网站链接
    '.favorites-item a',        // 收藏夹项目
    '.nav-item a',              // 导航项目
    'dd a[href*="/sites/"]',    // dd标签中的网站链接
    'dt a[href*="/sites/"]',    // dt标签中的网站链接
    'li a[href*="/sites/"]',    // 列表中的网站链接
    '.item a[href*="/sites/"]', // 项目链接
    'ul a[href*="/sites/"]',    // 列表中的链接
    // 更广泛的搜索
    'div a[href*="/sites/"]',   // div中的网站链接
    'span a[href*="/sites/"]',  // span中的网站链接
    'p a[href*="/sites/"]',     // 段落中的网站链接
    // 通用链接（作为备选）
    'a[href*="sites"]',         // 包含sites的所有链接
  ];

  console.log('🔍 开始扫描页面链接...');

  // 先获取所有可能的网站项目链接 - 使用Map进行有效去重
  const siteLinksMap = new Map();
  
  selectors.forEach(selector => {
    try {
      const links = document.querySelectorAll(selector);
      console.log(`📋 选择器 "${selector}" 找到 ${links.length} 个链接`);
      
      links.forEach(link => {
        if (link.href && link.href.includes('/sites/')) {
          const detailUrl = link.href;
          // 使用URL作为key进行去重
          if (!siteLinksMap.has(detailUrl)) {
            siteLinksMap.set(detailUrl, {
              detailUrl: detailUrl,
              title: link.textContent?.trim() || link.title?.trim() || '未知网站',
              element: link
            });
          }
        }
      });
    } catch (error) {
      console.warn(`⚠️ 选择器 "${selector}" 执行出错:`, error);
    }
  });

  const siteLinks = Array.from(siteLinksMap.values());
  console.log(`🎯 找到 ${siteLinks.length} 个网站详情页链接`);
        
  // 如果没有找到详情页链接，尝试直接提取外部链接
  if (siteLinks.length === 0) {
    console.log('🔄 尝试直接提取页面中的外部链接...');
    return extractDirectLinks();
  }

  // 获取分类信息
  let category = 'other';
  const pathname = window.location.pathname;
  if (pathname.includes('changyongtuijian')) {
    category = 'changyongtuijian';
  } else if (pathname.includes('favorites/')) {
    const pathParts = pathname.split('/');
    const favIndex = pathParts.indexOf('favorites');
    if (pathParts[favIndex + 1]) {
      category = pathParts[favIndex + 1];
    }
  }

  // 处理每个网站详情页
  let processedCount = 0;
  const totalLinks = siteLinks;
  
  console.log(`🔄 开始处理 ${totalLinks.length} 个网站详情页...`);
  
  for (const siteInfo of totalLinks) {
    try {
      processedCount++;
      console.log(`⏳ 处理第 ${processedCount}/${totalLinks.length} 个网站: ${siteInfo.title}`);
      
      // 获取网站的真实外部链接
      const realUrl = await getRealUrlFromDetailPage(siteInfo.detailUrl);
      
      if (realUrl && realUrl !== siteInfo.detailUrl && !realUrl.includes('88sheji.cn')) {
        // 获取描述信息
        let description = '';
        const parent = siteInfo.element.closest('li, dd, dt, div, .item, .site-item');
        if (parent) {
          const fullText = parent.textContent?.trim() || '';
          description = fullText.replace(siteInfo.title, '').trim();
          if (description.length > 200) {
            description = description.substring(0, 200) + '...';
          }
        }
        
        if (!description || description.length < 10) {
          description = `优质的${siteInfo.title}工具网站`;
        }

        // 获取图标
        let icon = '';
        const imgElement = siteInfo.element.querySelector('img') || 
                          parent?.querySelector('img');
        if (imgElement) {
          icon = imgElement.src || imgElement.getAttribute('data-src') || '';
        }

        // 🆕 智能分类识别
        const aiCategory = identifyAIToolCategory(siteInfo.title, description, realUrl);

        // 检查是否已存在（改进去重逻辑）
        const normalizedUrl = normalizeUrl(realUrl);
        const existingItem = results.find(item => {
          const existingNormalizedUrl = normalizeUrl(item.url);
          return existingNormalizedUrl === normalizedUrl;
        });
        
        if (!existingItem) {
          const newItem = {
            id: linkIndex++,
            title: siteInfo.title,
            description: description,
            url: realUrl,
            category: aiCategory.category,
            subCategory: aiCategory.subCategory,
            icon: icon,
            tags: extractTags(siteInfo.title, description),
            isHot: false,
            isFeatured: false,
            isNew: false,
            source: '88设计网',
            detailPage: siteInfo.detailUrl
          };
          
          // 🆕 数据质量验证
          const validation = validateToolData(newItem);
          if (validation.isValid) {
            results.push(newItem);
            validCount++;
            console.log(`✅ 成功添加: ${siteInfo.title} -> ${realUrl}`);
          } else {
            invalidCount++;
            console.log(`❌ 数据质量问题: ${siteInfo.title} - ${validation.issues.join(', ')}`);
          }
        } else {
          console.log(`⚠️ 重复链接跳过: ${realUrl}`);
        }
      } else {
        invalidCount++;
        console.log(`❌ 无法获取有效链接: ${siteInfo.title} (${siteInfo.detailUrl})`);
      }
      
      // 添加小延迟避免请求过快
      await new Promise(resolve => setTimeout(resolve, 200));
      
    } catch (error) {
      console.warn(`⚠️ 处理网站 "${siteInfo.title}" 时出错:`, error);
      invalidCount++;
      continue;
    }
  }

  console.log(`🎯 处理完成！`);
  console.log(`✅ 有效链接: ${validCount} 个`);
  console.log(`❌ 无效链接: ${invalidCount} 个`);
  console.log(`📊 成功率: ${((validCount / (validCount + invalidCount)) * 100).toFixed(1)}%`);
  
  return results;
}

// 从详情页获取真实的外部链接
async function getRealUrlFromDetailPage(detailUrl) {
  try {
    console.log(`🔗 正在获取真实链接: ${detailUrl}`);
        
    // 使用fetch获取详情页内容
    const response = await fetch(detailUrl);
    const html = await response.text();
    
    // 创建临时DOM来解析HTML
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    // 优先查找88设计网的跳转链接 /go/?url=
    const goLinks = doc.querySelectorAll('a[href*="/go/?url="]');
    if (goLinks.length > 0) {
      for (const goLink of goLinks) {
        const href = goLink.href || goLink.getAttribute('href');
        if (href && href.includes('/go/?url=')) {
          // 解码88设计网的跳转链接
          const realUrl = decode88ShejuGoUrl(href);
          if (realUrl) {
            console.log(`✅ 从/go/链接解码得到真实链接: ${realUrl}`);
            return realUrl;
          }
        }
      }
    }
    
    // 查找立即访问按钮或其他跳转按钮
    const visitButtons = doc.querySelectorAll('.btn[href*="/go/?url="], .btn-primary[href*="/go/?url="], a[href*="/go/?url="]');
    if (visitButtons.length > 0) {
      for (const button of visitButtons) {
        const href = button.href || button.getAttribute('href');
        if (href && href.includes('/go/?url=')) {
          const realUrl = decode88ShejuGoUrl(href);
          if (realUrl) {
            console.log(`✅ 从访问按钮解码得到真实链接: ${realUrl}`);
            return realUrl;
          }
        }
      }
    }
    
    // 在详情页中查找其他可能的外部链接
    const possibleSelectors = [
      'a[href^="http"]:not([href*="88sheji.cn"])',  // 所有外部链接
      '.site-url a',                                // 网站地址链接
      '.website-link a',                           // 网站链接
      '.external-link a',                          // 外部链接
      'a[target="_blank"]:not([href*="88sheji.cn"])', // 新窗口打开的外部链接
      '.btn a[href^="http"]:not([href*="88sheji.cn"])', // 按钮链接
      '.visit-btn a:not([href*="88sheji.cn"])',    // 访问按钮
      'a[href^="http"]:not([href*="javascript"]):not([href*="88sheji.cn"])', // 非JS外部链接
    ];
    
    for (const selector of possibleSelectors) {
      const links = doc.querySelectorAll(selector);
      for (const link of links) {
        const href = link.href || link.getAttribute('href');
        if (href && 
            !href.includes('88sheji.cn') && 
            !href.startsWith('javascript:') &&
            !href.startsWith('mailto:') &&
            !href.startsWith('#') &&
            href.startsWith('http')) {
          console.log(`✅ 找到直接外部链接: ${href}`);
          return href;
        }
      }
    }
    
    // 如果没有找到，尝试从脚本中提取跳转链接
    const scripts = doc.querySelectorAll('script');
    for (const script of scripts) {
      const scriptText = script.textContent || script.innerHTML;
      if (scriptText) {
        // 查找可能的跳转URL模式
        const urlPatterns = [
          /window\.open\s*\(\s*['"`]([^'"`]+)['"`]/g,
          /location\.href\s*=\s*['"`]([^'"`]+)['"`]/g,
          /window\.location\s*=\s*['"`]([^'"`]+)['"`]/g,
          /url\s*:\s*['"`]([^'"`]+)['"`]/g,
          /href\s*:\s*['"`]([^'"`]+)['"`]/g,
          // 88设计网特殊模式
          /\/go\/\?url=([^'"`\s&]+)/g
        ];
        
        for (const pattern of urlPatterns) {
          let match;
          while ((match = pattern.exec(scriptText)) !== null) {
            let url = match[1];
            
            // 如果是88设计网的go链接，需要解码
            if (url.includes('/go/?url=')) {
              url = decode88ShejuGoUrl('https://www.88sheji.cn' + url);
            }
            
            if (url && 
                !url.includes('88sheji.cn') && 
                url.startsWith('http')) {
              console.log(`✅ 从脚本中找到链接: ${url}`);
              return url;
            }
          }
        }
      }
    }
    
    console.log(`❌ 未能从详情页获取到真实链接: ${detailUrl}`);
    return null;
    
  } catch (error) {
    console.warn(`⚠️ 获取详情页内容失败: ${detailUrl}`, error);
    return null;
  }
}

// 解码88设计网的/go/?url=链接
function decode88ShejuGoUrl(goUrl) {
  try {
    // 提取URL参数中的编码部分
    const urlMatch = goUrl.match(/\/go\/\?url=([^&]+)/);
    if (!urlMatch) {
      console.warn('❌ 无法从go链接中提取URL参数:', goUrl);
            return null;
          }
    
    let encodedUrl = urlMatch[1];
    
    // URL解码（处理%3D等）
    encodedUrl = decodeURIComponent(encodedUrl);
    
    // Base64解码
    let decodedUrl;
    try {
      decodedUrl = atob(encodedUrl);
    } catch (base64Error) {
      console.warn('❌ Base64解码失败:', encodedUrl, base64Error);
      return null;
    }
    
    // 验证解码后的URL是否有效
    if (decodedUrl && decodedUrl.startsWith('http')) {
      console.log(`🔓 成功解码: ${encodedUrl} -> ${decodedUrl}`);
      return decodedUrl;
    } else {
      console.warn('❌ 解码后的URL无效:', decodedUrl);
      return null;
    }
    
  } catch (error) {
    console.error('❌ 解码88设计网链接时出错:', error, goUrl);
    return null;
          }
        }

// 直接提取页面中的外部链接
function extractDirectLinks() {
  console.log('🔄 尝试直接提取外部链接...');
  const results = [];
  let linkIndex = 1;
  
  // 直接查找外部链接的选择器
  const directSelectors = [
    'a[href^="http"]:not([href*="88sheji.cn"])',
    'a[target="_blank"][href^="http"]',
    'a[href^="https://"]:not([href*="88sheji.cn"])',
    'a[href^="http://"]:not([href*="88sheji.cn"])'
  ];
  
  directSelectors.forEach(selector => {
    try {
      const links = document.querySelectorAll(selector);
      console.log(`📋 直接选择器 "${selector}" 找到 ${links.length} 个外部链接`);
      
      links.forEach(link => {
        const url = link.href;
        const title = link.textContent?.trim() || 
                     link.title?.trim() || 
                     link.getAttribute('alt')?.trim() || 
                     '未知网站';
        
        if (url && title && 
            !url.includes('88sheji.cn') && 
            !url.startsWith('javascript:') &&
            !url.startsWith('mailto:') &&
            title.length > 1) {
          
          // 检查去重
        const existingItem = results.find(item => item.url === url);
          if (!existingItem) {
          results.push({
            id: linkIndex++,
            title: title,
              description: `优质的${title}工具网站`,
            url: url,
              category: 'direct',
              icon: '',
              tags: extractTags(title, ''),
            isHot: false,
            isFeatured: false,
              isNew: false,
              source: '88设计网-直接提取'
          });
          }
        }
      });
    } catch (error) {
      console.warn(`⚠️ 直接选择器 "${selector}" 执行出错:`, error);
    }
  });

  return results;
}

// 🆕 从标题和描述中提取标签（AI工具优化版）
function extractTags(title, description) {
  const text = (title + ' ' + description).toLowerCase();
  const tags = [];
  
  // AI工具相关关键词（大幅扩展）
  const keywords = {
    // AI核心技术
    'ai': ['ai', '人工智能', '智能', 'artificial intelligence', '机器学习', '深度学习', 'neural', '神经网络'],
    
    // AI写作相关
    'writing': ['写作', '文案', '文本', 'writing', 'text', '编辑', '排版', '内容', 'content', '文章', '博客'],
    'prompt': ['提示词', 'prompt', '咒语', '指令', 'command', '提示', '模板'],
    'chatgpt': ['chatgpt', 'gpt', 'openai', 'claude', 'gemini', 'bard', '对话', 'chat'],
    'paper': ['论文', 'paper', '学术', 'academic', '研究', 'research', '文献'],
    'detection': ['检测', 'detection', '原创', '抄袭', 'plagiarism', '查重'],
    
    // AI图像相关
    'image': ['图片', '图像', '绘画', 'image', 'photo', '摄影', '素材', '图库', '高清', '照片'],
    'midjourney': ['midjourney', 'mj', 'stable diffusion', 'sd', 'dall-e', 'dalle'],
    'art': ['艺术', 'art', '创作', 'creative', '设计', 'design'],
    'upscale': ['放大', 'upscale', '超分辨率', '增强', 'enhance', '画质'],
    'remove': ['去除', 'remove', '移除', '删除', '清理', 'cleanup'],
    'background': ['背景', 'background', 'bg', '抠图', '去背'],
    'watermark': ['水印', 'watermark', '去水印'],
    'avatar': ['头像', 'avatar', '肖像', 'portrait'],
    
    // AI视频相关
    'video': ['视频', 'video', '影像', '影片', 'movie', '电影'],
    'edit': ['剪辑', '编辑', 'edit', 'editing', '后期'],
    'subtitle': ['字幕', 'subtitle', '翻译', 'translate'],
    'face': ['换脸', 'face', 'swap', '人脸'],
    'digital': ['数字人', 'digital', '虚拟', 'virtual', 'avatar'],
    
    // AI音频相关
    'audio': ['音频', 'audio', '音乐', 'music', '声音', 'sound', '语音', 'voice'],
    'tts': ['文字转音', 'tts', '语音合成', 'speech', '配音'],
    'clone': ['克隆', 'clone', '模仿', '复制'],
    'separate': ['分离', 'separate', '提取', 'extract'],
    'compose': ['作曲', 'compose', '编曲', '创作'],
    
    // 设计工具
    'design': ['设计', 'design', 'ui', 'ux', '界面', '平面设计', '视觉设计', '交互设计', '品牌设计'],
    'photoshop': ['photoshop', 'ps', 'adobe', '修图', '图像处理'],
    'sketch': ['sketch', 'figma', '原型', 'prototype', '线框图'],
    'icon': ['图标', 'icon', 'svg', '矢量', 'iconfont'],
    'font': ['字体', 'font', '中文字体', '英文字体', '免费字体'],
    'template': ['模板', 'template', 'psd', 'ai', 'eps', '源文件'],
    'mockup': ['样机', 'mockup', '贴图', '展示'],
    'color': ['颜色', 'color', '配色', '色彩', 'palette', '渐变'],
    
    // 开发工具
    'code': ['代码', '编程', 'code', 'programming', '开发', 'github', 'css', 'html', 'javascript'],
    'frontend': ['前端', 'frontend', 'web', '网页', '响应式'],
    
    // 办公效率
    'productivity': ['效率', '办公', 'office', '生产力', 'ppt', 'excel', 'word'],
    'collaboration': ['协作', '团队', 'team', '项目管理', 'project'],
    
    // 学习资源
    'learning': ['学习', '教育', 'learning', 'education', '课程', '教程', 'tutorial'],
    'inspiration': ['灵感', 'inspiration', '创意', 'creative', '作品集'],
    
    // 工具类型
    'free': ['免费', 'free', '开源', 'open source', '免费版'],
    'online': ['在线', 'online', '网页版', 'web', '浏览器'],
    'mobile': ['移动', 'mobile', 'app', '手机', 'ios', 'android'],
    
    // 特殊分类
    'portfolio': ['作品集', 'portfolio', '展示', 'showcase', '画廊', 'gallery'],
    'community': ['社区', 'community', '论坛', '分享', '交流'],
    'news': ['资讯', 'news', '新闻', '博客', 'blog'],
    'marketplace': ['市场', 'marketplace', '商店', 'store', '购买'],
    'generator': ['生成器', 'generator', '生成', 'generate', '创建'],
    'tool': ['工具', 'tool', '助手', 'assistant', '平台', 'platform']
  };

  // 检查关键词匹配
  Object.entries(keywords).forEach(([category, words]) => {
    if (words.some(word => text.includes(word))) {
      tags.push(category);
    }
  });

  // 🆕 根据网站域名和URL推断标签
  const url = (title + ' ' + description).toLowerCase();
  
  // AI工具网站识别
  if (url.includes('openai') || url.includes('chatgpt')) tags.push('ai', 'chatgpt');
  if (url.includes('midjourney')) tags.push('ai', 'midjourney', 'art');
  if (url.includes('stable') && url.includes('diffusion')) tags.push('ai', 'image', 'art');
  if (url.includes('huggingface')) tags.push('ai', 'model');
  if (url.includes('replicate')) tags.push('ai', 'model');
  
  // 设计工具网站识别
  if (url.includes('dribbble')) tags.push('design', 'inspiration');
  if (url.includes('behance')) tags.push('design', 'portfolio');
  if (url.includes('figma')) tags.push('design', 'ui', 'collaboration');
  if (url.includes('canva')) tags.push('design', 'template');
  if (url.includes('adobe')) tags.push('design', 'photoshop');
  
  // 开发工具网站识别
  if (url.includes('github')) tags.push('code', 'open source');
  if (url.includes('codepen')) tags.push('code', 'frontend');
  if (url.includes('stackoverflow')) tags.push('code', 'learning');
  
  // 素材网站识别
  if (url.includes('unsplash') || url.includes('pexels')) tags.push('image', 'free');
  if (url.includes('iconfont') || url.includes('iconify')) tags.push('icon', 'free');
  if (url.includes('google') && url.includes('fonts')) tags.push('font', 'free');

  // 🆕 去重并限制标签数量
  const uniqueTags = [...new Set(tags)];
  
  // 如果没有标签，根据内容智能推断
  if (uniqueTags.length === 0) {
    if (text.includes('ai') || text.includes('智能')) {
      uniqueTags.push('ai', 'tool');
    } else if (text.includes('设计') || text.includes('design')) {
      uniqueTags.push('design', 'tool');
    } else {
      uniqueTags.push('tool');
    }
  }
  
  // 限制标签数量，优先保留AI相关标签
  const priorityTags = ['ai', 'chatgpt', 'midjourney', 'writing', 'image', 'video', 'audio'];
  const sortedTags = uniqueTags.sort((a, b) => {
    const aPriority = priorityTags.includes(a) ? 0 : 1;
    const bPriority = priorityTags.includes(b) ? 0 : 1;
    return aPriority - bPriority;
  });
  
  return sortedTags.slice(0, 8); // 最多8个标签
}

// 转换为UIUX工具数据库格式
function convertToUIUXFormat(data) {
  return data.map((item, index) => {
    // 生成ID (使用网站域名简化)
    const urlObj = new URL(item.url);
    const domain = urlObj.hostname.replace('www.', '').split('.')[0];
    const id = domain.toLowerCase().replace(/[^a-z0-9]/g, '-');
    
    // 确定分类和子分类
    let category = 'design-tools';
    let subCategory = 'design-tools-web';
    
    // 根据标签调整分类
    if (item.tags.includes('design') || item.tags.includes('ui')) {
      category = 'design-tools';
      subCategory = 'design-tools-web';
    } else if (item.tags.includes('inspiration') || item.tags.includes('portfolio')) {
      category = 'inspiration';
      subCategory = 'inspiration-showcase';
    } else if (item.tags.includes('image') || item.tags.includes('icon') || item.tags.includes('font')) {
      category = 'design-resources';
      subCategory = item.tags.includes('icon') ? 'design-resources-icons' : 
                    item.tags.includes('font') ? 'design-resources-fonts' : 'design-resources-images';
    } else if (item.tags.includes('code') || item.tags.includes('frontend')) {
      category = 'developer-tools';
      subCategory = 'developer-tools-components';
    } else if (item.tags.includes('productivity') || item.tags.includes('collaboration')) {
      category = 'prototype-tools';
      subCategory = 'prototype-tools-interactive';
    }
    
    return {
      id: id,
      name: item.title,
      description: item.description,
      url: item.url,
      iconUrl: item.icon || `https://www.google.com/s2/favicons?domain=${item.url}&sz=128`,
      category: category,
      subCategory: subCategory,
      tags: item.tags,
      isHot: item.isHot || false,
      isFeatured: item.isFeatured || false,
      rating: 4.5
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
  a.download = `88sheji_navigation_${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  console.log('📥 数据已导出为JSON文件');
  console.log('✅ 已包含图标URL');
  
  // UIUX格式导出
  const uiuxData = convertToUIUXFormat(data);
  const uiuxJsonString = `/**
 * 从88设计网提取的UI/UX工具数据
 * 提取时间: ${new Date().toLocaleString()}
 * 工具数量: ${uiuxData.length}
 */

// 导出工具数据
export const extractedTools = ${JSON.stringify(uiuxData, null, 2)};
`;
  
  const uiuxBlob = new Blob([uiuxJsonString], { type: 'application/javascript' });
  const uiuxUrl = URL.createObjectURL(uiuxBlob);
  const uiuxLink = document.createElement('a');
  uiuxLink.href = uiuxUrl;
  uiuxLink.download = `uiux_tools_extracted_${new Date().toISOString().split('T')[0]}.js`;
  document.body.appendChild(uiuxLink);
  uiuxLink.click();
  document.body.removeChild(uiuxLink);
  URL.revokeObjectURL(uiuxUrl);
  
  console.log('📥 数据已导出为UIUX工具格式JS文件');
  console.log('✅ 可直接复制到uiuxToolsDatabase.js使用');
  
  // 将数据保存到全局变量供用户访问
  window.extractedUiuxData = uiuxData;
}

// 导出为CSV格式
function exportToCSV(data) {
  const headers = ['ID', '标题', '描述', '网址', '分类', '标签', '图标URL', '来源'];
  const csvRows = [headers.join(',')];
  
  data.forEach(item => {
    const row = [
      item.id,
      `"${item.title.replace(/"/g, '""')}"`,
      `"${item.description.replace(/"/g, '""')}"`,
      item.url,
      item.category,
      `"${item.tags.join(', ')}"`,
      item.icon || '',
      item.source || '88设计网'
    ];
    csvRows.push(row.join(','));
  });
  
  const csvString = csvRows.join('\n');
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `88sheji_navigation_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  console.log('📥 数据已导出为CSV文件');
  console.log('✅ 已包含图标URL');
}

// 测试88设计网链接解码功能
function test88ShejuDecoding() {
  console.log('🧪 测试88设计网链接解码功能...');
  
  // 测试链接
  const testUrl = 'https://www.88sheji.cn/go/?url=aHR0cHM6Ly93d3cuYWlkYXh1ZS5jb20vP2NoPWRheHVlX2NvbGxlY3Rpb25fMjc%3D';
  const decoded = decode88ShejuGoUrl(testUrl);
  
  console.log('测试输入:', testUrl);
  console.log('解码结果:', decoded);
  
  if (decoded && decoded.startsWith('http')) {
    console.log('✅ 解码功能正常');
    return true;
  } else {
    console.log('❌ 解码功能异常');
    return false;
  }
}

// 主执行函数
async function runExtraction() {
  console.log('🎨 88设计网专用数据提取工具');
  console.log('----------------------------------------');
  
  // 首先测试解码功能
  test88ShejuDecoding();
  console.log('');
  
  console.log('⏳ 开始提取，请耐心等待...');
  
  try {
    const data = await extract88DesignData();
  
    console.log('✅ 提取完成！');
    console.log(`📊 总共找到 ${data.length} 个有效链接`);
    
    if (data.length > 0) {
      console.log('');
      console.log('🔍 前5个提取的数据示例：');
      console.table(data.slice(0, 5));
  
      console.log('');
      console.log('💾 数据已自动导出为JSON文件和UIUX工具格式');
      console.log('🔧 其他操作：');
      console.log('   - 输入 exportToCSV(extractedData) 导出CSV格式');
      console.log('   - 输入 console.log(extractedUiuxData) 查看UIUX格式数据');
    
      // 将数据保存到全局变量
      window.extractedData = data;
    
      // 自动导出JSON文件
      exportToJSON(data);
    } else {
      console.log('❌ 没有找到有效的导航链接');
      console.log('💡 可能的原因：');
      console.log('   - 页面结构发生了变化');
      console.log('   - 网络连接问题');
      console.log('   - 页面还未完全加载');
      console.log('');
      console.log('🔧 建议：');
      console.log('   - 确保页面完全加载后再运行脚本');
      console.log('   - 检查浏览器控制台是否有错误信息');
      console.log('   - 尝试刷新页面后重新运行');
    }
  } catch (error) {
    console.error('❌ 提取过程中发生错误:', error);
    console.log('🔧 请尝试：');
    console.log('   - 刷新页面后重新运行');
    console.log('   - 检查网络连接');
    console.log('   - 联系技术支持');
  }
}

// 自动运行提取
runExtraction(); 

// 🆕 新增：一键转换和导入功能 - 浏览器版本
console.log('');
console.log('🚀 =============== 一键转换功能 ===============');
console.log('💡 现在您可以直接在浏览器中转换任何提取的数据！');
console.log('');

/**
 * 🆕 一键转换并复制到剪贴板（推荐使用）
 * @param {Array} extractedData - 提取的原始数据
 * @param {Object} options - 转换选项
 */
window.convertAndCopy = function(extractedData, options = {}) {
  try {
    console.log('🎯 开始一键转换和复制...');
    
    if (!extractedData || !Array.isArray(extractedData)) {
      console.error('❌ 请提供有效的数组数据');
      return;
    }
    
    // 转换数据
    const converted = convertExtractedData(extractedData, options);
    
    // 生成代码
    const code = generateDatabaseCode(converted, options);
    
    // 复制到剪贴板
    copyToClipboard(code);
    
    console.log('');
    console.log('🎉 转换完成！代码已复制到剪贴板');
    console.log('📋 请粘贴到 aiToolsDatabase.js 的 aiTools 数组末尾');
    console.log('');
    
    return { converted, code };
    
  } catch (error) {
    console.error('❌ 转换过程中出错:', error);
  }
};

/**
 * 🆕 智能批量导入功能
 * @param {Array} dataArray - 多个数据源的数组
 * @param {Object} options - 导入选项
 */
window.batchImport = function(dataArray, options = {}) {
  try {
    console.log('🔄 开始批量导入...');
    
    if (!Array.isArray(dataArray)) {
      console.error('❌ 请提供数组格式的数据');
      return;
    }
    
    let allConverted = [];
    let totalCount = 0;
    
    dataArray.forEach((data, index) => {
      console.log(`📦 处理第 ${index + 1} 批数据...`);
      
      if (Array.isArray(data)) {
        const converted = convertExtractedData(data, options);
        allConverted = allConverted.concat(converted);
        totalCount += converted.length;
        console.log(`✅ 第 ${index + 1} 批: ${converted.length} 个工具`);
      }
    });
    
    // 去重处理
    const uniqueConverted = removeDuplicates(allConverted);
    const duplicateCount = allConverted.length - uniqueConverted.length;
    
    console.log('');
    console.log('📊 批量导入统计:');
    console.log(`- 总处理: ${totalCount} 个工具`);
    console.log(`- 去重后: ${uniqueConverted.length} 个工具`);
    console.log(`- 重复项: ${duplicateCount} 个`);
    
    // 生成代码
    const code = generateDatabaseCode(uniqueConverted, { 
      ...options, 
      title: `批量导入的AI工具数据 (${uniqueConverted.length}个工具)` 
    });
    
    // 复制到剪贴板
    copyToClipboard(code);
    
    console.log('');
    console.log('🎉 批量导入完成！代码已复制到剪贴板');
    
    return { converted: uniqueConverted, code };
    
  } catch (error) {
    console.error('❌ 批量导入过程中出错:', error);
  }
};

/**
 * 🆕 去重处理函数
 * @param {Array} tools - 工具数组
 * @returns {Array} 去重后的工具数组
 */
function removeDuplicates(tools) {
  const seen = new Set();
  return tools.filter(tool => {
    const key = tool.url || tool.id || tool.name;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

/**
 * 🆕 预览转换结果（不复制）
 * @param {Array} extractedData - 提取的原始数据
 * @param {Object} options - 转换选项
 */
window.previewConversion = function(extractedData, options = {}) {
  try {
    console.log('👀 预览转换结果...');
    
    const converted = convertExtractedData(extractedData, options);
    
    console.log('');
    console.log('📋 转换预览:');
    console.log(`- 工具数量: ${converted.length}`);
    
    // 显示前3个工具的详细信息
    converted.slice(0, 3).forEach((tool, index) => {
      console.log(`\n${index + 1}. ${tool.name}`);
      console.log(`   分类: ${tool.category} -> ${tool.subCategory}`);
      console.log(`   标签: [${tool.tags.join(', ')}]`);
      console.log(`   评分: ${tool.rating}`);
    });
    
    if (converted.length > 3) {
      console.log(`\n... 还有 ${converted.length - 3} 个工具`);
    }
    
    // 分类统计
    const categoryStats = {};
    converted.forEach(tool => {
      const key = `${tool.category} -> ${tool.subCategory}`;
      categoryStats[key] = (categoryStats[key] || 0) + 1;
    });
    
    console.log('\n📊 分类分布:');
    Object.entries(categoryStats).forEach(([category, count]) => {
      console.log(`  ${category}: ${count}个工具`);
    });
    
    return converted;
    
  } catch (error) {
    console.error('❌ 预览过程中出错:', error);
  }
};

/**
 * 🆕 快速测试功能
 */
window.testConversion = function() {
  console.log('🧪 运行转换测试...');
  
  const testData = [
    {
      id: 'test-tool',
      name: '测试AI工具',
      description: '这是一个测试用的AI绘画工具',
      url: 'https://test.example.com',
      tags: ['ai', 'test', 'drawing']
    }
  ];
  
  const result = previewConversion(testData);
  
  if (result && result.length > 0) {
    console.log('✅ 转换功能正常工作！');
  } else {
    console.log('❌ 转换功能可能有问题');
  }
  
  return result;
};

// 🆕 使用说明和示例
console.log('');
console.log('📖 使用说明:');
console.log('');
console.log('1. 🚀 一键转换并复制:');
console.log('   convertAndCopy(extractedTools);');
console.log('');
console.log('2. 👀 预览转换结果:');
console.log('   previewConversion(extractedTools);');
console.log('');
console.log('3. 🔄 批量导入多个数据源:');
console.log('   batchImport([data1, data2, data3]);');
console.log('');
console.log('4. 🧪 测试转换功能:');
console.log('   testConversion();');
console.log('');
console.log('💡 提示: 所有功能都会自动进行数据清理、分类和去重');
console.log('==============================================='); 