-- 文章标签/专题 slug 能力补丁
-- 说明：
-- 1) 为 la_article_tag / la_article_topic 增加 slug 字段
-- 2) 初始化历史数据 slug（空值回填，重复值加 ID 后缀）
-- 3) 增加 slug 唯一索引，支撑 SEO 与跨项目复用

SET NAMES utf8mb4;

-- la_article_tag.slug
SET @exists_tag_slug := (
  SELECT COUNT(1)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'la_article_tag'
    AND COLUMN_NAME = 'slug'
);
SET @sql_tag_slug := IF(
  @exists_tag_slug = 0,
  'ALTER TABLE `la_article_tag` ADD COLUMN `slug` varchar(120) NOT NULL DEFAULT '''' COMMENT ''英文别名'' AFTER `name`',
  'SELECT 1'
);
PREPARE stmt_tag_slug FROM @sql_tag_slug;
EXECUTE stmt_tag_slug;
DEALLOCATE PREPARE stmt_tag_slug;

-- la_article_topic.slug
SET @exists_topic_slug := (
  SELECT COUNT(1)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'la_article_topic'
    AND COLUMN_NAME = 'slug'
);
SET @sql_topic_slug := IF(
  @exists_topic_slug = 0,
  'ALTER TABLE `la_article_topic` ADD COLUMN `slug` varchar(120) NOT NULL DEFAULT '''' COMMENT ''英文别名'' AFTER `name`',
  'SELECT 1'
);
PREPARE stmt_topic_slug FROM @sql_topic_slug;
EXECUTE stmt_topic_slug;
DEALLOCATE PREPARE stmt_topic_slug;

-- 空 slug 回填（标签）
UPDATE `la_article_tag`
SET `slug` = CONCAT('tag-', `id`)
WHERE (`slug` IS NULL OR `slug` = '');

-- 重复 slug 去重（标签）
UPDATE `la_article_tag` t
JOIN (
  SELECT `slug`
  FROM `la_article_tag`
  WHERE `slug` <> ''
  GROUP BY `slug`
  HAVING COUNT(1) > 1
) d ON t.`slug` = d.`slug`
SET t.`slug` = CONCAT(t.`slug`, '-', t.`id`);

-- 空 slug 回填（专题）
UPDATE `la_article_topic`
SET `slug` = CONCAT('topic-', `id`)
WHERE (`slug` IS NULL OR `slug` = '');

-- 重复 slug 去重（专题）
UPDATE `la_article_topic` t
JOIN (
  SELECT `slug`
  FROM `la_article_topic`
  WHERE `slug` <> ''
  GROUP BY `slug`
  HAVING COUNT(1) > 1
) d ON t.`slug` = d.`slug`
SET t.`slug` = CONCAT(t.`slug`, '-', t.`id`);

-- la_article_tag.uk_slug
SET @exists_tag_uk_slug := (
  SELECT COUNT(1)
  FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'la_article_tag'
    AND INDEX_NAME = 'uk_slug'
);
SET @sql_tag_uk_slug := IF(
  @exists_tag_uk_slug = 0,
  'ALTER TABLE `la_article_tag` ADD UNIQUE INDEX `uk_slug` (`slug`)',
  'SELECT 1'
);
PREPARE stmt_tag_uk_slug FROM @sql_tag_uk_slug;
EXECUTE stmt_tag_uk_slug;
DEALLOCATE PREPARE stmt_tag_uk_slug;

-- la_article_topic.uk_slug
SET @exists_topic_uk_slug := (
  SELECT COUNT(1)
  FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'la_article_topic'
    AND INDEX_NAME = 'uk_slug'
);
SET @sql_topic_uk_slug := IF(
  @exists_topic_uk_slug = 0,
  'ALTER TABLE `la_article_topic` ADD UNIQUE INDEX `uk_slug` (`slug`)',
  'SELECT 1'
);
PREPARE stmt_topic_uk_slug FROM @sql_topic_uk_slug;
EXECUTE stmt_topic_uk_slug;
DEALLOCATE PREPARE stmt_topic_uk_slug;

