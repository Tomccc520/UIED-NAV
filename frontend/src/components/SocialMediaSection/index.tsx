/**
 * @file SocialMediaSection/index.tsx
 * @description 关注交流组件 - 鼠标移入显示详细内容
 * @copyright Tomda (https://www.tomda.top)
 * @copyright UIED技术团队 (https://fsuied.com)
 * @author UIED技术团队
 * @createDate 2026.1.27
 */

import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { unwrapApiList } from '../../utils/apiResponse';
import './index.css';

interface SocialMediaItem {
  id: string;
  name: string;
  type: string;
  icon?: string;
  link?: string;
  qrCodeUrl?: string;
  description?: string;
  extraInfo?: string;
}

interface SocialMediaGroup {
  id: string;
  name: string;
  icon?: string;
  displayType: 'links' | 'qrcode' | 'mixed';
  items: SocialMediaItem[];
}

// 自定义 SVG 图标组件
const IconLink: React.FC<{ size?: number }> = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </svg>
);

const IconQRCode: React.FC<{ size?: number }> = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" />
    <rect x="14" y="3" width="7" height="7" />
    <rect x="3" y="14" width="7" height="7" />
    <rect x="14" y="14" width="3" height="3" />
    <rect x="18" y="14" width="3" height="3" />
    <rect x="14" y="18" width="3" height="3" />
    <rect x="18" y="18" width="3" height="3" />
  </svg>
);

const IconMessage: React.FC<{ size?: number }> = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
  </svg>
);

const IconShare: React.FC<{ size?: number }> = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="18" cy="5" r="3" />
    <circle cx="6" cy="12" r="3" />
    <circle cx="18" cy="19" r="3" />
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
  </svg>
);

const IconUsers: React.FC<{ size?: number }> = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const IconPhone: React.FC<{ size?: number }> = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);

const IconStar: React.FC<{ size?: number }> = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

// 社交媒体图标
const IconSocial: React.FC<{ size?: number }> = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21.4155 15.3411C18.5924 17.3495 14.8895 17.5726 11.877 16M2.58445 8.65889C5.41439 6.64566 9.12844 6.42638 12.1448 8.01149M15.3737 14.1243C18.2604 12.305 19.9319 8.97413 19.601 5.51222M8.58184 9.90371C5.72231 11.7291 4.06959 15.0436 4.39878 18.4878M15.5269 10.137C15.3939 6.72851 13.345 3.61684 10.1821 2.17222M8.47562 13.9256C8.63112 17.3096 10.6743 20.392 13.8177 21.8278M19.071 4.92893C22.9763 8.83418 22.9763 15.1658 19.071 19.071C15.1658 22.9763 8.83416 22.9763 4.92893 19.071C1.02369 15.1658 1.02369 8.83416 4.92893 4.92893C8.83418 1.02369 15.1658 1.02369 19.071 4.92893ZM14.8284 9.17157C16.3905 10.7337 16.3905 13.2663 14.8284 14.8284C13.2663 16.3905 10.7337 16.3905 9.17157 14.8284C7.60948 13.2663 7.60948 10.7337 9.17157 9.17157C10.7337 7.60948 13.2663 7.60948 14.8284 9.17157Z" />
  </svg>
);

