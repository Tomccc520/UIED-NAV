/**
 * @file pages/Articles/ArticleComments.tsx
 * @description 文章评论组件（Pro 功能）
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

// @pro-feature-start: article-comments
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { AxiosError } from 'axios';
import { getArticleComments, createArticleComment } from '../../services/articleService';
import { CommentItem } from '../../types/article';
import './ArticleComments.css';

interface ArticleCommentsProps {
  articleId: string;
  initialCount?: number;
  userId?: string; // Pro 版本中从认证获取
}

interface GroupedCommentItem {
  root: CommentItem;
  replies: CommentItem[];
}

/**
 * 默认头像组件
 */
const DefaultAvatar: React.FC<{ name: string; size?: number }> = ({ name, size = 40 }) => {
  const initial = name ? name.charAt(0).toUpperCase() : '?';
  const colors = ['#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1', '#13c2c2', '#eb2f96', '#fa8c16'];
  const colorIndex = name ? name.charCodeAt(0) % colors.length : 0;
  
  return (
    <div 
      className="article-comment-avatar-default"
      style={{ 
        width: size, 
        height: size, 
        backgroundColor: colors[colorIndex],
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontWeight: 600,
        fontSize: size * 0.4,
        flexShrink: 0,
      }}
    >
      {initial}
    </div>
  );
};

/**
 * 格式化时间
 */
