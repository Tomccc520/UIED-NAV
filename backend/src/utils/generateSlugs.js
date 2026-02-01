/**
 * @file utils/generateSlugs.js
 * @description 批量生成网站固定链接（slug）
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 * 
 * 使用方法：
 * cd backend && node src/utils/generateSlugs.js [mode]
 * 
 * mode 参数：
 * - pinyin: 中文名称转拼音（默认）
 * - id: 使用数字ID
 * - preview: 预览模式，不实际修改数据库
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * 简单的中文转拼音映射表（常用字）
 * 注意：这是简化版本，生产环境建议使用 pinyin 库
 */
const pinyinMap = {
  '设': 'she', '计': 'ji', '工': 'gong', '具': 'ju', '网': 'wang', '站': 'zhan',
  '图': 'tu', '标': 'biao', '素': 'su', '材': 'cai', '模': 'mo', '板': 'ban',
  '字': 'zi', '体': 'ti', '配': 'pei', '色': 'se', '灵': 'ling', '感': 'gan',
  '插': 'cha', '画': 'hua', '动': 'dong', '效': 'xiao', '原': 'yuan', '型': 'xing',
  '界': 'jie', '面': 'mian', '交': 'jiao', '互': 'hu', '用': 'yong', '户': 'hu',
  '体': 'ti', '验': 'yan', '产': 'chan', '品': 'pin', '开': 'kai', '发': 'fa',
  '前': 'qian', '端': 'duan', '后': 'hou', '移': 'yi', '应': 'ying', '程': 'cheng',
  '序': 'xu', '数': 'shu', '据': 'ju', '库': 'ku', '服': 'fu', '务': 'wu',
  '器': 'qi', '云': 'yun', '计': 'ji', '算': 'suan', '人': 'ren', '智': 'zhi',
  '能': 'neng', '学': 'xue', '习': 'xi', '深': 'shen', '度': 'du', '机': 'ji',
  '视': 'shi', '觉': 'jue', '语': 'yu', '言': 'yan', '处': 'chu', '理': 'li',
  '自': 'zi', '然': 'ran', '生': 'sheng', '成': 'cheng', '对': 'dui', '话': 'hua',
  '聊': 'liao', '天': 'tian', '助': 'zhu', '手': 'shou', '写': 'xie', '作': 'zuo',
  '编': 'bian', '辑': 'ji', '文': 'wen', '档': 'dang', '表': 'biao', '格': 'ge',
  '演': 'yan', '示': 'shi', '文': 'wen', '稿': 'gao', '视': 'shi', '频': 'pin',
  '音': 'yin', '乐': 'le', '图': 'tu', '片': 'pian', '照': 'zhao', '相': 'xiang',
  '摄': 'she', '影': 'ying', '三': 'san', '维': 'wei', '建': 'jian', '模': 'mo',
  '渲': 'xuan', '染': 'ran', '动': 'dong', '画': 'hua', '游': 'you', '戏': 'xi',
  '电': 'dian', '商': 'shang', '营': 'ying', '销': 'xiao', '社': 'she', '交': 'jiao',
  '媒': 'mei', '新': 'xin', '闻': 'wen', '资': 'zi', '讯': 'xun', '博': 'bo',
  '客': 'ke', '论': 'lun', '坛': 'tan', '社': 'she', '区': 'qu', '平': 'ping',
  '台': 'tai', '在': 'zai', '线': 'xian', '免': 'mian', '费': 'fei', '付': 'fu',
  '专': 'zhuan', '业': 'ye', '企': 'qi', '个': 'ge', '团': 'tuan', '队': 'dui',
  '协': 'xie', '项': 'xiang', '目': 'mu', '管': 'guan', '任': 'ren', '流': 'liu',
  '文': 'wen', '件': 'jian', '存': 'cun', '储': 'chu', '分': 'fen', '享': 'xiang',
  '同': 'tong', '步': 'bu', '备': 'bei', '份': 'fen', '安': 'an', '全': 'quan',
  '加': 'jia', '密': 'mi', '认': 'ren', '证': 'zheng', '授': 'shou', '权': 'quan',
  '测': 'ce', '试': 'shi', '调': 'diao', '监': 'jian', '控': 'kong', '日': 'ri',
  '志': 'zhi', '分': 'fen', '析': 'xi', '统': 'tong', '报': 'bao', '告': 'gao',
  '导': 'dao', '入': 'ru', '出': 'chu', '转': 'zhuan', '换': 'huan', '压': 'ya',
  '缩': 'suo', '解': 'jie', '合': 'he', '并': 'bing', '拆': 'chai', '裁': 'cai',
  '剪': 'jian', '旋': 'xuan', '转': 'zhuan', '缩': 'suo', '放': 'fang', '滤': 'lv',
  '镜': 'jing', '特': 'te', '背': 'bei', '景': 'jing', '去': 'qu', '除': 'chu',
  '抠': 'kou', '换': 'huan', '脸': 'lian', '美': 'mei', '颜': 'yan', '修': 'xiu',
  '复': 'fu', '增': 'zeng', '强': 'qiang', '降': 'jiang', '噪': 'zao', '清': 'qing',
  '晰': 'xi', '高': 'gao', '低': 'di', '快': 'kuai', '慢': 'man', '大': 'da',
  '小': 'xiao', '长': 'chang', '短': 'duan', '宽': 'kuan', '窄': 'zhai', '厚': 'hou',
  '薄': 'bao', '轻': 'qing', '重': 'zhong', '软': 'ruan', '硬': 'ying', '热': 're',
  '冷': 'leng', '亮': 'liang', '暗': 'an', '明': 'ming', '黑': 'hei', '白': 'bai',
  '红': 'hong', '橙': 'cheng', '黄': 'huang', '绿': 'lv', '青': 'qing', '蓝': 'lan',
  '紫': 'zi', '粉': 'fen', '灰': 'hui', '棕': 'zong', '金': 'jin', '银': 'yin',
  '铜': 'tong', '铁': 'tie', '钢': 'gang', '木': 'mu', '石': 'shi', '玻': 'bo',
  '璃': 'li', '塑': 'su', '料': 'liao', '纸': 'zhi', '布': 'bu', '皮': 'pi',
  '革': 'ge', '丝': 'si', '绸': 'chou', '棉': 'mian', '麻': 'ma', '毛': 'mao',
  '羽': 'yu', '绒': 'rong', '中': 'zhong', '国': 'guo', '美': 'mei', '英': 'ying',
  '法': 'fa', '德': 'de', '日': 'ri', '韩': 'han', '俄': 'e', '印': 'yin',
  '巴': 'ba', '西': 'xi', '澳': 'ao', '加': 'jia', '拿': 'na', '墨': 'mo',
  '阿': 'a', '拉': 'la', '伯': 'bo', '非': 'fei', '洲': 'zhou', '欧': 'ou',
  '亚': 'ya', '北': 'bei', '南': 'nan', '东': 'dong', '内': 'nei', '外': 'wai',
  '上': 'shang', '下': 'xia', '左': 'zuo', '右': 'you', '中': 'zhong', '间': 'jian',
  '里': 'li', '旁': 'pang', '边': 'bian', '角': 'jiao', '顶': 'ding', '底': 'di',
  '首': 'shou', '尾': 'wei', '头': 'tou', '身': 'shen', '脚': 'jiao', '眼': 'yan',
  '耳': 'er', '鼻': 'bi', '口': 'kou', '牙': 'ya', '舌': 'she', '唇': 'chun',
  '颊': 'jia', '额': 'e', '眉': 'mei', '睫': 'jie', '瞳': 'tong', '孔': 'kong',
  '心': 'xin', '肝': 'gan', '脾': 'pi', '肺': 'fei', '肾': 'shen', '胃': 'wei',
  '肠': 'chang', '脑': 'nao', '骨': 'gu', '肉': 'rou', '血': 'xue', '筋': 'jin',
  '脉': 'mai', '神': 'shen', '经': 'jing', '细': 'xi', '胞': 'bao', '基': 'ji',
  '因': 'yin', '蛋': 'dan', '质': 'zhi', '酶': 'mei', '激': 'ji', '抗': 'kang',
  '病': 'bing', '毒': 'du', '菌': 'jun', '药': 'yao', '医': 'yi', '院': 'yuan',
  '诊': 'zhen', '所': 'suo', '科': 'ke', '室': 'shi', '床': 'chuang', '位': 'wei',
  '号': 'hao', '挂': 'gua', '预': 'yu', '约': 'yue', '排': 'pai', '等': 'deng',
  '候': 'hou', '检': 'jian', '查': 'cha', '化': 'hua', '验': 'yan', '影': 'ying',
  '像': 'xiang', '超': 'chao', '声': 'sheng', '波': 'bo', '磁': 'ci', '共': 'gong',
  '振': 'zhen', '核': 'he', '射': 'she', '线': 'xian', '放': 'fang', '疗': 'liao',
  '手': 'shou', '术': 'shu', '麻': 'ma', '醉': 'zui', '护': 'hu', '康': 'kang',
};

