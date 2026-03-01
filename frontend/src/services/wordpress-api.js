/**
 * @file wordpress-api.js
 * @description WordPress API服务，用于获取文章、分类等数据
 * @copyright 版权所有 (c) 2024 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */
import { debugLog } from '../utils/debugHelper';

// 缓存数据，避免频繁请求API
const apiCache = {
  'latest-posts': { data: null, expiresAt: 0 },
  'category-posts': {}, // 按categoryId存储
  'tag-posts': {},      // 按tagId存储
  'search-posts': {}    // 按关键词存储
};

// API基础URL
const API_BASE_URL = 'https://www.uied.cn/wp-json/wp/v2';

// 缓存有效期（2小时，大幅延长避免频繁请求）
const CACHE_EXPIRE_TIME = 2 * 60 * 60 * 1000;

// 请求计数器和时间窗口（用于限制请求频率）
let requestCounter = 0;
let lastRequestTime = 0;
const MAX_REQUESTS_PER_MINUTE = 5; // 降低每分钟最大请求数
const REQUEST_INTERVAL = 60 * 1000; // 1分钟

// 本地存储缓存键前缀
const STORAGE_PREFIX = 'uied_wp_cache_';

// 模拟数据，当实际API不可用时使用
const MOCK_DATA = {
  // 模拟文章数据
  posts: Array.from({ length: 50 }, (_, index) => {
    const id = index + 1;
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * 30)); // 随机1-30天前发布
    
    return {
      id,
      title: { rendered: `设计组件文章示例 ${id}` },
      excerpt: { rendered: `这是一篇关于UI设计组件的精彩文章，探讨了设计系统的最佳实践和组件化设计的优势。文章包含了丰富的案例分析和实用技巧，适合所有对UI/UX设计感兴趣的读者。这是示例文章 ${id}。` },
      link: `https://www.uied.cn/design-article-${id}`,
      date: date.toISOString(),
      _embedded: {
        'wp:featuredmedia': [
          {
            source_url: `https://picsum.photos/id/${(id % 100) + 100}/800/600`,
            media_details: {
              sizes: {
                medium: {
                  source_url: `https://picsum.photos/id/${(id % 100) + 100}/400/300`
                },
                medium_large: {
                  source_url: `https://picsum.photos/id/${(id % 100) + 100}/600/450`
                }
              }
            }
          }
        ],
        author: [
          {
            name: `设计作者 ${id % 10 + 1}`,
            avatar_urls: {
              '96': `https://i.pravatar.cc/96?img=${id % 70}`
            }
          }
        ]
      }
    };
  })
};

/**
 * 从localStorage获取缓存数据
 * @param {string} key - 缓存键
 * @returns {Object|null} - 缓存数据或null
 */
const getFromLocalStorage = (key) => {
  try {
    const item = localStorage.getItem(STORAGE_PREFIX + key);
    if (!item) return null;
    
    const parsed = JSON.parse(item);
    
    // 检查是否过期
    if (parsed.expiresAt && parsed.expiresAt < Date.now()) {
      localStorage.removeItem(STORAGE_PREFIX + key);
      return null;
    }
    
    return parsed;
  } catch (error) {
    debugLog.warn('从localStorage读取缓存失败:', error);
    return null;
  }
};

/**
 * 保存数据到localStorage
 * @param {string} key - 缓存键
 * @param {*} data - 要缓存的数据
 * @param {number} expireTime - 过期时间（毫秒）
 */
const saveToLocalStorage = (key, data, expireTime = CACHE_EXPIRE_TIME) => {
  try {
    const item = {
      data,
      expiresAt: Date.now() + expireTime,
      createdAt: Date.now()
    };
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(item));
  } catch (error) {
    debugLog.warn('保存到localStorage失败:', error);
  }
};

/**
 * 清理过期的localStorage缓存
 */
const cleanExpiredCache = () => {
  try {
    const keys = Object.keys(localStorage);
    let cleanedCount = 0;
    
    keys.forEach(key => {
      if (key.startsWith(STORAGE_PREFIX)) {
        try {
          const item = JSON.parse(localStorage.getItem(key));
          if (item.expiresAt && item.expiresAt < Date.now()) {
            localStorage.removeItem(key);
            cleanedCount++;
          }
        } catch (e) {
          // 删除损坏的缓存项
          localStorage.removeItem(key);
          cleanedCount++;
        }
      }
    });
    
    if (cleanedCount > 0) {
      debugLog.dev(`清理了 ${cleanedCount} 个过期的WordPress缓存`);
    }
  } catch (error) {
    debugLog.warn('清理缓存失败:', error);
  }
};

