'use strict';

const baseController = require('./baseController');

class ArticleController extends baseController {
  async cateList() {
    const { ctx } = this;
    try {
      const params = ctx.request.query || {};
      const data = await ctx.service.article.cateList(params);
      this.result({ data });
    } catch (err) {
      ctx.logger.error(`ArticleController.cateList error: ${err.message || err}`);
      this.result({ data: '', message: err.message, code: 300 });
    }
  }

  /**
   * 获取文章分类下拉数据
   */
  async cateAll() {
    const { ctx } = this;
    try {
      const params = ctx.request.query || {};
      const data = await ctx.service.article.cateAll(params);
      this.result({ data });
    } catch (err) {
      this.result({ data: '', message: err.message, code: 300 });
    }
  }

  async cateDetail() {
    const { ctx } = this;
    try {
      const { id } = ctx.request.query || {};
      const data = await ctx.service.article.cateDetail(id);
      this.result({ data });
    } catch (err) {
      this.result({ data: '', message: err.message, code: 300 });
    }
  }

  async cateAdd() {
    const { ctx } = this;
    try {
      const body = ctx.request.body || {};
      await ctx.service.article.cateAdd(body);
      this.result({ data: true, message: '操作成功' });
    } catch (err) {
      ctx.logger.error(`ArticleController.cateAdd error: ${err.message || err}`);
      this.result({ data: '', message: err.message, code: 300 });
    }
  }

  async cateEdit() {
    const { ctx } = this;
    try {
      const body = ctx.request.body || {};
      await ctx.service.article.cateEdit(body);
      this.result({ data: true, message: '操作成功' });
    } catch (err) {
      this.result({ data: '', message: err.message, code: 300 });
    }
  }

  async cateDel() {
    const { ctx } = this;
    try {
      const body = ctx.request.body || {};
      await ctx.service.article.cateDel(body.id);
      this.result({ data: true, message: '操作成功' });
    } catch (err) {
      this.result({ data: '', message: err.message, code: 300 });
    }
  }

  async cateChange() {
    const { ctx } = this;
    try {
      const body = ctx.request.body || {};
      await ctx.service.article.cateChange(body.id);
      this.result({ data: true, message: '操作成功' });
    } catch (err) {
      this.result({ data: '', message: err.message, code: 300 });
    }
  }

  /**
   * 标签列表
   */
  async tagList() {
    const { ctx } = this;
    try {
      const params = ctx.request.query || {};
      const data = await ctx.service.article.tagList(params);
      this.result({ data });
    } catch (err) {
      this.result({ data: '', message: err.message, code: 300 });
    }
  }

  /**
   * 标签下拉
   */
  async tagAll() {
    const { ctx } = this;
    try {
      const params = ctx.request.query || {};
      const data = await ctx.service.article.tagAll(params);
      this.result({ data });
    } catch (err) {
      this.result({ data: '', message: err.message, code: 300 });
    }
  }

  /**
   * 标签详情
   */
  async tagDetail() {
    const { ctx } = this;
    try {
      const { id } = ctx.request.query || {};
      const data = await ctx.service.article.tagDetail(id);
      this.result({ data });
    } catch (err) {
      this.result({ data: '', message: err.message, code: 300 });
    }
  }

  /**
   * 标签新增
   */
  async tagAdd() {
    const { ctx } = this;
    try {
      const body = ctx.request.body || {};
      await ctx.service.article.tagAdd(body);
      this.result({ data: true, message: '操作成功' });
    } catch (err) {
      this.result({ data: '', message: err.message, code: 300 });
    }
  }

  /**
   * 标签编辑
   */
  async tagEdit() {
    const { ctx } = this;
    try {
      const body = ctx.request.body || {};
      await ctx.service.article.tagEdit(body);
      this.result({ data: true, message: '操作成功' });
    } catch (err) {
      this.result({ data: '', message: err.message, code: 300 });
    }
  }

  /**
   * 标签删除
   */
  async tagDel() {
    const { ctx } = this;
    try {
      const body = ctx.request.body || {};
      await ctx.service.article.tagDel(body.id);
      this.result({ data: true, message: '操作成功' });
    } catch (err) {
      this.result({ data: '', message: err.message, code: 300 });
    }
  }

