-- UIED 后台菜单（la_system_auth_menu）分类与图标规范化脚本
-- 适用场景：已存在 UIED 菜单（ID 702、812~815、703~727）时执行
-- 执行方式：
-- docker exec -i uied_mysql mysql --default-character-set=utf8mb4 -u uied -puied123456 -D uied_nav < server/sql/uied_admin_menu_normalize.sql

SET NAMES utf8mb4;
START TRANSACTION;

-- 一级入口
UPDATE la_system_auth_menu
SET menu_name = 'UIED导航',
    menu_icon = 'el-icon-Compass',
    menu_sort = 5,
    paths = 'uied',
    update_time = UNIX_TIMESTAMP()
WHERE id = 702;

-- 二级分类（分组）
UPDATE la_system_auth_menu
SET pid = 702,
    menu_type = 'M',
    menu_name = '内容管理',
    menu_icon = 'el-icon-Collection',
    menu_sort = 10,
    paths = 'content',
    update_time = UNIX_TIMESTAMP()
WHERE id = 812;

UPDATE la_system_auth_menu
SET pid = 702,
    menu_type = 'M',
    menu_name = '前端配置',
    menu_icon = 'el-icon-Monitor',
    menu_sort = 20,
    paths = 'frontend',
    update_time = UNIX_TIMESTAMP()
WHERE id = 813;

UPDATE la_system_auth_menu
SET pid = 702,
    menu_type = 'M',
    menu_name = '系统设置',
    menu_icon = 'el-icon-Setting',
    menu_sort = 30,
    paths = 'system-setting',
    update_time = UNIX_TIMESTAMP()
WHERE id = 814;

UPDATE la_system_auth_menu
SET pid = 702,
    menu_type = 'M',
    menu_name = '运营管理',
    menu_icon = 'el-icon-DataAnalysis',
    menu_sort = 40,
    paths = 'operation',
    update_time = UNIX_TIMESTAMP()
WHERE id = 815;

-- 内容管理
UPDATE la_system_auth_menu
SET pid = 812, menu_icon = 'el-icon-Connection', menu_sort = 10, update_time = UNIX_TIMESTAMP()
WHERE id = 703;

UPDATE la_system_auth_menu
SET pid = 812, menu_icon = 'el-icon-CollectionTag', menu_sort = 20, update_time = UNIX_TIMESTAMP()
WHERE id = 704;

UPDATE la_system_auth_menu
SET pid = 812, menu_icon = 'el-icon-DocumentCopy', menu_sort = 30, update_time = UNIX_TIMESTAMP()
WHERE id = 711;

UPDATE la_system_auth_menu
SET pid = 812, menu_icon = 'el-icon-Reading', menu_sort = 40, update_time = UNIX_TIMESTAMP()
WHERE id = 725;

UPDATE la_system_auth_menu
SET pid = 812, menu_icon = 'el-icon-PriceTag', menu_sort = 50, update_time = UNIX_TIMESTAMP()
WHERE id = 720;

UPDATE la_system_auth_menu
SET pid = 812, menu_icon = 'el-icon-StarFilled', menu_sort = 60, update_time = UNIX_TIMESTAMP()
WHERE id = 712;

-- 前端配置
UPDATE la_system_auth_menu
SET pid = 813, menu_icon = 'el-icon-Menu', menu_sort = 10, update_time = UNIX_TIMESTAMP()
WHERE id = 714;

UPDATE la_system_auth_menu
SET pid = 813, menu_icon = 'el-icon-Picture', menu_sort = 20, update_time = UNIX_TIMESTAMP()
WHERE id = 718;

UPDATE la_system_auth_menu
SET pid = 813, menu_icon = 'el-icon-Link', menu_sort = 30, update_time = UNIX_TIMESTAMP()
WHERE id = 715;

UPDATE la_system_auth_menu
SET pid = 813, menu_icon = 'el-icon-Bottom', menu_sort = 40, update_time = UNIX_TIMESTAMP()
WHERE id = 716;

UPDATE la_system_auth_menu
SET pid = 813, menu_icon = 'el-icon-Share', menu_sort = 50, update_time = UNIX_TIMESTAMP()
WHERE id = 717;

-- 系统设置
UPDATE la_system_auth_menu
SET pid = 814, menu_icon = 'el-icon-Setting', menu_sort = 10, update_time = UNIX_TIMESTAMP()
WHERE id = 713;

UPDATE la_system_auth_menu
SET pid = 814, menu_icon = 'el-icon-MagicStick', menu_sort = 20, update_time = UNIX_TIMESTAMP()
WHERE id = 724;

UPDATE la_system_auth_menu
SET pid = 814, menu_icon = 'el-icon-ChromeFilled', menu_sort = 30, update_time = UNIX_TIMESTAMP()
WHERE id = 719;

-- 运营管理
UPDATE la_system_auth_menu
SET pid = 815, menu_icon = 'el-icon-Upload', menu_sort = 10, update_time = UNIX_TIMESTAMP()
WHERE id = 722;

UPDATE la_system_auth_menu
SET pid = 815, menu_icon = 'el-icon-ChatDotRound', menu_sort = 20, update_time = UNIX_TIMESTAMP()
WHERE id = 726;

UPDATE la_system_auth_menu
SET pid = 815, menu_icon = 'el-icon-Histogram', menu_sort = 30, update_time = UNIX_TIMESTAMP()
WHERE id = 727;

UPDATE la_system_auth_menu
SET pid = 815, menu_icon = 'el-icon-Download', menu_sort = 40, update_time = UNIX_TIMESTAMP()
WHERE id = 723;

UPDATE la_system_auth_menu
SET pid = 815, menu_icon = 'el-icon-Notebook', menu_sort = 50, update_time = UNIX_TIMESTAMP()
WHERE id = 721;

COMMIT;
