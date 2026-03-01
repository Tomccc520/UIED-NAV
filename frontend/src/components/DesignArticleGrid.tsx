/**
 * @file DesignArticleGrid.tsx
 * @description 组件设计文章网格组件，展示设计文章，一行6个网格布局，支持子分类切换
 * @copyright 版权所有 (c) 2025 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.4.0 - 集成 WordPress 组件配置控制
 */
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './DesignArticleGrid.css';

// 导入实际的WordPress API服务
import wordPressApi from '../services/wordpress-api';

// 导入 WordPress 组件配置 Hook
import { useWordPressWidgets } from '../hooks/useWordPressWidgets';

// 导入 WordPress 分类 Hook
import { useWordPressCategories } from '../hooks/useWordPressCategories';

// 导入 WordPress 标签 Hook
import { useWordPressTags } from '../hooks/useWordPressTags';
import { debugLog } from '../utils/debugHelper';

// 导入RankItem类型
interface RankItem {
  id: string;
  name: string;
  description?: string;
  link: string;
  thumbnail?: string;
  date?: string;
  authorName?: string;
  authorAvatar?: string;
  viewCount?: number;
  score?: number;
  timeAgo?: string;
  isNew?: boolean;
  isHot?: boolean;
  isFeatured?: boolean;
  category?: string;
  subCategory?: string;
  tags?: string[];
}

// 子分类选项接口
interface TagOption {
  key: string;
  name: string;
  type: 'category' | 'tag';  // 支持分类和标签两种类型
  id: number;
  description?: string;
}

interface SessionCachePayload<T> {
  data: T;
  expiresAt: number;
}

// 默认标签选项（作为备用）- 都是分类类型
const DEFAULT_TAG_OPTIONS: TagOption[] = [
  { key: 'UI', name: 'UI', type: 'category', id: 334 },
  { key: 'UX', name: 'UX', type: 'category', id: 337 },
  { key: 'product', name: '产品', type: 'category', id: 336 },
  { key: 'graphic', name: '平面', type: 'category', id: 335 },
  { key: '3d', name: '三维', type: 'category', id: 1031 },
  { key: 'tips', name: '设计干货', type: 'category', id: 307 },
  { key: 'inspiration', name: '设计灵感', type: 'category', id: 1861 },
  { key: 'Font', name: '字体', type: 'category', id: 319 },
  { key: 'AIGC', name: 'AIGC', type: 'category', id: 417 },
];

// 常量定义
const CACHE_EXPIRE_TIME = 10 * 60 * 1000; // 10分钟缓存过期

// 清除所有设计文章缓存
const clearDesignArticlesCache = () => {
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && key.startsWith('design-articles-')) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => sessionStorage.removeItem(key));
    debugLog.dev('DesignArticleGrid: 已清除缓存', keysToRemove.length, '个');
  } catch (e) {
    debugLog.warn('清除缓存失败', e);
  }
};

// 全局缓存 - 组件级别，持久化到sessionStorage
/**
 * 从会话缓存中读取并校验过期时间。
 */
function getFromSessionStorage<T>(key: string): T | null {
  try {
    const storedData = sessionStorage.getItem(key);
    if (storedData) {
      const parsed = JSON.parse(storedData) as SessionCachePayload<T>;
      const { data, expiresAt } = parsed;
      if (expiresAt > Date.now()) {
        return data;
      } else {
        // 缓存过期，清除
        sessionStorage.removeItem(key);
      }
    }
  } catch (e) {
    debugLog.warn('从SessionStorage获取缓存失败', e);
  }
  return null;
}

/**
 * 保存数据到会话缓存，并附带过期时间。
 */
function saveToSessionStorage<T>(key: string, data: T) {
  try {
    const cacheData: SessionCachePayload<T> = {
      data,
      expiresAt: Date.now() + CACHE_EXPIRE_TIME
    };
    sessionStorage.setItem(key, JSON.stringify(cacheData));
  } catch (e) {
    debugLog.warn('保存到SessionStorage失败', e);
  }
}

// 根据环境处理图片URL
const getImageUrl = (url?: string) => {
  if (!url) return undefined;
  return url;
};

// 统一的图片错误处理函数
const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
  const img = e.currentTarget;
  
  if (img.dataset.errorHandled) {
    return;
  }
  
  img.dataset.errorHandled = 'true';
  img.src = 'https://img.uied.cn/wp-content/themes/uied/assets/images/default-thumbnail.jpg';
  
  const container = img.parentElement;
  if (container && container.classList.contains('article-image-container')) {
    container.classList.add('image-error');
  }
};

