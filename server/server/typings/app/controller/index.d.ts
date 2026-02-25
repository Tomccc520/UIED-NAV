// This file is created by egg-ts-helper@1.35.2
// Do not modify this file!!!!!!!!!
/* eslint-disable */

import 'egg';
import ExportArticle = require('../../../app/controller/article');
import ExportBaseController = require('../../../app/controller/baseController');
import ExportSystem = require('../../../app/controller/system');
import ExportUpload = require('../../../app/controller/upload');
import ExportUser = require('../../../app/controller/user');
import ExportCommonAlbum = require('../../../app/controller/common/album');
import ExportGenGen = require('../../../app/controller/gen/gen');
import ExportMonitorMonitor = require('../../../app/controller/monitor/monitor');
import ExportSettingCopyright = require('../../../app/controller/setting/copyright');
import ExportSettingDict = require('../../../app/controller/setting/dict');
import ExportSettingProtocol = require('../../../app/controller/setting/protocol');
import ExportSettingStorage = require('../../../app/controller/setting/storage');
import ExportSettingWebsite = require('../../../app/controller/setting/website');
import ExportSystemAdmin = require('../../../app/controller/system/admin');
import ExportSystemDept = require('../../../app/controller/system/dept');
import ExportSystemLog = require('../../../app/controller/system/log');
import ExportSystemMenu = require('../../../app/controller/system/menu');
import ExportSystemPost = require('../../../app/controller/system/post');
import ExportSystemRole = require('../../../app/controller/system/role');
import ExportUiedAiConfig = require('../../../app/controller/uied/aiConfig');
import ExportUiedAiUsageLog = require('../../../app/controller/uied/aiUsageLog');
import ExportUiedArticle = require('../../../app/controller/uied/article');
import ExportUiedArticleCategory = require('../../../app/controller/uied/articleCategory');
import ExportUiedArticleTag = require('../../../app/controller/uied/articleTag');
import ExportUiedBanner = require('../../../app/controller/uied/banner');
import ExportUiedCategory = require('../../../app/controller/uied/category');
import ExportUiedComment = require('../../../app/controller/uied/comment');
import ExportUiedCommercialSlot = require('../../../app/controller/uied/commercialSlot');
import ExportUiedContributionIncentive = require('../../../app/controller/uied/contributionIncentive');
import ExportUiedDailyHot = require('../../../app/controller/uied/dailyHot');
import ExportUiedDeliveryInit = require('../../../app/controller/uied/deliveryInit');
import ExportUiedExport = require('../../../app/controller/uied/export');
import ExportUiedFaviconApi = require('../../../app/controller/uied/faviconApi');
import ExportUiedFooter = require('../../../app/controller/uied/footer');
import ExportUiedFriendLink = require('../../../app/controller/uied/friendLink');
import ExportUiedFrontend = require('../../../app/controller/uied/frontend');
import ExportUiedHotRecommendation = require('../../../app/controller/uied/hotRecommendation');
import ExportUiedLicenseCenter = require('../../../app/controller/uied/licenseCenter');
import ExportUiedMonitor = require('../../../app/controller/uied/monitor');
import ExportUiedNavMenu = require('../../../app/controller/uied/navMenu');
import ExportUiedOperationLog = require('../../../app/controller/uied/operationLog');
import ExportUiedPage = require('../../../app/controller/uied/page');
import ExportUiedRankBoard = require('../../../app/controller/uied/rankBoard');
import ExportUiedSeoScraper = require('../../../app/controller/uied/seoScraper');
import ExportUiedSetting = require('../../../app/controller/uied/setting');
import ExportUiedSocialMedia = require('../../../app/controller/uied/socialMedia');
import ExportUiedStatistics = require('../../../app/controller/uied/statistics');
import ExportUiedSubmission = require('../../../app/controller/uied/submission');
import ExportUiedTopicFactory = require('../../../app/controller/uied/topicFactory');
import ExportUiedWebsite = require('../../../app/controller/uied/website');
import ExportUiedWebsiteTag = require('../../../app/controller/uied/websiteTag');
import ExportUiedWordpressConfig = require('../../../app/controller/uied/wordpressConfig');

declare module 'egg' {
  interface IController {
    article: ExportArticle;
    baseController: ExportBaseController;
    system: ExportSystem & {
      admin: ExportSystemAdmin;
      dept: ExportSystemDept;
      log: ExportSystemLog;
      menu: ExportSystemMenu;
      post: ExportSystemPost;
      role: ExportSystemRole;
    }
    upload: ExportUpload;
    user: ExportUser;
    common: {
      album: ExportCommonAlbum;
    }
    gen: {
      gen: ExportGenGen;
    }
    monitor: {
      monitor: ExportMonitorMonitor;
    }
    setting: {
      copyright: ExportSettingCopyright;
      dict: ExportSettingDict;
      protocol: ExportSettingProtocol;
      storage: ExportSettingStorage;
      website: ExportSettingWebsite;
    }
    uied: {
      aiConfig: ExportUiedAiConfig;
      aiUsageLog: ExportUiedAiUsageLog;
      article: ExportUiedArticle;
      articleCategory: ExportUiedArticleCategory;
      articleTag: ExportUiedArticleTag;
      banner: ExportUiedBanner;
      category: ExportUiedCategory;
      comment: ExportUiedComment;
      commercialSlot: ExportUiedCommercialSlot;
      contributionIncentive: ExportUiedContributionIncentive;
      dailyHot: ExportUiedDailyHot;
      deliveryInit: ExportUiedDeliveryInit;
      export: ExportUiedExport;
      faviconApi: ExportUiedFaviconApi;
      footer: ExportUiedFooter;
      friendLink: ExportUiedFriendLink;
      frontend: ExportUiedFrontend;
      hotRecommendation: ExportUiedHotRecommendation;
      licenseCenter: ExportUiedLicenseCenter;
      monitor: ExportUiedMonitor;
      navMenu: ExportUiedNavMenu;
      operationLog: ExportUiedOperationLog;
      page: ExportUiedPage;
      rankBoard: ExportUiedRankBoard;
      seoScraper: ExportUiedSeoScraper;
      setting: ExportUiedSetting;
      socialMedia: ExportUiedSocialMedia;
      statistics: ExportUiedStatistics;
      submission: ExportUiedSubmission;
      topicFactory: ExportUiedTopicFactory;
      website: ExportUiedWebsite;
      websiteTag: ExportUiedWebsiteTag;
      wordpressConfig: ExportUiedWordpressConfig;
    }
  }
}
