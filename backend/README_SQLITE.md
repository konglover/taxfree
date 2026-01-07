# 使用 SQLite 数据库（无需安装 MySQL）

## ✅ 优势

- **无需安装服务**：SQLite 是文件数据库，不需要单独安装 MySQL 服务
- **零配置**：安装 npm 包后即可使用
- **自动创建**：数据库文件会在首次运行时自动创建
- **适合开发**：非常适合开发和测试环境

## 📦 安装步骤

### 1. 安装依赖

```bash
cd backend
npm install
```

这会安装 `better-sqlite3` 包（替代 mysql2）。

### 2. 运行项目

```bash
npm run dev
```

数据库文件会自动创建在 `backend/data/taxfree.db`

## 📁 数据库文件位置

数据库文件保存在：`backend/data/taxfree.db`

这个文件会在首次运行时自动创建，包含用户表。

## 🔄 如果需要重置数据库

删除 `backend/data/taxfree.db` 文件，重启服务器即可。

## 📝 注意事项

- SQLite 数据库文件会保存在 `backend/data/` 目录
- 这个目录已经在 `.gitignore` 中，不会被提交到 Git
- 如果需要备份，直接复制 `.db` 文件即可

## 🆚 SQLite vs MySQL

| 特性 | SQLite | MySQL |
|------|--------|-------|
| 安装 | 只需 npm 包 | 需要单独安装服务 |
| 配置 | 零配置 | 需要配置连接信息 |
| 适用场景 | 开发、小型项目 | 生产环境、大型项目 |
| 性能 | 适合中小型数据 | 适合大型数据和高并发 |

对于学习和开发，SQLite 完全够用！

















