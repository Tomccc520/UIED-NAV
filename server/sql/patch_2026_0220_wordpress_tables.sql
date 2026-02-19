-- ============================================
-- WordPress 配置表补丁（可重复执行）
-- 目的：修复 /api/wordpress/categories/active 因缺表导致的异常
-- ============================================

SET NAMES utf8mb4;
START TRANSACTION;

CREATE TABLE IF NOT EXISTS `uied_wordpress_config` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(128) NOT NULL DEFAULT '',
  `api_url` varchar(255) NOT NULL DEFAULT '',
  `enabled` tinyint unsigned NOT NULL DEFAULT 1,
  `is_default` tinyint unsigned NOT NULL DEFAULT 0,
  `cache_time` int unsigned NOT NULL DEFAULT 7200,
  `create_time` int unsigned NOT NULL DEFAULT 0,
  `update_time` int unsigned NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_enabled_default` (`enabled`, `is_default`),
  KEY `idx_create_time` (`create_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='WordPress 源配置';

CREATE TABLE IF NOT EXISTS `uied_wordpress_category` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `config_id` int unsigned DEFAULT NULL,
  `wp_category_id` int unsigned NOT NULL DEFAULT 0,
  `wp_category_name` varchar(128) NOT NULL DEFAULT '',
  `display_name` varchar(128) NOT NULL DEFAULT '',
  `slug` varchar(128) NOT NULL DEFAULT '',
  `description` varchar(500) NOT NULL DEFAULT '',
  `sort` int unsigned NOT NULL DEFAULT 0,
  `visible` tinyint unsigned NOT NULL DEFAULT 1,
  `page_slug` varchar(64) NOT NULL DEFAULT '',
  `create_time` int unsigned NOT NULL DEFAULT 0,
  `update_time` int unsigned NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_page_visible_sort` (`page_slug`, `visible`, `sort`),
  KEY `idx_slug` (`slug`),
  KEY `idx_config_id` (`config_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='WordPress 分类映射配置';

COMMIT;
