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
    // UIED 业务接口 - 免登录验证
    'uied:website:list',
    'uied:website:detail',
    'uied:website:add',
    'uied:website:edit',
    'uied:website:del',
    'uied:website:batchDel',
    'uied:website:click',
    'uied:website:search',
    'uied:category:list',
    'uied:category:all',
    'uied:category:detail',
    'uied:category:add',
    'uied:category:edit',
    'uied:category:del',
    'uied:category:sort',
    'uied:page:list',
    'uied:page:all',
    'uied:page:detail',
    'uied:page:add',
    'uied:page:edit',
    'uied:page:del',
    'uied:page:categories',
    'uied:page:updateCategories',
    'uied:hotRecommendation:list',
    'uied:hotRecommendation:detail',
    'uied:hotRecommendation:add',
    'uied:hotRecommendation:edit',
    'uied:hotRecommendation:del',
    'uied:setting:get',
    'uied:setting:save',
    'uied:setting:siteInfo',
    'uied:setting:saveSiteInfo',
    'uied:setting:public',
    'uied:navMenu:list',
    'uied:navMenu:all',
    'uied:navMenu:detail',
    'uied:navMenu:add',
    'uied:navMenu:edit',
    'uied:navMenu:del',
    'uied:navMenu:sort',
    'uied:friendLink:list',
    'uied:friendLink:detail',
    'uied:friendLink:add',
    'uied:friendLink:edit',
    'uied:friendLink:del',
    'uied:footer:groupList',
    'uied:footer:groupAll',
    'uied:footer:groupAdd',
    'uied:footer:groupEdit',
    'uied:footer:groupDel',
    'uied:footer:linkList',
    'uied:footer:linkAdd',
    'uied:footer:linkEdit',
    'uied:footer:linkDel',
    'uied:socialMedia:groupList',
    'uied:socialMedia:groupAll',
    'uied:socialMedia:groupAdd',
    'uied:socialMedia:groupEdit',
    'uied:socialMedia:groupDel',
    'uied:socialMedia:itemList',
    'uied:socialMedia:itemAdd',
    'uied:socialMedia:itemEdit',
    'uied:socialMedia:itemDel',
    'uied:banner:list',
    'uied:banner:detail',
    'uied:banner:add',
    'uied:banner:edit',
    'uied:banner:del',
    'uied:faviconApi:list',
    'uied:faviconApi:detail',
    'uied:faviconApi:add',
    'uied:faviconApi:edit',
    'uied:faviconApi:del',
    'uied:faviconApi:setDefault',
    'uied:websiteTag:list',
    'uied:websiteTag:all',
    'uied:websiteTag:detail',
    'uied:websiteTag:add',
    'uied:websiteTag:edit',
    'uied:websiteTag:del',
    'uied:websiteTag:websiteTags',
    'uied:websiteTag:setWebsiteTags',
    'uied:seoScraper:fetch',
    'uied:submission:checkUrl',
    'uied:submission:submit',
    'uied:submission:status',
    'uied:submission:list',
    'uied:submission:pendingCount',
    'uied:submission:approve',
    'uied:submission:reject',
    'uied:submission:edit',
    'uied:submission:del',
    // 数据导出
    'uied:export:websites',
    'uied:export:categories',
    'uied:export:all',
    'uied:export:websitesCSV',
    'uied:export:websitesJSON',
    'uied:export:categoriesCSV',
    'uied:export:categoriesJSON',
    'uied:export:backup',
    'uied:export:list',
    'uied:export:download:*',
    'uied:export:del',
    'uied:operationLog:list',
    'uied:operationLog:stats',
    'uied:operationLog:cleanup',
    'uied:operationLog:del',
    'uied:monitor:statistics',
    'uied:monitor:failedWebsites',
    'uied:monitor:config',
    'uied:monitor:updateConfig',
    'uied:monitor:checkWebsite',
    'uied:monitor:checkAll',
    'uied:monitor:resetStatus',
    'uied:aiConfig:list',
    'uied:aiConfig:default',
    'uied:aiConfig:get',
    'uied:aiConfig:save',
    'uied:aiConfig:test',
    'uied:aiConfig:add',
    'uied:aiConfig:edit',
    'uied:aiConfig:del',
    'uied:aiConfig:generateWebsiteInfo',
    'uied:aiConfig:chat',
    'uied:wordpress:configs',
    'uied:wordpress:configs:default',
    'uied:wordpress:configs:add',
    'uied:wordpress:configs:edit',
    'uied:wordpress:configs:del',
    'uied:wordpress:categories',
    'uied:wordpress:categories:add',
    'uied:wordpress:categories:edit',
    'uied:wordpress:categories:del',
    'uied:wordpress:posts',
    // 文章管理
    'uied:article:list',
    'uied:article:detail',
    'uied:article:add',
    'uied:article:edit',
    'uied:article:del',
    'uied:article:categories',
    // 评论管理
    'uied:comment:list',
    'uied:comment:detail',
    'uied:comment:approve',
    'uied:comment:reject',
    'uied:comment:del',
    'uied:comment:pendingCount',
    'uied:comment:stats',
    // 数据统计
    'uied:statistics:clicks',
    'uied:statistics:search',
    'uied:statistics:overview',
    'uied:statistics:recent',
    // 前端文章接口
    'articles',
    'articles:categories',
    'articles:*',
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
    // UIED 业务接口 - 免权限验证
    'uied:website:list',
    'uied:website:detail',
    'uied:website:add',
    'uied:website:edit',
    'uied:website:del',
    'uied:website:batchDel',
    'uied:website:click',
    'uied:website:search',
    'uied:category:list',
    'uied:category:all',
    'uied:category:detail',
    'uied:category:add',
    'uied:category:edit',
    'uied:category:del',
    'uied:category:sort',
    'uied:page:list',
    'uied:page:all',
    'uied:page:detail',
    'uied:page:add',
    'uied:page:edit',
    'uied:page:del',
    'uied:page:categories',
    'uied:page:updateCategories',
    'uied:hotRecommendation:list',
    'uied:hotRecommendation:detail',
    'uied:hotRecommendation:add',
    'uied:hotRecommendation:edit',
    'uied:hotRecommendation:del',
    'uied:setting:get',
    'uied:setting:save',
    'uied:setting:siteInfo',
    'uied:setting:saveSiteInfo',
    'uied:setting:public',
    'uied:navMenu:list',
    'uied:navMenu:all',
    'uied:navMenu:detail',
    'uied:navMenu:add',
    'uied:navMenu:edit',
    'uied:navMenu:del',
    'uied:navMenu:sort',
    'uied:friendLink:list',
    'uied:friendLink:detail',
    'uied:friendLink:add',
    'uied:friendLink:edit',
    'uied:friendLink:del',
    'uied:footer:groupList',
    'uied:footer:groupAll',
    'uied:footer:groupAdd',
    'uied:footer:groupEdit',
    'uied:footer:groupDel',
    'uied:footer:linkList',
    'uied:footer:linkAdd',
    'uied:footer:linkEdit',
    'uied:footer:linkDel',
    'uied:socialMedia:groupList',
    'uied:socialMedia:groupAll',
    'uied:socialMedia:groupAdd',
    'uied:socialMedia:groupEdit',
    'uied:socialMedia:groupDel',
    'uied:socialMedia:itemList',
    'uied:socialMedia:itemAdd',
    'uied:socialMedia:itemEdit',
    'uied:socialMedia:itemDel',
    'uied:banner:list',
    'uied:banner:detail',
    'uied:banner:add',
    'uied:banner:edit',
    'uied:banner:del',
    'uied:faviconApi:list',
    'uied:faviconApi:detail',
    'uied:faviconApi:add',
    'uied:faviconApi:edit',
    'uied:faviconApi:del',
    'uied:faviconApi:setDefault',
    // 网站标签
    'uied:websiteTag:list',
    'uied:websiteTag:all',
    'uied:websiteTag:detail',
    'uied:websiteTag:add',
    'uied:websiteTag:edit',
    'uied:websiteTag:del',
    'uied:websiteTag:websiteTags',
    'uied:websiteTag:setWebsiteTags',
    // SEO 抓取
    'uied:seoScraper:fetch',
    // 网站提交
    'uied:submission:checkUrl',
    'uied:submission:submit',
    'uied:submission:status',
    'uied:submission:list',
    'uied:submission:pendingCount',
    'uied:submission:approve',
    'uied:submission:reject',
    'uied:submission:edit',
    'uied:submission:del',
    // 数据导出
    'uied:export:websites',
    'uied:export:categories',
    'uied:export:all',
    'uied:export:websitesCSV',
    'uied:export:websitesJSON',
    'uied:export:categoriesCSV',
    'uied:export:categoriesJSON',
    'uied:export:backup',
    'uied:export:list',
    'uied:export:download:*',
    'uied:export:del',
    // 操作日志
    'uied:operationLog:list',
    'uied:operationLog:stats',
    'uied:operationLog:cleanup',
    'uied:operationLog:del',
    // 监控
    'uied:monitor:statistics',
    'uied:monitor:failedWebsites',
    'uied:monitor:config',
    'uied:monitor:updateConfig',
    'uied:monitor:checkWebsite',
    'uied:monitor:checkAll',
    'uied:monitor:resetStatus',
    // AI 配置
    'uied:aiConfig:list',
    'uied:aiConfig:default',
    'uied:aiConfig:get',
    'uied:aiConfig:save',
    'uied:aiConfig:test',
    'uied:aiConfig:add',
    'uied:aiConfig:edit',
    'uied:aiConfig:del',
    'uied:aiConfig:generateWebsiteInfo',
    'uied:aiConfig:chat',
    // WordPress 配置
    'uied:wordpress:configs',
    'uied:wordpress:configs:default',
    'uied:wordpress:configs:add',
    'uied:wordpress:configs:edit',
    'uied:wordpress:configs:del',
    'uied:wordpress:categories',
    'uied:wordpress:categories:add',
    'uied:wordpress:categories:edit',
    'uied:wordpress:categories:del',
    'uied:wordpress:posts',
    // 文章管理
    'uied:article:list',
    'uied:article:detail',
    'uied:article:add',
    'uied:article:edit',
    'uied:article:del',
    'uied:article:categories',
    // 评论管理
    'uied:comment:list',
    'uied:comment:detail',
    'uied:comment:approve',
    'uied:comment:reject',
    'uied:comment:del',
    'uied:comment:pendingCount',
    'uied:comment:stats',
    // 数据统计
    'uied:statistics:clicks',
    'uied:statistics:search',
    'uied:statistics:overview',
    'uied:statistics:recent',
  ],

  publicUrl: 'http://127.0.0.1:8001',
  // 资源访问前缀
  publicPrefix: '/api/uploads',
  // 版本
  version: 'v1.0.0',

  rootPath: runPath,
};

module.exports = rsa;
