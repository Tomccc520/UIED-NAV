/**
 * @file index.js
 * @description 后端API服务
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import categoryRoutes from './routes/categoryRoutes.js';
import websiteRoutes from './routes/websiteRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import settingRoutes from './routes/settingRoutes.js';
import publicSettingRoutes from './routes/publicSettingRoutes.js';
import authRoutes, { authMiddleware } from './routes/authRoutes.js';
import siteInfoRoutes from './routes/siteInfoRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import socialMediaRoutes from './routes/socialMediaRoutes.js';
import pageRoutes from './routes/pageRoutes.js';
import hotRecommendationRoutes from './routes/hotRecommendationRoutes.js';
import bannerRoutes from './routes/bannerRoutes.js';
import faviconApiRoutes from './routes/faviconApiRoutes.js';
import aiConfigRoutes from './routes/aiConfigRoutes.js';
import wordpressConfigRoutes from './routes/wordpressConfigRoutes.js';
import submissionRoutes from './routes/submissionRoutes.js';
import logRoutes from './routes/logRoutes.js';
import monitorRoutes from './routes/monitorRoutes.js';
import seoRoutes from './routes/seoRoutes.js';
import seoScraperRoutes from './routes/seoScraperRoutes.js';
import exportRoutes from './routes/exportRoutes.js';
import userRoutes from './routes/userRoutes.js';
import { startMonitorJob } from './jobs/monitorJob.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// 安全相关中间件
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';

// 基础安全头
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }, // 允许跨域访问静态资源
}));

// 全局速率限制
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 1000, // 每个IP最多1000次请求
  message: { error: '请求过于频繁，请稍后再试' },
  standardHeaders: true,
  legacyHeaders: false,
});

// 登录接口速率限制（配合锁定机制，保持严格）
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 15, // 每个IP最多15次请求（超过5次失败会被锁定）
  message: { error: '请求过于频繁，请稍后再试' },
  standardHeaders: true,
  legacyHeaders: false,
});

// 提交接口速率限制（用户提交网站）
const submitLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1小时
  max: 20, // 每个IP每小时最多提交20次（给用户更多机会）
  message: { error: '提交过于频繁，请稍后再试' },
  standardHeaders: true,
  legacyHeaders: false,
});

// AI搜索接口速率限制
const aiSearchLimiter = rateLimit({
  windowMs: 60 * 1000, // 1分钟
  max: 30, // 每个IP每分钟最多30次搜索
  message: { error: '搜索过于频繁，请稍后再试' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(globalLimiter);

// CORS 配置
const corsOptions = {
  origin: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : '*',
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ========== 全局请求日志中间件（调试用）==========
const DEBUG_MODE = process.env.DEBUG_API === 'true';

app.use((req, res, next) => {
  // 只在 DEBUG 模式或非 GET 请求时记录
  if (DEBUG_MODE || (req.method !== 'GET' && req.path.startsWith('/api/'))) {
    const startTime = Date.now();
    
    // 记录请求信息
    console.log(`\n[API请求] ${new Date().toISOString()}`);
    console.log(`  方法: ${req.method}`);
    console.log(`  路径: ${req.path}`);
    if (Object.keys(req.query).length > 0) {
      console.log(`  查询参数:`, JSON.stringify(req.query));
    }
    if (req.body && Object.keys(req.body).length > 0 && req.method !== 'GET') {
      // 隐藏敏感字段
      const safeBody = { ...req.body };
      if (safeBody.password) safeBody.password = '***';
      if (safeBody.apiKey) safeBody.apiKey = '***';
      console.log(`  请求体:`, JSON.stringify(safeBody, null, 2));
    }
    
    // 拦截响应以记录状态码
    const originalSend = res.send;
    res.send = function(body) {
      const duration = Date.now() - startTime;
      console.log(`[API响应] ${req.method} ${req.path}`);
      console.log(`  状态码: ${res.statusCode}`);
      console.log(`  耗时: ${duration}ms`);
      
      // 如果是错误响应，记录响应体
      if (res.statusCode >= 400) {
        try {
          const parsed = typeof body === 'string' ? JSON.parse(body) : body;
          console.log(`  错误详情:`, JSON.stringify(parsed, null, 2));
        } catch {
          console.log(`  响应内容:`, body?.toString?.()?.slice(0, 500) || body);
        }
      }
      
      return originalSend.call(this, body);
    };
  }
  next();
});

// 静态文件服务 - 提供上传的图片访问
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// 静态文件服务 - 提供 SEO 文件访问（sitemap.xml, robots.txt）
app.use(express.static(path.join(__dirname, '../public')));

// ========== 公开路由（无需认证）==========
app.use('/api/auth/login', loginLimiter); // 登录限流
app.use('/api/auth', authRoutes);

// 前端公开API
app.use('/api/categories', categoryRoutes);
app.use('/api/websites', websiteRoutes);
app.use('/api/site-info', siteInfoRoutes);
app.use('/api/social-media', socialMediaRoutes);
app.use('/api/pages', pageRoutes);
app.use('/api/hot-recommendations', hotRecommendationRoutes);
app.use('/api/banners', bannerRoutes);
app.use('/api/favicon-api', faviconApiRoutes);
app.use('/api/wordpress', wordpressConfigRoutes);

// 前端需要的公开设置接口（导航菜单、页脚、友情链接）
app.use('/api/settings', publicSettingRoutes);

// 前端 AI 智能搜索接口（公开访问，带限流）
import { PrismaClient } from '@prisma/client';
import fetch from 'node-fetch';
import https from 'https';

const prismaForAi = new PrismaClient();
const httpsAgentForAi = process.env.NODE_ENV === 'production' 
  ? undefined 
  : new https.Agent({ rejectUnauthorized: false });

// 记录搜索日志
const logSearch = async (query, resultCount, searchMode, req) => {
  try {
    await prismaForAi.searchLog.create({
      data: {
        query,
        resultCount,
        searchMode,
        ip: req.ip || req.headers['x-forwarded-for'] || '',
        userAgent: req.headers['user-agent'] || '',
      }
    });
  } catch (error) {
    console.error('记录搜索日志失败:', error);
  }
};

app.post('/api/ai-search', aiSearchLimiter, async (req, res) => {
  try {
    const { query, limit = 20 } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: '请提供搜索内容' });
    }
    
    // 获取默认 AI 配置
    let config = await prismaForAi.aiConfig.findFirst({
      where: { enabled: true, isDefault: true },
    });
    if (!config) {
      config = await prismaForAi.aiConfig.findFirst({
        where: { enabled: true },
      });
    }
    
    // 获取所有网站数据用于搜索（不限制数量）
    const websites = await prismaForAi.website.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        url: true,
        iconUrl: true,
        tags: true,
      },
    });
    
    if (websites.length === 0) {
      await logSearch(query, 0, 'keyword', req);
      return res.json({ results: [], message: '暂无可搜索的数据' });
    }
    
    // 改进的关键词搜索函数 - 支持模糊匹配和评分
    const keywordSearch = (searchQuery, data, maxResults) => {
      const queryLower = searchQuery.toLowerCase().trim();
      const keywords = queryLower.split(/\s+/).filter(k => k.length > 0);
      
      // 为每个网站计算匹配分数
      const scored = data.map(site => {
        const name = (site.name || '').toLowerCase();
        const desc = (site.description || '').toLowerCase();
        const tags = (site.tags || '').toLowerCase();
        const url = (site.url || '').toLowerCase();
        const fullText = `${name} ${desc} ${tags} ${url}`;
        
        let score = 0;
        
        // 完整查询匹配（最高优先级）
        if (name.includes(queryLower)) score += 100;
        if (name === queryLower) score += 50; // 精确匹配加分
        if (desc.includes(queryLower)) score += 30;
        if (tags.includes(queryLower)) score += 40;
        if (url.includes(queryLower)) score += 20;
        
        // 单个关键词匹配
        keywords.forEach(kw => {
          if (name.includes(kw)) score += 20;
          if (desc.includes(kw)) score += 5;
          if (tags.includes(kw)) score += 10;
          if (url.includes(kw)) score += 3;
        });
        
        return { ...site, score };
      });
      
      // 过滤有分数的结果并排序
      return scored
        .filter(s => s.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, maxResults)
        .map(({ score, ...site }) => site);
    };
    
    // 如果没有 AI 配置，使用改进的关键词匹配
    if (!config) {
      const results = keywordSearch(query, websites, limit);
      
      await logSearch(query, results.length, 'keyword', req);
      return res.json({ 
        results, 
        mode: 'keyword',
        message: `关键词匹配找到 ${results.length} 个结果` 
      });
    }
    
    // 构建网站列表摘要
    const websiteList = websites.map(w => 
      `[ID:${w.id}] ${w.name}: ${w.description?.slice(0, 50) || '无描述'}`
    ).join('\n');
    
    // 构建 AI 提示词 - 支持思考过程
    const prompt = `你是一个设计工具推荐助手。用户正在寻找工具，请根据用户的需求从以下工具列表中推荐最相关的工具。

用户需求: ${query}

可选工具列表:
${websiteList}

请返回最相关的工具ID列表（最多${limit}个），按相关度排序。

返回JSON格式:
{
  "reasoning": "你的思考过程：分析用户需求，说明为什么选择这些工具（50-100字）",
  "ids": ["工具ID1", "工具ID2"],
  "reason": "简短推荐理由（20字以内）"
}

注意：只返回JSON，不要有其他内容。ids数组中必须是工具列表中的完整ID。`;

    // 调用 AI API
    let response;
    try {
      response = await fetch(config.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({
          model: config.model,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.3,
          max_tokens: 800,
        }),
        agent: httpsAgentForAi,
      });
    } catch (fetchError) {
      // 降级到改进的关键词搜索
      const results = keywordSearch(query, websites, limit);
      
      await logSearch(query, results.length, 'keyword', req);
      return res.json({ 
        results, 
        mode: 'keyword',
        message: 'AI 服务暂不可用，使用关键词匹配' 
      });
    }
    
    if (!response.ok) {
      const results = keywordSearch(query, websites, limit);
      
      await logSearch(query, results.length, 'keyword', req);
      return res.json({ 
        results, 
        mode: 'keyword',
        message: 'AI 服务暂不可用，使用关键词匹配' 
      });
    }
    
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      await logSearch(query, 0, 'ai', req);
      return res.json({ results: [], message: 'AI 返回内容为空' });
    }
    
    // 解析 AI 返回的 JSON
    try {
      let jsonStr = content;
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1].trim();
      }
      
      const aiResult = JSON.parse(jsonStr);
      const ids = aiResult.ids || [];
      
      console.log('AI 返回的 IDs:', ids);
      console.log('数据库中的 IDs 示例:', websites.slice(0, 3).map(w => w.id));
      
      // 改进 ID 匹配：支持部分匹配和从文本中提取 ID
      let results = ids
        .map(id => {
          // 精确匹配
          let found = websites.find(w => w.id === id);
          if (found) return found;
          
          // 尝试从 [ID:xxx] 格式中提取
          const idMatch = id.match(/\[ID:([^\]]+)\]/);
          if (idMatch) {
            found = websites.find(w => w.id === idMatch[1]);
            if (found) return found;
          }
          
          // 部分匹配（ID 可能被截断）
          found = websites.find(w => w.id.includes(id) || id.includes(w.id));
          return found;
        })
        .filter(Boolean);
      
      // 如果 AI 没找到结果，降级到改进的关键词搜索
      if (results.length === 0) {
        console.log('AI 未匹配到结果，降级到关键词搜索');
        results = keywordSearch(query, websites, limit);
        
        await logSearch(query, results.length, 'keyword', req);
        return res.json({ 
          results, 
          mode: 'keyword',
          reason: aiResult.reason || '',
          reasoning: aiResult.reasoning || '',
          message: `关键词匹配找到 ${results.length} 个结果` 
        });
      }
      
      await logSearch(query, results.length, 'ai', req);
      res.json({ 
        results, 
        mode: 'ai',
        reason: aiResult.reason || '',
        reasoning: aiResult.reasoning || '',
        message: `AI 智能推荐了 ${results.length} 个相关工具` 
      });
    } catch (parseError) {
      console.error('AI 结果解析失败:', parseError, 'Content:', content);
      const results = keywordSearch(query, websites, limit);
      
      await logSearch(query, results.length, 'keyword', req);
      return res.json({ 
        results, 
        mode: 'keyword',
        message: 'AI 结果解析失败，使用关键词匹配' 
      });
    }
  } catch (error) {
    console.error('AI 搜索错误:', error);
    res.status(500).json({ error: error.message });
  }
});

// 搜索统计接口（公开访问）
app.get('/api/search-stats', async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    
    // 获取热门搜索词
    const topSearchesRaw = await prismaForAi.$queryRaw`
      SELECT query, COUNT(*) as count 
      FROM SearchLog 
      WHERE createdAt >= ${startDate}
      GROUP BY query 
      ORDER BY count DESC 
      LIMIT 20
    `;
    // 转换 BigInt 为 Number
    const topSearches = topSearchesRaw.map(item => ({
      query: item.query,
      count: Number(item.count)
    }));
    
    // 获取搜索总数
    const totalSearches = await prismaForAi.searchLog.count({
      where: { createdAt: { gte: startDate } }
    });
    
    // 获取 AI 搜索占比
    const aiSearches = await prismaForAi.searchLog.count({
      where: { 
        createdAt: { gte: startDate },
        searchMode: 'ai'
      }
    });
    
    // 获取每日搜索趋势
    const dailyTrendRaw = await prismaForAi.$queryRaw`
      SELECT strftime('%Y-%m-%d', createdAt) as date, COUNT(*) as count 
      FROM SearchLog 
      WHERE createdAt >= ${startDate}
      GROUP BY strftime('%Y-%m-%d', createdAt) 
      ORDER BY date ASC
    `;
    // 转换 BigInt 为 Number，确保日期格式正确
    const dailyTrend = dailyTrendRaw.map(item => ({
      date: item.date || new Date().toISOString().split('T')[0],
      count: Number(item.count)
    }));
    
    res.json({
      topSearches,
      totalSearches,
      aiSearches,
      aiRatio: totalSearches > 0 ? (aiSearches / totalSearches * 100).toFixed(1) : 0,
      dailyTrend
    });
  } catch (error) {
    console.error('获取搜索统计失败:', error);
    res.status(500).json({ error: error.message });
  }
});

// 前端提交接口（限流但无需认证）
app.post('/api/submissions', submitLimiter);
app.get('/api/submissions/check-url', submitLimiter);
app.get('/api/submissions/status/:id', submitLimiter);

// ========== 需要认证的管理路由 ==========
app.use('/api/admin', authMiddleware, adminRoutes);
app.use('/api/admin/settings', authMiddleware, settingRoutes);
app.use('/api/upload', authMiddleware, uploadRoutes);
app.use('/api/ai-config', authMiddleware, aiConfigRoutes);
app.use('/api/logs', authMiddleware, logRoutes);
app.use('/api/monitor', authMiddleware, monitorRoutes);
app.use('/api/seo', authMiddleware, seoRoutes);
app.use('/api/seo-scraper', authMiddleware, seoScraperRoutes);
app.use('/api/export', authMiddleware, exportRoutes);
app.use('/api/users', authMiddleware, userRoutes);

// 提交管理接口（需要认证）
app.use('/api/submissions', submissionRoutes);

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'UIED API is running' });
});

// 404处理 - 使用统一错误处理
app.use(notFoundHandler);

// 统一错误处理中间件
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 UIED API 服务运行在 http://localhost:${PORT}`);
  console.log(`📊 健康检查: http://localhost:${PORT}/api/health`);
  console.log(`🔒 安全模式: ${process.env.NODE_ENV === 'production' ? '生产环境' : '开发环境'}`);
  
  // 启动监控定时任务
  startMonitorJob();
});
