'use strict';

const baseController = require('./baseController');
const md5 = require('md5');
const {
  backstageTokenSet,
  backstageTokenKey,
  reqRoleIdKey,
} = require('../extend/config');

const LOGIN_FAIL_THRESHOLD = 5;
const LOGIN_CAPTCHA_THRESHOLD = 3;
const LOGIN_FAIL_WINDOW_SECONDS = 15 * 60;
const LOGIN_LOCK_SECONDS = 15 * 60;
const LOGIN_CAPTCHA_EXPIRE_SECONDS = 5 * 60;

class SystemController extends baseController {
  /**
   * 管理后台登录（含失败限流与验证码校验）
   */
  async login() {
    const { ctx } = this;
    const body = ctx.request.body;
    try {
      this.ctx.validate({
        username: { type: 'string', min: 2, max: 20, require: true },
        password: { type: 'string', min: 6, max: 20, require: true },
      });
      const username = String(body.username || '').trim();
      const riskState = await this.getLoginRiskState(username);
      if (riskState.lockSeconds > 0) {
        this.result({
          data: {
            ...riskState,
            locked: true,
            captchaRequired: true,
          },
          message: `登录失败次数过多，请${riskState.lockSeconds}秒后再试`,
          code: 1002,
        });
        return;
      }
      if (riskState.needCaptcha) {
        const captchaCheck = await this.verifyLoginCaptcha({
          username,
          captchaId: body.captchaId,
          captchaAnswer: body.captchaAnswer,
        });
        if (!captchaCheck.ok) {
          await this.respondLoginFailed(username, captchaCheck.message || '验证码错误', {
            captchaRequired: true,
            refreshCaptcha: true,
            captchaInvalid: true,
          });
          return;
        }
      }

      const sysAdmin = await ctx.model.SystemAuthAdmin.findOne({
        where: {
          username,
        },
      });
      if (!sysAdmin) {
        await this.respondLoginFailed(username, '没有找到该用户', {
          captchaRequired: true,
          refreshCaptcha: true,
        });
        return;
      }
      if (sysAdmin.is_delete === 1) {
        await this.respondLoginFailed(username, '该账户已被删除', {
          captchaRequired: true,
          refreshCaptcha: true,
        });
        return;
      }
      if (sysAdmin.is_disable === 1) {
        await this.respondLoginFailed(username, '该账户已被禁用', {
          captchaRequired: true,
          refreshCaptcha: true,
        });
        return;
      }
      const md5Pwd = md5(body.password + sysAdmin.salt);
      if (sysAdmin.password !== md5Pwd) {
        await this.respondLoginFailed(username, '密码错误', {
          captchaRequired: true,
          refreshCaptcha: true,
        });
        return;
      }
      const token = ctx.setToken({ password: body.password, username });
      const adminIdStr = String(sysAdmin.id);

      // 非多次登录
      if (sysAdmin.is_multipoint === 0) {
        const sysAdminSetKey = backstageTokenSet + adminIdStr;
        const ts = ctx.service.redis.sGet(sysAdminSetKey);
        if (ts.length > 0) {
          const keys = [];
          for (const t of ts) {
            keys.push(t);
          }
          ctx.service.redis.del(keys);
        }
        ctx.service.redis.del(sysAdminSetKey);
        ctx.service.redis.sSet(sysAdminSetKey, token);
      }

      // 缓存登录信息
      ctx.service.redis.set(backstageTokenKey + token, adminIdStr, 7200);
      ctx.service.authAdmin.cacheAdminUserByUid(sysAdmin.id);
      await this.clearLoginRiskState(username);

      // 更新登录信息
      const dateTime = Math.floor(Date.now() / 1000);
      await ctx.model.SystemAuthAdmin.update({
        last_login_ip: ctx.request.ip,
        last_login_time: dateTime,
        update_time: dateTime,
      }, {
        where: {
          id: sysAdmin.id,
        },
      });

      // 记录登录日志
      const resultLog = await ctx.service.authAdmin.recordLoginLog(sysAdmin.id, body.username, '');
      if (!resultLog) {
        this.result({ data: '', message: '请求错误', code: 1002 });
        return;
      }

      this.result({
        data: {
          token,
        },
      });
    } catch (err) {
      const { errors = [] } = err || {};
      const errorMessage = String(
        (Array.isArray(errors) && errors[0] && errors[0].message) || err.message || '参数错误'
      ).trim();
      this.result({ data: '', message: errorMessage, code: 1001 });
    }
  }

