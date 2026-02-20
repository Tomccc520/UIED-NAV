-- 用户默认头像路径修复（可重复执行）
-- 背景：历史数据使用 /api/static/default_avatar.png，但静态目录仅存在 backend_avatar.png
-- 目标：统一头像为可访问资源，避免前端 ORB/404
--
-- 执行方式：
-- docker exec -i uied_mysql mysql --default-character-set=utf8mb4 -u uied -puied123456 -D uied_nav < server/sql/patch_2026_0220_user_avatar_default_fix.sql

SET NAMES utf8mb4;
START TRANSACTION;

UPDATE la_user
SET avatar = '/api/static/backend_avatar.png',
    update_time = UNIX_TIMESTAMP()
WHERE avatar = ''
   OR avatar IS NULL
   OR avatar LIKE '%default_avatar.png%';

COMMIT;
