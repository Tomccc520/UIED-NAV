/**
 * @file proxy-server.js
 * @description WordPress API代理服务器，解决API请求被拉黑问题
 * @copyright 版权所有 (c) 2025 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

// 导入所需模块
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

// 创建Express应用
const app = express();
const port = process.env.PORT || 3001;

// 启用CORS
app.use(cors());

// 启用请求日志记录
app.use(morgan('dev'));

// 设置请求速率限制器 - 每IP每分钟最多20个请求
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1分钟
  max: 20, // 每个IP在windowMs时间内最多20个请求
  standardHeaders: true,
  message: { error: '请求过于频繁，请稍后再试' }
});

// 对所有路由应用速率限制
app.use(limiter);

// 定义API常量
const WP_API_BASE_URL = 'https://www.uied.cn/wp-json/wp/v2';

// 设置请求头
const getHeaders = () => {
  // 常用浏览器UserAgent列表
  const userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1'
  ];
  
  // 随机选择一个User-Agent
  const randomUserAgent = userAgents[Math.floor(Math.random() * userAgents.length)];
  
  return {
    'User-Agent': randomUserAgent,
    'Accept': 'application/json',
    'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
    'Referer': 'https://www.uied.cn/',
    'Origin': 'https://www.uied.cn',
    'Connection': 'keep-alive'
  };
};

// 添加随机延迟中间件
const randomDelay = (req, res, next) => {
  const delay = Math.floor(Math.random() * 500) + 100; // 100-600ms随机延迟
  setTimeout(next, delay);
};

app.use(randomDelay);

// 文章列表代理路由
app.get('/api/posts', async (req, res) => {
  try {
    // 从请求中获取参数
    const { page = 1, per_page = 10, categories, orderby = 'date', order = 'desc' } = req.query;
    
    // 构建请求URL
    let url = `${WP_API_BASE_URL}/posts?page=${page}&per_page=${per_page}&orderby=${orderby}&order=${order}&_embed=true`;
    
    // 如果提供了分类，添加到请求中
    if (categories) {
      url += `&categories=${categories}`;
    }
    
    // 添加缓存破坏参数
    url += `&_=${Date.now()}`;
    
    // 发起请求
    const response = await axios.get(url, {
      headers: getHeaders(),
      timeout: 10000 // 10秒超时
    });
    
    // 返回数据
    res.json(response.data);
  } catch (error) {
    console.error('代理请求失败:', error.message);
    
    // 提取状态码和错误信息
    const status = error.response?.status || 500;
    const message = error.response?.data?.message || error.message || '代理请求失败';
    
    res.status(status).json({
      error: message,
      timestamp: new Date().toISOString()
    });
  }
});

// 搜索代理路由
app.get('/api/search', async (req, res) => {
  try {
    // 从请求中获取搜索参数
    const { keyword, page = 1, per_page = 10 } = req.query;
    
    if (!keyword) {
      return res.status(400).json({ error: '搜索关键词不能为空' });
    }
    
    // 构建请求URL
    const url = `${WP_API_BASE_URL}/posts?search=${encodeURIComponent(keyword)}&page=${page}&per_page=${per_page}&_embed=true&_=${Date.now()}`;
    
    // 发起请求
    const response = await axios.get(url, {
      headers: getHeaders(),
      timeout: 10000
    });
    
    // 返回数据
    res.json(response.data);
  } catch (error) {
    console.error('搜索请求失败:', error.message);
    
    const status = error.response?.status || 500;
    const message = error.response?.data?.message || error.message || '搜索请求失败';
    
    res.status(status).json({
      error: message,
      timestamp: new Date().toISOString()
    });
  }
});

// 添加健康检查端点
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 启动服务器
app.listen(port, () => {
  console.log(`WordPress API代理服务器已启动，监听端口: ${port}`);
});

/**
 * 使用说明:
 * 
 * 1. 安装依赖:
 *    npm install express axios cors morgan express-rate-limit
 * 
 * 2. 启动代理服务器:
 *    node proxy-server.js
 * 
 * 3. 前端使用代理地址:
 *    在src/services/wordpress-api.js中修改API_BASE_URL为:
 *    const API_BASE_URL = 'http://localhost:3001/api';
 * 
 * 4. 部署到服务器时:
 *    - 确保安装PM2等进程管理工具
 *    - 使用PM2启动: pm2 start proxy-server.js --name "wp-api-proxy"
 */ 