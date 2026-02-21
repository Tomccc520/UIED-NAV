-- ============================================
-- UIED 每日热榜持久化配置补丁（可重复执行）
-- 目标：
-- 1) 创建每日热榜全局配置表
-- 2) 创建每日热榜平台配置表
-- ============================================

SET NAMES utf8mb4;
START TRANSACTION;

CREATE TABLE IF NOT EXISTS `uied_daily_hot_config` (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='每日热榜全局配置表';

CREATE TABLE IF NOT EXISTS `uied_daily_hot_platform` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `platform_title` varchar(128) NOT NULL DEFAULT '',
  `display_name` varchar(128) NOT NULL DEFAULT '',
  `is_enabled` tinyint unsigned NOT NULL DEFAULT 1,
  `sort` int unsigned NOT NULL DEFAULT 0,
  `cache_ttl_seconds` int unsigned NOT NULL DEFAULT 600,
  `limit_count` tinyint unsigned NOT NULL DEFAULT 10,
  `request_timeout_ms` int unsigned NOT NULL DEFAULT 12000,
  `extra_json` text,
  `is_delete` tinyint unsigned NOT NULL DEFAULT 0,
  `create_time` int unsigned NOT NULL DEFAULT 0,
  `update_time` int unsigned NOT NULL DEFAULT 0,
  `delete_time` int unsigned NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_platform_title` (`platform_title`),
  KEY `idx_enable_sort` (`is_enabled`,`sort`),
  KEY `idx_delete` (`is_delete`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='每日热榜平台配置表';

COMMIT;
