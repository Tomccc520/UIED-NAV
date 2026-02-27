/**
 * @file scripts/import-mysql.js
 * @description 将 SQLite 导出的 JSON 数据导入到 MySQL
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// MySQL 连接配置
const dbConfig = {
  host: 'localhost',
  port: 3308,
  user: 'uied',
  password: 'uied123456',
  database: 'uied_nav',
  charset: 'utf8mb4',
};

// ID 映射表 (cuid -> int)
const idMaps = {
  Category: {},
  Website: {},
  Page: {},
  PageCategory: {},
  HotRecommendation: {},
  Banner: {},
  SiteSetting: {},
  SiteInfo: {},
  NavMenu: {},
  FooterGroup: {},
  FooterLink: {},
  FriendLink: {},
  SocialMediaGroup: {},
  SocialMediaItem: {},
  FaviconApi: {},
  AiConfig: {},
  Article: {},
  Media: {},
  OperationLog: {},
};

// 转换时间戳
function toTimestamp(dateStr) {
  if (!dateStr) return 0;
  return Math.floor(new Date(dateStr).getTime() / 1000);
}

// 转换布尔值
function toBool(val) {
  return val ? 1 : 0;
}

async function importData() {
  // 读取导出的 JSON 数据
  const dataPath = path.join(__dirname, '../data/export_20260201.json');
  if (!fs.existsSync(dataPath)) {
    console.error('导出文件不存在:', dataPath);
    process.exit(1);
  }
  
  const exportData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
  console.log('读取导出数据成功\n');
  
  // 连接 MySQL
  const connection = await mysql.createConnection(dbConfig);
  console.log('连接 MySQL 成功\n');
  
  try {
    // 开始事务
    await connection.beginTransaction();
    
    // 1. 导入分类 (先导入父分类，再导入子分类)
    console.log('导入分类...');
    const categories = exportData.tables.Category || [];
    // 先导入没有父分类的
    const rootCategories = categories.filter(c => !c.parentId);
    const childCategories = categories.filter(c => c.parentId);
    
    for (const cat of rootCategories) {
      const [result] = await connection.execute(
        `INSERT INTO uied_category (old_id, name, slug, icon, color, description, parent_id, sort, is_show, create_time, update_time)
         VALUES (?, ?, ?, ?, ?, ?, NULL, ?, ?, ?, ?)`,
        [cat.id, cat.name, cat.slug, cat.icon || '', cat.color || '#1890ff', cat.description,
         cat.order || 0, toBool(cat.visible), toTimestamp(cat.createdAt), toTimestamp(cat.updatedAt)]
      );
      idMaps.Category[cat.id] = result.insertId;
    }
    
    // 再导入子分类
    for (const cat of childCategories) {
      const parentId = idMaps.Category[cat.parentId] || null;
      const [result] = await connection.execute(
        `INSERT INTO uied_category (old_id, name, slug, icon, color, description, parent_id, sort, is_show, create_time, update_time)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [cat.id, cat.name, cat.slug, cat.icon || '', cat.color || '#1890ff', cat.description,
         parentId, cat.order || 0, toBool(cat.visible), toTimestamp(cat.createdAt), toTimestamp(cat.updatedAt)]
      );
      idMaps.Category[cat.id] = result.insertId;
    }
    console.log(`✅ 分类: ${categories.length} 条`);

    
    // 2. 导入网站
    console.log('导入网站...');
    const websites = exportData.tables.Website || [];
    for (const site of websites) {
      const categoryId = idMaps.Category[site.categoryId];
      if (!categoryId) {
        console.warn(`  跳过网站 ${site.name}: 分类不存在`);
        continue;
      }
      const [result] = await connection.execute(
        `INSERT INTO uied_website (old_id, name, slug, description, url, icon_url, category_id, 
         is_new, is_featured, is_hot, is_pinned, tags, sort, click_count,
         seo_title, seo_description, seo_keywords, detail_content, screenshots, visit_btn_text,
         status, last_checked_at, failed_count, status_message, create_time, update_time)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [site.id, site.name, site.slug, site.description || '', site.url, site.iconUrl,
         categoryId, toBool(site.isNew), toBool(site.isFeatured), toBool(site.isHot), toBool(site.isPinned),
         site.tags, site.order || 0, site.clickCount || 0,
         site.seoTitle, site.seoDescription, site.seoKeywords, site.detailContent, site.screenshots, site.visitBtnText,
         site.status || 'unchecked', site.lastCheckedAt ? toTimestamp(site.lastCheckedAt) : null,
         site.failedCount || 0, site.statusMessage,
         toTimestamp(site.createdAt), toTimestamp(site.updatedAt)]
      );
      idMaps.Website[site.id] = result.insertId;
    }
    console.log(`✅ 网站: ${Object.keys(idMaps.Website).length} 条`);
    
    // 3. 导入页面
    console.log('导入页面...');
    const pages = exportData.tables.Page || [];
    for (const page of pages) {
      const [result] = await connection.execute(
        `INSERT INTO uied_page (old_id, name, slug, type, icon, description, sort, is_show,
         hero_title, hero_highlight_text, hero_subtitle, hot_search_tags, hero_bg_type, hero_bg_value,
         hero_display_mode, hero_scroll_websites, search_placeholder, search_enabled,
         show_hot_recommendations, show_categories, show_sidebar, theme_color, create_time, update_time)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [page.id, page.name, page.slug, page.type || '', page.icon, page.description,
         page.order || 0, toBool(page.visible),
         page.heroTitle, page.heroHighlightText, page.heroSubtitle, page.hotSearchTags,
         page.heroBgType || 'default', page.heroBgValue,
         page.heroDisplayMode || 'search', page.heroScrollWebsites,
         page.searchPlaceholder, toBool(page.searchEnabled !== false),
         toBool(page.showHotRecommendations !== false), toBool(page.showCategories !== false),
         toBool(page.showSidebar !== false), page.themeColor,
         toTimestamp(page.createdAt), toTimestamp(page.updatedAt)]
      );
      idMaps.Page[page.id] = result.insertId;
    }
    console.log(`✅ 页面: ${pages.length} 条`);
    
    // 4. 导入页面分类关联
    console.log('导入页面分类关联...');
    const pageCategories = exportData.tables.PageCategory || [];
    for (const pc of pageCategories) {
      const pageId = idMaps.Page[pc.pageId];
      const categoryId = idMaps.Category[pc.categoryId];
      if (!pageId || !categoryId) continue;
      await connection.execute(
        `INSERT INTO uied_page_category (old_id, page_id, category_id, sort, is_show, create_time, update_time)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [pc.id, pageId, categoryId, pc.order || 0, toBool(pc.visible),
         toTimestamp(pc.createdAt), toTimestamp(pc.updatedAt)]
      );
    }
    console.log(`✅ 页面分类关联: ${pageCategories.length} 条`);

    
    // 5. 导入热门推荐
    console.log('导入热门推荐...');
    const hotRecs = exportData.tables.HotRecommendation || [];
    for (const rec of hotRecs) {
      await connection.execute(
        `INSERT INTO uied_hot_recommendation (old_id, name, description, url, icon_url, page_slug, position, sort, is_show, start_time, end_time, click_count, create_time, update_time)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [rec.id, rec.name, rec.description || '', rec.url, rec.iconUrl, rec.pageSlug,
         rec.position || 'hot', rec.order || 0, toBool(rec.visible),
         rec.startDate ? toTimestamp(rec.startDate) : null, rec.endDate ? toTimestamp(rec.endDate) : null,
         rec.clickCount || 0, toTimestamp(rec.createdAt), toTimestamp(rec.updatedAt)]
      );
    }
    console.log(`✅ 热门推荐: ${hotRecs.length} 条`);
    
    // 6. 导入广告位
    console.log('导入广告位...');
    const banners = exportData.tables.Banner || [];
    for (const banner of banners) {
      await connection.execute(
        `INSERT INTO uied_banner (old_id, title, description, image_url, link_url, link_target, content_type, html_content, page_slug, position, sort, is_show, start_time, end_time, click_count, create_time, update_time)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [banner.id, banner.title, banner.description, banner.imageUrl, banner.linkUrl,
         banner.linkTarget || '_blank', banner.contentType || 'image', banner.htmlContent,
         banner.pageSlug, banner.position || 'top', banner.order || 0, toBool(banner.visible),
         banner.startDate ? toTimestamp(banner.startDate) : null, banner.endDate ? toTimestamp(banner.endDate) : null,
         banner.clickCount || 0, toTimestamp(banner.createdAt), toTimestamp(banner.updatedAt)]
      );
    }
    console.log(`✅ 广告位: ${banners.length} 条`);
    
    // 7. 导入站点设置
    console.log('导入站点设置...');
    const siteSettings = exportData.tables.SiteSetting || [];
    for (const setting of siteSettings) {
      await connection.execute(
        `INSERT INTO uied_site_setting (old_id, \`key\`, value, create_time, update_time)
         VALUES (?, ?, ?, ?, ?)`,
        [setting.id, setting.key, setting.value, toTimestamp(setting.createdAt), toTimestamp(setting.updatedAt)]
      );
    }
    console.log(`✅ 站点设置: ${siteSettings.length} 条`);
    
    // 8. 导入站点信息
    console.log('导入站点信息...');
    const siteInfos = exportData.tables.SiteInfo || [];
    for (const info of siteInfos) {
      await connection.execute(
        `INSERT INTO uied_site_info (old_id, site_name, site_title, description, keywords, logo, favicon, icp, icp_link, copyright, create_time, update_time)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [info.id, info.siteName || '', info.siteTitle || '', info.description || '', info.keywords || '',
         info.logo, info.favicon, info.icp, info.icpLink, info.copyright,
         toTimestamp(info.createdAt), toTimestamp(info.updatedAt)]
      );
    }
    console.log(`✅ 站点信息: ${siteInfos.length} 条`);

    
    // 9. 导入导航菜单 (先导入父菜单，再导入子菜单)
    console.log('导入导航菜单...');
    const navMenus = exportData.tables.NavMenu || [];
    const rootMenus = navMenus.filter(m => !m.parentId);
    const childMenus = navMenus.filter(m => m.parentId);
    
    for (const menu of rootMenus) {
      const [result] = await connection.execute(
        `INSERT INTO uied_nav_menu (old_id, text, link, external, label, label_type, icon, parent_id, sort, is_show, create_time, update_time)
         VALUES (?, ?, ?, ?, ?, ?, ?, NULL, ?, ?, ?, ?)`,
        [menu.id, menu.text, menu.link, toBool(menu.external), menu.label, menu.labelType, menu.icon,
         menu.order || 0, toBool(menu.visible), toTimestamp(menu.createdAt), toTimestamp(menu.updatedAt)]
      );
      idMaps.NavMenu[menu.id] = result.insertId;
    }
    
    for (const menu of childMenus) {
      const parentId = idMaps.NavMenu[menu.parentId] || null;
      const [result] = await connection.execute(
        `INSERT INTO uied_nav_menu (old_id, text, link, external, label, label_type, icon, parent_id, sort, is_show, create_time, update_time)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [menu.id, menu.text, menu.link, toBool(menu.external), menu.label, menu.labelType, menu.icon,
         parentId, menu.order || 0, toBool(menu.visible), toTimestamp(menu.createdAt), toTimestamp(menu.updatedAt)]
      );
      idMaps.NavMenu[menu.id] = result.insertId;
    }
    console.log(`✅ 导航菜单: ${navMenus.length} 条`);
    
    // 10. 导入页脚分组
    console.log('导入页脚分组...');
    const footerGroups = exportData.tables.FooterGroup || [];
    for (const group of footerGroups) {
      const [result] = await connection.execute(
        `INSERT INTO uied_footer_group (old_id, title, sort, is_show, create_time, update_time)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [group.id, group.title, group.order || 0, toBool(group.visible),
         toTimestamp(group.createdAt), toTimestamp(group.updatedAt)]
      );
      idMaps.FooterGroup[group.id] = result.insertId;
    }
    console.log(`✅ 页脚分组: ${footerGroups.length} 条`);
    
    // 11. 导入页脚链接
    console.log('导入页脚链接...');
    const footerLinks = exportData.tables.FooterLink || [];
    for (const link of footerLinks) {
      const groupId = idMaps.FooterGroup[link.groupId];
      if (!groupId) continue;
      await connection.execute(
        `INSERT INTO uied_footer_link (old_id, text, url, external, group_id, sort, is_show, create_time, update_time)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [link.id, link.text, link.url, toBool(link.external), groupId,
         link.order || 0, toBool(link.visible), toTimestamp(link.createdAt), toTimestamp(link.updatedAt)]
      );
    }
    console.log(`✅ 页脚链接: ${footerLinks.length} 条`);
    
    // 12. 导入友情链接
    console.log('导入友情链接...');
    const friendLinks = exportData.tables.FriendLink || [];
    for (const link of friendLinks) {
      await connection.execute(
        `INSERT INTO uied_friend_link (old_id, name, url, sort, is_show, create_time, update_time)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [link.id, link.name, link.url, link.order || 0, toBool(link.visible),
         toTimestamp(link.createdAt), toTimestamp(link.updatedAt)]
      );
    }
    console.log(`✅ 友情链接: ${friendLinks.length} 条`);

    
    // 13. 导入社交媒体分组
    console.log('导入社交媒体分组...');
    const socialGroups = exportData.tables.SocialMediaGroup || [];
    for (const group of socialGroups) {
      const [result] = await connection.execute(
        `INSERT INTO uied_social_media_group (old_id, name, icon, display_type, sort, is_show, create_time, update_time)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [group.id, group.name, group.icon, group.displayType || 'links',
         group.order || 0, toBool(group.visible), toTimestamp(group.createdAt), toTimestamp(group.updatedAt)]
      );
      idMaps.SocialMediaGroup[group.id] = result.insertId;
    }
    console.log(`✅ 社交媒体分组: ${socialGroups.length} 条`);
    
    // 14. 导入社交媒体项目
    console.log('导入社交媒体项目...');
    const socialItems = exportData.tables.SocialMediaItem || [];
    for (const item of socialItems) {
      const groupId = idMaps.SocialMediaGroup[item.groupId];
      if (!groupId) continue;
      await connection.execute(
        `INSERT INTO uied_social_media_item (old_id, group_id, name, type, icon, link, qr_code_url, description, extra_info, sort, is_show, create_time, update_time)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [item.id, groupId, item.name, item.type || 'other', item.icon, item.link, item.qrCodeUrl,
         item.description, item.extraInfo, item.order || 0, toBool(item.visible),
         toTimestamp(item.createdAt), toTimestamp(item.updatedAt)]
      );
    }
    console.log(`✅ 社交媒体项目: ${socialItems.length} 条`);
    
    // 15. 导入 Favicon API 配置
    console.log('导入 Favicon API 配置...');
    const faviconApis = exportData.tables.FaviconApi || [];
    for (const api of faviconApis) {
      await connection.execute(
        `INSERT INTO uied_favicon_api (old_id, name, url_template, description, sort, is_enabled, create_time, update_time)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [api.id, api.name, api.urlTemplate, api.description, api.order || 0, toBool(api.enabled),
         toTimestamp(api.createdAt), toTimestamp(api.updatedAt)]
      );
    }
    console.log(`✅ Favicon API: ${faviconApis.length} 条`);
    
    // 16. 导入 AI 配置
    console.log('导入 AI 配置...');
    const aiConfigs = exportData.tables.AiConfig || [];
    for (const config of aiConfigs) {
      await connection.execute(
        `INSERT INTO uied_ai_config (old_id, name, provider, api_url, api_key, model, is_enabled, is_default, create_time, update_time)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [config.id, config.name, config.provider, config.apiUrl, config.apiKey, config.model,
         toBool(config.enabled), toBool(config.isDefault),
         toTimestamp(config.createdAt), toTimestamp(config.updatedAt)]
      );
    }
    console.log(`✅ AI 配置: ${aiConfigs.length} 条`);
    
    // 17. 导入文章
    console.log('导入文章...');
    const articles = exportData.tables.Article || [];
    for (const article of articles) {
      await connection.execute(
        `INSERT INTO uied_article (old_id, title, content, excerpt, cover_image, author, category, slug, status, view_count, seo_title, seo_description, published_at, create_time, update_time)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [article.id, article.title, article.content || '', article.excerpt || '', article.coverImage,
         article.author || '', article.category || '', article.slug, article.status || 'draft',
         article.viewCount || 0, article.seoTitle, article.seoDescription,
         article.publishedAt ? toTimestamp(article.publishedAt) : null,
         toTimestamp(article.createdAt), toTimestamp(article.updatedAt)]
      );
    }
    console.log(`✅ 文章: ${articles.length} 条`);
    
    // 18. 导入媒体
    console.log('导入媒体...');
    const medias = exportData.tables.Media || [];
    for (const media of medias) {
      await connection.execute(
        `INSERT INTO uied_media (old_id, filename, original_name, mime_type, size, url, width, height, alt, folder, uploaded_by, create_time, update_time)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [media.id, media.filename, media.originalName, media.mimeType, media.size || 0, media.url,
         media.width, media.height, media.alt, media.folder || 'default', media.uploadedBy,
         toTimestamp(media.createdAt), toTimestamp(media.updatedAt)]
      );
    }
    console.log(`✅ 媒体: ${medias.length} 条`);

    
    // 19. 导入操作日志
    console.log('导入操作日志...');
    const opLogs = exportData.tables.OperationLog || [];
    for (const log of opLogs) {
      await connection.execute(
        `INSERT INTO uied_operation_log (old_id, admin_id, admin_name, action, module, target_id, target_name, detail, ip, user_agent, status, error_msg, create_time)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [log.id, log.adminId, log.adminName || '', log.action || '', log.module || '',
         log.targetId, log.targetName, log.detail, log.ip, log.userAgent,
         log.status || 'success', log.errorMsg, toTimestamp(log.createdAt)]
      );
    }
    console.log(`✅ 操作日志: ${opLogs.length} 条`);
    
    // 提交事务
    await connection.commit();
    
    console.log('\n========================================');
    console.log('数据导入完成！');
    console.log('========================================\n');
    
    // 打印统计
    console.log('导入统计:');
    console.log(`- 分类: ${Object.keys(idMaps.Category).length}`);
    console.log(`- 网站: ${Object.keys(idMaps.Website).length}`);
    console.log(`- 页面: ${Object.keys(idMaps.Page).length}`);
    console.log(`- 导航菜单: ${Object.keys(idMaps.NavMenu).length}`);
    console.log(`- 页脚分组: ${Object.keys(idMaps.FooterGroup).length}`);
    console.log(`- 社交媒体分组: ${Object.keys(idMaps.SocialMediaGroup).length}`);
    
    // 保存 ID 映射表
    const mappingPath = path.join(__dirname, '../data/id_mapping.json');
    fs.writeFileSync(mappingPath, JSON.stringify(idMaps, null, 2));
    console.log(`\nID 映射表已保存: ${mappingPath}`);
    
  } catch (error) {
    // 回滚事务
    await connection.rollback();
    console.error('导入失败，已回滚:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

// 运行导入
importData()
  .then(() => {
    console.log('\n导入脚本执行完成');
    process.exit(0);
  })
  .catch((error) => {
    console.error('导入失败:', error);
    process.exit(1);
  });