/**
 * 将中文转换为拼音
 * @param {string} str - 中文字符串
 * @returns {string} 拼音字符串
 */
function toPinyin(str) {
  if (!str) return '';
  
  let result = '';
  for (const char of str) {
    if (pinyinMap[char]) {
      result += pinyinMap[char];
    } else if (/[a-zA-Z0-9]/.test(char)) {
      result += char.toLowerCase();
    } else if (/[\u4e00-\u9fa5]/.test(char)) {
      // 未知中文字符，使用 Unicode 编码
      result += 'u' + char.charCodeAt(0).toString(16);
    } else if (char === ' ' || char === '-' || char === '_') {
      result += '-';
    }
    // 其他字符忽略
  }
  
  // 清理连续的连字符
  return result.replace(/-+/g, '-').replace(/^-|-$/g, '');
}

/**
 * 生成唯一的 slug
 * @param {string} baseSlug - 基础 slug
 * @param {Set<string>} existingSlugs - 已存在的 slug 集合
 * @returns {string} 唯一的 slug
 */
function generateUniqueSlug(baseSlug, existingSlugs) {
  if (!existingSlugs.has(baseSlug)) {
    return baseSlug;
  }
  
  let counter = 2;
  let newSlug = `${baseSlug}-${counter}`;
  while (existingSlugs.has(newSlug)) {
    counter++;
    newSlug = `${baseSlug}-${counter}`;
  }
  return newSlug;
}

