/**
 * @file faviconTest.js
 * @description Favicon功能测试文件
 * @copyright 版权所有 (c) 2025 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

import { 
  getCravatarFavicon, 
  getFaviconUrl, 
  getCachedSmartFavicon,
  refreshFavicon,
  getFaviconCacheStats,
  cleanExpiredFavicons 
} from '../utils/faviconUtils';

/**
 * 测试网站列表
 */
const testWebsites = [
  'https://www.figma.com',
  'https://www.sketch.com',
  'https://www.adobe.com',
  'https://dribbble.com',
  'https://behance.net',
  'https://unsplash.com',
  'https://pixabay.com',
  'https://coolors.co',
  'https://flaticon.com',
  'https://fonts.google.com'
];

/**
 * 测试Cravatar API基础功能
 */
export const testCravatarBasic = () => {
  console.log('=== 测试Cravatar API基础功能 ===');
  
  testWebsites.forEach(url => {
    const iconUrl = getCravatarFavicon(url);
    console.log(`${url} -> ${iconUrl}`);
  });
  
  console.log('\n=== 测试强制刷新功能 ===');
  const refreshUrl = getCravatarFavicon(testWebsites[0], true);
  console.log(`强制刷新: ${testWebsites[0]} -> ${refreshUrl}`);
};

/**
 * 测试图标获取优先级
 */
export const testFaviconPriority = () => {
  console.log('\n=== 测试图标获取优先级 ===');
  
  testWebsites.slice(0, 3).forEach(url => {
    const iconUrl = getFaviconUrl(url);
    console.log(`优先级获取: ${url} -> ${iconUrl}`);
  });
};

/**
 * 测试异步智能获取
 */
export const testSmartFavicon = async () => {
  console.log('\n=== 测试异步智能获取 ===');
  
  for (const url of testWebsites.slice(0, 3)) {
    try {
      const iconUrl = await getCachedSmartFavicon(url);
      console.log(`智能获取成功: ${url} -> ${iconUrl}`);
    } catch (error) {
      console.error(`智能获取失败: ${url}`, error.message);
    }
  }
};

/**
 * 测试缓存功能
 */
export const testCacheSystem = async () => {
  console.log('\n=== 测试缓存功能 ===');
  
  // 获取初始缓存状态
  let stats = getFaviconCacheStats();
  console.log('初始缓存状态:', stats);
  
  // 添加一些缓存
  for (const url of testWebsites.slice(0, 2)) {
    await getCachedSmartFavicon(url);
  }
  
  // 检查缓存状态
  stats = getFaviconCacheStats();
  console.log('添加缓存后状态:', stats);
  
  // 清理缓存
  const cleaned = cleanExpiredFavicons(0); // 清理所有缓存
  console.log(`清理了 ${cleaned} 个缓存条目`);
  
  // 最终状态
  stats = getFaviconCacheStats();
  console.log('清理后状态:', stats);
};

/**
 * 测试刷新功能
 */
export const testRefreshFunction = async () => {
  console.log('\n=== 测试刷新功能 ===');
  
  const testUrl = testWebsites[0];
  
  try {
    const refreshedUrl = await refreshFavicon(testUrl);
    console.log(`刷新成功: ${testUrl} -> ${refreshedUrl}`);
  } catch (error) {
    console.error(`刷新失败: ${testUrl}`, error.message);
  }
};

/**
 * 性能测试
 */
export const testPerformance = async () => {
  console.log('\n=== 性能测试 ===');
  
  const testUrls = testWebsites.slice(0, 5);
  
  // 测试同步获取
  const syncStart = performance.now();
  testUrls.forEach(url => {
    getFaviconUrl(url);
  });
  const syncTime = performance.now() - syncStart;
  console.log(`同步获取 ${testUrls.length} 个图标耗时: ${syncTime.toFixed(2)}ms`);
  
  // 测试异步获取
  const asyncStart = performance.now();
  await Promise.all(testUrls.map(url => getCachedSmartFavicon(url)));
  const asyncTime = performance.now() - asyncStart;
  console.log(`异步获取 ${testUrls.length} 个图标耗时: ${asyncTime.toFixed(2)}ms`);
};

/**
 * 运行所有测试
 */
export const runAllTests = async () => {
  console.log('🚀 开始Favicon功能测试...\n');
  
  try {
    // 基础功能测试
    testCravatarBasic();
    testFaviconPriority();
    
    // 异步功能测试
    await testSmartFavicon();
    await testCacheSystem();
    await testRefreshFunction();
    await testPerformance();
    
    console.log('\n✅ 所有测试完成！');
  } catch (error) {
    console.error('\n❌ 测试过程中出现错误:', error);
  }
};

/**
 * 在浏览器控制台中运行测试
 * 使用方法: 在控制台中输入 window.testFavicon()
 */
if (typeof window !== 'undefined') {
  window.testFavicon = runAllTests;
  window.faviconTests = {
    basic: testCravatarBasic,
    priority: testFaviconPriority,
    smart: testSmartFavicon,
    cache: testCacheSystem,
    refresh: testRefreshFunction,
    performance: testPerformance,
    all: runAllTests
  };
  
  console.log('💡 Favicon测试功能已加载到全局对象');
  console.log('使用方法:');
  console.log('- window.testFavicon() - 运行所有测试');
  console.log('- window.faviconTests.basic() - 基础功能测试');
  console.log('- window.faviconTests.smart() - 智能获取测试');
  console.log('- window.faviconTests.cache() - 缓存功能测试');
}

export default {
  testCravatarBasic,
  testFaviconPriority,
  testSmartFavicon,
  testCacheSystem,
  testRefreshFunction,
  testPerformance,
  runAllTests
}; 