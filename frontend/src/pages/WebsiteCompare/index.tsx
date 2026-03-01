/**
 * @copyright Tomda (https://www.tomda.top)
 * @copyright UIED技术团队 (https://fsuied.com)
 * @author UIED技术团队
 * @createDate 2026-02-25
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AxiosError } from 'axios';
import { Link, useParams } from 'react-router-dom';
import SEO from '../../components/SEO';
import WebsiteFavicon from '../../components/WebsiteFavicon';
import api from '../../services/api';
import { unwrapApiList, unwrapApiResponse } from '../../utils/apiResponse';
import { getFullImageUrl } from '../../utils/urlUtils';
import './index.css';

interface CompareWebsiteDetail {
  id: string;
  name: string;
  slug?: string;
  description?: string;
  url: string;
  iconUrl?: string;
  thumbnail?: string;
  screenshots?: string[] | string;
  tags?: string[];
  commentsCount?: number;
  averageRating?: number | null;
  totalRatings?: number;
  createdAt?: string;
  updatedAt?: string;
  category?: {
    id?: string;
    name?: string;
    slug?: string;
    parent?: {
      id?: string;
      name?: string;
      slug?: string;
    } | null;
  };
}

interface CompareWebsiteTag {
  id: string;
  name: string;
  slug: string;
}

interface CompareState {
  detail: CompareWebsiteDetail | null;
  tags: CompareWebsiteTag[];
  loading: boolean;
  error: string | null;
}

interface CompareRelatedCandidate {
  id: string;
  name: string;
  slug?: string;
  description?: string;
  url?: string;
  iconUrl?: string;
}

interface CompareAiAnalysisResult {
  left?: {
    id?: string;
    name?: string;
    slug?: string;
  };
  right?: {
    id?: string;
    name?: string;
    slug?: string;
  };
  markdown?: string;
  reasoningContent?: string;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  } | null;
}

interface CompareAiAnalysisState {
  loading: boolean;
  error: string | null;
  data: CompareAiAnalysisResult | null;
}

/**
 * 解析 VS 路由参数，兼容两种形式：
 * 1. /vs/:left/:right
 * 2. /vs/:pair   (例如 a-vs-b)
 */
function resolveCompareParams(params: {
  leftIdOrSlug?: string;
  rightIdOrSlug?: string;
  pair?: string;
}): { left: string; right: string } {
  const left = String(params.leftIdOrSlug || '').trim();
  const right = String(params.rightIdOrSlug || '').trim();
  if (left && right) {
    return { left, right };
  }
  const pair = String(params.pair || '').trim();
  if (!pair) {
    return { left: '', right: '' };
  }
  const normalized = pair.replace(/\.html$/i, '');
  const splitIndex = normalized.indexOf('-vs-');
  if (splitIndex <= 0) {
    return { left: normalized, right: '' };
  }
  return {
    left: normalized.slice(0, splitIndex).trim(),
    right: normalized.slice(splitIndex + 4).trim(),
  };
}

/**
 * 构建对比页路径
 */
function buildComparePath(left: string, right: string): string {
  const leftId = String(left || '').trim();
  const rightId = String(right || '').trim();
  if (!leftId || !rightId || leftId === rightId) return '';
  return `/vs/${encodeURIComponent(leftId)}/${encodeURIComponent(rightId)}`;
}

/**
 * 规范化截图数组
 */
function normalizeScreenshots(value: CompareWebsiteDetail['screenshots']): string[] {
  if (Array.isArray(value)) {
    return value.filter(Boolean);
  }
  if (typeof value === 'string' && value.trim()) {
    return [ value.trim() ];
  }
  return [];
}

/**
 * 格式化日期
 */
