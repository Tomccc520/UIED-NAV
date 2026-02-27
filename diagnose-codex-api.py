#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
@copyright Tomda (https://www.tomda.top)
@copyright UIED技术团队 (https://fsuied.com)
@author UIED技术团队
@createDate 2026.2.13

Codex API 诊断脚本
用于测试 API 连接和找到正确的端点路径
"""

import requests
import json

API_KEY = 'sk-iODvOLBryFeCJmSE1BqRf3CCJocLL5YI'
BASE_URL = 'https://api-codex.pearktrue.cn/gateway'

def test_endpoint(endpoint, data, description):
    """测试单个端点"""
    url = f"{BASE_URL}{endpoint}"
    headers = {
        'Content-Type': 'application/json',
        'Authorization': f'Bearer {API_KEY}'
    }
    
    print(f'\n🔍 测试: {description}')
    print(f'   URL: {url}')
    print(f'   数据格式: {list(data.keys())}')
    
    try:
        response = requests.post(url, headers=headers, json=data, timeout=10)
        print(f'   状态码: {response.status_code}')
        
        if response.status_code == 200:
            print(f'   ✅ 成功！')
            try:
                result = response.json()
                print(f'   响应: {json.dumps(result, indent=2, ensure_ascii=False)[:500]}')
                return True, result
            except:
                print(f'   响应文本: {response.text[:500]}')
                return True, response.text
        else:
            print(f'   ❌ 失败')
            try:
                error = response.json()
                print(f'   错误信息: {json.dumps(error, indent=2, ensure_ascii=False)}')
            except:
                print(f'   错误文本: {response.text[:200]}')
            return False, None
    except Exception as e:
        print(f'   ❌ 异常: {str(e)}')
        return False, None

def test_base_url():
    """测试基础 URL 是否可访问"""
    print('=' * 60)
    print('📡 步骤 1: 测试基础 URL 连接')
    print('=' * 60)
    
    try:
        # 尝试 GET 请求
        response = requests.get(BASE_URL, timeout=10)
        print(f'GET {BASE_URL}')
        print(f'状态码: {response.status_code}')
        print(f'响应: {response.text[:200]}')
    except Exception as e:
        print(f'GET 请求失败: {str(e)}')
    
    # 尝试 OPTIONS 请求
    try:
        response = requests.options(BASE_URL, timeout=10)
        print(f'\nOPTIONS {BASE_URL}')
        print(f'状态码: {response.status_code}')
        print(f'允许的方法: {response.headers.get("Allow", "N/A")}')
    except Exception as e:
        print(f'OPTIONS 请求失败: {str(e)}')

def main():
    """主函数"""
    print('🚀 Codex API 诊断工具')
    print('=' * 60)
    
    # 测试基础 URL
    test_base_url()
    
    print('\n' + '=' * 60)
    print('📡 步骤 2: 测试各种可能的端点')
    print('=' * 60)
    
    # 测试用例列表
    test_cases = [
        # responses 格式
        ('/v1/responses', {
            'model': 'gpt-5.2-codex',
            'input': '你好'
        }, 'responses 端点 (input 格式)'),
        
        ('/v1/responses', {
            'model': 'gpt-5.2-codex',
            'messages': [{'role': 'user', 'content': '你好'}]
        }, 'responses 端点 (messages 格式)'),
        
        # chat completions 格式
        ('/v1/chat/completions', {
            'model': 'gpt-5.2-codex',
            'messages': [{'role': 'user', 'content': '你好'}]
        }, 'chat/completions 端点'),
        
        # 简化路径
        ('/chat/completions', {
            'model': 'gpt-5.2-codex',
            'messages': [{'role': 'user', 'content': '你好'}]
        }, '简化 chat/completions 端点'),
        
        # completions 格式
        ('/v1/completions', {
            'model': 'gpt-5.2-codex',
            'prompt': '你好',
            'max_tokens': 100
        }, 'completions 端点'),
        
        # 直接 gateway 路径
        ('', {
            'model': 'gpt-5.2-codex',
            'input': '你好'
        }, '直接 gateway 路径'),
        
        # 其他可能路径
        ('/api/v1/chat/completions', {
            'model': 'gpt-5.2-codex',
            'messages': [{'role': 'user', 'content': '你好'}]
        }, 'api/v1/chat/completions 端点'),
        
        ('/openai/v1/chat/completions', {
            'model': 'gpt-5.2-codex',
            'messages': [{'role': 'user', 'content': '你好'}]
        }, 'openai/v1/chat/completions 端点'),
    ]
    
    success_count = 0
    for endpoint, data, description in test_cases:
        success, result = test_endpoint(endpoint, data, description)
        if success:
            success_count += 1
            print(f'\n🎉 找到可用端点！')
            print(f'   端点: {endpoint}')
            print(f'   数据格式: {list(data.keys())}')
            break
    
    print('\n' + '=' * 60)
    print(f'📊 诊断完成: {success_count}/{len(test_cases)} 个端点成功')
    print('=' * 60)
    
    if success_count == 0:
        print('\n⚠️  所有端点都失败，可能的原因：')
        print('1. API 地址不正确')
        print('2. API Key 无效或过期')
        print('3. 需要特殊的认证方式')
        print('4. API 端点路径不在常见列表中')
        print('\n建议：联系 API 提供方获取正确的端点文档')

if __name__ == '__main__':
    main()

