/**
 * @copyright Tomda (https://www.tomda.top)
 * @copyright UIED技术团队 (https://fsuied.com)
 * @author UIED技术团队
 * @createDate 2026-02-17
 */

'use strict';

const fs = require('fs');
const path = require('path');

/**
 * 获取 YYYY-MM-DD 日期字符串
 */
function getTodayDateText() {
  return new Date().toISOString().slice(0, 10);
}

/**
 * 解析单个路由文件中的接口定义
 */
function parseRouterFile(filePath, projectRoot) {
  const routerRe = /^\s*router\.(all|get|post|put|delete)\('([^']+)'\s*,\s*([^)]+)\);/;
  const helperRe = /^\s*(get|post|put|delete)\('([^']+)'\s*,\s*([^)]+)\);/;
  const rows = [];
  const lines = fs.readFileSync(filePath, 'utf8').split('\n');

  lines.forEach((line, idx) => {
    let matched = line.match(routerRe);
    if (!matched) {
      matched = line.match(helperRe);
      if (!matched) return;
    }
    rows.push({
      method: String(matched[1] || '').toUpperCase(),
      routePath: String(matched[2] || '').trim(),
      action: String(matched[3] || '').trim(),
      routerFile: path.basename(filePath),
      line: idx + 1,
      ref: path.relative(projectRoot, filePath).replace(/\\/g, '/'),
    });
  });

  return rows;
}

/**
 * 生成 Markdown 清单内容
 */
function buildMarkdown(rows, dateText) {
  const grouped = new Map();
  for (const row of rows) {
    if (!grouped.has(row.routerFile)) grouped.set(row.routerFile, []);
    grouped.get(row.routerFile).push(row);
  }

  let md = '';
  md += '<!--\n';
  md += ' * @copyright Tomda (https://www.tomda.top)\n';
  md += ' * @copyright UIED技术团队 (https://fsuied.com)\n';
  md += ' * @author UIED技术团队\n';
  md += ` * @createDate ${dateText}\n`;
  md += ' -->\n\n';
  md += '# 后端 API 全量清单（自动生成）\n\n';
  md += `生成时间：${dateText}\n\n`;
  md += `总计接口：${rows.length} 条\n\n`;
  md += '> 数据来源：`server/server/app/router/*.js`\n\n';

  for (const [routerFile, list] of grouped.entries()) {
    md += `## ${routerFile}（${list.length}）\n\n`;
    md += '| Method | Path | Controller | 位置 |\n';
    md += '|---|---|---|---|\n';
    list.forEach(item => {
      md += `| ${item.method} | \`${item.routePath}\` | \`${item.action}\` | \`${item.ref}:${item.line}\` |\n`;
    });
    md += '\n';
  }

  return md;
}

/**
 * 主流程：扫描路由并输出 API 全量清单
 */
function main() {
  const projectRoot = path.resolve(__dirname, '..');
  const routerDir = path.join(projectRoot, 'server/server/app/router');
  const outDir = path.join(projectRoot, 'docs/API');
  const dateText = getTodayDateText();
  const outFile = path.join(outDir, `后端API全量清单-自动生成-${dateText}.md`);

  const routerFiles = fs.readdirSync(routerDir)
    .filter(file => file.endsWith('.js'))
    .sort((a, b) => a.localeCompare(b, 'zh-CN'));

  const rows = routerFiles.flatMap(file => parseRouterFile(path.join(routerDir, file), projectRoot));
  rows.sort((a, b) => {
    if (a.routerFile !== b.routerFile) return a.routerFile.localeCompare(b.routerFile, 'zh-CN');
    if (a.routePath !== b.routePath) return a.routePath.localeCompare(b.routePath, 'zh-CN');
    return a.line - b.line;
  });

  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  fs.writeFileSync(outFile, buildMarkdown(rows, dateText), 'utf8');
  process.stdout.write(`已生成：${outFile}\n`);
  process.stdout.write(`接口总数：${rows.length}\n`);
}

main();
