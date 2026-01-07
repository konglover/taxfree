# 快速检查命令

## 直接执行脚本（无需权限）

如果遇到 `Permission denied` 错误，可以直接用以下命令执行：

```bash
# 方法1：使用 bash 执行（推荐）
bash check-docker-deploy.sh

# 方法2：使用 sh 执行
sh check-docker-deploy.sh

# 方法3：如果已添加执行权限
./check-docker-deploy.sh
```

## 一键检查命令（不依赖脚本）

如果脚本无法执行，可以直接复制以下命令到服务器运行：

```bash
echo "=========================================="
echo "🔍 Docker 部署环境检查"
echo "=========================================="
echo ""

# 检查 Docker
echo -n "检查 Docker ... "
if command -v docker &> /dev/null; then
    echo "✓ 已安装"
    docker --version
else
    echo "✗ 未安装"
fi

# 检查 Docker Compose
echo -n "检查 Docker Compose ... "
if command -v docker-compose &> /dev/null; then
    echo "✓ 已安装"
    docker-compose --version
elif docker compose version &> /dev/null 2>&1; then
    echo "✓ 已安装 (插件)"
    docker compose version
else
    echo "✗ 未安装"
fi

# 检查 Docker 服务
echo -n "检查 Docker 服务 ... "
if systemctl is-active --quiet docker 2>/dev/null || docker ps &> /dev/null; then
    echo "✓ 运行中"
else
    echo "✗ 未运行"
fi

# 检查文件
echo ""
echo "检查必需文件:"
[ -f "Dockerfile.backend" ] && echo "  ✓ Dockerfile.backend" || echo "  ✗ Dockerfile.backend"
[ -f "Dockerfile.frontend" ] && echo "  ✓ Dockerfile.frontend" || echo "  ✗ Dockerfile.frontend"
[ -f "docker-compose.yml" ] && echo "  ✓ docker-compose.yml" || echo "  ✗ docker-compose.yml"
[ -f "nginx.conf" ] && echo "  ✓ nginx.conf" || echo "  ✗ nginx.conf"
[ -d "backend" ] && echo "  ✓ backend 目录" || echo "  ✗ backend 目录"
[ -d "frontend" ] && echo "  ✓ frontend 目录" || echo "  ✗ frontend 目录"

# 检查端口
echo ""
echo "检查端口:"
if netstat -tuln 2>/dev/null | grep -q ":3000 "; then
    echo "  ⚠ 端口 3000 被占用"
else
    echo "  ✓ 端口 3000 可用"
fi

if netstat -tuln 2>/dev/null | grep -q ":80 "; then
    echo "  ⚠ 端口 80 被占用"
else
    echo "  ✓ 端口 80 可用"
fi

echo ""
echo "=========================================="
```

## 最简单的检查方法

如果只需要快速检查关键项，运行：

```bash
# 检查 Docker
docker --version && docker-compose --version && echo "✓ Docker 环境正常" || echo "✗ Docker 未安装"

# 检查文件
ls -1 Dockerfile.* docker-compose.yml nginx.conf 2>/dev/null && echo "✓ 必需文件存在" || echo "✗ 文件缺失"

# 检查目录
[ -d backend ] && [ -d frontend ] && echo "✓ 项目目录完整" || echo "✗ 目录缺失"
```