  /**
   * 获取管理后台登录验证码题目
   */
  async loginCaptcha() {
    const { ctx } = this;
    const body = ctx.request.body || {};
    const username = String(body.username || '').trim();
    try {
      this.ctx.validate({
        username: { type: 'string', min: 2, max: 20, require: true },
      });
      const data = await this.createLoginCaptcha(username);
      this.result({ data });
    } catch (err) {
      const { errors = [] } = err || {};
      const errorMessage = String(
        (Array.isArray(errors) && errors[0] && errors[0].message) || err.message || '参数错误'
      ).trim();
      this.result({ data: '', message: errorMessage, code: 1001 });
    }
  }

  /**
   * 构建登录保护缓存键
   */
  buildLoginGuardKeys(username = '') {
    const { ctx } = this;
    const normalizeUsername = String(username || '').trim().toLowerCase();
    const ip = this.getClientIp();
    const userAgent = String(ctx.request.header['user-agent'] || '').trim().toLowerCase();
    const fingerprint = md5(`${normalizeUsername}|${ip}|${userAgent}`);
    return {
      failKey: `system:login:fail:${fingerprint}`,
      lockKey: `system:login:lock:${fingerprint}`,
    };
  }

  /**
   * 获取当前请求来源 IP（统一格式）
   */
  getClientIp() {
    const { ctx } = this;
    let ip = String(ctx.request.ip || '').trim();
    if (!ip) return '0.0.0.0';
    if (ip === '::1') return '127.0.0.1';
    if (ip.startsWith('::ffff:')) {
      ip = ip.replace('::ffff:', '');
    }
    return ip || '0.0.0.0';
  }

  /**
   * 获取当前账号的登录风险状态
   */
  async getLoginRiskState(username = '') {
    const { ctx } = this;
    const { failKey, lockKey } = this.buildLoginGuardKeys(username);
    try {
      const failCountRaw = await ctx.service.redis.get(failKey);
      const failCount = Number(failCountRaw || 0) || 0;
      const lockExists = await ctx.service.redis.exists(lockKey);
      let lockSeconds = 0;
      if (Number(lockExists || 0) > 0) {
        lockSeconds = Number(await ctx.service.redis.ttl(lockKey)) || 0;
        if (lockSeconds < 0) {
          lockSeconds = LOGIN_LOCK_SECONDS;
        }
      }
      return {
        failCount,
        lockSeconds,
        needCaptcha: failCount >= LOGIN_CAPTCHA_THRESHOLD || lockSeconds > 0,
      };
    } catch (err) {
      ctx.logger.error(`systemController.getLoginRiskState error: ${err}`);
      return {
        failCount: 0,
        lockSeconds: 0,
        needCaptcha: false,
      };
    }
  }

  /**
   * 记录登录失败次数，并按阈值触发锁定
   */
  async markLoginFailed(username = '') {
    const { ctx } = this;
    const { failKey, lockKey } = this.buildLoginGuardKeys(username);
    try {
      const oldFailCount = Number(await ctx.service.redis.get(failKey)) || 0;
      const failCount = oldFailCount + 1;
      await ctx.service.redis.set(failKey, failCount, LOGIN_FAIL_WINDOW_SECONDS);
      let lockSeconds = 0;
      if (failCount >= LOGIN_FAIL_THRESHOLD) {
        await ctx.service.redis.set(lockKey, 1, LOGIN_LOCK_SECONDS);
        lockSeconds = LOGIN_LOCK_SECONDS;
      }
      return {
        failCount,
        lockSeconds,
        needCaptcha: failCount >= LOGIN_CAPTCHA_THRESHOLD || lockSeconds > 0,
      };
    } catch (err) {
      ctx.logger.error(`systemController.markLoginFailed error: ${err}`);
      return {
        failCount: 0,
        lockSeconds: 0,
        needCaptcha: false,
      };
    }
  }