// 从本地JSON文件加载模拟数据的函数
const loadMockData = async () => {
  try {
    const response = await fetch('/mock/design-articles.json');
    if (!response.ok) {
      debugLog.warn('加载模拟数据失败:', response.statusText);
      return null;
    }
    const data = await response.json();
    return data.articles || [];
  } catch (error) {
    debugLog.error('加载模拟数据出错:', error);
    return null;
  }
};

/**
 * 为URL添加缓存破坏参数
 * @param {string} url - API URL
 * @returns {string} - 添加了缓存破坏参数的URL
 */
const addCacheBuster = (url) => {
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}_=${Date.now()}`;
};

/**
 * 添加随机延迟
 * @param {number} min - 最小延迟毫秒数
 * @param {number} max - 最大延迟毫秒数
 * @returns {Promise} - 延迟Promise
 */
const addRandomDelay = (min = 300, max = 800) => {
  const delay = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise(resolve => setTimeout(resolve, delay));
};

/**
 * 检查请求频率限制
 * @returns {boolean} - 是否可以继续请求
 */
const checkRequestLimit = () => {
  const now = Date.now();
  
  // 重置计数器（如果上次请求时间超过1分钟）
  if (now - lastRequestTime > REQUEST_INTERVAL) {
    requestCounter = 0;
    lastRequestTime = now;
    return true;
  }
  
  // 检查是否超过最大请求数
  if (requestCounter >= MAX_REQUESTS_PER_MINUTE) {
    debugLog.warn('请求频率过高，使用缓存或模拟数据');
    return false;
  }
  
  // 更新计数器和时间
  requestCounter++;
  lastRequestTime = now;
  return true;
};

/**
 * 创建请求头
 * @returns {Object} - 请求头对象
 */
const createHeaders = () => {
  // 常见浏览器的User-Agent列表
  const userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0'
  ];
  
  // 随机选择一个User-Agent
  const randomUserAgent = userAgents[Math.floor(Math.random() * userAgents.length)];
  
  return {
    'User-Agent': randomUserAgent,
    'Accept': 'application/json',
    'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
    'Referer': 'https://www.uied.cn/',
    'Connection': 'keep-alive',
    'Cache-Control': 'max-age=0'
  };
};

/**
 * 执行API请求（带重试机制）
 * @param {string} url - 请求URL
 * @param {Object} options - 请求选项
 * @returns {Promise} - 请求结果
 */
const fetchWithRetry = async (url, options = {}) => {
  let retries = 3; // 最大重试次数
  let lastError;
  
  while (retries > 0) {
    try {
      // 随机延迟，避免频繁请求
      await addRandomDelay();
      
      // 检查请求限制
      if (!checkRequestLimit()) {
        throw new Error('请求频率限制');
      }
      
      // 设置请求头
      const headers = createHeaders();
      const response = await fetch(url, { 
        ...options, 
        headers: {
          ...headers,
          ...options.headers
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP错误: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      lastError = error;
      retries--;
      debugLog.warn(`请求失败，剩余重试次数: ${retries}`, error);
      
      // 重试前增加延迟
      await addRandomDelay(1000, 2000);
    }
  }
  
  throw lastError;
};

/**
 * 获取文章列表（最新发布）
 * @param {Object} params - 请求参数
 * @param {number} params.page - 页码
 * @param {number} params.perPage - 每页条数
 * @param {string} params.orderBy - 排序字段
 * @param {string} params.order - 排序方式
 * @param {boolean} params.useMock - 是否使用模拟数据（已废弃，总是优先使用真实API）
 * @returns {Promise<Array>} - 文章数据
 */
const getLatestPosts = async (params = {}) => {
  const {
    page = 1,
    perPage = 10,
    orderBy = 'date',
    order = 'desc'
  } = params;

  const cacheKey = 'latest-posts';
  const memoryCache = apiCache[cacheKey];

  // 首先检查内存缓存
  if (memoryCache && memoryCache.data && memoryCache.expiresAt > Date.now()) {
    return memoryCache.data;
  }
  
  // 然后检查localStorage缓存
  const localCache = getFromLocalStorage(cacheKey);
  if (localCache && localCache.data) {
    // 同步到内存缓存
    apiCache[cacheKey] = localCache;
    return localCache.data;
  }

  try {
    // 总是优先尝试请求真实API
    const url = addCacheBuster(`${API_BASE_URL}/posts?page=${page}&per_page=${perPage}&orderby=${orderBy}&order=${order}&_embed=true`);
    
    const data = await fetchWithRetry(url);
    const processedData = processPostsData(data);

    // 更新内存缓存
    const latestCacheData = {
      data: processedData,
      expiresAt: Date.now() + CACHE_EXPIRE_TIME
    };
    apiCache[cacheKey] = latestCacheData;
    
    // 保存到localStorage
    saveToLocalStorage(cacheKey, processedData);

    return processedData;
  } catch (error) {
    debugLog.error('获取最新文章失败，使用模拟数据:', error);
    
    // API请求失败时使用模拟数据作为备选
    const mockPosts = [...MOCK_DATA.posts]
      .sort((a, b) => order === 'desc' ? 
        new Date(b.date) - new Date(a.date) : 
        new Date(a.date) - new Date(b.date))
      .slice((page - 1) * perPage, page * perPage);
    
    const processedData = processPostsData(mockPosts);
    
    // 更新内存缓存（错误情况使用模拟数据）
    const latestErrorCacheData = {
      data: processedData,
      expiresAt: Date.now() + CACHE_EXPIRE_TIME
    };
    apiCache[cacheKey] = latestErrorCacheData;
    
    // 保存到localStorage（错误情况使用模拟数据）
    saveToLocalStorage(cacheKey, processedData);
    
    return processedData;
  }
};

/**
 * 获取分类文章
 * @param {Object} params - 请求参数
 * @param {number} params.categoryId - 分类ID
 * @param {number} params.page - 页码
 * @param {number} params.perPage - 每页条数
 * @param {string} params.orderBy - 排序字段
 * @param {string} params.order - 排序方式
 * @param {boolean} params.useMock - 是否使用模拟数据（已废弃，总是优先使用真实API）
 * @returns {Promise<Array>} - 文章数据
 */
const getCategoryPosts = async (params = {}) => {
  const {
    categoryId,
    page = 1,
    perPage = 10,
    orderBy = 'date',
    order = 'desc'
  } = params;

  if (!categoryId) {
    throw new Error('分类ID不能为空');
  }

  const cacheKey = `category-${categoryId}-${page}-${perPage}-${orderBy}-${order}`;
  const memoryCache = apiCache['category-posts'][cacheKey];
  
  // 首先检查内存缓存
  if (memoryCache && memoryCache.data && memoryCache.expiresAt > Date.now()) {
    return memoryCache.data;
  }
  
  // 然后检查localStorage缓存
  const localCache = getFromLocalStorage(cacheKey);
  if (localCache && localCache.data) {
    // 同步到内存缓存
    apiCache['category-posts'][cacheKey] = localCache;
    return localCache.data;
  }

  try {
    // 总是优先尝试请求真实API
    const url = addCacheBuster(`${API_BASE_URL}/posts?categories=${categoryId}&page=${page}&per_page=${perPage}&orderby=${orderBy}&order=${order}&_embed=true`);
    
    const data = await fetchWithRetry(url);
    const processedData = processPostsData(data);

    // 更新内存缓存
    const cacheData = {
      data: processedData,
      expiresAt: Date.now() + CACHE_EXPIRE_TIME
    };
    apiCache['category-posts'][cacheKey] = cacheData;
    
    // 保存到localStorage
    saveToLocalStorage(cacheKey, processedData);

    return processedData;
  } catch (error) {
    debugLog.error(`获取分类(${categoryId})文章失败，使用模拟数据:`, error);
    
    // 尝试从本地JSON文件加载模拟数据
    const mockArticles = await loadMockData();
    
    if (mockArticles) {
      const filteredArticles = mockArticles
        .filter(article => categoryId ? article.id % 5 === categoryId % 5 : true)
        .sort((a, b) => order === 'desc' ? 
          new Date(b.date) - new Date(a.date) : 
          new Date(a.date) - new Date(b.date))
        .slice((page - 1) * perPage, page * perPage);
      
      // 更新内存缓存（错误情况，缓存时间加倍）
      const errorCacheData = {
        data: filteredArticles,
        expiresAt: Date.now() + CACHE_EXPIRE_TIME * 2
      };
      apiCache['category-posts'][cacheKey] = errorCacheData;
      
      // 保存到localStorage（错误情况）
      saveToLocalStorage(cacheKey, filteredArticles, CACHE_EXPIRE_TIME * 2);
      
      return filteredArticles;
    }
    
    // 如果JSON加载失败，使用内存中的模拟数据
    const mockPosts = [...MOCK_DATA.posts]
      .filter(post => post.id % 5 === categoryId % 5) // 简单模拟不同分类
      .sort((a, b) => order === 'desc' ? 
        new Date(b.date) - new Date(a.date) : 
        new Date(a.date) - new Date(b.date))
      .slice((page - 1) * perPage, page * perPage);
    
    const processedData = processPostsData(mockPosts);
    
    // 更新内存缓存（最终错误情况）
    const finalErrorCacheData = {
      data: processedData,
      expiresAt: Date.now() + CACHE_EXPIRE_TIME * 2
    };
    apiCache['category-posts'][cacheKey] = finalErrorCacheData;
    
    // 保存到localStorage（最终错误情况）
    saveToLocalStorage(cacheKey, processedData, CACHE_EXPIRE_TIME * 2);
    
    return processedData;
  }
};

/**
 * 获取标签文章
 * @param {Object} params - 请求参数
 * @param {number} params.tagId - 标签ID
 * @param {number} params.page - 页码
 * @param {number} params.perPage - 每页条数
 * @param {string} params.orderBy - 排序字段
 * @param {string} params.order - 排序方式
 * @returns {Promise<Array>} - 文章数据
 */
const getTagPosts = async (params = {}) => {
  const {
    tagId,
    page = 1,
    perPage = 10,
    orderBy = 'date',
    order = 'desc'
  } = params;

  if (!tagId) {
    throw new Error('标签ID不能为空');
  }

  const cacheKey = `tag-${tagId}-${page}-${perPage}-${orderBy}-${order}`;
  const cached = apiCache['tag-posts'][cacheKey];

  // 检查缓存是否有效
  if (cached && cached.data && cached.expiresAt > Date.now()) {
    // 使用缓存的标签文章数据
    return cached.data;
  }

  try {
    const url = addCacheBuster(`${API_BASE_URL}/posts?tags=${tagId}&page=${page}&per_page=${perPage}&orderby=${orderBy}&order=${order}&_embed=true`);
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`获取标签(${tagId})文章失败`);
    }

    const data = await response.json();
    const processedData = processPostsData(data);

    // 更新缓存
    apiCache['tag-posts'][cacheKey] = {
      data: processedData,
      expiresAt: Date.now() + CACHE_EXPIRE_TIME
    };

    return processedData;
  } catch (error) {
    debugLog.error(`获取标签(${tagId})文章失败:`, error);
    return [];
  }
};

/**
 * 搜索文章
 * @param {Object} params - 请求参数
 * @param {string} params.keyword - 搜索关键词
 * @param {number} params.page - 页码
 * @param {number} params.perPage - 每页条数
 * @returns {Promise<Array>} - 文章数据
 */
const searchPosts = async (params = {}) => {
  const {
    keyword,
    page = 1,
    perPage = 10
  } = params;

  if (!keyword) {
    throw new Error('搜索关键词不能为空');
  }

  const cacheKey = `search-${keyword}-${page}-${perPage}`;
  const cached = apiCache['search-posts'][cacheKey];

  // 检查缓存是否有效
  if (cached && cached.data && cached.expiresAt > Date.now()) {
    // 使用缓存的搜索文章数据
    return cached.data;
  }

  try {
    const url = addCacheBuster(`${API_BASE_URL}/posts?search=${encodeURIComponent(keyword)}&page=${page}&per_page=${perPage}&_embed=true`);
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`搜索文章(${keyword})失败`);
    }

    const data = await response.json();
    const processedData = processPostsData(data);

    // 更新缓存
    apiCache['search-posts'][cacheKey] = {
      data: processedData,
      expiresAt: Date.now() + CACHE_EXPIRE_TIME
    };

    return processedData;
  } catch (error) {
    debugLog.error(`搜索文章(${keyword})失败:`, error);
    return [];
  }
};

/**
 * 处理文章数据，统一格式
 * @param {Array} posts - 原始文章数据
 * @returns {Array} - 处理后的文章数据
 */
const processPostsData = (posts = []) => {
  if (!Array.isArray(posts)) {
    debugLog.warn('处理文章数据失败，输入不是数组');
    return [];
  }

  return posts.map(post => {
    // 获取特色图片
    let thumbnail = '';
    if (post._embedded && post._embedded['wp:featuredmedia'] && post._embedded['wp:featuredmedia'][0]) {
      const media = post._embedded['wp:featuredmedia'][0];
      thumbnail = media.source_url || '';
      
      // 如果有不同尺寸，优先使用medium_large或medium
      if (media.media_details && media.media_details.sizes) {
        const sizes = media.media_details.sizes;
        if (sizes.medium_large) {
          thumbnail = sizes.medium_large.source_url;
        } else if (sizes.medium) {
          thumbnail = sizes.medium.source_url;
        }
      }
    }

    // 获取作者信息
    let authorName = '';
    let authorAvatar = '';
    if (post._embedded && post._embedded.author && post._embedded.author[0]) {
      const author = post._embedded.author[0];
      authorName = author.name || '';
      authorAvatar = author.avatar_urls && author.avatar_urls['96'] ? author.avatar_urls['96'] : '';
    }

    // 计算发布时间距今
    const timeAgo = calculateTimeAgo(post.date);

    // 处理文章内容摘要
    let description = post.excerpt?.rendered || '';
    description = description.replace(/<\/?[^>]+(>|$)/g, '').trim(); // 移除HTML标签

    return {
      id: post.id.toString(),
      name: post.title.rendered,
      description,
      link: post.link,
      thumbnail,
      date: new Date(post.date).toLocaleDateString(),
      authorName,
      authorAvatar,
      viewCount: Math.floor(Math.random() * 1000) + 100, // 示例：随机生成浏览量
      score: (Math.random() * 4 + 1).toFixed(1), // 示例：随机生成评分 (1-5)
      timeAgo,
      isNew: isNewPost(post.date), // 是否是最近7天发布的文章
      isHot: Math.random() > 0.7, // 示例：随机设置热门
      isFeatured: Math.random() > 0.8, // 示例：随机设置推荐
    };
  });
};

/**
 * 计算发布时间距今
 * @param {string} dateString - 日期字符串
 * @returns {string} - 距今时间描述
 */
const calculateTimeAgo = (dateString) => {
  const publishDate = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - publishDate) / 1000);

  if (diffInSeconds < 60) {
    return `${diffInSeconds}秒`;
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes}分钟`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours}小时`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) {
    return `${diffInDays}天`;
  }

  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths}个月`;
  }

  const diffInYears = Math.floor(diffInMonths / 12);
  return `${diffInYears}年`;
};

