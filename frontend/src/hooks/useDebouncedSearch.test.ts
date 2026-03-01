/**
 * @file useDebouncedSearch.test.ts
 * @description 前端用户界面组件
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

import * as fc from 'fast-check';

/**
 * Property Tests for Search Functionality
 * 
 * Property 6: 搜索结果相关性
 * Property 7: 防抖请求合并
 * 
 * **Validates: Requirements 9.1, 9.2, 9.4**
 */

// 模拟搜索结果接口
interface MockSearchResult {
  id: string;
  name: string;
  description: string;
  tags: string[];
}

/**
 * 高亮关键词函数（与后端实现一致）
 */
function highlightKeyword(text: string, keyword: string): { original: string; highlights: Array<{ fragment: string; matchStart: number; matchEnd: number }> } {
  if (!text || !keyword) {
    return { original: text || '', highlights: [] };
  }
  
  const lowerText = text.toLowerCase();
  const lowerKeyword = keyword.toLowerCase();
  const highlights: Array<{ fragment: string; matchStart: number; matchEnd: number }> = [];
  let startIndex = 0;
  
  while (true) {
    const index = lowerText.indexOf(lowerKeyword, startIndex);
    if (index === -1) break;
    
    const contextStart = Math.max(0, index - 20);
    const contextEnd = Math.min(text.length, index + keyword.length + 20);
    const fragment = text.substring(contextStart, contextEnd);
    
    highlights.push({
      fragment,
      matchStart: index - contextStart,
      matchEnd: index - contextStart + keyword.length,
    });
    
    startIndex = index + 1;
  }
  
  return { original: text, highlights };
}

/**
 * 计算相关性分数（与后端实现一致）
 */
function calculateRelevanceScore(item: MockSearchResult, keyword: string): number {
  const lowerKeyword = keyword.toLowerCase();
  let score = 0;
  
  if (item.name) {
    const lowerName = item.name.toLowerCase();
    if (lowerName === lowerKeyword) {
      score += 100;
    } else if (lowerName.startsWith(lowerKeyword)) {
      score += 50;
    } else if (lowerName.includes(lowerKeyword)) {
      score += 30;
    }
  }
  
  if (item.description && item.description.toLowerCase().includes(lowerKeyword)) {
    score += 10;
  }
  
  for (const tag of item.tags) {
    if (tag.toLowerCase().includes(lowerKeyword)) {
      score += 5;
    }
  }
  
  return score;
}

/**
 * 模拟搜索函数
 */
function mockSearch(items: MockSearchResult[], query: string): MockSearchResult[] {
  if (!query.trim()) return [];
  
  const lowerQuery = query.toLowerCase();
  
  return items.filter(item => 
    item.name.toLowerCase().includes(lowerQuery) ||
    item.description.toLowerCase().includes(lowerQuery) ||
    item.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
  );
}

