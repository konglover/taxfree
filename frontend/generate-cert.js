import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import os from 'os';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 获取本机 IP 地址
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  const ips = [];
  
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // 跳过内部（即 127.0.0.1）和非 IPv4 地址
      if (iface.family === 'IPv4' && !iface.internal) {
        ips.push(iface.address);
      }
    }
  }
  
  return ips;
}

// 检查是否有 OpenSSL
function hasOpenSSL() {
  try {
    execSync('openssl version', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

// 使用 OpenSSL 生成证书
function generateWithOpenSSL(ips) {
  const keyPath = path.resolve(__dirname, 'localhost-key.pem');
  const certPath = path.resolve(__dirname, 'localhost.pem');
  const configPath = path.resolve(__dirname, 'localhost-cert.conf');
  
  // 生成配置文件
  let config = `[req]
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
IP.1 = 127.0.0.1
IP.2 = ::1
`;

  // 添加所有本地 IP
  ips.forEach((ip, index) => {
    config += `IP.${index + 3} = ${ip}\n`;
  });

  fs.writeFileSync(configPath, config);
  
  try {
    // 生成私钥
    console.log('🔑 生成私钥...');
    execSync(`openssl genrsa -out "${keyPath}" 2048`, { stdio: 'inherit' });
    
    // 生成证书
    console.log('📜 生成证书...');
    execSync(
      `openssl req -new -x509 -key "${keyPath}" -out "${certPath}" -days 365 -config "${configPath}" -extensions v3_req`,
      { stdio: 'inherit' }
    );
    
    // 清理配置文件
    fs.unlinkSync(configPath);
    
    console.log('✅ 证书生成成功！');
    console.log(`   私钥: ${keyPath}`);
    console.log(`   证书: ${certPath}`);
    return true;
  } catch (error) {
    console.error('❌ 生成证书失败:', error.message);
    // 清理可能生成的文件
    if (fs.existsSync(configPath)) fs.unlinkSync(configPath);
    if (fs.existsSync(keyPath)) fs.unlinkSync(keyPath);
    if (fs.existsSync(certPath)) fs.unlinkSync(certPath);
    return false;
  }
}

// 主函数
function main() {
  console.log('🔐 开始生成自签名证书...\n');
  
  // 检查是否已有证书
  const keyPath = path.resolve(__dirname, 'localhost-key.pem');
  const certPath = path.resolve(__dirname, 'localhost.pem');
  
  if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
    console.log('⚠️  检测到已存在的证书文件：');
    console.log(`   ${keyPath}`);
    console.log(`   ${certPath}`);
    console.log('\n如果要重新生成，请先删除这些文件。');
    return;
  }
  
  // 获取本地 IP
  const ips = getLocalIP();
  console.log('📡 检测到以下 IP 地址：');
  ips.forEach(ip => console.log(`   - ${ip}`));
  console.log('');
  
  // 检查 OpenSSL
  if (!hasOpenSSL()) {
    console.error('❌ 未检测到 OpenSSL！');
    console.log('\n请选择以下方式之一：');
    console.log('\n1. 安装 OpenSSL：');
    console.log('   Windows: 从 https://slproweb.com/products/Win32OpenSSL.html 下载安装');
    console.log('   或使用 Chocolatey: choco install openssl');
    console.log('\n2. 使用 PowerShell 脚本生成（见 generate-cert.ps1）');
    console.log('\n3. 使用 mkcert（推荐）：');
    console.log('   choco install mkcert');
    console.log('   mkcert -install');
    console.log(`   mkcert localhost 127.0.0.1 ::1 ${ips.join(' ')}`);
    return;
  }
  
  // 生成证书
  const success = generateWithOpenSSL(ips);
  
  if (success) {
    console.log('\n📝 下一步：');
    console.log('1. 编辑 frontend/vite.config.ts');
    console.log('2. 将 https: false 改为：');
    console.log('   https: {');
    console.log('     key: fs.readFileSync(path.resolve(__dirname, \'localhost-key.pem\')),');
    console.log('     cert: fs.readFileSync(path.resolve(__dirname, \'localhost.pem\')),');
    console.log('   },');
    console.log('3. 重启开发服务器');
    console.log('4. 使用 https://localhost:5173 或 https://你的IP:5173 访问');
  }
}

main();