// 官方社群图标
const IconCommunity: React.FC<{ size?: number }> = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.9996 11.5C20.9996 16.1944 17.194 20 12.4996 20C11.4228 20 10.3928 19.7998 9.44478 19.4345C9.27145 19.3678 9.18478 19.3344 9.11586 19.3185C9.04807 19.3029 8.999 19.2963 8.92949 19.2937C8.85881 19.291 8.78127 19.299 8.62619 19.315L3.50517 19.8444C3.01692 19.8948 2.7728 19.9201 2.6288 19.8322C2.50337 19.7557 2.41794 19.6279 2.3952 19.4828C2.36909 19.3161 2.48575 19.1002 2.71906 18.6684L4.35472 15.6408C4.48942 15.3915 4.55677 15.2668 4.58728 15.1469C4.6174 15.0286 4.62469 14.9432 4.61505 14.8214C4.60529 14.6981 4.55119 14.5376 4.443 14.2166C4.15547 13.3636 3.99962 12.45 3.99962 11.5C3.99962 6.80558 7.8052 3 12.4996 3C17.194 3 20.9996 6.80558 20.9996 11.5Z" />
    <path fillRule="evenodd" clipRule="evenodd" d="M12.4965 8.94925C11.5968 7.9104 10.0965 7.63095 8.96924 8.58223C7.84196 9.5335 7.68326 11.124 8.56851 12.2491C9.11696 12.9461 10.4935 14.2191 11.4616 15.087C11.8172 15.4057 11.995 15.5651 12.2084 15.6293C12.3914 15.6844 12.6017 15.6844 12.7847 15.6293C12.9981 15.5651 13.1759 15.4057 13.5315 15.087C14.4996 14.2191 15.8761 12.9461 16.4246 12.2491C17.3098 11.124 17.1705 9.5235 16.0238 8.58223C14.8772 7.64096 13.3963 7.9104 12.4965 8.94925Z" />
  </svg>
);

// 公众号图标
const IconOfficialAccount: React.FC<{ size?: number }> = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6.09436 11.2288C6.03221 10.8282 5.99996 10.4179 5.99996 10C5.99996 5.58172 9.60525 2 14.0526 2C18.4999 2 22.1052 5.58172 22.1052 10C22.1052 10.9981 21.9213 11.9535 21.5852 12.8345C21.5154 13.0175 21.4804 13.109 21.4646 13.1804C21.4489 13.2512 21.4428 13.301 21.4411 13.3735C21.4394 13.4466 21.4493 13.5272 21.4692 13.6883L21.8717 16.9585C21.9153 17.3125 21.9371 17.4895 21.8782 17.6182C21.8266 17.731 21.735 17.8205 21.6211 17.8695C21.4911 17.9254 21.3146 17.8995 20.9617 17.8478L17.7765 17.3809C17.6101 17.3565 17.527 17.3443 17.4512 17.3448C17.3763 17.3452 17.3245 17.3507 17.2511 17.3661C17.177 17.3817 17.0823 17.4172 16.893 17.4881C16.0097 17.819 15.0524 18 14.0526 18C13.6344 18 13.2237 17.9683 12.8227 17.9073M7.63158 22C10.5965 22 13 19.5376 13 16.5C13 13.4624 10.5965 11 7.63158 11C4.66668 11 2.26316 13.4624 2.26316 16.5C2.26316 17.1106 2.36028 17.6979 2.53955 18.2467C2.61533 18.4787 2.65322 18.5947 2.66566 18.6739C2.67864 18.7567 2.68091 18.8031 2.67608 18.8867C2.67145 18.9668 2.65141 19.0573 2.61134 19.2383L2 22L4.9948 21.591C5.15827 21.5687 5.24 21.5575 5.31137 21.558C5.38652 21.5585 5.42641 21.5626 5.50011 21.5773C5.5701 21.5912 5.67416 21.6279 5.88227 21.7014C6.43059 21.8949 7.01911 22 7.63158 22Z" />
  </svg>
);

// 图标映射
const GroupIcons: Record<string, React.FC<{ size?: number }>> = {
  link: IconLink,
  qrcode: IconQRCode,
  wechat: IconMessage,
  weibo: IconShare,
  group: IconUsers,
  phone: IconPhone,
  message: IconMessage,
  star: IconStar,
  social: IconSocial,
  community: IconCommunity,
  official: IconOfficialAccount,
};

// 内容项类型图标 - 使用中文简称
const typeIcons: Record<string, string> = {
  weibo: '微',
  bilibili: 'B',
  xiaohongshu: '红',
  douyin: '抖',
  wechat_official: '公',
  wechat_group: '群',
  wechat_mini: '小',
  qq_group: 'Q',
  other: '链',
};

// 渲染分组图标
const renderGroupIcon = (iconKey?: string) => {
  const IconComponent = GroupIcons[iconKey || 'link'] || GroupIcons.link;
  return <IconComponent size={24} />;
};

