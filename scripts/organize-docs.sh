#!/bin/bash
# 文档分类整理脚本
# 作者: UIED技术团队
# 日期: 2026.3.1

cd "/Users/tangxiaoda/Desktop/网站备份/HAO UIED/docs"

echo "开始整理文档..."

# 创建分类目录
mkdir -p 个人中心 部署文档 开发文档 API文档 功能文档 商业文档 问题修复 项目总结 规划文档

# 移动个人中心文档
echo "整理个人中心文档..."
mv 个人中心*.md 个人中心/ 2>/dev/null
mv 消息功能*.md 个人中心/ 2>/dev/null

# 移动部署文档
echo "整理部署文档..."
mv 宝塔*.md 部署文档/ 2>/dev/null
mv 部署*.md 部署文档/ 2>/dev/null
mv Docker*.md 部署文档/ 2>/dev/null
mv 单域名*.md 部署文档/ 2>/dev/null
mv 版本分发*.md 部署文档/ 2>/dev/null

# 移动开发文档
echo "整理开发文档..."
mv 开发*.md 开发文档/ 2>/dev/null
mv 代码规范.md 开发文档/ 2>/dev/null
mv 测试指南.md 开发文档/ 2>/dev/null
mv 快速参考.md 开发文档/ 2>/dev/null
mv 项目结构*.md 开发文档/ 2>/dev/null
mv 数据库*.md 开发文档/ 2>/dev/null
mv 前端*.md 开发文档/ 2>/dev/null
mv 前后端*.md 开发文档/ 2>/dev/null
mv 分类对接*.md 开发文档/ 2>/dev/null

# 移动API文档
echo "整理API文档..."
mv Codex*.md API文档/ 2>/dev/null

# 移动功能文档
echo "整理功能文档..."
mv 直达箭头*.md 功能文档/ 2>/dev/null
mv 站点设置*.md 功能文档/ 2>/dev/null
mv 登录系统*.md 功能文档/ 2>/dev/null
mv AI功能*.md 功能文档/ 2>/dev/null

# 移动商业文档
echo "整理商业文档..."
mv 版本功能*.md 商业文档/ 2>/dev/null
mv 简化版*.md 商业文档/ 2>/dev/null
mv 商业*.md 商业文档/ 2>/dev/null
mv 竞品*.md 商业文档/ 2>/dev/null
mv 开源版*.md 商业文档/ 2>/dev/null

# 移动问题修复文档
echo "整理问题修复文档..."
mv 修复*.md 问题修复/ 2>/dev/null
mv 紧急修复*.md 问题修复/ 2>/dev/null
mv 详情页*.md 问题修复/ 2>/dev/null
mv 问题排查*.md 问题修复/ 2>/dev/null
mv 三个问题*.md 问题修复/ 2>/dev/null

# 移动项目总结
echo "整理项目总结..."
mv 项目总结*.md 项目总结/ 2>/dev/null
mv 项目整理*.md 项目总结/ 2>/dev/null
mv 代码重构*.md 项目总结/ 2>/dev/null
mv 6个技能*.md 项目总结/ 2>/dev/null

# 移动规划文档
echo "整理规划文档..."
mv 功能定位*.md 规划文档/ 2>/dev/null
mv 个人开发者*.md 规划文档/ 2>/dev/null
mv 最终行动*.md 规划文档/ 2>/dev/null
mv GitHub*.md 规划文档/ 2>/dev/null

echo ""
echo "✅ 文档分类完成！"
echo ""
echo "目录结构："
ls -d */ 2>/dev/null
echo ""
echo "各分类文档数量："
for dir in */; do
  count=$(ls -1 "$dir"*.md 2>/dev/null | wc -l)
  echo "  $dir: $count 份"
done

