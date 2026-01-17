/**
 * @file shareUIUXCategoryToDesign.js
 * @description 将UIUX页面的"设计素材"分类关联到Design页面
 * 
 * 使用方法: node src/utils/shareUIUXCategoryToDesign.js
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function shareCategory() {
  console.log('开始设置分类共享...\n');
  
  // 1. 找到UIUX页面的"设计素材"分类
  const uiuxDesignResources = await prisma.category.findFirst({
    where: {
      slug: 'uiux-design-resources',
      parentId: null
    },
    include: {
      children: true,
      _count: { select: { websites: true } }
    }
  });
  
  if (!uiuxDesignResources) {
    console.log('未找到UIUX的设计素材分类');
    await prisma.$disconnect();
    return;
  }
  
  console.log(`找到UIUX设计素材分类:`);
  console.log(`  ID: ${uiuxDesignResources.id}`);
  console.log(`  名称: ${uiuxDesignResources.name}`);
  console.log(`  子分类数: ${uiuxDesignResources.children.length}`);
  console.log(`  网站数: ${uiuxDesignResources._count.websites}`);
  
  // 计算子分类的网站总数
  let totalSubWebsites = 0;
  for (const child of uiuxDesignResources.children) {
    const count = await prisma.website.count({ where: { categoryId: child.id } });
    totalSubWebsites += count;
  }
  console.log(`  子分类网站总数: ${totalSubWebsites}`);
  
  // 2. 找到Design页面
  const designPage = await prisma.page.findUnique({
    where: { slug: 'design' },
    include: {
      pageCategories: {
        include: { category: true }
      }
    }
  });
  
  if (!designPage) {
    console.log('未找到Design页面');
    await prisma.$disconnect();
    return;
  }
  
  console.log(`\n找到Design页面: ${designPage.name}`);
  console.log(`当前关联的分类数: ${designPage.pageCategories.length}`);
  
  // 3. 检查是否已经关联
  const existingAssociation = designPage.pageCategories.find(
    pc => pc.categoryId === uiuxDesignResources.id
  );
  
  if (existingAssociation) {
    console.log('\nUIUX设计素材分类已经关联到Design页面');
    await prisma.$disconnect();
    return;
  }
  
  // 4. 找到Design页面当前的"设计素材"分类（如果有的话）
  const designResourcesCategory = designPage.pageCategories.find(
    pc => pc.category.name === '设计素材' || pc.category.slug === 'design-resources'
  );
  
  if (designResourcesCategory) {
    console.log(`\nDesign页面当前有自己的设计素材分类:`);
    console.log(`  ID: ${designResourcesCategory.category.id}`);
    console.log(`  名称: ${designResourcesCategory.category.name}`);
    
    // 获取该分类的网站数
    const designResourcesWebsites = await prisma.website.count({
      where: { categoryId: designResourcesCategory.category.id }
    });
    console.log(`  网站数: ${designResourcesWebsites}`);
    
    // 删除Design页面与其自己的设计素材分类的关联
    console.log('\n移除Design页面与其自己的设计素材分类的关联...');
    await prisma.pageCategory.delete({
      where: { id: designResourcesCategory.id }
    });
    console.log('已移除');
  }
  
  // 5. 将UIUX的设计素材分类关联到Design页面
  console.log('\n将UIUX设计素材分类关联到Design页面...');
  
  // 获取当前最大order
  const maxOrder = Math.max(...designPage.pageCategories.map(pc => pc.order), 0);
  
  await prisma.pageCategory.create({
    data: {
      pageId: designPage.id,
      categoryId: uiuxDesignResources.id,
      order: maxOrder + 1,
      visible: true
    }
  });
  
  console.log('关联成功！');
  
  // 6. 验证结果
  const updatedDesignPage = await prisma.page.findUnique({
    where: { slug: 'design' },
    include: {
      pageCategories: {
        include: {
          category: {
            include: {
              children: true,
              _count: { select: { websites: true } }
            }
          }
        }
      }
    }
  });
  
  console.log('\n=== 更新后的Design页面分类 ===');
  for (const pc of updatedDesignPage.pageCategories) {
    const subWebsites = pc.category.children.reduce((sum, child) => {
      return sum + (child._count?.websites || 0);
    }, 0);
    console.log(`  ${pc.category.name}: ${pc.category.children.length} 个子分类`);
  }
  
  await prisma.$disconnect();
}

shareCategory().catch(console.error);
