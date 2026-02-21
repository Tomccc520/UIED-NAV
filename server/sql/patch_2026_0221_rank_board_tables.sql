-- ============================================
-- UIED 榜单系统表结构补丁（可重复执行）
-- 目标：
-- 1) 创建榜单系统配置表
-- ============================================

SET NAMES utf8mb4;
START TRANSACTION;

CREATE TABLE IF NOT EXISTS `uied_rank_board_config` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `board_key` varchar(64) NOT NULL DEFAULT '',
  `board_name` varchar(128) NOT NULL DEFAULT '',
  `description` varchar(255) NOT NULL DEFAULT '',
  `algorithm` varchar(64) NOT NULL DEFAULT '',
  `limit_count` tinyint unsigned NOT NULL DEFAULT 20,
  `sort` int unsigned NOT NULL DEFAULT 0,
  `is_enabled` tinyint unsigned NOT NULL DEFAULT 1,
  `extra_json` text,
  `is_delete` tinyint unsigned NOT NULL DEFAULT 0,
  `create_time` int unsigned NOT NULL DEFAULT 0,
  `update_time` int unsigned NOT NULL DEFAULT 0,
  `delete_time` int unsigned NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_board_key` (`board_key`),
  KEY `idx_enabled_sort` (`is_enabled`,`sort`),
  KEY `idx_delete` (`is_delete`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='榜单系统配置表';

COMMIT;
