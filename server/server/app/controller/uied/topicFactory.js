/**
 * @file controller/uied/topicFactory.js
 * @description UIED 专题页工厂控制器
 * @author UIED技术团队
 * @copyright Tomda (https://www.tomda.top)
 * @copyright UIED技术团队 (https://fsuied.com)
 * @createDate 2026-02-21
 */

'use strict';

const baseController = require('../baseController');

class TopicFactoryController extends baseController {
  /**
   * 获取模板列表
   */
  async templateList() {
    const { ctx } = this;
    const includeDisabled = String(ctx.query?.includeDisabled || '1').trim() === '1';
    try {
      const list = await ctx.service.uied.topicFactory.listTemplates({ includeDisabled });
      this.result({
        data: {
          list,
          total: Array.isArray(list) ? list.length : 0,
        },
      });
    } catch (error) {
      ctx.logger.error('获取专题模板列表失败:', error);
      this.result({ code: 500, message: error.message || '获取专题模板列表失败' });
    }
  }

  /**
   * 获取模板详情
   */
  async templateDetail() {
    const { ctx } = this;
    const id = Number(ctx.query?.id || 0);
    const templateKey = String(ctx.query?.templateKey || '').trim();
    if (!id && !templateKey) {
      this.result({ code: 400, message: '请提供 id 或 templateKey' });
      return;
    }
    try {
      const data = await ctx.service.uied.topicFactory.detailTemplate({
        id: id || undefined,
        templateKey: templateKey || undefined,
      });
      if (!data) {
        this.result({ code: 404, message: '模板不存在' });
        return;
      }
      this.result({ data });
    } catch (error) {
      ctx.logger.error('获取专题模板详情失败:', error);
      this.result({ code: 500, message: error.message || '获取专题模板详情失败' });
    }
  }

  /**
   * 保存模板
   */
  async templateSave() {
    const { ctx } = this;
    const body = ctx.request.body || {};
    try {
      const data = await ctx.service.uied.topicFactory.saveTemplate(body);
      this.result({ data, message: '保存成功' });
    } catch (error) {
      ctx.logger.error('保存专题模板失败:', error);
      this.result({ code: 500, message: error.message || '保存专题模板失败' });
    }
  }

  /**
   * 删除模板
   */
  async templateDel() {
    const { ctx } = this;
    const id = Number(ctx.request.body?.id || 0);
    if (!id) {
      this.result({ code: 400, message: '缺少模板ID' });
      return;
    }
    try {
      const data = await ctx.service.uied.topicFactory.delTemplate(id);
      this.result({ data, message: '删除成功' });
    } catch (error) {
      ctx.logger.error('删除专题模板失败:', error);
      this.result({ code: 500, message: error.message || '删除专题模板失败' });
    }
  }

  /**
   * 预览创建结果
   */
  async preview() {
    const { ctx } = this;
    const body = ctx.request.body || {};
    const payload = Object.keys(body).length > 0 ? body : (ctx.query || {});
    try {
      const data = await ctx.service.uied.topicFactory.previewCreate(payload);
      this.result({ data });
    } catch (error) {
      ctx.logger.error('预览专题模板失败:', error);
      this.result({ code: 500, message: error.message || '预览专题模板失败' });
    }
  }

  /**
   * 一键创建专题页
   */
  async createFromTemplate() {
    const { ctx } = this;
    const body = ctx.request.body || {};
    if (!body.templateKey && !body.templateId) {
      this.result({ code: 400, message: '请选择模板' });
      return;
    }
    if (!body.pageName) {
      this.result({ code: 400, message: '请填写专题名称' });
      return;
    }
    try {
      const data = await ctx.service.uied.topicFactory.createFromTemplate(body);
      this.result({ data, message: '创建成功' });
    } catch (error) {
      ctx.logger.error('创建专题页失败:', error);
      this.result({ code: 500, message: error.message || '创建专题页失败' });
    }
  }

  /**
   * 获取字段草案
   */
  async schema() {
    const { ctx } = this;
    try {
      const [ draft, templates ] = await Promise.all([
        ctx.service.uied.topicFactory.getFieldDraft(),
        ctx.service.uied.topicFactory.listTemplates({ includeDisabled: true }),
      ]);
      this.result({
        data: {
          draft,
          templates,
        },
      });
    } catch (error) {
      ctx.logger.error('获取专题页工厂字段草案失败:', error);
      this.result({ code: 500, message: error.message || '获取专题页工厂字段草案失败' });
    }
  }
}

module.exports = TopicFactoryController;
