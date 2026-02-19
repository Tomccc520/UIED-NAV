<!--
 * @file views/uied/setting/index.vue
 * @description UIED 站点设置管理 - WordPress主题级别的丰富配置
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 2.0.0
-->
<template>
    <div class="site-setting">
        <el-card class="!border-none" shadow="never">
            <div class="setting-toolbar">
                <div class="toolbar-left">
                    <el-tag :type="hasPendingChanges ? 'warning' : 'success'" effect="plain">
                        {{ hasPendingChanges ? '有未保存改动' : '已与服务器保持一致' }}
                    </el-tag>
                    <span class="toolbar-time">最近保存：{{ lastSavedAtText }}</span>
                </div>
                <div class="toolbar-right">
                    <el-button
                        size="small"
                        :disabled="!hasCurrentTabChanges"
                        @click="handleResetCurrentTab"
                        >重置当前标签</el-button
                    >
                    <el-button size="small" :loading="reloadLoading" @click="handleReloadAll"
                        >重新加载</el-button
                    >
                    <el-button
                        type="primary"
                        size="small"
                        :loading="saveAllLoading"
                        @click="handleSaveAll"
                        >保存全部配置</el-button
                    >
                </div>
            </div>
            <el-tabs v-model="activeTab" tab-position="left" class="setting-tabs">
                <!-- ==================== 站点信息 ==================== -->
                <el-tab-pane label="站点信息" name="siteInfo">
                    <div class="setting-header">
                        <h2 class="setting-title">站点信息</h2>
                        <p class="setting-desc">
                            配置网站的基本信息，包括名称、SEO、备案等。修改后保存即可生效。
                        </p>
                    </div>
                    <el-form :model="siteInfoData" label-width="120px" style="max-width: 600px">
                        <el-form-item>
                            <template #label>
                                <span>站点名称</span>
                                <el-tooltip
                                    content="显示在浏览器标签页和页面顶部的网站名称"
                                    placement="top"
                                >
                                    <el-icon class="label-tip-icon"><QuestionFilled /></el-icon>
                                </el-tooltip>
                            </template>
                            <el-input
                                v-model="siteInfoData.siteName"
                                placeholder="请输入站点名称"
                            />
                        </el-form-item>
                        <el-form-item>
                            <template #label
                                ><span>站点标题</span
                                ><el-tooltip
                                    content="用于SEO的页面标题，建议30字以内"
                                    placement="top"
                                    ><el-icon class="label-tip-icon"
                                        ><QuestionFilled /></el-icon></el-tooltip
                            ></template>
                            <el-input
                                v-model="siteInfoData.siteTitle"
                                placeholder="请输入站点标题"
                            />
                        </el-form-item>
                        <el-form-item>
                            <template #label
                                ><span>站点描述</span
                                ><el-tooltip
                                    content="用于SEO的页面描述，建议120字以内"
                                    placement="top"
                                    ><el-icon class="label-tip-icon"
                                        ><QuestionFilled /></el-icon></el-tooltip
                            ></template>
                            <el-input
                                v-model="siteInfoData.siteDescription"
                                type="textarea"
                                :rows="3"
                                placeholder="请输入站点描述"
                            />
                        </el-form-item>
                        <el-form-item>
                            <template #label
                                ><span>站点关键词</span
                                ><el-tooltip content="多个关键词用英文逗号分隔" placement="top"
                                    ><el-icon class="label-tip-icon"
                                        ><QuestionFilled /></el-icon></el-tooltip
                            ></template>
                            <el-input
                                v-model="siteInfoData.siteKeywords"
                                placeholder="多个关键词用逗号分隔"
                            />
                        </el-form-item>
                        <el-form-item>
                            <template #label
                                ><span>Logo</span
                                ><el-tooltip
                                    content="网站Logo图片地址，支持PNG/SVG格式，推荐尺寸200x50px"
                                    placement="top"
                                    ><el-icon class="label-tip-icon"
                                        ><QuestionFilled /></el-icon></el-tooltip
                            ></template>
                            <div style="display: flex; gap: 12px; align-items: flex-start">
                                <el-input
                                    v-model="siteInfoData.logo"
                                    placeholder="Logo URL"
                                    style="flex: 1"
                                />
                                <material-picker v-model="siteInfoData.logo" :limit="1">
                                    <el-button>选择图片</el-button>
                                </material-picker>
                            </div>
                            <div v-if="siteInfoData.logo" style="margin-top: 8px">
                                <img
                                    :src="siteInfoData.logo"
                                    alt="Logo预览"
                                    style="
                                        max-width: 200px;
                                        max-height: 50px;
                                        border: 1px solid #dcdfe6;
                                        border-radius: 4px;
                                        padding: 4px;
                                    "
                                />
                            </div>
                        </el-form-item>
                        <el-form-item>
                            <template #label
                                ><span>Favicon</span
                                ><el-tooltip
                                    content="浏览器标签页小图标，建议32x32px，支持ICO/PNG格式"
                                    placement="top"
                                    ><el-icon class="label-tip-icon"
                                        ><QuestionFilled /></el-icon></el-tooltip
                            ></template>
                            <div style="display: flex; gap: 12px; align-items: flex-start">
                                <el-input
                                    v-model="siteInfoData.favicon"
                                    placeholder="Favicon URL"
                                    style="flex: 1"
                                />
                                <material-picker v-model="siteInfoData.favicon" :limit="1">
                                    <el-button>选择图片</el-button>
                                </material-picker>
                            </div>
                            <div v-if="siteInfoData.favicon" style="margin-top: 8px">
                                <img
                                    :src="siteInfoData.favicon"
                                    alt="Favicon预览"
                                    style="
                                        width: 32px;
                                        height: 32px;
                                        border: 1px solid #dcdfe6;
                                        border-radius: 4px;
                                        padding: 2px;
                                    "
                                />
                            </div>
                        </el-form-item>
                        <el-form-item>
                            <template #label
                                ><span>ICP备案号</span
                                ><el-tooltip
                                    content="显示在页面底部，如：京ICP备XXXXXXXX号"
                                    placement="top"
                                    ><el-icon class="label-tip-icon"
                                        ><QuestionFilled /></el-icon></el-tooltip
                            ></template>
                            <el-input v-model="siteInfoData.icp" placeholder="请输入ICP备案号" />
                        </el-form-item>
                        <el-form-item>
                            <template #label
                                ><span>版权信息</span
                                ><el-tooltip content="显示在页面底部的版权声明文字" placement="top"
                                    ><el-icon class="label-tip-icon"
                                        ><QuestionFilled /></el-icon></el-tooltip
                            ></template>
                            <el-input
                                v-model="siteInfoData.copyright"
                                placeholder="请输入版权信息"
                            />
                        </el-form-item>
                        <el-form-item>
                            <template #label
                                ><span>联系邮箱</span
                                ><el-tooltip
                                    content="用于接收用户反馈和举报的邮箱地址"
                                    placement="top"
                                    ><el-icon class="label-tip-icon"
                                        ><QuestionFilled /></el-icon></el-tooltip
                            ></template>
                            <el-input
                                v-model="siteInfoData.contactEmail"
                                placeholder="请输入联系邮箱"
                            />
                        </el-form-item>
                        <el-form-item>
                            <template #label
                                ><span>统计代码</span
                                ><el-tooltip
                                    content="第三方统计代码（如百度统计），将插入到页面底部"
                                    placement="top"
                                    ><el-icon class="label-tip-icon"
                                        ><QuestionFilled /></el-icon></el-tooltip
                            ></template>
                            <el-input
                                v-model="siteInfoData.analyticsCode"
                                type="textarea"
                                :rows="4"
                                placeholder="请输入统计代码"
                            />
                        </el-form-item>
                        <el-form-item>
                            <el-button
                                type="primary"
                                :loading="siteInfoLoading"
                                @click="handleSaveSiteInfo"
                                >保存</el-button
                            >
                        </el-form-item>
                    </el-form>
                </el-tab-pane>

                <!-- ==================== 外观配置 ==================== -->
                <el-tab-pane label="外观配置" name="appearance">
                    <div class="setting-header">
                        <h2 class="setting-title">外观配置</h2>
                        <p class="setting-desc">
                            自定义网站的视觉风格，包括主题色、字体、圆角、间距等。类似WordPress主题自定义器。
                        </p>
                    </div>
                    <el-form :model="appearanceData" label-width="140px" style="max-width: 650px">
                        <el-divider content-position="left">主题色彩</el-divider>
                        <p class="section-desc">
                            设置网站的主色调和辅助色彩，影响按钮、链接、高亮等元素的颜色。
                        </p>
                        <el-form-item>
                            <template #label
                                ><span>主题色</span
                                ><el-tooltip
                                    content="网站的主色调，用于按钮、链接、高亮等元素"
                                    placement="top"
                                    ><el-icon class="label-tip-icon"
                                        ><QuestionFilled /></el-icon></el-tooltip
                            ></template>
                            <div style="display: flex; align-items: center; gap: 12px">
                                <el-color-picker v-model="appearanceData.primaryColor" />
                                <el-input
                                    v-model="appearanceData.primaryColor"
                                    style="width: 140px"
                                    placeholder="#0066ff"
                                />
                                <el-button
                                    text
                                    type="primary"
                                    @click="appearanceData.primaryColor = '#0066ff'"
                                    >重置</el-button
                                >
                            </div>
                        </el-form-item>
                        <el-form-item>
                            <template #label
                                ><span>背景色</span
                                ><el-tooltip content="页面整体背景色，建议使用浅色" placement="top"
                                    ><el-icon class="label-tip-icon"
                                        ><QuestionFilled /></el-icon></el-tooltip
                            ></template>
                            <div style="display: flex; align-items: center; gap: 12px">
                                <el-color-picker v-model="appearanceData.backgroundColor" />
                                <el-input
                                    v-model="appearanceData.backgroundColor"
                                    style="width: 140px"
                                    placeholder="#f6f8fb"
                                />
                                <el-button
                                    text
                                    type="primary"
                                    @click="appearanceData.backgroundColor = '#f6f8fb'"
                                    >重置</el-button
                                >
                            </div>
                        </el-form-item>
                        <el-form-item>
                            <template #label
                                ><span>卡片背景色</span
                                ><el-tooltip content="网站卡片和内容区块的背景色" placement="top"
                                    ><el-icon class="label-tip-icon"
                                        ><QuestionFilled /></el-icon></el-tooltip
                            ></template>
                            <div style="display: flex; align-items: center; gap: 12px">
                                <el-color-picker v-model="appearanceData.cardBackgroundColor" />
                                <el-input
                                    v-model="appearanceData.cardBackgroundColor"
                                    style="width: 140px"
                                    placeholder="#ffffff"
                                />
                            </div>
                        </el-form-item>
                        <el-form-item>
                            <template #label
                                ><span>文字主色</span
                                ><el-tooltip content="正文和标题的主要文字颜色" placement="top"
                                    ><el-icon class="label-tip-icon"
                                        ><QuestionFilled /></el-icon></el-tooltip
                            ></template>
                            <div style="display: flex; align-items: center; gap: 12px">
                                <el-color-picker v-model="appearanceData.textPrimaryColor" />
                                <el-input
                                    v-model="appearanceData.textPrimaryColor"
                                    style="width: 140px"
                                    placeholder="#333333"
                                />
                            </div>
                        </el-form-item>
                        <el-divider content-position="left">字体设置</el-divider>
                        <p class="section-desc">自定义网站使用的字体。留空则使用系统默认字体。</p>
                        <el-form-item>
                            <template #label
                                ><span>主字体</span
                                ><el-tooltip content="网站正文使用的字体名称" placement="top"
                                    ><el-icon class="label-tip-icon"
                                        ><QuestionFilled /></el-icon></el-tooltip
                            ></template>
                            <el-input
                                v-model="appearanceData.fontFamily"
                                placeholder="Lexend, -apple-system, sans-serif"
                            />
                        </el-form-item>
                        <el-form-item>
                            <template #label
                                ><span>基础字号</span
                                ><el-tooltip content="网站正文的基础字号（px）" placement="top"
                                    ><el-icon class="label-tip-icon"
                                        ><QuestionFilled /></el-icon></el-tooltip
                            ></template>
                            <el-input-number
                                v-model="appearanceData.baseFontSize"
                                :min="12"
                                :max="20"
                            />
                            <span class="form-tip">px</span>
                        </el-form-item>
                        <el-divider content-position="left">圆角和布局</el-divider>
                        <p class="section-desc">调整卡片圆角大小和内容区域宽度。</p>
                        <el-form-item>
                            <template #label
                                ><span>卡片圆角</span
                                ><el-tooltip
                                    content="网站卡片的圆角大小（px），0为直角"
                                    placement="top"
                                    ><el-icon class="label-tip-icon"
                                        ><QuestionFilled /></el-icon></el-tooltip
                            ></template>
                            <el-slider
                                v-model="appearanceData.borderRadius"
                                :min="0"
                                :max="24"
                                :step="2"
                                show-stops
                                style="width: 300px"
                            />
                            <span class="form-tip">{{ appearanceData.borderRadius }}px</span>
                        </el-form-item>
                        <el-form-item>
                            <template #label
                                ><span>内容最大宽度</span
                                ><el-tooltip content="页面内容区域的最大宽度" placement="top"
                                    ><el-icon class="label-tip-icon"
                                        ><QuestionFilled /></el-icon></el-tooltip
                            ></template>
                            <el-select
                                v-model="appearanceData.contentMaxWidth"
                                style="width: 200px"
                            >
                                <el-option label="窄版 (1000px)" :value="1000" />
                                <el-option label="标准 (1200px)" :value="1200" />
                                <el-option label="宽版 (1400px)" :value="1400" />
                                <el-option label="超宽 (1600px)" :value="1600" />
                                <el-option label="全屏" :value="0" />
                            </el-select>
                        </el-form-item>
                        <el-divider content-position="left">自定义CSS</el-divider>
                        <p class="section-desc">高级用户可以在此添加自定义CSS代码。</p>
                        <el-form-item>
                            <template #label
                                ><span>自定义CSS</span
                                ><el-tooltip
                                    content="输入自定义CSS代码，将注入到前端页面"
                                    placement="top"
                                    ><el-icon class="label-tip-icon"
                                        ><QuestionFilled /></el-icon></el-tooltip
                            ></template>
                            <el-input
                                v-model="appearanceData.customCss"
                                type="textarea"
                                :rows="6"
                                placeholder="/* 在此输入自定义CSS */"
                            />
                        </el-form-item>
                        <el-form-item>
                            <el-button
                                type="primary"
                                :loading="appearanceLoading"
                                @click="handleSaveAppearance"
                                >保存</el-button
                            >
                        </el-form-item>
                    </el-form>
                </el-tab-pane>

                <!-- ==================== 首页配置 ==================== -->
                <el-tab-pane label="首页配置" name="homepage">
                    <div class="setting-header">
                        <h2 class="setting-title">首页配置</h2>
                        <p class="setting-desc">
                            配置首页各区块的显示、顺序和内容。可以自由开关和排列首页的各个模块。
                        </p>
                    </div>
                    <el-form :model="homepageData" label-width="140px" style="max-width: 700px">
                        <el-divider content-position="left">横幅区域 (Hero Banner)</el-divider>
                        <p class="section-desc">
                            首页顶部的大横幅区域，包含标题、搜索框和热门标签。
                        </p>
                        <el-form-item>
                            <template #label
                                ><span>显示横幅</span
                                ><el-tooltip
                                    content="关闭后首页将不显示顶部横幅区域"
                                    placement="top"
                                    ><el-icon class="label-tip-icon"
                                        ><QuestionFilled /></el-icon></el-tooltip
                            ></template>
                            <el-switch v-model="homepageData.heroBannerEnabled" />
                        </el-form-item>
                        <el-form-item>
                            <template #label
                                ><span>横幅背景类型</span
                                ><el-tooltip content="选择横幅区域的背景样式" placement="top"
                                    ><el-icon class="label-tip-icon"
                                        ><QuestionFilled /></el-icon></el-tooltip
                            ></template>
                            <el-select
                                v-model="homepageData.heroBgType"
                                style="width: 200px"
                                :disabled="!homepageData.heroBannerEnabled"
                            >
                                <el-option label="默认背景图" value="default" />
                                <el-option label="纯色背景" value="color" />
                                <el-option label="渐变背景" value="gradient" />
                                <el-option label="自定义图片" value="image" />
                            </el-select>
                        </el-form-item>
                        <el-form-item v-if="homepageData.heroBgType === 'color'">
                            <template #label><span>背景颜色</span></template>
                            <div style="display: flex; align-items: center; gap: 12px">
                                <el-color-picker v-model="homepageData.heroBgValue" />
                                <el-input
                                    v-model="homepageData.heroBgValue"
                                    style="width: 200px"
                                    placeholder="#1a1a2e"
                                />
                            </div>
                        </el-form-item>
                        <el-form-item v-if="homepageData.heroBgType === 'gradient'">
                            <template #label><span>渐变值</span></template>
                            <el-input
                                v-model="homepageData.heroBgValue"
                                placeholder="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                            />
                        </el-form-item>
                        <el-form-item v-if="homepageData.heroBgType === 'image'">
                            <template #label><span>背景图片URL</span></template>
                            <el-input
                                v-model="homepageData.heroBgValue"
                                placeholder="https://example.com/bg.jpg"
                            />
                        </el-form-item>
                        <el-form-item>
                            <template #label
                                ><span>显示模式</span
                                ><el-tooltip
                                    content="搜索模式显示搜索框，图标滚动模式显示网站图标墙"
                                    placement="top"
                                    ><el-icon class="label-tip-icon"
                                        ><QuestionFilled /></el-icon></el-tooltip
                            ></template>
                            <el-select
                                v-model="homepageData.heroDisplayMode"
                                style="width: 200px"
                                :disabled="!homepageData.heroBannerEnabled"
                            >
                                <el-option label="搜索模式" value="search" />
                                <el-option label="图标滚动" value="iconScroll" />
                            </el-select>
                        </el-form-item>
                        <el-form-item>
                            <template #label
                                ><span>显示收录统计</span
                                ><el-tooltip
                                    content="显示「已收录 XXX+ 个优质网站」的统计信息"
                                    placement="top"
                                    ><el-icon class="label-tip-icon"
                                        ><QuestionFilled /></el-icon></el-tooltip
                            ></template>
                            <el-switch
                                v-model="homepageData.heroShowStats"
                                :disabled="!homepageData.heroBannerEnabled"
                            />
                        </el-form-item>
                        <el-form-item>
                            <template #label
                                ><span>显示热门标签</span
                                ><el-tooltip content="在搜索框下方显示热门搜索标签" placement="top"
                                    ><el-icon class="label-tip-icon"
                                        ><QuestionFilled /></el-icon></el-tooltip
                            ></template>
                            <el-switch
                                v-model="homepageData.heroShowHotTags"
                                :disabled="!homepageData.heroBannerEnabled"
                            />
                        </el-form-item>
                        <el-divider content-position="left">推荐卡片区域</el-divider>
                        <p class="section-desc">横幅下方的推荐卡片区域，用于展示重点推荐内容。</p>
                        <el-form-item>
                            <template #label
                                ><span>显示推荐卡片</span
                                ><el-tooltip
                                    content="开启后在横幅下方显示推荐卡片区域"
                                    placement="top"
                                    ><el-icon class="label-tip-icon"
                                        ><QuestionFilled /></el-icon></el-tooltip
                            ></template>
                            <el-switch v-model="homepageData.bannerCardsEnabled" />
                        </el-form-item>
                        <el-divider content-position="left">首页轮播区域</el-divider>
                        <p class="section-desc">
                            控制首页顶部轮播区显示与排序，支持和推荐区自由排布。
                        </p>
                        <el-form-item>
                            <template #label
                                ><span>显示首页轮播</span
                                ><el-tooltip content="关闭后首页不显示轮播模块" placement="top"
                                    ><el-icon class="label-tip-icon"
                                        ><QuestionFilled /></el-icon></el-tooltip
                            ></template>
                            <el-switch v-model="homepageData.homeCarouselEnabled" />
                        </el-form-item>
                        <el-form-item>
                            <template #label
                                ><span>轮播区排序</span
                                ><el-tooltip
                                    content="数字越小越靠前，建议 10、20 递增"
                                    placement="top"
                                    ><el-icon class="label-tip-icon"
                                        ><QuestionFilled /></el-icon></el-tooltip
                            ></template>
                            <el-input-number
                                v-model="homepageData.homeCarouselSort"
                                :min="1"
                                :max="999"
                            />
                        </el-form-item>
                        <el-divider content-position="left">热门推荐区域</el-divider>
                        <p class="section-desc">
                            展示热门推荐的网站列表，数据来源于「热门推荐」管理；可独立设置显示与排序。
                        </p>
                        <el-form-item>
                            <template #label
                                ><span>显示推荐区模块</span
                                ><el-tooltip content="关闭后首页不渲染推荐区模块" placement="top"
                                    ><el-icon class="label-tip-icon"
                                        ><QuestionFilled /></el-icon></el-tooltip
                            ></template>
                            <el-switch v-model="homepageData.homeRecommendationEnabled" />
                        </el-form-item>
                        <el-form-item>
                            <template #label
                                ><span>推荐区排序</span
                                ><el-tooltip
                                    content="数字越小越靠前，建议 10、20 递增"
                                    placement="top"
                                    ><el-icon class="label-tip-icon"
                                        ><QuestionFilled /></el-icon></el-tooltip
                            ></template>
                            <el-input-number
                                v-model="homepageData.homeRecommendationSort"
                                :min="1"
                                :max="999"
                            />
                        </el-form-item>
                        <el-form-item>
                            <template #label
                                ><span>显示推荐内容</span
                                ><el-tooltip
                                    content="关闭后推荐区模块保留，但不展示推荐内容列表"
                                    placement="top"
                                    ><el-icon class="label-tip-icon"
                                        ><QuestionFilled /></el-icon></el-tooltip
                            ></template>
                            <el-switch
                                v-model="homepageData.hotRecommendationsEnabled"
                                :disabled="!homepageData.homeRecommendationEnabled"
                            />
                        </el-form-item>
                        <el-form-item>
                            <template #label
                                ><span>推荐区标题</span
                                ><el-tooltip content="热门推荐区域的标题文字" placement="top"
                                    ><el-icon class="label-tip-icon"
                                        ><QuestionFilled /></el-icon></el-tooltip
                            ></template>
                            <el-input
                                v-model="homepageData.hotRecommendationsTitle"
                                placeholder="热门推荐"
                                :disabled="
                                    !homepageData.homeRecommendationEnabled ||
                                    !homepageData.hotRecommendationsEnabled
                                "
                            />
                        </el-form-item>
                        <el-divider content-position="left">导航切换配置</el-divider>
                        <p class="section-desc">
                            控制顶部 navSwitchItems 的显示开关与排序。可直接改文案与图标关键字。
                        </p>
                        <el-form-item label-width="0">
                            <div class="nav-switch-setting-table">
                                <div class="nav-switch-setting-header">
                                    <span>Slug</span>
                                    <span>名称</span>
                                    <span>图标</span>
                                    <span>显示</span>
                                    <span>排序</span>
                                </div>
                                <div
                                    v-for="(item, idx) in homepageData.navSwitchItems"
                                    :key="`${item.slug}-${idx}`"
                                    class="nav-switch-setting-row"
                                >
                                    <el-input v-model="item.slug" placeholder="slug" />
                                    <el-input v-model="item.name" placeholder="显示名称" />
                                    <el-input
                                        v-model="item.icon"
                                        placeholder="图标关键字（如 AI/Figma）"
                                    />
                                    <el-switch v-model="item.visible" />
                                    <el-input-number v-model="item.sort" :min="1" :max="999" />
                                </div>
                            </div>
                        </el-form-item>
                        <el-divider content-position="left">广告位</el-divider>
                        <p class="section-desc">在首页指定位置插入广告代码。</p>
                        <el-form-item>
                            <template #label
                                ><span>顶部广告</span
                                ><el-tooltip
                                    content="显示在横幅下方、内容区域上方的广告位"
                                    placement="top"
                                    ><el-icon class="label-tip-icon"
                                        ><QuestionFilled /></el-icon></el-tooltip
                            ></template>
                            <el-switch v-model="homepageData.topAdEnabled" />
                        </el-form-item>
                        <el-form-item v-if="homepageData.topAdEnabled">
                            <template #label><span>广告代码</span></template>
                            <el-input
                                v-model="homepageData.topAdCode"
                                type="textarea"
                                :rows="3"
                                placeholder="粘贴广告HTML代码"
                            />
                        </el-form-item>
                        <el-form-item>
                            <el-button
                                type="primary"
                                :loading="homepageLoading"
                                @click="handleSaveHomepage"
                                >保存</el-button
                            >
                        </el-form-item>
                    </el-form>
                </el-tab-pane>

                <!-- ==================== 页面配置 ==================== -->
                <el-tab-pane label="页面配置" name="pageConfig">
                    <div class="setting-header">
                        <h2 class="setting-title">页面配置</h2>
                        <p class="setting-desc">
                            控制前端网站卡片的点击行为、直达箭头、窗口打开方式等全局页面交互配置。
                        </p>
                        <el-alert type="info" :closable="false" show-icon style="margin-top: 12px">
                            <template #title>
                                <span style="font-weight: 500"
                                    >注意：此配置仅对「分类区域」的网站卡片生效，「热门推荐」区域有独立配置</span
                                >
                            </template>
                        </el-alert>
                    </div>
                    <el-form :model="pageConfigData" label-width="140px" style="max-width: 650px">
                        <el-divider content-position="left">分类区域点击行为</el-divider>
                        <el-form-item>
                            <template #label
                                ><span>网站点击行为</span
                                ><el-tooltip placement="top"
                                    ><template #content
                                        >设置用户点击「分类区域」网站卡片时的行为：<br />「跳转详情页」-
                                        进入网站介绍页面<br />「直达网站」- 直接打开外部网站<br /><br />注意：热门推荐区域有独立配置</template
                                    ><el-icon class="label-tip-icon"
                                        ><QuestionFilled /></el-icon></el-tooltip
                            ></template>
                            <el-select
                                v-model="pageConfigData.websiteClickMode"
                                style="width: 100%"
                            >
                                <el-option label="跳转详情页" value="detail" />
                                <el-option label="直达网站" value="direct" />
                            </el-select>
                        </el-form-item>
                        <el-divider content-position="left">直达箭头</el-divider>
                        <el-form-item>
                            <template #label
                                ><span>卡片直达箭头</span
                                ><el-tooltip placement="top"
                                    ><template #content
                                        >开启后，网站卡片右侧显示快捷按钮（鼠标移入时出现）。</template
                                    ><el-icon class="label-tip-icon"
                                        ><QuestionFilled /></el-icon></el-tooltip
                            ></template>
                            <el-switch v-model="pageConfigData.showDirectArrow" />
                        </el-form-item>
                        <el-form-item>
                            <template #label
                                ><span>箭头新窗口打开</span
                                ><el-tooltip
                                    content="开启后，点击直达箭头时在新标签页中打开"
                                    placement="top"
                                    ><el-icon class="label-tip-icon"
                                        ><QuestionFilled /></el-icon></el-tooltip
                            ></template>
                            <el-switch v-model="pageConfigData.directArrowNewWindow" />
                        </el-form-item>
                        <el-divider content-position="left">窗口行为</el-divider>
                        <el-form-item>
                            <template #label
                                ><span>详情页新窗口</span
                                ><el-tooltip
                                    content="开启后，点击卡片进入详情页时在新标签页打开"
                                    placement="top"
                                    ><el-icon class="label-tip-icon"
                                        ><QuestionFilled /></el-icon></el-tooltip
                            ></template>
                            <el-switch v-model="pageConfigData.detailPageNewWindow" />
                        </el-form-item>
                        <el-divider content-position="left">分页</el-divider>
                        <el-form-item>
                            <template #label
                                ><span>每页显示数量</span
                                ><el-tooltip
                                    content="每页显示的网站数量，建议20-50之间"
                                    placement="top"
                                    ><el-icon class="label-tip-icon"
                                        ><QuestionFilled /></el-icon></el-tooltip
                            ></template>
                            <el-input-number
                                v-model="pageConfigData.pageSize"
                                :min="10"
                                :max="100"
                            />
                        </el-form-item>
                        <el-divider content-position="left">热门推荐点击行为</el-divider>
                        <p class="section-desc">
                            热门推荐区域使用独立的点击行为配置，不受上方「分类区域」配置影响。
                        </p>
                        <el-form-item>
                            <template #label
                                ><span>热门推荐点击</span
                                ><el-tooltip placement="top"
                                    ><template #content
                                        >设置用户点击「热门推荐」区域卡片时的行为：<br />「跳转详情页」-
                                        进入网站介绍页面<br />「直达网站」-
                                        直接打开外部网站</template
                                    ><el-icon class="label-tip-icon"
                                        ><QuestionFilled /></el-icon></el-tooltip
                            ></template>
                            <el-select
                                v-model="pageConfigData.hotRecommendationClickMode"
                                style="width: 100%"
                            >
                                <el-option label="跳转详情页" value="detail" />
                                <el-option label="直达网站" value="direct" />
                            </el-select>
                        </el-form-item>
                        <el-alert
                            type="success"
                            :closable="false"
                            show-icon
                            style="margin-bottom: 16px"
                        >
                            <template #title>
                                <span style="font-weight: 500">点击行为预览</span>
                            </template>
                            <div class="behavior-preview">
                                <p>
                                    分类区域卡片：{{
                                        pageConfigData.websiteClickMode === 'direct'
                                            ? '直达网站'
                                            : '跳转详情页'
                                    }}
                                </p>
                                <p>
                                    热门推荐卡片：{{
                                        pageConfigData.hotRecommendationClickMode === 'direct'
                                            ? '直达网站'
                                            : '跳转详情页'
                                    }}
                                </p>
                                <p>
                                    卡片箭头：{{
                                        pageConfigData.websiteClickMode === 'direct'
                                            ? '进入详情页'
                                            : '直达外部网站'
                                    }}
                                </p>
                            </div>
                        </el-alert>
                        <el-form-item>
                            <el-button
                                type="primary"
                                :loading="pageConfigLoading"
                                @click="handleSavePageConfig"
                                >保存</el-button
                            >
                        </el-form-item>
                    </el-form>
                </el-tab-pane>

                <!-- ==================== 卡片样式 ==================== -->
                <el-tab-pane label="卡片样式" name="cardStyle">
                    <div class="setting-header">
                        <h2 class="setting-title">卡片样式</h2>
                        <p class="setting-desc">
                            自定义网站卡片的展示样式，控制卡片上显示哪些信息。
                        </p>
                    </div>
                    <el-form :model="cardStyleData" label-width="140px" style="max-width: 650px">
                        <el-divider content-position="left">卡片布局</el-divider>
                        <p class="section-desc">设置网站列表的默认展示方式和列数。</p>
                        <el-form-item>
                            <template #label
                                ><span>默认布局</span
                                ><el-tooltip content="网站列表的默认展示方式" placement="top"
                                    ><el-icon class="label-tip-icon"
                                        ><QuestionFilled /></el-icon></el-tooltip
                            ></template>
                            <el-select v-model="cardStyleData.defaultLayout" style="width: 200px">
                                <el-option label="网格布局" value="grid" />
                                <el-option label="列表布局" value="list" />
                            </el-select>
                        </el-form-item>
                        <el-form-item>
                            <template #label
                                ><span>网格列数</span
                                ><el-tooltip
                                    content="网格布局时每行显示的卡片数量（桌面端）"
                                    placement="top"
                                    ><el-icon class="label-tip-icon"
                                        ><QuestionFilled /></el-icon></el-tooltip
                            ></template>
                            <el-select v-model="cardStyleData.gridColumns" style="width: 200px">
                                <el-option label="3列" :value="3" />
                                <el-option label="4列（推荐）" :value="4" />
                                <el-option label="5列" :value="5" />
                                <el-option label="6列" :value="6" />
                            </el-select>
                        </el-form-item>
                        <el-divider content-position="left">卡片信息显示</el-divider>
                        <p class="section-desc">控制网站卡片上显示哪些信息元素。</p>
                        <el-form-item>
                            <template #label
                                ><span>显示描述</span
                                ><el-tooltip
                                    content="在卡片上显示网站的简短描述文字"
                                    placement="top"
                                    ><el-icon class="label-tip-icon"
                                        ><QuestionFilled /></el-icon></el-tooltip
                            ></template>
                            <el-switch v-model="cardStyleData.showDescription" />
                        </el-form-item>
                        <el-form-item v-if="cardStyleData.showDescription">
                            <template #label
                                ><span>描述行数</span
                                ><el-tooltip
                                    content="描述文字最多显示的行数，超出部分省略"
                                    placement="top"
                                    ><el-icon class="label-tip-icon"
                                        ><QuestionFilled /></el-icon></el-tooltip
                            ></template>
                            <el-input-number
                                v-model="cardStyleData.maxDescriptionLines"
                                :min="1"
                                :max="5"
                            />
                        </el-form-item>
                        <el-form-item>
                            <template #label
                                ><span>显示标签</span
                                ><el-tooltip
                                    content="在卡片上显示网站的标签（如：热门、新上线等）"
                                    placement="top"
                                    ><el-icon class="label-tip-icon"
                                        ><QuestionFilled /></el-icon></el-tooltip
                            ></template>
                            <el-switch v-model="cardStyleData.showTags" />
                        </el-form-item>
                        <el-form-item>
                            <template #label
                                ><span>显示图标</span
                                ><el-tooltip content="在卡片上显示网站的Favicon图标" placement="top"
                                    ><el-icon class="label-tip-icon"
                                        ><QuestionFilled /></el-icon></el-tooltip
                            ></template>
                            <el-switch v-model="cardStyleData.showFavicon" />
                        </el-form-item>
                        <el-form-item>
                            <template #label
                                ><span>显示URL</span
                                ><el-tooltip content="在卡片上显示网站的域名地址" placement="top"
                                    ><el-icon class="label-tip-icon"
                                        ><QuestionFilled /></el-icon></el-tooltip
                            ></template>
                            <el-switch v-model="cardStyleData.showUrl" />
                        </el-form-item>
                        <el-divider content-position="left">悬浮效果</el-divider>
                        <p class="section-desc">鼠标悬浮在卡片上时的视觉效果。</p>
                        <el-form-item>
                            <template #label
                                ><span>悬浮效果</span
                                ><el-tooltip content="鼠标悬浮时卡片的动画效果" placement="top"
                                    ><el-icon class="label-tip-icon"
                                        ><QuestionFilled /></el-icon></el-tooltip
                            ></template>
                            <el-select v-model="cardStyleData.hoverEffect" style="width: 200px">
                                <el-option label="上移 + 边框变色" value="translateUp" />
                                <el-option label="仅边框变色" value="borderOnly" />
                                <el-option label="阴影效果" value="shadow" />
                                <el-option label="无效果" value="none" />
                            </el-select>
                        </el-form-item>
                        <el-form-item>
                            <el-button
                                type="primary"
                                :loading="cardStyleLoading"
                                @click="handleSaveCardStyle"
                                >保存</el-button
                            >
                        </el-form-item>
                    </el-form>
                </el-tab-pane>

                <!-- ==================== 侧边栏配置 ==================== -->
                <el-tab-pane label="侧边栏配置" name="sidebar">
                    <div class="setting-header">
                        <h2 class="setting-title">侧边栏配置</h2>
                        <p class="setting-desc">
                            配置前端页面的侧边栏显示方式和内容。侧边栏用于展示分类导航。
                        </p>
                    </div>
                    <el-form :model="sidebarData" label-width="140px" style="max-width: 650px">
                        <el-divider content-position="left">侧边栏基础</el-divider>
                        <p class="section-desc">控制侧边栏的显示和位置。</p>
                        <el-form-item>
                            <template #label
                                ><span>显示侧边栏</span
                                ><el-tooltip
                                    content="关闭后页面将不显示侧边栏，内容区域占满全宽"
                                    placement="top"
                                    ><el-icon class="label-tip-icon"
                                        ><QuestionFilled /></el-icon></el-tooltip
                            ></template>
                            <el-switch v-model="sidebarData.enabled" />
                        </el-form-item>
                        <el-form-item>
                            <template #label
                                ><span>侧边栏位置</span
                                ><el-tooltip
                                    content="侧边栏显示在页面的左侧还是右侧"
                                    placement="top"
                                    ><el-icon class="label-tip-icon"
                                        ><QuestionFilled /></el-icon></el-tooltip
                            ></template>
                            <el-select
                                v-model="sidebarData.position"
                                style="width: 200px"
                                :disabled="!sidebarData.enabled"
                            >
                                <el-option label="左侧" value="left" />
                                <el-option label="右侧" value="right" />
                            </el-select>
                        </el-form-item>
                        <el-form-item>
                            <template #label
                                ><span>侧边栏宽度</span
                                ><el-tooltip content="侧边栏的宽度（px）" placement="top"
                                    ><el-icon class="label-tip-icon"
                                        ><QuestionFilled /></el-icon></el-tooltip
                            ></template>
                            <el-input-number
                                v-model="sidebarData.width"
                                :min="180"
                                :max="360"
                                :step="20"
                                :disabled="!sidebarData.enabled"
                            />
                            <span class="form-tip">px</span>
                        </el-form-item>
                        <el-divider content-position="left">侧边栏内容</el-divider>
                        <p class="section-desc">控制侧边栏中显示哪些内容模块。</p>
                        <el-form-item>
                            <template #label
                                ><span>显示分类导航</span
                                ><el-tooltip content="在侧边栏中显示分类树形导航" placement="top"
                                    ><el-icon class="label-tip-icon"
                                        ><QuestionFilled /></el-icon></el-tooltip
                            ></template>
                            <el-switch
                                v-model="sidebarData.showCategories"
                                :disabled="!sidebarData.enabled"
                            />
                        </el-form-item>
                        <el-form-item>
                            <template #label
                                ><span>显示网站数量</span
                                ><el-tooltip
                                    content="在分类名称旁显示该分类下的网站数量"
                                    placement="top"
                                    ><el-icon class="label-tip-icon"
                                        ><QuestionFilled /></el-icon></el-tooltip
                            ></template>
                            <el-switch
                                v-model="sidebarData.showCategoryCount"
                                :disabled="!sidebarData.enabled"
                            />
                        </el-form-item>
                        <el-form-item>
                            <template #label
                                ><span>默认展开子分类</span
                                ><el-tooltip
                                    content="页面加载时是否默认展开所有子分类"
                                    placement="top"
                                    ><el-icon class="label-tip-icon"
                                        ><QuestionFilled /></el-icon></el-tooltip
                            ></template>
                            <el-switch
                                v-model="sidebarData.expandSubCategories"
                                :disabled="!sidebarData.enabled"
                            />
                        </el-form-item>
                        <el-form-item>
                            <template #label
                                ><span>侧边栏吸顶</span
                                ><el-tooltip
                                    content="开启后，滚动页面时侧边栏会固定在顶部"
                                    placement="top"
                                    ><el-icon class="label-tip-icon"
                                        ><QuestionFilled /></el-icon></el-tooltip
                            ></template>
                            <el-switch
                                v-model="sidebarData.sticky"
                                :disabled="!sidebarData.enabled"
                            />
                        </el-form-item>
                        <el-form-item>
                            <el-button
                                type="primary"
                                :loading="sidebarLoading"
                                @click="handleSaveSidebar"
                                >保存</el-button
                            >
                        </el-form-item>
                    </el-form>
                </el-tab-pane>

                <!-- ==================== 搜索配置 ==================== -->
                <el-tab-pane label="搜索配置" name="search">
                    <div class="setting-header">
                        <h2 class="setting-title">搜索配置</h2>
                        <p class="setting-desc">配置前端搜索功能的行为和展示方式。</p>
                    </div>
                    <el-form :model="searchData" label-width="140px" style="max-width: 650px">
                        <el-divider content-position="left">搜索基础</el-divider>
                        <p class="section-desc">控制搜索功能的基本行为。</p>
                        <el-form-item>
                            <template #label
                                ><span>搜索占位文字</span
                                ><el-tooltip content="搜索框中的提示文字" placement="top"
                                    ><el-icon class="label-tip-icon"
                                        ><QuestionFilled /></el-icon></el-tooltip
                            ></template>
                            <el-input
                                v-model="searchData.placeholder"
                                placeholder="搜索网站名称..."
                            />
                        </el-form-item>
                        <el-form-item>
                            <template #label
                                ><span>搜索防抖延迟</span
                                ><el-tooltip
                                    content="用户停止输入后多少毫秒触发搜索，避免频繁请求"
                                    placement="top"
                                    ><el-icon class="label-tip-icon"
                                        ><QuestionFilled /></el-icon></el-tooltip
                            ></template>
                            <el-input-number
                                v-model="searchData.debounceDelay"
                                :min="100"
                                :max="1000"
                                :step="100"
                            />
                            <span class="form-tip">毫秒</span>
                        </el-form-item>
                        <el-divider content-position="left">AI 搜索</el-divider>
                        <p class="section-desc">
                            AI搜索使用人工智能理解用户搜索意图，提供更精准的结果。需要先在「AI配置」中配置AI服务。
                        </p>
                        <el-form-item>
                            <template #label
                                ><span>启用AI搜索</span
                                ><el-tooltip content="开启后搜索框旁显示AI搜索按钮" placement="top"
                                    ><el-icon class="label-tip-icon"
                                        ><QuestionFilled /></el-icon></el-tooltip
                            ></template>
                            <el-switch v-model="searchData.aiSearchEnabled" />
                        </el-form-item>
                        <el-form-item>
                            <template #label
                                ><span>AI搜索按钮文字</span
                                ><el-tooltip content="AI搜索按钮上显示的文字" placement="top"
                                    ><el-icon class="label-tip-icon"
                                        ><QuestionFilled /></el-icon></el-tooltip
                            ></template>
                            <el-input
                                v-model="searchData.aiSearchBtnText"
                                placeholder="AI 搜索"
                                :disabled="!searchData.aiSearchEnabled"
                            />
                        </el-form-item>
                        <el-divider content-position="left">搜索结果</el-divider>
                        <p class="section-desc">控制搜索结果页面的展示方式。</p>
                        <el-form-item>
                            <template #label
                                ><span>高亮关键词</span
                                ><el-tooltip
                                    content="在搜索结果中高亮显示匹配的关键词"
                                    placement="top"
                                    ><el-icon class="label-tip-icon"
                                        ><QuestionFilled /></el-icon></el-tooltip
                            ></template>
                            <el-switch v-model="searchData.highlightKeyword" />
                        </el-form-item>
                        <el-form-item>
                            <template #label
                                ><span>每页结果数</span
                                ><el-tooltip content="搜索结果每页显示的数量" placement="top"
                                    ><el-icon class="label-tip-icon"
                                        ><QuestionFilled /></el-icon></el-tooltip
                            ></template>
                            <el-input-number
                                v-model="searchData.resultsPerPage"
                                :min="10"
                                :max="100"
                            />
                        </el-form-item>
                        <el-form-item>
                            <el-button
                                type="primary"
                                :loading="searchLoading"
                                @click="handleSaveSearch"
                                >保存</el-button
                            >
                        </el-form-item>
                    </el-form>
                </el-tab-pane>

                <!-- ==================== 跳转提醒 ==================== -->
                <el-tab-pane label="跳转提醒" name="exitModal">
                    <div class="setting-header">
                        <h2 class="setting-title">跳转提醒</h2>
                        <p class="setting-desc">配置用户点击外部链接时的跳转确认弹窗。</p>
                        <el-alert
                            type="warning"
                            :closable="false"
                            show-icon
                            style="margin-top: 12px"
                        >
                            <template #title>
                                <span style="font-weight: 500"
                                    >注意：分类区域与热门推荐区域已使用独立的「详情页/直达」逻辑，跳转提醒不参与这两类卡片点击行为</span
                                >
                            </template>
                        </el-alert>
                    </div>
                    <el-form :model="exitModalData" label-width="120px" style="max-width: 600px">
                        <!-- 提示：当前跳转提醒不参与分类区域与热门推荐卡片点击行为 -->
                        <el-alert
                            type="warning"
                            :closable="false"
                            show-icon
                            style="margin-bottom: 20px"
                        >
                            <template #title>
                                <div
                                    style="
                                        display: flex;
                                        align-items: center;
                                        justify-content: space-between;
                                    "
                                >
                                    <span
                                        >当前配置仅用于其他扩展跳转场景，分类区域与热门推荐卡片点击不会触发此弹窗</span
                                    >
                                    <el-button
                                        type="primary"
                                        size="small"
                                        @click="activeTab = 'pageConfig'"
                                        style="margin-left: 12px"
                                    >
                                        前往设置
                                    </el-button>
                                </div>
                            </template>
                        </el-alert>

                        <el-form-item>
                            <template #label
                                ><span>启用弹窗</span
                                ><el-tooltip
                                    content="开启后，用户点击外部链接时会弹出确认提示"
                                    placement="top"
                                    ><el-icon class="label-tip-icon"
                                        ><QuestionFilled /></el-icon></el-tooltip
                            ></template>
                            <el-switch v-model="exitModalData.enabled" />
                        </el-form-item>
                        <el-form-item>
                            <template #label
                                ><span>弹窗标题</span
                                ><el-tooltip content="弹窗顶部显示的标题文字" placement="top"
                                    ><el-icon class="label-tip-icon"
                                        ><QuestionFilled /></el-icon></el-tooltip
                            ></template>
                            <el-input v-model="exitModalData.title" placeholder="即将离开本站" />
                        </el-form-item>
                        <el-form-item>
                            <template #label
                                ><span>弹窗描述</span
                                ><el-tooltip content="弹窗中显示的提示说明文字" placement="top"
                                    ><el-icon class="label-tip-icon"
                                        ><QuestionFilled /></el-icon></el-tooltip
                            ></template>
                            <el-input
                                v-model="exitModalData.description"
                                type="textarea"
                                :rows="2"
                                placeholder="您即将访问外部网站，请注意安全"
                            />
                        </el-form-item>
                        <el-form-item>
                            <template #label
                                ><span>弹窗Logo</span
                                ><el-tooltip
                                    content="用于弹窗顶部品牌展示，建议使用透明背景 PNG"
                                    placement="top"
                                    ><el-icon class="label-tip-icon"
                                        ><QuestionFilled /></el-icon></el-tooltip
                            ></template>
                            <div style="width: 100%">
                                <el-input
                                    v-model="exitModalData.logo"
                                    placeholder="请输入Logo地址或通过素材库选择"
                                />
                                <material-picker v-model="exitModalData.logo" :limit="1">
                                    <el-button style="margin-top: 8px">从素材库选择</el-button>
                                </material-picker>
                                <div v-if="exitModalData.logo" style="margin-top: 8px">
                                    <el-image
                                        :src="exitModalData.logo"
                                        style="width: 120px; height: 40px"
                                        fit="contain"
                                    />
                                </div>
                            </div>
                        </el-form-item>
                        <el-divider content-position="left">协议配置</el-divider>
                        <el-form-item>
                            <template #label
                                ><span>显示协议链接</span
                                ><el-tooltip
                                    content="开启后，在弹窗底部显示用户协议与版权协议入口"
                                    placement="top"
                                    ><el-icon class="label-tip-icon"
                                        ><QuestionFilled /></el-icon></el-tooltip
                            ></template>
                            <el-switch v-model="exitModalData.showAgreementLinks" />
                        </el-form-item>
                        <el-form-item>
                            <template #label
                                ><span>用户协议标题</span
                                ><el-tooltip content="弹窗中展示的用户协议文案" placement="top"
                                    ><el-icon class="label-tip-icon"
                                        ><QuestionFilled /></el-icon></el-tooltip
                            ></template>
                            <el-input
                                v-model="exitModalData.userAgreementText"
                                placeholder="用户协议"
                                :disabled="!exitModalData.showAgreementLinks"
                            />
                        </el-form-item>
                        <el-form-item>
                            <template #label
                                ><span>用户协议链接</span
                                ><el-tooltip content="用户协议页面地址（URL）" placement="top"
                                    ><el-icon class="label-tip-icon"
                                        ><QuestionFilled /></el-icon></el-tooltip
                            ></template>
                            <el-input
                                v-model="exitModalData.userAgreementUrl"
                                placeholder="https://example.com/user-agreement"
                                :disabled="!exitModalData.showAgreementLinks"
                            />
                        </el-form-item>
                        <el-form-item>
                            <template #label
                                ><span>版权协议标题</span
                                ><el-tooltip content="弹窗中展示的版权协议文案" placement="top"
                                    ><el-icon class="label-tip-icon"
                                        ><QuestionFilled /></el-icon></el-tooltip
                            ></template>
                            <el-input
                                v-model="exitModalData.copyrightAgreementText"
                                placeholder="版权协议"
                                :disabled="!exitModalData.showAgreementLinks"
                            />
                        </el-form-item>
                        <el-form-item>
                            <template #label
                                ><span>版权协议链接</span
                                ><el-tooltip content="版权协议页面地址（URL）" placement="top"
                                    ><el-icon class="label-tip-icon"
                                        ><QuestionFilled /></el-icon></el-tooltip
                            ></template>
                            <el-input
                                v-model="exitModalData.copyrightAgreementUrl"
                                placeholder="https://example.com/copyright-agreement"
                                :disabled="!exitModalData.showAgreementLinks"
                            />
                        </el-form-item>
                        <el-form-item>
                            <template #label
                                ><span>自动跳转</span
                                ><el-tooltip
                                    content="开启后，倒计时结束将自动跳转到目标网站"
                                    placement="top"
                                    ><el-icon class="label-tip-icon"
                                        ><QuestionFilled /></el-icon></el-tooltip
                            ></template>
                            <el-switch v-model="exitModalData.autoRedirect" />
                        </el-form-item>
                        <el-form-item>
                            <template #label
                                ><span>倒计时(秒)</span
                                ><el-tooltip
                                    content="自动跳转前的等待秒数，建议3-10秒"
                                    placement="top"
                                    ><el-icon class="label-tip-icon"
                                        ><QuestionFilled /></el-icon></el-tooltip
                            ></template>
                            <el-input-number v-model="exitModalData.countdown" :min="1" :max="30" />
                        </el-form-item>
                        <el-form-item>
                            <el-button
                                type="primary"
                                :loading="exitModalLoading"
                                @click="handleSaveExitModal"
                                >保存</el-button
                            >
                        </el-form-item>
                    </el-form>
                </el-tab-pane>
            </el-tabs>
        </el-card>
    </div>
