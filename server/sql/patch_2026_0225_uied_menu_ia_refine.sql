-- ============================================
-- UIED 后台菜单信息架构重构（V2，可重复执行）
-- 目标：
-- 1) 统一 UIED 菜单图标风格（LikeAdmin/Element 风格）
-- 2) 强化“内容 / 前端配置 / 网站设置 / 运营管理”四大分区
-- 3) 优化站点设置与运营管理下三级分组排序，降低混乱感
-- ============================================

SET NAMES utf8mb4;
START TRANSACTION;

-- ----------------------------
-- 一级入口与二级分区（存在则更新）
-- ----------------------------
UPDATE la_system_auth_menu
SET menu_name = 'UIED导航',
    menu_icon = 'el-icon-Compass',
    menu_sort = 5,
    paths = 'uied',
    update_time = UNIX_TIMESTAMP()
WHERE id = 702;

UPDATE la_system_auth_menu
SET pid = 702,
    menu_type = 'M',
    menu_name = '内容管理',
    menu_icon = 'el-icon-Collection',
    menu_sort = 70,
    paths = 'content',
    update_time = UNIX_TIMESTAMP()
WHERE id = 812;

UPDATE la_system_auth_menu
SET pid = 702,
    menu_type = 'M',
    menu_name = '前端配置',
    menu_icon = 'el-icon-Monitor',
    menu_sort = 60,
    paths = 'frontend',
    update_time = UNIX_TIMESTAMP()
WHERE id = 813;

UPDATE la_system_auth_menu
SET pid = 702,
    menu_type = 'M',
    menu_name = '网站设置',
    menu_icon = 'el-icon-Setting',
    menu_sort = 50,
    paths = 'system-setting',
    update_time = UNIX_TIMESTAMP()
WHERE id = 814;

UPDATE la_system_auth_menu
SET pid = 702,
    menu_type = 'M',
    menu_name = '运营管理',
    menu_icon = 'el-icon-Operation',
    menu_sort = 40,
    paths = 'operation',
    update_time = UNIX_TIMESTAMP()
WHERE id = 815;

