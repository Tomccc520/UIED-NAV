/**
 * @copyright Tomda (https://www.tomda.top)
 * @copyright UIED技术团队 (https://fsuied.com)
 * @author UIED技术团队
 * @createDate 2026-02-26
 */
/**
 * @file Changelog/index.tsx
 * @description 更新记录页面 - 展示网站功能更新历史
 */

import React, { useState, useEffect } from 'react';
import SEO from '../../components/SEO';
import './index.css';

// 图标组件
const GitHubIcon: React.FC<{ size?: number }> = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
  </svg>
);

const GiteeIcon: React.FC<{ size?: number }> = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M11.984 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.016 0zm6.09 5.333c.328 0 .593.266.592.593v1.482a.594.594 0 0 1-.593.592H9.777c-.982 0-1.778.796-1.778 1.778v5.63c0 .327.266.592.593.592h5.63c.982 0 1.778-.796 1.778-1.778v-.296a.593.593 0 0 0-.592-.593h-4.15a.592.592 0 0 1-.592-.592v-1.482a.593.593 0 0 1 .593-.592h6.815c.327 0 .593.265.593.592v3.408a4 4 0 0 1-4 4H5.926a.593.593 0 0 1-.593-.593V9.778a4.444 4.444 0 0 1 4.445-4.444h8.296z" />
  </svg>
);

const CSDNIcon: React.FC<{ size?: number }> = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 1024 1024" fill="currentColor">
    <path d="M0 0h1024v1024H0z" fill="#FF6633" />
    <path d="M698.9824 42.3936c-158.8736-32.5632-289.536 31.2832-324.9152 48.5888-94.72 46.2848-147.712 108.288-174.4896 140.288-25.9584 31.0272-82.7392 105.9328-108.288 215.8592-21.6576 93.1328-10.752 167.7824-6.0416 194.2528 11.4688 64.3072 33.28 186.88 150.4256 275.2 132.5056 99.8912 293.4784 85.5552 342.9888 80.9472 107.264-10.0352 289.4848-57.2928 300.8512-145.7152 5.1712-39.936-24.4224-89.4464-66.2016-102.5024-65.6384-20.5312-108.3392 63.5392-228.6592 80.9472-8.5504 1.2288-126.5664 16.6912-216.6272-48.5888-105.8816-76.6976-98.9696-211.3024-96.256-264.3968 1.536-30.5664 5.5808-93.5424 48.128-161.8944 14.7968-23.7568 60.3136-94.5664 156.4672-134.912 25.2928-10.5984 76.8512-31.5904 144.4352-26.9824 70.0416 4.7616 120.9856 34.5088 144.4352 48.5888 75.8272 45.4144 86.528 90.0608 120.3712 86.3232 35.8912-3.9424 69.9904-59.2896 66.2016-107.9296-7.424-93.7984-155.5968-158.1056-252.8256-178.0736z" fill="#FFFFFF" />
  </svg>
);

