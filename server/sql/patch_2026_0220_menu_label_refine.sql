-- ============================================
-- 菜单文案优化补丁（可重复执行）
-- 目的：减少“源码购买者账号”与“站点终端用户”概念混淆
-- ============================================

SET NAMES utf8mb4;
START TRANSACTION;

-- 用户等级 -> 站点用户等级
UPDATE la_system_auth_menu
SET menu_name = '站点用户等级',
    update_time = UNIX_TIMESTAMP()
WHERE id = 869;

COMMIT;
