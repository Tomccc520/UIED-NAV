-- 菜单权限点去重修复（可重复执行）
-- 目标：消除 la_system_auth_menu 中重复 perms: article:cate:change（ID 822/828）
-- 策略：保留 828 作为栏目状态权限；将 822 调整为独立权限点（列表页语义）
--
-- 执行方式：
-- docker exec -i uied_mysql mysql --default-character-set=utf8mb4 -u uied -puied123456 -D uied_nav < server/sql/patch_2026_0220_menu_perm_dedup.sql

SET NAMES utf8mb4;
START TRANSACTION;

UPDATE la_system_auth_menu
SET perms = 'article:cate:change:list',
    update_time = UNIX_TIMESTAMP()
WHERE id = 822
  AND perms = 'article:cate:change';

COMMIT;
