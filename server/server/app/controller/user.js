/**
 * @copyright Tomda (https://www.tomda.top)
 * @copyright UIED技术团队 (https://fsuied.com)
 * @author UIED技术团队
 * @createDate 2026.1.27
 */
'use strict';

const BaseController = require('./baseController');

class UserController extends BaseController {
  /**
   * 管理端用户列表
   */
  async list() {
    const { ctx } = this;
    try {
      const params = ctx.request.query || {};
      const data = await ctx.service.user.list(params);
      this.result({ data });
    } catch (e) {
      this.result({ data: '', message: e.message, code: 1001 });
    }
  }

  /**
   * 管理端用户详情
   */
  async detail() {
    const { ctx } = this;
    try {
      const { id } = ctx.request.query || {};
      const data = await ctx.service.user.detail(id);
      this.result({ data });
    } catch (e) {
      this.result({ data: '', message: e.message, code: 1001 });
    }
  }

  /**
   * 管理端用户编辑
   */
  async edit() {
    const { ctx } = this;
    try {
      const body = ctx.request.body || {};
      await ctx.service.user.edit(body.id, body.field, body.value);
      this.result({ data: true, message: '编辑成功' });
    } catch (e) {
      this.result({ data: '', message: e.message, code: 1001 });
    }
  }

  async walletAdjust() {
    const { ctx } = this;
    try {
      const body = ctx.request.body || {};
      const data = await ctx.service.user.adminWalletAdjust(body);
      this.result({ data, message: '操作成功' });
    } catch (e) {
      this.result({ data: '', message: e.message, code: 1001 });
    }
  }

  async register() {
    const { ctx } = this;
    try {
      const body = ctx.request.body || {};
      const data = await ctx.service.user.register(body);
      this.result({ data });
    } catch (e) {
      this.result({ data: '', message: e.message, code: 1001 });
    }
  }

  async login() {
    const { ctx } = this;
    try {
      const body = ctx.request.body || {};
      const data = await ctx.service.user.login(body);
      this.result({ data });
    } catch (e) {
      this.result({ data: '', message: e.message, code: 1001 });
    }
  }

  async profile() {
    const { ctx } = this;
    try {
      const userId = await ctx.service.user.getUserId();
      const data = await ctx.service.user.getSafeUserInfoById(userId, true);
      this.result({ data });
    } catch (e) {
      this.result({ data: '', message: e.message, code: 1001 });
    }
  }

  /**
   * 用户退出登录
   */
  async logout() {
    const { ctx } = this;
    try {
      await ctx.service.user.logout();
      this.result({ data: true, message: '退出成功' });
    } catch (e) {
      this.result({ data: '', message: e.message, code: 1001 });
    }
  }

  async updateProfile() {
    const { ctx } = this;
    try {
      const body = ctx.request.body || {};
      const userId = await ctx.service.user.getUserId();
      const user = await ctx.service.user.updateProfile(userId, body);
      this.result({ data: user });
    } catch (e) {
      this.result({ data: '', message: e.message, code: 1001 });
    }
  }

  /**
   * 作者中心详情（个人中心可编辑）
   */
  async authorCenterDetail() {
    const { ctx } = this;
    try {
      const userId = await ctx.service.user.getUserId();
      const data = await ctx.service.user.authorCenterDetail(userId);
      this.result({ data });
    } catch (e) {
      this.result({ data: '', message: e.message, code: 1001 });
    }
  }

  /**
   * 作者中心资料保存（个人中心编辑）
   */
  async authorCenterSave() {
    const { ctx } = this;
    try {
      const userId = await ctx.service.user.getUserId();
      const body = ctx.request.body || {};
      const data = await ctx.service.user.authorCenterSave(userId, body);
      this.result({ data, message: '保存成功' });
    } catch (e) {
      this.result({ data: '', message: e.message, code: 1001 });
    }
  }

  /**
   * 作者公开主页详情（对外展示）
   */
  async authorPublicDetail() {
    const { ctx } = this;
    try {
      const query = ctx.request.query || {};
      const data = await ctx.service.user.authorPublicDetail(query.id, query);
      this.result({ data });
    } catch (e) {
      this.result({ data: '', message: e.message, code: 1001 });
    }
  }