/**
 * 批量生成 slug
 * @param {string} mode - 生成模式：pinyin, id, preview
 */
async function generateSlugs(mode = 'pinyin') {
  console.log(`\n🚀 开始生成固定链接 (模式: ${mode})\n`);
  
  try {
    // 获取所有网站
    const websites = await prisma.website.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        url: true,
      },
      orderBy: { createdAt: 'asc' }
    });
    
    console.log(`📊 共找到 ${websites.length} 个网站\n`);
    
    // 统计
    let withSlug = 0;
    let withoutSlug = 0;
    let toUpdate = [];
    
    // 收集已存在的 slug
    const existingSlugs = new Set(
      websites.filter(w => w.slug).map(w => w.slug)
    );
    
    for (const website of websites) {
      if (website.slug) {
        withSlug++;
        continue;
      }
      
      withoutSlug++;
      
      let newSlug;
      if (mode === 'id') {
        // 使用数字 ID
        newSlug = String(withSlug + withoutSlug);
      } else {
        // 使用拼音
        // 优先从 URL 提取域名作为 slug
        try {
          const urlObj = new URL(website.url);
          const domain = urlObj.hostname.replace('www.', '').split('.')[0];
          if (domain && /^[a-z0-9-]+$/i.test(domain)) {
            newSlug = domain.toLowerCase();
          } else {
            newSlug = toPinyin(website.name);
          }
        } catch {
          newSlug = toPinyin(website.name);
        }
      }
      
      // 确保唯一性
      newSlug = generateUniqueSlug(newSlug, existingSlugs);
      existingSlugs.add(newSlug);
      
      toUpdate.push({
        id: website.id,
        name: website.name,
        oldSlug: website.slug,
        newSlug: newSlug
      });
    }
    
    console.log(`📈 统计:`);
    console.log(`   - 已有 slug: ${withSlug}`);
    console.log(`   - 需要生成: ${withoutSlug}`);
    console.log('');
    
    if (toUpdate.length === 0) {
      console.log('✅ 所有网站都已有固定链接，无需更新\n');
      return;
    }
    
    // 预览模式
    if (mode === 'preview') {
      console.log('📋 预览（前 20 条）:\n');
      toUpdate.slice(0, 20).forEach((item, index) => {
        console.log(`   ${index + 1}. ${item.name}`);
        console.log(`      → ${item.newSlug}`);
      });
      if (toUpdate.length > 20) {
        console.log(`   ... 还有 ${toUpdate.length - 20} 条`);
      }
      console.log('\n⚠️  预览模式，未实际修改数据库');
      console.log('   运行 `node src/utils/generateSlugs.js pinyin` 或 `node src/utils/generateSlugs.js id` 来实际更新\n');
      return;
    }
    
    // 实际更新
    console.log('🔄 正在更新数据库...\n');
    
    let updated = 0;
    let failed = 0;
    
    for (const item of toUpdate) {
      try {
        await prisma.website.update({
          where: { id: item.id },
          data: { slug: item.newSlug }
        });
        updated++;
        
        // 每 100 条输出一次进度
        if (updated % 100 === 0) {
          console.log(`   已更新 ${updated}/${toUpdate.length}...`);
        }
      } catch (error) {
        failed++;
        console.error(`   ❌ 更新失败: ${item.name} - ${error.message}`);
      }
    }
    
    console.log('');
    console.log(`✅ 完成！`);
    console.log(`   - 成功更新: ${updated}`);
    console.log(`   - 失败: ${failed}`);
    console.log('');
    
  } catch (error) {
    console.error('❌ 执行失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// 获取命令行参数
const mode = process.argv[2] || 'preview';

// 验证模式
if (!['pinyin', 'id', 'preview'].includes(mode)) {
  console.log('❌ 无效的模式参数');
  console.log('');
  console.log('使用方法:');
  console.log('  node src/utils/generateSlugs.js [mode]');
  console.log('');
  console.log('mode 参数:');
  console.log('  preview - 预览模式，不实际修改（默认）');
  console.log('  pinyin  - 中文名称转拼音');
  console.log('  id      - 使用数字ID');
  console.log('');
  process.exit(1);
}

generateSlugs(mode);
