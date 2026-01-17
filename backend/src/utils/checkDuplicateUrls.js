/**
 * @file checkDuplicateUrls.js
 * @description 检查静态数据中的重复URL
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function extractUrlsFromFile(filePath, toolsVarName) {
  const content = fs.readFileSync(filePath, 'utf-8');
  
  const exportPattern = new RegExp(`export\\s+const\\s+${toolsVarName}\\s*=\\s*\\[`);
  const match = content.match(exportPattern);
  
  if (!match) {
    return [];
  }
  
  const startIndex = match.index + match[0].length - 1;
  
  let depth = 0;
  let endIndex = startIndex;
  for (let i = startIndex; i < content.length; i++) {
    if (content[i] === '[') depth++;
    if (content[i] === ']') depth--;
    if (depth === 0) {
      endIndex = i + 1;
      break;
    }
  }
  
  const arrayStr = content.substring(startIndex, endIndex);
  
  // 提取所有URL
  const urlPattern = /url:\s*['"]([^'"]+)['"]/g;
  const urls = [];
  let urlMatch;
  while ((urlMatch = urlPattern.exec(arrayStr)) !== null) {
    urls.push(urlMatch[1].toLowerCase().replace(/\/$/, ''));
  }
  
  return urls;
}

function main() {
  console.log('检查静态数据中的重复URL...\n');
  
  const pages = [
    { name: 'AI', file: '../../../frontend/src/data/aiToolsDatabase.js', varName: 'aiTools' },
    { name: 'UIUX', file: '../../../frontend/src/data/uiuxToolsDatabase.js', varName: 'uiuxTools' },
    { name: 'Design', file: '../../../frontend/src/data/designToolsDatabase.js', varName: 'designTools' },
    { name: '3D', file: '../../../frontend/src/data/threeDToolsDatabase.js', varName: 'allThreeDTools' },
    { name: 'Font', file: '../../../frontend/src/data/fontToolsDatabase.js', varName: 'fontTools' },
    { name: 'Interior', file: '../../../frontend/src/data/interiorToolsDatabase.js', varName: 'allInteriorTools' },
  ];
  
  const allUrls = new Map(); // url -> [pages]
  
  for (const page of pages) {
    const fullPath = path.resolve(__dirname, page.file);
    if (!fs.existsSync(fullPath)) continue;
    
    const urls = extractUrlsFromFile(fullPath, page.varName);
    console.log(`${page.name}: ${urls.length} 个URL`);
    
    for (const url of urls) {
      if (!allUrls.has(url)) {
        allUrls.set(url, []);
      }
      allUrls.get(url).push(page.name);
    }
  }
  
  // 找出重复的URL
  console.log('\n=== 跨页面重复的URL ===');
  let crossPageDuplicates = 0;
  for (const [url, pages] of allUrls) {
    if (pages.length > 1) {
      crossPageDuplicates++;
      if (crossPageDuplicates <= 20) {
        console.log(`${url}`);
        console.log(`  出现在: ${pages.join(', ')}`);
      }
    }
  }
  console.log(`\n跨页面重复URL总数: ${crossPageDuplicates}`);
  
  // 统计
  console.log('\n=== 统计 ===');
  console.log(`总URL数(含重复): ${Array.from(allUrls.values()).reduce((sum, arr) => sum + arr.length, 0)}`);
  console.log(`唯一URL数: ${allUrls.size}`);
  console.log(`重复URL数: ${crossPageDuplicates}`);
}

main();
