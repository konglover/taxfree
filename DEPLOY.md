# 部署文档

## 部署方式选择

### 方式一：Docker 部署（推荐）

适合快速部署，易于管理和维护。

### 方式二：PM2 部署

适合需要更多控制或不想使用 Docker 的场景。

---

## 方式一：Docker 部署

### 前置要求

1. 服务器（推荐 Ubuntu 20.04+ 或 CentOS 7+）
2. 已安装 Docker 和 Docker Compose
3. 域名（可选，用于 HTTPS）

### 安装 Docker

#### Ubuntu/Debian
```bash
# 更新包索引
sudo apt update

# 安装 Docker
sudo apt install -y docker.io docker-compose

# 启动 Docker 服务
sudo systemctl start docker
sudo systemctl enable docker

# 验证安装
docker --version
docker-compose --version
```

#### CentOS/RHEL
```bash
# 安装 Docker
sudo yum install -y docker docker-compose

# 启动 Docker 服务
sudo systemctl start docker
sudo systemctl enable docker

# 验证安装
docker --version
docker-compose --version
```

### 部署步骤

1. **上传代码到服务器**
```bash
# 使用 git 克隆或直接上传代码
git clone <your-repo-url>
cd taxfree-app
```

2. **配置环境变量**
```bash
# 创建 .env 文件
cat > .env << EOF
JWT_SECRET=your-very-secret-jwt-key-change-this-to-random-string
VITE_API_BASE_URL=http://your-domain.com/api
EOF
```

3. **构建和启动**
```bash
# 构建镜像
docker-compose build

# 启动服务
docker-compose up -d

# 查看日志
docker-compose logs -f

# 查看服务状态
docker-compose ps
```

4. **配置域名和 HTTPS（可选）**

#### 使用 Let's Encrypt 获取 SSL 证书

```bash
# 安装 certbot
sudo apt install -y certbot  # Ubuntu/Debian
# 或
sudo yum install -y certbot  # CentOS

# 获取证书（替换 your-domain.com 为你的域名）
sudo certbot certonly --standalone -d your-domain.com -d www.your-domain.com

# 证书会保存在 /etc/letsencrypt/live/your-domain.com/
```

#### 更新 nginx 配置

1. 复制 `nginx-ssl.conf` 到 `nginx.conf`
2. 修改其中的域名和证书路径
3. 重新构建前端镜像：
```bash
docker-compose build frontend
docker-compose up -d frontend
```

### 常用命令

```bash
# 查看日志
docker-compose logs -f backend
docker-compose logs -f frontend

# 重启服务
docker-compose restart

# 停止服务
docker-compose down

# 更新代码后重新部署
git pull
docker-compose build
docker-compose up -d

# 查看资源使用
docker stats
```

---

## 方式二：PM2 部署

### 前置要求

1. Node.js 18+ 已安装
2. Nginx 已安装（用于反向代理）

### 安装 Node.js

```bash
# 使用 NodeSource 安装（Ubuntu/Debian）
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 或使用 nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18
```

### 部署步骤

1. **上传代码到服务器**
```bash
cd /var/www
git clone <your-repo-url> taxfree-app
cd taxfree-app
```

2. **安装依赖**
```bash
# 后端
cd backend
npm install --production

# 前端
cd ../frontend
npm install
npm run build
```

3. **配置环境变量**
```bash
# 后端
cd backend
cat > .env << EOF
NODE_ENV=production
PORT=3000
JWT_SECRET=your-very-secret-jwt-key-change-this
EOF

# 前端（构建时使用）
cd ../frontend
cat > .env.production << EOF
VITE_API_BASE_URL=https://your-domain.com/api
EOF
```

4. **使用 PM2 启动后端**
```bash
# 安装 PM2
npm install -g pm2

# 启动后端
cd /var/www/taxfree-app
pm2 start ecosystem.config.js

# 设置开机自启
pm2 startup
pm2 save
```

5. **配置 Nginx**

创建 `/etc/nginx/sites-available/taxfree`：

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    root /var/www/taxfree-app/frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

启用配置：
```bash
sudo ln -s /etc/nginx/sites-available/taxfree /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

6. **配置 HTTPS（使用 Let's Encrypt）**

```bash
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

---

## 防火墙配置

```bash
# Ubuntu/Debian (UFW)
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# CentOS/RHEL (firewalld)
sudo firewall-cmd --permanent --add-service=ssh
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

---

## 数据库备份

### 自动备份脚本

创建 `backup.sh`：

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/taxfree"
DATE=$(date +%Y%m%d_%H%M%S)
DB_FILE="/var/www/taxfree-app/backend/data/taxfree.db"

mkdir -p $BACKUP_DIR
cp $DB_FILE $BACKUP_DIR/taxfree_$DATE.db

# 保留最近 7 天的备份
find $BACKUP_DIR -name "taxfree_*.db" -mtime +7 -delete
```

设置定时任务：
```bash
chmod +x backup.sh
crontab -e
# 添加：0 2 * * * /path/to/backup.sh
```

---

## 监控和维护

### 查看日志

**Docker 方式：**
```bash
docker-compose logs -f
```

**PM2 方式：**
```bash
pm2 logs
pm2 logs taxfree-backend
```

### 性能监控

```bash
# Docker
docker stats

# PM2
pm2 monit
```

### 更新应用

```bash
# 拉取最新代码
git pull

# Docker 方式
docker-compose build
docker-compose up -d

# PM2 方式
cd backend
npm install --production
pm2 restart taxfree-backend

cd ../frontend
npm install
npm run build
sudo systemctl reload nginx
```

---

## 故障排查

### 后端无法启动

1. 检查端口是否被占用：
```bash
netstat -tulpn | grep 3000
```

2. 检查日志：
```bash
docker-compose logs backend
# 或
pm2 logs taxfree-backend
```

3. 检查环境变量：
```bash
docker-compose exec backend env
```

### 前端无法访问

1. 检查 Nginx 配置：
```bash
sudo nginx -t
```

2. 检查 Nginx 日志：
```bash
sudo tail -f /var/log/nginx/error.log
```

3. 检查前端构建文件：
```bash
ls -la frontend/dist
```

### 数据库问题

1. 检查数据库文件权限：
```bash
ls -la backend/data/
```

2. 检查数据库文件大小：
```bash
du -h backend/data/*.db
```

---

## 安全建议

1. **更改默认密钥**：确保 `JWT_SECRET` 是强随机字符串
2. **使用 HTTPS**：生产环境必须使用 HTTPS
3. **定期备份**：设置自动备份数据库
4. **更新系统**：定期更新系统和依赖包
5. **限制访问**：使用防火墙限制不必要的端口
6. **监控日志**：定期检查日志文件

---

## 联系支持

如遇到问题，请检查：
1. 服务器日志
2. 应用日志
3. 网络连接
4. 防火墙设置