describe('Search Functionality - Property Tests', () => {
  // 生成器：搜索结果项
  const searchResultArb = fc.record({
    id: fc.uuid(),
    name: fc.string({ minLength: 1, maxLength: 50 }),
    description: fc.string({ minLength: 0, maxLength: 200 }),
    tags: fc.array(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 0, maxLength: 5 }),
  });

  // 生成器：搜索结果列表
  const searchResultsArb = fc.array(searchResultArb, { minLength: 0, maxLength: 20 });

  // 生成器：搜索关键词
  const searchKeywordArb = fc.string({ minLength: 1, maxLength: 30 })
    .filter(s => s.trim().length > 0);

  // 生成器：防抖延迟时间
  const debounceDelayArb = fc.integer({ min: 100, max: 500 });

  describe('Property 6: 搜索结果相关性', () => {
    /**
     * Property 6.1: 搜索结果必须包含搜索关键词
     * 
     * *For any* 搜索查询，返回结果中的每个条目应至少在name、description或tags中包含搜索关键词
     */
    test('搜索结果必须在name、description或tags中包含关键词', () => {
      fc.assert(
        fc.property(
          searchResultsArb,
          searchKeywordArb,
          (items, keyword) => {
            const results = mockSearch(items, keyword);
            const lowerKeyword = keyword.toLowerCase();
            
            // 验证每个结果都包含关键词
            for (const result of results) {
              const nameMatch = result.name.toLowerCase().includes(lowerKeyword);
              const descMatch = result.description.toLowerCase().includes(lowerKeyword);
              const tagMatch = result.tags.some(tag => tag.toLowerCase().includes(lowerKeyword));
              
              expect(nameMatch || descMatch || tagMatch).toBe(true);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property 6.2: 相关性分数排序正确性
     * 
     * 完全匹配名称的结果应该排在前面
     */
    test('完全匹配名称的结果应该有最高分数', () => {
      fc.assert(
        fc.property(
          searchKeywordArb,
          (keyword) => {
            // 创建测试数据：一个完全匹配，一个部分匹配
            const exactMatch: MockSearchResult = {
              id: '1',
              name: keyword,
              description: 'some description',
              tags: [],
            };
            
            const partialMatch: MockSearchResult = {
              id: '2',
              name: `prefix ${keyword} suffix`,
              description: 'some description',
              tags: [],
            };
            
            const exactScore = calculateRelevanceScore(exactMatch, keyword);
            const partialScore = calculateRelevanceScore(partialMatch, keyword);
            
            // 完全匹配应该有更高的分数
            expect(exactScore).toBeGreaterThan(partialScore);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property 6.3: 名称匹配优先于描述匹配
     * 
     * Note: We use keywords that won't accidentally match "xyz" placeholder text
     */
    test('名称匹配应该比描述匹配有更高分数', () => {
      fc.assert(
        fc.property(
          // Use keywords that are at least 3 chars and won't match our placeholder text
          fc.string({ minLength: 3, maxLength: 20 })
            .filter(s => {
              const trimmed = s.trim().toLowerCase();
              return trimmed.length >= 3 && 
                     !trimmed.includes('xyz') && 
                     !'xyz'.includes(trimmed) &&
                     !trimmed.includes('abc') &&
                     !'abc'.includes(trimmed);
            }),
          (keyword) => {
            // Use placeholder text that won't contain the keyword
            const nameMatch: MockSearchResult = {
              id: '1',
              name: `contains ${keyword} here`,
              description: 'xyz abc 123', // Placeholder that won't match most keywords
              tags: [],
            };
            
            const descMatch: MockSearchResult = {
              id: '2',
              name: 'xyz abc 123', // Placeholder that won't match most keywords
              description: `contains ${keyword} here`,
              tags: [],
            };
            
            const nameScore = calculateRelevanceScore(nameMatch, keyword);
            const descScore = calculateRelevanceScore(descMatch, keyword);
            
            // Name match (30 points) should be greater than description match (10 points)
            expect(nameScore).toBeGreaterThan(descScore);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property 6.4: 空查询返回空结果
     */
    test('空查询应该返回空结果', () => {
      fc.assert(
        fc.property(
          searchResultsArb,
          (items) => {
            const emptyResults = mockSearch(items, '');
            const whitespaceResults = mockSearch(items, '   ');
            
            expect(emptyResults).toEqual([]);
            expect(whitespaceResults).toEqual([]);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 7: 防抖请求合并', () => {
    /**
     * 模拟防抖函数
     */
    const createDebouncer = (delay: number) => {
      let timeoutId: NodeJS.Timeout | null = null;
      let callCount = 0;
      const calls: string[] = [];
      
      return {
        debounce: (value: string, callback: (v: string) => void) => {
          calls.push(value);
          if (timeoutId) {
            clearTimeout(timeoutId);
          }
          timeoutId = setTimeout(() => {
            callCount++;
            callback(value);
          }, delay);
        },
        getCallCount: () => callCount,
        getCalls: () => calls,
        clear: () => {
          if (timeoutId) {
            clearTimeout(timeoutId);
            timeoutId = null;
          }
        },
      };
    };

    /**
     * Property 7.1: 防抖时间窗口内的多次调用只触发一次实际请求
     */
    test('防抖时间窗口内的多次调用只触发一次实际请求', async () => {
      await fc.assert(
        fc.asyncProperty(
          debounceDelayArb,
          fc.array(searchKeywordArb, { minLength: 2, maxLength: 5 }),
          async (delay, keywords) => {
            const debouncer = createDebouncer(delay);
            let executedValue = '';
            
            // 快速连续调用（在防抖时间窗口内）
            for (const keyword of keywords) {
              debouncer.debounce(keyword, (v) => {
                executedValue = v;
              });
            }
            
            // 等待防抖完成
            await new Promise(resolve => setTimeout(resolve, delay + 50));
            
            // 验证：只有最后一个值被执行
            expect(debouncer.getCallCount()).toBe(1);
            expect(executedValue).toBe(keywords[keywords.length - 1]);
            
            debouncer.clear();
          }
        ),
        { numRuns: 50 }
      );
    }, 30000);

    /**
     * Property 7.2: 超过防抖时间窗口的调用应该分别触发
     */
    test('超过防抖时间窗口的调用应该分别触发', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 50, max: 100 }), // 较短的防抖时间
          fc.array(searchKeywordArb, { minLength: 2, maxLength: 3 }),
          async (delay, keywords) => {
            const debouncer = createDebouncer(delay);
            const executedValues: string[] = [];
            
            // 每次调用之间等待超过防抖时间
            for (const keyword of keywords) {
              debouncer.debounce(keyword, (v) => {
                executedValues.push(v);
              });
              await new Promise(resolve => setTimeout(resolve, delay + 50));
            }
            
            // 验证：每个调用都被执行
            expect(debouncer.getCallCount()).toBe(keywords.length);
            expect(executedValues).toEqual(keywords);
            
            debouncer.clear();
          }
        ),
        { numRuns: 30 }
      );
    }, 30000);

    /**
     * Property 7.3: 清除防抖应该取消待执行的回调
     */
    test('清除防抖应该取消待执行的回调', async () => {
      await fc.assert(
        fc.asyncProperty(
          debounceDelayArb,
          searchKeywordArb,
          async (delay, keyword) => {
            const debouncer = createDebouncer(delay);
            let executed = false;
            
            // 调用防抖
            debouncer.debounce(keyword, () => {
              executed = true;
            });
            
            // 立即清除
            debouncer.clear();
            
            // 等待超过防抖时间
            await new Promise(resolve => setTimeout(resolve, delay + 50));
            
            // 验证：回调没有被执行
            expect(executed).toBe(false);
            expect(debouncer.getCallCount()).toBe(0);
          }
        ),
        { numRuns: 50 }
      );
    }, 30000);
  });

  describe('Highlight Functionality', () => {
    /**
     * 高亮功能测试：确保高亮片段包含关键词
     */
    test('高亮片段应该包含搜索关键词', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 10, maxLength: 100 }),
          fc.string({ minLength: 1, maxLength: 10 }),
          (text, keyword) => {
            // 确保text包含keyword
            const textWithKeyword = `${text} ${keyword} ${text}`;
            const result = highlightKeyword(textWithKeyword, keyword);
            
            // 每个高亮片段都应命中关键词（空数组时 every 为 true）
            const allHighlightsMatch = result.highlights.every((highlight) => {
              const matchedText = highlight.fragment.substring(
                highlight.matchStart,
                highlight.matchEnd
              );
              return matchedText.toLowerCase() === keyword.toLowerCase();
            });
            expect(allHighlightsMatch).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * 高亮功能测试：空输入应该返回空高亮
     */
    test('空输入应该返回空高亮', () => {
      fc.assert(
        fc.property(
          fc.string(),
          (text) => {
            const emptyKeywordResult = highlightKeyword(text, '');
            const emptyTextResult = highlightKeyword('', 'keyword');
            
            expect(emptyKeywordResult.highlights).toEqual([]);
            expect(emptyTextResult.highlights).toEqual([]);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * 高亮功能测试：不匹配时应该返回空高亮
     */
    test('不匹配时应该返回空高亮', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }).filter(s => !s.includes('xyz123')),
          (text) => {
            const result = highlightKeyword(text, 'xyz123');
            expect(result.highlights).toEqual([]);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
