// This file is created by egg-ts-helper@1.35.2
// Do not modify this file!!!!!!!!!
/* eslint-disable */

import 'egg';
import ExportAuth = require('../../../app/middleware/auth');
import ExportAuthority = require('../../../app/middleware/authority');
import ExportCommercialFeatureGuard = require('../../../app/middleware/commercial_feature_guard');
import ExportCommercialLegacyRouteGuard = require('../../../app/middleware/commercial_legacy_route_guard');
import ExportFrontendResponseNormalizer = require('../../../app/middleware/frontend_response_normalizer');
import ExportSystemResponseNormalizer = require('../../../app/middleware/system_response_normalizer');

declare module 'egg' {
  interface IMiddleware {
    auth: typeof ExportAuth;
    authority: typeof ExportAuthority;
    commercialFeatureGuard: typeof ExportCommercialFeatureGuard;
    commercialLegacyRouteGuard: typeof ExportCommercialLegacyRouteGuard;
    frontendResponseNormalizer: typeof ExportFrontendResponseNormalizer;
    systemResponseNormalizer: typeof ExportSystemResponseNormalizer;
  }
}
