/**
 * Feature: detail-page-and-ai-assistant, Property 12: 功能开关配置往返一致性
 * Validates: Requirements 10.4
 */

/**
 * @file test/property/featureToggleRoundTrip.test.js
 * @description 属性测试：功能开关配置往返一致性
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

// ============================================================
// 纯函数：序列化和反序列化功能开关配置
// 提取自 service/uied/aiConfig.js 和 test/unit/featureToggle.test.js
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
 * 确保所有布尔值被正确转换（使用 !! 强制转换）
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
// fast-check 生成器
// ============================================================

/**
 * 生成有效的功能开关配置对象
 * 所有字段为布尔值
 */
const featureToggleArbitrary = fc.record({
  aiEnabled: fc.boolean(),
  aiSearch: fc.boolean(),
  aiGenerate: fc.boolean(),
  aiChat: fc.boolean(),
});

// ============================================================
// 属性测试
// ============================================================

describe('Property 12: 功能开关配置往返一致性', () => {

  it('序列化后再解析应产生等价的配置对象', () => {
    fc.assert(
      fc.property(featureToggleArbitrary, (toggle) => {
        const serialized = serializeFeatureToggle(toggle);
        const restored = parseFeatureToggle(serialized);
        expect(restored).toEqual(toggle);
      }),
      { numRuns: 200 }
    );
  });

  it('序列化结果应为有效的 JSON 字符串', () => {
    fc.assert(
      fc.property(featureToggleArbitrary, (toggle) => {
        const serialized = serializeFeatureToggle(toggle);
        expect(() => JSON.parse(serialized)).not.toThrow();
      }),
      { numRuns: 200 }
    );
  });

  it('序列化结果中所有字段应为布尔类型', () => {
    fc.assert(
      fc.property(featureToggleArbitrary, (toggle) => {
        const serialized = serializeFeatureToggle(toggle);
        const parsed = JSON.parse(serialized);
        expect(typeof parsed.aiEnabled).toBe('boolean');
        expect(typeof parsed.aiSearch).toBe('boolean');
        expect(typeof parsed.aiGenerate).toBe('boolean');
        expect(typeof parsed.aiChat).toBe('boolean');
      }),
      { numRuns: 200 }
    );
  });

  it('多次往返应保持幂等性', () => {
    fc.assert(
      fc.property(featureToggleArbitrary, (toggle) => {
        // 第一次往返
        const serialized1 = serializeFeatureToggle(toggle);
        const restored1 = parseFeatureToggle(serialized1);

        // 第二次往返
        const serialized2 = serializeFeatureToggle(restored1);
        const restored2 = parseFeatureToggle(serialized2);

        expect(restored1).toEqual(restored2);
        expect(serialized1).toBe(serialized2);
      }),
      { numRuns: 200 }
    );
  });

  it('序列化结果应恰好包含四个功能开关字段', () => {
    fc.assert(
      fc.property(featureToggleArbitrary, (toggle) => {
        const serialized = serializeFeatureToggle(toggle);
        const parsed = JSON.parse(serialized);
        const keys = Object.keys(parsed).sort();
        expect(keys).toEqual(['aiChat', 'aiEnabled', 'aiGenerate', 'aiSearch']);
      }),
      { numRuns: 200 }
    );
  });

  it('解析结果应恰好包含四个功能开关字段', () => {
    fc.assert(
      fc.property(featureToggleArbitrary, (toggle) => {
        const serialized = serializeFeatureToggle(toggle);
        const restored = parseFeatureToggle(serialized);
        const keys = Object.keys(restored).sort();
        expect(keys).toEqual(['aiChat', 'aiEnabled', 'aiGenerate', 'aiSearch']);
      }),
      { numRuns: 200 }
    );
  });
});