  /**
   * 作者下拉选项（后台文章编辑器）
   */
  async authorOptions() {
    const { ctx } = this;
    try {
      const query = ctx.request.query || {};
      const data = await ctx.service.user.authorOptions(query);
      this.result({ data });
    } catch (e) {
      this.result({ data: '', message: e.message, code: 1001 });
    }
  }

  async orders() {
    const { ctx } = this;
    try {
      const userId = await ctx.service.user.getUserId();
      const params = ctx.request.query || {};
      const data = await ctx.service.order.list({ ...params, userId });
      this.result({ data });
    } catch (e) {
      this.result({ data: '', message: e.message, code: 1001 });
    }
  }

  async createOrder() {
    const { ctx } = this;
    try {
      const body = ctx.request.body || {};
      const userId = await ctx.service.user.getUserId();
      const order = await ctx.service.order.createOrder({
        userId,
        productId: body.productId,
        packageId: body.packageId,
        payChannel: body.payChannel,
        couponId: body.couponId,
      });
      const payInfo = await ctx.service.payment.createPayInfo(order);
      this.result({ data: { order, payInfo }, message: '订单创建成功' });
    } catch (e) {
      this.result({ data: '', message: e.message, code: 1001 });
    }
  }

  /**
   * 用户中心订单详情（含发票状态）
   */
  async orderDetail() {
    const { ctx } = this;
    try {
      const userId = await ctx.service.user.getUserId();
      const { id } = ctx.params;
      const data = await ctx.service.user.orderDetail(userId, id);
      this.result({ data });
    } catch (e) {
      this.result({ data: '', message: e.message, code: 1001 });
    }
  }

  async cancelOrder() {
    const { ctx } = this;
    try {
      const userId = await ctx.service.user.getUserId();
      const { id } = ctx.params;
      await ctx.service.order.cancel(id, userId);
      this.result({ data: true, message: '取消成功' });
    } catch (e) {
      this.result({ data: '', message: e.message, code: 1001 });
    }
  }

  async refundOrder() {
    const { ctx } = this;
    try {
      const userId = await ctx.service.user.getUserId();
      const { id } = ctx.params;
      const body = ctx.request.body || {};
      await ctx.service.order.refund(id, userId, body.reason);
      this.result({ data: true, message: '已提交退款申请' });
    } catch (e) {
      this.result({ data: '', message: e.message, code: 1001 });
    }
  }

  async licenses() {
    const { ctx } = this;
    try {
      const userId = await ctx.service.user.getUserId();
      const params = ctx.request.query || {};
      const data = await ctx.service.license.list({ ...params, userId });
      this.result({ data });
    } catch (e) {
      this.result({ data: '', message: e.message, code: 1001 });
    }
  }

  async bindLicense() {
    const { ctx } = this;
    try {
      const userId = await ctx.service.user.getUserId();
      const body = ctx.request.body || {};
      const data = await ctx.service.license.bindDomain(body.licenseId, body.domain, userId, {
        mobile: body.mobile,
        qq: body.qq,
      });
      this.result({ data, message: '已提交审核' });
    } catch (e) {
      this.result({ data: '', message: e.message, code: 1001 });
    }
  }

  async changeLicenseDomain() {
    const { ctx } = this;
    try {
      const userId = await ctx.service.user.getUserId();
      const body = ctx.request.body || {};
      const { licenseId, domain, mobile, qq } = body;
      await ctx.service.license.submitInfo(licenseId, { domain, mobile, qq }, userId);
      this.result({ data: null, message: '提交成功，请等待审核' });
    } catch (e) {
      this.result({ data: '', message: e.message, code: 1001 });
    }
  }

  async messages() {
    const { ctx } = this;
    try {
      const userId = await ctx.service.user.getUserId();
      const params = ctx.request.query || {};
      const data = await ctx.service.user.messageList(userId, params);
      this.result({ data });
    } catch (e) {
      this.result({ data: '', message: e.message, code: 1001 });
    }
  }

