/**
 * @file test/property/detailPageConfig.test.js
 * @description 属性测试：网站详情页配置 round-trip 持久化一致性
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

// Feature: feature-enhancement-and-bugfix, Property 1: Detail page config round-trip persistence
// **Validates: Requirements 2.3**

import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';

/**
 * 内存设置存储 —— 模拟 setting service 的 save/get 逻辑
 * 行为与 service/uied/setting.js 保持一致：
 *   - save(data): 遍历 key-value 对，对象类型序列化为 JSON 字符串存储
 *   - get(key): 按 key 查询，尝试 JSON.parse 返回对象，解析失败返回原始字符串
 *
 * 这验证了配置通过 JSON 序列化/反序列化的 round-trip 一致性，
 * 即 setting service 实际使用的持久化机制。
 */
class InMemorySettingStore {
  constructor() {
    this.store = new Map();
  }

  /**
   * 保存设置 —— 与 setting.js save() 方法逻辑一致
   * 对象类型使用 JSON.stringify，其他类型使用 String()
   */
  save(data) {
    for (const [key, value] of Object.entries(data)) {
      const valueStr = typeof value === 'object' ? JSON.stringify(value) : String(value);
      this.store.set(key, valueStr);
    }
  }

  /**
   * 获取设置 —— 与 setting.js get() 方法逻辑一致
   * 尝试 JSON.parse，失败则返回原始字符串
   */
  get(key) {
    const raw = this.store.get(key);
    if (raw === undefined) return null;

    try {
      return JSON.parse(raw);
    } catch {
      return raw;
    }
  }
}

/**
 * fast-check arbitrary：生成合法的 DetailPageConfig 对象
 *
 * 接口定义（来自 design.md）：
 * interface DetailPageConfig {
 *   screenshotsEnabled: boolean;
 *   ratingsEnabled: boolean;
 *   commentsEnabled: boolean;
 *   sharingEnabled: boolean;
 *   favoritesEnabled: boolean;
 *   relatedEnabled: boolean;
 *   tagsEnabled: boolean;
 *   copyrightEnabled: boolean;
 *   copyrightText: string;
 *   copyrightLink: string;
 *   disclaimerEnabled: boolean;
 *   disclaimerText: string;
 *   reportEnabled: boolean;
 *   reportText: string;
 *   reportEmail: string;
 *   visitBtnText: string;
 * }
 *
 * 字符串字段使用 JSON 安全的 unicode 字符串生成器，
 * 确保生成的字符串能正确通过 JSON 序列化/反序列化。
 */
const jsonSafeString = (maxLength = 200) =>
  fc.string({ minLength: 0, maxLength });

const detailPageConfigArbitrary = fc.record({
  screenshotsEnabled: fc.boolean(),
  ratingsEnabled: fc.boolean(),
  commentsEnabled: fc.boolean(),
  sharingEnabled: fc.boolean(),
  favoritesEnabled: fc.boolean(),
  relatedEnabled: fc.boolean(),
  tagsEnabled: fc.boolean(),
  copyrightEnabled: fc.boolean(),
  copyrightText: jsonSafeString(500),
  copyrightLink: jsonSafeString(300),
  disclaimerEnabled: fc.boolean(),
  disclaimerText: jsonSafeString(500),
  reportEnabled: fc.boolean(),
  reportText: jsonSafeString(300),
  reportEmail: jsonSafeString(100),
  visitBtnText: jsonSafeString(50),
});

describe('Property 1: Detail page config round-trip persistence', () => {
  let store;

  beforeEach(() => {
    store = new InMemorySettingStore();
  });

  it('saving a DetailPageConfig and reading it back produces an equivalent object', () => {
    fc.assert(
      fc.property(detailPageConfigArbitrary, (config) => {
        // 保存配置（与 admin detailPage.vue 中的保存逻辑一致）
        store.save({ detailPageConfig: config });

        // 读取配置（与 frontend useFrontendConfig 中的读取逻辑一致）
        const retrieved = store.get('detailPageConfig');

        // 验证 round-trip 一致性：读取的配置应与保存的配置完全等价
        expect(retrieved).not.toBeNull();
        expect(retrieved).toEqual(config);
      }),
      { numRuns: 200 }
    );
  });

  it('all boolean toggles preserve their exact values through round-trip', () => {
    fc.assert(
      fc.property(detailPageConfigArbitrary, (config) => {
        store.save({ detailPageConfig: config });
        const retrieved = store.get('detailPageConfig');

        // 逐一验证每个布尔开关字段
        const booleanFields = [
          'screenshotsEnabled',
          'ratingsEnabled',
          'commentsEnabled',
          'sharingEnabled',
          'favoritesEnabled',
          'relatedEnabled',
          'tagsEnabled',
          'copyrightEnabled',
          'disclaimerEnabled',
          'reportEnabled',
        ];

        for (const field of booleanFields) {
          expect(typeof retrieved[field]).toBe('boolean');
          expect(retrieved[field]).toBe(config[field]);
        }
      }),
      { numRuns: 200 }
    );
  });

  it('all string fields preserve their exact values through round-trip', () => {
    fc.assert(
      fc.property(detailPageConfigArbitrary, (config) => {
        store.save({ detailPageConfig: config });
        const retrieved = store.get('detailPageConfig');

        // 逐一验证每个字符串字段
        const stringFields = [
          'copyrightText',
          'copyrightLink',
          'disclaimerText',
          'reportText',
          'reportEmail',
          'visitBtnText',
        ];

        for (const field of stringFields) {
          expect(typeof retrieved[field]).toBe('string');
          expect(retrieved[field]).toBe(config[field]);
        }
      }),
      { numRuns: 200 }
    );
  });

  it('overwriting a config with a new value returns the latest config', () => {
    fc.assert(
      fc.property(
        detailPageConfigArbitrary,
        detailPageConfigArbitrary,
        (config1, config2) => {
          // 先保存第一个配置
          store.save({ detailPageConfig: config1 });

          // 再保存第二个配置（覆盖）
          store.save({ detailPageConfig: config2 });

          // 读取应返回最新的配置
          const retrieved = store.get('detailPageConfig');
          expect(retrieved).toEqual(config2);
        }
      ),
      { numRuns: 200 }
    );
  });

  it('reading a non-existent key returns null', () => {
    // 不需要 fast-check，这是一个边界情况验证
    const result = store.get('detailPageConfig');
    expect(result).toBeNull();
  });

  it('config with all fields set to default-like values round-trips correctly', () => {
    fc.assert(
      fc.property(
        fc.record({
          screenshotsEnabled: fc.constant(true),
          ratingsEnabled: fc.constant(false),
          commentsEnabled: fc.constant(false),
          sharingEnabled: fc.constant(true),
          favoritesEnabled: fc.constant(false),
          relatedEnabled: fc.constant(true),
          tagsEnabled: fc.constant(true),
          copyrightEnabled: fc.constant(true),
          copyrightText: fc.constant(''),
          copyrightLink: fc.constant(''),
          disclaimerEnabled: fc.constant(false),
          disclaimerText: fc.constant(''),
          reportEnabled: fc.constant(false),
          reportText: fc.constant(''),
          reportEmail: fc.constant(''),
          visitBtnText: fc.oneof(
            fc.constant('访问网站'),
            fc.constant('Visit Website'),
            fc.constant('')
          ),
        }),
        (config) => {
          store.save({ detailPageConfig: config });
          const retrieved = store.get('detailPageConfig');
          expect(retrieved).toEqual(config);
        }
      ),
      { numRuns: 100 }
    );
  });
});