-- ----------------------------
-- 网站设置（814）三级分组（存在则更新，不存在则创建）
-- ----------------------------
INSERT INTO la_system_auth_menu
(id, pid, menu_type, menu_name, menu_icon, menu_sort, perms, paths, component, selected, params, is_cache, is_show, is_disable, create_time, update_time)
VALUES
(980, 814, 'M', '基础配置', 'el-icon-Setting', 90, '', 'base-config', '', '', '', 0, 1, 0, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
(981, 814, 'M', '商业授权', 'el-icon-Key', 80, '', 'commercial-auth', '', '', '', 0, 1, 0, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
(982, 814, 'M', '交付工具', 'el-icon-MagicStick', 70, '', 'delivery-tools', '', '', '', 0, 1, 0, UNIX_TIMESTAMP(), UNIX_TIMESTAMP())
ON DUPLICATE KEY UPDATE
pid = VALUES(pid),
menu_type = VALUES(menu_type),
menu_name = VALUES(menu_name),
menu_icon = VALUES(menu_icon),
menu_sort = VALUES(menu_sort),
paths = VALUES(paths),
is_show = VALUES(is_show),
is_disable = VALUES(is_disable),
update_time = UNIX_TIMESTAMP();

UPDATE la_system_auth_menu
SET pid = CASE id
    WHEN 713 THEN 980 -- 站点设置
    WHEN 724 THEN 980 -- AI配置
    WHEN 719 THEN 980 -- Favicon API
    WHEN 890 THEN 980 -- 文章配置
    WHEN 900 THEN 980 -- 网站详情页配置
    WHEN 864 THEN 981 -- 许可证中心
    WHEN 866 THEN 981 -- 功能开关
    WHEN 894 THEN 982 -- 交付初始化
    ELSE pid
  END,
  menu_sort = CASE id
    WHEN 713 THEN 90
    WHEN 724 THEN 80
    WHEN 900 THEN 70
    WHEN 719 THEN 60
    WHEN 890 THEN 50
    WHEN 864 THEN 90
    WHEN 866 THEN 80
    WHEN 894 THEN 90
    ELSE menu_sort
  END,
  menu_icon = CASE id
    WHEN 713 THEN 'el-icon-Tools'
    WHEN 724 THEN 'el-icon-MagicStick'
    WHEN 900 THEN 'el-icon-View'
    WHEN 719 THEN 'el-icon-ChromeFilled'
    WHEN 890 THEN 'el-icon-DocumentCopy'
    WHEN 864 THEN 'el-icon-Key'
    WHEN 866 THEN 'el-icon-Switch'
    WHEN 894 THEN 'el-icon-Box'
    ELSE menu_icon
  END,
  update_time = UNIX_TIMESTAMP()
WHERE id IN (713, 724, 719, 890, 900, 864, 866, 894);

-- ----------------------------
-- 运营管理（815）三级分组（存在则更新，不存在则创建）
-- ----------------------------
INSERT INTO la_system_auth_menu
(id, pid, menu_type, menu_name, menu_icon, menu_sort, perms, paths, component, selected, params, is_cache, is_show, is_disable, create_time, update_time)
VALUES
(983, 815, 'M', '榜单与专题', 'el-icon-DataAnalysis', 90, '', 'rank-topic', '', '', '', 0, 1, 0, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
(984, 815, 'M', '增长与互动', 'el-icon-StarFilled', 80, '', 'growth-engagement', '', '', '', 0, 1, 0, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
(985, 815, 'M', '商业变现', 'el-icon-PriceTag', 70, '', 'commercial-monetization', '', '', '', 0, 1, 0, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
(986, 815, 'M', '数据与审计', 'el-icon-Histogram', 60, '', 'data-audit', '', '', '', 0, 1, 0, UNIX_TIMESTAMP(), UNIX_TIMESTAMP())
ON DUPLICATE KEY UPDATE
pid = VALUES(pid),
menu_type = VALUES(menu_type),
menu_name = VALUES(menu_name),
menu_icon = VALUES(menu_icon),
menu_sort = VALUES(menu_sort),
paths = VALUES(paths),
is_show = VALUES(is_show),
is_disable = VALUES(is_disable),
update_time = UNIX_TIMESTAMP();

UPDATE la_system_auth_menu
SET pid = CASE id
    WHEN 910 THEN 983 -- 每日热榜
    WHEN 920 THEN 983 -- 榜单系统
    WHEN 930 THEN 983 -- 专题页工厂
    WHEN 722 THEN 984 -- 网站提交
    WHEN 726 THEN 984 -- 评论管理
    WHEN 940 THEN 984 -- 投稿激励
    WHEN 960 THEN 985 -- 商业位体系
    WHEN 727 THEN 986 -- 数据统计
    WHEN 723 THEN 986 -- 数据导出
    WHEN 721 THEN 986 -- 操作日志
    ELSE pid
  END,
  menu_sort = CASE id
    WHEN 910 THEN 90
    WHEN 920 THEN 80
    WHEN 930 THEN 70
    WHEN 722 THEN 90
    WHEN 726 THEN 80
    WHEN 940 THEN 70
    WHEN 960 THEN 90
    WHEN 727 THEN 90
    WHEN 723 THEN 80
    WHEN 721 THEN 70
    ELSE menu_sort
  END,
  menu_icon = CASE id
    WHEN 910 THEN 'el-icon-TrendCharts'
    WHEN 920 THEN 'el-icon-DataAnalysis'
    WHEN 930 THEN 'el-icon-Collection'
    WHEN 722 THEN 'el-icon-Upload'
    WHEN 726 THEN 'el-icon-ChatDotRound'
    WHEN 940 THEN 'el-icon-StarFilled'
    WHEN 960 THEN 'el-icon-PriceTag'
    WHEN 727 THEN 'el-icon-Histogram'
    WHEN 723 THEN 'el-icon-Download'
    WHEN 721 THEN 'el-icon-Notebook'
    ELSE menu_icon
  END,
  update_time = UNIX_TIMESTAMP()
WHERE id IN (910, 920, 930, 722, 726, 940, 960, 727, 723, 721);

-- ----------------------------
-- 授权新增/补齐分组目录给 role 0/1
-- ----------------------------
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