  async readMessage() {
    const { ctx } = this;
    try {
      const userId = await ctx.service.user.getUserId();
      const body = ctx.request.body || {};
      if (body.id) {
        await ctx.service.user.messageRead(userId, [ body.id ]);
      } else {
        await ctx.service.user.messageRead(userId, []);
      }
      this.result({ data: true, message: '操作成功' });
    } catch (e) {
      this.result({ data: '', message: e.message, code: 1001 });
    }
  }

  async wallet() {
    const { ctx } = this;
    try {
      const userId = await ctx.service.user.getUserId();
      let wallet = await ctx.model.UserWallet.findOne({ where: { userId } });
      if (!wallet) {
        wallet = await ctx.model.UserWallet.create({ userId, balance: 0 });
      }
      this.result({ data: wallet });
    } catch (e) {
      this.result({ data: '', message: e.message, code: 1001 });
    }
  }

  async walletFlows() {
    const { ctx } = this;
    try {
      const userId = await ctx.service.user.getUserId();
      const pageNo = Number(ctx.request.query.pageNo || 1);
      const pageSize = Number(ctx.request.query.pageSize || 10);
      const { count, rows } = await ctx.model.UserWalletFlow.findAndCountAll({
        where: { userId },
        limit: pageSize,
        offset: pageSize * (pageNo - 1),
        order: [[ 'id', 'DESC' ]],
      });
      this.result({ data: { pageNo, pageSize, count, lists: rows } });
    } catch (e) {
      this.result({ data: '', message: e.message, code: 1001 });
    }
  }

  async walletInfo() {
    const { ctx } = this;
    try {
      const userId = await ctx.service.user.getUserId();
      const data = await ctx.service.user.walletInfo(userId);
      this.result({ data });
    } catch (e) {
      this.result({ data: '', message: e.message, code: 1001 });
    }
  }

  async walletLog() {
    const { ctx } = this;
    try {
      const userId = await ctx.service.user.getUserId();
      const params = ctx.request.query || {};
      const data = await ctx.service.user.walletLog(userId, params);
      this.result({ data });
    } catch (e) {
      this.result({ data: '', message: e.message, code: 1001 });
    }
  }

  async walletRecharge() {
    const { ctx } = this;
    try {
      const userId = await ctx.service.user.getUserId();
      const body = ctx.request.body || {};
      const data = await ctx.service.user.walletRecharge(userId, body);
      this.result({ data, message: '订单创建成功' });
    } catch (e) {
      this.result({ data: '', message: e.message, code: 1001 });
    }
  }

  async vipInfo() {
    const { ctx } = this;
    try {
      const userId = await ctx.service.user.getUserId();
      const data = await ctx.service.user.vipInfo(userId);
      this.result({ data });
    } catch (e) {
      this.result({ data: '', message: e.message, code: 1001 });
    }
  }

  async vipGoods() {
    const { ctx } = this;
    try {
      const data = await ctx.service.user.vipGoods();
      this.result({ data });
    } catch (e) {
      this.result({ data: '', message: e.message, code: 1001 });
    }
  }

  async vipPurchase() {
    const { ctx } = this;
    try {
      const userId = await ctx.service.user.getUserId();
      const body = ctx.request.body || {};
      const data = await ctx.service.user.vipPurchase(userId, body);
      this.result({ data, message: '订单创建成功' });
    } catch (e) {
      this.result({ data: '', message: e.message, code: 1001 });
    }
  }

  /**
   * 用户中心首页统计
   */
  async indexStats() {
    const { ctx } = this;
    try {
      const userId = await ctx.service.user.getUserId();
      const data = await ctx.service.user.stats(userId);
      this.result({ data });
    } catch (e) {
      this.result({ data: '', message: e.message, code: 1001 });
    }
  }

  /**
   * 用户中心订单列表
   */
  async orderList() {
    const { ctx } = this;
    try {
      const userId = await ctx.service.user.getUserId();
      const params = ctx.request.query || {};
      const data = await ctx.service.user.orderList(userId, params);
      this.result({ data });
    } catch (e) {
      this.result({ data: '', message: e.message, code: 1001 });
    }
  }

