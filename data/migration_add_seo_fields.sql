-- 分类表和标签表添加 SEO 字段
-- 2026-02-09 为分类和标签增加 SEO 标题、描述、关键词字段，提升 SEO 能力

-- 分类表添加 SEO 字段
ALTER TABLE uied_category
  ADD COLUMN seo_title VARCHAR(200) DEFAULT NULL COMMENT 'SEO标题，如"2025年最好的96个AI智能体工具"' AFTER description,
  ADD COLUMN seo_description TEXT DEFAULT NULL COMMENT 'SEO描述/简介，用于搜索引擎和页面展示' AFTER seo_title,
  ADD COLUMN seo_keywords VARCHAR(300) DEFAULT NULL COMMENT 'SEO关键词，逗号分隔' AFTER seo_description;

-- 标签表添加 SEO 字段
ALTER TABLE uied_website_tag
  ADD COLUMN seo_title VARCHAR(200) DEFAULT NULL COMMENT 'SEO标题' AFTER description,
  ADD COLUMN seo_description TEXT DEFAULT NULL COMMENT 'SEO描述/简介' AFTER seo_title,
  ADD COLUMN seo_keywords VARCHAR(300) DEFAULT NULL COMMENT 'SEO关键词，逗号分隔' AFTER seo_description;
