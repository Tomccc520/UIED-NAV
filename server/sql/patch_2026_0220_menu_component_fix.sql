-- ============================================
-- 菜单组件修复补丁（可重复执行）
-- 目的：修复“新增菜单点击后显示同一页面”的问题
-- ============================================

SET NAMES utf8mb4;
START TRANSACTION;

-- 许可证中心 -> 独立页面
UPDATE la_system_auth_menu
SET component = 'uied/license/index',
    selected = '/uied/license-center',
    params = '',
    update_time = UNIX_TIMESTAMP()
WHERE id = 864;

-- 功能开关 -> 独立页面（复用 license 页面，通过 tab 区分）
UPDATE la_system_auth_menu
SET component = 'uied/feature/index',
    selected = '/uied/feature-toggle',
    params = '',
    update_time = UNIX_TIMESTAMP()
WHERE id = 866;

-- 用户等级 -> 独立页面
UPDATE la_system_auth_menu
SET component = 'consumer/level/index',
    selected = '/user-center/level',
    params = '',
    update_time = UNIX_TIMESTAMP()
WHERE id = 869;

-- 文章配置 -> 独立页面
UPDATE la_system_auth_menu
SET component = 'uied/articleConfig/index',
    selected = '/uied/article-config',
    params = '',
    update_time = UNIX_TIMESTAMP()
WHERE id = 890;

-- 交付初始化 -> 独立页面
UPDATE la_system_auth_menu
SET component = 'uied/deliveryInit/index',
    selected = '/uied/delivery-init',
    params = '',
    update_time = UNIX_TIMESTAMP()
WHERE id = 894;

COMMIT;