  /**
   * 用户中心授权列表
   */
  async licenseList() {
    const { ctx } = this;
    try {
      const userId = await ctx.service.user.getUserId();
      const params = ctx.request.query || {};
      const data = await ctx.service.user.licenseList(userId, params);
      this.result({ data });
    } catch (e) {
      this.result({ data: '', message: e.message, code: 1001 });
    }
  }

  /**
   * 用户中心修改密码
   */
  async changePassword() {
    const { ctx } = this;
    try {
      const userId = await ctx.service.user.getUserId();
      const body = ctx.request.body || {};
      await ctx.service.user.changePassword(userId, body);
      this.result({ data: true, message: '修改成功' });
    } catch (e) {
      this.result({ data: '', message: e.message, code: 1001 });
    }
  }

  async messageList() {
    const { ctx } = this;
    try {
      const userId = await ctx.service.user.getUserId();
      const params = ctx.request.query || {};
      const data = await ctx.service.user.messageList(userId, params);
      this.result({ data });
    } catch (e) {
      this.result({ data: '', message: e.message, code: 1001 });
    }
  }

  async messageRead() {
    const { ctx } = this;
    try {
      const userId = await ctx.service.user.getUserId();
      const body = ctx.request.body || {};
      await ctx.service.user.messageRead(userId, body.ids || []);
      this.result({ data: null, message: '操作成功' });
    } catch (e) {
      this.result({ data: '', message: e.message, code: 1001 });
    }
  }

  async messageDelete() {
    const { ctx } = this;
    try {
      const userId = await ctx.service.user.getUserId();
      const body = ctx.request.body || {};
      await ctx.service.user.messageDelete(userId, body.ids || []);
      this.result({ data: null, message: '操作成功' });
    } catch (e) {
      this.result({ data: '', message: e.message, code: 1001 });
    }
  }

  async collectList() {
    const { ctx } = this;
    try {
      const userId = await ctx.service.user.getUserId();
      const params = ctx.request.query || {};
      const data = await ctx.service.user.collectList(userId, params);
      this.result({ data });
    } catch (e) {
      this.result({ data: '', message: e.message, code: 1001 });
    }
  }

  async collectToggle() {
    const { ctx } = this;
    try {
      const userId = await ctx.service.user.getUserId();
      const body = ctx.request.body || {};
      const result = await ctx.service.user.collectToggle(userId, body.productId);
      this.result({ data: { isCollect: result.isCollect }, message: result.message });
    } catch (e) {
      this.result({ data: '', message: e.message, code: 1001 });
    }
  }

  /**
   * 用户中心收藏文章列表
   */
  async articleCollectList() {
    const { ctx } = this;
    try {
      const userId = await ctx.service.user.getUserId();
      const params = ctx.request.query || {};
      const data = await ctx.service.user.articleCollectList(userId, params);
      this.result({ data });
    } catch (e) {
      this.result({ data: '', message: e.message, code: 1001 });
    }
  }

  /**
   * 用户中心点赞文章列表
   */
  async articleLikeList() {
    const { ctx } = this;
    try {
      const userId = await ctx.service.user.getUserId();
      const params = ctx.request.query || {};
      const data = await ctx.service.user.articleLikeList(userId, params);
      this.result({ data });
    } catch (e) {
      this.result({ data: '', message: e.message, code: 1001 });
    }
  }

  /**
   * 用户中心收藏网址列表
   */
  async websiteFavoriteList() {
    const { ctx } = this;
    try {
      const userId = await ctx.service.user.getUserId();
      const params = Object.keys(ctx.request.body || {}).length ? (ctx.request.body || {}) : (ctx.request.query || {});
      const data = await ctx.service.user.websiteFavoriteList(userId, params);
      this.result({ data });
    } catch (e) {
      this.result({ data: '', message: e.message, code: 1001 });
    }
  }

  /**
   * 用户中心点赞网址列表
   */
  async websiteLikeList() {
    const { ctx } = this;
    try {
      const userId = await ctx.service.user.getUserId();
      const params = Object.keys(ctx.request.body || {}).length ? (ctx.request.body || {}) : (ctx.request.query || {});
      const data = await ctx.service.user.websiteLikeList(userId, params);
      this.result({ data });
    } catch (e) {
      this.result({ data: '', message: e.message, code: 1001 });
    }
  }