  /**
   * 清理当前账号的登录失败缓存
   */
  async clearLoginRiskState(username = '') {
    const { ctx } = this;
    const { failKey, lockKey } = this.buildLoginGuardKeys(username);
    try {
      await ctx.service.redis.del(failKey);
      await ctx.service.redis.del(lockKey);
    } catch (err) {
      ctx.logger.error(`systemController.clearLoginRiskState error: ${err}`);
    }
  }

  /**
   * 统一返回登录失败结果（包含风控状态）
   */
  async respondLoginFailed(username, message, extraData = {}) {
    const riskState = await this.markLoginFailed(username);
    const locked = Number(riskState.lockSeconds || 0) > 0;
    this.result({
      data: {
        ...riskState,
        locked,
        ...extraData,
      },
      message: locked ? `登录失败次数过多，请${riskState.lockSeconds}秒后再试` : String(message || '登录失败'),
      code: 1002,
    });
  }

  /**
   * 生成并缓存登录验证码题目
   */
  async createLoginCaptcha(username = '') {
    const { ctx } = this;
    const a = Math.floor(Math.random() * 9) + 1;
    const b = Math.floor(Math.random() * 9) + 1;
    const operators = [ '+', '-', '*' ];
    const operator = operators[Math.floor(Math.random() * operators.length)];
    let left = a;
    let right = b;
    if (operator === '-' && a < b) {
      left = b;
      right = a;
    }
    const answer = operator === '+'
      ? left + right
      : operator === '-'
        ? left - right
        : left * right;
    const captchaId = `${Date.now()}_${ctx.randomString()}`;
    const cacheKey = `system:login:captcha:${captchaId}`;
    const { failKey } = this.buildLoginGuardKeys(username);
    await ctx.service.redis.set(cacheKey, {
      answer: String(answer),
      failKey,
      createTime: Math.floor(Date.now() / 1000),
    }, LOGIN_CAPTCHA_EXPIRE_SECONDS);
    return {
      captchaId,
      question: `${left} ${operator} ${right} = ?`,
      expireSeconds: LOGIN_CAPTCHA_EXPIRE_SECONDS,
    };
  }

  /**
   * 校验登录验证码
   */
  async verifyLoginCaptcha({ username = '', captchaId = '', captchaAnswer = '' }) {
    const { ctx } = this;
    const id = String(captchaId || '').trim();
    const answer = String(captchaAnswer || '').trim();
    if (!id || !answer) {
      return {
        ok: false,
        message: '请输入验证码',
      };
    }
    const cacheKey = `system:login:captcha:${id}`;
    const cached = await ctx.service.redis.get(cacheKey);
    if (!cached) {
      return {
        ok: false,
        message: '验证码已过期，请刷新后重试',
      };
    }
    const { failKey } = this.buildLoginGuardKeys(username);
    if (String(cached.failKey || '') !== String(failKey)) {
      await ctx.service.redis.del(cacheKey);
      return {
        ok: false,
        message: '验证码已失效，请刷新后重试',
      };
    }
    if (String(cached.answer || '') !== answer) {
      return {
        ok: false,
        message: '验证码错误，请重试',
      };
    }
    await ctx.service.redis.del(cacheKey);
    return {
      ok: true,
    };
  }

  async menusRoute() {
    const { ctx } = this;
    const roleId = ctx.session[reqRoleIdKey];
    const data = await ctx.service.authAdmin.selectMenuByRoleId(roleId);
    this.result({
      data,
    });
  }

  async console() {
    const { ctx } = this;
    try {
      const data = await ctx.service.common.getConsole();
      this.result({
        data,
      });
    } catch (err) {
      ctx.logger.error(`systemController.console error: ${err}`);
    }
  }

  async configInfo() {
    const { ctx } = this;
    try {
      const data = await ctx.service.common.getConfig();
      this.result({
        data,
      });
    } catch (err) {
      ctx.logger.error(`systemController.config error: ${err}`);
    }
  }

  async logout() {
    const { ctx } = this;
    const { req } = ctx;
    try {
      ctx.service.redis.del(backstageTokenKey + req.token);
      this.result({ data: '' });
    } catch (err) {
      ctx.logger.error(`systemController.logout error: ${err}`);
    }
  }

  async siteIpInfo() {
    const { data, error } = await this.ctx.service.user.ipInfo();
    if (error) {
      this.result({ data: '', message: error, code: 1001 });
    } else {
      this.result({ data });
    }
  }
}

module.exports = SystemController;
