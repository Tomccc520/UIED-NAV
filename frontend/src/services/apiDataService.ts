/**
 * @file apiDataService.ts
 * @description API数据服务 - 从后端API获取页面数据，实现DataService接口
 * 可以替代静态数据服务，实现前后端数据对接
 */

import { pageService, PageFullData, Website } from './pageService';
import { type NavItem } from '../components/CategorySidebar';
import { type Tool, type Stats, type DataService } from '../hooks/useNavigation';
import { IconComponent } from '../types/icon';

/**
 * 将API返回的Website转换为Tool格式
 */
function websiteToTool(website: Website, categoryId?: string): Tool {
  return {
    id: website.id,
    name: website.name,
    description: website.description,
    url: website.url,
    category: categoryId || '',
    isNew: website.isNew,
    isFeatured: website.isFeatured,
    isHot: website.isHot,
    tags: website.tags || []
  };
}

/**
 * API数据服务类 - 从后端API获取数据
 */
export class APIDataService implements DataService {
  private slug: string;
  private data: PageFullData | null = null;
  private loading: boolean = false;
  private error: Error | null = null;
  private iconComponents: Record<string, IconComponent>;

  constructor(slug: string, iconComponents: Record<string, IconComponent>) {
    this.slug = slug;
    this.iconComponents = iconComponents;
  }

  /**
   * 加载数据
   */
  async loadData(): Promise<void> {
    if (this.data || this.loading) return;
    
    this.loading = true;
    try {
      this.data = await pageService.getFullData(this.slug);
      this.error = null;
    } catch (err) {
      this.error = err as Error;
      console.error(`加载页面数据失败: ${this.slug}`, err);
    } finally {
      this.loading = false;
    }
  }

  /**
   * 检查数据是否已加载
   */
  isLoaded(): boolean {
    return this.data !== null;
  }

  /**
   * 获取加载状态
   */
  isLoading(): boolean {
    return this.loading;
  }

  /**
   * 获取错误信息
   */
  getError(): Error | null {
    return this.error;
  }

  /**
   * 获取原始数据
   */
  getRawData(): PageFullData | null {
    return this.data;
  }

  /**
   * 获取导航项
   */
  getNavItems(): NavItem[] {
    if (!this.data) return [];
    
    return this.data.categories.map(cat => {
      // 计算该分类下的网站总数（包括子分类）
      let count = 0;
      if (this.data!.websitesByCategory[cat.id]) {
        count += this.data!.websitesByCategory[cat.id].length;
      }
      for (const subCat of cat.subCategories) {
        if (this.data!.websitesByCategory[subCat.id]) {
          count += this.data!.websitesByCategory[subCat.id].length;
        }
      }

      return {
        id: cat.id,
        name: cat.name,
        count,
        icon: this.iconComponents[cat.icon] || this.iconComponents['default'],
        color: cat.color,
        slug: cat.slug // 添加 slug 字段，用于匹配静态数据
      };
    });
  }

