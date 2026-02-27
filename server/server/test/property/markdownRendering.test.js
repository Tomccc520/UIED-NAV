/**
 * @file test/property/markdownRendering.test.js
 * @description 属性测试：Markdown 渲染产生有效的 HTML 结构
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

// Feature: feature-enhancement-and-bugfix, Property 7: Markdown rendering produces valid HTML structure
// **Validates: Requirements 4.4**

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

/**
 * renderMarkdown —— 从 frontend/src/pages/Articles/ArticleDetail.tsx 提取的纯函数
 *
 * 这是一个简单的基于正则的 Markdown 渲染器，将 Markdown 文本转换为 HTML。
 * 转换规则：
 *   - ```code``` → <pre><code>
 *   - `code` → <code>
 *   - ### heading → <h3>
 *   - ## heading → <h2>
 *   - # heading → <h2>（H1 保留给文章标题）
 *   - **bold** → <strong>
 *   - *italic* → <em>
 *   - [text](url) → <a href="url">
 *   - ![alt](url) → <img>
 *   - - item → <li> wrapped in <ul>
 *   - > quote → <blockquote>
 *   - --- → <hr />
 */
function renderMarkdown(content) {
  let html = content
    // 代码块
    .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre><code class="language-$1">$2</code></pre>')
    // 行内代码
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    // 标题
    .replace(/^### (.*$)/gm, '<h3>$1</h3>')
    .replace(/^## (.*$)/gm, '<h2>$1</h2>')
    .replace(/^# (.*$)/gm, '<h2>$1</h2>') // H1 保留给文章标题
    // 粗体和斜体
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    // 链接
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
    // 图片
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" loading="lazy" />')
    // 无序列表
    .replace(/^\s*[-*]\s+(.*)$/gm, '<li>$1</li>')
    // 有序列表
    .replace(/^\s*\d+\.\s+(.*)$/gm, '<li>$1</li>')
    // 引用
    .replace(/^>\s+(.*)$/gm, '<blockquote>$1</blockquote>')
    // 分割线
    .replace(/^---$/gm, '<hr />')
    // 段落
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br />');

  // 包装列表
  html = html.replace(/(<li>.*<\/li>)+/g, '<ul>$&</ul>');

  return `<p>${html}</p>`;
}

// ============================================================
// fast-check 生成器：生成包含特定 Markdown 模式的字符串
// ============================================================

/**
 * 生成安全的文本内容（不包含 Markdown 特殊字符）
 * 避免生成的文本本身干扰 Markdown 解析
 */
const safeText = fc.stringMatching(/^[a-zA-Z0-9 ]{1,30}$/).filter(s => s.trim().length > 0);

/**
 * 生成 URL 安全字符串
 */
const safeUrl = fc.constantFrom(
  'https://example.com',
  'https://fsuied.com/page',
  'https://test.org/path/to/resource',
  'http://localhost:3000',
  'https://github.com/user/repo'
);

/**
 * 生成 H2 标题 Markdown（# 或 ##）
 */
const h2Heading = safeText.map(text => `## ${text}`);

/**
 * 生成 H3 标题 Markdown
 */
const h3Heading = safeText.map(text => `### ${text}`);

/**
 * 生成 H1 标题 Markdown（渲染为 H2）
 */
const h1Heading = safeText.map(text => `# ${text}`);

/**
 * 生成粗体 Markdown
 */
const boldText = safeText.map(text => `**${text}**`);

/**
 * 生成斜体 Markdown
 */
const italicText = safeText.map(text => `*${text}*`);

/**
 * 生成链接 Markdown
 */
const linkMarkdown = fc.tuple(safeText, safeUrl).map(
  ([text, url]) => `[${text}](${url})`
);

/**
 * 生成行内代码 Markdown
 */
const inlineCode = safeText.map(text => `\`${text}\``);

/**
 * 生成代码块 Markdown
 */
const codeBlock = fc.tuple(
  fc.constantFrom('js', 'python', 'html', 'css', ''),
  safeText
).map(([lang, code]) => `\`\`\`${lang}\n${code}\n\`\`\``);

/**
 * 生成无序列表项 Markdown
 */
const unorderedListItem = safeText.map(text => `- ${text}`);

/**
 * 生成有序列表项 Markdown
 */
const orderedListItem = fc.tuple(
  fc.integer({ min: 1, max: 99 }),
  safeText
).map(([num, text]) => `${num}. ${text}`);

/**
 * 生成引用 Markdown
 */
const blockquote = safeText.map(text => `> ${text}`);

/**
 * 生成分割线 Markdown
 */
const horizontalRule = fc.constant('---');

// ============================================================
// 属性测试
// ============================================================

describe('Property 7: Markdown rendering produces valid HTML structure', () => {

  it('H2 headings (##) produce <h2> tags', () => {
    fc.assert(
      fc.property(h2Heading, (md) => {
        const html = renderMarkdown(md);
        expect(html).toContain('<h2>');
        expect(html).toContain('</h2>');
      }),
      { numRuns: 200 }
    );
  });

  it('H3 headings (###) produce <h3> tags', () => {
    fc.assert(
      fc.property(h3Heading, (md) => {
        const html = renderMarkdown(md);
        expect(html).toContain('<h3>');
        expect(html).toContain('</h3>');
      }),
      { numRuns: 200 }
    );
  });

  it('H1 headings (#) produce <h2> tags (H1 reserved for article title)', () => {
    fc.assert(
      fc.property(h1Heading, (md) => {
        const html = renderMarkdown(md);
        expect(html).toContain('<h2>');
        expect(html).toContain('</h2>');
      }),
      { numRuns: 200 }
    );
  });

  it('bold text (**text**) produces <strong> tags', () => {
    fc.assert(
      fc.property(boldText, (md) => {
        const html = renderMarkdown(md);
        expect(html).toContain('<strong>');
        expect(html).toContain('</strong>');
      }),
      { numRuns: 200 }
    );
  });

  it('italic text (*text*) produces <em> tags', () => {
    fc.assert(
      fc.property(italicText, (md) => {
        const html = renderMarkdown(md);
        expect(html).toContain('<em>');
        expect(html).toContain('</em>');
      }),
      { numRuns: 200 }
    );
  });

  it('links [text](url) produce <a> tags with href', () => {
    fc.assert(
      fc.property(linkMarkdown, (md) => {
        const html = renderMarkdown(md);
        expect(html).toContain('<a href="');
        expect(html).toContain('</a>');
        expect(html).toContain('target="_blank"');
        expect(html).toContain('rel="noopener noreferrer"');
      }),
      { numRuns: 200 }
    );
  });

  it('inline code (`code`) produces <code> tags', () => {
    fc.assert(
      fc.property(inlineCode, (md) => {
        const html = renderMarkdown(md);
        expect(html).toContain('<code>');
        expect(html).toContain('</code>');
      }),
      { numRuns: 200 }
    );
  });

  it('code blocks (```code```) produce <pre><code> tags', () => {
    fc.assert(
      fc.property(codeBlock, (md) => {
        const html = renderMarkdown(md);
        expect(html).toContain('<pre>');
        expect(html).toContain('<code');
        expect(html).toContain('</code></pre>');
      }),
      { numRuns: 200 }
    );
  });

  it('unordered list items (- item) produce <li> tags wrapped in <ul>', () => {
    fc.assert(
      fc.property(unorderedListItem, (md) => {
        const html = renderMarkdown(md);
        expect(html).toContain('<li>');
        expect(html).toContain('</li>');
        expect(html).toContain('<ul>');
        expect(html).toContain('</ul>');
      }),
      { numRuns: 200 }
    );
  });

  it('ordered list items (1. item) produce <li> tags wrapped in <ul>', () => {
    fc.assert(
      fc.property(orderedListItem, (md) => {
        const html = renderMarkdown(md);
        expect(html).toContain('<li>');
        expect(html).toContain('</li>');
        expect(html).toContain('<ul>');
        expect(html).toContain('</ul>');
      }),
      { numRuns: 200 }
    );
  });

  it('blockquotes (> text) produce <blockquote> tags', () => {
    fc.assert(
      fc.property(blockquote, (md) => {
        const html = renderMarkdown(md);
        expect(html).toContain('<blockquote>');
        expect(html).toContain('</blockquote>');
      }),
      { numRuns: 200 }
    );
  });

  it('horizontal rules (---) produce <hr /> tags', () => {
    fc.assert(
      fc.property(horizontalRule, (md) => {
        const html = renderMarkdown(md);
        expect(html).toContain('<hr />');
      }),
      { numRuns: 100 }
    );
  });

  it('mixed Markdown content produces all corresponding HTML tags', () => {
    // 生成包含多种 Markdown 元素的组合内容
    const mixedMarkdown = fc.tuple(
      h2Heading,
      boldText,
      italicText,
      linkMarkdown,
      unorderedListItem
    ).map(([heading, bold, italic, link, listItem]) =>
      [heading, '', `Some text with ${bold} and ${italic} words.`, '', link, '', listItem].join('\n')
    );

    fc.assert(
      fc.property(mixedMarkdown, (md) => {
        const html = renderMarkdown(md);

        // 验证所有对应的 HTML 标签都存在
        expect(html).toContain('<h2>');
        expect(html).toContain('<strong>');
        expect(html).toContain('<em>');
        expect(html).toContain('<a href="');
        expect(html).toContain('<li>');
        expect(html).toContain('<ul>');
      }),
      { numRuns: 200 }
    );
  });

  it('output is always wrapped in <p> tags', () => {
    // 使用各种 Markdown 输入验证输出始终以 <p> 开头和 </p> 结尾
    const anyMarkdown = fc.oneof(
      h2Heading,
      h3Heading,
      boldText,
      italicText,
      linkMarkdown,
      inlineCode,
      unorderedListItem,
      blockquote,
      safeText
    );

    fc.assert(
      fc.property(anyMarkdown, (md) => {
        const html = renderMarkdown(md);
        expect(html.startsWith('<p>')).toBe(true);
        expect(html.endsWith('</p>')).toBe(true);
      }),
      { numRuns: 200 }
    );
  });

  it('bold text content is preserved inside <strong> tags', () => {
    fc.assert(
      fc.property(safeText, (text) => {
        const md = `**${text}**`;
        const html = renderMarkdown(md);
        expect(html).toContain(`<strong>${text}</strong>`);
      }),
      { numRuns: 200 }
    );
  });

  it('heading text content is preserved inside heading tags', () => {
    fc.assert(
      fc.property(safeText, (text) => {
        const md = `## ${text}`;
        const html = renderMarkdown(md);
        expect(html).toContain(`<h2>${text}</h2>`);
      }),
      { numRuns: 200 }
    );
  });

  it('link URL is preserved in href attribute', () => {
    fc.assert(
      fc.property(fc.tuple(safeText, safeUrl), ([text, url]) => {
        const md = `[${text}](${url})`;
        const html = renderMarkdown(md);
        expect(html).toContain(`<a href="${url}"`);
        expect(html).toContain(`>${text}</a>`);
      }),
      { numRuns: 200 }
    );
  });
});
