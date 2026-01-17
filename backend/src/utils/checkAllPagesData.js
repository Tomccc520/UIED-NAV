/**
 * @file checkAllPagesData.js
 * @description 后端API服务
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

/**
 * 全面检查所有页面的分类和网站数据
 * 
 * 使用方法: node src/utils/checkAllPagesData.js
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkAllPagesData() {
  console.log('🔍 全面检查所有页面的分类和网站数据...\n');
  console.log('═'.repeat(80));

  try {
    // 获取所有页面及其关联的分类
    const pages = await prisma.page.findMany({
      include: {
        pageCategories: {
          include: {
            category: {
              include: {
                children: {
                  include: {
                    _count: { select: { websites: true } },
                  },
                },
                _count: { select: { websites: true } },
              },
            },
          },
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { order: 'asc' },
    });

    let totalIssues = 0;
    const issuesList = [];

    for (const page of pages) {
      console.log(`\n📄 页面: ${page.name} (slug: ${page.slug})`);
      console.log('─'.repeat(60));

      if (page.pageCategories.length === 0) {
        console.log('  ⚠️  该页面没有关联任何分类');
        totalIssues++;
        issuesList.push({ page: page.name, issue: '没有关联分类' });
        continue;
      }

      let pageWebsiteTotal = 0;
      let pageEmptyCategories = [];

      for (const pc of page.pageCategories) {
        const cat = pc.category;
        const directWebsites = cat._count.websites;
        
        // 计算子分类的网站数
        let childrenWebsites = 0;
        const emptyChildren = [];
        
        for (const child of cat.children) {
          childrenWebsites += child._count.websites;
          if (child._count.websites === 0) {
            emptyChildren.push(child.name);
          }
        }

        const totalWebsites = directWebsites + childrenWebsites;
        pageWebsiteTotal += totalWebsites;

        // 显示分类信息
        const status = totalWebsites === 0 ? '❌' : (totalWebsites < 5 ? '⚠️' : '✅');
        console.log(`  ${status} ${cat.name}: ${totalWebsites} 个网站 (直接: ${directWebsites}, 子分类: ${childrenWebsites})`);

        // 显示子分类详情
        if (cat.children.length > 0) {
          for (const child of cat.children) {
            const childStatus = child._count.websites === 0 ? '❌' : '✅';
            console.log(`      ${childStatus} └─ ${child.name}: ${child._count.websites} 个网站`);
          }
        }

        // 记录问题
        if (totalWebsites === 0) {
          pageEmptyCategories.push(cat.name);
          totalIssues++;
          issuesList.push({ 
            page: page.name, 
            category: cat.name, 
            issue: '分类没有网站' 
          });
        }

        if (emptyChildren.length > 0) {
          for (const emptyChild of emptyChildren) {
            issuesList.push({ 
              page: page.name, 
              category: cat.name, 
              subCategory: emptyChild,
              issue: '子分类没有网站' 
            });
          }
        }
      }

      console.log(`  📊 页面总计: ${pageWebsiteTotal} 个网站`);
      if (pageEmptyCategories.length > 0) {
        console.log(`  ⚠️  空分类: ${pageEmptyCategories.join(', ')}`);
      }
    }

    // 汇总报告
    console.log('\n' + '═'.repeat(80));
    console.log('📊 汇总报告');
    console.log('═'.repeat(80));

    // 统计总数
    const totalCategories = await prisma.category.count();
    const totalWebsites = await prisma.website.count();
    const emptyCategories = await prisma.category.count({
      where: {
        websites: { none: {} },
        children: { none: {} },
      },
    });

    console.log(`\n总分类数: ${totalCategories}`);
    console.log(`总网站数: ${totalWebsites}`);
    console.log(`空分类数（无网站和子分类）: ${emptyCategories}`);
    console.log(`发现问题数: ${issuesList.length}`);

    // 显示问题列表
    if (issuesList.length > 0) {
      console.log('\n⚠️  问题列表:');
      console.log('─'.repeat(60));
      
      // 按页面分组显示
      const issuesByPage = {};
      for (const issue of issuesList) {
        if (!issuesByPage[issue.page]) {
          issuesByPage[issue.page] = [];
        }
        issuesByPage[issue.page].push(issue);
      }

      for (const [pageName, issues] of Object.entries(issuesByPage)) {
        console.log(`\n📄 ${pageName}:`);
        for (const issue of issues) {
          if (issue.subCategory) {
            console.log(`   - ${issue.category} > ${issue.subCategory}: ${issue.issue}`);
          } else if (issue.category) {
            console.log(`   - ${issue.category}: ${issue.issue}`);
          } else {
            console.log(`   - ${issue.issue}`);
          }
        }
      }
    } else {
      console.log('\n✅ 所有页面数据完整，没有发现问题！');
    }

    // 检查没有关联到任何页面的分类
    console.log('\n' + '─'.repeat(60));
    console.log('🔍 检查未关联页面的顶级分类...');
    
    const orphanCategories = await prisma.category.findMany({
      where: {
        parentId: null,
        pageCategories: { none: {} },
      },
      include: {
        _count: { select: { websites: true, children: true } },
      },
    });

    if (orphanCategories.length > 0) {
      console.log(`\n发现 ${orphanCategories.length} 个未关联页面的顶级分类:`);
      for (const cat of orphanCategories) {
        console.log(`  - ${cat.name}: ${cat._count.websites} 个网站, ${cat._count.children} 个子分类`);
      }
    } else {
      console.log('所有顶级分类都已关联到页面');
    }

  } catch (error) {
    console.error('❌ 检查失败:', error.message);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

checkAllPagesData();
