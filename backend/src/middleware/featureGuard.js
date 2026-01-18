/**
 * @file middleware/featureGuard.js
 * @description 功能权限中间件 - 保护 Pro 功能路由
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

const { hasFeature, getRequiredVersion } = require('../config/features');

/**
 * 功能权限检查中间件
 * 用于保护需要特定许可证的 API 路由
 * 
 * @param {string} featureName - 功能名称（来自 features.js 的 FEATURES 配置）
 * @returns {Function} Express 中间件函数
 * 
 * @example
 * // 保护评分功能路由
 * router.post('/websites/:id/rate', requireFeature('ratings'), ratingController);
 */
function requireFeature(featureName) {
  return async (req, res, next) => {
    try {
      // 获取许可证信息（从请求中获取，如果没有则默认为免费版）
      // 在实际应用中，这里应该从数据库或缓存中获取许可证信息
      // 开源版：默认所有功能都可用（license.type = 'free'）
      const license = req.license || { type: 'free', features: [] };
      
      // 检查是否有权限使用该功能
      if (!hasFeature(license, featureName)) {
        const requiredVersion = getRequiredVersion(featureName);
        
        return res.status(403).json({
          success: false,
          message: `此功能需要 ${requiredVersion}`,
          error: {
            code: 'FEATURE_NOT_AVAILABLE',
            feature: featureName,
            currentVersion: license.type || 'free',
            requiredVersion: requiredVersion,
          },
        });
      }
      
      // 有权限，继续执行
      next();
    } catch (error) {
      console.error('功能权限检查失败:', error);
      res.status(500).json({
        success: false,
        message: '权限检查失败',
        error: {
          code: 'PERMISSION_CHECK_ERROR',
        },
      });
    }
  };
}

/**
 * 许可证加载中间件
 * 从请求中提取并加载许可证信息
 * 应该在所有需要许可证检查的路由之前使用
 * 
 * @example
 * app.use('/api', loadLicense);
 */
async function loadLicense(req, res, next) {
  try {
    // TODO: 实现许可证加载逻辑
    // 1. 从请求头、Cookie 或 Session 中获取许可证标识
    // 2. 从数据库或缓存中查询许可证信息
    // 3. 验证许可证有效性（是否过期、是否被禁用等）
    
    // 开源版默认实现：所有用户都是免费版
    req.license = {
      type: 'free',
      features: [],
    };
    
    // @pro-feature-start: license-loading
    // 商业版实现示例：
    // const licenseKey = req.headers['x-license-key'] || req.cookies.licenseKey;
    // if (licenseKey) {
    //   const license = await prisma.license.findUnique({
    //     where: { key: licenseKey },
    //   });
    //   
    //   if (license && license.status === 'active' && new Date(license.expiresAt) > new Date()) {
    //     req.license = {
    //       type: license.type,
    //       features: getFeaturesForLicense(license.type),
    //       expiresAt: license.expiresAt,
    //     };
    //   }
    // }
    // @pro-feature-end: license-loading
    
    next();
  } catch (error) {
    console.error('许可证加载失败:', error);
    // 加载失败时默认为免费版
    req.license = {
      type: 'free',
      features: [],
    };
    next();
  }
}

/**
 * 检查是否为 Pro 用户（个人版或企业版）
 * @returns {Function} Express 中间件函数
 */
function requirePro() {
  return async (req, res, next) => {
    const license = req.license || { type: 'free' };
    
    if (license.type === 'free') {
      return res.status(403).json({
        success: false,
        message: '此功能需要升级到个人版或企业版',
        error: {
          code: 'PRO_VERSION_REQUIRED',
          currentVersion: 'free',
        },
      });
    }
    
    next();
  };
}

/**
 * 检查是否为企业版用户
 * @returns {Function} Express 中间件函数
 */
function requireEnterprise() {
  return async (req, res, next) => {
    const license = req.license || { type: 'free' };
    
    if (license.type !== 'enterprise') {
      return res.status(403).json({
        success: false,
        message: '此功能需要企业版',
        error: {
          code: 'ENTERPRISE_VERSION_REQUIRED',
          currentVersion: license.type || 'free',
        },
      });
    }
    
    next();
  };
}

module.exports = {
  requireFeature,
  loadLicense,
  requirePro,
  requireEnterprise,
};
