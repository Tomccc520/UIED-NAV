/**
 * @file test/unit/featureToggle.test.js
 * @description 单元测试：AI 功能开关接口核心逻辑
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

// Validates: Requirements 10.1, 10.2, 10.4

import { describe, it, expect } from 'vitest';

// ============================================================
// 纯函数：从数据库 JSON 值解析功能开关配置
// 提取自 service/uied/aiConfig.js getFeatureToggle() 的核心逻辑
// ============================================================

const DEFAULT_TOGGLE = {
  aiEnabled: true,
  aiSearch: true,
  aiGenerate: true,
  aiChat: true,
};

/**
 * 解析功能开关配置
 * 从数据库读取的 JSON 字符串解析为功能开关对象
 * 缺失字段使用默认值
 *
 * @param {string|null|undefined} rawValue - 数据库中的 JSON 字符串
 * @returns {object} 功能开关配置对象
 */
function parseFeatureToggle(rawValue) {
  if (!rawValue) return { ...DEFAULT_TOGGLE };

  try {
    const parsed = JSON.parse(rawValue);
    return {
      aiEnabled: parsed.aiEnabled !== undefined ? parsed.aiEnabled : DEFAULT_TOGGLE.aiEnabled,
      aiSearch: parsed.aiSearch !== undefined ? parsed.aiSearch : DEFAULT_TOGGLE.aiSearch,
      aiGenerate: parsed.aiGenerate !== undefined ? parsed.aiGenerate : DEFAULT_TOGGLE.aiGenerate,
      aiChat: parsed.aiChat !== undefined ? parsed.aiChat : DEFAULT_TOGGLE.aiChat,
    };
  } catch {
    return { ...DEFAULT_TOGGLE };
  }
}

/**
 * 序列化功能开关配置
 * 将功能开关对象转为 JSON 字符串用于存储
 * 确保所有布尔值被正确转换
 *
 * @param {object} data - 功能开关配置
 * @returns {string} JSON 字符串
 */
function serializeFeatureToggle(data) {
  const toggleData = {
    aiEnabled: !!data.aiEnabled,
    aiSearch: !!data.aiSearch,
    aiGenerate: !!data.aiGenerate,
    aiChat: !!data.aiChat,
  };
  return JSON.stringify(toggleData);
}

// ============================================================
// 单元测试
// ============================================================

describe('AI 功能开关 - 解析逻辑', () => {

  it('未配置时返回默认值（全部启用）', () => {
    const result = parseFeatureToggle(null);
    expect(result).toEqual({
      aiEnabled: true,
      aiSearch: true,
      aiGenerate: true,
      aiChat: true,
    });
  });

  it('undefined 输入返回默认值', () => {
    const result = parseFeatureToggle(undefined);
    expect(result).toEqual(DEFAULT_TOGGLE);
  });

  it('空字符串返回默认值', () => {
    const result = parseFeatureToggle('');
    expect(result).toEqual(DEFAULT_TOGGLE);
  });

  it('无效 JSON 返回默认值', () => {
    const result = parseFeatureToggle('not-json');
    expect(result).toEqual(DEFAULT_TOGGLE);
  });

  it('正确解析完整的功能开关配置', () => {
    const json = JSON.stringify({
      aiEnabled: true,
      aiSearch: false,
      aiGenerate: true,
      aiChat: false,
    });
    const result = parseFeatureToggle(json);
    expect(result).toEqual({
      aiEnabled: true,
      aiSearch: false,
      aiGenerate: true,
      aiChat: false,
    });
  });

  it('部分字段缺失时使用默认值补全', () => {
    const json = JSON.stringify({ aiEnabled: false, aiChat: false });
    const result = parseFeatureToggle(json);
    expect(result).toEqual({
      aiEnabled: false,
      aiSearch: true,     // 默认值
      aiGenerate: true,   // 默认值
      aiChat: false,
    });
  });

  it('全部禁用的配置正确解析', () => {
    const json = JSON.stringify({
      aiEnabled: false,
      aiSearch: false,
      aiGenerate: false,
      aiChat: false,
    });
    const result = parseFeatureToggle(json);
    expect(result.aiEnabled).toBe(false);
    expect(result.aiSearch).toBe(false);
    expect(result.aiGenerate).toBe(false);
    expect(result.aiChat).toBe(false);
  });
});

describe('AI 功能开关 - 序列化逻辑', () => {

  it('正确序列化功能开关配置', () => {
    const data = { aiEnabled: true, aiSearch: false, aiGenerate: true, aiChat: false };
    const json = serializeFeatureToggle(data);
    const parsed = JSON.parse(json);
    expect(parsed).toEqual(data);
  });

  it('将 truthy/falsy 值转为布尔值', () => {
    const data = { aiEnabled: 1, aiSearch: 0, aiGenerate: 'yes', aiChat: '' };
    const json = serializeFeatureToggle(data);
    const parsed = JSON.parse(json);
    expect(parsed.aiEnabled).toBe(true);
    expect(parsed.aiSearch).toBe(false);
    expect(parsed.aiGenerate).toBe(true);
    expect(parsed.aiChat).toBe(false);
  });

  it('缺失字段序列化为 false', () => {
    const data = { aiEnabled: true };
    const json = serializeFeatureToggle(data);
    const parsed = JSON.parse(json);
    expect(parsed.aiEnabled).toBe(true);
    expect(parsed.aiSearch).toBe(false);
    expect(parsed.aiGenerate).toBe(false);
    expect(parsed.aiChat).toBe(false);
  });

  it('往返一致性：序列化后再解析应得到等价结果', () => {
    const original = { aiEnabled: true, aiSearch: false, aiGenerate: true, aiChat: false };
    const json = serializeFeatureToggle(original);
    const restored = parseFeatureToggle(json);
    expect(restored).toEqual(original);
  });
});