</template>

<script lang="ts" setup name="uiedSetting">
/**
 * @file views/uied/setting/index.vue
 * @description UIED 站点设置管理 - WordPress主题级别的丰富配置
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 2.0.0
 */
import {
    uiedPublicSettings,
    uiedSiteInfo,
    uiedSaveSiteInfo,
    uiedSettingGet,
    uiedSettingSave
} from '@/api/uied'
import { QuestionFilled } from '@element-plus/icons-vue'
import feedback from '@/utils/feedback'

const activeTab = ref('siteInfo')
const reloadLoading = ref(false)
const saveAllLoading = ref(false)
const lastSavedAt = ref<number | null>(null)

// ==================== 站点信息 ====================
const siteInfoLoading = ref(false)
const siteInfoData = reactive({
    siteName: '',
    siteTitle: '',
    siteDescription: '',
    siteKeywords: '',
    logo: '',
    favicon: '',
    icp: '',
    copyright: '',
    contactEmail: '',
    analyticsCode: ''
})

// ==================== 外观配置 ====================
const appearanceLoading = ref(false)
const appearanceData = reactive({
    primaryColor: '#0066ff',
    backgroundColor: '#f6f8fb',
    cardBackgroundColor: '#ffffff',
    textPrimaryColor: '#333333',
    fontFamily: '',
    baseFontSize: 16,
    borderRadius: 12,
    contentMaxWidth: 1200,
    customCss: ''
})