  async addressList() {
    const { ctx } = this;
    try {
      const userId = await ctx.service.user.getUserId();
      const params = ctx.request.query || {};
      const data = await ctx.service.user.addressList(userId, params);
      this.result({ data });
    } catch (e) {
      this.result({ data: '', message: e.message, code: 1001 });
    }
  }

  async addressEdit() {
    const { ctx } = this;
    try {
      const userId = await ctx.service.user.getUserId();
      const body = ctx.request.body || {};
      await ctx.service.user.addressEdit(userId, body);
      this.result({ data: null, message: '操作成功' });
    } catch (e) {
      this.result({ data: '', message: e.message, code: 1001 });
    }
  }

  async addressDel() {
    const { ctx } = this;
    try {
      const userId = await ctx.service.user.getUserId();
      const body = ctx.request.body || {};
      await ctx.service.user.addressDel(userId, body.id);
      this.result({ data: null, message: '操作成功' });
    } catch (e) {
      this.result({ data: '', message: e.message, code: 1001 });
    }
  }

  async loginLog() {
    const { ctx } = this;
    try {
      const userId = await ctx.service.user.getUserId();
      const params = ctx.request.query || {};
      const data = await ctx.service.user.loginLog(userId, params);
      this.result({ data });
    } catch (e) {
      this.result({ data: '', message: e.message, code: 1001 });
    }
  }

  async sendCode() {
    const { ctx } = this;
    try {
      const userId = await ctx.service.user.getUserId();
      const body = ctx.request.body || {};
      const data = await ctx.service.user.sendBindCode(userId, body);
      this.result({ data, message: '发送成功' });
    } catch (e) {
      this.result({ data: '', message: e.message, code: 1001 });
    }
  }

  async bindAccount() {
    const { ctx } = this;
    try {
      const userId = await ctx.service.user.getUserId();
      const body = ctx.request.body || {};
      await ctx.service.user.bindAccount(userId, body);
      this.result({ data: null, message: '绑定成功' });
    } catch (e) {
      this.result({ data: '', message: e.message, code: 1001 });
    }
  }

  /**
   * 解绑手机号/邮箱
   */
  async unbindAccount() {
    const { ctx } = this;
    try {
      const userId = await ctx.service.user.getUserId();
      const body = ctx.request.body || {};
      await ctx.service.user.unbindAccount(userId, body);
      this.result({ data: null, message: '解绑成功' });
    } catch (e) {
      this.result({ data: '', message: e.message, code: 1001 });
    }
  }

  /**
   * 注销账号
   */
  async cancelAccount() {
    const { ctx } = this;
    try {
      const userId = await ctx.service.user.getUserId();
      await ctx.service.user.cancelAccount(userId);
      this.result({ data: null, message: '账号已注销' });
    } catch (e) {
      this.result({ data: '', message: e.message, code: 1001 });
    }
  }

  async invoiceList() {
    const { ctx } = this;
    try {
      const userId = await ctx.service.user.getUserId();
      const params = ctx.request.query || {};
      const data = await ctx.service.user.invoiceList(userId, params);
      this.result({ data });
    } catch (e) {
      this.result({ data: '', message: e.message, code: 1001 });
    }
  }

  async invoiceApply() {
    const { ctx } = this;
    try {
      const userId = await ctx.service.user.getUserId();
      const body = ctx.request.body || {};
      await ctx.service.user.invoiceApply(userId, body);
      this.result({ data: null, message: '申请成功' });
    } catch (e) {
      this.result({ data: '', message: e.message, code: 1001 });
    }
  }

  async feedbackAdd() {
    const { ctx } = this;
    try {
      const userId = await ctx.service.user.getUserId();
      const body = ctx.request.body || {};
      await ctx.service.user.feedbackAdd(userId, body);
      this.result({ data: null, message: '提交成功' });
    } catch (e) {
      this.result({ data: '', message: e.message, code: 1001 });
    }
  }

  /**
   * 后台用户统计
   */
  async stats() {
    const { ctx } = this;
    try {
      const data = await ctx.service.user.adminStats();
      this.result({ data });
    } catch (e) {
      this.result({ data: '', message: e.message, code: 1001 });
    }
  }

