/**
 * @copyright Tomda (https://www.tomda.top)
 * @copyright UIED技术团队 (https://fsuied.com)
 * @author UIED技术团队
 * @createDate 2026-02-27
 */

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../contexts/UserContext';
import { userService } from '../../services/userService';
import {
  getUserCollectedArticles,
  getUserLikedArticles,
  toggleArticleCollect,
  toggleArticleLike,
} from '../../services/articleService';
import './Profile.css';

type ActiveTab = 'profile' | 'licenses' | 'collections' | 'likes' | 'comments' | 'messages' | 'orders' | 'security';

/**
 * 兼容驼峰/下划线字段读取
 */
const pickValue = <T = any,>(obj: any, keys: string[], fallback?: T): T => {
  for (const key of keys) {
    if (obj && obj[key] !== undefined && obj[key] !== null && obj[key] !== '') {
      return obj[key] as T;
    }
  }
  return fallback as T;
};

/**
 * 统一格式化日期展示
 */
const formatUserDate = (value: any, fallback = '-') => {
  if (value === undefined || value === null || value === '') return fallback;
  if (typeof value === 'string' && /\d{4}-\d{2}-\d{2}/.test(value)) return value;
  const numericValue = Number(value);
  const timestampMs = Number.isFinite(numericValue) && numericValue > 0
    ? (numericValue < 1000000000000 ? numericValue * 1000 : numericValue)
    : Number.NaN;
  const date = Number.isFinite(timestampMs) ? new Date(timestampMs) : new Date(value);
  if (Number.isNaN(date.getTime())) return String(value || fallback);
  return date.toLocaleString();
};

/**
 * 解析个人中心文章标题（兼容平铺/嵌套两种返回结构）
 */
const resolveArticleTitle = (item: any) => {
  return pickValue(item?.article, [ 'title' ], pickValue(item, [ 'title' ], '未知文章'));
};

/**
 * 构建个人中心文章详情跳转地址（优先 slug，其次文章ID）
 */
const resolveArticleHref = (item: any) => {
  const slug = pickValue(item?.article, [ 'slug' ], pickValue(item, [ 'slug' ], ''));
  if (slug) {
    return `/article/${slug}`;
  }
  const articleId = Number(
    pickValue(item, [ 'articleId', 'article_id', 'id' ], pickValue(item?.article, [ 'id' ], 0))
  );
  return articleId > 0 ? `/article/${articleId}` : '/articles';
};

type InteractionTimeFilter = 'all' | '7d' | '30d';

/**
 * 统一把时间字段转成毫秒时间戳
 */
const resolveTimestampMs = (value: any): number => {
  if (value === undefined || value === null || value === '') return 0;
  const numericValue = Number(value);
  if (Number.isFinite(numericValue) && numericValue > 0) {
    return numericValue < 1000000000000 ? numericValue * 1000 : numericValue;
  }
  const date = new Date(value);
  const time = date.getTime();
  return Number.isNaN(time) ? 0 : time;
};

/**
 * 判断当前数据是否命中时间筛选
 */
const matchesInteractionTimeFilter = (value: any, filter: InteractionTimeFilter): boolean => {
  if (filter === 'all') return true;
  const timestamp = resolveTimestampMs(value);
  if (!timestamp) return false;
  const days = filter === '7d' ? 7 : 30;
  return Date.now() - timestamp <= days * 24 * 60 * 60 * 1000;
};

/**
 * 按业务主键合并列表，避免“加载更多”后出现重复项
 */
const mergeListByKey = (current: any[], incoming: any[], getKey: (item: any) => string): any[] => {
  const exists = new Set(current.map(item => getKey(item)));
  const next = [ ...current ];
  incoming.forEach(item => {
    const key = getKey(item);
    if (exists.has(key)) return;
    exists.add(key);
    next.push(item);
  });
  return next;
};

/**
 * 复制文本到剪贴板（带降级兜底）
 */
const copyText = async (value: string): Promise<boolean> => {
  const text = String(value || '').trim();
  if (!text) return false;
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (_error) {
    // 继续走降级分支
  }
  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(textarea);
    return ok;
  } catch (_error) {
    return false;
  }
};

/**
 * 将评论平铺列表整理为“根评论 + 回复链”结构（仅基于当前用户已有评论数据）
 */
const buildCommentThread = (list: any[]) => {
  const idSet = new Set(list.map(item => Number(item?.id || 0)).filter(Boolean));
  const childMap = new Map<number, any[]>();
  const roots: any[] = [];

  list.forEach(item => {
    const parentId = Number(item?.parentId || 0);
    if (parentId > 0 && idSet.has(parentId)) {
      const current = childMap.get(parentId) || [];
      current.push(item);
      childMap.set(parentId, current);
      return;
    }
    roots.push(item);
  });

  childMap.forEach((items, parentId) => {
    childMap.set(parentId, [ ...items ].sort((a, b) => Number(a?.id || 0) - Number(b?.id || 0)));
  });

  return { roots, childMap };
};

const ProfilePage: React.FC = () => {
  const { user, loading, isLoggedIn, refreshProfile } = useUser();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<ActiveTab>('profile');
  const [licenseFocusId, setLicenseFocusId] = useState(0);
  const [stats, setStats] = useState<{ orderCount?: number; licenseCount?: number; registerDays?: number }>({});
  const [contentStats, setContentStats] = useState<{
    websiteFavoriteTotal: number;
    websiteLikeTotal: number;
  }>({
    websiteFavoriteTotal: 0,
    websiteLikeTotal: 0,
  });

  // 如果未登录，重定向到首页
  useEffect(() => {
    if (!loading && !isLoggedIn) {
      navigate('/');
    }
  }, [loading, isLoggedIn, navigate]);

  useEffect(() => {
    if (!isLoggedIn) return;
    userService.getStats()
      .then((res) => setStats(res || {}))
      .catch(() => setStats({}));
  }, [isLoggedIn]);

  useEffect(() => {
    if (!isLoggedIn) return;
    /**
     * 拉取用户中心内容互动统计（收藏/点赞），用于首页卡片快速展示。
     */
    Promise.allSettled([
      userService.getWebsiteFavoriteList({ page: 1, pageSize: 1 }),
      userService.getWebsiteLikeList({ page: 1, pageSize: 1 }),
    ]).then(([favoriteRes, likeRes]) => {
      setContentStats({
        websiteFavoriteTotal: favoriteRes.status === 'fulfilled' ? Number(favoriteRes.value?.total || 0) : 0,
        websiteLikeTotal: likeRes.status === 'fulfilled' ? Number(likeRes.value?.total || 0) : 0,
      });
    }).catch(() => {
      setContentStats({
        websiteFavoriteTotal: 0,
        websiteLikeTotal: 0,
      });
    });
  }, [isLoggedIn]);

  if (loading || !user) {
    return <div className="loading-state">加载中...</div>;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'profile':
        return <ProfileEdit user={user} onUpdate={refreshProfile} />;
      case 'licenses':
        return <LicensesList focusLicenseId={licenseFocusId} />;
      case 'collections':
        return <CollectionsList />;
      case 'likes':
        return <LikesList />;
      case 'comments':
        return <CommentsList />;
      case 'messages':
        return (
          <MessagesList
            onOpenLicenses={(licenseId?: number) => {
              setLicenseFocusId(Number(licenseId || 0));
              setActiveTab('licenses');
            }}
          />
        );
      case 'orders':
        return <OrdersList />;
      case 'security':
        return <SecuritySettings user={user} onUpdate={refreshProfile} />;
      default:
        return null;
    }
  };

  return (
    <div className="profile-page">
      <div className="profile-container">
        {/* 侧边栏 */}
        <div className="profile-sidebar">
          <div className="user-card">
            <div className="user-avatar-large">
              {user.avatar ? (
                <img src={user.avatar} alt={user.nickname || user.username || '用户头像'} />
              ) : (
                (user.nickname || user.username || 'U').charAt(0).toUpperCase()
              )}
            </div>
            <div className="user-name-large">{user.nickname || user.username}</div>
            <div className="user-type-badge">
              {user.levelName ? `${user.levelName} · ` : ''}{user.userTypeName || '普通用户'}
            </div>
            <div className="user-card-meta">
              <span>注册 {formatUserDate(user.createTime, '未知')}</span>
              <span>最近登录 {formatUserDate(user.lastLoginTime, '未知')}</span>
            </div>
            <div className="user-card-stats">
              <div className="user-card-stat">
                <div className="user-card-stat__value">{Number(stats.orderCount || 0)}</div>
                <div className="user-card-stat__label">订单</div>
              </div>
              <div className="user-card-stat">
                <div className="user-card-stat__value">{Number(stats.licenseCount || 0)}</div>
                <div className="user-card-stat__label">授权</div>
              </div>
              <div className="user-card-stat">
                <div className="user-card-stat__value">{Number(stats.registerDays || 0)}</div>
                <div className="user-card-stat__label">注册天数</div>
              </div>
              <div className="user-card-stat">
                <div className="user-card-stat__value">{Number(contentStats.websiteFavoriteTotal || 0)}</div>
                <div className="user-card-stat__label">网站收藏</div>
              </div>
              <div className="user-card-stat">
                <div className="user-card-stat__value">{Number(contentStats.websiteLikeTotal || 0)}</div>
                <div className="user-card-stat__label">网站点赞</div>
              </div>
            </div>
          </div>
          
          <div className="profile-menu">
            <div 
              className={`menu-item ${activeTab === 'profile' ? 'active' : ''}`}
              onClick={() => setActiveTab('profile')}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              个人资料
            </div>
            <div 
              className={`menu-item ${activeTab === 'messages' ? 'active' : ''}`}
              onClick={() => setActiveTab('messages')}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              </svg>
              我的消息
            </div>
            <div 
              className={`menu-item ${activeTab === 'orders' ? 'active' : ''}`}
              onClick={() => setActiveTab('orders')}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <path d="M16 10a4 4 0 0 1-8 0"></path>
              </svg>
              我的订单
            </div>
            <div 
              className={`menu-item ${activeTab === 'licenses' ? 'active' : ''}`}
              onClick={() => setActiveTab('licenses')}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 7h16v10H4z"></path>
                <path d="M8 7V5h8v2"></path>
                <path d="M8 12h8"></path>
              </svg>
              我的授权
            </div>
            <div 
              className={`menu-item ${activeTab === 'collections' ? 'active' : ''}`}
              onClick={() => setActiveTab('collections')}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
              </svg>
              我的收藏
            </div>
            <div 
              className={`menu-item ${activeTab === 'likes' ? 'active' : ''}`}
              onClick={() => setActiveTab('likes')}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
              </svg>
              我的点赞
            </div>
            <div 
              className={`menu-item ${activeTab === 'comments' ? 'active' : ''}`}
              onClick={() => setActiveTab('comments')}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              </svg>
              我的评论
            </div>
            <div 
              className={`menu-item ${activeTab === 'security' ? 'active' : ''}`}
              onClick={() => setActiveTab('security')}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
              账号安全
            </div>
          </div>
        </div>

        {/* 内容区域 */}
        <div className="profile-content">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

// 子组件：个人资料编辑
const ProfileEdit: React.FC<{ user: any; onUpdate: () => Promise<void> | void }> = ({ user, onUpdate }) => {
  const [formData, setFormData] = useState({
    nickname: user.nickname || '',
    email: user.email || '',
    mobile: user.mobile || '',
    avatar: user.avatar || ''
  });
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [message, setMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await userService.updateProfile(formData);
      setMessage('保存成功');
      onUpdate();
      setTimeout(() => setMessage(''), 2000);
    } catch (err) {
      setMessage('保存失败，请重试');
    } finally {
      setSaving(false);
    }
  };

  /**
   * 触发头像文件选择
   */
  const handleChooseAvatar = () => {
    fileInputRef.current?.click();
  };

  /**
   * 上传头像并同步到用户资料
   */
  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setMessage('仅支持上传图片格式');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setMessage('头像大小不能超过 5MB');
      return;
    }

    setUploadingAvatar(true);
    try {
      const uploadRes = await userService.uploadAvatar(file);
      const avatar = String(uploadRes.avatar || '').trim();
      if (!avatar) {
        throw new Error('头像上传失败');
      }
      setFormData(prev => ({ ...prev, avatar }));
      setMessage('头像上传成功');
      await onUpdate();
      setTimeout(() => setMessage(''), 2000);
    } catch (error) {
      setMessage('头像上传失败，请稍后重试');
    } finally {
      setUploadingAvatar(false);
    }
  };

  return (
    <div>
      <div className="content-header">
        <h2 className="content-title">个人资料</h2>
      </div>
      
      <div className="profile-info-grid">
        <div className="info-card">
          <div className="info-label">用户ID</div>
          <div className="info-value">#{user.id}</div>
        </div>
        <div className="info-card">
          <div className="info-label">注册时间</div>
          <div className="info-value">{formatUserDate(user.createTime, '未知')}</div>
        </div>
        <div className="info-card">
          <div className="info-label">注册来源</div>
          <div className="info-value">{user.channelName || '未知'}</div>
        </div>
        <div className="info-card">
          <div className="info-label">最后登录</div>
          <div className="info-value">{formatUserDate(user.lastLoginTime, '未知')}</div>
        </div>
      </div>

      <div className="content-header" style={{ marginTop: 32 }}>
        <h2 className="content-title">编辑资料</h2>
      </div>

      <form className="profile-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label>头像</label>
          <div className="profile-avatar-editor">
            <div className="profile-avatar-editor__preview">
              {formData.avatar ? (
                <img src={formData.avatar} alt="用户头像" />
              ) : (
                <span>{(user.nickname || user.username || 'U').charAt(0).toUpperCase()}</span>
              )}
            </div>
            <div className="profile-avatar-editor__actions">
              <button type="button" className="avatar-upload-btn" onClick={handleChooseAvatar} disabled={uploadingAvatar}>
                {uploadingAvatar ? '上传中...' : '上传头像'}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleAvatarUpload}
              />
              <input
                type="text"
                value={formData.avatar}
                onChange={e => setFormData({ ...formData, avatar: e.target.value })}
                placeholder="或粘贴头像图片地址"
              />
            </div>
          </div>
          <div className="form-tip">支持 JPG/PNG/WEBP，建议 400x400，大小不超过 5MB</div>
        </div>
        <div className="form-group">
          <label>昵称</label>
          <input 
            type="text" 
            value={formData.nickname}
            onChange={e => setFormData({...formData, nickname: e.target.value})}
            placeholder="请输入昵称"
          />
        </div>
        <div className="form-group">
          <label>邮箱</label>
          <input 
            type="email" 
            value={formData.email}
            onChange={e => setFormData({...formData, email: e.target.value})}
            placeholder="绑定邮箱"
          />
        </div>
        <div className="form-group">
          <label>手机号</label>
          <div className="input-with-action">
            <input 
              type="text" 
              value={user.mobileMask || formData.mobile || ''}
              readOnly
              className="readonly-input"
              placeholder="未绑定手机号"
            />
            {/* <button type="button" className="action-btn">更换</button> */}
          </div>
          <div className="form-tip">为了账号安全，修改手机号请联系客服</div>
        </div>
        
        {user.sexName && (
          <div className="form-group">
            <label>性别</label>
            <input 
              type="text" 
              value={user.sexName}
              readOnly
              className="readonly-input"
            />
          </div>
        )}
        
        {message && <div style={{ color: message.includes('失败') ? 'red' : 'green', marginBottom: 16 }}>{message}</div>}
        
        <button type="submit" className="save-btn" disabled={saving}>
          {saving ? '保存中...' : '保存修改'}
        </button>
      </form>
    </div>
  );
};

