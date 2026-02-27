#!/usr/bin/env node
/**
 * @copyright Tomda (https://www.tomda.top)
 * @copyright UIED技术团队 (https://fsuied.com)
 * @author UIED技术团队
 * @createDate 2026-02-20
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT_DIR = path.resolve(__dirname, '..');
const DEFAULT_BASE_URL = process.env.PREFLIGHT_BASE_URL || 'http://127.0.0.1:8002';
const DEFAULT_FRONTEND_BASE_URL = process.env.PREFLIGHT_FRONTEND_BASE_URL || '';
const DEFAULT_SMOKE_USER = process.env.PREFLIGHT_SMOKE_USER || '';
const DEFAULT_SMOKE_PASS = process.env.PREFLIGHT_SMOKE_PASS || '';
const REPORT_DIR = path.join(ROOT_DIR, 'docs', 'API', 'reports');
const REPORT_FILE = path.join(REPORT_DIR, 'commercial_preflight_latest.json');
const ROUTER_FILES = [
  path.join(ROOT_DIR, 'server', 'server', 'app', 'router', 'frontend.js'),
  path.join(ROOT_DIR, 'server', 'server', 'app', 'router', 'uied.js'),
  path.join(ROOT_DIR, 'server', 'server', 'app', 'router', 'system.js'),
];

/**
 * 解析命令行参数
 */
function parseArgs(argv = []) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    const raw = String(argv[i] || '');
    if (!raw.startsWith('--')) continue;
    const key = raw.replace(/^--/, '');
    const next = argv[i + 1];
    if (!next || String(next).startsWith('--')) {
      args[key] = true;
      continue;
    }
    args[key] = String(next);
    i++;
  }
  return args;
}

/**
 * 执行系统命令并返回标准输出
 */
function runCmd(bin, args = []) {
  return execFileSync(bin, args, {
    cwd: ROOT_DIR,
    encoding: 'utf8',
    stdio: [ 'pipe', 'pipe', 'pipe' ],
  }).trim();
}

/**
 * 读取本地数据库配置（优先 config.local.js）
 */
function loadDbConfig() {
  const configPath = path.join(ROOT_DIR, 'server', 'server', 'config', 'config.local.js');
  if (!fs.existsSync(configPath)) {
    return {
      username: 'uied',
      password: 'uied123456',
      database: 'uied_nav',
      host: '127.0.0.1',
      port: 3308,
    };
  }
  const configFactory = require(configPath);
  const cfg = typeof configFactory === 'function' ? configFactory({}) : {};
  const sequelize = cfg.sequelize || {};
  return {
    username: String(sequelize.username || 'uied'),
    password: String(sequelize.password || 'uied123456'),
    database: String(sequelize.database || 'uied_nav'),
    host: String(sequelize.host || '127.0.0.1'),
    port: Number(sequelize.port || 3308),
  };
}

/**
 * 自动探测 MySQL 容器名
 */
function detectMysqlContainer(preferred) {
  if (preferred) return preferred;
  const output = runCmd('docker', [ 'ps', '--format', '{{.Names}}' ]);
  const names = output.split('\n').map(item => item.trim()).filter(Boolean);
  const priority = [ 'uied_mysql', 'likeadmin-mysql8' ];
  for (const name of priority) {
    if (names.includes(name)) return name;
  }
  const fuzzy = names.find(name => /mysql/i.test(name));
  if (!fuzzy) {
    throw new Error('未检测到 MySQL Docker 容器，请通过 --mysql-container 指定。');
  }
  return fuzzy;
}

/**
 * 执行 MySQL 查询并返回文本结果
 */
function queryMysql(sql, options) {
  const args = [
    'exec',
    '-i',
    options.container,
    'mysql',
    '--default-character-set=utf8mb4',
    `-u${options.username}`,
    `-p${options.password}`,
    '-D',
    options.database,
    '-N',
    '-B',
    '-e',
    sql,
  ];
  return runCmd('docker', args);
}

/**
 * HTTP 请求（带超时）
 */
