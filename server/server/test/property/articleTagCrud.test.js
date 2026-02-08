/**
 * @file test/property/articleTagCrud.test.js
 * @description 属性测试：文章标签 CRUD 往返一致性
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

// Feature: feature-enhancement-and-bugfix, Property 3: Article tag CRUD round-trip
// **Validates: Requirements 3.1**

import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';

/**
 * 内存标签存储 —— 模拟 articleTag service 的 CRUD 逻辑
 * 行为与 service/uied/articleTag.js 保持一致：
 *   - add: 插入标签，slug 唯一性检查（仅在未软删除的标签中）
 *   - get: 按 id 查询，仅返回 is_delete = 0 的标签
 *   - getBySlug: 按 slug 查询，仅返回 is_delete = 0 的标签
 *   - all: 返回所有 is_delete = 0 的标签
 *   - edit: 更新标签字段，slug 唯一性检查
 *   - del: 软删除（设置 is_delete = 1）
 */
class InMemoryTagStore {
  constructor() {
    this.tags = [];
    this.nextId = 1;
  }

  /** 添加标签 */
  add({ name, slug, color, sortOrder }) {
    // 检查 slug 是否已存在（仅在未删除的标签中）
    const existing = this.tags.find(t => t.slug === slug && t.is_delete === 0);
    if (existing) {
      throw new Error('标签标识已存在');
    }

    const now = Math.floor(Date.now() / 1000);
    const tag = {
      id: this.nextId++,
      name,
      slug,
      color: color || '',
      sort_order: sortOrder || 0,
      is_delete: 0,
      create_time: now,
      update_time: now,
    };
    this.tags.push(tag);
    return { ...tag };
  }

  /** 按 ID 获取标签（仅返回未删除的） */
  get(id) {
    const tag = this.tags.find(t => t.id === id && t.is_delete === 0);
    return tag ? { ...tag } : null;
  }

  /** 按 slug 获取标签（仅返回未删除的） */
  getBySlug(slug) {
    const tag = this.tags.find(t => t.slug === slug && t.is_delete === 0);
    return tag ? { ...tag } : null;
  }

  /** 获取所有未删除的标签 */
  all() {
    return this.tags
      .filter(t => t.is_delete === 0)
      .map(t => ({ ...t }));
  }

  /** 编辑标签 */
  edit({ id, name, slug, color, sortOrder }) {
    const tag = this.tags.find(t => t.id === id && t.is_delete === 0);
    if (!tag) {
      throw new Error('标签不存在');
    }

    // 检查 slug 是否与其他标签冲突
    if (slug !== undefined) {
      const conflict = this.tags.find(t => t.slug === slug && t.id !== id && t.is_delete === 0);
      if (conflict) {
        throw new Error('标签标识已存在');
      }
    }

    if (name !== undefined) tag.name = name;
    if (slug !== undefined) tag.slug = slug;
    if (color !== undefined) tag.color = color;
    if (sortOrder !== undefined) tag.sort_order = sortOrder;
    tag.update_time = Math.floor(Date.now() / 1000);

    return { ...tag };
  }

  /** 软删除标签 */
  del(id) {
    const tag = this.tags.find(t => t.id === id && t.is_delete === 0);
    if (!tag) return;
    tag.is_delete = 1;
    tag.update_time = Math.floor(Date.now() / 1000);
  }
}

/**
 * fast-check arbitrary：生成合法的标签名称
 * 标签名称至少 1 个字符，最多 50 个字符
 */
const tagNameArbitrary = fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0);

/**
 * fast-check arbitrary：生成合法的 slug
 * slug 由小写字母、数字和连字符组成，至少 1 个字符
 */
const tagSlugArbitrary = fc.stringMatching(/^[a-z0-9][a-z0-9-]{0,49}$/);

/**
 * fast-check arbitrary：生成合法的颜色值
 */
