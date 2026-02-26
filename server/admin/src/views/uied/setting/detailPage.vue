<!--
 * @file views/uied/setting/detailPage.vue
 * @description 网站详情页配置 - 控制详情页各区块的显示和内容
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.1.0
-->
<template>
    <div class="detail-page-setting">
        <el-card class="!border-none" shadow="never">
            <div class="setting-header">
                <h2 class="setting-title">网站详情页配置</h2>
                <p class="setting-desc">
                    配置前端「网站详情页」的各项功能和显示内容。修改后保存即可实时生效，无需重启服务。
                </p>
            </div>

            <el-tabs v-model="activeSectionTab" class="setting-nav-tabs" @tab-click="handleSectionTabClick">
                <el-tab-pane label="布局样式" name="layout" />
                <el-tab-pane label="侧栏与运营位" name="sidebarOps" />
                <el-tab-pane label="SEO模块" name="seo" />
                <el-tab-pane label="区块显示" name="blocks" />
                <el-tab-pane label="底部与举报" name="footer" />
            </el-tabs>

            <el-form :model="config" label-width="160px" style="max-width: 700px">
                <!-- 布局与样式（售卖版） -->
                <div id="detail-page-config-section-layout">
                    <el-divider content-position="left">布局与样式（售卖版）</el-divider>
                </div>
                <p class="section-desc">
                    支持多套详情页视觉风格切换，便于交付不同客户时快速做出差异化效果。
                </p>

                <el-form-item label="页面样式">
                    <el-select v-model="config.pageStylePreset" style="width: 260px">
                        <el-option label="展示版（左文案右缩略图）" value="showcase" />
                        <el-option label="紧凑版（信息密度更高）" value="compact" />
                        <el-option label="企业版（截图左侧 + 信息面板）" value="enterprise" />
                    </el-select>
                    <span class="form-tip">用于切换详情页整体布局观感，适合售卖版做差异化展示。</span>
                </el-form-item>

                <el-form-item label="页面宽度">
                    <el-select v-model="config.layoutWidthMode" style="width: 260px">
                        <el-option label="标准宽度" value="contained" />
                        <el-option label="加宽布局" value="wide" />
                        <el-option label="全宽自适应" value="fluid" />
                    </el-select>
                    <span class="form-tip">控制详情页容器宽度。全宽自适应用于大屏展示，移动端自动适配。</span>
                </el-form-item>

                <el-form-item label="内容间距">
                    <el-select v-model="config.spacingDensity" style="width: 260px">
                        <el-option label="紧凑（推荐）" value="compact" />
                        <el-option label="舒展" value="comfortable" />
                    </el-select>
                    <span class="form-tip">控制区块上下间距与留白密度，适合根据行业风格调整。</span>
                </el-form-item>

                <el-form-item label="标签分类风格">
                    <el-select v-model="config.labelVisualStyle" style="width: 260px">
                        <el-option label="柔和胶囊" value="soft" />
                        <el-option label="描边胶囊" value="outline" />
                    </el-select>
                    <span class="form-tip">统一控制详情页分类、标签与侧边栏标签的视觉风格。</span>
                </el-form-item>

                <el-form-item label="站点数据面板">
                    <el-switch v-model="config.dataPanelEnabled" />
                    <span class="form-tip">开启后在详情页头部展示域名、协议、截图数、更新时间等基础数据。</span>
                </el-form-item>

                <el-form-item label="数据面板标题">
                    <el-input
                        v-model="config.dataPanelTitle"
                        placeholder="例如：站点数据 / 产品信息 / 网址指标"
                        :disabled="!config.dataPanelEnabled"
                    />
                    <span class="form-tip">站点数据面板标题文案，可按客户行业改成更贴近的名称。</span>
                </el-form-item>

                <!-- 详情侧边栏（兼容前端旧接口） -->
                <div id="detail-page-config-section-sidebar-ops">
                    <el-divider content-position="left">详情侧边栏（兼容前端旧接口）</el-divider>
                </div>
                <p class="section-desc">
                    这里配置的字段会同时供详情页侧边栏读取（兼容旧接口 <code>/api/public/detail-sidebar-config</code>）。
                </p>

                <el-form-item label="启用侧边栏">
                    <el-switch v-model="config.enabled" />
                    <span class="form-tip">关闭后前端详情页右侧栏整体隐藏（移动端底部推荐也将受影响）。</span>
                </el-form-item>

                <el-form-item label="相关推荐">
                    <el-switch v-model="config.showRelated" :disabled="!config.enabled" />
                    <span class="form-tip">控制详情页侧边栏“相关推荐”区块显示。</span>
                </el-form-item>

                <el-form-item label="相关推荐标题">
                    <el-input
                        v-model="config.relatedTitle"
                        :disabled="!config.enabled || !config.showRelated"
                        placeholder="例如：你可能还喜欢 / 同类推荐"
                    />
                    <span class="form-tip">侧边栏相关推荐标题文案。</span>
                </el-form-item>

                <el-form-item label="相关推荐数量">
                    <el-input-number
                        v-model="config.relatedCount"
                        :min="1"
                        :max="12"
                        :disabled="!config.enabled || !config.showRelated"
                    />
                    <span class="form-tip">控制侧边栏相关推荐显示数量。</span>
                </el-form-item>

                <el-form-item label="标签区块">
                    <el-switch v-model="config.showTags" :disabled="!config.enabled" />
                    <span class="form-tip">控制侧边栏标签云区块显示。</span>
                </el-form-item>

                <el-form-item label="标签区块标题">
                    <el-input
                        v-model="config.tagsTitle"
                        :disabled="!config.enabled || !config.showTags"
                        placeholder="例如：深入探索 / 相关标签"
                    />
                    <span class="form-tip">侧边栏标签区块标题文案。</span>
                </el-form-item>

                <!-- 详情侧边栏高级配置 -->
                <el-divider content-position="left">详情侧边栏高级配置（售卖版）</el-divider>
                <p class="section-desc">
                    支持手动推荐、推荐逻辑切换、标签来源和侧边栏广告位，方便按行业客户做差异化交付。
                </p>

                <el-form-item label="推荐逻辑">
                    <el-select
                        v-model="config.relatedMode"
                        style="width: 260px"
                        :disabled="!config.enabled || !config.showRelated"
                    >
                        <el-option label="同分类推荐" value="same_category" />
                        <el-option label="同标签推荐" value="same_tags" />
                        <el-option label="热门推荐" value="hot" />
                        <el-option label="手动推荐（按ID）" value="manual" />
                    </el-select>
                    <span class="form-tip">控制侧边栏相关推荐的数据来源逻辑。</span>
                </el-form-item>

                <el-form-item
                    v-if="config.relatedMode === 'manual'"
                    label="手动推荐网站ID"
                >
                    <el-input
                        v-model="config.manualWebsiteIds"
                        type="textarea"
                        :rows="3"
                        :disabled="!config.enabled || !config.showRelated"
                        placeholder="填写网站ID，英文逗号分隔，例如：12,35,108"
                    />
                    <span class="form-tip">仅在「手动推荐」模式下生效，按填写顺序展示。</span>
                </el-form-item>

                <el-form-item label="标签来源">
                    <el-select
                        v-model="config.tagSource"
                        style="width: 260px"
                        :disabled="!config.enabled || !config.showTags"
                    >
                        <el-option label="网站标签" value="website" />
                        <el-option label="分类标签" value="category" />
                        <el-option label="人工标签" value="manual" />
                    </el-select>
                    <span class="form-tip">控制侧边栏标签区块展示来源。</span>
                </el-form-item>

                <el-form-item
                    v-if="config.tagSource === 'manual'"
                    label="人工标签"
                >
                    <el-input
                        v-model="config.manualTags"
                        type="textarea"
                        :rows="3"
                        :disabled="!config.enabled || !config.showTags"
                        placeholder="多个标签用英文逗号或换行分隔，例如：UI设计, 交互动效, 设计系统"
                    />
                    <span class="form-tip">仅在「人工标签」模式下生效，用于运营自定义引导搜索词。</span>
                </el-form-item>

                <el-form-item label="分类区块">
                    <el-switch v-model="config.showCategory" :disabled="!config.enabled" />
                    <span class="form-tip">在侧边栏显示当前网站所属分类与父分类。</span>
                </el-form-item>

                <el-form-item label="分类区块标题">
                    <el-input
                        v-model="config.categoryTitle"
                        :disabled="!config.enabled || !config.showCategory"
                        placeholder="例如：所在分类 / 相关推荐目录"
                    />
                    <span class="form-tip">侧边栏分类区块标题文案。</span>
                </el-form-item>

                <el-form-item label="侧边栏广告位">
                    <el-switch v-model="config.sidebarAdEnabled" :disabled="!config.enabled" />
                    <span class="form-tip">开启后会读取商业位体系中的侧边栏广告位投放。</span>
                </el-form-item>

                <el-form-item label="侧边栏广告位键">
                    <el-input
                        v-model="config.sidebarAdSlotKey"
                        :disabled="!config.enabled || !config.sidebarAdEnabled"
                        placeholder="例如：website_detail_sidebar"
                    />
                    <span class="form-tip">与「商业位体系」中的 slotKey 对应。</span>
                </el-form-item>

                <!-- 详情页运营位 -->
                <el-divider content-position="left">详情页运营位（商业位插槽）</el-divider>
                <p class="section-desc">
                    在详情页顶部/正文中/底部插入可售卖运营位，前端会按 slotKey 读取商业位体系投放。
                </p>

                <el-form-item label="顶部运营位">
                    <el-switch v-model="config.detailTopAdEnabled" />
                    <span class="form-tip">显示在详情页 Hero 区域下方。</span>
                </el-form-item>

                <el-form-item label="顶部 slotKey">
                    <el-input
                        v-model="config.detailTopAdSlotKey"
                        :disabled="!config.detailTopAdEnabled"
                        placeholder="例如：detail_top"
                    />
                </el-form-item>

                <el-form-item label="正文中运营位">
                    <el-switch v-model="config.detailInlineAdEnabled" />
                    <span class="form-tip">显示在详情正文内容后、截图区块前。</span>
                </el-form-item>

                <el-form-item label="正文中 slotKey">
                    <el-input
                        v-model="config.detailInlineAdSlotKey"
                        :disabled="!config.detailInlineAdEnabled"
                        placeholder="例如：detail_inline"
                    />
                </el-form-item>

                <el-form-item label="底部运营位">
                    <el-switch v-model="config.detailBottomAdEnabled" />
                    <span class="form-tip">显示在版权/免责声明区块前后（前端底部区域）。</span>
                </el-form-item>

                <el-form-item label="底部 slotKey">
                    <el-input
                        v-model="config.detailBottomAdSlotKey"
                        :disabled="!config.detailBottomAdEnabled"
                        placeholder="例如：detail_bottom"
                    />
                </el-form-item>

                <!-- SEO 模块 -->
                <div id="detail-page-config-section-seo">
                    <el-divider content-position="left">详情页 SEO 模块（FAQ / 长尾词 / Schema）</el-divider>
                </div>
                <p class="section-desc">
                    用于增强详情页搜索流量能力。FAQ 与长尾词可用于生成页面内容，Schema 用于结构化数据。
                </p>

                <el-form-item label="图标取色毛玻璃">
                    <el-switch v-model="config.heroAccentGlassEnabled" />
                    <span class="form-tip">尝试根据网址图标提取主色，生成详情头部毛玻璃氛围背景。</span>
                </el-form-item>

                <el-form-item label="FAQ 模块">
                    <el-switch v-model="config.seoFaqEnabled" />
                    <span class="form-tip">开启后在详情页正文后显示 FAQ 内容块，并生成 FAQ Schema。</span>
                </el-form-item>

                <el-form-item label="FAQ 标题">
                    <el-input
                        v-model="config.seoFaqTitle"
                        :disabled="!config.seoFaqEnabled"
                        placeholder="例如：常见问题 / 常见疑问"
                    />
                </el-form-item>

                <el-form-item label="FAQ 内容">
                    <el-input
                        v-model="config.seoFaqLines"
                        type="textarea"
                        :rows="6"
                        :disabled="!config.seoFaqEnabled"
                        placeholder="每行一条，格式：问题|答案&#10;例如：这个网站免费吗？|基础功能可免费使用，部分能力需注册。"
                    />
                    <span class="form-tip">按“问题|答案”填写，每行一条。前端会自动解析并渲染 FAQ 模块。</span>
                </el-form-item>

                <el-form-item label="长尾词模块">
                    <el-switch v-model="config.seoLongTailEnabled" />
                    <span class="form-tip">开启后展示相关搜索词块，增强页面收录与内链。</span>
                </el-form-item>

                <el-form-item label="长尾词标题">
                    <el-input
                        v-model="config.seoLongTailTitle"
                        :disabled="!config.seoLongTailEnabled"
                        placeholder="例如：相关搜索 / 常见对比搜索"
                    />
                </el-form-item>

                <el-form-item label="长尾词列表">
                    <el-input
                        v-model="config.seoLongTailKeywords"
                        type="textarea"
                        :rows="4"
                        :disabled="!config.seoLongTailEnabled"
                        placeholder="多个关键词用英文逗号或换行分隔，例如：Figma替代品, AI设计工具推荐, 设计灵感网站"
                    />
                </el-form-item>

                <el-form-item label="Schema 结构化数据">
                    <el-switch v-model="config.seoSchemaEnabled" />
                    <span class="form-tip">开启后前端注入 JSON-LD（WebPage/Breadcrumb/FAQPage）。</span>
                </el-form-item>

                <!-- 区块显示控制 -->
                <div id="detail-page-config-section-blocks">
                    <el-divider content-position="left">区块显示控制</el-divider>
                </div>
                <p class="section-desc">
                    控制详情页中各个功能区块是否显示。关闭后对应区块将在前端隐藏，不影响已有数据。
                </p>

                <el-form-item label="产品截图">
                    <el-switch v-model="config.screenshotsEnabled" />
                    <span class="form-tip"
                        >开启后，详情页将展示该网站的产品截图（需在网站编辑中上传截图）</span
                    >
                </el-form-item>

                <el-form-item label="缩略图展示样式">
                    <el-select
                        v-model="config.thumbnailLayoutStyle"
                        style="width: 260px"
                        :disabled="!config.screenshotsEnabled"
                    >
                        <el-option label="设备框（Laptop）" value="device" />
                        <el-option label="分屏展示（主图+侧图）" value="split" />
                        <el-option label="轮播缩略图（主图+缩略条）" value="carousel" />
                    </el-select>
                    <span class="form-tip">
                        控制详情页顶部缩略图区的展示样式。建议首发版默认使用「设备框」。
                    </span>
                </el-form-item>

                <el-form-item
                    v-if="config.thumbnailLayoutStyle === 'split'"
                    label="分屏侧图数量"
                >
                    <el-input-number
                        v-model="config.thumbnailSplitSideCount"
                        :min="1"
                        :max="4"
                        :disabled="!config.screenshotsEnabled"
                    />
                    <span class="form-tip">
                        分屏展示模式下，右侧小图显示数量。建议 2-3 张，过多会影响信息密度。
                    </span>
                </el-form-item>

                <el-form-item
                    v-if="config.thumbnailLayoutStyle === 'carousel'"
                    label="轮播缩略条数量"
                >
                    <el-input-number
                        v-model="config.thumbnailCarouselThumbCount"
                        :min="2"
                        :max="12"
                        :disabled="!config.screenshotsEnabled"
                    />
                    <span class="form-tip">
                        轮播缩略条最多展示多少张截图（不含主图），超出后需横向滚动查看。
                    </span>
                </el-form-item>

                <el-divider content-position="left">自动预览截图（Playwright）</el-divider>
                <p class="section-desc">
                    当网站未上传缩略图与截图时，后端可自动生成预览图并缓存；失败时可选择回退到 mShots。
                </p>

                <el-form-item label="启用自动截图">
                    <el-switch v-model="config.previewSnapshotEnabled" />
                    <span class="form-tip">关闭后不再尝试本地 Playwright 截图（仍可使用上传图片）。</span>
                </el-form-item>

                <el-form-item label="截图超时(ms)">
                    <el-input-number
                        v-model="config.previewSnapshotTimeoutMs"
                        :min="3000"
                        :max="30000"
                        :step="1000"
                        :disabled="!config.previewSnapshotEnabled"
                    />
                    <span class="form-tip">单次截图等待时间，建议 8000-15000ms。</span>
                </el-form-item>

                <el-form-item label="截图缓存TTL(秒)">
                    <el-input-number
                        v-model="config.previewSnapshotCacheTtlSeconds"
                        :min="60"
                        :max="604800"
                        :step="60"
                        :disabled="!config.previewSnapshotEnabled"
                    />
                    <span class="form-tip">超过缓存时间会重新截图；网站编辑页支持手动刷新缓存。</span>
                </el-form-item>

                <el-form-item label="失败回退 mShots">
                    <el-switch v-model="config.previewSnapshotAllowFallbackMshots" />
                    <span class="form-tip">开启后本地截图失败会回退到 mShots 免费截图兜底。</span>
                </el-form-item>

                <el-form-item label="评分功能">
                    <el-switch v-model="config.ratingsEnabled" />
                    <span class="form-tip"
                        >开启后，用户可以对网站进行 1-5 星评分，评分结果将展示在详情页</span
                    >
                </el-form-item>

                <el-form-item label="评论功能">
                    <el-switch v-model="config.commentsEnabled" />
                    <span class="form-tip"
                        >开启后，用户可以在详情页发表评论。评论需在「评论管理」中审核</span
                    >
                </el-form-item>

                <el-form-item label="分享按钮">
                    <el-switch v-model="config.sharingEnabled" />
                    <span class="form-tip"
                        >开启后，详情页底部将显示社交分享按钮（微信、微博、QQ 等）</span
                    >
                </el-form-item>

                <el-form-item label="收藏按钮">
                    <el-switch v-model="config.favoritesEnabled" />
                    <span class="form-tip">开启后，用户可以收藏网站到个人收藏夹（需用户登录）</span>
                </el-form-item>

                <el-form-item label="相关推荐">
                    <el-switch v-model="config.relatedEnabled" />
                    <span class="form-tip">开启后，详情页底部将自动展示同分类下的相关网站推荐</span>
                </el-form-item>

                <el-form-item label="标签显示">
                    <el-switch v-model="config.tagsEnabled" />
                    <span class="form-tip"
                        >开启后，详情页将展示该网站关联的标签，方便用户了解网站特征</span
                    >
                </el-form-item>

                <!-- 直达按钮 -->
                <div id="detail-page-config-section-footer">
                    <el-divider content-position="left">直达按钮</el-divider>
                </div>
                <p class="section-desc">
                    控制详情页头部区域的「直达网站」箭头按钮。点击后将在新窗口打开目标网站。
                </p>

                <el-form-item label="显示直达箭头">
                    <el-switch v-model="config.visitArrowEnabled" />
                    <span class="form-tip"
                        >开启后，网站名称右侧将显示一个箭头图标，点击可直接跳转到目标网站</span
                    >
                </el-form-item>

                <el-form-item label="箭头提示文字">
                    <el-input
                        v-model="config.visitArrowText"
                        placeholder="鼠标悬停时显示的提示文字"
                        :disabled="!config.visitArrowEnabled"
                    />
                    <span class="form-tip"
                        >鼠标悬停在箭头上时显示的提示文字，默认为「直达网站」</span
                    >
                </el-form-item>

                <!-- 版权信息 -->
                <el-divider content-position="left">版权信息</el-divider>
                <p class="section-desc">在详情页底部展示版权声明，可用于标注内容来源或版权归属。</p>

                <el-form-item label="启用版权信息">
                    <el-switch v-model="config.copyrightEnabled" />
                    <span class="form-tip">开启后，详情页底部将显示版权声明文字</span>
                </el-form-item>

                <el-form-item label="版权文字">
                    <el-input
                        v-model="config.copyrightText"
                        placeholder="例如：版权归原作者所有"
                        :disabled="!config.copyrightEnabled"
                    />
                    <span class="form-tip">显示在详情页底部的版权声明内容</span>
                </el-form-item>

                <el-form-item label="版权链接">
                    <el-input
                        v-model="config.copyrightLink"
                        placeholder="例如：https://example.com（可选，留空则不可点击）"
                        :disabled="!config.copyrightEnabled"
                    />
                    <span class="form-tip"
                        >点击版权文字后跳转的链接地址，留空则版权文字不可点击</span
                    >
                </el-form-item>

                <!-- 免责声明 -->
                <el-divider content-position="left">免责声明</el-divider>
                <p class="section-desc">在详情页底部展示免责声明，建议开启以规避法律风险。</p>

                <el-form-item label="启用免责声明">
                    <el-switch v-model="config.disclaimerEnabled" />
                    <span class="form-tip">开启后，详情页底部将显示免责声明文字</span>
                </el-form-item>

                <el-form-item label="免责声明文字">
                    <el-input
                        v-model="config.disclaimerText"
                        type="textarea"
                        :rows="3"
                        placeholder="例如：本站仅收录和推荐，不对第三方网站内容负责。"
                        :disabled="!config.disclaimerEnabled"
                    />
                    <span class="form-tip">免责声明的具体内容，建议说明本站与收录网站的关系</span>
                </el-form-item>

                <!-- 举报功能 -->
                <el-divider content-position="left">举报功能</el-divider>
                <p class="section-desc">允许用户举报问题网站，举报信息将发送到指定邮箱。</p>

                <el-form-item label="启用举报功能">
                    <el-switch v-model="config.reportEnabled" />
                    <span class="form-tip">开启后，详情页底部将显示举报按钮</span>
                </el-form-item>

                <el-form-item label="举报提示文字">
                    <el-input
                        v-model="config.reportText"
                        placeholder="例如：如发现违规内容，请发送邮件举报"
                        :disabled="!config.reportEnabled"
                    />
                    <span class="form-tip">举报按钮上显示的文字</span>
                </el-form-item>

                <el-form-item label="举报邮箱">
                    <el-input
                        v-model="config.reportEmail"
                        placeholder="例如：report@example.com"
                        :disabled="!config.reportEnabled"
                    />
                    <span class="form-tip"
                        >接收举报邮件的邮箱地址，用户点击举报后将自动打开邮件客户端</span
                    >
                </el-form-item>

                <!-- 访问按钮 -->
                <el-divider content-position="left">访问按钮</el-divider>
                <p class="section-desc">
                    详情页正文下方的大号访问按钮，点击后跳转到目标网站。直达箭头和访问按钮均受此配置控制。
                </p>

                <el-form-item label="新窗口打开">
                    <el-switch v-model="config.visitBtnNewWindow" />
                    <span class="form-tip"
                        >开启后，点击「访问网站」按钮和直达箭头时将在浏览器新标签页中打开目标网站；关闭则在当前页面跳转</span
                    >
                </el-form-item>

                <el-form-item label="按钮文字">
                    <el-input
                        v-model="config.visitBtnText"
                        placeholder="例如：访问网站、立即体验、前往官网"
                    />
                    <span class="form-tip">访问按钮上显示的文字，默认为「访问网站」</span>
                </el-form-item>

                <!-- 保存按钮 -->
                <el-form-item>
                    <el-button type="primary" :loading="saving" @click="handleSave"
                        >保存配置</el-button
                    >
                </el-form-item>
            </el-form>
        </el-card>
    </div>
