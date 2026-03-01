/**
 * @copyright Tomda (https://www.tomda.top)
 * @copyright UIED技术团队 (https://fsuied.com)
 * @author UIED技术团队
 * @createDate 2026-02-26
 */
/**
 * @file pages/Rankings/index.tsx
 * @description 榜单系统页面（指标/周期标签切换版）
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import SEO from '../../components/SEO';
import { getRankingsAggregate } from '../../services/rankingService';
import type { RankingBoardData, RankingPublicConfig, RankedWebsite } from '../../types/ranking';
import { getFullImageUrl } from '../../utils/urlUtils';
import './index.css';

type MetricTab = 'visit' | 'favorite' | 'like';
type PeriodTab = 'day' | 'week' | 'month';

const METRIC_TABS: Array<{ key: MetricTab; label: string }> = [
  { key: 'visit', label: '访问量' },
  { key: 'favorite', label: '收藏量' },
  { key: 'like', label: '点赞量' },
];

const PERIOD_TABS: Array<{ key: PeriodTab; label: string }> = [
  { key: 'day', label: '每日' },
  { key: 'week', label: '每周' },
  { key: 'month', label: '每月' },
];

/**
 * 获取榜单项详情页链接
 * @param item 榜单项
 * @returns 详情页链接
 */
function getWebsiteDetailLink(item: RankedWebsite): string {
  const slug = String((item as any).slug || '').trim();
  const id = Number((item as any).id || (item as any).websiteId || 0);
  if (slug) return `/website/${slug}`;
  if (id > 0) return `/website/${id}`;
  return String((item as any).url || '#');
}

/**
 * 获取榜单项图标
 * @param item 榜单项
 * @returns 图标URL
 */
function getWebsiteIcon(item: RankedWebsite): string {
  const icon = String((item as any).iconUrl || (item as any).icon || '').trim();
  if (icon) return getFullImageUrl(icon);
  const siteUrl = String((item as any).url || '').trim();
  if (!siteUrl) return '';
  try {
    const hostname = new URL(siteUrl).hostname;
    if (!hostname) return '';
    return `https://www.google.com/s2/favicons?sz=64&domain_url=${encodeURIComponent(hostname)}`;
  } catch (error) {
    return '';
  }
}

/**
 * 推断榜单指标标签（兼容旧后端未返回 extra 的情况）
 * @param board 榜单数据
 * @returns 指标标识
 */
function resolveBoardMetric(board: RankingBoardData): string {
  const metric = String(board.metric || board.extra?.metric || '').trim().toLowerCase();
  if (metric) return metric;
  const key = String(board.key || board.boardKey || '').toLowerCase();
  if (key.includes('favorite')) return 'favorite';
  if (key.includes('like')) return 'like';
  if (key.includes('visit') || key.includes('hot') || key.includes('rising')) return 'visit';
  return 'curated';
}

/**
 * 推断榜单周期标签（兼容旧后端未返回 extra 的情况）
 * @param board 榜单数据
 * @returns 周期标识
 */
function resolveBoardPeriod(board: RankingBoardData): string {
  const period = String(board.period || board.extra?.period || '').trim().toLowerCase();
  if (period) return period;
  const key = String(board.key || board.boardKey || '').toLowerCase();
  if (key.includes('daily')) return 'day';
  if (key.includes('weekly') || key.includes('seven_day')) return 'week';
  if (key.includes('monthly')) return 'month';
  return 'all';
}

/**
 * 排序值
 * @param board 榜单数据
 * @returns 排序值
 */
function getBoardSort(board: RankingBoardData): number {
  return Number((board as any).sort || 0);
}

/**
 * 榜单系统页面组件
 */
