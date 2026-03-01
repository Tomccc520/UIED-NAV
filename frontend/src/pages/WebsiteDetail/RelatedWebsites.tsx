/**
 * @file pages/WebsiteDetail/RelatedWebsites.tsx
 * @description 相关推荐组件
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 2.0.0
 */

import React from 'react';
import { Link } from 'react-router-dom';
import WebsiteFavicon from '../../components/WebsiteFavicon';

interface RelatedWebsite {
  id: string;
  name: string;
  slug?: string;
  description: string;
  url?: string;
  iconUrl?: string;
  category?: {
    name: string;
  };
}

interface RelatedWebsitesProps {
  websites: RelatedWebsite[];
  loading?: boolean;
}

const RelatedWebsites: React.FC<RelatedWebsitesProps> = ({ websites, loading }) => {
  if (loading) {
    return (
      <section className="related-section">
        <h2 className="related-title">你可能还喜欢</h2>
        <div className="related-loading">加载中...</div>
      </section>
    );
  }

  if (!websites || websites.length === 0) {
    return null;
  }

  return (
    <section className="related-section">
      <h2 className="related-title">你可能还喜欢</h2>
      <div className="related-grid">
        {websites.map((site) => (
          <Link 
            key={site.id} 
            to={`/website/${site.slug || site.id}`}
            className="related-card"
          >
            <div className="related-card-icon">
              <WebsiteFavicon
                websiteUrl={site.url}
                iconUrl={site.iconUrl}
                name={site.name}
                size={40}
              />
            </div>
            <div className="related-card-info">
              <h3 className="related-card-name">{site.name}</h3>
              <p className="related-card-desc">{site.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default RelatedWebsites;
