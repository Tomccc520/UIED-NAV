/**
 * @file services/recommendationService.js
 * @description 网站推荐服务（Pro 功能）
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

// @pro-feature-start: related-websites
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * 获取相关网站推荐
 * 基于相同分类或相似标签推荐
 * @param {string} websiteId - 当前网站ID
 * @param {number} limit - 返回数量限制，默认6
 * @returns {Promise<Array>} 推荐网站列表
 */
export async function getRelatedWebsites(websiteId, limit = 6) {
  // 获取当前网站信息
  const currentWebsite = await prisma.website.findUnique({
    where: { id: websiteId },
    select: {
      id: true,
      categoryId: true,
      tags: true,
      category: {
        select: {
          id: true,
          parentId: true,
        }
      }
    }
  });

  if (!currentWebsite) {
    return [];
  }

  // 解析当前网站的标签
  let currentTags = [];
  try {
    currentTags = JSON.parse(currentWebsite.tags || '[]');
  } catch {
    currentTags = currentWebsite.tags?.split(',').map(t => t.trim()).filter(Boolean) || [];
  }

  // 构建查询条件：排除当前网站
  const baseWhere = {
    id: { not: websiteId },
  };

  // 策略1：同分类的网站
  const sameCategoryWebsites = await prisma.website.findMany({
    where: {
      ...baseWhere,
      categoryId: currentWebsite.categoryId,
    },
    select: {
      id: true,
      name: true,
      description: true,
      url: true,
      iconUrl: true,
      tags: true,
      category: {
        select: {
          id: true,
          name: true,
        }
      }
    },
    orderBy: [
      { clickCount: 'desc' },
      { createdAt: 'desc' },
    ],
    take: limit,
  });

  // 如果同分类网站不够，补充同父分类的网站
  let relatedWebsites = [...sameCategoryWebsites];
  
  if (relatedWebsites.length < limit && currentWebsite.category?.parentId) {
    // 获取同父分类下的其他子分类
    const siblingCategories = await prisma.category.findMany({
      where: {
        parentId: currentWebsite.category.parentId,
        id: { not: currentWebsite.categoryId },
      },
      select: { id: true }
    });

    const siblingCategoryIds = siblingCategories.map(c => c.id);
    const existingIds = relatedWebsites.map(w => w.id);

    const siblingWebsites = await prisma.website.findMany({
      where: {
        ...baseWhere,
        categoryId: { in: siblingCategoryIds },
        id: { notIn: existingIds },
      },
      select: {
        id: true,
        name: true,
        description: true,
        url: true,
        iconUrl: true,
        tags: true,
        category: {
          select: {
            id: true,
            name: true,
          }
        }
      },
      orderBy: [
        { clickCount: 'desc' },
        { createdAt: 'desc' },
      ],
      take: limit - relatedWebsites.length,
    });

    relatedWebsites = [...relatedWebsites, ...siblingWebsites];
  }

  // 解析每个网站的标签
  return relatedWebsites.map(website => ({
    ...website,
    tags: parseTags(website.tags),
  }));
}

/**
 * 解析标签字符串
 */
function parseTags(tags) {
  if (!tags) return [];
  try {
    return JSON.parse(tags);
  } catch {
    return tags.split(',').map(t => t.trim()).filter(Boolean);
  }
}

export default {
  getRelatedWebsites,
};
// @pro-feature-end: related-websites
