/**
 * @file pages/WebsiteDetail/index.tsx
 * @description 网址详情页主组件
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 2.1.0
 */

import React, { useEffect, useState, useCallback } from 'react';
import WebsiteFavicon from '../../components/WebsiteFavicon';
import { AxiosError } from 'axios';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import api from '../../services/api';
import { useLicense, FEATURES } from '../../hooks/useLicense';
import { useUser } from '../../contexts/UserContext';
import SEO from '../../components/SEO';
import Sidebar from './Sidebar';
import RelatedWebsites from './RelatedWebsites';
import RatingWidget from './RatingWidget';
import CommentsSection from './CommentsSection';
import FavoriteButton from './FavoriteButton';
import LikeButton from './LikeButton';
import ShareButtons from './ShareButtons';
import { getFullImageUrl, processContentImageUrls } from '../../utils/urlUtils';
import { unwrapApiList, unwrapApiResponse } from '../../utils/apiResponse';
import { debugLog } from '../../utils/debugHelper';
import publicSettingService, { DEFAULT_DETAIL_PAGE } from '../../services/publicSettingService';
import DetailCommercialSlot from './DetailCommercialSlot';
import 'swiper/css';
import 'swiper/css/navigation';
import './index.css';

/**
 * 网站详情数据类型
 */
interface WebsiteDetailData {
  id: string;
  name: string;
  slug?: string;
  description: string;
  url: string;
  iconUrl?: string;
  category: {
    id: string;
    name: string;
    slug?: string;
    parent?: {
      id: string;
      name: string;
      slug?: string;
    };
  };
  tags: string[];
  createdAt: string;
  updatedAt: string;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
  detailContent?: string;
  screenshots?: string | string[];
  thumbnail?: string;
  visitBtnText?: string;
  averageRating?: number | null;
  totalRatings?: number;
  userRating?: number | null;
  isFavorited?: boolean;
  totalFavorites?: number;
  isLiked?: boolean;
  likeCount?: number;
  commentsCount?: number;
  trafficMetrics?: {
    websiteId?: number;
    monthlyVisits?: number;
    avgVisitDurationSeconds?: number;
    pagesPerVisit?: number;
    bounceRate?: number;
    sourceBreakdown?: {
      direct?: number;
      organicSearch?: number;
      email?: number;
      referral?: number;
      social?: number;
      displayAds?: number;
      others?: number;
    };
    dataSource?: string;
    remark?: string;
    updatedAt?: string | null;
  } | null;
}

interface RelatedWebsite {
  id: string;
  name: string;
  slug?: string;
  description: string;
  url?: string;
  iconUrl?: string;
  category?: {
    name: string;
  };
}

interface WebsiteTag {
  id: string;
  name: string;
  slug: string;
  color?: string;
}

/**
 * 网站健康探测结果（详情页数据面板展示）
 */
interface WebsitePreviewSnapshotData {
  ok?: boolean;
  url?: string;
  source?: string;
  fallback?: boolean;
  fallbackUrls?: string[];
}

interface DetailPageConfig {
  pageStylePreset?: 'showcase' | 'compact' | 'enterprise';
  layoutWidthMode?: 'contained' | 'wide' | 'fluid';
  spacingDensity?: 'compact' | 'comfortable';
  labelVisualStyle?: 'soft' | 'outline';
  dataPanelEnabled?: boolean;
  dataPanelTitle?: string;
  heroAccentGlassEnabled?: boolean;
  enabled?: boolean;
  showRelated?: boolean;
  relatedTitle?: string;
  relatedCount?: number;
  relatedMode?: 'same_category' | 'same_tags' | 'hot' | 'manual';
  manualWebsiteIds?: string | string[];
  showTags?: boolean;
  tagsTitle?: string;
  tagSource?: 'website' | 'category' | 'manual';
  manualTags?: string | string[];
  showCategory?: boolean;
  categoryTitle?: string;
  sidebarAdEnabled?: boolean;
  sidebarAdSlotKey?: string;
  detailTopAdEnabled?: boolean;
  detailTopAdSlotKey?: string;
  detailInlineAdEnabled?: boolean;
  detailInlineAdSlotKey?: string;
  detailBottomAdEnabled?: boolean;
  detailBottomAdSlotKey?: string;
  seoFaqEnabled?: boolean;
  seoFaqTitle?: string;
  seoFaqLines?: string;
  seoLongTailEnabled?: boolean;
  seoLongTailTitle?: string;
  seoLongTailKeywords?: string | string[];
  seoSchemaEnabled?: boolean;
  screenshotsEnabled?: boolean;
  thumbnailLayoutStyle?: 'device' | 'split' | 'carousel';
  thumbnailSplitSideCount?: number;
  thumbnailCarouselThumbCount?: number;
  previewSnapshotEnabled?: boolean;
  previewSnapshotTimeoutMs?: number;
  previewSnapshotCacheTtlSeconds?: number;
  previewSnapshotAllowFallbackMshots?: boolean;
  copyrightEnabled?: boolean;
  copyrightText?: string;
  copyrightLink?: string;
  disclaimerEnabled?: boolean;
  disclaimerText?: string;
  footerTipEnabled?: boolean;
  footerTipText?: string;
  shareEnabled?: boolean;
  shareText?: string;
  reportEnabled?: boolean;
  reportText?: string;
  reportEmail?: string;
  // 直达按钮配置
  visitArrowEnabled?: boolean;
  visitArrowText?: string;
  visitBtnNewWindow?: boolean;
}

const DEFAULT_DETAIL_PAGE_CONFIG: DetailPageConfig = {
  ...DEFAULT_DETAIL_PAGE,
  thumbnailLayoutStyle: DEFAULT_DETAIL_PAGE.thumbnailLayoutStyle || 'device',
};

interface DetailSeoFaqItem {
  question: string;
  answer: string;
}

interface DetailDataPanelItem {
  key: string;
  label: string;
  value: string;
}

interface DetailTrafficSourceItem {
  key: string;
  label: string;
  value: number;
}

/**
 * 规范化缩略图展示样式，避免后台旧配置或异常值导致前端渲染分支错误
 */
const normalizeThumbnailLayoutStyle = (style?: string): 'device' | 'split' | 'carousel' => {
  if (style === 'split' || style === 'carousel') return style;
  return 'device';
};

/**
 * 规范化详情页整体样式预设
 */
const normalizeDetailPageStylePreset = (style?: string): 'showcase' | 'compact' | 'enterprise' => {
  if (style === 'compact' || style === 'enterprise') return style;
  return 'showcase';
};

/**
 * 规范化详情页宽度模式
 */
const normalizeDetailLayoutWidthMode = (mode?: string): 'contained' | 'wide' | 'fluid' => {
  if (mode === 'wide' || mode === 'fluid') return mode;
  return 'contained';
};

/**
 * 格式化月访问量显示
 */
const formatMonthlyVisitsLabel = (value?: number | null): string => {
  const num = Number(value || 0);
  if (!Number.isFinite(num) || num <= 0) return '未录入';
  if (num >= 100000000) return `${(num / 100000000).toFixed(2)} 亿`;
  if (num >= 10000) return `${(num / 10000).toFixed(1)} 万`;
  return `${Math.round(num)}`;
};

/**
 * 格式化平均访问时长显示
 */
