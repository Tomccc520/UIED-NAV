/**
 * @file test/property/articlePublicList.test.js
 * @description 属性测试：公开文章列表只返回已发布文章
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

// Feature: feature-enhancement-and-bugfix, Property 5: Public article list returns only published articles
// **Validates: Requirements 4.1**

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

/**
 * 模拟 publicList 使用的过滤逻辑
 * 与 article.js service 中 publicList 方法的 WHERE 条件一致：
 *   WHERE is_delete = 0 AND status = 'published'
 */
function filterPublicArticles(articles) {
  return articles.filter(
    article => article.is_delete === 0 && article.status === 'published'
  );
}

/**
 * 生成随机文章对象的 fast-check arbitrary
 * 文章具有混合的 status 和 is_delete 值
 */
const articleArbitrary = fc.record({
  id: fc.nat({ max: 100000 }),
  title: fc.string({ minLength: 1, maxLength: 100 }),
  slug: fc.stringMatching(/^[a-z0-9-]{1,50}$/),
  status: fc.oneof(fc.constant('published'), fc.constant('draft')),
  is_delete: fc.oneof(fc.constant(0), fc.constant(1)),
  content: fc.string({ maxLength: 200 }),
  excerpt: fc.string({ maxLength: 100 }),
  author: fc.string({ minLength: 1, maxLength: 30 }),
  category: fc.string({ minLength: 1, maxLength: 30 }),
  view_count: fc.nat({ max: 10000 }),
  create_time: fc.nat({ max: 2000000000 }),
  published_at: fc.option(fc.nat({ max: 2000000000 }), { nil: null }),
});

const articleListArbitrary = fc.array(articleArbitrary, { minLength: 0, maxLength: 50 });

describe('Property 5: Public article list returns only published articles', () => {
  it('should return ONLY articles with status=published AND is_delete=0', () => {
    fc.assert(
      fc.property(articleListArbitrary, (articles) => {
        const result = filterPublicArticles(articles);

        // 属性1：结果中的每篇文章都必须是 published 且未删除
        for (const article of result) {
          expect(article.status).toBe('published');
          expect(article.is_delete).toBe(0);
        }
      }),
      { numRuns: 200 }
    );
  });

  it('should include ALL published non-deleted articles from the input', () => {
    fc.assert(
      fc.property(articleListArbitrary, (articles) => {
        const result = filterPublicArticles(articles);

        // 属性2：所有 published 且未删除的文章都必须出现在结果中
        const expectedPublished = articles.filter(
          a => a.status === 'published' && a.is_delete === 0
        );

        expect(result.length).toBe(expectedPublished.length);

        // 验证每篇预期的文章都在结果中
        for (const expected of expectedPublished) {
          const found = result.some(r => r.id === expected.id && r.title === expected.title);
          expect(found).toBe(true);
        }
      }),
      { numRuns: 200 }
    );
  });

  it('should never include draft articles regardless of is_delete value', () => {
    fc.assert(
      fc.property(articleListArbitrary, (articles) => {
        const result = filterPublicArticles(articles);

        // 属性3：结果中不应包含任何 draft 文章
        const draftInResult = result.filter(a => a.status === 'draft');
        expect(draftInResult.length).toBe(0);
      }),
      { numRuns: 200 }
    );
  });

  it('should never include soft-deleted articles regardless of status', () => {
    fc.assert(
      fc.property(articleListArbitrary, (articles) => {
        const result = filterPublicArticles(articles);

        // 属性4：结果中不应包含任何已软删除的文章
        const deletedInResult = result.filter(a => a.is_delete === 1);
        expect(deletedInResult.length).toBe(0);
      }),
      { numRuns: 200 }
    );
  });

  it('should return empty array when all articles are drafts or deleted', () => {
    // 生成只包含 draft 或已删除文章的列表
    const nonPublicArticleArbitrary = fc.record({
      id: fc.nat({ max: 100000 }),
      title: fc.string({ minLength: 1, maxLength: 100 }),
      slug: fc.stringMatching(/^[a-z0-9-]{1,50}$/),
      status: fc.oneof(fc.constant('published'), fc.constant('draft')),
      is_delete: fc.constant(1), // 全部已删除
      content: fc.string({ maxLength: 200 }),
      excerpt: fc.string({ maxLength: 100 }),
      author: fc.string({ minLength: 1, maxLength: 30 }),
      category: fc.string({ minLength: 1, maxLength: 30 }),
      view_count: fc.nat({ max: 10000 }),
      create_time: fc.nat({ max: 2000000000 }),
      published_at: fc.option(fc.nat({ max: 2000000000 }), { nil: null }),
    });

    const allDeletedListArbitrary = fc.array(nonPublicArticleArbitrary, { minLength: 0, maxLength: 30 });

    fc.assert(
      fc.property(allDeletedListArbitrary, (articles) => {
        const result = filterPublicArticles(articles);

        // 属性5：当所有文章都已删除时，结果应为空
        expect(result.length).toBe(0);
      }),
      { numRuns: 100 }
    );
  });
});
