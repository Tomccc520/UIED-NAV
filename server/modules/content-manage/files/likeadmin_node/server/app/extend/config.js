/**
 * @copyright Tomda (https://www.tomda.top)
 * @copyright UIED技术团队 (https://fsuied.com)
 * @author UIED技术团队
 * @createDate 2026.1.27
 */
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
    'user:login', // 用户登录
    'user:register', // 用户注册
    'user:license:query', // 用户授权查询
    'user:profile', // 用户资料
    'user:profile:update', // 更新资料
    'user:author:center:detail', // 作者中心详情（前台登录）
    'user:author:center:save', // 作者中心保存（前台登录）
    'user:author:public:detail', // 作者公开主页
    'user:order:create', // 创建订单
    'user:orders', // 用户订单列表
    'user:orders:detail', // 用户订单详情
    'user:orders:cancel', // 用户订单取消
    'user:orders:refund', // 用户订单退款
    'user:licenses', // 用户授权列表
    'user:license:bind', // 绑定授权
    'user:messages', // 用户消息
    'user:messages:read', // 读取消息
    'user:wallet', // 用户钱包
    'user:wallet:flows', // 用户钱包明细
    'user:wallet:info', // 用户钱包信息
    'user:wallet:log', // 用户钱包明细
    'wallet:recharge', // 钱包充值
    'user:vip:info', // 会员信息
    'user:vip:goods', // 会员商品
    'vip:purchase', // 会员购买
    'user:message:list', // 用户消息列表
    'user:message:read', // 用户消息已读
    'user:message:delete', // 用户消息删除
    'user:collect:list', // 用户收藏列表
    'user:collect:toggle', // 用户收藏切换
    'user:article:collect:list', // 用户收藏文章列表
    'user:article:like:list', // 用户点赞文章列表
    'user:address:list', // 用户地址列表
    'user:address:edit', // 用户地址编辑
    'user:address:del', // 用户地址删除
    'user:login:log', // 用户登录日志
    'user:bind', // 绑定手机/邮箱
    'user:send_code', // 发送验证码
    'user:invoice:list', // 发票列表
    'user:invoice:apply', // 发票申请
    'user:feedback:add', // 用户反馈
    'user:coupon:list', // 可领取优惠券列表
    'user:coupon:my', // 我的优惠券列表
    'user:coupon:receive', // 领取优惠券
    'search:config', // 搜索配置
    'search:hot', // 搜索热词
    'search:track', // 搜索埋点
    'user:index:stats', // 用户中心统计
    'user:order:list', // 用户订单列表
    'user:license:list', // 用户授权列表
    'user:license:change', // 用户更换授权信息（提交审核）
    'payment:notify', // 支付回调
    'delivery:download', // 交付下载
    'common:index:config', // 配置接口
    'product:list', // 产品列表
    'product:detail', // 产品详情
    'product:package:public', // 产品套餐（官网）
    'product:version:public', // 产品版本发布（官网）
    'product:version:lists', // 产品版本发布列表（官网）
    'setting:official:detail', // 官网设置详情
    'setting:dict:data:all', // 字典数据
    'setting:dict:type:all', // 字典类型
    'common:upload:image', // 图片上传
    'common:upload:video', // 视频上传
    'common:upload:file', // 文件上传
    'article:list', // 文章列表
    'article:detail', // 文章详情
    'article:cate:list', // 文章分类列表
    'article:cate:all', // 文章分类全部
    'article:tag:all', // 文章标签全部
    'article:topic:all', // 文章专题全部
    'article:all', // 文章全部
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
    'ai:chat:completions', // AI 聊天
    'ai:chat:completions:editor', // AI 编辑器生成
  ],

  // 前台用户 token 可直通（不走后台管理员鉴权）
  userTokenPassUri: [
    'common:album:albumList', // 前台素材列表
    'common:album:cateList', // 前台素材分类
    'article:comment:top:toggle', // 评论置顶（作者）
    'article:comment:report:add', // 评论举报（前台登录）
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
    'system:notice:list', // 后台通知列表
    'system:notice:read', // 后台通知已读
    'user:author:options', // 作者下拉选项
    'setting:dict:type:all', // 所有字典类型
    'setting:dict:data:all', // 所有字典数据
    'article:cate:all', // 所有文章分类
    'article:tag:all', // 所有文章标签
    'article:topic:all', // 所有文章专题
    'article:tag:batch:change', // 标签批量状态切换
    'article:tag:batch:del', // 标签批量删除
    'article:tag:merge', // 标签合并
    'article:import:wechat', // 公众号文章导入
  ],

  publicUrl: 'http://127.0.0.1:8001',
  // 资源访问前缀
  publicPrefix: '/api/uploads',
  // 版本
  version: 'v1.0.0',

  rootPath: runPath,
};

module.exports = rsa;
