-- ============================================
-- 文章联调测试数据（可重复执行）
-- 目标：补齐“已发布文章 + 分类 + 标签 + 关联”
-- ============================================

SET @now_ts = UNIX_TIMESTAMP();

-- 1) 分类
INSERT INTO `uied_article_category` (`name`, `slug`, `description`, `sort_order`, `is_delete`, `create_time`, `update_time`, `createdAt`, `updatedAt`)
SELECT 'Design', 'design', 'Design related articles', 10, 0, @now_ts, @now_ts, NOW(), NOW()
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `uied_article_category` WHERE `slug` = 'design' AND `is_delete` = 0);

INSERT INTO `uied_article_category` (`name`, `slug`, `description`, `sort_order`, `is_delete`, `create_time`, `update_time`, `createdAt`, `updatedAt`)
SELECT 'AI', 'ai', 'AI related articles', 20, 0, @now_ts, @now_ts, NOW(), NOW()
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `uied_article_category` WHERE `slug` = 'ai' AND `is_delete` = 0);

INSERT INTO `uied_article_category` (`name`, `slug`, `description`, `sort_order`, `is_delete`, `create_time`, `update_time`, `createdAt`, `updatedAt`)
SELECT 'Tools', 'tools', 'Tooling and productivity', 30, 0, @now_ts, @now_ts, NOW(), NOW()
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `uied_article_category` WHERE `slug` = 'tools' AND `is_delete` = 0);

-- 2) 标签
INSERT INTO `uied_article_tag` (`name`, `slug`, `color`, `sort_order`, `is_delete`, `create_time`, `update_time`, `createdAt`, `updatedAt`)
SELECT 'UI', 'ui', '#3B82F6', 10, 0, @now_ts, @now_ts, NOW(), NOW()
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `uied_article_tag` WHERE `slug` = 'ui' AND `is_delete` = 0);

INSERT INTO `uied_article_tag` (`name`, `slug`, `color`, `sort_order`, `is_delete`, `create_time`, `update_time`, `createdAt`, `updatedAt`)
SELECT 'UX', 'ux', '#10B981', 20, 0, @now_ts, @now_ts, NOW(), NOW()
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `uied_article_tag` WHERE `slug` = 'ux' AND `is_delete` = 0);

INSERT INTO `uied_article_tag` (`name`, `slug`, `color`, `sort_order`, `is_delete`, `create_time`, `update_time`, `createdAt`, `updatedAt`)
SELECT 'AI', 'ai', '#8B5CF6', 30, 0, @now_ts, @now_ts, NOW(), NOW()
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `uied_article_tag` WHERE `slug` = 'ai' AND `is_delete` = 0);

INSERT INTO `uied_article_tag` (`name`, `slug`, `color`, `sort_order`, `is_delete`, `create_time`, `update_time`, `createdAt`, `updatedAt`)
SELECT 'Productivity', 'productivity', '#F59E0B', 40, 0, @now_ts, @now_ts, NOW(), NOW()
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `uied_article_tag` WHERE `slug` = 'productivity' AND `is_delete` = 0);

-- 3) 已发布文章
INSERT INTO `uied_article`
(`old_id`, `title`, `content`, `excerpt`, `cover_image`, `author`, `category`, `slug`, `status`, `view_count`, `seo_title`, `seo_description`, `published_at`, `is_delete`, `create_time`, `update_time`, `delete_time`)
SELECT
  '',
  'UI Resource Curation Workflow for Teams',
  '<p>This is a test article for frontend integration.</p><p>It demonstrates published content in the commercial edition.</p>',
  'A practical workflow for curating high-quality UI resources in teams.',
  '',
  'UIED Team',
  'Design',
  'seed-ui-curation-workflow',
  'published',
  128,
  'UI Resource Curation Workflow for Teams',
  'A practical workflow for curating high-quality UI resources in teams.',
  @now_ts,
  0,
  @now_ts,
  @now_ts,
  0
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `uied_article` WHERE `slug` = 'seed-ui-curation-workflow' AND `is_delete` = 0);

INSERT INTO `uied_article`
(`old_id`, `title`, `content`, `excerpt`, `cover_image`, `author`, `category`, `slug`, `status`, `view_count`, `seo_title`, `seo_description`, `published_at`, `is_delete`, `create_time`, `update_time`, `delete_time`)
SELECT
  '',
  'How AI Accelerates Design Research',
  '<p>This is a test article for frontend integration.</p><p>It validates list/detail APIs with published data.</p>',
  'Methods to use AI tools to accelerate design research and analysis.',
  '',
  'UIED Team',
  'AI',
  'seed-ai-design-research',
  'published',
  96,
  'How AI Accelerates Design Research',
  'Methods to use AI tools to accelerate design research and analysis.',
  @now_ts,
  0,
  @now_ts,
  @now_ts,
  0
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `uied_article` WHERE `slug` = 'seed-ai-design-research' AND `is_delete` = 0);

INSERT INTO `uied_article`
(`old_id`, `title`, `content`, `excerpt`, `cover_image`, `author`, `category`, `slug`, `status`, `view_count`, `seo_title`, `seo_description`, `published_at`, `is_delete`, `create_time`, `update_time`, `delete_time`)
SELECT
  '',
  'Tool Stack for Daily Creative Production',
  '<p>This is a test article for frontend integration.</p><p>It validates category and tag metadata APIs.</p>',
  'A lightweight tool stack for daily creative production and publishing.',
  '',
  'UIED Team',
  'Tools',
  'seed-tool-stack-daily-creative',
  'published',
  77,
  'Tool Stack for Daily Creative Production',
  'A lightweight tool stack for daily creative production and publishing.',
  @now_ts,
  0,
  @now_ts,
  @now_ts,
  0
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `uied_article` WHERE `slug` = 'seed-tool-stack-daily-creative' AND `is_delete` = 0);

-- 4) 标签关联
INSERT INTO `uied_article_tag_relation` (`article_id`, `tag_id`, `create_time`, `createdAt`, `updatedAt`)
SELECT a.id, t.id, @now_ts, NOW(), NOW()
FROM `uied_article` a
INNER JOIN `uied_article_tag` t ON t.slug IN ('ui', 'ux')
WHERE a.slug = 'seed-ui-curation-workflow'
  AND NOT EXISTS (
    SELECT 1 FROM `uied_article_tag_relation` r
    WHERE r.article_id = a.id AND r.tag_id = t.id
  );

INSERT INTO `uied_article_tag_relation` (`article_id`, `tag_id`, `create_time`, `createdAt`, `updatedAt`)
SELECT a.id, t.id, @now_ts, NOW(), NOW()
FROM `uied_article` a
INNER JOIN `uied_article_tag` t ON t.slug IN ('ai', 'ux')
WHERE a.slug = 'seed-ai-design-research'
  AND NOT EXISTS (
    SELECT 1 FROM `uied_article_tag_relation` r
    WHERE r.article_id = a.id AND r.tag_id = t.id
  );

INSERT INTO `uied_article_tag_relation` (`article_id`, `tag_id`, `create_time`, `createdAt`, `updatedAt`)
SELECT a.id, t.id, @now_ts, NOW(), NOW()
FROM `uied_article` a
INNER JOIN `uied_article_tag` t ON t.slug IN ('productivity', 'ui')
WHERE a.slug = 'seed-tool-stack-daily-creative'
  AND NOT EXISTS (
    SELECT 1 FROM `uied_article_tag_relation` r
    WHERE r.article_id = a.id AND r.tag_id = t.id
  );
