-- UIED 导航：将广告管理从“前端配置”迁移到“运营管理 -> 商业变现”
-- 执行时间建议：2026-02-26
-- 兼容：likeadmin_node 菜单表 la_system_auth_menu

UPDATE la_system_auth_menu
SET pid = 985,
    menu_sort = 95,
    update_time = UNIX_TIMESTAMP()
WHERE id = 718;

