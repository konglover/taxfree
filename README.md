# TaxFree App - 前后端分离项目

这是一个基于 Vue 3 + JavaScript 和 Node.js + JavaScript + MySQL 的前后端分离项目。

## 技术栈

### 前端
- **Vue 3** - 使用 Composition API
- **JavaScript (ES6+)** - 现代 JavaScript 语法
- **Vite** - 快速构建工具
- **Vue Router** - 路由管理
- **Pinia** - 状态管理
- **Axios** - HTTP 客户端

### 后端
- **Node.js** - 运行时环境
- **Express** - Web 框架
- **JavaScript (ES6+)** - 现代 JavaScript 语法
- **MySQL** - 数据库
- **mysql2** - MySQL 客户端

## 项目结构

```
taxfree-app/
├── backend/          # 后端项目
│   ├── src/
│   │   ├── config/   # 配置文件
│   │   ├── controllers/  # 控制器
│   │   ├── routes/   # 路由
│   │   └── index.js  # 入口文件
│   └── package.json
├── frontend/         # 前端项目
│   ├── src/
│   │   ├── views/    # 页面组件
│   │   ├── services/ # API 服务
│   │   ├── router/   # 路由配置
│   │   ├── App.vue
│   │   └── main.js
│   ├── package.json
│   └── vite.config.ts
└── README.md
```

## 环境要求

- **Node.js**: 18.11.0 或更高版本（后端使用 `--watch` 功能需要此版本）
- **MySQL**: 5.7 或更高版本
- **npm**: 9.0 或更高版本

## 快速开始

### 1. 安装依赖

#### 后端
```bash
cd backend
npm install
```

#### 前端
```bash
cd frontend
npm install
```

### 2. 配置数据库

1. 创建 MySQL 数据库：
```sql
CREATE DATABASE taxfree_db;
```

2. 创建用户表：
```sql
USE taxfree_db;

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

3. 复制后端环境变量文件：
```bash
cd backend
cp .env.example .env
```

4. 编辑 `.env` 文件，配置数据库连接信息：
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=taxfree_db
PORT=3000
```

### 3. 启动项目

#### 启动后端
```bash
cd backend
npm run dev
```
后端服务将在 http://localhost:3000 运行

#### 启动前端
```bash
cd frontend
npm run dev
```
前端应用将在 http://localhost:5173 运行

## 开发命令

### 后端
- `npm run dev` - 开发模式（热重载，使用 Node.js --watch）
- `npm start` - 运行生产版本

### 前端
- `npm run dev` - 开发模式
- `npm run build` - 构建生产版本
- `npm run preview` - 预览生产构建

## API 接口

### 用户管理
- `GET /api/users` - 获取所有用户
- `GET /api/users/:id` - 获取单个用户
- `POST /api/users` - 创建用户
- `PUT /api/users/:id` - 更新用户
- `DELETE /api/users/:id` - 删除用户

## 功能特性

- ✅ Vue 3 Composition API
- ✅ ES6+ JavaScript 语法
- ✅ RESTful API
- ✅ MySQL 数据库连接
- ✅ 用户 CRUD 操作
- ✅ 响应式设计
- ✅ 现代化 UI
- ✅ 二维码/条形码扫描功能

## 移动端摄像头访问配置

### 问题说明

移动端浏览器（包括 Chrome）访问摄像头需要 **HTTPS 协议**，或者通过 **localhost** 访问。如果通过 IP 地址（如 `192.168.x.x`）访问，浏览器会阻止摄像头访问。

### 解决方案

#### 方案 1：使用 HTTPS（推荐）

1. **生成自签名证书**（仅用于开发环境）：
```bash
# 使用 mkcert（推荐，需要先安装 mkcert）
# Windows: choco install mkcert
# macOS: brew install mkcert
# Linux: 参考 https://github.com/FiloSottile/mkcert

# 安装本地 CA
mkcert -install

# 生成证书（在 frontend 目录下）
cd frontend
mkcert localhost 127.0.0.1 ::1 192.168.1.100  # 替换为你的实际 IP

# 会生成 localhost-key.pem 和 localhost.pem
```

2. **配置 Vite 使用 HTTPS**：
编辑 `frontend/vite.config.ts`，取消注释 HTTPS 配置：
```typescript
https: {
  key: fs.readFileSync(path.resolve(__dirname, 'localhost-key.pem')),
  cert: fs.readFileSync(path.resolve(__dirname, 'localhost.pem')),
},
```

3. **重启开发服务器**，使用 `https://localhost:5173` 或 `https://你的IP:5173` 访问

#### 方案 2：使用 localhost（简单但不方便）

1. 在手机上安装一个代理工具（如 ngrok、localtunnel）
2. 将本地服务映射到 localhost 域名
3. 通过映射的域名访问

#### 方案 3：使用电脑浏览器测试

在电脑浏览器中通过 IP 地址访问（如 `http://192.168.1.100:5173`），电脑浏览器对 HTTP 协议下的摄像头访问限制较宽松。

### 注意事项

- 自签名证书在首次访问时浏览器会显示安全警告，需要手动点击"继续访问"
- 生产环境必须使用有效的 SSL 证书
- iOS Safari 对摄像头权限要求更严格，建议使用 HTTPS

## 许可证

ISC