async function requestJson(url, options = {}) {
  const method = String(options.method || 'GET').toUpperCase();
  const headers = options.headers || {};
  const timeoutMs = Number(options.timeoutMs || 8000);
  const body = options.body === undefined ? undefined : JSON.stringify(options.body);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method,
      headers,
      body,
      signal: controller.signal,
    });
    const text = await res.text();
    let json = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch (error) {
      json = null;
    }
    return {
      ok: res.ok,
      status: res.status,
      text,
      json,
    };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * HTTP GET 请求（带超时）
 */
async function getJson(url, headers = {}, timeoutMs = 8000) {
  return requestJson(url, { method: 'GET', headers, timeoutMs });
}

/**
 * HTTP POST 请求（JSON）
 */
async function postJson(url, body = {}, headers = {}, timeoutMs = 8000) {
  return requestJson(url, {
    method: 'POST',
    body,
    timeoutMs,
    headers: {
      'content-type': 'application/json',
      ...headers,
    },
  });
}

/**
 * 判断接口响应是否成功
 */
function isApiSuccess(payload) {
  if (!payload || typeof payload !== 'object') return false;
  if (Object.prototype.hasOwnProperty.call(payload, 'code')) {
    const code = Number(payload.code);
    return [ 0, 1, 200 ].includes(code);
  }
  if (Object.prototype.hasOwnProperty.call(payload, 'error') && payload.error) {
    return false;
  }
  return true;
}

/**
 * 解析接口返回中的 data 数据
 */
function extractData(payload) {
  if (!payload || typeof payload !== 'object') return null;
  if (Object.prototype.hasOwnProperty.call(payload, 'data')) return payload.data;
  return payload;
}

/**
 * 标准化弹窗配置，和后端规则保持一致
 */
function normalizeExitModalConfig(config = {}) {
  const defaults = {
    enabled: true,
    title: '即将离开本站',
    description: '您即将访问外部网站，请注意安全',
    autoRedirect: true,
    countdown: 5,
    logo: '',
    showAgreementLinks: false,
    userAgreementText: '用户协议',
    userAgreementUrl: '',
    copyrightAgreementText: '版权协议',
    copyrightAgreementUrl: '',
  };
  const merged = { ...defaults, ...(config || {}) };
  const countdownRaw = Number(merged.countdown);
  const countdown = Number.isFinite(countdownRaw) ? Math.max(1, Math.min(30, countdownRaw)) : defaults.countdown;
  return {
    ...merged,
    enabled: merged.enabled !== false,
    autoRedirect: merged.autoRedirect !== false,
    countdown,
    logo: String(merged.logo || ''),
    showAgreementLinks: merged.showAgreementLinks === true,
    userAgreementText: String(merged.userAgreementText || defaults.userAgreementText),
    userAgreementUrl: String(merged.userAgreementUrl || ''),
    copyrightAgreementText: String(merged.copyrightAgreementText || defaults.copyrightAgreementText),
    copyrightAgreementUrl: String(merged.copyrightAgreementUrl || ''),
  };
}

/**
 * 记录检查结果
 */
function createReporter() {
  const rows = [];
  return {
    add(status, category, item, detail, suggestion = '') {
      rows.push({
        status,
        category,
        item,
        detail,
        suggestion,
      });
    },
    getRows() {
      return rows.slice();
    },
  };
}

/**
 * 输出终端报告
 */
function printReport(rows) {
  const statusIcon = {
    pass: 'PASS',
    warn: 'WARN',
    fail: 'FAIL',
  };
  console.log('');
  console.log('=== 商业版发布前健康检查报告 ===');
  rows.forEach((row, index) => {
    const idx = String(index + 1).padStart(2, '0');
    console.log(`[${idx}] [${statusIcon[row.status] || row.status}] [${row.category}] ${row.item}`);
    console.log(`     ${row.detail}`);
    if (row.suggestion) {
      console.log(`     建议: ${row.suggestion}`);
    }
  });
  const pass = rows.filter(item => item.status === 'pass').length;
  const warn = rows.filter(item => item.status === 'warn').length;
  const fail = rows.filter(item => item.status === 'fail').length;
  console.log('');
  console.log(`汇总: PASS=${pass} WARN=${warn} FAIL=${fail}`);
  console.log(`JSON 报告: ${REPORT_FILE}`);
  console.log('');
}

/**
 * 写入 JSON 报告文件
 */