const RankingsPage: React.FC = () => {
  const [boards, setBoards] = useState<RankingBoardData[]>([]);
  const [publicConfig, setPublicConfig] = useState<RankingPublicConfig | null>(null);
  const [activeMetric, setActiveMetric] = useState<MetricTab>('visit');
  const [activePeriod, setActivePeriod] = useState<PeriodTab>('day');
  const [activeOpsBoardKey, setActiveOpsBoardKey] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * 拉取榜单系统聚合数据
   */
  const fetchBoards = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getRankingsAggregate(20);
      const list = Array.isArray(data?.boards) ? data.boards.filter((item) => Array.isArray(item.items)) : [];
      setBoards(list);
      setPublicConfig(data?.publicConfig || null);

      if (!list.length) {
        setActiveOpsBoardKey('');
        setError('暂无可展示榜单，请在后台“运营管理 -> 榜单系统”开启并配置榜单。');
        return;
      }
    } catch (e) {
      console.error('加载榜单系统失败:', e);
      setBoards([]);
      setError('榜单数据加载失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBoards();
  }, [fetchBoards]);

  /**
   * 根据后台公共配置初始化默认标签
   */
  useEffect(() => {
    const metric = String(publicConfig?.defaultMetric || '').trim().toLowerCase();
    const period = String(publicConfig?.defaultPeriod || '').trim().toLowerCase();
    if ([ 'visit', 'favorite', 'like' ].includes(metric)) {
      setActiveMetric(metric as MetricTab);
    }
    if ([ 'day', 'week', 'month' ].includes(period)) {
      setActivePeriod(period as PeriodTab);
    }
  }, [publicConfig?.defaultMetric, publicConfig?.defaultPeriod]);

  const metricBoards = useMemo(() => {
    const maxVisible = Math.max(1, Math.min(Number(publicConfig?.maxVisibleBoards || 12), 30));
    return boards
      .filter((board) => {
        const metric = resolveBoardMetric(board);
        const period = resolveBoardPeriod(board);
        const showOnRankingsPage = board.extra?.showOnRankingsPage !== false;
        const placementsRaw = board.extra?.displayPlacements;
        const placements: string[] = Array.isArray(placementsRaw) ? placementsRaw : [];
        const canShow = placements.length === 0 || placements.includes('rankings_page');
        return showOnRankingsPage && canShow && [ 'visit', 'favorite', 'like' ].includes(metric) && [ 'day', 'week', 'month' ].includes(period);
      })
      .sort((a, b) => getBoardSort(a) - getBoardSort(b))
      .slice(0, maxVisible);
  }, [boards, publicConfig?.maxVisibleBoards]);

  const operationsBoards = useMemo(() => {
    return boards
      .filter((board) => {
        const metric = resolveBoardMetric(board);
        const showOnRankingsPage = board.extra?.showOnRankingsPage !== false;
        const placementsRaw = board.extra?.displayPlacements;
        const placements: string[] = Array.isArray(placementsRaw) ? placementsRaw : [];
        const canShow = placements.length === 0 || placements.includes('rankings_page');
        return showOnRankingsPage && canShow && ![ 'favorite', 'like' ].includes(metric) && !(metric === 'visit' && [ 'day', 'week', 'month' ].includes(resolveBoardPeriod(board)));
      })
      .sort((a, b) => getBoardSort(a) - getBoardSort(b));
  }, [boards]);

  const activeMetricBoard = useMemo(() => {
    const candidate = metricBoards.find((board) => resolveBoardMetric(board) === activeMetric && resolveBoardPeriod(board) === activePeriod);
    return candidate || metricBoards.find((board) => resolveBoardMetric(board) === activeMetric) || metricBoards[0];
  }, [metricBoards, activeMetric, activePeriod]);

  const activeOpsBoard = useMemo(() => {
    if (!operationsBoards.length) return null;
    return operationsBoards.find((board) => String(board.key || board.boardKey) === activeOpsBoardKey) || operationsBoards[0];
  }, [operationsBoards, activeOpsBoardKey]);

  useEffect(() => {
    if (!operationsBoards.length) {
      setActiveOpsBoardKey('');
      return;
    }
    setActiveOpsBoardKey((prev) => {
      if (prev && operationsBoards.some((board) => String(board.key || board.boardKey) === prev)) return prev;
      return String(operationsBoards[0].key || operationsBoards[0].boardKey || '');
    });
  }, [operationsBoards]);

  const pageTitle = String(publicConfig?.displayLabel || '').trim() || '榜单系统';

  /**
   * 渲染榜单卡片列表
   * @param board 榜单数据
   * @returns React 节点
   */
  const renderBoardList = (board: RankingBoardData | null | undefined) => {
    if (!board) {
      return <div className="rankings-page__state">暂无可展示榜单</div>;
    }

    return (
      <section className="rankings-page__board">
        <header className="rankings-page__board-header">
          <div>
            <h2>{board.title || board.boardName || board.key || board.boardKey}</h2>
            <p>{board.description || '按后台配置规则生成的榜单内容'}</p>
          </div>
          <div className="rankings-page__board-count">
            共 {Array.isArray(board.items) ? board.items.length : 0} 条
          </div>
        </header>

        <div className="rankings-page__list">
          {(board.items || []).map((item, index) => {
            const iconUrl = getWebsiteIcon(item);
            const detailLink = getWebsiteDetailLink(item);
            const siteUrl = String((item as any).url || '').trim();
            const name = String((item as any).name || (item as any).title || '未命名网站');
            const desc = String((item as any).description || '').trim();
            const category = String((item as any).category || '').trim();
            const score = Number((item as any).score || 0);
            const clickCount = Number((item as any).clickCount || 0);
            return (
              <article
                key={`${String(board.key || board.boardKey)}-${(item as any).id || name}-${index}`}
                className={`rankings-page__item ${index === 0 ? 'is-featured' : ''}`}
              >
                <div className={`rankings-page__rank ${index < 3 ? `is-top-${index + 1}` : ''}`}>
                  {index + 1}
                </div>
                <div className="rankings-page__item-main">
                  <div className="rankings-page__item-head">
                    <Link to={detailLink} className="rankings-page__item-title">
                      {name}
                    </Link>
                    {category && (
                      <span className="rankings-page__item-category">{category}</span>
                    )}
                  </div>
                  {desc && (
                    <p className="rankings-page__item-desc">{desc}</p>
                  )}
                  <div className="rankings-page__item-meta">
                    {score > 0 && <span>榜单分值 {score}</span>}
                    {clickCount > 0 && <span>点击 {clickCount}</span>}
                    {siteUrl && (
                      <a href={siteUrl} target="_blank" rel="noopener noreferrer">
                        访问原站
                      </a>
                    )}
                  </div>
                </div>
                <div className="rankings-page__item-side">
                  <Link to={detailLink} className="rankings-page__detail-link">
                    详情页
                  </Link>
                  <div className="rankings-page__favicon">
                    {iconUrl ? (
                      <img src={iconUrl} alt={name} loading="lazy" />
                    ) : (
                      <span>{name.slice(0, 1)}</span>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    );
  };

  return (
    <div className="rankings-page">
      <SEO
        title={pageTitle}
        description="按访问量、收藏量、点赞量等指标查看每日/每周/每月榜单，并支持后台运营配置。"
        keywords="榜单系统,访问量榜单,收藏榜单,点赞榜单,每日榜单,每周榜单,每月榜单"
        url="https://hao.uied.cn/p/rankings"
        type="website"
      />

      <div className="rankings-page__container">
        <header className="rankings-page__hero">
          <div>
            <div className="rankings-page__eyebrow">站内榜单系统（网站/文章） / 运营配置驱动</div>
            <h1 className="rankings-page__title">{pageTitle}</h1>
            <p className="rankings-page__desc">
              按指标与周期快速切换查看榜单，兼容运营榜单与数据榜单，适合做导航站导流与 SEO 内链页。
            </p>
          </div>
          <button
            type="button"
            className="rankings-page__refresh"
            onClick={fetchBoards}
            disabled={loading}
          >
            {loading ? '加载中...' : '刷新榜单'}
          </button>
        </header>

        {loading ? (
          <div className="rankings-page__state">榜单加载中...</div>
        ) : error ? (
          <div className="rankings-page__state rankings-page__state--error">{error}</div>
        ) : (
          <div className="rankings-page__dashboard-grid">
            {metricBoards.length > 0 && (
              <section className="rankings-page__metric-panel" aria-label="数据榜单切换">
                <div className="rankings-page__metric-head">
                  <div>
                    <h2>数据榜单</h2>
                    <p>按访问量 / 收藏量 / 点赞量与日周月周期切换查看。</p>
                  </div>
                </div>
                <div className="rankings-page__metric-tabs">
                  {METRIC_TABS.map((tab) => (
                    <button
                      key={tab.key}
                      type="button"
                      className={`rankings-page__metric-tab ${activeMetric === tab.key ? 'is-active' : ''}`}
                      onClick={() => setActiveMetric(tab.key)}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
                <div className="rankings-page__period-tabs">
                  {PERIOD_TABS.map((tab) => {
                    const exists = metricBoards.some((board) => resolveBoardMetric(board) === activeMetric && resolveBoardPeriod(board) === tab.key);
                    return (
                      <button
                        key={tab.key}
                        type="button"
                        className={`rankings-page__period-tab ${activePeriod === tab.key ? 'is-active' : ''}`}
                        onClick={() => setActivePeriod(tab.key)}
                        disabled={!exists}
                      >
                        {tab.label}
                      </button>
                    );
                  })}
                </div>
                {renderBoardList(activeMetricBoard)}
              </section>
            )}

            {operationsBoards.length > 0 && (
              <section className="rankings-page__ops-panel" aria-label="运营榜单切换">
                <header className="rankings-page__ops-head">
                  <div>
                    <h2>运营榜单</h2>
                    <p>用于新站曝光、编辑精选、热榜运营等场景。</p>
                  </div>
                </header>
                <div className="rankings-page__tabs">
                  {operationsBoards.map((board) => {
                    const boardKey = String(board.key || board.boardKey);
                    return (
                      <button
                        key={boardKey}
                        type="button"
                        className={`rankings-page__tab ${String(activeOpsBoard?.key || activeOpsBoard?.boardKey) === boardKey ? 'is-active' : ''}`}
                        onClick={() => setActiveOpsBoardKey(boardKey)}
                      >
                        <span className="rankings-page__tab-title">{board.title || board.boardName || boardKey}</span>
                        <span className="rankings-page__tab-desc">{board.items?.length || 0} 条</span>
                      </button>
                    );
                  })}
                </div>
                {renderBoardList(activeOpsBoard)}
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default RankingsPage;