  /**
   * 获取网站列表
   */
  getWebsites(params?: {
    category?: string;
    featured?: boolean;
    hot?: boolean;
    limit?: number;
  }): Tool[] {
    if (!this.data) return [];

    let tools: Tool[] = [];

    // 按分类筛选
    if (params?.category && params.category !== 'all') {
      const category = this.data.categories.find(c => c.id === params.category);
      if (category) {
        // 获取主分类的网站
        if (this.data.websitesByCategory[params.category]) {
          tools.push(...this.data.websitesByCategory[params.category].map(w => 
            websiteToTool(w, params.category)
          ));
        }
        // 获取子分类的网站
        for (const subCat of category.subCategories) {
          if (this.data.websitesByCategory[subCat.id]) {
            tools.push(...this.data.websitesByCategory[subCat.id].map(w => 
              websiteToTool(w, subCat.id)
            ));
          }
        }
      }
    } else if (params?.featured) {
      // 获取推荐网站
      Object.entries(this.data.websitesByCategory).forEach(([catId, websites]) => {
        websites.filter(w => w.isFeatured).forEach(w => {
          tools.push(websiteToTool(w, catId));
        });
      });
    } else if (params?.hot) {
      // 获取热门网站
      Object.entries(this.data.websitesByCategory).forEach(([catId, websites]) => {
        websites.filter(w => w.isHot).forEach(w => {
          tools.push(websiteToTool(w, catId));
        });
      });
    } else {
      // 获取所有网站
      Object.entries(this.data.websitesByCategory).forEach(([catId, websites]) => {
        websites.forEach(w => {
          tools.push(websiteToTool(w, catId));
        });
      });
    }

    // 排序：热门 > 推荐 > 新增
    tools.sort((a, b) => {
      if (a.isHot && !b.isHot) return -1;
      if (!a.isHot && b.isHot) return 1;
      if (a.isFeatured && !b.isFeatured) return -1;
      if (!a.isFeatured && b.isFeatured) return 1;
      if (a.isNew && !b.isNew) return -1;
      if (!a.isNew && b.isNew) return 1;
      return 0;
    });

    // 限制数量
    if (params?.limit) {
      tools = tools.slice(0, params.limit);
    }

    return tools;
  }

  /**
   * 搜索网站
   */
  searchWebsites(keyword: string, limit?: number): Tool[] {
    if (!this.data || !keyword) return [];

    const lowerKeyword = keyword.toLowerCase();
    const results: Tool[] = [];

    Object.entries(this.data.websitesByCategory).forEach(([catId, websites]) => {
      websites.forEach(w => {
        if (
          w.name.toLowerCase().includes(lowerKeyword) ||
          w.description.toLowerCase().includes(lowerKeyword) ||
          (w.tags || []).some(tag => tag.toLowerCase().includes(lowerKeyword))
        ) {
          results.push(websiteToTool(w, catId));
        }
      });
    });

    // 排序：名称匹配优先
    results.sort((a, b) => {
      const aNameMatch = a.name.toLowerCase().includes(lowerKeyword);
      const bNameMatch = b.name.toLowerCase().includes(lowerKeyword);
      if (aNameMatch && !bNameMatch) return -1;
      if (!aNameMatch && bNameMatch) return 1;
      return 0;
    });

    return limit ? results.slice(0, limit) : results;
  }

  /**
   * 获取统计数据
   */
  getStats(): Stats {
    if (!this.data) {
      return {
        totalWebsites: 0,
        totalCategories: 0,
        updateDate: new Date().toISOString().split('T')[0]
      };
    }

    return {
      totalWebsites: this.data.stats.totalWebsites,
      totalCategories: this.data.stats.totalCategories,
      updateDate: new Date().toISOString().split('T')[0]
    };
  }

  /**
   * 获取子分类
   */
  getSubCategories(categoryId: string): { id: string; name: string }[] {
    if (!this.data) return [];
    
    const category = this.data.categories.find(c => c.id === categoryId);
    if (!category) return [];
    
    // 返回所有子分类（不过滤）
    return category.subCategories;
  }

  /**
   * 获取子分类的网站
   */
  getWebsitesBySubCategory(subCategoryId: string): Tool[] {
    if (!this.data) return [];
    
    const websites = this.data.websitesByCategory[subCategoryId] || [];
    return websites.map(w => websiteToTool(w, subCategoryId));
  }

  /**
   * 获取子分类统计
   */
  getSubCategoryStats(categoryId: string): { id: string; name: string; count: number }[] {
    if (!this.data) return [];
    
    const category = this.data.categories.find(c => c.id === categoryId);
    if (!category) return [];

    return category.subCategories.map(subCat => ({
      id: subCat.id,
      name: subCat.name,
      count: (this.data!.websitesByCategory[subCat.id] || []).length
    }));
  }
}

/**
 * 创建API数据服务的工厂函数
 */
export function createAPIDataService(
  slug: string, 
  iconComponents: Record<string, IconComponent>
): APIDataService {
  return new APIDataService(slug, iconComponents);
}

export default APIDataService;