  async groupList() {
    const { ctx } = this;
    try {
      const data = await ctx.service.user.groupList();
      this.result({ data });
    } catch (e) {
      this.result({ data: '', message: e.message, code: 1001 });
    }
  }

  async groupAdd() {
    const { ctx } = this;
    try {
      const body = ctx.request.body || {};
      await ctx.service.user.groupAdd(body);
      this.result({ data: null, message: '操作成功' });
    } catch (e) {
      this.result({ data: '', message: e.message, code: 1001 });
    }
  }

  async groupEdit() {
    const { ctx } = this;
    try {
      const body = ctx.request.body || {};
      await ctx.service.user.groupEdit(body);
      this.result({ data: null, message: '操作成功' });
    } catch (e) {
      this.result({ data: '', message: e.message, code: 1001 });
    }
  }

  async groupDel() {
    const { ctx } = this;
    try {
      const body = ctx.request.body || {};
      await ctx.service.user.groupDel(body.id);
      this.result({ data: null, message: '操作成功' });
    } catch (e) {
      this.result({ data: '', message: e.message, code: 1001 });
    }
  }

  async tagList() {
    const { ctx } = this;
    try {
      const data = await ctx.service.user.tagList();
      this.result({ data });
    } catch (e) {
      this.result({ data: '', message: e.message, code: 1001 });
    }
  }

  async tagAdd() {
    const { ctx } = this;
    try {
      const body = ctx.request.body || {};
      await ctx.service.user.tagAdd(body);
      this.result({ data: null, message: '操作成功' });
    } catch (e) {
      this.result({ data: '', message: e.message, code: 1001 });
    }
  }

  async tagEdit() {
    const { ctx } = this;
    try {
      const body = ctx.request.body || {};
      await ctx.service.user.tagEdit(body);
      this.result({ data: null, message: '操作成功' });
    } catch (e) {
      this.result({ data: '', message: e.message, code: 1001 });
    }
  }

  async tagDel() {
    const { ctx } = this;
    try {
      const body = ctx.request.body || {};
      await ctx.service.user.tagDel(body.id);
      this.result({ data: null, message: '操作成功' });
    } catch (e) {
      this.result({ data: '', message: e.message, code: 1001 });
    }
  }

  async tagBind() {
    const { ctx } = this;
    try {
      const body = ctx.request.body || {};
      const tagIds = await ctx.service.user.tagBind(body.userId, body.tagIds || []);
      this.result({ data: { tagIds }, message: '操作成功' });
    } catch (e) {
      this.result({ data: '', message: e.message, code: 1001 });
    }
  }

  async levelList() {
    const { ctx } = this;
    try {
      const data = await ctx.service.user.levelList();
      this.result({ data });
    } catch (e) {
      this.result({ data: '', message: e.message, code: 1001 });
    }
  }

  async levelAdd() {
    const { ctx } = this;
    try {
      const body = ctx.request.body || {};
      await ctx.service.user.levelAdd(body);
      this.result({ data: null, message: '操作成功' });
    } catch (e) {
      this.result({ data: '', message: e.message, code: 1001 });
    }
  }

  async levelEdit() {
    const { ctx } = this;
    try {
      const body = ctx.request.body || {};
      await ctx.service.user.levelEdit(body);
      this.result({ data: null, message: '操作成功' });
    } catch (e) {
      this.result({ data: '', message: e.message, code: 1001 });
    }
  }

  async levelDel() {
    const { ctx } = this;
    try {
      const body = ctx.request.body || {};
      await ctx.service.user.levelDel(body.id);
      this.result({ data: null, message: '操作成功' });
    } catch (e) {
      this.result({ data: '', message: e.message, code: 1001 });
    }
  }

  /**
   * 管理端初始化测试用户（幂等）
   */
  async seedTestUsers() {
    const { ctx } = this;
    try {
      const data = await ctx.service.user.seedTestUsers();
      this.result({ data, message: '测试用户初始化成功' });
    } catch (e) {
      this.result({ data: '', message: e.message, code: 1001 });
    }
  }
}

module.exports = UserController;
