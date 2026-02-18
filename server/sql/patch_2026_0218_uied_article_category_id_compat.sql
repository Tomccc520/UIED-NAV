-- ============================================
-- UIED 文章分类字段兼容补丁
-- 目标：为历史库补齐 uied_article.category_id 并做数据回填
-- @author UIED技术团队
-- ============================================

SET @db_name = DATABASE();

-- 1) 若缺失 category_id 字段则补齐
SET @col_exists = (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @db_name
    AND TABLE_NAME = 'uied_article'
    AND COLUMN_NAME = 'category_id'
);
SET @sql_add_col = IF(
  @col_exists = 0,
  'ALTER TABLE `uied_article` ADD COLUMN `category_id` int(10) unsigned DEFAULT NULL COMMENT ''分类ID'' AFTER `category`',
  'SELECT 1'
);
PREPARE stmt_add_col FROM @sql_add_col;
EXECUTE stmt_add_col;
DEALLOCATE PREPARE stmt_add_col;

-- 2) 按分类名称回填 category_id（仅回填空值）
UPDATE `uied_article` a
LEFT JOIN `uied_article_category` c
  ON c.`name` = a.`category`
 AND c.`is_delete` = 0
SET a.`category_id` = c.`id`
WHERE a.`category_id` IS NULL
  AND a.`category` IS NOT NULL
  AND a.`category` != '';

-- 3) 若缺失索引则补齐
SET @idx_exists = (
  SELECT COUNT(*)
  FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = @db_name
    AND TABLE_NAME = 'uied_article'
    AND INDEX_NAME = 'category_id'
);
SET @sql_add_idx = IF(
  @idx_exists = 0,
  'ALTER TABLE `uied_article` ADD KEY `category_id` (`category_id`)',
  'SELECT 1'
);
PREPARE stmt_add_idx FROM @sql_add_idx;
EXECUTE stmt_add_idx;
DEALLOCATE PREPARE stmt_add_idx;
