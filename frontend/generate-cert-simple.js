import selfsigned from 'selfsigned';
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
  
  // 准备 SAN（Subject Alternative Names）
  const attrs = [{ name: 'commonName', value: 'localhost' }];
  
  // 构建 SAN 扩展
  const altNames = [
    { type: 'dns', value: 'localhost' },
    { type: 'dns', value: '*.localhost' },
    { type: 'ip', value: '127.0.0.1' },
    { type: 'ip', value: '::1' },
    ...ips.map(ip => ({ type: 'ip', value: ip })),
  ];
  
  const options = {
    keySize: 2048,
    days: 365,
    algorithm: 'sha256',
    extensions: [
      {
        name: 'basicConstraints',
        cA: false,
      },
      {
        name: 'keyUsage',
        keyCertSign: false,
        digitalSignature: true,
        nonRepudiation: true,
        keyEncipherment: true,
        dataEncipherment: true,
      },
      {
        name: 'subjectAltName',
        altNames: altNames,
      },
    ],
  };
  
  try {
    console.log('🔑 生成证书和私钥...');
    const pems = selfsigned.generate(attrs, options);
    
    // 保存私钥
    fs.writeFileSync(keyPath, pems.private);
    console.log(`✅ 私钥已保存: ${keyPath}`);
    
    // 保存证书
    fs.writeFileSync(certPath, pems.cert);
    console.log(`✅ 证书已保存: ${certPath}`);
    
    console.log('\n✅ 证书生成成功！\n');
    console.log('📝 下一步：');
    console.log('1. 编辑 frontend/vite.config.ts');
    console.log('2. 将 https: false 改为：');
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
    process.exit(1);
  }
}

main();

