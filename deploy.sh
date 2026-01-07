#!/bin/bash

# 部署脚本
# 使用方法: ./deploy.sh

set -e

echo "🚀 开始部署 TaxFree App..."

# 检查 Docker 是否安装
if ! command -v docker &> /dev/null; then
    echo "❌ Docker 未安装，请先安装 Docker"
    exit 1
fi

if ! command -v docker compose &> /dev/null; then
    echo "❌ Docker Compose 未安装，请先安装 Docker Compose"
    exit 1
fi

# 检查 .env 文件
if [ ! -f .env ]; then
    echo "⚠️  .env 文件不存在，创建默认配置..."
    cat > .env << EOF
JWT_SECRET=$(openssl rand -base64 32)
VITE_API_BASE_URL=http://localhost:3000/api
EOF
    echo "✅ 已创建 .env 文件，请根据需要修改"
fi

# 构建镜像
echo "📦 构建 Docker 镜像..."
docker compose build

# 停止旧容器
echo "🛑 停止旧容器..."
docker compose down

# 启动服务
echo "🚀 启动服务..."
docker compose up -d

# 等待服务启动
echo "⏳ 等待服务启动..."
sleep 5

# 检查服务状态
echo "📊 检查服务状态..."
docker compose ps

# 检查健康状态
echo "🏥 检查后端健康状态..."
if curl -f http://localhost:3000/health > /dev/null 2>&1; then
    echo "✅ 后端服务运行正常"
else
    echo "⚠️  后端服务可能未正常启动，请检查日志: docker compose logs backend"
fi

echo ""
echo "✅ 部署完成！"
echo ""
echo "📝 常用命令："
echo "  查看日志: docker compose logs -f"
echo "  停止服务: docker compose down"
echo "  重启服务: docker compose restart"
echo "  查看状态: docker compose ps"
echo ""





















