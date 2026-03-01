/**
 * @copyright Tomda (https://www.tomda.top)
 * @copyright UIED技术团队 (https://fsuied.com)
 * @author UIED技术团队
 * @createDate 2026.2.14
 *
 * @file clickMode.ts
 * @description 点击行为模式工具，统一分类区域与热门推荐的点击语义和兼容逻辑
 */

export type WebsiteClickMode = 'detail' | 'direct';
export type HotRecommendationClickMode = 'detail' | 'direct';

/**
 * 规范化分类区域点击模式
 * 兼容历史值：directExternal -> direct
 */
export const normalizeWebsiteClickMode = (mode: unknown): WebsiteClickMode => {
  if (mode === 'direct' || mode === 'directExternal') return 'direct';
  return 'detail';
};

/**
 * 规范化热门推荐点击模式
 * 兼容历史值：modal -> detail
 */
export const normalizeHotRecommendationClickMode = (mode: unknown): HotRecommendationClickMode => {
  if (mode === 'direct') return 'direct';
  return 'detail';
};

/**
 * 判断当前分类区域点击模式是否为直达
 */
export const isDirectWebsiteClickMode = (mode: unknown): boolean => {
  return normalizeWebsiteClickMode(mode) === 'direct';
};

/**
 * 生成卡片右侧箭头展示配置
 */
export const getArrowConfigByWebsiteClickMode = (mode: unknown) => {
  const isDirectMode = isDirectWebsiteClickMode(mode);
  return {
    isDirectMode,
    arrowLabel: isDirectMode ? '查看详情' : '直达网站',
    arrowIsExternal: !isDirectMode,
  };
};