const tagColorArbitrary = fc.oneof(
  fc.constant(''),
  fc.stringMatching(/^#[0-9a-f]{6}$/)
);

/**
 * fast-check arbitrary：生成完整的标签数据
 */
const tagDataArbitrary = fc.record({
  name: tagNameArbitrary,
  slug: tagSlugArbitrary,
  color: tagColorArbitrary,
  sortOrder: fc.nat({ max: 999 }),
});

describe('Property 3: Article tag CRUD round-trip', () => {
  let store;

  beforeEach(() => {
    store = new InMemoryTagStore();
  });

  it('create-then-read returns the same name and slug', () => {
    fc.assert(
      fc.property(tagDataArbitrary, (tagData) => {
        const created = store.add(tagData);

        // 通过 ID 读取
        const retrieved = store.get(created.id);
        expect(retrieved).not.toBeNull();
        expect(retrieved.name).toBe(tagData.name);
        expect(retrieved.slug).toBe(tagData.slug);
        expect(retrieved.color).toBe(tagData.color || '');
        expect(retrieved.sort_order).toBe(tagData.sortOrder || 0);

        // 通过 slug 读取
        const retrievedBySlug = store.getBySlug(tagData.slug);
        expect(retrievedBySlug).not.toBeNull();
        expect(retrievedBySlug.name).toBe(tagData.name);
        expect(retrievedBySlug.id).toBe(created.id);

        // 清理：软删除以避免 slug 冲突影响后续迭代
        store.del(created.id);
      }),
      { numRuns: 200 }
    );
  });

  it('deleting a tag makes it no longer retrievable', () => {
    fc.assert(
      fc.property(tagDataArbitrary, (tagData) => {
        const created = store.add(tagData);

        // 确认创建成功
        expect(store.get(created.id)).not.toBeNull();

        // 软删除
        store.del(created.id);

        // 删除后不可通过 ID 获取
        expect(store.get(created.id)).toBeNull();

        // 删除后不可通过 slug 获取
        expect(store.getBySlug(tagData.slug)).toBeNull();

        // 删除后不出现在 all() 列表中
        const allTags = store.all();
        const found = allTags.find(t => t.id === created.id);
        expect(found).toBeUndefined();
      }),
      { numRuns: 200 }
    );
  });

  it('editing a tag updates the data and read returns updated values', () => {
    fc.assert(
      fc.property(
        tagDataArbitrary,
        tagNameArbitrary,
        tagSlugArbitrary,
        tagColorArbitrary,
        (tagData, newName, newSlug, newColor) => {
          const created = store.add(tagData);

          // 编辑标签
          store.edit({
            id: created.id,
            name: newName,
            slug: newSlug,
            color: newColor,
          });

          // 读取更新后的标签
          const updated = store.get(created.id);
          expect(updated).not.toBeNull();
          expect(updated.name).toBe(newName);
          expect(updated.slug).toBe(newSlug);
          expect(updated.color).toBe(newColor);

          // 通过新 slug 也能找到
          const byNewSlug = store.getBySlug(newSlug);
          expect(byNewSlug).not.toBeNull();
          expect(byNewSlug.id).toBe(created.id);

          // 清理
          store.del(created.id);
        }
      ),
      { numRuns: 200 }
    );
  });

  it('duplicate slug on create throws error', () => {
    fc.assert(
      fc.property(tagDataArbitrary, (tagData) => {
        store.add(tagData);

        // 使用相同 slug 再次创建应抛出错误
        expect(() => store.add(tagData)).toThrow('标签标识已存在');

        // 清理
        const tag = store.getBySlug(tagData.slug);
        if (tag) store.del(tag.id);
      }),
      { numRuns: 200 }
    );
  });

  it('after soft-delete, the same slug can be reused for a new tag', () => {
    fc.assert(
      fc.property(tagDataArbitrary, tagNameArbitrary, (tagData, newName) => {
        const created = store.add(tagData);

        // 软删除
        store.del(created.id);

        // 使用相同 slug 创建新标签应成功
        const newTag = store.add({ ...tagData, name: newName });
        expect(newTag.id).not.toBe(created.id);
        expect(newTag.slug).toBe(tagData.slug);
        expect(newTag.name).toBe(newName);

        // 旧标签仍不可获取
        expect(store.get(created.id)).toBeNull();

        // 新标签可正常获取
        expect(store.get(newTag.id)).not.toBeNull();

        // 清理
        store.del(newTag.id);
      }),
      { numRuns: 200 }
    );
  });
});