const UIEDIcon: React.FC<{ size?: number }> = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 500 500" fill="currentColor">
    <g stroke="none" strokeWidth="1" fillRule="evenodd">
      <path d="M50,0 L450,0 C477.614237,-5.07265313e-15 500,22.3857625 500,50 L500,450 C500,477.614237 477.614237,500 450,500 L50,500 C22.3857625,500 1.69088438e-15,477.614237 0,450 L0,50 C-3.38176876e-15,22.3857625 22.3857625,3.38176876e-15 50,0 Z M212.021661,187 L196.281588,299.620652 C195.703971,303.602926 193.947052,306.881017 191.01083,309.454926 C188.074609,312.028835 184.632972,313.315789 180.685921,313.315789 L167.400722,313.315789 L183.429603,198.655436 C183.910951,195.255934 185.427196,192.463486 187.978339,190.278091 C190.529483,188.092697 193.489771,187 196.859206,187 L212.021661,187 Z M87.1119134,187 L77.1480144,257.515389 C76.8592058,259.846476 76.7148014,262.03187 76.7148014,264.071572 C76.7148014,272.618892 79.3140794,279.077946 84.5126354,283.448734 C89.6149218,287.819523 96.3056558,290.004917 104.584838,290.004917 C113.056558,290.004917 120.036101,287.67383 125.523466,283.011655 C131.01083,278.252352 134.33213,271.356219 135.487365,262.323256 L144.151625,200.695137 C144.729242,196.712863 146.486161,193.434772 149.422383,190.860863 C152.358604,188.286954 155.752106,187 159.602888,187 L172.166065,187 L161.33574,264.508651 C156.907341,296.852486 137.990373,313.024404 104.584838,313.024404 C87.0637786,313.024404 73.5860409,309.04213 64.1516245,301.077581 C54.7172082,293.015905 50,281.894676 50,267.713895 C50,264.508651 50.2406739,261.206277 50.7220217,257.806775 L58.9530686,200.549445 C59.6269555,196.567171 61.4079422,193.313361 64.2960289,190.788017 C67.1841155,188.262672 70.5535499,187 74.4043321,187 L87.1119134,187 Z M326.534296,187 L325.234657,196.178656 C324.849579,198.704 323.742479,200.767984 321.913357,202.370606 C320.084236,203.973229 317.966306,204.77454 315.559567,204.77454 L258.519856,204.77454 L254.043321,237.409761 L312.238267,237.409761 L309.350181,258.098161 L251.155235,258.098161 L245.812274,292.773083 L311.805054,292.773083 L311.083032,299.912038 C310.505415,303.797183 308.820698,307.002428 306.028881,309.527773 C303.237064,312.053117 299.963899,313.315789 296.209386,313.315789 L216.209386,313.315789 L231.516245,204.337461 C232.286402,199.286772 234.524669,195.134523 238.231047,191.880714 C241.937425,188.626905 246.293622,187 251.299639,187 L326.534296,187 Z M385.451264,187.145693 C406.341757,187.145693 422.322503,192.827718 433.393502,204.191768 C444.464501,215.652947 450,230.4165 450,248.482426 C450,267.033995 444.320096,282.477448 432.960289,294.812785 C421.696751,307.050993 407.689531,313.170097 390.938628,313.170097 L326.534296,313.170097 L341.98556,200.986523 L342.06209,200.552325 C342.789822,196.670463 344.569366,193.48854 347.400722,191.006556 C350.336943,188.432647 353.77858,187.145693 357.725632,187.145693 Z M380.397112,208.271171 L367.545126,208.271171 L355.99278,292.190311 L380.974729,292.190311 C393.971119,292.190311 404.127557,288.062344 411.444043,279.80641 C418.856799,271.550477 422.563177,261.01202 422.563177,248.19104 C422.563177,236.341346 418.760529,226.725612 411.155235,219.343835 C403.54994,211.962059 393.297232,208.271171 380.397112,208.271171 Z" />
    </g>
  </svg>
);

const ArrowIcon: React.FC<{ size?: number }> = ({ size = 12 }) => (
  <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
  </svg>
);

// 仓库链接数据
const repoLinks = [
  { name: 'GitHub 仓库', url: 'https://github.com/Tomccc520/UIED-NAV', icon: GitHubIcon },
  { name: 'Gitee 仓库', url: 'https://gitee.com/tomdac/uied-nav', icon: GiteeIcon },
  { name: 'CSDN 博客', url: 'https://blog.csdn.net/Tomdac?spm=1000.2115.3001.5343', icon: CSDNIcon },
  { name: 'UIED技术团队', url: 'https://fsuied.com/', icon: UIEDIcon },
];

// 相关平台链接
const platformLinks = [
  { name: 'AI学习平台', url: 'https://www.uied.cn/' },
  { name: 'AI免费工具', url: 'https://uiedtool.com' },
  { name: 'AI资讯热榜', url: 'https://hot.uied.cn' },
  { name: 'AI工具导航', url: 'https://hao.uied.cn/ai' },
  { name: 'AI交流群', url: 'https://ai.feishu.cn/wiki/CUuaw5ooxiHAkckgtRkcn6rnnVQ?from=from_copylink' },
  { name: 'AI知识库', url: 'https://ai.feishu.cn/wiki/ZjddwTFpWivK6ukwBoDc5DoHnVt?from=from_copylink' },
];