const formatVisitDurationLabel = (seconds?: number | null): string => {
  const num = Number(seconds || 0);
  if (!Number.isFinite(num) || num <= 0) return '未录入';
  const m = Math.floor(num / 60);
  const s = Math.floor(num % 60);
  if (m > 0) return `${m}分${String(s).padStart(2, '0')}秒`;
  return `${s}秒`;
};

/**
 * 规范化详情页留白密度配置
 */
const normalizeDetailSpacingDensity = (mode?: string): 'compact' | 'comfortable' => {
  if (mode === 'comfortable') return 'comfortable';
  return 'compact';
};

/**
 * 规范化详情页标签/分类视觉风格
 */
const normalizeDetailLabelVisualStyle = (style?: string): 'soft' | 'outline' => {
  if (style === 'outline') return 'outline';
  return 'soft';
};

/**
 * 规范化缩略图细项配置数量，避免后台异常值导致布局错位
 */
const normalizeThumbnailCount = (
  value: unknown,
  fallback: number,
  min: number,
  max: number,
): number => {
  const parsed = Number.parseInt(String(value ?? ''), 10);
  if (!Number.isInteger(parsed)) return fallback;
  return Math.max(min, Math.min(max, parsed));
};

/**
 * 格式化详情页日期显示（优先用于更新时间/收录时间）
 */
const formatDetailDateLabel = (value?: string): string => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

/**
 * 从网址中提取主机名，便于在详情页展示来源域名
 */
const getWebsiteHostLabel = (url?: string): string => {
  if (!url) return '';
  try {
    const host = new URL(url).hostname || '';
    return host.replace(/^www\./i, '');
  } catch (error) {
    return '';
  }
};

/**
 * 获取网址协议标识（用于站点数据面板）
 */
const getWebsiteProtocolLabel = (url?: string): string => {
  if (!url) return '';
  try {
    const protocol = new URL(url).protocol.toLowerCase();
    return protocol === 'https:' ? 'HTTPS' : protocol.replace(':', '').toUpperCase();
  } catch (error) {
    return '';
  }
};

/**
 * 当后台未上传缩略图时，使用免费的 mShots 服务作为前端预览兜底
 * 说明：这是“前端展示兜底”，不替代后台正式截图存储。
 */
const getWebsiteAutoScreenshotUrl = (url?: string): string => {
  if (!url) return '';
  try {
    const normalized = /^https?:\/\//i.test(url) ? url : `https://${url}`;
    return `https://s0.wp.com/mshots/v1/${encodeURIComponent(normalized)}?w=1280`;
  } catch (error) {
    return '';
  }
};

/**
 * 规范化对比目标标识（兼容复制进来的详情页链接、.html 尾缀与多余空格）
 */