// 子组件：消息列表
const MessagesList: React.FC<{ onOpenLicenses: (licenseId?: number) => void }> = ({ onOpenLicenses }) => {
  type MessageFilterType = 'all' | 'unread' | 'read';
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<MessageFilterType>('all');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState('');

  /**
   * 拉取用户消息列表
   */
  const fetchMessages = () => {
    setLoading(true);
    userService.getMessageList({ page: 1, pageSize: 20 })
      .then(res => setList(res.lists || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  /**
   * 标记单条消息为已读
   */
  const handleRead = async (id: number) => {
    setActionLoading(true);
    setActionMessage('');
    try {
      await userService.readMessage([id]);
      // 更新本地状态
      setList(prev =>
        prev.map(item =>
          item.id === id ? { ...item, is_read: 1, isRead: 1 } : item
        )
      );
      setActionMessage('消息已标记为已读');
    } catch (_error) {
      setActionMessage('标记已读失败，请稍后重试');
    } finally {
      setActionLoading(false);
    }
  };

  /**
   * 删除单条消息
   */
  const handleDelete = async (id: number) => {
    if (!window.confirm('确定删除该消息吗？')) return;
    setActionLoading(true);
    setActionMessage('');
    try {
      await userService.deleteMessage([id]);
      setList(prev => prev.filter(item => item.id !== id));
      setActionMessage('消息已删除');
    } catch (_error) {
      setActionMessage('删除消息失败，请稍后重试');
    } finally {
      setActionLoading(false);
    }
  };

  /**
   * 一键将全部未读消息标记为已读
   */
  const handleReadAll = async () => {
    const unreadCount = list.filter(item => !Number(pickValue(item, [ 'isRead', 'is_read' ], 0))).length;
    if (unreadCount === 0) {
      setActionMessage('当前没有未读消息');
      return;
    }
    setActionLoading(true);
    setActionMessage('');
    try {
      await userService.readMessage([]);
      setList(prev => prev.map(item => ({ ...item, is_read: 1, isRead: 1 })));
      setActionMessage(`已标记 ${unreadCount} 条消息为已读`);
    } catch (_error) {
      setActionMessage('批量标记已读失败，请稍后重试');
    } finally {
      setActionLoading(false);
    }
  };

  /**
   * 清空所有已读消息
   */
  const handleDeleteRead = async () => {
    const ids = list
      .filter(item => Number(pickValue(item, [ 'isRead', 'is_read' ], 0)))
      .map(item => Number(item.id || 0))
      .filter(Boolean);
    if (ids.length === 0) {
      setActionMessage('当前没有可清理的已读消息');
      return;
    }
    if (!window.confirm(`确定清空 ${ids.length} 条已读消息吗？`)) return;
    setActionLoading(true);
    setActionMessage('');
    try {
      await userService.deleteMessage(ids);
      setList(prev => prev.filter(item => !ids.includes(Number(item.id || 0))));
      setActionMessage(`已清空 ${ids.length} 条已读消息`);
    } catch (_error) {
      setActionMessage('清空已读消息失败，请稍后重试');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <div>加载中...</div>;
  const unreadCount = list.filter(item => !Number(pickValue(item, [ 'isRead', 'is_read' ], 0))).length;
  const readCount = list.length - unreadCount;
  const filteredList = list.filter(item => {
    const isRead = Boolean(Number(pickValue(item, [ 'isRead', 'is_read' ], 0)));
    if (activeFilter === 'unread') return !isRead;
    if (activeFilter === 'read') return isRead;
    return true;
  });

  /**
   * 判断当前消息是否可以跳转到“我的授权”
   */
  const canOpenLicenseDetail = (item: any) => {
    const type = String(item?.type || '').trim();
    return type === 'license_domain_audit' || type === 'license_audit';
  };

  /**
   * 从消息扩展字段中提取授权ID
   */
  const resolveMessageLicenseId = (item: any) => {
    const extra = item?.extra && typeof item.extra === 'object' ? item.extra : {};
    return Number(extra.licenseId || extra.license_id || 0);
  };

  return (
    <div>
      <div className="content-header">
        <h2 className="content-title">我的消息</h2>
      </div>
      {actionMessage && (
        <div className={`profile-action-message ${actionMessage.includes('失败') ? 'is-error' : 'is-success'}`}>
          {actionMessage}
        </div>
      )}
      <div className="profile-type-tabs" role="tablist" aria-label="消息筛选">
        <button
          type="button"
          className={`profile-type-tab ${activeFilter === 'all' ? 'is-active' : ''}`}
          onClick={() => setActiveFilter('all')}
        >
          全部 ({list.length})
        </button>
        <button
          type="button"
          className={`profile-type-tab ${activeFilter === 'unread' ? 'is-active' : ''}`}
          onClick={() => setActiveFilter('unread')}
        >
          未读 ({unreadCount})
        </button>
        <button
          type="button"
          className={`profile-type-tab ${activeFilter === 'read' ? 'is-active' : ''}`}
          onClick={() => setActiveFilter('read')}
        >
          已读 ({readCount})
        </button>
      </div>
      <div className="profile-toolbar">
        <button type="button" className="action-btn" disabled={actionLoading} onClick={handleReadAll}>
          {actionLoading ? '处理中...' : '全部已读'}
        </button>
        <button type="button" className="action-btn action-btn--danger" disabled={actionLoading} onClick={handleDeleteRead}>
          清空已读
        </button>
      </div>
      {filteredList.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">消息</span>
          {activeFilter === 'all' ? '暂无消息' : '当前筛选下暂无消息'}
        </div>
      ) : (
        <div className="collections-list">
          {filteredList.map(item => (
            <div
              key={item.id}
              className="list-item list-item--rich"
              style={{ opacity: Number(pickValue(item, ['isRead', 'is_read'], 0)) ? 0.6 : 1 }}
            >
              <div className="item-main">
                <div className="item-title">{item.title}</div>
                <div className="item-meta" style={{ marginTop: 4 }}>
                  {item.content}
                </div>
                <div className="item-meta" style={{ marginTop: 8 }}>
                  <span>{formatUserDate(pickValue(item, ['createTime', 'create_time']))}</span>
                  {!Number(pickValue(item, ['isRead', 'is_read'], 0)) && (
                    <span
                      className="inline-action inline-action--primary"
                      onClick={() => !actionLoading && handleRead(item.id)}
                    >
                      标记已读
                    </span>
                  )}
                  {canOpenLicenseDetail(item) && (
                    <span
                      className="inline-action inline-action--primary"
                      onClick={() => !actionLoading && onOpenLicenses(resolveMessageLicenseId(item) || undefined)}
                    >
                      查看授权
                    </span>
                  )}
                  <span
                    className="inline-action inline-action--danger"
                    onClick={() => !actionLoading && handleDelete(item.id)}
                  >
                    删除
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// 子组件：订单列表
const OrdersList: React.FC = () => {
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [moduleEnabled, setModuleEnabled] = useState(true);
  const [moduleMessage, setModuleMessage] = useState('');
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [invoiceItems, setInvoiceItems] = useState<any[]>([]);
  const [detailMessage, setDetailMessage] = useState('');
  const [invoiceSubmitting, setInvoiceSubmitting] = useState(false);
  const [licenseSubmittingId, setLicenseSubmittingId] = useState(0);
  const [licenseForms, setLicenseForms] = useState<Record<number, { domain: string; mobile: string; qq: string }>>({});
  const [invoiceForm, setInvoiceForm] = useState({
    title: '',
    taxNo: '',
    email: '',
  });

  useEffect(() => {
    userService.getOrderList({ page: 1, pageSize: 20 })
      .then(res => {
        setList(res.lists || []);
        setModuleEnabled(res.moduleEnabled !== false);
        setModuleMessage(String(res.moduleMessage || ''));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  /**
   * 打开订单详情抽屉，并并行拉取订单详情与发票信息
   */
  const handleOpenOrderDetail = async (orderId: number) => {
    if (!orderId) return;
    setDetailVisible(true);
    setDetailLoading(true);
    setDetailMessage('');
    try {
      const [ detailRes, invoiceRes ] = await Promise.allSettled([
        userService.getOrderDetail(orderId),
        userService.getInvoiceList({ page: 1, pageSize: 50 }),
      ]);
      const orderDetail = detailRes.status === 'fulfilled' ? detailRes.value : null;
      const invoiceList = invoiceRes.status === 'fulfilled'
        ? (Array.isArray(invoiceRes.value?.lists) ? invoiceRes.value.lists : [])
        : [];
      setSelectedOrder(orderDetail);
      setInvoiceItems(invoiceList.filter((item: any) => Number(item.orderId || 0) === Number(orderId)));
      const nextLicenseForms: Record<number, { domain: string; mobile: string; qq: string }> = {};
      (Array.isArray(orderDetail?.licenseList) ? orderDetail.licenseList : []).forEach((item: any) => {
        const id = Number(item?.id || 0);
        if (!id) return;
        nextLicenseForms[id] = {
          domain: String(item?.domain || ''),
          mobile: String(item?.mobile || ''),
          qq: String(item?.qq || ''),
        };
      });
      setLicenseForms(nextLicenseForms);
      setInvoiceForm({
        title: String(pickValue(orderDetail, [ 'invoiceTitle' ], '')),
        taxNo: '',
        email: String(pickValue(orderDetail, [ 'email', 'userEmail' ], '')),
      });
    } catch (error) {
      setSelectedOrder(null);
      setInvoiceItems([]);
      setLicenseForms({});
      setInvoiceForm({ title: '', taxNo: '', email: '' });
    } finally {
      setDetailLoading(false);
    }
  };

  /**
   * 关闭订单详情抽屉并重置数据
   */
  const handleCloseOrderDetail = () => {
    setDetailVisible(false);
    setSelectedOrder(null);
    setInvoiceItems([]);
    setDetailMessage('');
    setLicenseSubmittingId(0);
    setLicenseForms({});
    setInvoiceForm({ title: '', taxNo: '', email: '' });
  };

  /**
   * 统一订单状态展示
   */
  const resolveOrderStatus = (source: any) => {
    const statusValue = Number(pickValue(source, [ 'status', 'payStatus', 'pay_status', 'orderStatus', 'order_status' ], 0));
    const normalizedStatus = statusValue === 2 ? 2 : (statusValue === 1 ? 1 : 0);
    return {
      normalizedStatus,
      label: normalizedStatus === 2 ? '已取消' : (normalizedStatus === 1 ? '已支付' : '待支付'),
    };
  };

  /**
   * 统一发票状态展示
   */
  const resolveInvoiceStatusLabel = (status: any) => {
    const value = Number(status);
    if (value === 1) return '已开票';
    if (value === 2) return '开票失败';
    if (value === 3) return '已驳回';
    if (value === 0) return '处理中';
    return '未申请';
  };

  /**
   * 统一授权状态展示
   */
  const resolveLicenseStatusLabel = (license: any) => {
    const expireTime = Number(license?.expireTime || 0);
    const now = Date.now();
    if (expireTime > 0 && expireTime * 1000 < now) return '已过期';
    const status = Number(license?.status || 0);
    const auditStatus = Number(license?.auditStatus ?? 1);
    if (auditStatus === 0) return '待审核';
    if (auditStatus === 2) return '审核驳回';
    return status === 1 ? '有效' : '未激活';
  };

  /**
   * 判断当前订单是否允许申请发票
   */
  const canApplyInvoice = () => {
    if (!selectedOrder || !detailVisible) return false;
    if (invoiceItems.length === 0) return true;
    return invoiceItems.some(item => Number(item.status) === 3);
  };

  /**
   * 提交发票申请
   */
  const handleSubmitInvoice = async () => {
    if (!selectedOrder) return;
    if (!invoiceForm.title.trim()) {
      setDetailMessage('请填写发票抬头');
      return;
    }
    setInvoiceSubmitting(true);
    setDetailMessage('');
    try {
      await userService.applyInvoice({
        orderId: Number(selectedOrder.id || 0),
        title: invoiceForm.title.trim(),
        taxNo: invoiceForm.taxNo.trim(),
        email: invoiceForm.email.trim(),
      });
      const invoiceRes = await userService.getInvoiceList({ page: 1, pageSize: 50 });
      const invoiceList = Array.isArray(invoiceRes?.lists) ? invoiceRes.lists : [];
      setInvoiceItems(invoiceList.filter((item: any) => Number(item.orderId || 0) === Number(selectedOrder.id || 0)));
      setDetailMessage('发票申请已提交');
    } catch (error: any) {
      setDetailMessage(error?.message || '发票申请失败，请稍后重试');
    } finally {
      setInvoiceSubmitting(false);
    }
  };

  /**
   * 复制授权码
   */
  const handleCopyLicenseKey = async (licenseKey: string) => {
    const success = await copyText(licenseKey);
    setDetailMessage(success ? '授权码已复制' : '复制失败，请手动复制');
  };

  /**
   * 打开交付链接（下载/发票）
   */
  const handleOpenDeliveryLink = (url: string) => {
    const targetUrl = String(url || '').trim();
    if (!targetUrl) {
      setDetailMessage('当前记录暂未提供下载链接');
      return;
    }
    window.open(targetUrl, '_blank', 'noopener,noreferrer');
  };

  /**
   * 更新授权表单字段
   */
  const handleLicenseFormChange = (licenseId: number, field: 'domain' | 'mobile' | 'qq', value: string) => {
    setLicenseForms(prev => ({
      ...prev,
      [licenseId]: {
        domain: String(prev[licenseId]?.domain || ''),
        mobile: String(prev[licenseId]?.mobile || ''),
        qq: String(prev[licenseId]?.qq || ''),
        [field]: value,
      },
    }));
  };

  /**
   * 提交授权域名绑定/变更
   */
  const handleSubmitLicenseBinding = async (license: any) => {
    const licenseId = Number(license?.id || 0);
    if (!licenseId) return;
    const form = licenseForms[licenseId] || {
      domain: String(license?.domain || ''),
      mobile: String(license?.mobile || ''),
      qq: String(license?.qq || ''),
    };
    if (!String(form.domain || '').trim()) {
      setDetailMessage('请先填写域名');
      return;
    }
    setLicenseSubmittingId(licenseId);
    setDetailMessage('');
    try {
      const hasBound = Boolean(String(license?.domain || '').trim()) || Number(license?.bindCount || 0) > 0;
      if (hasBound) {
        await userService.changeLicenseDomain({
          licenseId,
          domain: form.domain,
          mobile: form.mobile,
          qq: form.qq,
        });
      } else {
        await userService.bindLicenseDomain({
          licenseId,
          domain: form.domain,
          mobile: form.mobile,
          qq: form.qq,
        });
      }
      setSelectedOrder((prev: any) => {
        if (!prev) return prev;
        const nextLicenses = Array.isArray(prev.licenseList) ? prev.licenseList.map((item: any) => {
          if (Number(item?.id || 0) !== licenseId) return item;
          return {
            ...item,
            domain: form.domain,
            mobile: form.mobile,
            qq: form.qq,
            auditStatus: 0,
          };
        }) : [];
        return {
          ...prev,
          licenseList: nextLicenses,
        };
      });
      setDetailMessage(hasBound ? '域名变更已提交，等待审核' : '域名绑定已提交，等待审核');
    } catch (error: any) {
      setDetailMessage(error?.message || '域名绑定失败，请稍后重试');
    } finally {
      setLicenseSubmittingId(0);
    }
  };

  if (loading) return <div>加载中...</div>;

  return (
    <div>
      <div className="content-header">
        <h2 className="content-title">我的订单</h2>
      </div>
      {!moduleEnabled && (
        <div className="empty-state">
          <span className="empty-icon">提示</span>
          {moduleMessage || '当前版本暂未启用订单系统'}
        </div>
      )}
      {moduleEnabled && list.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">订单</span>
          暂无订单记录
        </div>
      ) : moduleEnabled ? (
        <div className="collections-list">
          {list.map(item => {
            const statusValue = Number(pickValue(item, [ 'status', 'payStatus', 'pay_status' ], 0));
            const normalizedStatus = statusValue === 2 ? 2 : (statusValue === 1 ? 1 : 0);
            return (
              <div key={item.id} className="list-item">
                <div className="item-main">
                  <div className="item-title">
                    {pickValue(item, [ 'orderNo', 'orderSn', 'order_sn' ], '-')}
                    <span className={`status-badge status-${normalizedStatus}`}>
                      {normalizedStatus === 2 ? '已取消' : (normalizedStatus === 1 ? '已支付' : '待支付')}
                    </span>
                  </div>
                  <div className="item-meta">
                    <span>{pickValue(item, [ 'productName', 'goodsName', 'goods_name' ], '商品')}</span>
                    <span>¥{pickValue(item, [ 'amount', 'orderAmount', 'order_amount' ], 0)}</span>
                  </div>
                  <div className="item-meta">
                    <span>{formatUserDate(pickValue(item, [ 'createTime', 'create_time' ]))}</span>
                  </div>
                </div>
                <div className="item-action">
                  <button
                    type="button"
                    className="action-btn"
                    onClick={() => handleOpenOrderDetail(Number(item.id || 0))}
                  >
                    查看详情
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : null}
      {detailVisible && (
        <div className="profile-drawer-mask" onClick={handleCloseOrderDetail}>
          <div className="profile-drawer" onClick={event => event.stopPropagation()}>
            <div className="profile-drawer__header">
              <h3>订单详情</h3>
              <button type="button" className="profile-drawer__close" onClick={handleCloseOrderDetail}>×</button>
            </div>
            {detailLoading && <div className="profile-drawer__loading">详情加载中...</div>}
            {!detailLoading && !selectedOrder && <div className="profile-drawer__loading">订单详情加载失败，请重试</div>}
            {!detailLoading && selectedOrder && (
              <div className="profile-drawer__body">
                {detailMessage && (
                  <div className={`profile-action-message ${detailMessage.includes('失败') ? 'is-error' : 'is-success'}`}>
                    {detailMessage}
                  </div>
                )}
                <div className="order-detail-grid">
                  <div className="order-detail-item">
                    <span className="label">订单号</span>
                    <span>{pickValue(selectedOrder, [ 'orderNo', 'orderSn', 'order_sn' ], '-')}</span>
                  </div>
                  <div className="order-detail-item">
                    <span className="label">订单状态</span>
                    <span className={`status-badge status-${resolveOrderStatus(selectedOrder).normalizedStatus}`}>
                      {resolveOrderStatus(selectedOrder).label}
                    </span>
                  </div>
                  <div className="order-detail-item">
                    <span className="label">商品名称</span>
                    <span>{pickValue(selectedOrder, [ 'productName', 'goodsName', 'goods_name' ], '-')}</span>
                  </div>
                  <div className="order-detail-item">
                    <span className="label">授权版本</span>
                    <span>{pickValue(selectedOrder, [ 'productVersion', 'version' ], '标准版')}</span>
                  </div>
                  <div className="order-detail-item">
                    <span className="label">支付金额</span>
                    <span>¥{pickValue(selectedOrder, [ 'amount', 'price' ], '0.00')}</span>
                  </div>
                  <div className="order-detail-item">
                    <span className="label">下单时间</span>
                    <span>{formatUserDate(pickValue(selectedOrder, [ 'createTime', 'create_time' ]))}</span>
                  </div>
                  <div className="order-detail-item">
                    <span className="label">发票状态</span>
                    <span>{resolveInvoiceStatusLabel(pickValue(selectedOrder, [ 'invoiceStatus' ], -1))}</span>
                  </div>
                </div>
                <div className="order-detail-section">
                  <div className="order-detail-section__title">授权码</div>
                  {Array.isArray(selectedOrder.licenseList) && selectedOrder.licenseList.length > 0 ? (
                    <div className="order-detail-license-list">
                      {selectedOrder.licenseList.map((license: any) => (
                        <div className="order-detail-license-item" key={`license-${license.id}`}>
                          <div className="key">{license.key || '-'}</div>
                          <div className="meta">
                            <span>域名：{license.domain || '未绑定'}</span>
                            <span>绑定：{Number(license.bindCount || 0)}/{Number(license.bindLimit || 1)}</span>
                            <span>状态：{resolveLicenseStatusLabel(license)}</span>
                            {Number(license.expireTime || 0) > 0 && (
                              <span>到期：{formatUserDate(Number(license.expireTime || 0))}</span>
                            )}
                          </div>
                          <div className="order-detail-form">
                            <input
                              type="text"
                              value={String(licenseForms[Number(license.id || 0)]?.domain || '')}
                              onChange={event => handleLicenseFormChange(Number(license.id || 0), 'domain', event.target.value)}
                              placeholder="绑定域名（必填）"
                            />
                            <input
                              type="text"
                              value={String(licenseForms[Number(license.id || 0)]?.mobile || '')}
                              onChange={event => handleLicenseFormChange(Number(license.id || 0), 'mobile', event.target.value)}
                              placeholder="联系手机（选填）"
                            />
                            <input
                              type="text"
                              value={String(licenseForms[Number(license.id || 0)]?.qq || '')}
                              onChange={event => handleLicenseFormChange(Number(license.id || 0), 'qq', event.target.value)}
                              placeholder="联系 QQ（选填）"
                            />
                          </div>
                          <div className="order-detail-license-item__actions">
                            <button
                              type="button"
                              className="action-btn"
                              onClick={() => handleCopyLicenseKey(String(license.key || ''))}
                            >
                              复制授权码
                            </button>
                            <button
                              type="button"
                              className="action-btn"
                              disabled={licenseSubmittingId === Number(license.id || 0)}
                              onClick={() => handleSubmitLicenseBinding(license)}
                            >
                              {licenseSubmittingId === Number(license.id || 0)
                                ? '提交中...'
                                : (String(license.domain || '').trim() ? '变更域名' : '绑定域名')}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="profile-inline-empty">暂无授权码信息</div>
                  )}
                </div>
                <div className="order-detail-section">
                  <div className="order-detail-section__title">发票记录</div>
                  {pickValue(selectedOrder, [ 'invoiceUrl' ]) && (
                    <div className="profile-toolbar">
                      <button
                        type="button"
                        className="action-btn"
                        onClick={() => handleOpenDeliveryLink(String(pickValue(selectedOrder, [ 'invoiceUrl' ], '')))}
                      >
                        下载已开票文件
                      </button>
                    </div>
                  )}
                  {invoiceItems.length > 0 ? (
                    <div className="order-detail-license-list">
                      {invoiceItems.map(item => (
                        <div className="order-detail-license-item" key={`invoice-${item.id}`}>
                          <div className="key">{pickValue(item, [ 'title' ], '普通发票')}</div>
                          <div className="meta">
                            <span>状态：{resolveInvoiceStatusLabel(pickValue(item, [ 'status' ], -1))}</span>
                            <span>申请时间：{formatUserDate(pickValue(item, [ 'createTime', 'create_time' ]))}</span>
                            {pickValue(item, [ 'email' ]) && <span>邮箱：{pickValue(item, [ 'email' ])}</span>}
                            {pickValue(item, [ 'taxNo' ]) && <span>税号：{pickValue(item, [ 'taxNo' ])}</span>}
                            {Number(pickValue(item, [ 'status' ], -1)) === 3 && pickValue(item, [ 'rejectReason' ]) && (
                              <span>驳回原因：{pickValue(item, [ 'rejectReason' ])}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="profile-inline-empty">暂无发票记录</div>
                  )}
                </div>
                {canApplyInvoice() && (
                  <div className="order-detail-section">
                    <div className="order-detail-section__title">申请发票</div>
                    <div className="order-detail-form">
                      <input
                        type="text"
                        value={invoiceForm.title}
                        onChange={event => setInvoiceForm(prev => ({ ...prev, title: event.target.value }))}
                        placeholder="发票抬头（必填）"
                      />
                      <input
                        type="text"
                        value={invoiceForm.taxNo}
                        onChange={event => setInvoiceForm(prev => ({ ...prev, taxNo: event.target.value }))}
                        placeholder="税号（选填）"
                      />
                      <input
                        type="text"
                        value={invoiceForm.email}
                        onChange={event => setInvoiceForm(prev => ({ ...prev, email: event.target.value }))}
                        placeholder="接收邮箱（选填）"
                      />
                      <div className="security-action-row">
                        <button
                          type="button"
                          className="save-btn"
                          disabled={invoiceSubmitting}
                          onClick={handleSubmitInvoice}
                        >
                          {invoiceSubmitting ? '提交中...' : '提交申请'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                <div className="order-detail-section">
                  <div className="order-detail-section__title">下载记录</div>
                  {Array.isArray(selectedOrder.downloadRecords) && selectedOrder.downloadRecords.length > 0 ? (
                    <div className="order-detail-license-list">
                      {selectedOrder.downloadRecords.map((record: any, index: number) => (
                        <div className="order-detail-license-item" key={`download-${index}`}>
                          <div className="key">{String(record.fileName || record.name || '安装包下载')}</div>
                          <div className="meta">
                            <span>时间：{formatUserDate(record.time || record.createTime || record.createdAt)}</span>
                            <span>来源：{String(record.channel || record.ip || '网页下载')}</span>
                          </div>
                          <div className="order-detail-license-item__actions">
                            <button
                              type="button"
                              className="action-btn"
                              onClick={() => handleOpenDeliveryLink(String(
                                record.url || record.fileUrl || record.downloadUrl || record.download_url || ''
                              ))}
                            >
                              下载文件
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="profile-inline-empty">暂无下载记录</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// 子组件：授权列表
const LicensesList: React.FC<{ focusLicenseId?: number }> = ({ focusLicenseId = 0 }) => {
  type LicenseFilterType = 'all' | 'valid' | 'pending' | 'expired';
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<LicenseFilterType>('all');
  const [actionMessage, setActionMessage] = useState('');
  const [submittingId, setSubmittingId] = useState(0);
  const [licenseForms, setLicenseForms] = useState<Record<number, { domain: string; mobile: string; qq: string }>>({});

  /**
   * 拉取授权列表
   */
  const loadLicenses = async () => {
    setLoading(true);
    try {
      const res = await userService.getLicenseList({ page: 1, pageSize: 20 });
      const nextList = Array.isArray(res?.lists) ? res.lists : [];
      setList(nextList);
      const nextForms: Record<number, { domain: string; mobile: string; qq: string }> = {};
      nextList.forEach((item: any) => {
        const licenseId = Number(item?.id || 0);
        if (!licenseId) return;
        nextForms[licenseId] = {
          domain: String(item?.domain || ''),
          mobile: String(item?.mobile || ''),
          qq: String(item?.qq || ''),
        };
      });
      setLicenseForms(nextForms);
    } catch (_error) {
      setList([]);
      setLicenseForms({});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLicenses().catch(() => {});
  }, []);

  useEffect(() => {
    if (!focusLicenseId || list.length === 0) return;
    const matched = list.find(item => Number(item?.id || 0) === Number(focusLicenseId));
    if (!matched) return;
    const timer = window.setTimeout(() => {
      document.getElementById(`profile-license-${focusLicenseId}`)?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }, 80);
    return () => window.clearTimeout(timer);
  }, [focusLicenseId, list]);

  /**
   * 统一授权状态展示
   */
  const resolveLicenseStatusLabel = (license: any) => {
    const expireTime = Number(license?.expireTime || 0);
    const now = Date.now();
    if (expireTime > 0 && expireTime * 1000 < now) return '已过期';
    const status = Number(license?.status || 0);
    const auditStatus = Number(license?.auditStatus ?? 1);
    if (auditStatus === 0) return '待审核';
    if (auditStatus === 2) return '审核驳回';
    return status === 1 ? '有效' : '未激活';
  };

  /**
   * 更新授权表单字段
   */
  const handleLicenseFormChange = (licenseId: number, field: 'domain' | 'mobile' | 'qq', value: string) => {
    setLicenseForms(prev => ({
      ...prev,
      [licenseId]: {
        domain: String(prev[licenseId]?.domain || ''),
        mobile: String(prev[licenseId]?.mobile || ''),
        qq: String(prev[licenseId]?.qq || ''),
        [field]: value,
      },
    }));
  };

  /**
   * 复制授权码
   */
  const handleCopyLicenseKey = async (licenseKey: string) => {
    const success = await copyText(licenseKey);
    setActionMessage(success ? '授权码已复制' : '复制失败，请手动复制');
  };

  /**
   * 提交授权域名绑定/变更
   */
  const handleSubmitLicenseBinding = async (license: any) => {
    const licenseId = Number(license?.id || 0);
    if (!licenseId) return;
    const form = licenseForms[licenseId] || {
      domain: String(license?.domain || ''),
      mobile: String(license?.mobile || ''),
      qq: String(license?.qq || ''),
    };
    if (!String(form.domain || '').trim()) {
      setActionMessage('请先填写域名');
      return;
    }
    setSubmittingId(licenseId);
    setActionMessage('');
    try {
      const hasBound = Boolean(String(license?.domain || '').trim()) || Number(license?.bindCount || 0) > 0;
      if (hasBound) {
        await userService.changeLicenseDomain({
          licenseId,
          domain: form.domain,
          mobile: form.mobile,
          qq: form.qq,
        });
      } else {
        await userService.bindLicenseDomain({
          licenseId,
          domain: form.domain,
          mobile: form.mobile,
          qq: form.qq,
        });
      }
      setList(prev => prev.map(item => {
        if (Number(item?.id || 0) !== licenseId) return item;
        return {
          ...item,
          domain: form.domain,
          mobile: form.mobile,
          qq: form.qq,
          auditStatus: 0,
        };
      }));
      setActionMessage(hasBound ? '域名变更已提交，等待审核' : '域名绑定已提交，等待审核');
    } catch (error: any) {
      setActionMessage(error?.message || '域名提交失败，请稍后重试');
    } finally {
      setSubmittingId(0);
    }
  };

  if (loading) return <div>加载中...</div>;

  const filteredList = list.filter(item => {
    const statusLabel = resolveLicenseStatusLabel(item);
    if (activeFilter === 'valid') return statusLabel === '有效';
    if (activeFilter === 'pending') return statusLabel === '待审核';
    if (activeFilter === 'expired') return statusLabel === '已过期';
    return true;
  });

  return (
    <div>
      <div className="content-header">
        <h2 className="content-title">我的授权</h2>
      </div>
      {actionMessage && (
        <div className={`profile-action-message ${actionMessage.includes('失败') ? 'is-error' : 'is-success'}`}>
          {actionMessage}
        </div>
      )}
      <div className="profile-type-tabs" role="tablist" aria-label="授权状态筛选">
        <button
          type="button"
          className={`profile-type-tab ${activeFilter === 'all' ? 'is-active' : ''}`}
          onClick={() => setActiveFilter('all')}
        >
          全部 ({list.length})
        </button>
        <button
          type="button"
          className={`profile-type-tab ${activeFilter === 'valid' ? 'is-active' : ''}`}
          onClick={() => setActiveFilter('valid')}
        >
          有效 ({list.filter(item => resolveLicenseStatusLabel(item) === '有效').length})
        </button>
        <button
          type="button"
          className={`profile-type-tab ${activeFilter === 'pending' ? 'is-active' : ''}`}
          onClick={() => setActiveFilter('pending')}
        >
          待审核 ({list.filter(item => resolveLicenseStatusLabel(item) === '待审核').length})
        </button>
        <button
          type="button"
          className={`profile-type-tab ${activeFilter === 'expired' ? 'is-active' : ''}`}
          onClick={() => setActiveFilter('expired')}
        >
          已过期 ({list.filter(item => resolveLicenseStatusLabel(item) === '已过期').length})
        </button>
      </div>
      {filteredList.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">授权</span>
          当前筛选下暂无授权记录
        </div>
      ) : (
        <div className="collections-list">
          {filteredList.map(license => {
            const licenseId = Number(license?.id || 0);
            return (
              <div
                key={`license-card-${licenseId}`}
                id={`profile-license-${licenseId}`}
                className={`list-item list-item--rich ${Number(focusLicenseId || 0) === licenseId ? 'license-card--focus' : ''}`}
              >
                <div className="item-main">
                  <div className="item-head">
                    <span className="item-type-badge item-type-badge--article">授权</span>
                    <span className="item-head__category">{resolveLicenseStatusLabel(license)}</span>
                  </div>
                  <div className="item-title">{String(license?.productName || '授权产品')}</div>
                  <div className="item-meta">
                    <span>版本 {String(license?.productVersion || license?.packageVersion || '标准版')}</span>
                    <span>绑定 {Number(license?.bindCount || 0)}/{Number(license?.bindLimit || 1)}</span>
                    {Number(license?.expireTime || 0) > 0 && (
                      <span>到期 {formatUserDate(Number(license?.expireTime || 0))}</span>
                    )}
                  </div>
                  <div className="item-comment-content">
                    授权码：{String(license?.key || '-')}
                  </div>
                  <div className="item-meta" style={{ marginTop: 8 }}>
                    <span>当前域名 {String(license?.domain || '未绑定')}</span>
                    {String(license?.mobile || '').trim() && <span>手机 {String(license.mobile)}</span>}
                    {String(license?.qq || '').trim() && <span>QQ {String(license.qq)}</span>}
                  </div>
                  <div className="order-detail-form" style={{ marginTop: 10 }}>
                    <input
                      type="text"
                      value={String(licenseForms[licenseId]?.domain || '')}
                      onChange={event => handleLicenseFormChange(licenseId, 'domain', event.target.value)}
                      placeholder="绑定域名（必填）"
                    />
                    <input
                      type="text"
                      value={String(licenseForms[licenseId]?.mobile || '')}
                      onChange={event => handleLicenseFormChange(licenseId, 'mobile', event.target.value)}
                      placeholder="联系手机（选填）"
                    />
                    <input
                      type="text"
                      value={String(licenseForms[licenseId]?.qq || '')}
                      onChange={event => handleLicenseFormChange(licenseId, 'qq', event.target.value)}
                      placeholder="联系 QQ（选填）"
                    />
                  </div>
                </div>
                <div className="item-action item-action--top">
                  <div className="order-detail-license-item__actions">
                    <button
                      type="button"
                      className="action-btn"
                      onClick={() => handleCopyLicenseKey(String(license?.key || ''))}
                    >
                      复制授权码
                    </button>
                    <button
                      type="button"
                      className="action-btn"
                      disabled={submittingId === licenseId}
                      onClick={() => handleSubmitLicenseBinding(license)}
                    >
                      {submittingId === licenseId
                        ? '提交中...'
                        : (String(license?.domain || '').trim() ? '变更域名' : '绑定域名')}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// 子组件：收藏列表
const CollectionsList: React.FC = () => {
  type CollectionTabType = 'all' | 'website' | 'article';
  const PAGE_SIZE = 10;
  const [articleState, setArticleState] = useState({
    list: [] as any[],
    total: 0,
    page: 0,
    loadingMore: false,
  });
  const [websiteState, setWebsiteState] = useState({
    list: [] as any[],
    total: 0,
    page: 0,
    loadingMore: false,
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<CollectionTabType>('all');
  const [timeFilter, setTimeFilter] = useState<InteractionTimeFilter>('all');
  const [actionLoadingKey, setActionLoadingKey] = useState('');
  const [actionMessage, setActionMessage] = useState('');

  /**
   * 拉取指定收藏分段（文章 / 网址）
   */
  const loadCollectionSegment = async (type: 'article' | 'website', nextPage = 1, append = false) => {
    try {
      if (type === 'article') {
        setArticleState(prev => ({ ...prev, loadingMore: append }));
        const res = await getUserCollectedArticles({ page: nextPage, pageSize: PAGE_SIZE });
        const incoming = Array.isArray(res?.lists) ? res.lists : [];
        setArticleState(prev => ({
          list: append
            ? mergeListByKey(prev.list, incoming, item => `article-collect-${String(item?.id || item?.articleId || '')}`)
            : incoming,
          total: Number(res?.total || 0),
          page: nextPage,
          loadingMore: false,
        }));
        return;
      }

      setWebsiteState(prev => ({ ...prev, loadingMore: append }));
      const res = await userService.getWebsiteFavoriteList({ page: nextPage, pageSize: PAGE_SIZE });
      const incoming = Array.isArray(res?.lists) ? res.lists : [];
      setWebsiteState(prev => ({
        list: append
          ? mergeListByKey(prev.list, incoming, item => `website-favorite-${String(pickValue(item, [ 'websiteId', 'website_id', 'id' ], ''))}`)
          : incoming,
        total: Number(res?.total || 0),
        page: nextPage,
        loadingMore: false,
      }));
    } catch (_error) {
      if (type === 'article') {
        setArticleState(prev => ({ ...(append ? prev : { ...prev, list: [], total: 0, page: 0 }), loadingMore: false }));
      } else {
        setWebsiteState(prev => ({ ...(append ? prev : { ...prev, list: [], total: 0, page: 0 }), loadingMore: false }));
      }
    }
  };

  useEffect(() => {
    setLoading(true);
    Promise.allSettled([
      loadCollectionSegment('article', 1, false),
      loadCollectionSegment('website', 1, false),
    ]).finally(() => setLoading(false));
  }, []);

  /**
   * 取消收藏网址
   */
  const handleRemoveWebsiteFavorite = async (websiteId: number) => {
    if (!websiteId) return;
    if (!window.confirm('确认移除该网址收藏吗？')) return;
    setActionLoadingKey(`website-favorite-${websiteId}`);
    setActionMessage('');
    try {
      await userService.removeWebsiteFavorite(websiteId);
      setWebsiteState(prev => ({
        ...prev,
        list: prev.list.filter(item => Number(pickValue(item, [ 'websiteId', 'website_id', 'id' ], 0)) !== websiteId),
        total: Math.max(0, prev.total - 1),
      }));
      setActionMessage('网址收藏已移除');
    } catch (_error) {
      setActionMessage('移除网址收藏失败，请稍后重试');
    } finally {
      setActionLoadingKey('');
    }
  };

  /**
   * 取消收藏文章
   */
  const handleRemoveArticleCollect = async (articleId: number, recordId: number) => {
    if (!articleId) return;
    if (!window.confirm('确认移除该文章收藏吗？')) return;
    setActionLoadingKey(`article-collect-${articleId}`);
    setActionMessage('');
    try {
      const collected = await toggleArticleCollect(articleId);
      if (collected) {
        setActionMessage('当前文章收藏状态未发生变更');
        return;
      }
      setArticleState(prev => ({
        ...prev,
        list: prev.list.filter(item => {
          const currentArticleId = Number(pickValue(item, [ 'articleId', 'article_id', 'id' ], pickValue(item?.article, [ 'id' ], 0)));
          const currentRecordId = Number(item?.id || 0);
          return currentArticleId !== articleId && currentRecordId !== recordId;
        }),
        total: Math.max(0, prev.total - 1),
      }));
      setActionMessage('文章收藏已移除');
    } catch (_error) {
      setActionMessage('移除文章收藏失败，请稍后重试');
    } finally {
      setActionLoadingKey('');
    }
  };

  if (loading) return <div>加载中...</div>;
  const filteredWebsiteList = websiteState.list.filter(item =>
    matchesInteractionTimeFilter(pickValue(item, [ 'favoriteTime', 'createTime' ]), timeFilter)
  );
  const filteredArticleList = articleState.list.filter(item =>
    matchesInteractionTimeFilter(pickValue(item, [ 'collectTime', 'createTime', 'created_at' ]), timeFilter)
  );
  const hasData = filteredArticleList.length > 0 || filteredWebsiteList.length > 0;
  const totalCount = Number(articleState.total || 0) + Number(websiteState.total || 0);
  const showWebsite = activeTab === 'all' || activeTab === 'website';
  const showArticle = activeTab === 'all' || activeTab === 'article';
  const canLoadMoreWebsite = websiteState.list.length < websiteState.total;
  const canLoadMoreArticle = articleState.list.length < articleState.total;

  return (
    <div>
      <div className="content-header">
        <h2 className="content-title">我的收藏</h2>
      </div>
      {actionMessage && (
        <div className={`profile-action-message ${actionMessage.includes('失败') ? 'is-error' : 'is-success'}`}>
          {actionMessage}
        </div>
      )}
      <div className="profile-type-tabs" role="tablist" aria-label="收藏时间筛选">
        <button
          type="button"
          className={`profile-type-tab ${timeFilter === 'all' ? 'is-active' : ''}`}
          onClick={() => setTimeFilter('all')}
        >
          全部时间
        </button>
        <button
          type="button"
          className={`profile-type-tab ${timeFilter === '7d' ? 'is-active' : ''}`}
          onClick={() => setTimeFilter('7d')}
        >
          近 7 天
        </button>
        <button
          type="button"
          className={`profile-type-tab ${timeFilter === '30d' ? 'is-active' : ''}`}
          onClick={() => setTimeFilter('30d')}
        >
          近 30 天
        </button>
      </div>
      <div className="profile-type-tabs" role="tablist" aria-label="收藏类型切换">
        <button
          type="button"
          className={`profile-type-tab ${activeTab === 'all' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          全部 ({totalCount})
        </button>
        <button
          type="button"
          className={`profile-type-tab ${activeTab === 'website' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('website')}
        >
          网址 ({websiteState.total})
        </button>
        <button
          type="button"
          className={`profile-type-tab ${activeTab === 'article' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('article')}
        >
          文章 ({articleState.total})
        </button>
      </div>
      {!hasData ? (
        <div className="empty-state">
          <span className="empty-icon">收藏</span>
          当前筛选下暂无收藏内容
        </div>
      ) : (
        <>
          {showWebsite && (
            <div className="profile-subsection">
              <div className="profile-subsection__title">网址收藏 ({filteredWebsiteList.length}/{websiteState.total})</div>
              {filteredWebsiteList.length === 0 ? (
                <div className="profile-inline-empty">暂无网址收藏</div>
              ) : (
                <div className="collections-list">
                  {filteredWebsiteList.map(item => {
                    const websiteId = Number(pickValue(item, [ 'websiteId', 'website_id', 'id' ], 0));
                    return (
                      <div key={`website-fav-${websiteId || item.id}`} className="list-item list-item--rich">
                        <div className="item-main">
                          <div className="item-head">
                            <span className="item-type-badge item-type-badge--website">网址</span>
                            {pickValue(item, [ 'categoryName' ]) && <span className="item-head__category">{pickValue(item, [ 'categoryName' ])}</span>}
                          </div>
                          <a href={`/website/${pickValue(item, [ 'slug' ], websiteId || '')}`} className="item-title">
                            {pickValue(item, [ 'name' ], '未知网站')}
                          </a>
                          <div className="item-meta">
                            <span>收藏于 {formatUserDate(pickValue(item, [ 'favoriteTime', 'createTime' ]))}</span>
                            <span>点赞 {pickValue(item, [ 'likeCount' ], 0)}</span>
                            <span>收藏 {pickValue(item, [ 'favoriteCount' ], 0)}</span>
                          </div>
                        </div>
                        <div className="item-action item-action--top">
                          <button
                            type="button"
                            className="action-btn action-btn--danger"
                            disabled={actionLoadingKey === `website-favorite-${websiteId}`}
                            onClick={() => handleRemoveWebsiteFavorite(websiteId)}
                          >
                            {actionLoadingKey === `website-favorite-${websiteId}` ? '移除中...' : '移除收藏'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              {canLoadMoreWebsite && (
                <div className="profile-load-more">
                  <button
                    type="button"
                    className="action-btn"
                    disabled={websiteState.loadingMore}
                    onClick={() => loadCollectionSegment('website', websiteState.page + 1, true)}
                  >
                    {websiteState.loadingMore ? '加载中...' : '加载更多网址收藏'}
                  </button>
                </div>
              )}
            </div>
          )}

          {showArticle && (
            <div className="profile-subsection">
              <div className="profile-subsection__title">文章收藏 ({filteredArticleList.length}/{articleState.total})</div>
              {filteredArticleList.length === 0 ? (
                <div className="profile-inline-empty">暂无文章收藏</div>
              ) : (
                <div className="collections-list">
                  {filteredArticleList.map(item => {
                    const articleId = Number(pickValue(item, [ 'articleId', 'article_id', 'id' ], pickValue(item?.article, [ 'id' ], 0)));
                    const recordId = Number(item?.id || 0);
                    return (
                      <div key={`article-fav-${recordId || articleId}`} className="list-item list-item--rich">
                        <div className="item-main">
                          <div className="item-head">
                            <span className="item-type-badge item-type-badge--article">文章</span>
                          </div>
                          <a href={resolveArticleHref(item)} className="item-title">
                            {resolveArticleTitle(item)}
                          </a>
                          <div className="item-meta">
                            <span>收藏于 {formatUserDate(pickValue(item, [ 'collectTime', 'createTime', 'created_at' ]))}</span>
                            <span>点赞 {pickValue(item, [ 'likeCount' ], 0)}</span>
                            <span>收藏 {pickValue(item, [ 'collectCount' ], 0)}</span>
                          </div>
                        </div>
                        <div className="item-action item-action--top">
                          <button
                            type="button"
                            className="action-btn action-btn--danger"
                            disabled={actionLoadingKey === `article-collect-${articleId}`}
                            onClick={() => handleRemoveArticleCollect(articleId, recordId)}
                          >
                            {actionLoadingKey === `article-collect-${articleId}` ? '移除中...' : '移除收藏'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              {canLoadMoreArticle && (
                <div className="profile-load-more">
                  <button
                    type="button"
                    className="action-btn"
                    disabled={articleState.loadingMore}
                    onClick={() => loadCollectionSegment('article', articleState.page + 1, true)}
                  >
                    {articleState.loadingMore ? '加载中...' : '加载更多文章收藏'}
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

// 子组件：点赞列表
const LikesList: React.FC = () => {
  type LikeTabType = 'all' | 'website' | 'article';
  const PAGE_SIZE = 10;
  const [articleState, setArticleState] = useState({
    list: [] as any[],
    total: 0,
    page: 0,
    loadingMore: false,
  });
  const [websiteState, setWebsiteState] = useState({
    list: [] as any[],
    total: 0,
    page: 0,
    loadingMore: false,
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<LikeTabType>('all');
  const [timeFilter, setTimeFilter] = useState<InteractionTimeFilter>('all');
  const [actionLoadingKey, setActionLoadingKey] = useState('');
  const [actionMessage, setActionMessage] = useState('');

  /**
   * 拉取指定点赞分段（文章 / 网址）
   */
  const loadLikeSegment = async (type: 'article' | 'website', nextPage = 1, append = false) => {
    try {
      if (type === 'article') {
        setArticleState(prev => ({ ...prev, loadingMore: append }));
        const res = await getUserLikedArticles({ page: nextPage, pageSize: PAGE_SIZE });
        const incoming = Array.isArray(res?.lists) ? res.lists : [];
        setArticleState(prev => ({
          list: append
            ? mergeListByKey(prev.list, incoming, item => `article-like-${String(item?.id || item?.articleId || '')}`)
            : incoming,
          total: Number(res?.total || 0),
          page: nextPage,
          loadingMore: false,
        }));
        return;
      }

      setWebsiteState(prev => ({ ...prev, loadingMore: append }));
      const res = await userService.getWebsiteLikeList({ page: nextPage, pageSize: PAGE_SIZE });
      const incoming = Array.isArray(res?.lists) ? res.lists : [];
      setWebsiteState(prev => ({
        list: append
          ? mergeListByKey(prev.list, incoming, item => `website-like-${String(pickValue(item, [ 'websiteId', 'website_id', 'id' ], ''))}`)
          : incoming,
        total: Number(res?.total || 0),
        page: nextPage,
        loadingMore: false,
      }));
    } catch (_error) {
      if (type === 'article') {
        setArticleState(prev => ({ ...(append ? prev : { ...prev, list: [], total: 0, page: 0 }), loadingMore: false }));
      } else {
        setWebsiteState(prev => ({ ...(append ? prev : { ...prev, list: [], total: 0, page: 0 }), loadingMore: false }));
      }
    }
  };

  useEffect(() => {
    setLoading(true);
    Promise.allSettled([
      loadLikeSegment('article', 1, false),
      loadLikeSegment('website', 1, false),
    ]).finally(() => setLoading(false));
  }, []);

  /**
   * 取消点赞网址
   */
  const handleRemoveWebsiteLike = async (websiteId: number) => {
    if (!websiteId) return;
    if (!window.confirm('确认取消该网址点赞吗？')) return;
    setActionLoadingKey(`website-like-${websiteId}`);
    setActionMessage('');
    try {
      await userService.removeWebsiteLike(websiteId);
      setWebsiteState(prev => ({
        ...prev,
        list: prev.list.filter(item => Number(pickValue(item, [ 'websiteId', 'website_id', 'id' ], 0)) !== websiteId),
        total: Math.max(0, prev.total - 1),
      }));
      setActionMessage('网址点赞已取消');
    } catch (_error) {
      setActionMessage('取消网址点赞失败，请稍后重试');
    } finally {
      setActionLoadingKey('');
    }
  };

  /**
   * 取消点赞文章
   */
  const handleRemoveArticleLike = async (articleId: number, recordId: number) => {
    if (!articleId) return;
    if (!window.confirm('确认取消该文章点赞吗？')) return;
    setActionLoadingKey(`article-like-${articleId}`);
    setActionMessage('');
    try {
      const liked = await toggleArticleLike(articleId);
      if (liked) {
        setActionMessage('当前文章点赞状态未发生变更');
        return;
      }
      setArticleState(prev => ({
        ...prev,
        list: prev.list.filter(item => {
          const currentArticleId = Number(pickValue(item, [ 'articleId', 'article_id', 'id' ], pickValue(item?.article, [ 'id' ], 0)));
          const currentRecordId = Number(item?.id || 0);
          return currentArticleId !== articleId && currentRecordId !== recordId;
        }),
        total: Math.max(0, prev.total - 1),
      }));
      setActionMessage('文章点赞已取消');
    } catch (_error) {
      setActionMessage('取消文章点赞失败，请稍后重试');
    } finally {
      setActionLoadingKey('');
    }
  };

  if (loading) return <div>加载中...</div>;
  const filteredWebsiteList = websiteState.list.filter(item =>
    matchesInteractionTimeFilter(pickValue(item, [ 'likeTime', 'createTime' ]), timeFilter)
  );
  const filteredArticleList = articleState.list.filter(item =>
    matchesInteractionTimeFilter(pickValue(item, [ 'likeTime', 'createTime', 'created_at' ]), timeFilter)
  );
  const hasData = filteredArticleList.length > 0 || filteredWebsiteList.length > 0;
  const totalCount = Number(articleState.total || 0) + Number(websiteState.total || 0);
  const showWebsite = activeTab === 'all' || activeTab === 'website';
  const showArticle = activeTab === 'all' || activeTab === 'article';
  const canLoadMoreWebsite = websiteState.list.length < websiteState.total;
  const canLoadMoreArticle = articleState.list.length < articleState.total;

  return (
    <div>
      <div className="content-header">
        <h2 className="content-title">我的点赞</h2>
      </div>
      {actionMessage && (
        <div className={`profile-action-message ${actionMessage.includes('失败') ? 'is-error' : 'is-success'}`}>
          {actionMessage}
        </div>
      )}
      <div className="profile-type-tabs" role="tablist" aria-label="点赞时间筛选">
        <button
          type="button"
          className={`profile-type-tab ${timeFilter === 'all' ? 'is-active' : ''}`}
          onClick={() => setTimeFilter('all')}
        >
          全部时间
        </button>
        <button
          type="button"
          className={`profile-type-tab ${timeFilter === '7d' ? 'is-active' : ''}`}
          onClick={() => setTimeFilter('7d')}
        >
          近 7 天
        </button>
        <button
          type="button"
          className={`profile-type-tab ${timeFilter === '30d' ? 'is-active' : ''}`}
          onClick={() => setTimeFilter('30d')}
        >
          近 30 天
        </button>
      </div>
      <div className="profile-type-tabs" role="tablist" aria-label="点赞类型切换">
        <button
          type="button"
          className={`profile-type-tab ${activeTab === 'all' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          全部 ({totalCount})
        </button>
        <button
          type="button"
          className={`profile-type-tab ${activeTab === 'website' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('website')}
        >
          网址 ({websiteState.total})
        </button>
        <button
          type="button"
          className={`profile-type-tab ${activeTab === 'article' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('article')}
        >
          文章 ({articleState.total})
        </button>
      </div>
      {!hasData ? (
        <div className="empty-state">
          <span className="empty-icon">点赞</span>
          当前筛选下暂无点赞内容
        </div>
      ) : (
        <>
          {showWebsite && (
            <div className="profile-subsection">
              <div className="profile-subsection__title">网址点赞 ({filteredWebsiteList.length}/{websiteState.total})</div>
              {filteredWebsiteList.length === 0 ? (
                <div className="profile-inline-empty">暂无网址点赞</div>
              ) : (
                <div className="likes-list">
                  {filteredWebsiteList.map(item => {
                    const websiteId = Number(pickValue(item, [ 'websiteId', 'website_id', 'id' ], 0));
                    return (
                      <div key={`website-like-${websiteId || item.id}`} className="list-item list-item--rich">
                        <div className="item-main">
                          <div className="item-head">
                            <span className="item-type-badge item-type-badge--website">网址</span>
                            {pickValue(item, [ 'categoryName' ]) && <span className="item-head__category">{pickValue(item, [ 'categoryName' ])}</span>}
                          </div>
                          <a href={`/website/${pickValue(item, [ 'slug' ], websiteId || '')}`} className="item-title">
                            {pickValue(item, [ 'name' ], '未知网站')}
                          </a>
                          <div className="item-meta">
                            <span>点赞于 {formatUserDate(pickValue(item, [ 'likeTime', 'createTime' ]))}</span>
                            <span>点赞 {pickValue(item, [ 'likeCount' ], 0)}</span>
                            <span>收藏 {pickValue(item, [ 'favoriteCount' ], 0)}</span>
                          </div>
                        </div>
                        <div className="item-action item-action--top">
                          <button
                            type="button"
                            className="action-btn action-btn--danger"
                            disabled={actionLoadingKey === `website-like-${websiteId}`}
                            onClick={() => handleRemoveWebsiteLike(websiteId)}
                          >
                            {actionLoadingKey === `website-like-${websiteId}` ? '取消中...' : '取消点赞'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              {canLoadMoreWebsite && (
                <div className="profile-load-more">
                  <button
                    type="button"
                    className="action-btn"
                    disabled={websiteState.loadingMore}
                    onClick={() => loadLikeSegment('website', websiteState.page + 1, true)}
                  >
                    {websiteState.loadingMore ? '加载中...' : '加载更多网址点赞'}
                  </button>
                </div>
              )}
            </div>
          )}

          {showArticle && (
            <div className="profile-subsection">
              <div className="profile-subsection__title">文章点赞 ({filteredArticleList.length}/{articleState.total})</div>
              {filteredArticleList.length === 0 ? (
                <div className="profile-inline-empty">暂无文章点赞</div>
              ) : (
                <div className="likes-list">
                  {filteredArticleList.map(item => {
                    const articleId = Number(pickValue(item, [ 'articleId', 'article_id', 'id' ], pickValue(item?.article, [ 'id' ], 0)));
                    const recordId = Number(item?.id || 0);
                    return (
                      <div key={`article-like-${recordId || articleId}`} className="list-item list-item--rich">
                        <div className="item-main">
                          <div className="item-head">
                            <span className="item-type-badge item-type-badge--article">文章</span>
                          </div>
                          <a href={resolveArticleHref(item)} className="item-title">
                            {resolveArticleTitle(item)}
                          </a>
                          <div className="item-meta">
                            <span>点赞于 {formatUserDate(pickValue(item, [ 'likeTime', 'createTime', 'created_at' ]))}</span>
                            <span>点赞 {pickValue(item, [ 'likeCount' ], 0)}</span>
                            <span>收藏 {pickValue(item, [ 'collectCount' ], 0)}</span>
                          </div>
                        </div>
                        <div className="item-action item-action--top">
                          <button
                            type="button"
                            className="action-btn action-btn--danger"
                            disabled={actionLoadingKey === `article-like-${articleId}`}
                            onClick={() => handleRemoveArticleLike(articleId, recordId)}
                          >
                            {actionLoadingKey === `article-like-${articleId}` ? '取消中...' : '取消点赞'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              {canLoadMoreArticle && (
                <div className="profile-load-more">
                  <button
                    type="button"
                    className="action-btn"
                    disabled={articleState.loadingMore}
                    onClick={() => loadLikeSegment('article', articleState.page + 1, true)}
                  >
                    {articleState.loadingMore ? '加载中...' : '加载更多文章点赞'}
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

// 子组件：评论列表
const CommentsList: React.FC = () => {
  const [articleList, setArticleList] = useState<any[]>([]);
  const [websiteList, setWebsiteList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeType, setActiveType] = useState<'all' | 'website' | 'article'>('all');
  const [editingKey, setEditingKey] = useState('');
  const [editingText, setEditingText] = useState('');
  const [replyingKey, setReplyingKey] = useState('');
  const [replyText, setReplyText] = useState('');
  const [expandedThreads, setExpandedThreads] = useState<Record<string, boolean>>({});
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState('');

  /**
   * 拉取评论列表（文章 + 网址）
   */
  const loadComments = async () => {
    setLoading(true);
    try {
      const [ articleRes, websiteRes ] = await Promise.allSettled([
        userService.getArticleCommentList({ page: 1, pageSize: 20 }),
        userService.getWebsiteCommentList({ page: 1, pageSize: 20 }),
      ]);
      setArticleList(articleRes.status === 'fulfilled' ? (articleRes.value?.lists || []) : []);
      setWebsiteList(websiteRes.status === 'fulfilled' ? (websiteRes.value?.lists || []) : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComments().catch(() => {});
  }, []);

  /**
   * 删除评论
   */
  const handleDeleteComment = async (type: 'article' | 'website', commentId: number) => {
    if (!window.confirm('确认删除这条评论吗？删除后不可恢复。')) return;
    if (!commentId) return;
    setActionLoading(true);
    setActionMessage('');
    try {
      if (type === 'article') {
        await userService.deleteArticleComment(commentId);
        setArticleList(prev => prev.filter(item => Number(item.id || 0) !== commentId));
      } else {
        await userService.deleteWebsiteComment(commentId);
        setWebsiteList(prev => prev.filter(item => Number(item.id || 0) !== commentId));
      }
      setActionMessage('删除成功');
    } catch (error: any) {
      setActionMessage(error?.message || '删除失败，请稍后重试');
    } finally {
      setActionLoading(false);
    }
  };

  /**
   * 进入评论编辑模式
   */
  const handleStartEdit = (type: 'article' | 'website', item: any) => {
    const key = `${type}-${Number(item?.id || 0)}`;
    setEditingKey(key);
    setEditingText(String(item?.content || ''));
    setReplyingKey('');
    setReplyText('');
  };

  /**
   * 提交评论编辑
   */
  const handleSubmitEdit = async (type: 'article' | 'website', item: any) => {
    const nextContent = String(editingText || '').trim();
    if (!nextContent) {
      setActionMessage('评论内容不能为空');
      return;
    }
    setActionLoading(true);
    setActionMessage('');
    try {
      if (type === 'article') {
        await userService.updateArticleComment(Number(item.id || 0), nextContent);
        setArticleList(prev => prev.map(row => (
          Number(row.id || 0) === Number(item.id || 0) ? { ...row, content: nextContent, updateTime: formatUserDate(new Date()) } : row
        )));
      } else {
        await userService.updateWebsiteComment(Number(item.id || 0), nextContent);
        setWebsiteList(prev => prev.map(row => (
          Number(row.id || 0) === Number(item.id || 0) ? { ...row, content: nextContent, updateTime: formatUserDate(new Date()) } : row
        )));
      }
      setEditingKey('');
      setEditingText('');
      setActionMessage('评论已更新');
    } catch (error: any) {
      setActionMessage(error?.message || '更新失败，请稍后重试');
    } finally {
      setActionLoading(false);
    }
  };

  /**
   * 打开楼中楼回复输入框
   */
  const handleOpenReply = (type: 'article' | 'website', item: any) => {
    const key = `${type}-${Number(item?.id || 0)}`;
    setReplyingKey(key);
    setReplyText('');
    setEditingKey('');
    setEditingText('');
  };

  /**
   * 提交楼中楼回复
   */
  const handleSubmitReply = async (type: 'article' | 'website', item: any) => {
    const nextContent = String(replyText || '').trim();
    if (!nextContent) {
      setActionMessage('回复内容不能为空');
      return;
    }
    const targetId = Number(item?.targetId || item?.target?.id || 0);
    if (!targetId) {
      setActionMessage('回复失败：目标ID无效');
      return;
    }
    setActionLoading(true);
    setActionMessage('');
    try {
      if (type === 'article') {
        await userService.replyArticleComment({
          targetId,
          commentId: Number(item.id || 0),
          content: nextContent,
        });
      } else {
        await userService.replyWebsiteComment({
          targetId,
          commentId: Number(item.id || 0),
          content: nextContent,
        });
      }
      setReplyingKey('');
      setReplyText('');
      setActionMessage('回复成功');
      await loadComments();
    } catch (error: any) {
      setActionMessage(error?.message || '回复失败，请稍后重试');
    } finally {
      setActionLoading(false);
    }
  };

  /**
   * 统一评论状态展示文案
   */
  const getCommentStatusText = (status: any) => {
    const raw = String(status || '').toLowerCase();
    if (raw === 'rejected') return '已拒绝';
    if (raw === 'pending') return '待审核';
    return '已通过';
  };

  /**
   * 切换评论线程展开状态
   */
  const toggleThread = (threadKey: string) => {
    setExpandedThreads(prev => ({
      ...prev,
      [threadKey]: !prev[threadKey],
    }));
  };

  /**
   * 渲染评论节点（支持根评论 + 楼中楼回复）
   */
  const renderCommentNode = (
    type: 'article' | 'website',
    item: any,
    childMap: Map<number, any[]>,
    depth = 0
  ): React.ReactNode => {
    const commentId = Number(item.id || 0);
    const key = `${type}-${commentId}`;
    const isEditing = editingKey === key;
    const isReplying = replyingKey === key;
    const childItems = childMap.get(commentId) || [];
    const hasChildren = childItems.length > 0;
    const isExpanded = expandedThreads[key] !== false;
    const href = type === 'website'
      ? `/website/${pickValue(item?.target, [ 'slug' ], pickValue(item, [ 'targetId' ], ''))}`
      : `/article/${pickValue(item?.target, [ 'slug' ], pickValue(item, [ 'targetId' ], ''))}`;
    const title = pickValue(item?.target, [ 'title' ], type === 'website' ? '未知网址' : '未知文章');

    return (
      <div key={`${type}-comment-${commentId}`} className={`comment-thread-node ${depth > 0 ? 'is-reply' : 'is-root'}`}>
        <div className="list-item list-item--rich">
          <div className="item-main">
            <div className="item-head">
              {depth > 0 && <span className="item-type-badge item-type-badge--article">我的回复</span>}
              {depth === 0 && hasChildren && (
                <span className="item-head__category">包含 {childItems.length} 条回复</span>
              )}
            </div>
            <a href={href} className="item-title">
              {title}
            </a>
            <div className="item-meta">
              {type === 'website' && pickValue(item?.target, [ 'url' ]) && (
                <span>{pickValue(item?.target, [ 'url' ])}</span>
              )}
              <span>状态 {getCommentStatusText(pickValue(item, [ 'status' ], 'approved'))}</span>
              <span>点赞 {pickValue(item, [ 'likeCount' ], 0)}</span>
              {depth > 0 && <span>回复于 {formatUserDate(pickValue(item, [ 'createTime' ]))}</span>}
            </div>
            {!isEditing ? (
              <div className="item-comment-content">{pickValue(item, [ 'content' ], '')}</div>
            ) : (
              <div className="item-comment-editor">
                <textarea
                  value={editingText}
                  onChange={e => setEditingText(e.target.value)}
                  rows={4}
                  placeholder="请输入评论内容"
                />
                <div className="item-comment-actions">
                  <button type="button" disabled={actionLoading} onClick={() => handleSubmitEdit(type, item)}>保存</button>
                  <button type="button" className="is-light" onClick={() => setEditingKey('')}>取消</button>
                </div>
              </div>
            )}
            {isReplying && (
              <div className="item-comment-editor item-comment-reply">
                <textarea
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  rows={3}
                  placeholder="输入回复内容"
                />
                <div className="item-comment-actions">
                  <button type="button" disabled={actionLoading} onClick={() => handleSubmitReply(type, item)}>发送回复</button>
                  <button type="button" className="is-light" onClick={() => setReplyingKey('')}>取消</button>
                </div>
              </div>
            )}
            <div className="item-meta" style={{ marginTop: 8 }}>
              {depth === 0 && <span>评论于 {formatUserDate(pickValue(item, [ 'createTime' ]))}</span>}
              <span className="inline-action inline-action--primary" onClick={() => handleOpenReply(type, item)}>回复</span>
              <span className="inline-action inline-action--primary" onClick={() => handleStartEdit(type, item)}>编辑</span>
              {hasChildren && (
                <span className="inline-action inline-action--primary" onClick={() => toggleThread(key)}>
                  {isExpanded ? '收起回复' : `展开回复 (${childItems.length})`}
                </span>
              )}
              <span className="inline-action inline-action--danger" onClick={() => handleDeleteComment(type, commentId)}>删除</span>
            </div>
          </div>
        </div>
        {hasChildren && isExpanded && (
          <div className="comment-thread-children">
            {childItems.map(child => renderCommentNode(type, child, childMap, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  if (loading) return <div>加载中...</div>;
  const websiteThreads = buildCommentThread(websiteList);
  const articleThreads = buildCommentThread(articleList);
  const hasData = articleList.length > 0 || websiteList.length > 0;
  const totalCount = articleList.length + websiteList.length;
  const showWebsite = activeType === 'all' || activeType === 'website';
  const showArticle = activeType === 'all' || activeType === 'article';

  return (
    <div>
      <div className="content-header">
        <h2 className="content-title">我的评论</h2>
      </div>
      <div className="profile-type-tabs" role="tablist" aria-label="评论类型切换">
        <button
          type="button"
          className={`profile-type-tab ${activeType === 'all' ? 'is-active' : ''}`}
          onClick={() => setActiveType('all')}
        >
          全部 ({totalCount})
        </button>
        <button
          type="button"
          className={`profile-type-tab ${activeType === 'website' ? 'is-active' : ''}`}
          onClick={() => setActiveType('website')}
        >
          网址 ({websiteList.length})
        </button>
        <button
          type="button"
          className={`profile-type-tab ${activeType === 'article' ? 'is-active' : ''}`}
          onClick={() => setActiveType('article')}
        >
          文章 ({articleList.length})
        </button>
      </div>
      {actionMessage && (
        <div className={`profile-action-message ${actionMessage.includes('失败') ? 'is-error' : 'is-success'}`}>
          {actionMessage}
        </div>
      )}
      {!hasData ? (
        <div className="empty-state">
          <span className="empty-icon">评论</span>
          暂无评论内容
        </div>
      ) : (
        <>
          {showWebsite && (
            <div className="profile-subsection">
              <div className="profile-subsection__title">网址评论 ({websiteList.length})</div>
              {websiteList.length === 0 ? (
                <div className="profile-inline-empty">暂无网址评论</div>
              ) : (
                <div className="collections-list">
                  {websiteThreads.roots.map(item => renderCommentNode('website', item, websiteThreads.childMap))}
                </div>
              )}
            </div>
          )}

          {showArticle && (
            <div className="profile-subsection">
              <div className="profile-subsection__title">文章评论 ({articleList.length})</div>
              {articleList.length === 0 ? (
                <div className="profile-inline-empty">暂无文章评论</div>
              ) : (
                <div className="collections-list">
                  {articleThreads.roots.map(item => renderCommentNode('article', item, articleThreads.childMap))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

// 子组件：安全设置
const SecuritySettings: React.FC<{ user: any; onUpdate: () => Promise<void> | void }> = ({ user, onUpdate }) => {
  const [formData, setFormData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [bindForm, setBindForm] = useState({
    emailAccount: String(user?.email || ''),
    emailCode: '',
    mobileAccount: String(user?.mobile || ''),
    mobileCode: '',
  });
  const [sendingType, setSendingType] = useState<'email' | 'mobile' | ''>('');
  const [bindingType, setBindingType] = useState<'email' | 'mobile' | ''>('');
  const [sessions, setSessions] = useState<any[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [twoFactorState, setTwoFactorState] = useState<any>({
    enabled: false,
    method: '',
    maskedAccount: '',
    hasMobile: false,
    hasEmail: false,
  });
  const [twoFactorForm, setTwoFactorForm] = useState({
    method: 'mobile' as 'mobile' | 'email',
    code: '',
    password: '',
  });
  const [twoFactorSending, setTwoFactorSending] = useState(false);
  const [twoFactorSaving, setTwoFactorSaving] = useState(false);

  useEffect(() => {
    setBindForm(prev => ({
      ...prev,
      emailAccount: String(user?.email || prev.emailAccount || ''),
      mobileAccount: String(user?.mobile || prev.mobileAccount || ''),
    }));
  }, [user?.email, user?.mobile]);

  /**
   * 拉取账号安全数据（2FA 状态 + 活跃设备会话）
   */
  const loadSecurityData = async () => {
    setLoadingSessions(true);
    try {
      const [statusRes, sessionRes] = await Promise.allSettled([
        userService.getTwoFactorStatus(),
        userService.getSessionList(),
      ]);
      setTwoFactorState(statusRes.status === 'fulfilled'
        ? (statusRes.value || { enabled: false, method: '', maskedAccount: '', hasMobile: false, hasEmail: false })
        : { enabled: false, method: '', maskedAccount: '', hasMobile: false, hasEmail: false });
      const nextSessions = sessionRes.status === 'fulfilled'
        ? (Array.isArray(sessionRes.value?.lists) ? sessionRes.value.lists : [])
        : [];
      setSessions(nextSessions);
    } finally {
      setLoadingSessions(false);
    }
  };

  useEffect(() => {
    loadSecurityData().catch(() => {});
  }, []);

  /**
   * 提交密码修改
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.newPassword !== formData.confirmPassword) {
      setMessage('两次新密码输入不一致');
      return;
    }
    setSaving(true);
    try {
      await userService.changePassword(formData);
      setMessage('密码修改成功');
      setFormData({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setMessage('修改失败，请检查旧密码是否正确');
    } finally {
      setSaving(false);
    }
  };

  /**
   * 发送手机/邮箱绑定验证码
   */
  const handleSendCode = async (type: 'email' | 'mobile') => {
    const account = type === 'email' ? bindForm.emailAccount.trim() : bindForm.mobileAccount.trim();
    if (!account) {
      setMessage(type === 'email' ? '请输入邮箱地址' : '请输入手机号');
      return;
    }
    setSendingType(type);
    setMessage('');
    try {
      await userService.sendBindCode({
        type: type === 'email' ? 'bind_email' : 'bind_mobile',
        account,
      });
      setMessage('验证码已发送，请注意查收');
    } catch (error: any) {
      setMessage(error?.message || '验证码发送失败');
    } finally {
      setSendingType('');
    }
  };

  /**
   * 提交绑定操作
   */
  const handleBindAccount = async (type: 'email' | 'mobile') => {
    const account = type === 'email' ? bindForm.emailAccount.trim() : bindForm.mobileAccount.trim();
    const code = type === 'email' ? bindForm.emailCode.trim() : bindForm.mobileCode.trim();
    if (!account || !code) {
      setMessage('请输入账号和验证码');
      return;
    }
    setBindingType(type);
    setMessage('');
    try {
      await userService.bindAccount({
        type,
        account,
        code,
      });
      setMessage(type === 'email' ? '邮箱绑定成功' : '手机号绑定成功');
      if (type === 'email') {
        setBindForm(prev => ({ ...prev, emailCode: '' }));
      } else {
        setBindForm(prev => ({ ...prev, mobileCode: '' }));
      }
      await onUpdate();
    } catch (error: any) {
      setMessage(error?.message || '绑定失败，请稍后重试');
    } finally {
      setBindingType('');
    }
  };

  /**
   * 解绑账号
   */
  const handleUnbindAccount = async (type: 'email' | 'mobile') => {
    if (!window.confirm('确认执行解绑操作吗？')) return;
    setBindingType(type);
    setMessage('');
    try {
      await userService.unbindAccount({ type });
      setMessage(type === 'email' ? '邮箱已解绑' : '手机号已解绑');
      await onUpdate();
    } catch (error: any) {
      setMessage(error?.message || '解绑失败，请稍后重试');
    } finally {
      setBindingType('');
    }
  };

  /**
   * 发送 2FA 配置验证码（启用/关闭）
   */
  const handleSendTwoFactorCode = async () => {
    const purpose = twoFactorState.enabled ? 'disable' : 'enable';
    if (purpose === 'enable') {
      if (twoFactorForm.method === 'mobile' && !bindForm.mobileAccount.trim()) {
        setMessage('请先绑定手机号后再启用 2FA');
        return;
      }
      if (twoFactorForm.method === 'email' && !bindForm.emailAccount.trim()) {
        setMessage('请先绑定邮箱后再启用 2FA');
        return;
      }
    }
    setTwoFactorSending(true);
    setMessage('');
    try {
      await userService.sendTwoFactorCode({
        purpose,
        type: twoFactorState.enabled ? undefined : twoFactorForm.method,
      });
      setMessage('2FA 验证码已发送，请查收');
    } catch (error: any) {
      setMessage(error?.message || '2FA 验证码发送失败');
    } finally {
      setTwoFactorSending(false);
    }
  };

  /**
   * 提交 2FA 开关
   */
  const handleSubmitTwoFactor = async () => {
    if (!twoFactorForm.password.trim()) {
      setMessage('请输入当前密码');
      return;
    }
    if (!twoFactorForm.code.trim()) {
      setMessage('请输入验证码');
      return;
    }
    setTwoFactorSaving(true);
    setMessage('');
    try {
      if (twoFactorState.enabled) {
        await userService.disableTwoFactor({
          password: twoFactorForm.password.trim(),
          code: twoFactorForm.code.trim(),
        });
        setMessage('2FA 已关闭');
      } else {
        await userService.enableTwoFactor({
          type: twoFactorForm.method,
          password: twoFactorForm.password.trim(),
          code: twoFactorForm.code.trim(),
        });
        setMessage('2FA 已开启');
      }
      setTwoFactorForm(prev => ({ ...prev, code: '', password: '' }));
      await loadSecurityData();
    } catch (error: any) {
      setMessage(error?.message || '2FA 设置失败，请稍后重试');
    } finally {
      setTwoFactorSaving(false);
    }
  };

  /**
   * 下线指定设备
   */
  const handleKickSession = async (token: string) => {
    if (!token) return;
    if (!window.confirm('确认下线该设备吗？下线后该设备需要重新登录。')) return;
    setMessage('');
    try {
      await userService.kickSession(token);
      setMessage('设备已下线');
      await loadSecurityData();
    } catch (error: any) {
      setMessage(error?.message || '设备下线失败');
    }
  };

  return (
    <div>
      <div className="content-header">
        <h2 className="content-title">账号安全</h2>
      </div>
      <div className="security-section">
        <h3 className="security-section__title">修改密码</h3>
        <form className="profile-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>当前密码</label>
            <input
              type="password"
              value={formData.oldPassword}
              onChange={e => setFormData({ ...formData, oldPassword: e.target.value })}
              placeholder="请输入当前密码"
            />
          </div>
          <div className="form-group">
            <label>新密码</label>
            <input
              type="password"
              value={formData.newPassword}
              onChange={e => setFormData({ ...formData, newPassword: e.target.value })}
              placeholder="请输入新密码（至少6位）"
            />
          </div>
          <div className="form-group">
            <label>确认新密码</label>
            <input
              type="password"
              value={formData.confirmPassword}
              onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
              placeholder="请再次输入新密码"
            />
          </div>
          <button type="submit" className="save-btn" disabled={saving}>
            {saving ? '处理中...' : '确认修改'}
          </button>
        </form>
      </div>

      <div className="security-section">
        <h3 className="security-section__title">绑定邮箱</h3>
        <div className="security-bind-grid">
          <input
            type="text"
            value={bindForm.emailAccount}
            onChange={e => setBindForm(prev => ({ ...prev, emailAccount: e.target.value }))}
            placeholder="请输入邮箱地址"
          />
          <div className="security-code-row">
            <input
              type="text"
              value={bindForm.emailCode}
              onChange={e => setBindForm(prev => ({ ...prev, emailCode: e.target.value }))}
              placeholder="验证码"
            />
            <button type="button" className="action-btn" disabled={sendingType === 'email'} onClick={() => handleSendCode('email')}>
              {sendingType === 'email' ? '发送中...' : '发送验证码'}
            </button>
          </div>
          <div className="security-action-row">
            <button type="button" className="save-btn" disabled={bindingType === 'email'} onClick={() => handleBindAccount('email')}>
              {bindingType === 'email' ? '处理中...' : '绑定邮箱'}
            </button>
            <button type="button" className="action-btn" disabled={bindingType === 'email'} onClick={() => handleUnbindAccount('email')}>
              解绑
            </button>
          </div>
        </div>
      </div>

      <div className="security-section">
        <h3 className="security-section__title">绑定手机</h3>
        <div className="security-bind-grid">
          <input
            type="text"
            value={bindForm.mobileAccount}
            onChange={e => setBindForm(prev => ({ ...prev, mobileAccount: e.target.value }))}
            placeholder="请输入手机号"
          />
          <div className="security-code-row">
            <input
              type="text"
              value={bindForm.mobileCode}
              onChange={e => setBindForm(prev => ({ ...prev, mobileCode: e.target.value }))}
              placeholder="验证码"
            />
            <button type="button" className="action-btn" disabled={sendingType === 'mobile'} onClick={() => handleSendCode('mobile')}>
              {sendingType === 'mobile' ? '发送中...' : '发送验证码'}
            </button>
          </div>
          <div className="security-action-row">
            <button type="button" className="save-btn" disabled={bindingType === 'mobile'} onClick={() => handleBindAccount('mobile')}>
              {bindingType === 'mobile' ? '处理中...' : '绑定手机'}
            </button>
            <button type="button" className="action-btn" disabled={bindingType === 'mobile'} onClick={() => handleUnbindAccount('mobile')}>
              解绑
            </button>
          </div>
        </div>
      </div>

      <div className="security-section">
        <h3 className="security-section__title">登录设备管理</h3>
        {loadingSessions ? (
          <div className="profile-inline-empty">设备记录加载中...</div>
        ) : sessions.length === 0 ? (
          <div className="profile-inline-empty">暂无登录设备记录</div>
        ) : (
          <div className="security-device-list">
            {sessions.map(item => (
              <div className="security-device-item" key={`device-${item.sessionId || item.token}`}>
                <div className="title">
                  {pickValue(item, [ 'device' ], '未知设备')}
                  {Boolean(item.isCurrent) && <span style={{ marginLeft: 8, color: '#16a34a', fontSize: 12 }}>当前设备</span>}
                </div>
                <div className="meta">
                  <span>IP：{pickValue(item, [ 'ip', 'ipAddress', 'ip_address' ], '-')}</span>
                  <span>登录：{formatUserDate(pickValue(item, [ 'createTime', 'create_time', 'loginTime' ]))}</span>
                  <span>活跃：{formatUserDate(pickValue(item, [ 'lastActiveTime' ]))}</span>
                  <span>剩余：{Number(pickValue(item, [ 'expireInSeconds' ], 0))} 秒</span>
                  <span>2FA：{Boolean(item.twoFactorVerified) ? '已验证' : '未验证'}</span>
                </div>
                {!Boolean(item.isCurrent) && (
                  <div className="security-device-item__actions">
                    <button type="button" className="action-btn" onClick={() => handleKickSession(String(item.token || ''))}>
                      下线设备
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="security-section">
        <h3 className="security-section__title">两步验证（2FA）</h3>
        <div className="security-2fa-box" style={{ marginBottom: 12 }}>
          <div className="security-2fa-box__text">
            当前状态：{twoFactorState.enabled ? '已开启' : '未开启'}
            {twoFactorState.enabled && twoFactorState.maskedAccount ? `（${twoFactorState.maskedAccount}）` : ''}
          </div>
        </div>
        {!twoFactorState.enabled && (
          <div className="security-bind-grid" style={{ marginBottom: 10 }}>
            <label style={{ fontSize: 13, color: 'var(--text-secondary)' }}>验证方式</label>
            <div className="security-action-row">
              <button
                type="button"
                className={`action-btn ${twoFactorForm.method === 'mobile' ? 'is-active' : ''}`}
                onClick={() => setTwoFactorForm(prev => ({ ...prev, method: 'mobile' }))}
              >
                手机验证码
              </button>
              <button
                type="button"
                className={`action-btn ${twoFactorForm.method === 'email' ? 'is-active' : ''}`}
                onClick={() => setTwoFactorForm(prev => ({ ...prev, method: 'email' }))}
              >
                邮箱验证码
              </button>
            </div>
          </div>
        )}
        <div className="security-bind-grid">
          <div className="security-code-row">
            <input
              type="text"
              value={twoFactorForm.code}
              onChange={e => setTwoFactorForm(prev => ({ ...prev, code: e.target.value }))}
              placeholder="输入 2FA 验证码"
            />
            <button type="button" className="action-btn" disabled={twoFactorSending} onClick={handleSendTwoFactorCode}>
              {twoFactorSending ? '发送中...' : '发送验证码'}
            </button>
          </div>
          <input
            type="password"
            value={twoFactorForm.password}
            onChange={e => setTwoFactorForm(prev => ({ ...prev, password: e.target.value }))}
            placeholder="输入当前密码确认操作"
          />
          <div className="security-action-row">
            <button type="button" className="save-btn" disabled={twoFactorSaving} onClick={handleSubmitTwoFactor}>
              {twoFactorSaving ? '处理中...' : (twoFactorState.enabled ? '关闭 2FA' : '开启 2FA')}
            </button>
          </div>
        </div>
      </div>
      {message && <div style={{ color: message.includes('失败') || message.includes('不一致') ? 'red' : 'green', marginTop: 12 }}>{message}</div>}
    </div>
  );
};

export default ProfilePage; 
