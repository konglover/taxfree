# TaxFree App - Docker 部署指南

本文档提供了在服务器上使用 Docker 和 Docker Compose 部署 TaxFree 应用的完整流程。

## 1. 部署概述

TaxFree 应用采用前后端分离架构,通过 Docker 容器化部署,具有以下优势:

- **环境一致性**: 避免了因服务器环境差异导致的部署问题。
- **快速部署**: 一键启动或停止整个应用。
- **资源隔离**: 前后端服务在各自的容器中运行,互不干扰。
- **易于扩展**: 可以轻松地横向扩展服务。

本项目使用 \`docker-compose.yml\` 文件来编排前端、后端两个服务。

## 2. 环境要求

在部署之前,请确保您的服务器满足以下要求:

- **操作系统**: 任意支持 Docker 的 Linux 发行版 (如 Ubuntu, CentOS)。
- **Docker**: 最新稳定版。
- **Docker Compose**: 最新稳定版。
- **Git**: 用于从代码仓库拉取代码。

## 3. 部署步骤

### 3.1 克隆代码仓库

首先,通过 SSH 登录到您的服务器,然后克隆项目代码到本地:

\`\`\`bash
git clone git@github.com:konglover/taxfree.git
cd taxfree
\`\`\`

### 3.2 配置环境变量

部署前需要配置一些环境变量,特别是数据库连接和 JWT 密钥。

1.  **复制环境变量模板文件**:

    \`\`\`bash
    cp .env.example .env
    \`\`\`

2.  **编辑 \`.env\` 文件**:

    使用 \`vim\` 或 \`nano\` 编辑器打开 \`.env\` 文件:

    \`\`\`bash
    nano .env
    \`\`\`

    根据您的实际情况修改以下配置:

    \`\`\`env
    # 后端服务端口
    PORT=3000

    # 数据库配置 (如果使用外部数据库)
    # DB_HOST=your_database_host
    # DB_PORT=3306
    # DB_USER=your_db_user
    # DB_PASSWORD=your_db_password
    # DB_NAME=taxfree_db

    # JWT 密钥 (请务必修改为一个复杂的随机字符串)
    JWT_SECRET=your-super-secret-key-that-is-long-and-random

    # 前端 API 地址 (通常不需要修改)
    VITE_API_BASE_URL=http://<你的服务器IP>:3000/api
    \`\`\`

    **注意**: 如果您使用 \`docker-compose.yml\` 中默认的 SQLite 数据库,则无需配置 \`DB_*\` 相关的环境变量。

### 3.3 构建并启动服务

在项目根目录下,执行以下命令来构建镜像并启动所有服务:

\`\`\`bash
docker-compose up -d --build
\`\`\`

- \`--build\`: 强制重新构建 Docker 镜像,确保使用最新的代码。
- \`-d\`: 在后台运行容器 (detached mode)。

这个过程可能需要几分钟,因为它会下载基础镜像、安装依赖、编译代码。

### 3.4 验证部署

等待命令执行完毕后,您可以通过以下方式检查服务是否正常运行:

1.  **查看容器状态**:

    \`\`\`bash
    docker ps -a
    \`\`\`

    您应该能看到 \`taxfree-backend\` 和 \`taxfree-frontend\` 两个容器正在运行 (\`Up\`)。

2.  **查看容器日志**:

    如果容器没有正常启动,可以通过日志来排查问题:

    \`\`\`bash
    # 查看后端日志
    docker logs taxfree-backend

    # 查看前端日志
    docker logs taxfree-frontend
    \`\`\`

3.  **访问服务**:

    - **前端页面**: \`http://<你的服务器IP>\`
    - **后端健康检查**: \`http://<你的服务器IP>:3000/health\`

如果一切正常,您应该能看到应用的前端界面,并且后端健康检查返回 \`OK\`。

## 4. 应用管理

### 停止服务

要停止并删除所有容器,请在项目根目录下执行:

\`\`\`bash
docker-compose down
\`\`\`

### 启动服务

如果容器已停止,可以再次使用 \`up\` 命令启动:

\`\`\`bash
docker-compose up -d
\`\`\`

### 更新代码和部署

当您更新了代码并推送到 GitHub 后,可以按照以下步骤更新部署:

1.  **拉取最新代码**:

    \`\`\`bash
    git pull origin master
    \`\`\`

2.  **重新构建并启动**:

    \`\`\`bash
    docker-compose up -d --build
    \`\`\`

## 5. 配置文件说明

- \`docker-compose.yml\`: 核心的 Docker Compose 配置文件,定义了 \`backend\` 和 \`frontend\` 两个服务,以及它们的构建方式、端口映射、环境变量和资源限制。

- \`Dockerfile.backend.optimized\`: 后端服务的 Dockerfile,使用多阶段构建来减小镜像体积,并只安装生产依赖。

- \`Dockerfile.frontend.optimized\`: 前端服务的 Dockerfile,同样使用多阶段构建,并使用 Nginx 作为 Web 服务器来托管静态文件。

- \`nginx.conf\`: 前端容器中 Nginx 的配置文件,处理静态文件服务和 API 代理。

## 6. 注意事项

- **数据库**: 当前配置使用 SQLite 数据库,数据存储在 \`backend/data/taxfree.db\` 文件中。为了数据持久化,该目录已通过 volume 映射到宿主机。生产环境建议切换到更稳定的数据库,如 MySQL 或 PostgreSQL。

- **安全性**: 请务必修改 \`.env\` 文件中的 \`JWT_SECRET\` 为一个强随机字符串,以保证应用的安全性。

- **HTTPS**: 当前部署未使用 HTTPS,只适用于开发和测试环境。生产环境部署时,强烈建议配置 HTTPS,您可以通过 Nginx 反向代理或云服务商的负载均衡器来实现。
