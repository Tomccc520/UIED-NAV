/**
 * @file AuthModal.tsx
 * @description 用户认证弹窗 - 支持登录和注册
 * @copyright 版权所有 (c) 2026 UIED技术团队
 */
/**
 * @copyright Tomda (https://www.tomda.top)
 * @copyright UIED技术团队 (https://fsuied.com)
 * @author UIED技术团队
 * @createDate 2026.1.27
 */

import React, { useState, useEffect } from 'react';
import { useUser } from '../../contexts/UserContext';
import userService, { LoginTwoFactorChallenge } from '../../services/userService';
import Modal from '../UI/Modal';
import './AuthModal.css';

interface AuthModalProps {
  visible: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
}

/**
 * 用户登录/注册弹窗组件
 */
const AuthModal: React.FC<AuthModalProps> = ({ 
  visible, 
  onClose, 
  initialMode = 'login' 
}) => {
  const { login, verifyLoginTwoFactor, register, error: authError, clearError, loading } = useUser();
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [twoFactorChallenge, setTwoFactorChallenge] = useState<LoginTwoFactorChallenge | null>(null);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [sendingTwoFactorCode, setSendingTwoFactorCode] = useState(false);
  
  // 表单状态
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    nickname: '', // 注册时可选
  });

  // 本地错误状态（表单验证）
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (visible) {
      setMode(initialMode);
      setFormData({ username: '', password: '', confirmPassword: '', nickname: '' });
      setTwoFactorChallenge(null);
      setTwoFactorCode('');
      setErrors({});
      clearError();
    }
  }, [visible, initialMode, clearError]);

  /**
   * 校验表单输入
   */
  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (twoFactorChallenge) {
      if (!twoFactorCode.trim()) {
        newErrors.twoFactorCode = '请输入验证码';
      }
      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    }
    if (!formData.username.trim()) {
      newErrors.username = '请输入用户名/账号';
    }
    if (!formData.password) {
      newErrors.password = '请输入密码';
    }
    if (mode === 'register') {
      if (formData.password.length < 6) {
        newErrors.password = '密码长度至少6位';
      }
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = '两次密码输入不一致';
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * 提交表单数据
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      if (mode === 'login') {
        if (twoFactorChallenge) {
          await verifyLoginTwoFactor({
            challengeToken: twoFactorChallenge.challengeToken,
            code: twoFactorCode.trim(),
          });
        } else {
          const result = await login({
            username: formData.username,
            account: formData.username,
            password: formData.password,
          });
          if (result?.need2fa && result.challenge) {
            setTwoFactorChallenge(result.challenge);
            setTwoFactorCode('');
            setErrors({});
            return;
          }
        }
      } else {
        await register({
          username: formData.username,
          password: formData.password,
          confirmPassword: formData.confirmPassword,
          nickname: formData.nickname || undefined,
        });
      }
      // 成功后关闭弹窗
      onClose();
    } catch (err) {
      // 错误由 Context 处理并存储在 authError 中
    }
  };

  /**
   * 处理输入框变化
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // 清除对应字段的错误
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  /**
   * 切换登录/注册模式
   */
  const switchMode = (newMode: 'login' | 'register') => {
    setMode(newMode);
    setTwoFactorChallenge(null);
    setTwoFactorCode('');
    setErrors({});
    clearError();
  };

  /**
   * 重新发送登录 2FA 验证码
   */
  const handleResendTwoFactorCode = async () => {
    if (!twoFactorChallenge?.challengeToken) return;
    setSendingTwoFactorCode(true);
    try {
      await userService.sendLoginTwoFactorCode(twoFactorChallenge.challengeToken);
    } catch (error) {
      // 具体错误由全局拦截统一处理
    } finally {
      setSendingTwoFactorCode(false);
    }
  };

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      width={400}
      title=""
      closable={false} // 禁用默认头部
      className="auth-modal"
    >
      <div className="auth-modal-content">
        <button className="auth-close-btn" onClick={onClose}>×</button>
        
        <div className="auth-header">
          <div className="auth-logo">UIED</div>
          <h2 className="auth-title">
            {mode === 'login' ? '欢迎回来' : '加入 UIED'}
          </h2>
          <p className="auth-subtitle">
            {mode === 'login' ? '登录以体验更多精彩功能' : '开启您的设计探索之旅'}
          </p>
        </div>

        <div className="auth-switch-wrapper">
          <div className="auth-switch-simple">
            <button 
              className={`auth-switch-btn ${mode === 'login' ? 'active' : ''}`}
              onClick={() => switchMode('login')}
            >
              登录
            </button>
            <div className="auth-switch-divider"></div>
            <button 
              className={`auth-switch-btn ${mode === 'register' ? 'active' : ''}`}
              onClick={() => switchMode('register')}
            >
              注册
            </button>
          </div>
        </div>

        {authError && (
          <div className="auth-global-error">
            {authError.message}
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          {!twoFactorChallenge ? (
            <>
              <div className="form-item">
                <label className="form-label">账号</label>
                <div className="input-wrapper">
                  <input
                    type="text"
                    name="username"
                    className={`form-input ${errors.username ? 'error' : ''}`}
                    placeholder="用户名 / 手机号 / 邮箱"
                    value={formData.username}
                    onChange={handleInputChange}
                  />
                </div>
                {errors.username && <span className="form-error-msg">{errors.username}</span>}
              </div>

              {mode === 'register' && (
                <div className="form-item">
                  <label className="form-label">昵称 (选填)</label>
                  <div className="input-wrapper">
                    <input
                      type="text"
                      name="nickname"
                      className="form-input"
                      placeholder="怎么称呼您"
                      value={formData.nickname}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              )}

              <div className="form-item">
                <label className="form-label">密码</label>
                <div className="input-wrapper">
                  <input
                    type="password"
                    name="password"
                    className={`form-input ${errors.password ? 'error' : ''}`}
                    placeholder="请输入密码"
                    value={formData.password}
                    onChange={handleInputChange}
                  />
                </div>
                {errors.password && <span className="form-error-msg">{errors.password}</span>}
              </div>

              {mode === 'register' && (
                <div className="form-item">
                  <label className="form-label">确认密码</label>
                  <div className="input-wrapper">
                    <input
                      type="password"
                      name="confirmPassword"
                      className={`form-input ${errors.confirmPassword ? 'error' : ''}`}
                      placeholder="请再次输入密码"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                    />
                  </div>
                  {errors.confirmPassword && <span className="form-error-msg">{errors.confirmPassword}</span>}
                </div>
              )}
            </>
          ) : (
            <div className="form-item">
              <label className="form-label">二次验证验证码</label>
              <div className="auth-global-error" style={{ marginBottom: 12 }}>
                已向 {twoFactorChallenge.maskedAccount || '安全账号'} 发送验证码，请输入后完成登录。
              </div>
              <div className="input-wrapper">
                <input
                  type="text"
                  name="twoFactorCode"
                  className={`form-input ${errors.twoFactorCode ? 'error' : ''}`}
                  placeholder="请输入 6 位验证码"
                  value={twoFactorCode}
                  onChange={e => {
                    setTwoFactorCode(e.target.value);
                    if (errors.twoFactorCode) {
                      setErrors(prev => ({ ...prev, twoFactorCode: '' }));
                    }
                  }}
                />
              </div>
              {errors.twoFactorCode && <span className="form-error-msg">{errors.twoFactorCode}</span>}
              <div className="auth-footer" style={{ marginTop: 10 }}>
                <span className="auth-link" onClick={handleResendTwoFactorCode}>
                  {sendingTwoFactorCode ? '发送中...' : '重新发送验证码'}
                </span>
              </div>
            </div>
          )}

          <button 
            type="submit" 
            className="auth-submit-btn"
            disabled={loading}
          >
            {loading ? '处理中...' : (twoFactorChallenge ? '提交验证码' : (mode === 'login' ? '立即登录' : '立即注册'))}
          </button>
        </form>

        {!twoFactorChallenge && (
        <div className="auth-footer">
          {mode === 'login' ? (
            <>
              还没有账号？
              <span className="auth-link" onClick={() => switchMode('register')}>
                立即注册
              </span>
            </>
          ) : (
            <>
              已有账号？
              <span className="auth-link" onClick={() => switchMode('login')}>
                立即登录
              </span>
            </>
          )}
        </div>
        )}
      </div>
    </Modal>
  );
};

export default AuthModal;
