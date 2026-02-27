-- ============================================
-- UIED 投稿激励闭环表结构补丁（可重复执行）
-- 目标：
-- 1) 积分规则配置
-- 2) 用户积分汇总/日志
-- 3) 勋章配置与用户勋章关系
-- 4) 优质投稿推荐位
-- ============================================

SET NAMES utf8mb4;
START TRANSACTION;

CREATE TABLE IF NOT EXISTS `uied_contribution_setting` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `config_key` varchar(64) NOT NULL DEFAULT '',
  `config_value` text,
  `description` varchar(255) NOT NULL DEFAULT '',
  `is_delete` tinyint unsigned NOT NULL DEFAULT 0,
  `create_time` int unsigned NOT NULL DEFAULT 0,
  `update_time` int unsigned NOT NULL DEFAULT 0,
  `delete_time` int unsigned NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_config_key` (`config_key`),
  KEY `idx_delete` (`is_delete`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='投稿激励配置表';

CREATE TABLE IF NOT EXISTS `uied_user_contribution` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int unsigned NOT NULL DEFAULT 0,
  `total_points` int NOT NULL DEFAULT 0,
  `submit_count` int unsigned NOT NULL DEFAULT 0,
  `publish_count` int unsigned NOT NULL DEFAULT 0,
  `featured_count` int unsigned NOT NULL DEFAULT 0,
  `badge_count` int unsigned NOT NULL DEFAULT 0,
  `level_id` int unsigned NOT NULL DEFAULT 0,
  `level_name` varchar(64) NOT NULL DEFAULT '',
  `level_value` int unsigned NOT NULL DEFAULT 0,
  `last_reward_time` int unsigned NOT NULL DEFAULT 0,
  `is_delete` tinyint unsigned NOT NULL DEFAULT 0,
  `create_time` int unsigned NOT NULL DEFAULT 0,
  `update_time` int unsigned NOT NULL DEFAULT 0,
  `delete_time` int unsigned NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_id` (`user_id`),
  KEY `idx_points` (`total_points`),
  KEY `idx_level` (`level_id`),
  KEY `idx_delete` (`is_delete`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户投稿激励汇总表';

CREATE TABLE IF NOT EXISTS `uied_user_contribution_log` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int unsigned NOT NULL DEFAULT 0,
  `article_id` int unsigned NOT NULL DEFAULT 0,
  `event_type` varchar(64) NOT NULL DEFAULT '',
  `event_key` varchar(128) NOT NULL DEFAULT '',
  `points_change` int NOT NULL DEFAULT 0,
  `balance_after` int NOT NULL DEFAULT 0,
  `remark` varchar(255) NOT NULL DEFAULT '',
  `operator_id` int unsigned NOT NULL DEFAULT 0,
  `is_delete` tinyint unsigned NOT NULL DEFAULT 0,
  `create_time` int unsigned NOT NULL DEFAULT 0,
  `update_time` int unsigned NOT NULL DEFAULT 0,
  `delete_time` int unsigned NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_event_key` (`event_key`),
  KEY `idx_user_time` (`user_id`,`create_time`),
  KEY `idx_article` (`article_id`),
  KEY `idx_type` (`event_type`),
  KEY `idx_delete` (`is_delete`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户投稿激励积分日志';

CREATE TABLE IF NOT EXISTS `uied_contribution_badge` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `badge_key` varchar(64) NOT NULL DEFAULT '',
  `badge_name` varchar(64) NOT NULL DEFAULT '',
  `icon` varchar(100) NOT NULL DEFAULT '',
  `color` varchar(20) NOT NULL DEFAULT '#409EFF',
  `description` varchar(255) NOT NULL DEFAULT '',
  `require_points` int unsigned NOT NULL DEFAULT 0,
  `require_publish_count` int unsigned NOT NULL DEFAULT 0,
  `is_enabled` tinyint unsigned NOT NULL DEFAULT 1,
  `sort` int unsigned NOT NULL DEFAULT 0,
  `is_delete` tinyint unsigned NOT NULL DEFAULT 0,
  `create_time` int unsigned NOT NULL DEFAULT 0,
  `update_time` int unsigned NOT NULL DEFAULT 0,
  `delete_time` int unsigned NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_badge_key` (`badge_key`),
  KEY `idx_enable_sort` (`is_enabled`,`sort`),
  KEY `idx_delete` (`is_delete`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='投稿激励勋章配置表';

CREATE TABLE IF NOT EXISTS `uied_user_contribution_badge` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int unsigned NOT NULL DEFAULT 0,
  `badge_id` int unsigned NOT NULL DEFAULT 0,
  `badge_key` varchar(64) NOT NULL DEFAULT '',
  `badge_name` varchar(64) NOT NULL DEFAULT '',
  `icon` varchar(100) NOT NULL DEFAULT '',
  `color` varchar(20) NOT NULL DEFAULT '#409EFF',
  `grant_source` varchar(64) NOT NULL DEFAULT 'auto',
  `grant_remark` varchar(255) NOT NULL DEFAULT '',
  `is_delete` tinyint unsigned NOT NULL DEFAULT 0,
  `create_time` int unsigned NOT NULL DEFAULT 0,
  `update_time` int unsigned NOT NULL DEFAULT 0,
  `delete_time` int unsigned NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_badge` (`user_id`,`badge_id`),
  KEY `idx_user` (`user_id`),
  KEY `idx_badge` (`badge_id`),
  KEY `idx_delete` (`is_delete`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户投稿勋章关系表';

CREATE TABLE IF NOT EXISTS `uied_contribution_featured_submission` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `title` varchar(200) NOT NULL DEFAULT '',
  `article_id` int unsigned NOT NULL DEFAULT 0,
  `cover_image` varchar(500) NOT NULL DEFAULT '',
  `summary` varchar(500) NOT NULL DEFAULT '',
  `target_url` varchar(500) NOT NULL DEFAULT '',
  `sort` int unsigned NOT NULL DEFAULT 0,
  `is_show` tinyint unsigned NOT NULL DEFAULT 1,
  `start_time` int unsigned NOT NULL DEFAULT 0,
  `end_time` int unsigned NOT NULL DEFAULT 0,
  `is_delete` tinyint unsigned NOT NULL DEFAULT 0,
  `create_time` int unsigned NOT NULL DEFAULT 0,
  `update_time` int unsigned NOT NULL DEFAULT 0,
  `delete_time` int unsigned NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_article` (`article_id`),
  KEY `idx_show_sort` (`is_show`,`sort`),
  KEY `idx_delete` (`is_delete`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='优质投稿推荐位表';

COMMIT;
