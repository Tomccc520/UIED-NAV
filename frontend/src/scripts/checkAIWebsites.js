/**
 * @file checkAIWebsites.js
 * @description 检查AI工具网站的可访问性
 * @copyright 版权所有 (c) 2025 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

const https = require('https');
const http = require('http');
const { aiTools } = require('../data/aiToolsDatabase.cjs');

// 检查单个网站的可访问性
function checkWebsite(url) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const timeout = 10000; // 10秒超时

    // 解析URL
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: 'HEAD', // 使用HEAD请求减少流量
      timeout: timeout,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; UIED-NAV-Checker/1.0)'
      }
    };

    const req = client.request(options, (res) => {
      const responseTime = Date.now() - startTime;
      resolve({
        statusCode: res.statusCode || 0,
        responseTime
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

// 检查所有AI工具网站
async function checkAllWebsites() {
  console.log('🚀 开始检查AI工具网站可访问性...\n');
  console.log(`📊 总共需要检查 ${aiTools.length} 个网站\n`);

  const results = [];
  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < aiTools.length; i++) {
    const tool = aiTools[i];
    process.stdout.write(`\r⏳ 检查进度: ${i + 1}/${aiTools.length} - ${tool.name}`);

    try {
      const { statusCode, responseTime } = await checkWebsite(tool.url);
      
      if (statusCode >= 200 && statusCode < 400) {
        results.push({
          id: tool.id,
          name: tool.name,
          url: tool.url,
          status: 'success',
          statusCode,
          responseTime
        });
        successCount++;
      } else {
        results.push({
          id: tool.id,
          name: tool.name,
          url: tool.url,
          status: 'error',
          statusCode,
          error: `HTTP ${statusCode}`
        });
        errorCount++;
      }
    } catch (error) {
      results.push({
        id: tool.id,
        name: tool.name,
        url: tool.url,
        status: 'error',
        error: error.message
      });
      errorCount++;
    }

    // 添加延迟避免频繁请求
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log('\n\n✅ 检查完成！\n');
  return results;
}

// 生成报告
function generateReport(results) {
  const successResults = results.filter(r => r.status === 'success');
  const errorResults = results.filter(r => r.status === 'error');

  console.log('='.repeat(80));
  console.log('📋 AI工具网站可访问性检查报告');
  console.log('='.repeat(80));
  console.log(`📊 总计: ${results.length} 个网站`);
  console.log(`✅ 成功: ${successResults.length} 个 (${(successResults.length / results.length * 100).toFixed(1)}%)`);
  console.log(`❌ 失败: ${errorResults.length} 个 (${(errorResults.length / results.length * 100).toFixed(1)}%)`);
  console.log('='.repeat(80));

  if (errorResults.length > 0) {
    console.log('\n❌ 无法访问的网站:');
    console.log('-'.repeat(80));
    errorResults.forEach((result, index) => {
      console.log(`${index + 1}. ${result.name}`);
      console.log(`   URL: ${result.url}`);
      console.log(`   错误: ${result.error || `HTTP ${result.statusCode}`}`);
      console.log('');
    });
  }

  if (successResults.length > 0) {
    console.log('\n✅ 可访问的网站 (响应时间前20名):');
    console.log('-'.repeat(80));
    
    // 按响应时间排序
    const sortedSuccess = successResults.sort((a, b) => (a.responseTime || 0) - (b.responseTime || 0));
    
    sortedSuccess.slice(0, 20).forEach((result, index) => {
      const responseTime = result.responseTime ? `${result.responseTime}ms` : 'N/A';
      console.log(`${index + 1}. ${result.name} (${responseTime})`);
      console.log(`   URL: ${result.url}`);
    });

    if (successResults.length > 20) {
      console.log(`\n... 还有 ${successResults.length - 20} 个可访问的网站`);
    }
  }

  console.log('\n='.repeat(80));
  console.log('🎉 报告生成完成！');
  console.log('='.repeat(80));
}

// 按分类统计
function generateCategoryStats(results) {
  const categoryStats = {};
  
  results.forEach(result => {
    const tool = aiTools.find(t => t.id === result.id);
    if (!tool) return;
    
    const category = tool.category;
    if (!categoryStats[category]) {
      categoryStats[category] = { total: 0, success: 0 };
    }
    
    categoryStats[category].total++;
    if (result.status === 'success') {
      categoryStats[category].success++;
    }
  });

  console.log('\n📊 分类统计:');
  console.log('-'.repeat(80));
  
  Object.entries(categoryStats).forEach(([category, stats]) => {
    const percentage = ((stats.success / stats.total) * 100).toFixed(1);
    console.log(`${category}: ${stats.success}/${stats.total} 可访问 (${percentage}%)`);
  });
}

// 主函数
async function main() {
  try {
    console.log('🔍 UIED AI导航 - 网站可访问性检查工具');
    console.log('='.repeat(80));
    
    const results = await checkAllWebsites();
    generateReport(results);
    generateCategoryStats(results);
    
  } catch (error) {
    console.error('❌ 检查过程中发生错误:', error);
    process.exit(1);
  }
}

// 运行检查
main(); 