const formatTime = (dateString: string): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes} 分钟前`;
  if (hours < 24) return `${hours} 小时前`;
  if (days < 30) return `${days} 天前`;
  
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

/**
 * 解析评论时间戳，异常时回退为 0
 */
const parseCommentTime = (comment: CommentItem): number => {
  const timestamp = new Date(comment.createTime || '').getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
};

/**
 * 判断评论文本是否需要折叠展示
 */
const shouldCollapseCommentText = (content: string): boolean => {
  return String(content || '').trim().length > 180;
};

/**
 * 文章评论组件
 */
const ArticleComments: React.FC<ArticleCommentsProps> = ({
  articleId,
  initialCount = 0,
  userId,
}) => {
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(initialCount);
  const [sortType, setSortType] = useState<'latest' | 'hot'>('latest');
  const [expandedReplyParentMap, setExpandedReplyParentMap] = useState<Record<number, boolean>>({});
  const [expandedCommentTextMap, setExpandedCommentTextMap] = useState<Record<number, boolean>>({});
  const [activeReplyParentId, setActiveReplyParentId] = useState<number | null>(null);
  const [replyDraftMap, setReplyDraftMap] = useState<Record<number, string>>({});
  const [replySubmittingParentId, setReplySubmittingParentId] = useState<number | null>(null);
  const commentCharCount = commentText.trim().length;

  /**
   * 组装“主评论 + 回复”结构，并按当前排序方式输出
   */
  const groupedComments = useMemo<GroupedCommentItem[]>(() => {
    const source = Array.isArray(comments) ? comments.slice() : [];
    if (source.length === 0) return [];

    const replyMap = new Map<number, CommentItem[]>();
    const roots: CommentItem[] = [];

    source.forEach((item) => {
      const parentId = Number(item.parentId || 0);
      if (parentId > 0) {
        const group = replyMap.get(parentId) || [];
        group.push(item);
        replyMap.set(parentId, group);
      } else {
        roots.push(item);
      }
    });

    // 部分历史数据可能全是 parentId=0 或无 parentId，兜底全部按主评论展示
    const rootSource = roots.length > 0 ? roots : source;
    const sortedRoots = rootSource.sort((a, b) => {
      if (sortType === 'hot') {
        const likeDelta = Number(b.likeCount || 0) - Number(a.likeCount || 0);
        if (likeDelta !== 0) return likeDelta;
      }
      return parseCommentTime(b) - parseCommentTime(a);
    });

    return sortedRoots.map((root) => {
      const replies = (replyMap.get(Number(root.id || 0)) || []).slice()
        .sort((a, b) => parseCommentTime(a) - parseCommentTime(b));
      return { root, replies };
    });
  }, [comments, sortType]);

  /**
   * 切换回复折叠状态
   */
  const toggleReplyFold = useCallback((parentId: number) => {
    setExpandedReplyParentMap((prev) => ({
      ...prev,
      [parentId]: !prev[parentId],
    }));
  }, []);

  /**
   * 切换评论正文折叠状态
   */
  const toggleCommentTextExpand = useCallback((commentId: number) => {
    setExpandedCommentTextMap((prev) => ({
      ...prev,
      [commentId]: !prev[commentId],
    }));
  }, []);

  /**
   * 获取评论列表
   */
  const fetchCommentsData = useCallback(async (pageNum: number = 1, sort: 'latest' | 'hot' = sortType) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await getArticleComments(Number(articleId), {
        page: pageNum, 
        pageSize: 10,
        sort,
      });

      if (pageNum === 1) {
        setComments(response.data);
      } else {
        setComments(prev => [...prev, ...response.data]);
      }
      setTotal(response.pagination.total);
      setTotalPages(response.pagination.totalPages);
      setPage(response.pagination.page);
    } catch (err: unknown) {
      console.error('获取文章评论失败:', err);
      setError('获取评论失败');
    } finally {
      setLoading(false);
    }
  }, [articleId, sortType]);

  /**
   * 初始加载与排序切换时重新拉取评论
   */
  useEffect(() => {
    fetchCommentsData(1, sortType);
  }, [fetchCommentsData, sortType]);

  /**
   * 校验评论操作登录状态
   */
  const ensureCommentAuth = useCallback((): boolean => {
    if (userId) return true;
    const token = localStorage.getItem('token');
    if (token) return true;
    setError('请先登录后再评论');
    return false;
  }, [userId]);

  /**
   * 提交评论
   */
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!ensureCommentAuth()) return;
    
    const trimmedText = commentText.trim();
    if (!trimmedText) {
      setError('评论内容不能为空');
      return;
    }
    
    // 文章评论限制 1000 字符
    if (trimmedText.length > 1000) {
      setError('评论内容不能超过 1000 字符');
      return;
    }
    
    try {
      setSubmitting(true);
      setError(null);
      
      const newComment = await createArticleComment(Number(articleId), {
        text: trimmedText,
        parentId: 0
      });

      if (newComment && newComment.id) {
        // 文章评论按正序排列，新评论添加到列表末尾
        setComments(prev => [...prev, { ...newComment, parentId: 0 }]);
        setTotal(prev => prev + 1);
        setCommentText('');
      }
    } catch (err: unknown) {
      console.error('发表评论失败:', err);
      const axiosError = err as AxiosError<{ message?: string }>;
      setError(axiosError.response?.data?.message || '发表评论失败，请稍后重试');
    } finally {
      setSubmitting(false);
    }
  };

  /**
   * 切换楼中楼回复输入框
   */
  const toggleReplyInput = useCallback((parentId: number) => {
    setActiveReplyParentId((prev) => (prev === parentId ? null : parentId));
    setExpandedReplyParentMap((prev) => ({
      ...prev,
      [parentId]: true,
    }));
  }, []);

  /**
   * 更新楼中楼回复草稿
   */
  const updateReplyDraft = useCallback((parentId: number, text: string) => {
    setReplyDraftMap((prev) => ({
      ...prev,
      [parentId]: text,
    }));
  }, []);

  /**
   * 提交楼中楼回复
   */
  const handleReplySubmit = useCallback(async (parentId: number) => {
    if (!ensureCommentAuth()) return;
    const draft = String(replyDraftMap[parentId] || '').trim();
    if (!draft) {
      setError('回复内容不能为空');
      return;
    }
    if (draft.length > 1000) {
      setError('回复内容不能超过 1000 字符');
      return;
    }
    try {
      setReplySubmittingParentId(parentId);
      setError(null);
      const reply = await createArticleComment(Number(articleId), {
        text: draft,
        parentId,
      });
      if (reply && reply.id) {
        setComments((prev) => [...prev, { ...reply, parentId }]);
        setTotal((prev) => prev + 1);
        setReplyDraftMap((prev) => ({
          ...prev,
          [parentId]: '',
        }));
        setExpandedReplyParentMap((prev) => ({
          ...prev,
          [parentId]: true,
        }));
      }
    } catch (err: unknown) {
      console.error('回复评论失败:', err);
      const axiosError = err as AxiosError<{ message?: string }>;
      setError(axiosError.response?.data?.message || '回复失败，请稍后重试');
    } finally {
      setReplySubmittingParentId(null);
    }
  }, [articleId, ensureCommentAuth, replyDraftMap]);

  /**
   * 加载更多
   */
  const handleLoadMore = () => {
    if (page < totalPages) {
      fetchCommentsData(page + 1, sortType);
    }
  };

  return (
    <div className="article-comments-section">
      <div className="article-comments-head">
        <h3 className="article-comments-title">
          评论
          {total > 0 && <span className="article-comments-count">({total})</span>}
        </h3>
        <div className="article-comments-sort">
          <button
            type="button"
            className={`article-comments-sort-btn ${sortType === 'latest' ? 'is-active' : ''}`}
            onClick={() => setSortType('latest')}
          >
            最新
          </button>
          <button
            type="button"
            className={`article-comments-sort-btn ${sortType === 'hot' ? 'is-active' : ''}`}
            onClick={() => setSortType('hot')}
          >
            最热
          </button>
        </div>
      </div>
      
      {/* 评论列表 */}
      <div className="article-comments-list">
        {loading && comments.length === 0 ? (
          <div className="article-comments-loading">加载中...</div>
        ) : comments.length === 0 ? (
          <div className="article-comments-empty">
            <p>还没有人评论，欢迎留下你的观点。</p>
            <span>运营建议：优质评论会提升文章停留时长与互动率。</span>
          </div>
        ) : (
          <>
            {groupedComments.map(({ root, replies }) => {
              const rootCommentText = String(root.content || '');
              const rootExpanded = expandedCommentTextMap[root.id] === true;
              const shouldCollapseRoot = shouldCollapseCommentText(rootCommentText);
              const replyExpanded = expandedReplyParentMap[root.id] === true;
              const isReplyInputVisible = activeReplyParentId === root.id;
              const replyDraft = String(replyDraftMap[root.id] || '');
              const replyCharCount = replyDraft.trim().length;
              return (
                <div key={root.id} className="article-comment-item">
                  <div className="article-comment-avatar">
                    {root.avatar ? (
                      <img src={root.avatar} alt={root.nickname} />
                    ) : (
                      <DefaultAvatar name={root.nickname} />
                    )}
                  </div>
                  <div className="article-comment-content">
                    <div className="article-comment-header">
                      <span className="article-comment-author">{root.nickname}</span>
                      <span className="article-comment-time">{formatTime(root.createTime)}</span>
                    </div>
                    <div className="article-comment-text">
                      {shouldCollapseRoot && !rootExpanded
                        ? `${rootCommentText.slice(0, 180)}...`
                        : rootCommentText}
                    </div>
                    {shouldCollapseRoot && (
                      <button
                        type="button"
                        className="article-comment-action-link"
                        onClick={() => toggleCommentTextExpand(root.id)}
                      >
                        {rootExpanded ? '收起全文' : '展开全文'}
                      </button>
                    )}

                    <div className="article-comment-actions-bar">
                      {Number(root.likeCount || 0) > 0 && (
                        <span className="article-comment-like-count">赞同 {root.likeCount}</span>
                      )}
                      <button
                        type="button"
                        className="article-comment-action-link"
                        onClick={() => toggleReplyInput(root.id)}
                      >
                        {isReplyInputVisible ? '取消回复' : '回复'}
                      </button>
                      {replies.length > 0 && (
                        <button
                          type="button"
                          className="article-comment-action-link"
                          onClick={() => toggleReplyFold(root.id)}
                        >
                          {replyExpanded ? `收起回复 (${replies.length})` : `展开回复 (${replies.length})`}
                        </button>
                      )}
                    </div>

                    {isReplyInputVisible && (
                      <div className="article-comment-reply-form">
                        <textarea
                          className="article-comment-reply-textarea"
                          placeholder={`回复 ${root.nickname}...`}
                          value={replyDraft}
                          onChange={(event) => updateReplyDraft(root.id, event.target.value)}
                          rows={3}
                          disabled={replySubmittingParentId === root.id}
                        />
                        <div className="article-comment-reply-form__footer">
                          <span>{replyCharCount}/1000</span>
                          <button
                            type="button"
                            className="article-comment-reply-submit-btn"
                            disabled={replySubmittingParentId === root.id || !replyDraft.trim()}
                            onClick={() => handleReplySubmit(root.id)}
                          >
                            {replySubmittingParentId === root.id ? '提交中...' : '提交回复'}
                          </button>
                        </div>
                      </div>
                    )}

                    {replies.length > 0 && replyExpanded && (
                      <div className="article-comment-replies">
                        {replies.map((reply) => {
                          const replyText = String(reply.content || '');
                          const replyTextExpanded = expandedCommentTextMap[reply.id] === true;
                          const replyShouldCollapse = shouldCollapseCommentText(replyText);
                          return (
                            <div key={reply.id} className="article-comment-reply-item">
                              <div className="article-comment-avatar">
                                {reply.avatar ? (
                                  <img src={reply.avatar} alt={reply.nickname} />
                                ) : (
                                  <DefaultAvatar name={reply.nickname} size={32} />
                                )}
                              </div>
                              <div className="article-comment-content">
                                <div className="article-comment-header">
                                  <span className="article-comment-author">{reply.nickname}</span>
                                  <span className="article-comment-time">{formatTime(reply.createTime)}</span>
                                </div>
                                <div className="article-comment-text">
                                  {replyShouldCollapse && !replyTextExpanded
                                    ? `${replyText.slice(0, 160)}...`
                                    : replyText}
                                </div>
                                {replyShouldCollapse && (
                                  <button
                                    type="button"
                                    className="article-comment-action-link"
                                    onClick={() => toggleCommentTextExpand(reply.id)}
                                  >
                                    {replyTextExpanded ? '收起' : '展开'}
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </>
        )}
        
        {/* 加载更多 */}
        {page < totalPages && (
          <div className="article-comments-load-more">
            <button 
              onClick={handleLoadMore} 
              disabled={loading}
              className="article-load-more-btn"
            >
              {loading ? '加载中...' : '加载更多评论'}
            </button>
          </div>
        )}
      </div>

      {/* 发表评论表单 */}
      <div className="article-comment-form-container">
        <h4>发表评论</h4>
        {error && <div className="article-comment-error">{error}</div>}
        <form className="article-comment-form" onSubmit={handleSubmit}>
          <textarea
            className="article-comment-textarea"
            placeholder="写下你的评论..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            disabled={submitting}
            rows={4}
          />
          <div className="article-comment-actions">
            <span className="article-comment-char-count">
              {commentCharCount}/1000
            </span>
            <button 
              type="submit" 
              className="article-comment-submit-btn"
              disabled={submitting || !commentText.trim()}
            >
              {submitting ? '发表中...' : '发表评论'}
            </button>
          </div>
          {!userId && !localStorage.getItem('token') && (
            <p className="article-comment-login-hint">登录后可参与评论互动</p>
          )}
        </form>
      </div>
    </div>
  );
};

export default ArticleComments;
// @pro-feature-end: article-comments
