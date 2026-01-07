# PowerShell 脚本：生成自签名证书（Windows）

Write-Host "🔐 开始生成自签名证书..." -ForegroundColor Cyan
Write-Host ""

# 获取本机 IP 地址
$ips = @("127.0.0.1", "::1", "localhost")
$networkAdapters = Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -ne "127.0.0.1" -and $_.PrefixOrigin -eq "Dhcp" -or $_.PrefixOrigin -eq "Manual" }
foreach ($adapter in $networkAdapters) {
    if ($adapter.IPAddress) {
        $ips += $adapter.IPAddress
    }
}

Write-Host "📡 检测到以下 IP 地址：" -ForegroundColor Yellow
foreach ($ip in $ips) {
    Write-Host "   - $ip"
}
Write-Host ""

# 检查是否已有证书
$keyPath = Join-Path $PSScriptRoot "localhost-key.pem"
$certPath = Join-Path $PSScriptRoot "localhost.pem"

if (Test-Path $keyPath -PathType Leaf) {
    Write-Host "⚠️  检测到已存在的私钥文件：$keyPath" -ForegroundColor Yellow
    $overwrite = Read-Host "是否覆盖？(y/N)"
    if ($overwrite -ne "y" -and $overwrite -ne "Y") {
        Write-Host "已取消" -ForegroundColor Red
        exit
    }
    Remove-Item $keyPath -Force
}

if (Test-Path $certPath -PathType Leaf) {
    Remove-Item $certPath -Force
}

# 检查 OpenSSL
$opensslPath = "openssl"
try {
    $null = Get-Command openssl -ErrorAction Stop
} catch {
    Write-Host "❌ 未找到 OpenSSL！" -ForegroundColor Red
    Write-Host ""
    Write-Host "请安装 OpenSSL：" -ForegroundColor Yellow
    Write-Host "1. 使用 Chocolatey: choco install openssl" -ForegroundColor White
    Write-Host "2. 或从 https://slproweb.com/products/Win32OpenSSL.html 下载安装" -ForegroundColor White
    Write-Host ""
    Write-Host "或者使用 mkcert（推荐）：" -ForegroundColor Yellow
    Write-Host "   choco install mkcert" -ForegroundColor White
    Write-Host "   mkcert -install" -ForegroundColor White
    $ipList = $ips -join " "
    Write-Host "   mkcert localhost $ipList" -ForegroundColor White
    exit 1
}

# 创建临时配置文件
$configPath = Join-Path $PSScriptRoot "localhost-cert.conf"
$configContent = @"
[req]
default_bits = 2048
prompt = no
default_md = sha256
distinguished_name = dn
x509_extensions = v3_req

[dn]
CN = localhost

[v3_req]
basicConstraints = CA:FALSE
keyUsage = nonRepudiation, digitalSignature, keyEncipherment
subjectAltName = @alt_names

[alt_names]
DNS.1 = localhost
DNS.2 = *.localhost
"@

$ipIndex = 3
foreach ($ip in $ips) {
    $configContent += "IP.$ipIndex = $ip`n"
    $ipIndex++
}

Set-Content -Path $configPath -Value $configContent

try {
    # 生成私钥
    Write-Host "🔑 生成私钥..." -ForegroundColor Yellow
    & $opensslPath genrsa -out $keyPath 2048
    if ($LASTEXITCODE -ne 0) {
        throw "生成私钥失败"
    }
    
    # 生成证书
    Write-Host "📜 生成证书..." -ForegroundColor Yellow
    & $opensslPath req -new -x509 -key $keyPath -out $certPath -days 365 -config $configPath -extensions v3_req
    if ($LASTEXITCODE -ne 0) {
        throw "生成证书失败"
    }
    
    # 清理配置文件
    Remove-Item $configPath -Force
    
    Write-Host ""
    Write-Host "✅ 证书生成成功！" -ForegroundColor Green
    Write-Host "   私钥: $keyPath" -ForegroundColor Gray
    Write-Host "   证书: $certPath" -ForegroundColor Gray
    Write-Host ""
    Write-Host "📝 下一步：" -ForegroundColor Cyan
    Write-Host "1. 编辑 frontend/vite.config.ts" -ForegroundColor White
    Write-Host "2. 将 https: false 改为：" -ForegroundColor White
    Write-Host "   https: {" -ForegroundColor Gray
    Write-Host "     key: fs.readFileSync(path.resolve(__dirname, 'localhost-key.pem'))," -ForegroundColor Gray
    Write-Host "     cert: fs.readFileSync(path.resolve(__dirname, 'localhost.pem'))," -ForegroundColor Gray
    Write-Host "   }," -ForegroundColor Gray
    Write-Host "3. 重启开发服务器" -ForegroundColor White
    Write-Host "4. 使用 https://localhost:5173 或 https://你的IP:5173 访问" -ForegroundColor White
    
} catch {
    Write-Host ""
    Write-Host "❌ 生成证书失败: $_" -ForegroundColor Red
    # 清理可能生成的文件
    if (Test-Path $configPath) { Remove-Item $configPath -Force }
    if (Test-Path $keyPath) { Remove-Item $keyPath -Force }
    if (Test-Path $certPath) { Remove-Item $certPath -Force }
    exit 1
}