// 案例数据 - 用于样式调试
const generateMockData = (count: number): RankItem[] => {
  const mockArticles = [
    {
      id: 'mock-1',
      name: '2024年最受欢迎的UI设计趋势',
      description: '探索2024年最热门的UI设计趋势，包括新拟态、玻璃形态和动态交互设计',
      link: 'https://www.uied.cn/article/ui-trends-2024',
      thumbnail: 'https://img.uied.cn/wp-content/uploads/2024/01/ui-trends-cover.jpg',
      date: '2024-01-15',
      timeAgo: '2天前',
      isHot: true
    },
    {
      id: 'mock-2', 
      name: 'Figma插件推荐：提升设计效率的10个神器',
      description: '精选10个必备Figma插件，让你的设计工作效率翻倍',
      link: 'https://www.uied.cn/article/figma-plugins-2024',
      thumbnail: 'https://img.uied.cn/wp-content/uploads/2024/01/figma-plugins.jpg',
      date: '2024-01-14',
      timeAgo: '3天前',
      isFeatured: true
    },
    {
      id: 'mock-3',
      name: '移动端设计规范：iOS vs Android差异对比',
      description: '深度解析iOS和Android设计规范的差异，帮你做出更好的移动端设计',
      link: 'https://www.uied.cn/article/mobile-design-guidelines',
      thumbnail: 'https://img.uied.cn/wp-content/uploads/2024/01/mobile-design.jpg',
      date: '2024-01-13',
      timeAgo: '4天前',
      isNew: true
    },
    {
      id: 'mock-4',
      name: '色彩心理学在UI设计中的应用',
      description: '了解色彩对用户心理的影响，掌握色彩搭配的黄金法则',
      link: 'https://www.uied.cn/article/color-psychology-ui',
      thumbnail: 'https://img.uied.cn/wp-content/uploads/2024/01/color-psychology.jpg',
      date: '2024-01-12',
      timeAgo: '5天前'
    },
    {
      id: 'mock-5',
      name: '2024年网页设计灵感：30个优秀案例分析',
      description: '精选30个2024年优秀网页设计案例，分析设计亮点和创意思路',
      link: 'https://www.uied.cn/article/web-design-inspiration-2024',
      thumbnail: 'https://img.uied.cn/wp-content/uploads/2024/01/web-inspiration.jpg',
      date: '2024-01-11',
      timeAgo: '6天前'
    },
    {
      id: 'mock-6',
      name: 'AI设计工具大盘点：设计师的智能助手',
      description: '盘点最新AI设计工具，探索人工智能如何改变设计行业',
      link: 'https://www.uied.cn/article/ai-design-tools-2024',
      thumbnail: 'https://img.uied.cn/wp-content/uploads/2024/01/ai-design-tools.jpg',
      date: '2024-01-10',
      timeAgo: '1周前'
    },
    {
      id: 'mock-7',
      name: '用户体验设计的5个核心原则',
      description: '深入理解UX设计的基本原则，打造更好的用户体验',
      link: 'https://www.uied.cn/article/ux-design-principles',
      thumbnail: 'https://img.uied.cn/wp-content/uploads/2024/01/ux-principles.jpg',
      date: '2024-01-09',
      timeAgo: '1周前'
    },
    {
      id: 'mock-8',
      name: '设计系统构建指南：从零到一的完整流程',
      description: '学习如何构建一套完整的设计系统，提升团队协作效率',
      link: 'https://www.uied.cn/article/design-system-guide',
      thumbnail: 'https://img.uied.cn/wp-content/uploads/2024/01/design-system.jpg',
      date: '2024-01-08',
      timeAgo: '1周前'
    }
  ];
  
  return mockArticles.slice(0, count);
};

interface DesignArticleGridProps {
  title?: string;
  limit?: number;
  useMock?: boolean; // 是否使用模拟数据
  enableSubCategories?: boolean; // 是否启用子分类切换
  defaultSubCategory?: string; // 默认选中的子分类
  showMoreButton?: boolean; // 是否显示查看更多按钮
  moreButtonLink?: string; // 查看更多按钮链接
  pageSlug?: string; // 页面标识，用于获取组件配置
  position?: string; // 组件位置，用于获取组件配置
}