  /**
   * 标签状态切换
   */
  async tagChange() {
    const { ctx } = this;
    try {
      const body = ctx.request.body || {};
      await ctx.service.article.tagChange(body.id);
      this.result({ data: true, message: '操作成功' });
    } catch (err) {
      this.result({ data: '', message: err.message, code: 300 });
    }
  }

  /**
   * 标签批量状态切换
   */
  async tagBatchChange() {
    const { ctx } = this;
    try {
      const body = ctx.request.body || {};
      await ctx.service.article.tagBatchChange(body.ids, body.isShow);
      this.result({ data: true, message: '操作成功' });
    } catch (err) {
      this.result({ data: '', message: err.message, code: 300 });
    }
  }

  /**
   * 标签批量删除
   */
  async tagBatchDel() {
    const { ctx } = this;
    try {
      const body = ctx.request.body || {};
      await ctx.service.article.tagBatchDel(body.ids);
      this.result({ data: true, message: '操作成功' });
    } catch (err) {
      this.result({ data: '', message: err.message, code: 300 });
    }
  }

  /**
   * 标签合并
   */
  async tagMerge() {
    const { ctx } = this;
    try {
      const body = ctx.request.body || {};
      await ctx.service.article.tagMerge(body.fromIds, body.toId);
      this.result({ data: true, message: '操作成功' });
    } catch (err) {
      this.result({ data: '', message: err.message, code: 300 });
    }
  }

  /**
   * 专题列表
   */
  async topicList() {
    const { ctx } = this;
    try {
      const params = ctx.request.query || {};
      const data = await ctx.service.article.topicList(params);
      this.result({ data });
    } catch (err) {
      this.result({ data: '', message: err.message, code: 300 });
    }
  }

  /**
   * 专题下拉
   */
  async topicAll() {
    const { ctx } = this;
    try {
      const params = ctx.request.query || {};
      const data = await ctx.service.article.topicAll(params);
      this.result({ data });
    } catch (err) {
      this.result({ data: '', message: err.message, code: 300 });
    }
  }

  /**
   * 专题详情
   */
  async topicDetail() {
    const { ctx } = this;
    try {
      const { id } = ctx.request.query || {};
      const data = await ctx.service.article.topicDetail(id);
      this.result({ data });
    } catch (err) {
      this.result({ data: '', message: err.message, code: 300 });
    }
  }

  /**
   * 专题新增
   */
  async topicAdd() {
    const { ctx } = this;
    try {
      const body = ctx.request.body || {};
      await ctx.service.article.topicAdd(body);
      this.result({ data: true, message: '操作成功' });
    } catch (err) {
      this.result({ data: '', message: err.message, code: 300 });
    }
  }

  /**
   * 专题编辑
   */
  async topicEdit() {
    const { ctx } = this;
    try {
      const body = ctx.request.body || {};
      await ctx.service.article.topicEdit(body);
      this.result({ data: true, message: '操作成功' });
    } catch (err) {
      this.result({ data: '', message: err.message, code: 300 });
    }
  }

  /**
   * 专题删除
   */
  async topicDel() {
    const { ctx } = this;
    try {
      const body = ctx.request.body || {};
      await ctx.service.article.topicDel(body.id);
      this.result({ data: true, message: '操作成功' });
    } catch (err) {
      this.result({ data: '', message: err.message, code: 300 });
    }
  }

  /**
   * 专题状态切换
   */
  async topicChange() {
    const { ctx } = this;
    try {
      const body = ctx.request.body || {};
      await ctx.service.article.topicChange(body.id);
      this.result({ data: true, message: '操作成功' });
    } catch (err) {
      this.result({ data: '', message: err.message, code: 300 });
    }
  }

  async list() {
    const { ctx } = this;
    try {
      const params = ctx.request.query || {};
      const data = await ctx.service.article.list(params);
      this.result({ data });
    } catch (err) {
      this.result({ data: '', message: err.message, code: 300 });
    }
  }

  async all() {
    const { ctx } = this;
    try {
      const data = await ctx.service.article.all();
      this.result({ data });
    } catch (err) {
      this.result({ data: '', message: err.message, code: 300 });
    }
  }