</template>

<script setup lang="ts">
/**
 * @file views/uied/setting/detailPage.vue
 * @description 网站详情页配置 - 控制详情页各区块的显示和内容
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.1.0
 */
import { ref, reactive, onMounted, nextTick } from 'vue'
import { uiedSettingGet, uiedSettingSave } from '@/api/uied'
import feedback from '@/utils/feedback'

// 默认配置
const defaultConfig = {
    // 布局与样式（售卖版）
    pageStylePreset: 'showcase',
    layoutWidthMode: 'contained',
    spacingDensity: 'compact',
    labelVisualStyle: 'soft',
    dataPanelEnabled: true,
    dataPanelTitle: '站点数据',
    heroAccentGlassEnabled: true,
    // 详情侧边栏（兼容旧接口字段）
    enabled: true,
    showRelated: true,
    relatedTitle: '你可能还喜欢',
    relatedCount: 6,
    relatedMode: 'same_category',
    manualWebsiteIds: '',
    showTags: true,
    tagsTitle: '深入探索',
    tagSource: 'website',
    manualTags: '',
    showCategory: true,
    categoryTitle: '相关分类',
    sidebarAdEnabled: false,
    sidebarAdSlotKey: 'website_detail_sidebar',
    detailTopAdEnabled: false,
    detailTopAdSlotKey: 'detail_top',
    detailInlineAdEnabled: false,
    detailInlineAdSlotKey: 'detail_inline',
    detailBottomAdEnabled: false,
    detailBottomAdSlotKey: 'detail_bottom',
    seoFaqEnabled: false,
    seoFaqTitle: '常见问题',
    seoFaqLines: '',
    seoLongTailEnabled: false,
    seoLongTailTitle: '相关搜索',
    seoLongTailKeywords: '',
    seoSchemaEnabled: true,
    // 区块显示控制
    screenshotsEnabled: true,
    thumbnailLayoutStyle: 'device',
    thumbnailSplitSideCount: 2,
    thumbnailCarouselThumbCount: 6,
    previewSnapshotEnabled: true,
    previewSnapshotTimeoutMs: 12000,
    previewSnapshotCacheTtlSeconds: 21600,
    previewSnapshotAllowFallbackMshots: true,
    ratingsEnabled: true,
    commentsEnabled: true,
    sharingEnabled: true,
    favoritesEnabled: true,
    relatedEnabled: true,
    tagsEnabled: true,
    // 直达按钮
    visitArrowEnabled: true,
    visitArrowText: '直达网站',
    // 版权信息
    copyrightEnabled: true,
    copyrightText: '版权归原作者所有',
    copyrightLink: '',
    // 免责声明
    disclaimerEnabled: true,
    disclaimerText: '本站仅收录和推荐，不对第三方网站内容负责。',
    // 举报功能
    reportEnabled: true,
    reportText: '如发现违规内容，请发送邮件举报',
    reportEmail: '',
    // 访问按钮
    visitBtnText: '访问网站',
    visitBtnNewWindow: true
}

