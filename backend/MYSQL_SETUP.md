# MySQL 安装指南 - Windows

## 方案一：使用 XAMPP（推荐，最简单）

### 1. 下载 XAMPP
访问官网：https://www.apachefriends.org/zh_cn/index.html
下载 Windows 版本的 XAMPP（选择最新版本）

### 2. 安装 XAMPP
- 运行下载的安装程序
- 安装路径建议使用默认：`C:\xampp`
- 安装时选择 MySQL 组件（默认已选中）

### 3. 启动 MySQL
- 打开 XAMPP Control Panel
- 找到 MySQL，点击 "Start" 按钮
- 看到绿色的 "Running" 表示启动成功

### 4. 设置 MySQL root 密码（可选，但推荐）
打开 XAMPP 控制面板，点击 MySQL 旁边的 "Admin" 按钮，会打开 phpMyAdmin。

或者使用命令行：
```bash
# 打开 XAMPP 的 MySQL 命令行
C:\xampp\mysql\bin\mysql.exe -u root
```

在 MySQL 命令行中设置密码：
```sql
ALTER USER 'root'@'localhost' IDENTIFIED BY '你的密码';
FLUSH PRIVILEGES;
```

### 5. 创建数据库
在 XAMPP 控制面板点击 MySQL 的 "Admin" 按钮，打开 phpMyAdmin，然后：
- 点击左侧的 "新建" 或 "New"
- 数据库名称输入：`taxfree_db`
- 排序规则选择：`utf8mb4_unicode_ci`
- 点击"创建"

或者使用 SQL：
```sql
CREATE DATABASE taxfree_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 6. 配置项目
在 `backend/.env` 文件中：
```env
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=你的密码（如果设置了的话，没设置就留空）
DB_NAME=taxfree_db
PORT=3000
```

---

## 方案二：安装 MySQL 官方版本

### 1. 下载 MySQL
访问：https://dev.mysql.com/downloads/installer/
选择 "MySQL Installer for Windows"

### 2. 安装 MySQL
- 运行安装程序
- 选择 "Developer Default" 或 "Server only"
- 按照向导完成安装
- 设置 root 密码（记住这个密码！）

### 3. 启动 MySQL 服务
安装完成后，MySQL 服务通常会自动启动。

检查服务状态：
- 按 `Win + R`，输入 `services.msc`
- 找到 "MySQL80" 或 "MySQL" 服务
- 如果未运行，右键点击选择"启动"

### 4. 创建数据库
打开 MySQL Command Line Client 或 MySQL Workbench，执行：
```sql
CREATE DATABASE taxfree_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE taxfree_db;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### 5. 配置项目
在 `backend/.env` 文件中：
```env
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=你安装时设置的密码
DB_NAME=taxfree_db
PORT=3000
```

---

## 方案三：使用 Docker（适合熟悉 Docker 的用户）

### 1. 安装 Docker Desktop
下载：https://www.docker.com/products/docker-desktop

### 2. 运行 MySQL 容器
```bash
docker run --name mysql-taxfree -e MYSQL_ROOT_PASSWORD=yourpassword -e MYSQL_DATABASE=taxfree_db -p 3306:3306 -d mysql:8.0
```

### 3. 配置项目
在 `backend/.env` 文件中：
```env
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=yourpassword
DB_NAME=taxfree_db
PORT=3000
```

---

## 验证安装

安装完成后，测试连接：

### 使用命令行（XAMPP）
```bash
C:\xampp\mysql\bin\mysql.exe -u root -p
```

### 使用命令行（MySQL 官方版）
```bash
mysql -u root -p
```

### 使用 phpMyAdmin（XAMPP）
在浏览器打开：http://localhost/phpmyadmin

如果能够成功连接，说明 MySQL 安装成功！

---

## 常见问题

### Q: XAMPP 的 MySQL 启动失败？
A: 可能是端口被占用，检查是否有其他 MySQL 服务在运行。

### Q: 忘记 root 密码？
A: 
1. 停止 MySQL 服务
2. 使用 `--skip-grant-tables` 启动 MySQL
3. 重置密码
4. 重启服务

### Q: 端口 3306 被占用？
A: 可以修改 MySQL 端口，或关闭占用端口的程序。

















