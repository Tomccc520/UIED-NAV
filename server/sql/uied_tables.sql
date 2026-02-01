-- ============================================
-- UIED 导航系统数据库表结构
-- 用于 likeadmin_node 迁移
-- @author Tomda
-- @copyright 版权所有 (c) 2026 UIED技术团队
-- ============================================

-- 分类表
CREATE TABLE IF NOT EXISTS `uied_category` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `old_id` varchar(50) DEFAULT NULL COMMENT '原SQLite cuid',
  `name` varchar(100) NOT NULL DEFAULT '' COMMENT '分类名称',
  `slug` varchar(100) NOT NULL COMMENT '分类别名/URL',
  `icon` varchar(100) NOT NULL DEFAULT '' COMMENT '图标名称',
  `color` varchar(20) NOT NULL DEFAULT '#1890ff' COMMENT '主题色',
  `description` text COMMENT '分类描述',
  `parent_id` int(10) unsigned DEFAULT NULL COMMENT '父分类ID',
  `sort` int(10) unsigned NOT NULL DEFAULT '0' COMMENT '排序',
  `is_show` tinyint(1) unsigned NOT NULL DEFAULT '1' COMMENT '是否显示',
  `is_delete` tinyint(1) unsigned NOT NULL DEFAULT '0' COMMENT '是否删除',
  `create_time` int(10) unsigned NOT NULL DEFAULT '0' COMMENT '创建时间',
  `update_time` int(10) unsigned NOT NULL DEFAULT '0' COMMENT '更新时间',
  `delete_time` int(10) unsigned NOT NULL DEFAULT '0' COMMENT '删除时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`),
  KEY `parent_id` (`parent_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='UIED分类表';

-- 网站表
CREATE TABLE IF NOT EXISTS `uied_website` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `old_id` varchar(50) DEFAULT NULL COMMENT '原SQLite cuid',
  `name` varchar(200) NOT NULL DEFAULT '' COMMENT '网站名称',
  `slug` varchar(200) DEFAULT NULL COMMENT '固定链接',
  `description` text NOT NULL COMMENT '网站描述',
  `url` varchar(500) NOT NULL DEFAULT '' COMMENT '网站URL',
  `icon_url` varchar(500) DEFAULT NULL COMMENT '网站图标URL',
  `category_id` int(10) unsigned NOT NULL COMMENT '分类ID',
  `is_new` tinyint(1) unsigned NOT NULL DEFAULT '0' COMMENT '是否新站',
  `is_featured` tinyint(1) unsigned NOT NULL DEFAULT '0' COMMENT '是否推荐',
  `is_hot` tinyint(1) unsigned NOT NULL DEFAULT '0' COMMENT '是否热门',
  `is_pinned` tinyint(1) unsigned NOT NULL DEFAULT '0' COMMENT '是否置顶',
  `tags` text COMMENT '标签JSON数组',
  `sort` int(10) unsigned NOT NULL DEFAULT '0' COMMENT '排序',
  `click_count` int(10) unsigned NOT NULL DEFAULT '0' COMMENT '点击次数',
  `seo_title` varchar(100) DEFAULT NULL COMMENT 'SEO标题',
  `seo_description` varchar(300) DEFAULT NULL COMMENT 'SEO描述',
  `seo_keywords` varchar(200) DEFAULT NULL COMMENT 'SEO关键词',
  `detail_content` text COMMENT '详情页富文本内容',
  `screenshots` text COMMENT '截图URL列表JSON',
  `visit_btn_text` varchar(50) DEFAULT NULL COMMENT '访问按钮文字',
  `status` varchar(20) NOT NULL DEFAULT 'unchecked' COMMENT '状态',
  `last_checked_at` int(10) unsigned DEFAULT NULL COMMENT '最后检测时间戳',
  `failed_count` int(10) unsigned NOT NULL DEFAULT '0' COMMENT '连续失败次数',
  `status_message` varchar(500) DEFAULT NULL COMMENT '状态消息',
  `is_delete` tinyint(1) unsigned NOT NULL DEFAULT '0' COMMENT '是否删除',
  `create_time` int(10) unsigned NOT NULL DEFAULT '0' COMMENT '创建时间',
  `update_time` int(10) unsigned NOT NULL DEFAULT '0' COMMENT '更新时间',
  `delete_time` int(10) unsigned NOT NULL DEFAULT '0' COMMENT '删除时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`),
  KEY `category_id` (`category_id`),
  KEY `is_new` (`is_new`),
  KEY `is_featured` (`is_featured`),
  KEY `is_hot` (`is_hot`),
  KEY `is_pinned` (`is_pinned`),
  KEY `click_count` (`click_count`),
  KEY `status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='UIED网站表';


-- 页面配置表
CREATE TABLE IF NOT EXISTS `uied_page` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `old_id` varchar(50) DEFAULT NULL COMMENT '原SQLite cuid',
  `name` varchar(100) NOT NULL DEFAULT '' COMMENT '页面名称',
  `slug` varchar(100) NOT NULL COMMENT 'URL路径',
  `type` varchar(50) NOT NULL DEFAULT '' COMMENT '页面类型标识',
  `icon` varchar(100) DEFAULT NULL COMMENT '图标名称',
  `description` text COMMENT '页面描述',
  `sort` int(10) unsigned NOT NULL DEFAULT '0' COMMENT '排序',
  `is_show` tinyint(1) unsigned NOT NULL DEFAULT '1' COMMENT '是否显示',
  `hero_title` varchar(200) DEFAULT NULL COMMENT '页面主标题',
  `hero_highlight_text` varchar(100) DEFAULT NULL COMMENT '高亮文本',
  `hero_subtitle` text COMMENT '页面副标题',
  `hot_search_tags` text COMMENT '热门搜索标签JSON',
  `hero_bg_type` varchar(20) NOT NULL DEFAULT 'default' COMMENT '背景类型',
  `hero_bg_value` varchar(500) DEFAULT NULL COMMENT '背景值',
  `hero_display_mode` varchar(20) NOT NULL DEFAULT 'search' COMMENT '显示模式',
  `hero_scroll_websites` text COMMENT '滚动图标网站ID列表JSON',
  `search_placeholder` varchar(200) DEFAULT NULL COMMENT '搜索框占位符',
  `search_enabled` tinyint(1) unsigned NOT NULL DEFAULT '1' COMMENT '是否启用搜索',
  `show_hot_recommendations` tinyint(1) unsigned NOT NULL DEFAULT '1' COMMENT '是否显示热门推荐',
  `show_categories` tinyint(1) unsigned NOT NULL DEFAULT '1' COMMENT '是否显示分类',
  `show_sidebar` tinyint(1) unsigned NOT NULL DEFAULT '1' COMMENT '是否显示侧边栏',
  `theme_color` varchar(20) DEFAULT NULL COMMENT '主题色',
  `is_delete` tinyint(1) unsigned NOT NULL DEFAULT '0' COMMENT '是否删除',
  `create_time` int(10) unsigned NOT NULL DEFAULT '0' COMMENT '创建时间',
  `update_time` int(10) unsigned NOT NULL DEFAULT '0' COMMENT '更新时间',
  `delete_time` int(10) unsigned NOT NULL DEFAULT '0' COMMENT '删除时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='UIED页面配置表';

-- 页面分类关联表
CREATE TABLE IF NOT EXISTS `uied_page_category` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `old_id` varchar(50) DEFAULT NULL COMMENT '原SQLite cuid',
  `page_id` int(10) unsigned NOT NULL COMMENT '页面ID',
  `category_id` int(10) unsigned NOT NULL COMMENT '分类ID',
  `sort` int(10) unsigned NOT NULL DEFAULT '0' COMMENT '排序',
  `is_show` tinyint(1) unsigned NOT NULL DEFAULT '1' COMMENT '是否显示',
  `is_delete` tinyint(1) unsigned NOT NULL DEFAULT '0' COMMENT '是否删除',
  `create_time` int(10) unsigned NOT NULL DEFAULT '0' COMMENT '创建时间',
  `update_time` int(10) unsigned NOT NULL DEFAULT '0' COMMENT '更新时间',
  `delete_time` int(10) unsigned NOT NULL DEFAULT '0' COMMENT '删除时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `page_category` (`page_id`,`category_id`),
  KEY `page_id` (`page_id`),
  KEY `category_id` (`category_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='UIED页面分类关联表';

