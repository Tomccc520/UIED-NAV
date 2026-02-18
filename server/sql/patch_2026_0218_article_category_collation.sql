-- ============================================
-- 文章分类字段字符集排序规则兼容修复（可重复执行）
-- 场景：uied_article.category 与 uied_article_category.name 排序规则不一致导致
--      Illegal mix of collations (ER_CANT_AGGREGATE_2COLLATIONS)
-- ============================================

SET @db_name = DATABASE();

-- 1) 统一 uied_article.category 为 utf8mb4_unicode_ci
SET @category_collation = (
  SELECT COLLATION_NAME
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @db_name
    AND TABLE_NAME = 'uied_article'
    AND COLUMN_NAME = 'category'
  LIMIT 1
);
SET @sql_fix_article_category = IF(
  @category_collation IS NULL,
  'SELECT ''skip: uied_article.category not found''',
  IF(
    @category_collation = 'utf8mb4_unicode_ci',
    'SELECT ''skip: uied_article.category already utf8mb4_unicode_ci''',
    'ALTER TABLE `uied_article` MODIFY `category` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL'
  )
);
PREPARE stmt1 FROM @sql_fix_article_category;
EXECUTE stmt1;
DEALLOCATE PREPARE stmt1;

-- 2) 统一 uied_article_category.name 为 utf8mb4_unicode_ci
SET @name_collation = (
  SELECT COLLATION_NAME
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @db_name
    AND TABLE_NAME = 'uied_article_category'
    AND COLUMN_NAME = 'name'
  LIMIT 1
);
SET @sql_fix_category_name = IF(
  @name_collation IS NULL,
  'SELECT ''skip: uied_article_category.name not found''',
  IF(
    @name_collation = 'utf8mb4_unicode_ci',
    'SELECT ''skip: uied_article_category.name already utf8mb4_unicode_ci''',
    'ALTER TABLE `uied_article_category` MODIFY `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL'
  )
);
PREPARE stmt2 FROM @sql_fix_category_name;
EXECUTE stmt2;
DEALLOCATE PREPARE stmt2;

-- 3) 可选：同步 slug 为 utf8mb4_unicode_ci（避免后续同类问题）
SET @slug_collation = (
  SELECT COLLATION_NAME
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @db_name
    AND TABLE_NAME = 'uied_article_category'
    AND COLUMN_NAME = 'slug'
  LIMIT 1
);
SET @sql_fix_category_slug = IF(
  @slug_collation IS NULL,
  'SELECT ''skip: uied_article_category.slug not found''',
  IF(
    @slug_collation = 'utf8mb4_unicode_ci',
    'SELECT ''skip: uied_article_category.slug already utf8mb4_unicode_ci''',
    'ALTER TABLE `uied_article_category` MODIFY `slug` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL'
  )
);
PREPARE stmt3 FROM @sql_fix_category_slug;
EXECUTE stmt3;
DEALLOCATE PREPARE stmt3;
