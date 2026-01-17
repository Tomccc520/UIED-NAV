/**
 * @file importWebsites.js
 * @description 后端API服务
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * 从前端数据导入网站到数据库
 * 这个脚本会读取已有的分类，然后导入网站数据
 */

// UIUX网站数据（从前端文件提取的部分数据）
const uiuxWebsites = [
  // 设计灵感 - 网页灵感
  { name: 'Appinspo', description: '探索最新的App视觉界面设计趋势，为您的下一个数字产品获取灵感', url: 'https://www.appinspo.com/', category: 'design-inspiration', subCategory: 'design-inspiration-web', isHot: true, isFeatured: true },
  { name: 'TGideas', description: '腾讯互动娱乐旗下设计团队，专注IP内容力构建与发展', url: 'https://tgideas.qq.com/index.html', category: 'design-inspiration', subCategory: 'design-inspiration-web', isHot: true },
  { name: 'Dribbble', description: '设计师获取灵感、反馈、社区和工作的平台，发现和连接全球设计师的最佳资源', url: 'https://dribbble.com/', category: 'design-inspiration', subCategory: 'design-inspiration-web', isHot: true, isFeatured: true },
  { name: 'Behance', description: 'Adobe旗下的创意作品展示平台，汇集全球顶尖设计师的作品集', url: 'https://www.behance.net/', category: 'design-inspiration', subCategory: 'design-inspiration-web', isHot: true },
  { name: '花瓣网', description: '设计师寻找灵感的天堂！图片素材领导者，帮你采集、发现网络上你喜欢的事物', url: 'https://huaban.com/', category: 'design-inspiration', subCategory: 'design-inspiration-web', isHot: true },
  { name: 'Awwwards', description: '网站奖项，表彰和促进世界上最好的开发人员，设计师和网络代理的人才和努力', url: 'https://www.awwwards.com/', category: 'design-inspiration', subCategory: 'design-inspiration-web', isHot: true, isFeatured: true },
  { name: 'Site Inspire', description: 'CSS画廊和最佳网页设计灵感展示平台', url: 'https://www.siteinspire.com/', category: 'design-inspiration', subCategory: 'design-inspiration-web', isHot: true },
  { name: 'Lapa Ninja', description: '最好的登陆页面设计灵感收集，帮助设计师获取创意灵感', url: 'https://www.lapa.ninja/', category: 'design-inspiration', subCategory: 'design-inspiration-web', isFeatured: true },
  
  // 设计灵感 - 界面灵感
  { name: 'Mobbin', description: '最大的移动和网页设计参考库，包含数千个真实应用截图', url: 'https://mobbin.com/', category: 'design-inspiration', subCategory: 'design-inspiration-ui', isHot: true, isFeatured: true },
  { name: 'Screenlane', description: '网页和移动端UI设计灵感，精选优秀界面设计案例', url: 'https://screenlane.com/', category: 'design-inspiration', subCategory: 'design-inspiration-ui', isFeatured: true },
  { name: 'UI Garage', description: '每日精选UI设计灵感，包含移动端和网页设计', url: 'https://uigarage.net/', category: 'design-inspiration', subCategory: 'design-inspiration-ui' },
  
  // 设计灵感 - 动效灵感
  { name: 'LottieFiles', description: 'Lottie动画社区和平台，提供轻量级、可扩展的动画文件和工具', url: 'https://lottiefiles.com/', category: 'design-inspiration', subCategory: 'design-inspiration-motion', isHot: true, isFeatured: true },
  { name: 'Motion.dev', description: '一款革命性的动效设计工具，使Web动画开发变得简单直观', url: 'https://motion.dev/', category: 'design-inspiration', subCategory: 'design-inspiration-motion', isHot: true },
  { name: 'App Animations', description: '高质量的手机APP动态灵感资源网站，点击图标即可预览动效', url: 'https://www.appanimations.com/', category: 'design-inspiration', subCategory: 'design-inspiration-motion', isFeatured: true },
  
  // 常用推荐 - 设计工具
  { name: 'Figma', description: '协作式界面设计工具，支持实时协作和原型设计', url: 'https://www.figma.com/', category: 'common-recommendations', subCategory: 'common-recommendations-tools', isHot: true, isFeatured: true },
  { name: 'Sketch', description: '专业的矢量图形编辑器，专为UI/UX设计师打造', url: 'https://www.sketch.com/', category: 'common-recommendations', subCategory: 'common-recommendations-tools', isHot: true },
  { name: 'Adobe XD', description: 'Adobe出品的UI/UX设计和原型工具', url: 'https://www.adobe.com/products/xd.html', category: 'common-recommendations', subCategory: 'common-recommendations-tools', isHot: true },
  { name: 'Framer', description: '交互式设计工具，支持高保真原型和动效设计', url: 'https://www.framer.com/', category: 'common-recommendations', subCategory: 'common-recommendations-tools', isFeatured: true },
  
  // 设计系统
  { name: 'Ant Design', description: '企业级产品设计体系，提供完整的设计规范和组件库', url: 'https://ant.design/', category: 'design-system', subCategory: 'design-system-pc', isHot: true, isFeatured: true },
  { name: 'Material Design', description: 'Google的设计系统，提供跨平台的设计指南和组件', url: 'https://material.io/', category: 'design-system', subCategory: 'design-system-pc', isHot: true },
  { name: 'Apple Human Interface', description: 'Apple的人机界面设计指南', url: 'https://developer.apple.com/design/', category: 'design-system', subCategory: 'design-system-mobile', isHot: true },
  
  // 设计素材 - 图标
  { name: 'Iconfont', description: '阿里巴巴矢量图标库，提供海量免费图标', url: 'https://www.iconfont.cn/', category: 'design-resources', subCategory: 'design-resources-icons', isHot: true, isFeatured: true },
  { name: 'Iconify', description: '统一的图标框架，支持100+图标集', url: 'https://iconify.design/', category: 'design-resources', subCategory: 'design-resources-icons', isFeatured: true },
  { name: 'Feather Icons', description: '简洁美观的开源图标集', url: 'https://feathericons.com/', category: 'design-resources', subCategory: 'design-resources-icons' },
  { name: 'Heroicons', description: 'Tailwind CSS团队出品的精美SVG图标', url: 'https://heroicons.com/', category: 'design-resources', subCategory: 'design-resources-icons' },
  
  // 设计素材 - 图库
  { name: 'Unsplash', description: '免费高质量图片素材库，可商用', url: 'https://unsplash.com/', category: 'design-resources', subCategory: 'design-resources-images', isHot: true, isFeatured: true },
  { name: 'Pexels', description: '免费素材图片和视频，可商用', url: 'https://www.pexels.com/', category: 'design-resources', subCategory: 'design-resources-images', isHot: true },
  { name: 'Pixabay', description: '免费图片、插画、矢量图和视频素材', url: 'https://pixabay.com/', category: 'design-resources', subCategory: 'design-resources-images' },
  
  // 设计素材 - 插画
  { name: 'unDraw', description: '开源插画库，可自定义颜色', url: 'https://undraw.co/', category: 'design-resources', subCategory: 'design-resources-illustrations', isHot: true, isFeatured: true },
  { name: 'Illustrations.co', description: '免费开源插画素材', url: 'https://illlustrations.co/', category: 'design-resources', subCategory: 'design-resources-illustrations' },
  { name: 'Humaaans', description: '可混搭的人物插画库', url: 'https://www.humaaans.com/', category: 'design-resources', subCategory: 'design-resources-illustrations' },
  
  // 设计插件 - Figma
  { name: 'Figma Plugins', description: 'Figma官方插件市场', url: 'https://www.figma.com/community/plugins', category: 'design-plugins', subCategory: 'design-plugins-figma', isHot: true },
  { name: 'Figma Community', description: 'Figma社区资源，包含模板、插件和组件', url: 'https://www.figma.com/community', category: 'design-plugins', subCategory: 'design-plugins-figma', isFeatured: true },
];

