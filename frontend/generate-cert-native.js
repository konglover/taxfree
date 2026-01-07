import crypto from 'crypto';
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
      if (iface.family === 'IPv4' && !iface.internal) {
        ips.push(iface.address);
      }
    }
  }
  
  return ips;
}

// 生成自签名证书
function generateCertificate() {
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
  
  try {
    console.log('🔑 生成私钥和证书...');
    
    // 生成私钥
    const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem'
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem'
      }
    });
    
    // 准备证书属性
    const attrs = [
      { name: 'countryName', value: 'CN' },
      { name: 'organizationName', value: 'Development' },
      { name: 'commonName', value: 'localhost' }
    ];
    
    // 准备 SAN（Subject Alternative Names）
    const san = [
      'DNS:localhost',
      'DNS:*.localhost',
      'IP:127.0.0.1',
      'IP:::1',
      ...ips.map(ip => `IP:${ip}`)
    ];
    
    // 创建证书
    const cert = crypto.createCertificate();
    cert.setSubject(attrs);
    cert.setIssuer(attrs);
    cert.setPublicKey(publicKey);
    cert.setSerialNumber(crypto.randomBytes(8).toString('hex'));
    cert.setValidity(new Date(), new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)); // 1年有效期
    
    // 添加扩展
    cert.setExtensions([
      {
        name: 'basicConstraints',
        cA: false
      },
      {
        name: 'keyUsage',
        keyCertSign: false,
        digitalSignature: true,
        keyEncipherment: true
      },
      {
        name: 'subjectAltName',
        altNames: san
      }
    ]);
    
    // 签名证书
    const certPem = cert.sign(privateKey, 'sha256');
    
    // 保存文件
    fs.writeFileSync(keyPath, privateKey);
    fs.writeFileSync(certPath, certPem);
    
    console.log(`✅ 私钥已保存: ${keyPath}`);
    console.log(`✅ 证书已保存: ${certPath}`);
    console.log('\n✅ 证书生成成功！\n');
    console.log('📝 下一步：');
    console.log('1. 编辑 frontend/vite.config.ts');
    console.log('2. 将 https: true 改为：');
    console.log('   https: {');
    console.log('     key: fs.readFileSync(path.resolve(__dirname, \'localhost-key.pem\')),');
    console.log('     cert: fs.readFileSync(path.resolve(__dirname, \'localhost.pem\')),');
    console.log('   },');
    console.log('3. 重启开发服务器');
    console.log('4. 使用 https://localhost:5173 或 https://你的IP:5173 访问');
    console.log('\n⚠️  注意：首次访问时浏览器会显示安全警告，');
    console.log('   点击"高级" → "继续访问"即可（这是自签名证书的正常现象）。');
    
  } catch (error) {
    console.error('❌ 生成证书失败:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

generateCertificate();















