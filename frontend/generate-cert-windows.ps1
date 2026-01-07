# PowerShell 脚本：使用 Windows 内置工具生成自签名证书

Write-Host "🔐 开始生成自签名证书（Windows 方式）..." -ForegroundColor Cyan
Write-Host ""

# 获取本机 IP 地址
$ips = @("127.0.0.1", "localhost")
$networkAdapters = Get-NetIPAddress -AddressFamily IPv4 | Where-Object { 
    $_.IPAddress -ne "127.0.0.1" -and ($_.PrefixOrigin -eq "Dhcp" -or $_.PrefixOrigin -eq "Manual")
}
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

if ((Test-Path $keyPath) -or (Test-Path $certPath)) {
    Write-Host "⚠️  检测到已存在的证书文件" -ForegroundColor Yellow
    $overwrite = Read-Host "是否覆盖？(y/N)"
    if ($overwrite -ne "y" -and $overwrite -ne "Y") {
        Write-Host "已取消" -ForegroundColor Red
        exit
    }
    if (Test-Path $keyPath) { Remove-Item $keyPath -Force }
    if (Test-Path $certPath) { Remove-Item $certPath -Force }
}

# 创建 SAN（Subject Alternative Names）列表
$sanList = @()
$sanList += "DNS=localhost"
$sanList += "DNS=*.localhost"
foreach ($ip in $ips) {
    $sanList += "IP=$ip"
}
$sanString = $sanList -join ","

Write-Host "🔑 生成证书和私钥..." -ForegroundColor Yellow

try {
    # 使用 New-SelfSignedCertificate 生成证书
    $cert = New-SelfSignedCertificate `
        -DnsName "localhost" `
        -Subject "CN=localhost" `
        -FriendlyName "Localhost Development Certificate" `
        -KeyAlgorithm RSA `
        -KeyLength 2048 `
        -CertStoreLocation "Cert:\CurrentUser\My" `
        -NotAfter (Get-Date).AddYears(1) `
        -KeyExportPolicy Exportable `
        -KeyUsage DigitalSignature, KeyEncipherment `
        -TextExtension @("2.5.29.17={text}$sanString")
    
    $thumbprint = $cert.Thumbprint
    Write-Host "✅ 证书已生成（指纹: $thumbprint）" -ForegroundColor Green
    
    # 导出证书（PEM 格式）
    Write-Host "📜 导出证书..." -ForegroundColor Yellow
    $certBase64 = [Convert]::ToBase64String($cert.RawData)
    $certPem = "-----BEGIN CERTIFICATE-----`n"
    for ($i = 0; $i -lt $certBase64.Length; $i += 64) {
        $certPem += $certBase64.Substring($i, [Math]::Min(64, $certBase64.Length - $i)) + "`n"
    }
    $certPem += "-----END CERTIFICATE-----`n"
    Set-Content -Path $certPath -Value $certPem -NoNewline
    
    # 导出私钥（需要转换为 PEM 格式）
    Write-Host "🔐 导出私钥..." -ForegroundColor Yellow
    
    # 获取私钥
    $key = [System.Security.Cryptography.X509Certificates.RSACertificateExtensions]::GetRSAPrivateKey($cert)
    if ($key -is [System.Security.Cryptography.RSACng]) {
        $keyBytes = $key.Key.Export([System.Security.Cryptography.CngKeyBlobFormat]::Pkcs8PrivateBlob)
    } else {
        # 备用方法：导出为 PFX 然后转换
        $pfxPath = Join-Path $PSScriptRoot "temp-cert.pfx"
        $pfxPassword = ConvertTo-SecureString -String "temp123" -Force -AsPlainText
        Export-PfxCertificate -Cert $cert -FilePath $pfxPath -Password $pfxPassword | Out-Null
        
        # 使用 certutil 或 OpenSSL 转换（如果可用）
        # 如果没有 OpenSSL，我们使用另一种方法
        $keyBase64 = [Convert]::ToBase64String($keyBytes)
        $keyPem = "-----BEGIN PRIVATE KEY-----`n"
        for ($i = 0; $i -lt $keyBase64.Length; $i += 64) {
            $keyPem += $keyBase64.Substring($i, [Math]::Min(64, $keyBase64.Length - $i)) + "`n"
        }
        $keyPem += "-----END PRIVATE KEY-----`n"
        Set-Content -Path $keyPath -Value $keyPem -NoNewline
        
        Remove-Item $pfxPath -Force -ErrorAction SilentlyContinue
    }
    
    # 更简单的方法：使用 certutil 导出
    $tempPfx = Join-Path $env:TEMP "temp-$(New-Guid).pfx"
    $pfxPassword = ConvertTo-SecureString -String "temp123" -Force -AsPlainText
    Export-PfxCertificate -Cert $cert -FilePath $tempPfx -Password $pfxPassword | Out-Null
    
    # 尝试使用 OpenSSL 转换（如果可用）
    $hasOpenSSL = $false
    try {
        $null = Get-Command openssl -ErrorAction Stop
        $hasOpenSSL = $true
    } catch {
        $hasOpenSSL = $false
    }
    
    if ($hasOpenSSL) {
        # 使用 OpenSSL 转换 PFX 到 PEM
        & openssl pkcs12 -in $tempPfx -nocerts -nodes -passin pass:temp123 -out $keyPath 2>&1 | Out-Null
        Remove-Item $tempPfx -Force
    } else {
        # 如果没有 OpenSSL，提示用户
        Write-Host ""
        Write-Host "⚠️  无法自动导出私钥（需要 OpenSSL）" -ForegroundColor Yellow
        Write-Host "   证书已导出到: $certPath" -ForegroundColor Gray
        Write-Host ""
        Write-Host "请执行以下步骤导出私钥：" -ForegroundColor Yellow
        Write-Host "1. 安装 OpenSSL: choco install openssl" -ForegroundColor White
        Write-Host "2. 运行: openssl pkcs12 -in $tempPfx -nocerts -nodes -passin pass:temp123 -out $keyPath" -ForegroundColor White
        Write-Host "   或使用临时 PFX 文件: $tempPfx" -ForegroundColor Gray
        Write-Host ""
        Write-Host "或者使用 mkcert（更简单）：" -ForegroundColor Yellow
        Write-Host "   choco install mkcert" -ForegroundColor White
        Write-Host "   mkcert -install" -ForegroundColor White
        $ipList = $ips -join " "
        Write-Host "   mkcert localhost $ipList" -ForegroundColor White
    }
    
    # 从证书存储中删除临时证书
    Remove-Item "Cert:\CurrentUser\My\$thumbprint" -Force
    
    Write-Host ""
    Write-Host "✅ 证书生成完成！" -ForegroundColor Green
    Write-Host "   证书: $certPath" -ForegroundColor Gray
    if (Test-Path $keyPath) {
        Write-Host "   私钥: $keyPath" -ForegroundColor Gray
    }
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
    exit 1
}