// ==================== 首页配置 ====================
const homepageLoading = ref(false)
const defaultNavSwitchItems = [
    { slug: 'uiux', name: 'UI导航', icon: 'Figma', visible: true, sort: 10 },
    { slug: 'ai', name: 'AI导航', icon: 'AI', visible: true, sort: 20 },
    { slug: 'design', name: '平面导航', icon: 'Design', visible: true, sort: 30 },
    { slug: '3d', name: '三维导航', icon: '3D', visible: true, sort: 40 },
    { slug: 'ecommerce', name: '电商导航', icon: 'Ecommerce', visible: true, sort: 50 },
    { slug: 'interior', name: '室内导航', icon: 'Design', visible: true, sort: 60 },
    { slug: 'font', name: '字体导航', icon: 'Font', visible: true, sort: 70 }
]
const homepageData = reactive({
    heroBannerEnabled: true,
    heroBgType: 'default',
    heroBgValue: '',
    heroDisplayMode: 'search',
    heroShowStats: true,
    heroShowHotTags: true,
    bannerCardsEnabled: true,
    hotRecommendationsEnabled: true,
    hotRecommendationsTitle: '热门推荐',
    topAdEnabled: false,
    topAdCode: '',
    homeCarouselEnabled: true,
    homeCarouselSort: 10,
    homeRecommendationEnabled: true,
    homeRecommendationSort: 20,
    navSwitchItems: defaultNavSwitchItems.map((item) => ({ ...item }))
})

