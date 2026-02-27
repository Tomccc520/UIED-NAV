/**
 * @copyright Tomda (https://www.tomda.top)
 * @copyright UIED技术团队 (https://fsuied.com)
 * @author UIED技术团队
 * @createDate 2026-02-27
 */

'use strict';

/**
 * 构建 PM2 应用配置（用于宝塔/服务器生产环境）
 */
function buildApps() {
  return [
    {
      name: 'uied-api',
      cwd: '/www/wwwroot/hao.uied.cn/backend',
      script: 'npm',
      args: 'start',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '800M',
      env: {
        NODE_ENV: 'production',
        EGG_SERVER_ENV: 'prod',
      },
    },
  ];
}

module.exports = {
  apps: buildApps(),
};

