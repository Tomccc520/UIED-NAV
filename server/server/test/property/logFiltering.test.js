/**
 * @file test/property/logFiltering.test.js
 * @description 属性测试：日志筛选正确性
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

// Feature: detail-page-and-ai-assistant, Property 10: 日志筛选正确性
// **Validates: Requirements 9.3**

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

// ============================================================
// 纯函数：按 feature_type 筛选日志
// 提取自 service/uied/aiUsageLog.js list() 方法的核心筛选逻辑
// ============================================================

/**
 * 按 feature_type 筛选 AI 使用日志
 *
 * 逻辑与 aiUsageLog.js list() 方法中的 where 条件一致：
 *   - 如果提供了 feature_type 筛选条件，只返回匹配的日志
 *   - 如果未提供筛选条件（null/undefined/空字符串），返回所有日志
 *
 * @param {Array} logs - AI 使用日志数组
 * @param {string|null|undefined} filterType - 筛选的 feature_type
 * @returns {Array} 筛选后的日志数组
 */
function filterLogsByType(logs, filterType) {
  if (!filterType) {
    return logs;
  }
  return logs.filter(log => log.feature_type === filterType);
}

// ============================================================
// fast-check 生成器
// ============================================================

/** 有效的 feature_type 值 */
const FEATURE_TYPES = ['chat', 'generate', 'search', 'batch_generate'];

/**
 * 生成单条 AI 使用日志条目
 */
const logEntryArbitrary = fc.record({
  feature_type: fc.constantFrom(...FEATURE_TYPES),
  tokens_used: fc.integer({ min: 0, max: 100000 }),
  response_status: fc.constantFrom('success', 'failed'),
});

/**
 * 生成 AI 使用日志数组（0 ~ 200 条）
 */
const logArrayArbitrary = fc.array(logEntryArbitrary, { minLength: 0, maxLength: 200 });

/**
 * 生成筛选条件（从有效 feature_type 中选择）
 */
const filterTypeArbitrary = fc.constantFrom(...FEATURE_TYPES);

// ============================================================
// 属性测试
// ============================================================

describe('Property 10: 日志筛选正确性', () => {

  it('筛选后返回的所有日志记录的 feature_type 应与筛选条件匹配', () => {
    fc.assert(
      fc.property(logArrayArbitrary, filterTypeArbitrary, (logs, filterType) => {
        const filtered = filterLogsByType(logs, filterType);

        // 核心属性：每条筛选结果的 feature_type 都应与筛选条件一致
        for (const log of filtered) {
          expect(log.feature_type).toBe(filterType);
        }
      }),
      { numRuns: 200 }
    );
  });

  it('筛选后的数量应等于原始日志中匹配该 feature_type 的数量', () => {
    fc.assert(
      fc.property(logArrayArbitrary, filterTypeArbitrary, (logs, filterType) => {
        const filtered = filterLogsByType(logs, filterType);

        // 手动计算原始日志中匹配的数量
        const expectedCount = logs.filter(log => log.feature_type === filterType).length;
        expect(filtered.length).toBe(expectedCount);
      }),
      { numRuns: 200 }
    );
  });

  it('筛选结果数量应小于等于原始日志数量', () => {
    fc.assert(
      fc.property(logArrayArbitrary, filterTypeArbitrary, (logs, filterType) => {
        const filtered = filterLogsByType(logs, filterType);
        expect(filtered.length).toBeLessThanOrEqual(logs.length);
      }),
      { numRuns: 200 }
    );
  });

  it('对所有 feature_type 分别筛选后的数量之和应等于总日志数', () => {
    fc.assert(
      fc.property(logArrayArbitrary, (logs) => {
        let totalFiltered = 0;
        for (const type of FEATURE_TYPES) {
          totalFiltered += filterLogsByType(logs, type).length;
        }
        expect(totalFiltered).toBe(logs.length);
      }),
      { numRuns: 200 }
    );
  });

  it('不提供筛选条件时应返回所有日志', () => {
    fc.assert(
      fc.property(logArrayArbitrary, (logs) => {
        // null、undefined、空字符串都应返回全部日志
        expect(filterLogsByType(logs, null).length).toBe(logs.length);
        expect(filterLogsByType(logs, undefined).length).toBe(logs.length);
        expect(filterLogsByType(logs, '').length).toBe(logs.length);
      }),
      { numRuns: 200 }
    );
  });

  it('空日志集合筛选后应返回空数组', () => {
    fc.assert(
      fc.property(filterTypeArbitrary, (filterType) => {
        const filtered = filterLogsByType([], filterType);
        expect(filtered).toEqual([]);
        expect(filtered.length).toBe(0);
      }),
      { numRuns: 100 }
    );
  });

  it('筛选结果应保持原始日志的顺序', () => {
    fc.assert(
      fc.property(logArrayArbitrary, filterTypeArbitrary, (logs, filterType) => {
        const filtered = filterLogsByType(logs, filterType);

        // 手动收集匹配项并验证顺序一致
        const expected = [];
        for (const log of logs) {
          if (log.feature_type === filterType) {
            expected.push(log);
          }
        }
        expect(filtered).toEqual(expected);
      }),
      { numRuns: 200 }
    );
  });

  it('单一类型日志集合筛选该类型应返回全部', () => {
    fc.assert(
      fc.property(
        filterTypeArbitrary,
        fc.integer({ min: 1, max: 50 }),
        (type, count) => {
          // 生成全部为同一 feature_type 的日志
          const logs = Array.from({ length: count }, (_, i) => ({
            feature_type: type,
            tokens_used: i * 100,
            response_status: 'success',
          }));

          const filtered = filterLogsByType(logs, type);
          expect(filtered.length).toBe(count);
        }
      ),
      { numRuns: 200 }
    );
  });

  it('单一类型日志集合筛选其他类型应返回空数组', () => {
    fc.assert(
      fc.property(
        filterTypeArbitrary,
        fc.integer({ min: 1, max: 50 }),
        (type, count) => {
          const logs = Array.from({ length: count }, (_, i) => ({
            feature_type: type,
            tokens_used: i * 100,
            response_status: 'success',
          }));

          // 筛选一个不同的类型
          const otherTypes = FEATURE_TYPES.filter(t => t !== type);
          if (otherTypes.length > 0) {
            const otherType = otherTypes[0];
            const filtered = filterLogsByType(logs, otherType);
            expect(filtered.length).toBe(0);
          }
        }
      ),
      { numRuns: 200 }
    );
  });
});
