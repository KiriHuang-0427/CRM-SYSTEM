"""
V26.07.01 任务A — 服务器历史资料生产导入
将本地 D:\知识库创建\06_客户追踪 上传到服务器并执行导入脚本
"""
import os, sys, subprocess, time

if sys.platform == 'win32':
    os.system('chcp 65001 >nul 2>&1')
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

# ===== 服务器配置 (复用 deploy_server.py) =====
SERVER_HOST = '39.96.40.142'
SERVER_USER = 'root'
SERVER_PASS = 'Aahfh123123@'
SERVER_PORT = 22

REMOTE_BASE = '/opt/crm'
REMOTE_IMPORTS = f'{REMOTE_BASE}/imports'
REMOTE_ARCHIVE = f'{REMOTE_IMPORTS}/customer_archive'
REMOTE_DATA = f'{REMOTE_BASE}/data'
REMOTE_BACKUPS = f'{REMOTE_DATA}/backups'

# 本地路径
ARCHIVE_SOURCE = r'D:\知识库创建\06_客户追踪'
ZIP_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'customer_archive.zip')


def run_ssh(ssh, cmd, show=True):
    """执行远程命令并返回输出"""
    stdin, stdout, stderr = ssh.exec_command(cmd)
    out = stdout.read().decode('utf-8', errors='replace').strip()
    err = stderr.read().decode('utf-8', errors='replace').strip()
    if show and out:
        for line in out.split('\n'):
            print(f'    {line}')
    if err:
        for line in err.split('\n'):
            if line.strip():
                print(f'    [stderr] {line}')
    return out, err


def main():
    import paramiko

    print('=' * 50)
    print('  V26.07.01 任务A — 服务器历史资料生产导入')
    print('=' * 50)

    # ── Step 1: 压缩本地历史资料 ──
    print('\n  [1/8] 压缩本地历史资料')
    print(f'    源目录: {ARCHIVE_SOURCE}')

    if not os.path.isdir(ARCHIVE_SOURCE):
        print(f'    错误: 源目录不存在!')
        sys.exit(1)

    # 使用 Python zipfile 压缩
    import zipfile
    file_count = 0
    with zipfile.ZipFile(ZIP_PATH, 'w', zipfile.ZIP_DEFLATED) as zf:
        for root, dirs, files in os.walk(ARCHIVE_SOURCE):
            for f in files:
                full_path = os.path.join(root, f)
                arc_name = os.path.relpath(full_path, ARCHIVE_SOURCE)
                zf.write(full_path, arc_name)
                file_count += 1

    zip_size = os.path.getsize(ZIP_PATH)
    print(f'    压缩完成: {file_count} 个文件, {zip_size / 1024:.1f} KB')
    print(f'    ZIP路径: {ZIP_PATH}')

    # ── Step 2: 连接服务器 ──
    print('\n  [2/8] 连接服务器')
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(SERVER_HOST, port=SERVER_PORT, username=SERVER_USER, password=SERVER_PASS, timeout=30)
    print(f'    连接成功: {SERVER_USER}@{SERVER_HOST}')

    # ── Step 3: 创建服务器目录 ──
    print('\n  [3/8] 创建服务器目录')
    run_ssh(ssh, f'mkdir -p {REMOTE_IMPORTS} {REMOTE_ARCHIVE} {REMOTE_BACKUPS}')
    print(f'    {REMOTE_IMPORTS}')
    print(f'    {REMOTE_ARCHIVE}')
    print(f'    {REMOTE_BACKUPS}')

    # ── Step 4: 上传 ZIP ──
    print('\n  [4/8] 上传 ZIP 到服务器')
    remote_zip = f'{REMOTE_IMPORTS}/customer_archive.zip'
    sftp = ssh.open_sftp()
    sftp.put(ZIP_PATH, remote_zip)
    sftp.close()
    remote_size = run_ssh(ssh, f'stat -c %s {remote_zip}', show=False)[0]
    print(f'    上传完成: {int(remote_size) / 1024:.1f} KB')

    # ── Step 5: 解压 ──
    print('\n  [5/8] 解压历史资料')
    # 确保 unzip 可用
    run_ssh(ssh, 'which unzip || apt update && apt install -y unzip', show=False)
    out, _ = run_ssh(ssh, f'unzip -o {remote_zip} -d {REMOTE_ARCHIVE} 2>&1 | tail -5')
    # 统计解压文件数
    extracted, _ = run_ssh(ssh, f'find {REMOTE_ARCHIVE} -type f | wc -l', show=False)
    print(f'    解压文件数: {extracted}')

    # ── Step 6: 备份数据库 ──
    print('\n  [6/8] 备份生产数据库')
    ts = time.strftime('%Y%m%d_%H%M%S')
    backup_path = f'{REMOTE_BACKUPS}/crm_before_archive_import_{ts}.db'
    run_ssh(ssh, f'cp {REMOTE_DATA}/crm.db {backup_path}', show=False)
    run_ssh(ssh, f'cp {REMOTE_DATA}/crm.db-wal {REMOTE_BACKUPS}/ 2>/dev/null || true', show=False)
    run_ssh(ssh, f'cp {REMOTE_DATA}/crm.db-shm {REMOTE_BACKUPS}/ 2>/dev/null || true', show=False)
    print(f'    备份路径: {backup_path}')
    backup_size, _ = run_ssh(ssh, f'stat -c %s {backup_path}', show=False)
    print(f'    备份大小: {int(backup_size) / 1024:.1f} KB')

    # ── Step 7: 执行导入 ──
    print('\n  [7/8] 执行服务器导入脚本')
    run_ssh(ssh, f'cd {REMOTE_BASE} && node server/scripts/import-archive-to-memories.js "{REMOTE_ARCHIVE}"')

    # ── Step 8: 幂等验证 + API 检查 ──
    print('\n  [8/8] 幂等验证')
    print('  ── 第一次导入后统计 ──')
    out1, _ = run_ssh(ssh, f'cd {REMOTE_BASE} && node -e "const db=require(\\"better-sqlite3\\")(\\"{REMOTE_DATA}/crm.db\\");console.log(\\"memories:\\",db.prepare(\\"SELECT COUNT(*)as c FROM ai_memories\\").get().c);console.log(\\"source_files:\\",db.prepare(\\"SELECT COUNT(*)as c FROM ai_source_files\\").get().c);console.log(\\"import_jobs:\\",db.prepare(\\"SELECT COUNT(*)as c FROM ai_import_jobs\\").get().c)"', show=True)

    print('\n  ── 二次执行（幂等验证）──')
    run_ssh(ssh, f'cd {REMOTE_BASE} && node server/scripts/import-archive-to-memories.js "{REMOTE_ARCHIVE}" 2>&1 | tail -15')

    out2, _ = run_ssh(ssh, f'cd {REMOTE_BASE} && node -e "const db=require(\\"better-sqlite3\\")(\\"{REMOTE_DATA}/crm.db\\");console.log(\\"memories:\\",db.prepare(\\"SELECT COUNT(*)as c FROM ai_memories\\").get().c)"', show=True)

    # API 检查
    print('\n  ── API 检查 ──')
    run_ssh(ssh, f'curl -s http://127.0.0.1:3001/api/health')
    run_ssh(ssh, f'curl -s http://127.0.0.1:3001/api/memories/stats/summary')

    ssh.close()

    # 清理本地 zip
    os.remove(ZIP_PATH)

    print('\n' + '=' * 50)
    print('  任务A 完成!')
    print('=' * 50)


if __name__ == '__main__':
    main()
