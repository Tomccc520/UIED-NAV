'use strict';

const path = require('path');
const { publicPrefix, publicUrl } = require('../extend/config');

// 定义转换绝对路径的方法
function toAbsoluteUrl(u) {
  // TODO: engine默认local
  if (!u) {
    return '';
  }
  const parsedUrl = new URL(publicUrl);
  const value = String(u).trim();

  // 站点静态资源（例如默认头像 /api/static/default_avatar.png）
  if (value.indexOf('/api/static/') === 0 || value.indexOf('/public/static/') === 0) {
    parsedUrl.pathname = path.join(parsedUrl.pathname, value);
    return parsedUrl.toString();
  }

  // 已经是上传资源路径时直接拼域名
  if (value.indexOf('/api/uploads/') === 0 || value.indexOf('/public/uploads/') === 0 || value.includes('public/uploads/')) {
    parsedUrl.pathname = path.join(parsedUrl.pathname, value);
    return parsedUrl.toString();
  }

  // 已经是完整外链直接返回
  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  const engine = 'local';
  if (engine === 'local') {
    parsedUrl.pathname = path.join(parsedUrl.pathname, publicPrefix, value);
    return parsedUrl.toString();
  }

  // TODO: 其他engine
  return u;
}

function toRelativeUrl(u) {
  if (u === '') {
    return '';
  }

  const up = new URL(u);

  const engine = 'local';

  if (engine === 'local') {
    const lu = up.toString();
    return lu.replace(publicUrl, '').replace(publicPrefix, '');
  }

  // TODO: 其他engine
  return u;
}

module.exports = {
  toAbsoluteUrl,
  toRelativeUrl,
};
