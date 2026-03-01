/**
 * @file SiteContext.test.ts
 * @description 前端用户界面组件
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

import * as fc from 'fast-check';
import {
  DEFAULT_SITE_INFO,
  getSafeValue,
  mergeSiteInfoWithDefaults,
  isValidSiteInfo,
  SiteInfo,
} from './SiteContext';

/**
 * Property 8: 降级处理正确性
 * 
 * 验证站点信息加载失败时的降级处理：
 * 1. 应用应使用预定义的默认值
 * 2. 不应抛出未捕获的异常
 * 3. 所有必需字段都应有有效值
 * 
 * **Validates: Requirements 8.4**
 */

describe('SiteContext - Property Tests', () => {
  describe('Property 8: 降级处理正确性', () => {
    // 站点信息生成器
    const siteInfoArb = fc.record({
      id: fc.integer({ min: 0 }),
      siteName: fc.string({ minLength: 1, maxLength: 100 }),
      siteTitle: fc.string({ minLength: 1, maxLength: 200 }),
      description: fc.string({ minLength: 1, maxLength: 500 }),
      keywords: fc.string({ minLength: 1, maxLength: 200 }),
      logo: fc.string({ minLength: 1, maxLength: 200 }),
      favicon: fc.string({ minLength: 1, maxLength: 200 }),
      icp: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }),
      icpLink: fc.option(fc.string({ minLength: 1, maxLength: 200 }), { nil: undefined }),
      copyright: fc.option(fc.string({ minLength: 1, maxLength: 200 }), { nil: undefined }),
    });

    // 部分站点信息生成器（可能缺少某些字段）
    const partialSiteInfoArb = fc.record({
      id: fc.option(fc.integer({ min: 0 }), { nil: undefined }),
      siteName: fc.option(fc.string({ minLength: 0, maxLength: 100 }), { nil: undefined }),
      siteTitle: fc.option(fc.string({ minLength: 0, maxLength: 200 }), { nil: undefined }),
      description: fc.option(fc.string({ minLength: 0, maxLength: 500 }), { nil: undefined }),
      keywords: fc.option(fc.string({ minLength: 0, maxLength: 200 }), { nil: undefined }),
      logo: fc.option(fc.string({ minLength: 0, maxLength: 200 }), { nil: undefined }),
      favicon: fc.option(fc.string({ minLength: 0, maxLength: 200 }), { nil: undefined }),
    });

    // 无效输入生成器 - 使用 constantFrom 代替 constant
    const invalidInputArb = fc.oneof(
      fc.constantFrom(null, undefined) as fc.Arbitrary<unknown>,
      fc.string() as fc.Arbitrary<unknown>,
      fc.integer() as fc.Arbitrary<unknown>,
      fc.array(fc.anything()) as fc.Arbitrary<unknown>,
      fc.record({
        randomField: fc.string(),
      }) as fc.Arbitrary<unknown>
    );

    // null/undefined 生成器
    const nullishArb = fc.constantFrom(null, undefined) as fc.Arbitrary<null | undefined>;

    /**
     * 测试：getSafeValue 应该总是返回有效值
     * 对于任何输入，getSafeValue 不应抛出异常，且应返回有效值
     */
    test('getSafeValue should always return a valid value without throwing', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            siteInfoArb as fc.Arbitrary<unknown>,
            partialSiteInfoArb as fc.Arbitrary<unknown>,
            nullishArb as fc.Arbitrary<unknown>
          ),
          fc.constantFrom('siteName', 'siteTitle', 'description', 'keywords', 'logo', 'favicon') as fc.Arbitrary<keyof SiteInfo>,
          (siteInfo, key) => {
            // 不应抛出异常
            let result: unknown;
            expect(() => {
              result = getSafeValue(siteInfo as SiteInfo | null | undefined, key);
            }).not.toThrow();

            // 结果应该是字符串类型（对于这些字段）
            expect(typeof result).toBe('string');

            // 结果不应为空字符串（因为默认值都是非空的）
            expect((result as string).length).toBeGreaterThan(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * 测试：getSafeValue 应该优先返回实际值
     * 当站点信息存在且字段有值时，应返回实际值而非默认值
     */
    test('getSafeValue should return actual value when available', () => {
      fc.assert(
        fc.property(
          siteInfoArb,
          fc.constantFrom('siteName', 'siteTitle', 'description', 'keywords', 'logo', 'favicon') as fc.Arbitrary<'siteName' | 'siteTitle' | 'description' | 'keywords' | 'logo' | 'favicon'>,
          (siteInfo, key) => {
            const result = getSafeValue(siteInfo as SiteInfo, key);
            const actualValue = siteInfo[key];
            
            // 当实际值存在且非空时，应返回实际值
            expect(!actualValue || actualValue.length === 0 || result === actualValue).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * 测试：mergeSiteInfoWithDefaults 应该总是返回完整的 SiteInfo
     * 对于任何输入，合并后的结果应包含所有必需字段
     */
    test('mergeSiteInfoWithDefaults should always return complete SiteInfo', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            partialSiteInfoArb as fc.Arbitrary<unknown>,
            nullishArb as fc.Arbitrary<unknown>
          ),
          (partialInfo) => {
            const result = mergeSiteInfoWithDefaults(partialInfo as Partial<SiteInfo> | null | undefined);

            // 结果应包含所有必需字段
            expect(result).toHaveProperty('id');
            expect(result).toHaveProperty('siteName');
            expect(result).toHaveProperty('siteTitle');
            expect(result).toHaveProperty('description');
            expect(result).toHaveProperty('keywords');
            expect(result).toHaveProperty('logo');
            expect(result).toHaveProperty('favicon');

            // 必需字段不应为空
            expect(result.siteName.length).toBeGreaterThan(0);
            expect(result.siteTitle.length).toBeGreaterThan(0);
            expect(result.description.length).toBeGreaterThan(0);
            expect(result.keywords.length).toBeGreaterThan(0);
            expect(result.logo.length).toBeGreaterThan(0);
            expect(result.favicon.length).toBeGreaterThan(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * 测试：mergeSiteInfoWithDefaults 应该保留有效的实际值
     * 当部分信息存在时，应保留这些值而非使用默认值
     */
    test('mergeSiteInfoWithDefaults should preserve valid actual values', () => {
      fc.assert(
        fc.property(
          siteInfoArb,
          (siteInfo) => {
            const result = mergeSiteInfoWithDefaults(siteInfo as Partial<SiteInfo>);

            // 实际值应被保留
            expect(!siteInfo.siteName || siteInfo.siteName.length === 0 || result.siteName === siteInfo.siteName).toBe(true);
            expect(!siteInfo.siteTitle || siteInfo.siteTitle.length === 0 || result.siteTitle === siteInfo.siteTitle).toBe(true);
            expect(!siteInfo.logo || siteInfo.logo.length === 0 || result.logo === siteInfo.logo).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * 测试：isValidSiteInfo 应该正确验证站点信息
     * 有效的站点信息应返回 true，无效的应返回 false
     */
    test('isValidSiteInfo should correctly validate site info', () => {
      fc.assert(
        fc.property(
          siteInfoArb,
          (siteInfo) => {
            // 完整的站点信息应该是有效的
            expect(isValidSiteInfo(siteInfo)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * 测试：isValidSiteInfo 应该拒绝无效输入
     * 无效输入应返回 false 而不是抛出异常
     */
    test('isValidSiteInfo should reject invalid inputs without throwing', () => {
      fc.assert(
        fc.property(
          invalidInputArb,
          (invalidInput) => {
            // 不应抛出异常
            let result: boolean;
            expect(() => {
              result = isValidSiteInfo(invalidInput);
            }).not.toThrow();

            // 无效输入应返回 false
            expect(result!).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * 测试：DEFAULT_SITE_INFO 应该是有效的站点信息
     */
    test('DEFAULT_SITE_INFO should be valid', () => {
      expect(isValidSiteInfo(DEFAULT_SITE_INFO)).toBe(true);
      
      // 所有必需字段应该有非空值
      expect(DEFAULT_SITE_INFO.siteName.length).toBeGreaterThan(0);
      expect(DEFAULT_SITE_INFO.siteTitle.length).toBeGreaterThan(0);
      expect(DEFAULT_SITE_INFO.description.length).toBeGreaterThan(0);
      expect(DEFAULT_SITE_INFO.keywords.length).toBeGreaterThan(0);
      expect(DEFAULT_SITE_INFO.logo.length).toBeGreaterThan(0);
      expect(DEFAULT_SITE_INFO.favicon.length).toBeGreaterThan(0);
    });

    /**
     * 测试：null/undefined 输入应该使用默认值
     * 这是降级处理的核心场景
     */
    test('null/undefined input should fallback to defaults', () => {
      fc.assert(
        fc.property(
          nullishArb,
          (nullishValue) => {
            const result = mergeSiteInfoWithDefaults(nullishValue);
            
            // 应该返回默认值
            expect(result.siteName).toBe(DEFAULT_SITE_INFO.siteName);
            expect(result.siteTitle).toBe(DEFAULT_SITE_INFO.siteTitle);
            expect(result.description).toBe(DEFAULT_SITE_INFO.description);
            expect(result.keywords).toBe(DEFAULT_SITE_INFO.keywords);
            expect(result.logo).toBe(DEFAULT_SITE_INFO.logo);
            expect(result.favicon).toBe(DEFAULT_SITE_INFO.favicon);
          }
        ),
        { numRuns: 10 }
      );
    });

    /**
     * 测试：空字符串字段应该使用默认值
     */
    test('empty string fields should fallback to defaults', () => {
      const emptyInfo: Partial<SiteInfo> = {
        id: 1,
        siteName: '',
        siteTitle: '',
        description: '',
        keywords: '',
        logo: '',
        favicon: '',
      };

      const result = mergeSiteInfoWithDefaults(emptyInfo);

      // 空字符串应该被默认值替换
      expect(result.siteName).toBe(DEFAULT_SITE_INFO.siteName);
      expect(result.siteTitle).toBe(DEFAULT_SITE_INFO.siteTitle);
      expect(result.description).toBe(DEFAULT_SITE_INFO.description);
      expect(result.keywords).toBe(DEFAULT_SITE_INFO.keywords);
      expect(result.logo).toBe(DEFAULT_SITE_INFO.logo);
      expect(result.favicon).toBe(DEFAULT_SITE_INFO.favicon);
      
      // id 应该保留
      expect(result.id).toBe(1);
    });
  });
});