function writeJsonReport(rows) {
  if (!fs.existsSync(REPORT_DIR)) {
    fs.mkdirSync(REPORT_DIR, { recursive: true });
  }
  const payload = {
    generatedAt: new Date().toISOString(),
    rows,
  };
  fs.writeFileSync(REPORT_FILE, JSON.stringify(payload, null, 2), 'utf8');
}

/**
 * 规范化路由方法名
 */
function normalizeHttpMethod(method = '') {
  const text = String(method || '').trim().toLowerCase();
  if (text === 'allfeature') return 'all';
  if (text === 'getfeature') return 'get';
  if (text === 'postfeature') return 'post';
  if (text === 'delfeature') return 'delete';
  if (text === 'postlegacyfeature') return 'post';
  if (text === 'getlegacy') return 'get';
  if (text === 'postlegacy') return 'post';
  if (text === 'dellegacy') return 'delete';
  if (text === 'del') return 'delete';
  return text;
}

/**
 * 解析单个路由文件中的路由定义
 */
function parseRoutesFromFile(filePath) {
  const relPath = path.relative(ROOT_DIR, filePath);
  if (!fs.existsSync(filePath)) return [];
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const routeReg = /(?:router\.)?(allfeature|getfeature|postfeature|delfeature|postlegacyfeature|getlegacy|postlegacy|dellegacy|get|post|put|patch|delete|del|all)\s*\(\s*['"`]([^'"`]+)['"`]/gi;
  const routes = [];
  lines.forEach((line, index) => {
    let match = routeReg.exec(line);
    while (match) {
      routes.push({
        method: normalizeHttpMethod(match[1]),
        path: String(match[2] || '').trim(),
        source: `${relPath}:${index + 1}`,
      });
      match = routeReg.exec(line);
    }
    routeReg.lastIndex = 0;
  });
  return routes;
}

/**
 * 扫描核心路由文件，检查 method+path 重复定义
 */
function scanRouteDuplicates() {
  const allRoutes = ROUTER_FILES.flatMap(filePath => parseRoutesFromFile(filePath));
  const routeMap = new Map();
  allRoutes.forEach(item => {
    const key = `${item.method} ${item.path}`;
    if (!routeMap.has(key)) routeMap.set(key, []);
    routeMap.get(key).push(item.source);
  });
  const duplicates = Array.from(routeMap.entries())
    .filter(([, sources ]) => sources.length > 1)
    .map(([ key, sources ]) => ({ key, sources }));
  const compatibilityAliasCount = allRoutes.filter(item => item.path && !item.path.startsWith('/api/')).length;
  return {
    allRoutes,
    total: allRoutes.length,
    duplicates,
    compatibilityAliasCount,
  };
}

/**
 * 脚本主流程
 */
async function main() {
  const args = parseArgs(process.argv.slice(2));
  const reporter = createReporter();
  const baseUrl = String(args['base-url'] || DEFAULT_BASE_URL).replace(/\/+$/, '');
  const frontendBaseUrl = String(args['frontend-base-url'] || DEFAULT_FRONTEND_BASE_URL || '').replace(/\/+$/, '');
  const smokeUser = String(args['smoke-user'] || DEFAULT_SMOKE_USER || '').trim();
  const smokePass = String(args['smoke-pass'] || DEFAULT_SMOKE_PASS || '').trim();

  let mysql = null;
  try {
    const db = loadDbConfig();
    const container = detectMysqlContainer(args['mysql-container'] || process.env.UIED_MYSQL_CONTAINER);
    mysql = {
      ...db,
      container,
      username: String(args['db-user'] || process.env.UIED_DB_USER || db.username),
      password: String(args['db-pass'] || process.env.UIED_DB_PASS || db.password),
      database: String(args['db-name'] || process.env.UIED_DB_NAME || db.database),
    };
    reporter.add('pass', '环境', 'MySQL 容器探测', `使用容器: ${mysql.container}，数据库: ${mysql.database}`);
  } catch (error) {
    reporter.add('fail', '环境', 'MySQL 容器探测', String(error.message || error), '确认 Docker 已启动，或通过 --mysql-container 指定容器名。');
  }

  // 1) 接口健康检查
  let publicSettingsData = null;
  const apiEndpoints = [
    '/api/settings/public',
    '/api/settings/frontend-config',
    '/api/articles?limit=1',
    '/api/articles/meta/categories',
    '/api/articles/meta/tags',
    '/api/site-info',
    '/api/settings/nav-menus',
    '/api/daily-hot/config',
    '/api/rankings',
  ];
  for (const endpoint of apiEndpoints) {
    const url = `${baseUrl}${endpoint}`;
    try {
      const res = await getJson(url);
      if (!res.ok) {
        reporter.add('fail', '接口', endpoint, `HTTP ${res.status}`, '检查服务是否启动、网关前缀和鉴权白名单。');
        continue;
      }
      if (res.json && !isApiSuccess(res.json)) {
        reporter.add('fail', '接口', endpoint, `业务响应异常: ${res.text.slice(0, 200)}`, '检查后端日志与 SQL 错误。');
        continue;
      }
      const data = extractData(res.json);
      if (endpoint === '/api/settings/public') {
        publicSettingsData = data || null;
      }
      reporter.add('pass', '接口', endpoint, `HTTP ${res.status}`);
    } catch (error) {
      reporter.add('fail', '接口', endpoint, `请求失败: ${String(error.message || error)}`, '确认后端 8002 服务可访问。');
    }
  }

  // 1.1) 用户中心鉴权链路检查（登录 -> 受保护接口）
  if (!smokeUser || !smokePass) {
    reporter.add(
      'warn',
      '接口',
      '用户中心登录态链路',
      '未提供 --smoke-user/--smoke-pass，跳过受保护接口检查',
      '建议在发布前传入测试账号，验证 profile/订单/消息/收藏/评论等接口。'
    );
  } else {
    let authHeaders = null;
    try {
      const loginRes = await postJson(`${baseUrl}/api/user/login`, {
        account: smokeUser,
        password: smokePass,
      });
      if (!loginRes.ok || !loginRes.json || !isApiSuccess(loginRes.json)) {
        reporter.add(
          'fail',
          '接口',
          '/api/user/login',
          `登录失败: HTTP ${loginRes.status}, body=${String(loginRes.text || '').slice(0, 180)}`,
          '确认测试账号可用，或先执行 /api/user/seed/testUsers。'
        );
      } else {
        const loginData = extractData(loginRes.json) || {};
        const token = String(loginData.token || '').trim();
        if (!token) {
          reporter.add('fail', '接口', '/api/user/login', '登录成功但未返回 token', '检查 user.login 返回结构。');
        } else {
          authHeaders = {
            token,
            Authorization: `Bearer ${token}`,
          };
          reporter.add('pass', '接口', '/api/user/login', `测试账号登录成功（${smokeUser}）`);
        }
      }
    } catch (error) {
      reporter.add('fail', '接口', '/api/user/login', `请求失败: ${String(error.message || error)}`, '检查后端服务与账号配置。');
    }

    if (authHeaders) {
      const protectedChecks = [
        { method: 'GET', path: '/api/user/profile' },
        { method: 'POST', path: '/api/user/index/stats', body: {} },
        { method: 'POST', path: '/api/user/message/list', body: { pageNo: 1, pageSize: 1 } },
        { method: 'POST', path: '/api/user/order/list', body: { pageNo: 1, pageSize: 1 } },
        { method: 'POST', path: '/api/user/license/list', body: { pageNo: 1, pageSize: 1 } },
        { method: 'POST', path: '/api/user/article/collect/list', body: { pageNo: 1, pageSize: 1 } },
        { method: 'POST', path: '/api/user/article/like/list', body: { pageNo: 1, pageSize: 1 } },
        { method: 'POST', path: '/api/user/website/favorite/list', body: { pageNo: 1, pageSize: 1 } },
        { method: 'POST', path: '/api/user/website/like/list', body: { pageNo: 1, pageSize: 1 } },
        { method: 'POST', path: '/api/user/article/comment/list', body: { pageNo: 1, pageSize: 1 } },
        { method: 'POST', path: '/api/user/website/comment/list', body: { pageNo: 1, pageSize: 1 } },
      ];
      for (const check of protectedChecks) {
        try {
          const res = await requestJson(`${baseUrl}${check.path}`, {
            method: check.method,
            headers: {
              ...authHeaders,
              'content-type': 'application/json',
            },
            body: check.method === 'POST' ? check.body : undefined,
          });
          if (!res.ok) {
            reporter.add('fail', '接口', check.path, `HTTP ${res.status}`, '检查 token 鉴权、路由与权限拦截。');
            continue;
          }
          if (res.json && !isApiSuccess(res.json)) {
            reporter.add('fail', '接口', check.path, `业务响应异常: ${String(res.text || '').slice(0, 180)}`, '检查 controller/service 返回结构。');
            continue;
          }
          reporter.add('pass', '接口', check.path, `HTTP ${res.status}`);
        } catch (error) {
          reporter.add('fail', '接口', check.path, `请求失败: ${String(error.message || error)}`, '检查后端日志与数据库状态。');
        }
      }
    }
  }

  // 1.2) 功能受限接口检查（未授权返回 403 视为可识别状态）
  const featureEndpoints = [
    { path: '/api/wordpress/tags', feature: 'wordpress_channel' },
    { path: '/api/wordpress/widgets/active', feature: 'wordpress_channel' },
  ];
  for (const item of featureEndpoints) {
    const url = `${baseUrl}${item.path}`;
    try {
      const res = await getJson(url);
      if (res.ok && (!res.json || isApiSuccess(res.json))) {
        reporter.add('pass', '接口', item.path, `HTTP ${res.status}（feature=${item.feature}）`);
        continue;
      }
      if (res.status === 403) {
        reporter.add('warn', '接口', item.path, `HTTP 403（feature=${item.feature}）`, '当前许可证未开启该能力时属于预期行为。');
        continue;
      }
      reporter.add('fail', '接口', item.path, `HTTP ${res.status}（feature=${item.feature}）`, '检查功能守卫、许可证与接口实现。');
    } catch (error) {
      reporter.add('fail', '接口', item.path, `请求失败: ${String(error.message || error)}`, '确认后端服务和路由可访问。');
    }
  }

  // 1.3) 网站交互接口检查（评分/收藏持久化链路）
  if (mysql) {
    try {
      const firstWebsiteId = Number(
        queryMysql('SELECT id FROM uied_website WHERE is_delete = 0 ORDER BY id ASC LIMIT 1', mysql) || 0
      );
      if (firstWebsiteId > 0) {
        const rateRes = await postJson(`${baseUrl}/api/websites/${firstWebsiteId}/rate`, { rating: 5 });
        if (rateRes.ok && rateRes.json && isApiSuccess(rateRes.json)) {
          reporter.add('pass', '接口', '/api/websites/:id/rate', `网站ID=${firstWebsiteId} 评分成功`);
        } else {
          reporter.add(
            'fail',
            '接口',
            '/api/websites/:id/rate',
            `响应异常: HTTP ${rateRes.status}, body=${String(rateRes.text || '').slice(0, 160)}`,
            '检查评分持久化表与控制器逻辑。'
          );
        }

        const favoriteRes = await postJson(`${baseUrl}/api/websites/${firstWebsiteId}/favorite`, {});
        if (favoriteRes.ok && favoriteRes.json && isApiSuccess(favoriteRes.json)) {
          reporter.add('pass', '接口', '/api/websites/:id/favorite', `网站ID=${firstWebsiteId} 收藏成功`);
        } else {
          reporter.add(
            'fail',
            '接口',
            '/api/websites/:id/favorite',
            `响应异常: HTTP ${favoriteRes.status}, body=${String(favoriteRes.text || '').slice(0, 160)}`,
            '检查收藏持久化表与控制器逻辑。'
          );
        }
      } else {
        reporter.add('warn', '接口', '网站交互接口', 'uied_website 无可用记录，跳过评分/收藏联调', '先导入至少一条站点数据再执行该检查。');
      }
    } catch (error) {
      reporter.add('fail', '接口', '网站交互接口', String(error.message || error), '检查数据库连接、路由和交互表结构。');
    }
  }

  // 1.5) 路由重复检查
  try {
    const routeScan = scanRouteDuplicates();
    if (routeScan.duplicates.length > 0) {
      const detail = routeScan.duplicates
        .slice(0, 5)
        .map(item => `${item.key} -> ${item.sources.join(', ')}`)
        .join(' | ');
      reporter.add(
        'fail',
        '路由',
        'method+path 重复定义',
        `发现 ${routeScan.duplicates.length} 组重复，示例：${detail}`,
        '合并重复路由，避免权限或中间件行为不一致。'
      );
    } else {
      reporter.add('pass', '路由', 'method+path 重复定义', `未发现重复定义（扫描 ${routeScan.total} 条路由）`);
    }

    if (routeScan.compatibilityAliasCount > 0) {
      reporter.add(
        'pass',
        '路由',
        '兼容别名路由',
        `检测到 ${routeScan.compatibilityAliasCount} 条非 /api 前缀兼容路由（用于历史前端平滑迁移）`
      );
    } else {
      reporter.add('warn', '路由', '兼容别名路由', '未检测到兼容别名路由', '若仍需兼容旧前端，请确认别名路由是否被误删。');
    }

    const requiredRoutes = [
      'all /api/uied/aiConfig/detail',
      'all /api/uied/wordpress/tags',
      'all /api/uied/wordpress/widgets',
    ];
    const routeKeySet = new Set(routeScan.allRoutes.map(item => `${item.method} ${item.path}`));
    const missingRequiredRoutes = requiredRoutes.filter(item => !routeKeySet.has(item));
    if (missingRequiredRoutes.length > 0) {
      reporter.add(
        'fail',
        '路由',
        '关键商业版路由',
        `缺失: ${missingRequiredRoutes.join(', ')}`,
        '补齐对应 router 注册，避免前后台 API 漂移。'
      );
    } else {
      reporter.add('pass', '路由', '关键商业版路由', '关键路由存在且可被扫描');
    }
  } catch (error) {
    reporter.add('fail', '路由', '重复定义检查', String(error.message || error), '检查 router 文件是否可访问。');
  }

  // 2) 菜单检查
  if (mysql) {
    try {
      const criticalPerms = [
        'user:list',
        'user:detail',
        'user:seed:testUsers',
        'user:level:list',
        'uied:license:info',
        'uied:feature:list',
        'uied:delivery:init:index',
        'uied:delivery:init:preview',
        'uied:delivery:init:execute',
        'uied:delivery:package:export',
        'uied:commercial:mode:get',
        'uied:commercial:mode:save',
      ];
      const rowsText = queryMysql(
        `SELECT id,pid,menu_type,paths,component,selected,is_show,perms
         FROM la_system_auth_menu
         WHERE perms IN (${criticalPerms.map(item => `'${item}'`).join(',')})
         ORDER BY id`,
        mysql
      );
      const rows = rowsText
        .split('\n')
        .map(line => line.trim())
        .filter(Boolean)
        .map(line => {
          const [ id, pid, menuType, paths, component, selected, isShow, perms ] = line.split('\t');
          return { id: Number(id), pid: Number(pid), menuType, paths, component, selected, isShow: Number(isShow), perms };
        });
      const existingPerms = new Set(rows.map(item => item.perms));
      const missing = criticalPerms.filter(item => !existingPerms.has(item));
      if (missing.length) {
        reporter.add('fail', '菜单', '关键权限点', `缺失: ${missing.join(', ')}`, '执行菜单安装/补丁 SQL 并重新登录后台。');
      } else {
        reporter.add('pass', '菜单', '关键权限点', '关键菜单权限点完整');
      }

      const detail = rows.find(item => item.perms === 'user:detail');
      if (!detail) {
        reporter.add('fail', '菜单', 'user:detail 路由', '未找到 user:detail', '执行 patch_2026_0220_user_detail_route_fix.sql。');
      } else if (detail.pid !== 860 || detail.component !== 'consumer/lists/detail' || detail.paths !== 'detail' || detail.isShow !== 0) {
        reporter.add(
          'fail',
          '菜单',
          'user:detail 路由',
          `当前配置异常: pid=${detail.pid}, paths=${detail.paths}, component=${detail.component}, is_show=${detail.isShow}`,
          '执行 patch_2026_0220_user_detail_route_fix.sql。'
        );
      } else {
        reporter.add('pass', '菜单', 'user:detail 路由', '挂载关系与隐藏路由配置正确');
      }

      const duplicateText = queryMysql(
        `SELECT perms, COUNT(1) AS c
         FROM la_system_auth_menu
         WHERE perms <> ''
         GROUP BY perms
         HAVING c > 1`,
        mysql
      );
      const duplicateRows = duplicateText.split('\n').map(item => item.trim()).filter(Boolean);
      if (duplicateRows.length) {
        reporter.add(
          'warn',
          '菜单',
          '重复权限点',
          `发现 ${duplicateRows.length} 组重复 perms：${duplicateRows.join(' | ')}`,
          '检查 la_system_auth_menu，避免路由命中歧义。'
        );
      } else {
        reporter.add('pass', '菜单', '重复权限点', '未发现重复 perms');
      }
    } catch (error) {
      reporter.add('fail', '菜单', '菜单数据检查', String(error.message || error), '检查数据库连接参数与菜单表结构。');
    }
  }

  // 3) 资源检查
  try {
    const backendAvatar = path.join(ROOT_DIR, 'server', 'server', 'app', 'public', 'static', 'backend_avatar.png');
    if (fs.existsSync(backendAvatar)) {
      reporter.add('pass', '资源', '默认头像文件', 'backend_avatar.png 存在');
    } else {
      reporter.add('fail', '资源', '默认头像文件', 'backend_avatar.png 不存在', '补齐静态资源文件。');
    }
  } catch (error) {
    reporter.add('fail', '资源', '默认头像文件', String(error.message || error));
  }

  if (mysql) {
    try {
      const defaultAvatarCount = Number(
        queryMysql(
          `SELECT COUNT(1)
           FROM la_user
           WHERE avatar LIKE '%default_avatar.png%'`,
          mysql
        ) || 0
      );
      if (defaultAvatarCount > 0) {
        reporter.add(
          'fail',
          '资源',
          '历史默认头像路径',
          `仍有 ${defaultAvatarCount} 条用户头像指向 default_avatar.png`,
          '执行 patch_2026_0220_user_avatar_default_fix.sql。'
        );
      } else {
        reporter.add('pass', '资源', '历史默认头像路径', '未发现 default_avatar.png 残留引用');
      }
    } catch (error) {
      reporter.add('fail', '资源', '用户头像路径检查', String(error.message || error));
    }
  }

  // 4) 配置回读检查（数据库 -> API）
  if (mysql) {
    try {
      const keys = [ 'pageGlobalConfig', 'homepageConfig', 'exitModalConfig', 'articleConfig' ];
      const settingText = queryMysql(
        `SELECT \`key\`, \`value\` FROM uied_site_setting WHERE \`key\` IN (${keys.map(item => `'${item}'`).join(',')})`,
        mysql
      );
      const settingMap = {};
      settingText
        .split('\n')
        .map(line => line.trim())
        .filter(Boolean)
        .forEach(line => {
          const tabIdx = line.indexOf('\t');
          if (tabIdx < 0) return;
          const key = line.slice(0, tabIdx);
          const value = line.slice(tabIdx + 1);
          try {
            settingMap[key] = JSON.parse(value);
          } catch (error) {
            settingMap[key] = null;
          }
        });

      const missingKeys = keys.filter(item => !(item in settingMap));
      if (missingKeys.length) {
        reporter.add('warn', '配置', '关键配置项', `缺失键: ${missingKeys.join(', ')}`, '进入后台站点设置保存一次，自动回填默认配置。');
      } else {
        reporter.add('pass', '配置', '关键配置项', '关键配置项已落库');
      }

      const invalidJsonKeys = keys.filter(item => item in settingMap && settingMap[item] === null);
      if (invalidJsonKeys.length) {
        reporter.add('fail', '配置', '配置 JSON 格式', `JSON 解析失败: ${invalidJsonKeys.join(', ')}`, '修复 uied_site_setting 中非法 JSON 值。');
      } else {
        reporter.add('pass', '配置', '配置 JSON 格式', '关键配置 JSON 可解析');
      }

      if (publicSettingsData && typeof publicSettingsData === 'object') {
        const dbExit = normalizeExitModalConfig(settingMap.exitModalConfig || {});
        const apiExit = normalizeExitModalConfig(publicSettingsData.popup || publicSettingsData.exitModal || {});
        const comparableKeys = [ 'enabled', 'autoRedirect', 'countdown', 'logo', 'showAgreementLinks', 'userAgreementText', 'copyrightAgreementText' ];
        const mismatch = comparableKeys.filter(key => JSON.stringify(dbExit[key]) !== JSON.stringify(apiExit[key]));
        if (mismatch.length) {
          reporter.add('fail', '配置', '弹窗配置回读', `字段不一致: ${mismatch.join(', ')}`, '检查 setting.getPublicSettings 与前端字段映射。');
        } else {
          reporter.add('pass', '配置', '弹窗配置回读', 'DB 与 API 返回一致');
        }
      } else {
        reporter.add('warn', '配置', '弹窗配置回读', '未获取到 /api/settings/public，跳过回读比对', '先修复接口可用性再执行回读检查。');
      }
    } catch (error) {
      reporter.add('fail', '配置', '配置回读检查', String(error.message || error), '检查 uied_site_setting 表结构与数据。');
    }
  }

  // 5) 数据基础检查
  if (mysql) {
    try {
      const requiredTables = [
        'uied_website_rating',
        'uied_website_favorite',
        'uied_wordpress_tag',
        'uied_wordpress_widget',
      ];
      const tableCount = Number(
        queryMysql(
          `SELECT COUNT(1) FROM information_schema.tables
           WHERE table_schema = '${mysql.database}'
             AND table_name IN (${requiredTables.map(name => `'${name}'`).join(',')})`,
          mysql
        ) || 0
      );
      if (tableCount !== requiredTables.length) {
        reporter.add(
          'fail',
          '数据',
          '商业版新增表',
          `仅检测到 ${tableCount}/${requiredTables.length} 张表`,
          '执行 patch_2026_0221_website_interaction_tables.sql 与 patch_2026_0221_wordpress_tag_widget_tables.sql。'
        );
      } else {
        reporter.add('pass', '数据', '商业版新增表', `已检测到 ${requiredTables.length} 张新增表`);
      }

      const userCount = Number(queryMysql('SELECT COUNT(1) FROM la_user WHERE is_delete = 0', mysql) || 0);
      if (userCount <= 0) {
        reporter.add('fail', '数据', '站点用户数据', 'la_user 无可用数据', '执行 /api/user/seed/testUsers 初始化测试用户。');
      } else {
        reporter.add('pass', '数据', '站点用户数据', `当前用户数: ${userCount}`);
      }
      const articleCount = Number(
        queryMysql("SELECT COUNT(1) FROM uied_article WHERE is_delete = 0 AND status = 'published'", mysql) || 0
      );
      if (articleCount <= 0) {
        reporter.add('warn', '数据', '文章数据', '无已发布文章', '执行文章测试数据初始化接口或导入示例文章。');
      } else {
        reporter.add('pass', '数据', '文章数据', `已发布文章数: ${articleCount}`);
      }
    } catch (error) {
      reporter.add('fail', '数据', '基础数据检查', String(error.message || error), '检查 la_user/uied_article 表是否存在。');
    }
  }

  // 6) 前端页面冒烟检查（可选）
  if (!frontendBaseUrl) {
    reporter.add(
      'warn',
      '前端',
      '页面冒烟',
      '未提供 --frontend-base-url，跳过前端页面可达性检查',
      '建议发布前增加 --frontend-base-url http://127.0.0.1:3003 执行冒烟。'
    );
  } else {
    const frontendPages = [ '/', '/articles', '/p/daily-hot', '/rankings', '/changelog' ];
    for (const pagePath of frontendPages) {
      try {
        const res = await getJson(`${frontendBaseUrl}${pagePath}`, {}, 10000);
        if (!res.ok) {
          reporter.add('fail', '前端', pagePath, `HTTP ${res.status}`, '检查前端服务是否运行、路由重写是否正确。');
          continue;
        }
        reporter.add('pass', '前端', pagePath, `HTTP ${res.status}`);
      } catch (error) {
        reporter.add('fail', '前端', pagePath, `请求失败: ${String(error.message || error)}`, '确认前端服务启动，并检查反向代理配置。');
      }
    }
  }

  const rows = reporter.getRows();
  writeJsonReport(rows);
  printReport(rows);

  const failCount = rows.filter(item => item.status === 'fail').length;
  process.exitCode = failCount > 0 ? 1 : 0;
}

main().catch(error => {
  console.error('健康检查脚本执行失败:', error);
  process.exitCode = 1;
});
