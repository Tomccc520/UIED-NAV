-- ============================================
-- UIED 用户中心补丁：新增 Free/Pro 测试用户（可重复执行）
-- 账号密码（测试环境）：
--   uied_test_free / 123456
--   uied_test_pro  / 123456
-- ============================================

SET NAMES utf8mb4;
START TRANSACTION;

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

-- 3) 新增/恢复 Free 测试用户
INSERT INTO `la_user` (
  `sn`,`avatar`,`real_name`,`nickname`,`username`,`password`,`mobile`,`salt`,`sex`,`channel`,`is_disable`,`is_delete`,`last_login_ip`,`last_login_time`,`create_time`,`update_time`,`delete_time`
)
SELECT
  0,
  '/api/static/default_avatar.png',
  '测试用户-Free',
  '测试用户-Free',
  'uied_test_free',
  'e10adc3949ba59abbe56e057f20f883e',
  '13900001001',
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
  SELECT 1 FROM `la_user` WHERE `username` = 'uied_test_free'
);

UPDATE `la_user`
SET
  `avatar` = '/api/static/default_avatar.png',
  `real_name` = '测试用户-Free',
  `nickname` = '测试用户-Free',
  `mobile` = '13900001001',
  `password` = 'e10adc3949ba59abbe56e057f20f883e',
  `channel` = 4,
  `is_disable` = 0,
  `is_delete` = 0,
  `delete_time` = 0,
  `update_time` = UNIX_TIMESTAMP()
WHERE `username` = 'uied_test_free';

-- 4) 新增/恢复 Pro 测试用户
INSERT INTO `la_user` (
  `sn`,`avatar`,`real_name`,`nickname`,`username`,`password`,`mobile`,`salt`,`sex`,`channel`,`is_disable`,`is_delete`,`last_login_ip`,`last_login_time`,`create_time`,`update_time`,`delete_time`
)
SELECT
  0,
  '/api/static/default_avatar.png',
  '测试用户-Pro',
  '测试用户-Pro',
  'uied_test_pro',
  'e10adc3949ba59abbe56e057f20f883e',
  '13900001002',
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
  SELECT 1 FROM `la_user` WHERE `username` = 'uied_test_pro'
);

UPDATE `la_user`
SET
  `avatar` = '/api/static/default_avatar.png',
  `real_name` = '测试用户-Pro',
  `nickname` = '测试用户-Pro',
  `mobile` = '13900001002',
  `password` = 'e10adc3949ba59abbe56e057f20f883e',
  `channel` = 4,
  `is_disable` = 0,
  `is_delete` = 0,
  `delete_time` = 0,
  `update_time` = UNIX_TIMESTAMP()
WHERE `username` = 'uied_test_pro';

-- 5) 修正 sn（为空时回填为 id）
UPDATE `la_user`
SET `sn` = `id`, `update_time` = UNIX_TIMESTAMP()
WHERE `sn` = 0 AND `username` IN ('uied_test_free', 'uied_test_pro');

-- 6) 身份标记：Pro 账号为作者，Free 账号为普通用户
INSERT INTO `la_user_identity` (`user_id`,`user_type`,`is_delete`,`create_time`,`update_time`,`delete_time`)
SELECT `id`, 1, 0, UNIX_TIMESTAMP(), UNIX_TIMESTAMP(), 0
FROM `la_user`
WHERE `username` = 'uied_test_pro'
ON DUPLICATE KEY UPDATE
  `user_type` = VALUES(`user_type`),
  `is_delete` = 0,
  `update_time` = UNIX_TIMESTAMP(),
  `delete_time` = 0;

INSERT INTO `la_user_identity` (`user_id`,`user_type`,`is_delete`,`create_time`,`update_time`,`delete_time`)
SELECT `id`, 0, 0, UNIX_TIMESTAMP(), UNIX_TIMESTAMP(), 0
FROM `la_user`
WHERE `username` = 'uied_test_free'
ON DUPLICATE KEY UPDATE
  `user_type` = VALUES(`user_type`),
  `is_delete` = 0,
  `update_time` = UNIX_TIMESTAMP(),
  `delete_time` = 0;

-- 7) Pro 作者资料初始化
INSERT INTO `la_user_author_profile` (`user_id`,`display_name`,`bio`,`homepage`,`xiaohongshu`,`weibo`,`is_public`,`is_delete`,`create_time`,`update_time`,`delete_time`)
SELECT `id`, '测试用户-Pro', '这是用于售卖版联调的 Pro 测试作者账号。', '', '', '', 1, 0, UNIX_TIMESTAMP(), UNIX_TIMESTAMP(), 0
FROM `la_user`
WHERE `username` = 'uied_test_pro'
ON DUPLICATE KEY UPDATE
  `display_name` = VALUES(`display_name`),
  `bio` = VALUES(`bio`),
  `is_public` = 1,
  `is_delete` = 0,
  `update_time` = UNIX_TIMESTAMP(),
  `delete_time` = 0;

COMMIT;