/**
 * 规范化导航切换配置项，确保显示开关和排序字段完整
 */
const normalizeNavSwitchItems = (items: unknown) => {
    const list = Array.isArray(items) && items.length > 0 ? items : defaultNavSwitchItems
    return list
        .map((item: any, index: number) => ({
            slug: String(
                item?.slug || defaultNavSwitchItems[index % defaultNavSwitchItems.length].slug
            ),
            name: String(
                item?.name || defaultNavSwitchItems[index % defaultNavSwitchItems.length].name
            ),
            icon: String(
                item?.icon || defaultNavSwitchItems[index % defaultNavSwitchItems.length].icon
            ),
            visible: item?.visible !== false,
            sort: Number.isFinite(Number(item?.sort)) ? Number(item.sort) : (index + 1) * 10
        }))
        .sort((a, b) => a.sort - b.sort)
}

/**
 * 规范化首页配置，确保轮播/推荐区和导航切换项可后台控制
 */
const normalizeHomepageConfigData = (config: any) => ({
    ...homepageData,
    ...config,
    homeCarouselEnabled: config?.homeCarouselEnabled !== false,
    homeRecommendationEnabled: config?.homeRecommendationEnabled !== false,
    homeCarouselSort: Number.isFinite(Number(config?.homeCarouselSort))
        ? Number(config.homeCarouselSort)
        : 10,
    homeRecommendationSort: Number.isFinite(Number(config?.homeRecommendationSort))
        ? Number(config.homeRecommendationSort)
        : 20,
    navSwitchItems: normalizeNavSwitchItems(config?.navSwitchItems)
})

