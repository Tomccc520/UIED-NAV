/**
 * @file importSubCategories.js
 * @description 从前端静态数据导入子分类到数据库
 * 
 * 使用方法: node src/utils/importSubCategories.js
 */

import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

// 静态数据中的子分类定义（从前端数据文件提取）
const staticSubCategories = {
  // AI页面子分类
  'ai': {
    'ai-xiezuo': [
      { id: 'ai-xiezuo-writing', name: 'AI写作工具', description: '通用AI写作和文案生成工具' },
      { id: 'ai-xiezuo-paper', name: 'AI论文工具', description: '学术论文写作和研究辅助工具' },
      { id: 'ai-xiezuo-detection', name: 'AI内容检测', description: 'AI内容检测和原创性分析工具' },
      { id: 'ai-xiezuo-bot', name: 'AI机器人', description: '智能对话机器人和聊天助手' },
      { id: 'ai-xiezuo-prompt', name: 'AI提示词', description: 'AI提示词生成和优化工具' }
    ],
    'ai-shengtupicture': [
      { id: 'ai-shengtupicture-huihua', name: 'AI绘画工具', description: '通用AI绘画和图像生成工具' },
      { id: 'ai-shengtupicture-prompt', name: 'AI绘画提示', description: 'AI绘画提示词生成和优化工具' },
      { id: 'ai-shengtupicture-model', name: 'AI绘画模型', description: 'AI绘画模型训练和自定义工具' },
      { id: 'ai-shengtupicture-community', name: 'AI绘画社区', description: 'AI绘画作品分享和交流社区' }
    ],
    'ai-tupian': [
      { id: 'ai-tupian-zengqiang', name: 'AI图像增强', description: 'AI图像质量提升和增强工具' },
      { id: 'ai-tupian-qushuiyin', name: 'AI图去水印', description: 'AI智能去除图片水印工具' },
      { id: 'ai-tupian-xiugai', name: 'AI图片修改', description: 'AI图片编辑和修改工具' },
      { id: 'ai-tupian-wusunfangda', name: 'AI无损放大', description: 'AI图片无损放大和超分辨率工具' },
      { id: 'ai-tupian-mote', name: 'AI模特生成', description: 'AI虚拟模特和人像生成工具' },
      { id: 'ai-tupian-chuli', name: 'AI图象处理', description: '综合AI图像处理和编辑工具' },
      { id: 'ai-tupian-koutu', name: 'AI图片抠图', description: 'AI智能抠图和背景移除工具' },
      { id: 'ai-tupian-touxiang', name: 'AI头像生成', description: 'AI头像制作和个性化生成工具' }
    ],
    'ai-shipin': [
      { id: 'ai-shipin-shengcheng', name: 'AI视频生成', description: 'AI视频内容生成和创作工具' },
      { id: 'ai-shipin-koutu', name: 'AI视频抠像', description: 'AI视频背景移除和抠像工具' },
      { id: 'ai-shipin-zimu', name: 'AI字幕翻译', description: 'AI字幕生成、翻译和同步工具' },
      { id: 'ai-shipin-zongjie', name: 'AI视频总结', description: 'AI视频内容分析和摘要工具' },
      { id: 'ai-shipin-jianji', name: 'AI视频剪辑', description: 'AI智能视频剪辑和编辑工具' },
      { id: 'ai-shipin-wenan', name: 'AI视频文案', description: 'AI视频脚本和文案生成工具' },
      { id: 'ai-shipin-huanlian', name: 'AI视频换脸', description: 'AI人脸替换和换脸技术工具' },
      { id: 'ai-shipin-shuziren', name: 'AI虚拟数字人', description: 'AI数字人生成和虚拟主播工具' },
      { id: 'ai-shipin-qushuiyin', name: 'AI视频去水印', description: 'AI智能去除视频水印工具' },
      { id: 'ai-shipin-zengqiang', name: 'AI视频画质增强', description: 'AI视频画质提升和修复工具' }
    ],
    'ai-yinpin': [
      { id: 'ai-yinpin-zhizuo', name: 'AI音频制作', description: 'AI音频内容制作和生成工具' },
      { id: 'ai-yinpin-tts', name: 'AI文字转音', description: 'AI文字转语音和语音合成工具' },
      { id: 'ai-yinpin-kelong', name: 'AI音频克隆', description: 'AI声音克隆和模仿技术工具' },
      { id: 'ai-yinpin-fenli', name: 'AI人声分离', description: 'AI音频分离和提取工具' },
      { id: 'ai-yinpin-geshou', name: 'AI音乐歌手', description: 'AI歌手生成和演唱工具' },
      { id: 'ai-yinpin-bianqu', name: 'AI编曲作曲', description: 'AI音乐创作和编曲工具' }
    ],
    'ai-bangong': [
      { id: 'ai-bangong-ppt', name: 'AI PPT', description: 'AI演示文稿制作和设计工具' },
      { id: 'ai-bangong-wendang', name: 'AI文档工具', description: 'AI文档编辑、管理和协作工具' },
      { id: 'ai-bangong-siweidaotu', name: 'AI思维导图', description: 'AI思维导图生成和规划工具' },
      { id: 'ai-bangong-xiaolu', name: 'AI效率工具', description: 'AI办公效率提升和自动化工具' },
      { id: 'ai-bangong-biaoge', name: 'AI表格处理', description: 'AI表格数据分析和处理工具' },
      { id: 'ai-bangong-huiyi', name: 'AI会议工具', description: 'AI会议记录、转录和总结工具' }
    ],
    'ai-sheji': [
      { id: 'ai-sheji-logo', name: 'AI Logo', description: 'AI Logo设计和品牌标识生成工具' },
      { id: 'ai-sheji-3d', name: 'AI 3D建模', description: 'AI三维建模和3D内容生成工具' },
      { id: 'ai-sheji-gongju', name: 'AI设计工具', description: '综合AI设计和创意辅助工具' },
      { id: 'ai-sheji-jiemian', name: 'AI界面工具', description: 'AI用户界面设计和原型工具' },
      { id: 'ai-sheji-touxiang', name: 'AI头像生成', description: 'AI头像制作和个性化生成工具' },
      { id: 'ai-sheji-mote', name: 'AI模特生成', description: 'AI虚拟模特和人像生成工具' },
      { id: 'ai-sheji-shinei', name: 'AI室内生成', description: 'AI室内设计和空间规划工具' },
      { id: 'ai-sheji-jianzhu', name: 'AI建筑设计', description: 'AI建筑设计和规划辅助工具' }
    ],
    'ai-kaifa': [
      { id: 'ai-kaifa-daimahua', name: 'AI低代码', description: 'AI低代码开发和无代码平台工具' },
      { id: 'ai-kaifa-biancheng', name: 'AI编程工具', description: 'AI代码生成、调试和开发辅助工具' }
    ]
  },
  
  // 3D页面子分类
  '3d': {
    'threed-software': [
      { id: 'threed-software-modeling', name: '建模软件', description: '专业3D建模软件' },
      { id: 'threed-software-rendering', name: '渲染软件', description: '3D渲染软件' },
      { id: 'threed-software-animation', name: '动画软件', description: '3D动画制作软件' },
      { id: 'threed-software-cad', name: 'CAD软件', description: 'CAD设计软件' }
    ],
    'threed-models': [
      { id: 'threed-models-free', name: '免费模型', description: '免费3D模型资源' },
      { id: 'threed-models-paid', name: '付费模型', description: '付费3D模型资源' },
      { id: 'threed-models-game', name: '游戏模型', description: '游戏3D模型资源' },
      { id: 'threed-models-arch', name: '建筑模型', description: '建筑3D模型资源' }
    ],
    'cloud-rendering': [
      { id: 'cloud-rendering-service', name: '云渲染服务', description: '云端渲染服务' },
      { id: 'cloud-rendering-farm', name: '渲染农场', description: '渲染农场服务' },
      { id: 'cloud-rendering-gpu', name: 'GPU云渲染', description: 'GPU云渲染服务' },
      { id: 'cloud-rendering-ai', name: 'AI云渲染', description: 'AI云渲染服务' }
    ],
    'texture-materials': [
      { id: 'texture-materials-pbr', name: 'PBR贴图', description: 'PBR材质贴图' },
      { id: 'texture-materials-hdri', name: 'HDRI贴图', description: 'HDRI环境贴图' },
      { id: 'texture-materials-seamless', name: '无缝贴图', description: '无缝纹理贴图' },
      { id: 'texture-materials-procedural', name: '程序贴图', description: '程序化贴图' }
    ],
    'threed-community': [
      { id: 'threed-community-forums', name: '论坛社区', description: '3D设计论坛社区' },
      { id: 'threed-community-learning', name: '学习社区', description: '3D学习社区' },
      { id: 'threed-community-portfolio', name: '作品展示', description: '3D作品展示平台' },
      { id: 'threed-community-collaboration', name: '协作平台', description: '3D协作平台' }
    ],
    'vr-ar-dev': [
      { id: 'vr-ar-engines', name: 'VR/AR引擎', description: 'VR/AR开发引擎' },
      { id: 'vr-ar-content', name: '内容制作', description: 'VR/AR内容制作' },
      { id: 'vr-ar-platforms', name: '发布平台', description: 'VR/AR发布平台' },
      { id: 'vr-ar-tools', name: '开发工具', description: 'VR/AR开发工具' }
    ],
    'game-engines': [
      { id: 'game-engines-3d', name: '3D游戏引擎', description: '3D游戏开发引擎' },
      { id: 'game-engines-2d', name: '2D游戏引擎', description: '2D游戏开发引擎' },
      { id: 'game-engines-mobile', name: '移动游戏引擎', description: '移动游戏开发引擎' },
      { id: 'game-engines-tools', name: '游戏开发工具', description: '游戏开发辅助工具' }
    ]
  }
};

