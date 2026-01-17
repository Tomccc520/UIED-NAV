/**
 * @file importHotRecommendations.js
 * @description 后端API服务
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

/**
 * 导入热门推荐数据到数据库
 * 从前端静态数据 hotRecommendations.js 导入
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 热门推荐数据（从前端 hotRecommendations.js 复制）
const hotRecommendations = [
  // 热门分类
  {
    name: 'Adobe 正版全家桶可用AI',
    description: 'Adobe正版全家桶软件，包含Photoshop、Illustrator、Premiere等全套设计工具，支持AI功能',
    url: 'https://universalbus.cn/?s=lPLG02aydo',
    iconUrl: 'https://img.uied.cn/wp-content/uploads/2025/09/oykOAn-20250922.jpg',
    position: 'hot',
    order: 1,
  },
  {
    name: 'AskManyAI-免费多模型对话',
    description: '免费的AI超级生产力平台，提供GPT、Claude、Gemini等顶级模型的直连访问',
    url: 'https://askmany.cn/login?i=bd8ce9a1',
    iconUrl: 'https://askmany.cn/favicon.ico',
    position: 'hot',
    order: 2,
  },
  {
    name: 'Nano Banana 2',
    description: '最新的Nano Banana 2，支持4K画质、图片质量更高、能理解更复杂的指令，生成速度更快',
    url: 'https://imini.com/zh/nano-banana',
    iconUrl: 'https://img.uied.cn/wp-content/uploads/2025/09/BWJ7JF-20250912.png',
    position: 'hot',
    order: 3,
  },
  {
    name: '当贝AI',
    description: '满血版DeepSeek R1 671B，免登录、极速、不卡顿！',
    url: 'https://ai.dangbei.com/',
    iconUrl: 'https://ai.dangbei.com/favicon.ico',
    position: 'hot',
    order: 4,
  },
  {
    name: '讯飞星火',
    description: '科大讯飞推出的新一代认知智能大模型，提供语言理解、代码编写等多种能力',
    url: 'https://xinghuo.xfyun.cn/desk?ch=xh_hdy1d',
    iconUrl: 'https://xinghuo.xfyun.cn/favicon.ico',
    position: 'hot',
    order: 5,
  },
  {
    name: '稿定设计-AI',
    description: '在线快速图片和视频编辑，不会PS也能搞定设计，海量模板快速出图',
    url: 'https://www.gaoding.com/utms/f09424918c51460bb0867add54ce2ee4',
    iconUrl: 'https://www.gaoding.com/favicon.ico',
    position: 'hot',
    order: 6,
  },
  {
    name: 'Behance',
    description: 'Adobe旗下的设计师交流平台，来自世界各地的设计师在这里分享自己的作品',
    url: 'https://behance.net/',
    iconUrl: 'https://nav.iowen.cn/wp-content/uploads/2019/11/download.png',
    position: 'hot',
    order: 7,
  },
  {
    name: '讯飞星辰Agent开发平台',
    description: '新一代智能体Agent开发平台，支持通过提示词Prompt、工作流Workflow灵活创建专业智能体',
    url: 'https://agent.xfyun.cn/home?ch=xcagent-aitool28',
    iconUrl: 'https://agent.xfyun.cn/favicon.ico',
    position: 'hot',
    order: 8,
  },
  {
    name: '讯飞智文一键生成PPT',
    description: '科大讯飞推出的一键生成ppt/word产品，支持智能生成文档、美化、排版等功能',
    url: 'https://zhiwen.xfyun.cn/home?from=aitool18',
    iconUrl: 'https://zhiwen.xfyun.cn/favicon.ico',
    position: 'hot',
    order: 9,
  },
  {
    name: '字节旗下AI代码助手',
    description: '国内首款AI原生IDE，专为中国开发者打造，让AI深度融入编程',
    url: 'https://www.trae.com.cn/?utm_source=advertising&utm_medium=uied_ug_cpa&utm_term=hw_trae_uied',
    iconUrl: 'https://www.trae.com.cn/favicon.ico',
    position: 'hot',
    order: 10,
  },
  {
    name: '豆包-全能AI助手',
    description: '字节跳动推出的AI聊天智能对话问答助手，支持写作文案翻译情感陪伴编程等',
    url: 'https://m.paluai.com/?code=dh26',
    iconUrl: 'https://lf-flow-web-cdn.doubao.com/obj/flow-doubao/samantha/logo-icon-white-bg.png',
    position: 'hot',
    order: 11,
  },
  {
    name: 'Pinterest',
    description: '全球美图收藏采集站，世界最大的创意图片分享平台',
    url: 'https://www.pinterest.com',
    iconUrl: 'https://www.pinterest.com/favicon.ico',
    position: 'hot',
    order: 12,
  },
  // 精选推荐
  {
    name: 'ZCOOL站酷',
    description: '中国设计师互动平台，聚集1400万设计师、摄影师、插画师、艺术家',
    url: 'https://www.zcool.com.cn/',
    iconUrl: 'https://www.88sheji.cn/wp-content/uploads/2022/07/8f66d-www.zcool.com.cn.png',
    position: 'featured',
    order: 1,
  },
  {
    name: 'AI大学堂',
    description: '科大讯飞打造的AI在线学习平台，提供人工智能培训、编程入门等课程',
    url: 'https://www.aidaxue.com/?ch=daxue_collection_27',
    iconUrl: 'https://www.aidaxue.com/favicon.ico',
    position: 'featured',
    order: 2,
  },
  {
    name: '讯飞绘文',
    description: '集AI写作、选题、配图、排版、润色、发布等功能为一体的智能创作平台',
    url: 'https://turbodesk.xfyun.cn/client-pro?channelid=aitool29',
    iconUrl: 'https://turbodesk.xfyun.cn/favicon.ico',
    position: 'featured',
    order: 3,
  },
  {
    name: 'AI一键生成PPT',
    description: '咔片AIPPT，工作总结/教学课件/商业提案3分钟搞定！10万+场景模板一键替换',
    url: 'https://www.cappt.cc/?mtm_campaign=CZQD-aidh-zd14-10055',
    iconUrl: 'https://www.cappt.cc/favicon.ico',
    position: 'featured',
    order: 4,
  },
  {
    name: '白日梦AI',
    description: '全新的文生视频类AIGC创作平台，支持文生视频、动态画面、AI角色生成等',
    url: 'https://aibrm.com/?code=fx_cdcc',
    iconUrl: 'https://aibrm.com/favicon.ico',
    position: 'featured',
    order: 5,
  },
  {
    name: '花瓣网',
    description: '设计师寻找灵感的天堂！图片素材领导者，帮你采集、发现网络上你喜欢的事物',
    url: 'http://huaban.com',
    iconUrl: 'http://huaban.com/favicon.ico',
    position: 'featured',
    order: 6,
  },
  // UIED系列 - 作为广告位
  {
    name: 'UIED学习平台',
    description: '为UI/UX设计师而生的学习平台，提供优秀设计网站、设计教程和实用技巧',
    url: 'https://www.uied.cn/',
    iconUrl: 'https://img.88sheji.cn/wp-content/uploads/2022/06/hGlZ7q-20250606.png',
    position: 'ad',
    order: 1,
  },
  {
    name: 'UIED免费工具',
    description: '提供免费的在线工具集合，包括图片处理、PDF工具、文本工具等实用功能',
    url: 'https://uiedtool.com/',
    iconUrl: 'https://uiedtool.com/favicon.ico',
    position: 'ad',
    order: 2,
  },
  {
    name: 'UIED技术团队',
    description: 'UIED技术团队官网，专注于为设计师提供优质的技术服务和解决方案',
    url: 'https://fsuied.com/',
    iconUrl: 'https://img.88sheji.cn/wp-content/uploads/2022/06/hGlZ7q-20250606.png',
    position: 'ad',
    order: 3,
  },
  {
    name: 'UIED资讯热榜',
    description: 'UIED资讯热榜，实时汇聚设计行业热点资讯、趋势动态和精选内容',
    url: 'https://hot.uied.cn/',
    iconUrl: 'https://img.88sheji.cn/wp-content/uploads/2022/06/hGlZ7q-20250606.png',
    position: 'ad',
    order: 4,
  },
  {
    name: 'UIED UI导航',
    description: 'UIED设计导航 - UI/UX设计资源导航，精选优质UI设计工具和资源',
    url: 'https://hao.uied.cn/',
    iconUrl: 'https://img.88sheji.cn/wp-content/uploads/2022/06/hGlZ7q-20250606.png',
    position: 'ad',
    order: 5,
  },
  {
    name: 'UIED AI导航',
    description: 'UIED设计导航 - AI工具导航，精选最新AI设计工具和人工智能资源',
    url: 'https://hao.uied.cn/ai',
    iconUrl: 'https://img.88sheji.cn/wp-content/uploads/2022/06/hGlZ7q-20250606.png',
    position: 'ad',
    order: 6,
  },
];

async function importHotRecommendations() {
  console.log('🚀 开始导入热门推荐数据...');
  
  try {
    // 先清空现有数据
    const deleteResult = await prisma.hotRecommendation.deleteMany({});
    console.log(`🗑️  已清空 ${deleteResult.count} 条旧数据`);
    
    // 批量创建
    let created = 0;
    for (const item of hotRecommendations) {
      await prisma.hotRecommendation.create({
        data: {
          ...item,
          visible: true,
        },
      });
      created++;
    }
    
    console.log(`✅ 成功导入 ${created} 条热门推荐数据`);
    
    // 统计
    const stats = await prisma.hotRecommendation.groupBy({
      by: ['position'],
      _count: true,
    });
    
    console.log('\n📊 数据统计:');
    stats.forEach(s => {
      const label = s.position === 'hot' ? '热门推荐' : s.position === 'featured' ? '精选推荐' : '广告位';
      console.log(`   ${label}: ${s._count} 条`);
    });
    
  } catch (error) {
    console.error('❌ 导入失败:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// 运行
importHotRecommendations()
  .then(() => {
    console.log('\n🎉 热门推荐数据导入完成！');
    process.exit(0);
  })
  .catch((error) => {
    console.error('导入出错:', error);
    process.exit(1);
  });