// ==================== 页面配置 ====================
const pageConfigLoading = ref(false)
const pageConfigData = reactive({
    websiteClickMode: 'detail',
    showDirectArrow: false,
    detailPageNewWindow: false,
    directArrowNewWindow: true,
    pageSize: 20,
    hotRecommendationClickMode: 'detail' // 热门推荐独立配置
})

/**
 * 规范化分类区域点击模式
 * 兼容历史值：directExternal -> direct
 */
const normalizeWebsiteClickMode = (mode: unknown): 'detail' | 'direct' => {
    if (mode === 'direct' || mode === 'directExternal') return 'direct'
    return 'detail'
}

/**
 * 规范化热门推荐点击模式
 * 兼容历史值：modal -> detail
 */
const normalizeHotRecommendationClickMode = (mode: unknown): 'detail' | 'direct' => {
    if (mode === 'direct') return 'direct'
    return 'detail'
}

/**
 * 规范化页面配置，确保分类区域与热门推荐点击行为独立且语义一致
 */
const normalizePageConfigData = (config: any) => ({
    ...config,
    websiteClickMode: normalizeWebsiteClickMode(config?.websiteClickMode),
    hotRecommendationClickMode: normalizeHotRecommendationClickMode(
        config?.hotRecommendationClickMode
    )
})

