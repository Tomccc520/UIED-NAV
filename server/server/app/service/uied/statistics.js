/**
 * @file service/uied/statistics.js
 * @description UIED 数据统计服务
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

'use strict';

const Service = require('egg').Service;

class StatisticsService extends Service {
  /**
   * 获取点击统计数据
   */
  async clickStats() {
    const { app } = this;

    // 获取热门网站 TOP 20
    const topWebsites = await app.model.query(
      `SELECT w.id, w.name, w.url, w.click_count, c.name as category
       FROM uied_website w
       LEFT JOIN uied_category c ON w.category_id = c.id
       WHERE w.is_delete = 0
       ORDER BY w.click_count DESC
       LIMIT 20`,
      { type: app.Sequelize.QueryTypes.SELECT }
    );

    // 获取总点击量
    const [totalResult] = await app.model.query(
      `SELECT SUM(click_count) as total FROM uied_website WHERE is_delete = 0`,
      { type: app.Sequelize.QueryTypes.SELECT }
    );

    // 获取分类点击统计
    const categoryStats = await app.model.query(
      `SELECT c.id, c.name, 
              COUNT(w.id) as websiteCount,
              COALESCE(SUM(w.click_count), 0) as clickCount
       FROM uied_category c
       LEFT JOIN uied_website w ON c.id = w.category_id AND w.is_delete = 0
       WHERE c.is_delete = 0
       GROUP BY c.id, c.name
       ORDER BY clickCount DESC`,
      { type: app.Sequelize.QueryTypes.SELECT }
    );

    return {
      topWebsites: topWebsites.map(w => ({
        id: w.id,
        name: w.name,
        url: w.url,
        clickCount: w.click_count || 0,
        category: w.category,
      })),
      totalClicks: totalResult.total || 0,
      categoryStats: categoryStats.map(c => ({
        id: c.id,
        name: c.name,
        websiteCount: parseInt(c.websiteCount) || 0,
        clickCount: parseInt(c.clickCount) || 0,
      })),
    };
  }

  /**
   * 获取搜索统计数据
   */
  async searchStats(days = 30) {
    const { app } = this;
    const startTime = Math.floor(Date.now() / 1000) - days * 24 * 60 * 60;

    // 检查搜索日志表是否存在
    const [tableExists] = await app.model.query(
      `SELECT COUNT(*) as count FROM information_schema.tables 
       WHERE table_schema = DATABASE() AND table_name = 'uied_search_log'`,
      { type: app.Sequelize.QueryTypes.SELECT }
    );

    if (!tableExists || tableExists.count === 0) {
      return {
        topSearches: [],
        totalSearches: 0,
        aiSearches: 0,
        aiRatio: '0',
        dailyTrend: [],
      };
    }

    // 热门搜索词 TOP 20
    const topSearches = await app.model.query(
      `SELECT query, COUNT(*) as count 
       FROM uied_search_log 
       WHERE create_time >= ?
       GROUP BY query 
       ORDER BY count DESC 
       LIMIT 20`,
      { replacements: [startTime], type: app.Sequelize.QueryTypes.SELECT }
    );

    // 总搜索次数
    const [totalResult] = await app.model.query(
      `SELECT COUNT(*) as total FROM uied_search_log WHERE create_time >= ?`,
      { replacements: [startTime], type: app.Sequelize.QueryTypes.SELECT }
    );

    // AI 搜索次数
    const [aiResult] = await app.model.query(
      `SELECT COUNT(*) as total FROM uied_search_log WHERE create_time >= ? AND is_ai = 1`,
      { replacements: [startTime], type: app.Sequelize.QueryTypes.SELECT }
    );

    // 每日搜索趋势
    const dailyTrend = await app.model.query(
      `SELECT DATE(FROM_UNIXTIME(create_time)) as date, COUNT(*) as count
       FROM uied_search_log
       WHERE create_time >= ?
       GROUP BY DATE(FROM_UNIXTIME(create_time))
       ORDER BY date`,
      { replacements: [startTime], type: app.Sequelize.QueryTypes.SELECT }
    );

    const totalSearches = totalResult.total || 0;
    const aiSearches = aiResult.total || 0;
    const aiRatio = totalSearches > 0 ? ((aiSearches / totalSearches) * 100).toFixed(1) : '0';

    return {
      topSearches,
      totalSearches,
      aiSearches,
      aiRatio,
      dailyTrend,
    };
  }

  /**
   * 获取概览统计
   */
  async overview() {
    const { app } = this;

    // 网站统计
    const [websiteStats] = await app.model.query(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN is_hot = 1 THEN 1 ELSE 0 END) as hotCount,
        SUM(CASE WHEN is_featured = 1 THEN 1 ELSE 0 END) as featuredCount,
        SUM(CASE WHEN is_new = 1 THEN 1 ELSE 0 END) as newCount,
        SUM(click_count) as totalClicks,
        AVG(click_count) as avgClicks,
        SUM(CASE WHEN click_count > 0 THEN 1 ELSE 0 END) as hasClicksCount
       FROM uied_website WHERE is_delete = 0`,
      { type: app.Sequelize.QueryTypes.SELECT }
    );

    // 分类统计
    const [categoryStats] = await app.model.query(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN parent_id IS NULL OR parent_id = 0 THEN 1 ELSE 0 END) as mainCount,
        SUM(CASE WHEN parent_id IS NOT NULL AND parent_id > 0 THEN 1 ELSE 0 END) as subCount
       FROM uied_category WHERE is_delete = 0`,
      { type: app.Sequelize.QueryTypes.SELECT }
    );

    // 文章统计
    const [articleStats] = await app.model.query(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'published' THEN 1 ELSE 0 END) as publishedCount,
        SUM(view_count) as totalViews
       FROM uied_article WHERE is_delete = 0`,
      { type: app.Sequelize.QueryTypes.SELECT }
    );

    // 评论统计
    const [websiteCommentStats] = await app.model.query(
      `SELECT COUNT(*) as total, SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pendingCount
       FROM uied_website_comment WHERE is_delete = 0`,
      { type: app.Sequelize.QueryTypes.SELECT }
    );

    const [articleCommentStats] = await app.model.query(
      `SELECT COUNT(*) as total, SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pendingCount
       FROM uied_article_comment WHERE is_delete = 0`,
      { type: app.Sequelize.QueryTypes.SELECT }
    );

    const total = parseInt(websiteStats.total) || 0;
    const hasClicksCount = parseInt(websiteStats.hasClicksCount) || 0;

    return {
      website: {
        total,
        hotCount: parseInt(websiteStats.hotCount) || 0,
        featuredCount: parseInt(websiteStats.featuredCount) || 0,
        newCount: parseInt(websiteStats.newCount) || 0,
        totalClicks: parseInt(websiteStats.totalClicks) || 0,
        avgClicks: Math.round(parseFloat(websiteStats.avgClicks) || 0),
        clickRate: total > 0 ? Math.round((hasClicksCount / total) * 100) : 0,
        noClicksCount: total - hasClicksCount,
      },
      category: {
        total: parseInt(categoryStats.total) || 0,
        mainCount: parseInt(categoryStats.mainCount) || 0,
        subCount: parseInt(categoryStats.subCount) || 0,
      },
      article: {
        total: parseInt(articleStats.total) || 0,
        publishedCount: parseInt(articleStats.publishedCount) || 0,
        totalViews: parseInt(articleStats.totalViews) || 0,
      },
      comment: {
        websiteTotal: parseInt(websiteCommentStats.total) || 0,
        websitePending: parseInt(websiteCommentStats.pendingCount) || 0,
        articleTotal: parseInt(articleCommentStats.total) || 0,
        articlePending: parseInt(articleCommentStats.pendingCount) || 0,
      },
    };
  }

  /**
   * 获取最近添加的网站
   */
  async recentWebsites(limit = 10) {
    const { app } = this;

    const websites = await app.model.query(
      `SELECT w.*, c.name as category_name
       FROM uied_website w
       LEFT JOIN uied_category c ON w.category_id = c.id
       WHERE w.is_delete = 0
       ORDER BY w.create_time DESC
       LIMIT ?`,
      { replacements: [limit], type: app.Sequelize.QueryTypes.SELECT }
    );

    return websites.map(w => ({
      id: w.id,
      name: w.name,
      url: w.url,
      description: w.description,
      isHot: w.is_hot === 1,
      isFeatured: w.is_featured === 1,
      isNew: w.is_new === 1,
      clickCount: w.click_count || 0,
      createdAt: w.create_time ? w.create_time * 1000 : null,
      category: w.category_name ? { id: w.category_id, name: w.category_name } : null,
    }));
  }
}

module.exports = StatisticsService;
