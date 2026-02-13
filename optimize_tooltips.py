#!/usr/bin/env python3
"""
批量优化站点设置中的问号提示图标样式
将内联样式替换为统一的 CSS 类
"""

import re

# 读取文件
file_path = '/Users/tangxiaoda/Desktop/网站备份/HAO UIED/server/admin/src/views/uied/setting/index.vue'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 旧的内联样式
old_pattern = r'<el-icon style="margin-left:4px;cursor:help;color:#909399"><QuestionFilled /></el-icon>'

# 新的 CSS 类样式
new_pattern = r'<el-icon class="label-tip-icon"><QuestionFilled /></el-icon>'

# 替换
new_content = content.replace(old_pattern, new_pattern)

# 统计替换数量
count = content.count(old_pattern)

# 写回文件
with open(file_path, 'w', encoding='utf-8') as f:
    f.write(new_content)

print(f'✅ 优化完成！')
print(f'📊 共优化了 {count} 个问号提示图标')
print(f'📁 文件: {file_path}')

