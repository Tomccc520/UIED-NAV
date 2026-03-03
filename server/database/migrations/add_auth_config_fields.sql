/**
 * @copyright Tomda (https://www.tomda.top)
 * @copyright UIED技术团队 (https://fsuied.com)
 * @author UIED技术团队
 * @createDate 2026.3.2
 */

-- 添加注册/登录开关配置字段
ALTER TABLE `uied_site_setting` 
ADD COLUMN `enable_register` TINYINT(1) DEFAULT 1 COMMENT '是否开启注册 0=关闭 1=开启' AFTER `id`,
ADD COLUMN `enable_login` TINYINT(1) DEFAULT 1 COMMENT '是否开启登录 0=关闭 1=开启' AFTER `enable_register`,
ADD COLUMN `register_close_message` VARCHAR(255) DEFAULT '注册功能暂时关闭' COMMENT '注册关闭提示' AFTER `enable_register`,
ADD COLUMN `login_close_message` VARCHAR(255) DEFAULT '系统维护中，暂时无法登录' COMMENT '登录关闭提示' AFTER `enable_login`;

-- 如果表中没有记录，插入默认配置
INSERT INTO `uied_site_setting` (`enable_register`, `enable_login`, `register_close_message`, `login_close_message`, `create_time`, `update_time`) 
SELECT 1, 1, '注册功能暂时关闭，请稍后再试', '系统维护中，暂时无法登录', UNIX_TIMESTAMP(), UNIX_TIMESTAMP()
WHERE NOT EXISTS (SELECT 1 FROM `uied_site_setting` LIMIT 1);

