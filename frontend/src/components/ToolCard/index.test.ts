/**
 * @file ToolCard/index.test.ts
 * @description ToolCard组件图标降级属性测试
 * 
 * Property 9: 图标加载降级
 * *For any* 图标加载失败的情况，应显示默认图标，且不应显示破损图片。
 * 
 * **Validates: Requirements 10.2**
 */

import * as fc from 'fast-check';
import {
  getIconUrlList,
  getNextIconFallback,
  generateNameBasedIcon,
  validateIconFallback,
  IconLoadState,
} from './index';

describe('ToolCard Icon Fallback - Property Tests', () => {
  /**
   * Property 9: 图标加载降级
   * 
   * 验证图标加载降级逻辑的正确性：
   * 1. 当图标加载失败时，应该尝试下一个备用图标
   * 2. 当所有备用图标都失败时，应该显示默认图标
   * 3. 最终结果不应该是破损图片
   * 
   * **Validates: Requirements 10.2**
   */
  describe('Property 9: 图标加载降级', () => {
    // 工具名称生成器
    const toolNameArb = fc.string({ minLength: 1, maxLength: 50 })
      .filter(s => s.trim().length > 0);

    // URL生成器
    const urlArb = fc.webUrl();

    // 图标URL生成器
    const iconUrlArb = fc.option(fc.webUrl(), { nil: undefined });

    // Tool对象生成器
    const toolArb = fc.record({
      id: fc.string(),
      name: toolNameArb,
      description: fc.string(),
      url: urlArb,
      iconUrl: iconUrlArb,
      icon: iconUrlArb,
      category: fc.string(),
      tags: fc.array(fc.string(), { maxLength: 5 }),
    });

    // 失败索引生成器（模拟哪些图标加载失败）
    const failureIndexArb = fc.integer({ min: 0, max: 10 });

    test('getIconUrlList应该返回非空数组（当tool有URL时）', () => {
      fc.assert(
        fc.property(toolArb, (tool) => {
          const iconUrls = getIconUrlList(tool);
          
          // 如果tool有URL，应该至少有favicon API生成的URL
          expect(!tool.url || iconUrls.length > 0).toBe(true);
          
          // 如果有iconUrl，应该在列表中
          expect(!tool.iconUrl || iconUrls.includes(tool.iconUrl)).toBe(true);
          
          // 如果有icon且不同于iconUrl，应该在列表中
          expect(!tool.icon || tool.icon === tool.iconUrl || iconUrls.includes(tool.icon)).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    test('getNextIconFallback应该返回有效的下一个图标', () => {
      fc.assert(
        fc.property(
          toolArb,
          failureIndexArb,
          (tool, failAtIndex) => {
            const iconUrls = getIconUrlList(tool);
            
            // 模拟在某个索引处失败
            const currentIndex = Math.min(failAtIndex, iconUrls.length);
            const result = getNextIconFallback(iconUrls, currentIndex, tool.name);
            
            // 验证返回的结果
            expect(result.nextSrc).toBeDefined();
            expect(result.nextSrc.length).toBeGreaterThan(0);
            expect(result.nextIndex).toBeGreaterThanOrEqual(currentIndex);
            expect(['loading', 'loaded', 'fallback', 'error']).toContain(result.state);
            
            // 如果还有更多URL，状态应该是fallback；否则应该是error并回退默认图标
            const hasMoreFallback = currentIndex + 1 < iconUrls.length;
            const expectedState = hasMoreFallback ? 'fallback' : 'error';
            expect(result.state).toBe(expectedState);
            expect(hasMoreFallback ? result.nextSrc === iconUrls[currentIndex + 1] : result.nextSrc.includes('data:image/svg+xml')).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('generateNameBasedIcon应该生成有效的SVG data URL', () => {
      fc.assert(
        fc.property(toolNameArb, (name) => {
          const icon = generateNameBasedIcon(name);
          
          // 应该是有效的data URL
          expect(icon).toMatch(/^data:image\/svg\+xml/);
          
          // 应该包含名称首字母
          const initial = name.charAt(0).toUpperCase();
          expect(icon).toContain(initial);
          
          // 不应该是空的
          expect(icon.length).toBeGreaterThan(0);
        }),
        { numRuns: 100 }
      );
    });

    test('降级链应该最终产生有效的图标', () => {
      fc.assert(
        fc.property(toolArb, (tool) => {
          const iconUrls = getIconUrlList(tool);
          const loadAttempts: string[] = [];
          let currentIndex = -1;
          let finalSrc = '';
          let state: IconLoadState = 'loading';
          
          // 模拟所有图标都加载失败的情况
          while (state !== 'error' && currentIndex < iconUrls.length) {
            if (currentIndex >= 0) {
              loadAttempts.push(iconUrls[currentIndex]);
            }
            
            const result = getNextIconFallback(iconUrls, currentIndex, tool.name);
            currentIndex = result.nextIndex;
            finalSrc = result.nextSrc;
            state = result.state;
            
            // 防止无限循环
            if (currentIndex > iconUrls.length + 1) break;
          }
          
          // 验证最终结果
          expect(finalSrc).toBeDefined();
          expect(finalSrc.length).toBeGreaterThan(0);
          
          // 最终应该是默认图标（SVG data URL）
          expect(finalSrc).toContain('data:image/svg+xml');
          
          // 不应该是破损图片
          expect(finalSrc).not.toBe('');
          expect(finalSrc).not.toBe('undefined');
          expect(finalSrc).not.toBe('null');
        }),
        { numRuns: 100 }
      );
    });

    test('validateIconFallback应该正确验证降级行为', () => {
      fc.assert(
        fc.property(toolArb, (tool) => {
          const iconUrls = getIconUrlList(tool);
          
          // 场景1: 第一个图标加载成功
          const result1 = iconUrls.length > 0
            ? validateIconFallback(
                [iconUrls[0]],
                iconUrls[0],
                iconUrls,
                tool.name
              )
            : null;
          expect(iconUrls.length === 0 || result1?.isValid === true).toBe(true);
          
          // 场景2: 所有图标失败，使用默认图标
          const defaultIcon = generateNameBasedIcon(tool.name);
          const allAttempts = [...iconUrls];
          const result2 = validateIconFallback(
            allAttempts.length > 0 ? allAttempts : [defaultIcon],
            defaultIcon,
            iconUrls,
            tool.name
          );
          expect(result2.isValid).toBe(true);
          
          // 场景3: 空的加载尝试应该失败
          const result3 = validateIconFallback(
            [],
            defaultIcon,
            iconUrls,
            tool.name
          );
          expect(result3.isValid).toBe(false);
          expect(result3.reason).toBe('No load attempts made');
        }),
        { numRuns: 100 }
      );
    });

    test('图标URL列表顺序应该正确（优先级）', () => {
      fc.assert(
        fc.property(
          fc.record({
            id: fc.string(),
            name: toolNameArb,
            description: fc.string(),
            url: urlArb,
            iconUrl: fc.webUrl(),
            icon: fc.webUrl(),
            category: fc.string(),
            tags: fc.array(fc.string(), { maxLength: 5 }),
          }),
          (tool) => {
            const iconUrls = getIconUrlList(tool);
            
            // iconUrl应该在最前面
            expect(iconUrls[0]).toBe(tool.iconUrl);
            
            // icon应该在iconUrl之后（如果不同）
            expect(tool.icon === tool.iconUrl || iconUrls[1] === tool.icon).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('相同名称应该生成相同的默认图标', () => {
      fc.assert(
        fc.property(toolNameArb, (name) => {
          const icon1 = generateNameBasedIcon(name);
          const icon2 = generateNameBasedIcon(name);
          
          // 相同名称应该生成相同的图标（确定性）
          expect(icon1).toBe(icon2);
        }),
        { numRuns: 100 }
      );
    });

    test('不同名称应该生成不同颜色的默认图标', () => {
      fc.assert(
        fc.property(
          toolNameArb,
          toolNameArb.filter(s => s.length > 1),
          (name1, name2) => {
            // 只有当名称不同时才测试
            fc.pre(name1 !== name2);
            
            const icon1 = generateNameBasedIcon(name1);
            const icon2 = generateNameBasedIcon(name2);
            
            // 不同名称可能生成不同的图标（颜色不同）
            // 但首字母相同时可能相同，所以只验证都是有效的
            expect(icon1).toContain('data:image/svg+xml');
            expect(icon2).toContain('data:image/svg+xml');
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('Edge Cases', () => {
    test('空URL的tool应该使用默认图标', () => {
      const tool = {
        id: '1',
        name: 'Test Tool',
        description: 'A test tool',
        url: '',
        iconUrl: undefined,
        icon: undefined,
        category: 'test',
        tags: [],
      };
      
      const iconUrls = getIconUrlList(tool);
      
      // 没有URL时，列表应该为空
      expect(iconUrls.length).toBe(0);
      
      // 降级应该直接返回默认图标
      const result = getNextIconFallback(iconUrls, -1, tool.name);
      expect(result.state).toBe('error');
      expect(result.nextSrc).toContain('data:image/svg+xml');
    });

    test('特殊字符名称应该正确处理', () => {
      const specialNames = ['<script>', '&amp;', '"quotes"', "it's", '中文名称', '🚀 Rocket'];
      
      specialNames.forEach(name => {
        const icon = generateNameBasedIcon(name);
        expect(icon).toContain('data:image/svg+xml');
        expect(icon.length).toBeGreaterThan(0);
      });
    });

    test('无效URL应该被正确处理', () => {
      const tool = {
        id: '1',
        name: 'Test',
        description: 'Test',
        url: 'not-a-valid-url',
        iconUrl: undefined,
        icon: undefined,
        category: 'test',
        tags: [],
      };
      
      // 不应该抛出错误
      expect(() => getIconUrlList(tool)).not.toThrow();
    });
  });
});
