"""
Sales CRM v7 — 全栈部署到阿里云轻量服务器
用法: py deploy_server.py
自动完成: 构建前端 → 上传 dist/ + server/ → 安装依赖 → 配置 nginx → 重启服务

服务器: 39.96.40.142 (Ubuntu 22.04 + nginx)
"""

import os, sys, subprocess, stat, io, tarfile, tempfile

# Windows 终端 UTF-8 支持
if sys.platform == 'win32':
    os.system('chcp 65001 >nul 2>&1')
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

# ===== 服务器配置 =====
SERVER_HOST = '39.96.40.142'
SERVER_USER = 'root'
SERVER_PASS = 'Aahfh123123@'
SERVER_PORT = 22

# 部署路径
REMOTE_BASE   = '/opt/crm'
REMOTE_DIST   = f'{REMOTE_BASE}/dist'
REMOTE_SERVER = f'{REMOTE_BASE}/server'
REMOTE_DATA   = f'{REMOTE_BASE}/data'

# Node.js 服务端口
NODE_PORT = 3001

# 项目路径
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DIST_DIR   = os.path.join(SCRIPT_DIR, 'dist')
SERVER_DIR = os.path.join(SCRIPT_DIR, 'server')


def step(n, total, msg):
    print(f'\n  [{n}/{total}] {msg}')


def build_frontend():
    """执行 Vite 构建"""
    print('  正在构建前端...')
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
                print(f'    {line.strip()}')
    print('  前端构建完成!')


def create_tarball(source_dir, arcname):
    """将目录打包为 tar.gz 以便传输"""
    buf = io.BytesIO()
    with tarfile.open(fileobj=buf, mode='w:gz') as tar:
        tar.add(source_dir, arcname=arcname)
    buf.seek(0)
    return buf