function formatDateLabel(value?: string): string {
  if (!value) return '未知';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '未知';
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * 提取域名显示
 */
function getHostLabel(url?: string): string {
  if (!url) return '';
  try {
    return (new URL(url).hostname || '').replace(/^www\./i, '');
  } catch (error) {
    return '';
  }
}

/**
 * 获取协议显示
 */
function getProtocolLabel(url?: string): string {
  if (!url) return '未知';
  try {
    const protocol = new URL(url).protocol.toLowerCase();
    return protocol === 'https:' ? 'HTTPS' : protocol.replace(':', '').toUpperCase();
  } catch (error) {
    return '未知';
  }
}

/**
 * 缩略图兜底：优先上传图，否则使用 mShots 免费截图
 */
function getComparePreviewImage(detail: CompareWebsiteDetail | null): string {
  if (!detail) return '';
  if (detail.thumbnail) return getFullImageUrl(detail.thumbnail);
  try {
    const normalized = /^https?:\/\//i.test(detail.url) ? detail.url : `https://${detail.url}`;
    return `https://s0.wp.com/mshots/v1/${encodeURIComponent(normalized)}?w=1280`;
  } catch (error) {
    return '';
  }
}

/**
 * HTML 转义，避免直接渲染 AI 文本导致标签注入
 */
function escapeHtml(text: string): string {
  return String(text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * 将 AI 返回的 Markdown 做轻量渲染（无额外依赖）
 */
function renderAiMarkdown(content: string): string {
  const escaped = escapeHtml(content || '');
  if (!escaped.trim()) return '';
  return escaped
    .replace(/^###\s+(.+)$/gim, '<h4>$1</h4>')
    .replace(/^##\s+(.+)$/gim, '<h3>$1</h3>')
    .replace(/^#\s+(.+)$/gim, '<h2>$1</h2>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
    .replace(/^\s*-\s+(.+)$/gim, '<li>$1</li>')
    .replace(/(<li>.*<\/li>)/gims, '<ul>$1</ul>')
    .replace(/<\/ul>\s*<ul>/g, '')
    .replace(/\n{2,}/g, '</p><p>')
    .replace(/\n/g, '<br />')
    .replace(/^(?!<h\d|<ul|<p|<blockquote)([\s\S]+)$/m, '<p>$1</p>');
}

/**
 * 拉取某个网站的“同分类 + 同标签”候选，用于对比页内链
 */
async function fetchCompareRelatedCandidates(
  websiteId: string,
  excludeIds: string[]
): Promise<CompareRelatedCandidate[]> {
  if (!websiteId) return [];
  const [ categoryRes, tagRes ] = await Promise.allSettled([
    api.get(`/websites/${websiteId}/related`, { params: { mode: 'same_category', limit: 8 } }),
    api.get(`/websites/${websiteId}/related`, { params: { mode: 'same_tags', limit: 8 } }),
  ]);

  const rows: CompareRelatedCandidate[] = [];
  if (categoryRes.status === 'fulfilled') {
    rows.push(...unwrapApiList<CompareRelatedCandidate>(categoryRes.value.data));
  }
  if (tagRes.status === 'fulfilled') {
    rows.push(...unwrapApiList<CompareRelatedCandidate>(tagRes.value.data));
  }

  const excludeSet = new Set(excludeIds.map((id) => String(id)));
  const deduped: CompareRelatedCandidate[] = [];
  const seen = new Set<string>();
  rows.forEach((row) => {
    const id = String(row?.id || '');
    if (!id || excludeSet.has(id) || seen.has(id)) return;
    seen.add(id);
    deduped.push(row);
  });
  return deduped.slice(0, 10);
}

/**
 * 生成网站对比卡片的标签集合（详情 tags + 标签接口）
 */
function getCompareTagNames(detail: CompareWebsiteDetail | null, tags: CompareWebsiteTag[]): string[] {
  const fromDetail = Array.isArray(detail?.tags) ? detail?.tags || [] : [];
  const fromApi = Array.isArray(tags) ? tags.map(item => item.name) : [];
  return Array.from(new Set([ ...fromDetail, ...fromApi ].filter(Boolean))).slice(0, 10);
}

/**
 * 生成“优点”模板文案（SEO 内容块）
 */
function buildCompareStrengths(detail: CompareWebsiteDetail, tagNames: string[]): string[] {
  const result: string[] = [];
  if (detail.category?.name) {
    result.push(`定位清晰，属于「${detail.category.name}」方向，适合目标明确的用户快速筛选。`);
  }
  if (tagNames.length > 0) {
    result.push(`标签覆盖较完整（${tagNames.slice(0, 4).join('、')}），便于判断使用场景和功能方向。`);
  }
  if ((detail.totalRatings || 0) > 0) {
    result.push(`已有用户评分数据（${detail.totalRatings} 条），适合做初步参考。`);
  }
  if ((detail.commentsCount || 0) > 0) {
    result.push(`已有评论互动（${detail.commentsCount} 条），更容易看到真实使用反馈。`);
  }
  if (!result.length) {
    result.push('基础信息完整，适合先作为候选方案进行试用与对比。');
  }
  return result.slice(0, 4);
}

/**
 * 生成“注意点”模板文案（SEO 内容块）
 */
function buildCompareCautions(detail: CompareWebsiteDetail, tagNames: string[]): string[] {
  const result: string[] = [];
  if (tagNames.length === 0) {
    result.push('标签信息较少，建议结合截图与官网实际体验确认功能边界。');
  }
  if (!detail.description) {
    result.push('站点描述信息较少，建议直接访问官网查看功能说明和更新日志。');
  }
  if ((detail.totalRatings || 0) === 0) {
    result.push('暂无评分数据，适合通过实测体验或社区反馈进一步判断。');
  }
  if ((detail.commentsCount || 0) === 0) {
    result.push('暂无评论互动，建议查看官网文档或搜索社区讨论。');
  }
  if (!result.length) {
    result.push('建议重点对比实际功能、上手成本和长期使用稳定性，再决定是否长期使用。');
  }
  return result.slice(0, 4);
}

/**
 * 生成“适用人群”模板文案（SEO 内容块）
 */
function buildAudienceHints(detail: CompareWebsiteDetail, tagNames: string[]): string[] {
  const audience: string[] = [];
  if (detail.category?.name?.includes('AI')) {
    audience.push('适合关注 AI 工具效率提升的用户');
  }
  if (detail.category?.name?.includes('设计')) {
    audience.push('适合设计师、产品经理或创意从业者');
  }
  if (tagNames.some(tag => /UI|UX|设计系统/i.test(tag))) {
    audience.push('适合做界面设计、交互设计和设计规范沉淀');
  }
  if (tagNames.some(tag => /灵感|素材|图库|图标/i.test(tag))) {
    audience.push('适合做灵感收集、素材搜集与视觉参考');
  }
  if (!audience.length) {
    audience.push('适合作为同类工具/网站的备选方案进行对比试用');
  }
  return audience.slice(0, 4);
}

/**
 * 拉取单个网站详情 + 标签，用于对比页左右卡片
 */
async function fetchCompareWebsite(identifier: string): Promise<{ detail: CompareWebsiteDetail | null; tags: CompareWebsiteTag[] }> {
  if (!identifier) return { detail: null, tags: [] };
  const detailRes = await api.get(`/websites/${identifier}`);
  const detail = unwrapApiResponse<CompareWebsiteDetail | null>(detailRes.data, null);
  if (!detail) {
    return { detail: null, tags: [] };
  }
  let tags: CompareWebsiteTag[] = [];
  try {
    const tagsRes = await api.get(`/websites/${detail.id}/tags`);
    tags = unwrapApiList<CompareWebsiteTag>(tagsRes.data);
  } catch (error) {
    tags = [];
  }
  return { detail, tags };
}

/**
 * 拉取网站对比 AI 分析结果（需要商业版 AI 能力）
 */
async function fetchCompareAiAnalysis(leftIdOrSlug: string, rightIdOrSlug: string): Promise<CompareAiAnalysisResult> {
  const response = await api.post('/compare/websites/ai-analysis', {
    leftIdOrSlug,
    rightIdOrSlug,
  }, {
    // AI 对比分析可能超过默认 10 秒，单独放宽超时
    timeout: 90000,
  });
  return unwrapApiResponse<CompareAiAnalysisResult>(response.data, {});
}

/**
 * 对比页主组件
 */
const WebsiteComparePage: React.FC = () => {
  const params = useParams<{
    leftIdOrSlug?: string;
    rightIdOrSlug?: string;
    pair?: string;
  }>();
  const { left, right } = resolveCompareParams(params);

  const [leftState, setLeftState] = useState<CompareState>({
    detail: null,
    tags: [],
    loading: true,
    error: null,
  });
  const [rightState, setRightState] = useState<CompareState>({
    detail: null,
    tags: [],
    loading: true,
    error: null,
  });
  const [leftMoreCandidates, setLeftMoreCandidates] = useState<CompareRelatedCandidate[]>([]);
  const [rightMoreCandidates, setRightMoreCandidates] = useState<CompareRelatedCandidate[]>([]);
  const [moreCandidatesLoading, setMoreCandidatesLoading] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<CompareAiAnalysisState>({
    loading: false,
    error: null,
    data: null,
  });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [left, right]);

  /**
   * 切换对比对象时重置 AI 分析结果，避免串内容
   */
  useEffect(() => {
    setAiAnalysis({
      loading: false,
      error: null,
      data: null,
    });
  }, [left, right]);

  /**
   * 拉取左右对比对象的数据
   */
  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (!left || !right) {
        setLeftState(prev => ({ ...prev, loading: false, error: '对比参数不完整' }));
        setRightState(prev => ({ ...prev, loading: false, error: '对比参数不完整' }));
        return;
      }
      setLeftState({ detail: null, tags: [], loading: true, error: null });
      setRightState({ detail: null, tags: [], loading: true, error: null });

      const [ leftResult, rightResult ] = await Promise.allSettled([
        fetchCompareWebsite(left),
        fetchCompareWebsite(right),
      ]);

      if (cancelled) return;

      if (leftResult.status === 'fulfilled') {
        setLeftState({ ...leftResult.value, loading: false, error: leftResult.value.detail ? null : '左侧网站不存在' });
      } else {
        const error = leftResult.reason as AxiosError<{ message?: string; error?: string }>;
        setLeftState({
          detail: null,
          tags: [],
          loading: false,
          error: error.response?.data?.message || error.response?.data?.error || error.message || '左侧网站加载失败',
        });
      }

      if (rightResult.status === 'fulfilled') {
        setRightState({ ...rightResult.value, loading: false, error: rightResult.value.detail ? null : '右侧网站不存在' });
      } else {
        const error = rightResult.reason as AxiosError<{ message?: string; error?: string }>;
        setRightState({
          detail: null,
          tags: [],
          loading: false,
          error: error.response?.data?.message || error.response?.data?.error || error.message || '右侧网站加载失败',
        });
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [left, right]);

  /**
   * 拉取左右网站的更多候选对比列表（同分类 + 同标签），用于 SEO 内链扩展
   */
  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (!leftState.detail?.id || !rightState.detail?.id) {
        setLeftMoreCandidates([]);
        setRightMoreCandidates([]);
        return;
      }

      setMoreCandidatesLoading(true);
      try {
        const excludeIds = [ String(leftState.detail.id), String(rightState.detail.id) ];
        const [ leftCandidates, rightCandidates ] = await Promise.all([
          fetchCompareRelatedCandidates(String(leftState.detail.id), excludeIds),
          fetchCompareRelatedCandidates(String(rightState.detail.id), excludeIds),
        ]);
        if (cancelled) return;
        setLeftMoreCandidates(leftCandidates);
        setRightMoreCandidates(rightCandidates);
      } catch (error) {
        if (!cancelled) {
          setLeftMoreCandidates([]);
          setRightMoreCandidates([]);
        }
      } finally {
        if (!cancelled) {
          setMoreCandidatesLoading(false);
        }
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [leftState.detail?.id, rightState.detail?.id]);

  const loading = leftState.loading || rightState.loading;
  const leftWebsite = leftState.detail;
  const rightWebsite = rightState.detail;

  /**
   * 触发 AI 对比分析（手动触发，避免页面首开直接消耗调用）
   */
  const handleGenerateAiAnalysis = useCallback(async () => {
    const leftIdentifier = String(leftWebsite?.slug || leftWebsite?.id || '').trim();
    const rightIdentifier = String(rightWebsite?.slug || rightWebsite?.id || '').trim();
    if (!leftIdentifier || !rightIdentifier) {
      setAiAnalysis({
        loading: false,
        error: '缺少对比网站信息，无法生成 AI 分析',
        data: null,
      });
      return;
    }

    setAiAnalysis(prev => ({
      ...prev,
      loading: true,
      error: null,
    }));

    try {
      const data = await fetchCompareAiAnalysis(leftIdentifier, rightIdentifier);
      setAiAnalysis({
        loading: false,
        error: (data?.markdown || data?.reasoningContent) ? null : 'AI 未返回有效内容，请稍后重试',
        data,
      });
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string; error?: string; data?: { featureKey?: string; edition?: string } }>;
      const status = Number(axiosError.response?.status || 0);
      let message = axiosError.response?.data?.message || axiosError.response?.data?.error || axiosError.message || '生成 AI 分析失败';
      if (status === 403) {
        const featureKey = String(axiosError.response?.data?.data?.featureKey || 'ai_assistant');
        message = `当前版本未授权 AI 分析能力（${featureKey}）`;
      }
      setAiAnalysis({
        loading: false,
        error: message,
        data: null,
      });
    }
  }, [leftWebsite?.id, leftWebsite?.slug, rightWebsite?.id, rightWebsite?.slug]);

  /**
   * 生成对比页 SEO 标题与描述
   */
  const seoMeta = useMemo(() => {
    const leftName = leftWebsite?.name || '左侧网站';
    const rightName = rightWebsite?.name || '右侧网站';
    const title = `${leftName} 和 ${rightName} 哪个好？有什么区别和优缺点？`;
    const description = `对比 ${leftName} 和 ${rightName} 的基础信息、分类、标签、截图与更新时间，帮助你更快判断哪个网站更适合你的使用场景。`;
    return { title, description };
  }, [leftWebsite?.name, rightWebsite?.name]);

  /**
   * 生成对比表格数据项
   */
  const compareRows = useMemo(() => {
    const leftTags = getCompareTagNames(leftState.detail, leftState.tags).slice(0, 8);
    const rightTags = getCompareTagNames(rightState.detail, rightState.tags).slice(0, 8);
    return [
      {
        label: '分类',
        left: leftWebsite?.category?.name || '未分类',
        right: rightWebsite?.category?.name || '未分类',
      },
      {
        label: '域名',
        left: getHostLabel(leftWebsite?.url),
        right: getHostLabel(rightWebsite?.url),
      },
      {
        label: '协议',
        left: getProtocolLabel(leftWebsite?.url),
        right: getProtocolLabel(rightWebsite?.url),
      },
      {
        label: '标签数量',
        left: `${leftTags.length}`,
        right: `${rightTags.length}`,
      },
      {
        label: '截图数量',
        left: `${normalizeScreenshots(leftWebsite?.screenshots).length}`,
        right: `${normalizeScreenshots(rightWebsite?.screenshots).length}`,
      },
      {
        label: '评论数',
        left: `${leftWebsite?.commentsCount || 0}`,
        right: `${rightWebsite?.commentsCount || 0}`,
      },
      {
        label: '评分人数',
        left: `${leftWebsite?.totalRatings || 0}`,
        right: `${rightWebsite?.totalRatings || 0}`,
      },
      {
        label: '最近更新',
        left: formatDateLabel(leftWebsite?.updatedAt || leftWebsite?.createdAt),
        right: formatDateLabel(rightWebsite?.updatedAt || rightWebsite?.createdAt),
      },
    ];
  }, [leftState, rightState, leftWebsite, rightWebsite]);

  /**
   * 对比页 FAQ（SEO 文案）
   */
  const compareFaqItems = useMemo(() => {
    if (!leftWebsite || !rightWebsite) return [];
    const leftName = leftWebsite.name;
    const rightName = rightWebsite.name;
    return [
      {
        q: `${leftName} 和 ${rightName} 哪个更适合新手？`,
        a: `建议先从功能定位、界面复杂度和你的使用目标来判断。你可以重点看本页的分类、标签、截图和更新时间对比，再点击访问官网实际体验。`,
      },
      {
        q: `${leftName} 和 ${rightName} 的主要区别是什么？`,
        a: `通常差异会体现在功能定位、内容风格、更新频率与使用门槛上。本页通过基础信息、标签与截图对比帮助你快速判断。`,
      },
      {
        q: `怎么选择 ${leftName} 或 ${rightName}？`,
        a: `如果你更看重某一类功能或场景，优先选择标签和分类更匹配的站点；如果你追求稳定性和长期使用，建议优先看更新频率和实际体验。`,
      },
    ];
  }, [leftWebsite, rightWebsite]);

  /**
   * 对比页“优缺点/适用人群/选择建议”内容（模板生成）
   */
  const compareGuide = useMemo(() => {
    if (!leftWebsite || !rightWebsite) {
      return null;
    }
    const leftTags = getCompareTagNames(leftWebsite, leftState.tags);
    const rightTags = getCompareTagNames(rightWebsite, rightState.tags);
    const leftStrengths = buildCompareStrengths(leftWebsite, leftTags);
    const rightStrengths = buildCompareStrengths(rightWebsite, rightTags);
    const leftCautions = buildCompareCautions(leftWebsite, leftTags);
    const rightCautions = buildCompareCautions(rightWebsite, rightTags);
    const leftAudience = buildAudienceHints(leftWebsite, leftTags);
    const rightAudience = buildAudienceHints(rightWebsite, rightTags);

    const leftScore = (leftWebsite.totalRatings || 0) + (leftWebsite.commentsCount || 0) + leftTags.length;
    const rightScore = (rightWebsite.totalRatings || 0) + (rightWebsite.commentsCount || 0) + rightTags.length;
    const recommendation = leftScore === rightScore
      ? `两者公开信息量接近，建议优先根据具体功能场景和实际体验来决策。`
      : (leftScore > rightScore
        ? `从当前收录信息完整度看，${leftWebsite.name} 的公开信息更丰富，适合先作为优先试用方案。`
        : `从当前收录信息完整度看，${rightWebsite.name} 的公开信息更丰富，适合先作为优先试用方案。`);

    return {
      leftStrengths,
      rightStrengths,
      leftCautions,
      rightCautions,
      leftAudience,
      rightAudience,
      recommendation,
    };
  }, [leftWebsite, rightWebsite, leftState.tags, rightState.tags]);

  /**
   * 对比页结构化数据（FAQ + WebPage）
   */
  const schemaBlocks = useMemo(() => {
    if (!leftWebsite || !rightWebsite) return [];
    const canonicalUrl = `https://hao.uied.cn/vs/${leftWebsite.slug || leftWebsite.id}/${rightWebsite.slug || rightWebsite.id}`;
    return [
      {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: seoMeta.title,
        description: seoMeta.description,
        url: canonicalUrl,
        inLanguage: 'zh-CN',
      },
      {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: compareFaqItems.map(item => ({
          '@type': 'Question',
          name: item.q,
          acceptedAnswer: {
            '@type': 'Answer',
            text: item.a,
          },
        })),
      },
    ];
  }, [leftWebsite, rightWebsite, seoMeta.title, seoMeta.description, compareFaqItems]);

  /**
   * 预渲染 AI 分析 Markdown，减少 JSX 中重复处理
   */
  const aiAnalysisHtml = useMemo(() => {
    return renderAiMarkdown(String(aiAnalysis.data?.markdown || ''));
  }, [aiAnalysis.data?.markdown]);

  /**
   * 预渲染 AI 推理过程（如果模型返回 reasoning_content）
   */
  const aiReasoningHtml = useMemo(() => {
    return renderAiMarkdown(String(aiAnalysis.data?.reasoningContent || ''));
  }, [aiAnalysis.data?.reasoningContent]);

  if (loading) {
    return (
      <div className="website-compare-page">
        <div className="website-compare-loading">对比数据加载中...</div>
      </div>
    );
  }

  if (!leftWebsite || !rightWebsite) {
    return (
      <div className="website-compare-page">
        <div className="website-compare-error">
          <h2>对比页面加载失败</h2>
          <p>{leftState.error || rightState.error || '请检查对比参数是否正确'}</p>
          <Link to="/" className="website-compare-back">返回首页</Link>
        </div>
      </div>
    );
  }

  const leftTags = getCompareTagNames(leftState.detail, leftState.tags);
  const rightTags = getCompareTagNames(rightState.detail, rightState.tags);
  const leftPreview = getComparePreviewImage(leftWebsite);
  const rightPreview = getComparePreviewImage(rightWebsite);

  return (
    <div className="website-compare-page">
      <SEO
        title={seoMeta.title}
        description={seoMeta.description}
        keywords={`${leftWebsite.name},${rightWebsite.name},网站对比,${leftTags.concat(rightTags).slice(0, 8).join(',')}`}
        type="article"
        url={`https://hao.uied.cn/vs/${leftWebsite.slug || leftWebsite.id}/${rightWebsite.slug || rightWebsite.id}`}
      />
      {schemaBlocks.map((block, index) => (
        <script
          key={`compare-schema-${index}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(block) }}
        />
      ))}

      <div className="website-compare-container">
        <header className="website-compare-hero">
          <h1 className="website-compare-title">{seoMeta.title}</h1>
          <p className="website-compare-desc">{seoMeta.description}</p>
        </header>

        <section className="website-compare-cards">
          <article className="website-compare-card">
            <div className="website-compare-card__head">
              <div className="website-compare-card__brand">
                <WebsiteFavicon websiteUrl={leftWebsite.url} iconUrl={leftWebsite.iconUrl} name={leftWebsite.name} size={44} />
                <div>
                  <h2>{leftWebsite.name}</h2>
                  <p>{leftWebsite.description || '暂无描述信息'}</p>
                </div>
              </div>
              <Link className="website-compare-card__link" to={`/website/${leftWebsite.slug || leftWebsite.id}`}>
                查看详情
              </Link>
            </div>
            {leftPreview && (
              <div className="website-compare-card__preview">
                <img src={leftPreview} alt={`${leftWebsite.name} 缩略图`} loading="lazy" />
              </div>
            )}
            <div className="website-compare-card__tags">
              {leftTags.length > 0 ? leftTags.map(tag => (
                <Link key={tag} to={`/search?q=${encodeURIComponent(tag)}`} className="website-compare-tag">
                  {tag}
                </Link>
              )) : <span className="website-compare-tag website-compare-tag--muted">暂无标签</span>}
            </div>
          </article>

          <article className="website-compare-card">
            <div className="website-compare-card__head">
              <div className="website-compare-card__brand">
                <WebsiteFavicon websiteUrl={rightWebsite.url} iconUrl={rightWebsite.iconUrl} name={rightWebsite.name} size={44} />
                <div>
                  <h2>{rightWebsite.name}</h2>
                  <p>{rightWebsite.description || '暂无描述信息'}</p>
                </div>
              </div>
              <Link className="website-compare-card__link" to={`/website/${rightWebsite.slug || rightWebsite.id}`}>
                查看详情
              </Link>
            </div>
            {rightPreview && (
              <div className="website-compare-card__preview">
                <img src={rightPreview} alt={`${rightWebsite.name} 缩略图`} loading="lazy" />
              </div>
            )}
            <div className="website-compare-card__tags">
              {rightTags.length > 0 ? rightTags.map(tag => (
                <Link key={tag} to={`/search?q=${encodeURIComponent(tag)}`} className="website-compare-tag">
                  {tag}
                </Link>
              )) : <span className="website-compare-tag website-compare-tag--muted">暂无标签</span>}
            </div>
          </article>
        </section>

        <section className="website-compare-table-wrap">
          <h3 className="website-compare-section-title">核心差异对比</h3>
          <div className="website-compare-table">
            <div className="website-compare-table__head">
              <div>{leftWebsite.name}</div>
              <div>对比项</div>
              <div>{rightWebsite.name}</div>
            </div>
            {compareRows.map((row) => (
              <div className="website-compare-table__row" key={row.label}>
                <div title={row.left}>{row.left || '—'}</div>
                <div className="website-compare-table__label">{row.label}</div>
                <div title={row.right}>{row.right || '—'}</div>
              </div>
            ))}
          </div>
        </section>

        {compareGuide && (
          <section className="website-compare-guide">
            <h3 className="website-compare-section-title">优缺点速览与适用人群</h3>

            <div className="website-compare-guide__recommendation">
              <div className="website-compare-guide__recommendation-label">选择建议</div>
              <p>{compareGuide.recommendation}</p>
            </div>

            <div className="website-compare-guide__grid">
              <div className="website-compare-guide__card">
                <h4>{leftWebsite.name} 优点</h4>
                <ul>
                  {compareGuide.leftStrengths.map((item, index) => <li key={`ls-${index}`}>{item}</li>)}
                </ul>
                <h5>适用人群</h5>
                <ul>
                  {compareGuide.leftAudience.map((item, index) => <li key={`la-${index}`}>{item}</li>)}
                </ul>
                <h5>注意点</h5>
                <ul>
                  {compareGuide.leftCautions.map((item, index) => <li key={`lc-${index}`}>{item}</li>)}
                </ul>
              </div>

              <div className="website-compare-guide__card">
                <h4>{rightWebsite.name} 优点</h4>
                <ul>
                  {compareGuide.rightStrengths.map((item, index) => <li key={`rs-${index}`}>{item}</li>)}
                </ul>
                <h5>适用人群</h5>
                <ul>
                  {compareGuide.rightAudience.map((item, index) => <li key={`ra-${index}`}>{item}</li>)}
                </ul>
                <h5>注意点</h5>
                <ul>
                  {compareGuide.rightCautions.map((item, index) => <li key={`rc-${index}`}>{item}</li>)}
                </ul>
              </div>
            </div>
          </section>
        )}

        <section className="website-compare-ai">
          <div className="website-compare-ai__header">
            <div>
              <h3 className="website-compare-section-title">AI 分析对比（可选）</h3>
              <p className="website-compare-ai__desc">
                基于当前公开信息生成对比结论、适用人群与选择建议。未授权 AI 功能时会显示升级提示。
              </p>
            </div>
            <button
              type="button"
              className="website-compare-ai__action"
              onClick={handleGenerateAiAnalysis}
              disabled={aiAnalysis.loading}
            >
              {aiAnalysis.loading ? '生成中...' : aiAnalysis.data?.markdown ? '重新生成' : '生成 AI 分析'}
            </button>
          </div>

          {aiAnalysis.error && (
            <div className="website-compare-ai__error">{aiAnalysis.error}</div>
          )}

          {aiAnalysis.loading && (
            <div className="website-compare-ai__loading">AI 正在分析两个网站的公开信息，请稍候...</div>
          )}

          {!aiAnalysis.loading && aiAnalysisHtml && (
            <div className="website-compare-ai__content">
              <div
                className="website-compare-ai__markdown"
                dangerouslySetInnerHTML={{ __html: aiAnalysisHtml }}
              />

              {aiAnalysis.data?.usage && (
                <div className="website-compare-ai__usage">
                  Tokens：{Number(aiAnalysis.data.usage.totalTokens || 0)}（Prompt {Number(aiAnalysis.data.usage.promptTokens || 0)} / Completion {Number(aiAnalysis.data.usage.completionTokens || 0)}）
                </div>
              )}

              {aiReasoningHtml && (
                <details className="website-compare-ai__reasoning">
                  <summary>查看推理过程（如果模型支持）</summary>
                  <div
                    className="website-compare-ai__reasoning-body"
                    dangerouslySetInnerHTML={{ __html: aiReasoningHtml }}
                  />
                </details>
              )}
            </div>
          )}
        </section>

        <section className="website-compare-faq">
          <h3 className="website-compare-section-title">常见问题</h3>
          <div className="website-compare-faq__list">
            {compareFaqItems.map((item, index) => (
              <details className="website-compare-faq__item" key={`${item.q}-${index}`} open={index === 0}>
                <summary>{item.q}</summary>
                <div>{item.a}</div>
              </details>
            ))}
          </div>
        </section>

        <section className="website-compare-more">
          <div className="website-compare-more__header">
            <h3 className="website-compare-section-title">更多候选对比（内链）</h3>
            <p>基于分类与标签自动推荐，持续扩展对比页覆盖的长尾词。</p>
          </div>

          <div className="website-compare-more__grid">
            <div className="website-compare-more__column">
              <div className="website-compare-more__column-title">继续对比 {leftWebsite.name}</div>
              {moreCandidatesLoading && leftMoreCandidates.length === 0 ? (
                <div className="website-compare-more__empty">加载候选中...</div>
              ) : leftMoreCandidates.length > 0 ? (
                <div className="website-compare-more__list">
                  {leftMoreCandidates.map((candidate) => {
                    const comparePath = buildComparePath(
                      String(leftWebsite.slug || leftWebsite.id),
                      String(candidate.slug || candidate.id)
                    );
                    if (!comparePath) return null;
                    return (
                      <Link key={`left-candidate-${candidate.id}`} className="website-compare-more__item" to={comparePath}>
                        <WebsiteFavicon
                          websiteUrl={candidate.url}
                          iconUrl={candidate.iconUrl}
                          name={candidate.name}
                          size={28}
                        />
                        <div className="website-compare-more__item-text">
                          <div className="website-compare-more__item-name">{leftWebsite.name} vs {candidate.name}</div>
                          <div className="website-compare-more__item-desc">
                            {candidate.description || '查看与当前网站的差异、优缺点和适用场景'}
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div className="website-compare-more__empty">暂无候选对比</div>
              )}
            </div>

            <div className="website-compare-more__column">
              <div className="website-compare-more__column-title">继续对比 {rightWebsite.name}</div>
              {moreCandidatesLoading && rightMoreCandidates.length === 0 ? (
                <div className="website-compare-more__empty">加载候选中...</div>
              ) : rightMoreCandidates.length > 0 ? (
                <div className="website-compare-more__list">
                  {rightMoreCandidates.map((candidate) => {
                    const comparePath = buildComparePath(
                      String(rightWebsite.slug || rightWebsite.id),
                      String(candidate.slug || candidate.id)
                    );
                    if (!comparePath) return null;
                    return (
                      <Link key={`right-candidate-${candidate.id}`} className="website-compare-more__item" to={comparePath}>
                        <WebsiteFavicon
                          websiteUrl={candidate.url}
                          iconUrl={candidate.iconUrl}
                          name={candidate.name}
                          size={28}
                        />
                        <div className="website-compare-more__item-text">
                          <div className="website-compare-more__item-name">{rightWebsite.name} vs {candidate.name}</div>
                          <div className="website-compare-more__item-desc">
                            {candidate.description || '查看与当前网站的差异、优缺点和适用场景'}
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div className="website-compare-more__empty">暂无候选对比</div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default WebsiteComparePage;
