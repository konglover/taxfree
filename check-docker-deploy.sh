#!/bin/bash

# Docker 部署环境检查脚本
# 使用方法:
#   方法1: bash check-docker-deploy.sh  (推荐，无需执行权限)
#   方法2: sh check-docker-deploy.sh
#   方法3: chmod +x check-docker-deploy.sh && ./check-docker-deploy.sh

echo "=========================================="
echo "🔍 检查 Docker 部署环境"
echo "=========================================="
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查结果统计
PASSED=0
FAILED=0
WARNING=0

# 检查函数
check_item() {
    local name=$1
    local check_func=$2
    local required=$3
    
    echo -n "检查: $name ... "
    
    if $check_func; then
        echo -e "${GREEN}✓ 通过${NC}"
        ((PASSED++))
        return 0
    else
        if [ "$required" = "required" ]; then
            echo -e "${RED}✗ 失败 (必需)${NC}"
            ((FAILED++))
            return 1
        else
            echo -e "${YELLOW}⚠ 警告 (可选)${NC}"
            ((WARNING++))
            return 0
        fi
    fi
}

# 1. 检查 Docker
check_docker() {
    command -v docker &> /dev/null && docker --version &> /dev/null
}

# 2. 检查 Docker Compose
check_docker_compose() {
    (command -v docker-compose &> /dev/null && docker-compose --version &> /dev/null) || \
    (docker compose version &> /dev/null)
}

# 3. 检查 Docker 服务状态
check_docker_service() {
    systemctl is-active --quiet docker 2>/dev/null || \
    service docker status &> /dev/null || \
    docker ps &> /dev/null
}

# 4. 检查 Dockerfile.backend
check_dockerfile_backend() {
    [ -f "Dockerfile.backend" ]
}

# 5. 检查 Dockerfile.frontend
check_dockerfile_frontend() {
    [ -f "Dockerfile.frontend" ]
}

# 6. 检查 docker-compose.yml
check_docker_compose_yml() {
    [ -f "docker-compose.yml" ]
}

# 7. 检查 nginx.conf
check_nginx_conf() {
    [ -f "nginx.conf" ]
}

# 8. 检查 backend 目录
check_backend_dir() {
    [ -d "backend" ] && [ -f "backend/package.json" ]
}

# 9. 检查 frontend 目录
check_frontend_dir() {
    [ -d "frontend" ] && [ -f "frontend/package.json" ]
}

# 10. 检查 .env 文件（可选）
check_env_file() {
    [ -f ".env" ]
}

# 11. 检查 backend/data 目录
check_backend_data_dir() {
    [ -d "backend/data" ] || mkdir -p backend/data 2>/dev/null
}

# 12. 检查端口是否被占用
check_ports() {
    ! (netstat -tuln 2>/dev/null | grep -q ":3000 ") && \
    ! (netstat -tuln 2>/dev/null | grep -q ":80 ")
}

# 13. 检查磁盘空间（至少需要 1GB）
check_disk_space() {
    available=$(df -BG . 2>/dev/null | tail -1 | awk '{print $4}' | sed 's/G//')
    [ -z "$available" ] || [ "$available" -ge 1 ]
}

# 14. 检查用户权限（Docker 组或 root）
check_docker_permissions() {
    groups | grep -q docker 2>/dev/null || [ "$EUID" -eq 0 ] || \
    docker ps &> /dev/null
}

echo "📦 系统工具检查"
echo "----------------------------------------"
check_item "Docker 安装" check_docker required
check_item "Docker Compose 安装" check_docker_compose required
check_item "Docker 服务运行" check_docker_service required
check_item "Docker 权限" check_docker_permissions required
echo ""

echo "📁 项目文件检查"
echo "----------------------------------------"
check_item "Dockerfile.backend" check_dockerfile_backend required
check_item "Dockerfile.frontend" check_dockerfile_frontend required
check_item "docker-compose.yml" check_docker_compose_yml required
check_item "nginx.conf" check_nginx_conf required
check_item "backend 目录" check_backend_dir required
check_item "frontend 目录" check_frontend_dir required
check_item "backend/data 目录" check_backend_data_dir required
check_item ".env 文件" check_env_file optional
echo ""

echo "🔧 系统资源检查"
echo "----------------------------------------"
check_item "端口 3000 和 80 可用" check_ports optional
check_item "磁盘空间充足 (≥1GB)" check_disk_space optional
echo ""

# 显示详细信息
echo "=========================================="
echo "📊 详细信息"
echo "=========================================="
echo ""

if command -v docker &> /dev/null; then
    echo "Docker 版本:"
    docker --version 2>/dev/null || echo "  无法获取版本信息"
    echo ""
fi

if command -v docker-compose &> /dev/null; then
    echo "Docker Compose 版本:"
    docker-compose --version 2>/dev/null || echo "  无法获取版本信息"
elif docker compose version &> /dev/null 2>&1; then
    echo "Docker Compose 版本 (插件):"
    docker compose version 2>/dev/null || echo "  无法获取版本信息"
    echo ""
fi

echo "当前目录: $(pwd)"
echo ""

if [ -f "docker-compose.yml" ]; then
    echo "docker-compose.yml 内容预览:"
    head -20 docker-compose.yml | sed 's/^/  /'
    echo ""
fi

if [ -f ".env" ]; then
    echo ".env 文件存在（已隐藏内容）"
else
    echo -e "${YELLOW}⚠ .env 文件不存在，部署时会自动创建${NC}"
fi
echo ""

# 检查 Docker 镜像
echo "已存在的 Docker 镜像:"
docker images 2>/dev/null | grep -E "taxfree|REPOSITORY" | head -5 | sed 's/^/  /' || echo "  无法检查（Docker 未运行或无权限）"
echo ""

# 检查运行中的容器
echo "运行中的容器:"
docker ps 2>/dev/null | head -5 | sed 's/^/  /' || echo "  无法检查（Docker 未运行或无权限）"
echo ""

# 总结
echo "=========================================="
echo "📋 检查总结"
echo "=========================================="
echo -e "${GREEN}✓ 通过: $PASSED${NC}"
echo -e "${RED}✗ 失败: $FAILED${NC}"
echo -e "${YELLOW}⚠ 警告: $WARNING${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ 所有必需项检查通过！可以开始部署。${NC}"
    echo ""
    echo "部署命令:"
    echo "  docker-compose build    # 构建镜像"
    echo "  docker-compose up -d    # 启动服务"
    echo "  或使用: ./deploy.sh     # 使用部署脚本"
    exit 0
else
    echo -e "${RED}❌ 有必需项未通过检查，请先解决这些问题。${NC}"
    echo ""
    echo "常见问题解决方案:"
    echo "  1. 安装 Docker:"
    echo "     Ubuntu/Debian: sudo apt install docker.io docker-compose"
    echo "     CentOS/RHEL: sudo yum install docker docker-compose"
    echo ""
    echo "  2. 启动 Docker 服务:"
    echo "     sudo systemctl start docker"
    echo "     sudo systemctl enable docker"
    echo ""
    echo "  3. 添加用户到 docker 组（避免使用 sudo）:"
    echo "     sudo usermod -aG docker \$USER"
    echo "     然后重新登录"
    exit 1
fi

