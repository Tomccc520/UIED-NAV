'use strict';
// 生成一个1024长度的密钥对
// const nodeRSA = require("node-rsa");
// const key = new nodeRSA({b: 1024})
// const publicKey = key.exportKey('pkcs8-public') // 公钥
// const privateKey = key.exportKey('pkcs8-private') // 私钥
const path = require('path');
const runPath = path.dirname(path.dirname(__filename));

const rsa = {
  publicKey: '-----BEGIN PUBLIC KEY-----MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCGZ9nIiSJT+N66Y44G4R1exi9Zg7C141cCzHL9avlYdpxGHtXUWvUX2wcOXe2AtCTH54cBVbWdudlFpN0M2PBUDfFE+rx5KzRWqDm3vAolAb8Tr7+LHVLdcPGc3j8h/XUnsM6rVCxDGM/PcdMp1sM5Nec5BJ3oGwCgt92HgT8BtwIDAQAB-----END PUBLIC KEY-----',
  privateKey: '-----BEGIN PRIVATE KEY-----MIICdwIBADANBgkqhkiG9w0BAQEFAASCAmEwggJdAgEAAoGBAIZn2ciJIlP43rpjjgbhHV7GL1mDsLXjVwLMcv1q+Vh2nEYe1dRa9RfbBw5d7YC0JMfnhwFVtZ252UWk3QzY8FQN8UT6vHkrNFaoObe8CiUBvxOvv4sdUt1w8ZzePyH9dSewzqtULEMYz89x0ynWwzk15zkEnegbAKC33YeBPwG3AgMBAAECgYByudCvGUdhECzmQrZn7t4IGPkv2nYLPAv4ipWY9SfzuAL647U4N4/AFii2vbxOQPaoYFvf6s5E3O+2P9yj68Vvas25Z/gw5t+BcpliMCTM7Va2r3KZkozng+KakKqEXvRT8O0X8Tb/0fwoRCM62gOrFWQRq7BneOyEPiuFBUATUQJBANL/WO9SWISrtFXtre6Y8ZlDHILCcSaL67301WJo2l0hTwctcSMBjf3ROvk0X+dX1cU39dUCCyynMgcia8S4/+8CQQCjEoW1Elw4ImiIOEGSI3ySlTLopnWNZvdVYAbhwkbeeXDSXzqvVGkgRDKCt8CW47mdgh89mkiRSWoszs7oJNK5AkA1wm2sfHSlSQJnqmlYk4trG1hWUKh3w8rK2WjM7B5HAEecco2S98Bv3TGDcT7GOPD0kO+H2D90nxz2CGUg+GntAkEAiOak33Wxe+LPFQT9b11hWIHvAke0ymgV3lPGk0MRUfZr1ADkeIsJ0m/OY9U11rcJfgTei035/BbBDyrzowo+6QJBAJyl3vn3DlFgONWMsndXzB/GJSLTJhWuIuWcEV4I3b38HcTJkidkoKGNAOY+IZo2b9ww/X9FBhB+jstfQnQEU2M=-----END PRIVATE KEY-----',
  // 角色缓存键
  backstageRolesKey: 'backstage:roles',
  // 令牌缓存键
  backstageTokenKey: 'backstage:token:',
  // 令牌的集合
  backstageTokenSet: 'backstage:token:set:',
  // 用户令牌缓存键
  userTokenKey: 'user:token:',
  // 用户令牌集合
  userTokenSet: 'user:token:set:',
  // 用户信息缓存键
  userInfoKey: 'user:info:',
  // Redis键前缀
  redisPrefix: 'Like:',
  // 管理缓存键
  backstageManageKey: 'backstage:manage',
  // 用户sessionKey
  superAdminId: 1,
  reqAdminIdKey: 'admin_id',
  reqRoleIdKey: 'role',
  reqUsernameKey: 'username',
  reqNicknameKey: 'nickname',

  dbTablePrefix: 'la_',

  genConfig: {
    // 基础包名
    packageName: 'gencode',
    // 是否去除表前缀
    isRemoveTablePrefix: true,
    // 生成代码根路径
    genRootPath: '/tmp/target',
  },

  nodeConstants: {
    typeString: 'string', // 字符串类型
    typeFloat: 'float64', // 浮点型
    typeInt: 'int', // 整型
    typeDate: 'core.TsTime', // 时间类型
  },

  genConstants: {
    UTF8: 'utf-8', // 编码
    tplCrud: 'crud', // 单表 (增删改查)
    tplTree: 'tree', // 树表 (增删改查)
    queryLike: 'LIKE', // 模糊查询
    queryEq: '=', // 相等查询
    qequire: 1, // 需要的
  },

  sqlConstants: {
    // 数据库字符串类型
    columnTypeStr: [ 'char', 'varchar', 'nvarchar', 'varchar2' ],
    // 数据库文本类型
    columnTypeText: [ 'tinytext', 'text', 'mediumtext', 'longtext' ],
    // 数据库时间类型
    columnTypeTime: [ 'datetime', 'time', 'date', 'timestamp' ],
    // 数据库数字类型
    columnTypeNumber: [
      'tinyint',
      'smallint',
      'mediumint',
      'int',
      'integer',
      'bit',
      'bigint',
      'float',
      'double',
      'decimal',
    ],
    // 时间日期字段名
    columnTimeName: [
      'create_time',
      'update_time',
      'delete_time',
      'start_time',
      'end_time',
    ],
    // 页面不需要插入字段
    columnNameNotAdd: [
      'id',
      'is_delete',
      'create_time',
      'update_time',
      'delete_time',
    ],
    // 页面不需要编辑字段
    columnNameNotEdit: [ 'is_delete', 'create_time', 'update_time', 'delete_time' ],
    // 页面不需要列表字段
    columnNameNotList: [
      'id',
      'intro',
      'content',
      'is_delete',
      'delete_time',
    ],
    // 页面不需要查询字段
    columnNameNotQuery: [
      'is_delete',
      'create_time',
      'update_time',
      'delete_time',
    ],
  },

  // HtmlConstants HTML相关常量
  htmlConstants: {
    htmlInput: 'input', // 文本框
    htmlTextarea: 'textarea', // 文本域
    htmlSelect: 'select', // 下拉框
    htmlRadio: 'radio', // 单选框
    htmlDatetime: 'datetime', // 日期控件
    htmlImageUpload: 'imageUpload', // 图片上传控件
    htmlFileUpload: 'fileUpload', // 文件上传控件
    htmlEditor: 'editor', // 富文本控件
  },

  // 免登录验证
  notLoginUri: [
    'system:login', // 登录接口
    'common:index:config', // 配置接口
    // 前端兼容接口 - 免登录（支持通配符 * 匹配）
    'pages', // GET /api/pages
    'pages:*', // GET /api/pages/:slug, /api/pages/:slug/full, etc.
    'websites', // GET /api/websites
    'websites:*', // POST /api/websites/:id/click
    'settings:public', // GET /api/settings/public
    'settings:detailPageConfig', // GET /api/settings/detailPageConfig
    'settings:frontend-config', // GET /api/settings/frontend-config
    'settings:permalink', // GET /api/settings/permalink
    'settings:favicon-apis', // GET /api/settings/favicon-apis
    'settings:website:*', // GET /api/settings/website/:id/tags
    'hot-recommendations', // GET /api/hot-recommendations
    'hot-recommendations:active', // GET /api/hot-recommendations/active
    'hot-recommendations:*', // POST /api/hot-recommendations/:id/click
    'settings:nav-menus', // GET /api/settings/nav-menus
    'settings:footer-groups', // GET /api/settings/footer-groups
    'settings:friend-links', // GET /api/settings/friend-links
    'public:detail-sidebar-config', // GET /api/public/detail-sidebar-config
    'favicon-api:fetch', // GET /api/favicon-api/fetch
    'submissions', // POST /api/submissions
    'submissions:check-url', // GET /api/submissions/check-url
    'ai-config:generate-website-info', // POST /api/ai-config/generate-website-info
    'ai-config:chat', // POST /api/ai-config/chat
    'ai-config:smart-search', // POST /api/ai-config/smart-search
    'ai-search', // POST /api/ai-search
    'wordpress:categories:active', // GET /api/wordpress/categories/active
    'wordpress:tags', // GET /api/wordpress/tags
    'wordpress:widgets:active', // GET /api/wordpress/widgets/active
    'settings:hot-recommendation-click', // GET /api/settings/hot-recommendation-click
    'nav-menus', // GET /api/nav-menus
    'friend-links', // GET /api/friend-links
    'footer', // GET /api/footer
    'social-media', // GET /api/social-media
    'banners', // GET /api/banners
    'site-info', // GET /api/site-info
    'categories', // GET /api/categories
    'categories:*', // GET /api/categories/:idOrSlug
    'tags', // GET /api/tags
    'tags:*', // GET /api/tags/:idOrSlug
    // 前端文章接口（公开阅读 + 投稿中心）
    'articles',
    'articles:categories',
    'articles:*',
    'user:author:center:detail', // 作者中心详情（前台登录）
    'user:author:center:save', // 作者中心保存（前台登录）
    'user:author:public:detail', // 作者公开主页
    'user:article:collect:list', // 用户收藏文章列表
    'user:article:like:list', // 用户点赞文章列表
    'article:cate:all', // 文章分类全部
    'article:tag:all', // 文章标签全部
    'article:topic:all', // 文章专题全部
    'article:front:add', // 官网前台投稿文章
    'article:front:list', // 官网前台投稿列表
    'article:front:detail', // 官网前台投稿详情
    'article:front:edit', // 官网前台投稿编辑
    'article:front:audit:message:list', // 投稿审核消息列表
    'article:visit:incr', // 文章阅读+1
    'article:collect:list', // 文章收藏列表
    'article:collect:toggle', // 文章收藏切换
    'article:like:toggle', // 文章点赞切换
    'article:stats', // 文章互动统计
    'article:comment:list', // 文章留言列表
    'article:comment:add', // 发布文章留言
    'article:comment:like:toggle', // 评论点赞切换
  ],

  // 前台用户 token 可直通（不走后台 admin token）接口
  userTokenPassUri: [
    'common:album:albumList', // 素材列表（前台富文本选择素材）
    'common:album:cateList', // 素材分类（前台富文本选择素材）
    'ai:chat:completions:editor', // AI 编辑器生成
  ],

  // 免权限验证
  notAuthUri: [
    'system:logout', // 退出登录
    'system:menu:menus', // 系统菜单
    'system:menu:route', // 菜单路由
    'system:admin:upInfo', // 管理员更新
    'system:admin:self', // 管理员信息
    'system:role:all', // 所有角色
    'system:post:all', // 所有岗位
    'system:dept:list', // 所有部门
    'setting:dict:type:all', // 所有字典类型
    'setting:dict:data:all', // 所有字典数据
    'article:cate:all', // 所有文章分类
    'article:tag:all', // 所有文章标签
    'article:topic:all', // 所有文章专题
  ],

  publicUrl: 'http://127.0.0.1:8002',
  // 资源访问前缀
  publicPrefix: '/api/uploads',
  // 版本
  version: 'v1.0.0',

  rootPath: runPath,
};

module.exports = rsa;
