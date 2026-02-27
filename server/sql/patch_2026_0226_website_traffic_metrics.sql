-- 网站访问数据（高级版）表
-- 执行时间：2026-02-26

CREATE TABLE IF NOT EXISTS `uied_website_traffic_metric` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `website_id` int unsigned NOT NULL DEFAULT 0 COMMENT '网站ID',
  `monthly_visits` bigint unsigned NOT NULL DEFAULT 0 COMMENT '月访问量（手动录入）',
  `avg_visit_duration_seconds` int unsigned NOT NULL DEFAULT 0 COMMENT '平均访问时长（秒）',
  `pages_per_visit` decimal(10,2) NOT NULL DEFAULT 0.00 COMMENT '每次访问页数',
  `bounce_rate` decimal(5,2) NOT NULL DEFAULT 0.00 COMMENT '跳出率（百分比）',
  `source_breakdown_json` text NULL COMMENT '来源渠道占比JSON',
  `data_source` varchar(32) NOT NULL DEFAULT 'manual' COMMENT '数据来源：manual/api',
  `remark` varchar(255) NOT NULL DEFAULT '' COMMENT '备注',
  `is_delete` tinyint unsigned NOT NULL DEFAULT 0,
  `create_time` int unsigned NOT NULL DEFAULT 0,
  `update_time` int unsigned NOT NULL DEFAULT 0,
  `delete_time` int unsigned NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_website_id` (`website_id`),
  KEY `idx_delete_update` (`is_delete`,`update_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='网站访问数据（高级版）';

