-- UIED 导航扁平化脚本（2026-02-17）
-- 目标：将 UIED导航(702) 下一级菜单提升为根级菜单，避免后台出现空分组
-- 执行：
-- docker exec -i uied_mysql mysql --default-character-set=utf8mb4 -u uied -puied123456 -D uied_nav < server/sql/uied_flatten_top_menus_20260217.sql

SET NAMES utf8mb4;
START TRANSACTION;

-- 仅迁移当前在 UIED导航 下的一级目录
UPDATE la_system_auth_menu
SET pid = 0,
    menu_sort = CASE id
      WHEN 812 THEN 11 -- 内容管理（历史兼容，默认隐藏）
      WHEN 813 THEN 21 -- 前端配置
      WHEN 814 THEN 31 -- 系统设置
      WHEN 857 THEN 35 -- 网址管理
      WHEN 858 THEN 36 -- 文章管理
      WHEN 815 THEN 40 -- 运营管理
      ELSE menu_sort
    END,
    update_time = UNIX_TIMESTAMP()
WHERE pid = 702
  AND id IN (812, 813, 814, 815, 857, 858);

-- UIED导航 置为隐藏，防止出现空菜单
UPDATE la_system_auth_menu
SET is_show = 0,
    is_disable = 1,
    update_time = UNIX_TIMESTAMP()
WHERE id = 702;

COMMIT;
