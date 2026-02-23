-- ============================================
-- UIED 运营模块菜单归位与图标规范化补丁（可重复执行）
-- 目标：
-- 1) 将运营模块从“系统设置(814)”迁移到“运营管理(815)”
-- 2) 统一运营模块菜单图标为 LikeAdmin/ElementPlus 风格
-- 3) 补充 role_id=0/1 的菜单授权（兼容历史库）
-- ============================================

SET NAMES utf8mb4;
START TRANSACTION;

-- 运营管理分组图标规范化（避免与榜单系统重复时也能保持可识别）
UPDATE la_system_auth_menu
SET menu_icon = 'el-icon-Operation',
    update_time = UNIX_TIMESTAMP()
WHERE id = 815;

-- 将新增运营模块统一迁移到“运营管理”
UPDATE la_system_auth_menu
SET pid = 815,
    menu_icon = CASE id
      WHEN 910 THEN 'el-icon-TrendCharts'
      WHEN 920 THEN 'el-icon-DataAnalysis'
      WHEN 930 THEN 'el-icon-Collection'
      WHEN 940 THEN 'el-icon-StarFilled'
      WHEN 960 THEN 'el-icon-PriceTag'
      ELSE menu_icon
    END,
    update_time = UNIX_TIMESTAMP()
WHERE id IN (910, 920, 930, 940, 960);

-- 给超级管理员 / 兼容管理员角色补授权（防止客户库老角色看不到）
INSERT INTO la_system_auth_perm (id, role_id, menu_id)
SELECT REPLACE(UUID(), '-', ''), r.role_id, m.id
FROM la_system_auth_menu m
JOIN (
  SELECT 0 AS role_id
  UNION ALL
  SELECT 1 AS role_id
) r
LEFT JOIN la_system_auth_perm p ON p.role_id = r.role_id AND p.menu_id = m.id
WHERE m.id IN (910, 920, 930, 940, 960)
  AND p.id IS NULL;

COMMIT;
