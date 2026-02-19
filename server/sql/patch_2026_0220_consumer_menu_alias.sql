-- 用户中心菜单文案优化：避免与“系统管理员”菜单混淆
-- 注意：使用 HEX + utf8mb4 写入，避免终端字符集导致中文乱码
-- 执行方式：
-- docker exec -i uied_mysql mysql -u uied -puied123456 uied_nav < server/sql/patch_2026_0220_consumer_menu_alias.sql

SET NAMES utf8mb4;

UPDATE la_system_auth_menu
SET menu_name = CONVERT(0xE7AB99E782B9E794A8E688B7E4B8ADE5BF83 USING utf8mb4),
    update_time = UNIX_TIMESTAMP()
WHERE id = 860;

UPDATE la_system_auth_menu
SET menu_name = CONVERT(0xE7AB99E782B9E794A8E688B7E58897E8A1A8 USING utf8mb4),
    update_time = UNIX_TIMESTAMP()
WHERE id = 861;

UPDATE la_system_auth_menu
SET menu_name = CONVERT(0xE7AB99E782B9E794A8E688B7E7AD89E7BAA7 USING utf8mb4),
    update_time = UNIX_TIMESTAMP()
WHERE id = 869;
