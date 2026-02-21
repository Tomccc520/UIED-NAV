-- ============================================
-- 网站评分/收藏表补丁（可重复执行）
-- 目的：将 /api/websites/:id/rate 与 favorite 接口从兼容返回改为真实持久化
-- ============================================

SET NAMES utf8mb4;
START TRANSACTION;

CREATE TABLE IF NOT EXISTS `uied_website_rating` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `website_id` int unsigned NOT NULL DEFAULT 0 COMMENT '网站ID',
  `actor_key` varchar(140) NOT NULL DEFAULT '' COMMENT '操作者键：u:{userId} / ip:{hash}',
  `user_id` int unsigned NOT NULL DEFAULT 0 COMMENT '用户ID（匿名为0）',
  `ip_hash` varchar(64) NOT NULL DEFAULT '' COMMENT 'IP哈希',
  `rating` tinyint unsigned NOT NULL DEFAULT 5 COMMENT '评分 1-5',
  `is_delete` tinyint unsigned NOT NULL DEFAULT 0 COMMENT '是否删除: 0=否,1=是',
  `create_time` int unsigned NOT NULL DEFAULT 0,
  `update_time` int unsigned NOT NULL DEFAULT 0,
  `delete_time` int unsigned NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_website_actor` (`website_id`,`actor_key`),
  KEY `idx_website_delete` (`website_id`,`is_delete`),
  KEY `idx_user_delete` (`user_id`,`is_delete`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='网站评分表';

CREATE TABLE IF NOT EXISTS `uied_website_favorite` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `website_id` int unsigned NOT NULL DEFAULT 0 COMMENT '网站ID',
  `actor_key` varchar(140) NOT NULL DEFAULT '' COMMENT '操作者键：u:{userId} / ip:{hash}',
  `user_id` int unsigned NOT NULL DEFAULT 0 COMMENT '用户ID（匿名为0）',
  `ip_hash` varchar(64) NOT NULL DEFAULT '' COMMENT 'IP哈希',
  `is_delete` tinyint unsigned NOT NULL DEFAULT 0 COMMENT '是否删除: 0=否,1=是',
  `create_time` int unsigned NOT NULL DEFAULT 0,
  `update_time` int unsigned NOT NULL DEFAULT 0,
  `delete_time` int unsigned NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_website_actor` (`website_id`,`actor_key`),
  KEY `idx_website_delete` (`website_id`,`is_delete`),
  KEY `idx_user_delete` (`user_id`,`is_delete`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='网站收藏表';

COMMIT;
