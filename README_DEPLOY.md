# 快速部署指南

## 🚀 快速开始

### 1. 服务器准备

- **操作系统**：Ubuntu 20.04+ 或 CentOS 7+
- **内存**：至少 1GB（推荐 2GB+）
- **磁盘**：至少 10GB 可用空间

### 2. 安装 Docker（如果未安装）

```bash
# Ubuntu/Debian
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo systemctl start docker
sudo systemctl enable docker

# 安装 Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### 3. 上传代码

```bash
# 方式一：使用 Git
git clone <your-repo-url>
cd taxfree-app

# 方式二：直接上传代码包
# 解压后进入项目目录
```

### 4. 配置环境变量

```bash
# 复制示例文件
cp .env.example .env

# 编辑 .env 文件，设置 JWT_SECRET（重要！）
nano .env
```

**重要**：将 `JWT_SECRET` 改为随机字符串，可以使用：
```bash
openssl rand -base64 32
```

### 5. 部署

```bash
# 使用部署脚本（推荐）
./deploy.sh

# 或手动部署
docker-compose build
docker-compose up -d
```

### 6. 配置域名（可选但推荐）

#### 6.1 配置 DNS

在域名服务商处添加 A 记录，指向服务器 IP：
```
your-domain.com  -> 服务器IP
www.your-domain.com -> 服务器IP
```

#### 6.2 获取 SSL 证书

```bash
# 安装 certbot
sudo apt install -y certbot  # Ubuntu/Debian
# 或
sudo yum install -y certbot  # CentOS

# 获取证书
sudo certbot certonly --standalone -d your-domain.com -d www.your-domain.com
```

#### 6.3 更新配置

1. 编辑 `nginx-ssl.conf`，替换 `your-domain.com` 为你的域名
2. 复制为 `nginx.conf`：
```bash
cp nginx-ssl.conf nginx.conf
```
3. 更新 `.env` 中的 `VITE_API_BASE_URL`：
```bash
VITE_API_BASE_URL=https://your-domain.com/api
```
4. 重新构建并启动：
```bash
docker-compose build frontend
docker-compose up -d
```

### 7. 验证部署

```bash
# 检查服务状态
docker-compose ps

# 查看日志
docker-compose logs -f

# 测试后端
curl http://localhost:3000/health

# 测试前端（浏览器访问）
# http://your-server-ip 或 https://your-domain.com
```

## 📋 部署检查清单

- [ ] Docker 和 Docker Compose 已安装
- [ ] 代码已上传到服务器
- [ ] `.env` 文件已配置，`JWT_SECRET` 已更改
- [ ] 服务已启动（`docker-compose ps` 显示所有服务为 Up）
- [ ] 后端健康检查通过（`/health` 接口返回正常）
- [ ] 前端可以访问
- [ ] 域名 DNS 已配置（如使用域名）
- [ ] SSL 证书已配置（如使用 HTTPS）
- [ ] 防火墙已开放必要端口（80, 443）

## 🔧 常见问题

### 端口被占用

```bash
# 检查端口占用
sudo netstat -tulpn | grep :3000
sudo netstat -tulpn | grep :80

# 停止占用端口的进程或修改 docker-compose.yml 中的端口映射
```

### 数据库权限问题

```bash
# 确保数据目录有写权限
sudo chown -R $USER:$USER backend/data
chmod -R 755 backend/data
```

### 内存不足

如果服务器内存较小，可以：
1. 减少 Docker 资源限制
2. 使用 PM2 部署方式（不使用 Docker）

## 📞 需要帮助？

查看详细部署文档：`DEPLOY.md`






