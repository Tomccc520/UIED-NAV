/**
 * @file Input.tsx
 * @description 前端用户界面组件
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

import React from 'react';
import './Input.css';

interface InputProps {
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  onKeyPress?: (e: React.KeyboardEvent) => void;
  type?: 'text' | 'email' | 'password' | 'search';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
  icon?: React.ReactNode;
  suffix?: React.ReactNode;
}

const Input: React.FC<InputProps> = ({
  placeholder,
  value,
  onChange,
  onKeyPress,
  type = 'text',
  size = 'medium',
  disabled = false,
  className = '',
  style,
  icon,
  suffix,
  ...props
}) => {
  const inputClass = `
    custom-input-wrapper
    custom-input-wrapper--${size}
    ${className}
    ${disabled ? 'custom-input-wrapper--disabled' : ''}
    ${icon ? 'custom-input-wrapper--with-icon' : ''}
    ${suffix ? 'custom-input-wrapper--with-suffix' : ''}
  `.trim();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onChange) {
      onChange(e.target.value);
    }
  };

  return (
    <div className={inputClass} style={style}>
      {icon && <span className="custom-input__icon">{icon}</span>}
      <input
        className="custom-input"
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
        onKeyPress={onKeyPress}
        disabled={disabled}
        {...props}
      />
      {suffix && <span className="custom-input__suffix">{suffix}</span>}
    </div>
  );
};

export default Input; 