async function importSubCategories() {
  console.log('开始导入子分类...\n');
  
  let totalCreated = 0;
  let totalSkipped = 0;
  let totalErrors = 0;
  
  // 获取所有现有分类
  const existingCategories = await prisma.category.findMany();
  const categoryMap = new Map(existingCategories.map(c => [c.slug, c]));
  
  console.log(`数据库中现有 ${existingCategories.length} 个分类\n`);
  
  // 遍历所有页面的子分类定义
  for (const [pageSlug, categories] of Object.entries(staticSubCategories)) {
    console.log(`\n=== 处理 ${pageSlug} 页面的子分类 ===`);
    
    for (const [parentSlug, subCategories] of Object.entries(categories)) {
      // 查找父分类
      const parentCategory = categoryMap.get(parentSlug);
      
      if (!parentCategory) {
        console.log(`  ⚠️ 父分类 "${parentSlug}" 不存在，跳过其子分类`);
        totalSkipped += subCategories.length;
        continue;
      }
      
      console.log(`\n  父分类: ${parentCategory.name} (${parentSlug})`);
      
      for (let i = 0; i < subCategories.length; i++) {
        const subCat = subCategories[i];
        
        // 检查子分类是否已存在
        const existingSubCat = categoryMap.get(subCat.id);
        if (existingSubCat) {
          console.log(`    - ${subCat.name}: 已存在，跳过`);
          totalSkipped++;
          continue;
        }
        
        try {
          // 创建子分类
          const newSubCat = await prisma.category.create({
            data: {
              name: subCat.name,
              slug: subCat.id,
              icon: parentCategory.icon, // 继承父分类图标
              color: parentCategory.color, // 继承父分类颜色
              description: subCat.description || '',
              parentId: parentCategory.id,
              order: i,
              visible: true
            }
          });
          
          console.log(`    ✅ ${subCat.name}: 创建成功`);
          categoryMap.set(subCat.id, newSubCat);
          totalCreated++;
        } catch (error) {
          console.log(`    ❌ ${subCat.name}: 创建失败 - ${error.message}`);
          totalErrors++;
        }
      }
    }
  }
  
  console.log('\n=== 导入完成 ===');
  console.log(`创建: ${totalCreated} 个子分类`);
  console.log(`跳过: ${totalSkipped} 个（已存在或父分类不存在）`);
  console.log(`错误: ${totalErrors} 个`);
  
  await prisma.$disconnect();
}

importSubCategories().catch(console.error);
