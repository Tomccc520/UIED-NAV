/**
 * @file test/property/usageStatsAggregation.test.js
 * @description 属性测试：使用统计聚合正确性
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

// Feature: detail-page-and-ai-assistant, Property 9: 使用统计聚合正确性
// **Validates: Requirements 9.2**

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

// ============================================================
// 纯函数：从日志集合计算聚合统计
// 提取自 service/uied/aiUsageLog.js stats() 方法的核心逻辑
// ============================================================

/**
 * 计算 AI 使用日志的聚合统计数据
 *
 * 逻辑与 aiUsageLog.js stats() 方法一致：
 *   - totalCalls: 日志总数
 *   - totalTokens: 所有日志 tokens_used 之和
 *   - successRate: 成功日志数 / 总数 * 100，保留 1 位小数（Math.round(x * 1000) / 10）
 *     如果没有日志则为 0
 *
 * @param {Array} logs - AI 使用日志数组
 * @returns {Object} 聚合统计结果
 */
function computeUsageStats(logs) {
  const totalCalls = logs.length;
  const totalTokens = logs.reduce((sum, log) => sum + log.tokens_used, 0);
  const successCount = logs.filter(log => log.response_status === 'success').length;
  const successRate = totalCalls > 0
    ? Math.round((successCount / totalCalls) * 1000) / 10
    : 0;

  return {
    totalCalls,
    totalTokens,
    successRate,
  };
}

// ============================================================
// fast-check 生成器
// ============================================================

/**
 * 生成单条 AI 使用日志条目
 * 字段约束：
 *   - feature_type: 'chat' | 'generate' | 'search' | 'batch_generate'
 *   - tokens_used: 非负整数 (0 ~ 100000)
 *   - response_status: 'success' | 'failed'
 */
const logEntryArbitrary = fc.record({
  feature_type: fc.constantFrom('chat', 'generate', 'search', 'batch_generate'),
  tokens_used: fc.integer({ min: 0, max: 100000 }),
  response_status: fc.constantFrom('success', 'failed'),
});

/**
 * 生成 AI 使用日志数组（0 ~ 200 条）
 */
const logArrayArbitrary = fc.array(logEntryArbitrary, { minLength: 0, maxLength: 200 });

// ============================================================
// 属性测试
// ============================================================

describe('Property 9: 使用统计聚合正确性', () => {

  it('totalCalls 应等于日志总数', () => {
    fc.assert(
      fc.property(logArrayArbitrary, (logs) => {
        const stats = computeUsageStats(logs);
        expect(stats.totalCalls).toBe(logs.length);
      }),
      { numRuns: 200 }
    );
  });

  it('totalTokens 应等于所有日志 tokens_used 之和', () => {
    fc.assert(
      fc.property(logArrayArbitrary, (logs) => {
        const stats = computeUsageStats(logs);
        const expectedTokens = logs.reduce((sum, log) => sum + log.tokens_used, 0);
        expect(stats.totalTokens).toBe(expectedTokens);
      }),
      { numRuns: 200 }
    );
  });

  it('successRate 应等于成功日志数除以总数的百分比（保留 1 位小数）', () => {
    fc.assert(
      fc.property(logArrayArbitrary, (logs) => {
        const stats = computeUsageStats(logs);

        if (logs.length === 0) {
          // 空日志集合，成功率应为 0
          expect(stats.successRate).toBe(0);
        } else {
          const successCount = logs.filter(l => l.response_status === 'success').length;
          const expectedRate = Math.round((successCount / logs.length) * 1000) / 10;
          expect(stats.successRate).toBe(expectedRate);
        }
      }),
      { numRuns: 200 }
    );
  });

  it('successRate 应在 0 到 100 之间（含边界）', () => {
    fc.assert(
      fc.property(logArrayArbitrary, (logs) => {
        const stats = computeUsageStats(logs);
        expect(stats.successRate).toBeGreaterThanOrEqual(0);
        expect(stats.successRate).toBeLessThanOrEqual(100);
      }),
      { numRuns: 200 }
    );
  });

  it('全部成功的日志集合，successRate 应为 100', () => {
    const allSuccessLogs = fc.array(
      fc.record({
        feature_type: fc.constantFrom('chat', 'generate', 'search', 'batch_generate'),
        tokens_used: fc.integer({ min: 0, max: 100000 }),
        response_status: fc.constant('success'),
      }),
      { minLength: 1, maxLength: 100 }
    );

    fc.assert(
      fc.property(allSuccessLogs, (logs) => {
        const stats = computeUsageStats(logs);
        expect(stats.successRate).toBe(100);
      }),
      { numRuns: 200 }
    );
  });

  it('全部失败的日志集合，successRate 应为 0', () => {
    const allFailedLogs = fc.array(
      fc.record({
        feature_type: fc.constantFrom('chat', 'generate', 'search', 'batch_generate'),
        tokens_used: fc.integer({ min: 0, max: 100000 }),
        response_status: fc.constant('failed'),
      }),
      { minLength: 1, maxLength: 100 }
    );

    fc.assert(
      fc.property(allFailedLogs, (logs) => {
        const stats = computeUsageStats(logs);
        expect(stats.successRate).toBe(0);
      }),
      { numRuns: 200 }
    );
  });

  it('空日志集合应返回零值统计', () => {
    const stats = computeUsageStats([]);
    expect(stats.totalCalls).toBe(0);
    expect(stats.totalTokens).toBe(0);
    expect(stats.successRate).toBe(0);
  });

  it('totalTokens 应为非负数', () => {
    fc.assert(
      fc.property(logArrayArbitrary, (logs) => {
        const stats = computeUsageStats(logs);
        expect(stats.totalTokens).toBeGreaterThanOrEqual(0);
      }),
      { numRuns: 200 }
    );
  });

  it('单条日志的统计应与该日志数据一致', () => {
    fc.assert(
      fc.property(logEntryArbitrary, (log) => {
        const stats = computeUsageStats([log]);
        expect(stats.totalCalls).toBe(1);
        expect(stats.totalTokens).toBe(log.tokens_used);
        expect(stats.successRate).toBe(log.response_status === 'success' ? 100 : 0);
      }),
      { numRuns: 200 }
    );
  });
});