def deploy():
    """SSH 部署到服务器"""
    import paramiko

    print(f'  连接服务器 {SERVER_HOST}...')
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(SERVER_HOST, port=SERVER_PORT, username=SERVER_USER, password=SERVER_PASS, timeout=30)
    sftp = ssh.open_sftp()
    print('  连接成功!')

    def run_cmd(cmd, desc=''):
        if desc:
            print(f'    {desc}')
        stdin, stdout, stderr = ssh.exec_command(cmd, timeout=120)
        exit_code = stdout.channel.recv_exit_status()
        out = stdout.read().decode('utf-8', errors='replace').strip()
        err = stderr.read().decode('utf-8', errors='replace').strip()
        if exit_code != 0 and err:
            print(f'    [WARN] {err[:200]}')
        return exit_code, out

    # ── 1. 创建远程目录结构 ──
    run_cmd(f'mkdir -p {REMOTE_BASE} {REMOTE_DIST} {REMOTE_SERVER} {REMOTE_DATA}',
            '创建远程目录...')

    # ── 2. 备份现有数据库 ──
    run_cmd(f'test -f {REMOTE_DATA}/crm.db && cp {REMOTE_DATA}/crm.db {REMOTE_DATA}/crm.db.bak.$(date +%Y%m%d%H%M%S) || true',
            '备份现有数据库...')

    # ── 3. 上传前端 dist ──
    print('    上传前端文件...')
    # 先清理旧的 dist 文件 (保留 data/)
    run_cmd(f'rm -rf {REMOTE_DIST}/*')

    dist_tar = create_tarball(DIST_DIR, 'dist')
    sftp.putfo(dist_tar, f'{REMOTE_BASE}/dist.tar.gz')
    run_cmd(f'cd {REMOTE_BASE} && tar xzf dist.tar.gz && rm dist.tar.gz', '解压前端文件...')

    # ── 4. 上传后端 server ──
    print('    上传后端文件...')
    server_tar = create_tarball(SERVER_DIR, 'server')
    sftp.putfo(server_tar, f'{REMOTE_BASE}/server.tar.gz')
    run_cmd(f'cd {REMOTE_BASE} && tar xzf server.tar.gz && rm server.tar.gz', '解压后端文件...')

    # ── 5. 安装后端依赖 + 重新编译 native modules ──
    run_cmd(f'cd {REMOTE_SERVER} && npm install --production 2>&1 | tail -5',
            '安装后端依赖...')
    run_cmd(f'cd {REMOTE_SERVER} && npm rebuild better-sqlite3 2>&1 | tail -5',
            '重新编译 better-sqlite3 (Linux native)...')

    # ── 6. 配置 nginx 反向代理 ──
    nginx_conf = f"""server {{
    listen 80;
    server_name _;

    # gzip 压缩
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript image/svg+xml;
    gzip_min_length 1000;

    # API 请求代理到 Node.js
    location /api/ {{
        proxy_pass http://127.0.0.1:{NODE_PORT};
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 60s;
    }}

    # 前端静态文件由 Node.js 直接服务 (SPA fallback)
    location / {{
        proxy_pass http://127.0.0.1:{NODE_PORT};
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }}
}}
"""
    # 写入 nginx 配置
    with sftp.open('/etc/nginx/sites-available/crm', 'w') as f:
        f.write(nginx_conf)
    run_cmd('ln -sf /etc/nginx/sites-available/crm /etc/nginx/sites-enabled/crm',
            '配置 nginx...')
    run_cmd('rm -f /etc/nginx/sites-enabled/default')

    # 测试 nginx 配置
    exit_code, out = run_cmd('nginx -t 2>&1')
    if 'successful' not in out and exit_code != 0:
        print(f'    [ERROR] nginx 配置测试失败: {out}')
    else:
        print('    nginx 配置测试通过')

    # ── 7. 配置 systemd 服务 ──
    systemd_service = f"""[Unit]
Description=Sales CRM v7 API Server
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory={REMOTE_SERVER}
ExecStart=/usr/bin/node index.js
Restart=always
RestartSec=5
Environment=PORT={NODE_PORT}
Environment=NODE_ENV=production
StandardOutput=append:{REMOTE_BASE}/server.log
StandardError=append:{REMOTE_BASE}/error.log

[Install]
WantedBy=multi-user.target
"""
    with sftp.open('/etc/systemd/system/crm-server.service', 'w') as f:
        f.write(systemd_service)

    run_cmd('systemctl daemon-reload', '配置 systemd 服务...')
    run_cmd('systemctl enable crm-server')
    run_cmd('systemctl restart crm-server', '启动 CRM 服务...')
    run_cmd('systemctl reload nginx', '重载 nginx...')

    # ── 8. 验证服务状态 ──
    import time
    time.sleep(2)
    exit_code, out = run_cmd('systemctl is-active crm-server')
    if out.strip() == 'active':
        print('    CRM 服务运行正常!')
    else:
        print(f'    [WARN] CRM 服务状态: {out}')
        _, log = run_cmd(f'tail -20 {REMOTE_BASE}/error.log')
        if log:
            print(f'    最近错误日志:\n{log[:500]}')

    # 测试 API
    exit_code, out = run_cmd(f'curl -s http://127.0.0.1:{NODE_PORT}/api/health')
    if out and '"status":"ok"' in out:
        print(f'    API 健康检查通过: {out[:100]}')
    else:
        print(f'    [WARN] API 健康检查: {out[:200]}')

    sftp.close()
    ssh.close()
    print('  部署完成!')


if __name__ == '__main__':
    print()
    print('  ════════════════════════════════════════════')
    print('    Sales CRM v7 — 全栈部署 (阿里云服务器)')
    print('  ════════════════════════════════════════════')
    print(f'    目标: {SERVER_USER}@{SERVER_HOST}')
    print(f'    路径: {REMOTE_BASE}')
    print()

    step(1, 2, '构建前端')
    build_frontend()

    step(2, 2, '部署到服务器')
    deploy()

    print()
    print('  ════════════════════════════════════════════')
    print(f'    访问地址: http://{SERVER_HOST}')
    print(f'    API 健康: http://{SERVER_HOST}/api/health')
    print(f'    域名: http://kirihuang.com (ICP 备案后生效)')
    print('  ════════════════════════════════════════════')
    print()
