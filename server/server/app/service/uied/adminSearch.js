/**
 * @copyright Tomda (https://www.tomda.top)
 * @copyright UIED技术团队 (https://fsuied.com)
 * @author UIED技术团队
 * @createDate 2026.3.2
 */

'use strict';

const Service = require('egg').Service;

class AdminSearchService extends Service {
  /**
   * 后台管理全局搜索
   */
  async globalSearch({ keyword, page = 1, pageSize = 20, type = 'all' }) {
    const { ctx } = this;
    const offset = (page - 1) * pageSize;

    const results = {
      websites: [],
      categories: [],
      pages: [],
      articles: [],
      users: [],
      total: 0,
    };

    // 搜索网站
    if (type === 'all' || type === 'website') {
      const websiteQuery = {
        where: {
          [ctx.app.Sequelize.Op.or]: [
            { name: { [ctx.app.Sequelize.Op.like]: `%${keyword}%` } },
            { description: { [ctx.app.Sequelize.Op.like]: `%${keyword}%` } },
            { url: { [ctx.app.Sequelize.Op.like]: `%${keyword}%` } },
            { tags: { [ctx.app.Sequelize.Op.like]: `%${keyword}%` } },
          ],
        },
        limit: type === 'website' ? pageSize : 5,
        offset: type === 'website' ? offset : 0,
        order: [[ 'id', 'DESC' ]],
      };

      const { count, rows } = await ctx.model.Uied.Website.findAndCountAll(websiteQuery);
      results.websites = rows.map(item => ({
        id: item.id,
        name: item.name,
        description: item.description,
        url: item.url,
        icon_url: item.icon_url,
        status: item.is_delete === 0 ? 'active' : 'deleted',
        type: 'website',
      }));
      if (type === 'website') {
        results.total = count;
      }
    }

    // 搜索分类
    if (type === 'all' || type === 'category') {
      const categoryQuery = {
        where: {
          [ctx.app.Sequelize.Op.or]: [
            { name: { [ctx.app.Sequelize.Op.like]: `%${keyword}%` } },
            { description: { [ctx.app.Sequelize.Op.like]: `%${keyword}%` } },
          ],
        },
        limit: type === 'category' ? pageSize : 5,
        offset: type === 'category' ? offset : 0,
        order: [[ 'id', 'DESC' ]],
      };

      const { count, rows } = await ctx.model.Uied.Category.findAndCountAll(categoryQuery);
      results.categories = rows.map(item => ({
        id: item.id,
        name: item.name,
        description: item.description,
        status: item.is_delete === 0 ? 'active' : 'deleted',
        type: 'category',
      }));
      if (type === 'category') {
        results.total = count;
      }
    }

    // 搜索页面
    if (type === 'all' || type === 'page') {
      const pageQuery = {
        where: {
          [ctx.app.Sequelize.Op.or]: [
            { name: { [ctx.app.Sequelize.Op.like]: `%${keyword}%` } },
            { slug: { [ctx.app.Sequelize.Op.like]: `%${keyword}%` } },
            { description: { [ctx.app.Sequelize.Op.like]: `%${keyword}%` } },
          ],
        },
        limit: type === 'page' ? pageSize : 5,
        offset: type === 'page' ? offset : 0,
        order: [[ 'id', 'DESC' ]],
      };

      const { count, rows } = await ctx.model.Uied.Page.findAndCountAll(pageQuery);
      results.pages = rows.map(item => ({
        id: item.id,
        name: item.name,
        slug: item.slug,
        description: item.description,
        status: item.is_delete === 0 ? 'active' : 'deleted',
        type: 'page',
      }));
      if (type === 'page') {
        results.total = count;
      }
    }

    // 搜索文章
    if (type === 'all' || type === 'article') {
      try {
        const articleQuery = {
          where: {
            [ctx.app.Sequelize.Op.or]: [
              { title: { [ctx.app.Sequelize.Op.like]: `%${keyword}%` } },
              { content: { [ctx.app.Sequelize.Op.like]: `%${keyword}%` } },
              { excerpt: { [ctx.app.Sequelize.Op.like]: `%${keyword}%` } },
            ],
          },
          limit: type === 'article' ? pageSize : 5,
          offset: type === 'article' ? offset : 0,
          order: [[ 'id', 'DESC' ]],
        };

        const { count, rows } = await ctx.model.Uied.Article.findAndCountAll(articleQuery);
        results.articles = rows.map(item => ({
          id: item.id,
          title: item.title,
          excerpt: item.excerpt,
          status: item.status || 'draft',
          type: 'article',
        }));
        if (type === 'article') {
          results.total = count;
        }
      } catch (error) {
        // 文章表可能不存在，忽略错误
        ctx.logger.warn('搜索文章失败:', error.message);
      }
    }

    // 搜索用户
    if (type === 'all' || type === 'user') {
      try {
        const userQuery = {
          where: {
            [ctx.app.Sequelize.Op.or]: [
              { username: { [ctx.app.Sequelize.Op.like]: `%${keyword}%` } },
              { nickname: { [ctx.app.Sequelize.Op.like]: `%${keyword}%` } },
              { email: { [ctx.app.Sequelize.Op.like]: `%${keyword}%` } },
            ],
          },
          limit: type === 'user' ? pageSize : 5,
          offset: type === 'user' ? offset : 0,
          order: [[ 'id', 'DESC' ]],
        };

        const { count, rows } = await ctx.model.User.findAndCountAll(userQuery);
        results.users = rows.map(item => ({
          id: item.id,
          username: item.username,
          nickname: item.nickname,
          email: item.email,
          status: item.is_delete === 0 ? 'active' : 'deleted',
          type: 'user',
        }));
        if (type === 'user') {
          results.total = count;
        }
      } catch (error) {
        // 用户表可能不存在，忽略错误
        ctx.logger.warn('搜索用户失败:', error.message);
      }
    }

    // 如果是全局搜索，计算总数
    if (type === 'all') {
      results.total = results.websites.length +
        results.categories.length +
        results.pages.length +
        results.articles.length +
        results.users.length;
    }

    return {
      ...results,
      keyword,
      page,
      pageSize,
      type,
    };
  }

