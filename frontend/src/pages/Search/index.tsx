/**
 * @file Search/index.tsx
 * @description 全站搜索页面 - 支持AI智能搜索、搜索历史、筛选、分页
 * @version 4.2.0
 * @copyright Tomda (https://www.tomda.top)
 * @copyright UIED技术团队 (https://fsuied.com)
 * @author UIED技术团队
 * @createDate 2026.03.02
 */

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import HeroBanner from '../../components/HeroBanner';
import ToolCard from '../../components/ToolCard';
import AISearchSidebar from '../../components/AISearchSidebar';
import api from '../../services/api';
import searchService from '../../services/searchService';
import { useFrontendConfig } from '../../hooks/useFrontendConfig';
import { usePermalinkConfig, generateWebsiteUrl } from '../../hooks/usePermalinkConfig';
import { getArrowConfigByWebsiteClickMode } from '../../utils/clickMode';
import { unwrapApiResponse } from '../../utils/apiResponse';
import { debugLog } from '../../utils/debugHelper';
import './index.css';

const bgImage = '/bg.jpg';
const SEARCH_HISTORY_KEY = 'search_history';
const MAX_HISTORY = 10;
const PAGE_SIZE = 24;
const HOT_SEARCH_TAGS = ['AI绘画', 'ChatGPT', 'Figma', '免费工具', 'UI设计', 'Midjourney', '字体', '图标库', 'SVG'];

// 搜索结果接口
interface SearchResult {
  id: string;
  name: string;
  description: string;
  url: string;
  slug?: string;
  iconUrl?: string;
  category?: string;
  tags: string[];
  isNew?: boolean;
  isHot?: boolean;
  isFeatured?: boolean;
  source?: string;
  isAiResult?: boolean;
}

interface BackendSearchItem {
  id?: string | number;
  name?: string;
  description?: string;
  url?: string;
  slug?: string;
  iconUrl?: string;
  category?: { name?: string } | string;
  tags?: string[] | string;
  isNew?: boolean;
  isHot?: boolean;
  isFeatured?: boolean;
}

/**
 * 规范化文本，统一用于搜索相关性计算与去重键生成。
 */
const normalizeText = (value: unknown): string => String(value || '').trim().toLowerCase();

/**
 * 构建搜索结果去重键，优先使用 URL，其次 ID/名称。
 */
const buildResultUniqueKey = (item: SearchResult): string => {
  const normalizedUrl = normalizeText(item.url).replace(/\/+$/g, '');
  if (normalizedUrl) return `url:${normalizedUrl}`;
  const normalizedId = normalizeText(item.id);
  if (normalizedId) return `id:${normalizedId}`;
  return `name:${normalizeText(item.name)}`;
};

/**
 * 计算搜索项与查询词的相关性分数，分值越高代表越相关。
 */
const calculateRelevanceScore = (item: SearchResult, query: string): number => {
  const q = normalizeText(query);
  if (!q) return 0;

  const name = normalizeText(item.name);
  const description = normalizeText(item.description);
  const category = normalizeText(item.category || '');
  const url = normalizeText(item.url);
  const tags = Array.isArray(item.tags) ? item.tags.map(tag => normalizeText(tag)) : [];

  let score = 0;

  if (name === q) score += 900;
  else if (name.startsWith(q)) score += 620;
  else if (name.includes(q)) score += 380;

  if (tags.some(tag => tag === q)) score += 300;
  else if (tags.some(tag => tag.startsWith(q))) score += 220;
  else if (tags.some(tag => tag.includes(q))) score += 140;

  if (category === q) score += 200;
  else if (category.includes(q)) score += 120;

  if (description.includes(q)) score += 110;
  if (url.includes(q)) score += 80;

  if (item.isFeatured) score += 40;
  if (item.isHot) score += 24;
  if (item.isNew) score += 16;

  if (item.source === 'ai') score += 12;

  return score;
};

/**
 * 对结果集执行去重并按相关性排序，保证普通搜索与 AI 增强结果顺序稳定。
 */
const dedupeAndSortResults = (results: SearchResult[], query: string): SearchResult[] => {
  const uniqueMap = new Map<string, SearchResult>();
  results.forEach((item) => {
    const uniqueKey = buildResultUniqueKey(item);
    if (!uniqueMap.has(uniqueKey)) {
      uniqueMap.set(uniqueKey, item);
      return;
    }

    const current = uniqueMap.get(uniqueKey) as SearchResult;
    const currentScore = calculateRelevanceScore(current, query);
    const incomingScore = calculateRelevanceScore(item, query);
    if (incomingScore > currentScore) {
      uniqueMap.set(uniqueKey, item);
    }
  });

  return Array.from(uniqueMap.values()).sort((a, b) => {
    const scoreDiff = calculateRelevanceScore(b, query) - calculateRelevanceScore(a, query);
    if (scoreDiff !== 0) return scoreDiff;
    const hotDiff = Number(Boolean(b.isHot)) - Number(Boolean(a.isHot));
    if (hotDiff !== 0) return hotDiff;
    const featuredDiff = Number(Boolean(b.isFeatured)) - Number(Boolean(a.isFeatured));
    if (featuredDiff !== 0) return featuredDiff;
    return String(a.name || '').localeCompare(String(b.name || ''), 'zh-Hans-CN');
  });
};