-- 热门推荐表
CREATE TABLE IF NOT EXISTS `uied_hot_recommendation` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `old_id` varchar(50) DEFAULT NULL COMMENT '原SQLite cuid',
  `name` varchar(200) NOT NULL DEFAULT '' COMMENT '网站名称',
  `description` text NOT NULL COMMENT '描述',
  `url` varchar(500) NOT NULL DEFAULT '' COMMENT '链接地址',
  `icon_url` varchar(500) DEFAULT NULL COMMENT '图标URL',
  `page_slug` varchar(100) DEFAULT NULL COMMENT '所属页面slug',
  `position` varchar(20) NOT NULL DEFAULT 'hot' COMMENT '位置',
  `sort` int(10) unsigned NOT NULL DEFAULT '0' COMMENT '排序',
  `is_show` tinyint(1) unsigned NOT NULL DEFAULT '1' COMMENT '是否显示',
  `start_time` int(10) unsigned DEFAULT NULL COMMENT '开始展示时间戳',
  `end_time` int(10) unsigned DEFAULT NULL COMMENT '结束展示时间戳',
  `click_count` int(10) unsigned NOT NULL DEFAULT '0' COMMENT '点击次数',
  `is_delete` tinyint(1) unsigned NOT NULL DEFAULT '0' COMMENT '是否删除',
  `create_time` int(10) unsigned NOT NULL DEFAULT '0' COMMENT '创建时间',
  `update_time` int(10) unsigned NOT NULL DEFAULT '0' COMMENT '更新时间',
  `delete_time` int(10) unsigned NOT NULL DEFAULT '0' COMMENT '删除时间',
  PRIMARY KEY (`id`),
  KEY `page_slug` (`page_slug`),
  KEY `position` (`position`),
  KEY `is_show` (`is_show`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='UIED热门推荐表';


-- 广告位表
CREATE TABLE IF NOT EXISTS `uied_banner` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `old_id` varchar(50) DEFAULT NULL COMMENT '原SQLite cuid',
  `title` varchar(200) NOT NULL DEFAULT '' COMMENT '标题',
  `description` text COMMENT '描述',
  `image_url` varchar(500) DEFAULT NULL COMMENT '图片URL',
  `link_url` varchar(500) DEFAULT NULL COMMENT '点击跳转链接',
  `link_target` varchar(20) NOT NULL DEFAULT '_blank' COMMENT '链接打开方式',
  `content_type` varchar(20) NOT NULL DEFAULT 'image' COMMENT '内容类型',
  `html_content` text COMMENT 'HTML代码内容',
  `page_slug` varchar(100) DEFAULT NULL COMMENT '所属页面slug',
  `position` varchar(20) NOT NULL DEFAULT 'top' COMMENT '位置',
  `sort` int(10) unsigned NOT NULL DEFAULT '0' COMMENT '排序',
  `is_show` tinyint(1) unsigned NOT NULL DEFAULT '1' COMMENT '是否显示',
  `start_time` int(10) unsigned DEFAULT NULL COMMENT '开始展示时间戳',
  `end_time` int(10) unsigned DEFAULT NULL COMMENT '结束展示时间戳',
  `click_count` int(10) unsigned NOT NULL DEFAULT '0' COMMENT '点击次数',
  `is_delete` tinyint(1) unsigned NOT NULL DEFAULT '0' COMMENT '是否删除',
  `create_time` int(10) unsigned NOT NULL DEFAULT '0' COMMENT '创建时间',
  `update_time` int(10) unsigned NOT NULL DEFAULT '0' COMMENT '更新时间',
  `delete_time` int(10) unsigned NOT NULL DEFAULT '0' COMMENT '删除时间',
  PRIMARY KEY (`id`),
  KEY `page_slug` (`page_slug`),
  KEY `position` (`position`),
  KEY `is_show` (`is_show`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='UIED广告位表';

-- 站点设置表
CREATE TABLE IF NOT EXISTS `uied_site_setting` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `old_id` varchar(50) DEFAULT NULL COMMENT '原SQLite cuid',
  `key` varchar(100) NOT NULL COMMENT '配置键名',
  `value` text NOT NULL COMMENT 'JSON格式的配置值',
  `is_delete` tinyint(1) unsigned NOT NULL DEFAULT '0' COMMENT '是否删除',
  `create_time` int(10) unsigned NOT NULL DEFAULT '0' COMMENT '创建时间',
  `update_time` int(10) unsigned NOT NULL DEFAULT '0' COMMENT '更新时间',
  `delete_time` int(10) unsigned NOT NULL DEFAULT '0' COMMENT '删除时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `key` (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='UIED站点设置表';

-- 站点基本信息表
CREATE TABLE IF NOT EXISTS `uied_site_info` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `old_id` varchar(50) DEFAULT NULL COMMENT '原SQLite cuid',
  `site_name` varchar(200) NOT NULL DEFAULT '' COMMENT '网站名称',
  `site_title` varchar(200) NOT NULL DEFAULT '' COMMENT '网站标题(SEO)',
  `description` text NOT NULL COMMENT '网站描述',
  `keywords` varchar(500) NOT NULL DEFAULT '' COMMENT '关键词',
  `logo` varchar(500) DEFAULT NULL COMMENT 'Logo URL',
  `favicon` varchar(500) DEFAULT NULL COMMENT 'Favicon URL',
  `icp` varchar(100) DEFAULT NULL COMMENT '备案号',
  `icp_link` varchar(500) DEFAULT NULL COMMENT '备案链接',
  `copyright` varchar(500) DEFAULT NULL COMMENT '版权信息',
  `is_delete` tinyint(1) unsigned NOT NULL DEFAULT '0' COMMENT '是否删除',
  `create_time` int(10) unsigned NOT NULL DEFAULT '0' COMMENT '创建时间',
  `update_time` int(10) unsigned NOT NULL DEFAULT '0' COMMENT '更新时间',
  `delete_time` int(10) unsigned NOT NULL DEFAULT '0' COMMENT '删除时间',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='UIED站点基本信息表';

-- 导航菜单表
CREATE TABLE IF NOT EXISTS `uied_nav_menu` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `old_id` varchar(50) DEFAULT NULL COMMENT '原SQLite cuid',
  `text` varchar(100) NOT NULL DEFAULT '' COMMENT '菜单文字',
  `link` varchar(500) DEFAULT NULL COMMENT '链接地址',
  `external` tinyint(1) unsigned NOT NULL DEFAULT '0' COMMENT '是否外部链接',
  `label` varchar(50) DEFAULT NULL COMMENT '标签文字',
  `label_type` varchar(20) DEFAULT NULL COMMENT '标签类型',
  `icon` varchar(100) DEFAULT NULL COMMENT '图标',
  `parent_id` int(10) unsigned DEFAULT NULL COMMENT '父菜单ID',
  `sort` int(10) unsigned NOT NULL DEFAULT '0' COMMENT '排序',
  `is_show` tinyint(1) unsigned NOT NULL DEFAULT '1' COMMENT '是否显示',
  `is_delete` tinyint(1) unsigned NOT NULL DEFAULT '0' COMMENT '是否删除',
  `create_time` int(10) unsigned NOT NULL DEFAULT '0' COMMENT '创建时间',
  `update_time` int(10) unsigned NOT NULL DEFAULT '0' COMMENT '更新时间',
  `delete_time` int(10) unsigned NOT NULL DEFAULT '0' COMMENT '删除时间',
  PRIMARY KEY (`id`),
  KEY `parent_id` (`parent_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='UIED导航菜单表';


-- 页脚链接分组表
CREATE TABLE IF NOT EXISTS `uied_footer_group` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `old_id` varchar(50) DEFAULT NULL COMMENT '原SQLite cuid',
  `title` varchar(100) NOT NULL DEFAULT '' COMMENT '分组标题',
  `sort` int(10) unsigned NOT NULL DEFAULT '0' COMMENT '排序',
  `is_show` tinyint(1) unsigned NOT NULL DEFAULT '1' COMMENT '是否显示',
  `is_delete` tinyint(1) unsigned NOT NULL DEFAULT '0' COMMENT '是否删除',
  `create_time` int(10) unsigned NOT NULL DEFAULT '0' COMMENT '创建时间',
  `update_time` int(10) unsigned NOT NULL DEFAULT '0' COMMENT '更新时间',
  `delete_time` int(10) unsigned NOT NULL DEFAULT '0' COMMENT '删除时间',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='UIED页脚链接分组表';

-- 页脚链接表
CREATE TABLE IF NOT EXISTS `uied_footer_link` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `old_id` varchar(50) DEFAULT NULL COMMENT '原SQLite cuid',
  `text` varchar(100) NOT NULL DEFAULT '' COMMENT '链接文字',
  `url` varchar(500) NOT NULL DEFAULT '' COMMENT '链接地址',
  `external` tinyint(1) unsigned NOT NULL DEFAULT '1' COMMENT '是否外部链接',
  `group_id` int(10) unsigned NOT NULL COMMENT '分组ID',
  `sort` int(10) unsigned NOT NULL DEFAULT '0' COMMENT '排序',
  `is_show` tinyint(1) unsigned NOT NULL DEFAULT '1' COMMENT '是否显示',
  `is_delete` tinyint(1) unsigned NOT NULL DEFAULT '0' COMMENT '是否删除',
  `create_time` int(10) unsigned NOT NULL DEFAULT '0' COMMENT '创建时间',
  `update_time` int(10) unsigned NOT NULL DEFAULT '0' COMMENT '更新时间',
  `delete_time` int(10) unsigned NOT NULL DEFAULT '0' COMMENT '删除时间',
  PRIMARY KEY (`id`),
  KEY `group_id` (`group_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='UIED页脚链接表';

-- 友情链接表
CREATE TABLE IF NOT EXISTS `uied_friend_link` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `old_id` varchar(50) DEFAULT NULL COMMENT '原SQLite cuid',
  `name` varchar(100) NOT NULL DEFAULT '' COMMENT '链接名称',
  `url` varchar(500) NOT NULL DEFAULT '' COMMENT '链接地址',
  `sort` int(10) unsigned NOT NULL DEFAULT '0' COMMENT '排序',
  `is_show` tinyint(1) unsigned NOT NULL DEFAULT '1' COMMENT '是否显示',
  `is_delete` tinyint(1) unsigned NOT NULL DEFAULT '0' COMMENT '是否删除',
  `create_time` int(10) unsigned NOT NULL DEFAULT '0' COMMENT '创建时间',
  `update_time` int(10) unsigned NOT NULL DEFAULT '0' COMMENT '更新时间',
  `delete_time` int(10) unsigned NOT NULL DEFAULT '0' COMMENT '删除时间',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='UIED友情链接表';

-- 社交媒体分组表
CREATE TABLE IF NOT EXISTS `uied_social_media_group` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `old_id` varchar(50) DEFAULT NULL COMMENT '原SQLite cuid',
  `name` varchar(100) NOT NULL DEFAULT '' COMMENT '分组名称',
  `icon` varchar(100) DEFAULT NULL COMMENT '分组图标',
  `display_type` varchar(20) NOT NULL DEFAULT 'links' COMMENT '展示类型',
  `sort` int(10) unsigned NOT NULL DEFAULT '0' COMMENT '排序',
  `is_show` tinyint(1) unsigned NOT NULL DEFAULT '1' COMMENT '是否显示',
  `is_delete` tinyint(1) unsigned NOT NULL DEFAULT '0' COMMENT '是否删除',
  `create_time` int(10) unsigned NOT NULL DEFAULT '0' COMMENT '创建时间',
  `update_time` int(10) unsigned NOT NULL DEFAULT '0' COMMENT '更新时间',
  `delete_time` int(10) unsigned NOT NULL DEFAULT '0' COMMENT '删除时间',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='UIED社交媒体分组表';

-- 社交媒体项目表
CREATE TABLE IF NOT EXISTS `uied_social_media_item` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `old_id` varchar(50) DEFAULT NULL COMMENT '原SQLite cuid',
  `group_id` int(10) unsigned NOT NULL COMMENT '所属分组ID',
  `name` varchar(100) NOT NULL DEFAULT '' COMMENT '名称',
  `type` varchar(50) NOT NULL DEFAULT 'other' COMMENT '类型',
  `icon` varchar(100) DEFAULT NULL COMMENT '图标',
  `link` varchar(500) DEFAULT NULL COMMENT '链接地址',
  `qr_code_url` varchar(500) DEFAULT NULL COMMENT '二维码图片URL',
  `description` text COMMENT '描述文字',
  `extra_info` text COMMENT '额外信息JSON',
  `sort` int(10) unsigned NOT NULL DEFAULT '0' COMMENT '排序',
  `is_show` tinyint(1) unsigned NOT NULL DEFAULT '1' COMMENT '是否显示',
  `is_delete` tinyint(1) unsigned NOT NULL DEFAULT '0' COMMENT '是否删除',
  `create_time` int(10) unsigned NOT NULL DEFAULT '0' COMMENT '创建时间',
  `update_time` int(10) unsigned NOT NULL DEFAULT '0' COMMENT '更新时间',
  `delete_time` int(10) unsigned NOT NULL DEFAULT '0' COMMENT '删除时间',
  PRIMARY KEY (`id`),
  KEY `group_id` (`group_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='UIED社交媒体项目表';


-- Favicon API 配置表
CREATE TABLE IF NOT EXISTS `uied_favicon_api` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `old_id` varchar(50) DEFAULT NULL COMMENT '原SQLite cuid',
  `name` varchar(100) NOT NULL DEFAULT '' COMMENT 'API名称',
  `url_template` varchar(500) NOT NULL DEFAULT '' COMMENT 'URL模板',
  `description` text COMMENT '描述',
  `sort` int(10) unsigned NOT NULL DEFAULT '0' COMMENT '优先级排序',
  `is_enabled` tinyint(1) unsigned NOT NULL DEFAULT '1' COMMENT '是否启用',
  `is_delete` tinyint(1) unsigned NOT NULL DEFAULT '0' COMMENT '是否删除',
  `create_time` int(10) unsigned NOT NULL DEFAULT '0' COMMENT '创建时间',
  `update_time` int(10) unsigned NOT NULL DEFAULT '0' COMMENT '更新时间',
  `delete_time` int(10) unsigned NOT NULL DEFAULT '0' COMMENT '删除时间',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='UIED Favicon API配置表';

-- AI 助手配置表
CREATE TABLE IF NOT EXISTS `uied_ai_config` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `old_id` varchar(50) DEFAULT NULL COMMENT '原SQLite cuid',
  `name` varchar(100) NOT NULL DEFAULT '' COMMENT '配置名称',
  `provider` varchar(50) NOT NULL DEFAULT '' COMMENT '提供商',
  `api_url` varchar(500) NOT NULL DEFAULT '' COMMENT 'API地址',
  `api_key` varchar(500) NOT NULL DEFAULT '' COMMENT 'API密钥',
  `model` varchar(100) NOT NULL DEFAULT '' COMMENT '模型名称',
  `is_enabled` tinyint(1) unsigned NOT NULL DEFAULT '1' COMMENT '是否启用',
  `is_default` tinyint(1) unsigned NOT NULL DEFAULT '0' COMMENT '是否默认',
  `is_delete` tinyint(1) unsigned NOT NULL DEFAULT '0' COMMENT '是否删除',
  `create_time` int(10) unsigned NOT NULL DEFAULT '0' COMMENT '创建时间',
  `update_time` int(10) unsigned NOT NULL DEFAULT '0' COMMENT '更新时间',
  `delete_time` int(10) unsigned NOT NULL DEFAULT '0' COMMENT '删除时间',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='UIED AI助手配置表';

-- 文章表
CREATE TABLE IF NOT EXISTS `uied_article` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `old_id` varchar(50) DEFAULT NULL COMMENT '原SQLite cuid',
  `title` varchar(200) NOT NULL DEFAULT '' COMMENT '文章标题',
  `content` longtext NOT NULL COMMENT 'Markdown内容',
  `excerpt` text NOT NULL COMMENT '摘要',
  `cover_image` varchar(500) DEFAULT NULL COMMENT '封面图片URL',
  `author` varchar(100) NOT NULL DEFAULT '' COMMENT '作者',
  `category` varchar(100) NOT NULL DEFAULT '' COMMENT '分类',
  `slug` varchar(200) NOT NULL COMMENT 'URL slug',
  `status` varchar(20) NOT NULL DEFAULT 'draft' COMMENT '状态',
  `view_count` int(10) unsigned NOT NULL DEFAULT '0' COMMENT '浏览次数',
  `seo_title` varchar(100) DEFAULT NULL COMMENT 'SEO标题',
  `seo_description` varchar(300) DEFAULT NULL COMMENT 'SEO描述',
  `published_at` int(10) unsigned DEFAULT NULL COMMENT '发布时间戳',
  `is_delete` tinyint(1) unsigned NOT NULL DEFAULT '0' COMMENT '是否删除',
  `create_time` int(10) unsigned NOT NULL DEFAULT '0' COMMENT '创建时间',
  `update_time` int(10) unsigned NOT NULL DEFAULT '0' COMMENT '更新时间',
  `delete_time` int(10) unsigned NOT NULL DEFAULT '0' COMMENT '删除时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`),
  KEY `status` (`status`),
  KEY `category` (`category`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='UIED文章表';

-- 媒体库表
CREATE TABLE IF NOT EXISTS `uied_media` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `old_id` varchar(50) DEFAULT NULL COMMENT '原SQLite cuid',
  `filename` varchar(200) NOT NULL DEFAULT '' COMMENT '文件名',
  `original_name` varchar(200) NOT NULL DEFAULT '' COMMENT '原始文件名',
  `mime_type` varchar(100) NOT NULL DEFAULT '' COMMENT 'MIME类型',
  `size` int(10) unsigned NOT NULL DEFAULT '0' COMMENT '文件大小(字节)',
  `url` varchar(500) NOT NULL DEFAULT '' COMMENT '访问URL',
  `width` int(10) unsigned DEFAULT NULL COMMENT '图片宽度',
  `height` int(10) unsigned DEFAULT NULL COMMENT '图片高度',
  `alt` varchar(200) DEFAULT NULL COMMENT '替代文本',
  `folder` varchar(100) NOT NULL DEFAULT 'default' COMMENT '文件夹分类',
  `uploaded_by` varchar(50) DEFAULT NULL COMMENT '上传者',
  `is_delete` tinyint(1) unsigned NOT NULL DEFAULT '0' COMMENT '是否删除',
  `create_time` int(10) unsigned NOT NULL DEFAULT '0' COMMENT '创建时间',
  `update_time` int(10) unsigned NOT NULL DEFAULT '0' COMMENT '更新时间',
  `delete_time` int(10) unsigned NOT NULL DEFAULT '0' COMMENT '删除时间',
  PRIMARY KEY (`id`),
  KEY `folder` (`folder`),
  KEY `mime_type` (`mime_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='UIED媒体库表';

-- 操作日志表
CREATE TABLE IF NOT EXISTS `uied_operation_log` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `old_id` varchar(50) DEFAULT NULL COMMENT '原SQLite cuid',
  `admin_id` varchar(50) DEFAULT NULL COMMENT '操作管理员ID',
  `admin_name` varchar(100) NOT NULL DEFAULT '' COMMENT '操作管理员用户名',
  `action` varchar(50) NOT NULL DEFAULT '' COMMENT '操作类型',
  `module` varchar(50) NOT NULL DEFAULT '' COMMENT '操作模块',
  `target_id` varchar(50) DEFAULT NULL COMMENT '操作目标ID',
  `target_name` varchar(200) DEFAULT NULL COMMENT '操作目标名称',
  `detail` text COMMENT '操作详情JSON',
  `ip` varchar(50) DEFAULT NULL COMMENT '操作IP地址',
  `user_agent` varchar(500) DEFAULT NULL COMMENT '浏览器信息',
  `status` varchar(20) NOT NULL DEFAULT 'success' COMMENT '操作状态',
  `error_msg` text COMMENT '错误信息',
  `create_time` int(10) unsigned NOT NULL DEFAULT '0' COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `admin_id` (`admin_id`),
  KEY `action` (`action`),
  KEY `module` (`module`),
  KEY `create_time` (`create_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='UIED操作日志表';
