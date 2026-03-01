/**
 * @file userService.ts
 * @description 用户中心服务 - 处理登录、注册、用户信息等
 * @copyright 版权所有 (c) 2026 UIED技术团队
 */

import api from './api';
import { unwrapApiResponse } from '../utils/apiResponse';

// 用户信息接口
export interface User {
  id: number;
  username: string;
  nickname?: string;
  avatar?: string;
  email?: string;
  mobile?: string;
  userType?: string; // e.g. 'normal', 'author', 'admin'
  userTypeName?: string;
  profileCompletion?: number;
  // 新增字段 (2026-02-20)
  mobileMask?: string;
  sexName?: string;
  channelName?: string;
  createTime?: string;
  lastLoginTime?: string;
  [key: string]: any;
}

// 登录/注册响应接口
export interface AuthResponse {
  token: string;
  user: User;
  userInfo: User; // 兼容不同字段名
}

// 登录 2FA 挑战响应
export interface LoginTwoFactorChallenge {
  need2fa: true;
  challengeToken: string;
  method: 'mobile' | 'email';
  maskedAccount: string;
  expireSeconds: number;
}

export type LoginResponse = AuthResponse | LoginTwoFactorChallenge;

// 登录参数
export interface LoginParams {
  username?: string;
  account?: string;
  password: string;
}

// 注册参数
export interface RegisterParams {
  username: string;
  password: string;
  confirmPassword?: string;
  nickname?: string;
  mobile?: string;
}

interface ServiceAuthError extends Error {
  code?: number;
  authInvalid?: boolean;
}

/**
 * 构建用户认证相关错误对象
 */
const buildAuthError = (message: string, code?: number, authInvalid = false): ServiceAuthError => {
  const error = new Error(message) as ServiceAuthError;
  error.code = code;
  error.authInvalid = authInvalid;
  return error;
};

