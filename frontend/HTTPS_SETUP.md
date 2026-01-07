# 移动端摄像头 HTTPS 配置指南

## 为什么需要 HTTPS？

移动端浏览器（Chrome、Safari 等）出于安全考虑，只允许在以下情况下访问摄像头：
- ✅ HTTPS 协议
- ✅ localhost 或 127.0.0.1
- ❌ HTTP + IP 地址（会被阻止）

## 快速配置 HTTPS（开发环境）

### 方法 1：使用 mkcert（推荐，最简单）

1. **安装 mkcert**：
   - Windows: `choco install mkcert` 或从 [GitHub](https://github.com/FiloSottile/mkcert/releases) 下载
   - macOS: `brew install mkcert`
   - Linux: 参考 [mkcert 文档](https://github.com/FiloSottile/mkcert)

2. **安装本地 CA**：
   ```bash
   mkcert -install
   ```

3. **生成证书**（在 frontend 目录下）：
   ```bash
   cd frontend
   # 替换 192.168.1.100 为你的实际 IP 地址
   mkcert localhost 127.0.0.1 ::1 192.168.1.100
   ```
   这会生成两个文件：
   - `localhost-key.pem`（私钥）
   - `localhost.pem`（证书）

4. **配置 Vite**：
   编辑 `vite.config.ts`，将：
   ```typescript
   https: false,
   ```
   改为：
   ```typescript
   https: {
     key: fs.readFileSync(path.resolve(__dirname, 'localhost-key.pem')),
     cert: fs.readFileSync(path.resolve(__dirname, 'localhost.pem')),
   },
   ```

5. **重启开发服务器**：
   ```bash
   npm run dev
   ```

6. **访问应用**：
   - 电脑：`https://localhost:5173`
   - 手机：`https://你的IP:5173`（如 `https://192.168.1.100:5173`）

7. **首次访问时**：
   - 浏览器会显示安全警告（因为是自签名证书）
   - 点击"高级" → "继续访问"（或类似选项）

### 方法 2：使用 OpenSSL（无需安装额外工具）

1. **生成证书**（在 frontend 目录下）：
   ```bash
   cd frontend
   
   # 生成私钥
   openssl genrsa -out localhost-key.pem 2048
   
   # 生成证书签名请求配置
   cat > localhost.conf <<EOF
   [req]
   default_bits = 2048
   prompt = no
   default_md = sha256
   distinguished_name = dn
   [dn]
   CN = localhost
   [v3_ext]
   authorityKeyIdentifier=keyid,issuer
   basicConstraints=CA:FALSE
   keyUsage = keyEncipherment, dataEncipherment
   subjectAltName = @alt_names
   [alt_names]
   DNS.1 = localhost
   IP.1 = 127.0.0.1
   IP.2 = ::1
   IP.3 = 192.168.1.100
   EOF
   # 注意：将 IP.3 替换为你的实际 IP 地址
   
   # 生成证书
   openssl req -new -x509 -key localhost-key.pem -out localhost.pem -days 365 -config localhost.conf -extensions v3_ext
   ```

2. **配置 Vite**（同方法 1 的步骤 4）

3. **重启并访问**（同方法 1 的步骤 5-7）

### 方法 3：使用 ngrok（临时方案）

1. **安装 ngrok**：
   - 从 [ngrok.com](https://ngrok.com/) 下载并注册账号

2. **启动本地服务**：
   ```bash
   cd frontend
   npm run dev
   ```

3. **创建 HTTPS 隧道**：
   ```bash
   ngrok http 5173
   ```

4. **使用 ngrok 提供的 HTTPS URL** 在手机上访问

## 验证配置

配置成功后，在手机上打开应用，点击"开始扫描"：
- ✅ 如果显示摄像头画面 → 配置成功
- ❌ 如果显示"移动端浏览器需要 HTTPS 协议" → 检查配置

## 常见问题

### Q: 证书生成后仍然无法访问？
A: 确保：
1. 证书文件在 `frontend` 目录下
2. `vite.config.ts` 中的路径正确
3. 重启了开发服务器
4. 使用 `https://` 而不是 `http://` 访问

### Q: 浏览器显示"不安全连接"？
A: 这是正常的，因为使用的是自签名证书。点击"高级" → "继续访问"即可。

### Q: 手机无法访问电脑的 HTTPS 服务？
A: 检查：
1. 电脑和手机在同一网络
2. 防火墙允许 5173 端口
3. 证书中包含了你的 IP 地址

### Q: 生产环境怎么办？
A: 生产环境必须使用有效的 SSL 证书（如 Let's Encrypt），不能使用自签名证书。

## 其他方案

如果不想配置 HTTPS，可以：
1. 在电脑浏览器中测试（电脑浏览器对 HTTP 限制较宽松）
2. 使用 USB 调试 + Chrome DevTools 的远程调试功能
3. 部署到支持 HTTPS 的服务器（如 Vercel、Netlify）