// ==================== 卡片样式 ====================
const cardStyleLoading = ref(false)
const cardStyleData = reactive({
    defaultLayout: 'grid',
    gridColumns: 4,
    showDescription: true,
    maxDescriptionLines: 2,
    showTags: true,
    showFavicon: true,
    showUrl: false,
    hoverEffect: 'translateUp'
})

// ==================== 侧边栏配置 ====================
const sidebarLoading = ref(false)
const sidebarData = reactive({
    enabled: true,
    position: 'left',
    width: 240,
    showCategories: true,
    showCategoryCount: true,
    expandSubCategories: false,
    sticky: true
})

// ==================== 搜索配置 ====================
const searchLoading = ref(false)
const searchData = reactive({
    placeholder: '搜索网站名称...',
    debounceDelay: 300,
    aiSearchEnabled: true,
    aiSearchBtnText: 'AI 搜索',
    highlightKeyword: true,
    resultsPerPage: 20
})

// ==================== 跳转提醒 ====================
const exitModalLoading = ref(false)
const defaultExitModalConfig = {
    enabled: true,
    title: '即将离开本站',
    description: '您即将访问外部网站，请注意安全',
    autoRedirect: true,
    countdown: 5,
    logo: '',
    showAgreementLinks: false,
    userAgreementText: '用户协议',
    userAgreementUrl: '',
    copyrightAgreementText: '版权协议',
    copyrightAgreementUrl: ''
}
const exitModalData = reactive({ ...defaultExitModalConfig })