  /**
   * 快速搜索（用于顶部搜索框）
   */
  async quickSearch(keyword) {
    const { ctx } = this;

    if (!keyword || keyword.length < 2) {
      return { suggestions: [] };
    }

    const suggestions = [];

    // 搜索网站（最多5条）
    const websites = await ctx.model.Uied.Website.findAll({
      where: {
        is_delete: 0,
        name: { [ctx.app.Sequelize.Op.like]: `${keyword}%` },
      },
      attributes: [ 'id', 'name', 'icon_url' ],
      limit: 5,
    });

    websites.forEach(item => {
      suggestions.push({
        id: item.id,
        title: item.name,
        icon: item.icon_url,
        type: 'website',
        route: `/uied/website/edit?id=${item.id}`,
      });
    });

    // 搜索分类（最多3条）
    const categories = await ctx.model.Uied.Category.findAll({
      where: {
        is_delete: 0,
        name: { [ctx.app.Sequelize.Op.like]: `${keyword}%` },
      },
      attributes: [ 'id', 'name', 'icon' ],
      limit: 3,
    });

    categories.forEach(item => {
      suggestions.push({
        id: item.id,
        title: item.name,
        icon: item.icon,
        type: 'category',
        route: '/uied/category',
      });
    });

    // 搜索页面（最多3条）
    const pages = await ctx.model.Uied.Page.findAll({
      where: {
        is_delete: 0,
        name: { [ctx.app.Sequelize.Op.like]: `${keyword}%` },
      },
      attributes: [ 'id', 'name', 'slug' ],
      limit: 3,
    });

    pages.forEach(item => {
      suggestions.push({
        id: item.id,
        title: item.name,
        subtitle: item.slug,
        type: 'page',
        route: '/uied/page',
      });
    });

    return { suggestions };
  }

  /**
   * 搜索历史记录
   */
  async getSearchHistory(userId, limit = 10) {
    const { ctx } = this;

    try {
      // 从Redis获取搜索历史
      const key = `admin:search:history:${userId}`;
      const history = await ctx.app.redis.lrange(key, 0, limit - 1);
      return history || [];
    } catch (error) {
      ctx.logger.warn('获取搜索历史失败:', error.message);
      return [];
    }
  }

  /**
   * 保存搜索历史
   */
  async saveSearchHistory(userId, keyword) {
    const { ctx } = this;

    try {
      const key = `admin:search:history:${userId}`;
      // 移除重复的关键词
      await ctx.app.redis.lrem(key, 0, keyword);
      // 添加到列表头部
      await ctx.app.redis.lpush(key, keyword);
      // 只保留最近20条
      await ctx.app.redis.ltrim(key, 0, 19);
      // 设置过期时间（30天）
      await ctx.app.redis.expire(key, 30 * 24 * 60 * 60);
    } catch (error) {
      ctx.logger.warn('保存搜索历史失败:', error.message);
    }
  }

  /**
   * 清空搜索历史
   */
  async clearSearchHistory(userId) {
    const { ctx } = this;

    try {
      const key = `admin:search:history:${userId}`;
      await ctx.app.redis.del(key);
      return true;
    } catch (error) {
      ctx.logger.warn('清空搜索历史失败:', error.message);
      return false;
    }
  }
}

module.exports = AdminSearchService;
