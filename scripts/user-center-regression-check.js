#!/usr/bin/env node
/**
 * @copyright Tomda (https://www.tomda.top)
 * @copyright UIED技术团队 (https://fsuied.com)
 * @author UIED技术团队
 * @createDate 2026-02-28
 *
 * @file user-center-regression-check.js
 * @description 用户中心全链路回归脚本（登录/资料/收藏/点赞/评论/2FA/设备）
 */

'use strict';

const fs = require('fs');
const path = require('path');

/**
 * 解析命令行参数
 */
function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i++) {
    const current = String(argv[i] || '');
    if (!current.startsWith('--')) continue;
    const [rawKey, inlineValue] = current.split('=');
    const key = rawKey.replace(/^--/, '');
    if (inlineValue !== undefined) {
      args[key] = inlineValue;
      continue;
    }
    const next = argv[i + 1];
    if (next && !String(next).startsWith('--')) {
      args[key] = next;
      i += 1;
      continue;
    }
    args[key] = true;
  }
  return args;
}

/**
 * 统一打印使用说明
 */
function printHelp() {
  const lines = [
    '用法:',
    '  node scripts/user-center-regression-check.js --base-url http://127.0.0.1:8002 --username tomda --password 123456',
    '',
    '可选参数:',
    '  --two-factor-code 123456        登录触发 2FA 时使用',
    '  --avatar-file /path/to/a.png    额外验证头像上传',
    '  --kick-token tokenValue         额外验证设备下线接口',
    '  --timeout 15000                 单接口超时时间（毫秒）',
    '  --report-file /path/to/report   自定义报告输出路径',
    '  --help                          查看帮助',
  ];
  console.log(lines.join('\n'));
}

/**
 * 确保目录存在
 */
function ensureDir(filePath) {
  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });
}

/**
 * 判断接口包装体是否为成功
 */
function isWrappedSuccess(payload) {
  if (!payload || typeof payload !== 'object') return true;
  if (!Object.prototype.hasOwnProperty.call(payload, 'code')) return true;
  const code = Number(payload.code);
  return code === 0 || code === 1 || code === 200;
}

/**
 * 解包接口响应
 */
function unwrapPayload(payload, fallback = {}) {
  if (!payload || typeof payload !== 'object') return fallback;
  if (Object.prototype.hasOwnProperty.call(payload, 'data')) {
    return payload.data === undefined || payload.data === null ? fallback : payload.data;
  }
  return payload;
}

/**
 * 读取 JSON 响应
 */
async function parseResponseBody(response) {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch (_error) {
    return { rawText: text };
  }
}

/**
 * 构建带超时的 fetch
 */
async function fetchWithTimeout(url, options = {}, timeoutMs = 10000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const mergedOptions = { ...options, signal: controller.signal };
    return await fetch(url, mergedOptions);
  } finally {
    clearTimeout(timer);
  }
}

/**
 * 统一执行接口请求
 */
async function requestJson(baseUrl, apiPath, options = {}, timeoutMs = 10000) {
  const requestUrl = `${baseUrl}${apiPath}`;
  const response = await fetchWithTimeout(requestUrl, options, timeoutMs);
  const payload = await parseResponseBody(response);
  return {
    ok: response.ok && isWrappedSuccess(payload),
    status: response.status,
    payload,
  };
}

/**
 * 创建检查记录
 */
function createRecorder() {
  const items = [];
  return {
    pass(title, detail) {
      items.push({ status: 'PASS', title, detail });
    },
    warn(title, detail) {
      items.push({ status: 'WARN', title, detail });
    },
    fail(title, detail) {
      items.push({ status: 'FAIL', title, detail });
    },
    items,
  };
}

/**
 * 统计结果
 */
function summarize(items) {
  return items.reduce((acc, item) => {
    acc[item.status] = (acc[item.status] || 0) + 1;
    return acc;
  }, { PASS: 0, WARN: 0, FAIL: 0 });
}

/**
 * 输出控制台报告
 */
function printReport(items, reportFile) {
  console.log('\n=== 用户中心全链路回归报告 ===');
  items.forEach((item, index) => {
    const no = String(index + 1).padStart(2, '0');
    console.log(`[${no}] [${item.status}] ${item.title}`);
    if (item.detail) {
      console.log(`     ${item.detail}`);
    }
  });
  const summary = summarize(items);
  console.log(`\n汇总: PASS=${summary.PASS} WARN=${summary.WARN} FAIL=${summary.FAIL}`);
  console.log(`JSON 报告: ${reportFile}\n`);
  return summary;
}

/**
 * 写出 JSON 报告
 */
