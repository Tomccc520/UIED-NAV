-- 文章中心编辑路由授权兜底
-- 目标：给已拥有“文章中心(816)”权限但缺少“文章编辑页(817)”权限的角色自动补齐授权
-- 可重复执行

SET NAMES utf8mb4;
START TRANSACTION;

INSERT INTO la_system_auth_perm (id, role_id, menu_id)
SELECT REPLACE(UUID(), '-', '') AS id, p.role_id, 817
FROM la_system_auth_perm p
LEFT JOIN la_system_auth_perm existed
    ON existed.role_id = p.role_id
   AND existed.menu_id = 817
WHERE p.menu_id = 816
  AND existed.id IS NULL;

COMMIT;
