/**
 * @file IconPicker.tsx
 * @description 管理后台组件
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

/**
 * 图标选择器组件
 * 使用与前端相同的 SVG 图标进行预览
 * 选择的图标key会保存到数据库，前端根据key渲染对应的DesignIcons
 */

import React, { useState, useMemo } from 'react';
import { Modal, Input, Tabs, Tag, Empty, Tooltip } from 'antd';
import { SearchOutlined, CheckCircleFilled } from '@ant-design/icons';
import { availableIcons, iconCategories } from '../config/icons';

interface IconPickerProps {
  value?: string;
  onChange?: (value: string) => void;
}

const IconPicker: React.FC<IconPickerProps> = ({ value, onChange }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  // 过滤图标
  const filteredIcons = useMemo(() => {
    let icons = availableIcons;
    
    // 按分类过滤
    if (activeCategory !== 'all') {
      icons = icons.filter(icon => icon.category === activeCategory);
    }
    
    // 按关键词搜索
    if (searchKeyword) {
      const keyword = searchKeyword.toLowerCase();
      icons = icons.filter(icon => 
        icon.key.toLowerCase().includes(keyword) ||
        icon.name.toLowerCase().includes(keyword)
      );
    }
    
    return icons;
  }, [activeCategory, searchKeyword]);

  const handleSelect = (iconKey: string) => {
    onChange?.(iconKey);
    setModalOpen(false);
  };

  const selectedIcon = availableIcons.find(icon => icon.key === value);
  const SelectedIconComponent = selectedIcon?.icon;

  return (
    <>
      {/* 触发按钮 */}
      <div
        onClick={() => setModalOpen(true)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 12,
          padding: '8px 12px',
          border: '1px solid #d9d9d9',
          borderRadius: 8,
          cursor: 'pointer',
          background: '#fff',
          minWidth: 220,
          transition: 'all 0.2s',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.borderColor = '#1890ff';
          e.currentTarget.style.boxShadow = '0 0 0 2px rgba(24,144,255,0.1)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = '#d9d9d9';
          e.currentTarget.style.boxShadow = 'none';
        }}
      >
        {value && SelectedIconComponent ? (
          <>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: '#f5f5f5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <SelectedIconComponent size={22} color="#1890ff" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 500, fontSize: 14 }}>{selectedIcon?.name || value}</div>
              <div style={{ fontSize: 11, color: '#999' }}>{value}</div>
            </div>
          </>
        ) : (
          <span style={{ color: '#999' }}>点击选择图标...</span>
        )}
      </div>

      {/* 图标选择弹窗 */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>选择分类图标</span>
            <Tag color="green">控制前端侧边栏显示</Tag>
          </div>
        }
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
        width={750}
      >
        {/* 搜索框 */}
        <Input
          placeholder="搜索图标名称..."
          prefix={<SearchOutlined style={{ color: '#999' }} />}
          value={searchKeyword}
          onChange={e => setSearchKeyword(e.target.value)}
          allowClear
          style={{ marginBottom: 16 }}
          size="large"
        />

        {/* 分类标签 */}
        <Tabs
          activeKey={activeCategory}
          onChange={setActiveCategory}
          size="small"
          items={[
            { key: 'all', label: `全部 (${availableIcons.length})` },
            ...iconCategories.map(cat => ({
              key: cat.key,
              label: `${cat.name} (${availableIcons.filter(i => i.category === cat.key).length})`,
            })),
          ]}
        />

        {/* 图标网格 */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(6, 1fr)', 
          gap: 10, 
          maxHeight: 420, 
          overflow: 'auto',
          padding: 4,
        }}>
          {filteredIcons.length > 0 ? (
            filteredIcons.map(icon => {
              const isSelected = value === icon.key;
              const IconComponent = icon.icon;
              return (
                <Tooltip key={icon.key} title={`${icon.name} (${icon.key})`}>
                  <div
                    onClick={() => handleSelect(icon.key)}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: 14,
                      borderRadius: 10,
                      cursor: 'pointer',
                      border: isSelected ? '2px solid #1890ff' : '1px solid #e8e8e8',
                      background: isSelected ? '#e6f7ff' : '#fafafa',
                      position: 'relative',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={e => {
                      if (!isSelected) {
                        e.currentTarget.style.borderColor = '#1890ff';
                        e.currentTarget.style.background = '#f0f5ff';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                      }
                    }}
                    onMouseLeave={e => {
                      if (!isSelected) {
                        e.currentTarget.style.borderColor = '#e8e8e8';
                        e.currentTarget.style.background = '#fafafa';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }
                    }}
                  >
                    {isSelected && (
                      <CheckCircleFilled 
                        style={{ 
                          position: 'absolute', 
                          top: 6, 
                          right: 6, 
                          color: '#1890ff',
                          fontSize: 14,
                        }} 
                      />
                    )}
                    <IconComponent 
                      size={28} 
                      color={isSelected ? '#1890ff' : '#666'} 
                    />
                    <span style={{ 
                      fontSize: 11, 
                      color: isSelected ? '#1890ff' : '#666', 
                      marginTop: 6,
                      textAlign: 'center',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      width: '100%',
                      fontWeight: isSelected ? 500 : 400,
                    }}>
                      {icon.name}
                    </span>
                  </div>
                </Tooltip>
              );
            })
          ) : (
            <div style={{ gridColumn: '1 / -1' }}>
              <Empty description="没有找到匹配的图标" />
            </div>
          )}
        </div>

        {/* 提示 */}
        <div style={{ 
          marginTop: 16, 
          padding: 12, 
          background: 'linear-gradient(135deg, #f6ffed 0%, #e6fffb 100%)', 
          borderRadius: 8, 
          fontSize: 12, 
          color: '#52c41a',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          <span style={{ fontSize: 16 }}>💡</span>
          <span>选择的图标会显示在<strong>前端分类侧边栏</strong>中，与前端 DesignIcons 保持一致</span>
        </div>
      </Modal>
    </>
  );
};

export default IconPicker;
