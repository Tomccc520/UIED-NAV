/**
 * @file utils/slugHelper.js
 * @description Slug 生成工具 - 支持中文转拼音
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

import pinyinModule from 'pinyin';

// pinyin 库的默认导出
const pinyin = pinyinModule.default || pinyinModule;

/**
 * 将中文字符串转换为拼音 slug
 * @param {string} str - 输入字符串（可能包含中文）
 * @returns {string} 拼音 slug
 */
export function toPinyinSlug(str) {
  if (!str) return '';
  
  // 使用 pinyin 库转换中文
  const pinyinResult = pinyin(str, {
    style: 0, // STYLE_NORMAL = 0，普通风格，不带声调
    heteronym: false, // 不启用多音字
  });
  
  // 将拼音数组转换为字符串
  let result = pinyinResult.map(p => p[0] || '').join('');
  
  // 清理：只保留字母、数字和连字符
  result = result
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-') // 非字母数字转为连字符
    .replace(/-+/g, '-') // 多个连字符合并
    .replace(/^-|-$/g, ''); // 去除首尾连字符
  
  return result;
}

/**
 * 从 URL 提取域名作为 slug
 * @param {string} url - 网站 URL
 * @returns {string|null} 域名 slug 或 null
 */
export function extractDomainSlug(url) {
  if (!url) return null;
  
  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname
      .replace('www.', '')
      .split('.')[0];
    
    // 只有纯英文数字的域名才使用
    if (domain && /^[a-z0-9-]+$/i.test(domain)) {
      return domain.toLowerCase();
    }
  } catch {
    // URL 解析失败
  }
  
  return null;
}

/**
 * 生成网站 slug
 * 优先使用域名，否则使用名称的拼音
 * @param {string} name - 网站名称
 * @param {string} url - 网站 URL
 * @returns {string} 生成的 slug
 */
export function generateSlug(name, url) {
  // 优先从 URL 提取域名
  const domainSlug = extractDomainSlug(url);
  if (domainSlug) {
    return domainSlug;
  }
  
  // 否则使用名称的拼音
  return toPinyinSlug(name);
}

/**
 * 确保 slug 唯一性
 * @param {string} baseSlug - 基础 slug
 * @param {Function} checkExists - 检查 slug 是否存在的函数
 * @param {string} excludeId - 排除的 ID（用于编辑时）
 * @returns {Promise<string>} 唯一的 slug
 */
export async function ensureUniqueSlug(baseSlug, checkExists, excludeId = null) {
  let slug = baseSlug;
  let counter = 2;
  
  while (await checkExists(slug, excludeId)) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
  
  return slug;
}

export default {
  toPinyinSlug,
  extractDomainSlug,
  generateSlug,
  ensureUniqueSlug,
};