/**
 * 规范化跳转弹窗配置，确保协议与品牌字段完整
 */
const normalizeExitModalConfigData = (config: any) => ({
    ...defaultExitModalConfig,
    ...config,
    enabled: config?.enabled !== false,
    autoRedirect: config?.autoRedirect !== false,
    countdown: Number.isFinite(Number(config?.countdown))
        ? Math.max(1, Math.min(30, Number(config.countdown)))
        : 5,
    logo: String(config?.logo || ''),
    showAgreementLinks: config?.showAgreementLinks === true,
    userAgreementText: String(config?.userAgreementText || '用户协议'),
    userAgreementUrl: String(config?.userAgreementUrl || ''),
    copyrightAgreementText: String(config?.copyrightAgreementText || '版权协议'),
    copyrightAgreementUrl: String(config?.copyrightAgreementUrl || '')
})

// ==================== 快照与比对 ====================
const snapshotData = reactive({
    siteInfo: '',
    appearance: '',
    homepage: '',
    pageConfig: '',
    cardStyle: '',
    sidebar: '',
    search: '',
    exitModal: ''
})

/**
 * 深拷贝配置对象，避免响应式引用污染快照
 */
const cloneConfig = <T>(data: T): T => JSON.parse(JSON.stringify(data))

/**
 * 序列化配置对象，用于判断是否有改动
 */
const serializeConfig = (data: unknown): string => JSON.stringify(data ?? {})

/**
 * 获取当前页面配置的标准化序列化值
 */
const getSerializedPageConfig = (): string => {
    const normalized = normalizePageConfigData(cloneConfig(pageConfigData))
    return serializeConfig(normalized)
}

/**
 * 刷新本地快照
 */
const refreshSnapshot = () => {
    snapshotData.siteInfo = serializeConfig(cloneConfig(siteInfoData))
    snapshotData.appearance = serializeConfig(cloneConfig(appearanceData))
    snapshotData.homepage = serializeConfig(cloneConfig(homepageData))
    snapshotData.pageConfig = getSerializedPageConfig()
    snapshotData.cardStyle = serializeConfig(cloneConfig(cardStyleData))
    snapshotData.sidebar = serializeConfig(cloneConfig(sidebarData))
    snapshotData.search = serializeConfig(cloneConfig(searchData))
    snapshotData.exitModal = serializeConfig(cloneConfig(exitModalData))
}

/**
 * 读取指定快照对象
 */
const readSnapshotObject = (value: string): Record<string, any> => {
    try {
        return value ? JSON.parse(value) : {}
    } catch (error) {
        console.warn('解析配置快照失败:', error)
        return {}
    }
}

/**
 * 判断指定标签是否有改动
 */
const hasTabChanges = (tab: string): boolean => {
    if (tab === 'siteInfo')
        return serializeConfig(cloneConfig(siteInfoData)) !== snapshotData.siteInfo
    if (tab === 'appearance')
        return serializeConfig(cloneConfig(appearanceData)) !== snapshotData.appearance
    if (tab === 'homepage')
        return serializeConfig(cloneConfig(homepageData)) !== snapshotData.homepage
    if (tab === 'pageConfig') return getSerializedPageConfig() !== snapshotData.pageConfig
    if (tab === 'cardStyle')
        return serializeConfig(cloneConfig(cardStyleData)) !== snapshotData.cardStyle
    if (tab === 'sidebar') return serializeConfig(cloneConfig(sidebarData)) !== snapshotData.sidebar
    if (tab === 'search') return serializeConfig(cloneConfig(searchData)) !== snapshotData.search
    if (tab === 'exitModal')
        return serializeConfig(cloneConfig(exitModalData)) !== snapshotData.exitModal
    return false
}

const hasPendingChanges = computed(
    () =>
        hasTabChanges('siteInfo') ||
        hasTabChanges('appearance') ||
        hasTabChanges('homepage') ||
        hasTabChanges('pageConfig') ||
        hasTabChanges('cardStyle') ||
        hasTabChanges('sidebar') ||
        hasTabChanges('search') ||
        hasTabChanges('exitModal')
)

const hasCurrentTabChanges = computed(() => hasTabChanges(activeTab.value))

const lastSavedAtText = computed(() => {
    if (!lastSavedAt.value) return '未保存'
    return new Date(lastSavedAt.value).toLocaleString()
})

/**
 * 标记已保存并更新快照
 */
const markSaved = () => {
    lastSavedAt.value = Date.now()
    refreshSnapshot()
}

// ==================== 加载函数 ====================
/**
 * 应用公开设置到本地表单
 */
const applyPublicSettings = (settings: Record<string, any>) => {
    if (settings.siteInfo) Object.assign(siteInfoData, settings.siteInfo)
    if (settings.appearance) Object.assign(appearanceData, settings.appearance)
    if (settings.homepage)
        Object.assign(homepageData, normalizeHomepageConfigData(settings.homepage))
    if (settings.pageGlobal)
        Object.assign(pageConfigData, normalizePageConfigData(settings.pageGlobal))
    if (settings.cardStyle) Object.assign(cardStyleData, settings.cardStyle)
    if (settings.sidebar) Object.assign(sidebarData, settings.sidebar)
    if (settings.search) Object.assign(searchData, settings.search)
    if (settings.exitModal || settings.popup)
        Object.assign(exitModalData, normalizeExitModalConfigData(settings.exitModal || settings.popup))
}

/**
 * 一次性加载全部站点配置
 */
const loadAllSettings = async (silent = false) => {
    reloadLoading.value = true
    try {
        const settings = await uiedPublicSettings()
        if (settings) applyPublicSettings(settings)
        refreshSnapshot()
        if (!silent) feedback.msgSuccess('配置已刷新')
    } catch (error) {
        console.error('加载公开设置失败，回退分项加载:', error)
        await Promise.all([
            loadSiteInfo(),
            loadAppearance(),
            loadHomepage(),
            loadPageConfig(),
            loadCardStyle(),
            loadSidebar(),
            loadSearch(),
            loadExitModal()
        ])
        refreshSnapshot()
        if (!silent) feedback.msgWarning('公开配置加载失败，已使用分项加载')
    } finally {
        reloadLoading.value = false
    }
}