/**
 * 统一解析后端标签字段，兼容 string / string[] 两种结构。
 */
const normalizeTags = (tags: BackendSearchItem['tags']): string[] => {
  if (Array.isArray(tags)) return tags.filter(Boolean);
  if (typeof tags === 'string') {
    return tags
      .split(',')
      .map(tag => tag.trim())
      .filter(Boolean);
  }
  return [];
};

/**
 * 将后端搜索结果转换为前端统一结构。
 */
const mapBackendSearchItem = (
  item: BackendSearchItem,
  source: string,
  isAiResult: boolean = false
): SearchResult => {
  const normalizedId = item.id !== undefined && item.id !== null ? String(item.id) : '';
  const categoryName = typeof item.category === 'string'
    ? item.category
    : item.category?.name || '';

  return {
    id: normalizedId,
    name: item.name || '',
    description: item.description || '',
    url: item.url || '',
    slug: item.slug,
    iconUrl: item.iconUrl,
    category: categoryName,
    tags: normalizeTags(item.tags),
    isNew: Boolean(item.isNew),
    isHot: Boolean(item.isHot),
    isFeatured: Boolean(item.isFeatured),
    source,
    isAiResult,
  };
};

/**
 * 标准化每页数量，避免后台配置异常导致前端分页异常
 */
const normalizeResultPageSize = (value: unknown): number => {
  const parsed = Number.parseInt(String(value ?? ''), 10);
  if (!Number.isInteger(parsed)) return PAGE_SIZE;
  return Math.max(10, Math.min(100, parsed));
};

/**
 * 标准化搜索建议防抖时长，保障配置值在合理范围内。
 */
const normalizeDebounceDelay = (value: unknown): number => {
  const parsed = Number.parseInt(String(value ?? ''), 10);
  if (!Number.isInteger(parsed)) return 300;
  return Math.max(100, Math.min(2000, parsed));
};

/**
 * 提取接口错误文案，避免搜索失败时页面无感知。
 */
const extractApiErrorMessage = (error: unknown): string => {
  const responseData = (error as any)?.response?.data;
  const message = responseData?.message || responseData?.error || (error as any)?.message;
  const normalized = String(message || '').trim();
  return normalized || '搜索接口请求失败，请稍后重试';
};

// AI 思考步骤
const AI_THINKING_STEPS = [
  { text: '理解搜索意图', icon: '🧠', color: '#6366F1' },
  { text: '分析关键词语义', icon: '📝', color: '#8B5CF6' },
  { text: '匹配相关资源', icon: '🔍', color: '#A855F7' },
  { text: '智能排序结果', icon: '⚡', color: '#D946EF' },
  { text: '生成推荐', icon: '✨', color: '#EC4899' }
];

// Framer Motion 动画配置
const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number],
      staggerChildren: 0.12
    }
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: { duration: 0.25 }
  }
};

const stepVariants = {
  hidden: { opacity: 0, x: -20, scale: 0.95 },
  visible: { 
    opacity: 1, 
    x: 0, 
    scale: 1,
    transition: { duration: 0.3, ease: 'easeOut' as const }
  }
};

const pulseVariants = {
  pulse: {
    scale: [1, 1.05, 1],
    opacity: [0.7, 1, 0.7],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'easeInOut' as const
    }
  }
};

const spinnerVariants = {
  spin: {
    rotate: 360,
    transition: {
      duration: 1,
      repeat: Infinity,
      ease: 'linear' as const
    }
  }
};

const progressVariants = {
  initial: { width: 0 },
  animate: (progress: number) => ({
    width: `${progress}%`,
    transition: { duration: 0.5, ease: 'easeOut' as const }
  })
};

