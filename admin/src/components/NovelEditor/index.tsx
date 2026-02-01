/**
 * @file components/NovelEditor/index.tsx
 * @description Novel 富文本编辑器组件 - Notion 风格的编辑器
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.1.0 - 添加图片上传功能
 */

import { useState, useEffect, useRef } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import { message } from 'antd';
import api from '../../services/api';
import './index.css';

interface NovelEditorProps {
  /** 初始内容（HTML 或 Markdown） */
  value?: string;
  /** 内容变化回调 */
  onChange?: (html: string, text: string) => void;
  /** 占位符文字 */
  placeholder?: string;
  /** 是否只读 */
  readOnly?: boolean;
  /** 最小高度 */
  minHeight?: number;
  /** 最大高度 */
  maxHeight?: number;
}

/**
 * Novel 风格的富文本编辑器
 * 基于 Tiptap，提供 Notion 风格的编辑体验
 */
const NovelEditor: React.FC<NovelEditorProps> = ({
  value = '',
  onChange,
  placeholder = '输入内容...',
  readOnly = false,
  minHeight = 200,
  maxHeight = 500,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 初始化编辑器
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'novel-link',
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'novel-image',
        },
      }),
    ],
    content: value,
    editable: !readOnly,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      const text = editor.getText();
      onChange?.(html, text);
    },
    onFocus: () => setIsFocused(true),
    onBlur: () => setIsFocused(false),
  });

  // 当外部 value 变化时更新编辑器内容
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  // 处理图片上传
  const handleImageUpload = async (file: File) => {
    if (!editor) return;
    
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const response = await api.post('/upload/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      // 获取上传后的 URL - 使用后端 API 地址而非当前页面地址
      const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
      const serverUrl = apiBaseUrl.replace(/\/api\/?$/, '');
      const uploadedUrl = response.data.url.startsWith('http') 
        ? response.data.url 
        : `${serverUrl}${response.data.url}`;
      
      // 插入图片到编辑器
      editor.chain().focus().setImage({ src: uploadedUrl }).run();
      message.success('图片上传成功');
    } catch (error) {
      console.error('图片上传失败:', error);
      message.error('图片上传失败');
    } finally {
      setUploading(false);
    }
  };

  // 触发文件选择
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // 处理文件选择
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageUpload(file);
      // 清空 input 以便可以重复选择同一文件
      e.target.value = '';
    }
  };

  // 工具栏按钮
  const ToolbarButton: React.FC<{
    onClick: () => void;
    isActive?: boolean;
    children: React.ReactNode;
    title?: string;
    disabled?: boolean;
  }> = ({ onClick, isActive, children, title, disabled }) => (
    <button
      type="button"
      className={`toolbar-btn ${isActive ? 'active' : ''} ${disabled ? 'disabled' : ''}`}
      onClick={onClick}
      title={title}
      disabled={disabled}
    >
      {children}
    </button>
  );

  if (!editor) {
    return <div className="novel-editor-loading">加载编辑器...</div>;
  }

  return (
    <div className={`novel-editor-wrapper ${isFocused ? 'focused' : ''}`}>
      {/* 隐藏的文件输入 */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
      
      {/* 工具栏 */}
      {!readOnly && (
        <div className="novel-toolbar">
          <div className="toolbar-group">
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBold().run()}
              isActive={editor.isActive('bold')}
              title="粗体"
            >
              <strong>B</strong>
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleItalic().run()}
              isActive={editor.isActive('italic')}
              title="斜体"
            >
              <em>I</em>
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleStrike().run()}
              isActive={editor.isActive('strike')}
              title="删除线"
            >
              <s>S</s>
            </ToolbarButton>
          </div>

          <div className="toolbar-divider" />

          <div className="toolbar-group">
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
              isActive={editor.isActive('heading', { level: 1 })}
              title="标题 1"
            >
              H1
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              isActive={editor.isActive('heading', { level: 2 })}
              title="标题 2"
            >
              H2
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
              isActive={editor.isActive('heading', { level: 3 })}
              title="标题 3"
            >
              H3
            </ToolbarButton>
          </div>

          <div className="toolbar-divider" />

          <div className="toolbar-group">
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              isActive={editor.isActive('bulletList')}
              title="无序列表"
            >
              •
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              isActive={editor.isActive('orderedList')}
              title="有序列表"
            >
              1.
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              isActive={editor.isActive('blockquote')}
              title="引用"
            >
              "
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleCodeBlock().run()}
              isActive={editor.isActive('codeBlock')}
              title="代码块"
            >
              {'</>'}
            </ToolbarButton>
          </div>

          <div className="toolbar-divider" />

          <div className="toolbar-group">
            <ToolbarButton
              onClick={() => {
                const url = window.prompt('输入链接地址:');
                if (url) {
                  editor.chain().focus().setLink({ href: url }).run();
                }
              }}
              isActive={editor.isActive('link')}
              title="插入链接"
            >
              🔗
            </ToolbarButton>
            <ToolbarButton
              onClick={triggerFileInput}
              title="上传图片"
              disabled={uploading}
            >
              {uploading ? '⏳' : '🖼️'}
            </ToolbarButton>
            <ToolbarButton
              onClick={() => {
                const url = window.prompt('输入图片地址:');
                if (url) {
                  editor.chain().focus().setImage({ src: url }).run();
                }
              }}
              title="插入图片URL"
            >
              🌐
            </ToolbarButton>
          </div>

          <div className="toolbar-spacer" />
        </div>
      )}

      {/* 编辑区域 */}
      <div 
        className="novel-editor-content"
        style={{ 
          minHeight, 
          maxHeight,
          overflowY: 'auto'
        }}
      >
        <EditorContent editor={editor} />
      </div>

      {/* 底部提示 */}
      {!readOnly && (
        <div className="novel-editor-footer">
          <span className="char-count">
            {editor.getText().length} 字符
          </span>
          <span className="tip">支持 Markdown 语法 | 可拖拽图片到编辑区</span>
        </div>
      )}
    </div>
  );
};

export default NovelEditor;