// AI工具网站数据
const aiWebsites = [
  // AI写作工具
  { name: 'ChatGPT', description: 'OpenAI开发的AI对话助手，支持多种任务', url: 'https://chat.openai.com/', category: 'ai-xiezuo', subCategory: 'ai-xiezuo-bot', isHot: true, isFeatured: true },
  { name: 'Claude', description: 'Anthropic开发的AI助手，擅长分析和写作', url: 'https://claude.ai/', category: 'ai-xiezuo', subCategory: 'ai-xiezuo-bot', isHot: true, isFeatured: true },
  { name: '文心一言', description: '百度推出的AI对话助手', url: 'https://yiyan.baidu.com/', category: 'ai-xiezuo', subCategory: 'ai-xiezuo-bot', isHot: true },
  { name: '通义千问', description: '阿里云推出的AI大模型', url: 'https://tongyi.aliyun.com/', category: 'ai-xiezuo', subCategory: 'ai-xiezuo-bot', isHot: true },
  { name: 'Jasper', description: 'AI写作助手，帮助创建营销内容', url: 'https://www.jasper.ai/', category: 'ai-xiezuo', subCategory: 'ai-xiezuo-writing', isFeatured: true },
  { name: 'Copy.ai', description: 'AI文案生成工具', url: 'https://www.copy.ai/', category: 'ai-xiezuo', subCategory: 'ai-xiezuo-writing' },
  
  // AI生图工具
  { name: 'Midjourney', description: 'AI图像生成工具，创造惊艳的艺术作品', url: 'https://www.midjourney.com/', category: 'ai-shengtupicture', subCategory: 'ai-shengtupicture-huihua', isHot: true, isFeatured: true },
  { name: 'DALL-E', description: 'OpenAI的AI图像生成模型', url: 'https://openai.com/dall-e-3', category: 'ai-shengtupicture', subCategory: 'ai-shengtupicture-huihua', isHot: true },
  { name: 'Stable Diffusion', description: '开源AI图像生成模型', url: 'https://stability.ai/', category: 'ai-shengtupicture', subCategory: 'ai-shengtupicture-huihua', isHot: true },
  { name: '文心一格', description: '百度AI绘画平台', url: 'https://yige.baidu.com/', category: 'ai-shengtupicture', subCategory: 'ai-shengtupicture-huihua' },
  
  // AI图片工具
  { name: 'Remove.bg', description: 'AI自动去除图片背景', url: 'https://www.remove.bg/', category: 'ai-tupian', subCategory: 'ai-tupian-koutu', isHot: true, isFeatured: true },
  { name: 'Cleanup.pictures', description: 'AI去除图片中的物体和水印', url: 'https://cleanup.pictures/', category: 'ai-tupian', subCategory: 'ai-tupian-qushuiyin', isFeatured: true },
  { name: 'Upscayl', description: '开源AI图片放大工具', url: 'https://upscayl.org/', category: 'ai-tupian', subCategory: 'ai-tupian-wusunfangda' },
  { name: 'Topaz Labs', description: '专业AI图像增强软件', url: 'https://www.topazlabs.com/', category: 'ai-tupian', subCategory: 'ai-tupian-zengqiang', isFeatured: true },
  
  // AI视频工具
  { name: 'Runway', description: 'AI视频生成和编辑平台', url: 'https://runwayml.com/', category: 'ai-shipin', subCategory: 'ai-shipin-shengcheng', isHot: true, isFeatured: true },
  { name: 'Pika', description: 'AI视频生成工具', url: 'https://pika.art/', category: 'ai-shipin', subCategory: 'ai-shipin-shengcheng', isHot: true },
  { name: 'HeyGen', description: 'AI数字人视频生成', url: 'https://www.heygen.com/', category: 'ai-shipin', subCategory: 'ai-shipin-shuziren', isFeatured: true },
  { name: 'D-ID', description: 'AI数字人和视频生成', url: 'https://www.d-id.com/', category: 'ai-shipin', subCategory: 'ai-shipin-shuziren' },
  
  // AI音频工具
  { name: 'ElevenLabs', description: 'AI语音合成和克隆', url: 'https://elevenlabs.io/', category: 'ai-yinpin', subCategory: 'ai-yinpin-tts', isHot: true, isFeatured: true },
  { name: 'Suno', description: 'AI音乐生成', url: 'https://suno.ai/', category: 'ai-yinpin', subCategory: 'ai-yinpin-bianqu', isHot: true },
  { name: 'Mubert', description: 'AI音乐生成平台', url: 'https://mubert.com/', category: 'ai-yinpin', subCategory: 'ai-yinpin-bianqu' },
  
  // AI办公工具
  { name: 'Notion AI', description: 'Notion内置的AI写作助手', url: 'https://www.notion.so/product/ai', category: 'ai-bangong', subCategory: 'ai-bangong-wendang', isHot: true, isFeatured: true },
  { name: 'Gamma', description: 'AI演示文稿生成', url: 'https://gamma.app/', category: 'ai-bangong', subCategory: 'ai-bangong-ppt', isHot: true },
  { name: 'Beautiful.ai', description: 'AI驱动的演示文稿设计', url: 'https://www.beautiful.ai/', category: 'ai-bangong', subCategory: 'ai-bangong-ppt' },
  
  // AI设计工具
  { name: 'Canva AI', description: 'Canva的AI设计功能', url: 'https://www.canva.com/', category: 'ai-sheji', subCategory: 'ai-sheji-gongju', isHot: true, isFeatured: true },
  { name: 'Looka', description: 'AI Logo设计', url: 'https://looka.com/', category: 'ai-sheji', subCategory: 'ai-sheji-logo', isFeatured: true },
  { name: 'Brandmark', description: 'AI品牌Logo生成', url: 'https://brandmark.io/', category: 'ai-sheji', subCategory: 'ai-sheji-logo' },
  
  // AI开发工具
  { name: 'GitHub Copilot', description: 'AI编程助手', url: 'https://github.com/features/copilot', category: 'ai-kaifa', subCategory: 'ai-kaifa-biancheng', isHot: true, isFeatured: true },
  { name: 'Cursor', description: 'AI驱动的代码编辑器', url: 'https://cursor.sh/', category: 'ai-kaifa', subCategory: 'ai-kaifa-biancheng', isHot: true },
  { name: 'Replit', description: '在线IDE，支持AI编程', url: 'https://replit.com/', category: 'ai-kaifa', subCategory: 'ai-kaifa-biancheng' },
];