  async detail() {
    const { ctx } = this;
    try {
      const { id } = ctx.request.query || {};
      const data = await ctx.service.article.detail(id);
      this.result({ data });
    } catch (err) {
      this.result({ data: '', message: err.message, code: 300 });
    }
  }

  async add() {
    const { ctx } = this;
    try {
      const body = ctx.request.body || {};
      // 返回文章ID，便于前端在保存草稿/发表后直接跳转或刷新状态
      const id = await ctx.service.article.add(body);
      this.result({ data: { id }, message: '操作成功' });
    } catch (err) {
      this.result({ data: '', message: err.message, code: 300 });
    }
  }

  /**
   * 官网前台投稿文章（默认待发布）
   */
  async frontAdd() {
    const { ctx } = this;
    try {
      const body = ctx.request.body || {};
      const data = await ctx.service.article.frontAdd(body);
      this.result({ data, message: '投稿成功，待后台审核发布' });
    } catch (err) {
      this.result({ data: '', message: err.message, code: 300 });
    }
  }

  /**
   * 官网前台投稿列表（作者视角）
   */
  async frontList() {
    const { ctx } = this;
    try {
      const query = ctx.request.query || {};
      const data = await ctx.service.article.frontList(query);
      this.result({ data });
    } catch (err) {
      this.result({ data: '', message: err.message, code: 300 });
    }
  }

  /**
   * 官网前台投稿详情（作者视角）
   */
  async frontDetail() {
    const { ctx } = this;
    try {
      const query = ctx.request.query || {};
      const data = await ctx.service.article.frontDetail(query.id);
      this.result({ data });
    } catch (err) {
      this.result({ data: '', message: err.message, code: 300 });
    }
  }

  /**
   * 官网前台编辑投稿草稿（作者视角）
   */
  async frontEdit() {
    const { ctx } = this;
    try {
      const body = ctx.request.body || {};
      const data = await ctx.service.article.frontEdit(body);
      this.result({ data, message: '草稿已保存' });
    } catch (err) {
      this.result({ data: '', message: err.message, code: 300 });
    }
  }

  /**
   * 后台审核前端投稿
   */
  async frontAudit() {
    const { ctx } = this;
    try {
      const body = ctx.request.body || {};
      const data = await ctx.service.article.frontAudit(body);
      this.result({ data, message: '审核成功' });
    } catch (err) {
      this.result({ data: '', message: err.message, code: 300 });
    }
  }

  /**
   * 前端投稿审核通知列表
   */
  async frontAuditMessageList() {
    const { ctx } = this;
    try {
      const query = ctx.request.query || {};
      const data = await ctx.service.article.frontAuditMessageList(query);
      this.result({ data });
    } catch (err) {
      this.result({ data: '', message: err.message, code: 300 });
    }
  }

  async edit() {
    const { ctx } = this;
    try {
      const body = ctx.request.body || {};
      await ctx.service.article.edit(body);
      this.result({ data: true, message: '操作成功' });
    } catch (err) {
      this.result({ data: '', message: err.message, code: 300 });
    }
  }

  async del() {
    const { ctx } = this;
    try {
      const body = ctx.request.body || {};
      await ctx.service.article.del(body.id);
      this.result({ data: true, message: '操作成功' });
    } catch (err) {
      this.result({ data: '', message: err.message, code: 300 });
    }
  }

  async change() {
    const { ctx } = this;
    try {
      const body = ctx.request.body || {};
      await ctx.service.article.change(body.id);
      this.result({ data: true, message: '操作成功' });
    } catch (err) {
      this.result({ data: '', message: err.message, code: 300 });
    }
  }

  /**
   * 阅读量 +1
   */
  async visitIncr() {
    const { ctx } = this;
    try {
      const body = ctx.request.body || {};
      const params = ctx.request.query || {};
      const id = body.id || params.id;
      const data = await ctx.service.article.visitIncr(id);
      this.result({ data, message: '操作成功' });
    } catch (err) {
      this.result({ data: '', message: err.message, code: 300 });
    }
  }

