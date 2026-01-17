#!/usr/bin/env python3
"""
为项目代码文件批量添加版权注释
作者: Tomda
日期: 2026-01-18
"""

import os
import re
from pathlib import Path

# 版权注释模板
TS_COPYRIGHT = """/**
 * @file {filename}
 * @description {description}
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

"""

CSS_COPYRIGHT = """/**
 * @file {filename}
 * @description {description}
 * @author Tomda
 * @copyright 版权所有 (c) 2026 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 */

"""

# 文件描述映射
DESCRIPTIONS = {
    'admin': '管理后台组件',
    'frontend': '前端用户界面组件',
    'backend': '后端API服务',
}

def has_copyright(content):
    """检查文件是否已有版权注释"""
    return '@file' in content[:500] or '@copyright' in content[:500]

def add_copyright_to_file(filepath, description):
    """为单个文件添加版权注释"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # 如果已有版权注释，跳过
        if has_copyright(content):
            print(f"⏭️  跳过 {filepath} (已有版权注释)")
            return False
        
        # 确定使用哪个模板
        filename = os.path.basename(filepath)
        if filepath.endswith('.css'):
            copyright = CSS_COPYRIGHT.format(filename=filename, description=description)
        else:
            copyright = TS_COPYRIGHT.format(filename=filename, description=description)
        
        # 写入新内容
        new_content = copyright + content
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        
        print(f"✅ 已添加版权注释: {filepath}")
        return True
        
    except Exception as e:
        print(f"❌ 处理失败 {filepath}: {e}")
        return False

def process_directory(directory, description, extensions):
    """处理目录中的所有文件"""
    count = 0
    for root, dirs, files in os.walk(directory):
        # 跳过 node_modules 和其他不需要的目录
        dirs[:] = [d for d in dirs if d not in ['node_modules', 'dist', 'build', '.git']]
        
        for file in files:
            if any(file.endswith(ext) for ext in extensions):
                filepath = os.path.join(root, file)
                if add_copyright_to_file(filepath, description):
                    count += 1
    
    return count

def main():
    """主函数"""
    print("🚀 开始为代码文件添加版权注释...\n")
    
    total_count = 0
    
    # 处理 admin 目录
    if os.path.exists('admin/src'):
        print("📁 处理 admin 目录...")
        count = process_directory('admin/src', DESCRIPTIONS['admin'], ['.tsx', '.ts', '.css'])
        total_count += count
        print(f"   完成 {count} 个文件\n")
    
    # 处理 frontend 目录
    if os.path.exists('frontend/src'):
        print("📁 处理 frontend 目录...")
        count = process_directory('frontend/src', DESCRIPTIONS['frontend'], ['.tsx', '.ts', '.css'])
        total_count += count
        print(f"   完成 {count} 个文件\n")
    
    # 处理 backend 目录
    if os.path.exists('backend/src'):
        print("📁 处理 backend 目录...")
        count = process_directory('backend/src', DESCRIPTIONS['backend'], ['.js', '.ts'])
        total_count += count
        print(f"   完成 {count} 个文件\n")
    
    print(f"✨ 完成！共为 {total_count} 个文件添加了版权注释")

if __name__ == '__main__':
    main()
