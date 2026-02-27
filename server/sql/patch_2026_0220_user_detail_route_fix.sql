-- 用户中心详情路由修复（可重复执行）
-- 问题：
-- user:detail 被挂在 user:list 页面菜单下（C -> C），导致详情页点击后不渲染。
-- 修复：
-- 将 862 挂到 860（用户中心目录）下，保留隐藏路由权限点。
--
-- 执行方式：
-- docker exec -i uied_mysql mysql --default-character-set=utf8mb4 -u uied -puied123456 -D uied_nav < server/sql/patch_2026_0220_user_detail_route_fix.sql

SET NAMES utf8mb4;
START TRANSACTION;

UPDATE la_system_auth_menu
SET pid = 860,
    paths = 'detail',
    component = 'consumer/lists/detail',
    selected = '/user-center/consumer',
    menu_type = 'C',
    is_show = 0,
    is_disable = 0,
    update_time = UNIX_TIMESTAMP()
WHERE id = 862
  AND perms = 'user:detail';

COMMIT;
