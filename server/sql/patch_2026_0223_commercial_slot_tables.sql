-- ============================================
-- UIED 商业位体系表结构补丁（可重复执行）
-- 目标：
-- 1) 广告位配置（置顶位/分类广告位/专题赞助位）
-- 2) 投放记录（按天/周售卖与排期）
-- ============================================

SET NAMES utf8mb4;
START TRANSACTION;

CREATE TABLE IF NOT EXISTS `uied_commercial_slot` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `slot_key` varchar(80) NOT NULL DEFAULT '',
  `slot_name` varchar(120) NOT NULL DEFAULT '',
  `slot_type` varchar(30) NOT NULL DEFAULT 'top',
  `scope_type` varchar(30) NOT NULL DEFAULT 'global',
  `scope_value` varchar(120) NOT NULL DEFAULT '',
  `description` varchar(255) NOT NULL DEFAULT '',
  `sale_unit` varchar(20) NOT NULL DEFAULT 'day',
  `unit_price` decimal(10,2) NOT NULL DEFAULT 0.00,
  `max_positions` int unsigned NOT NULL DEFAULT 1,
  `sort` int unsigned NOT NULL DEFAULT 0,
  `is_enabled` tinyint unsigned NOT NULL DEFAULT 1,
  `extra_json` text,
  `is_delete` tinyint unsigned NOT NULL DEFAULT 0,
  `create_time` int unsigned NOT NULL DEFAULT 0,
  `update_time` int unsigned NOT NULL DEFAULT 0,
  `delete_time` int unsigned NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_slot_key_scope` (`slot_key`,`scope_type`,`scope_value`),
  KEY `idx_type_scope` (`slot_type`,`scope_type`),
  KEY `idx_enable_sort` (`is_enabled`,`sort`),
  KEY `idx_delete` (`is_delete`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='商业广告位配置表';

CREATE TABLE IF NOT EXISTS `uied_commercial_booking` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `slot_id` int unsigned NOT NULL DEFAULT 0,
  `slot_key` varchar(80) NOT NULL DEFAULT '',
  `slot_type` varchar(30) NOT NULL DEFAULT 'top',
  `scope_type` varchar(30) NOT NULL DEFAULT 'global',
  `scope_value` varchar(120) NOT NULL DEFAULT '',
  `sponsor_name` varchar(120) NOT NULL DEFAULT '',
  `sponsor_title` varchar(200) NOT NULL DEFAULT '',
  `target_url` varchar(500) NOT NULL DEFAULT '',
  `image_url` varchar(500) NOT NULL DEFAULT '',
  `text_content` varchar(500) NOT NULL DEFAULT '',
  `badge_text` varchar(50) NOT NULL DEFAULT '',
  `position_index` int unsigned NOT NULL DEFAULT 1,
  `sale_unit` varchar(20) NOT NULL DEFAULT 'day',
  `unit_price` decimal(10,2) NOT NULL DEFAULT 0.00,
  `total_price` decimal(10,2) NOT NULL DEFAULT 0.00,
  `start_time` int unsigned NOT NULL DEFAULT 0,
  `end_time` int unsigned NOT NULL DEFAULT 0,
  `status` varchar(20) NOT NULL DEFAULT 'draft',
  `is_show` tinyint unsigned NOT NULL DEFAULT 1,
  `contact_name` varchar(60) NOT NULL DEFAULT '',
  `contact_phone` varchar(30) NOT NULL DEFAULT '',
  `order_no` varchar(64) NOT NULL DEFAULT '',
  `note` varchar(500) NOT NULL DEFAULT '',
  `extra_json` text,
  `is_delete` tinyint unsigned NOT NULL DEFAULT 0,
  `create_time` int unsigned NOT NULL DEFAULT 0,
  `update_time` int unsigned NOT NULL DEFAULT 0,
  `delete_time` int unsigned NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_slot` (`slot_id`),
  KEY `idx_slot_key` (`slot_key`),
  KEY `idx_scope` (`scope_type`,`scope_value`),
  KEY `idx_status_show_time` (`status`,`is_show`,`start_time`,`end_time`),
  KEY `idx_delete` (`is_delete`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='商业广告位投放记录表';

COMMIT;