// 更新记录数据
const changelogData = [
  {
    version: '3.0.0-rc.1',
    date: '2026-02-27',
    title: '首发候选包生成与发布健康检查通过',
    changes: [
      { type: 'feature', text: '完成商业版首发候选包（first-pro 预设）打包，支持按许可证交付而非代码分叉' },
      { type: 'improve', text: '发布前健康检查增强并实测通过（FAIL=0），覆盖接口、路由、菜单、配置、数据与前台关键页面' },
      { type: 'fix', text: '修复用户中心网址互动接口鉴权（收藏/点赞/评论列表 403），前后端联调可用' },
    ]
  },
  {
    version: '3.0.0-beta.8',
    date: '2026-02-26',
    title: '用户中心评论链路打通与分页对接修复',
    changes: [
      { type: 'feature', text: '个人中心新增“我的评论”Tab，支持文章评论与网址评论双列表展示' },
      { type: 'feature', text: '后端新增用户评论接口：/api/user/article/comment/list 与 /api/user/website/comment/list' },
      { type: 'improve', text: '用户中心分页参数兼容增强：统一支持 page / pageNo，修复部分列表翻页失效问题' },
      { type: 'improve', text: '个人中心统计卡片新增“网站收藏”“网站点赞”两项，运营侧可直观看到互动沉淀' },
    ]
  },
  {
    version: '3.0.0-beta.7',
    date: '2026-02-26',
    title: '热榜/榜单布局优化与站点访问数据高级版',
    changes: [
      { type: 'feature', text: '新增站点访问数据（高级版）模型与后台录入：月访问量、停留时长、页数、跳出率、来源占比' },
      { type: 'feature', text: '个人中心新增收藏网址与点赞网站列表（前后端打通）' },
      { type: 'feature', text: '网址对比页新增 AI 分析对比模块（受商业版 AI 能力控制）' },
      { type: 'improve', text: '每日热榜与榜单页布局改造，支持多平台展示与双栏榜单布局' },
      { type: 'improve', text: '广告管理页面增加前端显示位置说明与快捷预览入口，降低运营配置门槛' },
    ]
  },
  {
    version: '3.0.0-beta.6',
    date: '2026-02-26',
    title: '商业版运营模块与详情页对比能力增强',
    changes: [
      { type: 'feature', text: '新增网址详情页多模板（展示版/紧凑版/企业版）与后台切换配置' },
      { type: 'feature', text: '新增网址对比页 VS 路由与 SEO 结构化数据（FAQPage）' },
      { type: 'feature', text: '新增网站点赞链路（匿名+登录均可）并接入榜单系统' },
      { type: 'improve', text: '网站详情页支持截图优先级：上传预览图 > 本地图/截图 > 自动截图兜底' },
      { type: 'improve', text: '榜单系统升级为访问量/收藏量/点赞量 + 日周月切换' },
    ]
  },
  {
    version: '3.0.0-beta.5',
    date: '2026-02-25',
    title: '每日热榜与运营配置后台化',
    changes: [
      { type: 'feature', text: '每日热榜新增后台全局配置（默认平台、显示位置、入口配置）' },
      { type: 'feature', text: '每日热榜前端页面支持多平台展示与平台标签切换' },
      { type: 'improve', text: '每日热榜平台配置页改为运营化交互，弱化开发调试字段' },
      { type: 'fix', text: '修复热榜平台列表为空时前端无数据问题（后端默认平台回退）' },
    ]
  },
  {
    version: '3.0.0-beta.4',
    date: '2026-02-24',
    title: '商业位体系与截图能力升级',
    changes: [
      { type: 'feature', text: '新增商业位体系（顶部/正文中/底部/侧栏）并接入详情页运营位' },
      { type: 'feature', text: '新增网站预览截图接口（Playwright 优先，mShots 兜底）' },
      { type: 'improve', text: '广告管理支持图片/链接/HTML 代码广告内容配置' },
      { type: 'improve', text: '后台菜单按运营场景重构，新增榜单与专题/商业变现分组' },
    ]
  },
  {
    version: '2.7.1',
    date: '2026-01-18',
    title: 'SEO抓取与图标URL功能',
    changes: [
      { type: 'feature', text: '新增SEO信息自动抓取功能（标题、描述、关键词）' },
      { type: 'feature', text: '网站图标支持URL输入方式' },
      { type: 'improve', text: '优化网站添加流程，支持三种图标设置方式' },
      { type: 'fix', text: '修复SEO抓取SSL证书验证问题' },
    ]
  },
  {
    version: '2.7.0',
    date: '2026-01-18',
    title: '管理后台与移动端优化',
    changes: [
      { type: 'feature', text: '热门推荐管理新增批量删除功能' },
      { type: 'feature', text: '后台新增"访问首页"快捷按钮' },
      { type: 'improve', text: '搜索页面移动端改为2列卡片布局' },
      { type: 'fix', text: '修复后台 logo.svg 路径问题' },
      { type: 'improve', text: '优化移动端搜索卡片显示效果' },
    ]
  },
  {
    version: '2.6.0',
    date: '2026-01-17',
    title: '更新日志页面优化',
    changes: [
      { type: 'feature', text: '更新日志页面新增目录导航' },
      { type: 'feature', text: '新增开发者信息和仓库链接' },
      { type: 'feature', text: '新增相关平台快捷入口' },
      { type: 'improve', text: '完善历史功能更新记录' },
    ]
  },
  {
    version: '2.5.0',
    date: '2026-01-17',
    title: '自动跳转与页脚优化',
    changes: [
      { type: 'feature', text: '新增跳转弹窗自动倒计时跳转功能' },
      { type: 'feature', text: '新增更新记录页面' },
      { type: 'improve', text: '优化页脚按钮设计风格' },
      { type: 'fix', text: '修复广告横幅多位置筛选问题' },
    ]
  },
  {
    version: '2.4.0',
    date: '2026-01-15',
    title: '页脚与移动端优化',
    changes: [
      { type: 'feature', text: '页脚新增关注交流区域（社交媒体分组）' },
      { type: 'feature', text: '新增网站跳转确认弹窗配置' },
      { type: 'improve', text: '优化移动端子分类标签滚动体验' },
      { type: 'improve', text: '统一各页面底部广告横幅支持' },
      { type: 'fix', text: '修复移动端卡片溢出问题' },
    ]
  },
  {
    version: '2.3.0',
    date: '2026-01-10',
    title: 'AI搜索与监控功能',
    changes: [
      { type: 'feature', text: '新增AI智能搜索功能' },
      { type: 'feature', text: '新增网站状态监控系统' },
      { type: 'feature', text: '新增SEO设置管理（sitemap、robots）' },
      { type: 'feature', text: '新增操作日志记录系统' },
      { type: 'improve', text: '优化搜索结果排序算法' },
    ]
  },
  {
    version: '2.2.0',
    date: '2026-01-05',
    title: '广告与提交系统',
    changes: [
      { type: 'feature', text: '新增广告横幅管理系统' },
      { type: 'feature', text: '新增网站提交功能' },
      { type: 'feature', text: '新增数据导出功能（JSON/CSV）' },
      { type: 'feature', text: '新增批量导入功能' },
      { type: 'improve', text: '优化后台管理界面布局' },
    ]
  },
  {
    version: '2.1.0',
    date: '2025-12-28',
    title: '社交媒体与页面管理',
    changes: [
      { type: 'feature', text: '新增社交媒体分组管理' },
      { type: 'feature', text: '新增动态页面配置系统' },
      { type: 'feature', text: '新增友情链接管理' },
      { type: 'feature', text: '新增页脚分组管理' },
      { type: 'improve', text: '优化分类侧边栏交互' },
      { type: 'fix', text: '修复热门推荐数据加载问题' },
    ]
  },
  {
    version: '2.0.0',
    date: '2025-12-20',
    title: '全新架构升级',
    changes: [
      { type: 'feature', text: '全新前后端分离架构（React + Express）' },
      { type: 'feature', text: '新增后台管理系统（Ant Design）' },
      { type: 'feature', text: '支持SQLite数据库动态管理' },
      { type: 'feature', text: '新增JWT用户认证系统' },
      { type: 'feature', text: '新增分类和子分类管理' },
      { type: 'feature', text: '新增网站CRUD管理' },
      { type: 'feature', text: '新增站点设置管理' },
      { type: 'improve', text: '全面优化页面加载性能' },
    ]
  },
  {
    version: '1.5.0',
    date: '2025-12-10',
    title: '多页面支持',
    changes: [
      { type: 'feature', text: '新增AI工具页面' },
      { type: 'feature', text: '新增UI/UX设计页面' },
      { type: 'feature', text: '新增平面设计页面' },
      { type: 'feature', text: '新增3D设计页面' },
      { type: 'feature', text: '新增电商设计页面' },
      { type: 'feature', text: '新增室内设计页面' },
      { type: 'feature', text: '新增字体资源页面' },
    ]
  },
  {
    version: '1.0.0',
    date: '2025-11-01',
    title: '项目初始版本',
    changes: [
      { type: 'feature', text: '基础导航网站框架搭建' },
      { type: 'feature', text: '响应式布局支持' },
      { type: 'feature', text: '分类筛选功能' },
      { type: 'feature', text: '搜索功能' },
      { type: 'feature', text: '热门推荐展示' },
    ]
  },
];