async function importWebsites(websites, pageSlug) {
  console.log(`\n📂 导入 ${pageSlug} 页面的网站数据...`);
  
  let imported = 0;
  let skipped = 0;
  
  for (const site of websites) {
    try {
      // 查找分类
      const categorySlug = site.subCategory ? `${pageSlug}-${site.subCategory}` : `${pageSlug}-${site.category}`;
      let category = await prisma.category.findUnique({ where: { slug: categorySlug } });
      
      // 如果找不到子分类，尝试找主分类
      if (!category && site.category) {
        const mainCategorySlug = `${pageSlug}-${site.category}`;
        category = await prisma.category.findUnique({ where: { slug: mainCategorySlug } });
      }
      
      // 如果还是找不到，尝试直接用slug
      if (!category) {
        category = await prisma.category.findUnique({ where: { slug: site.subCategory || site.category } });
      }
      
      if (!category) {
        console.log(`  ⚠️ 找不到分类: ${site.subCategory || site.category}, 跳过: ${site.name}`);
        skipped++;
        continue;
      }
      
      // 检查是否已存在
      const existing = await prisma.website.findFirst({ where: { url: site.url } });
      if (existing) {
        skipped++;
        continue;
      }
      
      // 创建网站
      await prisma.website.create({
        data: {
          name: site.name,
          description: site.description,
          url: site.url,
          categoryId: category.id,
          isNew: site.isNew || false,
          isFeatured: site.isFeatured || false,
          isHot: site.isHot || false,
          tags: JSON.stringify([]),
          order: 0,
        }
      });
      imported++;
    } catch (error) {
      if (!error.message.includes('Unique constraint')) {
        console.error(`  ❌ 导入失败: ${site.name}`, error.message);
      }
      skipped++;
    }
  }
  
  console.log(`  ✅ 导入: ${imported} 个, 跳过: ${skipped} 个`);
  return imported;
}

async function main() {
  console.log('🚀 开始导入网站数据...\n');
  
  // 导入UIUX网站
  await importWebsites(uiuxWebsites, 'uiux');
  
  // 导入AI网站
  await importWebsites(aiWebsites, 'ai');
  
  // 显示统计
  const websiteCount = await prisma.website.count();
  console.log(`\n📊 数据库中共有 ${websiteCount} 个网站`);
}

main()
  .catch((error) => {
    console.error('💥 导入失败:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
