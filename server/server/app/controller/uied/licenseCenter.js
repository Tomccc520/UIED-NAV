/**
 * @file controller/uied/licenseCenter.js
 * @description 商业版许可证与功能能力控制器
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

'use strict';

const baseController = require('../baseController');

class LicenseCenterController extends baseController {
  /**
   * 获取许可证信息（前端可读）
   */
  async info() {
    const { ctx } = this;
    try {
      const licenseInfo = await ctx.service.uied.licenseCenter.getLicenseInfo();
      this.result({ data: licenseInfo });
    } catch (error) {
      ctx.logger.error('获取许可证信息失败:', error);
      this.result({ code: 500, message: '获取许可证信息失败' });
    }
  }

  /**
   * 保存许可证信息（后台管理）
   */
  async save() {
    const { ctx } = this;
    try {
      const body = ctx.request.body || {};
      const data = await ctx.service.uied.licenseCenter.saveLicenseInfo(body);
      this.result({ data, message: '保存成功' });
    } catch (error) {
      ctx.logger.error('保存许可证信息失败:', error);
      this.result({ code: 500, message: error.message || '保存许可证信息失败' });
    }
  }

  /**
   * 生成许可证签名数据（不落库）
   */
  async sign() {
    const { ctx } = this;
    try {
      const payload = {
        ...(ctx.request.body || {}),
        ...(ctx.query || {}),
      };
      const data = await ctx.service.uied.licenseCenter.buildSignedLicense(payload);
      this.result({ data, message: '签发成功' });
    } catch (error) {
      ctx.logger.error('签发许可证失败:', error);
      this.result({ code: 500, message: error.message || '签发许可证失败' });
    }
  }

  /**
   * 校验许可证签名（用于导入前验签）
   */
  async verify() {
    const { ctx } = this;
    try {
      const payload = {
        ...(ctx.request.body || {}),
        ...(ctx.query || {}),
      };
      const data = await ctx.service.uied.licenseCenter.verifyLicensePayload(payload);
      this.result({ data });
    } catch (error) {
      ctx.logger.error('校验许可证失败:', error);
      this.result({ code: 500, message: error.message || '校验许可证失败' });
    }
  }

  /**
   * 获取功能列表（前端可读）
   */
  async featureList() {
    const { ctx } = this;
    try {
      const data = await ctx.service.uied.licenseCenter.getFeatureList();
      this.result({ data });
    } catch (error) {
      ctx.logger.error('获取功能列表失败:', error);
      this.result({ code: 500, message: '获取功能列表失败' });
    }
  }

  /**
   * 保存功能覆盖开关（后台管理）
   */
  async saveFeature() {
    const { ctx } = this;
    try {
      const body = ctx.request.body || {};
      const overrides = body.overrides && typeof body.overrides === 'object'
        ? body.overrides
        : body;
      const data = await ctx.service.uied.licenseCenter.saveFeatureOverrides(overrides);
      this.result({ data, message: '保存成功' });
    } catch (error) {
      ctx.logger.error('保存功能开关失败:', error);
      this.result({ code: 500, message: error.message || '保存功能开关失败' });
    }
  }

  /**
   * 检查单个功能是否可用（前端 hasFeature）
   */
  async featureCheck() {
    const { ctx } = this;
    try {
      const key = String(
        ctx.request.query?.key
        || ctx.request.query?.feature
        || ctx.request.body?.key
        || ctx.request.body?.feature
        || ''
      ).trim();
      if (!key) {
        return this.result({ code: 1001, message: 'feature 参数不能为空' });
      }
      const enabled = await ctx.service.uied.licenseCenter.hasFeature(key);
      const licenseInfo = await ctx.service.uied.licenseCenter.getLicenseInfo();
      this.result({
        data: {
          key,
          enabled,
          edition: licenseInfo.effectiveEdition,
          isActive: licenseInfo.isActive,
          isExpired: licenseInfo.isExpired,
        },
      });
    } catch (error) {
      ctx.logger.error('检查功能开关失败:', error);
      this.result({ code: 500, message: '检查功能开关失败' });
    }
  }

  /**
   * 获取商业版模式配置
   */
  async commercialMode() {
    const { ctx } = this;
    try {
      const data = await ctx.service.uied.licenseCenter.getCommercialMode();
      this.result({ data });
    } catch (error) {
      ctx.logger.error('获取商业版模式失败:', error);
      this.result({ code: 500, message: '获取商业版模式失败' });
    }
  }

  /**
   * 保存商业版模式配置
   */
  async saveCommercialMode() {
    const { ctx } = this;
    try {
      const body = ctx.request.body || {};
      const data = await ctx.service.uied.licenseCenter.saveCommercialMode(body);
      this.result({ data, message: '保存成功' });
    } catch (error) {
      ctx.logger.error('保存商业版模式失败:', error);
      this.result({ code: 500, message: error.message || '保存商业版模式失败' });
    }
  }

  /**
   * 获取商业版总览（用于后台运营排查）
   */
  async overview() {
    const { ctx } = this;
    try {
      const data = await ctx.service.uied.licenseCenter.getCommercialOverview();
      this.result({ data });
    } catch (error) {
      ctx.logger.error('获取商业版总览失败:', error);
      this.result({ code: 500, message: error.message || '获取商业版总览失败' });
    }
  }
}

module.exports = LicenseCenterController;
