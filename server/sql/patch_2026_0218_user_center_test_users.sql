-- ============================================
-- UIED 用户中心测试用户初始化脚本（可重复执行）
-- 账号密码（测试环境）：
--   账号1: uied_test_buyer / 123456
--   账号2: uied_test_author / 123456
-- ============================================

-- 1) 兼容历史库：用户身份表
CREATE TABLE IF NOT EXISTS `la_user_identity` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int unsigned NOT NULL DEFAULT 0,
  `user_type` tinyint unsigned NOT NULL DEFAULT 0 COMMENT '0普通用户 1作者 2编辑',
  `is_delete` tinyint unsigned NOT NULL DEFAULT 0,
  `create_time` int unsigned NOT NULL DEFAULT 0,
  `update_time` int unsigned NOT NULL DEFAULT 0,
  `delete_time` int unsigned NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_id` (`user_id`),
  KEY `idx_user_type` (`user_type`,`is_delete`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2) 兼容历史库：作者资料表
CREATE TABLE IF NOT EXISTS `la_user_author_profile` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int unsigned NOT NULL DEFAULT 0,
  `display_name` varchar(64) NOT NULL DEFAULT '',
  `bio` varchar(255) NOT NULL DEFAULT '',
  `homepage` varchar(200) NOT NULL DEFAULT '',
  `xiaohongshu` varchar(200) NOT NULL DEFAULT '',
  `weibo` varchar(200) NOT NULL DEFAULT '',
  `is_public` tinyint unsigned NOT NULL DEFAULT 1,
  `is_delete` tinyint unsigned NOT NULL DEFAULT 0,
  `create_time` int unsigned NOT NULL DEFAULT 0,
  `update_time` int unsigned NOT NULL DEFAULT 0,
  `delete_time` int unsigned NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_id` (`user_id`),
  KEY `idx_is_public` (`is_public`,`is_delete`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3) 初始化测试普通用户（密码: 123456 -> md5）
INSERT INTO `la_user` (
  `sn`,`avatar`,`real_name`,`nickname`,`username`,`password`,`mobile`,`salt`,`sex`,`channel`,`is_disable`,`is_delete`,`last_login_ip`,`last_login_time`,`create_time`,`update_time`,`delete_time`
)
SELECT
  0,
  '/api/static/default_avatar.png',
  '测试用户A',
  '测试用户A',
  'uied_test_buyer',
  'e10adc3949ba59abbe56e057f20f883e',
  '13900000001',
  '',
  0,
  4,
  0,
  0,
  '',
  0,
  UNIX_TIMESTAMP(),
  UNIX_TIMESTAMP(),
  0
FROM DUAL
WHERE NOT EXISTS (
  SELECT 1 FROM `la_user` WHERE `username` = 'uied_test_buyer' OR `mobile` = '13900000001'
);

-- 4) 初始化测试作者用户（密码: 123456 -> md5）
INSERT INTO `la_user` (
  `sn`,`avatar`,`real_name`,`nickname`,`username`,`password`,`mobile`,`salt`,`sex`,`channel`,`is_disable`,`is_delete`,`last_login_ip`,`last_login_time`,`create_time`,`update_time`,`delete_time`
)
SELECT
  0,
  '/api/static/default_avatar.png',
  '测试作者B',
  '测试作者B',
  'uied_test_author',
  'e10adc3949ba59abbe56e057f20f883e',
  '13900000002',
  '',
  0,
  4,
  0,
  0,
  '',
  0,
  UNIX_TIMESTAMP(),
  UNIX_TIMESTAMP(),
  0
FROM DUAL
WHERE NOT EXISTS (
  SELECT 1 FROM `la_user` WHERE `username` = 'uied_test_author' OR `mobile` = '13900000002'
);

-- 5) 修正 sn（历史兼容：为空时回填为 id）
UPDATE `la_user`
SET `sn` = `id`, `update_time` = UNIX_TIMESTAMP()
WHERE `sn` = 0 AND `username` IN ('uied_test_buyer', 'uied_test_author');

-- 6) 标记作者身份（uied_test_author -> 作者）
INSERT INTO `la_user_identity` (`user_id`,`user_type`,`is_delete`,`create_time`,`update_time`,`delete_time`)
SELECT `id`, 1, 0, UNIX_TIMESTAMP(), UNIX_TIMESTAMP(), 0
FROM `la_user`
WHERE `username` = 'uied_test_author'
ON DUPLICATE KEY UPDATE
  `user_type` = VALUES(`user_type`),
  `is_delete` = 0,
  `update_time` = UNIX_TIMESTAMP(),
  `delete_time` = 0;

-- 7) 初始化作者公开资料
INSERT INTO `la_user_author_profile` (`user_id`,`display_name`,`bio`,`homepage`,`xiaohongshu`,`weibo`,`is_public`,`is_delete`,`create_time`,`update_time`,`delete_time`)
SELECT `id`, '测试作者B', '这是用于用户中心联调的测试作者账号。', '', '', '', 1, 0, UNIX_TIMESTAMP(), UNIX_TIMESTAMP(), 0
FROM `la_user`
WHERE `username` = 'uied_test_author'
ON DUPLICATE KEY UPDATE
  `display_name` = VALUES(`display_name`),
  `bio` = VALUES(`bio`),
  `is_public` = 1,
  `is_delete` = 0,
  `update_time` = UNIX_TIMESTAMP(),
  `delete_time` = 0;
