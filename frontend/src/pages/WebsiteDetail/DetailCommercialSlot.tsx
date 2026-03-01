/**
 * @copyright Tomda (https://www.tomda.top)
 * @copyright UIED技术团队 (https://fsuied.com)
 * @author UIED技术团队
 * @createDate 2026-02-25
 */

import React, { useEffect, useState } from 'react';
import { AxiosError } from 'axios';
import api from '../../services/api';
import { unwrapApiResponse } from '../../utils/apiResponse';
import { debugLog } from '../../utils/debugHelper';

interface CommercialPlacementItem {
  id: number;
  sponsorName?: string;
  sponsorTitle?: string;
  targetUrl?: string;
  imageUrl?: string;
  textContent?: string;
  badgeText?: string;
}

interface DetailCommercialSlotProps {
  slotKey?: string;
  className?: string;
}

/**
 * 详情页商业位插槽组件
 * 根据 slotKey 从商业位体系读取当前生效投放，失败时静默隐藏。
 */
const DetailCommercialSlot: React.FC<DetailCommercialSlotProps> = ({ slotKey, className }) => {
  const [item, setItem] = useState<CommercialPlacementItem | null>(null);
  const imageUrl = String(item?.imageUrl || '').trim();
  const targetUrl = String(item?.targetUrl || '').trim();

  useEffect(() => {
    const fetchPlacement = async () => {
      const key = String(slotKey || '').trim();
      if (!key) {
        setItem(null);
        return;
      }
      try {
        const res = await api.get('/commercial/placements', {
          params: { slotKey: key, limit: 1 },
        });
        const payload = unwrapApiResponse<{ list?: CommercialPlacementItem[] } | CommercialPlacementItem[]>(
          res.data,
          { list: [] }
        );
        const list = Array.isArray(payload) ? payload : (Array.isArray(payload?.list) ? payload.list : []);
        setItem(list[0] || null);
      } catch (error) {
        /**
         * 商业位在未授权版本返回 403 属于预期行为，静默降级不输出告警。
         */
        const status = Number((error as AxiosError)?.response?.status || 0);
        if (status !== 403) {
          debugLog.warn(`获取详情页商业位失败（${key}）:`, error);
        }
        setItem(null);
      }
    };
    fetchPlacement();
  }, [slotKey]);

  if (!item) return null;

  return (
    <section className={['detail-commercial-slot', className || ''].filter(Boolean).join(' ')}>
      <a
        href={targetUrl || '#'}
        target="_blank"
        rel="noopener noreferrer"
        className="detail-commercial-slot__link"
      >
        <div className="detail-commercial-slot__content">
          <div className="detail-commercial-slot__meta">
            <span className="detail-commercial-slot__badge">
              {item.badgeText || '推荐'}
            </span>
            <div className="detail-commercial-slot__title">
              {item.sponsorTitle || item.sponsorName || '推荐内容'}
            </div>
            {item.textContent && (
              <div className="detail-commercial-slot__desc">{item.textContent}</div>
            )}
          </div>
          {imageUrl && (
            <div className="detail-commercial-slot__image">
              <img src={imageUrl} alt={item.sponsorTitle || '广告位'} loading="lazy" />
            </div>
          )}
        </div>
      </a>
    </section>
  );
};

export default DetailCommercialSlot;
