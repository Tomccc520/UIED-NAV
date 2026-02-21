-- ============================================
-- WordPress 标签/组件配置表补丁（可重复执行）
-- 目的：补齐 /api/wordpress/tags 与 /api/wordpress/widgets/active 数据来源
-- ============================================

SET NAMES utf8mb4;
START TRANSACTION;

CREATE TABLE IF NOT EXISTS `uied_wordpress_tag` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `config_id` int unsigned DEFAULT NULL COMMENT 'WordPress源配置ID',
  `wp_tag_id` int unsigned NOT NULL DEFAULT 0 COMMENT 'WordPress标签ID',
  `wp_tag_name` varchar(128) NOT NULL DEFAULT '' COMMENT 'WordPress标签名',
  `display_name` varchar(128) NOT NULL DEFAULT '' COMMENT '前台展示名',
  `slug` varchar(128) NOT NULL DEFAULT '' COMMENT '标签slug',
  `description` varchar(500) NOT NULL DEFAULT '' COMMENT '描述',
  `sort` int unsigned NOT NULL DEFAULT 0 COMMENT '排序',
  `visible` tinyint unsigned NOT NULL DEFAULT 1 COMMENT '是否可见',
  `page_slug` varchar(64) NOT NULL DEFAULT '' COMMENT '页面slug',
  `create_time` int unsigned NOT NULL DEFAULT 0,
  `update_time` int unsigned NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_page_visible_sort` (`page_slug`,`visible`,`sort`),
  KEY `idx_slug` (`slug`),
  KEY `idx_config_id` (`config_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='WordPress 标签映射配置';

CREATE TABLE IF NOT EXISTS `uied_wordpress_widget` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `config_id` int unsigned DEFAULT NULL COMMENT 'WordPress源配置ID',
  `widget_key` varchar(100) NOT NULL DEFAULT '' COMMENT '组件键',
  `widget_name` varchar(128) NOT NULL DEFAULT '' COMMENT '组件名称',
  `title` varchar(200) NOT NULL DEFAULT '' COMMENT '标题',
  `content` text COMMENT '组件内容',
  `meta_json` text COMMENT '扩展配置JSON',
  `sort` int unsigned NOT NULL DEFAULT 0 COMMENT '排序',
  `visible` tinyint unsigned NOT NULL DEFAULT 1 COMMENT '是否可见',
  `page_slug` varchar(64) NOT NULL DEFAULT '' COMMENT '页面slug',
  `create_time` int unsigned NOT NULL DEFAULT 0,
  `update_time` int unsigned NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_page_visible_sort` (`page_slug`,`visible`,`sort`),
  KEY `idx_widget_key` (`widget_key`),
  KEY `idx_config_id` (`config_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='WordPress 组件配置';

COMMIT;