const SocialMediaSection: React.FC = () => {
  const [groups, setGroups] = useState<SocialMediaGroup[]>([]);
  const [activeGroup, setActiveGroup] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const res = await api.get('/social-media');
        // 使用工具函数解包数据，确保返回数组
        const data = unwrapApiList<SocialMediaGroup>(res.data);
        setGroups(data);
      } catch (error) {
        console.error('获取关注交流数据失败:', error);
        // 出错时也重置为空数组
        setGroups([]);
      } finally {
        setLoading(false);
      }
    };
    fetchGroups();
  }, []);

  // 增加数组类型检查
  if (loading || !Array.isArray(groups) || groups.length === 0) return null;

  return (
    <div className="social-media-section">
      <div className="social-media-groups">
        {Array.isArray(groups) && groups.map((group) => (
          <div
            key={group.id}
            className={`social-media-group ${activeGroup === group.id ? 'active' : ''}`}
            onMouseEnter={() => setActiveGroup(group.id)}
            onMouseLeave={() => setActiveGroup(null)}
          >
            {/* 分组标题 */}
            <div className="group-trigger">
              <span className="group-icon">{renderGroupIcon(group.icon)}</span>
              <span className="group-name">{group.name}</span>
            </div>

            {/* 悬浮内容 */}
            <div className="group-content">
              {group.displayType === 'links' && (
                <LinksDisplay items={group.items} />
              )}
              {group.displayType === 'qrcode' && (
                <QRCodeDisplay items={group.items} />
              )}
              {group.displayType === 'mixed' && (
                <MixedDisplay items={group.items} />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// 链接列表展示
const LinksDisplay: React.FC<{ items: SocialMediaItem[] }> = ({ items }) => (
  <div className="links-display">
    {items.map((item) => (
      <a
        key={item.id}
        href={item.link || '#'}
        target="_blank"
        rel="noopener noreferrer"
        className="link-item"
      >
        <span className="link-icon">{typeIcons[item.type] || '链'}</span>
        <div className="link-info">
          <span className="link-name">{item.name}</span>
          {item.description && <span className="link-desc">{item.description}</span>}
        </div>
      </a>
    ))}
  </div>
);

// 二维码展示
const QRCodeDisplay: React.FC<{ items: SocialMediaItem[] }> = ({ items }) => (
  <div className="qrcode-display">
    {items.map((item) => (
      <div key={item.id} className="qrcode-item">
        {item.qrCodeUrl && (
          <img src={item.qrCodeUrl} alt={item.name} className="qrcode-img" />
        )}
        <div className="qrcode-info">
          <span className="qrcode-name">{item.name}</span>
          {item.description && <span className="qrcode-desc">{item.description}</span>}
        </div>
      </div>
    ))}
  </div>
);

// 混合展示（带群列表）
const MixedDisplay: React.FC<{ items: SocialMediaItem[] }> = ({ items }) => (
  <div className="mixed-display">
    {items.map((item) => {
      // 解析额外信息（如群列表）
      let extraData: { groups?: string[] } = {};
      try {
        if (item.extraInfo) extraData = JSON.parse(item.extraInfo);
      } catch {}

      return (
        <div key={item.id} className="mixed-item">
          <div className="mixed-header">
            <span className="mixed-icon">{typeIcons[item.type] || '链'}</span>
            <span className="mixed-name">{item.name}</span>
          </div>
          
          {/* 群列表 */}
          {extraData.groups && extraData.groups.length > 0 && (
            <ul className="group-list">
              {extraData.groups.map((g, i) => (
                <li key={i}><span className="group-num">{String(i + 1).padStart(2, '0')}</span>{g}</li>
              ))}
            </ul>
          )}
          
          {/* 二维码和描述 */}
          <div className="mixed-footer">
            {item.qrCodeUrl && (
              <img src={item.qrCodeUrl} alt={item.name} className="mixed-qrcode" />
            )}
            <div className="mixed-desc-box">
              {item.description && <p className="mixed-desc">{item.description}</p>}
            </div>
          </div>
        </div>
      );
    })}
  </div>
);

export default SocialMediaSection;