/**
 * 判断是否是新文章（7天内发布）
 * @param {string} dateString - 日期字符串
 * @returns {boolean} - 是否是新文章
 */
const isNewPost = (dateString) => {
  const publishDate = new Date(dateString);
  const now = new Date();
  const diffInDays = Math.floor((now - publishDate) / (1000 * 60 * 60 * 24));
  return diffInDays <= 7;
};

/**
 * 清除指定类型的缓存
 * @param {string} type - 缓存类型
 */
const clearCache = (type) => {
  if (type === 'latest-posts') {
    apiCache['latest-posts'] = { data: null, expiresAt: 0 };
    // 清除对应的localStorage缓存
    try {
      localStorage.removeItem(STORAGE_PREFIX + 'latest-posts');
    } catch (error) {
      debugLog.warn('清除latest-posts localStorage缓存失败:', error);
    }
  } else if (type === 'category-posts') {
    apiCache['category-posts'] = {};
    // 清除所有分类文章的localStorage缓存
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(STORAGE_PREFIX + 'category-')) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      debugLog.warn('清除category-posts localStorage缓存失败:', error);
    }
  } else if (type === 'tag-posts') {
    apiCache['tag-posts'] = {};
    // 清除所有标签文章的localStorage缓存
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(STORAGE_PREFIX + 'tag-')) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      debugLog.warn('清除tag-posts localStorage缓存失败:', error);
    }
  } else if (type === 'search-posts') {
    apiCache['search-posts'] = {};
    // 清除所有搜索文章的localStorage缓存
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(STORAGE_PREFIX + 'search-')) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      debugLog.warn('清除search-posts localStorage缓存失败:', error);
    }
  } else if (type === 'all') {
    // 清除所有内存缓存
    Object.keys(apiCache).forEach(key => {
      if (typeof apiCache[key] === 'object') {
        if (Array.isArray(apiCache[key])) {
          apiCache[key] = [];
        } else {
          apiCache[key] = {};
        }
      } else {
        apiCache[key] = null;
      }
    });
    
    // 清除所有localStorage缓存
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(STORAGE_PREFIX)) {
          localStorage.removeItem(key);
        }
      });
      debugLog.dev('已清除所有WordPress缓存');
    } catch (error) {
      debugLog.warn('清除所有localStorage缓存失败:', error);
    }
  }
};

// 初始化：清理过期的localStorage缓存
try {
  cleanExpiredCache();
  debugLog.dev('WordPress API缓存服务已初始化，已清理过期缓存');
} catch (error) {
  debugLog.warn('初始化WordPress API缓存失败:', error);
}

// 定期清理过期缓存（每30分钟执行一次）
setInterval(() => {
  cleanExpiredCache();
}, 30 * 60 * 1000);

// 导出API服务
const wordPressApi = {
  getLatestPosts,
  getCategoryPosts,
  getTagPosts,
  searchPosts,
  clearCache
};

export default wordPressApi; 