// 用户服务
export const userService = {
  /**
   * 用户登录
   */
  login: async (params: LoginParams): Promise<LoginResponse> => {
    const response = await api.post<any>('/user/login', params);
    const payload = unwrapApiResponse<any>(response.data, {});
    if (payload?.need2fa) {
      return {
        need2fa: true,
        challengeToken: String(payload.challengeToken || ''),
        method: String(payload.method || 'mobile') as 'mobile' | 'email',
        maskedAccount: String(payload.maskedAccount || ''),
        expireSeconds: Number(payload.expireSeconds || 300),
      };
    }
    const token = String(payload.token || '').trim();
    if (!token) {
      throw buildAuthError('登录失败：未获取到有效登录令牌');
    }
    return {
      token,
      user: payload.user || payload.userInfo || {},
      userInfo: payload.userInfo || payload.user || {},
    };
  },

  /**
   * 登录阶段：重新发送 2FA 验证码
   */
  sendLoginTwoFactorCode: async (challengeToken: string): Promise<any> => {
    const response = await api.post('/user/login/2fa/send', { challengeToken });
    return unwrapApiResponse<any>(response.data, {});
  },

  /**
   * 登录阶段：提交 2FA 验证码并完成登录
   */
  verifyLoginTwoFactor: async (params: { challengeToken: string; code: string }): Promise<AuthResponse> => {
    const response = await api.post('/user/login/2fa/verify', params);
    const payload = unwrapApiResponse<any>(response.data, {});
    const token = String(payload.token || '').trim();
    if (!token) {
      throw buildAuthError('登录失败：二次验证未通过');
    }
    return {
      token,
      user: payload.user || payload.userInfo || {},
      userInfo: payload.userInfo || payload.user || {},
    };
  },

  /**
   * 用户注册
   */
  register: async (params: RegisterParams): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/user/register', params);
    const payload = unwrapApiResponse<any>(response.data, {});
    const token = String(payload.token || '').trim();
    if (!token) {
      throw buildAuthError('注册失败：未获取到有效登录令牌');
    }
    return {
      token,
      user: payload.user || payload.userInfo || {},
      userInfo: payload.userInfo || payload.user || {},
    };
  },

  /**
   * 退出登录
   */
  logout: async (): Promise<void> => {
    await api.post('/user/logout');
  },

  /**
   * 获取用户信息
   */
  getProfile: async (): Promise<User> => {
    const response = await api.get<any>('/user/profile');
    const raw = response.data as Record<string, unknown>;
    const hasWrapCode = raw && typeof raw === 'object' && 'code' in raw;
    const code = hasWrapCode ? Number(raw.code || 0) : 0;
    const message = String(raw?.message || raw?.msg || '').trim();

    // likeadmin 前台未登录常见返回：{ code: 1001, message: '未登录', data: '' }
    if (hasWrapCode && code !== 1 && code !== 0 && code !== 200) {
      const authInvalid = code === 1001 || code === 332 || code === 333 || code === 403;
      throw buildAuthError(message || '获取用户信息失败', code, authInvalid);
    }

    const profile = unwrapApiResponse<User | null>(response.data, null);
    if (!profile || typeof profile !== 'object' || !Number((profile as any).id || 0)) {
      throw buildAuthError('登录已失效，请重新登录', 1001, true);
    }
    return profile;
  },

  /**
   * 更新用户信息
   */
  updateProfile: async (data: Partial<User>): Promise<User> => {
    const response = await api.post<User>('/user/profile/update', data);
    return unwrapApiResponse<User>(response.data, {} as User);
  },

  /**
   * 上传用户头像
   */
  uploadAvatar: async (file: File): Promise<{ avatar: string; user?: User }> => {
    const formData = new FormData();
    formData.append('file', file);
    /**
     * 注意：不要手动指定 multipart/form-data 头，交给浏览器自动注入 boundary。
     * 否则部分环境会出现 “头像上传失败” 的解析异常。
     */
    const response = await api.post('/user/avatar/upload', formData);
    const payload = unwrapApiResponse<any>(response.data, {});
    return {
      avatar: String(payload?.avatar || payload?.url || payload?.path || ''),
      user: (payload?.user || undefined) as User | undefined,
    };
  },

  /**
   * 修改密码
   */
  changePassword: async (params: { oldPassword?: string; newPassword: string; confirmPassword: string }): Promise<void> => {
    await api.post('/user/password/change', params);
  },

  /**
   * 获取用户统计信息
   */
  getStats: async (): Promise<any> => {
    const response = await api.post('/user/index/stats');
    return unwrapApiResponse<any>(response.data, {});
  },

  /**
   * 获取订单列表
   */
  getOrderList: async (params: { page?: number; pageSize?: number; status?: string }): Promise<any> => {
    const response = await api.post('/user/order/list', {
      ...params,
      pageNo: params.page ?? 1,
      pageSize: params.pageSize ?? 10,
    });
    return unwrapApiResponse<any>(response.data, { lists: [], total: 0, pageNo: 1, pageSize: 10 });
  },

  /**
   * 获取订单详情
   */
  getOrderDetail: async (id: number | string): Promise<any> => {
    const response = await api.post(`/user/order/detail/${id}`);
    return unwrapApiResponse<any>(response.data, {});
  },

  /**
   * 获取许可证列表
   */
  getLicenseList: async (params: { page?: number; pageSize?: number }): Promise<any> => {
    const response = await api.post('/user/license/list', {
      ...params,
      pageNo: params.page ?? 1,
      pageSize: params.pageSize ?? 10,
    });
    return unwrapApiResponse<any>(response.data, { lists: [], total: 0, pageNo: 1, pageSize: 10 });
  },

  /**
   * 提交授权绑定
   */
  bindLicenseDomain: async (params: { licenseId: number; domain: string; mobile?: string; qq?: string }): Promise<any> => {
    const response = await api.post('/user/license/bind', params);
    return unwrapApiResponse<any>(response.data, {});
  },

  /**
   * 修改授权域名
   */
  changeLicenseDomain: async (params: { licenseId: number; domain: string; mobile?: string; qq?: string }): Promise<any> => {
    const response = await api.post('/user/license/change-domain', params);
    return unwrapApiResponse<any>(response.data, {});
  },

  /**
   * 获取消息列表
   */
  getMessageList: async (params: { page?: number; pageSize?: number; isRead?: boolean }): Promise<any> => {
    const response = await api.post('/user/message/list', {
      ...params,
      pageNo: params.page ?? 1,
      pageSize: params.pageSize ?? 10,
    });
    return unwrapApiResponse<any>(response.data, { lists: [], total: 0, pageNo: 1, pageSize: 10 });
  },

  /**
   * 标记消息已读
   */
  readMessage: async (ids: number[]): Promise<void> => {
    await api.post('/user/message/read', { ids });
  },

  /**
   * 删除消息
   */
  deleteMessage: async (ids: number[]): Promise<void> => {
    await api.post('/user/message/delete', { ids });
  },

  /**
   * 获取登录日志
   */
  getLoginLog: async (params: { page?: number; pageSize?: number }): Promise<any> => {
    const response = await api.post('/user/login/log', {
      ...params,
      pageNo: params.page ?? 1,
      pageSize: params.pageSize ?? 10,
    });
    return unwrapApiResponse<any>(response.data, { lists: [], total: 0, pageNo: 1, pageSize: 10 });
  },

  /**
   * 发送绑定验证码（手机/邮箱）
   */
  sendBindCode: async (params: { type: 'bind_mobile' | 'bind_email'; account: string }): Promise<any> => {
    const response = await api.post('/user/account/send-code', params);
    return unwrapApiResponse<any>(response.data, {});
  },

  /**
   * 绑定账号（手机/邮箱）
   */
  bindAccount: async (params: { type: 'mobile' | 'email'; account: string; code: string }): Promise<any> => {
    const response = await api.post('/user/account/bind', params);
    return unwrapApiResponse<any>(response.data, {});
  },

  /**
   * 解绑账号（手机/邮箱）
   */
  unbindAccount: async (params: { type: 'mobile' | 'email' }): Promise<any> => {
    const response = await api.post('/user/account/unbind', params);
    return unwrapApiResponse<any>(response.data, {});
  },

  /**
   * 发票列表
   */
  getInvoiceList: async (params: { page?: number; pageSize?: number; status?: string }): Promise<any> => {
    const response = await api.post('/user/invoice/list', {
      ...params,
      pageNo: params.page ?? 1,
      pageSize: params.pageSize ?? 10,
    });
    return unwrapApiResponse<any>(response.data, { lists: [], total: 0, pageNo: 1, pageSize: 10 });
  },

  /**
   * 获取 2FA 状态
   */
  getTwoFactorStatus: async (): Promise<any> => {
    const response = await api.post('/user/security/2fa/status');
    return unwrapApiResponse<any>(response.data, {
      enabled: false,
      method: '',
      maskedAccount: '',
      hasMobile: false,
      hasEmail: false,
    });
  },

  /**
   * 发送 2FA 配置验证码（启用/关闭）
   */
  sendTwoFactorCode: async (params: { purpose: 'enable' | 'disable'; type?: 'mobile' | 'email' }): Promise<any> => {
    const response = await api.post('/user/security/2fa/send-code', params);
    return unwrapApiResponse<any>(response.data, {});
  },

  /**
   * 启用 2FA
   */
  enableTwoFactor: async (params: { type: 'mobile' | 'email'; password: string; code: string }): Promise<any> => {
    const response = await api.post('/user/security/2fa/enable', params);
    return unwrapApiResponse<any>(response.data, {});
  },

  /**
   * 关闭 2FA
   */
  disableTwoFactor: async (params: { password: string; code: string }): Promise<any> => {
    const response = await api.post('/user/security/2fa/disable', params);
    return unwrapApiResponse<any>(response.data, {});
  },

  /**
   * 获取活跃登录设备
   */
  getSessionList: async (): Promise<any> => {
    const response = await api.post('/user/session/list');
    return unwrapApiResponse<any>(response.data, { lists: [], total: 0 });
  },

  /**
   * 下线指定登录设备
   */
  kickSession: async (token: string): Promise<void> => {
    await api.post('/user/session/kick', { token });
  },

  /**
   * 申请发票
   */
  applyInvoice: async (params: { orderId: number; title: string; taxNo?: string; email?: string }): Promise<any> => {
    const response = await api.post('/user/invoice/apply', params);
    return unwrapApiResponse<any>(response.data, {});
  },

  /**
   * 获取作者中心详情
   */
  getAuthorCenterDetail: async (): Promise<any> => {
    const response = await api.post('/user/author/center/detail');
    return unwrapApiResponse<any>(response.data, {});
  },

  /**
   * 保存作者中心设置
   */
  saveAuthorCenter: async (data: any): Promise<void> => {
    await api.post('/user/author/center/save', data);
  },

  /**
   * 获取作者公开信息
   */
  getAuthorPublicDetail: async (authorId: number): Promise<any> => {
    const response = await api.post('/user/author/public/detail', { authorId });
    return unwrapApiResponse<any>(response.data, {});
  },

  /**
   * 获取用户收藏网址列表
   */
  getWebsiteFavoriteList: async (params: { page?: number; pageSize?: number }): Promise<any> => {
    const response = await api.post('/user/website/favorite/list', {
      ...params,
      pageNo: params.page ?? 1,
      pageSize: params.pageSize ?? 10,
    });
    return unwrapApiResponse<any>(response.data, { lists: [], total: 0, pageNo: 1, pageSize: 10 });
  },

  /**
   * 获取用户点赞网址列表
   */
  getWebsiteLikeList: async (params: { page?: number; pageSize?: number }): Promise<any> => {
    const response = await api.post('/user/website/like/list', {
      ...params,
      pageNo: params.page ?? 1,
      pageSize: params.pageSize ?? 10,
    });
    return unwrapApiResponse<any>(response.data, { lists: [], total: 0, pageNo: 1, pageSize: 10 });
  },

  /**
   * 取消收藏网址
   */
  removeWebsiteFavorite: async (websiteId: number): Promise<void> => {
    await api.delete(`/websites/${websiteId}/favorite`);
  },

  /**
   * 取消点赞网址
   */
  removeWebsiteLike: async (websiteId: number): Promise<void> => {
    await api.delete(`/websites/${websiteId}/like`);
  },

  /**
   * 获取用户文章评论列表
   */
  getArticleCommentList: async (params: { page?: number; pageSize?: number; keyword?: string; status?: string }): Promise<any> => {
    const response = await api.post('/user/article/comment/list', {
      ...params,
      pageNo: params.page ?? 1,
      pageSize: params.pageSize ?? 10,
    });
    return unwrapApiResponse<any>(response.data, { lists: [], total: 0, pageNo: 1, pageSize: 10 });
  },

  /**
   * 获取用户网址评论列表
   */
  getWebsiteCommentList: async (params: { page?: number; pageSize?: number; keyword?: string; status?: string }): Promise<any> => {
    const response = await api.post('/user/website/comment/list', {
      ...params,
      pageNo: params.page ?? 1,
      pageSize: params.pageSize ?? 10,
    });
    return unwrapApiResponse<any>(response.data, { lists: [], total: 0, pageNo: 1, pageSize: 10 });
  },

  /**
   * 删除用户文章评论
   */
  deleteArticleComment: async (commentId: number): Promise<void> => {
    await api.post('/user/article/comment/delete', { commentId });
  },

  /**
   * 删除用户网址评论
   */
  deleteWebsiteComment: async (commentId: number): Promise<void> => {
    await api.post('/user/website/comment/delete', { commentId });
  },

  /**
   * 编辑用户文章评论
   */
  updateArticleComment: async (commentId: number, content: string): Promise<any> => {
    const response = await api.post('/user/article/comment/update', { commentId, content });
    return unwrapApiResponse<any>(response.data, {});
  },

  /**
   * 编辑用户网址评论
   */
  updateWebsiteComment: async (commentId: number, content: string): Promise<any> => {
    const response = await api.post('/user/website/comment/update', { commentId, content });
    return unwrapApiResponse<any>(response.data, {});
  },

  /**
   * 回复文章评论（楼中楼）
   */
  replyArticleComment: async (params: { targetId: number; commentId: number; content: string }): Promise<any> => {
    const response = await api.post('/user/article/comment/reply', params);
    return unwrapApiResponse<any>(response.data, {});
  },

  /**
   * 回复网址评论（楼中楼）
   */
  replyWebsiteComment: async (params: { targetId: number; commentId: number; content: string }): Promise<any> => {
    const response = await api.post('/user/website/comment/reply', params);
    return unwrapApiResponse<any>(response.data, {});
  },
};

export default userService;