const normalizeCompareIdentifier = (value?: string): string => {
  const raw = String(value || '').trim();
  if (!raw) return '';
  // 兼容粘贴 /website/slug 或完整 URL
  const fromPathMatch = raw.match(/\/website\/([^/?#]+)/i);
  if (fromPathMatch?.[1]) {
    return String(fromPathMatch[1]).replace(/\.html$/i, '').trim();
  }
  const fromVsPathMatch = raw.match(/\/vs\/([^/?#]+)/i);
  if (fromVsPathMatch?.[1]) {
    return '';
  }
  return raw.replace(/\.html$/i, '').trim();
};

/**
 * 构建详情页对比路由路径
 */
const buildWebsiteComparePath = (currentIdentifier?: string, targetIdentifier?: string): string => {
  const current = normalizeCompareIdentifier(currentIdentifier);
  const target = normalizeCompareIdentifier(targetIdentifier);
  if (!current || !target) return '';
  if (current === target) return '';
  return `/vs/${encodeURIComponent(current)}/${encodeURIComponent(target)}`;
};

/**
 * 解析后台保存的字符串/数组配置，统一输出字符串列表
 */
const parseConfigStringList = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.map(item => String(item || '').trim()).filter(Boolean);
  }
  return String(value || '')
    .split(/[\n,]/)
    .map(item => item.trim())
    .filter(Boolean);
};

/**
 * 解析 FAQ 配置（每行格式：问题|答案）
 */
const parseDetailSeoFaqItems = (value: unknown): DetailSeoFaqItem[] => {
  return String(value || '')
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => {
      const [ question, ...answerParts ] = line.split('|');
      return {
        question: String(question || '').trim(),
        answer: String(answerParts.join('|') || '').trim(),
      };
    })
    .filter(item => item.question && item.answer)
    .slice(0, 20);
};

/**
 * 生成详情页 FAQ 默认模板（当后台未手动配置 FAQ 时作为 SEO 兜底）
 */
const buildDefaultDetailSeoFaqItems = (
  website: WebsiteDetailData,
  options: {
    displayHost?: string;
    displayProtocol?: string;
    allTags?: string[];
    displayUpdatedDate?: string;
  } = {},
): DetailSeoFaqItem[] => {
  const displayHost = String(options.displayHost || '').trim();
  const displayProtocol = String(options.displayProtocol || '').trim();
  const displayUpdatedDate = String(options.displayUpdatedDate || '').trim();
  const tagNames = Array.isArray(options.allTags) ? options.allTags.filter(Boolean).slice(0, 5) : [];
  const categoryName = website.category?.name || '该网站';
  const faqList: DetailSeoFaqItem[] = [
    {
      question: `${website.name} 是什么？`,
      answer: `${website.name} 是一个${categoryName}相关网站。${website.description || '你可以在该网站找到对应的功能与内容。'}`,
    },
    {
      question: `${website.name} 怎么访问？`,
      answer: `点击本页的“访问网站”按钮即可前往 ${website.name} 官网${displayProtocol ? `（当前链接协议：${displayProtocol}）` : ''}。`,
    },
  ];
  if (displayHost) {
    faqList.push({
      question: `${website.name} 的域名是什么？`,
      answer: `${website.name} 当前记录的主域名为 ${displayHost}。如果网站改版或更换域名，请以站点实际跳转结果为准。`,
    });
  }
  if (tagNames.length > 0) {
    faqList.push({
      question: `${website.name} 适合哪些场景？`,
      answer: `从当前收录标签看，${website.name} 与 ${tagNames.join('、')} 等主题相关，适合对应场景的用户参考和使用。`,
    });
  }
  if (displayUpdatedDate) {
    faqList.push({
      question: `${website.name} 的信息多久更新一次？`,
      answer: `本页面最近一次更新时间为 ${displayUpdatedDate}。如网站功能变动较快，建议实际访问官网确认最新信息。`,
    });
  }
  return faqList.slice(0, 6);
};

/**
 * 从图标/缩略图提取主色（实验性视觉增强）
 * 失败时返回 null，不影响详情页主流程。
 */
const extractImageAccentRgb = async (imageUrl?: string): Promise<string | null> => {
  if (!imageUrl || typeof window === 'undefined') return null;
  return await new Promise(resolve => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.decoding = 'async';
    img.referrerPolicy = 'no-referrer';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(null);
          return;
        }
        const size = 24;
        canvas.width = size;
        canvas.height = size;
        ctx.drawImage(img, 0, 0, size, size);
        const data = ctx.getImageData(0, 0, size, size).data;
        let r = 0;
        let g = 0;
        let b = 0;
        let count = 0;
        for (let i = 0; i < data.length; i += 4) {
          const alpha = data[i + 3];
          if (alpha < 180) continue;
          const rr = data[i];
          const gg = data[i + 1];
          const bb = data[i + 2];
          // 过滤极端亮白/暗黑像素，避免取到背景色
          if ((rr > 245 && gg > 245 && bb > 245) || (rr < 12 && gg < 12 && bb < 12)) continue;
          r += rr;
          g += gg;
          b += bb;
          count += 1;
        }
        if (!count) {
          resolve(null);
          return;
        }
        resolve(`${Math.round(r / count)}, ${Math.round(g / count)}, ${Math.round(b / count)}`);
      } catch (error) {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = imageUrl;
  });
};

const WebsiteDetailPage: React.FC = () => {
  const { idOrSlug } = useParams<{ idOrSlug?: string }>();
  const navigate = useNavigate();
  const { isLoading: licenseLoading, hasFeature } = useLicense();
  const { user, isLoggedIn } = useUser();
  
  const [website, setWebsite] = useState<WebsiteDetailData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [relatedWebsites, setRelatedWebsites] = useState<RelatedWebsite[]>([]);
  const [relatedLoading, setRelatedLoading] = useState<boolean>(false);
  const [websiteTags, setWebsiteTags] = useState<WebsiteTag[]>([]);
  const [detailPageConfig, setDetailPageConfig] = useState<DetailPageConfig>(DEFAULT_DETAIL_PAGE_CONFIG);
  const [detailPageConfigLoaded, setDetailPageConfigLoaded] = useState<boolean>(false);
  const [backendPreviewSnapshotUrl, setBackendPreviewSnapshotUrl] = useState<string>('');
  const [backendPreviewFallbackUrls, setBackendPreviewFallbackUrls] = useState<string[]>([]);
  const [heroAccentRgb, setHeroAccentRgb] = useState<string | null>(null);
  const [comparePickerOpen, setComparePickerOpen] = useState(false);
  const [compareTargetInput, setCompareTargetInput] = useState('');
  const [compareTargetError, setCompareTargetError] = useState<string | null>(null);
  const [compareCandidateTab, setCompareCandidateTab] = useState<'category' | 'tag'>('category');
  const [compareCategoryCandidates, setCompareCategoryCandidates] = useState<RelatedWebsite[]>([]);
  const [compareTagCandidates, setCompareTagCandidates] = useState<RelatedWebsite[]>([]);
  const [compareCandidatesLoading, setCompareCandidatesLoading] = useState(false);
  const [heroInfoTab, setHeroInfoTab] = useState<'summary' | 'data' | 'tags'>('summary');
  const [previewFallbackIndex, setPreviewFallbackIndex] = useState<number>(0);
  
  // 图片灯箱状态
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // 获取网站详情
  const fetchWebsiteDetail = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const identifier = String(idOrSlug || '').replace(/\.html$/, '');
      if (!identifier) {
        throw new Error('未找到网站ID或别名');
      }

      const response = await api.get(`/websites/${identifier}`);
      const data = unwrapApiResponse<WebsiteDetailData | null>(response.data, null);
      
      if (!data) {
        throw new Error('未找到该网站信息');
      }
      
      // 处理内容中的图片URL
      if (data.detailContent) {
        data.detailContent = processContentImageUrls(data.detailContent);
      }
      
      setWebsite(data);
      
      // 获取相关推荐和标签
      fetchRelatedWebsites(data.id, data.category.id);
      fetchWebsiteTags(data.id);
      
    } catch (err) {
      console.error('获取网站详情失败:', err);
      const axiosError = err as AxiosError<{ message?: string; error?: string }>;
      if (axiosError.response?.status === 404) {
        setError('抱歉，该网站不存在或已被删除');
      } else if (axiosError.response) {
        setError(axiosError.response.data?.message || axiosError.response.data?.error || '获取网站详情失败，请稍后重试');
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('获取网站详情失败，请稍后重试');
      }
    } finally {
      setLoading(false);
    }
  }, [idOrSlug]);

  // 获取相关推荐
  const fetchRelatedWebsites = async (websiteId: string, categoryId: string) => {
    try {
      setRelatedLoading(true);
      /**
       * 走专用相关推荐接口，支持后续后台侧边栏高级推荐模式扩展
       */
      const response = await api.get(`/websites/${websiteId}/related`, {
        params: {
          limit: 6,
          mode: 'same_category',
        }
      });
      
      const list = unwrapApiList<RelatedWebsite>(response.data);
      // 过滤掉当前网站
      const filtered = list.filter(w => w.id !== websiteId).slice(0, 5);
      setRelatedWebsites(filtered);
    } catch (err) {
      console.error('获取相关推荐失败:', err);
    } finally {
      setRelatedLoading(false);
    }
  };

  // 获取网站标签
  const fetchWebsiteTags = async (websiteId: string) => {
    try {
      const response = await api.get(`/websites/${websiteId}/tags`);
      const tags = unwrapApiList<WebsiteTag>(response.data);
      setWebsiteTags(tags);
    } catch (err) {
      debugLog.warn('获取标签失败 (非关键错误):', err);
    }
  };

  /**
   * 获取详情页展示配置（后台「网站详情页配置」）
   */
  const fetchDetailPageConfig = useCallback(async () => {
    try {
      setDetailPageConfigLoaded(false);
      const config = await publicSettingService.getDetailPageConfig();
      setDetailPageConfig({ ...DEFAULT_DETAIL_PAGE_CONFIG, ...(config || {}) });
    } catch (err) {
      debugLog.warn('获取详情页配置失败，使用默认配置:', err);
      setDetailPageConfig(DEFAULT_DETAIL_PAGE_CONFIG);
    } finally {
      setDetailPageConfigLoaded(true);
    }
  }, []);

  useEffect(() => {
    fetchWebsiteDetail();
    // 滚动到顶部
    window.scrollTo(0, 0);
  }, [fetchWebsiteDetail]);

  useEffect(() => {
    fetchDetailPageConfig();
  }, [fetchDetailPageConfig]);

  /**
   * 当网站数据变化时，重置预览图回退索引，确保优先展示最高优先级图片源
   */
  useEffect(() => {
    setPreviewFallbackIndex(0);
  }, [website?.id, website?.thumbnail, website?.screenshots, backendPreviewSnapshotUrl, backendPreviewFallbackUrls]);

  /**
   * 当后台未上传预览图/截图时，优先尝试后端本地截图服务（Playwright 缓存），失败再由前端 mShots 兜底
   */
  useEffect(() => {
    let cancelled = false;

    const fetchPreviewSnapshot = async () => {
      // 等待详情页配置加载完成，避免先用默认配置请求后又被真实配置覆盖导致“闪一下消失”
      if (!detailPageConfigLoaded) {
        return;
      }

      if (!website?.id) {
        setBackendPreviewSnapshotUrl('');
        setBackendPreviewFallbackUrls([]);
        return;
      }
      const localScreenshots = Array.isArray(website.screenshots)
        ? website.screenshots.filter(Boolean)
        : (website.screenshots ? [ website.screenshots ] : []);
      if (website.thumbnail || localScreenshots.length > 0) {
        setBackendPreviewSnapshotUrl('');
        setBackendPreviewFallbackUrls([]);
        return;
      }

      if (
        detailPageConfig.previewSnapshotEnabled === false &&
        detailPageConfig.previewSnapshotAllowFallbackMshots === false
      ) {
        setBackendPreviewSnapshotUrl('');
        setBackendPreviewFallbackUrls([]);
        return;
      }

      try {
        const timeoutMs = Number(detailPageConfig.previewSnapshotTimeoutMs || 0);
        const response = await api.get(`/websites/${website.id}/preview-snapshot`, {
          params: timeoutMs > 0 ? { timeout: timeoutMs } : undefined,
        });
        const payload = unwrapApiResponse<WebsitePreviewSnapshotData | null>(response.data, null);
        if (cancelled) return;
        const previewUrl = String(payload?.url || '').trim();
        const fallbackUrls = Array.isArray(payload?.fallbackUrls)
          ? payload!.fallbackUrls!.map(item => String(item || '').trim()).filter(Boolean)
          : [];
        setBackendPreviewFallbackUrls(fallbackUrls);
        if (!previewUrl) {
          setBackendPreviewSnapshotUrl('');
          return;
        }
        setBackendPreviewSnapshotUrl(
          previewUrl.startsWith('/uploads/') ? getFullImageUrl(previewUrl) : previewUrl
        );
      } catch (error) {
        // 保持已有成功截图，避免接口二次请求失败时把已显示的预览图清空
        if (cancelled) return;
      }
    };

    fetchPreviewSnapshot();
    return () => {
      cancelled = true;
    };
  }, [
    detailPageConfigLoaded,
    website?.id,
    website?.thumbnail,
    website?.screenshots,
    detailPageConfig.previewSnapshotEnabled,
    detailPageConfig.previewSnapshotTimeoutMs,
    detailPageConfig.previewSnapshotAllowFallbackMshots,
  ]);

  /**
   * 发起对比弹层打开时，按“分类/标签”分别拉候选网站，提升 SEO 对比入口质量
   */
  useEffect(() => {
    let cancelled = false;

    const fetchCompareCandidates = async () => {
      if (!comparePickerOpen || !website?.id) return;
      try {
        setCompareCandidatesLoading(true);
        const [ categoryRes, tagRes ] = await Promise.allSettled([
          api.get(`/websites/${website.id}/related`, { params: { mode: 'same_category', limit: 8 } }),
          api.get(`/websites/${website.id}/related`, { params: { mode: 'same_tags', limit: 8 } }),
        ]);
        if (cancelled) return;

        if (categoryRes.status === 'fulfilled') {
          const categoryList = unwrapApiList<RelatedWebsite>(categoryRes.value.data)
            .filter(item => String(item.id) !== String(website.id));
          setCompareCategoryCandidates(categoryList);
        } else {
          setCompareCategoryCandidates([]);
        }

        if (tagRes.status === 'fulfilled') {
          const tagList = unwrapApiList<RelatedWebsite>(tagRes.value.data)
            .filter(item => String(item.id) !== String(website.id));
          setCompareTagCandidates(tagList);
        } else {
          setCompareTagCandidates([]);
        }
      } catch (error) {
        if (!cancelled) {
          setCompareCategoryCandidates([]);
          setCompareTagCandidates([]);
        }
      } finally {
        if (!cancelled) {
          setCompareCandidatesLoading(false);
        }
      }
    };

    fetchCompareCandidates();
    return () => {
      cancelled = true;
    };
  }, [comparePickerOpen, website?.id]);

  /**
   * 提取详情页头部视觉主色（优先网站图标，其次缩略图）
   */
  useEffect(() => {
    const run = async () => {
      if (!website?.id || detailPageConfig.heroAccentGlassEnabled === false) {
        setHeroAccentRgb(null);
        return;
      }
      const iconCandidate = website.iconUrl ? getFullImageUrl(website.iconUrl) : '';
      const thumbnailCandidate = website.thumbnail
        ? getFullImageUrl(website.thumbnail)
        : (backendPreviewSnapshotUrl || getWebsiteAutoScreenshotUrl(website.url));
      const accent = await extractImageAccentRgb(iconCandidate || thumbnailCandidate);
      setHeroAccentRgb(accent);
    };
    run();
  }, [
    website?.id,
    website?.iconUrl,
    website?.thumbnail,
    backendPreviewSnapshotUrl,
    website?.url,
    detailPageConfig.heroAccentGlassEnabled,
  ]);

  const handleGoBack = () => {
    navigate(-1);
  };

  /**
   * 评分成功后同步详情页互动信息（评分值/平均分/评分人数）
   */
  const handleRatingChange = (newRating: number, newAverage?: number, newTotal?: number) => {
    if (website) {
      setWebsite({
        ...website,
        userRating: newRating,
        averageRating: typeof newAverage === 'number' ? newAverage : website.averageRating,
        totalRatings: typeof newTotal === 'number' ? newTotal : website.totalRatings,
      });
    }
  };

  /**
   * 收藏状态变化后同步详情页本地状态
   */
  const handleFavoriteChange = useCallback((isFavorited: boolean, totalFavorites?: number) => {
    setWebsite((prev) => (prev ? {
      ...prev,
      isFavorited,
      totalFavorites: typeof totalFavorites === 'number' ? totalFavorites : prev.totalFavorites,
    } : prev));
  }, []);

  /**
   * 点赞状态变化后同步详情页本地状态与计数
   */
  const handleLikeChange = useCallback((isLiked: boolean, likeCount: number) => {
    setWebsite((prev) => (prev ? { ...prev, isLiked, likeCount } : prev));
  }, []);

  /**
   * 从详情页发起对比（支持快速选择和手动输入）
   */
  const handleStartCompare = useCallback((targetIdentifier?: string) => {
    const currentIdentifier = website?.slug || website?.id || '';
    const comparePath = buildWebsiteComparePath(currentIdentifier, targetIdentifier);
    if (!comparePath) {
      setCompareTargetError('请输入不同的网站 ID 或 slug');
      return;
    }
    setCompareTargetError(null);
    setComparePickerOpen(false);
    navigate(comparePath);
  }, [navigate, website?.id, website?.slug]);

  /**
   * 打开缩略图/截图灯箱
   * @param index - -1 表示主缩略图，其余为 screenshots 下标
   */
  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  // 截图列表
  const screenshots = website?.screenshots 
    ? (Array.isArray(website.screenshots) ? website.screenshots : [website.screenshots]) 
    : [];

  // 渲染Markdown内容 (简单处理)
  const renderContent = (content: string) => {
    if (!content) return '';
    // 这里可以接入 markdown-it 或其他库，暂时使用简单的替换
    // 实际项目中建议使用 react-markdown
    return content
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/^- (.*$)/gim, '<li>$1</li>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
      .replace(/\n/g, '<br />');
  };

  // 加载状态
  if (loading || licenseLoading) {
    return (
      <div className="detail-page">
        <div className="detail-loading">
          <div className="loading-spinner"></div>
          <p>加载中...</p>
        </div>
      </div>
    );
  }

  // 错误状态
  if (error || !website) {
    return (
      <div className="detail-page">
        <div className="detail-error">
          <h2>页面加载失败</h2>
          <p>{error || '网站不存在'}</p>
          <button onClick={handleGoBack} className="btn-back">返回上一页</button>
        </div>
      </div>
    );
  }

  // 合并标签
  const allTags = [
    ...(website.tags || []),
    ...websiteTags.map(t => t.name)
  ].filter((v, i, a) => a.indexOf(v) === i);
  const displayUpdatedDate = formatDetailDateLabel(website.updatedAt || website.createdAt);
  const displayHost = getWebsiteHostLabel(website.url);
  const displayProtocol = getWebsiteProtocolLabel(website.url);
  const displayAverageRating = typeof website.averageRating === 'number'
    ? Number(website.averageRating).toFixed(1)
    : '';
  const thumbnailLayoutStyle = normalizeThumbnailLayoutStyle(detailPageConfig.thumbnailLayoutStyle);
  const carouselThumbCount = normalizeThumbnailCount(
    detailPageConfig.thumbnailCarouselThumbCount,
    6,
    2,
    12,
  );
  const heroGalleryScreenshots = screenshots.slice(0, carouselThumbCount);
  const pageStylePreset = normalizeDetailPageStylePreset(detailPageConfig.pageStylePreset);
  const isInteractiveHeroPreset = pageStylePreset === 'compact' || pageStylePreset === 'enterprise';
  const layoutWidthMode = normalizeDetailLayoutWidthMode(detailPageConfig.layoutWidthMode);
  const spacingDensity = normalizeDetailSpacingDensity(detailPageConfig.spacingDensity);
  const labelVisualStyle = normalizeDetailLabelVisualStyle(detailPageConfig.labelVisualStyle);
  const showDataPanel = detailPageConfig.dataPanelEnabled !== false;
  const dataPanelTitle = String(detailPageConfig.dataPanelTitle || '站点数据').trim() || '站点数据';
  /**
   * 构建预览图候选链路：上传缩略图 > 后台截图数组 > 后端Playwright缓存 > mShots兜底
   */
  const previewImageCandidates = (() => {
    const list: string[] = [];
    if (website.thumbnail) {
      list.push(getFullImageUrl(website.thumbnail));
    }
    if (screenshots.length > 0) {
      screenshots.forEach((item) => {
        const normalized = getFullImageUrl(item);
        if (normalized) {
          list.push(normalized);
        }
      });
    }
    if (backendPreviewSnapshotUrl) {
      list.push(backendPreviewSnapshotUrl);
    }
    if (backendPreviewFallbackUrls.length > 0) {
      backendPreviewFallbackUrls.forEach((item) => list.push(item));
    }
    if (detailPageConfig.previewSnapshotAllowFallbackMshots !== false) {
      list.push(getWebsiteAutoScreenshotUrl(website.url));
    }
    return Array.from(new Set(list.filter(Boolean)));
  })();
  const heroPreviewImage = previewImageCandidates[previewFallbackIndex] || '';
  const currentCompareIdentifier = website.slug || website.id;
  const trafficMetrics = website.trafficMetrics || null;
  const websiteDataItems: DetailDataPanelItem[] = [
    { key: 'monthlyVisits', label: '月访问量', value: formatMonthlyVisitsLabel(trafficMetrics?.monthlyVisits) },
    { key: 'avgVisitDuration', label: '平均访问时长', value: formatVisitDurationLabel(trafficMetrics?.avgVisitDurationSeconds) },
    {
      key: 'pagesPerVisit',
      label: '每次访问页数',
      value: Number(trafficMetrics?.pagesPerVisit || 0) > 0 ? `${Number(trafficMetrics?.pagesPerVisit || 0).toFixed(2)} 页` : '未录入',
    },
    {
      key: 'bounceRate',
      label: '跳出率',
      value: Number(trafficMetrics?.bounceRate || 0) > 0 ? `${Number(trafficMetrics?.bounceRate || 0).toFixed(2)}%` : '未录入',
    },
    { key: 'likes', label: '点赞', value: `${website.likeCount || 0}` },
    { key: 'favorites', label: '收藏', value: `${website.totalFavorites || 0}` },
    { key: 'comments', label: '评论', value: `${website.commentsCount || 0}` },
    { key: 'ratings', label: '评分数', value: `${website.totalRatings || 0}` },
    { key: 'category', label: '分类', value: website.category?.name || '未分类' },
    { key: 'updated', label: '更新', value: displayUpdatedDate || '未知' },
  ];
  const trafficSourceItems: DetailTrafficSourceItem[] = [
    { key: 'direct', label: '直接访问', value: Number(trafficMetrics?.sourceBreakdown?.direct || 0) },
    { key: 'organicSearch', label: '自然搜索', value: Number(trafficMetrics?.sourceBreakdown?.organicSearch || 0) },
    { key: 'email', label: '邮件', value: Number(trafficMetrics?.sourceBreakdown?.email || 0) },
    { key: 'referral', label: '外链引荐', value: Number(trafficMetrics?.sourceBreakdown?.referral || 0) },
    { key: 'social', label: '社交媒体', value: Number(trafficMetrics?.sourceBreakdown?.social || 0) },
    { key: 'displayAds', label: '展示广告', value: Number(trafficMetrics?.sourceBreakdown?.displayAds || 0) },
    { key: 'others', label: '其他', value: Number(trafficMetrics?.sourceBreakdown?.others || 0) },
  ].filter(item => item.value > 0);
  const heroTagPreview = allTags.slice(0, 10);
  const heroTabs = [
    { key: 'summary' as const, label: '简介', visible: true },
    { key: 'data' as const, label: '数据', visible: showDataPanel },
    { key: 'tags' as const, label: '标签', visible: heroTagPreview.length > 0 },
  ].filter(item => item.visible);
  const activeHeroInfoTab = heroTabs.some(item => item.key === heroInfoTab)
    ? heroInfoTab
    : (heroTabs[0]?.key || 'summary');
  const activeCompareCandidateTab = compareCandidateTab === 'tag' && compareTagCandidates.length > 0
    ? 'tag'
    : compareCategoryCandidates.length > 0
    ? 'category'
    : compareTagCandidates.length > 0
    ? 'tag'
    : compareCandidateTab;
  const activeCompareCandidates = activeCompareCandidateTab === 'tag'
    ? compareTagCandidates
    : compareCategoryCandidates;
  const seoFaqItems = (() => {
    const customFaqItems = parseDetailSeoFaqItems(detailPageConfig.seoFaqLines);
    if (customFaqItems.length > 0) return customFaqItems;
    if (detailPageConfig.seoFaqEnabled === false) return [];
    return buildDefaultDetailSeoFaqItems(website, {
      displayHost,
      displayProtocol,
      allTags,
      displayUpdatedDate,
    });
  })();
  const seoLongTailKeywords = parseConfigStringList(detailPageConfig.seoLongTailKeywords).slice(0, 18);
  const detailSchemaBlocks = (() => {
    if (detailPageConfig.seoSchemaEnabled === false) return [];
    const canonicalUrl = `https://hao.uied.cn/website/${website.slug || website.id}`;
    const blocks: Array<Record<string, unknown>> = [
      {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: website.seoTitle || website.name,
        description: website.seoDescription || website.description,
        url: canonicalUrl,
        datePublished: website.createdAt || undefined,
        dateModified: website.updatedAt || website.createdAt || undefined,
        inLanguage: 'zh-CN',
        breadcrumb: {
          '@type': 'BreadcrumbList',
          itemListElement: [
            {
              '@type': 'ListItem',
              position: 1,
              name: '首页',
              item: 'https://hao.uied.cn/',
            },
            {
              '@type': 'ListItem',
              position: 2,
              name: website.category.parent?.name || website.category.name,
              item: website.category.parent
                ? `https://hao.uied.cn/category/${website.category.parent.slug || website.category.parent.id}`
                : `https://hao.uied.cn/category/${website.category.slug || website.category.id}`,
            },
            {
              '@type': 'ListItem',
              position: 3,
              name: website.category.name,
              item: `https://hao.uied.cn/category/${website.category.slug || website.category.id}`,
            },
            {
              '@type': 'ListItem',
              position: 4,
              name: website.name,
              item: canonicalUrl,
            },
          ],
        },
      },
    ];
    if (seoFaqItems.length > 0 && detailPageConfig.seoFaqEnabled !== false) {
      blocks.push({
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: seoFaqItems.map(item => ({
          '@type': 'Question',
          name: item.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: item.answer,
          },
        })),
      });
    }
    return blocks;
  })();
  const heroAccentStyle = detailPageConfig.heroAccentGlassEnabled === false
    ? undefined
    : ({
      ['--detail-accent-rgb' as string]: heroAccentRgb || '59, 130, 246',
    } as React.CSSProperties);

  /**
   * 预览图加载失败时自动回退到下一候选源，避免出现“闪一下后消失”的体验问题
   */
  const handlePreviewImageError = () => {
    setPreviewFallbackIndex((current) => {
      if (current >= previewImageCandidates.length - 1) {
        return current;
      }
      return current + 1;
    });
  };

  return (
    <div
      className={[
        'detail-page',
        `detail-page--layout-${layoutWidthMode}`,
        `detail-page--spacing-${spacingDensity}`,
        `detail-page--style-${pageStylePreset}`,
        `detail-page--label-${labelVisualStyle}`,
      ].join(' ')}
    >
      <SEO
        title={website.seoTitle || website.name}
        description={website.seoDescription || website.description}
        keywords={website.seoKeywords || `${website.name},${website.category.name},${allTags.join(',')}`}
        image={website.iconUrl}
        url={`https://hao.uied.cn/website/${website.slug || website.id}`}
        type="website"
      />
      {detailSchemaBlocks.map((block, index) => (
        <script
          key={`detail-schema-${index}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(block) }}
        />
      ))}

      {/* 两栏布局 */}
      <div className="detail-layout">
        {/* 主内容区 - 文章样式 */}
        <main className="detail-main">
          <article className="detail-article">
            {/* 顶部 Hero：左文案 + 右缩略图（渐变氛围） */}
            <section
              className={`detail-hero detail-hero--${thumbnailLayoutStyle} detail-hero--preset-${pageStylePreset}`}
              style={heroAccentStyle}
            >
              <div className="detail-hero__backdrop" aria-hidden="true" />
              <div className="detail-hero__content">
                <div className="detail-hero__left">
                  <div className="article-meta-top detail-hero__breadcrumb">
                    {website.category.parent && (
                      <Link
                        to={`/category/${website.category.parent.slug || website.category.parent.id}`}
                        className="article-category"
                      >
                        {website.category.parent.name}
                      </Link>
                    )}
                    <span className="article-divider">/</span>
                    <Link
                      to={`/category/${website.category.slug || website.category.id}`}
                      className="article-category"
                    >
                      {website.category.name}
                    </Link>
                  </div>

                  <div className="article-title-wrapper detail-hero__title-row">
                    <WebsiteFavicon
                      iconUrl={website.iconUrl}
                      websiteUrl={website.url}
                      name={website.name}
                      size={52}
                      className="article-icon-large"
                    />
                    <div className="detail-hero__title-group">
                      <h1 className="article-title">{website.name}</h1>
                    </div>
                  </div>

                  <div className="article-meta detail-hero__meta">
                    {displayAverageRating && (
                      <div className="meta-item meta-pill">
                        <span className="meta-item-label">评分</span>
                        <span className="meta-item-value meta-item-highlight">⭐ {displayAverageRating}</span>
                      </div>
                    )}
                    {!!website.commentsCount && (
                      <div className="meta-item meta-pill">
                        <span className="meta-item-label">评论</span>
                        <span className="meta-item-value">{website.commentsCount}</span>
                      </div>
                    )}
                    {!!website.likeCount && (
                      <div className="meta-item meta-pill">
                        <span className="meta-item-label">点赞</span>
                        <span className="meta-item-value">{website.likeCount}</span>
                      </div>
                    )}
                    {displayUpdatedDate && (
                      <div className="meta-item meta-pill">
                        <span className="meta-item-label">更新</span>
                        <span className="meta-item-value">{displayUpdatedDate}</span>
                      </div>
                    )}
                    <div className="meta-actions">
                      {hasFeature(FEATURES.FAVORITES) && (
                        <LikeButton
                          websiteId={website.id}
                          initialLiked={website.isLiked ?? false}
                          initialLikeCount={website.likeCount ?? 0}
                          onLikeChange={handleLikeChange}
                        />
                      )}
                      {hasFeature(FEATURES.FAVORITES) && (
                        <FavoriteButton
                          websiteId={website.id}
                          initialFavorited={website.isFavorited ?? false}
                          userId={isLoggedIn ? String(user?.id || '') : undefined}
                          onFavoriteChange={handleFavoriteChange}
                        />
                      )}
                    </div>
                  </div>

                  {isInteractiveHeroPreset && heroTabs.length > 1 && (
                    <div className="detail-hero__panel-tabs" role="tablist" aria-label="详情信息切换">
                      {heroTabs.map((tab) => (
                        <button
                          key={tab.key}
                          type="button"
                          role="tab"
                          aria-selected={activeHeroInfoTab === tab.key}
                          className={`detail-hero__panel-tab ${activeHeroInfoTab === tab.key ? 'is-active' : ''}`}
                          onClick={() => setHeroInfoTab(tab.key)}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>
                  )}

                  {(!isInteractiveHeroPreset || activeHeroInfoTab === 'summary') && (
                    <div className="article-subtitle detail-hero__summary">{website.description}</div>
                  )}

                  {(!isInteractiveHeroPreset || activeHeroInfoTab === 'data') && showDataPanel && (
                    <div className="detail-data-panel" aria-label={dataPanelTitle}>
                      <div className="detail-data-panel__header">
                        <span className="detail-data-panel__title">{dataPanelTitle}</span>
                      </div>
                      <div className="detail-data-panel__grid">
                        {websiteDataItems.map((item) => (
                          <div className="detail-data-panel__item" key={item.key}>
                            <span className="detail-data-panel__label">
                              <span>{item.label}</span>
                            </span>
                            <span className="detail-data-panel__value" title={item.value}>
                              {item.value}
                            </span>
                          </div>
                        ))}
                      </div>
                      {trafficSourceItems.length > 0 && (
                        <div className="detail-data-panel__sources" aria-label="来源渠道占比">
                          <div className="detail-data-panel__sources-title">来源渠道占比</div>
                          <div className="detail-data-panel__sources-list">
                            {trafficSourceItems.map((item) => (
                              <div className="detail-data-panel__source-row" key={item.key}>
                                <div className="detail-data-panel__source-head">
                                  <span>{item.label}</span>
                                  <span>{item.value.toFixed(2)}%</span>
                                </div>
                                <div className="detail-data-panel__source-track">
                                  <div
                                    className="detail-data-panel__source-bar"
                                    style={{ width: `${Math.min(Math.max(item.value, 0), 100)}%` }}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {isInteractiveHeroPreset && activeHeroInfoTab === 'tags' && (
                    <div className="detail-hero__tag-panel" aria-label="标签预览">
                      {heroTagPreview.length > 0 ? (
                        heroTagPreview.map((tag) => (
                          <Link
                            key={`hero-tag-${tag}`}
                            className="detail-hero__tag-pill"
                            to={`/search?q=${encodeURIComponent(tag)}`}
                          >
                            #{tag}
                          </Link>
                        ))
                      ) : (
                        <div className="detail-hero__tag-empty">暂无标签信息</div>
                      )}
                    </div>
                  )}

                  <div className="detail-hero__actions">
                    <a
                      href={website.url}
                      target={detailPageConfig.visitBtnNewWindow !== false ? '_blank' : '_self'}
                      rel={detailPageConfig.visitBtnNewWindow !== false ? 'noopener noreferrer' : undefined}
                      className="btn-visit-large"
                    >
                      {website.visitBtnText || '访问网站'}
                      <svg className="icon-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                        <polyline points="15 3 21 3 21 9"></polyline>
                        <line x1="10" y1="14" x2="21" y2="3"></line>
                      </svg>
                    </a>
                    <button
                      type="button"
                      className="btn-compare-launch"
                      onClick={() => {
                        setCompareTargetError(null);
                        setCompareCandidateTab('category');
                        setComparePickerOpen(true);
                      }}
                    >
                      发起对比
                    </button>
                  </div>
                </div>

                {heroPreviewImage && (
                  <div className="detail-hero__right">
                    <div className="detail-hero__preview-card">
                      <div className="detail-hero__preview-glow" aria-hidden="true" />
                      <button
                        type="button"
                        className="article-banner-frame detail-hero__frame"
                        onClick={() => openLightbox(-1)}
                        aria-label={`查看 ${website.name} 缩略图大图`}
                      >
                        <div className="article-banner-toolbar">
                          <div className="article-banner-dots" aria-hidden="true">
                            <span />
                            <span />
                            <span />
                          </div>
                          <div className="article-banner-domain" aria-label="预览标识">网站预览</div>
                          <div className="article-banner-badges">
                            <span className="article-banner-badge">Preview</span>
                            {!website.thumbnail && (
                              <span className="article-banner-badge article-banner-badge--muted">
                                自动截图
                              </span>
                            )}
                            {screenshots.length > 0 && (
                              <span className="article-banner-badge article-banner-badge--muted">
                                {screenshots.length} 张截图
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="article-banner-viewport detail-hero__viewport">
                          <img
                            src={heroPreviewImage}
                            alt={`${website.name} 预览`}
                            loading="lazy"
                            onError={handlePreviewImageError}
                          />
                        </div>
                      </button>

                      {heroGalleryScreenshots.length > 0 && (
                        <div className="detail-hero__thumb-slider">
                          <Swiper
                            modules={[Navigation]}
                            navigation
                            spaceBetween={10}
                            slidesPerView={3.2}
                            breakpoints={{
                              768: { slidesPerView: 3.2 },
                              1024: { slidesPerView: 4.2 }
                            }}
                            className="detail-hero__swiper"
                          >
                            {heroGalleryScreenshots.map((url, index) => (
                              <SwiperSlide key={`${url}-${index}`}>
                                <button
                                  type="button"
                                  className="detail-hero__thumb"
                                  onClick={() => openLightbox(index)}
                                  aria-label={`查看截图 ${index + 1}`}
                                >
                                  <img src={getFullImageUrl(url)} alt={`截图 ${index + 1}`} loading="lazy" />
                                  <span className="detail-hero__thumb-index">{index + 1}</span>
                                </button>
                              </SwiperSlide>
                            ))}
                          </Swiper>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </section>

            {detailPageConfig.detailTopAdEnabled && (
              <DetailCommercialSlot
                slotKey={String(detailPageConfig.detailTopAdSlotKey || 'detail_top')}
                className="detail-commercial-slot--top"
              />
            )}

            <div className="detail-body-layout">
              <div className="detail-body-main">

            {/* 正文内容 */}
            <div className="article-content">
              {website.detailContent ? (
                <div 
                  className="content-body"
                  dangerouslySetInnerHTML={{ __html: renderContent(website.detailContent) }}
                />
              ) : (
                <div className="content-body empty-content">
                  <p>暂无详细介绍，请直接访问网站体验。</p>
                </div>
              )}
            </div>

            {/* 标签 */}
            {allTags.length > 0 && (
              <div className="article-tags">
                {allTags.map((tag, index) => (
                  <span key={index} className="tag-item">#{tag}</span>
                ))}
              </div>
            )}

            {detailPageConfig.seoLongTailEnabled && seoLongTailKeywords.length > 0 && (
              <section className="article-section detail-seo-section detail-seo-section--keywords">
                <h3 className="section-title">{detailPageConfig.seoLongTailTitle || '相关搜索'}</h3>
                <div className="detail-seo-keywords">
                  {seoLongTailKeywords.map((keyword, index) => (
                    <Link
                      key={`${keyword}-${index}`}
                      className="detail-seo-keyword"
                      to={`/search?q=${encodeURIComponent(keyword)}`}
                    >
                      {keyword}
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {detailPageConfig.seoFaqEnabled && seoFaqItems.length > 0 && (
              <section className="article-section detail-seo-section detail-seo-section--faq">
                <h3 className="section-title">{detailPageConfig.seoFaqTitle || '常见问题'}</h3>
                <div className="detail-seo-faq-list">
                  {seoFaqItems.map((item, index) => (
                    <details key={`${item.question}-${index}`} className="detail-seo-faq-item">
                      <summary className="detail-seo-faq-question">{item.question}</summary>
                      <div className="detail-seo-faq-answer">{item.answer}</div>
                    </details>
                  ))}
                </div>
              </section>
            )}

            {detailPageConfig.detailInlineAdEnabled && (
              <DetailCommercialSlot
                slotKey={String(detailPageConfig.detailInlineAdSlotKey || 'detail_inline')}
                className="detail-commercial-slot--inline"
              />
            )}

            {/* 产品截图 */}
            {detailPageConfig.screenshotsEnabled !== false && screenshots.length > 0 && (
              <section className="article-section screenshots-section">
                <h3 className="section-title">产品截图</h3>
                <div className="screenshots-grid">
                  {screenshots.map((url, index) => (
                    <div 
                      key={index} 
                      className="screenshot-item"
                      data-index={index + 1}
                      onClick={() => openLightbox(index)}
                    >
                      <img src={getFullImageUrl(url)} alt={`截图 ${index + 1}`} loading="lazy" />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* 互动区域 */}
            <div className="article-interaction">
              {hasFeature(FEATURES.RATINGS) && (
                <div className="interaction-block">
                  <RatingWidget
                    websiteId={website.id}
                    averageRating={website.averageRating ?? null}
                    totalRatings={website.totalRatings ?? 0}
                    userRating={website.userRating ?? null}
                    userId={undefined}
                    onRatingChange={handleRatingChange}
                  />
                </div>
              )}
              
              {hasFeature(FEATURES.SHARING) && (
                <div className="interaction-block share-block">
                  <span className="share-label">分享：</span>
                  <ShareButtons
                    websiteId={website.id}
                    websiteName={website.name}
                    websiteDescription={website.description}
                    websiteUrl={website.url}
                  />
                </div>
              )}
            </div>

            {/* 评论区 */}
            {hasFeature(FEATURES.COMMENTS) && (
              <section className="article-comments">
                <CommentsSection
                  websiteId={website.id}
                  initialCount={website.commentsCount ?? 0}
                  userId={isLoggedIn ? String(user?.id || '') : undefined}
                  userName={String(user?.nickname || user?.username || '').trim() || undefined}
                />
              </section>
            )}

            {/* 版权和免责声明 */}
            {detailPageConfig && (detailPageConfig.disclaimerEnabled || detailPageConfig.copyrightEnabled) && (
              <footer className="article-footer">
                {detailPageConfig.copyrightEnabled && detailPageConfig.copyrightText && (
                  <p className="copyright-text">
                    {detailPageConfig.copyrightLink ? (
                      <a href={detailPageConfig.copyrightLink} target="_blank" rel="noopener noreferrer">
                        {detailPageConfig.copyrightText}
                      </a>
                    ) : (
                      detailPageConfig.copyrightText
                    )}
                  </p>
                )}
                {detailPageConfig.disclaimerEnabled && detailPageConfig.disclaimerText && (
                  <p className="disclaimer-text">{detailPageConfig.disclaimerText}</p>
                )}
                {detailPageConfig.reportEnabled && (
                  <div className="report-action">
                    <a 
                      href={detailPageConfig.reportEmail ? `mailto:${detailPageConfig.reportEmail}?subject=举报网站：${website.name}` : '#'}
                      className="btn-report"
                    >
                      {detailPageConfig.reportText || '举报问题'}
                    </a>
                  </div>
                )}
              </footer>
            )}

            {detailPageConfig.detailBottomAdEnabled && (
              <DetailCommercialSlot
                slotKey={String(detailPageConfig.detailBottomAdSlotKey || 'detail_bottom')}
                className="detail-commercial-slot--bottom"
              />
            )}

            {/* 底部相关推荐 (移动端显示) */}
            <div className="mobile-related">
              <RelatedWebsites 
                websites={relatedWebsites} 
                loading={relatedLoading}
              />
            </div>
              </div>

              {/* 侧边栏（放在主内容右侧，但位于 Hero 下方） */}
              <Sidebar
                websiteId={website.id}
                relatedWebsites={relatedWebsites}
                tags={website.tags || []}
                websiteTags={websiteTags}
                category={website.category}
                loading={relatedLoading}
              />
            </div>
          </article>
        </main>
      </div>

      {/* 图片灯箱 */}
      {lightboxOpen && (lightboxIndex === -1 ? (
        <div className="lightbox" onClick={() => setLightboxOpen(false)}>
          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            <button className="lightbox-close" onClick={() => setLightboxOpen(false)}>×</button>
            <img src={heroPreviewImage} alt={`${website.name} 预览`} onError={handlePreviewImageError} />
          </div>
        </div>
      ) : screenshots.length > 0 && (
        <div className="lightbox" onClick={() => setLightboxOpen(false)}>
          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            <button className="lightbox-close" onClick={() => setLightboxOpen(false)}>×</button>
            <img src={getFullImageUrl(screenshots[lightboxIndex])} alt={`截图 ${lightboxIndex + 1}`} />
            {screenshots.length > 1 && (
              <div className="lightbox-nav">
                <button 
                  className="lightbox-prev"
                  onClick={() => setLightboxIndex((lightboxIndex - 1 + screenshots.length) % screenshots.length)}
                >
                  ‹
                </button>
                <span className="lightbox-counter">{lightboxIndex + 1} / {screenshots.length}</span>
                <button 
                  className="lightbox-next"
                  onClick={() => setLightboxIndex((lightboxIndex + 1) % screenshots.length)}
                >
                  ›
                </button>
              </div>
            )}
          </div>
        </div>
      ))}

      {/* 发起对比选择层 */}
      {comparePickerOpen && (
        <div
          className="detail-compare-modal"
          role="dialog"
          aria-modal="true"
          aria-label="选择对比网站"
          onClick={() => setComparePickerOpen(false)}
        >
          <div
            className="detail-compare-modal__panel"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="detail-compare-modal__header">
              <div>
                <h3 className="detail-compare-modal__title">发起网站对比</h3>
                <p className="detail-compare-modal__desc">
                  当前网站：{website.name}。按分类或标签选择更适合做 SEO 对比页，也可手动输入目标网站 ID / slug。
                </p>
              </div>
              <button
                type="button"
                className="detail-compare-modal__close"
                onClick={() => setComparePickerOpen(false)}
                aria-label="关闭对比选择层"
              >
                ×
              </button>
            </div>

            {(compareCandidatesLoading || compareCategoryCandidates.length > 0 || compareTagCandidates.length > 0) && (
              <>
                <div className="detail-compare-modal__section">
                  <div className="detail-compare-modal__label">推荐候选</div>
                  <div className="detail-compare-modal__switches" role="tablist" aria-label="候选来源切换">
                    <button
                      type="button"
                      role="tab"
                      aria-selected={activeCompareCandidateTab === 'category'}
                      className={`detail-compare-modal__switch ${activeCompareCandidateTab === 'category' ? 'is-active' : ''}`}
                      onClick={() => setCompareCandidateTab('category')}
                    >
                      分类
                      <span className="detail-compare-modal__switch-count">{compareCategoryCandidates.length}</span>
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={activeCompareCandidateTab === 'tag'}
                      className={`detail-compare-modal__switch ${activeCompareCandidateTab === 'tag' ? 'is-active' : ''}`}
                      onClick={() => setCompareCandidateTab('tag')}
                    >
                      标签
                      <span className="detail-compare-modal__switch-count">{compareTagCandidates.length}</span>
                    </button>
                  </div>
                  <div className="detail-compare-modal__switch-hint">
                    {activeCompareCandidateTab === 'tag' ? '按标签推荐' : '按分类推荐'}
                  </div>
                  {compareCandidatesLoading && activeCompareCandidates.length === 0 ? (
                    <div className="detail-compare-modal__empty">
                      {activeCompareCandidateTab === 'tag' ? '正在加载标签候选...' : '正在加载分类候选...'}
                    </div>
                  ) : activeCompareCandidates.length > 0 ? (
                    <div className="detail-compare-modal__quick-list">
                      {activeCompareCandidates.slice(0, 8).map((site) => {
                        const targetIdentifier = site.slug || site.id;
                        const comparePath = buildWebsiteComparePath(currentCompareIdentifier, targetIdentifier);
                        return (
                          <button
                            key={`compare-${activeCompareCandidateTab}-${site.id}`}
                            type="button"
                            className="detail-compare-modal__quick-item"
                            onClick={() => handleStartCompare(targetIdentifier)}
                            disabled={!comparePath}
                          >
                            <WebsiteFavicon
                              websiteUrl={site.url}
                              iconUrl={site.iconUrl}
                              name={site.name}
                              size={26}
                            />
                            <span className="detail-compare-modal__quick-name">{site.name}</span>
                            <span className="detail-compare-modal__quick-action">对比</span>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="detail-compare-modal__empty">
                      {activeCompareCandidateTab === 'tag' ? '暂无同标签候选' : '暂无同分类候选'}
                    </div>
                  )}
                </div>
              </>
            )}

            <div className="detail-compare-modal__section">
              <div className="detail-compare-modal__label">手动输入目标网站</div>
              <div className="detail-compare-modal__manual-row">
                <input
                  type="text"
                  value={compareTargetInput}
                  onChange={(event) => {
                    setCompareTargetInput(event.target.value);
                    if (compareTargetError) setCompareTargetError(null);
                  }}
                  placeholder="输入网站 ID、slug，或粘贴 /website/xxx 链接"
                  className="detail-compare-modal__input"
                />
                <button
                  type="button"
                  className="detail-compare-modal__submit"
                  onClick={() => handleStartCompare(compareTargetInput)}
                >
                  开始对比
                </button>
              </div>
              {compareTargetError && (
                <div className="detail-compare-modal__error">{compareTargetError}</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WebsiteDetailPage;
