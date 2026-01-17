/**
 * @file seoScraperService.js
 * @description SEO信息抓取服务 - 从网页获取标题、描述和关键词
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import https from 'https';

/**
 * 从URL抓取SEO信息
 * @param {string} url - 网站URL
 * @returns {Promise<{title: string, description: string, keywords: string}>}
 */
export async function scrapeSeoInfo(url) {
  try {
    // 确保URL格式正确
    const targetUrl = url.startsWith('http') ? url : `https://${url}`;
    
    // 创建HTTPS代理，在开发环境中禁用SSL验证
    const httpsAgent = process.env.NODE_ENV === 'production' 
      ? undefined 
      : new https.Agent({ rejectUnauthorized: false });
    
    // 设置请求头，模拟浏览器
    const response = await axios.get(targetUrl, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
      },
      maxRedirects: 5,
      httpsAgent,
    });

    const html = response.data;
    const $ = cheerio.load(html);

    // 提取标题
    let title = '';
    // 优先级: og:title > twitter:title > title标签
    title = $('meta[property="og:title"]').attr('content') ||
            $('meta[name="twitter:title"]').attr('content') ||
            $('title').text() ||
            '';
    title = title.trim();

    // 提取描述
    let description = '';
    // 优先级: og:description > twitter:description > description meta
    description = $('meta[property="og:description"]').attr('content') ||
                  $('meta[name="twitter:description"]').attr('content') ||
                  $('meta[name="description"]').attr('content') ||
                  '';
    description = description.trim();

    // 提取关键词
    let keywords = '';
    keywords = $('meta[name="keywords"]').attr('content') || '';
    keywords = keywords.trim();

    // 如果没有关键词，尝试从标题和描述中提取
    if (!keywords && (title || description)) {
      // 简单的关键词提取逻辑
      const text = `${title} ${description}`.toLowerCase();
      const commonWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'be', 'been', 'being', '的', '了', '和', '是', '在', '有', '我', '你', '他', '她', '它', '们'];
      const words = text.match(/[\u4e00-\u9fa5]+|[a-z]+/gi) || [];
      const uniqueWords = [...new Set(words)]
        .filter(word => word.length > 2 && !commonWords.includes(word.toLowerCase()))
        .slice(0, 5);
      keywords = uniqueWords.join(',');
    }

    // 清理标题（移除网站名称后缀）
    if (title) {
      // 移除常见的分隔符后的内容
      title = title.split(/[|–—-]/)[0].trim();
      // 限制长度
      if (title.length > 60) {
        title = title.substring(0, 60) + '...';
      }
    }

    // 清理描述
    if (description) {
      // 移除多余的空白字符
      description = description.replace(/\s+/g, ' ').trim();
      // 限制长度
      if (description.length > 200) {
        description = description.substring(0, 200) + '...';
      }
    }

    return {
      title: title || '未知网站',
      description: description || '暂无描述',
      keywords: keywords || '',
    };
  } catch (error) {
    console.error('SEO信息抓取失败:', error.message);
    
    // 返回基于URL的默认信息
    const domain = new URL(url.startsWith('http') ? url : `https://${url}`).hostname;
    return {
      title: domain,
      description: `访问 ${domain} 了解更多信息`,
      keywords: '',
    };
  }
}

export default {
  scrapeSeoInfo,
};
