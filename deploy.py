"""
Sales CRM v6 — 一键部署到阿里云 OSS
用法: py deploy.py
自动完成: 构建项目 → 上传文件 → 显示访问链接
"""

import os, sys, subprocess, mimetypes

# Windows 终端 UTF-8 支持
if sys.platform == 'win32':
    os.system('chcp 65001 >nul 2>&1')
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

# ===== 阿里云 OSS 配置 =====
# 从环境变量读取密钥（.env 文件不提交到 Git）
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

OSS_KEY_ID     = os.environ.get('OSS_KEY_ID', '')
OSS_KEY_SECRET = os.environ.get('OSS_KEY_SECRET', '')
OSS_ENDPOINT   = 'https://oss-cn-hangzhou.aliyuncs.com'
OSS_BUCKET     = 'siemens-crm'
PUBLIC_URL     = 'https://siemens-crm.oss-cn-hangzhou.aliyuncs.com'

if not OSS_KEY_ID or not OSS_KEY_SECRET:
    print('错误: 请设置 OSS_KEY_ID 和 OSS_KEY_SECRET 环境变量')
    print('或在 .env 文件中配置（参考 .env.example）')
    sys.exit(1)

# 项目路径
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DIST_DIR   = os.path.join(SCRIPT_DIR, 'dist')

def build():
    """执行 Vite 构建"""
    print('\n  [1/2] 正在构建项目...')
    result = subprocess.run(
        'npx vite build',
        cwd=SCRIPT_DIR,
        capture_output=True, text=True,
        shell=True,
        encoding='utf-8', errors='replace'
    )
    if result.returncode != 0:
        print(f'  构建失败:\n{result.stderr or ""}')
        sys.exit(1)
    if result.stdout:
        for line in result.stdout.split('\n'):
            if 'built in' in line or 'dist/' in line:
                print(f'  {line.strip()}')
    print('  构建完成!')

def upload():
    """上传 dist 文件到阿里云 OSS"""
    import oss2

    print(f'\n  [2/2] 正在上传到阿里云 OSS...')

    auth = oss2.Auth(OSS_KEY_ID, OSS_KEY_SECRET)
    bucket = oss2.Bucket(auth, OSS_ENDPOINT, OSS_BUCKET)

    # 清理旧文件
    try:
        for obj in oss2.ObjectIterator(bucket, prefix=''):
            bucket.delete_object(obj.key)
        print('  已清理旧文件')
    except Exception:
        pass

    # 上传新文件
    count = 0
    for root, dirs, files in os.walk(DIST_DIR):
        dirs[:] = [d for d in dirs if not d.startswith('.')]
        for f in files:
            if f.startswith('.') or f == 'vercel.json':
                continue
            full_path = os.path.join(root, f)
            key = os.path.relpath(full_path, DIST_DIR).replace('\\', '/')

            if key.endswith('.js'):
                ct = 'application/javascript; charset=utf-8'
            elif key.endswith('.css'):
                ct = 'text/css; charset=utf-8'
            elif key.endswith('.html'):
                ct = 'text/html; charset=utf-8'
            else:
                ct = mimetypes.guess_type(full_path)[0] or 'application/octet-stream'

            with open(full_path, 'rb') as fp:
                bucket.put_object(key, fp, headers={'Content-Type': ct})

            size_kb = os.path.getsize(full_path) / 1024
            if size_kb > 100:
                print(f'  {key} ({size_kb:.0f} KB)')
            count += 1

    print(f'  上传完成! 共 {count} 个文件')

if __name__ == '__main__':
    print()
    print('  ========================================')
    print('    Sales CRM v6 — 阿里云一键部署')
    print('  ========================================')

    build()
    upload()

    print()
    print('  ========================================')
    print(f'    访问地址: {PUBLIC_URL}')
    print('  ========================================')
    print()
