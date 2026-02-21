-- ============================================
-- UIED 专题页工厂表结构补丁（可重复执行）
-- 目标：
-- 1) 创建专题模板表（可运营模板）
-- ============================================

SET NAMES utf8mb4;
START TRANSACTION;

CREATE TABLE IF NOT EXISTS `uied_topic_template` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `template_key` varchar(64) NOT NULL DEFAULT '',
  `template_name` varchar(128) NOT NULL DEFAULT '',
  `scene` varchar(64) NOT NULL DEFAULT 'topic',
  `description` varchar(255) NOT NULL DEFAULT '',
  `default_slug` varchar(100) NOT NULL DEFAULT '',
  `icon` varchar(100) NOT NULL DEFAULT '',
  `theme_color` varchar(20) DEFAULT NULL,
  `page_config_json` text,
  `category_slug_list` text,
  `is_enabled` tinyint unsigned NOT NULL DEFAULT 1,
  `sort` int unsigned NOT NULL DEFAULT 0,
  `extra_json` text,
  `is_delete` tinyint unsigned NOT NULL DEFAULT 0,
  `create_time` int unsigned NOT NULL DEFAULT 0,
  `update_time` int unsigned NOT NULL DEFAULT 0,
  `delete_time` int unsigned NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_template_key` (`template_key`),
  KEY `idx_enabled_sort` (`is_enabled`,`sort`),
  KEY `idx_delete` (`is_delete`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='专题页模板表';

COMMIT;
