-- 文章公开配置缺失修复（可重复执行）
-- 作用：补齐 uied_site_setting.articleConfig，避免发布前回归出现“缺少关键配置键”告警
--
-- 执行方式：
-- docker exec -i uied_mysql mysql --default-character-set=utf8mb4 -u uied -puied123456 -D uied_nav < server/sql/patch_2026_0220_article_config_seed.sql

SET NAMES utf8mb4;
START TRANSACTION;

INSERT INTO uied_site_setting (`key`, `value`, description, create_time, update_time)
SELECT
  'articleConfig',
  JSON_OBJECT(
    'enabled', true,
    'homeSectionEnabled', true,
    'homeSectionTitle', '设计文章',
    'homeSectionSubtitle', '汇聚优质设计文章，分享前沿设计趋势与实战经验',
    'homeSectionLimit', 12,
    'listPageTitle', '设计专栏',
    'listPageDescription', '汇聚优质设计文章，分享前沿设计趋势、实战技巧与行业洞察',
    'listPageCoverImage', '',
    'commentsEnabled', true,
    'topicsEnabled', true
  ),
  '文章公开配置（发布前补齐默认值）',
  UNIX_TIMESTAMP(),
  UNIX_TIMESTAMP()
FROM DUAL
WHERE NOT EXISTS (
  SELECT 1 FROM uied_site_setting WHERE `key` = 'articleConfig'
);

COMMIT;
