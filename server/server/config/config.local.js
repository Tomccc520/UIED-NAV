/**
 * @file config/config.local.js
 * @description 本地开发环境配置
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

module.exports = appInfo => {
    const config = {}
    
    // 修改端口避免冲突
    config.cluster = {
        listen: {
            path: '',
            port: 8002,  // 使用 8002 端口
            hostname: '0.0.0.0',
        },
    }
    
    // MySQL 数据库配置
    config.sequelize = {
        dialect: 'mysql',
        host: '127.0.0.1',
        port: 3308,  // Docker MySQL 端口
        username: 'uied',
        password: 'uied123456',
        database: 'uied_nav',
        define: {
            timestamps: true,
            paranoid: false,
            freezeTableName: true,
            underscored: false
        },
        timezone: '+08:00',
        dialectOptions: {
            dateStrings: true,
            typeCast: true
        }
    }

    // Redis 配置
    config.redis = {
        client: {
            port: 6380,  // Docker Redis 端口
            host: '127.0.0.1',
            password: '',
            db: 0
        }
    }

    return config
}
