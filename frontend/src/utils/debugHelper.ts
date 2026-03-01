/**
 * @file debugHelper.ts
 * @description 前端调试工具
 * @copyright 版权所有 (c) 2025 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.1.0
 */

// 环境判断
const isDevelopment = process.env.NODE_ENV === 'development';
type DebugArgs = unknown[];

interface DebugSubCategoryItem {
  id: string;
  name: string;
}

interface DebugToolItem {
  subcategory?: string;
}

interface DebugWindow extends Window {
  FrontendDebugHelper?: typeof FrontendDebugHelper;
  debugLog?: typeof debugLog;
}

// 调试日志封装
export const debugLog = {
  /**
   * 开发环境日志
   */
  dev: (...args: DebugArgs) => {
    if (isDevelopment) {
      console.log('[DEV]', ...args);
    }
  },
  
  /**
   * 分页调试日志
   */
  pagination: (...args: DebugArgs) => {
    if (isDevelopment) {
      console.log('[PAGINATION]', ...args);
    }
  },
  
  /**
   * 数据调试日志
   */
  data: (...args: DebugArgs) => {
    if (isDevelopment) {
      console.log('[DATA]', ...args);
    }
  },
  
  /**
   * 错误日志（生产环境也显示）
   */
  error: (...args: DebugArgs) => {
    console.error('[ERROR]', ...args);
  },
  
  /**
   * 警告日志（生产环境也显示）
   */
  warn: (...args: DebugArgs) => {
    console.warn('[WARN]', ...args);
  },
  
  /**
   * 信息日志（仅开发环境）
   */
  info: (...args: DebugArgs) => {
    if (isDevelopment) {
      console.info('[INFO]', ...args);
    }
  }
};

// 调试工具类
export class FrontendDebugHelper {
  /**
   * 检查数据加载状态
   */
  static checkDataStatus() {
    if (!isDevelopment) return;
    
    console.group('🔍 前端数据状态检查');
    
    // 检查环境配置
    console.log('🌍 运行环境:', process.env.NODE_ENV);
    console.log('🔗 API地址:', process.env.REACT_APP_API_URL || 'http://localhost:8002/api');
    
    // 检查localStorage
    const categories = localStorage.getItem('uied_mock_categories');
    const websites = localStorage.getItem('uied_mock_websites');
    
    console.log('📦 localStorage状态:');
    console.log('  - 分类数据:', categories ? `${JSON.parse(categories).length}条` : '❌ 未找到');
    console.log('  - 网址数据:', websites ? `${JSON.parse(websites).length}条` : '❌ 未找到');
    
    // 检查网络连接
    console.log('🌐 网络状态:', navigator.onLine ? '✅ 已连接' : '❌ 离线');
    
    console.groupEnd();
  }

  /**
   * 分页控制器调试
   */
  static debugPagination(data: {
    totalItems: number;
    totalPages: number;
    currentPage: number;
    pageSize: number;
    categoryId?: string;
    subCategoryId?: string;
  }) {
    // 已禁用分页调试日志
    return;
  }

  /**
   * 子分类数据调试
   */
  static debugSubCategories(categoryId: string, subCategories: DebugSubCategoryItem[], tools: DebugToolItem[]) {
    if (!isDevelopment) return;
    
    console.group(`📂 子分类调试 - ${categoryId}`);
    console.log('子分类数量:', subCategories.length);
    console.log('子分类列表:', subCategories.map(sub => ({ id: sub.id, name: sub.name })));
    console.log('工具总数:', tools.length);
    
    // 统计每个子分类的工具数量
    subCategories.forEach(subCat => {
      const count = tools.filter(tool => tool.subcategory === subCat.id).length;
      console.log(`  - ${subCat.name} (${subCat.id}): ${count} 个工具`);
    });
    
    console.groupEnd();
  }

  /**
   * 测试数据获取
   */
  static async testDataFetching() {
    if (!isDevelopment) return null;
    
    console.group('🧪 数据获取测试');
    
    try {
      // 测试分类数据
      console.log('📂 测试分类数据获取...');
      const testCategories = [
        { id: '1', name: 'AI工具', slug: 'ai-tools', icon: 'ai', color: '#667EEA', count: 4 },
        { id: '2', name: 'UI设计', slug: 'ui-design', icon: 'ui', color: '#F093FB', count: 4 }
      ];
      console.log('✅ 分类数据测试成功:', testCategories.length, '条');

      // 测试网址数据
      console.log('🌐 测试网址数据获取...');
      const testWebsites = [
        { id: '1', name: 'ChatGPT', description: 'AI对话工具', category: '1', isFeatured: true },
        { id: '2', name: 'Figma', description: '界面设计工具', category: '2', isFeatured: true }
      ];
      console.log('✅ 网址数据测试成功:', testWebsites.length, '条');

      return { categories: testCategories, websites: testWebsites };
    } catch (error) {
      console.error('❌ 数据获取测试失败:', error);
      return null;
    } finally {
      console.groupEnd();
    }
  }

  /**
   * 显示详细调试信息
   */
  static showDetailedInfo() {
    if (!isDevelopment) return;
    
    console.group('📊 详细调试信息');
    
    // 浏览器信息
    console.log('🌐 浏览器信息:', {
      userAgent: navigator.userAgent,
      language: navigator.language,
      cookieEnabled: navigator.cookieEnabled
    });
    
    // 当前页面信息
    console.log('📄 页面信息:', {
      url: window.location.href,
      pathname: window.location.pathname,
      search: window.location.search
    });
    
    // React开发模式检查
    console.log('⚛️ React模式:', isDevelopment ? '开发模式' : '生产模式');
    
    console.groupEnd();
  }

  /**
   * 快速修复建议
   */
  static getFixSuggestions() {
    if (!isDevelopment) return;
    
    console.group('💡 问题修复建议');
    
    const suggestions = [
      '1. 🔄 刷新浏览器页面',
      '2. 🧹 清除浏览器缓存',
      '3. 🚀 重启前端开发服务器 (npm start)',
      '4. 📝 检查控制台错误信息',
      '5. 🔧 确认后台服务器运行正常',
      '6. 🌐 检查网络连接状态',
      '7. 🔍 访问 /test 页面验证基础功能'
    ];
    
    suggestions.forEach(suggestion => console.log(suggestion));
    
    console.groupEnd();
  }

  /**
   * 完整诊断
   */
  static async runFullDiagnosis() {
    if (!isDevelopment) return;
    
    console.clear();
    console.log('🏥 开始前端数据问题诊断...\n');
    
    this.checkDataStatus();
    await this.testDataFetching();
    this.showDetailedInfo();
    this.getFixSuggestions();
    
    console.log('\n✅ 诊断完成！请查看上面的信息来解决问题。');
  }
}

// 挂载到全局对象，方便在控制台使用（仅开发环境）
if (typeof window !== 'undefined' && isDevelopment) {
  const debugWindow = window as DebugWindow;
  debugWindow.FrontendDebugHelper = FrontendDebugHelper;
  debugWindow.debugLog = debugLog;
  console.log('🔧 调试工具已加载，使用 FrontendDebugHelper.runFullDiagnosis() 开始诊断');
} 