const loadSiteInfo = async () => {
    try {
        const res = await uiedSiteInfo()
        if (res) Object.assign(siteInfoData, res)
    } catch (e) {
        console.error('加载站点信息失败', e)
    }
}
const loadAppearance = async () => {
    try {
        const res = await uiedSettingGet({ key: 'appearanceConfig' })
        if (res) Object.assign(appearanceData, res)
    } catch (e) {
        console.error('加载外观配置失败', e)
    }
}
const loadHomepage = async () => {
    try {
        const res = await uiedSettingGet({ key: 'homepageConfig' })
        if (res) Object.assign(homepageData, normalizeHomepageConfigData(res))
    } catch (e) {
        console.error('加载首页配置失败', e)
    }
}
const loadPageConfig = async () => {
    try {
        const res = await uiedSettingGet({ key: 'pageGlobalConfig' })
        if (res) Object.assign(pageConfigData, normalizePageConfigData(res))
    } catch (e) {
        console.error('加载页面配置失败', e)
    }
}
const loadCardStyle = async () => {
    try {
        const res = await uiedSettingGet({ key: 'cardStyleConfig' })
        if (res) Object.assign(cardStyleData, res)
    } catch (e) {
        console.error('加载卡片样式失败', e)
    }
}
const loadSidebar = async () => {
    try {
        const res = await uiedSettingGet({ key: 'sidebarConfig' })
        if (res) Object.assign(sidebarData, res)
    } catch (e) {
        console.error('加载侧边栏配置失败', e)
    }
}
const loadSearch = async () => {
    try {
        const res = await uiedSettingGet({ key: 'searchConfig' })
        if (res) Object.assign(searchData, res)
    } catch (e) {
        console.error('加载搜索配置失败', e)
    }
}
const loadExitModal = async () => {
    try {
        const res = await uiedSettingGet({ key: 'exitModalConfig' })
        if (res) Object.assign(exitModalData, normalizeExitModalConfigData(res))
    } catch (e) {
        console.error('加载跳转提醒配置失败', e)
    }
}

// ==================== 保存函数 ====================
const handleSaveSiteInfo = async () => {
    siteInfoLoading.value = true
    try {
        await uiedSaveSiteInfo(siteInfoData)
        markSaved()
        feedback.msgSuccess('保存成功')
    } catch (error) {
        console.error('保存站点信息失败:', error)
        feedback.msgError('保存失败')
    } finally {
        siteInfoLoading.value = false
    }
}
const handleSaveAppearance = async () => {
    appearanceLoading.value = true
    try {
        await uiedSettingSave({ appearanceConfig: appearanceData })
        markSaved()
        feedback.msgSuccess('保存成功')
    } catch (error) {
        console.error('保存外观配置失败:', error)
        feedback.msgError('保存失败')
    } finally {
        appearanceLoading.value = false
    }
}
const handleSaveHomepage = async () => {
    homepageLoading.value = true
    try {
        await uiedSettingSave({
            homepageConfig: normalizeHomepageConfigData(cloneConfig(homepageData))
        })
        markSaved()
        feedback.msgSuccess('保存成功')
    } catch (error) {
        console.error('保存首页配置失败:', error)
        feedback.msgError('保存失败')
    } finally {
        homepageLoading.value = false
    }
}
const handleSavePageConfig = async () => {
    pageConfigLoading.value = true
    try {
        await uiedSettingSave({ pageGlobalConfig: normalizePageConfigData(pageConfigData) })
        markSaved()
        feedback.msgSuccess('保存成功')
    } catch (error) {
        console.error('保存页面配置失败:', error)
        feedback.msgError('保存失败')
    } finally {
        pageConfigLoading.value = false
    }
}
const handleSaveCardStyle = async () => {
    cardStyleLoading.value = true
    try {
        await uiedSettingSave({ cardStyleConfig: cardStyleData })
        markSaved()
        feedback.msgSuccess('保存成功')
    } catch (error) {
        console.error('保存卡片样式失败:', error)
        feedback.msgError('保存失败')
    } finally {
        cardStyleLoading.value = false
    }
}
const handleSaveSidebar = async () => {
    sidebarLoading.value = true
    try {
        await uiedSettingSave({ sidebarConfig: sidebarData })
        markSaved()
        feedback.msgSuccess('保存成功')
    } catch (error) {
        console.error('保存侧边栏配置失败:', error)
        feedback.msgError('保存失败')
    } finally {
        sidebarLoading.value = false
    }
}
const handleSaveSearch = async () => {
    searchLoading.value = true
    try {
        await uiedSettingSave({ searchConfig: searchData })
        markSaved()
        feedback.msgSuccess('保存成功')
    } catch (error) {
        console.error('保存搜索配置失败:', error)
        feedback.msgError('保存失败')
    } finally {
        searchLoading.value = false
    }
}
const handleSaveExitModal = async () => {
    exitModalLoading.value = true
    try {
        await uiedSettingSave({ exitModalConfig: exitModalData })
        markSaved()
        feedback.msgSuccess('保存成功')
    } catch (error) {
        console.error('保存跳转提醒配置失败:', error)
        feedback.msgError('保存失败')
    } finally {
        exitModalLoading.value = false
    }
}

/**
 * 保存全部配置（售卖版推荐工作流）
 */
const handleSaveAll = async () => {
    saveAllLoading.value = true
    try {
        await Promise.all([
            uiedSaveSiteInfo(siteInfoData),
            uiedSettingSave({
                appearanceConfig: appearanceData,
                homepageConfig: normalizeHomepageConfigData(cloneConfig(homepageData)),
                pageGlobalConfig: normalizePageConfigData(pageConfigData),
                cardStyleConfig: cardStyleData,
                sidebarConfig: sidebarData,
                searchConfig: searchData,
                exitModalConfig: exitModalData
            })
        ])
        markSaved()
        feedback.msgSuccess('全部配置保存成功')
    } catch (error) {
        console.error('保存全部配置失败:', error)
        feedback.msgError('保存失败，请检查配置后重试')
    } finally {
        saveAllLoading.value = false
    }
}

/**
 * 重置当前标签配置为最近一次快照
 */
const handleResetCurrentTab = () => {
    const tab = activeTab.value
    if (!hasTabChanges(tab)) return

    if (tab === 'siteInfo') Object.assign(siteInfoData, readSnapshotObject(snapshotData.siteInfo))
    if (tab === 'appearance')
        Object.assign(appearanceData, readSnapshotObject(snapshotData.appearance))
    if (tab === 'homepage')
        Object.assign(
            homepageData,
            normalizeHomepageConfigData(readSnapshotObject(snapshotData.homepage))
        )
    if (tab === 'pageConfig')
        Object.assign(
            pageConfigData,
            normalizePageConfigData(readSnapshotObject(snapshotData.pageConfig))
        )
    if (tab === 'cardStyle')
        Object.assign(cardStyleData, readSnapshotObject(snapshotData.cardStyle))
    if (tab === 'sidebar') Object.assign(sidebarData, readSnapshotObject(snapshotData.sidebar))
    if (tab === 'search') Object.assign(searchData, readSnapshotObject(snapshotData.search))
    if (tab === 'exitModal')
        Object.assign(exitModalData, readSnapshotObject(snapshotData.exitModal))

    feedback.msgSuccess('当前标签已重置')
}

/**
 * 重新加载全部配置
 */
const handleReloadAll = async () => {
    await loadAllSettings(false)
}

// ==================== 初始化 ====================
onMounted(() => {
    loadAllSettings(true)
})
</script>

<style scoped>
.setting-tabs :deep(.el-tabs__header) {
    width: 130px;
}
.setting-tabs :deep(.el-tabs__item) {
    text-align: left;
    padding: 0 16px;
}
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

/* 新增：设置页面头部样式 */
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

.setting-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 14px;
    padding: 12px 14px;
    border: 1px solid #ebeef5;
    border-radius: 8px;
    background: #fafafa;
}

.toolbar-left {
    display: flex;
    align-items: center;
    gap: 10px;
}

.toolbar-right {
    display: flex;
    align-items: center;
    gap: 8px;
}

.toolbar-time {
    color: #909399;
    font-size: 12px;
}

.behavior-preview p {
    margin: 2px 0;
    line-height: 1.6;
    color: #606266;
}

.nav-switch-setting-table {
    width: 100%;
    border: 1px solid #ebeef5;
    border-radius: 8px;
    overflow: hidden;
}

.nav-switch-setting-header,
.nav-switch-setting-row {
    display: grid;
    grid-template-columns: 1fr 1.2fr 1.2fr 90px 120px;
    gap: 10px;
    align-items: center;
    padding: 10px 12px;
}

.nav-switch-setting-header {
    background: #f5f7fa;
    color: #606266;
    font-size: 12px;
    font-weight: 600;
}

.nav-switch-setting-row {
    border-top: 1px solid #f0f2f5;
}
</style>
