/**
 * @file aiConfigRoutes.js
 * @description 后端API服务
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

import express from 'express';
import { PrismaClient } from '@prisma/client';
import fetch from 'node-fetch';
import https from 'https';

// 创建 HTTPS agent（仅在开发环境跳过 SSL 验证）
const httpsAgent = process.env.NODE_ENV === 'production' 
  ? undefined 
  : new https.Agent({ rejectUnauthorized: false });

const router = express.Router();
const prisma = new PrismaClient();

// 获取所有 AI 配置
router.get('/', async (req, res) => {
  try {
    const configs = await prisma.aiConfig.findMany({
      orderBy: { createdAt: 'desc' },
    });
    // 隐藏 API Key 的部分内容
    const safeConfigs = configs.map(c => ({
      ...c,
      apiKey: c.apiKey ? `${c.apiKey.slice(0, 8)}...${c.apiKey.slice(-4)}` : '',
    }));
    res.json(safeConfigs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 获取默认启用的 AI 配置
router.get('/default', async (req, res) => {
  try {
    let config = await prisma.aiConfig.findFirst({
      where: { enabled: true, isDefault: true },
    });
    if (!config) {
      config = await prisma.aiConfig.findFirst({
        where: { enabled: true },
      });
    }
    if (!config) {
      return res.status(404).json({ error: '没有可用的 AI 配置' });
    }
    res.json({
      id: config.id,
      name: config.name,
      provider: config.provider,
      model: config.model,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 创建 AI 配置
router.post('/', async (req, res) => {
  try {
    const { name, provider, apiUrl, apiKey, model, enabled, isDefault } = req.body;
    
    if (!name || !apiUrl || !apiKey || !model) {
      return res.status(400).json({ error: '名称、API地址、API密钥和模型为必填项' });
    }
    
    // 如果设为默认，取消其他默认配置
    if (isDefault) {
      await prisma.aiConfig.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      });
    }
    
    const config = await prisma.aiConfig.create({
      data: {
        name,
        provider: provider || 'siliconflow',
        apiUrl,
        apiKey,
        model,
        enabled: enabled !== false,
        isDefault: isDefault || false,
      },
    });
    res.json(config);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 更新 AI 配置
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { isDefault, ...data } = req.body;
    
    // 如果设为默认，取消其他默认配置
    if (isDefault) {
      await prisma.aiConfig.updateMany({
        where: { isDefault: true, id: { not: id } },
        data: { isDefault: false },
      });
    }
    
    const config = await prisma.aiConfig.update({
      where: { id },
      data: { ...data, isDefault },
    });
    res.json(config);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 删除 AI 配置
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.aiConfig.delete({
      where: { id },
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// AI 生成网站信息
router.post('/generate-website-info', async (req, res) => {
  try {
    const { url, testMode } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: '请提供网站URL' });
    }
    
    // 测试模式 - 返回模拟数据
    if (testMode) {
      // 从 URL 提取域名作为名称
      let domain = '';
      try {
        const urlObj = new URL(url);
        domain = urlObj.hostname.replace('www.', '');
      } catch {
        domain = url;
      }
      
      return res.json({
        name: `${domain} 网站`,
        description: `这是 ${domain} 的网站描述。该网站提供优质的服务和内容，是用户的理想选择。`,
        tags: '工具,在线服务,推荐',
      });
    }
    
    // 获取默认 AI 配置
    let config = await prisma.aiConfig.findFirst({
      where: { enabled: true, isDefault: true },
    });
    if (!config) {
      config = await prisma.aiConfig.findFirst({
        where: { enabled: true },
      });
    }
    if (!config) {
      return res.status(400).json({ error: '没有可用的 AI 配置，请先在系统设置中配置 AI' });
    }
    
    // 构建提示词
    const prompt = `请根据以下网站URL，生成网站的相关信息。请直接返回JSON格式，不要有其他内容。

网站URL: ${url}

请返回以下JSON格式（确保是有效的JSON）:
{
  "name": "网站名称（简短，2-10个字）",
  "description": "网站描述（50-100字，描述网站的主要功能和特点）",
  "tags": ["标签1", "标签2", "标签3"]
}

注意：
1. name 应该是网站的中文名称或常用名称
2. description 应该简洁明了，突出网站的核心功能
3. tags 应该是3-5个相关标签，用于分类和搜索
4. 只返回JSON，不要有任何其他文字`;

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
          messages: [
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 500,
        }),
        agent: httpsAgent, // 开发环境使用自定义 agent
      });
    } catch (fetchError) {
      console.error('AI API 网络错误:', fetchError);
      return res.status(500).json({ error: `AI API 网络连接失败: ${fetchError.message}` });
    }
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API 错误:', response.status, errorText);
      
      // 解析错误信息
      let errorMsg = 'AI API 调用失败';
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.error?.message) {
          errorMsg = errorJson.error.message;
        } else if (errorJson.message) {
          errorMsg = errorJson.message;
        } else if (typeof errorJson === 'string') {
          errorMsg = errorJson;
        }
      } catch {
        if (errorText) errorMsg = errorText;
      }
      
      // 根据状态码提供更友好的错误信息
      if (response.status === 401) {
        errorMsg = 'AI API Key 无效或已过期，请检查配置';
      } else if (response.status === 429) {
        errorMsg = 'AI API 请求过于频繁，请稍后再试';
      } else if (response.status === 500) {
        errorMsg = 'AI 服务暂时不可用，请稍后再试';
      }
      
      return res.status(500).json({ error: errorMsg });
    }
    
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      return res.status(500).json({ error: 'AI 返回内容为空' });
    }
    
    // 解析 JSON
    try {
      // 尝试提取 JSON 内容（处理可能的 markdown 代码块）
      let jsonStr = content;
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1].trim();
      }
      
      const result = JSON.parse(jsonStr);
      res.json({
        name: result.name || '',
        description: result.description || '',
        tags: Array.isArray(result.tags) ? result.tags.join(',') : '',
      });
    } catch (parseError) {
      console.error('JSON 解析失败:', content);
      res.status(500).json({ error: 'AI 返回格式错误', raw: content });
    }
  } catch (error) {
    console.error('AI 生成失败:', error);
    res.status(500).json({ error: error.message });
  }
});

// AI 智能搜索 - 根据自然语言描述搜索工具
router.post('/smart-search', async (req, res) => {
  try {
    const { query, categoryId, limit = 10 } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: '请提供搜索内容' });
    }
    
    // 获取默认 AI 配置
    let config = await prisma.aiConfig.findFirst({
      where: { enabled: true, isDefault: true },
    });
    if (!config) {
      config = await prisma.aiConfig.findFirst({
        where: { enabled: true },
      });
    }
    
    // 获取所有网站数据用于搜索
    const whereClause = {};
    if (categoryId) {
      whereClause.categoryId = categoryId;
    }
    
    const websites = await prisma.website.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        description: true,
        url: true,
        iconUrl: true,
        tags: true,
      },
      take: 200, // 限制数量避免 token 过多
    });
    
    if (websites.length === 0) {
      return res.json({ results: [], message: '暂无可搜索的工具数据' });
    }
    
    // 如果没有 AI 配置，使用简单的关键词匹配
    if (!config) {
      const keywords = query.toLowerCase().split(/\s+/);
      const results = websites.filter(site => {
        const text = `${site.name} ${site.description} ${site.tags || ''}`.toLowerCase();
        return keywords.some(kw => text.includes(kw));
      }).slice(0, limit);
      
      return res.json({ 
        results, 
        mode: 'keyword',
        message: '使用关键词匹配（AI 未配置）' 
      });
    }
    
    // 构建网站列表摘要
    const websiteList = websites.map((w, i) => 
      `[ID:${w.id}] ${w.name}: ${w.description?.slice(0, 50) || '无描述'}`
    ).join('\n');
    
    // 构建 AI 提示词
    const prompt = `你是一个设计工具推荐助手。用户正在寻找工具，请根据用户的需求从以下工具列表中推荐最相关的工具。

用户需求: ${query}

可选工具列表:
${websiteList}

请返回最相关的工具ID列表（最多${limit}个），按相关度排序。
重要：ID必须是方括号中的完整ID字符串，例如 "cmjl2qlfq004fgeg196cooldf"

只返回JSON格式:
{
  "ids": ["完整的工具ID1", "完整的工具ID2"],
  "reason": "简短说明推荐理由（20字以内）"
}

注意：
1. 只返回JSON，不要有其他内容
2. ids数组中必须是工具列表中的完整ID（以cm开头的字符串）
3. 如果没有相关工具，返回空数组 {"ids": [], "reason": "未找到相关工具"}`;

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
          messages: [
            { role: 'user', content: prompt }
          ],
          temperature: 0.3,
          max_tokens: 300,
        }),
        agent: httpsAgent,
      });
    } catch (fetchError) {
      console.error('AI 搜索网络错误:', fetchError);
      // 降级到关键词搜索
      const keywords = query.toLowerCase().split(/\s+/);
      const results = websites.filter(site => {
        const text = `${site.name} ${site.description} ${site.tags || ''}`.toLowerCase();
        return keywords.some(kw => text.includes(kw));
      }).slice(0, limit);
      
      return res.json({ 
        results, 
        mode: 'keyword',
        message: 'AI 服务暂不可用，使用关键词匹配' 
      });
    }
    
    if (!response.ok) {
      // 降级到关键词搜索
      const keywords = query.toLowerCase().split(/\s+/);
      const results = websites.filter(site => {
        const text = `${site.name} ${site.description} ${site.tags || ''}`.toLowerCase();
        return keywords.some(kw => text.includes(kw));
      }).slice(0, limit);
      
      return res.json({ 
        results, 
        mode: 'keyword',
        message: 'AI 服务暂不可用，使用关键词匹配' 
      });
    }
    
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
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
      
      // 根据 AI 返回的 ID 获取完整的网站信息
      const results = ids
        .map(id => websites.find(w => w.id === id))
        .filter(Boolean);
      
      res.json({ 
        results, 
        mode: 'ai',
        reason: aiResult.reason || '',
        message: `AI 智能推荐了 ${results.length} 个相关工具` 
      });
    } catch (parseError) {
      console.error('AI 搜索结果解析失败:', content);
      // 降级到关键词搜索
      const keywords = query.toLowerCase().split(/\s+/);
      const results = websites.filter(site => {
        const text = `${site.name} ${site.description} ${site.tags || ''}`.toLowerCase();
        return keywords.some(kw => text.includes(kw));
      }).slice(0, limit);
      
      return res.json({ 
        results, 
        mode: 'keyword',
        message: 'AI 结果解析失败，使用关键词匹配' 
      });
    }
  } catch (error) {
    console.error('AI 智能搜索失败:', error);
    res.status(500).json({ error: error.message });
  }
});

// AI 对话助手 - 回答设计相关问题
router.post('/chat', async (req, res) => {
  try {
    const { message, context } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: '请提供消息内容' });
    }
    
    // 获取默认 AI 配置
    let config = await prisma.aiConfig.findFirst({
      where: { enabled: true, isDefault: true },
    });
    if (!config) {
      config = await prisma.aiConfig.findFirst({
        where: { enabled: true },
      });
    }
    if (!config) {
      return res.status(400).json({ error: '没有可用的 AI 配置' });
    }
    
    // 构建系统提示词
    const systemPrompt = `你是 UIED 设计导航的 AI 助手，专注于帮助设计师解决问题。你的职责包括：
1. 回答 UI/UX 设计相关问题
2. 推荐合适的设计工具和资源
3. 提供设计建议和最佳实践
4. 解答关于设计软件的使用问题

请用简洁、专业的语言回答，必要时可以使用列表或步骤说明。回答应该实用且有帮助。`;

    // 构建消息
    const messages = [
      { role: 'system', content: systemPrompt },
    ];
    
    // 添加上下文（如果有）
    if (context && Array.isArray(context)) {
      messages.push(...context.slice(-6)); // 最多保留最近6条对话
    }
    
    messages.push({ role: 'user', content: message });
    
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
          messages,
          temperature: 0.7,
          max_tokens: 1000,
        }),
        agent: httpsAgent,
      });
    } catch (fetchError) {
      console.error('AI 对话网络错误:', fetchError);
      return res.status(500).json({ error: `AI 服务连接失败: ${fetchError.message}` });
    }
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI 对话错误:', response.status, errorText);
      return res.status(500).json({ error: 'AI 服务暂时不可用' });
    }
    
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      return res.status(500).json({ error: 'AI 返回内容为空' });
    }
    
    res.json({ 
      reply: content,
      usage: data.usage || null,
    });
  } catch (error) {
    console.error('AI 对话失败:', error);
    res.status(500).json({ error: error.message });
  }
});

// AI 流式对话助手 - 支持 SSE 流式响应
router.post('/chat/stream', async (req, res) => {
  try {
    const { message, context } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: '请提供消息内容' });
    }
    
    // 获取默认 AI 配置
    let config = await prisma.aiConfig.findFirst({
      where: { enabled: true, isDefault: true },
    });
    if (!config) {
      config = await prisma.aiConfig.findFirst({
        where: { enabled: true },
      });
    }
    if (!config) {
      return res.status(400).json({ error: '没有可用的 AI 配置，请先在系统设置中配置 AI' });
    }
    
    // 设置 SSE 响应头
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // 禁用 nginx 缓冲
    res.flushHeaders();
    
    // 构建系统提示词
    const systemPrompt = `你是 UIED 设计导航的 AI 助手，专注于帮助设计师解决问题。你的职责包括：
1. 回答 UI/UX 设计相关问题
2. 推荐合适的设计工具和资源
3. 提供设计建议和最佳实践
4. 解答关于设计软件的使用问题

请用简洁、专业的语言回答，必要时可以使用列表或步骤说明。回答应该实用且有帮助。
你可以使用 Markdown 格式来组织回答，包括代码块、列表、表格等。`;

    // 构建消息
    const messages = [
      { role: 'system', content: systemPrompt },
    ];
    
    // 添加上下文（如果有）
    if (context && Array.isArray(context)) {
      messages.push(...context.slice(-6)); // 最多保留最近6条对话
    }
    
    messages.push({ role: 'user', content: message });
    
    // 调用 AI API（流式模式）
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
          messages,
          temperature: 0.7,
          max_tokens: 2000,
          stream: true, // 启用流式输出
        }),
        agent: httpsAgent,
      });
    } catch (fetchError) {
      console.error('AI 流式对话网络错误:', fetchError);
      res.write(`event: error\ndata: ${JSON.stringify({ error: `AI 服务连接失败: ${fetchError.message}` })}\n\n`);
      res.end();
      return;
    }
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI 流式对话错误:', response.status, errorText);
      
      let errorMsg = 'AI 服务暂时不可用';
      if (response.status === 401) {
        errorMsg = 'AI API Key 无效或已过期';
      } else if (response.status === 429) {
        errorMsg = 'AI API 请求过于频繁，请稍后再试';
      }
      
      res.write(`event: error\ndata: ${JSON.stringify({ error: errorMsg })}\n\n`);
      res.end();
      return;
    }
    
    // 处理流式响应
    const reader = response.body;
    let buffer = '';
    
    reader.on('data', (chunk) => {
      buffer += chunk.toString();
      
      // 按行分割处理 SSE 数据
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // 保留最后一个不完整的行
      
      for (const line of lines) {
        const trimmedLine = line.trim();
        if (!trimmedLine || trimmedLine === 'data: [DONE]') {
          if (trimmedLine === 'data: [DONE]') {
            // 发送完成标记
            res.write(`event: message\ndata: ${JSON.stringify({ content: '', done: true })}\n\n`);
          }
          continue;
        }
        
        if (trimmedLine.startsWith('data: ')) {
          try {
            const jsonStr = trimmedLine.slice(6);
            if (jsonStr === '[DONE]') {
              res.write(`event: message\ndata: ${JSON.stringify({ content: '', done: true })}\n\n`);
              continue;
            }
            
            const data = JSON.parse(jsonStr);
            const content = data.choices?.[0]?.delta?.content || '';
            const finishReason = data.choices?.[0]?.finish_reason;
            
            if (content) {
              // 发送内容片段
              res.write(`event: message\ndata: ${JSON.stringify({ content, done: false })}\n\n`);
            }
            
            if (finishReason === 'stop') {
              // 发送完成标记
              res.write(`event: message\ndata: ${JSON.stringify({ content: '', done: true })}\n\n`);
            }
          } catch (parseError) {
            // 忽略解析错误，继续处理下一行
            console.warn('SSE 数据解析警告:', parseError.message);
          }
        }
      }
    });
    
    reader.on('end', () => {
      // 处理缓冲区中剩余的数据
      if (buffer.trim()) {
        const trimmedLine = buffer.trim();
        if (trimmedLine.startsWith('data: ') && trimmedLine !== 'data: [DONE]') {
          try {
            const jsonStr = trimmedLine.slice(6);
            if (jsonStr !== '[DONE]') {
              const data = JSON.parse(jsonStr);
              const content = data.choices?.[0]?.delta?.content || '';
              if (content) {
                res.write(`event: message\ndata: ${JSON.stringify({ content, done: false })}\n\n`);
              }
            }
          } catch (e) {
            // 忽略
          }
        }
      }
      
      // 确保发送完成标记
      res.write(`event: message\ndata: ${JSON.stringify({ content: '', done: true })}\n\n`);
      res.end();
    });
    
    reader.on('error', (error) => {
      console.error('AI 流式响应读取错误:', error);
      res.write(`event: error\ndata: ${JSON.stringify({ error: '流式传输中断' })}\n\n`);
      res.end();
    });
    
    // 处理客户端断开连接
    req.on('close', () => {
      reader.destroy();
    });
    
  } catch (error) {
    console.error('AI 流式对话失败:', error);
    // 如果响应头还没发送，返回 JSON 错误
    if (!res.headersSent) {
      res.status(500).json({ error: error.message });
    } else {
      res.write(`event: error\ndata: ${JSON.stringify({ error: error.message })}\n\n`);
      res.end();
    }
  }
});

// AI 工具推荐 - 根据当前页面推荐相关工具
router.post('/recommend', async (req, res) => {
  try {
    const { categoryId, currentToolId, limit = 6 } = req.body;
    
    // 获取相关工具
    const whereClause = {};
    if (categoryId) whereClause.categoryId = categoryId;
    if (currentToolId) whereClause.id = { not: currentToolId };
    
    const websites = await prisma.website.findMany({
      where: whereClause,
      orderBy: [
        { clickCount: 'desc' },
        { createdAt: 'desc' },
      ],
      take: limit * 2, // 获取更多以便筛选
    });
    
    // 随机打乱并取前 limit 个
    const shuffled = websites.sort(() => Math.random() - 0.5);
    const results = shuffled.slice(0, limit);
    
    res.json({ results });
  } catch (error) {
    console.error('AI 推荐失败:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