  /**
   * 文章收藏列表
   */
  async collectList() {
    const { ctx } = this;
    try {
      const params = ctx.request.query || {};
      const data = await ctx.service.article.collectList(params);
      this.result({ data });
    } catch (err) {
      this.result({ data: '', message: err.message, code: 300 });
    }
  }

  /**
   * 收藏切换
   */
  async collectToggle() {
    const { ctx } = this;
    try {
      const body = ctx.request.body || {};
      const data = await ctx.service.article.collectToggle(body.id);
      this.result({ data, message: data.isCollect ? '收藏成功' : '已取消收藏' });
    } catch (err) {
      this.result({ data: '', message: err.message, code: 300 });
    }
  }

  /**
   * 点赞切换
   */
  async likeToggle() {
    const { ctx } = this;
    try {
      const body = ctx.request.body || {};
      const data = await ctx.service.article.likeToggle(body.id);
      this.result({ data, message: data.isLike ? '点赞成功' : '已取消点赞' });
    } catch (err) {
      this.result({ data: '', message: err.message, code: 300 });
    }
  }

  /**
   * 批量互动统计
   */
  async stats() {
    const { ctx } = this;
    try {
      const query = ctx.request.query || {};
      const idsRaw = String(query.ids || '').trim();
      const ids = idsRaw ? idsRaw.split(',') : [];
      const data = await ctx.service.article.stats(ids);
      this.result({ data });
    } catch (err) {
      this.result({ data: '', message: err.message, code: 300 });
    }
  }

  /**
   * 文章留言列表
   */
  async commentList() {
    const { ctx } = this;
    try {
      const query = ctx.request.query || {};
      const data = await ctx.service.article.commentList(query);
      this.result({ data });
    } catch (err) {
      this.result({ data: '', message: err.message, code: 300 });
    }
  }

  /**
   * 发表文章留言
   */
  async commentAdd() {
    const { ctx } = this;
    try {
      const body = ctx.request.body || {};
      const data = await ctx.service.article.commentAdd(body);
      this.result({ data, message: '留言成功' });
    } catch (err) {
      this.result({ data: '', message: err.message, code: 300 });
    }
  }

  /**
   * 评论点赞切换
   */
  async commentLikeToggle() {
    const { ctx } = this;
    try {
      const body = ctx.request.body || {};
      const data = await ctx.service.article.commentLikeToggle(body);
      this.result({ data, message: data.isLike ? '点赞成功' : '已取消点赞' });
    } catch (err) {
      this.result({ data: '', message: err.message, code: 300 });
    }
  }

  /**
   * 前台评论举报
   */
  async commentReportAdd() {
    const { ctx } = this;
    try {
      const body = ctx.request.body || {};
      const data = await ctx.service.article.commentReportAdd(body);
      this.result({ data, message: '举报成功，我们会尽快处理' });
    } catch (err) {
      this.result({ data: '', message: err.message, code: 300 });
    }
  }

  /**
   * 后台文章评论列表
   */
  async commentManageList() {
    const { ctx } = this;
    try {
      const query = ctx.request.query || {};
      const data = await ctx.service.article.commentManageList(query);
      this.result({ data });
    } catch (err) {
      this.result({ data: '', message: err.message, code: 300 });
    }
  }

  /**
   * 后台文章评论回复列表
   */
  async commentManageReplies() {
    const { ctx } = this;
    try {
      const query = ctx.request.query || {};
      const data = await ctx.service.article.commentManageReplies(query);
      this.result({ data });
    } catch (err) {
      this.result({ data: '', message: err.message, code: 300 });
    }
  }

  /**
   * 后台文章评论状态切换
   */
  async commentManageChange() {
    const { ctx } = this;
    try {
      const body = ctx.request.body || {};
      await ctx.service.article.commentManageChange(body.id);
      this.result({ data: true, message: '操作成功' });
    } catch (err) {
      this.result({ data: '', message: err.message, code: 300 });
    }
  }

  /**
   * 评论置顶切换（作者/管理员）
   */
  async commentTopToggle() {
    const { ctx } = this;
    try {
      const body = ctx.request.body || {};
      const data = await ctx.service.article.commentTopToggle(body);
      this.result({ data, message: Number(data?.isTop || 0) === 1 ? '置顶成功' : '已取消置顶' });
    } catch (err) {
      this.result({ data: '', message: err.message, code: 300 });
    }
  }