// AI 思考动画组件
const AIThinkingAnimation: React.FC<{ currentStep: number }> = ({ currentStep }) => {
  const progress = ((currentStep + 1) / AI_THINKING_STEPS.length) * 100;
  
  return (
    <motion.div
      className="ai-thinking-container-v2"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      {/* 头部 */}
      <motion.div className="ai-thinking-header-v2">
        <motion.div 
          className="ai-brain-icon"
          variants={pulseVariants}
          animate="pulse"
        >
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" fill="url(#brain-gradient)" fillOpacity="0.15"/>
            <path d="M12 6v6l4 2" stroke="url(#brain-gradient)" strokeWidth="2" strokeLinecap="round"/>
            <defs>
              <linearGradient id="brain-gradient" x1="2" y1="2" x2="22" y2="22">
                <stop stopColor="#6366F1"/>
                <stop offset="1" stopColor="#EC4899"/>
              </linearGradient>
            </defs>
          </svg>
        </motion.div>
        <div className="ai-thinking-title-v2">
          <span className="title-text">AI 正在思考</span>
          <motion.span 
            className="thinking-dots"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.2, repeat: Infinity }}
          >
            ...
          </motion.span>
        </div>
      </motion.div>

      {/* 步骤列表 */}
      <div className="ai-thinking-steps-v2">
        {AI_THINKING_STEPS.map((step, index) => {
          const isActive = index === currentStep;
          const isDone = index < currentStep;
          
          return (
            <motion.div
              key={index}
              className={`ai-step-v2 ${isActive ? 'active' : ''} ${isDone ? 'done' : ''}`}
              variants={stepVariants}
              style={{ 
                '--step-color': step.color,
                borderColor: isActive ? step.color : 'transparent'
              } as React.CSSProperties}
            >
              <motion.div 
                className="step-icon-wrapper"
                animate={isActive ? { scale: [1, 1.1, 1] } : {}}
                transition={{ duration: 0.6, repeat: isActive ? Infinity : 0 }}
              >
                <span className="step-emoji">{step.icon}</span>
              </motion.div>
              
              <span className="step-label">{step.text}</span>
              
              <div className="step-status">
                {isActive && (
                  <motion.div 
                    className="step-spinner"
                    variants={spinnerVariants}
                    animate="spin"
                  >
                    <svg viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeOpacity="0.2"/>
                      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </motion.div>
                )}
                {isDone && (
                  <motion.div 
                    className="step-check"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                  >
                    <svg viewBox="0 0 24 24" fill="none">
                      <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </motion.div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* 进度条 */}
      <div className="ai-progress-wrapper">
        <div className="ai-progress-track">
          <motion.div 
            className="ai-progress-fill"
            variants={progressVariants}
            initial="initial"
            animate="animate"
            custom={progress}
          />
        </div>
        <span className="ai-progress-text">{Math.round(progress)}%</span>
      </div>

      {/* 底部提示 */}
      <motion.p 
        className="ai-thinking-hint"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.7 }}
        transition={{ delay: 0.5 }}
      >
        正在从 {'>'}2000 个资源中智能匹配...
      </motion.p>
    </motion.div>
  );
};

const SearchPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [allResults, setAllResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchErrorMessage, setSearchErrorMessage] = useState('');
  const [totalResults, setTotalResults] = useState(0);
  const [totalWebsites, setTotalWebsites] = useState(0);
  
  // 分页状态
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  
  // 筛选状态
  const [sourceFilter, setSourceFilter] = useState('all');
  
  // AI 搜索状态
  const [isAiMode, setIsAiMode] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiMessage, setAiMessage] = useState('');
  const [aiThinkingStep, setAiThinkingStep] = useState(0);
  const [showThinking, setShowThinking] = useState(false);
  
  // 搜索历史
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  
  // 搜索建议
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  /**
   * 搜索建议防抖定时器引用，避免频繁触发后端接口。
   */
  const suggestionDebounceTimerRef = useRef<number | null>(null);
  
  // 相关搜索
  const [relatedKeywords, setRelatedKeywords] = useState<string[]>([]);
  const [hotSearchTags, setHotSearchTags] = useState<string[]>(HOT_SEARCH_TAGS);
  const [aiEnhancing, setAiEnhancing] = useState(false);
  const [aiEnhancedCount, setAiEnhancedCount] = useState(0);
  /**
   * 搜索请求序列号，避免异步返回乱序覆盖当前结果。
   */
  const searchRequestSeqRef = useRef(0);
  
  // 获取前端配置（跳转弹窗自定义文案）
  const { config: frontendConfig } = useFrontendConfig();
  const { config: permalinkConfig } = usePermalinkConfig();
  const showDirectArrow = frontendConfig?.pageGlobalConfig?.showDirectArrow ?? false;
  const websiteClickMode = frontendConfig?.pageGlobalConfig?.websiteClickMode ?? 'detail';
  const directArrowNewWindow = frontendConfig?.pageGlobalConfig?.directArrowNewWindow ?? true;
  const detailPageNewWindow = frontendConfig?.pageGlobalConfig?.detailPageNewWindow ?? false;
  const searchConfig = frontendConfig?.searchConfig;
  const searchEnabled = searchConfig?.enabled !== false;
  const aiSearchEnabled = searchEnabled && searchConfig?.aiSearchEnabled !== false;
  const resultPageSize = normalizeResultPageSize(searchConfig?.resultsPerPage);
  const suggestionDebounceDelay = normalizeDebounceDelay(searchConfig?.debounceDelay);
  const searchInputPlaceholder = String(searchConfig?.placeholder || '').trim() || '搜索网站名称、描述、标签...';
  const aiSearchButtonText = String(searchConfig?.aiSearchBtnText || 'AI 搜索').trim() || 'AI 搜索';
  const { isDirectMode, arrowLabel, arrowIsExternal } = getArrowConfigByWebsiteClickMode(websiteClickMode);

  // 直达箭头点击回调
  const handleDirectVisit = useCallback((tool: SearchResult, _event: React.MouseEvent) => {
    if (isDirectMode) {
      const detailUrl = generateWebsiteUrl(permalinkConfig, { id: tool?.id, slug: tool?.slug });
      if (detailPageNewWindow) {
        window.open(detailUrl, '_blank');
      } else {
        navigate(detailUrl);
      }
      return;
    }
    const url = tool?.url;
    if (url) {
      if (directArrowNewWindow) {
        window.open(url, '_blank', 'noopener,noreferrer');
      } else {
        window.location.href = url;
      }
    }
  }, [isDirectMode, permalinkConfig, detailPageNewWindow, navigate, directArrowNewWindow]);
  
  // AI 侧边栏状态
  const [showAiSidebar, setShowAiSidebar] = useState(false);

  // AI 思考动画
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (aiLoading && showThinking) {
      interval = setInterval(() => {
        setAiThinkingStep(prev => (prev + 1) % AI_THINKING_STEPS.length);
      }, 800);
    }
    return () => clearInterval(interval);
  }, [aiLoading, showThinking]);

  // 加载搜索历史
  useEffect(() => {
    const history = localStorage.getItem(SEARCH_HISTORY_KEY);
    if (history) {
      try {
        setSearchHistory(JSON.parse(history));
      } catch (e) {
        debugLog.error('加载搜索历史失败', e);
      }
    }
  }, []);

  // 保存搜索历史
  const saveSearchHistory = useCallback((query: string) => {
    if (!query.trim()) return;
    
    setSearchHistory(prev => {
      const newHistory = [query, ...prev.filter(h => h !== query)].slice(0, MAX_HISTORY);
      localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(newHistory));
      return newHistory;
    });
  }, []);

  // 清除搜索历史
  const clearSearchHistory = useCallback(() => {
    setSearchHistory([]);
    localStorage.removeItem(SEARCH_HISTORY_KEY);
  }, []);

  // 获取总网站数量
  const fetchTotalCount = useCallback(async () => {
    try {
      const response = await api.get('/websites', { params: { pageSize: 1 } });
      const data = unwrapApiResponse<{ pagination?: { total?: number } }>(response.data, {});
      if (data.pagination?.total) {
        setTotalWebsites(data.pagination.total);
      }
    } catch (error) {
      debugLog.error('获取网站总数失败:', error);
    }
  }, []);

  // 获取搜索建议
  const fetchSuggestions = useCallback(async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setSuggestions([]);
      return;
    }

    if (!searchEnabled) {
      const localSuggestions = [ ...hotSearchTags, ...searchHistory ]
        .filter(item => item.toLowerCase().includes(query.toLowerCase()))
        .filter(item => item !== query)
        .slice(0, 8);
      setSuggestions(localSuggestions);
      return;
    }

    try {
      const response = await searchService.getSuggestions(query);
      const websiteSuggestions = Array.isArray(response?.websites)
        ? response.websites.map((item: any) => String(item?.name || '').trim()).filter(Boolean)
        : [];
      const categorySuggestions = Array.isArray(response?.categories)
        ? response.categories.map((item: any) => String(item?.name || '').trim()).filter(Boolean)
        : [];
      const localSuggestions = [ ...hotSearchTags, ...searchHistory ]
        .filter(item => item.toLowerCase().includes(query.toLowerCase()));
      const merged = Array.from(new Set([ ...websiteSuggestions, ...categorySuggestions, ...localSuggestions ]))
        .filter(item => item !== query)
        .slice(0, 8);
      setSuggestions(merged);
    } catch (error) {
      debugLog.error('获取搜索建议失败:', error);
      const localSuggestions = [ ...hotSearchTags, ...searchHistory ]
        .filter(item => item.toLowerCase().includes(query.toLowerCase()))
        .slice(0, 5);
      setSuggestions(localSuggestions);
    }
  }, [hotSearchTags, searchEnabled, searchHistory]);

  /**
   * 基于当前搜索结果提取“相关搜索”关键词，并按出现频次与结果排名加权。
   */
  const generateRelatedKeywords = useCallback((results: SearchResult[], query: string) => {
    const normalizedQuery = normalizeText(query);
    const scoreMap = new Map<string, number>();

    /**
     * 写入候选关键词并累计分值。
     */
    const pushKeyword = (rawKeyword: unknown, score: number) => {
      const keyword = String(rawKeyword || '').trim();
      const lowerKeyword = normalizeText(keyword);
      if (!keyword || keyword.length < 2) return;
      if (lowerKeyword === normalizedQuery) return;
      if (lowerKeyword.includes(normalizedQuery) || normalizedQuery.includes(lowerKeyword)) return;
      scoreMap.set(keyword, Number(scoreMap.get(keyword) || 0) + score);
    };

    results.slice(0, 80).forEach((item, index) => {
      const rankWeight = Math.max(1, 16 - index);
      (item.tags || []).forEach(tag => pushKeyword(tag, rankWeight + 4));
      pushKeyword(item.category, rankWeight + 2);

      const titleTokens = String(item.name || '')
        .split(/[、，,\s/|]+/)
        .map(token => token.trim())
        .filter(token => token.length >= 2 && token.length <= 12);
      titleTokens.slice(0, 3).forEach(token => pushKeyword(token, rankWeight));
    });

    const sortedKeywords = Array.from(scoreMap.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([ keyword ]) => keyword)
      .slice(0, 10);
    setRelatedKeywords(sortedKeywords);
  }, []);

  /**
   * 并行执行 AI 增强搜索，并把新增结果合并到当前普通搜索结果中。
   */
  const runAiEnhancement = useCallback(async (query: string, baseResults: SearchResult[], requestSeq: number) => {
    if (!aiSearchEnabled) return;

    setAiEnhancing(true);
    setAiEnhancedCount(0);

    try {
      const payload = await searchService.aiSearch(query, Math.max(resultPageSize * 2, 40));
      if (requestSeq !== searchRequestSeqRef.current) return;

      const aiRawResults = Array.isArray(payload?.results) ? payload.results : [];
      const aiMappedResults = aiRawResults.map(item => mapBackendSearchItem(item, 'ai', true));
      const merged = dedupeAndSortResults([ ...baseResults, ...aiMappedResults ], query);
      const increasedCount = Math.max(0, merged.length - baseResults.length);

      setAllResults(merged);
      setSearchResults(merged.slice(0, resultPageSize));
      setTotalResults(merged.length);
      setHasMore(merged.length > resultPageSize);
      setAiEnhancedCount(increasedCount);
      generateRelatedKeywords(merged, query);
    } catch (error) {
      debugLog.warn('AI 增强搜索失败，保留普通搜索结果:', error);
      if (requestSeq !== searchRequestSeqRef.current) return;
      setAiEnhancedCount(0);
    } finally {
      if (requestSeq === searchRequestSeqRef.current) {
        setAiEnhancing(false);
      }
    }
  }, [aiSearchEnabled, generateRelatedKeywords, resultPageSize]);

  // 默认搜索
  const performDefaultSearch = useCallback(async () => {
    searchRequestSeqRef.current += 1;
    if (!searchEnabled) {
      setIsAiMode(false);
      setAllResults([]);
      setSearchResults([]);
      setTotalResults(0);
      setHasMore(false);
      setCurrentPage(1);
      setRelatedKeywords([]);
      setAiMessage('站内搜索功能已关闭');
      setSearchErrorMessage('');
      setAiEnhancing(false);
      setAiEnhancedCount(0);
      return;
    }

    setLoading(true);
    setIsAiMode(false);
    setSearchErrorMessage('');
    setAiEnhancing(false);
    setAiEnhancedCount(0);

    try {
      /**
       * 默认态展示热门站点，避免空搜索页无内容
       */
      const response = await api.get('/websites/hot/list', {
        params: { limit: Math.max(resultPageSize * 2, 24) },
      });
      const raw = unwrapApiResponse<BackendSearchItem[] | { websites?: BackendSearchItem[] }>(response.data, []);
      const list = Array.isArray(raw) ? raw : (raw?.websites || []);
      const mapped = (Array.isArray(list) ? list : []).map(item => mapBackendSearchItem(item, 'hot'));
      const uniqueResults = dedupeAndSortResults(mapped, '');

      setAllResults(uniqueResults);
      setSearchResults(uniqueResults.slice(0, resultPageSize));
      setTotalResults(uniqueResults.length);
      setHasMore(uniqueResults.length > resultPageSize);
      setCurrentPage(1);
      setRelatedKeywords([]);
      setAiMessage('');
      setSearchErrorMessage('');
    } catch (error) {
      setAllResults([]);
      setSearchResults([]);
      setTotalResults(0);
      setHasMore(false);
      setSearchErrorMessage(extractApiErrorMessage(error));
      setAiEnhancing(false);
      setAiEnhancedCount(0);
    } finally {
      setLoading(false);
    }
  }, [resultPageSize, searchEnabled]);

  /**
   * 执行普通搜索（统一走后端 /api/search 契约）
   */
  const performSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      performDefaultSearch();
      return;
    }

    if (!searchEnabled) {
      setIsAiMode(false);
      setAllResults([]);
      setSearchResults([]);
      setTotalResults(0);
      setHasMore(false);
      setCurrentPage(1);
      setAiMessage('站内搜索功能已关闭');
      setAiEnhancing(false);
      setAiEnhancedCount(0);
      return;
    }

    const requestSeq = searchRequestSeqRef.current + 1;
    searchRequestSeqRef.current = requestSeq;
    setLoading(true);
    setIsAiMode(false);
    setSearchErrorMessage('');
    setAiEnhancing(false);
    setAiEnhancedCount(0);
    saveSearchHistory(query);

    try {
      const payload = await searchService.globalSearch({
        keyword: query,
        page: 1,
        pageSize: Math.max(resultPageSize * 4, 80),
        type: 'all',
      });
      const list = Array.isArray(payload?.lists) ? payload.lists : [];
      const mapped = list.map(item => mapBackendSearchItem(item, String(item?.source || 'global')));
      const uniqueResults = dedupeAndSortResults(mapped, query);

      if (requestSeq !== searchRequestSeqRef.current) return;

      setAllResults(uniqueResults);
      setSearchResults(uniqueResults.slice(0, resultPageSize));
      setTotalResults(uniqueResults.length);
      setHasMore(uniqueResults.length > resultPageSize);
      setCurrentPage(1);
      generateRelatedKeywords(uniqueResults, query);
      setAiMessage('');
      setSearchErrorMessage('');

      /**
       * 普通搜索完成后并行补充 AI 推荐，避免用户等待主结果。
       */
      if (query.trim() && aiSearchEnabled) {
        runAiEnhancement(query, uniqueResults, requestSeq);
      }
    } catch (error) {
      debugLog.error('普通搜索失败:', error);
      if (requestSeq !== searchRequestSeqRef.current) return;
      setAllResults([]);
      setSearchResults([]);
      setTotalResults(0);
      setHasMore(false);
      setAiMessage(extractApiErrorMessage(error));
      setSearchErrorMessage(extractApiErrorMessage(error));
      setAiEnhancing(false);
      setAiEnhancedCount(0);
    } finally {
      if (requestSeq === searchRequestSeqRef.current) {
        setLoading(false);
      }
    }
  }, [aiSearchEnabled, generateRelatedKeywords, performDefaultSearch, resultPageSize, runAiEnhancement, saveSearchHistory, searchEnabled]);

  /**
   * 执行 AI 搜索（统一走后端 /api/ai-search 契约）
   */
  const performAiSearch = useCallback(async (query: string) => {
    if (!query.trim()) return;

    if (!searchEnabled) {
      setIsAiMode(false);
      setAiMessage('站内搜索功能已关闭');
      setAiEnhancing(false);
      setAiEnhancedCount(0);
      return;
    }

    if (!aiSearchEnabled) {
      setIsAiMode(false);
      setAiMessage('AI 搜索功能已关闭');
      setAiEnhancing(false);
      setAiEnhancedCount(0);
      return;
    }

    const requestSeq = searchRequestSeqRef.current + 1;
    searchRequestSeqRef.current = requestSeq;
    setAiLoading(true);
    setIsAiMode(true);
    setShowThinking(true);
    setAiThinkingStep(0);
    setAiMessage('');
    setSearchErrorMessage('');
    setAiEnhancing(false);
    setAiEnhancedCount(0);
    saveSearchHistory(query);

    try {
      const payload = await searchService.aiSearch(query, Math.max(resultPageSize * 4, 80));
      if (requestSeq !== searchRequestSeqRef.current) return;
      setShowThinking(false);

      if (Array.isArray(payload.results) && payload.results.length > 0) {
        const mappedResults = payload.results.map(item => mapBackendSearchItem(item, 'ai', true));
        const results = dedupeAndSortResults(mappedResults, query);

        setAllResults(results);
        setSearchResults(results.slice(0, resultPageSize));
        setTotalResults(results.length);
        setHasMore(results.length > resultPageSize);
        setCurrentPage(1);

        // 显示 AI 的推荐理由
        const modeText = payload.mode === 'ai' ? 'AI 智能推荐' : '关键词匹配';
        const reasonText = payload.reason ? ` - ${payload.reason}` : '';
        setAiMessage(`${modeText}找到 ${results.length} 个结果${reasonText}`);
        setSearchErrorMessage('');

        generateRelatedKeywords(results, query);
      } else {
        setAllResults([]);
        setSearchResults([]);
        setTotalResults(0);
        setHasMore(false);
        setAiMessage('AI 未找到相关结果，请尝试其他描述');
        setSearchErrorMessage('');
      }
    } catch (error: unknown) {
      debugLog.error('AI 搜索失败:', error);
      if (requestSeq !== searchRequestSeqRef.current) return;
      setShowThinking(false);
      setAiMessage('AI 搜索暂时不可用，已切换到普通搜索');
      setIsAiMode(false);
      performSearch(query);
    } finally {
      if (requestSeq === searchRequestSeqRef.current) {
        setAiLoading(false);
      }
    }
  }, [aiSearchEnabled, generateRelatedKeywords, performSearch, resultPageSize, saveSearchHistory, searchEnabled]);

  // 筛选后的结果
  const filteredResults = useMemo(() => {
    if (sourceFilter === 'all') return allResults;
    return allResults.filter(r => r.source === sourceFilter);
  }, [allResults, sourceFilter]);

  /**
   * 动态计算来源筛选项，避免后端来源键变化时筛选器失效
   */
  const sourceFilterOptions = useMemo(() => {
    const entries = Array.from(
      new Set(
        allResults
          .map(item => String(item.source || '').trim())
          .filter(Boolean)
      )
    );
    const options = [ { value: 'all', label: '全部来源' } ];
    const labelMap: Record<string, string> = {
      ai: 'AI 推荐',
      global: '关键词检索',
      hot: '热门推荐',
    };
    entries.forEach((sourceKey) => {
      options.push({
        value: sourceKey,
        label: labelMap[sourceKey] || sourceKey,
      });
    });
    return options;
  }, [allResults]);

  /**
   * 当来源筛选项变化时，兜底纠正失效的筛选值
   */
  useEffect(() => {
    const valid = sourceFilterOptions.some(option => option.value === sourceFilter);
    if (!valid) {
      setSourceFilter('all');
    }
  }, [sourceFilter, sourceFilterOptions]);

  // 应用筛选和分页
  useEffect(() => {
    const start = 0;
    const end = currentPage * resultPageSize;
    setSearchResults(filteredResults.slice(start, end));
    setTotalResults(filteredResults.length);
    setHasMore(filteredResults.length > end);
  }, [currentPage, filteredResults, resultPageSize]);

  // 加载更多
  const loadMore = useCallback(() => {
    if (!hasMore || loading) return;
    setCurrentPage(prev => prev + 1);
  }, [hasMore, loading]);

  /**
   * 加载热门搜索关键词（用于搜索建议和 Hero 热门标签）
   */
  useEffect(() => {
    const run = async () => {
      if (!searchEnabled) {
        setHotSearchTags(HOT_SEARCH_TAGS);
        return;
      }
      try {
        const hotList = await searchService.getHotSearches();
        const normalized = (Array.isArray(hotList) ? hotList : [])
          .map(item => String(item || '').trim())
          .filter(Boolean);
        setHotSearchTags(normalized.length > 0 ? normalized.slice(0, 12) : HOT_SEARCH_TAGS);
      } catch (error) {
        debugLog.warn('加载热门搜索失败，回退默认标签:', error);
        setHotSearchTags(HOT_SEARCH_TAGS);
      }
    };
    run();
  }, [searchEnabled]);

  /**
   * 从 URL 解析搜索参数（支持 `?ai=1` 直达 AI 搜索）
   */
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const query = params.get('q') || '';
    const isAiQuery = params.get('ai') === '1';
    const source = params.get('source') || 'all';

    setSearchQuery(query);
    setSourceFilter(source);
    fetchTotalCount();

    if (query) {
      if (isAiQuery && aiSearchEnabled) {
        performAiSearch(query);
      } else {
        performSearch(query);
      }
    } else {
      performDefaultSearch();
    }
  }, [aiSearchEnabled, fetchTotalCount, location.search, performAiSearch, performDefaultSearch, performSearch]);

  // 处理搜索 - 使用普通关键词搜索
  const handleSearch = useCallback((value: string) => {
    const newQuery = value.trim();
    setShowSuggestions(false);
    setShowHistory(false);
    
    if (newQuery) {
      const sourceParam = sourceFilter !== 'all' ? `&source=${sourceFilter}` : '';
      const newUrl = `/search?q=${encodeURIComponent(newQuery)}${sourceParam}`;
      const currentUrl = location.pathname + location.search;
      
      if (newUrl !== currentUrl) {
        navigate(newUrl);
      } else {
        // URL 相同，直接触发普通搜索
        performSearch(newQuery);
      }
    } else {
      navigate('/search');
    }
  }, [sourceFilter, location.pathname, location.search, navigate, performSearch]);

  // 处理搜索输入变化
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setShowSuggestions(value.length >= 2);
    setShowHistory(false);

    if (suggestionDebounceTimerRef.current) {
      window.clearTimeout(suggestionDebounceTimerRef.current);
      suggestionDebounceTimerRef.current = null;
    }

    if (value.length < 2) {
      setSuggestions([]);
      return;
    }

    suggestionDebounceTimerRef.current = window.setTimeout(() => {
      fetchSuggestions(value);
    }, suggestionDebounceDelay);
  };

  /**
   * 组件卸载时清理搜索建议防抖定时器，避免内存泄漏。
   */
  useEffect(() => {
    return () => {
      if (suggestionDebounceTimerRef.current) {
        window.clearTimeout(suggestionDebounceTimerRef.current);
      }
    };
  }, []);

  // 处理热门标签点击
  const handleTagClick = (tag: string) => {
    setSearchQuery(tag);
    handleSearch(tag);
  };

  // 处理筛选变化
  const handleSourceChange = (source: string) => {
    setSourceFilter(source);
    setCurrentPage(1);
  };

  // 处理网站点击
  const handleWebsiteClick = (website: SearchResult) => {
    api.post(`/websites/${website.id}/click`).catch(() => {});
    if (isDirectMode) {
      window.open(website.url, '_blank', 'noopener,noreferrer');
      return;
    }
    const detailUrl = generateWebsiteUrl(permalinkConfig, { id: website.id, slug: website.slug });
    if (detailPageNewWindow) {
      window.open(detailUrl, '_blank');
    } else {
      navigate(detailUrl);
    }
  };

  const isLoading = loading || aiLoading;

  return (
    <div className="search-page" style={{ '--bg-image': `url(${bgImage})` } as React.CSSProperties}>
      <HeroBanner
        pageType="search"
        searchValue={searchQuery}
        onSearchChange={handleSearchChange}
        hotTags={hotSearchTags}
        onTagClick={handleTagClick}
        searchPlaceholder={searchInputPlaceholder}
        searchPageType="all"
        showStats={true}
        customTitle="全站搜索"
        customDescription={`收录 ${totalWebsites.toLocaleString()} 个优质网站资源`}
        aiSearchEnabled={aiSearchEnabled}
        aiSearchBtnText={aiSearchButtonText}
      />

      <div className="search-content">
        {/* 搜索历史下拉 */}
        {showHistory && searchHistory.length > 0 && (
          <div className="search-dropdown" ref={suggestionsRef}>
            <div className="dropdown-header">
              <span>搜索历史</span>
              <button onClick={clearSearchHistory}>清除</button>
            </div>
            {searchHistory.map((h, i) => (
              <div key={i} className="dropdown-item" onClick={() => { setSearchQuery(h); handleSearch(h); }}>
                <span className="history-icon">🕐</span>
                {h}
              </div>
            ))}
          </div>
        )}

        {/* 搜索建议下拉 */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="search-dropdown" ref={suggestionsRef}>
            <div className="dropdown-header"><span>搜索建议</span></div>
            {suggestions.map((s, i) => (
              <div key={i} className="dropdown-item" onClick={() => { setSearchQuery(s); handleSearch(s); }}>
                <span className="suggestion-icon">🔍</span>
                {s}
              </div>
            ))}
          </div>
        )}

        {/* 搜索统计和筛选 */}
        <div className="search-header">
          <div className="search-stats-info">
            {!searchEnabled ? (
              <>
                <h2>站内搜索已关闭</h2>
                <p>请在后台「站点设置 - 搜索配置」中开启后使用。</p>
              </>
            ) : searchQuery ? (
              <>
                <h2>"{searchQuery}" 的搜索结果</h2>
                <p>
                  {isAiMode && <span className="ai-badge-inline">AI</span>}
                  找到 <strong>{totalResults}</strong> 个相关资源
                </p>
              </>
            ) : (
              <>
                <h2>热门推荐</h2>
                <p>为您精选 <strong>{totalResults}</strong> 个优质资源</p>
              </>
            )}
          </div>
          
          <div className="search-actions">
            {/* AI 搜索按钮 */}
            {aiSearchEnabled && (
              <button
                className={`ai-search-toggle ${showAiSidebar ? 'active' : ''}`}
                onClick={() => setShowAiSidebar(!showAiSidebar)}
                title="AI 智能搜索"
              >
                <span className="ai-toggle-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="18" height="10" x="3" y="11" rx="2"/>
                    <circle cx="12" cy="5" r="2"/>
                    <path d="M12 7v4"/>
                    <line x1="8" x2="8" y1="16" y2="16"/>
                    <line x1="16" x2="16" y1="16" y2="16"/>
                  </svg>
                </span>
                <span className="ai-toggle-text">{aiSearchButtonText}</span>
              </button>
            )}
            
            {/* 来源筛选 */}
            <select 
              className="source-filter"
              value={sourceFilter}
              onChange={(e) => handleSourceChange(e.target.value)}
            >
              {sourceFilterOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* AI 思考过程动画 - Framer Motion 版本 */}
        <AnimatePresence mode="wait">
          {showThinking && aiLoading && (
            <AIThinkingAnimation currentStep={aiThinkingStep} />
          )}
        </AnimatePresence>

        {/* AI 搜索结果提示 */}
        {isAiMode && aiMessage && !showThinking && (
          <div className="ai-search-info">
            <span className="ai-message">{aiMessage}</span>
          </div>
        )}

        {/* 普通搜索的 AI 增强提示 */}
        {!isAiMode && searchQuery && aiSearchEnabled && !showThinking && (
          <div className={`search-enhance-info ${aiEnhancing ? 'loading' : ''}`}>
            <span className="enhance-dot"></span>
            <span className="enhance-text">
              {aiEnhancing
                ? 'AI 正在补充更多高相关结果...'
                : aiEnhancedCount > 0
                  ? `AI 已补充 ${aiEnhancedCount} 条相关结果`
                  : '已完成关键词搜索，可切换 AI 搜索获得语义推荐'}
            </span>
          </div>
        )}

        {/* 搜索结果 */}
        <div className="search-results">
          {isLoading && currentPage === 1 && !showThinking ? (
            <div className="search-loading">
              <div className="loading"></div>
              <p>搜索中...</p>
            </div>
          ) : !showThinking && searchResults.length > 0 ? (
            <>
              {searchResults.map((result) => (
                <ToolCard
                  key={result.id}
                  tool={{
                    id: result.id,
                    name: result.name,
                    description: result.description,
                    url: result.url,
                    icon: result.iconUrl || '',
                    category: result.category || '',
                    tags: result.tags,
                    isNew: result.isNew,
                    isHot: result.isHot,
                    isFeatured: result.isFeatured,
                  }}
                  onClick={() => handleWebsiteClick(result)}
                  showDirectArrow={showDirectArrow}
                  onDirectVisit={handleDirectVisit}
                  arrowLabel={arrowLabel}
                  arrowIsExternal={arrowIsExternal}
                  directArrowNewWindow={directArrowNewWindow}
                />
              ))}
            </>
          ) : !showThinking && !isLoading ? (
            <div className="search-empty">
              <div className="search-empty-icon">🔍</div>
              <h3 className="search-empty-title">未找到相关结果</h3>
              <p className="search-empty-description">
                {searchErrorMessage || '试试其他关键词'}
              </p>
            </div>
          ) : null}
        </div>

        {/* 加载更多 */}
        {hasMore && !isLoading && !showThinking && (
          <div className="load-more-wrapper">
            <button className="load-more-btn" onClick={loadMore}>
              加载更多 ({searchResults.length}/{totalResults})
            </button>
          </div>
        )}

        {/* 相关搜索 */}
        {relatedKeywords.length > 0 && searchQuery && !isLoading && !showThinking && (
          <div className="related-search">
            <h4>相关搜索</h4>
            <div className="related-tags">
              {relatedKeywords.map((keyword, i) => (
                <button key={i} className="related-tag" onClick={() => handleTagClick(keyword)}>
                  {keyword}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* AI 搜索侧边栏 */}
      <AISearchSidebar
        visible={showAiSidebar}
        onClose={() => setShowAiSidebar(false)}
        enabled={aiSearchEnabled}
        onWebsiteClick={(website) => handleWebsiteClick({
          id: website.id,
          name: website.name,
          description: website.description,
          url: website.url,
          iconUrl: website.iconUrl,
          tags: [],
        })}
      />
    </div>
  );
};

export default SearchPage;
