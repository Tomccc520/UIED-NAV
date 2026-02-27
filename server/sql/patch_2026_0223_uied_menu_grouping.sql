-- ============================================
-- UIED 后台菜单功能分组优化补丁（可重复执行）
-- 目标：
-- 1) 在“网站设置(814)”与“运营管理(815)”下增加三级目录分组
-- 2) 将现有页面按功能归类，降低菜单混乱感
-- 3) 自动授权给 role_id=0/1（兼容历史角色）
-- ============================================

SET NAMES utf8mb4;
START TRANSACTION;

-- ----------------------------
-- 网站设置（814）分组
-- ----------------------------
INSERT INTO la_system_auth_menu
(id, pid, menu_type, menu_name, menu_icon, menu_sort, perms, paths, component, selected, params, is_cache, is_show, is_disable, create_time, update_time)
VALUES
(980, 814, 'M', '基础配置', 'el-icon-Setting', 50, '', 'base-config', '', '', '', 0, 1, 0, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
(981, 814, 'M', '商业授权', 'el-icon-Key', 40, '', 'commercial-auth', '', '', '', 0, 1, 0, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
(982, 814, 'M', '交付工具', 'el-icon-MagicStick', 30, '', 'delivery-tools', '', '', '', 0, 1, 0, UNIX_TIMESTAMP(), UNIX_TIMESTAMP())
ON DUPLICATE KEY UPDATE
pid = VALUES(pid),
menu_type = VALUES(menu_type),
menu_name = VALUES(menu_name),
menu_icon = VALUES(menu_icon),
menu_sort = VALUES(menu_sort),
paths = VALUES(paths),
component = VALUES(component),
is_show = VALUES(is_show),
is_disable = VALUES(is_disable),
update_time = UNIX_TIMESTAMP();

UPDATE la_system_auth_menu
SET pid = CASE id
    WHEN 713 THEN 980  -- 站点设置
    WHEN 724 THEN 980  -- AI配置
    WHEN 719 THEN 980  -- Favicon API
    WHEN 890 THEN 980  -- 文章配置
    WHEN 864 THEN 981  -- 许可证中心
    WHEN 866 THEN 981  -- 功能开关
    WHEN 894 THEN 982  -- 交付初始化
    ELSE pid
  END,
  update_time = UNIX_TIMESTAMP()
WHERE id IN (713, 724, 719, 890, 864, 866, 894);

-- ----------------------------
-- 运营管理（815）分组
-- ----------------------------
INSERT INTO la_system_auth_menu
(id, pid, menu_type, menu_name, menu_icon, menu_sort, perms, paths, component, selected, params, is_cache, is_show, is_disable, create_time, update_time)
VALUES
(983, 815, 'M', '榜单与专题', 'el-icon-DataAnalysis', 60, '', 'rank-topic', '', '', '', 0, 1, 0, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
(984, 815, 'M', '增长与互动', 'el-icon-StarFilled', 50, '', 'growth-engagement', '', '', '', 0, 1, 0, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
(985, 815, 'M', '商业变现', 'el-icon-PriceTag', 40, '', 'commercial-monetization', '', '', '', 0, 1, 0, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
(986, 815, 'M', '数据与审计', 'el-icon-Histogram', 30, '', 'data-audit', '', '', '', 0, 1, 0, UNIX_TIMESTAMP(), UNIX_TIMESTAMP())
ON DUPLICATE KEY UPDATE
pid = VALUES(pid),
menu_type = VALUES(menu_type),
menu_name = VALUES(menu_name),
menu_icon = VALUES(menu_icon),
menu_sort = VALUES(menu_sort),
paths = VALUES(paths),
component = VALUES(component),
is_show = VALUES(is_show),
is_disable = VALUES(is_disable),
update_time = UNIX_TIMESTAMP();

UPDATE la_system_auth_menu
SET pid = CASE id
    WHEN 910 THEN 983  -- 每日热榜
    WHEN 920 THEN 983  -- 榜单系统
    WHEN 930 THEN 983  -- 专题页工厂
    WHEN 722 THEN 984  -- 网站提交
    WHEN 726 THEN 984  -- 评论管理
    WHEN 940 THEN 984  -- 投稿激励
    WHEN 960 THEN 985  -- 商业位体系
    WHEN 727 THEN 986  -- 数据统计
    WHEN 723 THEN 986  -- 数据导出
    WHEN 721 THEN 986  -- 操作日志
    ELSE pid
  END,
  update_time = UNIX_TIMESTAMP()
WHERE id IN (910, 920, 930, 722, 726, 940, 960, 727, 723, 721);

-- 可选：微调组内排序，提升可读性
UPDATE la_system_auth_menu SET menu_sort = 30, update_time = UNIX_TIMESTAMP() WHERE id = 940; -- 投稿激励
UPDATE la_system_auth_menu SET menu_sort = 20, update_time = UNIX_TIMESTAMP() WHERE id = 726; -- 评论管理
UPDATE la_system_auth_menu SET menu_sort = 10, update_time = UNIX_TIMESTAMP() WHERE id = 722; -- 网站提交

-- 新增目录授权（role 0/1）
INSERT INTO la_system_auth_perm (id, role_id, menu_id)
SELECT REPLACE(UUID(), '-', ''), r.role_id, m.id
FROM la_system_auth_menu m
JOIN (
  SELECT 0 AS role_id
  UNION ALL
  SELECT 1 AS role_id
) r
LEFT JOIN la_system_auth_perm p ON p.role_id = r.role_id AND p.menu_id = m.id
WHERE m.id IN (980, 981, 982, 983, 984, 985, 986)
  AND p.id IS NULL;

COMMIT;
