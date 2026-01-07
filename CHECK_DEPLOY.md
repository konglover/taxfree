# Docker 部署环境检查指南

## 快速检查方法

### 方法一：使用检查脚本（推荐）

1. **上传脚本到服务器**（如果还没有）
   ```bash
   # 确保脚本有执行权限
   chmod +x check-docker-deploy.sh
   ```

2. **运行检查脚本**
   ```bash
   ./check-docker-deploy.sh
   ```

### 方法二：手动检查命令

在服务器上依次运行以下命令：

#### 1. 检查 Docker 和 Docker Compose
```bash
# 检查 Docker
docker --version

# 检查 Docker Compose
docker-compose --version
# 或者（新版本）
docker compose version

# 检查 Docker 服务状态
sudo systemctl status docker
# 或者
service docker status
```

#### 2. 检查必需文件
```bash
# 在项目根目录运行
ls -la | grep -E "Dockerfile|docker-compose|nginx.conf"

# 应该看到：
# - Dockerfile.backend
# - Dockerfile.frontend
# - docker-compose.yml
# - nginx.conf
```

#### 3. 检查项目目录结构
```bash
# 检查目录
ls -d backend frontend

# 检查 package.json 文件
test -f backend/package.json && echo "✓ backend/package.json 存在" || echo "✗ backend/package.json 缺失"
test -f frontend/package.json && echo "✓ frontend/package.json 存在" || echo "✗ frontend/package.json 缺失"
```

#### 4. 检查端口占用
```bash
# 检查端口 3000 和 80 是否被占用
netstat -tuln | grep -E ":3000|:80"
# 或者
ss -tuln | grep -E ":3000|:80"
```

#### 5. 检查磁盘空间
```bash
df -h .
```

#### 6. 检查 Docker 权限
```bash
# 测试是否可以运行 docker 命令（不需要 sudo）
docker ps

# 如果提示权限错误，需要将用户添加到 docker 组
# sudo usermod -aG docker $USER
# 然后重新登录
```

### 方法三：一键检查命令

复制以下命令到服务器运行：

```bash
echo "=== Docker 检查 ===" && \
docker --version && docker-compose --version && \
echo "" && \
echo "=== 文件检查 ===" && \
test -f Dockerfile.backend && echo "✓ Dockerfile.backend" || echo "✗ Dockerfile.backend" && \
test -f Dockerfile.frontend && echo "✓ Dockerfile.frontend" || echo "✗ Dockerfile.frontend" && \
test -f docker-compose.yml && echo "✓ docker-compose.yml" || echo "✗ docker-compose.yml" && \
test -f nginx.conf && echo "✓ nginx.conf" || echo "✗ nginx.conf" && \
test -d backend && echo "✓ backend 目录" || echo "✗ backend 目录" && \
test -d frontend && echo "✓ frontend 目录" || echo "✗ frontend 目录" && \
echo "" && \
echo "=== Docker 服务 ===" && \
docker ps && \
echo "" && \
echo "=== 端口检查 ===" && \
(netstat -tuln 2>/dev/null | grep -E ":3000|:80" && echo "⚠ 端口被占用" || echo "✓ 端口可用")
```

## 必需文件清单

确保以下文件存在于项目根目录：

- ✅ `Dockerfile.backend` - 后端 Docker 镜像配置
- ✅ `Dockerfile.frontend` - 前端 Docker 镜像配置
- ✅ `docker-compose.yml` - Docker Compose 配置
- ✅ `nginx.conf` - Nginx 配置文件
- ✅ `backend/` - 后端代码目录
- ✅ `frontend/` - 前端代码目录
- ⚠️ `.env` - 环境变量文件（可选，部署脚本会自动创建）

## 常见问题

### 1. Docker 未安装

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install -y docker.io docker-compose
sudo systemctl start docker
sudo systemctl enable docker
```

**CentOS/RHEL:**
```bash
sudo yum install -y docker docker-compose
sudo systemctl start docker
sudo systemctl enable docker
```

### 2. Docker 权限问题

```bash
# 将当前用户添加到 docker 组
sudo usermod -aG docker $USER

# 重新登录或运行
newgrp docker

# 测试
docker ps
```

### 3. 端口被占用

```bash
# 查看占用端口的进程
sudo lsof -i :3000
sudo lsof -i :80

# 或者
sudo netstat -tulpn | grep :3000
sudo netstat -tulpn | grep :80

# 停止占用端口的服务或修改 docker-compose.yml 中的端口映射
```

### 4. 文件缺失

如果文件缺失，请确保：
1. 已完整上传项目代码到服务器
2. 在项目根目录运行检查命令
3. 使用 `git clone` 或完整上传所有文件

## 检查通过后

如果所有检查都通过，可以开始部署：

```bash
# 使用部署脚本
./deploy.sh

# 或手动部署
docker-compose build
docker-compose up -d
docker-compose ps
```






