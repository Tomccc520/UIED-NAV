-- @copyright Tomda (https://www.tomda.top)
-- @copyright UIED技术团队 (https://fsuied.com)
-- @author UIED技术团队
-- @createDate 2026-02-26
-- 网站点赞表（匿名+登录 actor_key 幂等）

CREATE TABLE IF NOT EXISTS `uied_website_like` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `website_id` int unsigned NOT NULL DEFAULT 0 COMMENT '网站ID',
  `actor_key` varchar(140) NOT NULL DEFAULT '' COMMENT '操作者幂等键（u:{userId} / ip:{hash}）',
  `user_id` int unsigned NOT NULL DEFAULT 0 COMMENT '用户ID（匿名为0）',
  `ip_hash` varchar(64) NOT NULL DEFAULT '' COMMENT 'IP哈希（匿名识别）',
  `is_delete` tinyint unsigned NOT NULL DEFAULT 0 COMMENT '软删除标记',
  `create_time` int unsigned NOT NULL DEFAULT 0,
  `update_time` int unsigned NOT NULL DEFAULT 0,
  `delete_time` int unsigned NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_website_actor` (`website_id`, `actor_key`),
  KEY `idx_website_delete` (`website_id`, `is_delete`),
  KEY `idx_user_delete` (`user_id`, `is_delete`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='网站点赞表';