function writeReport(reportFile, items, context) {
  ensureDir(reportFile);
  const output = {
    generatedAt: new Date().toISOString(),
    context,
    summary: summarize(items),
    items,
  };
  fs.writeFileSync(reportFile, JSON.stringify(output, null, 2), 'utf8');
}

/**
 * 执行用户中心冒烟检查
 */
async function main() {
  const args = parseArgs(process.argv);
  if (args.help) {
    printHelp();
    process.exit(0);
  }

  const baseUrl = String(args['base-url'] || 'http://127.0.0.1:8002').replace(/\/+$/, '');
  const username = String(args.username || '').trim();
  const password = String(args.password || '').trim();
  const twoFactorCode = String(args['two-factor-code'] || '').trim();
  const avatarFile = String(args['avatar-file'] || '').trim();
  const kickToken = String(args['kick-token'] || '').trim();
  const timeoutMs = Number(args.timeout || 10000) || 10000;
  const defaultReport = path.join(process.cwd(), 'docs', 'API', 'reports', 'user_center_regression_latest.json');
  const reportFile = String(args['report-file'] || defaultReport);
  const recorder = createRecorder();

  if (!username || !password) {
    printHelp();
    recorder.fail('环境参数', '必须提供 --username 与 --password');
    writeReport(reportFile, recorder.items, { baseUrl });
    printReport(recorder.items, reportFile);
    process.exit(1);
  }

  let token = '';

  try {
    const loginRes = await requestJson(
      baseUrl,
      '/api/user/login',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          account: username,
          username,
          password,
        }),
      },
      timeoutMs
    );

    if (!loginRes.ok) {
      recorder.fail('登录', `HTTP ${loginRes.status} ${JSON.stringify(loginRes.payload)}`);
      writeReport(reportFile, recorder.items, { baseUrl, username });
      printReport(recorder.items, reportFile);
      process.exit(1);
    }

    let loginPayload = unwrapPayload(loginRes.payload, {});
    if (loginPayload && loginPayload.need2fa) {
      if (!twoFactorCode) {
        recorder.fail('登录 2FA', '当前账号已启用 2FA，请追加 --two-factor-code 后重试');
        writeReport(reportFile, recorder.items, { baseUrl, username });
        printReport(recorder.items, reportFile);
        process.exit(1);
      }
      const verifyRes = await requestJson(
        baseUrl,
        '/api/user/login/2fa/verify',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            challengeToken: String(loginPayload.challengeToken || ''),
            code: twoFactorCode,
          }),
        },
        timeoutMs
      );
      if (!verifyRes.ok) {
        recorder.fail('登录 2FA', `HTTP ${verifyRes.status} ${JSON.stringify(verifyRes.payload)}`);
        writeReport(reportFile, recorder.items, { baseUrl, username });
        printReport(recorder.items, reportFile);
        process.exit(1);
      }
      loginPayload = unwrapPayload(verifyRes.payload, {});
      recorder.pass('登录 2FA', '二次验证通过');
    } else {
      recorder.pass('登录', '账号密码登录通过');
    }

    token = String(loginPayload.token || '').trim();
    if (!token) {
      recorder.fail('登录令牌', '接口返回成功，但未拿到 token');
      writeReport(reportFile, recorder.items, { baseUrl, username });
      printReport(recorder.items, reportFile);
      process.exit(1);
    }
  } catch (error) {
    recorder.fail('登录', `请求异常: ${error.message}`);
    writeReport(reportFile, recorder.items, { baseUrl, username });
    printReport(recorder.items, reportFile);
    process.exit(1);
  }

  /**
   * 构建登录态请求头
   */
  const authHeaders = {
    token,
    Authorization: `Bearer ${token}`,
  };

  /**
   * 读取型接口清单
   */
  const readChecks = [
    { title: '个人资料', path: '/api/user/profile', method: 'GET' },
    { title: '概览统计', path: '/api/user/index/stats', method: 'POST', body: {} },
    { title: '订单列表', path: '/api/user/order/list', method: 'POST', body: { pageNo: 1, pageSize: 5 } },
    { title: '授权列表', path: '/api/user/license/list', method: 'POST', body: { pageNo: 1, pageSize: 5 } },
    { title: '消息列表', path: '/api/user/message/list', method: 'POST', body: { pageNo: 1, pageSize: 5 } },
    { title: '登录日志', path: '/api/user/login/log', method: 'POST', body: { pageNo: 1, pageSize: 5 } },
    { title: '2FA 状态', path: '/api/user/security/2fa/status', method: 'POST', body: {} },
    { title: '登录设备列表', path: '/api/user/session/list', method: 'POST', body: {} },
    { title: '文章收藏列表', path: '/api/user/article/collect/list', method: 'POST', body: { pageNo: 1, pageSize: 5 } },
    { title: '文章点赞列表', path: '/api/user/article/like/list', method: 'POST', body: { pageNo: 1, pageSize: 5 } },
    { title: '网址收藏列表', path: '/api/user/website/favorite/list', method: 'POST', body: { pageNo: 1, pageSize: 5 } },
    { title: '网址点赞列表', path: '/api/user/website/like/list', method: 'POST', body: { pageNo: 1, pageSize: 5 } },
    { title: '文章评论列表', path: '/api/user/article/comment/list', method: 'POST', body: { pageNo: 1, pageSize: 5 } },
    { title: '网址评论列表', path: '/api/user/website/comment/list', method: 'POST', body: { pageNo: 1, pageSize: 5 } },
  ];

  for (const check of readChecks) {
    try {
      const headers = { ...authHeaders };
      let body;
      if (check.method !== 'GET') {
        headers['Content-Type'] = 'application/json';
        body = JSON.stringify(check.body || {});
      }
      const result = await requestJson(
        baseUrl,
        check.path,
        {
          method: check.method,
          headers,
          body,
        },
        timeoutMs
      );
      if (!result.ok) {
        recorder.fail(check.title, `HTTP ${result.status} ${JSON.stringify(result.payload)}`);
        continue;
      }
      const data = unwrapPayload(result.payload, {});
      if (
        check.path.includes('/list') &&
        (
          typeof data !== 'object' ||
          !data ||
          !Array.isArray(data.lists || [])
        )
      ) {
        recorder.warn(check.title, '接口可用，但返回结构不含 lists 数组');
        continue;
      }
      recorder.pass(check.title, '接口可用');
    } catch (error) {
      recorder.fail(check.title, `请求异常: ${error.message}`);
    }
  }

  if (avatarFile) {
    try {
      const fileBuffer = fs.readFileSync(avatarFile);
      const formData = new FormData();
      const fileName = path.basename(avatarFile);
      const fileBlob = new Blob([fileBuffer]);
      formData.append('file', fileBlob, fileName);
      const avatarRes = await requestJson(
        baseUrl,
        '/api/user/avatar/upload',
        {
          method: 'POST',
          headers: { ...authHeaders },
          body: formData,
        },
        timeoutMs
      );
      if (!avatarRes.ok) {
        recorder.fail('头像上传', `HTTP ${avatarRes.status} ${JSON.stringify(avatarRes.payload)}`);
      } else {
        const avatarData = unwrapPayload(avatarRes.payload, {});
        const avatarUrl = String(avatarData.avatar || avatarData.url || '').trim();
        if (!avatarUrl) {
          recorder.warn('头像上传', '接口成功，但返回体未携带 avatar/url');
        } else {
          recorder.pass('头像上传', `上传成功: ${avatarUrl}`);
        }
      }
    } catch (error) {
      recorder.fail('头像上传', `请求异常: ${error.message}`);
    }
  } else {
    recorder.warn('头像上传', '未提供 --avatar-file，已跳过头像上传检查');
  }

  if (kickToken) {
    try {
      const kickRes = await requestJson(
        baseUrl,
        '/api/user/session/kick',
        {
          method: 'POST',
          headers: {
            ...authHeaders,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token: kickToken }),
        },
        timeoutMs
      );
      if (!kickRes.ok) {
        recorder.fail('设备下线', `HTTP ${kickRes.status} ${JSON.stringify(kickRes.payload)}`);
      } else {
        recorder.pass('设备下线', '指定设备已下线');
      }
    } catch (error) {
      recorder.fail('设备下线', `请求异常: ${error.message}`);
    }
  } else {
    recorder.warn('设备下线', '未提供 --kick-token，已跳过设备下线写操作检查');
  }

  try {
    const logoutRes = await requestJson(
      baseUrl,
      '/api/user/logout',
      {
        method: 'POST',
        headers: authHeaders,
      },
      timeoutMs
    );
    if (!logoutRes.ok) {
      recorder.warn('退出登录', `HTTP ${logoutRes.status} ${JSON.stringify(logoutRes.payload)}`);
    } else {
      recorder.pass('退出登录', '退出接口可用');
    }
  } catch (error) {
    recorder.warn('退出登录', `请求异常: ${error.message}`);
  }

  writeReport(reportFile, recorder.items, {
    baseUrl,
    username,
    avatarFile: avatarFile || '',
    kickTokenProvided: Boolean(kickToken),
    timeoutMs,
  });
  const summary = printReport(recorder.items, reportFile);
  process.exit(summary.FAIL > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error('[user-center-regression-check] 未捕获异常:', error);
  process.exit(1);
});
