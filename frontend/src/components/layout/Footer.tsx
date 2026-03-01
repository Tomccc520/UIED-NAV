/**
 * @file Footer.tsx
 * @description 页脚组件，显示网站底部信息和版权声明
 * @copyright 版权所有 (c) 2024 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 3.0.0 - 对接后台API
 */

import React, { useState } from 'react';
import { useFooterGroups, useFriendLinks } from '../../hooks/useSettings';
import { useSiteInfo } from '../../hooks/useSiteInfo';
import SocialMediaSection from '../SocialMediaSection';
import './Footer.css';

/**
 * 页脚组件
 * 从后台API获取页脚内容
 */
const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  const [expanded, setExpanded] = useState(false);
  
  // 从API获取数据
  const { groups: footerGroups, loading: groupsLoading } = useFooterGroups();
  const { links: friendLinks, loading: linksLoading } = useFriendLinks();
  const { siteInfo } = useSiteInfo();

  // 切换显示/隐藏详细信息
  const toggleExpanded = () => {
    setExpanded(!expanded);
  };

  // 渲染页脚分组
  const renderFooterSection = (group: typeof footerGroups[0]) => (
    <div className="footer-section" key={group.id}>
      <h6 className="widget-title">{group.title}</h6>
      <ul className="footer-menu">
        {group.links.map(link => (
          <li key={link.id}>
            <a 
              href={link.url} 
              target={link.external ? "_blank" : "_self"}
              rel={link.external ? "noopener noreferrer" : undefined}
            >
              {link.text}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );

  // 渲染移动端页脚分组
  const renderMobileFooterSection = (group: typeof footerGroups[0]) => (
    <div className="footer-section-mobile" key={group.id}>
      <h6 className="widget-title">{group.title}</h6>
      <ul className="footer-menu">
        {group.links.map(link => (
          <li key={link.id}>
            <a 
              href={link.url} 
              target={link.external ? "_blank" : "_self"}
              rel={link.external ? "noopener noreferrer" : undefined}
            >
              {link.text}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <div 
      className="footer-container"
      style={{
        backgroundImage: 'url(https://img.uied.cn/wp-content/themes/b2Jitheme/Center/Assets/images/footer-bg.svg)'
      }}
    >
      <div className="footer-main">
        <div className="footer-content-wrapper">
          {/* 移动端版本的简洁页脚 */}
          <div className="footer-mobile-view">
            <div className="textwidget mobile-text-center">
              UIED设计导航汇集优质设计工具与资源，为设计师提供一站式工具导航服务
            </div>
            
            <button className="footer-toggle-btn" onClick={toggleExpanded}>
              {expanded ? (
                <>收起更多 <span>▲</span></>
              ) : (
                <>查看更多 <span>▼</span></>
              )}
            </button>
            
            {expanded && (
              <div className="footer-sections-mobile">
                <div className="footer-sections-grid">
                  {/* 从API获取的页脚分组 */}
                  {!groupsLoading && footerGroups.map(renderMobileFooterSection)}
                </div>
                
                {/* 移动端关注交流区域 */}
                <div className="footer-mobile-social">
                  <h6 className="widget-title">关注交流</h6>
                  <SocialMediaSection />
                </div>
              </div>
            )}
          </div>
          
          {/* 桌面版的完整页脚 */}
          <div className="footer-desktop-view">
            <div className="footer-sections-grid">
              {/* 关于UIED - 固定内容 */}
              <div className="footer-section footer-about-section">
                <h6 className="widget-title">UIED设计导航</h6>
                <div className="textwidget">
                  UIED设计导航汇集优质设计工具与资源，涵盖UI/UX设计、平面设计、AI设计工具、三维设计等多个领域。提供Figma、Sketch、Adobe等专业设计软件资源，包含设计灵感、素材库、配色工具、字体资源、图标库等。为设计师提供一站式设计工具导航服务，助力提升设计效率与创作灵感。
                </div>
                {/* 操作按钮 */}
                <div className="footer-actions">
                  <a 
                    href="/submit"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="footer-action-btn footer-submit-btn"
                  >
                    <svg 
                      width="16" 
                      height="16" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                    提交网站
                  </a>
                  <a 
                    href="/changelog"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="footer-action-btn footer-changelog-btn"
                  >
                    <svg 
                      width="16" 
                      height="16" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="16" y1="13" x2="8" y2="13" />
                      <line x1="16" y1="17" x2="8" y2="17" />
                      <polyline points="10 9 9 9 8 9" />
                    </svg>
                    更新记录
                  </a>
                </div>
              </div>
              
              {/* 从API获取的页脚分组 */}
              {!groupsLoading && footerGroups.map(renderFooterSection)}
              
              {/* 关注交流 - 放在最后 */}
              <div className="footer-section footer-social-section">
                <h6 className="widget-title">关注交流</h6>
                <SocialMediaSection />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* 友情链接 - 从API获取 */}
      <div className="friend-links-container">
        <div className="friend-links-wrapper">
          <h6 className="friend-links-title">友情链接:</h6>
          <span className="friend-links-list">
            {!linksLoading && friendLinks.map((link, index) => (
              <React.Fragment key={link.id}>
                <a 
                  href={link.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="friend-link"
                >
                  {link.name}
                </a>
                {index < friendLinks.length - 1 && " \u00A0\u00A0\u00A0"}
              </React.Fragment>
            ))}
          </span>
        </div>
      </div>
      
      {/* 底部版权信息 */}
      <div className="footer-bottom">
        <div className="footer-bottom-wrapper">
          <div className="footer-copyright">
            <p className="copyright-desktop">
              {siteInfo?.copyright || `版权所有 © ${currentYear} UIED设计导航`}
              {siteInfo?.icp && (
                <>
                  {' · '}
                  <a rel="nofollow noopener noreferrer" target="_blank" href={siteInfo.icpLink || 'https://beian.miit.gov.cn'}>
                    {siteInfo.icp}
                  </a>
                </>
              )}
            </p>
            
            <div className="copyright-mobile">
              <p>{siteInfo?.copyright || `版权所有 © ${currentYear} UIED设计导航平台`}</p>
              {siteInfo?.icp && (
                <p>
                  <a rel="nofollow noopener noreferrer" target="_blank" href={siteInfo.icpLink || 'https://beian.miit.gov.cn'}>
                    {siteInfo.icp}
                  </a>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Footer;