// 变更类型标签
const typeLabels: Record<string, { text: string; className: string }> = {
  feature: { text: '新功能', className: 'tag-feature' },
  improve: { text: '优化', className: 'tag-improve' },
  fix: { text: '修复', className: 'tag-fix' },
};

const ChangelogPage: React.FC = () => {
  // 统计信息
  const websiteCount = 2440;
  const lastUpdate = '2026-01-17 18:00';
  
  // 当前激活的版本（用于目录高亮）
  const [activeVersion, setActiveVersion] = useState<string>(changelogData[0].version);

  // 滚动监听
  useEffect(() => {
    const handleScroll = () => {
      const sections = document.querySelectorAll('.changelog-item');
      let currentVersion = changelogData[0].version;
      
      sections.forEach((section) => {
        const rect = section.getBoundingClientRect();
        if (rect.top <= 150) {
          currentVersion = section.getAttribute('data-version') || currentVersion;
        }
      });
      
      setActiveVersion(currentVersion);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 点击目录跳转
  const scrollToVersion = (version: string) => {
    const element = document.querySelector(`[data-version="${version}"]`);
    if (element) {
      const top = element.getBoundingClientRect().top + window.scrollY - 100;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  };

  return (
    <div className="changelog-page">
      <SEO 
        title="更新记录 - UIED设计导航"
        description="UIED设计导航更新记录，了解最新功能和改进"
        keywords="更新记录,版本历史,功能更新"
      />

      <div className="changelog-layout">
        {/* 左侧目录导航 */}
        <aside className="changelog-toc">
          <div className="toc-header">版本目录</div>
          <nav className="toc-nav">
            {changelogData.map((release) => (
              <button
                key={release.version}
                className={`toc-item ${activeVersion === release.version ? 'active' : ''}`}
                onClick={() => scrollToVersion(release.version)}
              >
                <span className="toc-version">v{release.version}</span>
                <span className="toc-title">{release.title}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* 主内容区 */}
        <div className="changelog-container">
          {/* 页面头部 */}
          <div className="changelog-header">
            <h1>更新日志</h1>
            <p className="header-desc">
              由 <a href="https://tomda.top/" target="_blank" rel="noopener noreferrer" className="author-link">Tomda</a> 开发（AI协助）并记录 UIED-NAV 的开发历程和功能更新。公众号：Tomda
            </p>
            
            {/* 仓库链接 */}
            <div className="repo-links">
              {repoLinks.map((link) => (
                <a 
                  key={link.name}
                  href={link.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="repo-link"
                >
                  <link.icon size={20} />
                  <span>{link.name}</span>
                </a>
              ))}
            </div>

            {/* 相关平台 */}
            <div className="platform-links">
              {platformLinks.map((link) => (
                <a 
                  key={link.name}
                  href={link.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="platform-link"
                >
                  <span>{link.name}</span>
                  <ArrowIcon size={12} />
                </a>
              ))}
            </div>

            {/* 统计信息 */}
            <div className="stats-info">
              当前网站总数：{websiteCount}个 | 最后更新：{lastUpdate}
            </div>
          </div>

          {/* 时间线 */}
          <div className="changelog-timeline">
            {changelogData.map((release, index) => (
              <div 
                className="changelog-item" 
                key={release.version}
                data-version={release.version}
              >
                <div className="changelog-marker">
                  <div className="marker-dot" />
                  {index < changelogData.length - 1 && <div className="marker-line" />}
                </div>
                
                <div className="changelog-content">
                  <div className="changelog-meta">
                    <span className="version-tag">v{release.version}</span>
                    <span className="release-date">{release.date}</span>
                  </div>
                  
                  <h2 className="release-title">{release.title}</h2>
                  
                  <ul className="changes-list">
                    {release.changes.map((change, i) => (
                      <li key={i} className="change-item">
                        <span className={`change-tag ${typeLabels[change.type].className}`}>
                          {typeLabels[change.type].text}
                        </span>
                        <span className="change-text">{change.text}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChangelogPage;
