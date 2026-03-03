'use strict';

const Service = require('egg').Service;
const { version, publicUrl } = require('../extend/config');
const util = require('../util/urlUtil');

class CommonService extends Service {
  /**
   * 获取控制台工作台数据
   * @return {Promise<object>}
   */
  async getConsole() {
    try {
      // 版本信息
      const name = await this.getVal('website', 'name', 'UIED 导航管理系统');
      const versionInfo = {
        name,
        version,
        website: 'www.tomda.top',
        based: 'Vue3.x、Element Plus、Egg.js、MySQL',
        channel: {
          website: 'https://www.tomda.top',
          docs: 'https://fsuied.com',
        },
      };

      // 今日数据
      const today = {
        time: '2022-08-11 15:08:29',
        todayVisits: 10,
        totalVisits: 100,
        todaySales: 30,
        totalSales: 65,
        todayOrder: 12,
        totalOrder: 255,
        todayUsers: 120,
        totalUsers: 360,
      };

      // 访客图表
      const now = new Date();
      const date = [];
      for (let i = 14; i >= 0; i--) {
        const currentDate = new Date(now); // 创建新的 Date 对象保存当前日期
        currentDate.setDate(currentDate.getDate() - i); // 设置日期
        date.push(currentDate.toISOString().split('T')[0]);
      }
      const visitor = {
        date,
        list: [ 12, 13, 11, 5, 8, 22, 14, 9, 456, 62, 78, 12, 18, 22, 46 ],
      };

      return {
        version: versionInfo,
        today,
        visitor,
      };
    } catch (err) {
      throw new Error(`IndexService.console error: ${err}`);
    }
  }

  /**
   * 获取后台站点配置
   * @return {Promise<object>}
   */
  async getConfig() {
    try {
      const website = await this.get('website');
      const copyrightStr = await this.getVal('website', 'copyright', '');
      let copyright = [];
      if (copyrightStr) {
        copyright = JSON.parse(copyrightStr);
      }
      return {
        webName: website.name,
        webLogo: util.toAbsoluteUrl(website.logo),
        webFavicon: util.toAbsoluteUrl(website.favicon),
        webBackdrop: util.toAbsoluteUrl(website.backdrop),
        ossDomain: publicUrl,
        copyright,
      };
    } catch (err) {
      throw new Error(`IndexService.config error: ${err}`);
    }
  }

  /**
   * 获取指定配置值（支持默认值）
   * @param {string} cnfType
   * @param {string} name
   * @param {any} defaultVal
   * @return {Promise<any>}
   */
  async getVal(cnfType, name, defaultVal) {
    try {
      const config = await this.get(cnfType, name);
      let data = config[name];
      if (!data) {
        data = defaultVal;
      }
      return data;
    } catch (err) {
      throw new Error(`ConfigUtilService.getVal error: ${err}`);
    }
  }

  /**
   * 获取指定配置并解析为对象
   * @param {string} cnfType
   * @param {string} name
   * @return {Promise<object>}
   */
  async getMap(cnfType, name) {
    try {
      const val = await this.getVal(cnfType, name, '');
      if (val === '') {
        return {};
      }
      const data = JSON.parse(val);
      return data;
    } catch (err) {
      throw new Error(`ConfigUtilService.getMap error: ${err}`);
    }
  }

  /**
   * 查询配置项
   * @param {string} cnfType
   * @param {string} name
   * @return {Promise<object>}
   */
  async get(cnfType, name) {
    const { ctx } = this;
    try {
      const object = {
        type: cnfType,
        ...(name && { name }),
      };
      const configs = await ctx.model.SystemConfig.findAll({
        where: object,
      });
      const data = {};
      for (const config of configs) {
        data[config.name] = config.value;
      }
      return data;
    } catch (err) {
      throw new Error(`ConfigUtilService.get error: ${err}`);
    }
  }

  /**
   * 保存单个配置项
   * @param {string} cnfType
   * @param {string} name
   * @param {string} val
   * @return {Promise<void>}
   */
  async set(cnfType, name, val) {
    const { ctx } = this;
    const { SystemConfig } = ctx.model;

    try {
      let config = await SystemConfig.findOne({
        where: { type: cnfType, name },
      });

      if (!config) {
        config = await SystemConfig.create({ type: cnfType, name });
      }

      await config.update({ value: val });

      ctx.status = 200;
    } catch (err) {
      throw new Error('Internal server error');
    }
  }
}


module.exports = CommonService;
