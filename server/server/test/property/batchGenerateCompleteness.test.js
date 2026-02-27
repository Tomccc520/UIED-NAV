/**
 * Feature: detail-page-and-ai-assistant, Property 5: 批量生成完整处理与错误恢复
 * Validates: Requirements 8.1, 8.4
 */

/**
 * @file test/property/batchGenerateCompleteness.test.js
 * @description 属性测试：批量生成完整处理与错误恢复
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

// ============================================================
// 纯函数：模拟批量生成的核心处理逻辑
// 提取自 service/uied/aiConfig.js batchGenerate() 方法
// ============================================================

/**
 * 模拟批量生成网站信息
 * @param {number[]} websiteIds - 要生成的网站 ID 列表
 * @param {Object} websiteMap - 网站数据映射 { id: { name, url } }
 * @param {Set} failSet - 会失败的网站 ID 集合（模拟 AI 调用失败）
 * @returns {Object} { taskId, total, results }
 */
function simulateBatchGenerate(websiteIds, websiteMap, failSet) {
  const results = [];

  for (const websiteId of websiteIds) {
    const website = websiteMap[websiteId];

    if (!website) {
      results.push({
        websiteId,
        name: '',
        status: 'failed',
        error: '网站不存在或已删除',
      });
      continue;
    }

    if (failSet.has(websiteId)) {
      results.push({
        websiteId: website.id,
        name: website.name,
        status: 'failed',
        error: 'AI 生成失败',
      });
      continue;
    }

    results.push({
      websiteId: website.id,
      name: website.name,
      status: 'success',
      description: `Generated description for ${website.name}`,
      tags: `tag1, tag2`,
    });
  }

  return {
    taskId: `batch_${Date.now()}`,
    total: websiteIds.length,
    results,
  };
}

// ============================================================
// fast-check 生成器
// ============================================================

const websiteIdArbitrary = fc.integer({ min: 1, max: 1000 });

const websiteEntryArbitrary = fc.record({
  id: websiteIdArbitrary,
  name: fc.string({ minLength: 1, maxLength: 50 }),
  url: fc.webUrl(),
});

/**
 * 生成测试场景：websiteIds + websiteMap + failSet
 */
const batchScenarioArbitrary = fc.tuple(
  fc.array(websiteIdArbitrary, { minLength: 0, maxLength: 50 }),
  fc.array(websiteEntryArbitrary, { minLength: 0, maxLength: 30 }),
  fc.array(websiteIdArbitrary, { minLength: 0, maxLength: 20 })
).map(([ids, entries, failIds]) => {
  const websiteMap = {};
  for (const e of entries) {
    websiteMap[e.id] = e;
  }
  return {
    websiteIds: ids,
    websiteMap,
    failSet: new Set(failIds),
  };
});

// ============================================================
// 属性测试
// ============================================================

describe('Property 5: 批量生成完整处理与错误恢复', () => {

  it('结果总数应等于输入的网站 ID 总数', () => {
    fc.assert(
      fc.property(batchScenarioArbitrary, ({ websiteIds, websiteMap, failSet }) => {
        const result = simulateBatchGenerate(websiteIds, websiteMap, failSet);
        expect(result.results.length).toBe(websiteIds.length);
        expect(result.total).toBe(websiteIds.length);
      }),
      { numRuns: 200 }
    );
  });

  it('每个输入的网站 ID 都应有对应的结果', () => {
    fc.assert(
      fc.property(batchScenarioArbitrary, ({ websiteIds, websiteMap, failSet }) => {
        const result = simulateBatchGenerate(websiteIds, websiteMap, failSet);
        for (let i = 0; i < websiteIds.length; i++) {
          expect(result.results[i].websiteId).toBe(websiteIds[i]);
        }
      }),
      { numRuns: 200 }
    );
  });

  it('每个结果的状态应为 success 或 failed', () => {
    fc.assert(
      fc.property(batchScenarioArbitrary, ({ websiteIds, websiteMap, failSet }) => {
        const result = simulateBatchGenerate(websiteIds, websiteMap, failSet);
        for (const r of result.results) {
          expect(['success', 'failed']).toContain(r.status);
        }
      }),
      { numRuns: 200 }
    );
  });

  it('失败项应包含错误信息', () => {
    fc.assert(
      fc.property(batchScenarioArbitrary, ({ websiteIds, websiteMap, failSet }) => {
        const result = simulateBatchGenerate(websiteIds, websiteMap, failSet);
        for (const r of result.results) {
          if (r.status === 'failed') {
            expect(r.error).toBeTruthy();
            expect(typeof r.error).toBe('string');
          }
        }
      }),
      { numRuns: 200 }
    );
  });

  it('不存在的网站 ID 应返回失败结果', () => {
    fc.assert(
      fc.property(batchScenarioArbitrary, ({ websiteIds, websiteMap, failSet }) => {
        const result = simulateBatchGenerate(websiteIds, websiteMap, failSet);
        for (let i = 0; i < websiteIds.length; i++) {
          if (!websiteMap[websiteIds[i]]) {
            expect(result.results[i].status).toBe('failed');
          }
        }
      }),
      { numRuns: 200 }
    );
  });

  it('失败项不影响其他项的处理（结果顺序与输入一致）', () => {
    fc.assert(
      fc.property(batchScenarioArbitrary, ({ websiteIds, websiteMap, failSet }) => {
        const result = simulateBatchGenerate(websiteIds, websiteMap, failSet);
        // 结果数量始终等于输入数量，即使有失败项
        expect(result.results.length).toBe(websiteIds.length);
        // 结果顺序与输入顺序一致
        for (let i = 0; i < websiteIds.length; i++) {
          expect(result.results[i].websiteId).toBe(websiteIds[i]);
        }
      }),
      { numRuns: 200 }
    );
  });

  it('空输入应返回空结果', () => {
    const result = simulateBatchGenerate([], {}, new Set());
    expect(result.results).toEqual([]);
    expect(result.total).toBe(0);
  });

  it('成功项应包含生成的内容', () => {
    fc.assert(
      fc.property(batchScenarioArbitrary, ({ websiteIds, websiteMap, failSet }) => {
        const result = simulateBatchGenerate(websiteIds, websiteMap, failSet);
        for (const r of result.results) {
          if (r.status === 'success') {
            expect(r.description).toBeTruthy();
            expect(r.tags).toBeTruthy();
          }
        }
      }),
      { numRuns: 200 }
    );
  });
});