const saving = ref(false)
const config = reactive({ ...defaultConfig })
const activeSectionTab = ref('layout')

const detailPageSectionAnchorMap: Record<string, string> = {
    layout: 'detail-page-config-section-layout',
    sidebarOps: 'detail-page-config-section-sidebar-ops',
    seo: 'detail-page-config-section-seo',
    blocks: 'detail-page-config-section-blocks',
    footer: 'detail-page-config-section-footer'
}

/**
 * 点击顶部标签后滚动到对应配置区块，减少长页面滚动成本
 */
const handleSectionTabClick = async (pane: any) => {
    const tabName = String(pane?.props?.name || pane?.paneName || activeSectionTab.value || '')
    const anchorId = detailPageSectionAnchorMap[tabName]
    if (!anchorId) return
    await nextTick()
    const target = document.getElementById(anchorId)
    if (!target) return
    target.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

// 加载配置
const loadConfig = async () => {
    try {
        const res = await uiedSettingGet({ key: 'detailPageConfig' })
        if (res) {
            Object.assign(config, res)
        }
    } catch (e) {
        console.error('加载详情页配置失败:', e)
    }
}

// 保存配置
const handleSave = async () => {
    saving.value = true
    try {
        await uiedSettingSave({ detailPageConfig: config })
        feedback.msgSuccess('保存成功')
    } catch (e) {
        console.error('保存详情页配置失败:', e)
        feedback.msgError('保存失败')
    } finally {
        saving.value = false
    }
}

onMounted(() => {
    loadConfig()
})
</script>

<style scoped>
.form-tip {
    color: #909399;
    font-size: 12px;
    margin-left: 12px;
    line-height: 1.5;
}
.section-desc {
    color: #909399;
    font-size: 13px;
    margin: -8px 0 16px 0;
    padding-left: 2px;
    line-height: 1.6;
}

/* 设置页面头部样式 */
.setting-header {
    margin-bottom: 24px;
    padding-bottom: 16px;
    border-bottom: 1px solid #e4e7ed;
}
.setting-title {
    font-size: 18px;
    font-weight: 600;
    color: #303133;
    margin: 0 0 8px 0;
}
.setting-desc {
    font-size: 14px;
    color: #606266;
    margin: 0;
    line-height: 1.6;
}

.setting-nav-tabs {
    position: sticky;
    top: 0;
    z-index: 5;
    background: #fff;
    margin-bottom: 16px;
    padding-top: 4px;
}

.setting-nav-tabs :deep(.el-tabs__header) {
    margin-bottom: 10px;
}

.setting-nav-tabs :deep(.el-tabs__nav-wrap)::after {
    background-color: #ebeef5;
}

/* 优化：问号提示图标样式 */
.label-tip-icon {
    margin-left: 6px;
    cursor: help;
    color: #c0c4cc;
    font-size: 15px;
    vertical-align: -2px;
    transition: all 0.2s ease;
    opacity: 0.7;
}
.label-tip-icon:hover {
    color: #409eff;
    opacity: 1;
    transform: scale(1.1);
}
</style>
