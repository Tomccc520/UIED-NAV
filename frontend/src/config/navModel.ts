/**
 * @copyright Tomda (https://www.tomda.top)
 * @copyright UIED技术团队 (https://fsuied.com)
 * @author UIED技术团队
 * @createDate 2026.2.14
 *
 * @file navModel.ts
 * @description 导航页模型统一配置，收敛固定入口、默认导航项与来源文案
 */

/**
 * 导航切换项配置结构。
 */
export interface NavSwitchConfigItem {
  slug: string;
  name: string;
  icon: string;
  visible: boolean;
  sort: number;
}

/**
 * 固定首页导航 slug（根路径默认入口）。
 */
export const ROOT_NAV_SLUG = 'uiux';

/**
 * 固定动态页 slug 列表。
 */
export const FIXED_DYNAMIC_NAV_SLUGS = [
  'uiux',
  'ai',
  'design',
  '3d',
  'ecommerce',
  'interior',
  'font',
] as const;

/**
 * 默认导航切换配置（后台未配置时兜底）。
 */
export const DEFAULT_NAV_SWITCH_ITEMS: NavSwitchConfigItem[] = [
  { slug: 'uiux', name: 'UI导航', icon: 'Figma', visible: true, sort: 10 },
  { slug: 'ai', name: 'AI导航', icon: 'AI', visible: true, sort: 20 },
  { slug: 'design', name: '平面导航', icon: 'Design', visible: true, sort: 30 },
  { slug: '3d', name: '三维导航', icon: '3D', visible: true, sort: 40 },
  { slug: 'ecommerce', name: '电商导航', icon: 'Ecommerce', visible: true, sort: 50 },
  { slug: 'interior', name: '室内导航', icon: 'Design', visible: true, sort: 60 },
  { slug: 'font', name: '字体导航', icon: 'Font', visible: true, sort: 70 },
];

/**
 * 固定动态页路由项。
 */
export interface FixedDynamicRouteItem {
  path: string;
  slug: string;
}

/**
 * 构建固定动态页路由映射，保持 "/" 与 "/uiux" 双入口兼容。
 */
const buildFixedDynamicRoutes = (): FixedDynamicRouteItem[] => {
  return [
    { path: '/', slug: ROOT_NAV_SLUG },
    ...FIXED_DYNAMIC_NAV_SLUGS.map((slug) => ({ path: `/${slug}`, slug })),
  ];
};

/**
 * 固定动态页路由配置。
 */
export const FIXED_DYNAMIC_ROUTES = buildFixedDynamicRoutes();

/**
 * 搜索来源标签文案映射。
 */
export const SEARCH_SOURCE_LABELS: Record<string, string> = {
  all: '全部来源',
  uiux: 'UI/UX',
  ai: 'AI工具',
  design: '平面设计',
  '3d': '3D设计',
  ecommerce: '电商',
  interior: '室内设计',
  font: '字体',
};

/**
 * 根据导航 slug 获取描述文案。
 */
export const getNavSwitchDescription = (slug: string): string => {
  switch (slug) {
    case 'design':
      return '平面设计资源导航';
    case 'ai':
      return 'AI工具和资源导航';
    case 'uiux':
      return 'UI/UX设计资源导航';
    case '3d':
      return '3D设计工具导航';
    case 'ecommerce':
      return '电商设计工具导航';
    case 'interior':
      return '室内设计工具导航';
    case 'font':
      return '字体设计资源导航';
    default:
      return '设计资源导航';
  }
};

/**
 * 判断是否为固定动态页 slug。
 */
export const isFixedDynamicNavSlug = (slug: string): boolean => {
  return FIXED_DYNAMIC_NAV_SLUGS.includes(slug as (typeof FIXED_DYNAMIC_NAV_SLUGS)[number]);
};