const DesignArticleGrid: React.FC<DesignArticleGridProps> = ({ 
  title = "设计文章",
  limit = 8, // 默认显示8个文章（超过一行，提供更丰富的内容）
  useMock = false, // 恢复使用接口数据
  enableSubCategories = false, // 默认不启用子分类切换
  defaultSubCategory = 'UI', // 默认选择UI分类
  showMoreButton = false, // 默认不显示查看更多按钮
  moreButtonLink = '/articles', // 默认查看更多按钮链接
  pageSlug, // 页面标识
  position = 'main' // 组件位置
}) => {
  // 获取 WordPress 组件配置
  const { getWidgetByPosition } = useWordPressWidgets({
    pageSlug,
    enabled: !!pageSlug
  });
  
  // 从组件配置中获取设置
  const widgetConfig = getWidgetByPosition(position);
  
  // 使用组件配置覆盖默认值
  const effectiveTitle = widgetConfig?.title || title;
  const effectiveLimit = widgetConfig?.limit || limit;
  const effectiveShowMoreLink = widgetConfig?.showMoreLink || moreButtonLink;
  const effectiveShowMoreButton = widgetConfig?.showMoreLink ? true : showMoreButton;
  
  // 调试日志 - 仅在开发环境输出
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && widgetConfig) {
      debugLog.dev('[DesignArticleGrid] 使用配置:', {
        pageSlug,
        categoryIds: widgetConfig?.categoryIds,
        tagIds: widgetConfig?.tagIds,
      });
    }
  }, [pageSlug, widgetConfig]);
  
  // 获取后台配置的所有分类（用于支持新增的分类）
  const { categories: backendCategories } = useWordPressCategories({});
  
  // 获取后台配置的所有标签（用于支持标签）
  const { tags: backendTags } = useWordPressTags({});
  
  // 根据组件配置筛选要显示的分类和标签
  const TAG_OPTIONS = useMemo(() => {
    const configuredOptions: TagOption[] = [];
    
    // 处理分类ID
    if (widgetConfig?.categoryIds && widgetConfig.categoryIds.length > 0) {
      for (const catId of widgetConfig.categoryIds) {
        // 先从默认配置中查找
        const defaultOpt = DEFAULT_TAG_OPTIONS.find(opt => opt.id === catId && opt.type === 'category');
        if (defaultOpt) {
          configuredOptions.push(defaultOpt);
          continue;
        }
        
        // 如果默认配置中没有，从后台配置中查找
        const backendCat = backendCategories.find(cat => cat.wpCategoryId === catId);
        if (backendCat) {
          configuredOptions.push({
            key: backendCat.slug || `cat-${catId}`,
            name: backendCat.displayName,
            type: 'category',
            id: catId,
          });
        }
      }
    }
    
    // 处理标签ID
    if (widgetConfig?.tagIds && widgetConfig.tagIds.length > 0) {
      for (const tagId of widgetConfig.tagIds) {
        // 从后台配置中查找标签
        const backendTag = backendTags.find(tag => tag.wpTagId === tagId);
        if (backendTag) {
          configuredOptions.push({
            key: backendTag.slug || `tag-${tagId}`,
            name: backendTag.displayName,
            type: 'tag',
            id: tagId,
          });
        } else {
          // 如果后台没有配置，直接使用ID创建
          configuredOptions.push({
            key: `tag-${tagId}`,
            name: `标签${tagId}`,
            type: 'tag',
            id: tagId,
          });
        }
      }
    }
    
    if (configuredOptions.length > 0) {
      debugLog.dev('[DesignArticleGrid] 使用组件配置:', configuredOptions.map(c => `${c.name}(${c.type})`));
      return configuredOptions;
    }
    
    // 否则使用所有默认分类
    return DEFAULT_TAG_OPTIONS;
  }, [widgetConfig?.categoryIds, widgetConfig?.tagIds, backendCategories, backendTags]);
  const widgetCategoryIdsKey = useMemo(
    () => (widgetConfig?.categoryIds || []).join(','),
    [widgetConfig?.categoryIds]
  );
  
  // 当前选中的子分类 - 初始为空，等待TAG_OPTIONS加载后设置
  const [activeTag, setActiveTag] = useState<string>('');
  
  // 当TAG_OPTIONS加载完成后，设置默认选中的分类
  useEffect(() => {
    if (TAG_OPTIONS.length > 0 && !activeTag) {
      // 尝试找到匹配defaultSubCategory的选项
      const matchingOption = TAG_OPTIONS.find(opt => 
        opt.name === defaultSubCategory || 
        opt.key === defaultSubCategory ||
        opt.name.includes(defaultSubCategory)
      );
      const defaultKey = matchingOption?.key || TAG_OPTIONS[0].key;
      debugLog.dev('[DesignArticleGrid] 设置默认分类:', defaultKey, 'TAG_OPTIONS:', TAG_OPTIONS.map(t => t.key));
      setActiveTag(defaultKey);
    }
  }, [TAG_OPTIONS, activeTag, defaultSubCategory]);
  
  // 状态管理
  const [articles, setArticles] = useState<RankItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  
  // 使用useRef跟踪加载状态，避免重复请求
  const isLoadingRef = useRef(false);
  
  // 使用useRef存储组件是否已挂载 - 每次渲染时重置为true
  const isMountedRef = useRef(true);
  
  // 组件挂载时重置isMountedRef
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  
  // 获取当前选中项的ID和类型
  const getCurrentOption = useCallback(() => {
    // 如果activeTag为空，使用第一个选项
    if (!activeTag && TAG_OPTIONS.length > 0) {
      return TAG_OPTIONS[0];
    }
    const activeOption = TAG_OPTIONS.find(option => option.key === activeTag);
    return activeOption || TAG_OPTIONS[0] || { id: 334, type: 'category' as const, key: 'UI', name: 'UI' };
  }, [activeTag, TAG_OPTIONS]);

  // 获取文章数据
  const fetchArticles = useCallback(async (forceRefresh = false) => {
    // 如果已经在加载中，则跳过
    if (isLoadingRef.current) {
      debugLog.dev('DesignArticleGrid: 已在加载中，跳过重复请求');
      return;
    }
    
    const currentOption = getCurrentOption();
    const fetchLimit = effectiveLimit;
    debugLog.dev('DesignArticleGrid: 开始获取文章，类型:', currentOption.type, 'ID:', currentOption.id, '当前标签:', activeTag, '强制刷新:', forceRefresh, '数量限制:', fetchLimit);
    
    // 创建缓存键 - 包含类型信息
    const cacheKey = `design-articles-${currentOption.type}-${currentOption.id}-${fetchLimit}`;
    
    // 如果不是强制刷新，首先尝试从sessionStorage获取缓存
    if (!forceRefresh) {
      const cachedData = getFromSessionStorage<RankItem[]>(cacheKey);
      if (cachedData) {
        debugLog.dev('DesignArticleGrid: 使用缓存数据:', cachedData.length, '条');
        if (isMountedRef.current) {
          setArticles(cachedData);
          setIsLoading(false);
          setError(null);
        }
        return;
      }
    }
    
    // 设置加载标志
    if (isMountedRef.current) {
      setIsLoading(true);
      setError(null);
    }
    isLoadingRef.current = true;
    
    try {
      debugLog.dev('DesignArticleGrid: 调用API获取数据，参数:', {
        type: currentOption.type,
        id: currentOption.id,
        page: 1,
        perPage: fetchLimit,
        orderBy: 'date',
        order: 'desc',
        useMock
      });
      
      let response;
      
      // 如果使用模拟数据，直接返回案例数据
      if (useMock) {
        debugLog.dev('DesignArticleGrid: 使用案例数据进行样式调试');
        response = generateMockData(fetchLimit);
      } else {
        // 根据类型调用不同的API
        if (currentOption.type === 'tag') {
          // 使用标签API
          response = await wordPressApi.getTagPosts({
            tagId: currentOption.id,
            page: 1,
            perPage: fetchLimit,
            orderBy: 'date',
            order: 'desc'
          });
        } else {
          // 使用分类API
          response = await wordPressApi.getCategoryPosts({
            categoryId: currentOption.id,
            page: 1,
            perPage: fetchLimit,
            orderBy: 'date',
            order: 'desc',
            useMock: false
          });
        }
      }
      
      debugLog.dev('DesignArticleGrid: 返回数据:', response);
      
      // 组件可能已卸载，检查挂载状态
      if (!isMountedRef.current) {
        debugLog.dev('DesignArticleGrid: 组件已卸载，停止处理');
        return;
      }
      
      if (Array.isArray(response) && response.length > 0) {
        debugLog.dev('DesignArticleGrid: 成功获取', response.length, '条文章');
        // 保存到sessionStorage
        saveToSessionStorage(cacheKey, response);
        
        // 更新状态
        setArticles(response);
        setError(null);
        setRetryCount(0);
      } else {
        debugLog.warn('DesignArticleGrid: 未找到文章数据或数据格式错误');
        setArticles([]);
        setError('暂无该分类的文章数据');
      }
    } catch (err) {
      debugLog.error('DesignArticleGrid: 获取设计文章失败:', err);
      
      // 组件可能已卸载，检查挂载状态
      if (!isMountedRef.current) return;
      
      // 尝试从sessionStorage获取任何类别的缓存数据作为后备
      let foundFallback = false;
      for (const option of TAG_OPTIONS) {
        const fallbackCacheKey = `design-articles-${option.type}-${option.id}-${fetchLimit}`;
        const fallbackData = getFromSessionStorage<RankItem[]>(fallbackCacheKey);
        if (fallbackData && fallbackData.length > 0) {
          debugLog.dev('DesignArticleGrid: 使用后备缓存数据:', option.name);
          setArticles(fallbackData);
          setError('获取最新数据失败，显示缓存数据');
          foundFallback = true;
          break;
        }
      }
      
      // 如果仍然没有数据，显示错误
      if (!foundFallback) {
        debugLog.dev('DesignArticleGrid: 无可用数据');
        setArticles([]);
        setError('暂时无法连接到服务器');
      }
      
      setRetryCount(prev => prev + 1);
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
      isLoadingRef.current = false;
    }
  }, [effectiveLimit, useMock, getCurrentOption, activeTag, TAG_OPTIONS]);

  // 处理子分类切换
  const handleTagChange = useCallback((tagKey: string) => {
    // 如果是当前选中的标签，忽略
    if (tagKey === activeTag) {
      return;
    }
    
    // 如果正在加载中，忽略请求
    if (isLoadingRef.current) {
      debugLog.dev('DesignArticleGrid: 正在加载中，忽略切换请求');
      return;
    }
    
    debugLog.dev('DesignArticleGrid: 切换分类', tagKey);
    
    // 先检查缓存是否存在，如果有缓存就不显示loading
    const targetOption = TAG_OPTIONS.find(opt => opt.key === tagKey);
    if (targetOption) {
      const cacheKey = `design-articles-${targetOption.type}-${targetOption.id}-${effectiveLimit}`;
      const cachedData = getFromSessionStorage<RankItem[]>(cacheKey);
      if (cachedData) {
        // 有缓存，直接切换，不显示loading
        setActiveTag(tagKey);
        setArticles(cachedData);
        setError(null);
        setIsLoading(false);
        return;
      }
    }
    
    // 没有缓存，显示loading并请求数据
    setActiveTag(tagKey);
    setError(null);
    setIsLoading(true);
    isLoadingRef.current = false;
    
    // 立即获取数据
    setTimeout(() => {
      if (isMountedRef.current) {
        fetchArticles(false);
      }
    }, 0);
  }, [fetchArticles, activeTag, TAG_OPTIONS, effectiveLimit]);

  // 重试加载数据
  const handleRetry = useCallback(() => {
    if (isLoadingRef.current) return;
    setRetryCount(0);
    fetchArticles(true); // 强制刷新
  }, [fetchArticles]);

  // 组件挂载时获取数据 - 等待activeTag设置后再获取
  useEffect(() => {
    if (activeTag) {
      debugLog.dev('DesignArticleGrid: activeTag已设置，获取初始数据', activeTag);
      fetchArticles();
    }
  }, [activeTag, fetchArticles]);

  // 当组件配置变化时，清除缓存并重新获取数据
  useEffect(() => {
    if (widgetConfig) {
      debugLog.dev('DesignArticleGrid: 组件配置变化，清除缓存并重新获取数据', widgetConfig);
      clearDesignArticlesCache();
      // 延迟获取数据，确保缓存已清除
      setTimeout(() => {
        if (isMountedRef.current) {
          fetchArticles(true);
        }
      }, 100);
    }
  }, [widgetConfig, widgetConfig?.id, widgetCategoryIdsKey, widgetConfig?.limit, fetchArticles]);

  // 渲染文章卡片 - 优化鼠标移入效果
  const renderArticles = () => {
    // 橙色色阶，前三名使用不同颜色，后面统一灰色
    const rankColors = [
      '#FF6B00', // 第1名 - 深橙色
      '#FF7E1F', // 第2名 - 中橙色
      '#FF913E', // 第3名 - 浅橙色
      '#9E9E9E', // 第4名及以后 - 灰色
      '#9E9E9E', // 第5名及以后 - 灰色
      '#9E9E9E', // 第6名及以后 - 灰色
      '#9E9E9E', // 第7名及以后 - 灰色
      '#9E9E9E'  // 第8名及以后 - 灰色
    ];
    
    return articles.slice(0, effectiveLimit).map((article, index) => (
      <motion.div 
        key={article.id} 
        className="article-card" 
        onClick={() => window.open(article.link, '_blank', 'noopener,noreferrer')}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ 
          duration: 0.3,
          delay: index * 0.05, // 减少延迟时间
          ease: "easeOut"
        }}
        style={{ cursor: "pointer" }}
      >
        <div className="article-image-container">
          {article.thumbnail ? (
            <motion.img
              alt={article.name || '文章图片'}
              src={article.thumbnail ? getImageUrl(article.thumbnail) : undefined}
              className="article-image"
              onError={handleImageError}
              loading="lazy"
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: index * 0.02 }}
            />
          ) : (
            <div className="article-image-placeholder"></div>
          )}
        </div>
        <div className="article-content">
          <h3 className="article-title" title={article.name}>
            <motion.span 
              className="article-rank"
              style={{ 
                backgroundColor: index < rankColors.length ? rankColors[index] : '#9E9E9E'
              }}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ 
                duration: 0.25,
                delay: index * 0.05 + 0.1,
                type: "spring",
                stiffness: 200
              }}
            >
              No.{index + 1}
            </motion.span>
            <span className="article-title-text">{article.name}</span>
          </h3>
        </div>
      </motion.div>
    ));
  };

  // 骨架屏加载中
  const renderSkeleton = () => {
    return Array(effectiveLimit).fill(null).map((_, index) => (
      <motion.div 
        key={`skeleton-${index}`} 
        className="article-card skeleton"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ 
          duration: 0.3,
          delay: index * 0.05,
          ease: "easeOut"
        }}
      >
        <div className="skeleton-image"></div>
        <div className="skeleton-content">
          <div className="skeleton-title"></div>
        </div>
      </motion.div>
    ));
  };

  return (
    <div className="design-article-grid-container">
      <motion.div 
        className="section-header"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        <motion.div 
          className="section-title"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <span>{effectiveTitle}</span>
        </motion.div>
        {/* 查看更多按钮 */}
        {effectiveShowMoreButton && (
          <motion.a 
            href={effectiveShowMoreLink} 
            className="view-more-btn desktop-only" 
            target="_blank" 
            rel="noopener noreferrer"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            // 移除鼠标悬停动效
          >
            查看更多 {'>'}
          </motion.a>
        )}
      </motion.div>
      
      {/* 子分类切换标签 - 只有在启用时才显示 */}
      {enableSubCategories && (
        <motion.div 
          className="article-subcategories"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <div className="subcategory-tabs">
            {TAG_OPTIONS.map((tag, index) => (
              <motion.button
                key={tag.key}
                className={`subcategory-tab ${activeTag === tag.key ? 'active' : ''} ${isLoadingRef.current ? 'disabled' : ''}`}
                onClick={() => handleTagChange(tag.key)}
                title={tag.description}
                disabled={isLoadingRef.current} // 加载中时禁用切换
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ 
                  duration: 0.3, 
                  delay: 0.4 + index * 0.03,
                  ease: "easeOut"
                }}
                // 移除鼠标悬停动效
              >
                <span className="tab-name">{tag.name}</span>
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}
      
      {error && !isLoading ? (
        <div className="empty-container">
          <div className="empty-content">
            <p>{error}</p>
            {retryCount < 5 && (
              <button 
                className="retry-button" 
                onClick={handleRetry}
                disabled={isLoadingRef.current}
              >
                重试
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="article-grid">
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div
                key="skeleton"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="skeleton-grid"
              >
                {renderSkeleton()}
              </motion.div>
            ) : (
              <motion.div
                key={`articles-${activeTag}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="articles-grid"
              >
                {renderArticles()}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
      
      {/* 移动端底部的查看更多按钮 */}
      {effectiveShowMoreButton && (
        <div className="mobile-view-more">
          <a href={effectiveShowMoreLink} className="mobile-view-more-btn" target="_blank" rel="noopener noreferrer">
            查看更多 {'>'}
          </a>
        </div>
      )}
    </div>
  );
};

export default DesignArticleGrid;