  /**
   * 后台文章评论删除
   */
  async commentManageDel() {
    const { ctx } = this;
    try {
      const body = ctx.request.body || {};
      await ctx.service.article.commentManageDel(body.id);
      this.result({ data: true, message: '删除成功' });
    } catch (err) {
      this.result({ data: '', message: err.message, code: 300 });
    }
  }

  /**
   * 后台文章评论批量显示/隐藏
   */
  async commentManageBatchChange() {
    const { ctx } = this;
    try {
      const body = ctx.request.body || {};
      const data = await ctx.service.article.commentManageBatchChange(body);
      this.result({ data, message: '批量操作成功' });
    } catch (err) {
      this.result({ data: '', message: err.message, code: 300 });
    }
  }

  /**
   * 后台文章评论批量删除
   */
  async commentManageBatchDel() {
    const { ctx } = this;
    try {
      const body = ctx.request.body || {};
      const data = await ctx.service.article.commentManageBatchDel(body);
      this.result({ data, message: '批量删除成功' });
    } catch (err) {
      this.result({ data: '', message: err.message, code: 300 });
    }
  }

  /**
   * 后台评论敏感词配置详情
   */
  async commentManageSensitiveDetail() {
    const { ctx } = this;
    try {
      const data = await ctx.service.article.commentManageSensitiveDetail();
      this.result({ data });
    } catch (err) {
      this.result({ data: '', message: err.message, code: 300 });
    }
  }

  /**
   * 后台评论敏感词配置保存
   */
  async commentManageSensitiveSave() {
    const { ctx } = this;
    try {
      const body = ctx.request.body || {};
      const data = await ctx.service.article.commentManageSensitiveSave(body);
      this.result({ data, message: '保存成功' });
    } catch (err) {
      this.result({ data: '', message: err.message, code: 300 });
    }
  }

  /**
   * 后台评论举报列表
   */
  async commentManageReportList() {
    const { ctx } = this;
    try {
      const query = ctx.request.query || {};
      const data = await ctx.service.article.commentManageReportList(query);
      this.result({ data });
    } catch (err) {
      this.result({ data: '', message: err.message, code: 300 });
    }
  }

  /**
   * 后台评论举报处理
   */
  async commentManageReportHandle() {
    const { ctx } = this;
    try {
      const body = ctx.request.body || {};
      const data = await ctx.service.article.commentManageReportHandle(body);
      this.result({ data, message: '处理成功' });
    } catch (err) {
      this.result({ data: '', message: err.message, code: 300 });
    }
  }

  /**
   * 后台评论禁言列表
   */
  async commentManageMuteList() {
    const { ctx } = this;
    try {
      const query = ctx.request.query || {};
      const data = await ctx.service.article.commentManageMuteList(query);
      this.result({ data });
    } catch (err) {
      this.result({ data: '', message: err.message, code: 300 });
    }
  }

  /**
   * 后台新增评论禁言
   */
  async commentManageMuteAdd() {
    const { ctx } = this;
    try {
      const body = ctx.request.body || {};
      const data = await ctx.service.article.commentManageMuteAdd(body);
      this.result({ data, message: '禁言成功' });
    } catch (err) {
      this.result({ data: '', message: err.message, code: 300 });
    }
  }

  /**
   * 后台解除评论禁言
   */
  async commentManageMuteDel() {
    const { ctx } = this;
    try {
      const body = ctx.request.body || {};
      await ctx.service.article.commentManageMuteDel(body.id);
      this.result({ data: true, message: '已解除禁言' });
    } catch (err) {
      this.result({ data: '', message: err.message, code: 300 });
    }
  }

  /**
   * 公众号文章导入（按链接抓取标题/简介/正文）
   */
  async importWechat() {
    const { ctx } = this;
    try {
      const body = ctx.request.body || {};
      const url = String(body.url || '');
      const data = await ctx.service.article.importWechatArticle(url);
      this.result({ data, message: '导入成功' });
    } catch (err) {
      this.result({ data: {}, message: err.message || '导入失败', code: 300 });
    }
  }
}

module.exports = ArticleController;
